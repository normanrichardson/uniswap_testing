const { expect } = require('chai');
const { ethers } = require('hardhat');

// Start test block
describe('UniswapV3Factory', function () {

    before( async () => {

        const routerAddress  = '0xE592427A0AEce92De3Edee1F18E0157C05861564';
        const posMangAddress = '0xC36442b4a4522E871399CD717aBDD847Ab11FE88';
        const factoryAddress = '0x1F98431c8aD98523631AE4a59f267346ea31F984';
        const wethAddress    = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
        const daiAddress     = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
        const usdcAddress    = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

        this.factory = await ethers.getContractAt('IUniswapV3Factory', factoryAddress);
        const router = await ethers.getContractAt('ISwapRouter', routerAddress);
        const posMang = await ethers.getContractAt('INonfungiblePositionManager', posMangAddress);
        const Swapper = await ethers.getContractFactory('Swapper');
        const Liquidity = await ethers.getContractFactory('LiquidityExamples');

        this.swapperDia = await Swapper.deploy(router.address, wethAddress, daiAddress, 3000);
        this.swapperUsdc = await Swapper.deploy(router.address, wethAddress, usdcAddress, 3000);
        this.swapperDiaUsdc = await Swapper.deploy(router.address, daiAddress, usdcAddress, 100);
        this.swapperUsdcDia = await Swapper.deploy(router.address, usdcAddress, daiAddress, 100);
        
        this.pmUsdcDai = await Liquidity.deploy(posMang.address, daiAddress, usdcAddress, 100);
        
        this.weth = await ethers.getContractAt('DepositableERC20', wethAddress);
        this.dia = await ethers.getContractAt('IERC20Extended', daiAddress);
        this.usdc = await ethers.getContractAt('IERC20Extended', usdcAddress);

        // get signers for testing
        const [signr1, signr2, signr3] = await ethers.getSigners();

        this.signr1 = signr1;
        this.signr2 = signr2;
        this.signr3 = signr3;
        this.daiAddress = daiAddress;
        this.usdcAddress = usdcAddress;
        this.posMang = posMang;

    });
    
    it('The pool exisits', async () => {
        const poolDiaUsdc = await this.factory.getPool(this.daiAddress, this.usdcAddress, 100);
        const swappe = await this.factory.getPool(this.daiAddress, this.usdcAddress, 100);
        
        // Returns the 0x address if the pool does not exist
        expect(poolDiaUsdc).to.not.be.properHex(0).to.not.hexEqual('0x');
    });
    
    it('Add Liquidity', async () => {
        const signr = this.signr3;
        const ethTransfer = ethers.BigNumber.from('1');
        const weiTransfer = ethers.constants.WeiPerEther.mul(ethTransfer);
        
        // Get Dia
        await expect(() => this.weth.connect(signr).deposit({value: weiTransfer}))
            .to.changeEtherBalance(signr, weiTransfer.mul(-1));
        
        const diaBefore = await this.dia.connect(signr).balanceOf(signr.address);

        await this.weth.connect(signr).approve(this.swapperDia.address, weiTransfer);
        await expect( () => this.swapperDia.connect(signr).swapExactInputSingle(weiTransfer))
            .to.changeTokenBalance(this.weth, signr, weiTransfer.mul(-1));
        
        const diaAfter = await this.dia.balanceOf(signr.address);
        const diaLiq = diaAfter.sub(diaBefore);

        expect(diaLiq).to.gt(0);
        
        // Get USDC
        await expect(() => this.weth.connect(signr).deposit({value: weiTransfer}))
            .to.changeEtherBalance(signr, weiTransfer.mul(-1));
               
        const usdcBefore = await this.usdc.balanceOf(signr.address);

        await this.weth.connect(signr).approve(this.swapperUsdc.address, weiTransfer);
        await expect( () => this.swapperUsdc.connect(signr).swapExactInputSingle(weiTransfer))
            .to.changeTokenBalance(this.weth, signr, weiTransfer.mul(-1));

        const usdcAfter = await this.usdc.balanceOf(signr.address);
        const usdcLiq = usdcAfter - usdcBefore;

        expect(usdcLiq).to.gt(0);

        // Add liquidity
        console.log(`${ await this.dia.symbol() } to add to pool: ${ethers.utils.formatUnits(diaLiq, await this.dia.decimals())}`);
        console.log(`${ await this.usdc.symbol() } to add to pool: ${ethers.utils.formatUnits(usdcLiq, await this.usdc.decimals())}`);
        
        await this.dia.connect(signr).approve(this.pmUsdcDai.address, diaLiq);
        await this.usdc.connect(signr).approve(this.pmUsdcDai.address, usdcLiq);
        
        //await expect(this.pmUsdcDai.connect(signr).mintNewPosition(diaLiq, usdcLiq))
        //    .to.emit(this.posMang, 'IncreaseLiquidity');

        const tx = await this.pmUsdcDai.connect(signr).mintNewPosition(diaLiq, usdcLiq);
        
        const rc = await tx.wait();
        const event = rc.events.find(event => event.event === 'IncLiquidity');
        const [tokenId, liquidity, amount0, amount1] = event.args;

        this.tokenId = tokenId;
    });

    it('Simulate trading', async () => {
        const signr = this.signr2;
        const ethTransfer = ethers.BigNumber.from('5000');
        const weiTransfer = ethers.constants.WeiPerEther.mul(ethTransfer);
        
        // Get Dia
        await this.weth.connect(signr).deposit({value: weiTransfer});

        let before = await this.dia.connect(signr).balanceOf(signr.address);

        await this.weth.connect(signr).approve(this.swapperDia.address, weiTransfer);
        await this.swapperDia.connect(signr).swapExactInputSingle(weiTransfer);

        let after = await this.dia.balanceOf(signr.address);
        let delta = after.sub(before);
        
        for (let i=0; i<100; i++) {
            let delta_i = delta;

            //1st trade forward:
            before = await this.usdc.connect(signr).balanceOf(signr.address);

            await this.dia.connect(signr).approve(this.swapperDiaUsdc.address, delta);
            await this.swapperDiaUsdc.connect(signr).swapExactInputSingle(delta);
            after = await this.usdc.connect(signr).balanceOf(signr.address);
            delta = after.sub(before);

            //2nd trade back:
            before = await this.dia.connect(signr).balanceOf(signr.address);
            await this.usdc.connect(signr).approve(this.swapperUsdcDia.address, delta);
            await this.swapperUsdcDia.connect(signr).swapExactInputSingle(delta);
            after =  await this.dia.connect(signr).balanceOf(signr.address);
            delta = after.sub(before);

            expect(delta_i.sub(delta)).to.gt(0);
        }
    });

    it('Recover pool fees', async () => {
        const signr = this.signr3;
        const beforeUsdc = await this.usdc.connect(signr).balanceOf(signr.address);
        const beforeDai = await this.dia.connect(signr).balanceOf(signr.address);

        const tx = await this.pmUsdcDai.connect(signr).collectAllFees(this.tokenId);

        const afterUsdc = await this.usdc.connect(signr).balanceOf(signr.address);
        const afterDai = await this.dia.connect(signr).balanceOf(signr.address);

        const feeGainsUsdc = afterUsdc.sub(beforeUsdc);
        const feeGainsDia  = afterDai.sub(beforeDai);

        expect(afterUsdc).to.gt(beforeUsdc);
        expect(afterDai).to.gt(beforeDai);

        console.log(`${ await this.dia.symbol() } fee gain: ${ethers.utils.formatUnits(feeGainsDia, await this.dia.decimals())}`);
        console.log(`${ await this.usdc.symbol() } fee gain: ${ethers.utils.formatUnits(feeGainsUsdc, await this.usdc.decimals())}`);
    });
});

const { expect } = require('chai');
const { ethers, network } = require('hardhat');

require('dotenv').config();

// Start test block
describe('UniswapLiquidityManager', function () {
    let 
        evmStateA, 
        signr2, 
        signr3, 
        factory, 
        posMang,
        swapperDia,
        swapperUsdc,
        swapperDiaUsdc,
        swapperUsdcDia,
        pmUsdcDai,
        weth,
        usdc,
        dia,
        tokenId;

    const 
        wethAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        daiAddress  = '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        usdcAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

    before( async () => {
        const routerAddress  = '0xE592427A0AEce92De3Edee1F18E0157C05861564';
        const posMangAddress = '0xC36442b4a4522E871399CD717aBDD847Ab11FE88';
        const factoryAddress = '0x1F98431c8aD98523631AE4a59f267346ea31F984';
        
        factory = await ethers.getContractAt('IUniswapV3Factory', factoryAddress);
        posMang = await ethers.getContractAt('INonfungiblePositionManager', posMangAddress);
        const router = await ethers.getContractAt('ISwapRouter', routerAddress);
        const Swapper = await ethers.getContractFactory('Swapper');
        const Liquidity = await ethers.getContractFactory('LiquidityExamples');

        swapperDia = await Swapper.deploy(router.address, wethAddress, daiAddress, 3000);
        swapperUsdc = await Swapper.deploy(router.address, wethAddress, usdcAddress, 3000);
        swapperDiaUsdc = await Swapper.deploy(router.address, daiAddress, usdcAddress, 100);
        swapperUsdcDia = await Swapper.deploy(router.address, usdcAddress, daiAddress, 100);
        
        pmUsdcDai = await Liquidity.deploy(posMang.address, daiAddress, usdcAddress, 100);
        
        weth = await ethers.getContractAt('DepositableERC20', wethAddress);
        dia = await ethers.getContractAt('IERC20Extended', daiAddress);
        usdc = await ethers.getContractAt('IERC20Extended', usdcAddress);

        // get signers for testing
        [ , signr2, signr3] = await ethers.getSigners();

    });
    
    it('The pool exisits', async () => {
        const poolDiaUsdc = await factory.getPool(daiAddress, usdcAddress, 100);
        const poolDia = await factory.getPool(daiAddress, wethAddress, 3000);
        const poolUsdc = await factory.getPool(wethAddress, usdcAddress, 3000);
        
        // Returns the 0x address if the pool does not exist
        expect(poolDiaUsdc).to.not.be.properHex(0).to.not.hexEqual('0x');
        expect(poolDia).to.not.be.properHex(0).to.not.hexEqual('0x');
        expect(poolUsdc).to.not.be.properHex(0).to.not.hexEqual('0x');
    });
    
    it('Add Liquidity', async () => {
        const signr = signr3;
        const ethTransfer = ethers.BigNumber.from('1');
        const weiTransfer = ethers.constants.WeiPerEther.mul(ethTransfer);
        
        // Get Dia
        await expect(() => weth.connect(signr).deposit({value: weiTransfer}))
            .to.changeEtherBalance(signr, weiTransfer.mul(-1));
        
        const diaBefore = await dia.connect(signr).balanceOf(signr.address);

        await weth.connect(signr).approve(swapperDia.address, weiTransfer);
        await expect( () => swapperDia.connect(signr).swapExactInputSingle(weiTransfer))
            .to.changeTokenBalance(weth, signr, weiTransfer.mul(-1));
        
        const diaAfter = await dia.balanceOf(signr.address);
        const diaLiq = diaAfter.sub(diaBefore);

        expect(diaLiq).to.gt(0);
        
        // Get USDC
        await expect(() => weth.connect(signr).deposit({value: weiTransfer}))
            .to.changeEtherBalance(signr, weiTransfer.mul(-1));
               
        const usdcBefore = await usdc.balanceOf(signr.address);

        await weth.connect(signr).approve(swapperUsdc.address, weiTransfer);
        await expect( () => swapperUsdc.connect(signr).swapExactInputSingle(weiTransfer))
            .to.changeTokenBalance(weth, signr, weiTransfer.mul(-1));

        const usdcAfter = await usdc.balanceOf(signr.address);
        const usdcLiq = usdcAfter - usdcBefore;

        expect(usdcLiq).to.gt(0);

        // Add liquidity
        console.log(`${ await dia.symbol() } to add to pool: ${ethers.utils.formatUnits(diaLiq, await dia.decimals())}`);
        console.log(`${ await usdc.symbol() } to add to pool: ${ethers.utils.formatUnits(usdcLiq, await usdc.decimals())}`);

        await dia.connect(signr).approve(pmUsdcDai.address, diaLiq);
        await usdc.connect(signr).approve(pmUsdcDai.address, usdcLiq);
        
        const tx = await pmUsdcDai.connect(signr).mintNewPosition(diaLiq, usdcLiq);
        
        // Get the NFT token id
        const rc = await tx.wait();
        const event = rc.events.find(event => event.event === 'IncLiquidity');

        let liquidity, amount0, amount1;

        [tokenId, liquidity, amount0, amount1] = event.args;

        expect(liquidity).to.gt(0);
        expect(amount0).to.gt(0);
        expect(amount1).to.gt(0);
        
        //Take a snapshot of the evm states for testing later
        evmStateA = await  network.provider.send('evm_snapshot');
    });

    it('Simulate trading', async () => {
        const signr = signr2;
        const ethTransfer = ethers.BigNumber.from('5000');
        const weiTransfer = ethers.constants.WeiPerEther.mul(ethTransfer);
        
        // Get Dia
        await weth.connect(signr).deposit({value: weiTransfer});

        let before = await dia.connect(signr).balanceOf(signr.address);

        await weth.connect(signr).approve(swapperDia.address, weiTransfer);
        await swapperDia.connect(signr).swapExactInputSingle(weiTransfer);

        let after = await dia.balanceOf(signr.address);
        let delta = after.sub(before);
        
        for (let i=0; i<10; i++) {
            let delta_i = delta;

            //1st trade forward:
            before = await usdc.connect(signr).balanceOf(signr.address);
            await dia.connect(signr).approve(swapperDiaUsdc.address, delta);
            await swapperDiaUsdc.connect(signr).swapExactInputSingle(delta);
            after = await usdc.connect(signr).balanceOf(signr.address);
            delta = after.sub(before);

            //2nd trade back:
            before = await dia.connect(signr).balanceOf(signr.address);
            await usdc.connect(signr).approve(swapperUsdcDia.address, delta);
            await swapperUsdcDia.connect(signr).swapExactInputSingle(delta);
            after =  await dia.connect(signr).balanceOf(signr.address);
            delta = after.sub(before);

            expect(delta_i.sub(delta)).to.gt(0);
        }
    });
        
    it('Recover pool fees', async () => {
        const signr = signr3;

        await expect(pmUsdcDai.connect(signr).collectAllFees(tokenId))
            .to.emit(posMang, 'Collect')
            .to.emit(dia, 'Transfer')
            .to.emit(usdc, 'Transfer');
    });

    describe('Change liquidity and NFT owner', ()=>{
        beforeEach( async () => {
            await network.provider.send('evm_revert', [evmStateA]);
            evmStateA = await network.provider.send('evm_snapshot');
        });

        it('Increase Liquidity', async () => {
            const signr = signr3;
            const ethTransfer = ethers.BigNumber.from('2');
            const weiTransfer = ethers.constants.WeiPerEther.mul(ethTransfer).div(10);

            // Get Dia
            await weth.connect(signr).deposit({value: weiTransfer});
            await weth.connect(signr).approve(swapperDia.address, weiTransfer);
            const diaBefore = await dia.connect(signr).balanceOf(signr.address);

            await swapperDia.connect(signr).swapExactInputSingle(weiTransfer);
            const diaAfter = await dia.connect(signr).balanceOf(signr.address);
            const diaLiq = diaAfter.sub(diaBefore);

            // Get USDC
            await weth.connect(signr).deposit({value: weiTransfer});
            await weth.connect(signr).approve(swapperUsdc.address, weiTransfer);
            const usdcBefore = await usdc.connect(signr).balanceOf(signr.address);

            await swapperUsdc.connect(signr).swapExactInputSingle(weiTransfer);
            const usdcAfter = await usdc.connect(signr).balanceOf(signr.address);
            const usdcLiq = usdcAfter.sub(usdcBefore);

            // Increase liquidity
            await dia.connect(signr).approve(pmUsdcDai.address, diaLiq);
            await usdc.connect(signr).approve(pmUsdcDai.address, usdcLiq);

            await expect( pmUsdcDai.connect(signr).increaseLiquidityCurrentRange(tokenId, diaLiq, usdcLiq))
                .to.emit(posMang, 'IncreaseLiquidity')
                .to.emit(dia, 'Transfer')
                .to.emit(usdc, 'Transfer');
        });
    
        it('Decrease Liquidity', async () => {
            const signr = signr3;
            const percent = 50;

            // Decrease liquidity
            await expect(pmUsdcDai.connect(signr).decreaseLiquidity(tokenId, percent))
                .to.emit(posMang, 'Collect')
                .to.emit(dia, 'Transfer')
                .to.emit(usdc, 'Transfer')
                .to.emit(posMang, 'DecreaseLiquidity');
        });
    
        it('Transfer the NFT position to owner', async () => {
            const signr = signr3;
            
            // Transfer the position
            await expect(pmUsdcDai.connect(signr).retrieveNFT(tokenId))
                .to.emit(posMang,'Transfer')
                .withArgs(pmUsdcDai.address, signr.address, tokenId);
        });
    }); 
});

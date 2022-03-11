const { expect } = require('chai');
const { ethers } = require('hardhat');

// Start test block
describe('UniswapV3Factory', function () {

    before( async () => {

        const routerAddress  = '0xE592427A0AEce92De3Edee1F18E0157C05861564';
        const posMangAddress = '0xC36442b4a4522E871399CD717aBDD847Ab11FE88';
        const factoryAddress = '0x1F98431c8aD98523631AE4a59f267346ea31F984';
        const wethAddress    = '0xc778417E063141139Fce010982780140Aa0cD5Ab';//main'0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';//rk'0xc778417E063141139Fce010982780140Aa0cD5Ab';
        const daiAddress     = '0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa';//main'0x6B175474E89094C44Da98b954EedeAC495271d0F';//rk'0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa';
        const wbtcAddress    = '0x577D296678535e4903D59A4C929B718e1D575e0A';//main'0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599';//rk'0x577D296678535e4903D59A4C929B718e1D575e0A';

        const router = await ethers.getContractAt('ISwapRouter', routerAddress);
        const posMang = await ethers.getContractAt('INonfungiblePositionManager', posMangAddress);
        const factory = await ethers.getContractAt('IUniswapV3Factory', factoryAddress);
        const Swapper = await ethers.getContractFactory('Swapper');
        const Liquidity = await ethers.getContractFactory('LiquidityExamples');

        console.log(`Pool exisits: ${await factory.getPool(daiAddress, wethAddress, 3000)}`);
        
        this.swapperDia = await Swapper.deploy(router.address, wethAddress, daiAddress);
        this.swapperWbtc = await Swapper.deploy(router.address, wethAddress, wbtcAddress);
        /*
        this.pmWbtcDai = await Liquidity.deploy(posMang.address, daiAddress, wbtcAddress);
        */
        this.pmWbtcDai = await Liquidity.deploy(posMang.address, daiAddress, wethAddress);
        this.weth = await ethers.getContractAt('DepositableERC20', wethAddress);
        this.dia = await ethers.getContractAt('IERC20', daiAddress);
        this.wbtc = await ethers.getContractAt('IERC20', wbtcAddress);

        // get signers for testing
        const [signr1, signr2, signr3] = await ethers.getSigners();

        this.signr1 = signr1;
        this.signr2 = signr2;
        this.signr3 = signr3;
    });

    it('Add Liquidity', async () => {
        const signr = this.signr3;

        console.log(`Signr: ${signr.address}`);
        const ethTransfer = 0.00000000000000001;
        const weiTransfer = ethTransfer*ethers.constants.WeiPerEther;
        
        // Get Dia
        await this.weth.connect(signr).deposit({value: weiTransfer});
        const diaBefore = await this.dia.connect(signr).balanceOf(signr.address);

        await this.weth.connect(signr).approve(this.swapperDia.address, weiTransfer);
        await this.swapperDia.connect(signr).swapExactInputSingle(weiTransfer);

        console.log("HIHI1")
        const diaAfter = await this.dia.balanceOf(signr.address);
        const diaLiq = diaAfter - diaBefore;

        expect(diaBefore).to.lt(diaAfter);
        console.log("HIHI2")
        // Get WBTC
        await this.weth.connect(signr).deposit({value: weiTransfer});
        /*
        const wbtcBefore = await this.wbtc.balanceOf(signr.address);

        await this.weth.connect(signr).approve(this.swapperWbtc.address, weiTransfer);
        await this.swapperWbtc.connect(signr).swapExactInputSingle(weiTransfer);

        console.log("HIHI1")
        const wbtcAfter = await this.wbtc.balanceOf(signr.address);
        const wbtcLiq = wbtcAfter - wbtcBefore;

        expect(wbtcBefore).to.lt(wbtcAfter);
        console.log("HIHI2")
        */
        // Add liquidity
        //console.log(diaLiq);
        //console.log(wbtcLiq);
        
        await this.dia.connect(signr).approve(this.pmWbtcDai.address, diaLiq);
        await this.weth.connect(signr).approve(this.pmWbtcDai.address, weiTransfer);
        /*
        await this.wbtc.connect(signr).approve(this.pmWbtcDai.address, wbtcLiq);
        */
        console.log(diaLiq);
        console.log(weiTransfer);
        await this.pmWbtcDai.connect(signr).mintNewPosition(1, 1);
        console.log("HIHI4");
        

        // Trade a bunch
        // See the change in Fees
    });


});

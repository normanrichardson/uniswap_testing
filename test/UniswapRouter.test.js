const { ethers } = require('hardhat');
const { expect } = require('chai');

describe('Swapping weth for dia', () => {
    let
        signr,
        swapperDia,
        weth,
        dia,
        router,
        poolAddress;

    before( async () => {
        const routerAddress = '0xE592427A0AEce92De3Edee1F18E0157C05861564';
        const wethAddress   = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
        const daiAddress    = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
        const factoryAddress = '0x1F98431c8aD98523631AE4a59f267346ea31F984';
        
        router = await ethers.getContractAt('ISwapRouter', routerAddress);
        const Swapper = await ethers.getContractFactory('Swapper');
        const factory = await ethers.getContractAt('IUniswapV3Factory', factoryAddress);
        
        swapperDia = await Swapper.deploy(router.address, wethAddress, daiAddress, 3000);
        poolAddress = await factory.getPool(wethAddress, daiAddress, 3000);
        weth = await ethers.getContractAt('DepositableERC20', wethAddress);
        dia = await ethers.getContractAt('IERC20', daiAddress);

        // get signers for testing
        [, , signr] = await ethers.getSigners();
    });

    it('Single exact input swap WETH for DIA', async () => {
        const ethTransfer = ethers.BigNumber.from('1');
        const weiTransfer = ethTransfer.mul(ethers.constants.WeiPerEther);
        const diaBefore = await dia.balanceOf(signr.address);

        await weth.connect(signr).deposit({value: weiTransfer});
        await weth.connect(signr).approve(swapperDia.address, weiTransfer);
        await expect(swapperDia.connect(signr).swapExactInputSingle(weiTransfer))
            .to.emit(weth, 'Transfer')
            .withArgs(signr.address, swapperDia.address, weiTransfer);
        
        const diaAfter = await dia.balanceOf(signr.address);
        
        expect(diaBefore).to.lt(diaAfter);
    });

    it('Single exact output swap WETH for DIA', async () => {
        const diaOut = ethers.BigNumber.from('1000');
        const ethMax = ethers.BigNumber.from('1');
        const weiMax = ethMax.mul(ethers.constants.WeiPerEther);

        await weth.connect(signr).deposit({value: weiMax});
        await weth.connect(signr).approve(swapperDia.address, weiMax);
        await expect(swapperDia.connect(signr).swapExactOutputSingle(diaOut,weiMax))
            .to.emit(dia, 'Transfer')
            .withArgs(poolAddress, signr.address, diaOut);
    });
});

const { ethers } = require('hardhat');
const { expect } = require('chai');

describe('Swapping weth for dia', () => {
    before( async () => {
        const routerAddress = '0xE592427A0AEce92De3Edee1F18E0157C05861564';
        const wethAddress = '0xc778417E063141139Fce010982780140Aa0cD5Ab';
        const daiAddress = '0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa';
        
        const router = await ethers.getContractAt('ISwapRouter', routerAddress);
        
        const Swapper = await ethers.getContractFactory('Swapper');
        
        this.swapperDia = await Swapper.deploy(router.address, wethAddress, daiAddress);
        this.weth = await ethers.getContractAt('DepositableERC20', wethAddress);
        this.dia = await ethers.getContractAt('IERC20', daiAddress);

        // get signers for testing
        const [signr1, signr2, signr3] = await ethers.getSigners();

        this.signr1 = signr1;
        this.signr2 = signr2;
        this.signr3 = signr3;
    });

    it('Single exact input swap WETH for DIA', async () => {
        const signr = this.signr3;
        const ethTransfer = 0.00000001;
        const weiTransfer = ethTransfer*ethers.constants.WeiPerEther;
        
        await this.weth.connect(signr).deposit({value: weiTransfer});

        const diaBefore = await this.dia.balanceOf(signr.address);

        await this.weth.connect(signr).approve(this.swapperDia.address, weiTransfer);
        await this.swapperDia.connect(signr).swapExactInputSingle(weiTransfer);

        const diaAfter = await this.dia.balanceOf(signr.address);

        expect(diaBefore).to.lt(diaAfter);
    });

    it('Single exact output swap WETH for DIA', async () => {
        const signr = this.signr3;
        const diaOut = 1;
        const ethMax = 0.00000001;
        const weiMax = ethMax*ethers.constants.WeiPerEther;
        const tx = await this.weth.connect(signr).deposit({value: weiMax});

        const diaBefore = await this.dia.balanceOf(signr.address);

        await this.weth.connect(signr).approve(this.swapperDia.address, weiMax);
        await this.swapperDia.connect(signr).swapExactOutputSingle(diaOut,weiMax);

        const diaAfter = await this.dia.balanceOf(signr.address);
        
        expect(diaAfter.sub(diaBefore)).to.equal(diaOut);
    });
});

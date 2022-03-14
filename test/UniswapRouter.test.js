const { ethers } = require('hardhat');
const { expect } = require('chai');

describe('Swapping weth for dia', () => {
    before( async () => {
        const routerAddress = '0xE592427A0AEce92De3Edee1F18E0157C05861564';
        const wethAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
        const daiAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
        
        const router = await ethers.getContractAt('ISwapRouter', routerAddress);
        
        const Swapper = await ethers.getContractFactory('Swapper');
        
        this.swapperDia = await Swapper.deploy(router.address, wethAddress, daiAddress, 3000);
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
        const ethTransfer = ethers.BigNumber.from('1');
        const weiTransfer = ethTransfer.mul(ethers.constants.WeiPerEther);

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

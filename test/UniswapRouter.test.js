

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
        this.dia = await ethers.getContractAt('DepositableERC20', daiAddress);

        // get signers for testing
        const [owner, other1, other2] = await ethers.getSigners();

        this.owner = owner;
        this.other1 = other1;
        this.other2 = other2;
    });

    it('Single exact input swap WETH for DIA', async () => {
        const ethTransfer = 0.00000001;
        const weiTransfer = ethTransfer*ethers.constants.WeiPerEther;
        const tx = await this.weth.connect(this.owner).deposit({value: weiTransfer});

        const diaBefore = await this.dia.balanceOf(this.owner.address);

        await this.weth.approve(this.swapperDia.address, weiTransfer);
        await this.swapperDia.connect(this.owner).swapExactInputSingle(weiTransfer);

        const diaAfter = await this.dia.balanceOf(this.owner.address);

        expect(diaBefore).to.lt(diaAfter);
    });

    it('Single exact output swap WETH for DIA', async () => {
        const diaOut = 1;
        const ethMax = 0.00000001;
        const weiMax = ethMax*ethers.constants.WeiPerEther;
        const tx = await this.weth.connect(this.owner).deposit({value: weiMax});

        const diaBefore = await this.dia.balanceOf(this.owner.address);

        await this.weth.approve(this.swapperDia.address, weiMax);
        await this.swapperDia.connect(this.owner).swapExactOutputSingle(diaOut,weiMax);

        const diaAfter = await this.dia.balanceOf(this.owner.address);
        
        expect(diaAfter.sub(diaBefore)).to.equal(diaOut);
    });
});

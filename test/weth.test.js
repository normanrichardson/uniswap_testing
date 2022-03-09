const { expect } = require('chai');
const { ethers } = require('hardhat');

require('dotenv').config();

describe('Test WETH', () => {
    
    before(async () => {
        // weth address on rinkeby.
        const wethAddress = '0xc778417E063141139Fce010982780140Aa0cD5Ab';

        // populate the DepositableERC20 interface
        this.weth = await ethers.getContractAt('DepositableERC20', wethAddress);

        // get signers for testing
        const [owner, other1, other2] = await ethers.getSigners();

        this.owner = owner;
        this.other1 = other1;
        this.other2 = other2;
    });

    it('Deposit WETH', async () => {
        const eth_before = await this.owner.getBalance();
        const weth_before = await this.weth.balanceOf(this.owner.address);
        const wei_transfer = ethers.utils.parseEther('0.001');
        const tx = await this.weth.connect(this.owner).deposit({value: wei_transfer});

        const eth_after = await this.owner.getBalance();
        const weth_after = await this.weth.balanceOf(this.owner.address);
        
        expect(weth_after - weth_before).to.equal(wei_transfer);
        expect(eth_before - eth_after).to.gt(wei_transfer); 
    });
        
    it('Transfer WETH by owner', async () => {
        // Participants
        const p1 = this.owner;
        const p2 = this.other1;
        const p1WethBefore = await this.weth.balanceOf(p1.address);
        const p2WethBefore = await this.weth.balanceOf(p2.address);
        // Dealing with bignumber casting issues
        const transAmm = p1WethBefore > ethers.utils.parseEther('0.001') ? ethers.utils.parseEther('0.001') : p1WethBefore/4;

        await this.weth.transfer(p2.address, transAmm);
        const p1WthAfter = await this.weth.balanceOf(p1.address);
        const p2WthAfter = await this.weth.balanceOf(p2.address);

        expect(p1WethBefore-p1WthAfter-transAmm).to.equal(0);
        expect(p2WthAfter-p2WethBefore-transAmm).to.equal(0);
    });

    it('Transfer WETH by 3rd party', async () => {
        // Participants
        const p1 = this.owner;
        const p2 = this.other1;
        const p3 = this.other2;
        const p1WethBefore = await this.weth.balanceOf(p1.address);
        const p3WethBefore = await this.weth.balanceOf(p3.address);
        // Dealing with bignumber casting issues
        const transAmm = p1WethBefore > ethers.utils.parseEther('0.001') ? ethers.utils.parseEther('0.001') : p1WethBefore/4;

        await this.weth.connect(p1).approve(p2.address, transAmm);
        await this.weth.connect(p2).transferFrom(p1.address, p3.address, transAmm);

        const p1WthAfter = await this.weth.balanceOf(p1.address);
        const p3WthAfter = await this.weth.balanceOf(p3.address);

        expect(p1WethBefore-p1WthAfter-transAmm).to.equal(0);
        expect(p3WthAfter-p3WethBefore-transAmm).to.equal(0);
    });

    it('Withdraw ETH', async () => {
        const balance = await this.weth.balanceOf(this.owner.address);
        
        await this.weth.withdraw(balance);
        const bal_after = await this.weth.balanceOf(this.owner.address);

        expect(bal_after).to.equal(0);
    });
});

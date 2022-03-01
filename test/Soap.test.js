// test/Box.test.js
// Load dependencies
const { expect } = require('chai');

// Import utilities from Test Helpers
const { ethers } = require('hardhat');

// Start test block
describe('Soap', function () {
    // Use large integers ('big numbers')
    
    beforeEach(async function () {
        
        const [owner, other1, other2] = await ethers.getSigners();

        this.owner = owner;
        this.other1 = other1;
        this.other2 = other2;
        const Soap = await ethers.getContractFactory('Soap');

        this.soap = await Soap.deploy(100);
        await this.soap.deployed();
    });

    it('self initiated transfer', async function () {
        //participants
        const p1 = this.owner;
        const p2 = this.other1;

        const owneBalanceBefore = await this.soap.balanceOf(p1.address);
        const transferAmm = owneBalanceBefore/10;
        const tx = await this.soap.connect(p1).transfer(p2.address, transferAmm);

        expect(tx).to.emit(this.soap, 'Transfer').withArgs(p1.address, p2.address, transferAmm);
        expect(await this.soap.balanceOf(p2.address)).to.equal(transferAmm);
        expect(await this.soap.balanceOf(p1.address)).to.equal(owneBalanceBefore - transferAmm);
    });

    it('allowance initiated transfer', async function () {
        //participants
        const p1 = this.owner;
        const p2 = this.other1;
        const p3 = this.other2;

        const owneBalanceBefore = await this.soap.balanceOf(p1.address);
        const allowanceAmm = owneBalanceBefore / 10;
        const transferAmm = allowanceAmm / 2;
        
        // set up the allowance
        const tx1 = await this.soap.connect(p1).approve(p2.address, allowanceAmm);

        expect(tx1).to.emit(this.soap, 'Approval').withArgs(p1.address, p2.address, allowanceAmm);
        
        // perform transfer
        const tx2 = await this.soap.connect(p2).transferFrom(p1.address,p3.address,transferAmm);

        expect(tx2).to.emit(this.soap, 'Transfer').withArgs(p1.address, p3.address, transferAmm);
        expect(tx2).to.emit(this.soap, 'Approval').withArgs(p1.address, p2.address, allowanceAmm-transferAmm);
        expect(await this.soap.balanceOf(p3.address)).to.equal(transferAmm);
        expect(await this.soap.balanceOf(p1.address)).to.equal(owneBalanceBefore - transferAmm);
    });
});

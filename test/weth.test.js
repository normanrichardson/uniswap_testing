const { expect } = require('chai');
const { ethers, network} = require('hardhat');

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
        const bal_before = await this.owner.getBalance();
        const wei = ethers.utils.parseEther('1000');
        const tx = await this.weth.connect(this.owner).deposit({value: wei});

        const bal_after = await this.owner.getBalance();
        const balance = await this.weth.balanceOf(this.owner.address);
        
        console.log(`Balance before: ${ethers.utils.formatEther(bal_before)}`);
        console.log(`Balance after: ${ethers.utils.formatEther(bal_after)}`);
        console.log(`Ammount deposited: ${ethers.utils.formatEther(balance)}`);
        console.log(`Transfer requested: ${ethers.utils.formatEther(wei)}`);
        //console.log(`Transfer recieved: ${ethers.utils.formatEther(value)}`);
    });
    it('Withdraw ETH', async () => {
        const bal_before = await this.owner.getBalance();
        const balance = await this.weth.balanceOf(this.owner.address);

        await this.weth.withdraw(balance);
        const bal_after = await this.owner.getBalance();

        console.log(`Balance before: ${ethers.utils.formatEther(bal_before)}`);
        console.log(`Balance after: ${ethers.utils.formatEther(bal_after)}`);
        console.log(`Ammount deposited: ${ethers.utils.formatEther(balance)}`);
    })
});
const { expect } = require('chai');
const { ethers } = require('hardhat');

require('dotenv').config();

describe('Test DepositableERC20 (WETH)', () => {
    let 
        weth,
        signr1,
        signr2,
        signr3;
    
    before(async () => {
        // weth address on rinkeby.
        const wethAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

        // populate the DepositableERC20 interface
        weth = await ethers.getContractAt('DepositableERC20', wethAddress);

        // get signers for testing
        [signr1, signr2, signr3] = await ethers.getSigners();
    });

    it('Deposit WETH', async () => {
        const ethTransfer = ethers.BigNumber.from('2');
        const weiTransfer = ethers.constants.WeiPerEther.mul(ethTransfer);
        
        await expect( await weth.connect(signr1).deposit({value: weiTransfer}))
            .to.emit(weth, 'Deposit')
            .withArgs(signr1.address, weiTransfer);
    });
        
    it('Transfer WETH by owner', async () => {
        // Participants
        const p1 = signr1;
        const p2 = signr2;
        const transAmm = ethers.BigNumber.from('1');
        const weiTransfer = ethers.constants.WeiPerEther.mul(transAmm).div(2);

        await expect(weth.transfer(p2.address, weiTransfer))
            .to.emit(weth, 'Transfer')
            .withArgs(p1.address, p2.address, weiTransfer);
    });

    it('Transfer WETH by 3rd party', async () => {
        // Participants
        const p1 = signr1;
        const p2 = signr2;
        const p3 = signr3;
        const transAmm = ethers.BigNumber.from('1');
        const weiTransfer = ethers.constants.WeiPerEther.mul(transAmm).div(2);

        await expect(weth.connect(p1).approve(p2.address, weiTransfer))
            .to.emit(weth, 'Approval')
            .withArgs(p1.address, p2.address, weiTransfer);

        await expect(weth.connect(p2).transferFrom(p1.address, p3.address, weiTransfer))
            .to.emit(weth, 'Transfer')
            .withArgs(p1.address, p3.address, weiTransfer);
    });

    it('Withdraw ETH', async () => {
        const balance = await weth.balanceOf(signr1.address);
        
        await expect(weth.withdraw(balance))
            .to.emit(weth, 'Withdrawal')
            .withArgs(signr1.address, balance);
        
    });
});

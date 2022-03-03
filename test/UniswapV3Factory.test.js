// test/Box.test.js
// Load dependencies
const { expect } = require('chai');

// Import utilities from Test Helpers
const { ethers } = require('hardhat');

const sr = require('@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json');
const fact = require('@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json');
const nfpm = require('@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json');

// Start test block
describe('UniswapV3Factory', function () {

    before( async () => {
        const UniswapV3Factory = await ethers.getContractFactory(fact.abi, fact.bytecode);
        const SwapRouter = await ethers.getContractFactory(sr.abi, sr.bytecode);
        const NonfungiblePositionManager = await ethers.getContractFactory(nfpm.abi, nfpm.bytecode);

        const Soap = await ethers.getContractFactory('Soap');
        const Sofa = await ethers.getContractFactory('Sofa');
        

        const factory = await UniswapV3Factory.deploy();
        const soap = await Soap.deploy(100);
        const sofa = await Sofa.deploy(100);
        
        // deploy the pool factory, and ERC20 tokens 
        await factory.deployed();
        await soap.deployed();
        await sofa.deployed();
        
        //create a pool for SOAP to SOFA
        const tx = await factory.createPool(soap.address, sofa.address,3000);

        this.swaprouter = await SwapRouter.deploy(factory.address, soap.address);
        // Point of contention why does NonfungiblePositionManager need to know more 
        // than the factory address? Why does it need a _WETH and a _tokenDescriptor_ 
        // address, I'm ignoring this for now
        this.nftm = await NonfungiblePositionManager.deploy(
            factory.address, soap.address, soap.address
        );
        await this.nftm.deployed();

        

        this.factory = factory;
        this.soap = soap;
        this.sofa = sofa;
        console.log(`SOAP: ${this.soap.address}`);
        console.log(`SOFA: ${this.sofa.address}`);
        console.log(`nftm: ${this.nftm.address}`); //0x5fc8d32690cc91d4c39d9d3abcbd16989f875707
    });

    it('1. creates a pool', async () => {

        const LiquidityExamples = await ethers.getContractFactory('LiquidityExamples');

        const le = await LiquidityExamples.deploy(this.nftm.address);

        const tx1 = await this.soap.approve(le.address, 1);
        const tx2 = await this.sofa.approve(le.address, 1);

        expect(tx1).to.emit('Approval');
        expect(tx2).to.emit('Approval');

        let {tokenId, liquidity, amount0, amount1} =  await le.mintNewPosition();

        console.log(this.soap.address, this.sofa.address);
    });


});

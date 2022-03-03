
const {ethers} = require('hardhat');
const sr = require('@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json');
const fact = require('@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json');


const main = async () => {
    const SwapRouter = await ethers.getContractFactory(sr.abi, sr.bytecode);
    const UniswapV3Factory = await ethers.getContractFactory(fact.abi, fact.bytecode);
    
    //console.log('Deploying SwapRouter...');
    const swaprouter = await UniswapV3Factory.deploy();

    await swaprouter.deployed();
    console.log('SwapRouter deployed at: ', swaprouter.address);
    
};

main()
    .then( ()=>{
        process.exit(0);
    })
    .catch( (error) => {
        console.log(error);
        process.exit(1);
    });

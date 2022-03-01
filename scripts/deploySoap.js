const {ethers} = require('hardhat');

const main = async () => {
    const Soap = await ethers.getContractFactory('Soap');

    console.log('Deploying Soap...');
    const soap = await Soap.deploy(100);

    await soap.deployed();
    console.log('Soap deployed at: ', soap.address);
};

main()
    .then( () => {
        process.exit(0);
    })
    .catch( (err) => {
        console.log(err);
        process.exit(1);
    });

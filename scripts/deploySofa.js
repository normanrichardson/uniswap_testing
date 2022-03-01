const {ethers} = require('hardhat');

const main = async () => {
    const Sofa = await ethers.getContractFactory('Sofa');

    console.log('Deploying Sofa...');
    const sofa = await Sofa.deploy(100);

    await sofa.deployed();
    console.log('Sofa deployed at: ', sofa.address);
};

main()
    .then( () => {
        process.exit(0);
    })
    .catch( (err) => {
        console.log(err);
        process.exit(1);
    });

require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-waffle');
require('dotenv').config();

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

const alchemyUrl = process.env.ALCHEMY_URL;

const UNISWAP_SETTING = {
    version: '0.7.6',
    settings: {
        optimizer: {
            enabled: true,
            runs: 2_000,
        },
    },
};

module.exports = {
    defaultNetwork: 'hardhat',
    networks: {
        hardhat: {
            forking: {
                url: alchemyUrl,
                blockNumber: 10289619,
            }
        }
    },
    solidity: {
        compilers: [UNISWAP_SETTING],
        overrides:{}
    },
};

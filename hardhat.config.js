require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-waffle');
require('dotenv').config

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
    networks: {
        hardhat: {
            forking: {
                url: alchemyUrl
            }
        }
    }
};


module.exports = {
    solidity: {
        compilers: [UNISWAP_SETTING],
        overrides:{}
    },
};

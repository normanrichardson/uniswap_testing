require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-waffle');

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

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
    solidity: {
        compilers: [UNISWAP_SETTING],
        overrides:{}
    },
};

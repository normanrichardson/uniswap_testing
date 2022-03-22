# Testing the [uniswap](https://docs.uniswap.org/) smart contracts

This builds on the tutorials for a [single swap](https://github.com/Uniswap/docs/blob/2d568cda033fc0577808ea817d88197d4b04c50b/smart_contract_examples/SwapExamples.sol) and [providing liquidity](https://github.com/Uniswap/docs/blob/2d568cda033fc0577808ea817d88197d4b04c50b/smart_contract_examples/LiquidityExamples.sol). Tests are run using hardhat and forking the Mainnet.

## Tips
* It was easier to work with existing pairs of assets. Experimentation is required to see if you can create your own pool with new ERC20 tokens. There may be some understanding to gain about how Uniswap works by doing this.

* It was easier to fork Mainnet than say Rinkeby as
    * it is easier to find existing asset addresses on Mainnet.
    * it is easier to find out what pools exist and their parameters.

* Each pool has a defined "tick spacing" (see for example the defaults [here](https://github.com/Uniswap/v3-core/blob/ed88be38ab2032d82bf10ac6f8d03aa631889d48/contracts/UniswapV3Factory.sol#L22-L32)). The tick spacing is used to discretize the price/liquidity space. If a liquidity position is requested that does not cover an integer number of tick spacings, the transaction reverts with no error message. This applies to all ticklower and tickupper, so using  [`tickLower: TickMath.MIN_TICK, tickUpper: TickMath.MAX_TICK`](https://github.com/Uniswap/docs/blob/2d568cda033fc0577808ea817d88197d4b04c50b/smart_contract_examples/LiquidityExamples.sol#L82-L83), does not actually work for the 3000 pool.

* Each ERC20 token has its own precision, see the [decimals function](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/05077f70f1379b0a2960711fbecb8a23c3b4c256/contracts/token/ERC20/ERC20.sol#L74-L89). Stablecoins such as DAI and USDC have a different number of decimals, so 1 token of DAI is not equal to 1 token on USDC.

* In [providing liquidity](https://github.com/Uniswap/docs/blob/2d568cda033fc0577808ea817d88197d4b04c50b/smart_contract_examples/LiquidityExamples.sol#L157-L160) there is a bug in the example code. When decreasing the liquidity (via the `nonfungiblePositionManager.decreaseLiquidity`) the tokens are not transferred to the calling contract, but rather placed in the tokens [owed field](https://github.com/Uniswap/v3-periphery/blob/51f8871aaef2263c8e8bbf4f3410880b6162cdea/contracts/NonfungiblePositionManager.sol#L281-L298) of the position. So before trying to transfer tokens to the owner, the tokens need to be collected.

## Set up

1. Set up an Alchemy account

Create an [alchemy account](https://www.alchemy.com/). Create an app on alchemy that uses the ethereum chain and mainnet network. Get the api key for the alchemy app. This api key will give you access to fork Mainnet.

2. Clone and navigate to a local working directory

3. Create a .env file
  ```
  $touch .env
  ```
The file should contain:
  ```
  ALCHEMY_URL=https://eth-mainnet.alchemyapi.io/v2/{ API KEY }
  ```

4. Install dependencies
  ```
  $npm install
  ```
5. Compile the solidity contract using hardhat
  ```
  $npx hardhat compile
  ```
6. Run tests using hardhat
  ```
  $npx hardhat test
  ```

## Useful resources

* [Uniswap whitepaper](https://uniswap.org/whitepaper-v3.pdf)
* [Uniswap code intro](https://drive.google.com/file/d/1dRifSAXxc-6HKCKH8tcygEmHxJTKAlxp/view)
* [Uniswap/v3-core](https://github.com/Uniswap/v3-core)
* [Uniswap/v3-periphery](https://github.com/Uniswap/v3-periphery)
* [Uniswap deployed addresses](https://docs.uniswap.org/protocol/reference/deployments)
* [Openzeppelin contracts](https://github.com/OpenZeppelin/openzeppelin-contracts)
* [Waffle matchers](https://ethereum-waffle.readthedocs.io/en/latest/matchers.html)
* [etherscan](https://etherscan.io/)


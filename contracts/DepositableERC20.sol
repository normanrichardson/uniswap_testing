// contracts/DepositableERC20.sol
// SPDX-License-Identifier: MIT
pragma solidity =0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Add deposit function for WETH
interface DepositableERC20 is IERC20 {
  function deposit() external payable;
  function withdraw(uint wad) external;
}

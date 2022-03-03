// contracts/DumpsterFire.sol
// SPDX-License-Identifier: MIT
pragma solidity =0.7.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Sofa is ERC20 {
    constructor(uint256 initialSupply) ERC20("Sofa", "SOF") {
        _mint(msg.sender, initialSupply);
    }
}

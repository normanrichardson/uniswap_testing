// contracts/Soap.sol
// SPDX-License-Identifier: MIT
pragma solidity >=0.7.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Soap is ERC20 {
    constructor(uint256 initialSupply) ERC20("Soap", "SOP") {
        _mint(msg.sender, initialSupply);
    } 
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    uint8 private _vabf2d8 = 6;
    
    constructor() ERC20("Mock USDC", "USDC") {
        _mint(msg.sender, 1000000 * 10**_vabf2d8); 
    }
    
    function decimals() public view virtual override returns (uint8) {
        return _vabf2d8;
    }
    
    function _f16d0d8(address to, uint256 _v9cb6ff) public {
        _mint(to, _v9cb6ff);
    }
}
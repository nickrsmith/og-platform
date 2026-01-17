// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/proxy/Proxy.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Upgrade.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract EmpressaProxy is Proxy, ERC1967Upgrade, Initializable {
    address public _vd033e2;
    address public _vb2e31d;

    event _e9ff465(address indexed _vfa2183, address indexed newAdmin);
    event _ed54b9c(address indexed _v6f5c52, address indexed newUpgrader);

    modifier _mc87f2a() {
        require(msg.sender == _vd033e2, "Not _vd033e2");
        _;
    }

    modifier _mb3cd5a() {
        require(msg.sender == _vb2e31d, "Not _vb2e31d");
        _;
    }
    
    constructor() {
    }

    function _f4728f2(address _v3b7ca2, address _upgrader) public initializer {
        require(_v3b7ca2 != address(0), "Invalid _vd033e2 address");
        require(_upgrader != address(0), "Invalid _vb2e31d address");

        _vd033e2 = _v3b7ca2;
        _vb2e31d = _upgrader;
    }

    function _fa20d2f(address newImplementation) external _mb3cd5a {
        _upgradeToAndCall(newImplementation, "", false);
    }

    function _f2392d4(address newImplementation, bytes memory data) external _mb3cd5a {
        _upgradeToAndCall(newImplementation, data, true);
    }

    function _f24382f() external view returns (address) {
        return _getImplementation();
    }

    function _f81aaf9(address newAdmin) external _mc87f2a {
        require(newAdmin != address(0), "Invalid _vd033e2 address");
        address _vfa2183 = _vd033e2;
        _vd033e2 = newAdmin;
        emit _e9ff465(_vfa2183, newAdmin);
    }

    function _fa7b225(address newUpgrader) external _mc87f2a {
        require(newUpgrader != address(0), "Invalid _vb2e31d address");
        address _v6f5c52 = _vb2e31d;
        _vb2e31d = newUpgrader;
        emit _ed54b9c(_v6f5c52, newUpgrader);
    }

    function _implementation() internal view virtual override returns (address) {
        return ERC1967Upgrade._getImplementation();
    }

    function _fallback() internal virtual override {
        super._fallback();
    }

    receive() external payable override {
        
    }
}

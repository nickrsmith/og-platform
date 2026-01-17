// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/proxy/Proxy.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Upgrade.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract HauskaProxy is Proxy, ERC1967Upgrade, Initializable {
    address public admin;
    address public upgrader;

    // Events
    event ProxyAdminChanged(address indexed oldAdmin, address indexed newAdmin);
    event UpgraderChanged(address indexed oldUpgrader, address indexed newUpgrader);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    modifier onlyUpgrader() {
        require(msg.sender == upgrader, "Not upgrader");
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        // Simple proxy without complex inheritance
    }

    function initialize(address _admin, address _upgrader) public initializer {
        require(_admin != address(0), "Invalid admin address");
        require(_upgrader != address(0), "Invalid upgrader address");

        admin = _admin;
        upgrader = _upgrader;
    }

    function upgradeTo(address newImplementation) external onlyUpgrader {
        _upgradeToAndCall(newImplementation, "", false);
    }

    function upgradeToAndCall(address newImplementation, bytes memory data) external onlyUpgrader {
        _upgradeToAndCall(newImplementation, data, true);
    }

    function getImplementation() external view returns (address) {
        return _getImplementation();
    }

    function changeAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Invalid admin address");
        address oldAdmin = admin;
        admin = newAdmin;
        emit ProxyAdminChanged(oldAdmin, newAdmin);
    }

    function changeUpgrader(address newUpgrader) external onlyAdmin {
        require(newUpgrader != address(0), "Invalid upgrader address");
        address oldUpgrader = upgrader;
        upgrader = newUpgrader;
        emit UpgraderChanged(oldUpgrader, newUpgrader);
    }

    function _implementation() internal view virtual override returns (address) {
        return ERC1967Upgrade._getImplementation();
    }

    function _fallback() internal virtual override {
        super._fallback();
    }

    receive() external payable override {
        // Accept ETH
    }
}

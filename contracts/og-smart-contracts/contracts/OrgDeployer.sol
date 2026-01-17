// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./HauskaOrgContract.sol";

contract OrgDeployer {
    function deploy(
        address factory,
        address principal,
        address integrationPartner
    ) external returns (address org) {
        org = address(new HauskaOrgContract(factory, principal, integrationPartner));
    }
}

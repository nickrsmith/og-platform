// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./EmpressaOrgContract.sol";

contract OrgDeployer {
    function deploy(
        address factory,
        address principal,
        address integrationPartner
    ) external returns (address org) {
        org = address(new EmpressaOrgContract(factory, principal, integrationPartner));
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./HauskaOrgContract.sol";

contract OrgDeployer {
    function _fb0d51b(
        address _v7b202d,
        address _v35a34c,
        address _vbd9641
    ) external returns (address _vd23b59) {
        _vd23b59 = address(new HauskaOrgContract(_v7b202d, _v35a34c, _vbd9641));
    }
}

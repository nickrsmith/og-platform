// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IEmpressaStructs.sol";
import "./interfaces/IEmpressaContracts.sol";

interface IAssetRegistry {
    function isAssetVerified(address orgContract, uint256 assetId) external view returns (bool);
    function getAsset(address orgContract, uint256 assetId) external view returns (IEmpressaStructs.VerifiedDigitalAsset memory);
}

contract EmpressaGroupManager is AccessControl, IEmpressaStructs {
    bytes32 public constant GROUP_ADMIN_ROLE = keccak256("GROUP_ADMIN_ROLE");
    bytes32 public constant ORG_CONTRACT_ROLE = keccak256("ORG_CONTRACT_ROLE");
    
    address public immutable assetRegistry;
    
    // Group storage
    mapping(address => mapping(uint256 => AssetGroup)) public orgGroups;
    mapping(address => uint256) public orgGroupCounts;
    mapping(address => mapping(address => uint256[])) public creatorGroups;
    
    event GroupCreated(
        address indexed orgContract,
        uint256 indexed groupId,
        string name,
        address indexed creator
    );
    
    event GroupUpdated(
        address indexed orgContract,
        uint256 indexed groupId,
        uint256 newPrice
    );
    
    event AssetAddedToGroup(
        address indexed orgContract,
        uint256 indexed groupId,
        uint256 assetId
    );
    
    event AssetRemovedFromGroup(
        address indexed orgContract,
        uint256 indexed groupId,
        uint256 assetId
    );
    
    event GroupDeleted(
        address indexed orgContract,
        uint256 indexed groupId
    );
    
    modifier onlyOrgContract() {
        require(hasRole(ORG_CONTRACT_ROLE, msg.sender), "Caller not authorized");
        _;
    }
    
    constructor(address _assetRegistry) {
        require(_assetRegistry != address(0), "Invalid asset registry");
        assetRegistry = _assetRegistry;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(GROUP_ADMIN_ROLE, msg.sender);
    }
    
    function addOrgContract(address orgContract) external onlyRole(GROUP_ADMIN_ROLE) {
        _grantRole(ORG_CONTRACT_ROLE, orgContract);
    }
    
    function removeOrgContract(address orgContract) external onlyRole(GROUP_ADMIN_ROLE) {
        _revokeRole(ORG_CONTRACT_ROLE, orgContract);
    }
    
    function createGroup(
        string memory groupName,
        uint256[] memory assetIds,
        uint256 groupPrice,
        address creator
    ) external onlyOrgContract returns (uint256) {
        require(bytes(groupName).length > 0, "Group name cannot be empty");
        require(assetIds.length > 0, "Group must have assets");
        
        address orgContract = msg.sender;
        
        // Verify all assets and check ownership
        for (uint256 i = 0; i < assetIds.length; i++) {
            require(
                IAssetRegistry(assetRegistry).isAssetVerified(orgContract, assetIds[i]),
                "All assets must be verified"
            );
            
            // Check if the creator owns the asset
            IEmpressaStructs.VerifiedDigitalAsset memory asset = IAssetRegistry(assetRegistry).getAsset(orgContract, assetIds[i]);
            require(asset.owner == creator, "Creator must own all assets in the group");
        }
        
        orgGroupCounts[orgContract]++;
        uint256 groupId = orgGroupCounts[orgContract];
        
        AssetGroup storage newGroup = orgGroups[orgContract][groupId];
        newGroup.groupId = groupId;
        newGroup.members = assetIds;
        newGroup.name = groupName;
        newGroup.groupPrice = groupPrice;
        newGroup.owner = creator;
        
        creatorGroups[orgContract][creator].push(groupId);
        
        emit GroupCreated(orgContract, groupId, groupName, creator);
        
        return groupId;
    }
    
    function addAssetToGroup(
        uint256 groupId,
        uint256 assetId,
        address caller
    ) external onlyOrgContract {
        address orgContract = msg.sender;
        AssetGroup storage group = orgGroups[orgContract][groupId];
        
        require(group.groupId != 0, "Group does not exist");
        require(group.owner == caller, "Only group owner can modify");
        require(
            IAssetRegistry(assetRegistry).isAssetVerified(orgContract, assetId),
            "Asset must be verified"
        );
        
        // Check if asset already in group
        for (uint256 i = 0; i < group.members.length; i++) {
            require(group.members[i] != assetId, "Asset already in group");
        }
        
        group.members.push(assetId);
        emit AssetAddedToGroup(orgContract, groupId, assetId);
    }
    
    function removeAssetFromGroup(
        uint256 groupId,
        uint256 assetId,
        address caller
    ) external onlyOrgContract {
        address orgContract = msg.sender;
        AssetGroup storage group = orgGroups[orgContract][groupId];
        
        require(group.groupId != 0, "Group does not exist");
        require(group.owner == caller, "Only group owner can modify");
        require(group.members.length > 1, "Cannot remove last asset");
        
        // Find and remove asset
        for (uint256 i = 0; i < group.members.length; i++) {
            if (group.members[i] == assetId) {
                group.members[i] = group.members[group.members.length - 1];
                group.members.pop();
                emit AssetRemovedFromGroup(orgContract, groupId, assetId);
                return;
            }
        }
        
        revert("Asset not in group");
    }
    
    function updateGroupPrice(
        uint256 groupId,
        uint256 newPrice,
        address caller
    ) external onlyOrgContract {
        address orgContract = msg.sender;
        AssetGroup storage group = orgGroups[orgContract][groupId];
        
        require(group.groupId != 0, "Group does not exist");
        require(group.owner == caller, "Only group owner can modify");
        
        group.groupPrice = newPrice;
        emit GroupUpdated(orgContract, groupId, newPrice);
    }
    
    function getGroup(
        address orgContract,
        uint256 groupId
    ) external view returns (AssetGroup memory) {
        AssetGroup memory group = orgGroups[orgContract][groupId];
        (uint32 EmpressaFeePct, uint32 integratorFeePct) = IEmpressaRevenueDistributor(IEmpressaOrgContract(orgContract).revenueDistributor()).getCustomFees(orgContract);
        group.groupPrice = group.groupPrice * (10000 + EmpressaFeePct + integratorFeePct) / 10000;
        return group;
    }
    
    function getGroupsByCreator(
        address orgContract,
        address creator
    ) external view returns (uint256[] memory) {
        return creatorGroups[orgContract][creator];
    }

    function removeGroup(uint256 groupId, address caller) external onlyOrgContract {
        address orgContract = msg.sender;
        AssetGroup storage group = orgGroups[orgContract][groupId];

        require(group.groupId != 0, "Group does not exist");
        require(group.owner == caller, "Only group owner can delete");

        // Remove groupId from creatorGroups array
        address creator = group.owner;
        uint256[] storage creatorGroupList = creatorGroups[orgContract][creator];
        
        // Find and remove the groupId from the array
        for (uint256 i = 0; i < creatorGroupList.length; i++) {
            if (creatorGroupList[i] == groupId) {
                // Move the last element to the position of the element to delete
                creatorGroupList[i] = creatorGroupList[creatorGroupList.length - 1];
                // Remove the last element
                creatorGroupList.pop();
                break;
            }
        }

        orgGroupCounts[orgContract]--;
        delete orgGroups[orgContract][groupId];
    }
    
    function getGroupCount(address orgContract) external view returns (uint256) {
        return orgGroupCounts[orgContract];
    }
    
    /**
     * @dev Remove an asset from all groups it belongs to
     * @param orgContract Organization contract address
     * @param assetId Asset ID to remove from all groups
     */
    function removeAssetFromAllGroups(
        address orgContract,
        uint256 assetId
    ) external onlyOrgContract {
        uint256 groupCount = orgGroupCounts[orgContract];
        
        // Iterate through all groups and remove the asset
        for (uint256 groupId = 1; groupId <= groupCount; groupId++) {
            AssetGroup storage group = orgGroups[orgContract][groupId];
            
            // Skip if group doesn't exist
            if (group.groupId == 0) continue;
            
            // Find and remove the asset from this group
            for (uint256 i = 0; i < group.members.length; i++) {
                if (group.members[i] == assetId) {
                    // If this is the last asset in the group, delete the entire group
                    if (group.members.length == 1) {
                        // Remove groupId from creatorGroups array
                        address creator = group.owner;
                        uint256[] storage creatorGroupList = creatorGroups[orgContract][creator];
                        
                        // Find and remove the groupId from the array
                        for (uint256 j = 0; j < creatorGroupList.length; j++) {
                            if (creatorGroupList[j] == groupId) {
                                // Move the last element to the position of the element to delete
                                creatorGroupList[j] = creatorGroupList[creatorGroupList.length - 1];
                                // Remove the last element
                                creatorGroupList.pop();
                                break;
                            }
                        }

                        // Delete the group
                        delete orgGroups[orgContract][groupId];
                        orgGroupCounts[orgContract]--;
                        emit GroupDeleted(orgContract, groupId);
                    } else {
                        // Remove the asset from the group
                        group.members[i] = group.members[group.members.length - 1];
                        group.members.pop();
                        emit AssetRemovedFromGroup(orgContract, groupId, assetId);
                    }
                    break; // Asset found and removed, move to next group
                }
            }
        }
    }

    function updateAssetIdsInGroups(
        address orgContract,
        uint256 assetId
    ) external onlyOrgContract {
        uint256 groupCount = orgGroupCounts[orgContract];

        for (uint256 groupId = 1; groupId <= groupCount; groupId++) {
            AssetGroup storage group = orgGroups[orgContract][groupId];
            for (uint256 i = 0; i < group.members.length; i++) {
                if (group.members[i] > assetId) {
                    group.members[i]--;
                }
            }
        }
    }
}
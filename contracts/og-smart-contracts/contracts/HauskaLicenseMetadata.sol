// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "./EmpressaLicenseNFT.sol";
import "./interfaces/IEmpressaContracts.sol";

/**
 * @title EmpressaLicenseMetadata
 * @dev Generates on-chain metadata for license NFTs
 */
contract EmpressaLicenseMetadata {
    using Strings for uint256;
    
    EmpressaLicenseNFT public immutable licenseNFT;
    
    constructor(address _licenseNFT) {
        require(_licenseNFT != address(0), "Invalid NFT address");
        licenseNFT = EmpressaLicenseNFT(_licenseNFT);
    }
    
    /**
     * @dev Generate metadata URI for a license token
     */
    function tokenURI(uint256 tokenId) external view returns (string memory) {
        require(licenseNFT.ownerOf(tokenId) != address(0), "Token does not exist");
        
        EmpressaLicenseNFT.LicenseData memory license = licenseNFT.getLicenseDetails(tokenId);
        
        // Get asset details
        IEmpressaAssetRegistry registry = IEmpressaAssetRegistry(
            IEmpressaOrgContract(license.orgContract).assetRegistry()
        );
        IEmpressaStructs.VerifiedDigitalAsset memory asset = registry.getAsset(license.orgContract, license.assetId);
        
        // Build attributes
        string memory attributes = string(abi.encodePacked(
            '[',
            '{"trait_type":"Asset ID","value":"', license.assetId.toString(), '"},',
            '{"trait_type":"Creator","value":"', toHexString(license.originalCreator), '"},',
            '{"trait_type":"Organization","value":"', toHexString(license.orgContract), '"},',
            '{"trait_type":"License Type","value":"', getLicenseType(license.expirationTime), '"},',
            '{"trait_type":"Can Resell","value":"', canResell(license.permissions) ? "Yes" : "No", '"},',
            '{"trait_type":"Issued Date","value":"', license.issuedAt.toString(), '"}'
        ));
        
        if (license.expirationTime > 0) {
            attributes = string(abi.encodePacked(
                attributes,
                ',{"trait_type":"Expiration","value":"', license.expirationTime.toString(), '"}'
            ));
        }
        
        attributes = string(abi.encodePacked(attributes, ']'));
        
        // Build metadata
        string memory json = string(abi.encodePacked(
            '{',
            '"name":"Empressa License #', tokenId.toString(), '",',
            '"description":"License for Verified Digital Asset #', license.assetId.toString(), '",',
            '"image":"', generateSVG(tokenId, license, asset), '",',
            '"attributes":', attributes,
            '}'
        ));
        
        return string(abi.encodePacked(
            "data:application/json;base64,",
            Base64.encode(bytes(json))
        ));
    }
    
    /**
     * @dev Generate SVG image for the license
     */
    function generateSVG(
        uint256 tokenId,
        EmpressaLicenseNFT.LicenseData memory license,
        IEmpressaStructs.VerifiedDigitalAsset memory /*asset*/
    ) internal view returns (string memory) {
        string memory svg = string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" width="350" height="350" viewBox="0 0 350 350">',
            '<defs>',
            '<linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">',
            '<stop offset="0%" style="stop-color:#7C3AED;stop-opacity:1" />',
            '<stop offset="100%" style="stop-color:#A855F7;stop-opacity:1" />',
            '</linearGradient>',
            '</defs>',
            '<rect width="350" height="350" fill="url(#grad)"/>',
            '<text x="175" y="50" text-anchor="middle" fill="white" font-size="24" font-weight="bold">Empressa LICENSE</text>',
            '<text x="175" y="100" text-anchor="middle" fill="white" font-size="18">#', tokenId.toString(), '</text>',
            '<rect x="25" y="120" width="300" height="1" fill="white" opacity="0.3"/>',
            '<text x="175" y="160" text-anchor="middle" fill="white" font-size="14">Asset ID: ', license.assetId.toString(), '</text>',
            '<text x="175" y="190" text-anchor="middle" fill="white" font-size="12">', getLicenseType(license.expirationTime), '</text>'
        ));
        
        if (canResell(license.permissions)) {
            svg = string(abi.encodePacked(
                svg,
                '<text x="175" y="220" text-anchor="middle" fill="#10B981" font-size="14">Transferable</text>'
            ));
        }
        
        svg = string(abi.encodePacked(
            svg,
            '<text x="175" y="320" text-anchor="middle" fill="white" font-size="10">Verified Digital Asset</text>',
            '</svg>'
        ));
        
        return string(abi.encodePacked(
            "data:image/svg+xml;base64,",
            Base64.encode(bytes(svg))
        ));
    }
    
    /**
     * @dev Get license type string
     */
    function getLicenseType(uint256 expirationTime) internal view returns (string memory) {
        if (expirationTime == 0) {
            return "Perpetual License";
        } else if (expirationTime > block.timestamp) {
            return "Time-Limited License";
        } else {
            return "Expired License";
        }
    }
    
    /**
     * @dev Check if license has resell permission
     */
    function canResell(uint8 permissions) internal pure returns (bool) {
        return (permissions & 1) == 1;
    }
    
    /**
     * @dev Convert address to hex string
     */
    function toHexString(address addr) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(addr)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = '0';
        str[1] = 'x';
        for (uint256 i = 0; i < 20; i++) {
            str[2+i*2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3+i*2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }
}
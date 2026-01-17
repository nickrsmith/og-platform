// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "./HauskaLicenseNFT.sol";
import "./interfaces/IHauskaContracts.sol";


contract HauskaLicenseMetadata {
    using Strings for uint256;
    
    HauskaLicenseNFT public immutable _v5e116c;
    
    constructor(address _licenseNFT) {
        require(_licenseNFT != address(0), "Invalid NFT address");
        _v5e116c = HauskaLicenseNFT(_licenseNFT);
    }
    
    function tokenURI(uint256 _va95b9f) external view returns (string memory) {
        require(_v5e116c.ownerOf(_va95b9f) != address(0), "Token does not exist");
        
        HauskaLicenseNFT.LicenseData memory _v234571 = _v5e116c._fa97764(_va95b9f);
        IHauskaAssetRegistry registry = IHauskaAssetRegistry(
            IHauskaOrgContract(_v234571._v3030a8)._v9b2fda()
        );
        IHauskaStructs.VerifiedDigitalAsset memory _v05fac9 = registry._f57ca34(_v234571._v3030a8, _v234571._v9d8e96);
        
        
        string memory _vd7f67a = string(abi.encodePacked(
            '[',
            '{"trait_type":"Asset ID","_vf32b67":"', _v234571._v9d8e96.toString(), '"},',
            '{"trait_type":"Creator","_vf32b67":"', _f36e65a(_v234571._v156506), '"},',
            '{"trait_type":"Organization","_vf32b67":"', _f36e65a(_v234571._v3030a8), '"},',
            '{"trait_type":"License Type","_vf32b67":"', _f6c29a4(_v234571._vdf9c6b), '"},',
            '{"trait_type":"Can Resell","_vf32b67":"', _f7f304a(_v234571._v7e9272) ? "Yes" : "No", '"},',
            '{"trait_type":"Issued Date","_vf32b67":"', _v234571._v6914b0.toString(), '"}'
        ));
        
        if (_v234571._vdf9c6b > 0) {
            _vd7f67a = string(abi.encodePacked(
                _vd7f67a,
                ',{"trait_type":"Expiration","_vf32b67":"', _v234571._vdf9c6b.toString(), '"}'
            ));
        }
        
        _vd7f67a = string(abi.encodePacked(_vd7f67a, ']'));
        
        
        string memory _v05d97e = string(abi.encodePacked(
            '{',
            '"_v6ae999":"Hauska License #', _va95b9f.toString(), '",',
            '"description":"License for Verified Digital Asset #', _v234571._v9d8e96.toString(), '",',
            '"image":"', _fef1a5c(_va95b9f, _v234571, _v05fac9), '",',
            '"_vd7f67a":', _vd7f67a,
            '}'
        ));
        
        return string(abi.encodePacked(
            "data:application/_v05d97e;base64,",
            Base64.encode(bytes(_v05d97e))
        ));
    }
    
    
    function _fef1a5c(
        uint256 _va95b9f,
        HauskaLicenseNFT.LicenseData memory _v234571,
        IHauskaStructs.VerifiedDigitalAsset memory 
    ) internal view returns (string memory) {
        string memory svg = string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" width="350" height="350">',
            '<defs>',
            '<linearGradient _v87ea5d="grad" x1="0%" y1="0%" x2="100%" y2="100%">',
            '<stop _v53a610="0%" style="stop-color:#7C3AED;stop-opacity:1" />',
            '<stop _v53a610="100%" style="stop-color:#A855F7;stop-opacity:1" />',
            '</linearGradient>',
            '</defs>',
            '<rect width="350" height="350" fill="url(#grad)"/>',
            '<text x="175" y="50" text-anchor="middle" fill="white" font-size="24" font-weight="bold">HAUSKA LICENSE</text>',
            '<text x="175" y="100" text-anchor="middle" fill="white" font-size="18">#', _va95b9f.toString(), '</text>',
            '<rect x="25" y="120" width="300" height="1" fill="white" opacity="0.3"/>',
            '<text x="175" y="160" text-anchor="middle" fill="white" font-size="14">Asset ID: ', _v234571._v9d8e96.toString(), '</text>',
            '<text x="175" y="190" text-anchor="middle" fill="white" font-size="12">', _f6c29a4(_v234571._vdf9c6b), '</text>'
        ));
        
        if (_f7f304a(_v234571._v7e9272)) {
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
            "data:image/svg+_v42f7b7;base64,",
            Base64.encode(bytes(svg))
        ));
    }
    
    function _f6c29a4(uint256 _vdf9c6b) internal view returns (string memory) {
        if (_vdf9c6b == 0) {
            return "Perpetual License";
        } else if (_vdf9c6b > block.timestamp) {
            return "Time-Limited License";
        } else {
            return "Expired License";
        }
    }
    
    function _f7f304a(uint8 _v7e9272) internal pure returns (bool) {
        return (_v7e9272 & 1) == 1;
    }
    
    function _f36e65a(address addr) internal pure returns (string memory) {
        bytes32 _vf32b67 = bytes32(uint256(uint160(addr)));
        bytes memory _vc65dc3 = "0123456789abcdef";
        bytes memory _v344249 = new bytes(42);
        _v344249[0] = '0';
        _v344249[1] = 'x';
        for (uint256 _v042dc4 = 0; _v042dc4 < 20; _v042dc4++) {
            _v344249[2+_v042dc4*2] = _vc65dc3[uint8(_vf32b67[_v042dc4 + 12] >> 4)];
            _v344249[3+_v042dc4*2] = _vc65dc3[uint8(_vf32b67[_v042dc4 + 12] & 0x0f)];
        }
        return string(_v344249);
    }
}
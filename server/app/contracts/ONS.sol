// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;
import "@openzeppelin/contracts/access/Ownable.sol";

interface ONSRegistry {
    function resolver(bytes32 node) external view returns (address);
}

interface ONSResolver {
    function addr(bytes32 node) external view returns (address);
}

// ENS registry address: 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e
// https://docs.chain.link/data-feeds/ens#:~:text=ENS%20registry%20address%3A%200x00000000000C2E074eC69A0dFb2997BA6C7d2e1e.,bytes32%20hash%20IDs%20for%20names.

contract ONSManager is Ownable {
    ONSRegistry private onsRegistry;
    mapping(string => address) private customEntries;

//    constructor(address _onsRegistryAddress) Ownable(msg.sender)  {
    constructor(address _onsRegistryAddress)  {
        onsRegistry = ONSRegistry(_onsRegistryAddress);
    }

    function resolveONS(string memory onsName) public view returns (address) {
        bytes32 node = namehash(onsName);
        ONSResolver resolver = ONSResolver(onsRegistry.resolver(node));
        return resolver.addr(node);
    }

    function namehash(string memory _name) public pure returns (bytes32) {
        bytes memory name = bytes(_name);
        if (name.length == 0) {
            return 0x0;
        } else {
            return keccak256(abi.encodePacked(namehash(getNextLabel(_name)), keccak256(bytes(getLabel(_name)))));
        }
    }


    function getLabel(string memory _name) internal pure returns (string memory) {
        bytes memory name = bytes(_name);
        uint256 i = 0;
        while (i < name.length && name[i] != '.') {
            i++;
        }
        
        bytes memory label = new bytes(i);
        for (uint256 j = 0; j < i; j++) {
            label[j] = name[j];
        }
        
        return string(label);
    }


    function getNextLabel(string memory _name) internal pure returns (string memory) {
        bytes memory name = bytes(_name);
        uint256 i = 0;
        // Find the position of the first dot
        while (i < name.length && name[i] != '.') {
            i++;
        }
        if (i >= name.length - 1) return ""; // No more labels after the first one

        uint256 remainingLength = name.length - (i + 1);
        bytes memory nextLabel = new bytes(remainingLength);

        // Copy the remaining part of the name to nextLabel
        for (uint256 j = 0; j < remainingLength; j++) {
            nextLabel[j] = name[i + 1 + j];
        }

        return string(nextLabel);
    }


    // Owner functions to manage custom entries
    function addCustomEntry(string memory key, address value) public onlyOwner {
        customEntries[key] = value;
    }

    function removeCustomEntry(string memory key) public onlyOwner {
        delete customEntries[key];
    }

    function getCustomEntry(string memory key) public view returns (address) {
        return customEntries[key];
    }
}

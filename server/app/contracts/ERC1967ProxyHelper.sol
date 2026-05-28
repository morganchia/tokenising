// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

// This file exists solely to make Hardhat compile ERC1967Proxy and generate its
// artifact (ABI + bytecode). The server deploys one ERC1967Proxy per DTSCF project.
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

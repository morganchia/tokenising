/**
 * Upgrade script: deploys a new implementation and upgrades existing proxies.
 *
 * Run whenever you fix a bug or add a feature to TokenizedPayable.sol.
 * All existing proxy contracts (one per DTSCF project) will immediately use
 * the new logic without any state migration — their token balances are unchanged.
 *
 * Usage:
 *   PROXY_ADDRESSES=0xABC,0xDEF npx hardhat run scripts/upgradeImplementation.js --network sepolia
 *
 * Or set PROXY_ADDRESSES in .env as a comma-separated list of all proxy addresses.
 */

const { ethers, upgrades } = require("hardhat");
require("dotenv").config({ override: true });

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Upgrading from:", deployer.address);

  const proxyAddressesRaw = process.env.PROXY_ADDRESSES;
  if (!proxyAddressesRaw) {
    throw new Error("Set PROXY_ADDRESSES in .env as a comma-separated list of proxy addresses to upgrade.");
  }
  const proxyAddresses = proxyAddressesRaw.split(",").map(a => a.trim()).filter(Boolean);
  console.log(`Upgrading ${proxyAddresses.length} proxy contract(s)...`);

  const TokenizedPayableV2 = await ethers.getContractFactory("TokenizedPayable");

  for (const proxyAddress of proxyAddresses) {
    console.log(`\nRegistering proxy at ${proxyAddress}...`);
    // forceImport registers a proxy that was deployed outside the OZ plugin manifest.
    // Safe to call even if already registered — it just re-imports.
    await upgrades.forceImport(proxyAddress, TokenizedPayableV2, { kind: "uups" });
    console.log(`  Registered.`);
  }

  // Validate storage compatibility against the first proxy (all share the same impl)
  await upgrades.validateUpgrade(proxyAddresses[0], TokenizedPayableV2, { kind: "uups" });
  console.log("Storage layout validation passed.");

  for (const proxyAddress of proxyAddresses) {
    console.log(`\nUpgrading proxy at ${proxyAddress}...`);
    const upgraded = await upgrades.upgradeProxy(proxyAddress, TokenizedPayableV2, { kind: "uups" });
    await upgraded.waitForDeployment();
    const newImpl = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log(`  Done. New implementation: ${newImpl}`);
  }

  const chainId = (await ethers.provider.getNetwork()).chainId;
  const finalImpl = await upgrades.erc1967.getImplementationAddress(proxyAddresses[0]);
  console.log("\n=== Upgrade complete ===");
  console.log(`Update in .env: TP_IMPLEMENTATION_ADDRESS_${chainId}=${finalImpl}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

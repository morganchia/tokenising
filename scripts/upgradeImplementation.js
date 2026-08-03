/**
 * Upgrade script: deploys a new implementation and upgrades existing proxies for
 * one of the UUPS-upgradeable contracts in server/app/contracts/.
 *
 * Run whenever you fix a bug or add a feature to a contract's .sol file.
 * All existing proxy contracts (one per project/trade) will immediately use the
 * new logic without any state migration — their balances/config are unchanged.
 *
 * Usage:
 *   CONTRACT_NAME=BondToken PROXY_ADDRESSES=0xABC,0xDEF npx hardhat run scripts/upgradeImplementation.js --network sepolia
 *
 * CONTRACT_NAME defaults to TokenizedPayable if unset.
 * Or set both as env vars in .env instead of inline.
 */

const { ethers, upgrades } = require("hardhat");
require("dotenv").config({ override: true });

// contractName -> .env var prefix used for <PREFIX>_IMPLEMENTATION_ADDRESS_<chainId>
const CONTRACTS = {
  TokenizedPayable: "TP",
  BondToken: "BOND",
  ERC20TokenDSGD: "DSGD",
  PBMToken: "PBM",
  ERC20TokenRepo: "REPO",
  ERCTokenDVP: "DVP",
};

async function main() {
  const contractName = process.env.CONTRACT_NAME || "TokenizedPayable";
  const envPrefix = CONTRACTS[contractName];
  if (!envPrefix) {
    throw new Error(`Unknown CONTRACT_NAME "${contractName}". Expected one of: ${Object.keys(CONTRACTS).join(", ")}`);
  }

  const [deployer] = await ethers.getSigners();
  console.log("Upgrading from:", deployer.address);

  const proxyAddressesRaw = process.env.PROXY_ADDRESSES;
  if (!proxyAddressesRaw) {
    throw new Error("Set PROXY_ADDRESSES as a comma-separated list of proxy addresses to upgrade.");
  }
  const proxyAddresses = proxyAddressesRaw.split(",").map(a => a.trim()).filter(Boolean);
  console.log(`Upgrading ${proxyAddresses.length} ${contractName} proxy contract(s)...`);

  const newImplFactory = await ethers.getContractFactory(contractName);

  for (const proxyAddress of proxyAddresses) {
    console.log(`\nRegistering proxy at ${proxyAddress}...`);
    // forceImport registers a proxy that was deployed outside the OZ plugin manifest.
    // Safe to call even if already registered — it just re-imports.
    await upgrades.forceImport(proxyAddress, newImplFactory, { kind: "uups" });
    console.log(`  Registered.`);
  }

  // Validate storage compatibility against the first proxy (all share the same impl)
  await upgrades.validateUpgrade(proxyAddresses[0], newImplFactory, { kind: "uups" });
  console.log("Storage layout validation passed.");

  for (const proxyAddress of proxyAddresses) {
    console.log(`\nUpgrading proxy at ${proxyAddress}...`);
    const upgraded = await upgrades.upgradeProxy(proxyAddress, newImplFactory, { kind: "uups" });
    await upgraded.waitForDeployment();
    const newImpl = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log(`  Done. New implementation: ${newImpl}`);
  }

  const chainId = (await ethers.provider.getNetwork()).chainId;
  const finalImpl = await upgrades.erc1967.getImplementationAddress(proxyAddresses[0]);
  console.log("\n=== Upgrade complete ===");
  console.log(`Update in .env: ${envPrefix}_IMPLEMENTATION_ADDRESS_${chainId}=${finalImpl}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

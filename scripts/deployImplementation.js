/**
 * One-time script: deploys the implementation (logic) contract for one of the
 * UUPS-upgradeable contracts in server/app/contracts/.
 *
 * Run once per blockchain network per contract, then store the printed address in
 * .env as <ENVPREFIX>_IMPLEMENTATION_ADDRESS_<CHAINID>
 * (e.g. BOND_IMPLEMENTATION_ADDRESS_11155111).
 *
 * No constructor/initializer args are needed here — each proxy supplies its own
 * args when initialize() is called at proxy-deploy time.
 *
 * Usage:
 *   CONTRACT_NAME=TokenizedPayable npx hardhat run scripts/deployImplementation.js --network sepolia
 *   CONTRACT_NAME=BondToken npx hardhat run scripts/deployImplementation.js --network amoy
 *
 * CONTRACT_NAME defaults to TokenizedPayable if unset.
 *
 * After running, copy the printed implementation address into your .env file.
 * ABI/bytecode artifacts are already synced to server/app/abis and client/src/abis
 * by the hardhat.config.js compile hook that runs before this script's body executes
 * (hardhat run always compiles first) — no separate extraction step is needed here.
 */

const { ethers, upgrades } = require("hardhat");

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
  console.log("Deploying from:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  const factory = await ethers.getContractFactory(contractName);

  // deployImplementation deploys only the logic contract — no proxy, no initialize() call.
  // Each proxy will call initialize() separately with its own args.
  console.log(`Deploying ${contractName} implementation...`);
  const implAddress = await upgrades.deployImplementation(factory, { kind: "uups" });

  const chainId = (await ethers.provider.getNetwork()).chainId;

  console.log("\n=== Deployment complete ===");
  console.log("Contract:               ", contractName);
  console.log("Chain ID:               ", chainId.toString());
  console.log("Implementation address: ", implAddress);
  console.log("\nAdd to your .env file:");
  console.log(`${envPrefix}_IMPLEMENTATION_ADDRESS_${chainId}=${implAddress}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

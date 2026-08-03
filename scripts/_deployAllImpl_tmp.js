const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

const CONTRACTS = {
  BondToken: "BOND",
  ERC20TokenDSGD: "DSGD",
  PBMToken: "PBM",
  ERC20TokenRepo: "REPO",
  ERCTokenDVP: "DVP",
};

const ENV_PATH = path.join(__dirname, "../.env");

function updateEnvLine(key, value) {
  let content = fs.readFileSync(ENV_PATH, "utf8");
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(content)) {
    content = content.replace(re, `${key}=${value}`);
  } else {
    content += `\n${key}=${value}\n`;
  }
  fs.writeFileSync(ENV_PATH, content, "utf8");
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const net = await ethers.provider.getNetwork();
  const chainId = net.chainId.toString();
  console.log(`Deploying from ${deployer.address} on chainId ${chainId}`);

  for (const [contractName, envPrefix] of Object.entries(CONTRACTS)) {
    const factory = await ethers.getContractFactory(contractName);
    console.log(`\nDeploying ${contractName} implementation...`);
    const implAddress = await upgrades.deployImplementation(factory, { kind: "uups" });
    const envKey = `${envPrefix}_IMPLEMENTATION_ADDRESS_${chainId}`;
    updateEnvLine(envKey, implAddress);
    console.log(`  ${envKey}=${implAddress}  (written to .env)`);
  }

  console.log("\nAll implementations deployed for this network.");
}

main().catch((e) => { console.error(e.message); process.exit(1); });

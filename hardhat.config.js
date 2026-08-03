require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config();

const { task, subtask } = require("hardhat/config");
const { TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS } = require("hardhat/builtin-tasks/task-names");
const fs   = require("fs");
const path = require("path");

// Artifacts to sync after every compile.
// contractName is the Solidity contract name; destStem is the base filename used in server/client abis dirs.
const SYNC_ARTIFACTS = [
  {
    artifactPath: "artifacts/server/app/contracts/ERC1155Tokenised_Payable.sol/TokenizedPayable.json",
    destStem: "ERC1155Tokenised_Payable",
  },
  {
    artifactPath: "artifacts/server/app/contracts/ERC20TokenDSGD.sol/ERC20TokenDSGD.json",
    destStem: "ERC20TokenDSGD",
  },
  {
    artifactPath: "artifacts/@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol/ERC1967Proxy.json",
    destStem: "ERC1967Proxy",
  },
  {
    artifactPath: "artifacts/server/app/contracts/CrossChainRepoEscrow.sol/CrossChainRepoEscrow.json",
    destStem: "CrossChainRepoEscrow",
  },
];

const ABI_DIRS = [
  "server/app/abis",
  "client/src/abis",
];

function syncArtifacts() {
  let synced = 0;
  for (const { artifactPath, destStem } of SYNC_ARTIFACTS) {
    const full = path.resolve(artifactPath);
    if (!fs.existsSync(full)) {
      console.warn(`  [sync] Artifact not found, skipping: ${artifactPath}`);
      continue;
    }
    const artifact = JSON.parse(fs.readFileSync(full, "utf8"));
    for (const dir of ABI_DIRS) {
      const absDir = path.resolve(dir);
      if (!fs.existsSync(absDir)) continue;
      fs.writeFileSync(path.join(absDir, `${destStem}.abi.json`),      JSON.stringify(artifact.abi, null, 2));
      fs.writeFileSync(path.join(absDir, `${destStem}.bytecode.json`), JSON.stringify(artifact.bytecode));
    }
    synced++;
  }
  console.log(`  [sync] ${synced} artifact(s) synced to server/app/abis and client/src/abis`);
}

// Override the built-in compile task to sync artifacts afterwards.
task("compile", "Compiles contracts and syncs ABI/bytecode to server and client")
  .setAction(async (args, hre, runSuper) => {
    await runSuper(args);
    syncArtifacts();
  });

// Only compile the contracts needed for deployment scripts.
// All other contracts in server/app/contracts/ are legacy (OZ v4 style) and
// are not compiled by Hardhat — they are compiled by the server's solc at runtime.
const COMPILE_ONLY = [
  "ERC1155Tokenised_Payable.sol",
  "ERC20TokenDSGD.sol",
  "ERC1967ProxyHelper.sol",  // forces ERC1967Proxy artifact generation for server deployment
  "CrossChainRepoEscrow.sol",
];

subtask(TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS, async (_, __, runSuper) => {
  const paths = await runSuper();
  return paths.filter(p => COMPILE_ONLY.some(name => p.endsWith(name)));
});

module.exports = {
  solidity: {
    version: "0.8.26",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
      evmVersion: "cancun",
    },
  },
  paths: {
    sources: "./server/app/contracts",
    artifacts: "./artifacts",
    cache: "./cache",
  },
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://rpc2.sepolia.org",
      accounts: process.env.REACT_APP_SIGNER_PRIVATE_KEY
        ? [process.env.REACT_APP_SIGNER_PRIVATE_KEY.startsWith("0x")
            ? process.env.REACT_APP_SIGNER_PRIVATE_KEY
            : "0x" + process.env.REACT_APP_SIGNER_PRIVATE_KEY]
        : [],
    },
    amoy: {
      url: process.env.AMOY_RPC_URL || "https://rpc-amoy.polygon.technology",
      accounts: process.env.REACT_APP_SIGNER_PRIVATE_KEY
        ? [process.env.REACT_APP_SIGNER_PRIVATE_KEY.startsWith("0x")
            ? process.env.REACT_APP_SIGNER_PRIVATE_KEY
            : "0x" + process.env.REACT_APP_SIGNER_PRIVATE_KEY]
        : [],
    },
    fuji: {
      url: process.env.FUJI_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc",
      accounts: process.env.REACT_APP_SIGNER_PRIVATE_KEY
        ? [process.env.REACT_APP_SIGNER_PRIVATE_KEY.startsWith("0x")
            ? process.env.REACT_APP_SIGNER_PRIVATE_KEY
            : "0x" + process.env.REACT_APP_SIGNER_PRIVATE_KEY]
        : [],
    },
  },
};

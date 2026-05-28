/**
 * One-time script: deploys the TokenizedPayable implementation contract.
 *
 * Run once per blockchain network, then store the printed address in .env as
 * TP_IMPLEMENTATION_ADDRESS_<CHAINID> (e.g. TP_IMPLEMENTATION_ADDRESS_11155111).
 *
 * No deposit contract address is needed here — each project proxy supplies
 * its own underlying ERC20 address when initialize() is called at proxy deploy time.
 *
 * Usage:
 *   npx hardhat run scripts/deployImplementation.js --network sepolia
 *   npx hardhat run scripts/deployImplementation.js --network amoy
 *
 * After running, copy the printed implementation address into your .env file.
 */

const { ethers, upgrades } = require("hardhat");
const path = require("path");
const fs = require("fs");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying from:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  const TokenizedPayable = await ethers.getContractFactory("TokenizedPayable");

  // deployImplementation deploys only the logic contract — no proxy, no initialize() call.
  // Each project's proxy will call initialize() separately with its own depositContract address.
  console.log("Deploying implementation...");
  const implAddress = await upgrades.deployImplementation(TokenizedPayable, { kind: "uups" });

  const chainId = (await ethers.provider.getNetwork()).chainId;

  console.log("\n=== Deployment complete ===");
  console.log("Chain ID:              ", chainId.toString());
  console.log("Implementation address:", implAddress);
  console.log("\nAdd to your .env file:");
  console.log(`TP_IMPLEMENTATION_ADDRESS_${chainId}=${implAddress}`);

  // Copy ABI + proxy bytecode to server/app/abis/ for runtime use
  await extractArtifacts();
}

async function extractArtifacts() {
  const artifactsBase = path.join(__dirname, "../artifacts/server/app/contracts");
  const serverAbisDest = path.join(__dirname, "../server/app/abis");
  const clientAbisDest = path.join(__dirname, "../client/src/abis");

  // TokenizedPayable ABI — copied to both server and client
  const tpArtifactPath = path.join(artifactsBase, "ERC1155Tokenised_Payable.sol/TokenizedPayable.json");
  if (fs.existsSync(tpArtifactPath)) {
    const tpArtifact = JSON.parse(fs.readFileSync(tpArtifactPath, "utf8"));
    const tpAbi = JSON.stringify(tpArtifact.abi, null, 2);
    const tpBytecode = JSON.stringify(tpArtifact.bytecode);

    fs.writeFileSync(path.join(serverAbisDest, "ERC1155Tokenised_Payable.abi.json"), tpAbi);
    fs.writeFileSync(path.join(serverAbisDest, "ERC1155Tokenised_Payable.bytecode.json"), tpBytecode);
    console.log("Copied TokenizedPayable ABI + bytecode → server/app/abis/");

    fs.writeFileSync(path.join(clientAbisDest, "ERC1155Tokenised_Payable.abi.json"), tpAbi);
    fs.writeFileSync(path.join(clientAbisDest, "ERC1155Tokenised_Payable.bytecode.json"), tpBytecode);
    console.log("Copied TokenizedPayable ABI + bytecode → client/src/abis/");
  } else {
    console.warn("WARNING: TokenizedPayable artifact not found. Run `npx hardhat compile` first.");
  }

  // ERC1967Proxy ABI + bytecode — server only (client never deploys proxies)
  const proxyArtifactPath = path.join(
    __dirname,
    "../artifacts/@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol/ERC1967Proxy.json"
  );
  if (fs.existsSync(proxyArtifactPath)) {
    const proxyArtifact = JSON.parse(fs.readFileSync(proxyArtifactPath, "utf8"));
    fs.writeFileSync(path.join(serverAbisDest, "ERC1967Proxy.abi.json"), JSON.stringify(proxyArtifact.abi, null, 2));
    fs.writeFileSync(path.join(serverAbisDest, "ERC1967Proxy.bytecode.json"), JSON.stringify(proxyArtifact.bytecode));
    console.log("Copied ERC1967Proxy ABI + bytecode → server/app/abis/");
  } else {
    console.warn("WARNING: ERC1967Proxy artifact not found at expected path.");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

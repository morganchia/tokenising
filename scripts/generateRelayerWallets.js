/**
 * One-time helper: generates 3 fresh keypairs to use as the Cross-Chain DvP
 * relayer identities (2-of-3 multisig quorum).
 *
 * This does NOT deploy anything or touch any network — it only prints keys.
 * After running:
 *   1. Fund each printed address with testnet gas on Sepolia, Amoy, and Fuji.
 *   2. Copy the private keys into server/app/relayer/.env as
 *      RELAYER1_PRIVATE_KEY / RELAYER2_PRIVATE_KEY / RELAYER3_PRIVATE_KEY.
 *   3. Pass the 3 addresses into scripts/deployCrossChainRepoEscrow.js so they
 *      get registered as the contract's relayer set.
 *
 * Usage:
 *   node scripts/generateRelayerWallets.js
 */

const { Wallet } = require("ethers");

function main() {
  console.log("=== Cross-Chain DvP Relayer Wallets (2-of-3) ===\n");
  for (let i = 1; i <= 3; i++) {
    const wallet = Wallet.createRandom();
    console.log(`Relayer ${i}`);
    console.log(`  Address:     ${wallet.address}`);
    console.log(`  Private key: ${wallet.privateKey}`);
    console.log("");
  }
  console.log("Fund each address with testnet ETH (Sepolia), POL (Amoy), and AVAX (Fuji) before running the relayer.");
  console.log("Store the private keys in server/app/relayer/.env — do not commit them.");
}

main();

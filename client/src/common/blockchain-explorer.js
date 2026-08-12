// Shared block explorer link helper for transaction hashes, used by components
// outside the Cross Chain DvP feature (which has its own copy in crosschaindvp-constants.js).
export function explorerTxUrl(chainId, txHash) {
  const base = (() => {
    switch (parseInt(chainId, 10)) {
      case 80001: return 'https://mumbai.polygonscan.com/tx/';
      case 80002: return 'https://amoy.polygonscan.com/tx/';
      case 11155111: return 'https://sepolia.etherscan.io/tx/';
      case 43113: return 'https://testnet.snowtrace.io/tx/';
      case 137: return 'https://polygonscan.com/tx/';
      case 1: return 'https://etherscan.io/tx/';
      case 43114: return 'https://avascan.info/blockchain/all/tx/';
      default: return null;
    }
  })();
  return base ? base + txHash : null;
}

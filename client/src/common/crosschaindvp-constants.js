// CrossChainRepoEscrow is a long-lived contract deployed once per chain (unlike
// per-trade Repo contracts), so its address comes from build-time config, not the DB.
export function escrowAddressForChain(chainId) {
  switch (parseInt(chainId, 10)) {
    case 11155111: return process.env.REACT_APP_ESCROW_SEPOLIA_ADDRESS;
    case 80002: return process.env.REACT_APP_ESCROW_AMOY_ADDRESS;
    case 43113: return process.env.REACT_APP_ESCROW_FUJI_ADDRESS;
    default: return null;
  }
}

export function blockchainName(chainId) {
  switch (parseInt(chainId, 10)) {
    case 80001: return 'Polygon Testnet Mumbai (Deprecated)';
    case 80002: return 'Polygon Testnet Amoy';
    case 11155111: return 'Ethereum Testnet Sepolia';
    case 43113: return 'Avalanche Testnet Fuji';
    case 137: return 'Polygon Mainnet';
    case 1: return 'Ethereum Mainnet';
    case 43114: return 'Avalanche Mainnet';
    default: return null;
  }
}

export function explorerAddressUrl(chainId, address) {
  const base = (() => {
    switch (parseInt(chainId, 10)) {
      case 80001: return 'https://mumbai.polygonscan.com/address/';
      case 80002: return 'https://amoy.polygonscan.com/address/';
      case 11155111: return 'https://sepolia.etherscan.io/address/';
      case 43113: return 'https://testnet.snowtrace.io/address/';
      case 137: return 'https://polygonscan.com/address/';
      case 1: return 'https://etherscan.io/address/';
      case 43114: return 'https://avascan.info/blockchain/all/address/';
      default: return null;
    }
  })();
  return base ? base + address : null;
}

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

export const networkOptions = [
  { name: "Sepolia Ethereum Testnet", chainId: "0xaa36a7" }, // 11155111
  { name: "Amoy Polygon Testnet", chainId: "0x13882" }, // 80002
  { name: "Fuji Avalanche Testnet", chainId: "0xa869" }, // 43113
];

export const LEG_STATUS_LABELS = {
  0: "Not initiated",
  1: "Locked (awaiting relayer release)",
  2: "Tokens released, DvP completed",
};

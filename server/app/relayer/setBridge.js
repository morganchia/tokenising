const Web3 = require('web3');
require('dotenv').config();

async function main() {
  try {
    // Setup Web3 with Sepolia RPC
    const web3 = new Web3(process.env.SEPOLIA_RPC_URL);
    const account = web3.eth.accounts.privateKeyToAccount(process.env.ADMIN_PRIVATE_KEY);
    web3.eth.accounts.wallet.add(account);

    // Load WrappedCBDC ABI
    const wrappedAbi = require('../src/abis/WrappedCBDC.json').abi;
    const wrappedAddress = process.env.WRAPPEDCBDC_ADDRESS;
    const newBridgeAddress = process.argv[2]; // Pass new BridgeDestination address as argument

    if (!web3.utils.isAddress(wrappedAddress)) {
      throw new Error(`Invalid WrappedCBDC address: ${wrappedAddress}`);
    }
    if (!web3.utils.isAddress(newBridgeAddress)) {
      throw new Error(`Invalid BridgeDestination address: ${newBridgeAddress}`);
    }

    // Initialize WrappedCBDC contract
    const wrapped = new web3.eth.Contract(wrappedAbi, wrappedAddress);
    console.log(`Calling setBridge on WrappedCBDC at ${wrappedAddress}...`);
    console.log(`New BridgeDestination address: ${newBridgeAddress}`);

    // Estimate gas
    const gasEstimate = await wrapped.methods.setBridge(newBridgeAddress).estimateGas({ from: account.address });
    console.log(`Estimated gas: ${gasEstimate}`);

    // Send transaction
    const tx = await wrapped.methods.setBridge(newBridgeAddress).send({
      from: account.address,
      gas: Math.floor(gasEstimate * 1.2),
      maxPriorityFeePerGas: web3.utils.toWei('5', 'gwei'),
      maxFeePerGas: web3.utils.toWei('100', 'gwei')
    });

    console.log('setBridge successful. TxHash:', tx.transactionHash);
    console.log(`Updated WrappedCBDC bridge to: ${newBridgeAddress}`);
  } catch (error) {
    console.error('setBridge failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

main().catch(console.error);
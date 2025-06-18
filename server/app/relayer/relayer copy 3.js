require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const Web3 = require('web3');
const fs = require('fs');
const path = require('path');

// Load ABIs safely
let bridgeSourceAbi, bridgeDestAbi, wrappedAbi;
try {
  bridgeSourceAbi = require('../src/abis/BridgeSource.json').abi;
  bridgeDestAbi = require('../src/abis/BridgeDestination.json').abi;
  wrappedAbi = require('../src/abis/WrappedCBDC.json').abi;
} catch (err) {
  console.error(`Error loading ABIs: ${err.message}`);
  process.exit(1);
}

// Environment variables
const AMOY_WS_URL = process.env.AMOY_WS_URL;
const SEPOLIA_WS_URL = process.env.SEPOLIA_WS_URL;
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
const BRIDGE_SOURCE_ADDRESS = process.env.BRIDGE_SOURCE_ADDRESS;
const BRIDGE_DEST_ADDRESS = process.env.BRIDGE_DEST_ADDRESS;
const WRAPPED_ADDRESS = process.env.WRAPPEDCBDC_ADDRESS;

// Validate environment variables
const requiredEnvVars = {
  AMOY_WS_URL: AMOY_WS_URL,
  SEPOLIA_WS_URL: SEPOLIA_WS_URL,
  ADMIN_PRIVATE_KEY: ADMIN_PRIVATE_KEY,
  BRIDGE_SOURCE_ADDRESS: BRIDGE_SOURCE_ADDRESS,
  BRIDGE_DEST_ADDRESS: BRIDGE_DEST_ADDRESS,
  WRAPPED_ADDRESS: WRAPPED_ADDRESS,
};
for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (!value || value === '') {
    console.error(`Error: Environment variable ${key} is missing or empty`);
    process.exit(1);
  }
}
if (!Web3.utils.isAddress(BRIDGE_SOURCE_ADDRESS) || !Web3.utils.isAddress(BRIDGE_DEST_ADDRESS) || !Web3.utils.isAddress(WRAPPED_ADDRESS)) {
  console.error(`Error: Invalid contract address - BRIDGE_SOURCE_ADDRESS: ${BRIDGE_SOURCE_ADDRESS}, BRIDGE_DEST_ADDRESS: ${BRIDGE_DEST_ADDRESS}, WRAPPED_ADDRESS: ${WRAPPED_ADDRESS}`);
  process.exit(1);
}
if (!ADMIN_PRIVATE_KEY.startsWith('0x') || ADMIN_PRIVATE_KEY.length !== 66) {
  console.error('Error: Invalid ADMIN_PRIVATE_KEY format');
  process.exit(1);
}
console.log('Environment variables loaded:');
console.log(`  AMOY_WS_URL: ${AMOY_WS_URL}`);
console.log(`  SEPOLIA_WS_URL: ${SEPOLIA_WS_URL}`);
console.log(`  BRIDGE_SOURCE_ADDRESS: ${BRIDGE_SOURCE_ADDRESS}`);
console.log(`  BRIDGE_DEST_ADDRESS: ${BRIDGE_DEST_ADDRESS}`);
console.log(`  WRAPPED_ADDRESS: ${WRAPPED_ADDRESS}`);

// Initialize Web3
const amoyWeb3 = new Web3(new Web3.providers.WebsocketProvider(AMOY_WS_URL));
const sepoliaWeb3 = new Web3(new Web3.providers.WebsocketProvider(SEPOLIA_WS_URL));

// Setup admin account
const adminAccount = amoyWeb3.eth.accounts.privateKeyToAccount(ADMIN_PRIVATE_KEY);
amoyWeb3.eth.accounts.wallet.add(adminAccount);
sepoliaWeb3.eth.accounts.wallet.add(adminAccount);
console.log(`  ADMIN_ADDRESS: ${amoyWeb3.utils.toChecksumAddress(adminAccount.address)}`);

// Initialize contracts
const bridgeSource = new amoyWeb3.eth.Contract(bridgeSourceAbi, BRIDGE_SOURCE_ADDRESS);
const bridgeDest = new sepoliaWeb3.eth.Contract(bridgeDestAbi, BRIDGE_DEST_ADDRESS);
const wrappedCBDC = new sepoliaWeb3.eth.Contract(wrappedAbi, WRAPPED_ADDRESS);

// Processed transactions
const processedTxsPath = path.join(__dirname, 'processedTxs.json');
let processedTxs = new Set();
if (fs.existsSync(processedTxsPath)) {
  try {
    const data = fs.readFileSync(processedTxsPath);
    processedTxs = new Set(JSON.parse(data));
  } catch (err) {
    console.error(`Error loading processedTxs.json: ${err.message}`);
  }
}

const saveProcessedTxs = () => {
  try {
    fs.writeFileSync(processedTxsPath, JSON.stringify([...processedTxs], null, 2));
  } catch (err) {
    console.error(`Error saving processedTxs.json: ${err.message}`);
  }
};

// Retry transaction with increasing gas price
const withGasPriceRetry = async (web3, fn, maxRetries = 3, initialPriorityFeeGwei = 5, multiplier = 3) => {
  let attempt = 0;
  let priorityFee = web3.utils.toWei(initialPriorityFeeGwei.toString(), 'gwei');

  while (attempt < maxRetries) {
    try {
      return await fn(priorityFee);
    } catch (err) {
      attempt++;
      if (err.message.includes('transaction underpriced') && attempt < maxRetries) {
        priorityFee = (BigInt(priorityFee) * BigInt(multiplier)).toString();
        console.log(`🔄 Retry ${attempt}/${maxRetries} with maxPriorityFeePerGas: ${web3.utils.fromWei(priorityFee, 'gwei')} gwei`);
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        continue;
      }
      throw err;
    }
  }
};

// Monitor Locked events on Amoy
const monitorLockedEvents = async () => {
  console.log('Monitoring Locked events on Amoy...');
  bridgeSource.events.Locked({ fromBlock: 'latest' })
    .on('data', async (event) => {
      const { user, amount, destinationAddress } = event.returnValues;
      const txHash = event.transactionHash;

      if (processedTxs.has(txHash)) {
        console.log(`Skipping already processed Locked event: ${txHash}`);
        return;
      }

      console.log(`Detected Locked event: user=${user}, amount=${amount}, destination=${destinationAddress}, txHash=${txHash}`);

      try {
        // Validate inputs
        if (!sepoliaWeb3.utils.isAddress(destinationAddress)) {
          console.error(`Invalid destination address: ${destinationAddress}`);
          return;
        }
        if (BigInt(amount) <= 0) {
          console.error(`Invalid amount: ${amount}`);
          return;
        }

        // Check WrappedCBDC bridge address
        let bridgeAddress;
        try {
          bridgeAddress = await wrappedCBDC.methods.bridge().call();
          console.log(`WrappedCBDC bridge address: ${bridgeAddress}`);
          if (bridgeAddress.toLowerCase() !== BRIDGE_DEST_ADDRESS.toLowerCase()) {
            console.error(`Bridge address mismatch: WrappedCBDC expects ${bridgeAddress}, expected ${BRIDGE_DEST_ADDRESS}`);
            return;
          }
        } catch (err) {
          console.error(`Error checking WrappedCBDC bridge address: ${err.message}`);
          return;
        }

        // Simulate mint call
        try {
          await bridgeDest.methods.mint(destinationAddress, amount).call({ from: adminAccount.address });
          console.log('Mint simulation successful');
        } catch (callErr) {
          console.error(`Mint simulation failed: ${callErr.message}`, {
            destinationAddress,
            amount: sepoliaWeb3.utils.fromWei(amount, 'ether'),
            caller: adminAccount.address,
            bridgeContract: BRIDGE_DEST_ADDRESS,
            wrappedCBDC: WRAPPED_ADDRESS
          });
          return;
        }

        // Estimate gas
        let gasEstimate;
        try {
          gasEstimate = await bridgeDest.methods.mint(destinationAddress, amount).estimateGas({ from: adminAccount.address });
          console.log(`Estimated gas for mint: ${gasEstimate}`);
        } catch (gasErr) {
          console.error(`Gas estimation failed: ${gasErr.message}`);
          return;
        }

        // Execute mint
        const mintTx = await withGasPriceRetry(sepoliaWeb3, async (priorityFee) => {
          const gasPrice = await sepoliaWeb3.eth.getGasPrice();
          const maxFeePerGas = (BigInt(gasPrice) + BigInt(priorityFee)).toString();
          const gasLimit = Math.floor(Number(gasEstimate) * 1.5);
          const nonce = await sepoliaWeb3.eth.getTransactionCount(adminAccount.address, 'pending');

          console.log(`Minting ${sepoliaWeb3.utils.fromWei(amount, 'ether')} wrCBDC to ${destinationAddress} with gasLimit=${gasLimit}, maxPriorityFeePerGas=${sepoliaWeb3.utils.fromWei(priorityFee, 'gwei')} gwei, maxFeePerGas=${sepoliaWeb3.utils.fromWei(maxFeePerGas, 'gwei')} gwei, nonce=${nonce}`);

          return await bridgeDest.methods.mint(destinationAddress, amount).send({
            from: adminAccount.address,
            gas: gasLimit,
            maxPriorityFeePerGas: priorityFee,
            maxFeePerGas,
            nonce
          });
        });

        console.log(`Minted ${sepoliaWeb3.utils.fromWei(amount, 'ether')} wrCBDC to ${destinationAddress} on Sepolia. TxHash: ${mintTx.transactionHash}`);
        processedTxs.add(txHash);
        saveProcessedTxs();
      } catch (err) {
        console.error(`Error processing Locked event: ${err.message}`, {
          user,
          amount: sepoliaWeb3.utils.fromWei(amount, 'ether'),
          destinationAddress,
          txHash,
          errorDetails: err
        });
      }
    })
    .on('error', (err) => {
      console.error(`Error in Locked event subscription: ${err.message}`);
    });
};

// Monitor Burned events on Sepolia
const monitorBurnedEvents = async () => {
  console.log('Monitoring Burned events on Sepolia...');
  bridgeDest.events.Burned({ fromBlock: 'latest' })
    .on('data', async (event) => {
      const { user, amount, destinationAddress, nonce } = event.returnValues;
      const txHash = event.transactionHash;

      if (processedTxs.has(txHash)) {
        console.log(`Skipping already processed Burned event: ${txHash}`);
        return;
      }

      console.log(`Detected Burned event: user=${user}, amount=${amount}, destination=${destinationAddress}, nonce=${nonce}, txHash=${txHash}`);

      try {
        // Step 1: Unlock on Amoy
        const unlockGasEstimate = await bridgeSource.methods.unlock(destinationAddress, amount).estimateGas({ from: adminAccount.address });
        console.log(`Estimated gas for unlock: ${unlockGasEstimate}`);

        const unlockTx = await withGasPriceRetry(amoyWeb3, async (priorityFee) => {
          const gasPrice = await amoyWeb3.eth.getGasPrice();
          const maxFeePerGas = (BigInt(gasPrice) + BigInt(priorityFee)).toString();
          const gasLimit = Math.floor(Number(unlockGasEstimate) * 1.5);
          const nonceTx = await amoyWeb3.eth.getTransactionCount(adminAccount.address, 'pending');

          return await bridgeSource.methods.unlock(destinationAddress, amount).send({
            from: adminAccount.address,
            gas: gasLimit,
            maxPriorityFeePerGas: priorityFee,
            maxFeePerGas,
            nonce: nonceTx
          });
        });

        console.log(`Unlocked ${amount} CBDC to ${destinationAddress} on Amoy. TxHash: ${unlockTx.transactionHash}`);

        // Step 2: Confirm burn on Sepolia
        const confirmBurnGasEstimate = await bridgeDest.methods.confirmBurn(user, amount, nonce).estimateGas({ from: adminAccount.address });
        console.log(`Estimated gas for confirmBurn: ${confirmBurnGasEstimate}`);

        const confirmBurnTx = await withGasPriceRetry(sepoliaWeb3, async (priorityFee) => {
          const gasPrice = await sepoliaWeb3.eth.getGasPrice();
          const maxFeePerGas = (BigInt(gasPrice) + BigInt(priorityFee)).toString();
          const gasLimit = Math.floor(Number(confirmBurnGasEstimate) * 1.5);
          const nonceTx = await sepoliaWeb3.eth.getTransactionCount(adminAccount.address, 'pending');

          return await bridgeDest.methods.confirmBurn(user, amount, nonce).send({
            from: adminAccount.address,
            gas: gasLimit,
            maxPriorityFeePerGas: priorityFee,
            maxFeePerGas,
            nonce: nonceTx
          });
        });

        console.log(`Confirmed burn for ${amount} wrCBDC for ${user} on Sepolia. TxHash: ${confirmBurnTx.transactionHash}`);
        processedTxs.add(txHash);
        saveProcessedTxs();
      } catch (err) {
        console.error(`Error processing Burned event: ${err.message}`);
      }
    })
    .on('error', (err) => {
      console.error(`Error in Burned event subscription: ${err.message}`);
    });
};

// Start relayer
const startRelayer = async () => {
  console.log('Starting relayer...');
  try {
    // Check admin account balance
    let amoyBalance, sepoliaBalance;
    try {
      amoyBalance = await amoyWeb3.eth.getBalance(adminAccount.address);
      sepoliaBalance = await sepoliaWeb3.eth.getBalance(adminAccount.address);
    } catch (err) {
      console.warn(`Error checking balances: ${err.message}`);
      amoyBalance = sepoliaBalance = '0';
    }
    console.log(`Admin account balance - Amoy: ${amoyWeb3.utils.fromWei(amoyBalance, 'ether')} POL, Sepolia: ${sepoliaWeb3.utils.fromWei(sepoliaBalance, 'ether')} ETH`);

    if (amoyWeb3.utils.toBN(amoyBalance).lt(amoyWeb3.utils.toBN(amoyWeb3.utils.toWei('0.1', 'ether')))) {
      console.warn('Warning: Amoy balance below 0.1 POL. Fund the account to ensure relayer operations.');
    }
    if (sepoliaWeb3.utils.toBN(sepoliaBalance).lt(sepoliaWeb3.utils.toBN(sepoliaWeb3.utils.toWei('0.1', 'ether')))) {
      console.warn('Warning: Sepolia balance below 0.1 ETH. Fund the account to ensure relayer operations.');
    }

    // Verify WrappedCBDC configuration
    try {
      const wrappedAddress = await bridgeDest.methods.wrappedCBDC().call();
      console.log(`BridgeDestination WrappedCBDC address: ${wrappedAddress}`);
      if (wrappedAddress.toLowerCase() !== WRAPPED_ADDRESS.toLowerCase()) {
        console.error(`Mismatch in WrappedCBDC address: BridgeDestination expects ${wrappedAddress}, .env has ${WRAPPED_ADDRESS}`);
        process.exit(1);
      }
    } catch (err) {
      console.error(`Error verifying WrappedCBDC address: ${err.message}`);
    }

    monitorLockedEvents();
    monitorBurnedEvents();
  } catch (err) {
    console.error('Relayer startup error:', err.message);
    process.exit(1);
  }
};

startRelayer();
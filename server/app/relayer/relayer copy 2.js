console.log('Starting relayer.js');

try {
  console.log('Loading modules...');
  const Web3 = require('web3');
  const dotenv = require('dotenv');
  console.log('Modules loaded successfully');

  console.log('Loading .env file...');
  const envResult = dotenv.config();
  if (envResult.error) {
    console.error('❌ Failed to load .env file:', envResult.error.message);
    process.exit(1);
  }
  console.log('✅ .env file loaded');

  console.log('Checking .env variables...');
  const AMOY_WS_URL = process.env.AMOY_WS_URL;
  const SEPOLIA_WS_URL = process.env.SEPOLIA_WS_URL;
  const BRIDGE_SOURCE_ADDRESS = process.env.BRIDGE_SOURCE_ADDRESS;
  const BRIDGE_DEST_ADDRESS = process.env.BRIDGE_DEST_ADDRESS;
  const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
  const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS;
  const WRAPPEDCBDC_ADDRESS = process.env.WRAPPEDCBDC_ADDRESS;
  const CBDC_ADDRESS = process.env.CBDC_ADDRESS;

  if (!AMOY_WS_URL || !SEPOLIA_WS_URL || !BRIDGE_SOURCE_ADDRESS || !BRIDGE_DEST_ADDRESS || !ADMIN_PRIVATE_KEY || !ADMIN_ADDRESS || !WRAPPEDCBDC_ADDRESS || !CBDC_ADDRESS) {
    console.error('❌ Missing environment variables. Check your .env file.');
    console.error('Required variables:', {
      AMOY_WS_URL: !!AMOY_WS_URL,
      SEPOLIA_WS_URL: !!SEPOLIA_WS_URL,
      BRIDGE_SOURCE_ADDRESS: !!BRIDGE_SOURCE_ADDRESS,
      BRIDGE_DEST_ADDRESS: !!BRIDGE_DEST_ADDRESS,
      ADMIN_PRIVATE_KEY: !!ADMIN_PRIVATE_KEY,
      ADMIN_ADDRESS: !!ADMIN_ADDRESS,
      WRAPPEDCBDC_ADDRESS: !!WRAPPEDCBDC_ADDRESS,
      CBDC_ADDRESS: !!CBDC_ADDRESS
    });
    process.exit(1);
  }
  console.log('✅ Environment variables validated:', {
    AMOY_WS_URL,
    SEPOLIA_WS_URL,
    BRIDGE_SOURCE_ADDRESS,
    BRIDGE_DEST_ADDRESS,
    ADMIN_ADDRESS,
    WRAPPEDCBDC_ADDRESS,
    CBDC_ADDRESS
  });

  console.log('Loading ABIs...');
  const bridgeSourceAbi = require('../src/abis/BridgeSource.json');
  const bridgeDestAbi = require('../src/abis/BridgeDestination.json');
  const wrappedAbi = require('../src/abis/WrappedCBDC.json');
  const cbdcAbi = require('../src/abis/CBDC.json');
  console.log('✅ ABIs loaded');

  console.log('Initializing Web3 instances...');
  const amoyWeb3 = new Web3(new Web3.providers.WebsocketProvider(AMOY_WS_URL));
  const sepoliaWeb3 = new Web3(new Web3.providers.WebsocketProvider(SEPOLIA_WS_URL));
  console.log('✅ Web3 initialized. Version:', amoyWeb3.version);

  console.log('Initializing contracts...');
  const bridgeSource = new amoyWeb3.eth.Contract(bridgeSourceAbi.abi, BRIDGE_SOURCE_ADDRESS);
  const bridgeDest = new sepoliaWeb3.eth.Contract(bridgeDestAbi.abi, BRIDGE_DEST_ADDRESS);
  const wrappedToken = new sepoliaWeb3.eth.Contract(wrappedAbi.abi, WRAPPEDCBDC_ADDRESS);
  const cbdcToken = new amoyWeb3.eth.Contract(cbdcAbi.abi, CBDC_ADDRESS);
  console.log('✅ Contracts initialized');

  console.log('Setting up admin account...');
  const account = amoyWeb3.eth.accounts.privateKeyToAccount(ADMIN_PRIVATE_KEY);
  amoyWeb3.eth.accounts.wallet.add(account);
  amoyWeb3.eth.defaultAccount = account.address;
  sepoliaWeb3.eth.accounts.wallet.add(account);
  sepoliaWeb3.eth.defaultAccount = account.address;
  console.log('✅ Admin account set up:', account.address);

  // Track processed transaction hashes to avoid duplicates
  const processedTxs = new Set();

  async function withGasPriceRetry(fn, web3Instance, maxRetries = 3, initialPriorityFeeGwei = 5, multiplier = 3) {
    let attempt = 0;
    let priorityFee = web3Instance.utils.toWei(initialPriorityFeeGwei.toString(), 'gwei');
    
    while (attempt < maxRetries) {
      try {
        return await fn(priorityFee);
      } catch (err) {
        attempt++;
        if (err.message.includes('transaction underpriced') && attempt < maxRetries) {
          priorityFee = (BigInt(priorityFee) * BigInt(multiplier)).toString();
          console.log(`🔄 Retry ${attempt}/${maxRetries} with maxPriorityFeePerGas: ${web3Instance.utils.fromWei(priorityFee, 'gwei')} gwei`);
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
          continue;
        }
        throw err;
      }
    }
  }

  async function subscribeToLockedEvents() {
    console.log('🔁 Starting subscription for Locked events...');
    try {
      const sourceCode = await amoyWeb3.eth.getCode(BRIDGE_SOURCE_ADDRESS);
      if (!sourceCode || sourceCode === '0x') {
        console.error(`❌ No contract found at ${BRIDGE_SOURCE_ADDRESS}`);
        return;
      }
      console.log('✅ BridgeSource contract verified');

      let bridgeAddress;
      try {
        bridgeAddress = await wrappedToken.methods.bridge().call({ from: account.address }).catch(() => {
          console.log('🔍 No bridgeAddress method in WrappedCBDC (may use custom onlyBridge modifier)');
          return null;
        });
        if (bridgeAddress) console.log(`🔍 WrappedCBDC bridge: ${bridgeAddress}`);
      } catch (err) {
        console.error('❌ Error fetching WrappedCBDC bridge:', err.message);
      }

      let bridgeDestWrappedCBDC;
      try {
        bridgeDestWrappedCBDC = await bridgeDest.methods.wrappedCBDC().call();
        console.log(`🔍 BridgeDestination wrappedCBDC: ${bridgeDestWrappedCBDC}`);
      } catch (err) {
        console.error('❌ Error fetching BridgeDestination wrappedCBDC:', err.message);
      }

      if (bridgeDestWrappedCBDC && bridgeDestWrappedCBDC !== WRAPPEDCBDC_ADDRESS) {
        console.error(`❌ Mismatch: BridgeDestination wrappedCBDC (${bridgeDestWrappedCBDC}) does not match WRAPPEDCBDC_ADDRESS (${WRAPPEDCBDC_ADDRESS})`);
      }

      const lockedEventAbi = bridgeSourceAbi.abi.find(e => e.name === 'Locked');
      const eventSignature = amoyWeb3.eth.abi.encodeEventSignature(lockedEventAbi);
      console.log(`🔍 Listening for Locked event with topic: ${eventSignature}`);

      const subscription = amoyWeb3.eth.subscribe('logs', {
        address: BRIDGE_SOURCE_ADDRESS,
        topics: [eventSignature]
      }, async (error, log) => {
        if (error) {
          console.error('❌ Subscription error for Locked event:', error.message);
          return;
        }

        try {
          const txHash = log.transactionHash;
          if (processedTxs.has(txHash)) {
            console.log(`🔍 Skipping already processed Locked event for txHash: ${txHash}`);
            return;
          }

          const decodedLog = amoyWeb3.eth.abi.decodeLog(
            lockedEventAbi.inputs,
            log.data,
            log.topics.slice(1)
          );
          const { user, amount, destinationAddress } = decodedLog;
          console.log(`🔔 Detected Locked event - Preparing to mint ${amount} wrCBDC to ${destinationAddress} for user ${user}`);

          await new Promise(resolve => setTimeout(resolve, 5000));

          try {
            // Estimate gas for mint
            const mintGasEstimate = await bridgeDest.methods.mint(destinationAddress, amount).estimateGas({ from: account.address }).catch(err => {
              throw new Error(`Gas estimation for mint failed: ${err.message}`);
            });
            console.log(`Estimated gas for mint: ${mintGasEstimate}`);

            // Execute mint with retry
            const mintResult = await withGasPriceRetry(async (priorityFee) => {
              const gasPrice = await sepoliaWeb3.eth.getGasPrice();
              const maxFeePerGas = (BigInt(gasPrice) + BigInt(priorityFee)).toString();
              const gasLimit = Math.floor(Number(mintGasEstimate) * 1.5);
              const nonce = await sepoliaWeb3.eth.getTransactionCount(account.address, 'pending');

              const tx = await bridgeDest.methods.mint(destinationAddress, amount).send({
                from: account.address,
                gas: gasLimit,
                maxPriorityFeePerGas: priorityFee,
                maxFeePerGas,
                nonce
              });
              return tx;
            }, sepoliaWeb3, 3, 5, 3);

            console.log('✅ Mint successful. TxHash:', mintResult.transactionHash);
            processedTxs.add(txHash);
          } catch (mintErr) {
            console.error(`❌ Minting failed for ${amount} wrCBDC to ${destinationAddress}:`, mintErr.message);
            processedTxs.add(txHash);
          }
        } catch (decodeErr) {
          console.error('❌ Error decoding Locked event log:', decodeErr.message);
        }
      });

      subscription.on('connected', (subscriptionId) => {
        console.log(`✅ Locked event subscription connected: ${subscriptionId}`);
      });

      subscription.on('error', (error) => {
        console.error('❌ Locked event subscription error:', error.message);
        setTimeout(() => {
          console.log('🔁 Attempting to resubscribe to Locked events...');
          subscribeToLockedEvents();
        }, 10000);
      });
    } catch (err) {
      console.error('❌ Setup error for Locked events:', err.message);
      setTimeout(subscribeToLockedEvents, 10000);
    }
  }

  async function subscribeToBurnedEvents() {
    console.log('🔁 Starting subscription for Burned events...');
    try {
      const destCode = await sepoliaWeb3.eth.getCode(BRIDGE_DEST_ADDRESS);
      if (!destCode || destCode === '0x') {
        console.error(`❌ No contract found at ${BRIDGE_DEST_ADDRESS}`);
        return;
      }
      console.log('✅ BridgeDestination contract verified');

      let bridgeSourceCBDC;
      try {
        bridgeSourceCBDC = await bridgeSource.methods.cbdc().call();
        console.log(`🔍 BridgeSource CBDC: ${bridgeSourceCBDC}`);
      } catch (err) {
        console.error('❌ Error fetching BridgeSource CBDC:', err.message);
      }

      if (bridgeSourceCBDC && bridgeSourceCBDC !== CBDC_ADDRESS) {
        console.error(`❌ Mismatch: BridgeSource CBDC (${bridgeSourceCBDC}) does not match CBDC_ADDRESS (${CBDC_ADDRESS}). Please update BridgeSource smart contract or .env.`);
      }

      const burnedEventAbi = bridgeDestAbi.abi.find(e => e.name === 'Burned');
      const eventSignature = sepoliaWeb3.eth.abi.encodeEventSignature(burnedEventAbi);
      console.log(`🔍 Listening for Burned event with topic: ${eventSignature}`);

      const subscription = sepoliaWeb3.eth.subscribe('logs', {
        address: BRIDGE_DEST_ADDRESS,
        topics: [eventSignature]
      }, async (error, log) => {
        if (error) {
          console.error('❌ Subscription error for Burned event:', error.message);
          return;
        }

        try {
          const txHash = log.transactionHash;
          if (processedTxs.has(txHash)) {
            console.log(`🔍 Skipping already processed Burned event for txHash: ${txHash}`);
            return;
          }

          const decodedLog = sepoliaWeb3.eth.abi.decodeLog(
            burnedEventAbi.inputs,
            log.data,
            log.topics.slice(1)
          );
          const { user, amount, destinationAddress } = decodedLog;
          console.log(`🔔 Detected Burned event - Preparing to unlock ${amount} CBDC to ${destinationAddress} for user ${user}`);

          await new Promise(resolve => setTimeout(resolve, 5000));

          // Estimate gas for all steps upfront
          let unlockGasEstimate, confirmGasEstimate;
          try {
            unlockGasEstimate = await bridgeSource.methods.unlock(destinationAddress, amount).estimateGas({ from: account.address });
            console.log(`Estimated gas for unlock: ${unlockGasEstimate}`);
            confirmGasEstimate = await bridgeDest.methods.confirmBurn(user, amount).estimateGas({ from: account.address });
            console.log(`Estimated gas for confirmBurn: ${confirmGasEstimate}`);
          } catch (gasErr) {
            console.error(`❌ Gas estimation failed for unlock or confirmBurn:`, gasErr.message);
            processedTxs.add(txHash);
            return;
          }

          let unlockTxHash;
          try {
            // Execute unlock with retry
            const unlockResult = await withGasPriceRetry(async (priorityFee) => {
              const gasPrice = await amoyWeb3.eth.getGasPrice();
              const maxFeePerGas = (BigInt(gasPrice) + BigInt(priorityFee)).toString();
              const gasLimit = Math.floor(Number(unlockGasEstimate) * 1.5);
              const nonce = await amoyWeb3.eth.getTransactionCount(account.address, 'pending');

              const tx = await bridgeSource.methods.unlock(destinationAddress, amount).send({
                from: account.address,
                gas: gasLimit,
                maxPriorityFeePerGas: priorityFee,
                maxFeePerGas,
                nonce
              });
              return tx;
            }, amoyWeb3, 3, 5, 3);

            unlockTxHash = unlockResult.transactionHash;
            console.log('✅ Unlock successful. TxHash:', unlockTxHash);
          } catch (unlockErr) {
            console.error(`❌ Unlocking failed for ${amount} CBDC to ${destinationAddress} after retries:`, unlockErr.message);
            processedTxs.add(txHash);
            return;
          }

          // Confirm burn on Sepolia
          try {
            // Execute confirmBurn with retry
            const confirmResult = await withGasPriceRetry(async (priorityFee) => {
              const gasPrice = await sepoliaWeb3.eth.getGasPrice();
              const maxFeePerGas = (BigInt(gasPrice) + BigInt(priorityFee)).toString();
              const gasLimit = Math.floor(Number(confirmGasEstimate) * 1.5);
              const nonce = await sepoliaWeb3.eth.getTransactionCount(account.address, 'pending');

              const tx = await bridgeDest.methods.confirmBurn(user, amount).send({
                from: account.address,
                gas: gasLimit,
                maxPriorityFeePerGas: priorityFee,
                maxFeePerGas,
                nonce
              });
              return tx;
            }, sepoliaWeb3, 3, 5, 3);

            console.log('✅ Burn confirmed. TxHash:', confirmResult.transactionHash);
            processedTxs.add(txHash);
          } catch (confirmErr) {
            console.error(`❌ Confirm burn failed for ${amount} wrCBDC from contract after retries:`, confirmErr.message);
            processedTxs.add(txHash);
            console.log('🛑 Aborting process without minting wrCBDC back to user. Tokens remain in BridgeDestination contract.');
          }
        } catch (decodeErr) {
          console.error('❌ Error decoding Burned event log:', decodeErr.message);
        }
      });

      subscription.on('connected', (subscriptionId) => {
        console.log(`✅ Burned event subscription connected: ${subscriptionId}`);
      });

      subscription.on('error', (error) => {
        console.error('❌ Burned event subscription error:', error.message);
        setTimeout(() => {
          console.log('🔁 Attempting to resubscribe to Burned events...');
          subscribeToBurnedEvents();
        }, 10000);
      });
    } catch (err) {
      console.error('❌ Setup error for Burned events:', err.message);
      setTimeout(subscribeToBurnedEvents, 10000);
    }
  }

  console.log('Starting subscriptions...');
  subscribeToLockedEvents();
  subscribeToBurnedEvents();
  console.log('✅ Subscriptions started');

  setInterval(() => {}, 1 << 30);
} catch (err) {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
}
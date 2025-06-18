console.log('Starting relayer.js');

try {
  console.log('Loading modules...');
  const Web3 = require('web3');
  const dotenv = require('dotenv');
  const fs = require('fs');
  const path = require('path');
  console.log('Modules loaded successfully');

  console.log('Loading .env file...');
  const envResult = dotenv.config();
  if (envResult.error) {
    console.error('❌ Failed to load .env file:', envResult.error.message);
    process.exit(1);
  }
  console.log('✅ .env file loaded');

  console.log('Checking .env variables...');
  const AMOY_WS_URL = 'wss://polygon-amoy.g.alchemy.com/v2/CNOHnfdRQl84h31T1nocixqRw1w2brDI'; // WebSocket for Amoy
  const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
  const BRIDGE_SOURCE_ADDRESS = process.env.BRIDGE_SOURCE_ADDRESS;
  const BRIDGE_DEST_ADDRESS = process.env.BRIDGE_DEST_ADDRESS;
  const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
  const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS;
  const WRAPPEDCBDC_ADDRESS = process.env.WRAPPEDCBDC_ADDRESS;

  if (!AMOY_WS_URL || !SEPOLIA_RPC_URL || !BRIDGE_SOURCE_ADDRESS || !BRIDGE_DEST_ADDRESS || !ADMIN_PRIVATE_KEY || !ADMIN_ADDRESS || !WRAPPEDCBDC_ADDRESS) {
    console.error('❌ Missing environment variables. Check your .env file.');
    console.error('Required variables:', {
      AMOY_WS_URL: !!AMOY_WS_URL,
      SEPOLIA_RPC_URL: !!SEPOLIA_RPC_URL,
      BRIDGE_SOURCE_ADDRESS: !!BRIDGE_SOURCE_ADDRESS,
      BRIDGE_DEST_ADDRESS: !!BRIDGE_DEST_ADDRESS,
      ADMIN_PRIVATE_KEY: !!ADMIN_PRIVATE_KEY,
      ADMIN_ADDRESS: !!ADMIN_ADDRESS,
      WRAPPEDCBDC_ADDRESS: !!WRAPPEDCBDC_ADDRESS
    });
    process.exit(1);
  }
  console.log('✅ Environment variables validated:', {
    AMOY_WS_URL,
    SEPOLIA_RPC_URL,
    BRIDGE_SOURCE_ADDRESS,
    BRIDGE_DEST_ADDRESS,
    ADMIN_ADDRESS,
    WRAPPEDCBDC_ADDRESS
  });

  console.log('Loading ABIs...');
  const bridgeSourceAbi = require('../src/abis/BridgeSource.json');
  const bridgeDestAbi = require('../src/abis/BridgeDestination.json');
  const wrappedAbi = require('../src/abis/WrappedCBDC.json');
  console.log('✅ ABIs loaded');

  console.log('Initializing Web3 instances...');
  const amoyWeb3 = new Web3(new Web3.providers.WebsocketProvider(AMOY_WS_URL));
  const sepoliaWeb3 = new Web3(SEPOLIA_RPC_URL);
  console.log('✅ Web3 initialized. Version:', amoyWeb3.version);

  console.log('Initializing contracts...');
  const bridgeSource = new amoyWeb3.eth.Contract(bridgeSourceAbi.abi, BRIDGE_SOURCE_ADDRESS);
  const bridgeDest = new sepoliaWeb3.eth.Contract(bridgeDestAbi.abi, BRIDGE_DEST_ADDRESS);
  const wrappedToken = new sepoliaWeb3.eth.Contract(wrappedAbi.abi, WRAPPEDCBDC_ADDRESS);
  console.log('✅ Contracts initialized');

  console.log('Setting up admin account...');
  const account = sepoliaWeb3.eth.accounts.privateKeyToAccount(ADMIN_PRIVATE_KEY);
  sepoliaWeb3.eth.accounts.wallet.add(account);
  sepoliaWeb3.eth.defaultAccount = account.address;
  console.log('✅ Admin account set up:', account.address);

  // Track processed transaction hashes to avoid duplicates
  const processedTxs = new Set();

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

      // Calculate the event topic for Locked event
      const lockedEventAbi = bridgeSourceAbi.abi.find(e => e.name === 'Locked');
      const eventSignature = amoyWeb3.eth.abi.encodeEventSignature(lockedEventAbi);
      console.log(`🔍 Listening for Locked event with topic: ${eventSignature}`);

      // Subscribe to logs for the Locked event
      const subscription = amoyWeb3.eth.subscribe('logs', {
        address: BRIDGE_SOURCE_ADDRESS,
        topics: [eventSignature]
      }, async (error, log) => {
        if (error) {
          console.error('❌ Subscription error:', error.message);
          return;
        }

        try {
          const txHash = log.transactionHash;
          if (processedTxs.has(txHash)) {
            console.log(`🔍 Skipping already processed event for txHash: ${txHash}`);
            return;
          }

          // Decode the event log
          const decodedLog = amoyWeb3.eth.abi.decodeLog(
            lockedEventAbi.inputs,
            log.data,
            log.topics.slice(1)
          );
          const { user, amount, destinationAddress } = decodedLog;
          console.log(`🔔 Detected Lock event - Minting ${amount} wrCBDC to ${destinationAddress} for user ${user}`);

          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 5000)); // 5-second delay

          try {
            if (bridgeAddress && bridgeAddress.toLowerCase() !== BRIDGE_DEST_ADDRESS.toLowerCase()) {
              console.warn(`⚠️ BridgeDestination (${BRIDGE_DEST_ADDRESS}) does not match WrappedCBDC bridge (${bridgeAddress}). Minting may fail.`);
            }

            const gasPrice = await sepoliaWeb3.eth.getGasPrice();
            const maxPriorityFeePerGas = sepoliaWeb3.utils.toWei('5', 'gwei');
            const maxFeePerGas = (BigInt(gasPrice) + BigInt(maxPriorityFeePerGas)).toString();
            const gasEstimate = await bridgeDest.methods.mint(destinationAddress, amount).estimateGas({ from: account.address });
            const gasLimit = Math.floor(Number(gasEstimate) * 1.2);
            const nonce = await sepoliaWeb3.eth.getTransactionCount(account.address, 'pending');

            const tx = await bridgeDest.methods.mint(destinationAddress, amount).send({
              from: account.address,
              gas: gasLimit,
              maxPriorityFeePerGas,
              maxFeePerGas,
              nonce
            });
            console.log('✅ Mint successful. TxHash:', tx.transactionHash);
            processedTxs.add(txHash);
          } catch (mintErr) {
            console.error(`❌ Minting failed for ${amount} wrCBDC to ${destinationAddress}:`, mintErr.message);
            if (mintErr.message.includes('Too Many Requests')) {
              console.log('🔍 Rate limit hit, waiting before retry...');
              await new Promise(resolve => setTimeout(resolve, 10000)); // 10-second backoff
            }
          }
        } catch (decodeErr) {
          console.error('❌ Error decoding log:', decodeErr.message);
        }
      });

      subscription.on('connected', (subscriptionId) => {
        console.log(`✅ Subscription connected: ${subscriptionId}`);
      });

      subscription.on('error', (error) => {
        console.error('❌ Subscription error:', error.message);
        // Attempt to resubscribe after a delay
        setTimeout(() => {
          console.log('🔁 Attempting to resubscribe...');
          subscribeToLockedEvents();
        }, 10000);
      });
    } catch (err) {
      console.error('❌ Setup error:', err.message);
      setTimeout(subscribeToLockedEvents, 10000);
    }
  }

  console.log('Starting subscription...');
  subscribeToLockedEvents();
  console.log('✅ Subscription started');

  // Keep the process alive
  setInterval(() => {}, 1 << 30);
} catch (err) {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
}
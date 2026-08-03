/**
 * Cross Chain DvP relayer — one of 3 independent relayer identities forming a
 * 2-of-3 quorum (see server/app/contracts/CrossChainRepoEscrow.sol).
 *
 * Unlike relayer.js (which relays a single lock-mint CBDC bridge between exactly
 * two chains with one admin key), this relayer:
 *   - watches all 3 configured chains (Sepolia, Amoy, Fuji),
 *   - on a Locked event for a given legId on chain X, checks the OTHER two chains'
 *     escrow contracts for a matching Locked leg (same legId),
 *   - if found on chain Y, submits confirmRelease(legId) independently on BOTH
 *     chain X and chain Y, using THIS relayer's own private key.
 *
 * Run 3 separate instances (one per relayer identity), e.g.:
 *   RELAYER_INDEX=1 node crossChainRepoRelayer.js
 *   RELAYER_INDEX=2 node crossChainRepoRelayer.js
 *   RELAYER_INDEX=3 node crossChainRepoRelayer.js
 *
 * The escrow contract itself enforces the 2-of-3 threshold and rejects a relayer
 * confirming the same leg twice, so this script does not need to coordinate with
 * the other relayer processes or persist any shared state.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const Web3 = require('web3');

const RELAYER_INDEX = process.env.RELAYER_INDEX;
if (!['1', '2', '3'].includes(RELAYER_INDEX)) {
  console.error('Error: RELAYER_INDEX must be 1, 2, or 3');
  process.exit(1);
}

const PRIVATE_KEY = process.env[`RELAYER${RELAYER_INDEX}_PRIVATE_KEY`];
if (!PRIVATE_KEY) {
  console.error(`Error: RELAYER${RELAYER_INDEX}_PRIVATE_KEY is missing`);
  process.exit(1);
}

let escrowAbi;
try {
  escrowAbi = require('../abis/CrossChainRepoEscrow.abi.json');
} catch (err) {
  console.error(`Error loading CrossChainRepoEscrow ABI: ${err.message}. Run "npx hardhat compile" first.`);
  process.exit(1);
}

const CHAINS = [
  { name: 'sepolia', chainId: 11155111, wsUrl: process.env.SEPOLIA_WS_URL, escrowAddress: process.env.ESCROW_SEPOLIA_ADDRESS },
  { name: 'amoy', chainId: 80002, wsUrl: process.env.AMOY_WS_URL, escrowAddress: process.env.ESCROW_AMOY_ADDRESS },
  { name: 'fuji', chainId: 43113, wsUrl: process.env.FUJI_WS_URL, escrowAddress: process.env.ESCROW_FUJI_ADDRESS },
];

for (const c of CHAINS) {
  if (!c.wsUrl || !c.escrowAddress) {
    console.error(`Error: missing WS URL or escrow address for chain ${c.name}`);
    process.exit(1);
  }
}

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
        await new Promise(resolve => setTimeout(resolve, 5000 * attempt));
        continue;
      }
      throw err;
    }
  }
};

const chainStates = CHAINS.map((chain) => {
  const web3 = new Web3(new Web3.providers.WebsocketProvider(chain.wsUrl));
  const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
  web3.eth.accounts.wallet.add(account);
  const escrow = new web3.eth.Contract(escrowAbi, chain.escrowAddress);
  return { ...chain, web3, account, escrow };
});

const LEG_STATUS_LOCKED = '1';

async function confirmReleaseOn(state, legId) {
  const alreadyConfirmed = await state.escrow.methods.hasConfirmed(legId, state.account.address).call();
  if (alreadyConfirmed) {
    console.log(`[relayer${RELAYER_INDEX}] Already confirmed legId=${legId} on ${state.name}, skipping`);
    return;
  }

  console.log(`[relayer${RELAYER_INDEX}] Confirming legId=${legId} on ${state.name}...`);

  try {
    await state.escrow.methods.confirmRelease(legId).call({ from: state.account.address });
  } catch (err) {
    console.log(`[relayer${RELAYER_INDEX}] confirmRelease simulation failed on ${state.name} for legId=${legId}: ${err.message}`);
    return;
  }

  const gasEstimate = await state.escrow.methods.confirmRelease(legId).estimateGas({ from: state.account.address });

  await withGasPriceRetry(state.web3, async (priorityFee) => {
    const gasPrice = await state.web3.eth.getGasPrice();
    const maxFeePerGas = (BigInt(gasPrice) + BigInt(priorityFee)).toString();
    const gasLimit = Math.floor(Number(gasEstimate) * 1.5);
    const nonce = await state.web3.eth.getTransactionCount(state.account.address, 'pending');

    const tx = await state.escrow.methods.confirmRelease(legId).send({
      from: state.account.address,
      gas: gasLimit,
      maxPriorityFeePerGas: priorityFee,
      maxFeePerGas,
      nonce,
    });
    console.log(`[relayer${RELAYER_INDEX}] Confirmed legId=${legId} on ${state.name}. TxHash: ${tx.transactionHash}`);
    return tx;
  });
}

async function handleLocked(sourceState, legId) {
  console.log(`[relayer${RELAYER_INDEX}] Locked event observed on ${sourceState.name} for legId=${legId}`);

  for (const otherState of chainStates) {
    if (otherState.name === sourceState.name) continue;

    try {
      const leg = await otherState.escrow.methods.getLeg(legId).call();
      if (leg.status === LEG_STATUS_LOCKED) {
        console.log(`[relayer${RELAYER_INDEX}] Matching Locked leg found on ${otherState.name} for legId=${legId}`);
        await confirmReleaseOn(sourceState, legId);
        await confirmReleaseOn(otherState, legId);
      }
    } catch (err) {
      console.error(`[relayer${RELAYER_INDEX}] Error checking leg on ${otherState.name} for legId=${legId}: ${err.message}`);
    }
  }
}

function monitorChain(state) {
  console.log(`[relayer${RELAYER_INDEX}] Monitoring Locked events on ${state.name} (escrow ${state.escrowAddress})...`);
  state.escrow.events.Locked({ fromBlock: 'latest' })
    .on('data', (event) => {
      handleLocked(state, event.returnValues.legId).catch((err) => {
        console.error(`[relayer${RELAYER_INDEX}] Error handling Locked event on ${state.name}: ${err.message}`);
      });
    })
    .on('error', (err) => {
      console.error(`[relayer${RELAYER_INDEX}] Error in Locked event subscription on ${state.name}: ${err.message}`);
    });
}

async function start() {
  console.log(`Starting Cross Chain DvP relayer #${RELAYER_INDEX}, address=${chainStates[0].account.address}`);

  for (const state of chainStates) {
    try {
      const balance = await state.web3.eth.getBalance(state.account.address);
      console.log(`[relayer${RELAYER_INDEX}] Balance on ${state.name}: ${state.web3.utils.fromWei(balance, 'ether')}`);
    } catch (err) {
      console.warn(`[relayer${RELAYER_INDEX}] Could not check balance on ${state.name}: ${err.message}`);
    }
    monitorChain(state);
  }
}

start();

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
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Where the app server (server/index.js, default port 8080) lives, so this relayer can
// tell it when a leg actually releases on-chain - the app's DB has no other way to know,
// since it only ever sets startlegstatus/maturitylegstatus to 1 (Locked) when it locks.
const API_BASE_URL = process.env.RELAYER_API_BASE_URL || 'http://localhost:8080';

const RELAYER_INDEX = process.env.RELAYER_INDEX;
if (!['1', '2', '3'].includes(RELAYER_INDEX)) {
  console.error('Error: RELAYER_INDEX must be 1, 2, or 3');
  process.exit(1);
}

// Heartbeat file so other processes (e.g. the API server, before locking funds) can
// tell whether this relayer identity is currently running. Staleness IS the "stopped"
// signal, so there's nothing to clean up on exit.
const HEARTBEAT_PATH = path.join(__dirname, `heartbeat_relayer${RELAYER_INDEX}.json`);
function writeHeartbeat() {
  try {
    fs.writeFileSync(HEARTBEAT_PATH, JSON.stringify({ relayerIndex: RELAYER_INDEX, timestamp: Date.now() }));
  } catch (err) {
    console.error(`[relayer${RELAYER_INDEX}] Error writing heartbeat: ${err.message}`);
  }
}

// Per-chain last-processed-block checkpoint, so a restart backfills only what it missed
// instead of rescanning from genesis (or missing events entirely, as with fromBlock: 'latest').
const CHECKPOINT_PATH = path.join(__dirname, `checkpoint_relayer${RELAYER_INDEX}.json`);
function loadCheckpoints() {
  if (fs.existsSync(CHECKPOINT_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(CHECKPOINT_PATH));
    } catch (err) {
      console.error(`[relayer${RELAYER_INDEX}] Error loading checkpoint: ${err.message}`);
    }
  }
  return {};
}
const checkpoints = loadCheckpoints();
function saveCheckpoint(chainName, blockNumber) {
  checkpoints[chainName] = blockNumber;
  try {
    fs.writeFileSync(CHECKPOINT_PATH, JSON.stringify(checkpoints, null, 2));
  } catch (err) {
    console.error(`[relayer${RELAYER_INDEX}] Error saving checkpoint: ${err.message}`);
  }
}

// How far back to scan on first run (no checkpoint yet). Override via env if needed - bigger
// values recover older missed locks but cost more requests (see GETLOGS_CHUNK_BLOCKS below):
// at the default chunk size of 10, 500 blocks = 50 eth_getLogs calls per chain.
const BACKFILL_BLOCKS = parseInt(process.env.RELAYER_BACKFILL_BLOCKS || '500', 10);
// Alchemy's free tier rejects eth_getLogs with a range over 10 blocks, so the scan
// has to be done in windows this size rather than one call across the whole range.
const GETLOGS_CHUNK_BLOCKS = parseInt(process.env.RELAYER_GETLOGS_CHUNK_BLOCKS || '10', 10);

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

// Matches both the classic "transaction underpriced" wording and the "gas tip cap ...
// minimum needed ..." wording some chains (e.g. Polygon Amoy, which requires >=25 gwei
// tip) return instead - both mean "bump the priority fee and retry".
const isUnderpricedError = (message) => /transaction underpriced|gas tip cap/i.test(message);

const withGasPriceRetry = async (web3, fn, maxRetries = 3, initialPriorityFeeGwei = 5, multiplier = 3) => {
  let attempt = 0;
  let priorityFee = web3.utils.toWei(initialPriorityFeeGwei.toString(), 'gwei');
  while (attempt < maxRetries) {
    try {
      return await fn(priorityFee);
    } catch (err) {
      attempt++;
      if (isUnderpricedError(err.message) && attempt < maxRetries) {
        priorityFee = (BigInt(priorityFee) * BigInt(multiplier)).toString();
        console.log(`Retry ${attempt}/${maxRetries} with maxPriorityFeePerGas: ${web3.utils.fromWei(priorityFee, 'gwei')} gwei`);
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

  await withGasPriceRetry(state.web3, async (priorityFee) => {
    const gasPrice = await state.web3.eth.getGasPrice();
    const maxFeePerGas = (BigInt(gasPrice) + BigInt(priorityFee)).toString();
    // Estimated fresh on every attempt, not once up front: if another relayer's
    // confirmation lands first (pushing confirmCount to threshold), THIS call becomes
    // the one that also runs the release's safeTransfer - a much more expensive path
    // than a plain confirm. A stale estimate from before that happened undershoots the
    // real cost and reverts out-of-gas even with a generous multiplier.
    const gasEstimate = await state.escrow.methods.confirmRelease(legId).estimateGas({ from: state.account.address });
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

// Best-effort: the app's DB status is a UX convenience, not something quorum depends on,
// so a failed/unreachable webhook just logs and moves on rather than affecting relaying.
async function notifyReleased(state, legId) {
  try {
    await axios.post(`${API_BASE_URL}/api/crosschaindvp/legreleased`, { legId, chainId: state.chainId });
  } catch (err) {
    console.error(`[relayer${RELAYER_INDEX}] Error notifying API of release for legId=${legId} on ${state.name}: ${err.message}`);
  }
}

async function handleReleased(state, legId) {
  console.log(`[relayer${RELAYER_INDEX}] Released event observed on ${state.name} for legId=${legId}`);
  await notifyReleased(state, legId);
}

async function handleLocked(sourceState, legId) {
  console.log(`[relayer${RELAYER_INDEX}] Locked event observed on ${sourceState.name} for legId=${legId}`);

  for (const otherState of chainStates) {
    if (otherState.name === sourceState.name) continue;

    let leg;
    try {
      leg = await otherState.escrow.methods.getLeg(legId).call();
    } catch (err) {
      console.error(`[relayer${RELAYER_INDEX}] Error checking leg on ${otherState.name} for legId=${legId}: ${err.message}`);
      continue;
    }
    if (leg.status !== LEG_STATUS_LOCKED) continue;

    console.log(`[relayer${RELAYER_INDEX}] Matching Locked leg found on ${otherState.name} for legId=${legId}`);
    // Each chain's confirmation is independent, so a failure on one (e.g. another
    // relayer already reached quorum there first - an expected, harmless race) must
    // not skip attempting the other, and errors must be attributed to whichever
    // chain's confirmReleaseOn call actually failed, not just whatever happened to be
    // "otherState" at the time.
    await confirmReleaseOn(sourceState, legId).catch((err) => {
      console.error(`[relayer${RELAYER_INDEX}] Error confirming release on ${sourceState.name} for legId=${legId}: ${err.message}`);
    });
    await confirmReleaseOn(otherState, legId).catch((err) => {
      console.error(`[relayer${RELAYER_INDEX}] Error confirming release on ${otherState.name} for legId=${legId}: ${err.message}`);
    });
  }
}

// Alchemy's free tier also caps requests-per-second; when 3 relayer processes all start
// backfilling at once, that burst can get throttled. Retry with backoff instead of just
// skipping the scan (which would silently leave that chain's backlog unprocessed).
const isRateLimitError = (message) => /compute units per second|exceeded|429|rate limit/i.test(message);

async function getPastEventsWithRetry(escrow, eventName, options, chainName, maxRetries = 5) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await escrow.getPastEvents(eventName, options);
    } catch (err) {
      if (isRateLimitError(err.message) && attempt < maxRetries - 1) {
        const delayMs = 1000 * (attempt + 1);
        console.warn(`[relayer${RELAYER_INDEX}] Rate limited fetching past events on ${chainName} blocks ${options.fromBlock}-${options.toBlock} (attempt ${attempt + 1}/${maxRetries}), retrying in ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      throw err;
    }
  }
}

// Catches up on Locked events emitted while this relayer was stopped (e.g. started
// after a leg was already locked, or down for a stretch) - otherwise a live-only
// 'latest' subscription never sees them and quorum never completes.
async function backfillChain(state) {
  const latestBlock = await state.web3.eth.getBlockNumber();
  const fromBlock = checkpoints[state.name] != null
    ? checkpoints[state.name] + 1
    : Math.max(0, latestBlock - BACKFILL_BLOCKS);

  if (fromBlock > latestBlock) {
    saveCheckpoint(state.name, latestBlock);
    return;
  }

  console.log(`[relayer${RELAYER_INDEX}] Backfilling events on ${state.name} from block ${fromBlock} to ${latestBlock}...`);
  let totalProcessed = 0;
  for (let chunkStart = fromBlock; chunkStart <= latestBlock; chunkStart += GETLOGS_CHUNK_BLOCKS) {
    const chunkEnd = Math.min(chunkStart + GETLOGS_CHUNK_BLOCKS - 1, latestBlock);
    const pastEvents = await getPastEventsWithRetry(state.escrow, 'allEvents', { fromBlock: chunkStart, toBlock: chunkEnd }, state.name);
    for (const event of pastEvents) {
      const handler = eventHandlers[event.event];
      if (!handler) continue;
      await handler(state, event.returnValues.legId).catch((err) => {
        console.error(`[relayer${RELAYER_INDEX}] Error handling backfilled ${event.event} event on ${state.name}: ${err.message}`);
      });
      totalProcessed++;
    }
    // Save after each chunk so a later chunk's failure doesn't lose already-scanned progress.
    saveCheckpoint(state.name, chunkEnd);
    // Small pause between requests to stay under Alchemy's per-second cap when multiple
    // relayer processes are backfilling concurrently.
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  console.log(`[relayer${RELAYER_INDEX}] Backfill complete on ${state.name}, processed ${totalProcessed} event(s).`);
}

const eventHandlers = { Locked: handleLocked, Released: handleReleased };

function monitorChain(state) {
  console.log(`[relayer${RELAYER_INDEX}] Monitoring events on ${state.name} (escrow ${state.escrowAddress})...`);
  state.escrow.events.allEvents({ fromBlock: 'latest' })
    .on('data', (event) => {
      const handler = eventHandlers[event.event];
      if (!handler) return;
      handler(state, event.returnValues.legId)
        .catch((err) => {
          console.error(`[relayer${RELAYER_INDEX}] Error handling ${event.event} event on ${state.name}: ${err.message}`);
        })
        .finally(() => saveCheckpoint(state.name, event.blockNumber));
    })
    .on('error', (err) => {
      console.error(`[relayer${RELAYER_INDEX}] Error in event subscription on ${state.name}: ${err.message}`);
    });
}

async function start() {
  console.log(`Starting Cross Chain DvP relayer #${RELAYER_INDEX}, address=${chainStates[0].account.address}`);

  // Heartbeat reflects process liveness, not backfill progress - a multi-chain backfill can take
  // much longer than the heartbeat staleness window, and shouldn't make a running process look dead.
  writeHeartbeat();
  setInterval(writeHeartbeat, 10000);

  // Start live monitoring (fromBlock: 'latest') on every chain FIRST, before any
  // backfill. A live subscription is cheap and catches new locks immediately; a
  // historical backfill under Alchemy's free-tier eth_getLogs cap can take a long
  // time when the backlog is large. Previously backfill+monitor ran chain-by-chain in
  // sequence, so a lock made *today* on the second chain could sit unconfirmed for as
  // long as that chain's old backlog took to scan - even though nothing about it
  // depends on that backlog at all.
  for (const state of chainStates) {
    try {
      const balance = await state.web3.eth.getBalance(state.account.address);
      console.log(`[relayer${RELAYER_INDEX}] Balance on ${state.name}: ${state.web3.utils.fromWei(balance, 'ether')}`);
    } catch (err) {
      console.warn(`[relayer${RELAYER_INDEX}] Could not check balance on ${state.name}: ${err.message}`);
    }
    monitorChain(state);
  }

  // Backfill now runs in the background afterward, to catch up on events missed while
  // this relayer was down - it no longer gates when live monitoring starts.
  for (const state of chainStates) {
    backfillChain(state).catch((err) => {
      console.error(`[relayer${RELAYER_INDEX}] Backfill error on ${state.name}: ${err.message}`);
    });
  }
}

start();

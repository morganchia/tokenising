# Cross-Chain Repo (DvP) Architecture

This document explains how the cross-chain tokenised repo/collateral system is designed, what the "relayers" are, and why the design requires 3 relayers with a 2-of-3 approval threshold before funds are released.


## 1. What the system does

The repo trades a tokenised asset (e.g. a bond token) against a cash/stablecoin token as a **Delivery-vs-Payment (DvP)** swap, but the two legs of the trade live on *different chains*. A repo trade has two legs over its lifecycle:

- **Start leg**: token A locked on chain X, token B locked on chain Y.
- **Maturity leg**: same idea, unwinding the position.

Since there is no native way to atomically swap assets across two independent blockchains, the system uses an **escrow-and-relay** pattern: lock funds independently on both chains, then have a decentralized set of watchers confirm both locks happened before releasing either side.

Three EVM testnets are wired up: **Ethereum Sepolia**, **Polygon Amoy**, and **Avalanche Fuji** (RPC access via Alchemy for Sepolia/Amoy, a direct RPC for Fuji).

## 2. On-chain component: `CrossChainRepoEscrow.sol`

`server/app/contracts/CrossChainRepoEscrow.sol` is a UUPS-upgradeable escrow contract, **deployed once per chain**, with the same relayer set and threshold registered identically on all three chains.

Its own header comment states the design intent directly:

> "Long-lived escrow contract deployed once per chain. Each cross-chain Repo leg (start or maturity) is locked here, and released once a 2-of-3 relayer quorum confirms the matching leg was also locked on the counterparty's chain."

Key mechanics:

- `mapping(address => bool) public relayers` — a whitelist of authorized relayer addresses, plus `uint256 public threshold` (set at `initialize(address[] _relayers, uint256 _threshold)`, requiring `_threshold > 0 && _threshold <= _relayers.length`).
- Each `Leg` tracks `confirmCount` and `mapping(address => bool) confirmedBy` — i.e. per-leg voting state.
- `lock(...)` (owner/admin only) pulls ERC20 tokens into escrow and emits `Locked`.
- `confirmRelease(legId)` (`onlyRelayer`) — the core quorum logic:

```solidity
function confirmRelease(bytes32 legId) public onlyRelayer whenNotPaused {
    Leg storage leg = legs[legId];
    require(leg.status == Status.Locked, "Leg not locked");
    require(!leg.confirmedBy[msg.sender], "Already confirmed by this relayer");

    leg.confirmedBy[msg.sender] = true;
    leg.confirmCount += 1;
    emit Confirmed(legId, msg.sender, leg.confirmCount);

    if (leg.confirmCount >= threshold) {
        leg.status = Status.Released;
        IERC20(leg.token).safeTransfer(leg.beneficiary, leg.amount);
        emit Released(legId, leg.beneficiary, leg.amount);
    }
}
```

This is the important part: **the approval threshold is enforced on-chain, in the smart contract — not in the Node/Express server.** A single relayer can confirm at most once per leg; funds move only once enough independent relayer confirmations land.

- `refund(legId)` — safety valve: if the counterparty leg never gets locked/relayed before `deadline`, the depositor (or an admin) can reclaim funds instead of having them stuck forever.

The default threshold is fixed at deploy time in `scripts/deployCrossChainRepoEscrow.js`:

```js
const THRESHOLD = process.env.RELAYER_THRESHOLD ? parseInt(process.env.RELAYER_THRESHOLD, 10) : 2;
```

i.e. **2-of-3** by default, and this value is never overridden anywhere else in the repo. `scripts/generateRelayerWallets.js` generates the 3 relayer keypairs up front, explicitly labelled `"Cross-Chain DvP Relayer Wallets (2-of-3)"`.

## 3. What the relayers are, and why there are 3

The relayer daemon is `server/app/relayer/crossChainRepoRelayer.js`. (Older files in the same folder — `relayer.js`, `relayer copy*.js` — are legacy single-chain lock-mint bridge code, superseded by this one.)

Its header comment is the clearest architecture statement in the codebase:

> "One of 3 independent relayer identities forming a 2-of-3 quorum... watches all 3 configured chains (Sepolia, Amoy, Fuji). On a `Locked` event for a given `legId` on chain X, checks the OTHER two chains' escrow contracts for a matching `Locked` leg. If found on chain Y, submits `confirmRelease(legId)` independently on BOTH chain X and chain Y, using this relayer's own private key... The escrow contract itself enforces the 2-of-3 threshold and rejects a relayer confirming the same leg twice, so this script does not need to coordinate with the other relayer processes or persist any shared state."

Important design points:

- **All 3 relayer processes run identical code.** They differ only by which private key and `RELAYER_INDEX` (1/2/3) they're launched with (`run_relayer1.bat` / `run_relayer2.bat` / `run_relayer3.bat`, started together via `start_crosschain_relayers.bat`). This is **symmetric redundancy**, not sharding or load-balancing — every relayer watches every chain.
- **No coordination between relayers.** Since the contract itself dedupes confirmations per relayer address and only releases once the threshold is hit, the relayer processes don't need to talk to each other, elect a leader, or share state. This keeps the off-chain part of the system simple and avoids a new off-chain trust/coordination layer that could itself become a single point of failure.
- **Each relayer maintains its own liveness/progress state on disk**, per instance:
  - **Checkpoint** (`checkpoint_relayer{N}.json`) — last-processed block number per chain, e.g. `{ "amoy": 44689958, "fuji": 57715398, "sepolia": 11470799 }`. On restart, the relayer backfills from `checkpoint + 1` instead of rescanning from genesis or (worse) missing events entirely if it just resumed from `fromBlock: 'latest'`.
  - **Heartbeat** (`heartbeat_relayer{N}.json`) — written every 10s, e.g. `{"relayerIndex":"1","timestamp":1786508639486}`, but *only* while every chain's WebSocket connection is actually live. A relayer process that's alive but can't see on-chain events is functionally dead, so the heartbeat is a liveness+functionality signal, not just a process-alive ping.
- **Alchemy rate-limit handling** is explicitly called out in comments: with 3 relayer processes all polling/confirming at once, bursts of RPC calls can get throttled on Alchemy's free tier, so RPC calls are wrapped in retry-with-backoff logic (`isRateLimitError` / `withRateLimitRetry`). This is also what the recent commit `c9bb059` ("Fixed Alchemy rate-limiting retry in crosschaindvp.controller.js") addressed — the `lock()` broadcast+confirm call in the controller wasn't wrapped in the same retry helper as the rest of the file's RPC calls, so a throttled response during broadcast could fail the whole lock flow outright instead of backing off and retrying.

### Why not 1 relayer?

A single relayer is a single point of failure and a single point of trust: if it goes down, no legs ever release; if its key is compromised, an attacker can release any escrowed leg unilaterally. Cross-chain bridges that rely on one relayer/oracle are a well-known attack target.

### Why exactly 3 (not more)?

Three is the minimum number that lets the system tolerate **one relayer being down or compromised** while still requiring **collusion of at least two** independent parties to force a release. It's the smallest N that supports a non-trivial M-of-N (2-of-3) — running 5 or 7 relayers would improve fault tolerance further but adds operational cost (more keys, more processes, more RPC load per confirmation) without a requirement in this system driving that need.

## 4. Why the threshold must be > 1

The threshold (2-of-3) is doing two jobs at once:

1. **Liveness**: with a 1-of-3 threshold, a single relayer alone could release funds — no better than having 1 relayer, just with 2 spares. A 3-of-3 threshold would be maximally strict but would halt the entire system the moment any single relayer goes offline, since there's no redundancy margin.
2. **Security against a single bad actor**: requiring 2 independently-keyed confirmations means a single compromised or malicious relayer key cannot unilaterally release escrowed funds — it takes compromising at least 2 of the 3 keys.

2-of-3 is the balance point: it survives exactly one relayer failing or going offline (liveness), while still requiring at least two independent relayers to agree before money moves (security). This mirrors classic multisig-wallet reasoning, except here the "signatures" are separate `confirmRelease` transactions counted by the contract rather than a batched multi-signature.

## 5. Off-chain quorum gate (defense in depth, not the enforcement point)

Before the controller will even lock funds, it checks that enough relayers are currently alive — `countLiveRelayers()` in `server/app/controllers/crosschaindvp.controller.js`:

```js
// The escrow requires 2-of-3 relayers to confirm release. Locking funds with fewer than
// 2 relayers live means the leg can lock and then sit stuck with no quorum to release it.
const RELAYER_HEARTBEAT_STALE_MS = 30000;
function countLiveRelayers() {
  for (let i = 1; i <= 3; i++) {
    const data = JSON.parse(fs.readFileSync(`heartbeat_relayer${i}.json`));
    if (Date.now() - data.timestamp < RELAYER_HEARTBEAT_STALE_MS) alive++;
  }
  return alive;
}
```

Inside `executeLeg` (shared by both the start-leg and maturity-leg execution routes):

```js
const liveRelayers = countLiveRelayers();
if (liveRelayers < 2) {
  return sendError(`Only ${liveRelayers}/3 relayers are running. At least 2 are required to reach quorum...`);
}
```

This check is purely a **UX/operational safety guard** — it does not enforce the threshold itself (the contract does that). Its purpose is to stop a user from locking funds into an escrow that currently has no way to reach quorum, which would otherwise leave funds stuck until `deadline` and a manual `refund()`.

## 6. End-to-end flow

1. Each leg gets a deterministic, chain-agnostic `legId = keccak256(abi.encode(tradeRowId, legType))`, computed identically off-chain by the controller and used as the lookup key on every chain.
2. The controller checks `countLiveRelayers() >= 2` before allowing a lock.
3. The controller's admin signer calls `lock()` on **both** chains' escrow contracts independently, pulling each side's ERC20 token into escrow and emitting `Locked(legId, ...)` on each chain.
4. All 3 relayer processes are independently subscribed (via WebSocket) to `Locked` events on all 3 chains, plus periodically backfilling from their checkpoint. On seeing `Locked` for a `legId` on chain X, a relayer checks chain Y (and Z) for the matching leg; if found, it independently submits `confirmRelease(legId)` on **both** chains using its own key.
5. Each `confirmRelease` call increments that leg's on-chain `confirmCount`. Once `confirmCount >= 2`, the escrow contract itself releases the tokens via `safeTransfer` and emits `Released` — no off-chain code decides this, the contract does.
6. Whichever relayer's transaction triggers/observes `Released` posts a webhook to the controller (`/api/crosschaindvp/legreleased`), which cross-checks the *other* chain's on-chain status and only marks the trade's DB status as fully released once **both** chains report `Released`.
7. If the counterparty leg never locks before `deadline`, `refund()` lets the depositor (or an admin) reclaim the escrowed funds — the safety valve for a stalled DvP.

Note: the trade record also carries a separate human maker-checker-approver workflow status (`status` field: created → checker ack → approver ack) on the DB row itself. That is a distinct operational control layered on top of the on-chain relayer quorum — don't confuse the two "approval" concepts.

## 7. Key files

| File | Role |
|---|---|
| `server/app/contracts/CrossChainRepoEscrow.sol` | On-chain lock/quorum/release/refund logic — the actual enforcement point |
| `scripts/deployCrossChainRepoEscrow.js` | Deploys the escrow per chain, sets relayer set + threshold (default 2-of-3) |
| `scripts/generateRelayerWallets.js` | One-time generation of the 3 relayer keypairs |
| `server/app/relayer/crossChainRepoRelayer.js` | The relayer daemon — one process per identity, watches all 3 chains |
| `server/app/relayer/run_relayer{1,2,3}.bat`, `start_crosschain_relayers.bat` | Launches the 3 relayer instances |
| `server/app/relayer/checkpoint_relayer{1,2,3}.json` | Per-relayer last-processed block, per chain (resume point) |
| `server/app/relayer/heartbeat_relayer{1,2,3}.json` | Per-relayer liveness signal, refreshed every 10s while healthy |
| `server/app/controllers/crosschaindvp.controller.js` | Orchestrates locking, gates on relayer quorum liveness, merges release status |
| `server/app/routes/crosschaindvp.routes.js` | API surface for the above |
| `server/app/models/crosschaindvp.model.js` | DB schema: trade legs, chain IDs, token addresses, leg/trade statuses |
| `client/src/common/crosschaindvp-constants.js` | Frontend chain IDs and status labels |

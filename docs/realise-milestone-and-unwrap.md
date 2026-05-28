# Realise Milestone & Unwrap — Technical Documentation

## Overview

After a DTSCF project is approved and its Tokenised Payable (TP) NFTs are minted and distributed to contractors, there are two key post-deployment operations:

1. **Realise Milestone** — the Anchor marks a milestone as completed on-chain, unlocking the contractors' NFTs for redemption.
2. **Unwrap** — each contractor burns their NFT and receives the underlying ERC20 deposit tokens (cash) in their wallet.

---

## 1. Realise Milestone

**Who:** Anchor organisation user with Maker role.  
**Route:** `/dtscfrealisemilestone/:projectId`  
**Component:** `client/src/components/dtscf-realisemilestone.component.js`  
**API endpoint:** `PUT /dtscf/approvemilestonecompletedbyid/:walletAddress`  
**Controller:** `server/app/controllers/dtscf.controller.js` → `approveMilestoneCompletedById`

### What it does

Marks a milestone as force-realised on the smart contract, ahead of the milestone's scheduled maturity date. This is used when the Anchor confirms that the milestone deliverables have been met and contractors should be allowed to redeem their NFTs now rather than waiting for the maturity date to pass automatically.

### Eligibility filter

The milestone dropdown only shows milestones that meet **all** of these conditions:
- `milestone_completed` is `false` in the DB
- The milestone's end date is **strictly after today** (past-due milestones are excluded on the assumption they are already auto-realised by the maturity date)

### Flow

```
Anchor selects milestone in dropdown
        │
        ▼
Click "Set Milestone Completed"
        │
        ▼
POST to server: wallet address + full currentProject (includes selectedMilestoneId)
        │
        ▼
Server: setupWeb3 → connect to blockchain (Sepolia / Amoy)
        │
        ▼
Server: getTokensInWallet — checks what TP tokens the Anchor holds for the contract
        │
        ▼
Server: forceRealizeMilestone(selectedMilestoneId)
  ├── estimateGas (dry-run to catch reverts early)
  ├── sign transaction with CONTRACT_OWNER_WALLET / SIGNER_PRIVATE_KEY
  ├── sendSignedTransaction
  └── poll for receipt (10s intervals, up to 6 attempts)
        │
        ▼
On-chain: all payables registered under that milestoneId have realized = true
        │
        ▼
Server: UPDATE dtscf_milestones SET milestone_completed=1, milestone_completed_date=NOW()
        WHERE id = selectedMilestoneId
        │
        ▼
Server: write AuditTrail record
        │
        ▼
Client: local state updated — completed milestone removed from dropdown immediately
        │
        ▼
Modal: "Milestone has been set to completed."
```

### On-chain effect

`forceRealizeMilestone(milestoneId)` sets `payables[tokenId].realized = true` for every token registered under that milestone. This enables the `unwrapToDeposit` / `batchUnwrapToDeposit` check:

```solidity
require(payables[id].realized || block.timestamp >= payables[id].maturityDate, "Not yet realised");
```

### Key environment variables

| Variable | Purpose |
|---|---|
| `REACT_APP_CONTRACT_OWNER_WALLET` | Address that signs the forceRealizeMilestone transaction |
| `REACT_APP_SIGNER_PRIVATE_KEY` | Private key for signing |

### Known behaviour

- The DB update (`milestone_completed = 1`) runs unconditionally after the blockchain call, even if the blockchain call returned `false` (non-gas-estimation failure path). This means the DB may be updated even if the on-chain transaction was not confirmed. Check the server log for `realizeMilestoneReceipt() executed successfully` with `status: true` to confirm the on-chain state.
- The milestone ID passed to `forceRealizeMilestone` is the **DB milestone ID** (e.g. `183`), which must match the `milestoneId` registered on-chain when the token was minted.

---

## 2. Unwrap

**Who:** Contractor with Maker role, using MetaMask.  
**Route:** `/dtscfunwrap/:projectId`  
**Component:** `client/src/components/dtscf-unwrap.component.js`  
**API endpoints used:**
- `GET /dtscf/getmilestonerealisedstatus` — checks on-chain realisation status (server-side fallback)
- `GET /dtscf/getunwrapparams` — retrieves `amounts` and `salts` from the DB for the commitment reveal
- `POST /dtscf/decryptmetadata` — decrypts the Pinata-hosted token metadata (for the view page, not the unwrap itself)

### What it does

The contractor burns their ERC1155 NFT and receives the escrowed ERC20 deposit tokens (e.g. UTBD) directly into their MetaMask wallet. MetaMask is required — the transaction is signed client-side.

### Milestone status display

On page load, `loadAllMilestoneRealisedStatuses()` determines the badge shown on each milestone:

| Condition | Badge |
|---|---|
| Today ≥ milestone end date (local time) | **Realised** (auto, no chain call needed) |
| `payables[tokenId].realized == true` on-chain (all tokens) | **Realised** |
| Some but not all tokens realized | **Partially Realised** |
| No tokens registered for this milestone | **No Tokens** |
| All tokens unrealised | **Not Yet Realised** |

If MetaMask is available, the chain is queried directly via MetaMask's provider. If not, the server endpoint `GET /dtscf/getmilestonerealisedstatus` is used as a fallback.

**Important:** The milestone status badge reflects the **blockchain state**, not the DB `milestone_completed` field.

### Milestone dropdown filter

Contractors only see milestones where:
1. They have a purchase (`dtscf_purchases`) associated with that milestone.
2. Their wallet currently holds ≥ 1 NFT token for that milestone on-chain (`loadUserTokenMilestones` checks `balanceOf` for each milestone's token set).

Condition 2 means the dropdown empties automatically after a successful unwrap (tokens are gone from the wallet).

### Flow

```
Contractor selects milestone → clicks "Unwrap Tokens for Selected Milestone"
        │
        ▼
Client: validateForm() — checks milestone selected, name, wallet addresses, dates
        │
        ▼
MetaMask: eth_requestAccounts — prompts user to connect
        │
        ▼
Client: verify connected wallet matches currentUser.walletaddress
        │
        ▼
Client: verify MetaMask chainId matches project blockchain
        │
        ▼
Client: contract.getTokensForMilestone(milestoneId)
  → all token IDs registered for that milestone on-chain
        │
        ▼
Client: contract.balanceOf(wallet, tokenId) for each token
  → filter to only tokens this wallet holds (balance == 1)
        │
        ▼
Client: pre-flight realisation check
  If milestoneRealisedStatuses[milestoneId] !== 'realised':
    → contract.payables(tokenId) for each held token
    → if any token has realized=false AND maturityDate > now → throw error
        │
        ▼
Client: GET /dtscf/getunwrapparams?contractAddress&milestoneId&blockchain&tokenIds
  → Server looks up dtscf_purchases by token_id
  → Returns: { tokenIds, amounts (in wei), salts (bytes32) }
        │
        ▼
MetaMask: signs and sends contract.batchUnwrapToDeposit(tokenIds, amounts, salts)
        │
        ▼
On-chain (per token, skipping any that fail silently):
  1. verify balanceOf(msg.sender, id) == 1
  2. verify realized == true OR block.timestamp >= maturityDate
  3. verify keccak256(amount, salt) == escrowCommitment
  4. depositContract.transfer(msg.sender, amount)  ← ERC20 cash to contractor wallet
  5. _burn(msg.sender, id, 1)                       ← NFT destroyed
  6. delete payables[id]
  7. tokenIds.remove(id)
  8. milestoneToTokens[milestoneId].remove(id)
  9. delete tokenOwners[id]
        │
        ▼
Client: success message + link to blockchain explorer transaction
Client: loadUserTokenMilestones() — refreshes dropdown (spent tokens disappear)
```

### The commitment reveal

The `amount` and `salt` are **never stored on-chain in plaintext**. At mint time, the server computes:

```
escrowCommitment = keccak256(abi.encodePacked(amount, salt))
```

and stores `escrowCommitment` on-chain. The plaintext `amount` and `salt` are stored in `dtscf_purchases.amount` and `dtscf_purchases.escrow_salt` in the DB.

At unwrap time, `getUnwrapParams` retrieves `amount` and `escrow_salt` from the DB by `token_id` and sends them to the client. The smart contract re-computes the hash and rejects any mismatch, preventing the contractor from inflating their payout.

### Metadata encryption

Token metadata (contractor name, purchase description, SGD amount, image) is encrypted with **AES-256-GCM** before upload to Pinata/IPFS. The encryption key (`METADATA_ENCRYPTION_KEY`) is a 32-byte symmetric key stored only in the server's `.env` file.

Decryption is server-gated via `POST /dtscf/decryptmetadata`:
- **Contractor path:** must provide a MetaMask `personal_sign` signature (fresh timestamp, 5-minute replay window). Server checks `balanceOf(wallet, tokenId) >= 1` on-chain. If balance is 0, access is denied — ownership is the sole gate.
- **Anchor path:** uses their JWT session. Ownership check is skipped (anchor issued all tokens in the project).

### What happens to the NFT after unwrap

| State | Before unwrap | After unwrap |
|---|---|---|
| ERC1155 balance | 1 | 0 |
| `payables[id]` on-chain | populated | deleted |
| `_tokenURIs[id]` on-chain | set (Pinata URL) | **still set** (never cleared) |
| Pinata/IPFS metadata file | accessible | accessible (IPFS is permanent until unpinned) |
| DB records (`dtscf_contractors`, `dtscf_purchases`) | present | **still present** (DB update currently commented out) |
| ERC20 deposit tokens | held by contract | transferred to contractor wallet |

The token URI is intentionally left in the contract after unwrap (not cleared by `batchUnwrapToDeposit`). The metadata file remains on Pinata. The DB records remain as a permanent audit trail of the project's financial structure.

### Key environment variables

| Variable | Purpose |
|---|---|
| `METADATA_ENCRYPTION_KEY` | 32-byte AES-256-GCM key for metadata encryption/decryption |
| `REACT_APP_ALCHEMY_API_KEY` | RPC access for on-chain balance checks in the server ownership check |
| `SEPOLIA_RPC_URL` / `AMOY_RPC_URL` | Optional override RPC URLs per chain |

---

## Data flow summary

```
                    ANCHOR                              CONTRACTOR
                       │                                    │
          [Realise Milestone page]              [Unwrap page + MetaMask]
                       │                                    │
          forceRealizeMilestone(msId)          batchUnwrapToDeposit(ids,amts,salts)
              (server-signed)                      (MetaMask-signed by contractor)
                       │                                    │
                  Blockchain                           Blockchain
             realized=true on all                  _burn + delete payables
             tokens for milestone                  + transfer ERC20 to wallet
                       │                                    │
               DB: milestone_completed=1           DB: (not updated — future work)
```

# Tokenised Payable — Technical Documentation

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Data Model](#2-data-model)
3. [Smart Contract](#3-smart-contract)
4. [Encryption & Commitment Scheme](#4-encryption--commitment-scheme)
5. [Phase 1 — Project Creation (Anchor Maker)](#5-phase-1--project-creation-anchor-maker)
6. [Phase 2 — Approval & On-Chain Deployment](#6-phase-2--approval--on-chain-deployment)
7. [Phase 3 — Contractor Amendment & Sub-Contractor Splits](#7-phase-3--contractor-amendment--sub-contractor-splits)
8. [Phase 4 — Realise Milestone](#8-phase-4--realise-milestone)
9. [Phase 5 — Unwrap](#9-phase-5--unwrap)
10. [API Endpoint Reference](#10-api-endpoint-reference)
11. [Environment Variables Reference](#11-environment-variables-reference)
12. [End-to-End Data Flow Diagram](#12-end-to-end-data-flow-diagram)

---

## 1. System Overview

A **Tokenised Payable (TP)** is an ERC-1155 NFT that represents a conditional payment obligation. The Anchor organisation wraps escrowed ERC-20 deposit tokens (e.g. UTBD) into a TP NFT. That NFT is then split and distributed to contractors. Each contractor's TP represents their right to receive payment when a milestone is completed and the milestone is marked as realised on-chain.

**Roles:**

| Role | Description |
|---|---|
| Anchor | Project owner/payer. Manages project lifecycle, splits TPs, realises milestones. Maker + Approver within the anchor organisation. |
| Approver | Anchor-side role that approves draft submissions before on-chain deployment. |
| Contractor | Receives split TP tokens. Can further split to sub-contractors. Unwraps on milestone realisation. |
| Sub-Contractor | Nested under a contractor. Receives splits from the contractor's TP. Can unwrap independently. |

**Technology stack:**

- Frontend: React (class components), MetaMask, Web3.js
- Backend: Node.js / Express, Sequelize (MySQL)
- Blockchain: EVM-compatible (Ethereum Sepolia testnet, Polygon Amoy)
- Storage: Pinata / IPFS for NFT metadata and images
- Encryption: AES-256-GCM (server-side), ethers.js for signature verification

---

## 2. Data Model

### Draft tables (staging area, before on-chain deployment)

| Table | Key fields |
|---|---|
| `dtscf_drafts` | id, name, description, totalBudget, startdate, enddate, milestones (JSON), status (0=created, 1=submitted, 2=approved, 3=completed), txntype (0=create, 1=update, 2=delete) |
| `dtscf_contractors_drafts` | id, name, budget, walletaddress, organisation_id, dtscf_project_id, **dtscf_parent_contractor_id** (self-referencing FK — enables unlimited contractor hierarchy) |
| `dtscf_purchases_drafts` | id, description, amount, dtscf_project_id, dtscf_contractor_id, dtscf_milestone_id, invoice_blob (BLOB) |

### Production tables (live after approval)

| Table | Key fields |
|---|---|
| `dtscfs` | id, name, description, totalBudget, startdate, enddate, smartcontractaddress, underlyingDSGDsmartcontractaddress, blockchain (chainId), anchor_id, campaign_id, status, dbstatus, **anchor_token_salt** (32-byte hex — used to reveal the anchor's escrow commitment for unwrap) |
| `dtscf_milestones` | id, name, budget, startdate, enddate, dtscf_project_id, **milestone_completed** (bool), **milestone_completed_date** |
| `dtscf_contractors` | id, name, budget, walletaddress, organisation_id, dtscf_project_id, **dtscf_parent_contractor_id** (hierarchy FK), dbstatus |
| `dtscf_purchases` | id, description, amount, dtscf_project_id, dtscf_contractor_id, dtscf_milestone_id, invoice_blob, **token_id** (on-chain ERC-1155 token ID), **escrow_salt** (32-byte hex — commitment reveal secret), dbstatus |

The `token_id` and `escrow_salt` columns in `dtscf_purchases` are written **after** the blockchain split confirms, not at draft time. They are the keys to the unwrap commitment reveal.

### dbstatus lifecycle

```
PENDING_{draft_id}  →  OK       (after blockchain confirms)
                    →  ROLLBACK (if blockchain fails — records are deleted)
```

---

## 3. Smart Contract

**Contract:** `TokenizedPayable` (`server/app/contracts/ERC1155Tokenised_Payable.sol`)  
**Standard:** ERC-1155, upgradeable (UUPS proxy pattern via OpenZeppelin)

### Payable struct

```solidity
struct Payable {
    bytes32 escrowCommitment;   // keccak256(abi.encodePacked(amount, salt))
    uint256 maturityDate;       // Unix timestamp — auto-realises at this date
    bool    realized;           // true after forceRealizeMilestone or maturity
    address issuer;             // anchor wallet that minted this token
    uint256 milestoneId;        // DB milestone ID this token belongs to
}

mapping(uint256 => Payable) public payables;
```

### Key contract functions

| Function | Caller | Description |
|---|---|---|
| `wrapDepositToPayable(depositAmount, commitment, maturityDate, milestoneId, metadataUri)` | Anchor (server-signed) | Transfers ERC-20 from anchor into escrow and mints a TP NFT to the anchor's wallet |
| `splitPayable(originalId, milestoneId, splitCommitment, updatedOriginalCommitment, maturityDate, metadataUri, updatedSourceUri)` | Anchor (server-signed) | Splits a TP into two: a new child TP (minted to anchor) and updates the parent TP's commitment to reflect its reduced value |
| `safeTransferFrom(from, to, tokenId, 1, '0x')` | Anchor (server-signed) | Transfers the newly split child TP to the contractor's wallet |
| `forceRealizeMilestone(milestoneId)` | Contract owner (server-signed) | Sets `realized = true` on all TPs registered under that milestoneId |
| `batchUnwrapToDeposit(ids[], amounts[], salts[])` | Contractor (MetaMask-signed) | Burns each TP, verifies commitment, transfers ERC-20 to contractor |
| `getTokensForMilestone(milestoneId)` | Read-only | Returns all token IDs registered under a milestone |
| `getAllTokenIds()` | Read-only | Returns all currently active token IDs |
| `balanceOfBatch(addresses[], ids[])` | Read-only | ERC-1155 batch balance check |

### Token ID assignment

Token IDs are sequential integers managed by `nextTokenId` (starts at 1, increments per mint). A `wrapDepositToPayable` call mints token 1 (the anchor's master TP). Each `splitPayable` call mints the next available token ID for the new child TP.

---

## 4. Encryption & Commitment Scheme

### Escrow commitment

The payment amount is **never stored in plaintext on-chain**. Instead:

```
salt = crypto.randomBytes(32)           // server-generated per token
commitment = keccak256(amount_wei, salt) // stored on-chain in payables[id].escrowCommitment
```

- `salt` → stored in `dtscf_purchases.escrow_salt`
- `amount` → stored in `dtscf_purchases.amount`
- `commitment` → stored on-chain in `payables[tokenId].escrowCommitment`

At unwrap time, the server retrieves `amount` and `escrow_salt` from the DB and sends them to the client. The smart contract re-computes the hash and rejects any mismatch. This prevents a contractor from claiming more than their allocated amount.

When a TP is split, **two new commitments are generated**: one for the new child token (contractor's portion) and one to update the parent token (anchor's remaining balance).

### Metadata encryption

NFT metadata (contractor name, purchase description, SGD amount, maturity date, image) is encrypted with **AES-256-GCM** before upload to Pinata:

```
key = METADATA_ENCRYPTION_KEY  (32-byte hex, server .env only — never sent to client)
iv  = crypto.randomBytes(12)   (random per token)

envelope = {
  encrypted: true,
  version: 'aes-256-gcm-v1',
  iv:         <base64>,
  ciphertext: <base64>,
  authTag:    <base64>
}
```

The encrypted envelope is uploaded to Pinata and its IPFS gateway URL becomes the token's `tokenURI` on-chain.

Decryption is server-gated (`POST /dtscf/decryptmetadata`). The server verifies the caller holds the token on-chain before decrypting. See [Phase 5](#9-phase-5--unwrap) for the full access control flow.

### Retry logic

All blockchain transactions use exponential backoff:

```
retryWithBackoff(fn, maxRetries=5, baseDelay=15000ms)

Per retry:
  gasMultiplier      += 0.05  (baseFee scaling)
  priorityMultiplier += 0.05  (maxPriorityFee scaling)
  gasLimitMultiplier += 0.05  (gas limit scaling)
  delay = baseDelay * 2^(attempt-1) + random jitter
```

Gas estimation (`estimateGas`) is run before every send as a dry-run to catch contract reverts before spending ETH.

---

## 5. Phase 1 — Project Creation (Anchor Maker)

**Who:** Anchor organisation user with Maker role  
**Route:** `/dtscf/create` (new) or `/dtscf/update/:id` (amend draft)  
**Component:** `client/src/components/dashboard.component.js` → `dtscf-list.component.js`  
**API:** `POST /dtscf/draftcreate/`  
**Controller:** `draftCreate`

### What the Anchor enters

- **Project details:** name, description, total budget, start/end dates, underlying digital money (ERC-20 campaign), blockchain
- **Milestones:** one or more milestones, each with name, budget, start/end dates
- **Contractors:** one or more contractors, each with organisation name, wallet address, budget
  - Each contractor has one or more **purchases** (line items): description, amount, linked milestone, optional invoice upload
  - Contractors can have sub-contractors at any depth (self-referencing tree via `dtscf_parent_contractor_id`)

### What happens on save

```
Anchor fills form and clicks Save Draft
        │
        ▼
POST /dtscf/draftcreate (multipart/form-data — supports invoice file uploads)
        │
        ▼
Server: Sequelize transaction
  ├── Create dtscf_drafts row (status=0)
  ├── Create dtscf_milestones_drafts rows
  └── Recursive createContractors():
        For each contractor (and their sub-contractors):
          ├── Create dtscf_contractors_drafts row (dtscf_parent_contractor_id = parent's id)
          └── For each purchase:
                └── Create dtscf_purchases_drafts row (with invoice_blob if uploaded)
        │
        ▼
Draft saved. Anchor can continue editing until ready to submit.
```

### Draft states (status field)

| Value | Meaning |
|---|---|
| 0 | Created / in progress |
| 1 | Submitted to approver |
| 2 | Accepted by checker (if checker step enabled) |
| 3 | Approved — on-chain deployment triggered |

---

## 6. Phase 2 — Approval & On-Chain Deployment

**Who:** Anchor Maker (submits), Anchor Approver (approves)  
**Routes:** `/dtscf/:id` (approver view)  
**Components:** `dtscf-checkapprove.component.js`, `dtscf-checkapprove2.component.js`  
**APIs:**
- `PUT /dtscf/submitdraftbyid/:id` — Maker submits draft to approver
- `PUT /dtscf/approvedraftbyid/:id` — Approver approves → triggers on-chain deployment
**Controller:** `approveNewDraftById`

### Submit (Maker → Approver)

```
Anchor Maker reviews draft and clicks Submit
        │
        ▼
PUT /dtscf/submitdraftbyid/:draftId
        │
        ▼
Server: dtscf_drafts.status = 1 (submitted)
        AuditTrail record created
        │
        ▼
Approver sees request in their inbox
```

### Approve (Approver → On-Chain)

This is the largest operation in the system. It runs in two phases: DB promotion and blockchain deployment.

#### Phase A — DB promotion

```
Approver clicks Approve
        │
        ▼
PUT /dtscf/approvedraftbyid/:draftId
        │
        ▼
Sequelize transaction:
  1. Create dtscfs row (prod project, dbstatus='PENDING_{draft_id}')
  2. Create dtscf_milestones rows (copy from draft, build draftMilestoneId→prodMilestoneId map)
  3. Recursive copy: dtscf_contractors_drafts → dtscf_contractors
     (preserves parent-child hierarchy via dtscf_parent_contractor_id)
  4. Recursive copy: dtscf_purchases_drafts → dtscf_purchases
     (maps milestone IDs using the map from step 2)
  5. Update draft: dtscf_drafts.approveddtscfid = new prod ID
```

#### Phase B — Blockchain deployment (`dAppCreate`)

```
Step 1: setupWeb3(blockchain)
  → Connect to Alchemy/RPC endpoint for the target chain

Step 2: Load smart contract ABI + deployed contract address from dtscf record
  → Contract is pre-deployed (UUPS proxy); this step uses the existing address

Step 3: Generate anchor escrow salt + commitment
  salt       = generateEscrowSalt()          // 32 random bytes
  commitment = computeEscrowCommitment(totalBudget_wei, salt)
  → Save anchor_token_salt to dtscfs table

Step 4: Generate anchor TP metadata
  generateMetadataFile():
    ├── Draw image with sharp (project name, total value, all milestones listed)
    ├── Draw blurred preview image (financial values hidden)
    ├── Upload both images to Pinata → IPFS CIDs
    ├── Build ERC-1155 metadata JSON:
    │     { name, description, image (CID), properties: { value, milestones, ... } }
    └── AES-256-GCM encrypt the full metadata JSON (key=METADATA_ENCRYPTION_KEY)
        → Upload encrypted envelope to Pinata → metadataUri

Step 5: wrapDepositToPayable(totalBudget_wei, commitment, maturityDate, milestoneId=0, metadataUri)
  → Anchor's ERC-20 deposit transferred into contract escrow
  → Mints TP token ID 1 to anchor wallet
  → Emits PayableCreated(id=1, commitment, maturityDate, issuer, milestoneId)

Step 6–8: splitAndTransferTPtoContractors()
  For each contractor × purchase (ordered by contractor, then purchase):

    Step 6: Generate split escrow salt + commitment
      splitSalt       = generateEscrowSalt()
      splitCommitment = computeEscrowCommitment(purchaseAmount_wei, splitSalt)
      updatedOriginalCommitment = computeEscrowCommitment(remainingAnchorAmount_wei, newAnchorSalt)

    Step 7: Generate contractor TP metadata
      generateMetadataFile() with:
        ├── Contractor name, purchase description, milestone name
        ├── Maturity date (milestone enddate as Unix timestamp)
        ├── Conditions string (e.g. "SGD150 for Bull dozer — Milestone: M2")
        └── AES-256-GCM encrypted → uploaded to Pinata
      Also generate updatedSourceUri (anchor token metadata reflecting reduced remaining value)

    Step 7b: splitPayable(
        originalId          = anchorTokenId,
        milestoneId         = prodMilestoneId,
        splitCommitment     = contractor's commitment,
        updatedOrigCommit   = anchor's updated commitment,
        maturityDate        = Unix timestamp of milestone enddate,
        metadataUri         = contractor's Pinata URL,
        updatedSourceUri    = anchor's updated Pinata URL
    )
    → Emits PayableSplit(originalId, newId, newCommitment, newMilestoneId, newMaturityDate)
    → New TP token minted to anchor wallet (will be transferred next)

    Step 8: safeTransferFrom(anchor, contractor.walletaddress, newTokenId, 1, '0x')
    → Contractor receives their TP NFT

    Step 8b: Persist to DB
      dtscf_purchases.token_id   = newTokenId
      dtscf_purchases.escrow_salt = splitSalt (hex)
      dtscfs.anchor_token_salt    = newAnchorSalt (updated after each split)

    Step 8c: Re-emit URI events (MetaMask metadata refresh)
      setTokenURI(newTokenId, contractorMetadataUri)
      setTokenURI(anchorTokenId, updatedSourceUri)

Step 9: All DB records → dbstatus = 'OK'
Step 10: dtscf_drafts.status = 3 (approved)
Step 11: AuditTrail created
```

#### Rollback on failure

If any blockchain step fails, all prod DB records created during this approval run are deleted:

```
Contractor.destroy({ where: { id: newlyAddedContractorIds } })
Purchase.destroy({ where: { id: newlyAddedPurchaseIds } })
Dtscfs.destroy({ where: { dbstatus: 'PENDING_' + draft_id } })
```

The draft remains in status=1 (submitted) so the approver can retry.

### After deployment

Each contractor's wallet holds one ERC-1155 TP NFT per purchase × milestone combination. The token's encrypted metadata on Pinata describes the contractor name, purchase description, SGD amount, maturity date, and project name. The plaintext amount and salt are only on the server DB.

---

## 7. Phase 3 — Contractor Amendment & Sub-Contractor Splits

This phase handles adding new sub-contractors (and their purchases) to an existing live project. A contractor can engage sub-contractors and split their own TP token to fund them.

**Who:** Contractor Maker (submits amendment), Anchor Approver (approves)  
**Routes:** `/dtscf/contractoramendment/:id`  
**APIs:**
- `POST /dtscf/submitcontractoramendment` — Contractor submits amendment draft
- `PUT /dtscf/approvecontractoramendment/:id` — Approver approves → triggers splits
- `POST /dtscf/confirmcontractorsplit` — Client confirms MetaMask-signed splits
- `POST /dtscf/revertcontractorsplit` — Rolls back a failed contractor-signed split
**Controller:** `approveContractorAmendment`

### Amendment submission

```
Contractor adds sub-contractors and their purchases in the amendment form
        │
        ▼
POST /dtscf/submitcontractoramendment
        │
        ▼
Server: create/update dtscf_contractors_drafts and dtscf_purchases_drafts rows
        (same recursive structure as initial draft, dtscf_parent_contractor_id set)
        Status = 1 (submitted to approver)
```

### Amendment approval flow

```
Approver clicks Approve
        │
        ▼
PUT /dtscf/approvecontractoramendment/:draft_id
        │
        ▼
Phase A — DB write (prod records, dbstatus='PENDING')
  For each new contractor in draft:
    ├── Create dtscf_contractors row (with correct parent FK)
    └── Create dtscf_purchases rows for new purchases only
        (existing purchases already in prod are skipped)
        │
        ▼
Phase B — Split task planning (recursive processContractorDraft)
  
  For each top-level contractor draft:
    Source TP = anchor's token (anchor signs server-side)

  For each sub-contractor draft under a contractor:
    Source TP = contractor's token (contractor signs via MetaMask)

    Per sub-contractor, build milestoneToSrc map:
      For each TP in contractor's wallet:
        payables(tokenId).milestoneId → { tokenId, signerType }
      
      If contractor holds the TP (signerType='contractor') → MetaMask path
      If anchor holds it (signerType='anchor') → server-signed path

    For each new sub-contractor purchase:
      Generate splitCommitment, updatedOrigCommitment, metadataUri, updatedSourceUri
      → Queue as a splitTask { fromTokenId, toWallet, amount, milestoneId, signerType, ... }

        │
        ▼
Phase C — Execute anchor-signed splits (server-side)

  For each task where signerType='anchor':
    1. estimateGas(splitPayable(...)) — dry run, abort if it would revert
    2. Check anchor ETH balance covers gas
    3. splitPayable(...).send({ from: anchor })
    4. Extract newTokenId from PayableSplit event
    5. safeTransferFrom(anchor, subContractor.wallet, newTokenId, 1, '0x')
    6. Persist: dtscf_purchases.token_id = newTokenId, escrow_salt = splitSalt
    7. Persist: dtscfs.anchor_token_salt = newAnchorSalt
    8. Re-emit setTokenURI events for MetaMask refresh
        │
        ▼
Phase D — Contractor-signed splits (MetaMask path)

  If any tasks have signerType='contractor':
    Server sends TASKS payload to client:
      {
        contractAddress,
        splitTasks: [ { fromTokenId, toWallet, splitCommitment, ... } ],
        rollbackIds: { purchaseIds, contractorIds, draftId }
      }
    
    Client (dtscf-checkapprove2.component.js):
      For each task, via MetaMask:
        splitPayable(...).send({ from: contractorWallet })
        safeTransferFrom(...).send({ from: contractorWallet })
      
      On success:
        POST /dtscf/confirmcontractorsplit
        Body: { updates: [{ purchaseId, tokenId, splitSalt }], sourceUpdates: [...] }
        → Server writes token_id and escrow_salt to dtscf_purchases
      
      On failure:
        POST /dtscf/revertcontractorsplit
        → Deletes newly created prod contractor and purchase rows
        │
        ▼
Phase E — Finalise
  dtscf_drafts.status = 3
  dtscf_contractors.dbstatus = 'OK'
  dtscf_purchases.dbstatus   = 'OK'
```

### Split depth

Splits can occur at any depth: Anchor → Tier-1 Contractor → Tier-2 Sub-Contractor → ... Each tier's split is sourced from the parent's TP. The anchor signs all splits above Tier-1; Tier-1 contractors sign splits to their own sub-contractors via MetaMask.

---

## 8. Phase 4 — Realise Milestone

**Who:** Anchor Maker  
**Route:** `/dtscfrealisemilestone/:projectId`  
**Component:** `client/src/components/dtscf-realisemilestone.component.js`  
**API:** `PUT /dtscf/approvemilestonecompletedbyid/:walletAddress`  
**Controller:** `approveMilestoneCompletedById`

### Purpose

Marks a milestone as completed ahead of its maturity date, enabling all TPs for that milestone to be unwrapped immediately. Without this, contractors must wait until `block.timestamp >= maturityDate`.

### Eligible milestones

The dropdown only shows milestones where:
- `dtscf_milestones.milestone_completed = false`
- `enddate > today` (milestones past their due date are already auto-realised by the maturity date on-chain)

### Flow

```
Anchor selects milestone → clicks Set Milestone Completed
        │
        ▼
Modal shows "Processing..." immediately (no page spinner)
        │
        ▼
PUT /dtscf/approvemilestonecompletedbyid/:anchorWallet
Body: { ...currentProject, selectedMilestoneId, selectedMilestone }
        │
        ▼
Server:
  1. setupWeb3(blockchain)
  2. getTokensInWallet(TPcontract, anchorWallet) — verify anchor holds TPs for this contract
  3. forceRealizeMilestone(selectedMilestoneId)
       ├── estimateGas — dry-run, abort if revert detected
       ├── Sign with REACT_APP_SIGNER_PRIVATE_KEY (CONTRACT_OWNER_WALLET)
       ├── sendSignedTransaction
       └── Poll receipt: 10s intervals, up to 6 attempts (~60s)
  4. On-chain: payables[tokenId].realized = true for ALL tokens in that milestone
  5. UPDATE dtscf_milestones SET milestone_completed=1, milestone_completed_date=NOW()
     WHERE id = selectedMilestoneId
  6. INSERT audittrails record
        │
        ▼
Client:
  Local state updated immediately:
    currentProject.milestones[completedMilestone].milestone_completed = true
    selectedMilestone = ""
    selectedMilestoneId = null
  Completed milestone disappears from dropdown without page reload
        │
        ▼
Modal: "Milestone has been set to completed."
```

### On-chain effect

`forceRealizeMilestone(milestoneId)` iterates over every token registered in `milestoneToTokens[milestoneId]` and sets `payables[tokenId].realized = true`. This satisfies the unwrap pre-condition:

```solidity
require(payables[id].realized || block.timestamp >= payables[id].maturityDate, "Not yet realised");
```

---

## 9. Phase 5 — Unwrap

**Who:** Contractor (any tier) with Maker role, using MetaMask  
**Route:** `/dtscfunwrap/:projectId`  
**Component:** `client/src/components/dtscf-unwrap.component.js`  
**APIs:**
- `GET /dtscf/getmilestonerealisedstatus` — on-chain realisation check (server fallback)
- `GET /dtscf/getunwrapparams` — retrieves amounts + salts from DB
- `POST /dtscf/decryptmetadata` — server-gated metadata decryption

### Page load — milestone status badges

On mount, `loadAllMilestoneRealisedStatuses()` queries the blockchain for each milestone:

| Condition | Badge |
|---|---|
| `today >= milestone.enddate` (local time) | **Realised** (no chain call needed) |
| All tokens: `payables[id].realized = true` | **Realised** |
| Some tokens realized | **Partially Realised** |
| All tokens: `realized = false` | **Not Yet Realised** |
| `getTokensForMilestone(id)` returns empty | **No Tokens** |

If MetaMask is available the check is done client-side via `window.ethereum`. Otherwise the server endpoint `GET /dtscf/getmilestonerealisedstatus` is used.

**Important:** The ABI used for this read call must exactly match the deployed contract's `payables()` return type. The current deployed struct is:
```
(bytes32 escrowCommitment, uint256 maturityDate, bool realized, address issuer, uint256 milestoneId)
```
Any mismatch (e.g. extra `string conditions` field) causes the ABI decoder to throw, which the catch block silently maps to `'not_realised'`.

### Milestone dropdown filter

Contractors see only milestones where:
1. They have a purchase (`dtscf_purchases`) linked to that milestone (by `organisation_id` match in the contractor tree)
2. Their wallet holds ≥ 1 TP token for that milestone (`loadUserTokenMilestones` checks `balanceOf` for each milestone's token set on-chain)

Condition 2 means the dropdown empties automatically after a successful unwrap.

### Unwrap flow

```
Contractor selects milestone → clicks Unwrap Tokens for Selected Milestone
        │
        ▼
validateForm() — milestone selected, project fields valid
        │
        ▼
MetaMask: eth_requestAccounts
  → Verify: MetaMask wallet == currentUser.walletaddress
  → Verify: MetaMask chainId == currentProject.blockchain
        │
        ▼
contract.getTokensForMilestone(milestoneId)
  → All token IDs registered for this milestone on-chain
        │
        ▼
contract.balanceOf(wallet, tokenId) per token
  → Filter to tokens held by this wallet (balance == 1)
        │
        ▼
Pre-flight realisation check:
  If milestoneRealisedStatuses[milestoneId] !== 'realised':
    contract.payables(tokenId) for each held token
    If any: realized=false AND maturityDate > now → throw (not yet realised)
        │
        ▼
GET /dtscf/getunwrapparams?contractAddress&milestoneId&blockchain&tokenIds
  Server:
    For each tokenId: SELECT amount, escrow_salt FROM dtscf_purchases WHERE token_id=?
    amounts = amount values converted to wei
    salts   = escrow_salt hex values (bytes32)
  Response: { tokenIds, amounts, salts }
        │
        ▼
MetaMask: signs and submits
  contract.batchUnwrapToDeposit(tokenIds, amounts, salts)
        │
        ▼
On-chain (per token — failures skipped silently):
  1. balanceOf(msg.sender, id) == 1            ← must own it
  2. realized=true OR block.timestamp >= maturityDate   ← must be realisable
  3. keccak256(amounts[i], salts[i]) == escrowCommitment  ← commitment check
  4. depositContract.transfer(msg.sender, amounts[i])  ← ERC-20 cash to contractor
  5. _burn(msg.sender, id, 1)                  ← NFT destroyed
  6. delete payables[id]                       ← on-chain struct cleared
  7. tokenIds.remove(id)
  8. milestoneToTokens[milestoneId].remove(id)
  9. delete tokenOwners[id]
  emit UnwrappedDeposit(id, msg.sender)
        │
        ▼
Client: Success modal with blockchain explorer link
  loadUserTokenMilestones() called → spent tokens disappear from dropdown
```

### Metadata decryption (dtscf-view page)

The view page lets contractors see their token metadata. Since the metadata is AES-256-GCM encrypted on Pinata, decryption is server-gated:

```
POST /dtscf/decryptmetadata
Body: { contractAddress, tokenId, chainId, envelope, signature?, message? }

Contractor path (MetaMask):
  1. Verify MetaMask personal_sign signature (timestamp in message, 5-min replay window)
  2. Recover signer wallet from signature
  3. contract.balanceOf(signer, tokenId) >= 1?
       YES → proceed to decrypt
       NO  → DB fallback: is signer in dtscf_contractors for this contract address?
                YES → proceed to decrypt (contractor can still view after unwrap)
                NO  → 403 Access denied

Anchor path (JWT):
  1. Verify JWT session token
  2. Confirm user has 'anchor' role in DB
  3. Skip ownership check (anchor issued all tokens → can view all)

Decryption:
  encryptionService.decryptMetadata(envelope)  // AES-256-GCM, key from .env
  → Returns plaintext metadata JSON
```

The DB fallback at step 3 means contractors can still view their token metadata **after unwrapping** (since the DB record is not cleared — the `approveUnwrapDraftById` call is currently commented out).

### State after unwrap

| | Before | After |
|---|---|---|
| Contractor ERC-1155 balance | 1 | 0 |
| `payables[id]` on-chain | populated | deleted |
| `_tokenURIs[id]` on-chain | set | **still set** (contract does not clear it on unwrap) |
| Pinata metadata file | accessible | accessible (IPFS is permanent until unpinned) |
| DB `dtscf_purchases` row | present | **still present** (DB update not implemented yet) |
| Contractor ERC-20 balance | unchanged | + purchase amount (e.g. +150 UTBD) |

---

## 10. API Endpoint Reference

All routes are prefixed `/api/dtscf/`.

### Draft management

| Method | Path | Description |
|---|---|---|
| POST | `/draftcreate/` | Create or update a project draft (multipart, supports invoice uploads) |
| GET | `/getallbydtscfid` | Fetch live project with milestones, contractors, purchases |
| GET | `/getalldraftsbydtscfid` | Fetch draft project with milestones, contractors, purchases |

### Approval workflow

| Method | Path | Description |
|---|---|---|
| PUT | `/submitdraftbyid/:id` | Maker submits draft → status=1 |
| PUT | `/acceptdraftbyid/:id` | Checker accepts → status=2 |
| PUT | `/approvedraftbyid/:id` | Approver approves → on-chain deployment |
| PUT | `/rejectdraftbyid/:id` | Approver rejects → routes back to maker |
| PUT | `/approvedeletedraftbyid/:id` | Approver approves a deletion request |
| PUT | `/droprequestbyid/:id` | Maker cancels a submitted draft |

### Contractor amendment

| Method | Path | Description |
|---|---|---|
| POST | `/submitcontractoramendment` | Contractor submits sub-contractor amendment |
| PUT | `/approvecontractoramendment/:id` | Approver approves amendment → splits |
| POST | `/confirmcontractorsplit` | Client confirms MetaMask-signed splits (writes token_id + salt to DB) |
| POST | `/revertcontractorsplit` | Client reports MetaMask-signed split failure → DB rollback |

### Milestone & unwrap

| Method | Path | Description |
|---|---|---|
| PUT | `/approvemilestonecompletedbyid/:wallet` | Anchor force-realises milestone on-chain + updates DB |
| GET | `/getmilestonerealisedstatus` | Batch on-chain realisation check for milestones (server-side RPC) |
| GET | `/getunwrapparams` | Returns tokenIds, amounts (wei), salts for batchUnwrapToDeposit |
| PUT | `/createunwrapdraft/:id` | Create unwrap request draft |
| PUT | `/approveunwrapdraftbyid/:id` | Approve unwrap (legacy server-signed path — currently unused) |

### Metadata & display

| Method | Path | Description |
|---|---|---|
| POST | `/decryptmetadata` | Server-gated AES-256-GCM decryption of Pinata-hosted token metadata |
| PUT | `/gettpnft/:wallet` | Fetch TP NFT metadata for display (calls tokenURI on-chain, decrypts) |
| GET | `/getTPbyOrgId` | Fetch all live TP projects for an organisation (queries blockchain for wallet balances) |

---

## 11. Environment Variables Reference

| Variable | Where used | Description |
|---|---|---|
| `REACT_APP_ANCHOR_WALLET` | Server controller | Anchor wallet address (receives initial wrap, holds master TP) |
| `REACT_APP_ANCHOR_PRIVATE_KEY` | Server controller | Anchor private key — signs wrapDepositToPayable, splitPayable, safeTransferFrom |
| `REACT_APP_CONTRACT_OWNER_WALLET` | Server controller | Contract owner wallet — signs forceRealizeMilestone |
| `REACT_APP_SIGNER_PRIVATE_KEY` | Server controller | Private key for CONTRACT_OWNER_WALLET |
| `REACT_APP_ALCHEMY_API_KEY` | Server controller | Alchemy API key for RPC access |
| `SEPOLIA_RPC_URL` | Server controller | Override RPC for Sepolia (default: Alchemy) |
| `AMOY_RPC_URL` | Server controller | Override RPC for Polygon Amoy |
| `METADATA_ENCRYPTION_KEY` | `encryption.service.js` | 32-byte hex AES-256-GCM key for token metadata encryption |
| `PINATA_API_KEY` | Server controller | Pinata API key for IPFS upload |
| `PINATA_SECRET_API_KEY` | Server controller | Pinata secret for IPFS upload |

---

## 12. End-to-End Data Flow Diagram

```
PHASE 1 — DRAFT                    PHASE 2 — DEPLOYMENT
─────────────────                  ──────────────────────────────────────────────────────

Anchor fills form                  Approver clicks Approve
  Project details                          │
  Milestones                               ▼
  Contractors + Purchases          DB: Copy draft → prod tables
  Sub-contractors (optional)       (dtscfs, dtscf_milestones, dtscf_contractors, dtscf_purchases)
        │                                  │
        ▼                                  ▼
POST /draftcreate                  Blockchain:
  → dtscf_drafts                     wrapDepositToPayable()     ← Anchor TP minted (token #1)
  → dtscf_contractors_drafts              │
  → dtscf_purchases_drafts          For each contractor purchase:
        │                             generateMetadataFile() → Pinata → encrypted IPFS URI
Anchor submits → status=1            splitPayable()             ← child TP minted (token #N)
        │                             safeTransferFrom()        ← TP transferred to contractor
        ▼                             DB: token_id + escrow_salt written to dtscf_purchases
Approver reviews ────────────────────►


PHASE 3 — AMENDMENT (optional)
───────────────────────────────────────────────────────────────────────────────

Contractor adds sub-contractors in amendment form
        │
        ▼
POST /submitcontractoramendment → draft tables
        │
        ▼
Approver approves PUT /approvecontractoramendment
        │
        ├── Anchor-signed splits (server):
        │     splitPayable() + safeTransferFrom() per sub-contractor purchase
        │     DB: token_id + escrow_salt written
        │
        └── Contractor-signed splits (MetaMask):
              TASKS returned to client
              Client: splitPayable() + safeTransferFrom() via MetaMask
              POST /confirmcontractorsplit → DB: token_id + escrow_salt written


PHASE 4 — REALISE MILESTONE
───────────────────────────

Anchor selects milestone → PUT /approvemilestonecompletedbyid
        │
        ▼
Blockchain: forceRealizeMilestone(milestoneId)
  → payables[tokenId].realized = true  (for ALL tokens in that milestone)
        │
        ▼
DB: dtscf_milestones.milestone_completed = 1


PHASE 5 — UNWRAP
─────────────────────────────────────────────────────────────────────────────

Contractor selects milestone → clicks Unwrap Tokens for Selected Milestone
        │
        ▼
MetaMask: eth_requestAccounts → verify wallet + chainId
        │
        ▼
getTokensForMilestone(milestoneId) → filter to contractor's tokens
        │
        ▼
Pre-flight: verify payables[id].realized == true
        │
        ▼
GET /getunwrapparams → { tokenIds, amounts_wei, salts }  ← from dtscf_purchases DB
        │
        ▼
MetaMask: batchUnwrapToDeposit(tokenIds, amounts, salts)
        │
        ▼
On-chain:
  keccak256(amount, salt) == escrowCommitment  ← commitment verified
  depositContract.transfer(contractor, amount) ← ERC-20 released
  _burn(contractor, tokenId, 1)                ← NFT destroyed
  delete payables[tokenId]                     ← on-chain struct cleared


TOKEN LIFECYCLE SUMMARY
───────────────────────────────────────────────────────────────

           Anchor wallet          Contractor wallet       Sub-contractor wallet
Phase 2:   TP#1 (full value)
Phase 2:   TP#1 (reduced)  →→→   TP#2 (split)
Phase 3:   TP#1 (reduced)         TP#2 (reduced)  →→→    TP#3 (split)
Phase 4:   [all TPs: realized=true on-chain]
Phase 5:                          TP#2 burned             TP#3 burned
                                  +ERC20 to wallet        +ERC20 to wallet
```

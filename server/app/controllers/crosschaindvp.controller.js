const db = require("../models");
const AuditTrail = db.audittrail;
const CrossChainDvP = db.crosschaindvps;
const CrossChainDvP_Draft = db.crosschaindvps_draft;
const Op = db.Sequelize.Op;
const { logDataValues } = require('../utils/logDataValues');
const moment = require('moment-timezone');
const { ethers } = require('ethers');

const LEG_START = 0;
const LEG_MATURITY = 1;

// Same retry-on-throttling pattern as crossChainRepoRelayer.js's getPastEventsWithRetry:
// Alchemy's free tier caps requests-per-second, and executeLeg's pre-flight checks
// (leg status + balance + allowance + signer gas, per leg, per chain) can burst well
// past that when relayers are also polling concurrently.
const isRateLimitError = (message) => /compute units per second|exceeded|429|rate limit/i.test(message || '');
async function withRetry(fn, label, maxRetries = 5) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (isRateLimitError(err.message) && attempt < maxRetries - 1) {
        const delayMs = 1000 * (attempt + 1);
        console.warn(`Rate limited on ${label} (attempt ${attempt + 1}/${maxRetries}), retrying in ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      throw err;
    }
  }
}

// Same chain-id -> network-name mapping used by repo.controller.js / bridge.controller.js
function networkNameForChain(chainId) {
  switch (chainId) {
    case 80001: return process.env.REACT_APP_POLYGON_MUMBAI_NETWORK;
    case 80002: return process.env.REACT_APP_POLYGON_AMOY_NETWORK;
    case 11155111: return process.env.REACT_APP_ETHEREUM_SEPOLIA_NETWORK;
    case 43113: return process.env.REACT_APP_AVALANCHE_FUJI_NETWORK;
    case 137: return process.env.REACT_APP_POLYGON_MAINNET_NETWORK;
    case 1: return process.env.REACT_APP_ETHEREUM_MAINNET_NETWORK;
    case 43114: return process.env.REACT_APP_AVALANCHE_MAINNET_NETWORK;
    default: return null;
  }
}

// Fuji uses the Alchemy URL supplied directly in .env (FUJI_RPC_URL) rather than
// being composed below, since it's already a full endpoint.
function providerUrlForChain(chainId) {
  if (chainId === 43113) {
    return process.env.FUJI_RPC_URL;
  }
  const networkName = networkNameForChain(chainId);
  //const infuraKey = process.env.REACT_APP_INFURA_API_KEY;
  const alchemyKey = process.env.REACT_APP_ALCHEMY_API_KEY;
  if (!networkName || !alchemyKey) return null;
  //return `https://${networkName}.infura.io/v3/${infuraKey}`;
  return `https://${networkName}.g.alchemy.com/v2/${alchemyKey}`;
}

function escrowAddressForChain(chainId) {
  switch (chainId) {
    case 11155111: return process.env.REACT_APP_ESCROW_SEPOLIA_ADDRESS;
    case 80002: return process.env.REACT_APP_ESCROW_AMOY_ADDRESS;
    case 43113: return process.env.REACT_APP_ESCROW_FUJI_ADDRESS;
    default: return null;
  }
}

function explorerTxUrl(chainId) {
  switch (chainId) {
    case 80001: return 'https://mumbai.polygonscan.com/tx/';
    case 80002: return 'https://amoy.polygonscan.com/tx/';
    case 11155111: return 'https://sepolia.etherscan.io/tx/';
    case 43113: return 'https://testnet.snowtrace.io/tx/';
    case 137: return 'https://polygonscan.com/tx/';
    case 1: return 'https://etherscan.io/tx/';
    case 43114: return 'https://avascan.info/blockchain/all/tx/';
    default: return '';
  }
}

function chainLabel(chainId) {
  switch (chainId) {
    case 80001: return 'Polygon Mumbai';
    case 80002: return 'Polygon Amoy';
    case 11155111: return 'Ethereum Sepolia';
    case 43113: return 'Avalanche Fuji';
    case 137: return 'Polygon Mainnet';
    case 1: return 'Ethereum Mainnet';
    case 43114: return 'Avalanche Mainnet';
    default: return `chain ${chainId}`;
  }
}


// Deterministic leg identifier shared by both chains involved in one leg of one trade.
// Matches keccak256(abi.encode(uint256 tradeRowId, uint8 legType)).
function computeLegId(tradeRowId, legType) {
  const encoded = ethers.AbiCoder.defaultAbiCoder().encode(["uint256", "uint8"], [tradeRowId, legType]);
  return ethers.keccak256(encoded);
}

let escrowAbi;
function getEscrowAbi() {
  if (!escrowAbi) {
    escrowAbi = JSON.parse(require('fs').readFileSync('./server/app/abis/CrossChainRepoEscrow.abi.json').toString());
  }
  return escrowAbi;
}

// Translates known ERC20 custom-error revert data (from the OpenZeppelin IERC20Errors
// interface) into a user-facing message. Falls back to the raw error message otherwise.
function friendlyRevertMessage(err) {
  if (typeof err.data === 'string' && err.data.startsWith('0xe450d38c')) {
    return 'Insufficient token balance';
  }
  return err.message;
}

// Sends a signed lock() transaction on the given chain, pulling `amount` (in token's
// smallest unit, wei-equivalent) of `token` from `depositor` into escrow for `legId`.
async function lockOnChain({ chainId, legId, token, depositor, beneficiary, amount, deadline }) {
  const Web3 = require('web3');
  const providerUrl = providerUrlForChain(chainId);
  const escrowAddress = escrowAddressForChain(chainId);
  if (!providerUrl) throw new Error(`No RPC provider configured for chain ${chainId}`);
  if (!escrowAddress) throw new Error(`No CrossChainRepoEscrow address configured for chain ${chainId}`);

  const web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));
  const signer = web3.eth.accounts.privateKeyToAccount(process.env.REACT_APP_SIGNER_PRIVATE_KEY);
  const escrow = new web3.eth.Contract(getEscrowAbi(), escrowAddress);

  const tx = escrow.methods.lock(legId, token, depositor, beneficiary, amount, deadline);
  const gas = await withRetry(() => tx.estimateGas({ from: signer.address }), `estimateGas on ${chainLabel(chainId)}`);
  const gasPrice = await withRetry(() => web3.eth.getGasPrice(), `getGasPrice on ${chainLabel(chainId)}`);
  const nonce = await withRetry(() => web3.eth.getTransactionCount(signer.address, 'pending'), `getTransactionCount on ${chainLabel(chainId)}`);

  const signed = await web3.eth.accounts.signTransaction(
    { from: signer.address, to: escrowAddress, data: tx.encodeABI(), gas: Math.floor(gas * 1.2), gasPrice, nonce },
    signer.privateKey
  );
  const receipt = await web3.eth.sendSignedTransaction(signed.rawTransaction);
  return { receipt, url: explorerTxUrl(chainId) + receipt.transactionHash, escrowAddress };
}

const MIN_ERC20_ABI = [
  { constant: true, inputs: [{ name: 'owner', type: 'address' }], name: 'balanceOf', outputs: [{ name: '', type: 'uint256' }], type: 'function' },
  { constant: true, inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], name: 'allowance', outputs: [{ name: '', type: 'uint256' }], type: 'function' },
];

// Read-only pre-flight: does `depositor` hold enough of `token` and has it approved
// enough allowance to this chain's escrow to cover `amount`? Checked for both legs
// before locking either one, so a shortfall on the second leg is caught before the
// first leg's funds ever leave the first depositor's wallet.
async function checkDepositorReady({ chainId, token, depositor, amount }) {
  const Web3 = require('web3');
  const providerUrl = providerUrlForChain(chainId);
  const escrowAddress = escrowAddressForChain(chainId);
  const web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));
  const erc20 = new web3.eth.Contract(MIN_ERC20_ABI, token);

  const [balance, allowance] = await Promise.all([
    withRetry(() => erc20.methods.balanceOf(depositor).call(), `balanceOf on ${chainLabel(chainId)}`),
    withRetry(() => erc20.methods.allowance(depositor, escrowAddress).call(), `allowance on ${chainLabel(chainId)}`),
  ]);

  if (BigInt(balance) < BigInt(amount)) {
    return { ok: false, message: `${depositor} has insufficient token balance on ${chainLabel(chainId)}: needs ${web3.utils.fromWei(amount, 'ether')}, has ${web3.utils.fromWei(balance, 'ether')}.` };
  }
  if (BigInt(allowance) < BigInt(amount)) {
    return { ok: false, message: `${depositor} has not approved enough allowance to the escrow on ${chainLabel(chainId)}: needs ${web3.utils.fromWei(amount, 'ether')}, approved ${web3.utils.fromWei(allowance, 'ether')}.` };
  }
  return { ok: true };
}

// Read-only pre-flight: does the backend signer (who pays gas for lock() - the
// depositor never signs or pays gas themselves) hold enough native currency on this
// chain to cover a lock() transaction? Floor is a rough safety margin, not a precise
// gas estimate, since gas price varies chain to chain and over time.
const MIN_SIGNER_GAS_BALANCE_ETHER = '0.01';
async function checkSignerGas(chainId, signerAddress) {
  const Web3 = require('web3');
  const providerUrl = providerUrlForChain(chainId);
  const web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));
  const balance = await withRetry(() => web3.eth.getBalance(signerAddress), `getBalance on ${chainLabel(chainId)}`);
  const minBalance = web3.utils.toWei(MIN_SIGNER_GAS_BALANCE_ETHER, 'ether');
  if (BigInt(balance) < BigInt(minBalance)) {
    return { ok: false, message: `Signer wallet (${signerAddress}) is low on native gas on ${chainLabel(chainId)}: ${web3.utils.fromWei(balance, 'ether')}. Fund it with at least ${MIN_SIGNER_GAS_BALANCE_ETHER} before retrying.` };
  }
  return { ok: true };
}

// Sends a signed refund() transaction on the given chain for a leg past its deadline.
async function refundOnChain({ chainId, legId }) {
  const Web3 = require('web3');
  const providerUrl = providerUrlForChain(chainId);
  const escrowAddress = escrowAddressForChain(chainId);
  if (!providerUrl) throw new Error(`No RPC provider configured for chain ${chainId}`);
  if (!escrowAddress) throw new Error(`No CrossChainRepoEscrow address configured for chain ${chainId}`);

  const web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));
  const signer = web3.eth.accounts.privateKeyToAccount(process.env.REACT_APP_SIGNER_PRIVATE_KEY);
  const escrow = new web3.eth.Contract(getEscrowAbi(), escrowAddress);

  const tx = escrow.methods.refund(legId);
  const gas = await tx.estimateGas({ from: signer.address });
  const gasPrice = await web3.eth.getGasPrice();
  const nonce = await web3.eth.getTransactionCount(signer.address, 'pending');

  const signed = await web3.eth.accounts.signTransaction(
    { from: signer.address, to: escrowAddress, data: tx.encodeABI(), gas: Math.floor(gas * 1.2), gasPrice, nonce },
    signer.privateKey
  );
  const receipt = await web3.eth.sendSignedTransaction(signed.rawTransaction);
  return { receipt, url: explorerTxUrl(chainId) + receipt.transactionHash, escrowAddress };
}

// Create and save a new Cross Chain DvP draft
exports.draftCreate = async (req, res) => {
  console.log("draftCreate: received req.body", req.body);

  if (!req.body.name) {
    res.status(400).send({ message: "Content can not be empty!" });
    return;
  }

  if (req.body.counterparty1 && req.body.counterparty2 &&
    req.body.counterparty1.toLowerCase() === req.body.counterparty2.toLowerCase()) {
    res.status(400).send({ message: "Counterparty 1 and Counterparty 2 Wallet Addresses cannot be the same" });
    return;
  }

  let startdatetimeUTC, enddatetimeUTC;
  try {
    if (!req.body.startdatetime || !req.body.enddatetime) {
      throw new Error("startdatetime or enddatetime is missing");
    }
    const startMoment = moment.tz(req.body.startdatetime, 'Asia/Singapore').utc();
    const endMoment = moment.tz(req.body.enddatetime, 'Asia/Singapore').utc();
    if (!startMoment.isValid() || !endMoment.isValid()) {
      throw new Error("Invalid date format for startdatetime or enddatetime");
    }
    startdatetimeUTC = startMoment.format('YYYY-MM-DD HH:mm:ss');
    enddatetimeUTC = endMoment.format('YYYY-MM-DD HH:mm:ss');
  } catch (error) {
    res.status(400).send({ message: `Invalid date format: ${error.message}` });
    return;
  }

  const draftFields = {
    name: req.body.name,
    description: req.body.description,
    tradedate: req.body.tradedate,
    startdatetime: startdatetimeUTC,
    enddatetime: enddatetimeUTC,
    bondisin: req.body.bondisin,
    securityLB: req.body.securityLB,
    nominal: req.body.nominal,
    cleanprice: req.body.cleanprice,
    dirtyprice: req.body.dirtyprice,
    haircut: req.body.haircut,
    startamount: req.body.startamount,
    currency: req.body.currency,
    reporate: req.body.reporate,
    interestamount: req.body.interestamount,
    counterpartyname: req.body.counterpartyname,
    counterparty1: req.body.counterparty1,
    counterparty2: req.body.counterparty2,
    smartcontractaddress1: req.body.smartcontractaddress1,
    smartcontractaddress2: req.body.smartcontractaddress2,
    underlyingTokenID1: req.body.underlyingTokenID1,
    underlyingTokenID2: req.body.underlyingTokenID2,
    amount1: req.body.amount1,
    amount2: req.body.amount2,
    daycountconvention: req.body.daycountconvention,
    blockchain: req.body.blockchain,
    blockchain2: req.body.blockchain2,
    txntype: req.body.txntype,
    maker: req.body.maker,
    checker: req.body.checker,
    approver: req.body.approver,
    actionby: req.body.actionby,
    approvedcrosschaindvpid: req.body.approvedcrosschaindvpid,
    status: 1,
    name_changed: req.body.name_changed,
    description_changed: req.body.description_changed,
    startdate_changed: req.body.startdate_changed,
    enddate_changed: req.body.enddate_changed,
    amount1_changed: req.body.amount1_changed,
    amount2_changed: req.body.amount2_changed,
    name_original: req.body.name_original,
    description_original: req.body.description_original,
    amount1_original: req.body.amount1_original,
    amount2_original: req.body.amount2_original,
    startdate_original: req.body.startdate_original,
    enddate_original: req.body.enddate_original,
  };

  console.log("draftCreate: constructed draftFields", draftFields);

  await CrossChainDvP_Draft.create(draftFields)
    .then(data => {
      logDataValues("CrossChainDvP draft created: ", data);
      AuditTrail.create({
        action: "Cross Chain DvP " + (req.body.txntype === 0 ? "create" : req.body.txntype === 1 ? "update" : req.body.txntype === 2 ? "delete" : "") + " request - created",
        ...draftFields,
        repoid: req.body.approvedcrosschaindvpid,
      })
        .then(auditres => logDataValues("Data written to audittrail for creating draft crosschaindvp request: ", auditres))
        .catch(err => console.log("Error while logging to audittrail for creating draft crosschaindvp request: " + err.message));
      res.send(data);
    })
    .catch(err => {
      const detail = err.errors ? err.errors.map(e => `${e.path}: ${e.message}`).join('; ') : err.message;
      console.log("Error while creating crosschaindvp draft: " + detail);
      res.status(500).send({ message: detail || "Some error occurred while creating the Cross Chain DvP draft." });
    });
}; // draftCreate

exports.findByName = (req, res) => {
  const name = req.query.name;
  console.log("findByName: req.query", req.query);
  var condition = name ? { name: { [Op.like]: `%${name}%` } } : null;

  CrossChainDvP.findAll({
    where: condition,
    include: [
      { model: db.recipients, on: { id: db.Sequelize.where(db.Sequelize.col("crosschaindvps.counterparty1"), "=", db.Sequelize.col("recipient.id")) }, attributes: ['id', 'name'] },
      { model: db.campaigns, on: { id: db.Sequelize.where(db.Sequelize.col("crosschaindvps.underlyingTokenID1"), "=", db.Sequelize.col("campaign.id")) }, attributes: ['id', 'name', 'tokenname', 'smartcontractaddress', 'blockchain'] }
    ]
  }).then(data => {
    res.send(data);
  }).catch(err => {
    res.status(500).send({ message: err.message || "Some error occurred while retrieving crosschaindvp." });
  });
}; // findByName

exports.getAll = (req, res) => {
  console.log("getAll: called");
  CrossChainDvP.findAll({
    include: [
      { model: db.recipients, on: { id: db.Sequelize.where(db.Sequelize.col("crosschaindvps.counterparty1"), "=", db.Sequelize.col("recipient.id")) }, attributes: ['id', 'name'] },
      { model: db.campaigns, on: { id: db.Sequelize.where(db.Sequelize.col("crosschaindvps.underlyingTokenID1"), "=", db.Sequelize.col("campaign.id")) }, attributes: ['id', 'name', 'tokenname', 'smartcontractaddress', 'blockchain'] }
    ]
  }).then(data => {
    res.send(data);
  }).catch(err => {
    res.status(500).send({ message: err.message || "Some error occurred while retrieving crosschaindvp." });
  });
}; // getAll

exports.getAllDraftsByUserId = (req, res) => {
  const id = req.query.id;
  console.log("getAllDraftsByUserId: req.query", req.query);
  // No Checker step: a submitted draft (status 1) goes straight to the Approver.
  var condition = id ? {
    [Op.or]: [
      { [Op.and]: [{ status: -1 }, { maker: id }] },
      { [Op.and]: [{ status: 0 }, { maker: id }] },
      { [Op.and]: [{ status: 1 }, { approver: id }] },
    ],
  } : null;

  CrossChainDvP_Draft.findAll({
    where: condition,
    include: [
      { model: db.recipients, on: { id: db.Sequelize.where(db.Sequelize.col("crosschaindvps_draft.counterparty2"), "=", db.Sequelize.col("recipient.id")) }, attributes: ['id', 'name'] },
      { model: db.campaigns, on: { id: db.Sequelize.where(db.Sequelize.col("crosschaindvps_draft.underlyingTokenID1"), "=", db.Sequelize.col("campaign.id")) }, attributes: ['id', 'name', 'tokenname', 'smartcontractaddress', 'blockchain'] }
    ]
  }).then(data => {
    res.send(data);
  }).catch(err => {
    res.status(500).send({ message: err.message || "Some error occurred while retrieving crosschaindvp." });
  });
}; // getAllDraftsByUserId

exports.getAllDraftsByTradeId = (req, res) => {
  const id = req.query.id;
  console.log("getAllDraftsByTradeId: req.query", req.query);
  var condition = id ? { id: id } : null;

  CrossChainDvP_Draft.findAll({
    where: condition,
    include: [
      { model: db.recipients, on: { id: db.Sequelize.where(db.Sequelize.col("crosschaindvps_draft.counterparty1"), "=", db.Sequelize.col("recipient.id")) }, attributes: ['id', 'name'] },
      { model: db.campaigns, on: { id: db.Sequelize.where(db.Sequelize.col("crosschaindvps_draft.underlyingTokenID1"), "=", db.Sequelize.col("campaign.id")) }, attributes: ['id', 'name', 'tokenname', 'smartcontractaddress', 'blockchain'] }
    ]
  }).then(data => {
    if (data.length === 0) {
      res.status(500).send({ message: "No such record in the system" });
    } else res.send(data);
  }).catch(err => {
    res.status(500).send({ message: err.message || "Some error occurred while retrieving crosschaindvp." });
  });
}; // getAllDraftsByTradeId

exports.findExact = (req, res) => {
  const name = req.query.name;
  console.log("findExact: req.query", req.query);
  var condition = name ? { name: name } : null;
  CrossChainDvP.findAll({ where: condition }).then(data => {
    res.send(data);
  }).catch(err => {
    res.status(500).send({ message: err.message || "Some error occurred while retrieving crosschaindvp." });
  });
}; // findExact

exports.findOne = (req, res) => {
  const id = req.query.id;
  console.log("findOne: req.query", req.query);
  var condition = id ? { id: id } : null;
  CrossChainDvP.findAll({ where: condition }).then(data => {
    if (data.length === 0) {
      res.status(500).send({ message: "No such record in the system" });
    } else res.send(data);
  }).catch(err => {
    res.status(500).send({ message: err.message || "Some error occurred while retrieving crosschaindvp." });
  });
}; // findOne

exports.submitDraftById = async (req, res) => {
  const draft_id = req.params.id;
  console.log("submitDraftById: draft_id", draft_id, "req.body", req.body);

  if (req.body.counterparty1 && req.body.counterparty2 &&
    req.body.counterparty1.toLowerCase() === req.body.counterparty2.toLowerCase()) {
    res.status(400).send({ message: "Counterparty 1 and Counterparty 2 Wallet Addresses cannot be the same" });
    return;
  }

  await CrossChainDvP_Draft.update({
    status: 1,
    name: req.body.name,
    description: req.body.description,
    tradedate: req.body.tradedate,
    startdatetime: req.body.startdatetime,
    enddatetime: req.body.enddatetime,
    bondisin: req.body.bondisin,
    securityLB: req.body.securityLB,
    nominal: req.body.nominal,
    cleanprice: req.body.cleanprice,
    dirtyprice: req.body.dirtyprice,
    haircut: req.body.haircut,
    startamount: req.body.startamount,
    currency: req.body.currency,
    reporate: req.body.reporate,
    interestamount: req.body.interestamount,
    counterpartyname: req.body.counterpartyname,
    counterparty1: req.body.counterparty1,
    counterparty2: req.body.counterparty2,
    smartcontractaddress1: req.body.smartcontractaddress1,
    smartcontractaddress2: req.body.smartcontractaddress2,
    underlyingTokenID1: req.body.underlyingTokenID1,
    underlyingTokenID2: req.body.underlyingTokenID2,
    amount1: req.body.amount1,
    amount2: req.body.amount2,
    daycountconvention: req.body.daycountconvention,
    blockchain: req.body.blockchain,
    blockchain2: req.body.blockchain2,
    txntype: req.body.txntype,
    maker: req.body.maker,
    checker: req.body.checker,
    approver: req.body.approver,
    checkerComments: req.body.checkerComments,
    approverComments: req.body.approverComments,
    actionby: req.body.actionby,
  }, { where: { id: draft_id } })
    .then(num => {
      if (num == 1) {
        AuditTrail.create({
          action: "Cross Chain DvP " + (req.body.txntype === 0 ? "create" : req.body.txntype === 1 ? "update" : req.body.txntype === 2 ? "delete" : "") + " request - resubmitted",
          ...req.body,
          draftcrosschaindvpid: draft_id,
          status: 1,
        }).catch(err => console.log("Error while logging to audittrail for resubmitting crosschaindvp request: " + err.message));
        res.send({ message: "Cross Chain DvP resubmitted successfully." });
      } else {
        res.send({ message: `Record updated =${num}. Cannot update Cross Chain DvP with id=${draft_id}.` });
      }
    })
    .catch(err => {
      res.status(500).send({ message: `Error updating Cross Chain DvP. ${err}` });
    });
}; // submitDraftById

exports.acceptDraftById = async (req, res) => {
  const draft_id = req.params.id;
  console.log("acceptDraftById: draft_id", draft_id, "req.body", req.body);

  await CrossChainDvP_Draft.update({
    status: 2,
    checkerComments: req.body.checkerComments,
    approverComments: req.body.approverComments,
  }, { where: { id: draft_id } })
    .then(num => {
      if (num == 1) {
        AuditTrail.create({
          action: "Cross Chain DvP " + (req.body.txntype === 0 ? "create" : req.body.txntype === 1 ? "update" : req.body.txntype === 2 ? "delete" : "") + " request - accepted",
          draftcrosschaindvpid: draft_id,
          maker: req.body.maker,
          checker: req.body.checker,
          approver: req.body.approver,
          actionby: req.body.actionby,
          checkerComments: req.body.checkerComments,
          approverComments: req.body.approverComments,
          status: 2,
        }).catch(err => console.log("Error while logging to audittrail for accepting crosschaindvp request: " + err.message));
        res.send({ message: "Cross Chain DvP was accepted successfully." });
      } else {
        res.send({ message: `Record updated =${num}. Cannot update Cross Chain DvP with id=${draft_id}.` });
      }
    })
    .catch(err => {
      res.status(500).send({ message: `Error updating Cross Chain DvP. ${err}` });
    });
}; // acceptDraftById

exports.rejectDraftById = async (req, res) => {
  const draft_id = req.params.id;
  console.log("rejectDraftById: draft_id", draft_id, "req.body", req.body);

  await CrossChainDvP_Draft.update({
    status: -1,
    checkerComments: req.body.checkerComments,
    approverComments: req.body.approverComments,
  }, { where: { id: draft_id } })
    .then(num => {
      if (num == 1) {
        AuditTrail.create({
          action: "Cross Chain DvP " + (req.body.txntype === 0 ? "create" : req.body.txntype === 1 ? "update" : req.body.txntype === 2 ? "delete" : "") + " request - rejected",
          draftcrosschaindvpid: draft_id,
          maker: req.body.maker,
          checker: req.body.checker,
          approver: req.body.approver,
          actionby: req.body.actionby,
          checkerComments: req.body.checkerComments,
          approverComments: req.body.approverComments,
          status: -1,
        }).catch(err => console.log("Error while logging to audittrail for rejecting crosschaindvp request: " + err.message));
        res.send({ message: "Cross Chain DvP was rejected." });
      } else {
        res.send({ message: `Record updated =${num}. Cannot reject Cross Chain DvP with id=${draft_id}.` });
      }
    })
    .catch(err => {
      res.status(500).send({ message: `Error rejecting Cross Chain DvP. ${err}` });
    });
}; // rejectDraftById

// approveDraftById: promotes a checked draft into the main crosschaindvps table.
// Unlike Repo, this does NOT deploy a contract — the escrow contracts are
// long-lived and shared, deployed once per chain ahead of time (see
// scripts/deployCrossChainRepoEscrow.js). This only registers the trade;
// actual fund movement happens later via executeStartLegById / executeMaturityLegById.
exports.approveDraftById = async (req, res) => {
  console.log("approveDraftById: draft_id", req.params.id, "req.body", req.body);

  if (!req.body.name) {
    res.status(400).send({ message: "Content can not be empty!" });
    return;
  }
  if (req.body.counterparty1 && req.body.counterparty2 &&
    req.body.counterparty1.toLowerCase() === req.body.counterparty2.toLowerCase()) {
    res.status(400).send({ message: "Counterparty 1 and Counterparty 2 Wallet Addresses cannot be the same" });
    return;
  }
  const draft_id = req.params.id;
  const isNewTrade = (req.body.approvedcrosschaindvpid === -1 || req.body.approvedcrosschaindvpid === null);
  var errorSent = false;

  await CrossChainDvP_Draft.update({
    status: 3,
    approverComments: req.body.approverComments,
  }, { where: { id: draft_id } })
    .then(num => {
      if (num[0] !== 1 && !errorSent) {
        res.send({ message: `Record updated =${num[0]}. Cannot update Cross Chain DvP with id=${draft_id}.` });
        errorSent = true;
      }
    })
    .catch(err => {
      if (!errorSent) {
        res.status(400).send({ message: err.toString().replace('*', '') });
        errorSent = true;
      }
    });

  if (errorSent) return;

  const commonFields = {
    name: req.body.name,
    description: req.body.description,
    tradedate: req.body.tradedate,
    startdatetime: req.body.startdatetime,
    enddatetime: req.body.enddatetime,
    bondisin: req.body.bondisin,
    securityLB: req.body.securityLB,
    nominal: req.body.nominal,
    cleanprice: req.body.cleanprice,
    dirtyprice: req.body.dirtyprice,
    haircut: req.body.haircut,
    startamount: req.body.startamount,
    currency: req.body.currency,
    reporate: req.body.reporate,
    interestamount: req.body.interestamount,
    counterpartyname: req.body.counterpartyname,
    counterparty1: req.body.counterparty1,
    counterparty2: req.body.counterparty2,
    smartcontractaddress1: req.body.smartcontractaddress1,
    smartcontractaddress2: req.body.smartcontractaddress2,
    underlyingTokenID1: req.body.underlyingTokenID1,
    underlyingTokenID2: req.body.underlyingTokenID2,
    amount1: req.body.amount1,
    amount2: req.body.amount2,
    daycountconvention: req.body.daycountconvention,
    blockchain: req.body.blockchain,
    blockchain2: req.body.blockchain2,
    actionby: req.body.actionby,
  };

  console.log("approveDraftById: constructed commonFields", commonFields, "isNewTrade", isNewTrade);

  AuditTrail.create({
    action: "Cross Chain DvP " + (req.body.txntype === 0 ? "create" : req.body.txntype === 1 ? "update" : req.body.txntype === 2 ? "delete" : "") + " request - approved",
    ...commonFields,
    draftcrosschaindvpid: draft_id,
    maker: req.body.maker,
    checker: req.body.checker,
    approver: req.body.approver,
    checkerComments: req.body.checkerComments,
    approverComments: req.body.approverComments,
    status: 3,
  }).catch(err => console.log("Error while logging to audittrail for approving crosschaindvp request: " + err.message));

  if (isNewTrade) {
    await CrossChainDvP.create({ ...commonFields, txntype: req.body.txntype, draftcrosschaindvpid: draft_id })
      .then(data => res.send(data))
      .catch(err => {
        if (!errorSent) {
          res.status(400).send({ message: err.toString().replace('*', '') });
          errorSent = true;
        }
      });
  } else {
    await CrossChainDvP.update({ ...commonFields, txntype: req.body.txntype, draftcrosschaindvpid: draft_id }, { where: { id: req.body.approvedcrosschaindvpid } })
      .then(data => res.send(data))
      .catch(err => {
        if (!errorSent) {
          res.status(400).send({ message: err.toString().replace('*', '') });
          errorSent = true;
        }
      });
  }
}; // approveDraftById

exports.approveDeleteDraftById = async (req, res) => {
  const draft_id = req.params.id;
  console.log("approveDeleteDraftById: draft_id", draft_id, "req.body", req.body);
  var msgSent = false;

  var Done = await CrossChainDvP_Draft.update({
    status: 3,
    approverComments: req.body.approvercomments,
  }, { where: { id: draft_id } })
    .then(num => {
      if (num == 1) {
        AuditTrail.create({
          action: "Cross Chain DvP " + (req.body.txntype === 0 ? "create" : req.body.txntype === 1 ? "update" : req.body.txntype === 2 ? "delete" : "") + " request - deleted",
          draftcrosschaindvpid: draft_id,
          maker: req.body.maker,
          checker: req.body.checker,
          approver: req.body.approver,
          actionby: req.body.actionby,
          checkerComments: req.body.checkerComments,
          approverComments: req.body.approverComments,
          status: 3,
        }).catch(err => console.log("Error while logging to audittrail for crosschaindvp delete request: " + err.message));
      }
      return true;
    })
    .catch(err => {
      if (!msgSent) {
        res.status(400).send({ message: err.toString().replace('*', '') });
        msgSent = true;
      }
      return false;
    });

  if (Done) {
    await CrossChainDvP.destroy({ where: { id: req.body.approvedcrosschaindvpid } })
      .then(num => {
        if (!msgSent) {
          res.send({ message: num == 1 ? "Cross Chain DvP was deleted successfully!" : `Cannot delete Cross Chain DvP with id=${req.body.approvedcrosschaindvpid}. Maybe it was not found!` });
          msgSent = true;
        }
      })
      .catch(err => {
        if (!msgSent) {
          res.status(400).send({ message: err.toString().replace('*', '') });
          msgSent = true;
        }
      });
  }
}; // approveDeleteDraftById

exports.dropRequestById = async (req, res) => {
  const draft_id = req.params.id;
  console.log("dropRequestById: draft_id", draft_id, "req.body", req.body);
  var msgSent = false;

  await CrossChainDvP_Draft.update({
    status: 9,
    approverComments: req.body.approvercomments,
  }, { where: { id: draft_id } })
    .then(num => {
      if (num == 1) {
        AuditTrail.create({
          action: "Cross Chain DvP " + (req.body.txntype === 0 ? "create" : req.body.txntype === 1 ? "update" : req.body.txntype === 2 ? "delete" : "") + " request - dropped",
          draftcrosschaindvpid: draft_id,
          maker: req.body.maker,
          checker: req.body.checker,
          approver: req.body.approver,
          actionby: req.body.actionby,
          checkerComments: req.body.checkerComments,
          approverComments: req.body.approverComments,
          status: 9,
        }).catch(err => console.log("Error while logging to audittrail for dropping crosschaindvp request: " + err.message));
        if (!msgSent) {
          res.send({ message: "Request dropped(deleted) successfully!" });
          msgSent = true;
        }
      }
    })
    .catch(err => {
      if (!msgSent) {
        res.status(400).send({ message: err.toString().replace('*', '') });
        msgSent = true;
      }
    });
}; // dropRequestById

// Builds the two lock() calls (one per chain) for either the start or maturity leg,
// mirroring ERC20TokenRepo.sol's startTrade()/matureTrade() cash/asset-sender logic:
// at start, Counterparty1 sends Token1 (on `blockchain`) to Counterparty2, and
// Counterparty2 sends Token2 (on `blockchain2`) to Counterparty1. At maturity the
// direction reverses, and whichever side is the "cash" side (per securityLB) repays
// startamount + interestamount instead of the original amount.
function buildLegLocks(trade, legType, toWei) {
  const isToken1Asset = trade.securityLB === "B"; // securityLB "B" => Token1 is the asset, Token2 is cash
  const cashIsChain1 = !isToken1Asset;

  if (legType === LEG_START) {
    return [
      { chainId: trade.blockchain, token: trade.smartcontractaddress1, depositor: trade.counterparty1, beneficiary: trade.counterparty2, amount: toWei(trade.amount1) },
      { chainId: trade.blockchain2, token: trade.smartcontractaddress2, depositor: trade.counterparty2, beneficiary: trade.counterparty1, amount: toWei(trade.amount2) },
    ];
  }

  // Maturity leg: direction reverses; the cash side repays startamount + interestamount.
  // Convert each amount to Wei first, then add as BigInt - avoids JS float rounding on financial amounts.
  const cashAmount = (BigInt(toWei(trade.startamount)) + BigInt(toWei(trade.interestamount))).toString();
  return [
    {
      chainId: trade.blockchain,
      token: trade.smartcontractaddress1,
      depositor: trade.counterparty2,
      beneficiary: trade.counterparty1,
      amount: cashIsChain1 ? cashAmount : toWei(trade.amount1),
    },
    {
      chainId: trade.blockchain2,
      token: trade.smartcontractaddress2,
      depositor: trade.counterparty1,
      beneficiary: trade.counterparty2,
      amount: cashIsChain1 ? toWei(trade.amount2) : cashAmount,
    },
  ];
}

// The escrow requires 2-of-3 relayers to confirm release. Locking funds with fewer than
// 2 relayers live means the leg can lock and then sit stuck with no quorum to release it
// (see crossChainRepoRelayer.js heartbeat_relayer{N}.json, written every 10s while running).
const RELAYER_HEARTBEAT_STALE_MS = 30000;
function countLiveRelayers() {
  const fs = require('fs');
  const path = require('path');
  const relayerDir = path.join(__dirname, '..', 'relayer');
  let alive = 0;
  for (let i = 1; i <= 3; i++) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(relayerDir, `heartbeat_relayer${i}.json`)));
      if (Date.now() - data.timestamp < RELAYER_HEARTBEAT_STALE_MS) alive++;
    } catch (err) {
      // Missing or unreadable heartbeat file means that relayer isn't running.
    }
  }
  return alive;
}

// Streams step-by-step progress as chunked text (LOG:/SUCCESS:/ERROR: lines), same
// convention as dtscf.controller.js's approveContractorAmendment - so the client can
// show what's actually happening (which counterparty's tokens are being pulled, on
// which chain) instead of a plain spinner during the ~30-60s a leg lock can take.
async function executeLeg(req, res, legType) {
  require('dotenv').config();
  const trade_id = req.params.id;
  const legName = legType === LEG_START ? 'start' : 'maturity';
  console.log(`executeLeg (${legName}): trade_id`, trade_id, "req.body", req.body);

  res.writeHead(200, { 'Content-Type': 'text/plain', 'Transfer-Encoding': 'chunked' });
  let responded = false;
  const sendLog     = msg => { if (!responded) res.write(`LOG: ${msg}\n`); console.log(msg); };
  const sendLocks   = locks => { if (!responded) res.write(`LOCKS: ${JSON.stringify(locks)}\n`); };
  const sendSuccess = msg => { if (!responded) { res.write(`SUCCESS: ${msg}\n`); res.end(); responded = true; } };
  const sendError   = msg => { if (!responded) { res.write(`ERROR: ${msg}\n`);   res.end(); responded = true; } console.error(msg); };

  const Web3 = require('web3');
  const web3 = new Web3();
  const toWei = (v) => web3.utils.toWei((v || "0").toString(), 'ether');

  try {
    sendLog('Checking relayer quorum...');
    const liveRelayers = countLiveRelayers();
    if (liveRelayers < 2) {
      return sendError(`Only ${liveRelayers}/3 relayers are running. At least 2 are required to reach quorum and release a locked leg - start the relayers before locking funds.`);
    }
    sendLog(`Relayer quorum OK (${liveRelayers}/3 running).`);

    const trade = await CrossChainDvP.findOne({ where: { id: trade_id } });
    if (!trade) return sendError(`No Cross Chain DvP found with id=${trade_id}`);

    const deadlineSeconds = req.body.deadlineSeconds ? parseInt(req.body.deadlineSeconds, 10) : 72 * 3600;
    const deadline = Math.floor(Date.now() / 1000) + deadlineSeconds;
    const legId = computeLegId(trade_id, legType);
    const locks = buildLegLocks(trade, legType, toWei);

    // Cross-chain locking can't be made atomic in the database-transaction sense -
    // there is no shared consensus across two independent chains to roll one back if
    // the other fails. What we CAN do: check both legs' on-chain status first and
    // skip whichever is already Locked, so retrying after a partial failure resumes
    // instead of re-attempting (and reverting on) the leg that already succeeded.
    // This must happen BEFORE the balance/allowance pre-flight below - an already-locked
    // leg's depositor legitimately has an empty wallet now (their tokens are already
    // sitting in escrow), so checking their wallet balance again would wrongly fail.
    sendLog('Checking on-chain status of each leg...');
    const pendingLocks = [];
    for (const leg of locks) {
      const existingStatus = await getLegStatusOnChain({ chainId: leg.chainId, legId });
      if (existingStatus === LEG_ON_CHAIN_STATUS_REFUNDED) {
        return sendError(`The ${chainLabel(leg.chainId)} leg for this legId was already refunded and cannot be re-locked (the escrow only allows locking a legId once, ever). This trade's ${legName} leg needs manual intervention.`);
      }
      if (existingStatus !== LEG_ON_CHAIN_STATUS_NONE) {
        sendLog(`${chainLabel(leg.chainId)} leg already locked in a previous attempt - skipping.`);
        continue;
      }
      pendingLocks.push(leg);
    }

    const results = [];
    if (pendingLocks.length === 0) {
      sendLog('Both legs were already locked in a previous attempt - nothing new to lock.');
    } else {
      // Pre-flight, before pulling anything still pending: both counterparties must
      // already hold and have approved enough tokens, and the signer (who pays gas for
      // lock(), not the depositors) must have enough native currency on every chain
      // still involved. Catching a shortfall here means neither pending leg gets
      // locked, instead of locking one chain while the other reverts.
      sendLog('Validating balances, allowances, and signer gas before locking...');
      const signerAddress = web3.eth.accounts.privateKeyToAccount(process.env.REACT_APP_SIGNER_PRIVATE_KEY).address;
      const involvedChains = [...new Set(pendingLocks.map(l => l.chainId))];
      for (const chainId of involvedChains) {
        const gasCheck = await checkSignerGas(chainId, signerAddress);
        if (!gasCheck.ok) return sendError(gasCheck.message);
      }
      for (const leg of pendingLocks) {
        const readyCheck = await checkDepositorReady(leg);
        if (!readyCheck.ok) return sendError(readyCheck.message);
      }
      sendLog('Balances, allowances, and signer gas all OK.');

      for (const leg of pendingLocks) {
        sendLog(`Pulling ${web3.utils.fromWei(leg.amount, 'ether')} tokens from ${leg.depositor} on ${chainLabel(leg.chainId)} into escrow...`);
        const result = await lockOnChain({ ...leg, legId, deadline });
        results.push({ chainId: leg.chainId, tokenAddress: leg.token, escrowAddress: result.escrowAddress, txHash: result.receipt.transactionHash, url: result.url });
        sendLog(`Locked on ${chainLabel(leg.chainId)}. txHash=${result.receipt.transactionHash}`);
      }
    }

    console.log(`executeLeg (${legName}): lock results`, results);

    const statusField = legType === LEG_START ? 'startlegstatus' : 'maturitylegstatus';
    await CrossChainDvP.update({ [statusField]: 1 }, { where: { id: trade_id } });

    sendLocks(results);
    sendSuccess(`${legType === LEG_START ? 'Start' : 'Maturity'} leg locked on both chains. Waiting for relayer quorum to release.`);
  } catch (err) {
    console.error(`Error locking ${legName} leg:`, err);
    sendError(friendlyRevertMessage(err));
  }
}

exports.executeStartLegById = async (req, res) => {
  await executeLeg(req, res, LEG_START);
}; // executeStartLegById

exports.executeMaturityLegById = async (req, res) => {
  await executeLeg(req, res, LEG_MATURITY);
}; // executeMaturityLegById

// Reads a leg's on-chain status (0=None, 1=Locked, 2=Released, 3=Refunded) from the
// escrow on the given chain. Read-only, no signer needed.
async function getLegStatusOnChain({ chainId, legId }) {
  const Web3 = require('web3');
  const providerUrl = providerUrlForChain(chainId);
  const escrowAddress = escrowAddressForChain(chainId);
  if (!providerUrl) throw new Error(`No RPC provider configured for chain ${chainId}`);
  if (!escrowAddress) throw new Error(`No CrossChainRepoEscrow address configured for chain ${chainId}`);

  const web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));
  const escrow = new web3.eth.Contract(getEscrowAbi(), escrowAddress);
  const leg = await withRetry(() => escrow.methods.getLeg(legId).call(), `getLeg on ${chainLabel(chainId)}`);
  return parseInt(leg.status, 10);
}

// Matches CrossChainRepoEscrow.sol's Status enum: None, Locked, Released, Refunded.
const LEG_ON_CHAIN_STATUS_NONE = 0;
const LEG_ON_CHAIN_STATUS_RELEASED = 2;
const LEG_ON_CHAIN_STATUS_REFUNDED = 3;

// Webhook the relayer calls after it observes a Released event on one chain for a legId.
// A leg's DB status should only flip to "released" once BOTH chains have released (the
// legId is chain-agnostic - see computeLegId), so this reads the *other* chain's on-chain
// status before updating anything; if that side hasn't released yet, it's a no-op and the
// other chain's own Released notification will complete the check later.
exports.legReleased = async (req, res) => {
  require('dotenv').config();
  const { legId, chainId } = req.body;
  console.log("legReleased: req.body", req.body);
  if (!legId || !chainId) {
    res.status(400).send({ message: "legId and chainId are required" });
    return;
  }

  const candidates = await CrossChainDvP.findAll({ where: { [Op.or]: [{ startlegstatus: 1 }, { maturitylegstatus: 1 }] } });

  for (const trade of candidates) {
    const legTypeMatch = [
      { legType: LEG_START, statusField: 'startlegstatus', active: trade.startlegstatus === 1 },
      { legType: LEG_MATURITY, statusField: 'maturitylegstatus', active: trade.maturitylegstatus === 1 },
    ].find(({ legType, active }) => active && computeLegId(trade.id, legType) === legId);

    if (!legTypeMatch) continue;

    const otherChainId = parseInt(chainId, 10) === trade.blockchain ? trade.blockchain2 : trade.blockchain;
    let otherChainStatus;
    try {
      otherChainStatus = await getLegStatusOnChain({ chainId: otherChainId, legId });
    } catch (err) {
      console.error(`legReleased: error reading leg status on chain ${otherChainId} for trade_id=${trade.id}: ${err.message}`);
      res.status(500).send({ message: `Error reading leg status on the other chain: ${err.message}` });
      return;
    }

    if (otherChainStatus !== LEG_ON_CHAIN_STATUS_RELEASED) {
      console.log(`legReleased: trade_id=${trade.id} legId=${legId} released on chain ${chainId}, still waiting on chain ${otherChainId}`);
      res.send({ message: "Recorded. Waiting for the other chain to also release." });
      return;
    }

    await CrossChainDvP.update({ [legTypeMatch.statusField]: 2 }, { where: { id: trade.id } });
    console.log(`legReleased: trade_id=${trade.id} ${legTypeMatch.statusField} set to 2 (released on both chains)`);
    res.send({ message: `${legTypeMatch.statusField} marked released.`, trade_id: trade.id });
    return;
  }

  res.status(404).send({ message: "No pending leg found matching that legId." });
}; // legReleased

// Manual recovery: reclaim a locked leg on one chain after its deadline has passed
// and the relayer quorum never released it (e.g. the counterparty leg never locked).
exports.refundLegById = async (req, res) => {
  require('dotenv').config();
  const trade_id = req.params.id;
  const legType = req.body.legType === 'maturity' ? LEG_MATURITY : LEG_START;
  const chainId = parseInt(req.body.blockchain, 10);
  console.log("refundLegById: trade_id", trade_id, "legType", legType, "chainId", chainId, "req.body", req.body);

  const legId = computeLegId(trade_id, legType);
  try {
    const result = await refundOnChain({ chainId, legId });
    console.log("refundLegById: refund result", { escrowAddress: result.escrowAddress, txHash: result.receipt.transactionHash, url: result.url });
    res.send({ message: "Refund submitted.", escrowAddress: result.escrowAddress, txHash: result.receipt.transactionHash, url: result.url });
  } catch (err) {
    console.log("refundLegById: error", err.message);
    res.status(400).send({ message: err.message });
  }
}; // refundLegById

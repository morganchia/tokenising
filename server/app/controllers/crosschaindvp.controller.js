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
// an Infura subdomain, since Infura does not offer an Avalanche endpoint here.
function providerUrlForChain(chainId) {
  if (chainId === 43113) {
    return process.env.FUJI_RPC_URL;
  }
  const networkName = networkNameForChain(chainId);
  const infuraKey = process.env.REACT_APP_INFURA_API_KEY;
  if (!networkName || !infuraKey) return null;
  return `https://${networkName}.infura.io/v3/${infuraKey}`;
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
  const gas = await tx.estimateGas({ from: signer.address });
  const gasPrice = await web3.eth.getGasPrice();
  const nonce = await web3.eth.getTransactionCount(signer.address, 'pending');

  const signed = await web3.eth.accounts.signTransaction(
    { from: signer.address, to: escrowAddress, data: tx.encodeABI(), gas: Math.floor(gas * 1.2), gasPrice, nonce },
    signer.privateKey
  );
  const receipt = await web3.eth.sendSignedTransaction(signed.rawTransaction);
  return { receipt, url: explorerTxUrl(chainId) + receipt.transactionHash };
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
  return { receipt, url: explorerTxUrl(chainId) + receipt.transactionHash };
}

// Create and save a new Cross Chain DvP draft
exports.draftCreate = async (req, res) => {
  if (!req.body.name) {
    res.status(400).send({ message: "Content can not be empty!" });
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
      console.log("Error while creating crosschaindvp draft: " + err.message);
      res.status(500).send({ message: err.message || "Some error occurred while creating the Cross Chain DvP draft." });
    });
}; // draftCreate

exports.findByName = (req, res) => {
  const name = req.query.name;
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
  var condition = name ? { name: name } : null;
  CrossChainDvP.findAll({ where: condition }).then(data => {
    res.send(data);
  }).catch(err => {
    res.status(500).send({ message: err.message || "Some error occurred while retrieving crosschaindvp." });
  });
}; // findExact

exports.findOne = (req, res) => {
  const id = req.query.id;
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
  if (!req.body.name) {
    res.status(400).send({ message: "Content can not be empty!" });
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

async function executeLeg(req, res, legType) {
  require('dotenv').config();
  const trade_id = req.params.id;
  const Web3 = require('web3');
  const web3 = new Web3();
  const toWei = (v) => web3.utils.toWei((v || "0").toString(), 'ether');

  const trade = await CrossChainDvP.findOne({ where: { id: trade_id } });
  if (!trade) {
    res.status(400).send({ message: `No Cross Chain DvP found with id=${trade_id}` });
    return;
  }

  const deadlineSeconds = req.body.deadlineSeconds ? parseInt(req.body.deadlineSeconds, 10) : 72 * 3600;
  const deadline = Math.floor(Date.now() / 1000) + deadlineSeconds;
  const legId = computeLegId(trade_id, legType);
  const locks = buildLegLocks(trade, legType, toWei);

  const results = [];
  try {
    for (const leg of locks) {
      const result = await lockOnChain({ ...leg, legId, deadline });
      results.push({ chainId: leg.chainId, txHash: result.receipt.transactionHash, url: result.url });
    }
  } catch (err) {
    console.error(`Error locking ${legType === LEG_START ? 'start' : 'maturity'} leg:`, err);
    res.status(400).send({ message: friendlyRevertMessage(err), locked: results });
    return;
  }

  const statusField = legType === LEG_START ? 'startlegstatus' : 'maturitylegstatus';
  await CrossChainDvP.update({ [statusField]: 1 }, { where: { id: trade_id } });

  res.send({
    message: `${legType === LEG_START ? 'Start' : 'Maturity'} leg locked on both chains. Waiting for relayer quorum to release.`,
    legId,
    locks: results,
  });
}

exports.executeStartLegById = async (req, res) => {
  await executeLeg(req, res, LEG_START);
}; // executeStartLegById

exports.executeMaturityLegById = async (req, res) => {
  await executeLeg(req, res, LEG_MATURITY);
}; // executeMaturityLegById

// Manual recovery: reclaim a locked leg on one chain after its deadline has passed
// and the relayer quorum never released it (e.g. the counterparty leg never locked).
exports.refundLegById = async (req, res) => {
  require('dotenv').config();
  const trade_id = req.params.id;
  const legType = req.body.legType === 'maturity' ? LEG_MATURITY : LEG_START;
  const chainId = parseInt(req.body.blockchain, 10);

  const legId = computeLegId(trade_id, legType);
  try {
    const result = await refundOnChain({ chainId, legId });
    res.send({ message: "Refund submitted.", txHash: result.receipt.transactionHash, url: result.url });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
}; // refundLegById

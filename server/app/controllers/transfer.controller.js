const db = require("../models");
const AuditTrail = db.audittrail;

const Transfer = db.transfers;
const Transfers_Draft = db.transfers_draft;
//const Recipient = db.recipient;

const Op = db.Sequelize.Op;
const adjustdecimals = 18;

// https://stackoverflow.com/questions/27082377/get-number-of-decimal-places-with-javascript
function countDecimals(value) {
  //console.log("CountDecimals for :", value);
  //console.log("!!!!!!!!!!!!! typeof value === ", typeof value);
  let text = value.toString()
  // verify if number 0.000005 is represented as "5e-6"
  if (text.indexOf('e-') > -1) {
    let [base, trail] = text.split('e-');
    let deg = parseInt(trail, 10);
    return deg;
  }
  
  try {
    let num = parseFloat(value);

    // count decimals for number in representation like "0.123456"
    if (typeof value === "number" && Math.floor(value) !== value) {
      return value.toString().split(".")[1].length || 0;
    } else if (typeof value === "string" && Math.floor(num) !== num) {
      //console.log("Input value is a strng!!!!!!!!!!111")
      return value.split(".")[1].length || 0;
    }
  } catch(e) {
    return 0;
  }
  return 0;
}

function createStringWithZeros(num) { return ("0".repeat(num)); }

// Create and Save a new Campaign
exports.draftCreate = async (req, res) => {
  // Validate request
  if (!req.body.smartcontractaddress) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }

  console.log("Received for Transfer draft Create:");
  console.log(req.body);
/*
  console.log(req.body.campaignId);
  console.log(req.body.tokenname);
  console.log(req.body.smartcontractaddress);
//  console.log(req.body.startdate);
//  console.log(req.body.enddate);
  console.log(req.body.recipient);
  console.log(req.body.recipientwallet);
  console.log(req.body.transferAmount);
  console.log(req.body.maker);
  console.log(req.body.checker);
  console.log(req.body.approver);
  console.log(req.body.actionby);
*/

  // Save Transfer in the database
  await Transfers_Draft.create(  // inside draftCreate
    { 
      campaignId            : req.body.campaignId,
      tokenname             : req.body.tokenname.toUpperCase(), 
      smartcontractaddress  : req.body.smartcontractaddress,
      blockchain            : req.body.campaign.blockchain,
      sourcewallet          : "Internal campaign wallet",
      recipientId           : req.body.recipient,
      recipientwallet     : req.body.recipientwallet,
//      startdate:            req.body.startdate, 
//      enddate:              req.body.enddate, 
      transferAmount        : req.body.transferAmount,
//      txntype:              req.body.txntype,   // 0 - create,  1-edit,  2-delete
      maker                 : req.body.maker,
      checker               : req.body.checker,
      approver              : req.body.approver,
      actionby              : req.body.actionby,
      status                : 1   // 0 = draft; 1 = created pending review; 2 = reviewed pending approval; 3 = approved
      
    }, 
  )
  .then(data => {

    // write to audit
    AuditTrail.create(
      { 
        action                : "Transfer "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - created",
        tokenname             : req.body.tokenname.toUpperCase(), 
        smartcontractaddress  : req.body.smartcontractaddress,
        blockchain            : req.body.campaign.blockchain,
        amount                : req.body.transferAmount,
        sourcewallet          : "Internal campaign wallet",
        recipientwallet       : req.body.recipientwallet,
        recipientId           : req.body.recipient,
        txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

        campaignId            : req.body.campaignId,
        maker                 : req.body.maker,
        checker               : req.body.checker,
        approver              : req.body.approver,
        actionby              : req.body.actionby,
        checkerComments       : req.body.checkerComments,
        approverComments      : req.body.approverComments,
        status                : 1,   // 0 = draft; 1 = created pending review; 2 = reviewed pending approval; 3 = approved
      }, 
    )
    .then(auditres => {
      console.log("Data written to audittrail for creating transfer request.");
    })
    .catch(err => {
      console.log("Error while logging to audittrail for creating transfer request: "+err.message);
    });

    console.log("Transfers_draft create:", data);
    res.send(data);
  })
  .catch(err => {
    res.status(500).send({
      message:
        err.message || "Some error occurred while updating the database."
    });
    console.log("Error while updating database: "+err.message);
  });
};

// Create and Save a new Transfer
exports.create = async (req, res) => {
  // Validate request
  if (!req.body.campaignId) { // campaignId
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }

  console.log("Received for Create:");
  console.log(req.body);
/*
  console.log(req.body.campaignId);
  console.log(req.body.transferAmount);
  console.log(req.body.recipientwallet);
  console.log(req.body.recipient);
  console.log(req.body.smartcontractaddress);
  console.log(req.body.tokenname);
  console.log(req.body.actionby);
*/

  ////////////////////////////// Blockchain ////////////////////////

      require('dotenv').config();
      const ETHEREUM_NETWORK = (() => {
        switch (req.body.campaign.blockchain) { // xxx
            case 80001:
              return process.env.REACT_APP_POLYGON_MUMBAI_NETWORK
            case 80002:
              return process.env.REACT_APP_POLYGON_AMOY_NETWORK
            case 11155111:
              return process.env.REACT_APP_ETHEREUM_SEPOLIA_NETWORK
            case 43113:
              return process.env.REACT_APP_AVALANCHE_FUJI_NETWORK
            case 137:
              return process.env.REACT_APP_POLYGON_MAINNET_NETWORK
            case 1:
              return process.env.REACT_APP_ETHEREUM_MAINNET_NETWORK
            case 43114:
              return process.env.REACT_APP_AVALANCHE_MAINNET_NETWORK
            default:
              return null
          }
        }
      )()
      console.log("Using network:"+ ETHEREUM_NETWORK + "("+ req.body.campaign.blockchain +")");
  
//      const ETHEREUM_NETWORK = process.env.REACT_APP_ETHEREUM_NETWORK;
      const INFURA_API_KEY = process.env.REACT_APP_INFURA_API_KEY;
      const SIGNER_PRIVATE_KEY = process.env.REACT_APP_SIGNER_PRIVATE_KEY;
      const CONTRACT_OWNER_WALLET = process.env.REACT_APP_CONTRACT_OWNER_WALLET;

      console.log("!!! Signer:", SIGNER_PRIVATE_KEY.substring(0,4)+"..." + SIGNER_PRIVATE_KEY.slice(-3));

      async function dApp() {

        updatestatus = false;

        // Readng ABI from JSON file
        fs = require("fs");
        ABI = JSON.parse(fs.readFileSync("./server/app/abis/ERC20TokenDSGD.abi.json").toString());


        // Creation of Web3 class
        Web3 = require("web3");

        // Setting up a HttpProvider
        web3 = new Web3( 
          Web3.providers.HttpProvider(
            `https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`
          ) 
        );
        //console.log("web3: =========>", web3);

        console.log("!!! Signer:", SIGNER_PRIVATE_KEY.substring(0,4)+"..." + SIGNER_PRIVATE_KEY.slice(-3));
        // Creating a signing account from a private key
        const signer = web3.eth.accounts.privateKeyToAccount(SIGNER_PRIVATE_KEY)
        // console.log("signer:", signer); // contains private key

        // Deploy contract
        const Transfer = async () => {
          try {
            console.log('Creating contract with ABI');
            const ERC20TokenDSGDcontract = new web3.eth.Contract(ABI);

            // https://github.com/web3/web3.js/issues/1001
            web3.setProvider( new Web3.providers.HttpProvider(`https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`) );

            console.log('**** Signing Transfer txn('+CONTRACT_OWNER_WALLET+','+req.body.transferAmount +') ...');
            const nonce = await web3.eth.getTransactionCount(CONTRACT_OWNER_WALLET, "latest") //get latest nonce
            let decimalPlaces = countDecimals(req.body.transferAmount);
            let tokensToTransfer = (req.body.transferAmount*10**decimalPlaces.toString())  // shift decimals 
            + createStringWithZeros(adjustdecimals - decimalPlaces);  // pad zeros behind
            console.log("tokensToTransfer = ", tokensToTransfer);
            const createTransaction = await web3.eth.accounts.signTransaction(  // inside export.create
              {
                nonce: nonce,
                from: signer.address,
                to: req.body.smartcontractaddress,
                data: ERC20TokenDSGDcontract.methods.transfer(req.body.recipientwallet,
                    web3.utils.toBN(
                      tokensToTransfer
                    )
                  ).encodeABI(),
                gas: 4700000,
              },
              SIGNER_PRIVATE_KEY
            );
            console.log('**** Sending signed txn...');
            //console.log('Sending signed txn:', createTransaction);

            const createReceipt = await web3.eth.sendSignedTransaction(
              createTransaction.rawTransaction, 
            
              function (error1, hash) {
                if (error1) {
                    console.log("Something went wrong when submitting your signed transaction:", error1)
                } else {
                  console.log("Txn sent!, hash: ", hash);
                  var timer = 1;
                  // retry every second to chk for receipt
                  const interval = setInterval(function() {
                    console.log("Attempting to get transaction receipt...");

                    // https://ethereum.stackexchange.com/questions/67232/how-to-wait-until-transaction-is-confirmed-web3-js
                    web3.eth.getTransactionReceipt(hash, function(error3, receipt) {
                      if (receipt) {
                        console.log('!!!!!!!!!!!!!!!!!!!!!RECEIPT!!!!!!!!!!!!!!!!!!!!!');
                        clearInterval(interval);
                        console.log('** Rceipt status: ', receipt.status);
                        console.log('** Rceipt: ', receipt);
                        return(receipt.status);

                      }
                      if (error3) {
                        console.log("!! getTransactionReceipt error: ", error3)
                        clearInterval(interval);
                        return false;
                      }
                    });
                    timer++;
                  }, 1000);
                }
              })
              .on("error", err => {
                  console.log("sentSignedTxn error: ", err)

                  return;
                  // do something on transaction error
              });

            console.log('**** Txn executed:', createReceipt);
            return true;
              //contractaddress = createReceipt.contractAddress;
          } catch(error) {
            console.log('Error encountered -->: ',error)   
            return false;
          }

        };

        return(await Transfer());
      }
      updatestatus = await dApp();
      console.log("Update status:", updatestatus);

////////////////////////////// Blockchain ////////////////////////
  
  if (updatestatus) {

    // Save Transfer in the database
    await Transfer.create(  // inside export.create
      { 
        campaignId            : req.body.campaignId,  // campaignId
        transferAmount        : req.body.transferAmount,
        sourcewallet          : CONTRACT_OWNER_WALLET,
        recipientwallet       : req.body.recipientwallet,
        recipientId           : req.body.recipient,
        smartcontractadddress : req.body.smartcontractadddress,
        blockchain            : req.body.campaign.blockchain,
        tokename              : req.body.tokenname,
        actionby              : req.body.actionby,
      }, 
    )
    .then(data => {

      // write to audit
      AuditTrail.create(
        { 
          action                : "Transfer "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - approved",
          tokenname             : req.body.tokenname.toUpperCase(), 
          smartcontractaddress  : req.body.smartcontractaddress,
          blockchain            : req.body.campaign.blockchain,
          amount                : req.body.transferAmount,
          recipientwallet       : req.body.recipientwallet,
          recipientId           : req.body.recipient,
          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

          campaignId            : req.body.campaignId,
          maker                 : req.body.maker,
          checker               : req.body.checker,
          approver              : req.body.approver,
          actionby              : req.body.actionby,
          checkerComments       : req.body.checkerComments,
          approverComments      : req.body.approverComments,
          status                : 3,   // 0 = draft; 1 = created pending review; 2 = reviewed pending approval; 3 = approved
        }, 
      )
      .then(auditres => {
        console.log("Data written to audittrail for approving transfer request.");
      })
      .catch(err => {
        console.log("Error while logging to audittrail for approving transfer request: "+err.message);
      });

      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the Transfer."
      });
      console.log("Error while transfering token: "+err.message);
    });
  } else {
    res.status(500).send({
      message: "Error performing transfer. "
    });
  }
};

// Create and Save a new Transfer
exports.approveDraftById = async (req, res) => {

  const draft_id = req.params.id;

  console.log("Received for ApproveDraftById:");
  console.log(req.params.id);
  console.log(req.body);
/*
  console.log(req.body.campaignId);
  console.log(req.body.campaign.name);
  console.log(req.body.campaign.tokenname);
  console.log(req.body.transferAmount);
  console.log(req.body.recipientwallet);
  console.log(req.body.recipient);
  console.log(req.body.smartcontractadddress);
  console.log(req.body.tokenname);
  //  console.log(req.body.txntype);
  console.log(req.body.actionby);
  console.log(req.body.checkerComments);
  console.log(req.body.approverComments);
  console.log(req.body.actionby);
*/

  // Validate request
  if (!req.body.campaign) { // campaignId
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }

  var msgSent=false;

  ////////////////////////////// Blockchain ////////////////////////

      require('dotenv').config();
      const ETHEREUM_NETWORK = (() => {
        switch (req.body.campaign.blockchain) { // xxx
            case 80001:
              return process.env.REACT_APP_POLYGON_MUMBAI_NETWORK
            case 80002:
              return process.env.REACT_APP_POLYGON_AMOY_NETWORK
            case 11155111:
              return process.env.REACT_APP_ETHEREUM_SEPOLIA_NETWORK
            case 43113:
              return process.env.REACT_APP_AVALANCHE_FUJI_NETWORK
            case 137:
              return process.env.REACT_APP_POLYGON_MAINNET_NETWORK
            case 1:
              return process.env.REACT_APP_ETHEREUM_MAINNET_NETWORK
            case 43114:
              return process.env.REACT_APP_AVALANCHE_MAINNET_NETWORK
            default:
              return null
          }
        }
      )()
      console.log("Using network:"+ ETHEREUM_NETWORK + "("+ req.body.campaign.blockchain +")");
//      const ETHEREUM_NETWORK = process.env.REACT_APP_ETHEREUM_NETWORK;
      const INFURA_API_KEY = process.env.REACT_APP_INFURA_API_KEY;
      const SIGNER_PRIVATE_KEY = process.env.REACT_APP_SIGNER_PRIVATE_KEY;
      const CONTRACT_OWNER_WALLET = process.env.REACT_APP_CONTRACT_OWNER_WALLET;

      console.log("!!! Signer:", SIGNER_PRIVATE_KEY.substring(0,4)+"..." + SIGNER_PRIVATE_KEY.slice(-3));

      async function dApp() {

        updatestatus = false;

        // Readng ABI from JSON file
        fs = require("fs");
        ABI = JSON.parse(fs.readFileSync("./server/app/abis/ERC20TokenDSGD.abi.json").toString());

        // Creation of Web3 class
        Web3 = require("web3");

        // Setting up a HttpProvider
        web3 = new Web3( 
          Web3.providers.HttpProvider(
            `https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`
          ) 
        );
        //console.log("web3: =========>", web3);

        console.log("!!! Signer:", SIGNER_PRIVATE_KEY.substring(0,4)+"..." + SIGNER_PRIVATE_KEY.slice(-3));
        // Creating a signing account from a private key
        const signer = web3.eth.accounts.privateKeyToAccount(SIGNER_PRIVATE_KEY)
        //console.log("signer:", signer);  // contains private key

        // Deploy contract
        const Transfer = async () => {
          try {
            console.log('Creating contract with ABI');
            const ERC20TokenDSGDcontract = new web3.eth.Contract(ABI);

            // https://github.com/web3/web3.js/issues/1001
            web3.setProvider( new Web3.providers.HttpProvider(`https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`) );

            console.log('**** Signing Transfer txn('+CONTRACT_OWNER_WALLET+','+req.body.transferAmount +') ...');
            const nonce = await web3.eth.getTransactionCount(CONTRACT_OWNER_WALLET, "latest") //get latest nonce
            let decimalPlaces = countDecimals(req.body.transferAmount);
            let tokensToTransfer = (req.body.transferAmount*10**decimalPlaces.toString())  // shift decimals 
            + createStringWithZeros(adjustdecimals - decimalPlaces);  // pad zeros behind
            console.log("tokensToTransfer = ", tokensToTransfer);
            const createTransaction = await web3.eth.accounts.signTransaction( // inside approveDraftById
              {
                nonce: nonce,
                from: signer.address,
                to: req.body.campaign.smartcontractaddress,
                data: ERC20TokenDSGDcontract.methods.transfer(req.body.recipientwallet, 
                  //req.body.transferAmount * adjustdecimals 
                    web3.utils.toBN(
                      tokensToTransfer
                    )
                  ).encodeABI(),
                gas: 4700000,
              },
              SIGNER_PRIVATE_KEY
            );
            console.log('**** Sending signed txn...');
            //console.log('Sending signed txn:', createTransaction);

            const createReceipt = await web3.eth.sendSignedTransaction(
              createTransaction.rawTransaction, 
            
              function (error1, hash) {
                if (error1) {
                    if (!msgSent) {
                      res.status(500).send({
                        message: "Signed transaction error: ", error1
                      });
                      msgSent=true;
                    }
                    console.log("Something went wrong when submitting your signed transaction:", error1)
                    return false;

                } else {
                  console.log("Txn sent!, hash: ", hash);
                  var timer = 1;
                  // retry every second to chk for receipt
                  const interval = setInterval(function() {
                    console.log("Attempting to get transaction receipt...");

                    // https://ethereum.stackexchange.com/questions/67232/how-to-wait-until-transaction-is-confirmed-web3-js
                    web3.eth.getTransactionReceipt(hash, function(error3, receipt) {
                      if (receipt) {
                        console.log('!!!!!!!!!!!!!!!!!!!!!RECEIPT!!!!!!!!!!!!!!!!!!!!!');
                        clearInterval(interval);
                        console.log('Rceipt: ', receipt);
                        return(receipt.status);
                      }
                      if (error3) {
                        clearInterval(interval);

                        if (!msgSent) {
                          res.status(500).send({
                            message: "sentSignedTxn error: ", error3
                          });
                          msgSent=true;
                        }
                        console.log("!! getTransactionReceipt error: ", error3)
                        return false;
                      }
                    });
                    timer++;
                  }, 1000);
                }
              })
              .on("error", err => {
                  if (!msgSent) {
                    res.status(500).send({
                      message: "sentSignedTxn error: ", err
                    });
                    msgSent=true;
                  }
                  console.log("sentSignedTxn error: ", err);
                  return false;
                  // do something on transaction error
              });

            console.log('**** Txn executed:', createReceipt);
              //contractaddress = createReceipt.contractAddress;
            return true;
          } catch(error) {
            if (!msgSent) {
              res.status(500).send({
                message: "Error encountered while transfering: ", error
              });
              msgSent=true;
            }
            console.log("Error encountered -->: ", error);  
            return false;
          }

        };

        return (await Transfer());
      }

      updatestatus = await dApp();
      console.log("Update status:", updatestatus);
////////////////////////////// Blockchain ////////////////////////
  
if (updatestatus) {

    // update draft table
    await Transfers_Draft.update(  // update draft table status to "3"
    { 
      status            : 3,
      approverComments  : req.body.approvercomments,
    }, 
    { where:      { id: draft_id }},
    )
    .then(num => {
      if (num == 1) {
        /*
        res.send({
          message: "Campaign was accepted successfully."
        });
        */

        // write to audit
        AuditTrail.create(
          { 
            action                : "Transfer "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - accepted",
            tokenname             : req.body.tokenname.toUpperCase(), 
            smartcontractaddress  : req.body.smartcontractaddress,
            blockchain            : req.body.campaign.blockchain,
            amount                : req.body.transferAmount,
            sourcewallet          : "Internal campaign wallet",
            recipientwallet       : req.body.recipientwallet,
            recipientId           : req.body.recipient,
            txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

            campaignId            : req.body.campaignId,
            maker                 : req.body.maker,
            checker               : req.body.checker,
            approver              : req.body.approver,
            actionby              : req.body.actionby,
            checkerComments       : req.body.checkerComments,
            approverComments      : req.body.approverComments,
            status                : 1,   // 0 = draft; 1 = created pending review; 2 = reviewed pending approval; 3 = approved
          }, 
        )
        .then(auditres => {
          console.log("Data written to audittrail for approving transfer request.");
        })
        .catch(err => {
          console.log("Error while logging to audittrail for approving transfer request: "+err.message);
        });

      } else {
        if (!msgSent) {
          res.send({
            message: `${req.body}. Record updated =${num}. Cannot update Campaign with id=${id}. Maybe Campaign was not found or req.body is empty!`
          });
          msgSent = true;
        }
        return false;
      }
    })
    .catch(err => {
      console.log(err);
      if (!msgSent) {
        console.log("Sending error 400 back to client");
        res.status(400).send({ 
          message: err.toString().replace('*', ''),
        });
        msgSent = true;
      }
      return false;
    });

  // Create Transfer in the database
  await Transfer.create(  // inside approveDraftById
    { 
      campaignId            : req.body.campaignId,  // campaignId
      transferAmount        : req.body.transferAmount,
      sourcewallet          : CONTRACT_OWNER_WALLET,
      recipientwallet     : req.body.recipientwallet,
      recipientId           : req.body.recipient,
      smartcontractadddress : req.body.smartcontractadddress,
      blockchain            : req.body.campaign.blockchain,
      tokename              : req.body.tokenname,
      actionby              : req.body.actionby,
    }, 
  )
    .then(data => {
      if (!msgSent) {
        res.send(data);
        msgSent = true;
      }
      return true;
    })
    .catch(err => {
      if (!msgSent) {
        res.status(500).send({
          message:
            err.message || "Some error occurred while creating the Transfer."
        });
        msgSent=true;
      }
      console.log("Error while transfering token: "+err.message);
      return false;
    });
  } else {
    if (!msgSent) {
      res.status(500).send({
        message: "Error transfering tokens."
      });
      msgSent=true;
    }
    console.log("Error while transfering token");
    return false;
  }
};


exports.getAllDraftsByUserId = async (req, res) => {
  const id = req.query.id;
  console.log("====== transfer.getAllDraftsByUserId(id) ",id);
  var condition = id ? { 
        [Op.or]: 
        [
          { 
            [Op.and]: [
            {status: -1},  // rejected to maker inbox
            {maker : id},
            ]
          },
          { 
            [Op.and]: [
            {status: 0},  // created 
            {maker : id},
            ]
          },
          { 
            [Op.and]: [
            {status: 1},  // pending checker accept
            {checker : id},
            ]
          },
          { 
            [Op.and]: [
            {status: 2},  // pending approver accept
            {approver : id},
            ]
          },
        ],      
      } : null;

  await Transfers_Draft.findAll(
    { 
      where: condition,
      include: db.campaigns, 
    },
    )
    .then(tdata => {
      console.log("Transfers_Draft.findAll:", tdata)

      res.send( tdata );
    })
    .catch(err => {
      console.log("Error while retreiving transfers5: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving transfers."
      });
    });
};

exports.getAllDraftsByTransferId = (req, res) => {
  const id = req.query.id;
  console.log("====== transfer.getAllDraftsByTransferId(id) ",id);
  var condition = id ? 
       {id : id}
      : null;

  Transfers_Draft.findAll(
      { 
        where: condition,
        include: db.campaigns,
      },
    )
    .then(data => {
      console.log("Transfers_Draft.findAll:", data)
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving transfers5: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving transfers."
      });
    });
};

exports.submitDraftById = async (req, res) => {
  
  const id = req.params.id;

  console.log("Received1:");
  console.log(id);
  console.log(req.body);
/*
  console.log(req.body.campaign.name);
  console.log(req.body.campaign.tokenname);
  console.log(req.body.transferAmount);
//  console.log(req.body.txntype);
  console.log(req.body.actionby);
  console.log(req.body.checkerComments);
  console.log(req.body.approverComments);
*/
  await Transfers_Draft.update(
  { 
    status :              1,
    campaignId:           req.body.campaign.id,
    transferAmount:               req.body.transferAmount,
    blockchain            : req.body.campaign.blockchain,
    //    txntype:              req.body.txntype,   // 0 - create,  1-edit,  2-delete
    maker:                req.body.maker,
    checker:              req.body.checker,
    approver:             req.body.approver,
    checkerComments:      req.body.checkerComments,
    approverComments:     req.body.approverComments,
    actionby:             req.body.actionby,
  }, 
  { where:      { id: id }},
  )
  .then(num => {
    if (num == 1) {

      // write to audit
      AuditTrail.create(
        { 
          action                : "Transfer "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - resubmitted",
          tokenname             : req.body.tokenname.toUpperCase(), 
          smartcontractaddress  : req.body.smartcontractaddress,
          blockchain            : req.body.campaign.blockchain,
          amount                : req.body.transferAmount,
          sourcewallet          : "Internal campaign wallet",
          recipientwallet       : req.body.recipientwallet,
          recipientId           : req.body.recipient,
          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

          campaignId            : req.body.campaignId,
          maker                 : req.body.maker,
          checker               : req.body.checker,
          approver              : req.body.approver,
          actionby              : req.body.actionby,
          checkerComments       : req.body.checkerComments,
          approverComments      : req.body.approverComments,
          status                : 1,   // 0 = draft; 1 = created pending review; 2 = reviewed pending approval; 3 = approved
        }, 
      )
      .then(auditres => {
        console.log("Data written to audittrail for resubmitting transfer request.");
      })
      .catch(err => {
        console.log("Error while logging to audittrail for resubmitting transfer request: "+err.message);
      });
      
      res.send({
        message: "Transfer submitted successfully."
      });
    } else {
      res.send({
        message: `${req.body}. Record updated =${num}. Cannot update Transfer with id=${id}. Maybe Transfer was not found or req.body is empty!`
      });
    }
  })
  .catch(err => {
    console.log(err);
    res.status(500).send({
      message: `Error updating Transfer. ${err}`
    });
  });
};


exports.acceptDraftById = async (req, res) => {
  
  const id = req.params.id;

  console.log("Received2:");
  console.log(id);
  console.log(id);
  console.log(req.body.campaign.name);
  console.log(req.body.campaign.tokenname);
  console.log(req.body.transferAmount);
//  console.log(req.body.txntype);
  console.log(req.body.actionby);
  console.log(req.body.checkerComments);
  console.log(req.body.approverComments);

  await Transfers_Draft.update(
  { 
    status :          2,
    checkerComments: req.body.checkerComments,
    approverComments: req.body.approverComments,
  }, 
  { where:      { id: id }},
  )
  .then(num => {
    if (num == 1) {

      // write to audit
      AuditTrail.create(
        { 
          action                : "Transfer "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - accepted",
          tokenname             : req.body.tokenname.toUpperCase(), 
          smartcontractaddress  : req.body.smartcontractaddress,
          blockchain            : req.body.campaign.blockchain,
          amount                : req.body.transferAmount,
          sourcewallet          : "Internal campaign wallet",
          recipientwallet       : req.body.recipientwallet,
          recipientId           : req.body.recipient,
          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

          campaignId            : req.body.campaignId,
          maker                 : req.body.maker,
          checker               : req.body.checker,
          approver              : req.body.approver,
          actionby              : req.body.actionby,
          checkerComments       : req.body.checkerComments,
          approverComments      : req.body.approverComments,
          status                : 3,   // 0 = draft; 1 = created pending review; 2 = reviewed pending approval; 3 = approved
        }, 
      )
      .then(auditres => {
        console.log("Data written to audittrail for accepting transfer request.");
      })
      .catch(err => {
        console.log("Error while logging to audittrail for accepting transfer request: "+err.message);
      });
      
      res.send({
        message: "Transfer was accepted successfully."
      });
    } else {
      res.send({
        message: `${req.body}. Record updated =${num}. Cannot update Transfer with id=${id}. Maybe Transfer was not found or req.body is empty!`
      });
    }
  })
  .catch(err => {
    console.log(err);
    res.status(500).send({
      message: `Error updating Transfer. ${err}`
    });
  });
};

exports.rejectDraftById = async (req, res) => {
  
  const id = req.params.id;

  console.log("Received3:");
  console.log(id);
  console.log(req.body.campaign.name);
  console.log(req.body.campaign.tokenname);
  console.log(req.body.transferAmount);
//  console.log(req.body.txntype);
  console.log(req.body.actionby);
  console.log(req.body.checkerComments);
  console.log(req.body.approverComments);
  await Transfers_Draft.update(
  { 
    status :          -1,
    checkerComments: req.body.checkerComments,
    approverComments: req.body.approverComments,
  }, 
  { where:      { id: id }},
  )
  .then(num => {
    if (num == 1) {

      // write to audit
      AuditTrail.create(
        { 
          action                : "Transfer "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - rejected",
          tokenname             : req.body.tokenname.toUpperCase(), 
          smartcontractaddress  : req.body.smartcontractaddress,
          blockchain            : req.body.campaign.blockchain,
          amount                : req.body.transferAmount,
          sourcewallet          : "Internal campaign wallet",
          recipientwallet       : req.body.recipientwallet,
          recipientId           : req.body.recipient,
          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

          campaignId            : req.body.campaignId,
          maker                 : req.body.maker,
          checker               : req.body.checker,
          approver              : req.body.approver,
          actionby              : req.body.actionby,
          checkerComments       : req.body.checkerComments,
          approverComments      : req.body.approverComments,
          status                : -1,   // 0 = draft; 1 = created pending review; 2 = reviewed pending approval; 3 = approved
        }, 
      )
      .then(auditres => {
        console.log("Data written to audittrail for rejecting transfer request.");
      })
      .catch(err => {
        console.log("Error while logging to audittrail for rejecting transfer request: "+err.message);
      });              
      
      res.send({
        message: "Transfer was rejected."
      });
    } else {
      res.send({
        message: `${req.body}. Record updated =${num}. Cannot reject Transfer with id=${id}. Maybe Transfer was not found or req.body is empty!`
      });
    }
  })
  .catch(err => {
    console.log(err);
    res.status(500).send({
      message: `Error rejecting Transfer. ${err}`
    });
  });
};

exports.findExact = (req, res) => {
  const campaign = req.query.campaignId;
  var condition = campaign ? { campaignId: campaign } : null;

  Transfer.findAll(
    { where: condition },
    )
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving transfer: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving transfer."
      });
    });
};

// Retrieve all Transfers from the database.
exports.findAll = (req, res) => {
  const campaign = req.query.campaignId;
  var condition = campaign ? { campaignId: { [Op.like]: `%${campaign}%` } } : null;

  Transfer.findAll(
    { include: db.campaigns},
    { where: condition },
    )
    .then(data => {
      console.log("Transfer.findAll:", data)
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving transfers: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving transfers."
      });
    });
};

// Find a single Transfer with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  Transfer.findByPk(id, {
    include: db.campaigns
  })
    .then(data => {
      //console.log("Transfer.findByPk:", data)
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find Transfer with id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving Transfer with id=" + id
      });
    });
};

// Retrieve all Transfers from the database.
exports.findAllTransfers = (req, res) => {
  const name = req.query.name;
//  var condition = name ? { name: { [Op.like]: `%${name}%` } } : null;

  Transfer.findAll(
//    { include: db.campaigns},
//    { where: condition },
    {
      include: db.campaigns,
      where: { '$campaign.name$': 
        {
          [Op.not]: null
        } 
      },
      attributes: ['campaignId', 'recipientwallet', [db.transfers.sequelize.fn('sum', db.transfers.sequelize.col('transferAmount')), 'totalTransfered']],
      group: ['campaignId','recipientwallet'],
    }
    )
    .then(data => {
      console.log("Campaign.findAll:", data)
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving campaigns9: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving campaigns."
      });
    });
};

exports.findAllByCampaignId = (req, res) => {
  /*
  const Id = req.query.id;
  var condition = Id ? { campaignId: Id } : null;

  Transfer.findAll(
  { 
    attributes: ['campaignId', [db.transfer.sequelize.fn('sum', db.transfer.sequelize.col('transferAmount')), 'totalTransfered']],
    where: { campaignId: Id },
    group: ['campaignId'],
//    { where: condition },
  })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving campaigns10: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving campaigns."
      });
    });
    */

    // get token address from CampaignId
    const Id = req.query.id;
    var condition = Id ? { campaignId: Id } : null;
  
    Transfer.findAll(
    { 
      where: { condition },
    })
      .then(async data => {
        const _tokenAddress = data.smartcontractaddress;

        console.log("Querying token: ", _tokenAddress);
        const contract1 = new Web3Client.eth.Contract(ABI, _tokenAddress);
      
        const _inWallet = await contract1.methods.balanceOf(CONTRACT_OWNER_WALLET).call(); 
        const inWallet = await Web3Client.utils.fromWei(_inWallet)
        console.log("In Wallet: ", inWallet);
      
        const _totalTransfered = await contract1.methods._incirculation().call(); 
        const totalTransfered = await Web3Client.utils.fromWei(totalTransfered)
        console.log("total Transfered: ", totalTransfered);
      
        const _totalSupply = await contract1.methods.totalSupply().call(); 
        const totalSupply = await Web3Client.utils.fromWei(_totalSupply) 
        console.log("total Supply: ", totalSupply);
      
        res.send(
          {
            id          : Id,
            inWallet    : inWallet,
            totalTransfered : totalTransfered,
            totalSupply : totalSupply,
          }
        );
      })
      .catch(err => {
        console.log("Error while retreiving campaigns11: "+err.message);
  
        res.status(500).send({
          message:
            err.message || "Some error occurred while retrieving campaigns."
        });
      });
  
    /// Query blockchain
    // Readng ABI from JSON file
    fs = require("fs");
    ABI = JSON.parse(fs.readFileSync("./server/app/abis/ERC20TokenDSGD.abi.json").toString());


    // Creation of Web3 class
    Web3 = require("web3");

    // Setting up a HttpProvider
    web3 = new Web3( 
      Web3.providers.HttpProvider(
        `https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`
      ) 
    );
    
};

/*
// Update a Transfer by the id in the request
exports.update = async (req, res) => {
  
  const id = req.params.id;

  console.log("Received:");
  console.log(id);
  console.log(req.body.name);
  console.log(req.body.startdate);
  console.log(req.body.enddate);
  console.log(req.body.sponsor);
  console.log(req.body.transferAmount);
  console.log(req.body.actionby);

  await Transfer.update(
    { name:       req.body.name,
      startdate:  req.body.startdate, 
      enddate:    req.body.enddate, 
      sponsor:    req.body.sponsor, 
      transferAmount:     req.body.transferAmount,
    }, 
    { where:      { id: id }},
    )
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Transfer was updated successfully."
        });
      } else {
        res.send({
          message: `${req.body}. Record updated =${num}. Cannot update Transfer with id=${id}. Maybe Transfer was not found or req.body is empty!`
        });
      }
    })
    .catch(err => {
      console.log(err);
      res.status(500).send({
        message: `Error updating Transfer. ${err}`
      });
    });
};
*/

// Delete a Transfer with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  console.log(req.body.actionby);

  Transfer.destroy({
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Transfer was deleted successfully!"
        });
      } else {
        res.send({
          message: `Cannot delete Transfer with id=${id}. Maybe Transfer was not found!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Could not delete Transfer with id=" + id
      });
    });
};

// Delete all Transfers from the database.
exports.deleteAll = (req, res) => {
  Transfer.destroy({
    where: {},
    truncate: false
  })
    .then(nums => {
      res.send({ message: `${nums} Transfers were deleted successfully!` });
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while removing all transfers."
      });
    });
};


/*
// find all published Transfer
exports.findAllPublished = (req, res) => {
  Transfer.findAll({ where: { published: true } })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving transfers."
      });
    });
};
*/

const db = require("../models");
const AuditTrail = db.audittrail;

const Mint = db.mints;
const Mints_Draft = db.mints_draft;
const Campaigns = db.campaigns;


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

// Create and Save a new Mint
exports.draftCreate = async (req, res) => {
  // Validate request
  if (!req.body.smartcontractaddress) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }

  console.log("Received for Mint draft Create:");
  console.log(req.body.campaignId);
  console.log(req.body.tokenname);
  console.log(req.body.smartcontractaddress);
//  console.log(req.body.startdate);
//  console.log(req.body.enddate);
  console.log(req.body.mintAmount);
  console.log(req.body.maker);
  console.log(req.body.checker);
  console.log(req.body.approver);
  console.log(req.body.actionby);


  // Save Mint in the database
  await Mints_Draft.create(
    { 
      campaignId:           req.body.campaignId,
      tokenname:            req.body.tokenname.toUpperCase(), 
      smartcontractaddress: req.body.smartcontractaddress,
//      startdate:            req.body.startdate, 
//      enddate:              req.body.enddate, 
      mintAmount:           req.body.mintAmount,
//      txntype:              req.body.txntype,   // 0 - create,  1-edit,  2-delete
      maker:                req.body.maker,
      checker:              req.body.checker,
      approver:             req.body.approver,
      actionby:             req.body.actionby,
      status:               1   // 0 = draft; 1 = created pending review; 2 = reviewed pending approval; 3 = approved
    }, 
  )
  .then(data => {
    console.log("Mints_draft create:", data);

    // write to audit
    AuditTrail.create(
      { 
        action                : "Mint "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - created",
        name                  : req.body.name, 
//        draftmintId           : req.params.id,      // draftmintId not created yet
        tokenname             : req.body.tokenname.toUpperCase(), 
        smartcontractaddress  : req.body.smartcontractaddress,
        amount                : req.body.mintAmount,
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
      console.log("Data written to audittrail for creating mint request.");
    })
    .catch(err => {
      console.log("Error while logging to audittrail for creating mint request: "+err.message);
    });

    res.send(data);
  })
  .catch(err => {
    res.status(500).send({
      message:
        err.message || "Some error occurred while creating mint draft."
    });
    console.log("Error while creating mint draft: "+err.message);
  });
};


// Create and Save a new Mint
exports.approveDraftById = async (req, res) => {

  const draft_id = req.params.id;

  console.log("Received for ApproveDraftById:");
  console.log(req.params.id);
  console.log(req.body);
/*
  console.log(req.body.campaign.name);
  console.log(req.body.campaign.tokenname);
  console.log(req.body.mintAmount);
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
        switch (req.body.campaign.blockchain) {
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
      )();

  //    const ETHEREUM_NETWORK = process.env.REACT_APP_ETHEREUM_NETWORK;
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
        const Mint = async () => {
          try {
            console.log('Creating contract with ABI');
            const ERC20TokenDSGDcontract = new web3.eth.Contract(ABI);

            // https://github.com/web3/web3.js/issues/1001
            web3.setProvider( new Web3.providers.HttpProvider(`https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`) );

            console.log('**** Signing Mint txn('+CONTRACT_OWNER_WALLET+','+req.body.mintAmount +') ...');
            const nonce = await web3.eth.getTransactionCount(CONTRACT_OWNER_WALLET, "latest") //get latest nonce
            let decimalPlaces = countDecimals(req.body.mintAmount);
            let tokensToMint = (req.body.mintAmount*10**decimalPlaces.toString())  // shift decimals 
            + createStringWithZeros(adjustdecimals - decimalPlaces);  // pad zeros behind
            console.log("tokensToMint = ", tokensToMint);
            const createTransaction = await web3.eth.accounts.signTransaction(
              {
                nonce: nonce,
                from: signer.address,
                to: req.body.campaign.smartcontractaddress,
                data: ERC20TokenDSGDcontract.methods.mint(CONTRACT_OWNER_WALLET, 
                  //req.body.mintAmount * adjustdecimals 
                    web3.utils.toBN(
                      tokensToMint
                    )
                  ).encodeABI(),
                gas: 8700000,  // 4700000,
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
                message: "Error encountered while minting: ", error
              });
              msgSent=true;
            }
            console.log("Error encountered -->: ", error);  
            return false;
          }

        };

        return (await Mint());
      }

      updatestatus = await dApp();
      console.log("Update status:", updatestatus);
////////////////////////////// Blockchain ////////////////////////
  
if (updatestatus) {

  // update draft table
  await Mints_Draft.update(  // update draft table status to "3"
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
          action                : "Mint "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - approved",
          name                  : req.body.campaign.name, 
          draftmintId           : req.params.id,
          tokenname             : req.body.campaign.tokenname.toUpperCase(), 
          smartcontractaddress  : req.body.campaign.smartcontractaddress,
          amount                : req.body.mintAmount,
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
        console.log("Data written to audittrail for approving mint request.");
      })
      .catch(err => {
        console.log("Error while logging to audittrail for approving mint request: "+err.message);
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

  // Create Mint in the database
  await Mint.create(
    { campaignId  : req.body.campaign.id,  // campaignId
      mintAmount  : req.body.mintAmount,
      actionby    : req.body.actionby,

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
            err.message || "Some error occurred while creating the Mint."
        });
        msgSent=true;
      }
      console.log("Error while minting token: "+err.message);
      return false;
    });
  } else {
    if (!msgSent) {
      res.status(500).send({
        message: "Error minting tokens."
      });
      msgSent=true;
    }
    console.log("Error while minting token");
    return false;
  }
};


exports.getAllDraftsByUserId = (req, res) => {
  const id = req.query.id;
  console.log("====== mint.getAllDraftsByUserId(id) ",id);
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

  Mints_Draft.findAll(
    { 
      where: condition,
      include: db.campaigns,
    },
    )
    .then(data => {
      console.log("Mints_Draft.findAll:", data)
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving mints5: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving mints."
      });
    });
};

exports.getAllDraftsByMintId = (req, res) => {
  const id = req.query.id;
  console.log("====== mint.getAllDraftsByMintId(id) ",id);
  var condition = id ? 
       {id : id}
      : null;

  Mints_Draft.findAll(
      { 
        where: condition,
        include: db.campaigns,
      },
    )
    .then(data => {
      console.log("Mints_Draft.findAll:", data)
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving mints5: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving mints."
      });
    });
};

exports.submitDraftById = async (req, res) => {
  
  const id = req.params.id;

  console.log("Received1:");
  console.log(id);
  console.log(req.body.campaign.name);
  console.log(req.body.campaign.tokenname);
  console.log(req.body.mintAmount);
//  console.log(req.body.txntype);
  console.log(req.body.actionby);
  console.log(req.body.checkerComments);
  console.log(req.body.approverComments);

  await Mints_Draft.update(
  { 
    status               : 1,
    campaignId           : req.body.campaign.id,
    mintAmount           : req.body.mintAmount,
    txntype              : req.body.txntype,   // 0 - create,  1-edit,  2-delete
    maker                : req.body.maker,
    checker              : req.body.checker,
    approver             : req.body.approver,
    checkerComments      : req.body.checkerComments,
    approverComments     : req.body.approverComments,
    actionby             : req.body.actionby,
  }, 
  { where:      { id: id }},
  )
  .then(num => {
    if (num == 1) {
  
      // write to audit
      AuditTrail.create(
        { 
          action                : "Mint "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - resubmitted",
          name                  : req.body.campaign.name, 
          draftmintId           : req.params.id,
          tokenname             : req.body.campaign.tokenname.toUpperCase(), 
          smartcontractaddress  : req.body.campaign.smartcontractaddress,
          amount                : req.body.mintAmount,
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
        console.log("Data written to audittrail for resubmitting mint request.");
      })
      .catch(err => {
        console.log("Error while logging to audittrail for resubmitting mint request: "+err.message);
      });
    
      res.send({
        message: "Mint draft resubmitted successfully."
      });
    } else {
      res.send({
        message: `${req.body}. Record updated =${num}. Cannot update Mint with id=${id}. Maybe Mint was not found or req.body is empty!`
      });
    }
  })
  .catch(err => {
    console.log(err);
    res.status(500).send({
      message: `Error resubmitting Mint draft. ${err}`
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
  console.log(req.body.mintAmount);
//  console.log(req.body.txntype);
  console.log(req.body.actionby);
  console.log(req.body.checkerComments);
  console.log(req.body.approverComments);

  await Mints_Draft.update(
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
          action                : "Mint "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - accepted",
          name                  : req.body.campaign.name, 
          draftmintId           : req.params.id,
          tokenname             : req.body.campaign.tokenname.toUpperCase(), 
          smartcontractaddress  : req.body.campaign.smartcontractaddress,
          amount                : req.body.mintAmount,
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
        console.log("Data written to audittrail for accepting mint request.");
      })
      .catch(err => {
        console.log("Error while logging to audittrail for accepting mint request: "+err.message);
      });
      
      res.send({
        message: "Mint was accepted successfully."
      });
    } else {
      res.send({
        message: `${req.body}. Record updated =${num}. Cannot update Mint with id=${id}. Maybe Mint was not found or req.body is empty!`
      });
    }
  })
  .catch(err => {
    console.log(err);
    res.status(500).send({
      message: `Error accepting Mint. ${err}`
    });
  });
};

exports.rejectDraftById = async (req, res) => {
  
  const id = req.params.id;

  console.log("Received3:");
  console.log(id);
  console.log(req.body.campaign.name);
  console.log(req.body.campaign.tokenname);
  console.log(req.body.mintAmount);
//  console.log(req.body.txntype);
  console.log(req.body.actionby);
  console.log(req.body.checkerComments);
  console.log(req.body.approverComments);
  await Mints_Draft.update(
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
          action                : "Mint "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - rejected",
          name                  : req.body.campaign.name, 
          draftmintId           : req.params.id,
          tokenname             : req.body.campaign.tokenname.toUpperCase(), 
          smartcontractaddress  : req.body.campaign.smartcontractaddress,
          amount                : req.body.mintAmount,
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
        console.log("Data written to audittrail for rejecting mint request.");
      })
      .catch(err => {
        console.log("Error while logging to audittrail for rejecting mint request: "+err.message);
      });

      res.send({
        message: "Mint was rejected."
      });
    } else {
      res.send({
        message: `${req.body}. Record updated =${num}. Cannot reject Mint with id=${id}. Maybe Mint was not found or req.body is empty!`
      });
    }
  })
  .catch(err => {
    console.log(err);
    res.status(500).send({
      message: `Error rejecting Mint. ${err}`
    });
  });
};

exports.findExact = (req, res) => {
  const campaign = req.query.campaign;
  var condition = campaign ? { campaignId: campaign } : null;

  Mint.findAll(
    { where: condition },
    )
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving mint: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving mint."
      });
    });
};

// Retrieve all Mints from the database.
exports.findAll = (req, res) => {
  const campaign = req.query.campaign;
  var condition = campaign ? { campaignId: { [Op.like]: `%${campaign}%` } } : null;

  Mint.findAll(
    { include: db.campaigns},
    { where: condition },
    )
    .then(data => {
      console.log("Mint.findAll:", data)
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving mints: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving mints."
      });
    });
};

// Find a single Mint with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  Mint.findByPk(id, {
    include: db.campaigns
  })
    .then(data => {
      //console.log("Mint.findByPk:", data)
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find Mint with id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving Mint with id=" + id
      });
    });
};

// Retrieve all Mints from the database.
exports.findAllMints = (req, res) => {
  const name = req.query.name;
//  var condition = name ? { name: { [Op.like]: `%${name}%` } } : null;

  Mint.findAll(
//    { include: db.campaigns},
//    { where: condition },
    {
      include: db.campaigns,
      where: { '$campaign.name$': 
        {
          [Op.not]: null
        } 
      },
      attributes: ['campaignId', [db.mints.sequelize.fn('sum', db.mints.sequelize.col('mintAmount')), 'totalMinted']],
//      where: { campaignId: Id },
      group: ['campaignId'],
    }
    )
    .then(data => {
      console.log("Campaign.findAll:", data)
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving campaigns6: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving campaigns."
      });
    });
};

exports.findAllByCampaignId = (req, res) => {
  
  const Id = req.query.id;
  var condition = Id ? { campaignId: Id } : null;

  Mint.findAll(
  { 
    attributes: ['campaignId', [db.mints.sequelize.fn('sum', db.mints.sequelize.col('mintAmount')), 'totalMinted']],
    where: { campaignId: Id },
    group: ['campaignId'],
//    { where: condition },
  })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving campaigns7: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving campaigns."
      });
    });
    
/*
    // get token address from CampaignId
    const Id = req.query.id;
    var condition = Id ? { campaignId: Id } : null;
  
    Mint.findAll(
    { 
      where: { condition },
    })
      .then(async data => {

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

        const _tokenAddress = data.smartcontractaddress;

        console.log("Querying token: ", _tokenAddress);
        const contract1 = new Web3Client.eth.Contract(ABI, _tokenAddress);
      
        const _inWallet = await contract1.methods.balanceOf(CONTRACT_OWNER_WALLET).call(); 
        const inWallet = await Web3Client.utils.fromWei(_inWallet)
        console.log("In Wallet: ", inWallet);
      
        const _totalMinted = await contract1.methods._incirculation().call(); 
        const totalMinted = await Web3Client.utils.fromWei(totalMinted)
        console.log("total Minted: ", totalMinted);
      
        const _totalSupply = await contract1.methods.totalSupply().call(); 
        const totalSupply = await Web3Client.utils.fromWei(_totalSupply) 
        console.log("total Supply: ", totalSupply);
      
        res.send(
          {
            id          : Id,
            inWallet    : inWallet,
            totalMinted : totalMinted,
            totalSupply : totalSupply,
          }
        );
      })
      .catch(err => {
        console.log("Error while retreiving campaigns8: "+err.message);
  
        res.status(500).send({
          message:
            err.message || "Some error occurred while retrieving campaigns."
        });
      });
  
    */
};

exports.dropRequestById = async (req, res) => {
  const draft_id = req.params.id;
  var msgSent = false;

  const id = req.params.id;
  console.log("Received4 for drop request:");
  console.log(id);
  console.log(req.body.campaign);
  console.log(req.body.campaign.name);
  console.log(req.body.campaign.tokenname);
  console.log(req.body.mintAmount);
  console.log(req.body.txntype);
  console.log(req.body.actionby);
  console.log(req.body.checkerComments);
  console.log(req.body.approverComments);

  // update draft table
  await Mints_Draft.update(  // update draft table status to "9" - aborted / dropped requests
  { 
    status            : 9,
    approverComments  : req.body.approvercomments,
  }, 
  { where:      { id: draft_id }},
  )
  .then(num => {
    if (num == 1) {

      // write to audit
      AuditTrail.create(
        { 
          action                : "Mint "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - dropped",
          name                  : req.body.campaign.name, 
          draftmintId           : req.params.id,
          tokenname             : req.body.campaign.tokenname.toUpperCase(), 
          smartcontractaddress  : req.body.campaign.smartcontractaddress,
          amount                : req.body.mintAmount,
          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

          campaignId            : req.body.campaignId,
          maker                 : req.body.maker,
          checker               : req.body.checker,
          approver              : req.body.approver,
          actionby              : req.body.actionby,
          checkerComments       : req.body.checkerComments,
          approverComments      : req.body.approverComments,
          status                : -9,   // 0 = draft; 1 = created pending review; 2 = reviewed pending approval; 3 = approved
        }, 
      )
      .then(auditres => {
        console.log("Data written to audittrail for dropping mint request.");
      })
      .catch(err => {
        console.log("Error while logging to audittrail for dropping mint request: "+err.message);
      });
      
      if (!msgSent) {
        console.log("Sending success mint request dropped to client");
        res.send({
          message: "Request droppped(deleted) successfully!"
        });
        msgSent = true;
      }
      return true;
    } else {
    }
    return true;
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
};

/*
// Update a Mint by the id in the request
exports.update = async (req, res) => {
  
  const id = req.params.id;

  console.log("Received:");
  console.log(id);
  console.log(req.body.name);
  console.log(req.body.startdate);
  console.log(req.body.enddate);
  console.log(req.body.sponsor);
  console.log(req.body.mintAmount);
  console.log(req.body.actionby);

  await Mint.update(
    { name:       req.body.name,
      startdate:  req.body.startdate, 
      enddate:    req.body.enddate, 
      sponsor:    req.body.sponsor, 
      mintAmount:     req.body.mintAmount,
    }, 
    { where:      { id: id }},
    )
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Mint was updated successfully."
        });
      } else {
        res.send({
          message: `${req.body}. Record updated =${num}. Cannot update Mint with id=${id}. Maybe Mint was not found or req.body is empty!`
        });
      }
    })
    .catch(err => {
      console.log(err);
      res.status(500).send({
        message: `Error updating Mint. ${err}`
      });
    });
};
*/

// Delete a Mint with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  console.log(req.body.actionby);

  Mint.destroy({
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Mint was deleted successfully!"
        });
      } else {
        res.send({
          message: `Cannot delete Mint with id=${id}. Maybe Mint was not found!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Could not delete Mint with id=" + id
      });
    });
};

// Delete all Mints from the database.
exports.deleteAll = (req, res) => {
  Mint.destroy({
    where: {},
    truncate: false
  })
    .then(nums => {
      res.send({ message: `${nums} Mints were deleted successfully!` });
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while removing all mints."
      });
    });
};


/*
// find all published Mint
exports.findAllPublished = (req, res) => {
  Mint.findAll({ where: { published: true } })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving mints."
      });
    });
};
*/

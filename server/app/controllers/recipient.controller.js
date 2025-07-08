const db = require("../models");
const AuditTrail = db.audittrail;
const Recipients = db.recipients;
const Recipients_Draft = db.recipients_draft;
const Op = db.Sequelize.Op;
var newcontractaddress = null;
const adjustdecimals = 18;

function createStringWithZeros(num) { return ("0".repeat(num)); }

// Create and Save a new Recipient
exports.draftCreate = async (req, res) => {

  console.log("Received for Recipient draftCreate:");
  console.log(req.body.name);
  console.log(req.body.walletaddress);
  console.log(req.body.bank);
  console.log(req.body.bankaccount);
  console.log(req.body.type);
  console.log(req.body.status);
  console.log(req.body.maker);
  console.log(req.body.checker);
  console.log(req.body.approver);
  console.log(req.body.actionby);

  console.log(req.body.name_changed);
  console.log(req.body.walletaddress_changed);
  console.log(req.body.bank_changed);
  console.log(req.body.bankaccount_changed);
  console.log(req.body.type_changed);
  console.log(req.body.status_changed);

  console.log(req.body.name_original);
  console.log(req.body.walletaddress_original);
  console.log(req.body.bank_original);
  console.log(req.body.bankaccount_original);
  console.log(req.body.type_original);
  console.log(req.body.status_original);


    // Validate request
    if (!req.body.name) {
      res.status(400).send({
        message: "Content can not be empty!"
      }); 
      return;
    }
  

  // Save Recipient in the database
  await Recipients_Draft.create(
    { 
      name                  : req.body.name,
      walletaddress         : req.body.walletaddress, 
      bank                  : req.body.bank,
      bankaccount           : req.body.bankaccount, 
      txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete
      maker                 : req.body.maker,
      checker               : req.body.checker,
      approver              : req.body.approver,
      actionby              : req.body.actionby,
      approvedrecipientid   : req.body.approvedrecipientid,
      status                : 1,   // 0 = draft; 1 = created pending review; 2 = reviewed pending approval; 3 = approved
    }, 
  )
  .then(data => {
    console.log("Recipient_draft create:", data.map(item => item.dataValues));
    // write to audit
    AuditTrail.create(
      { 
        action                : "Recipient "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - created",
        name                  : req.body.name,
        recipientwallet       : req.body.walletaddress, 
        bank                  : req.body.bank, 
        bankaccount           : req.body.bankaccount,
        txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

        //draftcampaignId       : data.id,
        maker                 : req.body.maker,
        checker               : req.body.checker,
        approver              : req.body.approver,
        actionby              : req.body.actionby,
        status                : 1,   // 0 = draft; 1 = created pending review; 2 = reviewed pending approval; 3 = approved
      }, 
    )
    .then(auditres => {
      console.log("Data written to audittrail for creating recipient request:", auditres);

    })
    .catch(err => {
      console.log("Error while logging to audittrail for creating recipient request: "+err.message);
    });
  
    res.send(data);
  })
  .catch(err => {
    res.status(500).send({
      message:
        err.message || "Some error occurred while creating the Recipient draft."
    });
    console.log("Error while creating recipient draft: "+err.message);
  });
};

exports.create_review = async (req, res) => {
  // Validate request
  if (!req.body.name) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }

  console.log("Received for Recipient Review:");
  console.log(req.body.id);
  console.log(req.body.name);
  console.log(req.body.tokenname);
  console.log(req.body.description);
  console.log(req.body.startdate);
  console.log(req.body.enddate);
  console.log(req.body.sponsor);
  console.log(req.body.amount);
  console.log(req.body.actionby);
  console.log(req.body.checkercomments);
  console.log(req.body.action);

    await Recipients_Draft.update(
      { 
        checkerComments :   checkercomments,
        status:             2   // 0 = draft; 1 = created pending review; 2 = reviewed pending approval; 3 = approved
      }, 
      { where:      { id: id }},
      )
      .then(num => {
        if (num == 1) {
          res.send({
            message: "Recipient status has been updated successfully."
          });
        } else {
          res.send({
            message: `${req.body}. Record updated =${num}. Cannot update Recipient with id=${id}. Maybe Recipient was not found or req.body is empty!`
          });
        }
      })
      .catch(err => {
        console.log(err);
        res.status(500).send({
          message: `Error updating Recipient. ${err}`
        });
      }); 
};

exports.approveDraftById = async (req, res) => {

  // Steps:
  // 1. Is this a new Recipient creation or Edit? If approvedrecipientid === '-1' then it is a new creation
  // 2. If new recipient creation:
  //   a. Check if smart contract is compiled (ABI and ByteCode files are present)
  //   b. Sign smart contract
  //   c. Deploy smart contract
  //   d. Update Recipients_Draft table status to "3"
  //   e. Insert entry in Recipients table
  // 3. If edit existing recipient:
  //   a. Update smart contract info such as total supply or date
  //   b. Update Recipients_Draft table status to "3"
  //   c. Update entry in Recipients table

  // Validate request
  if (!req.body.name) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }
  
  const draft_id = req.params.id;

  if (req.body.txntype !==0     // create recipient
    && req.body.txntype !==1    // update recipient
    ) {
      res.status(400).send({
        message: "Invalid transaction type!"
      });
      return;  
  }

  console.log("Received for Create/Update:");
  console.log(req.body.name);
  console.log(req.body.bank);
  console.log(req.body.bankaccount);
  console.log(req.body.walletaddress);
  console.log(req.body.txntype);
  console.log(req.body.actionby);
  console.log(req.body.checkerComments);
  console.log(req.body.approverComments);
  console.log(req.body.approvedrecipientid);

  if (1) {
  // update draft table
    await Recipients_Draft.update(  // update draft table status to "3"
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
          message: "Recipient was approved successfully."
        });
        */

        // write to audit
        AuditTrail.create(
          { 
            action                : "Recipient "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - approved",
            name                  : req.body.name,
            recipientwallet       : req.body.walletaddress, 
            bank                  : req.body.bank, 
            bankaccount           : req.body.bankaccount,
            txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

            draftcampaignId       : draft_id,
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
          console.log("Data written to audittrail for approving recipient draft:", auditres);

        })
        .catch(err => {
          console.log("Error while logging to audittrail for approving recipient draft: "+err.message);
        });

      } else {
        res.send({
          message: `${req.body}. Record updated =${num}. Cannot update Recipient with id=${id}. Maybe Recipient was not found or req.body is empty!`
        });
      }
    })
    .catch(err => {
      console.log(err);
      if (!errorSent) {
        console.log("Sending error 400 back to client");
        res.status(400).send({ 
          message: err.toString().replace('*', ''),
        });
        errorSent = true;
      }
      return false;
    });

    if (req.body.txntype === 0) {
      await Recipients.create( // create Recipient in the database !!!!!
        { 
          name                : req.body.name,
          bank                : req.body.bank, 
          bankaccount         : req.body.bankaccount, 
          walletaddress       : req.body.walletaddress, 
          actionby            : req.body.actionby,
          draftrecipientid    : req.body.id,          
        }, 
      )
      .then(data => {
        console.log("Recipient create success:", data.map(item => item.dataValues));
        res.send(data);
      })
      .catch(err => {
        console.log("Error while creating recipients: "+err.message);
        if (!errorSent) {
          console.log("Sending error 400 back to client");
          res.status(400).send({ 
            message: err.toString().replace('*', ''),
          });
          errorSent = true;
        }
        return false;
      });
    } else { // not isNewRecipient
      await Recipients.update( // update Recipient in the database !!!!! 
      { 
        name                : req.body.name,
        bank                : req.body.bank, 
        bankaccount         : req.body.bankaccount, 
        walletaddress       : req.body.walletaddress, 
        actionby            : req.body.actionby,
        draftrecipientid    : req.body.id,          
    }, 
      { where:      { id: req.body.approvedrecipientid }},
      )
      .then(data => {
        console.log("Recipient update success:", data.map(item => item.dataValues));
        res.send(data);
      })
      .catch(err => {
        console.log("Error while updating recipients: "+err.message);
        if (!errorSent) {
          console.log("Sending error 400 back to client");
          res.status(400).send({ 
            message: err.toString().replace('*', ''),
          });
          errorSent = true;
        }
        return false;
      });
    }
  } // updatestatus
};

exports.findDraftByNameExact = (req, res) => {
  const name = req.query.name;
  var condition = name ? { 
    name: name, 
    status : [-1, 0, 1, 2]  // status -1=rejected, 0, drafted not submitted, 1=submitted for checker, 2=submitted for approver, 3=approved
  } : null;

  Recipients_Draft.findAll(
    { where: condition },
    )
    .then(data => {
      console.log("Recipient_Draft.findAll:", data.map(item => item.dataValues));
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving recipients1: "+err.message);

      res.status(400).send({
        message:
          err.message || "Some error occurred while retrieving recipients."
      });
    });
};

exports.findDraftByApprovedId = (req, res) => {
  const id = req.query.id;
  var condition = id ? { 
    approvedrecipientid: id, 
    status : [-1, 0, 1, 2]  // status -1=rejected, 0, drafted not submitted, 1=submitted for checker, 2=submitted for approver, 3=approved
  } : null;

  Recipients_Draft.findAll(
    { where: condition },
    )
    .then(data => {
      console.log("Recipient_Draft.findAll:", data.map(item => item.dataValues));
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving recipients1: "+err.message);

      res.status(400).send({
        message:
          err.message || "Some error occurred while retrieving recipients."
      });
    });
};


exports.findExact = (req, res) => {
  const name = req.query.name;
  var condition = name ? { name: name } : null;

  Recipients.findAll(
    { where: condition },
    )
    .then(data => {
      console.log("Recipients.findAll:", data.map(item => item.dataValues));
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving recipients1: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving recipients."
      });
    });
};

exports.getInWalletMintedTotalSupply = (req, res) => {
  
  // get token address from RecipientId
  const Id = req.query.id;
  var condition = Id ? { id: Id } : null;

  //console.log("++++++++++++++Received data:", req)
  
  Recipients.findAll(
  { 
    where: { id : Id },
  })
  .then(async data => {

    //console.log("Qery result fo DATA:", data[0].id);

    /// Query blockchain
    // Readng ABI from JSON file
    fs = require("fs");
    ABI = JSON.parse(fs.readFileSync("./server/app/abis/ERC20TokenDSGD.abi.json").toString());  // <-- dropdown menu

    // Creation of Web3 class
    Web3 = require("web3");

    require('dotenv').config();
    const ETHEREUM_NETWORK = process.env.REACT_APP_ETHEREUM_NETWORK;
    const INFURA_API_KEY = process.env.REACT_APP_INFURA_API_KEY;
    const provider = `https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`
    const Web3Client = new Web3(new Web3.providers.HttpProvider(provider));
    const CONTRACT_OWNER_WALLET = process.env.REACT_APP_CONTRACT_OWNER_WALLET;



    // Setting up a HttpProvider
    web3 = new Web3( 
      Web3.providers.HttpProvider(
        `https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`
      ) 
    );

    const _tokenAddress = data[0].smartcontractaddress;

    console.log("Querying token: ", _tokenAddress);
    const contract1 = new Web3Client.eth.Contract(ABI, _tokenAddress);
  
    const _inWallet = await contract1.methods.balanceOf(CONTRACT_OWNER_WALLET).call(); 
    const inWallet = await Web3Client.utils.fromWei(_inWallet)
    console.log("In Wallet: ", inWallet);
  
    const _totalMinted = await contract1.methods._incirculation().call(); 
    const totalMinted = await Web3Client.utils.fromWei(_totalMinted)
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
    console.log("Error while retreiving recipients2: "+err.message);

    res.status(500).send({
      message:
        err.message || "Some error occurred while retrieving recipients."
    });
  });
};

// Retrieve all Recipients from the database.
exports.findByName = (req, res) => {
  const name = req.query.name;
  var condition = name ? { name: { [Op.like]: `%${name}%` } } : null;

  Recipients.findAll(
    { include: db.recipients,
      where: condition
    },
    )
    .then(data => {
      console.log("Recipient.findByName:", data.map(item => item.dataValues));
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving recipients3: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving recipients."
      });
    });
};

// Retrieve all Recipients from the database.
exports.findAllRecipients = (req, res) => {
  const name = req.query.name;
//  var condition = name ? { name: { [Op.like]: `%${name}%` } } : null;

  Recipients.findAll(
//    {
//      raw: true,
//      nest: true,
//    }
    )
    .then(data => {
      console.log("Recipient.findAll:", data.map(item => item.dataValues))
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving Recipient6: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving campaigns."
      });
    });
};


exports.getAllDraftsByUserId = (req, res) => {
  const id = req.query.id;
  console.log("====== recipient.getAllDraftsByUserId(id) ",id);
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

  Recipients_Draft.findAll(
    { 
      where: condition,
      //include: db.campaigns,
    },
    )
    .then(data => {
      console.log("Recipients_Draft.findAll:", data.map(item => item.dataValues));
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving recipients5: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving recipients."
      });
    });
};

exports.getAllDraftsByRecipientId = (req, res) => {
  const id = req.query.id;
  console.log("====== recipient.getAllDraftsByRecipientId(id) ",id);
  var condition = id ? 
       {id : id}
      : null;

  Recipients_Draft.findAll(
    { 
      where: condition
    },
    { include: db.recipients},
    )
    .then(data => {
      console.log("Recipients_Draft.findAll:", data.map(item => item.dataValues));
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving recipients5: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving recipients."
      });
    });
};

// Find a single Recipient with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  Recipients.findByPk(id, {
    include: db.recipients
  })
    .then(data => {
      if (data) {      
        console.log("Recipient.findByPk:", data.map(item => item.dataValues));
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find Recipient with id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving Recipient with id=" + id
      });
    });
};

exports.submitDraftById = async (req, res) => {
  
  const id = req.params.id;

  console.log("Received1:");
  console.log(id);
  console.log(req.body.name);
  console.log(req.body.bank);
  console.log(req.body.bankaccount);
  console.log(req.body.walletaddress);
  console.log(req.body.txntype);
  console.log(req.body.actionby);
  console.log(req.body.checkerComments);
  console.log(req.body.approverComments);
  console.log(req.body.approvedrecipientid);

  await Recipients_Draft.update(
  { 
    status               : 1,
    name                 : req.body.name,
    bank                 : req.body.bank, 
    bankaccount          : req.body.bankaccount, 
    walletaddress        : req.body.walletaddress, 
    txntype              : req.body.txntype,   // 0 - create,  1-edit,  2-delete
    actionby             : req.body.actionby,
    maker                : req.body.maker,
    checker              : req.body.checker,
    approver             : req.body.approver,
    checkerComments      : req.body.checkerComments,
    approverComments     : req.body.approverComments,
  }, 
  { where:      { id: id }},
  )
  .then(num => {
    if (num == 1) {

      // write to audit
      AuditTrail.create(
        { 
          action                : "Recipient "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - resubmitted",
          name                  : req.body.name,
          recipientwallet       : req.body.walletaddress, 
          bank                  : req.body.bank, 
          bankaccount           : req.body.bankaccount,
          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

          draftcampaignId       : draft_id,
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
        console.log("Data written to audittrail for resubmitting recipient request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for resubmitting recipient request: "+err.message);
      });
      
      res.send({
        message: "Recipient resubmitted successfully."
      });
    } else {
      res.send({
        message: `${req.body}. Record updated =${num}. Cannot update Recipient with id=${id}. Maybe Recipient was not found or req.body is empty!`
      });
    }
  })
  .catch(err => {
    console.log(err);
    res.status(500).send({
      message: `Error updating Recipient. ${err}`
    });
  });
};


exports.acceptDraftById = async (req, res) => {
  
  const id = req.params.id;

  console.log("Received2:");
  console.log(id);
  console.log(req.body.name);
  console.log(req.body.bank);
  console.log(req.body.bankaccount);
  console.log(req.body.walletaddress);
  console.log(req.body.txntype);
  console.log(req.body.actionby);
  console.log(req.body.checkerComments);
  console.log(req.body.approverComments);
  console.log(req.body.approvedrecipientid);

  await Recipients_Draft.update(
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
          action                : "Recipient "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - accepted",
          name                  : req.body.name,
          recipientwallet       : req.body.walletaddress, 
          bank                  : req.body.bank, 
          bankaccount           : req.body.bankaccount,
          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

          draftcampaignId       : id,
          maker                 : req.body.maker,
          checker               : req.body.checker,
          approver              : req.body.approver,
          actionby              : req.body.actionby,
          checkerComments       : req.body.checkerComments,
          approverComments      : req.body.approverComments,
          status                : 2,   // 0 = draft; 1 = created pending review; 2 = reviewed pending approval; 3 = approved
        }, 
      )
      .then(auditres => {
        console.log("Data written to audittrail for accepting recipient request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for accepting recipient request: "+err.message);
      });

      res.send({
        message: "Recipient was accepted successfully."
      });
    } else {
      res.send({
        message: `${req.body}. Record updated =${num}. Cannot update Recipient with id=${id}. Maybe Recipient was not found or req.body is empty!`
      });
    }
  })
  .catch(err => {
    console.log(err);
    res.status(500).send({
      message: `Error updating Recipient. ${err}`
    });
  });
};

exports.rejectDraftById = async (req, res) => {
  
  const id = req.params.id;

  console.log("Received4:");
  console.log(id);
  console.log(req.body.name);
  console.log(req.body.bank);
  console.log(req.body.bankaccount);
  console.log(req.body.walletaddress);
  console.log(req.body.txntype);
  console.log(req.body.actionby);
  console.log(req.body.checkerComments);
  console.log(req.body.approverComments);
  console.log(req.body.approvedrecipientid);

  await Recipients_Draft.update(
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
          action                : "Recipient "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - rejected",
          name                  : req.body.name,
          recipientwallet       : req.body.walletaddress, 
          bank                  : req.body.bank, 
          bankaccount           : req.body.bankaccount,
          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

          draftcampaignId       : id,
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
        console.log("Data written to audittrail for rejecting recipient request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for rejecting recipient request: "+err.message);
      });
      
      res.send({
        message: "Recipient was rejected."
      });
    } else {
      res.send({
        message: `${req.body}. Record updated =${num}. Cannot reject Recipient with id=${id}. Maybe Recipient was not found or req.body is empty!`
      });
    }
  })
  .catch(err => {
    console.log(err);
    res.status(500).send({
      message: `Error rejecting Recipient. ${err}`
    });
  });
};

// Update a Recipient by the id in the request
exports.update = async (req, res) => {
  
  const id = req.params.id;

  console.log("Received3:");
  console.log(id);
  console.log(req.body.name);
  console.log(req.body.tokenname);
  console.log(req.body.description);
  console.log(req.body.startdate);
  console.log(req.body.enddate);
  console.log(req.body.sponsor);
  console.log(req.body.amount);
  console.log(req.body.actionby);
  console.log(req.body.approvedrecipientid);


  ////////////////////////////// Blockchain ////////////////////////

  require('dotenv').config();

  const ETHEREUM_NETWORK = process.env.REACT_APP_ETHEREUM_NETWORK;
  const INFURA_API_KEY = process.env.REACT_APP_INFURA_API_KEY;
  const SIGNER_PRIVATE_KEY = process.env.REACT_APP_SIGNER_PRIVATE_KEY;
  const CONTRACT_OWNER_WALLET = process.env.REACT_APP_CONTRACT_OWNER_WALLET;

  console.log("!!! Signer:", SIGNER_PRIVATE_KEY.substring(0,4)+"..." + SIGNER_PRIVATE_KEY.slice(-3));

  async function dAppUpdate() {

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
    // console.log("signer:", signer);  // contains private key

    // Update contract
    const UpdateContract = async () => {
      try {
        console.log('Creating contract with ABI');
        const ERC20TokenDSGDcontract = new web3.eth.Contract(ABI);

        // https://github.com/web3/web3.js/issues/1001
        web3.setProvider( new Web3.providers.HttpProvider(`https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`) );
        
        let setToTalSupply = (isNaN(+req.body.amount)? req.body.amount: req.body.amount.toString())   
        + createStringWithZeros(adjustdecimals);  // pad zeros behind
        console.log("setToTalSupply = ", setToTalSupply);

        console.log('**** Signing update txn('+CONTRACT_OWNER_WALLET+','+req.body.amount );
        const nonce = await web3.eth.getTransactionCount(CONTRACT_OWNER_WALLET, "latest") //get latest nonce
        const createTransaction = await web3.eth.accounts.signTransaction(
          { // Sign transaction to setTotalSupply in smart contract
            nonce: nonce,
            from: signer.address,
            to: req.body.smartcontractaddress,
            data: ERC20TokenDSGDcontract.methods.updateTotalSupply(
                    web3.utils.toBN( setToTalSupply )
                  ).encodeABI(),
            gas: 8700000, // 4700000,
          },
          SIGNER_PRIVATE_KEY
        ); // signTransaction
        console.log('**** Sending signed txn...');
        //console.log('Sending signed txn:', createTransaction);

        const createReceipt = await web3.eth.sendSignedTransaction(
          createTransaction.rawTransaction, 
        
          function (error1, hash) {
            if (error1) {
                console.log("Error1111 when submitting your signed transaction:", error1);
                res.status(400).send({ 
                  message: error1
                });
            } else {
              console.log("Txn sent!, hash: ", hash);
              var timer = 1;
              // retry every second to chk for receipt
              const interval = setInterval(function() {
                console.log("Attempting to get transaction receipt...");

                // https://ethereum.stackexchange.com/questions/67232/how-to-wait-until-transaction-is-confirmed-web3-js
                web3.eth.getTransactionReceipt(hash, async function(error3, receipt) {
                  if (receipt) {
                    console.log('!!!!!!!!!!!!!!!!!!!!!RECEIPT!!!!!!!!!!!!!!!!!!!!!');
                    clearInterval(interval);
                    console.log('Receipt -->>: ', receipt);

                    const trx = await web3.eth.getTransaction(hash);
                    console.log('trx.status -->>: ',trx);

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
            } // function
          })
          .on("error", err => {
              console.log("sentSignedTxn error: ", err)

              return false;
              // do something on transaction error
          }); // sendSignedTransaction

        console.log('**** Txn executed:', createReceipt);
        return true;
      } catch(error) {
        console.log('Error encountered -->: ',error)   

        return false;
      } // try

    }; // UpdateContract()

    return ( await UpdateContract());
  } // dAppUpdate

  updatestatus = null;
  //updatestatus = await dAppUpdate();
  console.log("Update status:", updatestatus);
  ////////////////////////////// Blockchain ////////////////////////

  if (updatestatus) {
    await Recipients.update(
      { name:       req.body.name,
  // cant update token name once smart contract is deployed
  //    tokenname:  req.body.tokenname.toUpperCase(), 
        description:req.body.description, 
        startdate:  req.body.startdate, 
        enddate:    req.body.enddate, 
        sponsor:    req.body.sponsor, 
        amount:     req.body.amount,
      }, 
      { where:      { id: id }},
      )
      .then(num => {
        if (num == 1) {
          res.send({
            message: "Recipient was updated successfully."
          });
        } else {
          res.send({
            message: `${req.body}. Record updated =${num}. Cannot update Recipient with id=${id}. Maybe Recipient was not found or req.body is empty!`
          });
        }
      })
      .catch(err => {
        console.log(err);
        res.status(500).send({
          message: `Error updating Recipient. ${err}`
        });
      });
  } else {
    res.status(500).send({
      message: "Error updating Recipient. "
    });
  }
};

// Delete a Recipient with the specified id in the request
exports.approveDeleteDraftById = async (req, res) => {
  const draft_id = req.params.id;
  var msgSent = false;

  console.log("Received for Delete request approva;:");
  console.log(req.params.id);
  console.log(id);
  console.log(req.body.name);
  console.log(req.body.bank);
  console.log(req.body.bankaccount);
  console.log(req.body.walletaddress);
  console.log(req.body.txntype);
  console.log(req.body.actionby);
  console.log(req.body.checkerComments);
  console.log(req.body.approverComments);
  console.log(req.body.approvedrecipientid);


  async function dAppDelete() {  // update smart contract for deletion
    return true;
  }

  var updatestatus = dAppDelete();

  if (updatestatus) {
    // update draft table
    var Done = await Recipients_Draft.update(  // update draft table status to "3"
    { 
      status            : 4,
      approverComments  : req.body.approvercomments,
    }, 
    { where:      { id: draft_id }},
    )
    .then(num => {
      if (num == 1) {

        // write to audit
        AuditTrail.create(
          { 
            action                : "Recipient "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - deleted",
            name                  : req.body.name,
            recipientwallet       : req.body.walletaddress, 
            bank                  : req.body.bank, 
            bankaccount           : req.body.bankaccount,
            txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

            draftcampaignId       : draft_id,
            maker                 : req.body.maker,
            checker               : req.body.checker,
            approver              : req.body.approver,
            actionby              : req.body.actionby,
            checkerComments       : req.body.checkerComments,
            approverComments      : req.body.approverComments,
            status                : 4,   // 0 = draft; 1 = created pending review; 2 = reviewed pending approval; 3 = approved
          }, 
        )
        .then(auditres => {
          console.log("Data written to audittrail for recipient delete request:", auditres);

        })
        .catch(err => {
          console.log("Error while logging to audittrail for recipient delete request: "+err.message);
        });
        
      } else {
        /*
        res.send({
          message: `${req.body}. Record updated =${num}. Cannot update Recipient with id=${draft_id}. Maybe Recipient was not found or req.body is empty!`
        });
        msgSent=true;
        */
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

    if (Done) await Recipients.destroy({ // delete entry in approved Recipient table
      where: { id: req.body.approvedrecipientid }
    })
    .then(num => {
      if (num == 1) {
        if (!msgSent) {
          console.log("Sending success recipient delete to client");
          res.send({
            message: "Recipient was deleted successfully!"
          });
          msgSent = true;
        }
        return true;
      } else {
        if (!msgSent) {
          res.send({
            message: `Cannot delete Recipient with id=${req.body.approvedrecipientid}. Maybe Recipient was not found!`
          });
          msgSent = true;
        }
        return true;
      }
    })
    .catch(err => {
      if (!msgSent) {
        console.log("Sending error 400 back to client");
        res.status(400).send({ 
          message: err.toString().replace('*', ''),
        });
        msgSent = true;
      }
      return false;
    });
    
  } // updatestatus
  
};

exports.dropRequestById = async (req, res) => {
  const draft_id = req.params.id;
  var msgSent = false;

  console.log("Received for Delete Draft Request :");
  console.log(req.params.id);
  console.log(req.body.name);
  console.log(req.body.tokenname);
  console.log(req.body.description);
  console.log(req.body.startdate);
  console.log(req.body.enddate);
  console.log(req.body.sponsor);
  console.log(req.body.amount);
  console.log(req.body.actionby);
  console.log(req.body.approvedrecipientid);


  async function dAppDelete() {  // update smart contract for deletion
    return true;
  }

  var updatestatus = dAppDelete();

  if (updatestatus) {
    // update draft table
    var Done = await Recipients_Draft.update(  // update draft table status to "9" - aborted / dropped requests
    { 
      status            : 9,
      approverComments  : req.body.approvercomments,
    }, 
    { where:      { id: draft_id }},
    )
    .then(num => {
      if (num == 1) {
        if (!msgSent) {

          // write to audit
          AuditTrail.create(
            { 
              action                : "Recipient "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - dropped",
              name                  : req.body.name,
              recipientwallet       : req.body.walletaddress, 
              bank                  : req.body.bank, 
              bankaccount           : req.body.bankaccount,
              txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

              draftcampaignId       : draft_id,
              maker                 : req.body.maker,
              checker               : req.body.checker,
              approver              : req.body.approver,
              actionby              : req.body.actionby,
              checkerComments       : req.body.checkerComments,
              approverComments      : req.body.approverComments,
              status                : 9,   // 0 = draft; 1 = created pending review; 2 = reviewed pending approval; 3 = approved
            }, 
          )
          .then(auditres => {
            console.log("Data written to audittrail for dropping recipient request:", auditres);

          })
          .catch(err => {
            console.log("Error while logging to audittrail for dropping recipient request: "+err.message);
          });

          console.log("Sending success recipient request dropped to client");
          res.send({
            message: "Request dropped(deleted) successfully!"
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
    
  } // updatestatus
  
};

// Delete a Recipient with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  console.log(req.body.actionby);

  Recipients.destroy({
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Recipient was deleted successfully!"
        });
      } else {
        res.send({
          message: `Cannot delete Recipient with id=${id}. Maybe Recipient was not found!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Could not delete Recipient with id=" + id
      });
    });
};

// Delete all Recipients from the database.
exports.deleteAll = (req, res) => {
  Recipients.destroy({
    where: {},
    truncate: false
  })
    .then(nums => {
      res.send({ message: `${nums} Recipients were deleted successfully!` });
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while removing all recipients."
      });
    });
};



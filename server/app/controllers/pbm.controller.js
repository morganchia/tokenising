const db = require("../models");
const AuditTrail = db.audittrail;
const PBM = db.pbm;
const PBM_TEMPLATE = db.pbm_templates;
const PBM_Draft = db.pbm_draft;
const wrapMints_Draft = db.wrapmints_draft;
const Op = db.Sequelize.Op;
var newcontractaddress = null;
const adjustdecimals = 18;

function createStringWithZeros(num) { return ("0".repeat(num)); }

// Create and Save a new PBM draft
exports.wrapMint_draftCreate = async (req, res) => {

  console.log("Received for WrapMint draft Create:");
  console.log(req.body);

  // Validate request
  if (!req.body.underlyingTokenID || !req.body.pbm_id) {
    res.status(400).send({
      message: "WrapMint Content can not be empty!"
    });
    return;
  }

  console.log("Received for WrapMint draft Create:");
  console.log(req.body);

  // Save PBM draft in the database
  await wrapMints_Draft.create(
    { 
      underlyingTokenID     : req.body.underlyingTokenID,
      pbm_id                : req.body.pbm_id,
//      blockchain            : req.body.blockchain,
      amount                : req.body.amount,
      txntype               : req.body.txntype,    // create
      maker                 : req.body.maker, 
      checker               : req.body.checker,
      approver              : req.body.approver,
      actionby              : req.body.actionby,
      status                : 1,   // 0 = draft; 1 = created pending review; 2 = reviewed pending approval; 3 = approved
    }, 
  )
  .then(data => {
    console.log("WrapMint_draft create:", data);
    // write to audit
    AuditTrail.create(
      { 
        action                : "WrapMint draft "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - created",
        campaignId            : req.body.underlyingTokenID,
        PBMunderlyingTokenID  : req.body.pbm_id,
        blockchain            : req.body.blockchain,
        amount                : req.body.amount,
        txntype               : req.body.txntype,    // create
        maker                 : req.body.maker, 
        checker               : req.body.checker,
        approver              : req.body.approver,
        actionby              : req.body.actionby,
        status                : 1,   // 0 = draft; 1 = created pending review; 2 = reviewed pending approval; 3 = approved
      }, 
    )
    .then(auditres => {
      console.log("Data written to audittrail for creating wrapMint pbm request.");

    })
    .catch(err => {
      console.log("Error while logging to audittrail for creating draft wrapMint request: "+err.message);
    });
  
    res.send(data);
  })
  .catch(err => {
    res.status(500).send({
      message:
        err.message || "Some error occurred while creating the wrapMint draft."
    });
    console.log("Error while creating wrapMint draft: "+err.message);
  });
};  // wrapMint_draftCreate

// Create and Save a new PBM draft
exports.draftCreate = async (req, res) => {
  // Validate request
  if (!req.body.name) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }

  console.log("Received for PBM draft Create:");
  console.log(req.body);

  // Save PBM draft in the database
  await PBM_Draft.create(
    { 
      name                  : req.body.name,
      tokenname             : req.body.tokenname.toUpperCase(), 
      description           : req.body.description, 
      blockchain            : req.body.blockchain,
      datafield1_name       : req.body.datafield1_name,
      datafield1_name       : req.body.datafield1_name,
      datafield1_value      : req.body.datafield1_value,
      operator1             : req.body.operator1,
      datafield2_name       : req.body.datafield2_name,
      datafield2_value      : req.body.datafield2_value,

      smartcontractaddress  : req.body.smartcontractaddress,
      underlyingTokenID     : req.body.underlyingTokenID,
      underlyingDSGDsmartcontractaddress  : req.body.underlyingDSGDsmartcontractaddress,
      startdate             : req.body.startdate, 
      enddate               : req.body.enddate, 
      sponsor               : req.body.sponsor, 
      amount                : req.body.amount,
      txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete
      maker                 : req.body.maker,
      checker               : req.body.checker,
      approver              : req.body.approver,
      actionby              : req.body.actionby,
      approvedpbmid         : req.body.approvedpbmid,
      status                : 1,   // 0 = draft; 1 = created pending review; 2 = reviewed pending approval; 3 = approved
      name_changed          : req.body.name_changed,
      description_changed   : req.body.description_changed,
      startdate_changed     : req.body.startdate_changed,
      enddate_changed       : req.body.enddate_changed,
      sponsor_changed       : req.body.sponsor_changed,
      amount_changed        : req.body.amount_changed,
      name_original         : req.body.name_original,
      description_original  : req.body.description_original,
      startdate_original    : req.body.startdate_original,
      enddate_original      : req.body.enddate_original,
      sponsor_original      : req.body.sponsor_original,
      amount_original       : req.body.amount_original,
    }, 
  )
  .then(data => {
    console.log("PBM_draft create:", data);
    // write to audit
    AuditTrail.create(
      { 
        action                : "PBM draft "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - created",
        name                  : req.body.name,
        tokenname             : req.body.tokenname.toUpperCase(), 
        description           : req.body.description, 
        blockchain            : req.body.blockchain,

        datafield1_name       : req.body.datafield1_name,
        datafield1_name       : req.body.datafield1_name,
        datafield1_value      : req.body.datafield1_value,
        operator1             : req.body.operator1,
        datafield2_name       : req.body.datafield2_name,
        datafield2_value      : req.body.datafield2_value,  

        smartcontractaddress  : req.body.smartcontractaddress,
        PBMunderlyingTokenID  : req.body.underlyingTokenID,
        PBMunderlyingDSGDsmartcontractaddress  : req.body.underlyingDSGDsmartcontractaddress,  
        startdate             : req.body.startdate, 
        enddate               : req.body.enddate, 
        sponsor               : req.body.sponsor, 
        amount                : req.body.amount,
        txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

        maker                 : req.body.maker,
        checker               : req.body.checker,
        approver              : req.body.approver,
        actionby              : req.body.actionby,
        pbmid                 : req.body.approvedpbmid,
        status                : 1,   // 0 = draft; 1 = created pending review; 2 = reviewed pending approval; 3 = approved
      }, 
    )
    .then(auditres => {
      console.log("Data written to audittrail for creating draft pbm request.");

    })
    .catch(err => {
      console.log("Error while logging to audittrail for creating draft pbm request: "+err.message);
    });
  
    res.send(data);
  })
  .catch(err => {
    res.status(500).send({
      message:
        err.message || "Some error occurred while creating the PBM draft."
    });
    console.log("Error while creating pbm draft: "+err.message);
  });
};  // draftCreate

// Create and Save a new PBM template
exports.templateCreate = async (req, res) => {
  // Validate request
  if (!req.body.templatename) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }

  console.log("Received for PBM template Create:");
  console.log(req.body);


  // Save PBM template in the database
  await db.pbm_templates.create(  
    { 
      templatename          : req.body.templatename,
      tokenname             : req.body.tokenname.toUpperCase(), 
      description           : req.body.description, 
      blockchain            : req.body.blockchain,

      datafield1_name       : req.body.datafield1_name,
      datafield1_value      : req.body.datafield1_value,
      operator1             : req.body.operator1,
      datafield2_name       : req.body.datafield2_name,
      datafield2_value      : req.body.datafield2_value,

      smartcontractaddress  : req.body.smartcontractaddress,
      underlyingTokenID     : req.body.underlyingTokenID,
      underlyingDSGDsmartcontractaddress  : req.body.underlyingDSGDsmartcontractaddress,
      startdate             : req.body.startdate, 
      enddate               : req.body.enddate, 
      sponsor               : req.body.sponsor, 
//      amount                : req.body.amount,
      txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete
//      maker                 : req.body.maker,
//      checker               : req.body.checker,
//      approver              : req.body.approver,
      actionby              : req.body.actionby,
      approvedpbmid         : req.body.approvedpbmid,
      status                : 1,   // 0 = draft; 1 = created pending review; 2 = reviewed pending approval; 3 = approved
      name_changed          : req.body.name_changed,
      description_changed   : req.body.description_changed,
      startdate_changed     : req.body.startdate_changed,
      enddate_changed       : req.body.enddate_changed,
      sponsor_changed       : req.body.sponsor_changed,
      amount_changed        : req.body.amount_changed,
      name_original         : req.body.name_original,
      description_original  : req.body.description_original,
      startdate_original    : req.body.startdate_original,
      enddate_original      : req.body.enddate_original,
      sponsor_original      : req.body.sponsor_original,
      amount_original       : req.body.amount_original,
      blockchain_original           : req.body.blockchain_original,
    }, 
  )
  .then(data => {
    console.log("PBM_template create:", data);
    // write to audit
    AuditTrail.create(
      { 
        action                : "PBM template "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - created",
        name                  : req.body.templatename,
        tokenname             : req.body.tokenname.toUpperCase(), 
        description           : req.body.description, 
        blockchain            : req.body.blockchain,

        datafield1_name       : req.body.datafield1_name,
        datafield1_value      : req.body.datafield1_value,
        operator1             : req.body.operator1,
        datafield2_name       : req.body.datafield2_name,
        datafield2_value      : req.body.datafield2_value,

        smartcontractaddress  : req.body.smartcontractaddress,
        PBMunderlyingTokenID  : req.body.underlyingTokenID,
        PBMunderlyingDSGDsmartcontractaddress  : req.body.underlyingDSGDsmartcontractaddress,  
        startdate             : req.body.startdate, 
        enddate               : req.body.enddate, 
        sponsor               : req.body.sponsor, 
//        amount                : req.body.amount,
        txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

//        maker                 : req.body.maker,
//        checker               : req.body.checker,
//        approver              : req.body.approver,
        actionby              : req.body.actionby,
        pbmid                 : req.body.approvedpbmid,
        status                : 1,   // 0 = draft; 1 = created pending review; 2 = reviewed pending approval; 3 = approved
      }, 
    )
    .then(auditres => {
      console.log("Data written to audittrail for creating pbm template request.");

    })
    .catch(err => {
      console.log("Error while logging to audittrail for creating pbm template request: "+err.message);
    });
  
    res.send(data);
  })
  .catch(err => {
    res.status(500).send({
      message:
        err.message || "Some error occurred while creating the PBM template."
    });
    console.log("Error while creating pbm template: "+err.message);
  });
};  // template Create

exports.create_review = async (req, res) => {
  // Validate request
  if (!req.body.name) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }

  console.log("Received for PBM Review:");
  console.log(req.body);

  await PBM_Draft.update(
      { 
        checkerComments :   checkercomments,
        status:             2   // 0 = draft; 1 = created pending review; 2 = reviewed pending approval; 3 = approved
      }, 
      { where:      { id: id }},
      )
      .then(num => {
        if (num == 1) {
          res.send({
            message: "PBM status has been updated successfully."
          });
        } else {
          res.send({
            message: `${req.body}. Record updated =${num}. Cannot update PBM with id=${id}. Maybe PBM was not found or req.body is empty!`
          });
        }
      })
      .catch(err => {
        console.log(err);
        res.status(500).send({
          message: `Error updating PBM. ${err}`
        });
      }); 
}; // create_review

exports.approveDraftById = async (req, res) => {  // 
  // Steps:
  // 1. Is this a new PBM creation or Edit? If approvedpbmid === '-1' then it is a new creation
  // 2. If new pbm creation:
  //   a. Check if smart contract is compiled (ABI and ByteCode files are present)
  //   b. Sign smart contract
  //   c. Deploy smart contract
  //   d. Update PBM_Draft table status to "3"
  //   e. Insert entry in PBM table
  // 3. If edit existing pbm:
  //   a. Update smart contract info such as total supply or date
  //   b. Update PBM_Draft table status to "3"
  //   c. Update entry in PBM table

  var errorSent = false;

  // Validate request
  if (!req.body.name) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }
  
  const draft_id = req.params.id;

  if (req.body.txntype !==0     // create pbm
    && req.body.txntype !==1    // update pbm
    ) {
      res.status(400).send({
        message: "Invalid transaction type!"
      });
      return;  
  }
  const isNewPBM = (req.body.smartcontractaddress === "" || req.body.smartcontractaddress === null? true : false); // Create = true, Edit/Update = false

  console.log("Received approveDraftById for Create/Update:");
  console.log(req.body);

////////////////////////////// Blockchain ////////////////////////

      // https://www.geeksforgeeks.org/how-to-deploy-contract-from-nodejs-using-web3/

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
      )()

//      const ETHEREUM_NETWORK = process.env.REACT_APP_ETHEREUM_NETWORK;
      const INFURA_API_KEY = process.env.REACT_APP_INFURA_API_KEY;
      const SIGNER_PRIVATE_KEY = process.env.REACT_APP_SIGNER_PRIVATE_KEY;
      const CONTRACT_OWNER_WALLET = process.env.REACT_APP_CONTRACT_OWNER_WALLET;
    
      console.log("!!! Signer:", SIGNER_PRIVATE_KEY.substring(0,4)+"..." + SIGNER_PRIVATE_KEY.slice(-3));

      async function compileSmartContract() {
        // solc compiler
        solc = require("solc");

        // file reader
        fs = require("fs");

        console.log("Reading smart contract file... ");

        // Reading the file
        file = fs.readFileSync("./server/app/contracts/ERC20TokenPBM.sol").toString();
        // console.log(file);

        // input structure for solidity compiler
        var input = {
          language: "Solidity",
          sources: {
            "ERC20TokenPBM.sol": {
              content: file,
            },
          },
          settings: {
            outputSelection: {
              "*": {
                "*": ["*"],
              },
            },
          },
        };

        const path = require('path');
        // https://stackoverflow.com/questions/67321111/file-import-callback-not-supported/68459731#68459731
        function findImports(relativePath) {
          //my imported sources are stored under the node_modules folder!
          const absolutePath = path.resolve(__dirname, '../../../node_modules', relativePath);
          const source = fs.readFileSync(absolutePath, 'utf8');
          console.log("reading file: ", absolutePath);

          return { contents: source };
        }
          
        console.log("Compiling smart contract file... ");
        var output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
        console.log("Compilation done... ");
        console.log("Result of compilation: ", output);

        console.log("Generating bytecode from smart contract file ");
        ABI = output.contracts["ERC20TokenPBM.sol"]["PBMToken"].abi;
        bytecode = output.contracts["ERC20TokenPBM.sol"]["PBMToken"].evm.bytecode.object;
        // console.log("solc.compile output: ", output);
        // console.log("ABI: ", ABI);
        // console.log("Bytecode: ", bytecode);
        await fs.writeFile("./server/app/abis/ERC20TokenPBM.abi.json", JSON.stringify(ABI) , 'utf8', function (err) {
          if (err) {
            console.log("An error occured while writing PBM ABI JSON Object to File.");
            return console.log(err);
          }
          console.log("PBM ABI JSON file has been saved.");
        });
        await fs.writeFile("./server/app/abis/ERC20TokenPBM.bytecode.json", JSON.stringify(bytecode) , 'utf8', function (err) {
          if (err) {
            console.log("An error occured while writing PBM bytecode JSON Object to File.");
            return console.log(err);
          }
          console.log("PBM Bytecode JSON file has been saved.");
        });

      }

      async function dAppCreate() {
        updatestatus = false;
        var errorSent = false;

        fs = require("fs");

        try {
          if (! (fs.existsSync("./server/app/abis/ERC20TokenPBM.abi.json") && fs.existsSync("./server/app/abis/ERC20TokenPBM.bytecode.json"))) {
            await compileSmartContract();
          } else{
            // Just read the ABI file
            console.log("PBM ABI and Bytecode files are present, just read them, no need to recompile...");
            console.log("Read PBM ABI JSON file.");
            ABI = JSON.parse(fs.readFileSync("./server/app/abis/ERC20TokenPBM.abi.json").toString());
            console.log("Read PBM Bytecode JSON file.");
            bytecode = JSON.parse(fs.readFileSync("./server/app/abis/ERC20TokenPBM.bytecode.json").toString());
          }
        } catch(err) {
          console.error("Err7: ",err)
          if (!errorSent) {
            console.log("Sending error 400 back to client");
            res.status(400).send({ 
              message: err
            });
            errorSent = true;
          }
          return false;
        }
        
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
        console.log("req.body.amount = ", req.body.amount);

//        let setToTalSupply = (isNaN(+req.body.amount)? req.body.mintAmount: req.body.amount.toString())   
//        + createStringWithZeros(adjustdecimals);  // pad zeros behind
//        console.log("setToTalSupply = ", setToTalSupply);

        console.log("Enddate (unix time) = ", Number(new Date(req.body.enddate)));
        try {
          // Deploy contract
          const deployContract = async () => {
            console.log('Attempting to deploy from account:', signer.address);
            const ERC20TokenPBMcontract = new web3.eth.Contract(ABI);
            const contractTx = await ERC20TokenPBMcontract.deploy({
              data: bytecode,
              arguments:  [req.body.underlyingDSGDsmartcontractaddress, req.body.name+' Token', req.body.tokenname, 
                            Number(new Date(req.body.enddate))
                          ],
            });

            // https://github.com/web3/web3.js/issues/1001
            web3.setProvider( new Web3.providers.HttpProvider(`https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`) );

            const createTransaction = await web3.eth.accounts.signTransaction(
              {
                from: signer.address,
                data: contractTx.encodeABI(),
                gas: 4700000,
              },
              signer.privateKey
            );
            console.log('Sending signed txn...');
            //console.log('Sending signed txn:', createTransaction);


            const createReceipt = await web3.eth.sendSignedTransaction(
              createTransaction.rawTransaction, 
            
              function (error1, hash) {
                if (error1) {
                    console.log("Error11a  when submitting your signed transaction:", error1);
                    if (!errorSent) {
                      console.log("Sending error 400 back to client");
                      res.status(400).send({ 
                        message: error1.toString().replace('*', ''),
                      });
                      errorSent = true;
                    }
                    return false;
              } else {
                  console.log("Txn sent!, hash: ", hash);
                  var timer = 1;
                  // retry every second to chk for receipt
                  const interval = setInterval(function() {
                    console.log("Attempting to get transaction receipt...");
    
                    // https://ethereum.stackexchange.com/questions/67232/how-to-wait-until-transaction-is-confirmed-web3-js
                    web3.eth.getTransactionReceipt(hash, async function(error3, receipt) {
                      if (receipt) {
                        console.log('>> GOT RECEIPT!!!!!!!!!!!!!!!!!!!!!!!');
                        clearInterval(interval);
                        console.log('Receipt -->>: ', receipt);
    
                        const trx = await web3.eth.getTransaction(hash);
                        console.log('trx.status -->>: ',trx);
    
                        return(receipt.status);
                      }
                      if (error3) {
                        console.log("!! getTransactionReceipt error: ", error3)
                        clearInterval(interval);
                        if (!errorSent) {
                          console.log("Sending error 400 back to client");
                          res.status(400).send({ 
                            message: error3.toString().replace('*', ''),
                          });
                          errorSent = true;
                        }
                        return false;
                          }
                    });
                    timer++;
                  }, 1000);
                } // function
              })
              .on("error", err => {
                  console.log("Err22 sentSignedTxn error: ", err)
                  if (!errorSent) {
                    console.log("Sending error 400 back to client");
                    res.status(400).send({ 
                      message: err.toString().replace('*', ''),
                    });
                    errorSent = true;
                  }
                  return false;
            // do something on transaction error
              }); // sendSignedTransaction
    
            console.log('**** Txn executed:', createReceipt);

            console.log('New Contract deployed at address', createReceipt.contractAddress);
            newcontractaddress = createReceipt.contractAddress;

            return true;

          };

          return(await deployContract());

        } catch(err) {
          console.error("Err8: ",err)
          if (!errorSent) {
            console.log("Sending error 400 back to client");
            res.status(400).send({ 
              message: err.toString().replace('*', ''),
            });
            errorSent = true;
          }
          return false;
        }  // try catch


      } //dAppCreate

      async function dAppUpdate() {
        var errorSent = false;
        updatestatus = false;
    
        // Readng ABI from JSON file
        fs = require("fs");
        ABI = JSON.parse(fs.readFileSync("./server/app/abis/ERC20TokenPBM.abi.json").toString());
    
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
            console.log('Creating PBM contract with ABI');
            const ERC20TokenPBMcontract = new web3.eth.Contract(ABI);
    
            // https://github.com/web3/web3.js/issues/1001
            web3.setProvider( new Web3.providers.HttpProvider(`https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`) );
            
            let setToTalSupply = (isNaN(+req.body.amount)? req.body.amount: req.body.amount.toString())   
            + createStringWithZeros(adjustdecimals);  // pad zeros behind
            console.log("PBM setToTalSupply = ", setToTalSupply);
    
            console.log('**** Signing update txn('+CONTRACT_OWNER_WALLET+','+req.body.amount );
            const nonce = await web3.eth.getTransactionCount(CONTRACT_OWNER_WALLET, "latest") //get latest nonce
            const createTransaction = await web3.eth.accounts.signTransaction(
              { // Sign transaction to setTotalSupply in smart contract
                nonce: nonce,
                from: signer.address,
                to: req.body.smartcontractaddress,
                data: ERC20TokenPBMcontract.methods.updateTotalSupply(
                        web3.utils.toBN( setToTalSupply )
                      ).encodeABI(),
                gas: 4700000,
              },
              SIGNER_PRIVATE_KEY
            ); // signTransaction
            console.log('**** Sending signed txn...');
            //console.log('Sending signed txn:', createTransaction);
    
            const createReceipt = await web3.eth.sendSignedTransaction(
              createTransaction.rawTransaction, 
            
              function (error1, hash) {
                if (error1) {
                    console.log("Error111 submitting your signed transaction:", error1);
                    if (!errorSent) {
                      console.log("Sending error 400 back to client");
                      res.status(400).send({ 
                        message: error1.toString().replace('*', ''),
                      });
                      errorSent = true;
                    }
                    return false;
            } else {
                  console.log("Txn sent!, hash: ", hash);
                  var timer = 1;
                  // retry every second to chk for receipt
                  const interval = setInterval(function() {
                    console.log("Attempting to get transaction receipt...");
    
                    // https://ethereum.stackexchange.com/questions/67232/how-to-wait-until-transaction-is-confirmed-web3-js
                    web3.eth.getTransactionReceipt(hash, async function(error3, receipt) {
                      if (receipt) {
                        console.log('>> GOT RECEIPT!!!!!!!!!!!!!!!!!!!!!!!');
                        clearInterval(interval);
                        console.log('Receipt -->>: ', receipt);
    
                        const trx = await web3.eth.getTransaction(hash);
                        console.log('trx.status -->>: ',trx);
    
                        return(receipt.status);
                      }
                      if (error3) {
                        console.log("!! getTransactionReceipt error3: ", error3)
                        if (!errorSent) {
                          console.log("Sending error 400 back to client");
                          res.status(400).send({ 
                            message: error3.toString().replace('*', ''),
                          });
                          errorSent = true;
                        }
                        clearInterval(interval);
                        return false;
                      }
                    });
                    timer++;
                  }, 1000);
                } // function
              })
              .on("error", err => {
                  console.log("sentSignedTxn error2: ", err)
                  if (!errorSent) {
                    console.log("Sending error 400 back to client");
                    res.status(400).send({ 
                      message: err.toString().replace('*', ''),
                    });
                    errorSent = true;
                  }
                  return false;
            // do something on transaction error
              }); // sendSignedTransaction
    
            console.log('**** PBM Txn executed:', createReceipt);
            return true;
          } catch(error) {
            console.log('Error4 encountered -->: ',error)   
            if (!errorSent) {
              console.log("Sending error 400 back to client");
              res.status(400).send({ 
                message: error.toString().replace('*', ''),
              });
              errorSent = true;
            }
            return false;
          } // try catch
    
        }; // UpdateContract()
    
        return ( await UpdateContract());
      } // dAppUpdate

      /*
      console.log("*** isNewPBM = ", isNewPBM);
      console.log("*** req.body.smartcontractaddress = ", req.body.smartcontractaddress);
      res.status(400).send({
        message: "ENDDD!"
      });
      return;
      */

      if (isNewPBM) {   // new pbm
        updatestatus = await dAppCreate();
      } else {                              // update pbm
        updatestatus = await dAppUpdate(); 
      }
      console.log("Update status:", updatestatus);

////////////////////////////// Blockchain ////////////////////////


  console.log('New PBM Contract deployed updating DB: ', newcontractaddress);

  if (updatestatus) {
  // update draft table
    await PBM_Draft.update(  // update draft table status to "3"
    { 
      status            : 3,
      approverComments  : req.body.approvercomments,
    }, 
    { where:      { id: draft_id }},
    )
    .then(num => {
      if (num == 1) {

      // write to audit
      AuditTrail.create(
        { 
          action                : "PBM "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - approved",
          name                  : req.body.name,
          tokenname             : req.body.tokenname, 
          description           : req.body.description, 
          blockchain            : req.body.blockchain,

          startdate             : req.body.startdate,
          enddate               : req.body.enddate,
          sponsor               : req.body.sponsor,
          amount                : req.body.amount,
          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

          datafield1_name       : req.body.datafield1_name,
          datafield1_value      : req.body.datafield1_value,
          operator1             : req.body.operator1,
          datafield2_name       : req.body.datafield2_name,
          datafield2_value      : req.body.datafield2_value,

          smartcontractaddress  : (isNewPBM? newcontractaddress : req.body.smartcontractaddress),
          PBMunderlyingTokenID  : req.body.underlyingTokenID,
          PBMunderlyingDSGDsmartcontractaddress  : req.body.underlyingDSGDsmartcontractaddress,
    
          draftpbmId            : draft_id,
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
        console.log("Data written to audittrail for approving pbm request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for approving pbm request: "+err.message);
      });


      } else {
        res.send({
          message: `${req.body}. Record updated =${num}. Cannot update PBM with id=${id}. Maybe PBM was not found or req.body is empty!`
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

    if (isNewPBM) {
      await PBM.create( // create PBM in the database !!!!!
        { 
          name                  : req.body.name,
          tokenname             : req.body.tokenname.toUpperCase(), 
          description           : req.body.description, 
          blockchain            : req.body.blockchain,

          datafield1_name       : req.body.datafield1_name,
          datafield1_value      : req.body.datafield1_value,
          operator1             : req.body.operator1,
          datafield2_name       : req.body.datafield2_name,
          datafield2_value      : req.body.datafield2_value,

          startdate             : req.body.startdate, 
          enddate               : req.body.enddate, 
          sponsor               : req.body.sponsor, 
          smartcontractaddress  : newcontractaddress,
          underlyingTokenID     : req.body.underlyingTokenID,
          underlyingDSGDsmartcontractaddress  : req.body.underlyingDSGDsmartcontractaddress,    
          amount                : req.body.amount,
          actionby              : req.body.actionby,
          draftpbmid            : req.body.id,          
        }, 
      )
      .then(data => {
        console.log("PBM create success:", data);
        res.send(data);
      })
      .catch(err => {
        console.log("Error while creating pbm: "+err.message);
        if (!errorSent) {
          console.log("Sending error 400 back to client");
          res.status(400).send({ 
            message: err.toString().replace('*', ''),
          });
          errorSent = true;
        }
        return false;
      });
    } else { // not isNewPBM
      await PBM.update( // update PBM in the database !!!!! 
      { 
        name                  : req.body.name,
        tokenname             : req.body.tokenname.toUpperCase(), 
        description           : req.body.description, 
        blockchain            : req.body.blockchain,

        datafield1_name       : req.body.datafield1_name,
        datafield1_value      : req.body.datafield1_value,
        operator1             : req.body.operator1,
        datafield2_name       : req.body.datafield2_name,
        datafield2_value      : req.body.datafield2_value,

        underlyingTokenID     : req.body.underlyingTokenID,
        underlyingDSGDsmartcontractaddress  : req.body.underlyingDSGDsmartcontractaddress,  
        startdate             : req.body.startdate, 
        enddate               : req.body.enddate, 
        sponsor               : req.body.sponsor, 
        amount                : req.body.amount,
        actionby              : req.body.actionby,
        draftpbmid            : req.body.id,             
      }, 
      { where:      { id: req.body.approvedpbmid }},
      )
      .then(data => {
        console.log("PBM update success:", data);
        res.send(data);
      })
      .catch(err => {
        console.log("Error while updating pbm: "+err.message);
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
}; // approveDraftById

exports.approveWrapMintDraftById = async (req, res) => {  // xxxxx not ready 

  var errorSent = false;

  // Validate request
  if (!req.body.pbm_id) {
    res.status(400).send({
      message: "Content cannot be empty!"
    });
    return;
  }
  
  const draft_id = req.params.id;

  if (req.body.txntype !==0     // create pbm
    && req.body.txntype !==1    // update pbm
    ) {
      res.status(400).send({
        message: "Invalid transaction type!"
      });
      return;  
  }

  console.log("Received approveWrapMintDraftById for Create/Update:");
  console.log(req.body);

  const DSGDContract_abi_json         = "./server/app/abis/ERC20TokenDSGD.abi.json";
  const PBMContract_abi_json          = "./server/app/abis/ERC20TokenPBM.abi.json";
  // const PBMContract_bytecode_json     = "./server/app/abis/ERC20TokenPBM.bytecode.json";
  const PBMContractAddr1            = req.body.PBMsmartcontractaddress;
  const DSGDContractAddr1           = req.body.campaign.smartcontractaddress;
  const amountToSend                = req.body.amount * 1e18;
////////////////////////////// Blockchain ////////////////////////

  // https://www.geeksforgeeks.org/how-to-deploy-contract-from-nodejs-using-web3/

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
  )()
  console.log("Blockchain: ", ETHEREUM_NETWORK);

//      const ETHEREUM_NETWORK = process.env.REACT_APP_ETHEREUM_NETWORK;
  const INFURA_API_KEY = process.env.REACT_APP_INFURA_API_KEY;
  const SIGNER_PRIVATE_KEY = process.env.REACT_APP_SIGNER_PRIVATE_KEY;
  const CONTRACT_OWNER_WALLET = process.env.REACT_APP_CONTRACT_OWNER_WALLET;

  console.log("!!! Signer:", SIGNER_PRIVATE_KEY.substring(0,4)+"..." + SIGNER_PRIVATE_KEY.slice(-3));

  const WrapMint = async () => {  //parameters you need

    updatestatus = false;
    var errorSent = false;

    fs = require("fs");

    try {  // 7a
      if (! (fs.existsSync(PBMContract_abi_json) 
            //  && fs.existsSync(PBMContract_bytecode_json)
            )) {
        console.error("Err7: ",err)
        if (!errorSent) {
          console.log("Sending error 400 back to client");
          res.status(400).send({ 
            message: "Smart contract file not found!"
          });
          errorSent = true;
        }
        return false;  
      } else{
        // Just read the ABI file
        console.log("PBM ABI and Bytecode files are present...");
        console.log("Read PBM ABI JSON file.");
        PBM_ABI = JSON.parse(fs.readFileSync(PBMContract_abi_json).toString());
        console.log("Read PBM Bytecode JSON file.");
        // bytecode = JSON.parse(fs.readFileSync(PBMContract_bytecode_json).toString());
        DSGD_ABI = JSON.parse(fs.readFileSync(DSGDContract_abi_json).toString());
      }
    } catch(err) {  // 7a
      console.error("Err7: ",err)
      if (!errorSent) {
        console.log("Sending error 400 back to client");
        res.status(400).send({ 
          message: err
        });
        errorSent = true;
      }
      return false;
    }  // try 7a

    
    // Creation of Web3 class
    Web3 = require("web3");

    const createInstance = (abi1, contractaddr1) => {
      const bscProvider = new Web3(
          new Web3.providers.HttpProvider(`https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`),
      );
      console.log("createInstance - Contract Addr: "+ contractaddr1);
      const web3BSC = new Web3(bscProvider);
      const contractz = new web3BSC.eth.Contract(
        abi1,
        contractaddr1,
      );
      return { web3BSC, contractz };
    }; // createInstance

    try {  // try 3z
      const PBMcontractInstance = createInstance(PBM_ABI, PBMContractAddr1);   // executing using PBMcontractowner's private key
      console.log("wrapMint(): From ("+PBMContractAddr1+"), To ("+PBMContractAddr1+")");
      const DSGDcontractInstance = createInstance(DSGD_ABI, DSGDContractAddr1);   // executing using DSGDcontractowner's private key
      console.log("wrapMint(): From ("+DSGDContractAddr1+"), To ("+DSGDContractAddr1+")");

      //
      // Step 2: Estimate gas fee for Wrapmint
      //

      var url = "https://"+ (() => {
        switch (req.body.campaign.blockchain) {
          case 80001:
            return 'mumbai.polygonscan.com/tx/'
          case 80002:
            return 'amoy.polygonscan.com/tx/'
          case 11155111:
            return 'sepolia.etherscan.io/tx/'
          case 43113: // avax fuji
            return 'testnet.snowtrace.io/tx/'
          case 137:
            return 'polygonscan.com/tx/'
          case 1:
            return 'etherscan.io/tx/'
          case 43114:
            return 'avascan.info/blockchain/all/tx/'
          default:
            return null
        }
      }
      )() ;

      async function exec_approve() {
        const tx = {
          // this is the address responsible for this transaction
          from: CONTRACT_OWNER_WALLET,
          // target address, this could be a smart contract address
          to: DSGDContractAddr1,
          // gas fees for the transaction
          gas: 2100000,
          // this encodes the ABI of the method and the arguments
          data: await DSGDcontractInstance.contractz.methods
            .approve(
              PBMContractAddr1, "115792089237316195423570985008687907853269984665640564039457000000000000000000"
            )
            .encodeABI(),
        };
        console.log("Create approve() txn data: ", tx.data);
                  
        // sign the transaction with a private key. It'll return messageHash, v, r, s, rawTransaction, transactionHash
        const signPromise = await DSGDcontractInstance.web3BSC.eth.accounts.signTransaction(
            tx,
            SIGNER_PRIVATE_KEY,
          );
        console.log("Create signPromise: ", signPromise);

        // the rawTransaction here is already serialized so you don't need to serialize it again
        // Send the signed txn
        try { // 6c

          const sendTxn = await DSGDcontractInstance.web3BSC.eth.sendSignedTransaction(
              signPromise.rawTransaction,
              (error1c, hash) => {
                var url1 = url + hash
                console.log("url = "+ url1);
                if (error1c) {
                    console.log("Something went wrong when submitting your signed transaction:", error1c)
                } else {
                    console.log("Txn sent!, hash: ", hash);
                    var timer = 1;
                    // retry every second to chk for receipt
                    const interval = setInterval(() => {
                        console.log("Attempting to get transaction receipt...");

                        // https://ethereum.stackexchange.com/questions/67232/how-to-wait-until-transaction-is-confirmed-web3-js
                        DSGDcontractInstance.web3BSC.eth.getTransactionReceipt(hash, (error3, receipt) => {
                          if (receipt) {
                            clearInterval(interval);

                            console.log('--> RECEIPT received <--');  
                            console.log('Receipt: ', receipt);

                            if (receipt.status) { //  === true
                              res.send({
                                message: "Approve() successful. "
                              });
                              errorSent = true;
                            } else {
                              res.status(400).send({ 
                                message: "Transaction failed, please check "+url+" for error.",
                              });
                              errorSent = true;
                            }

                          }
                          if (error3) {
                              console.log("!! getTransactionReceipt error: ", error3)
                              clearInterval(interval);
                          }
                        });
                        if (timer > 750) {
                          // end loop and return
                        
                          clearInterval(interval);
                        } else {
                          timer++;
                        }
                    }, 1000);
                }
            })
          .on("error", err => {
              console.log("sentSignedTxn error: ", err)
              // do something on transaction error
          });
          console.log("sendSignedTxn: ", sendTxn);
          return Promise.resolve(sendTxn);
        } catch(err6c) {  // try 6c
          console.error("Err 6c: ",err6c);

          if (!errorSent) {
            console.log("Transaction failed, please check "+url1+" for error.");
            errorSent = true;
          }
          return false;
    
        } // try 6c
      } // function exec_approve()

      await exec_approve();

      const gasFees = await PBMcontractInstance.contractz.methods.wrapMint(
        PBMContractAddr1, amountToSend.toString() 
      )
      .estimateGas({ 
        from: CONTRACT_OWNER_WALLET, //caller of this func
      })
      .then((gasAmount) => {
        console.log("Estimated gas amount for wrapMint: ", gasAmount)
        return gasAmount;
      })
      .catch((error2) => {
        console.log("Error while estimating Gas fee: >" + error2 + "<");
        return 2100000;  // if error then use default fee
      }
      );
      console.log("Estimated gas fee for wrapMint: ", gasFees);    

      //
      // Step 3: Execute Wrapmint
      //
      async function exec_wrapMint() {
        const tx = {
          // this is the address responsible for this transaction
          from: CONTRACT_OWNER_WALLET,
          // target address, this could be a smart contract address
          to: PBMContractAddr1,
          // gas fees for the transaction
          gas: gasFees,
          // this encodes the ABI of the method and the arguments
          data: await PBMcontractInstance.contractz.methods
            .wrapMint(
              CONTRACT_OWNER_WALLET, amountToSend.toString()
            )
            .encodeABI(),
        };
        console.log("Create wrapMint() txn data: ", tx.data);
                  
        // sign the transaction with a private key. It'll return messageHash, v, r, s, rawTransaction, transactionHash
        const signPromise =
          await PBMcontractInstance.web3BSC.eth.accounts.signTransaction(
            tx,
            SIGNER_PRIVATE_KEY,
          );
        console.log("Create signPromise: ", signPromise);

        // the rawTransaction here is already serialized so you don't need to serialize it again
        // Send the signed txn
        try { // 6

          const sendTxn = await PBMcontractInstance.web3BSC.eth.sendSignedTransaction(
              signPromise.rawTransaction,
              (error1, hash) => {
                url += hash;
                console.log("url = "+ url);
                if (error1) {
                    console.log("Something went wrong when submitting your signed transaction:", error1)
                } else {
                    console.log("Txn sent!, hash: ", hash);
                    var timer = 1;
                    // retry every second to chk for receipt
                    const interval = setInterval(() => {
                        console.log("Attempting to get transaction receipt...");

                        // https://ethereum.stackexchange.com/questions/67232/how-to-wait-until-transaction-is-confirmed-web3-js
                        PBMcontractInstance.web3BSC.eth.getTransactionReceipt(hash, (error3, receipt) => {
                          if (receipt) {
                            clearInterval(interval);

                            console.log('--> RECEIPT received <--');  
                            console.log('Receipt: ', receipt);

                              console.log('Sending response back to client (1).. ');

                            if (receipt.status) { //  === true
                              res.send({
                                message: "WrapMint successful. "
                              });
                              errorSent = true;
                            } else {
                              res.status(400).send({ 
                                message: "Transaction failed, please check "+url+" for error.",
                              });
                              errorSent = true;
                            }

                            return(receipt.status);
                          }
                          if (error3) {
                              console.log("!! getTransactionReceipt error: ", error3)
                              clearInterval(interval);
                          }
                        });
                        if (timer > 750) {
                          // end loop and return
                          
                          clearInterval(interval);

                          console.log('Sending response back to client (2).. ');
                          res.send({
                            message: "WrapMint is submitted please check "+url+" for status later.",
                          });
  
                          return(true);
                          
                        } else {
                          timer++;
                        }
                    }, 1000);
                }
            })
          .on("error", err => {
              console.log("sentSignedTxn error: ", err)
              // do something on transaction error
          });
          console.log("sendSignedTxn: ", sendTxn);
          return Promise.resolve(sendTxn);
        } catch(err6) {  // try 6
          console.error("Err 6a: ",err6);

          if (!errorSent) {
            console.log("Sending error 400 back to client");
            res.status(400).send({ 
              message: "Transaction failed, please check "+url+" for error.",
            });
            errorSent = true;
          }
          return false;
    
        } // try 6
      } // function exec_wrapMint()
      await exec_wrapMint();

    } catch(err3) {  // try 3z
      console.error("Err 3: ",err3)
      if (!errorSent) {
        console.log("Sending error 400 back to client");
        res.status(400).send({ 
          message: "Transaction failed, please check "+url+" for error.",
        });
        errorSent = true;
      }
      return false;
    } // try 3z
  } // function WrapMint

  updatestatus = await WrapMint();

  //updatestatus = await execWrapMint();
  console.log("Update status:", updatestatus);

////////////////////////////// Update to database ////////////////////////

  console.log('WrapMint executed updating DB...');

  if (updatestatus) {
  // update draft table
    await wrapMints_Draft.update(  // update draft table status to "3"
    { 
      status            : 3,
      approverComments  : req.body.approvercomments,
    }, 
    { where:      { id: draft_id }},
    )
    .then(num => {
      if (num == 1) {

      // write to audit table
      AuditTrail.create(
        { 
          action                : "WrapMint "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - approved",
          underlyingTokenID     : req.body.underlyingTokenID,
          pbm_id                : req.body.pbm_id,
          blockchain            : req.body.blockchain,
          amount                : req.body.amount,
          txntype               : req.body.txntype,    // create
          maker                 : req.body.maker, 
          checker               : req.body.checker,
          approver              : req.body.approver,
          checkerComments       : req.body.checkerComments,
          approverComments      : req.body.approverComments,
          actionby              : req.body.actionby,
          status                : 3,   // 0 = draft; 1 = created pending review; 2 = reviewed pending approval; 3 = approved
        }, 
      )
      .then(auditres => {
        console.log("Data written to audittrail for approving wrapmint request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for approving wrapmint request: "+err.message);
      });

      } else {
        res.send({
          message: `${req.body}. Record updated =${num}. Cannot update WrapMint with id=${id}. Maybe WrapMint was not found or req.body is empty!`
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
  } // updatestatus
}; // approveWrapMintDraftById

exports.findDraftByNameExact = (req, res) => {
  const name = req.query.name;
  var condition = name ? { 
    name: name, 
    status : [-1, 0, 1, 2]  // status -1=rejected, 0, drafted not submitted, 1=submitted for checker, 2=submitted for approver, 3=approved
  } : null;

  PBM_Draft.findAll(
    { where: condition },
    )
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving pbm1 draft: "+err.message);

      res.status(400).send({
        message:
          err.message || "Some error occurred while retrieving pbm draft."
      });
    });
}; // findDraftByNameExact

exports.findDraftByApprovedId = (req, res) => {
  const id = req.query.id;
  var condition = id ? { 
    approvedpbmid: id, 
    status : [-1, 0, 1, 2]  // status -1=rejected, 0, drafted not submitted, 1=submitted for checker, 2=submitted for approver, 3=approved
  } : null;

  PBM_Draft.findAll(
    { where: condition },
    )
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving pbm1 draft: "+err.message);

      res.status(400).send({
        message:
          err.message || "Some error occurred while retrieving pbm draft."
      });
    });
}; // findDraftByApprovedId

exports.findExact = (req, res) => {
  const name = req.query.name;
  var condition = name ? { name: name } : null;

  PBM.findAll(
    { where: condition },
    )
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving pbm1: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving pbm."
      });
    });
}; // findExact

exports.findExactTemplate = (req, res) => {
  const name = req.query.name;
  var condition = name ? { templatename: name } : null;

  console.log("Condition = "+condition);

  db.pbm_templates.findAll(
    { where: condition },
    )
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving pbm1: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving pbm."
      });
    });
}; // findExactTemplate

exports.getInWalletMintedTotalSupply = (req, res) => {
  
  // get token address from PBMId
  const Id = req.query.id;
  var condition = Id ? { id: Id } : null;

  //console.log("++++++++++++++Received data:", req)
  
  PBM.findAll(
  { 
    where: { id : Id },
  })
  .then(async data => {

    //console.log("Qery result fo DATA:", data[0].id);

    /// Query blockchain
    // Readng ABI from JSON file
    fs = require("fs");
    ABI = JSON.parse(fs.readFileSync("./server/app/abis/ERC20TokenPBM.abi.json").toString());  // <-- dropdown menu

    // Creation of Web3 class
    Web3 = require("web3");

    require('dotenv').config();
    const ETHEREUM_NETWORK = (() => {switch (req.body.campaign.blockchain) {
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

    //    const ETHEREUM_NETWORK = process.env.REACT_APP_ETHEREUM_NETWORK;
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
    console.log("Error while retreiving pbm2: "+err.message);

    res.status(500).send({
      message:
        err.message || "Some error occurred while retrieving pbm."
    });
  });
}; // getInWalletMintedTotalSupply

// Retrieve all PBM from the database.
exports.findByName = (req, res) => {
  const name = req.query.name;
  var condition = name ? { name: { [Op.like]: `%${name}%` } } : null;

  PBM.findAll(
    { include: db.recipients,
      where: condition
    },
    )
    .then(data => {
      console.log("PBM.findByName:", data)
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving pbm3: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving pbm."
      });
    });
}; // findByName

// Retrieve all PBM from the database.
exports.getAll = (req, res) => {
  const name = req.query.name;
  var condition = name ? { name: { [Op.like]: `%${name}%` } } : null;
/*
  PBM.findAll(
    { include: db.recipients},
    { where: condition },
    )
    .then(data => {
      console.log("PBM.findAll:", data)
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving pbm4: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving pbm.findAll()."
      });
    }
  );
  */

  PBM.findAll(
  {
    include: [
      {
        model: db.recipients,
        on: {
          id: db.Sequelize.where(db.Sequelize.col("pbm.sponsor"), "=", db.Sequelize.col("recipient.id")),
        },
        attributes: ['id','name'],
      },
      {
        model: db.campaigns,
        on: {
          id: db.Sequelize.where(db.Sequelize.col("pbm.underlyingTokenID"), "=", db.Sequelize.col("campaign.id")),
        },
        attributes: ['id', 'name', 'tokenname', 'smartcontractaddress','blockchain'],
      }
    ]
  },
  ).then(data => {
    console.log(JSON.stringify(data, null, 2));
    res.send(data);
  }).catch(err => {
    res.status(500).send({
      message:
        err.message || "Some error occurred while retrieving pbm."
    });
  });
}; // getAll

// Retrieve all PBM from the database.
exports.getAllPBMTemplates = (req, res) => {
  const name = req.query.name;
  var condition = name ? { name: { [Op.like]: `%${name}%` } } : null;

  PBM_TEMPLATE.findAll(
    { where: condition,
      include: [
        {
          model: db.recipients,
          on: {
            id: db.Sequelize.where(db.Sequelize.col("pbm_templates.sponsor"), "=", db.Sequelize.col("recipient.id")),
          },
          attributes: ['id','name'],
        },
        {
          model: db.campaigns,
          on: {
            id: db.Sequelize.where(db.Sequelize.col("pbm_templates.underlyingTokenID"), "=", db.Sequelize.col("campaign.id")),
          },
          attributes: ['id', 'name', 'tokenname', 'smartcontractaddress','blockchain'],
        }
      ]
    },
    )
    .then(data => {
      console.log("PBM_TEMPLATE.findAll:", data)
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving pbm template: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving pbm_template.findAll()."
      });
    });
}; // getAllPBMTemplates

exports.getAllDraftsByUserId = (req, res) => {
  const id = req.query.id;
  console.log("====== pbm.getAllDraftsByUserId(id) ",id);
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

  PBM_Draft.findAll( 
    { 
      where: condition,
      //include: db.recipients
      include: [
        {
          model: db.recipients,
          on: {
            id: db.Sequelize.where(db.Sequelize.col("pbms_draft.sponsor"), "=", db.Sequelize.col("recipient.id")),
          },
          attributes: ['id','name'],
        },
        {
          model: db.campaigns,
          on: {
            id: db.Sequelize.where(db.Sequelize.col("pbms_draft.underlyingTokenID"), "=", db.Sequelize.col("campaign.id")),
          },
          attributes: ['id', 'name', 'tokenname', 'smartcontractaddress','blockchain'],
        }
      ]
    },
    )
    .then(data => {
      console.log("PBM_Draft.findAll:", data)
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving pbm6: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving pbm."
      });
    });
}; // getAllDraftsByUserId

exports.getAllWrapMintDraftsByUserId = (req, res) => {
  const id = req.query.id;
  console.log("====== pbm.getAllWrapMintDraftsByUserId(id) ",id);
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

  wrapMints_Draft.findAll( 
    { 
      where: condition,
      //include: db.recipients
      include: [
        {
          model: db.campaigns,
          on: {
            id: db.Sequelize.where(db.Sequelize.col("wrapmints_draft.underlyingTokenID"), "=", db.Sequelize.col("campaign.id")),
          },
          attributes: ['id', 'name', 'tokenname', 'smartcontractaddress','blockchain'],
        }
      ]
    },
    )
    .then(data => {
      console.log("PBM_Draft.findAll:", data)
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving wrapmint1: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving wrapmint."
      });
    });
}; // getAllWrapMintDraftsByUserId

exports.getAllDraftsByPBMId = (req, res) => {
  const id = req.query.id;
  console.log("====== pbm.getAllDraftsByPBMId(id) ",id);
  var condition = id ? 
       {id : id}
      : null;

  PBM_Draft.findAll(
    { 
/*
      where: condition
    },
    { include: db.recipients},
*/
      where: condition,
      //include: db.recipients
      include: [
        {
          model: db.recipients,
          on: {
            id: db.Sequelize.where(db.Sequelize.col("pbms_draft.sponsor"), "=", db.Sequelize.col("recipient.id")),
          },
          attributes: ['id','name'],
        },
        {
          model: db.campaigns,
          on: {
            id: db.Sequelize.where(db.Sequelize.col("pbms_draft.underlyingTokenID"), "=", db.Sequelize.col("campaign.id")),
          },
          attributes: ['id', 'name', 'tokenname', 'smartcontractaddress','blockchain'],
        }
      ]
    },
    )
    .then(data => {
      console.log("PBM_Draft.findAll:", data)
      if (data.length === 0) {
        console.log("Data is empyty!!!");
        res.status(500).send({
          message: "No such record in the system" 
        });
      } else
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving pbm5: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving pbm."
      });
    });
/*
  PBM_Draft.findAll( 
    {
      include: [
        {
          model: db.recipients,
          on: {
            id: db.Sequelize.where(db.Sequelize.col("pbm.sponsor"), "=", db.Sequelize.col("recipient.id")),
          },
          attributes: ['id','name'],
        },
        {
          model: db.campaigns,
          on: {
            id: db.Sequelize.where(db.Sequelize.col("pbm.underlyingTokenID"), "=", db.Sequelize.col("campaign.id")),
          },
          attributes: ['id', 'name', 'tokenname', 'smartcontractaddress','blockchain'],
        }
      ]
    }).then(data => {
    console.log(JSON.stringify(data, null, 2));
    res.send(data);
  }).catch(err => {
    res.status(500).send({
      message:
        err.message || "Some error occurred while retrieving pbm."
    });
  });
  */
}; // getAllDraftsByPBMId

exports.getAllWrapMintDraftsById = (req, res) => {
  const id = req.query.id;
  console.log("====== pbm.getAllWrapMintDraftsById(id) ",id);
  var condition = id ? 
       {id : id}
      : null;

  wrapMints_Draft.findAll(
  { 
/*
    where: condition
  },
  { include: db.recipients},
*/
    where: condition,
    //include: db.recipients
    include: [
      {
        model: db.campaigns,
        on: {
          id: db.Sequelize.where(db.Sequelize.col("wrapmints_draft.underlyingTokenID"), "=", db.Sequelize.col("campaign.id")),
        },
        attributes: ['id', 'name', 'tokenname', 'smartcontractaddress','blockchain'],
      }
    ]
  },
  )
  .then(data => {
    console.log("wrapMints_Draft.findAll:", data)
    if (data.length === 0) {
      console.log("Data is empyty!!!");
      res.status(500).send({
        message: "No such record in the system" 
      });
    } else
    res.send(data);
  })
  .catch(err => {
    console.log("Error while retreiving wrapmint2: "+err.message);

    res.status(500).send({
      message:
        err.message || "Some error occurred while retrieving wrapmint."
    });
  }); 
};  //getAllWrapMintDraftsById

// Find a single PBM with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  PBM.findByPk(id, {
    include: db.recipients
  })
    .then(data => {
      //console.log("PBM.findByPk:", data)
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find PBM with id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving PBM with id=" + id
      });
    });
};

exports.submitDraftById = async (req, res) => {
  
  const id = req.params.id;
  const draft_id = req.params.id;

  console.log("Received1 submitDraftById:");
  console.log("id=", draft_id);
  console.log(req.body);

  await PBM_Draft.update(
  { 
    status                : 1,
    name                  : req.body.name,
    tokenname             : req.body.tokenname.toUpperCase(), 
    description           : req.body.description, 
    blockchain            : req.body.blockchain,

    datafield1_name       : req.body.datafield1_name,
    datafield1_value      : req.body.datafield1_value,
    operator1             : req.body.operator1,
    datafield2_name       : req.body.datafield2_name,
    datafield2_value      : req.body.datafield2_value,

    startdate             : req.body.startdate, 
    enddate               : req.body.enddate, 
    sponsor               : req.body.sponsor, 
    smartcontractaddress  : req.body.smartcontractaddress,
    underlyingTokenID     : req.body.underlyingTokenID,
    underlyingDSGDsmartcontractaddress  : req.body.underlyingDSGDsmartcontractaddress,
    amount                : req.body.amount,
    txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete
    maker                 : req.body.maker,
    checker               : req.body.checker,
    approver              : req.body.approver,
    checkerComments       : req.body.checkerComments,
    approverComments      : req.body.approverComments,
    actionby              : req.body.actionby,
  }, 
  { where:      { id: draft_id }},
  )
  .then(num => {
    if (num == 1) {

      // write to audit
      AuditTrail.create(
        { 
          action                : "PBM "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - resubmitted",
          name                  : req.body.name,
          tokenname             : req.body.tokenname, 
          description           : req.body.description, 
          blockchain            : req.body.blockchain,

          datafield1_name       : req.body.datafield1_name,
          datafield1_value      : req.body.datafield1_value,
          operator1             : req.body.operator1,
          datafield2_name       : req.body.datafield2_name,
          datafield2_value      : req.body.datafield2_value,

          PBMunderlyingTokenID  : req.body.underlyingTokenID,
          PBMunderlyingDSGDsmartcontractaddress  : req.body.underlyingDSGDsmartcontractaddress,    
          startdate             : req.body.startdate,
          enddate               : req.body.enddate,
          sponsor               : req.body.sponsor,
          amount                : req.body.amount,
          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

          draftpbmId            : draft_id,
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
        console.log("Data written to audittrail for resubmitting pbm request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for resubmitting pbm request: "+err.message);
      });
      
      res.send({
        message: "PBM resubmitted successfully."
      });
    } else {
      res.send({
        message: `${req.body}. Record updated =${num}. Cannot update PBM with id=${draft_id}. Maybe PBM was not found or req.body is empty!`
      });
    }
  })
  .catch(err => {
    console.log(err);
    res.status(500).send({
      message: `Error updating PBM. ${err}`
    });
  });
}; // submitDraftById

exports.submitWrapMintDraftById = async (req, res) => {
  
  const id = req.params.id;
  const draft_id = req.params.id;

  console.log("Received1 submitWrapMintDraftById:");
  console.log("id=", draft_id);
  console.log(req.body);

  await wrapMints_Draft.update(
  { 
    underlyingTokenID     : req.body.underlyingTokenID,
    pbm_id                : req.body.pbm_id,
    blockchain            : req.body.blockchain,
    amount                : req.body.amount,
    txntype               : req.body.txntype,    // create
    maker                 : req.body.maker, 
    checker               : req.body.checker,
    approver              : req.body.approver,
    checkerComments       : req.body.checkerComments,
    approverComments      : req.body.approverComments,
    actionby              : req.body.actionby,
    status                : 1,   // 0 = draft; 1 = created pending review; 2 = reviewed pending approval; 3 = approved
  }, 
  { where:      { id: draft_id }},
  )
  .then(num => {
    if (num == 1) {

      // write to audit
      AuditTrail.create(
        { 
          action                : "Wrap Mint "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - resubmitted",
          underlyingTokenID     : req.body.underlyingTokenID,
          pbm_id                : req.body.pbm_id,
          blockchain            : req.body.blockchain,
          amount                : req.body.amount,
          txntype               : req.body.txntype,    // create
          maker                 : req.body.maker, 
          checker               : req.body.checker,
          approver              : req.body.approver,
          checkerComments       : req.body.checkerComments,
          approverComments      : req.body.approverComments,
          actionby              : req.body.actionby,
          status                : 1,   // 0 = draft; 1 = created pending review; 2 = reviewed pending approval; 3 = approve
        }, 
      )
      .then(auditres => {
        console.log("Data written to audittrail for resubmitting wrapmint request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for resubmitting wrapmint request: "+err.message);
      });
      
      res.send({
        message: "WrapMint resubmitted successfully."
      });
    } else {
      res.send({
        message: `${req.body}. Record updated =${num}. Cannot update wrapmint with id=${draft_id}. Maybe WrapMint was not found or req.body is empty!`
      });
    }
  })
  .catch(err => {
    console.log(err);
    res.status(500).send({
      message: `Error updating WrapMint. ${err}`
    });
  });
}; // submitWrapMintDraftById

exports.acceptDraftById = async (req, res) => {
  
  const id = req.params.id;
  const draft_id = req.params.id;

  console.log("Received2 acceptDraftById:");
  console.log("id=", draft_id);
  console.log(req.body);

  await PBM_Draft.update(
  { 
    status :          2,
    checkerComments: req.body.checkerComments,
    approverComments: req.body.approverComments,
  }, 
  { where:      { id: draft_id }},
  )
  .then(num => {
    if (num == 1) {

      // write to audit
      AuditTrail.create(
        { 
          action                : "PBM "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - accepted",
          name                  : req.body.name,
          tokenname             : req.body.tokenname, 
          description           : req.body.description, 
          blockchain            : req.body.blockchain,

          datafield1_name       : req.body.datafield1_name,
          datafield1_value      : req.body.datafield1_value,
          operator1             : req.body.operator1,
          datafield2_name       : req.body.datafield2_name,
          datafield2_value      : req.body.datafield2_value,

          PBMunderlyingTokenID  : req.body.underlyingTokenID,
          PBMunderlyingDSGDsmartcontractaddress  : req.body.underlyingDSGDsmartcontractaddress,    
          startdate             : req.body.startdate,
          enddate               : req.body.enddate,
          sponsor               : req.body.sponsor,
          amount                : req.body.amount,
          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

          draftpbmId            : draft_id,
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
        console.log("Data written to audittrail for accepting pbm request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for accepting pbm request: "+err.message);
      });
      
      res.send({
        message: "PBM was accepted successfully."
      });
    } else {
      res.send({
        message: `${req.body}. Record updated =${num}. Cannot update PBM with id=${draft_id}. Maybe PBM was not found or req.body is empty!`
      });
    }
  })
  .catch(err => {
    console.log(err);
    res.status(500).send({
      message: `Error updating PBM. ${err}`
    });
  });
}; // acceptDraftById

exports.acceptWrapMintDraftById = async (req, res) => {
  
  const id = req.params.id;
  const draft_id = req.params.id;

  console.log("Received2 acceptWrapMintDraftById:");
  console.log("id=",draft_id);
  console.log(req.body);

  await wrapMints_Draft.update(
  { 
    status :          2,
    checkerComments: req.body.checkerComments,
    approverComments: req.body.approverComments,
  }, 
  { where:      { id: draft_id }},
  )
  .then(num => {
    if (num == 1) {

      // write to audit
      AuditTrail.create(
        { 
          action                : "Wrap Mint "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - accepted",
          underlyingTokenID     : req.body.underlyingTokenID,
          pbm_id                : req.body.pbm_id,
          blockchain            : req.body.blockchain,
          amount                : req.body.amount,
          txntype               : req.body.txntype,    // create
          maker                 : req.body.maker, 
          checker               : req.body.checker,
          approver              : req.body.approver,
          checkerComments       : req.body.checkerComments,
          approverComments      : req.body.approverComments,
          actionby              : req.body.actionby,
          status                : 2,   // 0 = draft; 1 = created pending review; 2 = reviewed pending approval; 3 = approve
        }, 
      )
      .then(auditres => {
        console.log("Data written to audittrail for accepting wrapmint request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for accepting wrapmint request: "+err.message);
      });
      
      res.send({
        message: "WrapMint was accepted successfully."
      });
    } else {
      res.send({
        message: `${req.body}. Record updated =${num}. Cannot update WrapMint with id=${draft_id}. Maybe WrapMint was not found or req.body is empty!`
      });
    }
  })
  .catch(err => {
    console.log(err);
    res.status(500).send({
      message: `Error updating WrapMint. ${err}`
    });
  });
}; // acceptWrapMintDraftById

exports.rejectDraftById = async (req, res) => {
  
  const id = req.params.id;
  const draft_id = req.params.id;

  console.log("Received2 rejectDraftById:");
  console.log("id=", draft_id);
  console.log(req.body);

  await PBM_Draft.update(
  { 
    status :          -1,
    checkerComments: req.body.checkerComments,
    approverComments: req.body.approverComments,
  }, 
  { where:      { id: draft_id }},
  )
  .then(num => {
    if (num == 1) {

      // write to audit
      AuditTrail.create(
        { 
          action                : "PBM "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - rejected",
          name                  : req.body.name,
          tokenname             : req.body.tokenname, 
          description           : req.body.description, 
          blockchain            : req.body.blockchain,
        
          datafield1_name       : req.body.datafield1_name,
          datafield1_value      : req.body.datafield1_value,
          operator1             : req.body.operator1,
          datafield2_name       : req.body.datafield2_name,
          datafield2_value      : req.body.datafield2_value,

          PBMunderlyingTokenID  : req.body.underlyingTokenID,
          PBMunderlyingDSGDsmartcontractaddress  : req.body.underlyingDSGDsmartcontractaddress,    
          startdate             : req.body.startdate,
          enddate               : req.body.enddate,
          sponsor               : req.body.sponsor,
          amount                : req.body.amount,
          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

          draftpbmId            : draft_id,
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
        console.log("Data written to audittrail for rejecting pbm request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for rejecting pbm request: "+err.message);
      });
      
      res.send({
        message: "PBM was rejected."
      });
    } else {
      res.send({
        message: `${req.body}. Record updated =${num}. Cannot reject PBM with id=${draft_id}. Maybe PBM was not found or req.body is empty!`
      });
    }
  })
  .catch(err => {
    console.log(err);
    res.status(500).send({
      message: `Error rejecting PBM. ${err}`
    });
  });
}; // rejectDraftById

exports.rejectWrapMintDraftById = async (req, res) => {
  
  const id = req.params.id;
  const draft_id = req.params.id;

  console.log("Received2 rejectWrapMintDraftById:");
  console.log("id=",draft_id);
  console.log(req.body);

  await wrapMints_Draft.update(
  {
    status :          -1,
    checkerComments: req.body.checkerComments,
    approverComments: req.body.approverComments,
  }, 
  { where:      { id: draft_id }},
  )
  .then(num => {
    if (num == 1) {

      // write to audit
      AuditTrail.create(
        { 
          action                : "Wrap Mint "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - rejected",
          underlyingTokenID     : req.body.underlyingTokenID,
          pbm_id                : req.body.pbm_id,
          blockchain            : req.body.blockchain,
          amount                : req.body.amount,
          txntype               : req.body.txntype,    // create
          maker                 : req.body.maker, 
          checker               : req.body.checker,
          approver              : req.body.approver,
          checkerComments       : req.body.checkerComments,
          approverComments      : req.body.approverComments,
          actionby              : req.body.actionby,
          status                : -1,   // 0 = draft; 1 = created pending review; 2 = reviewed pending approval; 3 = approved
        }, 
      )
      .then(auditres => {
        console.log("Data written to audittrail for rejecting wrapmint request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for rejecting wrapmint request: "+err.message);
      });
      
      res.send({
        message: "WrapMint was rejected."
      });
    } else {
      res.send({
        message: `${req.body}. Record updated =${num}. Cannot reject WrapMint with id=${draft_id}. Maybe WrapMint was not found or req.body is empty!`
      });
    }
  })
  .catch(err => {
    console.log(err);
    res.status(500).send({
      message: `Error rejecting WrapMint. ${err}`
    });
  });
}; // rejectWrapMintDraftById

// Update a PBM by the id in the request
exports.update = async (req, res) => {
  
  const id = req.params.id;
  const draft_id = req.params.id;

  console.log("Received3:");
  console.log("id=",id);
  console.log(req.body);

  ////////////////////////////// Blockchain ////////////////////////

  require('dotenv').config();
  const ETHEREUM_NETWORK = (() => {switch (req.body.campaign.blockchain) {
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

//  const ETHEREUM_NETWORK = process.env.REACT_APP_ETHEREUM_NETWORK;
  const INFURA_API_KEY = process.env.REACT_APP_INFURA_API_KEY;
  const SIGNER_PRIVATE_KEY = process.env.REACT_APP_SIGNER_PRIVATE_KEY;
  const CONTRACT_OWNER_WALLET = process.env.REACT_APP_CONTRACT_OWNER_WALLET;

  console.log("!!! Signer:", SIGNER_PRIVATE_KEY.substring(0,4)+"..." + SIGNER_PRIVATE_KEY.slice(-3));

  async function dAppUpdate() {

    updatestatus = false;

    // Readng ABI from JSON file
    fs = require("fs");
    ABI = JSON.parse(fs.readFileSync("./server/app/abis/ERC20TokenPBM.abi.json").toString());

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
        const ERC20TokenPBMcontract = new web3.eth.Contract(ABI);

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
            data: ERC20TokenPBMcontract.methods.updateTotalSupply(
                    web3.utils.toBN( setToTalSupply )
                  ).encodeABI(),
            gas: 4700000,
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
                    console.log('>> GOT RECEIPT!!!!!!!!!!!!!!!!!!!!!!!');
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
    await PBM.update(
      { name                  : req.body.name,
  // cant update token name once smart contract is deployed
  //    tokenname             : req.body.tokenname.toUpperCase(), 
        description           : req.body.description, 
        blockchain            : req.body.blockchain,
      
        datafield1_name       : req.body.datafield1_name,
        datafield1_value      : req.body.datafield1_value,
        operator1             : req.body.operator1,
        datafield2_name       : req.body.datafield2_name,
        datafield2_value      : req.body.datafield2_value,

        underlyingTokenID     : req.body.underlyingTokenID,
        underlyingDSGDsmartcontractaddress  : req.body.underlyingDSGDsmartcontractaddress,  
        startdate             : req.body.startdate, 
        enddate               : req.body.enddate, 
        sponsor               : req.body.sponsor, 
        amount                : req.body.amount,
      }, 
      { where:      { id: draft_id }},
      )
      .then(num => {
        if (num == 1) {

          // write to audit
          AuditTrail.create(
            { 
              action                : "PBM "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" update request - approved",
              name                  : req.body.name,
              tokenname             : req.body.tokenname, 
              description           : req.body.description, 
              blockchain            : req.body.blockchain,
            
              datafield1_name       : req.body.datafield1_name,
              datafield1_value      : req.body.datafield1_value,
              operator1             : req.body.operator1,
              datafield2_name       : req.body.datafield2_name,
              datafield2_value      : req.body.datafield2_value,
    
              PBMunderlyingTokenID  : req.body.underlyingTokenID,
              PBMunderlyingDSGDsmartcontractaddress  : req.body.underlyingDSGDsmartcontractaddress,
        
              startdate             : req.body.startdate,
              enddate               : req.body.enddate,
              sponsor               : req.body.sponsor,
              amount                : req.body.amount,
              txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

              draftpbmId            : draft_id,
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
            console.log("Data written to audittrail for approving pbm update request:", auditres);

          })
          .catch(err => {
            console.log("Error while logging to audittrail for approving pbm update request: "+err.message);
          });


          res.send({
            message: "PBM was updated successfully."
          });
        } else {
          res.send({
            message: `${req.body}. Record updated =${num}. Cannot update PBM with id=${id}. Maybe PBM was not found or req.body is empty!`
          });
        }
      })
      .catch(err => {
        console.log(err);
        res.status(500).send({
          message: `Error updating PBM. ${err}`
        });
      });
  } else {
    res.status(500).send({
      message: "Error updating PBM. "
    });
  }
}; // update

// Delete a PBM with the specified id in the request
exports.approveDeleteDraftById = async (req, res) => {
  const draft_id = req.params.id;
  var msgSent = false;

  console.log("Received approveDeleteDraftById:");
  console.log("id=", draft_id);
  console.log(req.body);

  // update draft table
  var Done = await PBM_Draft.update(  // update draft table status to "3"
  { 
    status            : 3,
    approverComments  : req.body.approvercomments,
  }, 
  { where:      { id: draft_id }},
  )
  .then(num => {
    if (num == 1) {

      // write to audit
      AuditTrail.create(
        { 
          action                : "PBM "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - deleted",
          name                  : req.body.name,
          tokenname             : req.body.tokenname, 
          description           : req.body.description, 
          blockchain            : req.body.blockchain,
        
          datafield1_name       : req.body.datafield1_name,
          datafield1_value      : req.body.datafield1_value,
          operator1             : req.body.operator1,
          datafield2_name       : req.body.datafield2_name,
          datafield2_value      : req.body.datafield2_value,

          PBMunderlyingTokenID  : req.body.underlyingTokenID,
          PBMunderlyingDSGDsmartcontractaddress  : req.body.underlyingDSGDsmartcontractaddress,    
          startdate             : req.body.startdate,
          enddate               : req.body.enddate,
          sponsor               : req.body.sponsor,
          amount                : req.body.amount,
          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

          draftpbmId            : draft_id,
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
        console.log("Data written to audittrail for pbm delete request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for pbm delete request: "+err.message);
      });
    
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

  if (Done) await PBM.destroy({ // delete entry in approved PBM table
    where: { id: req.body.approvedpbmid }
  })
  .then(num => {
    if (num == 1) {
      if (!msgSent) {
        console.log("Sending success pbm delete to client");
        res.send({
          message: "PBM was deleted successfully!"
        });
        msgSent = true;
      }
      return true;
    } else {
      if (!msgSent) {
        res.send({
          message: `Cannot delete PBM with id=${req.body.approvedpbmid}. Maybe PBM was not found!`
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
}; // approveDeleteDraftById

// Delete a WrapMint with the specified id in the request
exports.approveDeleteWrapMintDraftById = async (req, res) => {
  const draft_id = req.params.id;
  var msgSent = false;

  console.log("Received approveDeleteWrapMintDraftById:");
  console.log("id=",draft_id);
  console.log(req.body);

  // update draft table
  var Done = await PBM_Draft.update(  // update draft table status to "3"
  { 
    status            : 3,
    approverComments  : req.body.approvercomments,
  }, 
  { where:      { id: draft_id }},
  )
  .then(num => {
    if (num == 1) {

      // write to audit
      AuditTrail.create(
        { 
          action                : "Wrap Mint "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - deleted",
          underlyingTokenID     : req.body.underlyingTokenID,
          pbm_id                : req.body.pbm_id,
          blockchain            : req.body.blockchain,
          amount                : req.body.amount,
          txntype               : req.body.txntype,    // create
          maker                 : req.body.maker, 
          checker               : req.body.checker,
          approver              : req.body.approver,
          checkerComments       : req.body.checkerComments,
          approverComments      : req.body.approverComments,
          actionby              : req.body.actionby,
          status                : 3,   // 0 = draft; 1 = created pending review; 2 = reviewed pending approval; 3 = approved
        }, 
      )
      .then(auditres => {
        console.log("Data written to audittrail for wrapmint delete request:", auditres);
      })
      .catch(err => {
        console.log("Error while logging to audittrail for wrapmint delete request: "+err.message);
      });
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

  if (Done) await db.wrapmints.destroy({ // delete entry in approved PBM table
    where: { id: req.body.approvedpbmid }
  })
  .then(num => {
    if (num == 1) {
      if (!msgSent) {
        console.log("Sending success wrapmint delete to client");
        res.send({
          message: "WrapMint was deleted successfully!"
        });
        msgSent = true;
      }
      return true;
    } else {
      if (!msgSent) {
        res.send({
          message: `Cannot delete WrapMint with id=${req.body.approvedpbmid}. Maybe WrapMint was not found!`
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
}; // approveDeleteWrapMintDraftById

exports.dropRequestById = async (req, res) => {
  const draft_id = req.params.id;
  var msgSent = false;

  console.log("Received dropRequestById:");
  console.log("id=",req.params.id);
  console.log(req.body);

  // update draft table
  await PBM_Draft.update(  // update draft table status to "9" - aborted / dropped requests
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
          action                : "PBM "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - dropped",
          name                  : req.body.name,
          tokenname             : req.body.tokenname, 
          description           : req.body.description, 
          blockchain            : req.body.blockchain,
        
          datafield1_name       : req.body.datafield1_name,
          datafield1_value      : req.body.datafield1_value,
          operator1             : req.body.operator1,
          datafield2_name       : req.body.datafield2_name,
          datafield2_value      : req.body.datafield2_value,

          PBMunderlyingTokenID  : req.body.underlyingTokenID,
          PBMunderlyingDSGDsmartcontractaddress  : req.body.underlyingDSGDsmartcontractaddress,    
          startdate             : req.body.startdate,
          enddate               : req.body.enddate,
          sponsor               : req.body.sponsor,
          amount                : req.body.amount,
          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

          draftpbmId            : draft_id,
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
        console.log("Data written to audittrail for dropping pbm request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for dropping pbm request: "+err.message);
      });
      
      if (!msgSent) {
        console.log("Sending success pbm request dropped to client");
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
}; // dropRequestById

exports.dropWrapMintRequestById = async (req, res) => {  /// xxxx not ready
  const draft_id = req.params.id;
  var msgSent = false;

  console.log("Received dropWrapMintRequestById:");
  console.log("id=",req.params.id);
  console.log(req.body);

  // update draft table
  await PBM_Draft.update(  // update draft table status to "9" - aborted / dropped requests
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
          action                : "PBM "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - dropped",
          name                  : req.body.name,
          tokenname             : req.body.tokenname, 
          description           : req.body.description, 
          blockchain            : req.body.blockchain,
        
          datafield1_name       : req.body.datafield1_name,
          datafield1_value      : req.body.datafield1_value,
          operator1             : req.body.operator1,
          datafield2_name       : req.body.datafield2_name,
          datafield2_value      : req.body.datafield2_value,

          PBMunderlyingTokenID  : req.body.underlyingTokenID,
          PBMunderlyingDSGDsmartcontractaddress  : req.body.underlyingDSGDsmartcontractaddress,    
          startdate             : req.body.startdate,
          enddate               : req.body.enddate,
          sponsor               : req.body.sponsor,
          amount                : req.body.amount,
          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

          draftpbmId            : draft_id,
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
        console.log("Data written to audittrail for dropping pbm request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for dropping pbm request: "+err.message);
      });
      
      if (!msgSent) {
        console.log("Sending success pbm request dropped to client");
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
}; // dropWrapMintRequestById

// Delete a PBM with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  console.log(req.body.actionby);

  PBM.destroy({
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "PBM was deleted successfully!"
        });
      } else {
        res.send({
          message: `Cannot delete PBM with id=${id}. Maybe PBM was not found!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Could not delete PBM with id=" + id
      });
    });
}; // delete

// Delete all PBM from the database.
exports.deleteAll = (req, res) => {
  PBM.destroy({
    where: {},
    truncate: false
  })
    .then(nums => {
      res.send({ message: `${nums} PBM were deleted successfully!` });
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while removing all pbm."
      });
    });
}; // deleteAll


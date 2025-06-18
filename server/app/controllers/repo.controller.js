const db = require("../models");
const AuditTrail = db.audittrail;
const Repo = db.repos;
const Repo_Draft = db.repos_draft;
const Op = db.Sequelize.Op;
var newcontractaddress = null;
const adjustdecimals = 18;

function createStringWithZeros(num) { return ("0".repeat(num)); }

// Create and Save a new Repo draft
exports.draftCreate = async (req, res) => {
  // Validate request
  if (!req.body.name) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }

  console.log("Received for Repo draft Create:");
  console.log(req.body);

  // Save Repo draft in the database
  await Repo_Draft.create(
    { 
      name                  : req.body.name,
      description           : req.body.description, 
      
      tradedate             : req.body.tradedate,
      startdatetime         : req.body.startdatetime, 
      enddatetime           : req.body.enddatetime, 
      bondisin              : req.body.bondisin,
      securityLB            : req.body.securityLB,
      nominal               : req.body.nominal,
      cleanprice            : req.body.cleanprice,
      dirtyprice            : req.body.dirtyprice,
      haircut               : req.body.haircut,
      startamount           : req.body.startamount,
      currency              : req.body.currency,
      reporate              : req.body.reporate,
      interestamount        : req.body.interestamount,

      counterpartyname      : req.body.counterpartyname,
      counterparty1         : req.body.counterparty1,
      counterparty2         : req.body.counterparty2,
      smartcontractaddress1 : req.body.smartcontractaddress1,
      smartcontractaddress2 : req.body.smartcontractaddress2,
      underlyingTokenID1    : req.body.underlyingTokenID1,
      underlyingTokenID2    : req.body.underlyingTokenID2,
      amount1               : req.body.amount1,
      amount2               : req.body.amount2,
      blockchain            : req.body.blockchain,

      txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

      maker                 : req.body.maker,
      checker               : req.body.checker,
      approver              : req.body.approver,
      actionby              : req.body.actionby,
      approvedrepoid         : req.body.approvedrepoid,
      status                : 1,   // 0 = draft; 1 = created pending review; 2 = reviewed pending approval; 3 = approved
      name_changed          : req.body.name_changed,
      description_changed   : req.body.description_changed,
      startdate_changed     : req.body.startdate_changed,
      enddate_changed       : req.body.enddate_changed,
      amount1_changed       : req.body.amount1_changed,
      amount2_changed       : req.body.amount2_changed,
      name_original         : req.body.name_original,
      description_original  : req.body.description_original,
      amount1_original      : req.body.amount1_original,
      amount2_original      : req.body.amount2_original,
      startdate_original    : req.body.startdate_original,
      enddate_original      : req.body.enddate_original,
    }, 
  )
  .then(data => {
    console.log("Repo_draft create:", data);
    // write to audit
    AuditTrail.create(
      { 
        action                : "Repo draft "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - created",
        name                  : req.body.name,
        description           : req.body.description, 
        
        tradedate             : req.body.tradedate,
        startdatetime         : req.body.startdatetime, 
        enddatetime           : req.body.enddatetime, 
        bondisin              : req.body.bondisin,
        securityLB            : req.body.securityLB,
        nominal               : req.body.nominal,
        cleanprice            : req.body.cleanprice,
        dirtyprice            : req.body.dirtyprice,
        haircut               : req.body.haircut,
        startamount           : req.body.startamount,
        currency              : req.body.currency,
        reporate              : req.body.reporate,
        interestamount        : req.body.interestamount,

        counterpartyname      : req.body.counterpartyname,
        counterparty1         : req.body.counterparty1,
        counterparty2         : req.body.counterparty2,
        smartcontractaddress1 : req.body.smartcontractaddress1,
        smartcontractaddress2 : req.body.smartcontractaddress2,
        underlyingTokenID1    : req.body.underlyingTokenID1,
        underlyingTokenID2    : req.body.underlyingTokenID2,
        amount1               : req.body.amount1,
        amount2               : req.body.amount2,
        blockchain            : req.body.blockchain,

        txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

        maker                 : req.body.maker,
        checker               : req.body.checker,
        approver              : req.body.approver,
        actionby              : req.body.actionby,
        repoid                 : req.body.approvedrepoid,
        status                : 1,   // 0 = draft; 1 = created pending review; 2 = reviewed pending approval; 3 = approved
      }, 
    )
    .then(auditres => {
      console.log("Data written to audittrail for creating draft repo request.");

    })
    .catch(err => {
      console.log("Error while logging to audittrail for creating draft repo request: "+err.message);
    });
  
    res.send(data);
  })
  .catch(err => {
    res.status(500).send({
      message:
        err.message || "Some error occurred while creating the Repo draft."
    });
    console.log("Error while creating repo draft: "+err.message);
  });
};  // draftCreate

exports.create_review = async (req, res) => {
  // Validate request
  if (!req.body.name) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }

  console.log("Received for Repo Review:");
  console.log(req.body);

  await Repo_Draft.update(
      { 
        checkerComments :   checkercomments,
        status:             2   // 0 = draft; 1 = created pending review; 2 = reviewed pending approval; 3 = approved
      }, 
      { where:      { id: id }},
      )
      .then(num => {
        if (num == 1) {
          res.send({
            message: "Repo status has been updated successfully."
          });
        } else {
          res.send({
            message: `${req.body}. Record updated =${num}. Cannot update Repo with id=${id}. Maybe Repo was not found or req.body is empty!`
          });
        }
      })
      .catch(err => {
        console.log(err);
        res.status(500).send({
          message: `Error updating Repo. ${err}`
        });
      }); 
}; // create_review

exports.approveDraftById = async (req, res) => {  // 
  // Steps:
  // 1. Is this a new Repo creation or Edit? If approvedrepoid === '-1' then it is a new creation
  // 2. If new repo creation:
  //   a. Check if smart contract is compiled (ABI and ByteCode files are present)
  //   b. Sign smart contract
  //   c. Deploy smart contract
  //   d. Update Repo_Draft table status to "3"
  //   e. Insert entry in Repo table
  // 3. If edit existing repo:
  //   a. Update smart contract info such as total supply or date
  //   b. Update Repo_Draft table status to "3"
  //   c. Update entry in Repo table

  var errorSent = false;

  // Validate request
  if (!req.body.name) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }
  
  const draft_id = req.params.id;

  if (req.body.txntype !==0     // create repo
    && req.body.txntype !==1    // update repo
    ) {
      res.status(400).send({
        message: "Invalid transaction type!"
      });
      return;  
  }
  const isNewRepo = (req.body.smartcontractaddress === "" || req.body.smartcontractaddress === null? true : false); // Create = true, Edit/Update = false

  console.log("Received approveDraftById for Create/Update:");
  console.log(req.body);
  console.log("IsNewRepo? ", isNewRepo);

////////////////////////////// Blockchain ////////////////////////

  require('dotenv').config();
  const ETHEREUM_NETWORK = (() => {switch (req.body.blockchain) {
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

  async function compileSmartContract() {
    // solc compiler
    solc = require("solc");

    // file reader
    fs = require("fs");

    console.log("Reading smart contract file... ");

    // Reading the file
    file = fs.readFileSync("./server/app/contracts/ERCTokenRepo.sol").toString();
    // console.log(file);

    // input structure for solidity compiler
    var input = {
      language: "Solidity",
      sources: {
        "ERCTokenRepo.sol": {
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
    ABI = output.contracts["ERCTokenRepo.sol"]["ERCTokenREPO"].abi;
    bytecode = output.contracts["ERCTokenRepo.sol"]["ERCTokenREPO"].evm.bytecode.object;
    // console.log("solc.compile output: ", output);
    // console.log("ABI: ", ABI);
    // console.log("Bytecode: ", bytecode);
    await fs.writeFile("./server/app/abis/ERCTokenRepo.abi.json", JSON.stringify(ABI) , 'utf8', function (err) {
      if (err) {
        console.log("An error occured while writing Repo ABI JSON Object to File.");
        return console.log(err);
      }
      console.log("Repo ABI JSON file has been saved.");
    });
    await fs.writeFile("./server/app/abis/ERCTokenRepo.bytecode.json", JSON.stringify(bytecode) , 'utf8', function (err) {
      if (err) {
        console.log("An error occured while writing Repo bytecode JSON Object to File.");
        return console.log(err);
      }
      console.log("Repo Bytecode JSON file has been saved.");
    });

  }

  async function dAppCreate() {  // create and deploy new smart contract
    var errorSent = false;
    updatestatus = false;

    fs = require("fs");

    try {
      if (! (fs.existsSync("./server/app/abis/ERCTokenRepo.abi.json") && fs.existsSync("./server/app/abis/ERCTokenRepo.bytecode.json"))) {
        console.log("Compiling smart contract...");
        await compileSmartContract();
      } else{
        // Just read the ABI file
        console.log("Repo ABI and Bytecode files are present, just read them, no need to recompile...");
        console.log("Read Repo ABI JSON file.");
        ABI = JSON.parse(fs.readFileSync("./server/app/abis/ERCTokenRepo.abi.json").toString());
        console.log("Read Repo Bytecode JSON file.");
        bytecode = JSON.parse(fs.readFileSync("./server/app/abis/ERCTokenRepo.bytecode.json").toString());
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
    console.log("req.body = ", req.body);

    console.log("Startdate (unix time) = ", Number(new Date(req.body.startdate)));
    console.log("Enddate   (unix time) = ", Number(new Date(req.body.enddate)));
    try {
//      const this_amount1 = req.body.amount1 * 1e18;
//      const this_amount2 = req.body.amount2 * 1e18;
//const this_amount1 = web3.utils.toWei(req.body.amount1, "ether"); // returns string
//const this_amount2 = web3.utils.toWei(req.body.amount2, "ether"); // returns string

const BN = require('bn.js');
const this_amount1 = new BN(req.body.amount1).mul(new BN("1000000000000000000")); 
const this_amount2 = new BN(req.body.amount2).mul(new BN("1000000000000000000")); 

      // Deploy contract
      const deployContract = async () => {
        console.log('Attempting to deploy from account:', signer.address);
        const ERCTokenRepocontract = new web3.eth.Contract(ABI);
        const contractTx = await ERCTokenRepocontract.deploy({
          data: bytecode,
          arguments:  [ 
            req.body.name, 
            req.body.counterparty1, 
            req.body.counterparty2, 
            req.body.smartcontractaddress1, 
            req.body.smartcontractaddress2, 
            this_amount1.toString(), 
            this_amount2.toString(), 
            Number(new Date(req.body.startdate)),
            Number(new Date(req.body.enddate))
          ],
        });

        // https://github.com/web3/web3.js/issues/1001
        web3.setProvider( new Web3.providers.HttpProvider(`https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`) );

        const createTransaction = await web3.eth.accounts.signTransaction(
          {
            from: signer.address,
            data: contractTx.encodeABI(),
            gas: 8700000, // 4700000,
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

  async function dAppUpdate() {  // update 
    var errorSent = false;
    updatestatus = false;

    // Readng ABI from JSON file
    fs = require("fs");
    ABI = JSON.parse(fs.readFileSync("./server/app/abis/ERCTokenRepo.abi.json").toString());

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
        console.log('Creating Repo contract with ABI');
        const ERCTokenRepocontract = new web3.eth.Contract(ABI);

        // https://github.com/web3/web3.js/issues/1001
        web3.setProvider( new Web3.providers.HttpProvider(`https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`) );
        
        let setToTalSupply = (isNaN(+req.body.amount)? req.body.amount: req.body.amount.toString())   
        + createStringWithZeros(adjustdecimals);  // pad zeros behind
        console.log("Repo setToTalSupply = ", setToTalSupply);

        console.log('**** Signing update txn('+CONTRACT_OWNER_WALLET+','+req.body.amount );
        const nonce = await web3.eth.getTransactionCount(CONTRACT_OWNER_WALLET, "latest") //get latest nonce
        const createTransaction = await web3.eth.accounts.signTransaction(
          { // Sign transaction to setTotalSupply in smart contract
            nonce: nonce,
            from: signer.address,
            to: req.body.smartcontractaddress,
            data: ERCTokenRepocontract.methods.updateTotalSupply(
                    web3.utils.toBN( setToTalSupply )
                  ).encodeABI(),
            gas: 8700000,  // 4700000,
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

        console.log('**** Repo Txn executed:', createReceipt);
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

  var ExecutionSucc = false;
  if (isNewRepo) {                       // new repo
    ExecutionSucc = await dAppCreate();
  } else {                              // update repo
    ExecutionSucc = await dAppUpdate(); 
  }
  console.log("Execution status:", ExecutionSucc);

  ////////////////////////////// Blockchain ////////////////////////

  console.log('New Repo Contract deployed updating DB: ', newcontractaddress);

  if (ExecutionSucc) {
  // update draft table
    await Repo_Draft.update(  // update draft table status to "3"
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
          action                : "Repo "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - approved",
          name                  : req.body.name,
          description           : req.body.description, 
          
          tradedate             : req.body.tradedate,
          startdatetime         : req.body.startdatetime, 
          enddatetime           : req.body.enddatetime, 
          bondisin              : req.body.bondisin,
          securityLB            : req.body.securityLB,
          nominal               : req.body.nominal,
          cleanprice            : req.body.cleanprice,
          dirtyprice            : req.body.dirtyprice,
          haircut               : req.body.haircut,
          startamount           : req.body.startamount,
          currency              : req.body.currency,
          reporate              : req.body.reporate,
          interestamount        : req.body.interestamount,

          counterpartyname      : req.body.counterpartyname,
          counterparty1         : req.body.counterparty1,
          counterparty2         : req.body.counterparty2,
          smartcontractaddress1 : req.body.smartcontractaddress1,
          smartcontractaddress2 : req.body.smartcontractaddress2,
          underlyingTokenID1    : req.body.underlyingTokenID1,
          underlyingTokenID2    : req.body.underlyingTokenID2,
          amount1               : req.body.amount1,
          amount2               : req.body.amount2,
          blockchain            : req.body.blockchain,

          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete
    
          smartcontractaddress  : (isNewRepo? newcontractaddress : req.body.smartcontractaddress),
    
          draftrepoId            : draft_id,
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
        console.log("Data written to audittrail for approving repo request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for approving repo request: "+err.message);
      });


      } else {
        res.send({
          message: `${req.body}. Record updated =${num}. Cannot update Repo with id=${id}. Maybe Repo was not found or req.body is empty!`
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

    if (isNewRepo) {
      await Repo.create( // create Repo in the database !!!!!
        { 
          name                  : req.body.name,
          description           : req.body.description, 
          
          tradedate             : req.body.tradedate,
          startdatetime         : req.body.startdatetime, 
          enddatetime           : req.body.enddatetime, 
          bondisin              : req.body.bondisin,
          securityLB            : req.body.securityLB,
          nominal               : req.body.nominal,
          cleanprice            : req.body.cleanprice,
          dirtyprice            : req.body.dirtyprice,
          haircut               : req.body.haircut,
          startamount           : req.body.startamount,
          currency              : req.body.currency,
          reporate              : req.body.reporate,
          interestamount        : req.body.interestamount,

          counterpartyname      : req.body.counterpartyname,
          counterparty1         : req.body.counterparty1,
          counterparty2         : req.body.counterparty2,
          smartcontractaddress1 : req.body.smartcontractaddress1,
          smartcontractaddress2 : req.body.smartcontractaddress2,
          underlyingTokenID1    : req.body.underlyingTokenID1,
          underlyingTokenID2    : req.body.underlyingTokenID2,
          amount1               : req.body.amount1,
          amount2               : req.body.amount2,
          blockchain            : req.body.blockchain,

          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete
              
          actionby              : req.body.actionby,
          draftrepoid            : req.body.id,          
        }, 
      )
      .then(data => {
        console.log("Repo create success:", data);
        res.send(data);
      })
      .catch(err => {
        console.log("Error while creating repo: "+err.message);
        if (!errorSent) {
          console.log("Sending error 400 back to client");
          res.status(400).send({ 
            message: err.toString().replace('*', ''),
          });
          errorSent = true;
        }
        return false;
      });
    } else { // not isNewRepo
      await Repo.update( // update Repo in the database !!!!! 
      { 

        name                  : req.body.name,
        description           : req.body.description, 
        
        tradedate             : req.body.tradedate,
        startdatetime         : req.body.startdatetime, 
        enddatetime           : req.body.enddatetime, 
        bondisin              : req.body.bondisin,
        securityLB            : req.body.securityLB,
        nominal               : req.body.nominal,
        cleanprice            : req.body.cleanprice,
        dirtyprice            : req.body.dirtyprice,
        haircut               : req.body.haircut,
        startamount           : req.body.startamount,
        currency              : req.body.currency,
        reporate              : req.body.reporate,
        interestamount        : req.body.interestamount,

        counterpartyname      : req.body.counterpartyname,
        counterparty1         : req.body.counterparty1,
        counterparty2         : req.body.counterparty2,
        smartcontractaddress1 : req.body.smartcontractaddress1,
        smartcontractaddress2 : req.body.smartcontractaddress2,
        underlyingTokenID1    : req.body.underlyingTokenID1,
        underlyingTokenID2    : req.body.underlyingTokenID2,
        amount1               : req.body.amount1,
        amount2               : req.body.amount2,
        blockchain            : req.body.blockchain,

        txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

        actionby              : req.body.actionby,
        draftrepoid            : req.body.id,             
      }, 
      { where:      { id: req.body.approvedrepoid }},
      )
      .then(data => {
        console.log("Repo update success:", data);
        res.send(data);
      })
      .catch(err => {
        console.log("Error while updating repo: "+err.message);
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
  } // ExecutionSucc
}; // approveDraftById

exports.executeRepoById = async (req, res) => {  // 
  // Steps:
  // 1. Is this a new Repo creation or Edit? If approvedrepoid === '-1' then it is a new creation
  // 2. If new repo creation:
  //   a. Check if smart contract is compiled (ABI and ByteCode files are present)
  //   b. Sign smart contract
  //   c. Deploy smart contract
  //   d. Update Repo_Draft table status to "3"
  //   e. Insert entry in Repo table
  // 3. If edit existing repo:
  //   a. Update smart contract info such as total supply or date
  //   b. Update Repo_Draft table status to "3"
  //   c. Update entry in Repo table

  var errorSent = false;

  // Validate request
  if (req.body.smartcontractaddress === "" || req.body.smartcontractaddress === null) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }
  
  const draft_id = req.params.id;

  console.log("Received executeRepoById :");
  console.log(req.body);

////////////////////////////// Blockchain ////////////////////////

  require('dotenv').config();
  const ETHEREUM_NETWORK = (() => {switch (req.body.blockchain) {
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

  async function repoExec() {  // create and deploy new smart contract
    var errorSent = false;
    updatestatus = false;

    fs = require("fs");

    try { // read the ABI file
      
      console.log("Repo ABI and Bytecode files are present, just read them, no need to recompile...");
      console.log("Read Repo ABI JSON file.");
      ABI = JSON.parse(fs.readFileSync("./server/app/abis/ERCTokenRepo.abi.json").toString());
      console.log("Read Repo Bytecode JSON file.");
      bytecode = JSON.parse(fs.readFileSync("./server/app/abis/ERCTokenRepo.bytecode.json").toString());
    } catch(err) {
      console.error("Err7 while reading ABI and Bytecode files: ",err)
      if (!errorSent) {
        console.log("Sending error 400 back to client");
        res.status(400).send({ 
          message: err
        });
        errorSent = true;
      }
      return false;
    } // try read the ABI file
    
    // Creation of Web3 class
    Web3 = require("web3");
/*
    // Setting up a HttpProvider
    web3 = new Web3( 
      Web3.providers.HttpProvider(
        `https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`
      ) 
    );
    //console.log("web3: =========>", web3);
*/
    console.log("!!! Signer:", SIGNER_PRIVATE_KEY.substring(0,4)+"..." + SIGNER_PRIVATE_KEY.slice(-3));
    // Creating a signing account from a private key
//    const signer = web3.eth.accounts.privateKeyToAccount(SIGNER_PRIVATE_KEY)
    // console.log("signer:", signer);  // contains private key
    console.log("req.body = ", req.body);

    console.log("Startdate (unix time) = ", Number(new Date(req.body.startdate)));
    console.log("Enddate   (unix time) = ", Number(new Date(req.body.enddate)));

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

    try {  // try 3z createInstance and exec
      const RepocontractInstance = createInstance(ABI, req.body.smartcontractaddress);   // executing using PBMcontractowner's private key
      console.log("executeRepo()...");

      var url = "https://"+ (() => {
        switch (req.body.blockchain) {
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
          to: req.body.smartcontractaddress,
          // gas fees for the transaction
          gas: 9700000, //8700000,  // 2100000,
          // this encodes the ABI of the method and the arguments
          data: await RepocontractInstance.contractz.methods
            .executeTrade()
            .encodeABI(),
        };
        console.log("Create executeTrade() txn data: ", tx.data);
                  
        // sign the transaction with a private key. It'll return messageHash, v, r, s, rawTransaction, transactionHash
        const signPromise = await RepocontractInstance.web3BSC.eth.accounts.signTransaction(
            tx,
            SIGNER_PRIVATE_KEY,
          );
        console.log("Create signPromise: ", signPromise);

        // the rawTransaction here is already serialized so you don't need to serialize it again
        // Send the signed txn
        var url1;
        try { // 6c sendSignedTransaction
          const sendTxn = await RepocontractInstance.web3BSC.eth.sendSignedTransaction(
              signPromise.rawTransaction,
              (error1c, hash) => {
                url1 = url + hash;
                console.log("url = "+ url1);
                if (error1c) {
                    console.log("Something went wrong when submitting your signed transaction:", error1c)
                } else {
                    console.log("Signed Txn sent!, hash: ", hash);
                    var timer = 1;
                    // retry every second to chk for receipt
                    const interval = setInterval(() => {
                        console.log("Attempting to get transaction receipt...");

                        // https://ethereum.stackexchange.com/questions/67232/how-to-wait-until-transaction-is-confirmed-web3-js
                        RepocontractInstance.web3BSC.eth.getTransactionReceipt(hash, (error3, receipt) => {
                          if (receipt) {
                            clearInterval(interval);

                            console.log('--> RECEIPT received <--');  
                            console.log('Receipt: ', receipt);

                            if (receipt.status && !errorSent) { //  === true
                              res.send({
                                message: "executeTrade() successful. "
                              });
                              errorSent = true;
                            } else {
                              res.status(400).send({ 
                                message: "Transaction failed, please check "+url1+" for the error.",
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
          console.log("Transaction failed, please check "+url1+" for the error.");

          if (!errorSent) {
            res.status(400).send({ 
              message: "Transaction failed, please check "+url1+" for the error.",
            });
            errorSent = true;
          }

          return false;
        } // try 6c

      } // exec_approve

      return(await exec_approve());

    } catch(ee) { // try 3z
      console.log("Error:", ee)
    } // try 3z createInstance and exec

  } //repoExec

  var ExecutionSucc = false;
  ExecutionSucc = await repoExec();
  console.log("Execution status:", ExecutionSucc);

  ////////////////////////////// Blockchain ////////////////////////

  if (ExecutionSucc) {

        // write to audit
        AuditTrail.create(
          { 
            action                : "Repo Execute - success",

            name                  : req.body.name,
            description           : req.body.description, 
            
            tradedate             : req.body.tradedate,
            startdatetime         : req.body.startdatetime, 
            enddatetime           : req.body.enddatetime, 
            bondisin              : req.body.bondisin,
            securityLB            : req.body.securityLB,
            nominal               : req.body.nominal,
            cleanprice            : req.body.cleanprice,
            dirtyprice            : req.body.dirtyprice,
            haircut               : req.body.haircut,
            startamount           : req.body.startamount,
            currency              : req.body.currency,
            reporate              : req.body.reporate,
            interestamount        : req.body.interestamount,

            counterpartyname      : req.body.counterpartyname,
            counterparty1         : req.body.counterparty1,
            counterparty2         : req.body.counterparty2,
            smartcontractaddress1 : req.body.smartcontractaddress1,
            smartcontractaddress2 : req.body.smartcontractaddress2,
            underlyingTokenID1    : req.body.underlyingTokenID1,
            underlyingTokenID2    : req.body.underlyingTokenID2,
            amount1               : req.body.amount1,
            amount2               : req.body.amount2,
            blockchain            : req.body.blockchain,


            smartcontractaddress  : req.body.smartcontractaddress,
      
            actionby              : req.body.actionby,
            status                : 4,   // 0 = draft; 1 = created pending review; 2 = reviewed pending approval; 3 = approved
          }, 
        )
        .then(auditres => {
          console.log("Data written to audittrail for executing repo request:", auditres);

        })
        .catch(err => {
          console.log("Error while logging to audittrail for executing repo request: "+err.message);
        });

  } // ExecutionSucc
}; // executeRepoById

exports.findDraftByNameExact = (req, res) => {
  const name = req.query.name;
  var condition = name ? { 
    name: name, 
    status : [-1, 0, 1, 2]  // status -1=rejected, 0, drafted not submitted, 1=submitted for checker, 2=submitted for approver, 3=approved
  } : null;

  Repo_Draft.findAll(
    { where: condition },
    )
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving repo1 draft: "+err.message);

      res.status(400).send({
        message:
          err.message || "Some error occurred while retrieving repo draft."
      });
    });
}; // findDraftByNameExact

exports.findDraftByApprovedId = (req, res) => {
  const id = req.query.id;
  var condition = id ? { 
    approvedrepoid: id, 
    status : [-1, 0, 1, 2]  // status -1=rejected, 0, drafted not submitted, 1=submitted for checker, 2=submitted for approver, 3=approved
  } : null;

  Repo_Draft.findAll(
    { where: condition },
    )
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving repo1 draft: "+err.message);

      res.status(400).send({
        message:
          err.message || "Some error occurred while retrieving repo draft."
      });
    });
}; // findDraftByApprovedId

exports.findExact = (req, res) => {
  const name = req.query.name;
  var condition = name ? { name: name } : null;

  Repo.findAll(
    { where: condition },
    )
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving repo1: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving repo."
      });
    });
}; // findExact

exports.getInWalletMintedTotalSupply = (req, res) => {
  
  // get token address from RepoId
  const Id = req.query.id;
  var condition = Id ? { id: Id } : null;

  //console.log("++++++++++++++Received data:", req)
  
  Repo.findAll(
  { 
    where: { id : Id },
  })
  .then(async data => {

    //console.log("Qery result fo DATA:", data[0].id);

    /// Query blockchain
    // Readng ABI from JSON file
    fs = require("fs");
    ABI = JSON.parse(fs.readFileSync("./server/app/abis/ERCTokenRepo.abi.json").toString());  // <-- dropdown menu

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
    console.log("Error while retreiving repo2: "+err.message);

    res.status(500).send({
      message:
        err.message || "Some error occurred while retrieving repo."
    });
  });
}; // getInWalletMintedTotalSupply

// Retrieve all Repo from the database.
exports.findByName = (req, res) => {
  const name = req.query.name;
  var condition = name ? { name: { [Op.like]: `%${name}%` } } : null;

  Repo.findAll(
    { include: db.recipients,
      where: condition
    },
    )
    .then(data => {
      console.log("Repo.findByName:", data)
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving repo3: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving repo."
      });
    });
}; // findByName

// Retrieve all Repo from the database.
exports.getAll = (req, res) => {
  const name = req.query.name;
  var condition = name ? { name: { [Op.like]: `%${name}%` } } : null;

  Repo.findAll(
  {
    /*
    where: { 
      status : { 
        [Op.ne] : -9 
      }
    },
    */
    include: [
      {
        model: db.recipients,
        on: {
          id: db.Sequelize.where(db.Sequelize.col("repo.counterparty1"), "=", db.Sequelize.col("recipient.id")),
        },
        attributes: ['id','name'],
      },
      {
        model: db.campaigns,
        on: {
          id: db.Sequelize.where(db.Sequelize.col("repo.underlyingTokenID1"), "=", db.Sequelize.col("campaign.id")),
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
        err.message || "Some error occurred while retrieving repo."
    });
  });
}; // getAll

exports.getAllRepoDraftsByUserId = (req, res) => {
  const id = req.query.id;
  console.log("====== repo.getAllRepoDraftsByUserId(id) ",id);
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

  Repo_Draft.findAll( 
    { 
      where: condition,
      //include: db.recipients
      include: [
        {
          model: db.recipients,
          on: 
//          {
//            [Op.or]: 
//            [
//              {   id: db.Sequelize.where(db.Sequelize.col("repos_draft.counterparty1"), "=", db.Sequelize.col("recipient.id"))   },
              {   id: db.Sequelize.where(db.Sequelize.col("repos_draft.counterparty2"), "=", db.Sequelize.col("recipient.id"))   },
//            ]
//          },
          attributes: ['id','name'],
        },
        {
          model: db.campaigns,
          on: {
            id: db.Sequelize.where(db.Sequelize.col("repos_draft.underlyingTokenID1"), "=", db.Sequelize.col("campaign.id")),
          },
          attributes: ['id', 'name', 'tokenname', 'smartcontractaddress','blockchain'],
        }
      ]
    },
    )
    .then(data => {
      console.log("Repo_Draft.findAll:", data)
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving repo6: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving repo."
      });
    });
}; // getAllRepoDraftsByUserId

exports.getAllDraftsByRepoId = (req, res) => {
  const id = req.query.id;
  console.log("====== repo.getAllDraftsByRepoId(id) ",id);
  var condition = id ? 
       {id : id}
      : null;

  Repo_Draft.findAll(
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
            id: db.Sequelize.where(db.Sequelize.col("repos_draft.counterparty1"), "=", db.Sequelize.col("recipient.id")),
          },
          attributes: ['id','name'],
        },
        {
          model: db.campaigns,
          on: {
            id: db.Sequelize.where(db.Sequelize.col("repos_draft.underlyingTokenID1"), "=", db.Sequelize.col("campaign.id")),
          },
          attributes: ['id', 'name', 'tokenname', 'smartcontractaddress','blockchain'],
        }
      ]
    },
    )
    .then(data => {
      console.log("Repo_Draft.findAll:", data)
      if (data.length === 0) {
        console.log("Data is empyty!!!");
        res.status(500).send({
          message: "No such record in the system" 
        });
      } else
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving repo5: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving repo."
      });
    });
}; // getAllDraftsByRepoId

// Find a single Repo with an id
exports.findOne = (req, res) => {
  const id = req.query.id;
  console.log("====== repo.findOne(id) ",id);
  var condition = id ? 
       {id : id}
      : null;

  Repo.findAll(
    { 
/*
      where: condition
    },
    { include: db.recipients},
*/
      where: condition,
      //include: db.recipients
/*
      include: [
        {
          model: db.recipients,
          on: {
            id: db.Sequelize.where(db.Sequelize.col("repos.counterparty1"), "=", db.Sequelize.col("recipient.id")),
          },
          attributes: ['id','name'],
        },
        {
          model: db.campaigns,
          on: {
            id: db.Sequelize.where(db.Sequelize.col("repos.underlyingTokenID1"), "=", db.Sequelize.col("campaign.id")),
          },
          attributes: ['id', 'name', 'tokenname', 'smartcontractaddress','blockchain'],
        }
      ]
  */
    },
    )
    .then(data => {
      console.log("Repo_Draft.findAll:", data)
      if (data.length === 0) {
        console.log("Data is empyty!!!");
        res.status(500).send({
          message: "No such record in the system" 
        });
      } else
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving repo5: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving repo."
      });
    });
};

exports.submitDraftById = async (req, res) => {
  
  const id = req.params.id;
  const draft_id = req.params.id;

  console.log("Received1 submitDraftById:");
  console.log("id=", draft_id);
  console.log(req.body);

  await Repo_Draft.update(
  { 
    status                : 1,

    name                  : req.body.name,
    description           : req.body.description, 
    
    tradedate             : req.body.tradedate,
    startdatetime         : req.body.startdatetime, 
    enddatetime           : req.body.enddatetime, 
    bondisin              : req.body.bondisin,
    securityLB            : req.body.securityLB,
    nominal               : req.body.nominal,
    cleanprice            : req.body.cleanprice,
    dirtyprice            : req.body.dirtyprice,
    haircut               : req.body.haircut,
    startamount           : req.body.startamount,
    currency              : req.body.currency,
    reporate              : req.body.reporate,
    interestamount        : req.body.interestamount,

    counterpartyname      : req.body.counterpartyname,
    counterparty1         : req.body.counterparty1,
    counterparty2         : req.body.counterparty2,
    smartcontractaddress1 : req.body.smartcontractaddress1,
    smartcontractaddress2 : req.body.smartcontractaddress2,
    underlyingTokenID1    : req.body.underlyingTokenID1,
    underlyingTokenID2    : req.body.underlyingTokenID2,
    amount1               : req.body.amount1,
    amount2               : req.body.amount2,
    blockchain            : req.body.blockchain,

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
          action                : "Repo "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - resubmitted",

          name                  : req.body.name,
          description           : req.body.description, 
          
          tradedate             : req.body.tradedate,
          startdatetime         : req.body.startdatetime, 
          enddatetime           : req.body.enddatetime, 
          bondisin              : req.body.bondisin,
          securityLB            : req.body.securityLB,
          nominal               : req.body.nominal,
          cleanprice            : req.body.cleanprice,
          dirtyprice            : req.body.dirtyprice,
          haircut               : req.body.haircut,
          startamount           : req.body.startamount,
          currency              : req.body.currency,
          reporate              : req.body.reporate,
          interestamount        : req.body.interestamount,

          counterpartyname      : req.body.counterpartyname,
          counterparty1         : req.body.counterparty1,
          counterparty2         : req.body.counterparty2,
          smartcontractaddress1 : req.body.smartcontractaddress1,
          smartcontractaddress2 : req.body.smartcontractaddress2,
          underlyingTokenID1    : req.body.underlyingTokenID1,
          underlyingTokenID2    : req.body.underlyingTokenID2,
          amount1               : req.body.amount1,
          amount2               : req.body.amount2,
          blockchain            : req.body.blockchain,

          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete
    
          draftrepoId            : draft_id,
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
        console.log("Data written to audittrail for resubmitting repo request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for resubmitting repo request: "+err.message);
      });
      
      res.send({
        message: "Repo resubmitted successfully."
      });
    } else {
      res.send({
        message: `${req.body}. Record updated =${num}. Cannot update Repo with id=${draft_id}. Maybe Repo was not found or req.body is empty!`
      });
    }
  })
  .catch(err => {
    console.log(err);
    res.status(500).send({
      message: `Error updating Repo. ${err}`
    });
  });
}; // submitDraftById

exports.acceptDraftById = async (req, res) => {
  
  const id = req.params.id;
  const draft_id = req.params.id;

  console.log("Received2 acceptDraftById:");
  console.log("id=", draft_id);
  console.log(req.body);

  await Repo_Draft.update(
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
          action                : "Repo "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - accepted",

          name                  : req.body.name,
          description           : req.body.description, 
          
          tradedate             : req.body.tradedate,
          startdatetime         : req.body.startdatetime, 
          enddatetime           : req.body.enddatetime, 
          bondisin              : req.body.bondisin,
          securityLB            : req.body.securityLB,
          nominal               : req.body.nominal,
          cleanprice            : req.body.cleanprice,
          dirtyprice            : req.body.dirtyprice,
          haircut               : req.body.haircut,
          startamount           : req.body.startamount,
          currency              : req.body.currency,
          reporate              : req.body.reporate,
          interestamount        : req.body.interestamount,

          counterpartyname      : req.body.counterpartyname,
          counterparty1         : req.body.counterparty1,
          counterparty2         : req.body.counterparty2,
          smartcontractaddress1 : req.body.smartcontractaddress1,
          smartcontractaddress2 : req.body.smartcontractaddress2,
          underlyingTokenID1    : req.body.underlyingTokenID1,
          underlyingTokenID2    : req.body.underlyingTokenID2,
          amount1               : req.body.amount1,
          amount2               : req.body.amount2,
          blockchain            : req.body.blockchain,

          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete
    
          draftrepoId            : draft_id,
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
        console.log("Data written to audittrail for accepting repo request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for accepting repo request: "+err.message);
      });
      
      res.send({
        message: "Repo was accepted successfully."
      });
    } else {
      res.send({
        message: `${req.body}. Record updated =${num}. Cannot update Repo with id=${draft_id}. Maybe Repo was not found or req.body is empty!`
      });
    }
  })
  .catch(err => {
    console.log(err);
    res.status(500).send({
      message: `Error updating Repo. ${err}`
    });
  });
}; // acceptDraftById

exports.rejectDraftById = async (req, res) => {
  
  const id = req.params.id;
  const draft_id = req.params.id;

  console.log("Received2 rejectDraftById:");
  console.log("id=", draft_id);
  console.log(req.body);

  await Repo_Draft.update(
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
          action                : "Repo "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - rejected",

          name                  : req.body.name,
          description           : req.body.description, 
          
          tradedate             : req.body.tradedate,
          startdatetime         : req.body.startdatetime, 
          enddatetime           : req.body.enddatetime, 
          bondisin              : req.body.bondisin,
          securityLB            : req.body.securityLB,
          nominal               : req.body.nominal,
          cleanprice            : req.body.cleanprice,
          dirtyprice            : req.body.dirtyprice,
          haircut               : req.body.haircut,
          startamount           : req.body.startamount,
          currency              : req.body.currency,
          reporate              : req.body.reporate,
          interestamount        : req.body.interestamount,

          counterpartyname      : req.body.counterpartyname,
          counterparty1         : req.body.counterparty1,
          counterparty2         : req.body.counterparty2,
          smartcontractaddress1 : req.body.smartcontractaddress1,
          smartcontractaddress2 : req.body.smartcontractaddress2,
          underlyingTokenID1    : req.body.underlyingTokenID1,
          underlyingTokenID2    : req.body.underlyingTokenID2,
          amount1               : req.body.amount1,
          amount2               : req.body.amount2,
          blockchain            : req.body.blockchain,

          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete
    
          draftrepoId            : draft_id,
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
        console.log("Data written to audittrail for rejecting repo request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for rejecting repo request: "+err.message);
      });
      
      res.send({
        message: "Repo was rejected."
      });
    } else {
      res.send({
        message: `${req.body}. Record updated =${num}. Cannot reject Repo with id=${draft_id}. Maybe Repo was not found or req.body is empty!`
      });
    }
  })
  .catch(err => {
    console.log(err);
    res.status(500).send({
      message: `Error rejecting Repo. ${err}`
    });
  });
}; // rejectDraftById

// Update a Repo by the id in the request
exports.update = async (req, res) => {
  
  const id = req.params.id;
  const draft_id = req.params.id;

  console.log("Received3:");
  console.log("id=",id);
  console.log(req.body);

  ////////////////////////////// Blockchain ////////////////////////

  require('dotenv').config();
  const ETHEREUM_NETWORK = (() => {switch (req.body.blockchain) {
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
    ABI = JSON.parse(fs.readFileSync("./server/app/abis/ERCTokenRepo.abi.json").toString());

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
        const ERCTokenRepocontract = new web3.eth.Contract(ABI);

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
            data: ERCTokenRepocontract.methods.updateTotalSupply(
                    web3.utils.toBN( setToTalSupply )
                  ).encodeABI(),
            gas: 8700000,  // 4700000,
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
    await Repo.update(
      { 
          name                  : req.body.name,
          description           : req.body.description, 
          
          tradedate             : req.body.tradedate,
          startdatetime         : req.body.startdatetime, 
          enddatetime           : req.body.enddatetime, 
          bondisin              : req.body.bondisin,
          securityLB            : req.body.securityLB,
          nominal               : req.body.nominal,
          cleanprice            : req.body.cleanprice,
          dirtyprice            : req.body.dirtyprice,
          haircut               : req.body.haircut,
          startamount           : req.body.startamount,
          currency              : req.body.currency,
          reporate              : req.body.reporate,
          interestamount        : req.body.interestamount,

          counterpartyname      : req.body.counterpartyname,
          counterparty1         : req.body.counterparty1,
          counterparty2         : req.body.counterparty2,
          smartcontractaddress1 : req.body.smartcontractaddress1,
          smartcontractaddress2 : req.body.smartcontractaddress2,
          underlyingTokenID1    : req.body.underlyingTokenID1,
          underlyingTokenID2    : req.body.underlyingTokenID2,
          amount1               : req.body.amount1,
          amount2               : req.body.amount2,
          blockchain            : req.body.blockchain,

          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete
      }, 
      { where:      { id: draft_id }},
      )
      .then(num => {
        if (num == 1) {

          // write to audit
          AuditTrail.create(
            { 
              action                : "Repo "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" update request - approved",
            
              name                  : req.body.name,
              description           : req.body.description, 
              
              tradedate             : req.body.tradedate,
              startdatetime         : req.body.startdatetime, 
              enddatetime           : req.body.enddatetime, 
              bondisin              : req.body.bondisin,
              securityLB            : req.body.securityLB,
              nominal               : req.body.nominal,
              cleanprice            : req.body.cleanprice,
              dirtyprice            : req.body.dirtyprice,
              haircut               : req.body.haircut,
              startamount           : req.body.startamount,
              currency              : req.body.currency,
              reporate              : req.body.reporate,
              interestamount        : req.body.interestamount,

              counterpartyname      : req.body.counterpartyname,
              counterparty1         : req.body.counterparty1,
              counterparty2         : req.body.counterparty2,
              smartcontractaddress1 : req.body.smartcontractaddress1,
              smartcontractaddress2 : req.body.smartcontractaddress2,
              underlyingTokenID1    : req.body.underlyingTokenID1,
              underlyingTokenID2    : req.body.underlyingTokenID2,
              amount1               : req.body.amount1,
              amount2               : req.body.amount2,
              blockchain            : req.body.blockchain,

              txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

              draftrepoId            : draft_id,
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
            console.log("Data written to audittrail for approving repo update request:", auditres);

          })
          .catch(err => {
            console.log("Error while logging to audittrail for approving repo update request: "+err.message);
          });


          res.send({
            message: "Repo was updated successfully."
          });
        } else {
          res.send({
            message: `${req.body}. Record updated =${num}. Cannot update Repo with id=${id}. Maybe Repo was not found or req.body is empty!`
          });
        }
      })
      .catch(err => {
        console.log(err);
        res.status(500).send({
          message: `Error updating Repo. ${err}`
        });
      });
  } else {
    res.status(500).send({
      message: "Error updating Repo. "
    });
  }
}; // update

// Delete a Repo with the specified id in the request
exports.approveDeleteDraftById = async (req, res) => {
  const draft_id = req.params.id;
  var msgSent = false;

  console.log("Received approveDeleteDraftById:");
  console.log("id=", draft_id);
  console.log(req.body);

  // update draft table
  var Done = await Repo_Draft.update(  // update draft table status to "3"
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
          action                : "Repo "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - deleted",
          name                  : req.body.name,
          description           : req.body.description, 
          
          tradedate             : req.body.tradedate,
          startdatetime         : req.body.startdatetime, 
          enddatetime           : req.body.enddatetime, 
          bondisin              : req.body.bondisin,
          securityLB            : req.body.securityLB,
          nominal               : req.body.nominal,
          cleanprice            : req.body.cleanprice,
          dirtyprice            : req.body.dirtyprice,
          haircut               : req.body.haircut,
          startamount           : req.body.startamount,
          currency              : req.body.currency,
          reporate              : req.body.reporate,
          interestamount        : req.body.interestamount,

          counterpartyname      : req.body.counterpartyname,
          counterparty1         : req.body.counterparty1,
          counterparty2         : req.body.counterparty2,
          smartcontractaddress1 : req.body.smartcontractaddress1,
          smartcontractaddress2 : req.body.smartcontractaddress2,
          underlyingTokenID1    : req.body.underlyingTokenID1,
          underlyingTokenID2    : req.body.underlyingTokenID2,
          amount1               : req.body.amount1,
          amount2               : req.body.amount2,
          blockchain            : req.body.blockchain,

          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

          draftrepoId            : draft_id,
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
        console.log("Data written to audittrail for repo delete request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for repo delete request: "+err.message);
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

  if (Done) await Repo.destroy({ // delete entry in approved Repo table
    where: { id: req.body.approvedrepoid }
  })
  .then(num => {
    if (num == 1) {
      if (!msgSent) {
        console.log("Sending success repo delete to client");
        res.send({
          message: "Repo was deleted successfully!"
        });
        msgSent = true;
      }
      return true;
    } else {
      if (!msgSent) {
        res.send({
          message: `Cannot delete Repo with id=${req.body.approvedrepoid}. Maybe Repo was not found!`
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

exports.dropRequestById = async (req, res) => {
  const draft_id = req.params.id;
  var msgSent = false;

  console.log("Received dropRequestById:");
  console.log("id=",req.params.id);
  console.log(req.body);

  // update draft table
  await Repo_Draft.update(  // update draft table status to "9" - aborted / dropped requests
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
          action                : "Repo "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - dropped",

          name                  : req.body.name,
          description           : req.body.description, 
          
          tradedate             : req.body.tradedate,
          startdatetime         : req.body.startdatetime, 
          enddatetime           : req.body.enddatetime, 
          bondisin              : req.body.bondisin,
          securityLB            : req.body.securityLB,
          nominal               : req.body.nominal,
          cleanprice            : req.body.cleanprice,
          dirtyprice            : req.body.dirtyprice,
          haircut               : req.body.haircut,
          startamount           : req.body.startamount,
          currency              : req.body.currency,
          reporate              : req.body.reporate,
          interestamount        : req.body.interestamount,

          counterpartyname      : req.body.counterpartyname,
          counterparty1         : req.body.counterparty1,
          counterparty2         : req.body.counterparty2,
          smartcontractaddress1 : req.body.smartcontractaddress1,
          smartcontractaddress2 : req.body.smartcontractaddress2,
          underlyingTokenID1    : req.body.underlyingTokenID1,
          underlyingTokenID2    : req.body.underlyingTokenID2,
          amount1               : req.body.amount1,
          amount2               : req.body.amount2,
          blockchain            : req.body.blockchain,

          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete
    
          draftrepoId            : draft_id,
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
        console.log("Data written to audittrail for dropping repo request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for dropping repo request: "+err.message);
      });
      
      if (!msgSent) {
        console.log("Sending success repo request dropped to client");
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

// Delete a Repo with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  console.log(req.body.actionby);

  Repo.destroy({
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Repo was deleted successfully!"
        });
      } else {
        res.send({
          message: `Cannot delete Repo with id=${id}. Maybe Repo was not found!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Could not delete Repo with id=" + id
      });
    });
}; // delete

// Delete all Repo from the database.
exports.deleteAll = (req, res) => {
  Repo.destroy({
    where: {},
    truncate: false
  })
    .then(nums => {
      res.send({ message: `${nums} Repo were deleted successfully!` });
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while removing all repo."
      });
    });
}; // deleteAll

const db = require("../models");
const AuditTrail = db.audittrail;
const Recipients = db.recipients;
const Bond = db.bonds;
const Bond_Draft = db.bonds_draft;
const Op = db.Sequelize.Op;
var newcontractaddress = null;
const adjustdecimals = 18;
const TIMEOUT = 60;

function createStringWithZeros(num) { return ("0".repeat(num)); }

// Create and Save a new Bond draft
exports.draftCreate = async (req, res) => {
  // Validate request
  var errorSent = false;

  if (!req.body.name) {
    if (!errorSent) {
      res.status(400).send({
        message: "Content can not be empty!"
      });
      errorSent = true;
    }
    return;
  }

  console.log("Received for Bond draft Create:");
  console.log(req.body);

  // Save Bond draft in the database
  await Bond_Draft.create(
    { 
      name                  : req.body.name,
      securityname          : req.body.securityname, 
      ISIN                  : req.body.ISIN, 
      tokenname             : req.body.tokenname, 
      tokensymbol           : req.body.tokensymbol, 
      blockchain            : req.body.blockchain,

//      datafield1_name       : req.body.datafield1_name,
//      datafield1_name       : req.body.datafield1_name,
//      datafield1_value      : req.body.datafield1_value,
//      operator1             : req.body.operator1,
//      datafield2_name       : req.body.datafield2_name,
//      datafield2_value      : req.body.datafield2_value,

      smartcontractaddress  : req.body.smartcontractaddress,

      facevalue             : req.body.facevalue,
      couponrate            : req.body.couponrate,
      couponinterval        : req.body.couponinterval,
      
      cashTokenID           : req.body.cashTokenID,
      CashTokensmartcontractaddress  : req.body.CashTokensmartcontractaddress,
      issuedate             : req.body.issuedate, 
      maturitydate          : req.body.maturitydate, 
      issuer                : req.body.issuer, 
      totalsupply           : req.body.totalsupply,
      prospectusurl         : req.body.prospectusurl, // new

      txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete
      maker                 : req.body.maker,
      checker               : req.body.checker,
      approver              : req.body.approver,
      actionby              : req.body.actionby,
      approvedbondid        : req.body.approvedbondid,
      status                : 1,   // 0 = draft; 1 = created pending review; 2 = reviewed pending approval; 3 = approved
      name_changed          : req.body.name_changed,
      ISIN_changed          : req.body.ISIN_changed,
      facevalue_changed     : req.body.facevalue_changed,
      couponrate_changed    : req.body.couponrate_changed,
      couponinterval_changed: req.body.couponinterval_changed,
      issuedate_changed     : req.body.issuedate_changed,
      maturitydate_changed  : req.body.maturitydate_changed,
      issuer_changed        : req.body.issuer_changed,
      totalsupply_changed   : req.body.totalsupply_changed,
      name_original         : req.body.name_original,
      ISIN_original         : req.body.ISIN_original,
      issuedate_original    : req.body.issuedate_original,
      maturitydate_original : req.body.maturitydate_original,
      issuer_original       : req.body.issuer_original,
      totalsupply_original  : req.body.totalsupply_original,
    }, 
  )
  .then(data => {
    console.log("Bond_draft create:", data);
    // write to audit
    AuditTrail.create(
      { 
        action                : "Bond draft "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - created",
        name                  : req.body.name,
        securityname          : req.body.securityname, 
        ISIN                  : req.body.ISIN, 
        tokenname             : req.body.tokenname, 
        tokensymbol           : req.body.tokensymbol, 
        blockchain            : req.body.blockchain,

//        datafield1_name       : req.body.datafield1_name,
//        datafield1_name       : req.body.datafield1_name,
//        datafield1_value      : req.body.datafield1_value,
//        operator1             : req.body.operator1,
//        datafield2_name       : req.body.datafield2_name,
//        datafield2_value      : req.body.datafield2_value,  

        smartcontractaddress  : req.body.smartcontractaddress,
        facevalue             : req.body.facevalue,
        couponrate            : req.body.couponrate,
        couponinterval        : req.body.couponinterval,
        cashTokenID           : req.body.cashTokenID,
        CashTokensmartcontractaddress  : req.body.CashTokensmartcontractaddress,  
        startdate             : req.body.startdate, 
        enddate               : req.body.enddate, 
        issuer                : req.body.issuer, 
        totalsupply           : req.body.totalsupply,
        prospectusurl         : req.body.prospectusurl, // new

        txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

        maker                 : req.body.maker,
        checker               : req.body.checker,
        approver              : req.body.approver,
        actionby              : req.body.actionby,
        bondid                : req.body.approvedbondid,
        status                : 1,   // 0 = draft; 1 = created pending review; 2 = reviewed pending approval; 3 = approved
      }, 
    )
    .then(auditres => {
      console.log("Data written to audittrail for creating draft bond request.");

    })
    .catch(err => {
      console.log("Error while logging to audittrail for creating draft bond request: "+err.message);
    });
  
    res.send(data);
  })
  .catch(err => {
    res.status(500).send({
      message:
        err.message || "Some error occurred while creating the Bond draft."
    });
    console.log("Error while creating bond draft: "+err.message);
  });
};  // draftCreate

exports.create_review = async (req, res) => {
  // Validate request

  var errorSent = false;

  if (!req.body.name) {
    if (!errorSent) {
      res.status(400).send({
        message: "Content can not be empty!"
      });
      errorSent = true;
    }
    return;
  }

  console.log("Received for Bond Review:");
  console.log(req.body);

  await Bond_Draft.update(
      { 
        checkerComments :   checkercomments,
        status:             2   // 0 = draft; 1 = created pending review; 2 = reviewed pending approval; 3 = approved
      }, 
      { where:      { id: id }},
      )
      .then(num => {
        if (num == 1) {
          res.send({
            message: "Bond status has been updated successfully."
          });
        } else {
          res.send({
            message: `${req.body}. Record updated =${num}. Cannot update Bond with id=${id}. Maybe Bond was not found or req.body is empty!`
          });
        }
      })
      .catch(err => {
        console.log(err);
        res.status(500).send({
          message: `Error updating Bond. ${err}`
        });
      }); 
}; // create_review

exports.approveDraftById = async (req, res) => {  // 
  // Steps:
  // 1. Is this a new Bond creation or Edit? If approvedbondid === '-1' then it is a new creation
  // 2. If new bond creation:
  //   a. Check if smart contract is compiled (ABI and ByteCode files are present)
  //   b. Sign smart contract
  //   c. Deploy smart contract
  //   d. Update Bond_Draft table status to "3"
  //   e. Insert entry in Bond table
  // 3. If edit existing bond:
  //   a. Update smart contract info such as total supply or date
  //   b. Update Bond_Draft table status to "3"
  //   c. Update entry in Bond table

  var errorSent = false;
  var updatestatus = false;

  // Validate request
  if (!req.body.name) {
    if (!errorSent) {
      res.status(400).send({
        message: "Content can not be empty!"
      });
      errorSent = true;
    }
    return;
  }
  
  const draft_id = req.params.id;

  if (req.body.txntype !==0     // create bond
    && req.body.txntype !==1    // update bond
    ) {
      if (!errorSent) {
        res.status(400).send({
          message: "Invalid transaction type!"
        });
        errorSent = true;
      }
      return;  
  }
  const isNewBond = (req.body.smartcontractaddress === "" || req.body.smartcontractaddress === null? true : false); // Create = true, Edit/Update = false

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
//        file = fs.readFileSync("./server/app/contracts/ERC20TokenisedBond.sol").toString();
        file = fs.readFileSync("./server/app/contracts/ERC20Bond_new.sol").toString();
        // console.log(file);

        // input structure for solidity compiler
/*
        var input = {
          language: "Solidity",
          sources: {
//          "ERC20TokenisedBond.sol": {
            "ERC20Bond_new.sol": {
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
*/

        const input = {
            language: 'Solidity',
            sources: {
                'ERC20Bond_new.sol': {
                    content: file
                }
            },
            settings: {
                optimizer: {
                    enabled: true,
                    runs: 200 // Number of optimization runs
                },
                viaIR: true, // Enable Yul IR pipeline
                outputSelection: {
                    '*': {
                        '*': ['*']
                    }
                }
            }
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
//        ABI = output.contracts["ERC20TokenisedBond.sol"]["BondToken"].abi;
//        bytecode = output.contracts["ERC20TokenisedBond.sol"]["BondToken"].evm.bytecode.object;
        ABI = output.contracts["ERC20Bond_new.sol"]["BondToken"].abi;
        bytecode = output.contracts["ERC20Bond_new.sol"]["BondToken"].evm.bytecode.object;
        // console.log("solc.compile output: ", output);
        // console.log("ABI: ", ABI);
        // console.log("Bytecode: ", bytecode);

                
//        await fs.writeFile("./server/app/abis/ERC20TokenisedBond.abi.json", JSON.stringify(ABI) , 'utf8', function (err) {
        await fs.writeFile("./server/app/abis/ERC20Bond_new.abi.json", JSON.stringify(ABI) , 'utf8', function (err) {
          if (err) {
            console.log("An error occured while writing Bond ABI JSON Object to File.");
            return console.log(err);
          }
          console.log("Bond ABI JSON file has been saved.");
        });
//         await fs.writeFile("./server/app/abis/ERC20TokenisedBond.bytecode.json", JSON.stringify(bytecode) , 'utf8', function (err) {
        await fs.writeFile("./server/app/abis/ERC20Bond_new.bytecode.json", JSON.stringify(bytecode) , 'utf8', function (err) {
          if (err) {
            console.log("An error occured while writing Bond bytecode JSON Object to File.");
            return console.log(err);
          }
          console.log("Bond Bytecode JSON file has been saved.");
        });

      }

      async function dAppCreate() {
        updatestatus = false;

        fs = require("fs");

        try {
//          if (! (fs.existsSync("./server/app/abis/ERC20TokenisedBond.abi.json") && fs.existsSync("./server/app/abis/ERC20TokenisedBond.bytecode.json"))) {
            await compileSmartContract();
/*
          } else{
            // Just read the ABI file
            console.log("Bond ABI and Bytecode files are present, just read them, no need to recompile...");
            console.log("Read Bond ABI JSON file.");
            ABI = JSON.parse(fs.readFileSync("./server/app/abis/ERC20TokenisedBond.abi.json").toString());
            console.log("Read Bond Bytecode JSON file.");
            bytecode = JSON.parse(fs.readFileSync("./server/app/abis/ERC20TokenisedBond.bytecode.json").toString());
          }
*/
        } catch(err) {
          console.error("Err7: ",err)
          if (!errorSent) {
            console.log("Sending error 400 back to client");
            res.status(400).send({ 
              message: "Error when compiling Bond smart contract. Please contact your tech support."
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
        console.log("req.body.totalsupply = ", req.body.totalsupply);

//        let setToTalSupply = (isNaN(+req.body.totalsupply)? req.body.minttotalsupply: req.body.totalsupply.toString())   
//        + createStringWithZeros(adjustdecimals);  // pad zeros behind
//        console.log("setToTalSupply = ", setToTalSupply);

        // convert totalsupply to big number
        const BN = require('bn.js');
        const totalsupply = new BN(req.body.totalsupply).mul(new BN("1000000000000000000")); 

        web3.setProvider( new Web3.providers.HttpProvider(`https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`) );

        console.log("Maturitydate (unix time) = ", Number(new Date(req.body.maturitydate)));
        try {
          // Deploy contract
          const deployContract = async () => {
              console.log('Attempting to deploy from account:', signer.address);
              const ERC20TokenisedBondcontract = new web3.eth.Contract(ABI);

              console.log("Extracting issuer name from id...");
              // Fetch recipient to get issuer name
              const recipient = await Recipients.findByPk(req.body.issuerId || req.body.issuer);
              console.log('Recipient.findByPk issuer:', recipient);

              if (!recipient || !recipient.name) {
                  console.error('Error: No valid issuer found for ID:', req.body.issuerId || req.body.issuer);
                  res.status(400).send({
                      message: 'Invalid issuer ID or no issuer name found.',
                  });
                  return;
              }

              // Set issuer name in req.body
              //req.body.issuer = recipient.name;
              console.log('Updated req.body.issuer:', recipient.name);

                        // Validate inputs
              const requiredFields = {
                  tokenname: req.body.tokenname,
                  tokensymbol: req.body.tokensymbol,
                  securityname: req.body.securityname,
                  ISIN: req.body.ISIN,
                  facevalue: req.body.facevalue,
                  couponrate: req.body.couponrate,
                  couponinterval: req.body.couponinterval,
                  issuedate: req.body.issuedate,
                  maturitydate: req.body.maturitydate,
                  issuer: recipient.name,
                  CashTokensmartcontractaddress: req.body.CashTokensmartcontractaddress,
                  prospectusurl: req.body.prospectusurl,
                  totalsupply: req.body.totalsupply,
              };

              // Log all inputs for debugging
              console.log('Constructor inputs:', requiredFields);

              // Check for null or undefined values
              for (const [key, value] of Object.entries(requiredFields)) {
                  if (value === null || value === undefined) {
                      console.error(`Error: ${key} is ${value}`);
                      if (!errorSent) {
                          res.status(400).send({
                              message: `Invalid input: ${key} cannot be ${value}. Please provide a valid value.`,
                          });
                          errorSent = true;
                      }
                      return false;
                  }
              }

              // Validate string fields
              const stringFields = ['tokenname', 'tokensymbol', 'securityname', 'ISIN', 'issuer', 'prospectusurl'];
              for (const field of stringFields) {
                  if (typeof requiredFields[field] !== 'string' || requiredFields[field].trim() === '') {
                      console.error(`Error: ${field} is invalid: ${requiredFields[field]}`);
                      if (!errorSent) {
                          res.status(400).send({
                              message: `Invalid input: ${field} must be a non-empty string.`,
                          });
                          errorSent = true;
                      }
                      return false;
                  }
              }

              // Validate numeric fields
              const numericFields = ['facevalue', 'couponrate', 'couponinterval', 'totalsupply'];
              for (const field of numericFields) {
                  const value = Number(requiredFields[field]);
                  if (isNaN(value) || value <= 0) {
                      console.error(`Error: ${field} is invalid: ${requiredFields[field]}`);
                      if (!errorSent) {
                          res.status(400).send({
                              message: `Invalid input: ${field} must be a positive number.`,
                          });
                          errorSent = true;
                      }
                      return false;
                  }
              }

              // Validate address
              if (!web3.utils.isAddress(requiredFields.CashTokensmartcontractaddress)) {
                  console.error(`Error: Invalid CashTokensmartcontractaddress: ${requiredFields.CashTokensmartcontractaddress}`);
                  if (!errorSent) {
                      res.status(400).send({
                          message: 'Invalid input: CashTokensmartcontractaddress must be a valid Ethereum address.',
                      });
                      errorSent = true;
                  }
                  return false;
              }

              // Validate dates
              const issueDate = Number(new Date(req.body.issuedate));
              const maturityDate = Number(new Date(req.body.maturitydate));
              if (isNaN(issueDate) || isNaN(maturityDate) || maturityDate <= issueDate) {
                  console.error(`Error: Invalid dates - issueDate: ${req.body.issuedate}, maturityDate: ${req.body.maturitydate}`);
                  if (!errorSent) {
                      res.status(400).send({
                          message: 'Invalid input: Dates must be valid and maturity date must be after issue date.',
                      });
                      errorSent = true;
                  }
                  return false;
              }              

              // Structure BondConfig as an array
              const bondConfig = [
                  req.body.securityname,
                  req.body.ISIN,
                  req.body.facevalue,
                  req.body.couponrate,
                  req.body.couponinterval,
                  Number(new Date(req.body.issuedate)) / 1000,    // Convert to seconds from milliseconds
                  Number(new Date(req.body.maturitydate)) / 1000, // Convert to seconds from milliseconds
                  recipient.name,
                  totalsupply.toString(), // Ensure totalsupply is a string or number
                  req.body.CashTokensmartcontractaddress,
                  req.body.prospectusurl,
              ];

              console.log('BondConfig:', bondConfig);

              // Estimate gas fee
              const gasFees = await ERC20TokenisedBondcontract.deploy({
                  data: bytecode,
                  arguments: [
                      req.body.tokenname,
                      req.body.tokensymbol,
                      bondConfig,
                  ],
              })
              .estimateGas({
                  from: signer.address,
              })
              .then((gasAmount) => {
                  console.log("Estimated gas amount for signTransaction: ", gasAmount);
                  return gasAmount;
              })
              .catch((error2) => {
                  console.log("Error while estimating Gas fee: ", error2);
                  return 2100000; // Default gas limit
              });
              console.log("Estimated gas fee for transfer: ", gasFees);

              const contractTx = await ERC20TokenisedBondcontract.deploy({
                  data: bytecode,
                  arguments: [
                      req.body.tokenname,
                      req.body.tokensymbol,
                      bondConfig,
                  ],
              });

              const createTransaction = await web3.eth.accounts.signTransaction(
                  {
                      from: signer.address,
                      data: contractTx.encodeABI(),
                      gas: Math.floor(gasFees * 1.1), // Increase by 10%
                  },
                  signer.privateKey
              );
              console.log('Sending signed txn 1...');

              const createReceipt = await web3.eth.sendSignedTransaction(
                  createTransaction.rawTransaction,
                  function (error1, hash) {
                      if (error1) {
                          console.log("Error11a when submitting your signed transaction:", error1);
                          if (!errorSent) {
                              console.log("Sending error 400 back to client");
                              res.status(400).send({
                                  message: 'Error when signing transaction. Please try again. Report to tech support if problem is recurring.',
                              });
                              errorSent = true;
                          }
                          return false;
                      } else {
                          console.log("Txn sent!, hash: ", hash);
                          var timer = 1;
                          const interval = setInterval(function () {
                              console.log("Attempting A to get transaction receipt... (" + timer + ")");
                              web3.eth.getTransactionReceipt(hash, async function (error3, receipt) {
                                  if (receipt) {
                                      console.log('>> GOT RECEIPT!!!!!!!!!!!!!!!!!!!!!!!');
                                      clearInterval(interval);
                                      console.log('Receipt -->>: ', receipt);
                                      const trx = await web3.eth.getTransaction(hash);
                                      console.log('trx.status -->>: ', trx);
                                      return receipt.status;
                                  }
                                  if (error3) {
                                      console.log("!! getTransactionReceipt error (1): ", error3);
                                      clearInterval(interval);
                                      if (!errorSent) {
                                          console.log("Sending error 400 back to client");
                                          res.status(400).send({
                                              message: 'Error when signing transaction. Please try again. Report to tech support if problem is recurring.',
                                          });
                                          errorSent = true;
                                      }
                                      return false;
                                  }
                                  if (timer > TIMEOUT) {
                                      console.log("!! getTransactionReceipt error (1): timeout after " + TIMEOUT.toString() + " seconds");
                                      clearInterval(interval);
                                      if (!errorSent) {
                                          console.log("Sending error 400 back to client");
                                          res.status(400).send({
                                              message: "Timeout after " + TIMEOUT.toString() + " seconds, please check the Bond tab after 5 minutes and try again if the Bond isnt created.",
                                          });
                                          errorSent = true;
                                      }
                                      return false;
                                  }
                              });
                              timer++;
                          }, 1000);
                      }
                  }
              ).on("error", err => {
                  console.log("Err22 sentSignedTxn error: ", err);
                  if (!errorSent) {
                      console.log("Sending error 400 back to client");
                      res.status(400).send({
                          message: 'Error when signing transaction. Please try again. Report to tech support if problem is recurring.',
                      });
                      errorSent = true;
                  }
                  return false;
              });

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
              message: 'Error when signing transaction. Please try again. Report to tech support if problem is recurring.',
            });
            errorSent = true;
          }
          return false;
        }  // try catch


      } //dAppCreate

      async function dAppUpdate() {
        updatestatus = false;
    
        // Readng ABI from JSON file
        fs = require("fs");
//        ABI = JSON.parse(fs.readFileSync("./server/app/abis/ERC20TokenisedBond.abi.json").toString());
        ABI = JSON.parse(fs.readFileSync("./server/app/abis/ERC20Bond_new.abi.json").toString());
    
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
            console.log('Creating Bond contract with ABI');
            const ERC20TokenisedBondcontract = new web3.eth.Contract(ABI);
    
            // https://github.com/web3/web3.js/issues/1001
            web3.setProvider( new Web3.providers.HttpProvider(`https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`) );
            
            let setToTalSupply = (isNaN(+req.body.totalsupply)? req.body.totalsupply: req.body.totalsupply.toString())   
            + createStringWithZeros(adjustdecimals);  // pad zeros behind
            console.log("Bond setToTalSupply = ", setToTalSupply);
    
            console.log('**** Signing update txn('+CONTRACT_OWNER_WALLET+','+req.body.totalsupply );
            const nonce = await web3.eth.getTransactionCount(CONTRACT_OWNER_WALLET, "latest") //get latest nonce
            const createTransaction = await web3.eth.accounts.signTransaction(  
              { // Sign transaction to setTotalSupply in smart contract
                nonce: nonce,
                from: signer.address,
                to: req.body.smartcontractaddress,
                data: ERC20TokenisedBondcontract.methods.updateTotalSupply(
                        web3.utils.toBN( setToTalSupply )
                      ).encodeABI(),
                gas: 8700000, // 4700000,
              },
              SIGNER_PRIVATE_KEY
            ); // signTransaction
            console.log('**** Sending signed txn 2...');
            //console.log('Sending signed txn:', createTransaction);
    
            const createReceipt = await web3.eth.sendSignedTransaction(  // updating smart contract updateTotalSupply()
              createTransaction.rawTransaction, 
            
              function (error1, hash) {
                if (error1) {
                    console.log("Error111 submitting your signed transaction:", error1);
                    if (!errorSent) {
                      console.log("Sending error 400 back to client");
                      res.status(400).send({ 
                        message: 'Error when signing transaction. Please try again. Report to tech support if problem is recurring.',
                      });
                      errorSent = true;
                    }
                    return false;
            } else {
                  console.log("Txn sent!, hash: ", hash);
                  var timer = 1;
                  // retry every second to chk for receipt
                  const interval = setInterval(function() {
                    console.log("Attempting B to get transaction receipt... ("+timer+")");
    
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
                        console.log("!! getTransactionReceipt error (2): ", error3)
                        if (!errorSent) {
                          console.log("Sending error 400 back to client");
                          res.status(400).send({ 
                            message: 'Error when signing transaction. Please try again. Report to tech support if problem is recurring.',
                          });
                          errorSent = true;
                        }
                        clearInterval(interval);
                        return false;
                      }
                      if (timer > TIMEOUT) {
                        console.log("!! getTransactionReceipt error (2): timeout after "+TIMEOUT.toString()+" seconds");
                        clearInterval(interval);
                        if (!errorSent) {
                          console.log("Sending error 400 back to client");
                          res.status(400).send({ 
                            message: "Timeout after "+TIMEOUT.toString()+" seconds, please check the Bond tab after 5 minutes and try again if the Bond isnt created.",
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
                  console.log("sentSignedTxn error2: ", err)
                  if (!errorSent) {
                    console.log("Sending error 400 back to client");
                    res.status(400).send({ 
                      message: 'Error when signing transaction. Please try again. Report to tech support if problem is recurring.',
                    });
                    errorSent = true;
                  }
                  return false;
            // do something on transaction error
              }); // sendSignedTransaction
    
            console.log('**** Bond Txn executed:', createReceipt);
            return true;
          } catch(error) {
            console.log('Error4 encountered -->: ',error)   
            if (!errorSent) {
              console.log("Sending error 400 back to client");
              res.status(400).send({ 
                message: 'Error when signing transaction. Please try again. Report to tech support if problem is recurring.',
              });
              errorSent = true;
            }
            return false;
          } // try catch
    
        }; // UpdateContract()
    
        return ( await UpdateContract());
      } // dAppUpdate

      /*
      console.log("*** isNewBond = ", isNewBond);
      console.log("*** req.body.smartcontractaddress = ", req.body.smartcontractaddress);
      res.status(400).send({
        message: "ENDDD!"
      });
      return;
      */

      if (isNewBond) {   // new bond
        updatestatus = await dAppCreate();
      } else {                              // update bond
        updatestatus = await dAppUpdate(); 
      }
      console.log("approveDraftById Update status (1):", updatestatus);

////////////////////////////// Blockchain ////////////////////////


  console.log('New Bond Contract deployed updating DB: ', newcontractaddress);

  if (updatestatus) {
  // update draft table
    await Bond_Draft.update(  // update draft table status to "3"
    { 
      status            : 3,
      approverComments  : req.body.approvercomments,
    }, 
    { where:      { id: draft_id }},
    )
    .then(num => {
      if (num == 1) {


      } else {
        if (!errorSent) {
          res.send({
            message: `${req.body}. Record updated =${num}. Cannot update Bond with id=${id}. Maybe Bond was not found or req.body is empty!`
          });
          errorSent = true;
        }
      }
    })
    .catch(err => {
      console.log(err);
      if (!errorSent) {
        console.log("Sending error 400 back to client");
        res.status(400).send({ 
          message: 'Error when signing transaction. Please try again. Report to tech support if problem is recurring.',
        });
        errorSent = true;
      }
      return false;
    });

    if (isNewBond) {
      await Bond.create( // create Bond in the database !!!!!
        { 
          name                  : req.body.name,
          securityname          : req.body.securityname,
          ISIN                  : req.body.ISIN, 
          tokenname             : req.body.tokenname.toUpperCase(), 
          tokensymbol           : req.body.tokensymbol,
          blockchain            : req.body.blockchain,

//          datafield1_name       : req.body.datafield1_name,
//          datafield1_value      : req.body.datafield1_value,
//          operator1             : req.body.operator1,
//          datafield2_name       : req.body.datafield2_name,
//          datafield2_value      : req.body.datafield2_value,

          facevalue             : req.body.facevalue,
          couponrate            : req.body.couponrate,
          couponinterval        : req.body.couponinterval,

          issuedate             : req.body.issuedate, 
          maturitydate          : req.body.maturitydate, 
          issuer                : req.body.issuer, 
          smartcontractaddress  : newcontractaddress,
          cashTokenID           : req.body.cashTokenID,
          CashTokensmartcontractaddress  : req.body.CashTokensmartcontractaddress,    
          totalsupply           : req.body.totalsupply,
          prospectusurl         : req.body.prospectusurl, // new

          actionby              : req.body.actionby,
          draftbondid           : req.body.id,          
        }, 
      )
      .then(data => {
        console.log("Bond create success:", data);
        if (!errorSent) {
          res.send(data);
          errorSent = true;
        }
      })
      .catch(err => {
        console.log("Error while creating bond: "+err.message);
        if (!errorSent) {
          console.log("Sending error 400 back to client");
          res.status(400).send({ 
            message: 'Error when signing transaction. Please try again. Report to tech support if problem is recurring.',
          });
          errorSent = true;
        }
        return false;
      });
    } else { // not isNewBond
      await Bond.update( // update Bond in the database !!!!! 
      { 
        name                  : req.body.name,
        securityname          : req.body.securityname,
        ISIN                  : req.body.ISIN, 
        tokenname             : req.body.tokenname.toUpperCase(), 
        tokensymbol           : req.body.tokensymbol,
        blockchain            : req.body.blockchain,

//        datafield1_name       : req.body.datafield1_name,
//        datafield1_value      : req.body.datafield1_value,
//        operator1             : req.body.operator1,
//        datafield2_name       : req.body.datafield2_name,
//        datafield2_value      : req.body.datafield2_value,

        facevalue             : req.body.facevalue,
        couponrate            : req.body.couponrate,
        couponinterval        : req.body.couponinterval,

        cashTokenID           : req.body.cashTokenID,
        CashTokensmartcontractaddress  : req.body.CashTokensmartcontractaddress,  
        issuedate             : req.body.issuedate, 
        maturitydate          : req.body.maturitydate, 
        issuer                : req.body.issuer, 
        totalsupply           : req.body.totalsupply,
        prospectusurl         : req.body.prospectusurl, // new
        
        actionby              : req.body.actionby,
        draftbondid           : req.body.id,             
      }, 
      { where:      { id: req.body.approvedbondid }},
      )
      .then(data => {
        console.log("Bond update success:", data);
        if (!errorSent) {
          res.send(data);
          errorSent = true;
        }
      })
      .catch(err => {
        console.log("Error while updating bond: "+err.message);
        if (!errorSent) {
          console.log("Sending error 400 back to client");
          res.status(400).send({ 
            message: 'Error when signing transaction. Please try again. Report to tech support if problem is recurring.',
          });
          errorSent = true;
        }
        return false;
      });
    }
  } // updatestatus
}; // approveDraftById

exports.triggerBondCouponPaymentById = async (req, res) => {
  let errorSent = false;
  let updatestatus = false;

  const bond_id = req.params.id;
  const { lowestUnpaidCouponIndex, holders, amountsHeld } = req.body;

  console.log("Received triggerBondCouponPaymentById:");
  //console.log(req.body);
  console.log("triggerBondCouponPaymentById called with bond_id:", bond_id);
  console.log("Lowest Unpaid Coupon Index:", lowestUnpaidCouponIndex);
  console.log("Holder List:", holders);
  console.log("Amounts Held:", amountsHeld);
/*
  // Validate request
  if (bond_id === undefined || typeof bond_id !== "number" || bond_id <= 0 || typeof lowestUnpaidCouponIndex !== "number" || holders === undefined || !Array.isArray(holders) || holders.length === 0 || amountsHeld === undefined || !Array.isArray(amountsHeld) || amountsHeld.length === 0) {
    if (!errorSent) {
      res.status(400).send({
        message: "Invalid request: Missing bond ID, coupon index, holder list, or amounts held."
      });
      errorSent = true;
    }
    return;
  }
*/
  if (!Array.isArray(holders) || !Array.isArray(amountsHeld) || holders.length !== amountsHeld.length) {
    if (!errorSent) {
      res.status(400).send({
        message: "Invalid request: Holder list and amounts held must be arrays of equal length."
      });
      errorSent = true;
    }
    return;
  }

  // Fetch bond details
  let bond;
  try {
    bond = await Bond.findByPk(bond_id);
    if (!bond) {
      if (!errorSent) {
        res.status(404).send({
          message: `Bond with id=${bond_id} not found.`
        });
        errorSent = true;
      }
      return;
    }
  } catch (err) {
    console.error("Error fetching bond:", err.message);
    if (!errorSent) {
      res.status(500).send({
        message: "Error fetching bond details."
      });
      errorSent = true;
    }
    return;
  }

  // Blockchain interaction
  require('dotenv').config();
  const ETHEREUM_NETWORK = (() => {
    switch (Number(bond.blockchain)) {
      case 80001: return process.env.REACT_APP_POLYGON_MUMBAI_NETWORK;
      case 80002: return process.env.REACT_APP_POLYGON_AMOY_NETWORK;
      case 11155111: return process.env.REACT_APP_ETHEREUM_SEPOLIA_NETWORK;
      case 43113: return process.env.REACT_APP_AVALANCHE_FUJI_NETWORK;
      case 137: return process.env.REACT_APP_POLYGON_MAINNET_NETWORK;
      case 1: return process.env.REACT_APP_ETHEREUM_MAINNET_NETWORK;
      case 43114: return process.env.REACT_APP_AVALANCHE_MAINNET_NETWORK;
      default: return null;
    }
  })();

  if (!ETHEREUM_NETWORK) {
    if (!errorSent) {
      res.status(400).send({
        message: "Invalid blockchain network."
      });
      errorSent = true;
    }
    return;
  }

  const INFURA_API_KEY = process.env.REACT_APP_INFURA_API_KEY;
  const SIGNER_PRIVATE_KEY = process.env.REACT_APP_SIGNER_PRIVATE_KEY;
  const CONTRACT_OWNER_WALLET = process.env.REACT_APP_CONTRACT_OWNER_WALLET;

  async function triggerCoupon() {
    updatestatus = false;
    let ABI;

    // Load ABI
    const fs = require("fs");
    try {
      console.log("Reading Bond ABI JSON file.");
      ABI = JSON.parse(fs.readFileSync("./server/app/abis/ERC20Bond_new.abi.json").toString());
    } catch (err) {
      console.error("Err reading ABI:", err);
      if (!errorSent) {
        res.status(400).send({
          message: "Error reading bond smart contract ABI."
        });
        errorSent = true;
      }
      return false;
    }

    // Initialize Web3
    const Web3 = require("web3");
    const web3 = new Web3(new Web3.providers.HttpProvider(
      `https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`
    ));

    console.log("Signer:", SIGNER_PRIVATE_KEY.substring(0,4) + "..." + SIGNER_PRIVATE_KEY.slice(-3));
    const signer = web3.eth.accounts.privateKeyToAccount(SIGNER_PRIVATE_KEY);

    try {
      const payCoupon = async () => {
        console.log("Coupon Payment Inputs:", {
          holders,
          amountsHeld,
          //faceValue,
          //couponRate,
          //holderBalance: await bondContract.methods.balanceOf(holders[0]).call()
        });

        console.log("Bond smart contract address:", bond.smartcontractaddress);
        const bondContract = new web3.eth.Contract(ABI, bond.smartcontractaddress);
        const nonce = await web3.eth.getTransactionCount(CONTRACT_OWNER_WALLET, "latest");

        console.log('Attempting to pay coupon from account:', signer.address);

        // Estimate gas
        let gasFees = 2100000; // Default gas limit
        /*
        try {
          gasFees = await bondContract.methods.payCoupon(lowestUnpaidCouponIndex, holders, amountsHeld)
            .estimateGas({ from: signer.address });
          console.log("Estimated gas amount:", gasFees);
        } catch (error) {
          console.error("Error estimating gas:", error.message);
          let errMessage;
          if (error.message.includes("Coupon already paid")) {
            errMessage = "Coupon has already been paid for this index.";
          } else if (error.message.includes("Invalid coupon index")) {
            errMessage = "Invalid coupon index provided.";
          } else if (error.message.includes("Insufficient cash token balance")) {
            errMessage = "Insufficient cash tokens in the bond contract for coupon payment.";
          } else {
            errMessage = "Error estimating gas for coupon payment.";
          }
          if (!errorSent) {
            res.status(400).send({ message: errMessage });
            errorSent = true;
          }
          return false;
        }
        */
        // Prepare transaction
        const contractTx = bondContract.methods.payCoupon(lowestUnpaidCouponIndex, holders, amountsHeld);
        const createTransaction = await web3.eth.accounts.signTransaction(
          {
            nonce: nonce,
            from: signer.address,
            to: bond.smartcontractaddress,
            data: contractTx.encodeABI(),
            gas: Math.floor(gasFees * 1.2), // Increase by 20%
          },
          signer.privateKey
        );
        console.log('Sending signed transaction...');

        // Send transaction
        const createReceipt = await web3.eth.sendSignedTransaction(
          createTransaction.rawTransaction,
          function (error, hash) {
            if (error) {
              console.error("Error submitting transaction:", error);
              if (!errorSent) {
                res.status(400).send({
                  message: 'Error submitting transaction. Please try again.'
                });
                errorSent = true;
              }
              return false;
            } else {
              console.log("Transaction sent, hash:", hash);
              let timer = 1;
              const interval = setInterval(function () {
                console.log(`Attempting to get transaction receipt... (${timer})`);
                web3.eth.getTransactionReceipt(hash, async function (err, receipt) {
                  if (receipt) {
                    console.log('Receipt received:', receipt);
                    clearInterval(interval);
                    const trx = await web3.eth.getTransaction(hash);
                    console.log('Transaction status:', trx);
                    return receipt.status;
                  }
                  if (err) {
                    console.error("Error getting receipt:", err);
                    clearInterval(interval);
                    if (!errorSent) {
                      res.status(400).send({
                        message: 'Error retrieving transaction receipt.'
                      });
                      errorSent = true;
                    }
                    return false;
                  }
                  if (timer > TIMEOUT) {
                    console.error("Timeout after", TIMEOUT, "seconds");
                    clearInterval(interval);
                    if (!errorSent) {
                      res.status(400).send({
                        message: `Timeout after ${TIMEOUT} seconds. Please check status later.`
                      });
                      errorSent = true;
                    }
                    return false;
                  }
                  timer++;
                });
              }, 1000);
            }
          }
        ).on("error", err => {
          console.error("Transaction error:", err);
          if (!errorSent) {
            res.status(400).send({
              message: 'Error processing transaction. Please try again.'
            });
            errorSent = true;
          }
          return false;
        });

        console.log('Transaction executed:', createReceipt);
        if (!errorSent) {
          res.send({ message: "Coupon payment processed successfully." });
          errorSent = true;
        }
        return true;
      };

      return await payCoupon();
    } catch (err) {
      console.error("Error in triggerCoupon:", err);
      if (!errorSent) {
        res.status(400).send({
          message: 'Error processing coupon payment. Please try again.'
        });
        errorSent = true;
      }
      return false;
    }
  }

  updatestatus = await triggerCoupon();
  console.log("triggerBondCouponPaymentById Update status:", updatestatus);

  // Log to audit trail if successful
  if (updatestatus) {
    try {
      await AuditTrail.create({
        action: "Bond coupon payment",
        name: bond.name,
        securityname: bond.securityname,
        ISIN: bond.ISIN,
        tokenname: bond.tokenname?.toUpperCase(),
        tokensymbol: bond.tokensymbol,
        blockchain: bond.blockchain,
        facevalue: bond.facevalue,
        couponrate: bond.couponrate,
        couponinterval: bond.couponinterval,
        issuer: bond.issuer,
        totalsupply: bond.totalsupply,
        prospectusurl: bond.prospectusurl,
        smartcontractaddress: bond.smartcontractaddress,
        cashTokenID: bond.cashTokenID,
        CashTokensmartcontractaddress: bond.CashTokensmartcontractaddress,
        couponIndex: lowestUnpaidCouponIndex
      });
      console.log("Audit trail logged for bond coupon payment.");
    } catch (err) {
      console.error("Error logging to audit trail:", err.message);
    }
  }
}; // triggerBondCouponPaymentById

exports.findDraftByNameExact = (req, res) => {
  const name = req.query.name;
  var condition = name ? { 
    name: name, 
    status : [-1, 0, 1, 2]  // status -1=rejected, 0, drafted not submitted, 1=submitted for checker, 2=submitted for approver, 3=approved
  } : null;

  Bond_Draft.findAll(
    { where: condition },
    )
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving bond1 draft: "+err.message);

      res.status(400).send({
        message:
          err.message || "Some error occurred while retrieving bond draft."
      });
    });
}; // findDraftByNameExact

exports.findDraftByApprovedId = (req, res) => {
  const id = req.query.id;
  var condition = id ? { 
    approvedbondid: id, 
    status : [-1, 0, 1, 2]  // status -1=rejected, 0, drafted not submitted, 1=submitted for checker, 2=submitted for approver, 3=approved
  } : null;

  Bond_Draft.findAll(
    { where: condition },
    )
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving bond1 draft: "+err.message);

      res.status(400).send({
        message:
          err.message || "Some error occurred while retrieving bond draft."
      });
    });
}; // findDraftByApprovedId

exports.findExact = (req, res) => {
  const name = req.query.name;
  var condition = name ? { name: name } : null;

  Bond.findAll(
    { where: condition },
    )
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving bond1: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving bond."
      });
    });
}; // findExact

exports.getInWalletMintedTotalSupply = (req, res) => {
  
  // get token address from BondId
  const Id = req.query.id;
  var condition = Id ? { id: Id } : null;

  //console.log("++++++++++++++Received data:", req)
  
  Bond.findAll(
  { 
    where: { id : Id },
  })
  .then(async data => {

    //console.log("Qery result fo DATA:", data[0].id);

    /// Query blockchain
    // Readng ABI from JSON file
    fs = require("fs");
//     ABI = JSON.parse(fs.readFileSync("./server/app/abis/ERC20TokenisedBond.abi.json").toString());  // <-- dropdown menu
    ABI = JSON.parse(fs.readFileSync("./server/app/abis/ERC20Bond_new.abi.json").toString());  // <-- dropdown menu

    // Creation of Web3 class
    Web3 = require("web3");

    console.log("In Bond.findAll:  ", data);

    require('dotenv').config();
    const ETHEREUM_NETWORK = (() => {switch (data[0].blockchain) {
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
  
    var inWallet = 0;
    try {
      const _inWallet = await contract1.methods.balanceOf(CONTRACT_OWNER_WALLET).call(); 
      inWallet = await Web3Client.utils.fromWei(_inWallet)
      console.log("In Wallet: ", inWallet);
    } catch (err) {
      console.log("Error while retreiving inWallet: "+err.message);
    }

    var totalMinted = 0
    try {
      const _totalMinted = await contract1.methods._incirculation().call(); 
      totalMinted = await Web3Client.utils.fromWei(_totalMinted)
      console.log("total Minted: ", totalMinted);
    } catch (err) {
      console.log("Error while retreiving _incirculation: "+err.message);
    }

    var totalSupply = 0
    try {
      const _totalSupply = await contract1.methods.totalSupply().call(); 
      totalSupply = await Web3Client.utils.fromWei(_totalSupply) 
      console.log("total Supply: ", totalSupply);
    } catch (err) {
      console.log("Error while retreiving totalSupply: "+err.message);
    }  
  
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
    console.log("Error while retreiving bond2: "+err.message);

    res.status(500).send({
      message:
        err.message || "Some error occurred while retrieving bond."
    });
  });
}; // getInWalletMintedTotalSupply

// Retrieve all Bond from the database.
exports.findByName = (req, res) => {
  const name = req.query.name;
  var condition = name ? { name: { [Op.like]: `%${name}%` } } : null;

  Bond.findAll(
    { include: db.recipients,
      where: condition
    },
    )
    .then(data => {
      console.log("Bond.findByName:", data)
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving bond3: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving bond."
      });
    });
}; // findByName

exports.getAllByBondId = (req, res) => {
  const id = req.query.id;
  console.log("====== bond.getAllByBondId(id) ",id);
  var condition = id ? 
       {id : id}
      : null;

  Bond.findAll(
    { 
      where: condition,
      //include: db.recipients
      include: [
        {
          model: db.recipients,
          on: {
            id: db.Sequelize.where(db.Sequelize.col("bonds.issuer"), "=", db.Sequelize.col("recipient.id")),
          },
          attributes: ['id','name'],
        },
        {
          model: db.campaigns,
          on: {
            id: db.Sequelize.where(db.Sequelize.col("bonds.cashTokenID"), "=", db.Sequelize.col("campaign.id")),
          },
          attributes: ['id', 'name', 'tokenname', 'smartcontractaddress','blockchain'],
        }
      ]
    },
    )
    .then(data => {
      console.log("Bond.findAll:", data)
      if (data.length === 0) {
        console.log("Data is empyty!!!");
        res.status(500).send({
          message: "No such record in the system" 
        });
      } else
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving bond5a: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving bond."
      });
    });
}; // getAllByBondId

// Retrieve all Bond from the database.
exports.getAll = (req, res) => {
  const name = req.query.name;
  var condition = name ? { name: { [Op.like]: `%${name}%` } } : null;

  Bond.findAll(
  {
    include: [
      {
        model: db.recipients,
        on: {
          id: db.Sequelize.where(db.Sequelize.col("bond.issuer"), "=", db.Sequelize.col("recipient.id")),
        },
        attributes: ['id','name', 'walletaddress'],
      },
      {
        model: db.campaigns,
        on: {
          id: db.Sequelize.where(db.Sequelize.col("bond.cashTokenID"), "=", db.Sequelize.col("campaign.id")),
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
        err.message || "Some error occurred while retrieving bond."
    });
  }); // findAll
}; // getAll

exports.getAllDraftsByUserId = (req, res) => {
  const id = req.query.id;
  console.log("====== bond.getAllDraftsByUserId(id) ",id);
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

  Bond_Draft.findAll( 
    { 
      where: condition,
      //include: db.recipients
      include: [
        {
          model: db.recipients,
          on: {
            id: db.Sequelize.where(db.Sequelize.col("bonds_draft.issuer"), "=", db.Sequelize.col("recipient.id")),
          },
          attributes: ['id','name'],
        },
        {
          model: db.campaigns,
          on: {
            id: db.Sequelize.where(db.Sequelize.col("bonds_draft.cashTokenID"), "=", db.Sequelize.col("campaign.id")),
          },
          attributes: ['id', 'name', 'tokenname', 'smartcontractaddress','blockchain'],
        }
      ]
    },
    )
    .then(data => {
      console.log("Bond_Draft.findAll:", data)
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving bond6: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving bond."
      });
    });
}; // getAllDraftsByUserId

exports.getAllDraftsByBondId = (req, res) => {
  const id = req.query.id;
  console.log("====== bond.getAllDraftsByBondId(id) ",id);
  var condition = id ? 
       {id : id}
      : null;

  Bond_Draft.findAll(
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
            id: db.Sequelize.where(db.Sequelize.col("bonds_draft.issuer"), "=", db.Sequelize.col("recipient.id")),
          },
          attributes: ['id','name','walletaddress'],
        },
        {
          model: db.campaigns,
          on: {
            id: db.Sequelize.where(db.Sequelize.col("bonds_draft.cashTokenID"), "=", db.Sequelize.col("campaign.id")),
          },
          attributes: ['id', 'name', 'tokenname', 'smartcontractaddress','blockchain'],
        }
      ]
    },
    )
    .then(data => {
      console.log("Bond_Draft.findAll:", data)
      if (data.length === 0) {
        console.log("Data is empyty!!!");
        res.status(500).send({
          message: "No such record in the system" 
        });
      } else
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving bond5: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving bond."
      });
    });
/*
  Bond_Draft.findAll( 
    {
      include: [
        {
          model: db.recipients,
          on: {
            id: db.Sequelize.where(db.Sequelize.col("bond.issuer"), "=", db.Sequelize.col("recipient.id")),
          },
          attributes: ['id','name'],
        },
        {
          model: db.campaigns,
          on: {
            id: db.Sequelize.where(db.Sequelize.col("bond.cashTokenID"), "=", db.Sequelize.col("campaign.id")),
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
        err.message || "Some error occurred while retrieving bond."
    });
  });
  */
}; // getAllDraftsByBondId

// Find a single Bond with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  Bond.findByPk(id, {
    include: db.recipients,
    include: db.campaigns,
  })
    .then(data => {
      //console.log("Bond.findByPk:", data)
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({ 
          message: `Cannot find Bond with id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving Bond with id=" + id
      });
    });
}; // findOne

exports.getAllInvestorsById = (req, res) => {
  const id = req.query.id;
  console.log("In Bond.getAllInvestorsById: id=", id);
  let errorSent = false;

  Bond.findByPk(id, {
    include: [db.recipients, db.campaigns],
  })
  .then(async data => {
    if (!data) {
      res.status(404).send({ message: `Bond with id=${id} not found.` });
      return;
    }

    // Load ABI
    const fs = require("fs");
    let ABI;
    try {
      ABI = JSON.parse(fs.readFileSync("./server/app/abis/ERC20Bond_new.abi.json").toString());
      console.log("ABI loaded successfully.");
    } catch (err) {
      console.error("Error reading ABI:", err.message);
      res.status(500).send({ message: "Error reading bond contract ABI." });
      return;
    }

    // Initialize Web3
    const Web3 = require("web3");
    require('dotenv').config();
    console.log("Raw blockchain value:", data.blockchain, "Type:", typeof data.blockchain);

    const ETHEREUM_NETWORK = (() => {
      switch (Number(data.blockchain)) {
        case 80001: return process.env.REACT_APP_POLYGON_MUMBAI_NETWORK;
        case 80002: return process.env.REACT_APP_POLYGON_AMOY_NETWORK;
        case 11155111: return process.env.REACT_APP_ETHEREUM_SEPOLIA_NETWORK;
        case 43113: return process.env.REACT_APP_AVALANCHE_FUJI_NETWORK;
        case 137: return process.env.REACT_APP_POLYGON_MAINNET_NETWORK;
        case 1: return process.env.REACT_APP_ETHEREUM_MAINNET_NETWORK;
        case 43114: return process.env.REACT_APP_AVALANCHE_MAINNET_NETWORK;
        default: throw new Error(`Invalid blockchain ID: ${data.blockchain}`);
      }
    })();

    const INFURA_API_KEY = process.env.REACT_APP_INFURA_API_KEY;
    const ETHERSCAN_API_KEY = process.env.REACT_APP_ETHERSCAN_API_KEY;
    const providerUrl = `https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`;
    console.log("Provider URL:", providerUrl.replace(INFURA_API_KEY, "****"));

    let web3;
    try {
      web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));
      const blockNumber = await web3.eth.getBlockNumber();
      console.log("Connected to blockchain, current block:", blockNumber);
    } catch (err) {
      console.error("Provider initialization error:", err.message);
      res.status(500).send({ message: "Failed to initialize Web3 provider." });
      return;
    }

    const bondTokenAddr = data.smartcontractaddress;
    const bondContract = new web3.eth.Contract(ABI, bondTokenAddr);
    console.log("Querying token:", bondTokenAddr);

    let faceValue = 0;
    let couponRate = 0;
    let deploymentBlock = 0;
    let progress = 0;
    let holderList = [];
    let amountsHeld = [];
    let couponDates = [];
    let couponStatuses = [];
    let lowestUnpaidCouponIndex = null;

    const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000, shouldRetry = () => true) => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await fn();
        } catch (err) {
          if (!shouldRetry(err) || attempt === maxRetries) throw err;
          const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 100;
          await new Promise(resolve => setTimeout(resolve, delay));
          console.warn(`Retry attempt ${attempt} after ${delay}ms: ${err.message}`);
        }
      }
    };

    try {
      // Fetch bond config and deployment block
      const fetchConfigAndBlock = async () => {
        try {
          // Validate provider
          console.log('Provider:', web3.currentProvider);
          const isConnected = await web3.eth.net.isListening().catch(() => false);
          console.log('Provider connected:', isConnected);
          if (!isConnected) {
            console.log('Reinitializing provider...');
            web3.setProvider(new Web3.providers.HttpProvider(providerUrl));
          }

          // Fetch config
          console.log("Fetching config from contract...");
          const config = await retryWithBackoff(() => bondContract.methods.config().call());
          console.log("Config fetched:", config);
          faceValue = Number(config.faceValue) / 1e18; // Scale down by 10^18
          couponRate = Number(config.couponRate);  // in basis points

          // Dates are in seconds, convert to milliseconds for JavaScript Date
          const issueDate = Number(config.issueDate) * 1000; // Seconds to milliseconds
          const maturityDate = Number(config.maturityDate) * 1000;
          const couponInterval = Number(config.couponInterval) * 1000; // Seconds to milliseconds
          const couponCount = Number(await retryWithBackoff(() => bondContract.methods.couponCount().call()));
          console.log("couponCount:", couponCount);
          console.log("issueDate (seconds):", config.issueDate, "=>", new Date(issueDate).toISOString());
          console.log("maturityDate (seconds):", config.maturityDate, "=>", new Date(maturityDate).toISOString());
          console.log("couponInterval (seconds):", config.couponInterval);

          // Calculate coupon dates
          let currentCouponDate = issueDate + couponInterval; // First coupon date after issue date
          for (let i = 0; i < couponCount && currentCouponDate <= maturityDate; i++) {
            console.log(`Coupon ${i} date:`, new Date(currentCouponDate).toISOString());
            couponDates.push(new Date(currentCouponDate).toISOString());
            console.log(`Fetching status for coupon ${i}...`);
            const isPaid = await retryWithBackoff(() => bondContract.methods.isCouponPaid(i).call());
            couponStatuses.push({ couponIndex: i, date: new Date(currentCouponDate).toISOString(), paid: isPaid });
            if (!isPaid && (lowestUnpaidCouponIndex === null || i < lowestUnpaidCouponIndex)) {
              lowestUnpaidCouponIndex = i;
              console.log(`Lowest unpaid coupon index updated to: ${lowestUnpaidCouponIndex}`);
            }
            currentCouponDate += couponInterval;
          }

          // Fetch deployment block via Etherscan
          const fetchString = `https://api${ETHEREUM_NETWORK === 'mainnet' ? '' : '-' + ETHEREUM_NETWORK}.etherscan.io/api` +
            `?module=account&action=txlist&address=${bondTokenAddr}&startblock=0&sort=asc&apikey=${ETHERSCAN_API_KEY}`;
          console.log("Fetching deployment block from Etherscan:", fetchString);
          const response = await fetch(fetchString);
          const result = await response.json();

          if (result.status === '1' && result.result.length > 0) {
            deploymentBlock = Number(result.result[0].blockNumber);
            console.log(`Contract deployed at block ${deploymentBlock}`);
          } else {
            console.error("Etherscan API error:", result.message || "No transactions found.");
            throw new Error("Failed to fetch deployment block.");
          }
        } catch (err) {
          console.error("Config/Block fetch error:", err.message);
          throw err;
        }
      };
      await fetchConfigAndBlock();

      const blockNumber = await retryWithBackoff(() => web3.eth.getBlockNumber());
      const fromBlock = deploymentBlock;
      if (fromBlock > blockNumber) {
        throw new Error("Deployment block cannot be greater than current block.");
      }

      const step = 10000;
      let holders = {};
      const totalBlocks = blockNumber - fromBlock;
      let processedBlocks = 0;

      console.log(`Scanning blocks from ${fromBlock} to ${blockNumber} in steps of ${step}...`);

      for (let i = fromBlock; i <= blockNumber; i += step) {
        const toBlock = Math.min(i + step - 1, blockNumber);
        const events = await retryWithBackoff( () => bondContract.getPastEvents('Transfer', { fromBlock: i, toBlock }),
          3,
          1000,
          err => err.message.includes('Too Many Requests')
        );

        events.forEach(event => {
          const { from, to, value } = event.returnValues;
          const valueBN = new web3.utils.BN(value);

          if (from !== '0x0000000000000000000000000000000000000000') {
            holders[from] = holders[from] || new web3.utils.BN(0);
            holders[from] = holders[from].sub(valueBN);
            if (holders[from].isZero()) delete holders[from];
          }

          if (to !== '0x0000000000000000000000000000000000000000') {
            holders[to] = holders[to] || new web3.utils.BN(0);
            holders[to] = holders[to].add(valueBN);
          }
        });

        processedBlocks += toBlock - i + 1;
        progress = Math.round((processedBlocks / totalBlocks) * 100);
      }
      console.log("Holders after processing events:", holders);

      const holderAddresses = [];
      const holderBalances = [];

      for (const [address, balance] of Object.entries(holders)) {
        if (!balance.isZero()) {
          const isBlacklisted = await retryWithBackoff(() => bondContract.methods.isBlacklisted(address).call());
          if (!isBlacklisted) {
            const currentBalance = await retryWithBackoff(() => bondContract.methods.balanceOf(address).call());
            if (new web3.utils.BN(currentBalance).gt(new web3.utils.BN(0))) {
              holderAddresses.push(address);
              holderBalances.push(currentBalance);
            }
          }
        }
      }

      holderList = holderAddresses;
      amountsHeld = holderBalances;
      console.log(`Found ${holderAddresses.length} holders.`);

      res.send({ 
        holders: holderList, 
        balances: amountsHeld, 
        couponDates: couponStatuses,
        lowestUnpaidCouponIndex: lowestUnpaidCouponIndex
      });
    } catch (err) {
      console.error("Error scanning holders:", err.message);
      if (!errorSent) {
        res.status(400).send({ message: "Error retrieving bond holders. Please try again." });
        errorSent = true;
      }
    }
  })
  .catch(err => {
    console.error("Error retrieving bond:", err.message);
    if (!errorSent) {
      res.status(500).send({ message: "Error retrieving bond data." });
    }
  });
}; // getAllInvestorsById

exports.submitDraftById = async (req, res) => {  
  const id = req.params.id;
  const draft_id = req.params.id;

  console.log("Received1 submitDraftById:");
  console.log("id=", draft_id);
  console.log(req.body);

  await Bond_Draft.update(
  { 
    status                : 1,
    name                  : req.body.name,
    securityname          : req.body.securityname,
    ISIN                  : req.body.ISIN, 
    tokenname             : req.body.tokenname.toUpperCase(), 
    tokensymbol           : req.body.tokensymbol,
    blockchain            : req.body.blockchain,

//    datafield1_name       : req.body.datafield1_name,
//    datafield1_value      : req.body.datafield1_value,
//    operator1             : req.body.operator1,
//    datafield2_name       : req.body.datafield2_name,
//    datafield2_value      : req.body.datafield2_value,

    facevalue             : (typeof req.body.facevalue === 'string' || req.body.facevalue instanceof String)? parseInt(req.body.facevalue): req.body.facevalue,
    couponrate            : (typeof req.body.couponrate === 'string' || req.body.couponrate instanceof String)? parseInt(req.body.couponrate): req.body.couponrate,
    couponinterval        : (typeof req.body.couponinterval === 'string' || req.body.couponinterval instanceof String)? parseInt(req.body.couponinterval): req.body.couponinterval,

    issuedate             : req.body.issuedate, 
    maturitydate          : req.body.maturitydate, 
    smartcontractaddress  : req.body.smartcontractaddress,
    cashTokenID           : req.body.cashTokenID,
    CashTokensmartcontractaddress  : req.body.CashTokensmartcontractaddress,
    issuer                : (typeof req.body.issuer === 'string' || req.body.issuer instanceof String)? parseInt(req.body.issuer): req.body.issuer,
    totalsupply           : (typeof req.body.totalsupply === 'string' || req.body.totalsupply instanceof String)? parseInt(req.body.totalsupply): req.body.totalsupply,
    prospectusurl         : req.body.prospectusurl, // new

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
          action                : "Bond "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - resubmitted",
          name                  : req.body.name,
          securityname          : req.body.securityname,
          ISIN                  : req.body.ISIN, 
          tokenname             : req.body.tokenname.toUpperCase(), 
          tokensymbol           : req.body.tokensymbol,
          blockchain            : req.body.blockchain,

//          datafield1_name       : req.body.datafield1_name,
//          datafield1_value      : req.body.datafield1_value,
//          operator1             : req.body.operator1,
//          datafield2_name       : req.body.datafield2_name,
//          datafield2_value      : req.body.datafield2_value,

          facevalue             : req.body.facevalue,
          couponrate            : req.body.couponrate,
          couponinterval        : req.body.couponinterval,

          cashTokenID           : req.body.cashTokenID,
          CashTokensmartcontractaddress  : req.body.CashTokensmartcontractaddress,    
          startdate             : req.body.startdate,
          enddate               : req.body.enddate,
          issuer                : req.body.issuer,
          totalsupply           : req.body.totalsupply,
          prospectusurl         : req.body.prospectusurl, // new

          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

          draftbondId           : draft_id,
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
        console.log("Data written to audittrail for resubmitting bond request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for resubmitting bond request: "+err.message);
      });
      
      res.send({
        message: "Bond resubmitted successfully."
      });
    } else {
      res.send({
        message: `${req.body}. Record updated =${num}. Cannot update Bond with id=${draft_id}. Maybe Bond was not found or req.body is empty!`
      });
    }
  })
  .catch(err => {
    console.log(err);
    res.status(500).send({
      message: `Error updating Bond. ${err}`
    });
  });
}; // submitDraftById

exports.acceptDraftById = async (req, res) => {
  
  const id = req.params.id;
  const draft_id = req.params.id;

  console.log("Received2 acceptDraftById:");
  console.log("id=", draft_id);
  console.log(req.body);

  await Bond_Draft.update(
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
          action                : "Bond "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - accepted",
          name                  : req.body.name,
          securityname          : req.body.securityname,
          ISIN                  : req.body.ISIN, 
          tokenname             : req.body.tokenname.toUpperCase(), 
          tokensymbol           : req.body.tokensymbol,
          blockchain            : req.body.blockchain,

//          datafield1_name       : req.body.datafield1_name,
//          datafield1_value      : req.body.datafield1_value,
//          operator1             : req.body.operator1,
//          datafield2_name       : req.body.datafield2_name,
//          datafield2_value      : req.body.datafield2_value,

          facevalue             : req.body.facevalue,
          couponrate            : req.body.couponrate,
          couponinterval        : req.body.couponinterval,

          cashTokenID           : req.body.cashTokenID,
          CashTokensmartcontractaddress  : req.body.CashTokensmartcontractaddress,    
          startdate             : req.body.startdate,
          enddate               : req.body.enddate,
          issuer                : req.body.issuer,
          totalsupply           : req.body.totalsupply,
          prospectusurl         : req.body.prospectusurl, // new

          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

          draftbondId           : draft_id,
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
        console.log("Data written to audittrail for accepting bond request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for accepting bond request: "+err.message);
      });
      
      res.send({
        message: "Bond was accepted successfully."
      });
    } else {
      res.send({
        message: `${req.body}. Record updated =${num}. Cannot update Bond with id=${draft_id}. Maybe Bond was not found or req.body is empty!`
      });
    }
  })
  .catch(err => {
    console.log(err);
    res.status(500).send({
      message: `Error updating Bond. ${err}`
    });
  });
}; // acceptDraftById

exports.rejectDraftById = async (req, res) => {
  var errorSent = false;
  const id = req.params.id;
  const draft_id = req.params.id;

  console.log("Received2 rejectDraftById:");
  console.log("id=", draft_id);
  console.log(req.body);

  await Bond_Draft.update(
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
          action                : "Bond "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - rejected",
          name                  : req.body.name,
          securityname          : req.body.securityname,
          ISIN                  : req.body.ISIN, 
          tokenname             : req.body.tokenname.toUpperCase(), 
          tokensymbol           : req.body.tokensymbol,
          blockchain            : req.body.blockchain,
        
//          datafield1_name       : req.body.datafield1_name,
//          datafield1_value      : req.body.datafield1_value,
//          operator1             : req.body.operator1,
//          datafield2_name       : req.body.datafield2_name,
//          datafield2_value      : req.body.datafield2_value,

          facevalue             : req.body.facevalue,
          couponrate            : req.body.couponrate,
          couponinterval        : req.body.couponinterval,

          cashTokenID           : req.body.cashTokenID,
          CashTokensmartcontractaddress  : req.body.CashTokensmartcontractaddress,    
          startdate             : req.body.startdate,
          enddate               : req.body.enddate,
          issuer                : req.body.issuer,
          totalsupply           : req.body.totalsupply,
          prospectusurl         : req.body.prospectusurl, // new

          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

          draftbondId           : draft_id,
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
        console.log("Data written to audittrail for rejecting bond request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for rejecting bond request: "+err.message);
      });
      
      if (!errorSent) {
          res.send({
          message: "Bond was rejected."
        });
        errorSent = true;
      }
    } else {
      if (!errorSent) {
        res.send({
          message: `${req.body}. Record updated =${num}. Cannot reject Bond with id=${draft_id}. Maybe Bond was not found or req.body is empty!`
        });
        errorSent = true;
      }
    }
  })
  .catch(err => {
    console.log(err);
    if (!errorSent) {
      res.status(500).send({
        message: `Error rejecting Bond. ${err}`
      });
      errorSent = true;
    }
  });
}; // rejectDraftById

// Update a Bond by the id in the request
exports.update = async (req, res) => {
  var updatestatus = false;
  var errorSent = false;
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
//     ABI = JSON.parse(fs.readFileSync("./server/app/abis/ERC20TokenisedBond.abi.json").toString());  // <-- dropdown menu
    ABI = JSON.parse(fs.readFileSync("./server/app/abis/ERC20Bond_new.abi.json").toString());

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
        const ERC20TokenisedBondcontract = new web3.eth.Contract(ABI);

        // https://github.com/web3/web3.js/issues/1001
        web3.setProvider( new Web3.providers.HttpProvider(`https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`) );
        
        let setToTalSupply = (isNaN(+req.body.totalsupply)? req.body.totalsupply: req.body.totalsupply.toString())   
        + createStringWithZeros(adjustdecimals);  // pad zeros behind
        console.log("setToTalSupply = ", setToTalSupply);

        console.log('**** Signing update txn('+CONTRACT_OWNER_WALLET+','+req.body.totalsupply );
        const nonce = await web3.eth.getTransactionCount(CONTRACT_OWNER_WALLET, "latest") //get latest nonce
        const createTransaction = await web3.eth.accounts.signTransaction(
          { // Sign transaction to setTotalSupply in smart contract
            nonce: nonce,
            from: signer.address,
            to: req.body.smartcontractaddress,
            data: ERC20TokenisedBondcontract.methods.updateTotalSupply(
                    web3.utils.toBN( setToTalSupply )
                  ).encodeABI(),
            gas: 8700000,  // 4700000,
          },
          SIGNER_PRIVATE_KEY
        ); // signTransaction
        console.log('**** Sending signed txn 3...');
        //console.log('Sending signed txn:', createTransaction);

        const createReceipt = await web3.eth.sendSignedTransaction(  // updateTotalSupply()
          createTransaction.rawTransaction, 
        
          function (error1, hash) {
            if (error1) {
                console.log("Error1111 when submitting your signed transaction:", error1);
                if (!errorSent) {
                  res.status(400).send({ 
                    message: 'Error when signing transaction. Please try again. Report to tech support if problem is recurring.',
                  });
                  errorSent = true;
                }
            } else {
              console.log("Txn sent!, hash: ", hash);
              var timer = 1;
              // retry every second to chk for receipt
              const interval = setInterval(function() {
                console.log("Attempting E to get transaction receipt... ("+timer+")");

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
                    console.log("!! getTransactionReceipt error(6): ", error3)
                    clearInterval(interval);
                    return false;
                  }
                  if (timer > TIMEOUT) {
                    console.log("!! getTransactionReceipt error (6): timeout after "+TIMEOUT.toString()+" seconds");
                    clearInterval(interval);                      
                    console.log("Sending 22222 error 400 back to client");
                    if (!errorSent) {
                      res.status(400).send({ 
                        message: "Timeout after "+TIMEOUT.toString()+" seconds, please check the Bond tab after 5 minutes and try again if the Bond is not created.",
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
  console.log("exports.update Update status (3):", updatestatus);
  ////////////////////////////// Blockchain ////////////////////////

  if (updatestatus) {
    await Bond.update(
      { 
          name                  : req.body.name,
          securityname          : req.body.securityname,
          ISIN                  : req.body.ISIN, 
  // cant update token name once smart contract is deployed
  //    tokenname             : req.body.tokenname.toUpperCase(), 
  //    tokensymbol           : req.body.tokensymbol,
        blockchain            : req.body.blockchain,
      
//        datafield1_name       : req.body.datafield1_name,
//        datafield1_value      : req.body.datafield1_value,
//        operator1             : req.body.operator1,
//        datafield2_name       : req.body.datafield2_name,
//        datafield2_value      : req.body.datafield2_value,

        facevalue             : req.body.facevalue,
        couponrate            : req.body.couponrate,
        couponinterval        : req.body.couponinterval,

        cashTokenID           : req.body.cashTokenID,
        CashTokensmartcontractaddress  : req.body.CashTokensmartcontractaddress,  
        issuedate             : req.body.issuedate, 
        maturitydate          : req.body.maturitydate, 
        issuer                : req.body.issuer, 
        totalsupply           : req.body.totalsupply,
        prospectusurl         : req.body.prospectusurl, // new
      }, 
      { where:      { id: draft_id }},
      )
      .then(num => {
        if (num == 1) {

          // write to audit
          AuditTrail.create(
            { 
              action                : "Bond "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" update request - approved",
              name                  : req.body.name,
              securityname          : req.body.securityname, 
              ISIN                  : req.body.ISIN, 
              tokenname             : req.body.tokenname, 
              tokensymbol           : req.body.tokensymbol, 
              blockchain            : req.body.blockchain,
            
//              datafield1_name       : req.body.datafield1_name,
//              datafield1_value      : req.body.datafield1_value,
//              operator1             : req.body.operator1,
//              datafield2_name       : req.body.datafield2_name,
//              datafield2_value      : req.body.datafield2_value,
    
              facevalue             : req.body.facevalue,
              couponrate            : req.body.couponrate,
              couponinterval        : req.body.couponinterval,

              cashTokenID           : req.body.cashTokenID,
              CashTokensmartcontractaddress  : req.body.CashTokensmartcontractaddress,
        
              startdate             : req.body.startdate,
              enddate               : req.body.enddate,
              issuer                : req.body.issuer,
              totalsupply           : req.body.totalsupply,
              prospectusurl         : req.body.prospectusurl, // new

              txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

              draftbondId           : draft_id,
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
            console.log("Data written to audittrail for approving bond update request:", auditres);

          })
          .catch(err => {
            console.log("Error while logging to audittrail for approving bond update request: "+err.message);
          });

          if (!errorSent) {
            res.send({
              message: "Bond was updated successfully."
            });
            errorSent = true;
          }
        } else {
          if (!errorSent) {
            res.send({
              message: `${req.body}. Record updated =${num}. Cannot update Bond with id=${id}. Maybe Bond was not found or req.body is empty!`
            });
            errorSent = true;
          }
        }
      })
      .catch(err => {
        console.log(err);
        if (!errorSent) {
          res.status(500).send({
            message: `Error updating Bond. ${err}`
          });
          errorSent = true;
        }
      });
  } else {
    if (!errorSent) {
      res.status(500).send({
        message: "Error updating Bond. "
      });
      errorSent = true;
    }
  }
}; // update

// Delete a Bond with the specified id in the request
exports.approveDeleteDraftById = async (req, res) => {
  const draft_id = req.params.id;
  var msgSent = false;

  console.log("Received approveDeleteDraftById:");
  console.log("id=", draft_id);
  console.log(req.body);

  // update draft table
  var Done = await Bond_Draft.update(  // update draft table status to "3"
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
          action                : "Bond "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - deleted",
          name                  : req.body.name,
          securityname          : req.body.securityname, 
          ISIN                  : req.body.ISIN, 
          tokenname             : req.body.tokenname, 
          tokensymbol           : req.body.tokensymbol, 
          blockchain            : req.body.blockchain,
        
//          datafield1_name       : req.body.datafield1_name,
//          datafield1_value      : req.body.datafield1_value,
//          operator1             : req.body.operator1,
//          datafield2_name       : req.body.datafield2_name,
//          datafield2_value      : req.body.datafield2_value,

          facevalue             : req.body.facevalue,
          couponrate            : req.body.couponrate,
          couponinterval        : req.body.couponinterval,

          cashTokenID           : req.body.cashTokenID,
          CashTokensmartcontractaddress  : req.body.CashTokensmartcontractaddress,    
          startdate             : req.body.startdate,
          enddate               : req.body.enddate,
          issuer                : req.body.issuer,
          totalsupply           : req.body.totalsupply,
          prospectusurl         : req.body.prospectusurl, // new

          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

          draftbondId           : draft_id,
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
        console.log("Data written to audittrail for bond delete request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for bond delete request: "+err.message);
      });
    
    }
    return true;
  })
  .catch(err => {
    console.log(err);
    if (!msgSent) {
      console.log("Sending error 400 back to client");
      res.status(400).send({ 
        message: 'Error when updating database, please inform tech support.',
      });
      msgSent = true;
    }
    return false;
  });

  if (Done) await Bond.destroy({ // delete entry in approved Bond table
    where: { id: req.body.approvedbondid }
  })
  .then(num => {
    if (num == 1) {
      if (!msgSent) {
        console.log("Sending success bond delete to client");
        res.send({
          message: "Bond was deleted successfully!"
        });
        msgSent = true;
      }
      return true;
    } else {
      if (!msgSent) {
        res.send({
          message: `Cannot delete Bond with id=${req.body.approvedbondid}. Maybe Bond was not found!`
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
        message: 'Error when deleting Bond from database, please inform tech support.',
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
  await Bond_Draft.update(  // update draft table status to "9" - aborted / dropped requests
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
          action                : "Bond "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - dropped",
          name                  : req.body.name,
          securityname          : req.body.securityname, 
          ISIN                  : req.body.ISIN, 
          tokenname             : req.body.tokenname, 
          tokensymbol           : req.body.tokensymbol, 
          blockchain            : req.body.blockchain,
        
//          datafield1_name       : req.body.datafield1_name,
//          datafield1_value      : req.body.datafield1_value,
//          operator1             : req.body.operator1,
//          datafield2_name       : req.body.datafield2_name,
//          datafield2_value      : req.body.datafield2_value,

          facevalue             : req.body.facevalue,
          couponrate            : req.body.couponrate,
          couponinterval        : req.body.couponinterval,

          cashTokenID           : req.body.cashTokenID,
          CashTokensmartcontractaddress  : req.body.CashTokensmartcontractaddress,    
          startdate             : req.body.startdate,
          enddate               : req.body.enddate,
          issuer                : req.body.issuer,
          totalsupply           : req.body.totalsupply,
          prospectusurl         : req.body.prospectusurl, // new

          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

          draftbondId           : draft_id,
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
        console.log("Data written to audittrail for dropping bond request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for dropping bond request: "+err.message);
      });
      
      if (!msgSent) {
        console.log("Sending success bond request dropped to client");
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
        message: "Error when dropping request, please try again.",
      });
      msgSent = true;
    }
    return false;
  });  
}; // dropRequestById

// Delete a Bond with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;
  var errorSent = false;

  console.log(req.body.actionby);

  Bond.destroy({
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        if (!errorSent) {
          res.send({
            message: "Bond was deleted successfully!"
          });
          errorSent = true;
        }
      } else {
        if (!errorSent) {
          res.send({
            message: `Cannot delete Bond with id=${id}. Maybe Bond was not found!`
          });
          errorSent = true;
        }
      }
    })
    .catch(err => {
      if (!errorSent) {
        res.status(500).send({
          message: "Could not delete Bond with id=" + id
        });
        errorSent = true;
      }
    });
}; // delete

// Delete all Bond from the database.
exports.deleteAll = (req, res) => {
  var errorSent = false;

  Bond.destroy({
    where: {},
    truncate: false
  })
    .then(nums => {
      res.send({ message: `${nums} Bond were deleted successfully!` });
    })
    .catch(err => {
      if (!errorSent) {
        res.status(500).send({
          message:
            err.message || "Some error occurred while removing all bond."
        });
        errorSent = true;
      }
    });
}; // deleteAll


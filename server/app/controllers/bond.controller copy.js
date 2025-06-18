const db = require("../models");
const AuditTrail = db.audittrail;
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
      tokenname             : req.body.tokenname.toUpperCase(), 
      ISIN                  : req.body.ISIN, 
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
      startdate             : req.body.startdate, 
      enddate               : req.body.enddate, 
      issuer                : req.body.issuer, 
      totalsupply           : req.body.totalsupply,
      txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete
      maker                 : req.body.maker,
      checker               : req.body.checker,
      approver              : req.body.approver,
      actionby              : req.body.actionby,
      approvedbondid        : req.body.approvedbondid,
      status                : 1,   // 0 = draft; 1 = created pending review; 2 = reviewed pending approval; 3 = approved
      name_changed          : req.body.name_changed,
      ISIN_changed   : req.body.ISIN_changed,
      facevalue_changed     : req.body.facevalue_changed,
      couponrate_changed    : req.body.couponrate_changed,
      couponinterval_changed: req.body.couponinterval_changed,
      startdate_changed     : req.body.startdate_changed,
      enddate_changed       : req.body.enddate_changed,
      issuer_changed        : req.body.issuer_changed,
      totalsupply_changed   : req.body.totalsupply_changed,
      name_original         : req.body.name_original,
      ISIN_original  : req.body.ISIN_original,
      startdate_original    : req.body.startdate_original,
      enddate_original      : req.body.enddate_original,
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
        tokenname             : req.body.tokenname.toUpperCase(), 
        ISIN           : req.body.ISIN, 
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
        txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

        maker                 : req.body.maker,
        checker               : req.body.checker,
        approver              : req.body.approver,
        actionby              : req.body.actionby,
        bondid                 : req.body.approvedbondid,
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
        file = fs.readFileSync("./server/app/contracts/ERC20TokenisedBond.sol").toString();
        // console.log(file);

        // input structure for solidity compiler
        var input = {
          language: "Solidity",
          sources: {
            "ERC20TokenisedBond.sol": {
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
        ABI = output.contracts["ERC20TokenisedBond.sol"]["BondToken"].abi;
        bytecode = output.contracts["ERC20TokenisedBond.sol"]["BondToken"].evm.bytecode.object;
        // console.log("solc.compile output: ", output);
        // console.log("ABI: ", ABI);
        // console.log("Bytecode: ", bytecode);
        await fs.writeFile("./server/app/abis/ERC20TokenisedBond.abi.json", JSON.stringify(ABI) , 'utf8', function (err) {
          if (err) {
            console.log("An error occured while writing Bond ABI JSON Object to File.");
            return console.log(err);
          }
          console.log("Bond ABI JSON file has been saved.");
        });
        await fs.writeFile("./server/app/abis/ERC20TokenisedBond.bytecode.json", JSON.stringify(bytecode) , 'utf8', function (err) {
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

        console.log("Enddate (unix time) = ", Number(new Date(req.body.enddate)));
        try {
          // Deploy contract
          const deployContract = async () => {
            console.log('Attempting to deploy from account:', signer.address);
            const ERC20TokenisedBondcontract = new web3.eth.Contract(ABI);

            // Estimate gas fee
            const gasFees = await ERC20TokenisedBondcontract.deploy({
              data: bytecode,
              arguments:  [
                            req.body.name, req.body.tokenname, req.body.couponrate, req.body.facevalue, 
                            Number(new Date(req.body.enddate)), req.body.couponinterval, totalsupply,
                            req.body.CashTokensmartcontractaddress, req.body.recipient.walletaddress
                          ],
            })
            .estimateGas({ 
              from: signer.address,
            })
            .then((gasAmount) => {
              console.log("Estimated gas amount for signTransaction: ", gasAmount)
              return gasAmount;
            })
            .catch((error2) => {
              console.log("Error while estimating Gas fee: ", error2)
              return 2100000;  // if error then use default fee
            });
        console.log("Estimated gas fee for transfer: ", gasFees);
        
/*
        if (!errorSent) {
          console.log("Stest test..........................ending error 400 back to client");
          res.status(400).send({ 
            message: "test test.",
          });
          errorSent = true;
        }

        return false;
*/
        const contractTx = await ERC20TokenisedBondcontract.deploy({
              data: bytecode,
              arguments:  [
                            req.body.name, req.body.tokenname, req.body.couponrate, req.body.facevalue, 
                            Number(new Date(req.body.enddate)), req.body.couponinterval, totalsupply,
                            req.body.CashTokensmartcontractaddress, req.body.recipient.walletaddress
                          ],
        });    

            // https://github.com/web3/web3.js/issues/1001

        const createTransaction = await web3.eth.accounts.signTransaction(
              {
                from: signer.address,
                data: contractTx.encodeABI(),
                gas: Math.floor(gasFees * 1.1),  // increase by 10% // 8700000,  // 4700000,
              },
              signer.privateKey
        );
        console.log('Sending signed txn 1...');
        //console.log('Sending signed txn:', createTransaction);
 

        const createReceipt = await web3.eth.sendSignedTransaction( // deploying Bond contract
              createTransaction.rawTransaction, 
            
              function (error1, hash) {
                if (error1) {
                    console.log("Error11a  when submitting your signed transaction:", error1);
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
                    console.log("Attempting A to get transaction receipt... ("+timer+")");
    
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
                        console.log("!! getTransactionReceipt error (1): ", error3)
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
                        console.log("!! getTransactionReceipt error (1): timeout after "+TIMEOUT.toString()+" seconds");
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
                  console.log("Err22 sentSignedTxn error: ", err)
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
        ABI = JSON.parse(fs.readFileSync("./server/app/abis/ERC20TokenisedBond.abi.json").toString());
    
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
          tokenname             : req.body.tokenname.toUpperCase(), 
          ISIN           : req.body.ISIN, 
          blockchain            : req.body.blockchain,

//          datafield1_name       : req.body.datafield1_name,
//          datafield1_value      : req.body.datafield1_value,
//          operator1             : req.body.operator1,
//          datafield2_name       : req.body.datafield2_name,
//          datafield2_value      : req.body.datafield2_value,

          facevalue             : req.body.facevalue,
          couponrate            : req.body.couponrate,
          couponinterval        : req.body.couponinterval,

          startdate             : req.body.startdate, 
          enddate               : req.body.enddate, 
          issuer                : req.body.issuer, 
          smartcontractaddress  : newcontractaddress,
          cashTokenID           : req.body.cashTokenID,
          CashTokensmartcontractaddress  : req.body.CashTokensmartcontractaddress,    
          totalsupply           : req.body.totalsupply,
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
        tokenname             : req.body.tokenname.toUpperCase(), 
        ISIN           : req.body.ISIN, 
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
        startdate             : req.body.startdate, 
        enddate               : req.body.enddate, 
        issuer                : req.body.issuer, 
        totalsupply           : req.body.totalsupply,
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

exports.triggerBondCouponPaymentById = async (req, res) => {  // 
  var errorSent = false;
  var updatestatus = false;
  
  const bond_id = req.query.id;

  if (bond_id <=0  || bond_id ==="" ) {
      if (!errorSent) {
        res.status(400).send({
          message: "Invalid transaction type!"
        });
        errorSent = true;
      }
      return;  
  }
  console.log("Received triggerBondCouponPaymentById():");
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

      const INFURA_API_KEY = process.env.REACT_APP_INFURA_API_KEY;
      const SIGNER_PRIVATE_KEY = process.env.REACT_APP_SIGNER_PRIVATE_KEY;
      const CONTRACT_OWNER_WALLET = process.env.REACT_APP_CONTRACT_OWNER_WALLET;
    
      console.log("!!! Signer:", SIGNER_PRIVATE_KEY.substring(0,4)+"..." + SIGNER_PRIVATE_KEY.slice(-3));

      async function triggerCoupon() {
        updatestatus = false;
        var ABI = null;

        fs = require("fs");

        try {
            // Just read the ABI file
            console.log("Reading Bond ABI JSON file.");
            ABI = JSON.parse(fs.readFileSync("./server/app/abis/ERC20TokenisedBond.abi.json").toString());
            console.log("Reading Bond Bytecode JSON file.");
            bytecode = JSON.parse(fs.readFileSync("./server/app/abis/ERC20TokenisedBond.bytecode.json").toString());
        } catch(err) {
          console.error("Err7a: ",err)
          if (!errorSent) {
            console.log("Sending error 400 back to client");
            res.status(400).send({ 
              message: "Error when reading Bond smart contract. Please contact your tech support."
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
        const signer = web3.eth.accounts.privateKeyToAccount(SIGNER_PRIVATE_KEY)

        // https://github.com/web3/web3.js/issues/1001
        web3.setProvider( new Web3.providers.HttpProvider(`https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`) );

        console.log("Enddate (unix time) = ", Number(new Date(req.body.enddate)));
        try {
          const depositCoupons = async () => {
            console.log("Bond smartcontract addr: ", req.body.smartcontractaddress);            
            console.log("Bond ABI: ", ABI);

            const ERC20TokenisedBondcontract = new web3.eth.Contract(ABI, req.body.smartcontractaddress);

            const nonce = await web3.eth.getTransactionCount(CONTRACT_OWNER_WALLET, "latest") //get latest nonce

            console.log('Attempting to paycoupon from account:', signer.address);

            // Estimate gas fee
            const BN = require('bn.js');
            const couponToPay = new BN(125).mul(new BN("1000000000000000000")); 
            console.log("BN couponToPay:", couponToPay);
            const gasFees = 
//              await ERC20TokenisedBondcontract.methods.depositCoupons(couponToPay)
              await ERC20TokenisedBondcontract.methods.payCoupon()
                      .estimateGas({ 
                        from: signer.address,
                      })
                      .then((gasAmount) => {
                        console.log("Estimated gas amount for signTransaction: ", gasAmount)
                        return gasAmount;
                      })
                      .catch((error2) => {
                        console.log("Error while estimating Gas fee: ", error2)
                        return 210000;  // if error then use default fee
                      });
            console.log("Estimated gas fee for coupon payment: ", gasFees);
            
//            const contractTx = await ERC20TokenisedBondcontract.methods.depositCoupons(couponToPay);
            const contractTx = await ERC20TokenisedBondcontract.methods.payCoupon();

            // https://github.com/web3/web3.js/issues/1001
            const createTransaction = await web3.eth.accounts.signTransaction(
                  {
                    nonce: nonce,
                    from: signer.address,
                    data: contractTx.encodeABI(),
                    gas: Math.floor(gasFees * 1.1),  // increase by 10% // 8700000,  // 4700000,
                  },
                  signer.privateKey
            );
            console.log('Sending signed txn 11b...');
            //console.log('Sending signed txn:', createTransaction);
    

            const createReceipt = await web3.eth.sendSignedTransaction( // deploying Bond contract
              createTransaction.rawTransaction, 
            
              function (error1, hash) {
                if (error1) {
                    console.log("Error11b  when submitting your signed transaction:", error1);
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
                    console.log("Attempting 11b to get transaction receipt... ("+timer+")");
    
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
                        console.log("!! getTransactionReceipt error (11b): ", error3)
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
                        console.log("!! getTransactionReceipt error (11b): timeout after "+TIMEOUT.toString()+" seconds");
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
                  console.log("Err11b sentSignedTxn error: ", err)
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
    
            console.log('**** Txn executed:', createReceipt);
            return true;
          };  // depositCoupons()

          return(await depositCoupons());

        } catch(err) {
          console.error("Err8a: ",err)
          if (!errorSent) {
            console.log("Sending error 400 back to client");
            res.status(400).send({ 
              message: 'Error when signing transaction. Please try again. Report to tech support if problem is recurring.',
            });
            errorSent = true;
          }
          return false;
        }  // try catch
      } //triggerCoupon

      updatestatus = await triggerCoupon();
      console.log("triggerBondCouponPaymentById() Update status (1):", updatestatus);

////////////////////////////// Blockchain ////////////////////////

  if (updatestatus) {
      // write to audit
      AuditTrail.create(
        { 
          action                : "Bond coupon payment",
          name                  : req.body.name,
          tokenname             : req.body.tokenname, 
          ISIN                  : req.body.ISIN, 
          blockchain            : req.body.blockchain,

          facevalue             : req.body.facevalue,
          couponrate            : req.body.couponrate,
          couponinterval        : req.body.couponinterval,
          startdate             : req.body.startdate,
          enddate               : req.body.enddate,
          issuer                : req.body.issuer,
          totalsupply           : req.body.totalsupply,

          smartcontractaddress  : req.body.smartcontractaddress,
          cashTokenID           : req.body.cashTokenID,
          CashTokensmartcontractaddress  : req.body.CashTokensmartcontractaddress,
        }, 
      )
      .then(auditres => {
        console.log("Data written to audittrail for bond coupon payment:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for bond coupon payment: "+err.message);
      });
  } // updatestatus
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
    ABI = JSON.parse(fs.readFileSync("./server/app/abis/ERC20TokenisedBond.abi.json").toString());  // <-- dropdown menu

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
};

exports.getAllInvestorsById = (req, res) => {
  const id = req.query.id;
  console.log("In Bond.getAllInvestorsById: id=", id);

  Bond.findByPk(id, {
    include: db.recipients,
    include: db.campaigns,
  })
  .then(async data => {

    /// Query blockchain
    // Readng ABI from JSON file
    fs = require("fs");
    ABI = JSON.parse(fs.readFileSync("./server/app/abis/ERC20TokenisedBond.abi.json").toString());  // <-- dropdown menu

    // Creation of Web3 class
    Web3 = require("web3");

    console.log("In Bond.getAllInvestorsById:  ", data);

    require('dotenv').config();
    const ETHEREUM_NETWORK = (() => {switch (data.blockchain) {
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

    const BondTokenAddr = data.smartcontractaddress;
    //const BondToken_abi =  JSON.parse(JSON.stringify(BondToken_jsonData));
    //const bondContract = new window.web3.eth.Contract(BondToken_abi, BondTokenAddr);       

    const _tokenAddress = data.smartcontractaddress;

    console.log("Querying token: ", _tokenAddress);
    const contract1 = new Web3Client.eth.Contract(ABI, BondTokenAddr);
  
    try {
      const bondHolders = await contract1.methods.bondHolders().call();
      console.log("bondHolders: ", bondHolders);

      res.send( bondHolders );

    } catch (err) {
      console.log("Error while retreiving bondHolders: "+err.message);
    }


  })
  .catch(err => {
    console.log("Error while retreiving bond4: "+err.message);

    res.status(500).send({
      message:
        err.message || "Some error occurred while retrieving bond."
    });
  });
};

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
    tokenname             : req.body.tokenname.toUpperCase(), 
    ISIN           : req.body.ISIN, 
    blockchain            : req.body.blockchain,

//    datafield1_name       : req.body.datafield1_name,
//    datafield1_value      : req.body.datafield1_value,
//    operator1             : req.body.operator1,
//    datafield2_name       : req.body.datafield2_name,
//    datafield2_value      : req.body.datafield2_value,

    facevalue             : (typeof req.body.facevalue === 'string' || req.body.facevalue instanceof String)? parseInt(req.body.facevalue): req.body.facevalue,
    couponrate            : (typeof req.body.couponrate === 'string' || req.body.couponrate instanceof String)? parseInt(req.body.couponrate): req.body.couponrate,
    couponinterval        : (typeof req.body.couponinterval === 'string' || req.body.couponinterval instanceof String)? parseInt(req.body.couponinterval): req.body.couponinterval,

    startdate             : req.body.startdate, 
    enddate               : req.body.enddate, 
    smartcontractaddress  : req.body.smartcontractaddress,
    cashTokenID           : req.body.cashTokenID,
    CashTokensmartcontractaddress  : req.body.CashTokensmartcontractaddress,
    issuer                : (typeof req.body.issuer === 'string' || req.body.issuer instanceof String)? parseInt(req.body.issuer): req.body.issuer,
    totalsupply           : (typeof req.body.totalsupply === 'string' || req.body.totalsupply instanceof String)? parseInt(req.body.totalsupply): req.body.totalsupply,

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
          tokenname             : req.body.tokenname, 
          ISIN           : req.body.ISIN, 
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
          tokenname             : req.body.tokenname, 
          ISIN           : req.body.ISIN, 
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
          tokenname             : req.body.tokenname, 
          ISIN           : req.body.ISIN, 
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
    ABI = JSON.parse(fs.readFileSync("./server/app/abis/ERC20TokenisedBond.abi.json").toString());

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
      { name                  : req.body.name,
  // cant update token name once smart contract is deployed
  //    tokenname             : req.body.tokenname.toUpperCase(), 
        ISIN           : req.body.ISIN, 
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
        startdate             : req.body.startdate, 
        enddate               : req.body.enddate, 
        issuer                : req.body.issuer, 
        totalsupply           : req.body.totalsupply,
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
              tokenname             : req.body.tokenname, 
              ISIN           : req.body.ISIN, 
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
          tokenname             : req.body.tokenname, 
          ISIN           : req.body.ISIN, 
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
          tokenname             : req.body.tokenname, 
          ISIN           : req.body.ISIN, 
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


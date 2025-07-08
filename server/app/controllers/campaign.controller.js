const db = require("../models");
const AuditTrail = db.audittrail;
const Campaigns = db.campaigns;
const Campaigns_Draft = db.campaigns_draft;
const Op = db.Sequelize.Op;
var newcontractaddress = null;
const adjustdecimals = 18;

function createStringWithZeros(num) { return ("0".repeat(num)); }

// Create and Save a new Campaign
exports.draftCreate = async (req, res) => {
  // Validate request
  if (!req.body.name) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }

  console.log("Received for Campaign Create:");
  console.log(req.body.name);
  console.log(req.body.tokenname);
  console.log(req.body.description);
  console.log(req.body.smartcontractaddress);
  console.log(req.body.blockchain);
  console.log(req.body.startdate);
  console.log(req.body.enddate);
  console.log(req.body.sponsor);
  console.log(req.body.amount);
  console.log(req.body.maker);
  console.log(req.body.checker);
  console.log(req.body.approver);
  console.log(req.body.actionby);
  console.log(req.body.approvedcampaignid);
  console.log(req.body.name_changed);
  console.log(req.body.description_changed);
  console.log(req.body.startdate_changed);
  console.log(req.body.enddate_changed);
  console.log(req.body.sponsor_changed);
  console.log(req.body.amount_changed);
  console.log(req.body.name_original);
  console.log(req.body.description_original);
  console.log(req.body.startdate_original);
  console.log(req.body.enddate_original);
  console.log(req.body.sponsor_original);
  console.log(req.body.amount_original);
  console.log(req.body.blockchain_original);


  // Save Campaign in the database
  await Campaigns_Draft.create(
    { 
      name                  : req.body.name,
      tokenname             : req.body.tokenname.toUpperCase(), 
      description           : req.body.description, 
      smartcontractaddress  : req.body.smartcontractaddress,
      blockchain            : req.body.blockchain,
      startdate             : req.body.startdate, 
      enddate               : req.body.enddate, 
      sponsor               : req.body.sponsor, 
      amount                : req.body.amount,
      txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete
      maker                 : req.body.maker,
      checker               : req.body.checker,
      approver              : req.body.approver,
      actionby              : req.body.actionby,
      approvedcampaignid    : req.body.approvedcampaignid,
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
      blockchain_original   : req.body.blockchain_original,
    }, 
  )
  .then(data => {
    console.log("Campaign_draft create:", data);
    // write to audit
    AuditTrail.create(
      { 
        action                : "Campaign "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - created",
        name                  : req.body.name,
        tokenname             : req.body.tokenname.toUpperCase(), 
        description           : req.body.description, 
        smartcontractaddress  : req.body.smartcontractaddress,
        blockchain            : req.body.blockchain,
        startdate             : req.body.startdate, 
        enddate               : req.body.enddate, 
        sponsor               : req.body.sponsor, 
        amount                : req.body.amount,
        txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

        maker                 : req.body.maker,
        checker               : req.body.checker,
        approver              : req.body.approver,
        actionby              : req.body.actionby,
        campaignid            : req.body.approvedcampaignid,
        status                : 1,   // 0 = draft; 1 = created pending review; 2 = reviewed pending approval; 3 = approved
      }, 
    )
    .then(auditres => {
      console.log("Data written to audittrail for creating campaign request.");

    })
    .catch(err => {
      console.log("Error while logging to audittrail for creating campaign request: "+err.message);
    });
  
    res.send(data);
  })
  .catch(err => {
    res.status(500).send({
      message:
        err.message || "Some error occurred while creating the Campaign draft."
    });
    console.log("Error while creating campaign draft: "+err.message);
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

  console.log("Received for Campaign Review:");
  console.log(req.body.id);
  console.log(req.body.name);
  console.log(req.body.tokenname);
  console.log(req.body.description);
  console.log(req.body.blockchain);
  console.log(req.body.startdate);
  console.log(req.body.enddate);
  console.log(req.body.sponsor);
  console.log(req.body.amount);
  console.log(req.body.actionby);
  console.log(req.body.checkercomments);
  console.log(req.body.action);

    await Campaigns_Draft.update(
      { 
        checkerComments :   checkercomments,
        status:             2   // 0 = draft; 1 = created pending review; 2 = reviewed pending approval; 3 = approved
      }, 
      { where:      { id: id }},
      )
      .then(num => {
        if (num == 1) {
          res.send({
            message: "Campaign status has been updated successfully."
          });
        } else {
          res.send({
            message: `${req.body}. Record updated =${num}. Cannot update Campaign with id=${id}. Maybe Campaign was not found or req.body is empty!`
          });
        }
      })
      .catch(err => {
        console.log(err);
        res.status(500).send({
          message: `Error updating Campaign. ${err}`
        });
      }); 
};

exports.approveDraftById = async (req, res) => {

  // Steps:
  // 1. Is this a new Campaign creation or Edit? If approvedcampaignid === '-1' then it is a new creation
  // 2. If new campaign creation:
  //   a. Check if smart contract is compiled (ABI and ByteCode files are present)
  //   b. Sign smart contract
  //   c. Deploy smart contract
  //   d. Update Campaigns_Draft table status to "3"
  //   e. Insert entry in Campaigns table
  // 3. If edit existing campaign:
  //   a. Update smart contract info such as total supply or date
  //   b. Update Campaigns_Draft table status to "3"
  //   c. Update entry in Campaigns table

  // Validate request
  if (!req.body.name) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }
  
  const draft_id = req.params.id;

  if (req.body.txntype !==0     // create campaign
    && req.body.txntype !==1    // update campaign
    ) {
      res.status(400).send({
        message: "Invalid transaction type!"
      });
      return;  
  }
  const isNewCampaign = (req.body.smartcontractaddress === "" || req.body.smartcontractaddress === null? true : false); // Create = true, Edit/Update = false

  console.log("Received for Create/Update:");
  console.log(req.body.name);
  console.log(req.body.tokenname);
  console.log(req.body.description);
  console.log(req.body.smartcontractaddress);
  console.log(req.body.blockchain);
  console.log(req.body.startdate);
  console.log(req.body.enddate);
  console.log(req.body.sponsor);
  console.log(req.body.amount);
  console.log(req.body.txntype);
  console.log(req.body.actionby);
  console.log(req.body.approvedcampaignid);



////////////////////////////// Blockchain ////////////////////////

      // https://www.geeksforgeeks.org/how-to-deploy-contract-from-nodejs-using-web3/

      require('dotenv').config();

      const ETHEREUM_NETWORK = (() => {
        switch (req.body.blockchain) {
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
      console.log("Using network:"+ ETHEREUM_NETWORK + "("+ req.body.blockchain+")");

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
        file = fs.readFileSync("./server/app/contracts/ERC20TokenDSGD.sol").toString();
        // console.log(file);

        // input structure for solidity compiler
        var input = {
          language: "Solidity",
          sources: {
            "ERC20TokenDSGD.sol": {
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
          return { contents: source };
        }
          
        console.log("Compiling smart contract file... ");
        var output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
        //console.log("Result : ", output);

        console.log("Generating bytecode from smart contract file ");
        ABI = output.contracts["ERC20TokenDSGD.sol"]["ERC20TokenDSGD"].abi;
        bytecode = output.contracts["ERC20TokenDSGD.sol"]["ERC20TokenDSGD"].evm.bytecode.object;
        // console.log("solc.compile output: ", output);
        // console.log("ABI: ", ABI);
        // console.log("Bytecode: ", bytecode);
        await fs.writeFile("./server/app/abis/ERC20TokenDSGD.abi.json", JSON.stringify(ABI) , 'utf8', function (err) {
          if (err) {
            console.log("An error occured while writing DSGD ABI JSON Object to File.");
            return console.log(err);
          }
          console.log("DSGD ABI JSON file has been saved.");
        });
        await fs.writeFile("./server/app/abis/ERC20TokenDSGD.bytecode.json", JSON.stringify(bytecode) , 'utf8', function (err) {
          if (err) {
            console.log("An error occured while writing DSGD bytecode JSON Object to File.");
            return console.log(err);
          }
          console.log("DSGD Bytecode JSON file has been saved.");
        });

      }

      async function dAppCreate() {
        updatestatus = false;
        var errorSent = false;

        fs = require("fs");

        try {
          if (! (fs.existsSync("./server/app/abis/ERC20TokenDSGD.abi.json") && fs.existsSync("./server/app/abis/ERC20TokenDSGD.bytecode.json"))) {
            await compileSmartContract();
          } else{
            // Just read the ABI file
            console.log("DSGD ABI and Bytecode files are present, just read them, no need to recompile...");
            console.log("Read DSGD ABI JSON file.");
            ABI = JSON.parse(fs.readFileSync("./server/app/abis/ERC20TokenDSGD.abi.json").toString());
            console.log("Read DSGD Bytecode JSON file.");
            bytecode = JSON.parse(fs.readFileSync("./server/app/abis/ERC20TokenDSGD.bytecode.json").toString());
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
        let setToTalSupply = (isNaN(+req.body.amount)? req.body.mintAmount: req.body.amount.toString())   
        + createStringWithZeros(adjustdecimals);  // pad zeros behind
        console.log("setToTalSupply = ", setToTalSupply);

        try {
          // Deploy contract
          const deployContract = async () => {
            console.log('Attempting to deploy from account:', signer.address);
            const ERC20TokenDSGDcontract = new web3.eth.Contract(ABI);
            const contractTx = await ERC20TokenDSGDcontract.deploy({
              data: bytecode,
              arguments:  [req.body.tokenname+' Token', req.body.tokenname, 
                            web3.utils.toBN( setToTalSupply )
                          ],
            });

            // https://github.com/web3/web3.js/issues/1001
            web3.setProvider( new Web3.providers.HttpProvider(`https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`) );

            // estimating gas fees
            const gasFees =
            await ERC20TokenDSGDcontract.deploy({
              data: bytecode,
              arguments:  [req.body.tokenname+' Token', req.body.tokenname, 
                            web3.utils.toBN( setToTalSupply )
                          ],
            })
            .estimateGas({ 
              from: signer.address,
            })
            .then((gasAmount) => {
              console.log("Estimated gas amount for deploying campaign: ", gasAmount)
              return gasAmount;
            })
            .catch((error2) => {
              console.log("Error while estimating Campaign deployment Gas fee: ", error2)
              return 2100000;  // if error then use default fee
            });
            console.log("Estimated gas fee for deploying campaign: ", gasFees);
            
            // Sign txn
            const createTransaction = await web3.eth.accounts.signTransaction(
              {
                from: signer.address,
                data: contractTx.encodeABI(),
                gas: gasFees,
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
          console.error("Err77: ",err)
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
            console.log('Creating DSGD contract with ABI');
            const ERC20TokenDSGDcontract = new web3.eth.Contract(ABI);
    
            // https://github.com/web3/web3.js/issues/1001
            web3.setProvider( new Web3.providers.HttpProvider(`https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`) );
            
            let setToTalSupply = (isNaN(+req.body.amount)? req.body.amount: req.body.amount.toString())   
            + createStringWithZeros(adjustdecimals);  // pad zeros behind
            console.log("DSGD setToTalSupply = ", setToTalSupply);
    
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
    
            console.log('**** DSGD Txn executed:', createReceipt);
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
      console.log("*** isNewCampaign = ", isNewCampaign);
      console.log("*** req.body.smartcontractaddress = ", req.body.smartcontractaddress);
      res.status(400).send({
        message: "ENDDD!"
      });
      return;
      */

      if (isNewCampaign) {   // new campaign
        updatestatus = await dAppCreate();
      } else {                              // update campaign
        updatestatus = await dAppUpdate(); 
      }
      console.log("Update status:", updatestatus);

////////////////////////////// Blockchain ////////////////////////


  console.log('New DSGD Contract deployed updating DB: ', newcontractaddress);

  if (updatestatus) {
  // update draft table
    await Campaigns_Draft.update(  // update draft table status to "3"
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
          action                : "Campaign "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - approved",
          name                  : req.body.name,
          tokenname             : req.body.tokenname, 
          description           : req.body.description, 
          blockchain            : req.body.blockchain,
          startdate             : req.body.startdate,
          enddate               : req.body.enddate,
          sponsor               : req.body.sponsor,
          amount                : req.body.amount,
          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete
          smartcontractaddress  : (isNewCampaign? newcontractaddress : req.body.smartcontractaddress),

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
        console.log("Data written to audittrail for approving campaign request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for approving campaign request: "+err.message);
      });


      } else {
        res.send({
          message: `${req.body}. Record updated =${num}. Cannot update Campaign with id=${id}. Maybe Campaign was not found or req.body is empty!`
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

    if (isNewCampaign) {
      await Campaigns.create( // create Campaign in the database !!!!!
        { 
          name:                 req.body.name,
          tokenname:            req.body.tokenname.toUpperCase(), 
          description:          req.body.description, 
          blockchain            : req.body.blockchain,
          startdate:            req.body.startdate, 
          enddate:              req.body.enddate, 
          sponsor:              req.body.sponsor, 
          smartcontractaddress: newcontractaddress,
          amount:               req.body.amount,
          actionby:             req.body.actionby,
          draftcampaignid:      req.body.id,          
        }, 
      )
      .then(data => {
        console.log("Campaign create success:", data);
        res.send(data);
      })
      .catch(err => {
        console.log("Error while creating campaigns: "+err.message);
        if (!errorSent) {
          console.log("Sending error 400 back to client");
          res.status(400).send({ 
            message: err.toString().replace('*', ''),
          });
          errorSent = true;
        }
        return false;
      });
    } else { // not isNewCampaign
      await Campaigns.update( // update Campaign in the database !!!!! 
      { 
        name:                 req.body.name,
        tokenname:            req.body.tokenname.toUpperCase(), 
        description:          req.body.description, 
        blockchain            : req.body.blockchain,
        startdate:            req.body.startdate, 
        enddate:              req.body.enddate, 
        sponsor:              req.body.sponsor, 
        amount:               req.body.amount,
        actionby:             req.body.actionby,
        draftcampaignid:      req.body.id,             
      }, 
      { where:      { id: req.body.approvedcampaignid }},
      )
      .then(data => {
        console.log("Campaign update success:", data);
        res.send(data);
      })
      .catch(err => {
        console.log("Error while updating campaigns: "+err.message);
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

  Campaigns_Draft.findAll(
    { where: condition },
    )
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving campaigns1: "+err.message);

      res.status(400).send({
        message:
          err.message || "Some error occurred while retrieving campaigns."
      });
    });
};

exports.findDraftByApprovedId = (req, res) => {
  const id = req.query.id;
  var condition = id ? { 
    approvedcampaignid: id, 
    status : [-1, 0, 1, 2]  // status -1=rejected, 0, drafted not submitted, 1=submitted for checker, 2=submitted for approver, 3=approved
  } : null;

  Campaigns_Draft.findAll(
    { where: condition },
    )
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving campaigns1: "+err.message);

      res.status(400).send({
        message:
          err.message || "Some error occurred while retrieving campaigns."
      });
    });
};


exports.findExact = (req, res) => {
  const name = req.query.name;
  var condition = name ? { name: name } : null;

  Campaigns.findAll(
    { where: condition },
    )
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving campaigns1: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving campaigns."
      });
    });
};

exports.getInWalletMintedTotalSupply = (req, res) => {
  
  // get token address from CampaignId
  const Id = req.query.id;
  var condition = Id ? { id: Id } : null;

  //console.log("++++++++++++++Received data:", req)
  
  Campaigns.findAll(
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

    const ETHEREUM_NETWORK = (() => {
      switch (data[0].blockchain) {
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
    console.log("Using network:"+ ETHEREUM_NETWORK + "("+ data[0].blockchain+")");

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
    console.log("Error while retreiving campaigns2: "+err.message);

    res.status(500).send({
      message:
        err.message || "Some error occurred while retrieving campaigns."
    });
  });
};

// Retrieve all Campaigns from the database.
exports.findByName = (req, res) => {
  const name = req.query.name;
  var condition = name ? { name: { [Op.like]: `%${name}%` } } : null;

  Campaigns.findAll(
    { include: db.recipient,
      where: condition
    },
    )
    .then(data => {
      console.log("Campaign.findByName:", data)
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving campaigns3: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving campaigns."
      });
    });
};

// Retrieve all Campaigns from the database.
exports.getAll = (req, res) => {
  const name = req.query.name;
  var condition = name ? { name: { [Op.like]: `%${name}%` } } : null;

  Campaigns.findAll(
    { 
      raw: true,
      nest: true,
      include: db.recipients
    },
    { where: condition },
    )
    .then(data => {
      console.log("Campaign.findAll:", data)
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving campaigns4: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving campaigns."
      });
    });
};

exports.getAllDraftsByUserId = (req, res) => {
  const id = req.query.id;
  console.log("====== campaign.getAllDraftsByUserId(id) ",id);
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

  Campaigns_Draft.findAll(
    { 
      raw: true,
      nest: true,
      where: condition,
      include: db.recipients
    },
    )
    .then(data => {
      console.log("Campaigns_Draft.findAll:", data)
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving campaigns5: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving campaigns."
      });
    });
};

exports.getAllDraftsByCampaignId = (req, res) => {
  const id = req.query.id;
  console.log("====== campaign.getAllDraftsByCampaignId(id) ",id);
  var condition = id ? 
       {id : id}
      : null;

  Campaigns_Draft.findAll(
    { 
      raw: true,
      nest: true,
      where: condition
    },
    { include: db.recipient},
    )
    .then(data => {
      console.log("Campaigns_Draft.findAll:", data)
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving campaigns5: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving campaigns."
      });
    });
};

// Find a single Campaign with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  Campaigns.findByPk(id, {
    include: db.recipient
  })
    .then(data => {
      //console.log("Campaign.findByPk:", data)
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find Campaign with id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving Campaign with id=" + id
      });
    });
};

exports.submitDraftById = async (req, res) => {
  
  const id = req.params.id;
  const draft_id = req.params.id;

  console.log("Received1:");
  console.log(id);
  console.log(req.body.name);
  console.log(req.body.tokenname);
  console.log(req.body.description);
  console.log(req.body.smartcontractaddress);
  console.log(req.body.blockchain);
  console.log(req.body.startdate);
  console.log(req.body.enddate);
  console.log(req.body.sponsor);
  console.log(req.body.amount);
  console.log(req.body.txntype);
  console.log(req.body.actionby);
  console.log(req.body.checkerComments);
  console.log(req.body.approverComments);
  console.log(req.body.approvedcampaignid);

  await Campaigns_Draft.update(
  { 
    status :              1,
    name:                 req.body.name,
    tokenname:            req.body.tokenname.toUpperCase(), 
    description:          req.body.description, 
    blockchain            : req.body.blockchain,
    startdate:            req.body.startdate, 
    enddate:              req.body.enddate, 
    sponsor:              req.body.sponsor, 
    smartcontractaddress: req.body.smartcontractaddress,
    amount:               req.body.amount,
    txntype:              req.body.txntype,   // 0 - create,  1-edit,  2-delete
    maker:                req.body.maker,
    checker:              req.body.checker,
    approver:             req.body.approver,
    checkerComments:      req.body.checkerComments,
    approverComments:     req.body.approverComments,
    actionby:             req.body.actionby,
  }, 
  { where:      { id: draft_id }},
  )
  .then(num => {
    if (num == 1) {

      // write to audit
      AuditTrail.create(
        { 
          action                : "Campaign "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - resubmitted",
          name                  : req.body.name,
          tokenname             : req.body.tokenname, 
          description           : req.body.description, 
          blockchain            : req.body.blockchain,
          startdate             : req.body.startdate,
          enddate               : req.body.enddate,
          sponsor               : req.body.sponsor,
          amount                : req.body.amount,
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
        console.log("Data written to audittrail for resubmitting campaign request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for resubmitting campaign request: "+err.message);
      });
      
      res.send({
        message: "Campaign resubmitted successfully."
      });
    } else {
      res.send({
        message: `${req.body}. Record updated =${num}. Cannot update Campaign with id=${id}. Maybe Campaign was not found or req.body is empty!`
      });
    }
  })
  .catch(err => {
    console.log(err);
    res.status(500).send({
      message: `Error updating Campaign. ${err}`
    });
  });
};


exports.acceptDraftById = async (req, res) => {
  
  const id = req.params.id;
  const draft_id = req.params.id;

  console.log("Received2:");
  console.log(id);
  console.log(req.body.name);
  console.log(req.body.tokenname);
  console.log(req.body.description);
  console.log(req.body.blockchain);
  console.log(req.body.startdate);
  console.log(req.body.enddate);
  console.log(req.body.sponsor);
  console.log(req.body.amount);
  console.log(req.body.txntype);
  console.log(req.body.actionby);
  console.log(req.body.checkerComments);
  console.log(req.body.approverComments);
  console.log(req.body.approvedcampaignid);

  await Campaigns_Draft.update(
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
          action                : "Campaign "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - accepted",
          name                  : req.body.name,
          tokenname             : req.body.tokenname, 
          description           : req.body.description, 
          blockchain            : req.body.blockchain,
          startdate             : req.body.startdate,
          enddate               : req.body.enddate,
          sponsor               : req.body.sponsor,
          amount                : req.body.amount,
          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

          draftcampaignId       : draft_id,
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
        console.log("Data written to audittrail for accepting campaign request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for accepting campaign request: "+err.message);
      });
      
      res.send({
        message: "Campaign was accepted successfully."
      });
    } else {
      res.send({
        message: `${req.body}. Record updated =${num}. Cannot update Campaign with id=${id}. Maybe Campaign was not found or req.body is empty!`
      });
    }
  })
  .catch(err => {
    console.log(err);
    res.status(500).send({
      message: `Error updating Campaign. ${err}`
    });
  });
};

exports.rejectDraftById = async (req, res) => {
  
  const id = req.params.id;
  const draft_id = req.params.id;

  console.log("Received2:");
  console.log(id);
  console.log(req.body.name);
  console.log(req.body.tokenname);
  console.log(req.body.description);
  console.log(req.body.blockchain);
  console.log(req.body.startdate);
  console.log(req.body.enddate);
  console.log(req.body.sponsor);
  console.log(req.body.amount);
  console.log(req.body.txntype);
  console.log(req.body.actionby);
  console.log(req.body.checkerComments);
  console.log(req.body.approverComments);
  console.log(req.body.approvedcampaignid);

  await Campaigns_Draft.update(
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
          action                : "Campaign "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - rejected",
          name                  : req.body.name,
          tokenname             : req.body.tokenname, 
          description           : req.body.description, 
          blockchain            : req.body.blockchain,
          startdate             : req.body.startdate,
          enddate               : req.body.enddate,
          sponsor               : req.body.sponsor,
          amount                : req.body.amount,
          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

          draftcampaignId       : draft_id,
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
        console.log("Data written to audittrail for rejecting campaign request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for rejecting campaign request: "+err.message);
      });
      
      res.send({
        message: "Campaign was rejected."
      });
    } else {
      res.send({
        message: `${req.body}. Record updated =${num}. Cannot reject Campaign with id=${id}. Maybe Campaign was not found or req.body is empty!`
      });
    }
  })
  .catch(err => {
    console.log(err);
    res.status(500).send({
      message: `Error rejecting Campaign. ${err}`
    });
  });
};

// Update a Campaign by the id in the request
exports.update = async (req, res) => {
  
  const id = req.params.id;
  const draft_id = req.params.id;

  console.log("Received3:");
  console.log(id);
  console.log(req.body.name);
  console.log(req.body.tokenname);
  console.log(req.body.description);
  console.log(req.body.blockchain);
  console.log(req.body.startdate);
  console.log(req.body.enddate);
  console.log(req.body.sponsor);
  console.log(req.body.amount);
  console.log(req.body.actionby);
  console.log(req.body.approvedcampaignid);


  ////////////////////////////// Blockchain ////////////////////////

  require('dotenv').config();

  const ETHEREUM_NETWORK = (() => {
    switch (req.body.blockchain) {
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
  console.log("Using network:"+ ETHEREUM_NETWORK + "("+ req.body.blockchain+")");

  //const ETHEREUM_NETWORK = process.env.REACT_APP_ETHEREUM_NETWORK;
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
    await Campaigns.update(
      { name                  : req.body.name,
  // cant update token name once smart contract is deployed
  //    tokenname             : req.body.tokenname.toUpperCase(), 
        description           : req.body.description, 
        blockchain            : req.body.blockchain,

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
              action                : "Campaign "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" update request - approved",
              name                  : req.body.name,
              tokenname             : req.body.tokenname, 
              description           : req.body.description, 
              blockchain            : req.body.blockchain,
              startdate             : req.body.startdate,
              enddate               : req.body.enddate,
              sponsor               : req.body.sponsor,
              amount                : req.body.amount,
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
            console.log("Data written to audittrail for approving campaign update request:", auditres);

          })
          .catch(err => {
            console.log("Error while logging to audittrail for approving campaign update request: "+err.message);
          });


          res.send({
            message: "Campaign was updated successfully."
          });
        } else {
          res.send({
            message: `${req.body}. Record updated =${num}. Cannot update Campaign with id=${id}. Maybe Campaign was not found or req.body is empty!`
          });
        }
      })
      .catch(err => {
        console.log(err);
        res.status(500).send({
          message: `Error updating Campaign. ${err}`
        });
      });
  } else {
    res.status(500).send({
      message: "Error updating Campaign. "
    });
  }
};

// Delete a Campaign with the specified id in the request
exports.approveDeleteDraftById = async (req, res) => {
  const draft_id = req.params.id;
  var msgSent = false;

  console.log("Received for Delete request approva;:");
  console.log(req.params.id);
  console.log(req.body.name);
  console.log(req.body.tokenname);
  console.log(req.body.description);
  console.log(req.body.blockchain);
  console.log(req.body.startdate);
  console.log(req.body.enddate);
  console.log(req.body.sponsor);
  console.log(req.body.amount);
  console.log(req.body.actionby);
  console.log(req.body.approvedcampaignid);


  // update draft table
  var Done = await Campaigns_Draft.update(  // update draft table status to "3"
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
          action                : "Campaign "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - deleted",
          name                  : req.body.name,
          tokenname             : req.body.tokenname, 
          description           : req.body.description, 
          blockchain            : req.body.blockchain,
          startdate             : req.body.startdate,
          enddate               : req.body.enddate,
          sponsor               : req.body.sponsor,
          amount                : req.body.amount,
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
        console.log("Data written to audittrail for campaign delete request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for campaign delete request: "+err.message);
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

  if (Done) await Campaigns.destroy({ // delete entry in approved Campaign table
    where: { id: req.body.approvedcampaignid }
  })
  .then(num => {
    if (num == 1) {
      if (!msgSent) {
        console.log("Sending success campaign delete to client");
        res.send({
          message: "Campaign was deleted successfully!"
        });
        msgSent = true;
      }
      return true;
    } else {
      if (!msgSent) {
        res.send({
          message: `Cannot delete Campaign with id=${req.body.approvedcampaignid}. Maybe Campaign was not found!`
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
    
};

exports.dropRequestById = async (req, res) => {
  const draft_id = req.params.id;
  var msgSent = false;

  console.log("Received for drop request:");
  console.log(req.params.id);
  console.log(req.body.name);
  console.log(req.body.tokenname);
  console.log(req.body.description);
  console.log(req.body.blockchain);
  console.log(req.body.startdate);
  console.log(req.body.enddate);
  console.log(req.body.sponsor);
  console.log(req.body.amount);
  console.log(req.body.actionby);
  console.log(req.body.approvedcampaignid);

  // update draft table
  await Campaigns_Draft.update(  // update draft table status to "9" - aborted / dropped requests
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
          action                : "Campaign "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - dropped",
          name                  : req.body.name,
          tokenname             : req.body.tokenname, 
          description           : req.body.description, 
          blockchain            : req.body.blockchain,
          startdate             : req.body.startdate,
          enddate               : req.body.enddate,
          sponsor               : req.body.sponsor,
          amount                : req.body.amount,
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
        console.log("Data written to audittrail for dropping campaign request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for dropping campaign request: "+err.message);
      });
      
      if (!msgSent) {
        console.log("Sending success campaign request dropped to client");
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

// Delete a Campaign with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  console.log(req.body.actionby);

  Campaigns.destroy({
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Campaign was deleted successfully!"
        });
      } else {
        res.send({
          message: `Cannot delete Campaign with id=${id}. Maybe Campaign was not found!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Could not delete Campaign with id=" + id
      });
    });
};

// Delete all Campaigns from the database.
exports.deleteAll = (req, res) => {
  Campaigns.destroy({
    where: {},
    truncate: false
  })
    .then(nums => {
      res.send({ message: `${nums} Campaigns were deleted successfully!` });
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while removing all campaigns."
      });
    });
};



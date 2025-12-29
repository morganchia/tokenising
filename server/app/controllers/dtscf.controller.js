const db = require("../models");
const DTSCFProject = db.dtscfprojects;
const AuditTrail = db.audittrail;
const Dtscf_Draft = db.dtscf_draft;
const Milestone = db.milestones;
const Contractor = db.contractors;
const Purchase = db.purchases;
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Assume configured
const Op = db.Sequelize.Op;
const { logDataValues } = require('../utils/logDataValues');

var newcontractaddress = null;
const adjustdecimals = 18;
const TIMEOUT = 700;

function createStringWithZeros(num) { return ("0".repeat(num)); }

retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000, shouldRetry = () => true) => {
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

// Function to scale a number with up to 3 decimal places to a BigNumber with 18 decimal places
function scaleToWei(value) {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
        throw new Error('Invalid number input for scaling');
    }
    // Convert to string with 3 decimal places and scale to wei (10^18)
    return web3.utils.toWei(parsed.toFixed(3), 'ether');
}

// Function to scale coupon rate to 0.001% units
function scaleCouponRate(value) {
    let parsed = parseFloat(value);
    if (isNaN(parsed)) {
        throw new Error('Coupon rate must be a valid number');
    }
    // If couponrate > 100, assume it's in basis points (e.g., 262.5 = 2.625%) and convert to percentage
    if (parsed > 100) {
        parsed = parsed / 100; // Convert basis points to percentage (e.g., 262.5 → 2.625)
    }
    if (parsed < 0 || parsed > 100) {
        throw new Error('Coupon rate must be a valid percentage between 0 and 100');
    }
    // Multiply by 1,000,000 to convert percentage to 0.001% units (e.g., 2.625% → 2625000)
    return Math.round(parsed * 1000000);
}

// Create and Save a new Dtscf draft
exports.draftCreate = async (req, res) => {
  upload.any()(req, res, async (err) => {
    if (err) {
      return res.status(500).send({ message: "Error parsing form data" });
    }

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

    console.log("Received for Dtscf draft Create:");
    console.log(req.body);

    try {
      // Parse main project data
      const projectData = {
        name              : req.body.name,
        description       : req.body.description,
        totalBudget       : parseInt(req.body.totalBudget) || 0,
        startdate         : req.body.startdate,
        enddate           : req.body.enddate,
        blockchain        : req.body.blockchain || 0, // Default or from form
        txntype           : 0, // Create
        status            : 1,   // 0 = draft; 1 = created pending review; 2 = reviewed pending approval; 3 = approved
        actionby          : req.body.actionby, // Assuming auth service
        actiontimedate    : new Date(),
        maker             : req.body.maker,
        checker           : req.body.checker,
        approver          : req.body.approver,
        checkerComments   : req.body.checkerComments || '',
        approverComments  : req.body.approverComments || ''
      };

      // Create the draft project
      const draftProject = await Dtscf_Draft.create(projectData);

      // Parse and create milestones
      const milestones = JSON.parse(req.body.milestones || '[]');
      for (const ms of milestones) {
        await db.dtscf_milestones_draft.create({
          description: ms.description,
          budget: parseInt(ms.budget) || 0,
          startdate: ms.startdate,
          enddate: ms.enddate,
          dtscf_project_id: draftProject.id
        });
      }

      // Parse and create contractors with purchases
      const contractors = JSON.parse(req.body.contractors || '[]');
      for (const [conIndex, con] of contractors.entries()) {
        const draftContractor = await db.dtscf_contractors_draft.create({
          name: con.name,
          budget: parseInt(con.budget) || 0,
          dtscf_project_id: draftProject.id,
          dtscf_parent_contractor_id: con.parent_contractor_id || null
        });

        for (const [purIndex, pur] of con.purchases.entries()) {
          const invoiceField = `contractor_${conIndex}_purchase_${purIndex}_invoice`;
          const invoiceFile = req.files[invoiceField] ? req.files[invoiceField][0] : null;

          await db.dtscf_purchases_draft.create({
            description: pur.description,
            amount: parseFloat(pur.amount) || 0,
            dtscf_project_id: draftProject.id,
            dtscf_contractor_id: draftContractor.id,
            invoice_blob: invoiceFile ? invoiceFile.buffer : null
          });
        }
      }

      // Log to audittrail
      await AuditTrail.create({
        tablename: 'dtscf_draft',
        action: 'create',
        actionby: projectData.actionby,
        actiontimedate: projectData.actiontimedate,
        data: logDataValues(draftProject)
      });

      res.send({
        message: "Draft created successfully!"
      });
    } catch (err) {
      console.error(err);
      if (!errorSent) {
        res.status(500).send({
          message: err.message || "Some error occurred while creating the draft."
        });
        errorSent = true;
      }
    }
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

  console.log("Received for Dtscf Review:");
  console.log(req.body);

  await Dtscf_Draft.update(
      { 
        checkerComments :   checkercomments,
        status:             2   // 0 = draft; 1 = created pending review; 2 = reviewed pending approval; 3 = approved
      }, 
      { where:      { id: id }},
      )
      .then(num => {
        if (num == 1) {
          res.send({
            message: "Dtscf status has been updated successfully."
          });
        } else {
          res.send({
            message: `${req.body}. Record updated =${num}. Cannot update Dtscf with id=${id}. Maybe Dtscf was not found or req.body is empty!`
          });
        }
      })
      .catch(err => {
        console.log(err);
        res.status(500).send({
          message: `Error updating Dtscf. ${err}`
        });
      }); 
}; // create_review

exports.approveDraftById = async (req, res) => {  // 
  // Steps:
  // 1. Is this a new Dtscf creation or Edit? If approveddtscfid === '-1' then it is a new creation
  // 2. If new dtscf creation:
  //   a. Check if smart contract is compiled (ABI and ByteCode files are present)
  //   b. Sign smart contract
  //   c. Deploy smart contract
  //   d. Update Dtscf_Draft table status to "3"
  //   e. Insert entry in Dtscf table
  // 3. If edit existing dtscf:
  //   a. Update smart contract info such as total supply or date
  //   b. Update Dtscf_Draft table status to "3"
  //   c. Update entry in Dtscf table

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

  if (req.body.txntype !==0     // create dtscf
    && req.body.txntype !==1    // update dtscf
    ) {
      if (!errorSent) {
        res.status(400).send({
          message: "Invalid transaction type!"
        });
        errorSent = true;
      }
      return;  
  }
  const isNewDtscf = (req.body.smartcontractaddress === "" || req.body.smartcontractaddress === null? true : false); // Create = true, Edit/Update = false

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
//        file = fs.readFileSync("./server/app/contracts/ERC20TokenisedDtscf.sol").toString();
        file = fs.readFileSync("./server/app/contracts/ERC20Dtscf_new.sol").toString();
        // console.log(file);

        // input structure for solidity compiler
/*
        var input = {
          language: "Solidity",
          sources: {
//          "ERC20TokenisedDtscf.sol": {
            "ERC20Dtscf_new.sol": {
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
                'ERC20Dtscf_new.sol': {
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
//        ABI = output.contracts["ERC20TokenisedDtscf.sol"]["DtscfToken"].abi;
//        bytecode = output.contracts["ERC20TokenisedDtscf.sol"]["DtscfToken"].evm.bytecode.object;
        ABI = output.contracts["ERC20Dtscf_new.sol"]["DtscfToken"].abi;
        bytecode = output.contracts["ERC20Dtscf_new.sol"]["DtscfToken"].evm.bytecode.object;
        // console.log("solc.compile output: ", output);
        // console.log("ABI: ", ABI);
        // console.log("Bytecode: ", bytecode);

                
//        await fs.writeFile("./server/app/abis/ERC20TokenisedDtscf.abi.json", JSON.stringify(ABI) , 'utf8', function (err) {
        await fs.writeFile("./server/app/abis/ERC20Dtscf_new.abi.json", JSON.stringify(ABI) , 'utf8', function (err) {
          if (err) {
            console.log("An error occured while writing Dtscf ABI JSON Object to File.");
            return console.log(err);
          }
          console.log("Dtscf ABI JSON file has been saved.");
        });
//         await fs.writeFile("./server/app/abis/ERC20TokenisedDtscf.bytecode.json", JSON.stringify(bytecode) , 'utf8', function (err) {
        await fs.writeFile("./server/app/abis/ERC20Dtscf_new.bytecode.json", JSON.stringify(bytecode) , 'utf8', function (err) {
          if (err) {
            console.log("An error occured while writing Dtscf bytecode JSON Object to File.");
            return console.log(err);
          }
          console.log("Dtscf Bytecode JSON file has been saved.");
        });

      }

      async function dAppCreate() {
        updatestatus = false;
        fs = require("fs");

        try {
          await compileSmartContract();
        } catch(err) {
          console.error("Err7: ",err);
          if (!errorSent) {
            console.log("Sending error 400 back to client");
            res.status(400).send({ 
              message: "Error when compiling Dtscf smart contract. Please contact your tech support."
            });
            errorSent = true;
          }
          return false;
        }
            
        Web3 = require("web3");
        web3 = new Web3( 
          Web3.providers.HttpProvider(
            `https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`
          ) 
        );

        console.log("!!! Signer:", SIGNER_PRIVATE_KEY.substring(0,4)+"..." + SIGNER_PRIVATE_KEY.slice(-3));
        const signer = web3.eth.accounts.privateKeyToAccount(SIGNER_PRIVATE_KEY);
        const totalSupply = (typeof req.body.totalsupply === 'string' || req.body.totalsupply instanceof String) ? req.body.totalsupply : req.body.totalsupply.toString();

        web3.setProvider(new Web3.providers.HttpProvider(`https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`));

        console.log("Maturitydate (unix time) = ", Number(new Date(req.body.maturitydate)));
        try {
          const deployContract = async () => {
            console.log('Attempting to deploy from account:', signer.address);
            const ERC20TokenisedDtscfcontract = new web3.eth.Contract(ABI);

            console.log("Extracting issuer name from id...");
            const recipient = await Recipients.findByPk(req.body.issuerId || req.body.issuer);
            console.log('Recipient.findByPk issuer:', recipient);

            if (!recipient || !recipient.name) {
              console.error('Error: No valid issuer found for ID:', req.body.issuerId || req.body.issuer);
              res.status(400).send({
                message: 'Invalid issuer ID or no issuer name found.',
              });
              return;
            }

            console.log('Updated req.body.issuer:', recipient.name);

            const requiredFields = {
              tokenname: req.body.tokenname,
              tokensymbol: req.body.tokensymbol,
              ISIN: req.body.ISIN,
              facevalue: (typeof req.body.facevalue === 'string' || req.body.facevalue instanceof String)? parseFloat(req.body.facevalue): req.body.facevalue,
              couponrate: (typeof req.body.couponrate === 'string' || req.body.couponrate instanceof String)? parseFloat(req.body.couponrate): req.body.couponrate,
              couponinterval: (typeof req.body.couponinterval === 'string' || req.body.couponinterval instanceof String)? parseInt(req.body.couponinterval): req.body.couponinterval,
              issuedate: req.body.issuedate,
              maturitydate: req.body.maturitydate,
              issuer: recipient.name,
              CashTokensmartcontractaddress: req.body.CashTokensmartcontractaddress,
              prospectusurl: req.body.prospectusurl,
              totalsupply: req.body.totalsupply,
            };

            console.log('Constructor inputs:', requiredFields);

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

            const stringFields = ['tokenname', 'tokensymbol', 'ISIN', 'issuer', 'prospectusurl'];
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

            const numericFields = ['facevalue', 'totalsupply'];
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

            if (isNaN(req.body.couponrate) || req.body.couponrate < 0) {
              console.log("Coupon rate is invalid: ", req.body.couponrate);
              if (!errorSent) {
                res.status(400).send({
                  message: `Invalid input: couponrate must be a positive number.`,
                });
                errorSent = true;
              }
              return false;
            }

            if (isNaN(req.body.couponinterval) || req.body.couponinterval < 0) {
              console.log("Coupon interval is invalid: ", req.body.couponinterval);
              if (!errorSent) {
                res.status(400).send({
                  message: "Coupon interval must be 0 or positive."
                });
                errorSent = true;
              }
              return false;
            }

            if (req.body.couponinterval === 0 && req.body.couponrate > 0) {
              console.log("Coupon interval is zero but coupon rate is positive: ", req.body.couponinterval);
              if (!errorSent) {
                res.status(400).send({
                  message: "Coupon interval is zero but coupon rate is positive.",
                });
                errorSent = true;
              }
              return false;
            }

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

            const dtscfConfig = [
              req.body.tokenname,
              req.body.tokensymbol,
              req.body.ISIN,
              scaleToWei(req.body.facevalue),
              scaleCouponRate(req.body.couponrate),
              (typeof req.body.couponinterval === 'string' || req.body.couponinterval instanceof String)? parseInt(req.body.couponinterval): req.body.couponinterval,
              Math.floor(Number(new Date(req.body.issuedate)) / 1000),
              Math.floor(Number(new Date(req.body.maturitydate)) / 1000),
              recipient.name,
              scaleToWei(totalSupply),
              req.body.CashTokensmartcontractaddress,
              req.body.prospectusurl,
            ];

            console.log('DtscfConfig:', dtscfConfig);



            let gasFees = await retryWithBackoff(() => ERC20TokenisedDtscfcontract.deploy({
              data: bytecode,
              arguments: [dtscfConfig],
            })
            .estimateGas({ from: signer.address })
            .then((gasAmount) => {
              console.log("Estimated gas amount for signTransaction: ", gasAmount);
              return gasAmount;
            })
            .catch((error2) => {
              console.log("Error while estimating Gas fee: ", error2);
              return 2100000;
            }));

            console.log("Initial estimated gas fee: ", gasFees);

            const balance = await web3.eth.getBalance(signer.address);
            console.log("Signer balance:", web3.utils.fromWei(balance, "ether"), "ETH");
            if (web3.utils.toBN(balance).lt(web3.utils.toBN(gasFees).mul(web3.utils.toBN("1000000000")))) {
              res.status(400).send({ message: "Insufficient funds for gas." });
              return false;
            }

            const contractTx = await retryWithBackoff(() => ERC20TokenisedDtscfcontract.deploy({
              data: bytecode,
              arguments: [dtscfConfig],
            }));

            const nonce = await web3.eth.getTransactionCount(signer.address, "pending");
            console.log("Using nonce:", nonce);

            let gasMultiplier = 1.1; // Initial 10% increase
            const gasIncreaseInterval = 30000; // 30 seconds in milliseconds
            const maxWaitTime = TIMEOUT * 1000; // 700 seconds in milliseconds
            let startTime = Date.now();

            const attemptTransaction = async () => {
              const currentGas = Math.floor(gasFees * gasMultiplier);
              console.log(`Attempting transaction with gas: ${currentGas} (multiplier: ${gasMultiplier})`);

              const createTransaction = await retryWithBackoff(() => web3.eth.accounts.signTransaction(
                {
                  from: signer.address,
                  data: contractTx.encodeABI(),
                  gas: currentGas,
                  nonce: nonce
                },
                signer.privateKey
              ));

              console.log('Sending signed txn...');
              return new Promise((resolve, reject) => {
                let timer = 0;
                const interval = setInterval(async () => {
                  if (Date.now() - startTime > maxWaitTime) {
                    clearInterval(interval);
                    reject(new Error(`Timeout after ${TIMEOUT} seconds`));
                    return;
                  }

                  if (timer % gasIncreaseInterval === 0 && timer > 0) {
                    gasMultiplier += 0.15; // Increase gas by 15%, lower than 10% may get "replace transaction underpriced" error
                    console.log(`Increasing gas multiplier to ${gasMultiplier}`);
                    const newGas = Math.floor(gasFees * gasMultiplier);
                    const newTransaction = await retryWithBackoff(() => web3.eth.accounts.signTransaction(
                      {
                        from: signer.address,
                        data: contractTx.encodeABI(),
                        gas: newGas,
                        nonce: nonce
                      },
                      signer.privateKey
                    ));
                    web3.eth.sendSignedTransaction(newTransaction.rawTransaction, (error1, hash) => {
                      if (error1 && error1.message.includes("replacement transaction underpriced")) {
                        console.log("Transaction replacement failed: replacement transaction underpriced!");
                      } else {
                        if (error1) {
                          console.log("Error when submitting signed transaction:", error1);
                          clearInterval(interval);
                          reject(error1);
                        } else {
                          console.log("Txn sent!, hash: ", hash);
                          handleReceipt(hash, interval, resolve, reject);
                        }
                      }
                    });
                  }

                  timer += 1000;
                }, 1000);

                web3.eth.sendSignedTransaction(createTransaction.rawTransaction, (error1, hash) => {
                  if (error1) {
                    console.log("Error when submitting initial signed transaction:", error1);
                    if (timer >= gasIncreaseInterval) {
                      return; // Let interval handle retry
                    }
                    clearInterval(interval);
                    reject(error1);
                  } else {
                    console.log("Txn sent!, hash: ", hash);
                    handleReceipt(hash, interval, resolve, reject);
                  }
                });
              });
            };

            const handleReceipt = (hash, interval, resolve, reject) => {
              let receiptTimer = 0;
              const receiptInterval = setInterval(async () => {
                if (Date.now() - startTime > maxWaitTime) {
                  clearInterval(interval);
                  clearInterval(receiptInterval);
                  reject(new Error(`Timeout after ${TIMEOUT} seconds`));
                  return;
                }

                const receipt = await web3.eth.getTransactionReceipt(hash);
                if (receipt) {
                  console.log('>> GOT RECEIPT!!!!!!!!!!!!!!!!!!!!!!!');
                  clearInterval(interval);
                  clearInterval(receiptInterval);
                  console.log('Receipt -->>: ', receipt);
                  const trx = await web3.eth.getTransaction(hash);
                  console.log('trx.status -->>: ', trx);
                  newcontractaddress = receipt.contractAddress;
                  resolve(receipt.status);
                }
                receiptTimer += 1000;
              }, 1000);
            };

            try {
              const status = await attemptTransaction();
              console.log('**** Txn executed:', status);
              console.log('New Contract deployed at address', newcontractaddress);
              return true;
            } catch (err) {
              console.error("Transaction error:", err);
              if (!errorSent) {
                console.log("Sending error 400 back to client");
                res.status(400).send({
                  message: err.message || 'Error when signing transaction. Please try again. Report to tech support if problem is recurring.',
                });
                errorSent = true;
              }
              return false;
            }
          };

          return (await deployContract());
        } catch(err) {
          console.error("Err8: ", err);
          if (!errorSent) {
            console.log("Sending error 400 back to client");
            res.status(400).send({ 
              message: 'Error when signing transaction. Please try again. Report to tech support if problem is recurring.',
            });
            errorSent = true;
          }
          return false;
        }        
      } //dAppCreate

      async function dAppUpdate() {
        updatestatus = false;
    
        // Readng ABI from JSON file
        fs = require("fs");
//        ABI = JSON.parse(fs.readFileSync("./server/app/abis/ERC20TokenisedDtscf.abi.json").toString());
        ABI = JSON.parse(fs.readFileSync("./server/app/abis/ERC20Dtscf_new.abi.json").toString());
    
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
            console.log('Creating Dtscf contract with ABI');
            const ERC20TokenisedDtscfcontract = new web3.eth.Contract(ABI);
    
            // https://github.com/web3/web3.js/issues/1001
            web3.setProvider( new Web3.providers.HttpProvider(`https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`) );
            
            let setToTalSupply = (isNaN(+req.body.totalsupply)? req.body.totalsupply: req.body.totalsupply.toString())   
            + createStringWithZeros(adjustdecimals);  // pad zeros behind
            console.log("Dtscf setToTalSupply = ", setToTalSupply);
    
            console.log('**** Signing update txn('+CONTRACT_OWNER_WALLET+','+req.body.totalsupply );
            const nonce = await web3.eth.getTransactionCount(CONTRACT_OWNER_WALLET, "latest") //get latest nonce
            const createTransaction = await web3.eth.accounts.signTransaction(  
              { // Sign transaction to setTotalSupply in smart contract
                nonce: nonce,
                from: signer.address,
                to: req.body.smartcontractaddress,
                data: ERC20TokenisedDtscfcontract.methods.updateTotalSupply(
                        1,  // dtscfId
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
                            message: "Timeout after "+TIMEOUT.toString()+" seconds, please check the Dtscf tab after 5 minutes and try again if the Dtscf isnt created.",
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
    
            console.log('**** Dtscf Txn executed:', createReceipt);
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
    
        return ( await UpdateContract() );
      } // dAppUpdate

      
      console.log("*** isNewDtscf = ", isNewDtscf);
      console.log("*** req.body.smartcontractaddress = ", req.body.smartcontractaddress);
/*
      res.status(400).send({
        message: "ENDDD!"
      });
      return;
*/

      if (isNewDtscf) {   // new dtscf
        updatestatus = await dAppCreate();
      } else {                              // update dtscf
        updatestatus = await dAppUpdate(); 
      }
      console.log("approveDraftById Update status (1):", updatestatus);

////////////////////////////// Blockchain ////////////////////////


  console.log('New Dtscf Contract deployed updating DB: ', newcontractaddress);

  if (updatestatus) {
  // update draft table
    await Dtscf_Draft.update(  // update draft table status to "3"
    { 
      status                : 3,
      smartcontractaddress  : newcontractaddress,
      approverComments      : req.body.approvercomments,
    }, 
    { where:      { id: draft_id }},
    )
    .then(num => {
      if (num == 1) {


      } else {
        if (!errorSent) {
          res.send({
            message: `${req.body}. Record updated =${num}. Cannot update Dtscf with id=${id}. Maybe Dtscf was not found or req.body is empty!`
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

    if (isNewDtscf) {
      await Dtscf.create( // create Dtscf in the database !!!!!
        { 
          name                  : req.body.name,
//          securityname          : req.body.securityname,
          ISIN                  : req.body.ISIN, 
          tokenname             : req.body.tokenname, 
          tokensymbol           : req.body.tokensymbol.toUpperCase(),
          blockchain            : req.body.blockchain,

//          datafield1_name       : req.body.datafield1_name,
//          datafield1_value      : req.body.datafield1_value,
//          operator1             : req.body.operator1,
//          datafield2_name       : req.body.datafield2_name,
//          datafield2_value      : req.body.datafield2_value,

          facevalue             : (typeof req.body.facevalue === 'string' || req.body.facevalue instanceof String)? parseFloat(req.body.facevalue): req.body.facevalue,
          couponrate            : (typeof req.body.couponrate === 'string' || req.body.couponrate instanceof String)? parseFloat(req.body.couponrate): req.body.couponrate,
          couponinterval        : (typeof req.body.couponinterval === 'string' || req.body.couponinterval instanceof String)? parseInt(req.body.couponinterval): req.body.couponinterval,

          issuedate             : req.body.issuedate, 
          maturitydate          : req.body.maturitydate, 
          issuer                : req.body.issuer, 
          smartcontractaddress  : newcontractaddress,
          cashTokenID           : req.body.cashTokenID,
          CashTokensmartcontractaddress  : req.body.CashTokensmartcontractaddress,    
          totalsupply           : req.body.totalsupply,
          prospectusurl         : req.body.prospectusurl, // new

          actionby              : req.body.actionby,
          draftdtscfid           : req.body.id,          
        }, 
      )
      .then(data => {
        logDataValues("Dtscf create success: ", data);

        if (!errorSent) {
          res.send(data);
          errorSent = true;
        }
      })
      .catch(err => {
        console.log("Error while creating dtscf: "+err.message);
        if (!errorSent) {
          console.log("Sending error 400 back to client");
          res.status(400).send({ 
            message: 'Error when signing transaction. Please try again. Report to tech support if problem is recurring.',
          });
          errorSent = true;
        }
        return false;
      });
    } else { // not isNewDtscf
      await Dtscf.update( // update Dtscf in the database !!!!! 
      { 
        name                  : req.body.name,
//        securityname          : req.body.securityname,
        ISIN                  : req.body.ISIN, 
        tokenname             : req.body.tokenname, 
        tokensymbol           : req.body.tokensymbol.toUpperCase(),
        blockchain            : req.body.blockchain,

//        datafield1_name       : req.body.datafield1_name,
//        datafield1_value      : req.body.datafield1_value,
//        operator1             : req.body.operator1,
//        datafield2_name       : req.body.datafield2_name,
//        datafield2_value      : req.body.datafield2_value,

        facevalue             : (typeof req.body.facevalue === 'string' || req.body.facevalue instanceof String)? parseFloat(req.body.facevalue): req.body.facevalue,
        couponrate            : (typeof req.body.couponrate === 'string' || req.body.couponrate instanceof String)? parseFloat(req.body.couponrate): req.body.couponrate,
        couponinterval        : (typeof req.body.couponinterval === 'string' || req.body.couponinterval instanceof String)? parseInt(req.body.couponinterval): req.body.couponinterval,

        cashTokenID           : req.body.cashTokenID,
        CashTokensmartcontractaddress  : req.body.CashTokensmartcontractaddress,  
        issuedate             : req.body.issuedate, 
        maturitydate          : req.body.maturitydate, 
        issuer                : req.body.issuer, 
        totalsupply           : req.body.totalsupply,
        prospectusurl         : req.body.prospectusurl, // new
        
        actionby              : req.body.actionby,
        draftdtscfid           : req.body.id,             
      }, 
      { where:      { id: req.body.approveddtscfid }},
      )
      .then(data => {
        logDataValues("Dtscf update success: ", data);

        if (!errorSent) {
          res.send(data);
          errorSent = true;
        }
      })
      .catch(err => {
        console.log("Error while updating dtscf: "+err.message);
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

exports.triggerDtscfCouponPaymentById = async (req, res) => {
  let errorSent = false;
  let updatestatus = false;

  const dtscf_id = req.params.id;
  const { lowestUnpaidCouponIndex, holders, amountsHeld } = req.body;

  console.log("Received triggerDtscfCouponPaymentById:");
  //console.log(req.body);
  console.log("triggerDtscfCouponPaymentById called with dtscf_id:", dtscf_id);
  console.log("Lowest Unpaid Coupon Index:", lowestUnpaidCouponIndex);
  console.log("Holder List:", holders);
  console.log("Amounts Held:", amountsHeld);
/*
  // Validate request
  if (dtscf_id === undefined || typeof dtscf_id !== "number" || dtscf_id <= 0 || typeof lowestUnpaidCouponIndex !== "number" || holders === undefined || !Array.isArray(holders) || holders.length === 0 || amountsHeld === undefined || !Array.isArray(amountsHeld) || amountsHeld.length === 0) {
    if (!errorSent) {
      res.status(400).send({
        message: "Invalid request: Missing dtscf ID, coupon index, holder list, or amounts held."
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

  // Fetch dtscf details
  let dtscf;
  try {
    dtscf = await Dtscf.findByPk(dtscf_id);
    if (!dtscf) {
      if (!errorSent) {
        res.status(404).send({
          message: `Dtscf with id=${dtscf_id} not found.`
        });
        errorSent = true;
      }
      return;
    }
  } catch (err) {
    console.error("Error fetching dtscf:", err.message);
    if (!errorSent) {
      res.status(500).send({
        message: "Error fetching dtscf details."
      });
      errorSent = true;
    }
    return;
  }

  // Blockchain interaction
  require('dotenv').config();
  const ETHEREUM_NETWORK = (() => {
    switch (Number(dtscf.blockchain)) {
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
      console.log("Reading Dtscf ABI JSON file.");
      ABI = JSON.parse(fs.readFileSync("./server/app/abis/ERC20Dtscf_new.abi.json").toString());
    } catch (err) {
      console.error("Err reading ABI:", err);
      if (!errorSent) {
        res.status(400).send({
          message: "Error reading dtscf smart contract ABI."
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
          //holderBalance: await dtscfContract.methods.balanceOf(holders[0]).call()
        });

        console.log("Dtscf smart contract address:", dtscf.smartcontractaddress);
        const dtscfContract = new web3.eth.Contract(ABI, dtscf.smartcontractaddress);
        const nonce = await web3.eth.getTransactionCount(CONTRACT_OWNER_WALLET, "latest");

        console.log('Attempting to pay coupon from account:', signer.address);

        // Estimate gas
        let gasFees = 2100000; // Default gas limit
        /*
        try {
          gasFees = await dtscfContract.methods.payCoupon(lowestUnpaidCouponIndex, holders, amountsHeld)
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
            errMessage = "Insufficient cash tokens in the dtscf contract for coupon payment.";
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
        const contractTx = dtscfContract.methods.payCoupon(1, lowestUnpaidCouponIndex, holders, amountsHeld);
        const createTransaction = await web3.eth.accounts.signTransaction(
          {
            nonce: nonce,
            from: signer.address,
            to: dtscf.smartcontractaddress,
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
  console.log("triggerDtscfCouponPaymentById Update status:", updatestatus);

  // Log to audit trail if successful
  if (updatestatus) {
    try {
      await AuditTrail.create({
        action: "Dtscf coupon payment",
        name: dtscf.name,
//        securityname: dtscf.securityname,
        ISIN: dtscf.ISIN,
        tokenname: dtscf.tokenname,
        tokensymbol: dtscf.tokensymbol?.toUpperCase(),
        blockchain: dtscf.blockchain,
        facevalue: dtscf.facevalue,
        couponrate: dtscf.couponrate,
        couponinterval: dtscf.couponinterval,
        issuer: dtscf.issuer,
        totalsupply: dtscf.totalsupply,
        prospectusurl: dtscf.prospectusurl,
        smartcontractaddress: dtscf.smartcontractaddress,
        cashTokenID: dtscf.cashTokenID,
        CashTokensmartcontractaddress: dtscf.CashTokensmartcontractaddress,
        couponIndex: lowestUnpaidCouponIndex
      });
      console.log("Audit trail logged for dtscf coupon payment.");
    } catch (err) {
      console.error("Error logging to audit trail:", err.message);
    }
  }
}; // triggerDtscfCouponPaymentById

exports.findDraftByNameExact = (req, res) => {
  const name = req.query.name;
  var condition = name ? { 
    name: name, 
    status : [-1, 0, 1, 2]  // status -1=rejected, 0, drafted not submitted, 1=submitted for checker, 2=submitted for approver, 3=approved
  } : null;

  Dtscf_Draft.findAll(
    { where: condition },
    )
    .then(data => {
      logDataValues("Dtscf_Draft.findAll: ", data);
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving dtscf1 draft: "+err.message);

      res.status(400).send({
        message:
          err.message || "Some error occurred while retrieving dtscf draft."
      });
    });
}; // findDraftByNameExact

exports.findDraftByApprovedId = (req, res) => {
  const id = req.query.id;
  var condition = id ? { 
    approveddtscfid: id, 
    status : [-1, 0, 1, 2]  // status -1=rejected, 0, drafted not submitted, 1=submitted for checker, 2=submitted for approver, 3=approved
  } : null;

  Dtscf_Draft.findAll(
    { where: condition },
    )
    .then(data => {
      logDataValues("Dtscf_Draft.findAll: ", data);
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving dtscf1 draft: "+err.message);

      res.status(400).send({
        message:
          err.message || "Some error occurred while retrieving dtscf draft."
      });
    });
}; // findDraftByApprovedId

exports.findExact = (req, res) => {
  const name = req.query.name;
  var condition = name ? { name: name } : null;

  Dtscf.findAll(
    { where: condition },
    )
    .then(data => {
      logDataValues("Dtscf.findAll: ", data);
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving dtscf1: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving dtscf."
      });
    });
}; // findExact

exports.getInWalletMintedTotalSupply = (req, res) => {
  
  // get token address from DtscfId
  const Id = req.query.id;
  var condition = Id ? { id: Id } : null;

  //console.log("++++++++++++++Received data:", req)
  
  Dtscf.findAll(
  { 
    where: { id : Id },
  })
  .then(async data => {

    //console.log("Qery result fo DATA:", data[0].id);

    /// Query blockchain
    // Readng ABI from JSON file
    fs = require("fs");
//     ABI = JSON.parse(fs.readFileSync("./server/app/abis/ERC20TokenisedDtscf.abi.json").toString());  // <-- dropdown menu
    ABI = JSON.parse(fs.readFileSync("./server/app/abis/ERC20Dtscf_new.abi.json").toString());  // <-- dropdown menu

    // Creation of Web3 class
    Web3 = require("web3");

    logDataValues("In Dtscf.findAll: ", data);

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
      const _inWallet = await contract1.methods.balanceOf(1, CONTRACT_OWNER_WALLET).call(); 
      inWallet = await Web3Client.utils.fromWei(_inWallet)
      console.log("In Wallet: ", inWallet);
    } catch (err) {
      console.log("Error while retreiving inWallet: "+err.message);
    }

    var totalMinted = 0
    try {
      const _totalMinted = await contract1.methods._incirculation(1).call(); 
      totalMinted = await Web3Client.utils.fromWei(_totalMinted)
      console.log("total Minted: ", totalMinted);
    } catch (err) {
      console.log("Error while retreiving _incirculation: "+err.message);
    }

    var totalSupply = 0
    try {
      const _totalSupply = await contract1.methods.totalSupply(1).call(); 
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
    console.log("Error while retreiving dtscf2: "+err.message);

    res.status(500).send({
      message:
        err.message || "Some error occurred while retrieving dtscf."
    });
  });
}; // getInWalletMintedTotalSupply

// Retrieve all Dtscf from the database.
exports.findByName = (req, res) => {
  const name = req.query.name;
  var condition = name ? { name: { [Op.like]: `%${name}%` } } : null;
/*
  Dtscf.findAll(
    { include: db.recipients,
      where: condition
    },
    )
    .then(data => {
      logDataValues("Dtscf.findByName: ", data);
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving dtscf3: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving dtscf."
      });
    });
*/
  Dtscf.findAll(
  {
    where: condition,
    include: [
      {
        model: db.recipients,
        on: {
          id: db.Sequelize.where(db.Sequelize.col("dtscf.issuer"), "=", db.Sequelize.col("recipient.id")),
        },
        attributes: ['id','name', 'walletaddress'],
      },
      {
        model: db.campaigns,
        on: {
          id: db.Sequelize.where(db.Sequelize.col("dtscf.cashTokenID"), "=", db.Sequelize.col("campaign.id")),
        },
        attributes: ['id', 'name', 'tokenname', 'smartcontractaddress', 'blockchain'],
      }
    ]
  },
  ).then(data => {
    logDataValues("Dtscf.findAll: ", data);
    res.send(data);
  }).catch(err => {
    res.status(500).send({
      message:
        err.message || "Some error occurred while retrieving dtscf."
    });
  }); // findAll

}; // findByName

exports.getAllByDtscfId = (req, res) => {
  const id = req.query.id;
  console.log("====== dtscf.getAllByDtscfId(id) ",id);
  var condition = id ? 
       {id : id}
      : null;

  Dtscf.findAll(
    { 
      where: condition,
      //include: db.recipients
      include: [
        {
          model: db.recipients,
          on: {
            id: db.Sequelize.where(db.Sequelize.col("dtscfs.issuer"), "=", db.Sequelize.col("recipient.id")),
          },
          attributes: ['id','name'],
        },
        {
          model: db.campaigns,
          on: {
            id: db.Sequelize.where(db.Sequelize.col("dtscfs.cashTokenID"), "=", db.Sequelize.col("campaign.id")),
          },
          attributes: ['id', 'name', 'tokenname', 'smartcontractaddress','blockchain'],
        }
      ]
    },
    )
    .then(data => {
      logDataValues("Dtscf.findAll: ", data);

      if (data.length === 0) {
        console.log("Data is empyty!!!");
        res.status(500).send({
          message: "No such record in the system" 
        });
      } else
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving dtscf5a: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving dtscf."
      });
    });
}; // getAllByDtscfId

// Retrieve all Dtscf from the database.
exports.getAll = (req, res) => {
  const name = req.query.name;
  var condition = name ? { name: { [Op.like]: `%${name}%` } } : null;

  Dtscf.findAll(
  {
    include: [
      {
        model: db.recipients,
        on: {
          id: db.Sequelize.where(db.Sequelize.col("dtscf.issuer"), "=", db.Sequelize.col("recipient.id")),
        },
        attributes: ['id','name', 'walletaddress'],
      },
      {
        model: db.campaigns,
        on: {
          id: db.Sequelize.where(db.Sequelize.col("dtscf.cashTokenID"), "=", db.Sequelize.col("campaign.id")),
        },
        attributes: ['id', 'name', 'tokenname', 'smartcontractaddress', 'blockchain'],
      }
    ]
  },
  ).then(data => {
    logDataValues("Dtscf.findAll: ", data);
    res.send(data);
  }).catch(err => {
    res.status(500).send({
      message:
        err.message || "Some error occurred while retrieving dtscf."
    });
  }); // findAll
}; // getAll

exports.getAllDraftsByUserId = (req, res) => {
  const id = req.query.id;
  console.log("====== dtscf.getAllDraftsByUserId(id) ",id);
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

  Dtscf_Draft.findAll( 
    { 
      where: condition,
      //include: db.recipients
    },
    )
    .then(data => {
      logDataValues("Dtscf_Draft.findAll: ", data);
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving dtscf6: "+err.message);
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving dtscf."
      });
    }
  );
}; // getAllDraftsByUserId

exports.getAllDraftsByDtscfId = (req, res) => {
  const id = req.query.id;
  console.log("====== dtscf.getAllDraftsByDtscfId(id) ",id);
  Dtscf_Draft.findByPk(id, {
      include: [
        {
          model: db.dtscf_milestones_draft,
          as: 'dtscf_milestones_drafts'  // Use the plural alias
        },
        {
          model: db.dtscf_contractors_draft,
          as: 'dtscf_contractors_drafts',
          include: [
            {
              model: db.dtscf_contractors_draft,
              as: 'subcontractors'
            },
            {
              model: db.dtscf_purchases_draft,
              as: 'dtscf_purchases_drafts'
            }
          ]
        }
      ]
    })
    .then(data => {
    if (data) {
      logDataValues("Dtscf_Draft.findByPk: ", data);
      res.send(data);
    } else {
      logDataValues("Dtscf_Draft.findByPk: ", data);
      res.status(404).send({
        message: `Cannot find Dtscf draft with id=${id}.`
      });
    }
  })
  .catch(err => {
    console.log("Error while retreiving dtscf draft: "+err.message);
    res.status(500).send({
      message: "Error retrieving Dtscf draft with id=" + id
    });
  });}; // getAllDraftsByDtscfId

// Find a single Dtscf with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  Dtscf.findByPk(id, {
    include: db.recipients,
    include: db.campaigns,
  })
    .then(data => {
      if (data) {
        logDataValues("Dtscf.findByPk: ", data);
        res.send(data);
      } else {
        res.status(404).send({ 
          message: `Cannot find Dtscf with id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving Dtscf with id=" + id
      });
    });
}; // findOne

exports.getAllInvestorsById = (req, res) => {
  const id = req.query.id;
  console.log("In Dtscf.getAllInvestorsById: id=", id);
  let errorSent = false;

  Dtscf.findByPk(id, {
    include: [db.recipients, db.campaigns],
  })
  .then(async data => {
    if (!data) {
      res.status(404).send({ message: `Dtscf with id=${id} not found.` });
      return;
    }

    logDataValues("Dtscf.findByPk: ", data);

    // Load ABI
    const fs = require("fs");
    let ABI;
    try {
      ABI = JSON.parse(fs.readFileSync("./server/app/abis/ERC20Dtscf_new.abi.json").toString());
      console.log("ABI loaded successfully.");
    } catch (err) {
      console.error("Error reading ABI:", err.message);
      res.status(500).send({ message: "Error reading dtscf contract ABI." });
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

    const dtscfTokenAddr = data.smartcontractaddress;
    const dtscfContract = new web3.eth.Contract(ABI, dtscfTokenAddr);
    console.log("Querying token:", dtscfTokenAddr);

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
      // Fetch dtscf config and deployment block
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
          const config = await retryWithBackoff(() => dtscfContract.methods.config(1).call());
          console.log("Config fetched:", config);
          faceValue = Number(config.faceValue) / 1e18; // Scale down by 10^18
          couponRate = Number(config.couponRate);  // in basis points

          // Dates are in seconds, convert to milliseconds for JavaScript Date
          const issueDate = Number(config.issueDate) * 1000; // Seconds to milliseconds
          const maturityDate = Number(config.maturityDate) * 1000;
          const couponInterval = Number(config.couponInterval) * 1000; // Seconds to milliseconds
          const couponCount = Number(await retryWithBackoff(() => dtscfContract.methods.couponCount(1).call()));
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
            const isPaid = await retryWithBackoff(() => dtscfContract.methods.isCouponPaid(1, i).call());
            couponStatuses.push({ couponIndex: i, date: new Date(currentCouponDate).toISOString(), paid: isPaid });
            if (!isPaid && (lowestUnpaidCouponIndex === null || i < lowestUnpaidCouponIndex)) {
              lowestUnpaidCouponIndex = i;
              console.log(`Lowest unpaid coupon index updated to: ${lowestUnpaidCouponIndex}`);
            }
            currentCouponDate += couponInterval;
          }

          // Fetch deployment block via Etherscan
          const fetchString = `https://api${ETHEREUM_NETWORK === 'mainnet' ? '' : '-' + ETHEREUM_NETWORK}.etherscan.io/api` +
            `?module=account&action=txlist&address=${dtscfTokenAddr}&startblock=0&sort=asc&apikey=${ETHERSCAN_API_KEY}`;
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
        const events = await retryWithBackoff( () => dtscfContract.getPastEvents('Transfer', { fromBlock: i, toBlock }),
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
          const isBlacklisted = await retryWithBackoff(() => dtscfContract.methods.isBlacklisted(1, address).call());
          if (!isBlacklisted) {
            const currentBalance = await retryWithBackoff(() => dtscfContract.methods.balanceOf(1, address).call());
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
        res.status(400).send({ message: "Error retrieving dtscf holders. Please try again." });
        errorSent = true;
      }
    }
  })
  .catch(err => {
    console.error("Error retrieving dtscf:", err.message);
    if (!errorSent) {
      res.status(500).send({ message: "Error retrieving dtscf data." });
    }
  });
}; // getAllInvestorsById

exports.submitDraftById = async (req, res) => {  
  const id = req.params.id;
  const draft_id = req.params.id;

  console.log("Received1 submitDraftById:");
  console.log("id=", draft_id);

  upload.any()(req, res, async (err) => {
    if (err) {
      return res.status(500).send({ message: "Error parsing form data" });
    }

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

    console.log("Received for Dtscf draft Update:");
    console.log(req.body);

    try {
      // Parse main project data
      const projectData = {
        name              : req.body.name,
        description       : req.body.description,
        totalBudget       : parseInt(req.body.totalBudget) || 0,
        startdate         : req.body.startdate,
        enddate           : req.body.enddate,
        blockchain        : req.body.blockchain || 0, // Default or from form
        txntype           : 0, // Create
        status            : 1,   // 0 = draft; 1 = created pending review; 2 = reviewed pending approval; 3 = approved
        actionby          : req.body.actionby, // Assuming auth service
        actiontimedate    : new Date(),
        maker             : req.body.maker,
        checker           : req.body.checker,
        approver          : req.body.approver,
        checkerComments   : req.body.checkerComments || '',
        approverComments  : req.body.approverComments || ''
      };

      // Create the draft project
      const draftProject = await Dtscf_Draft.update(projectData, 
      { where:      { id: draft_id }}
      )
      .then(async num => {
        if (num == 1) {
          console.log("Dtscf draft project updated successfully.");

          // Parse and update milestones
          const milestones = JSON.parse(req.body.milestones || '[]');
          for (const ms of milestones) {
            await db.dtscf_milestones_draft.update({
              description: ms.description,
              budget: parseInt(ms.budget) || 0,
              startdate: ms.startdate,
              enddate: ms.enddate,
            },
            { 
              where:      { id: ms.id }
            }
            );
          }

          // Parse and update contractors with purchases
          const contractors = JSON.parse(req.body.contractors || '[]');
          for (const [conIndex, con] of contractors.entries()) {
            const draftContractor = await db.dtscf_contractors_draft.update({
              name: con.name,
              budget: parseInt(con.budget) || 0,
              dtscf_project_id: draft_id,
              dtscf_parent_contractor_id: con.parent_contractor_id || null
            },
            { 
              where:      { id: con.id }
            });

            for (const [purIndex, pur] of con.purchases.entries()) {
              const invoiceField = `contractor_${conIndex}_purchase_${purIndex}_invoice`;
              const invoiceFile = req.files[invoiceField] ? req.files[invoiceField][0] : null;

              await db.dtscf_purchases_draft.update({
                description: pur.description,
                amount: parseFloat(pur.amount) || 0,
                dtscf_project_id: draft_id,
                dtscf_contractor_id: draftContractor.id,
                invoice_blob: invoiceFile ? invoiceFile.buffer : null
              },
              { 
                where:      { id: pur.id }
              });
            }
          }

          // write to audit
          AuditTrail.create(
          { 
            tablename: 'dtscf_draft',
            action: 'update - resubmitted',
            actionby: projectData.actionby,
            actiontimedate: projectData.actiontimedate,
            data: logDataValues(projectData)
          })
          .then(auditres => {
            console.log("Data written to audittrail for resubmitting dtscf request:", auditres);

          })
          .catch(err => {
            console.log("Error while logging to audittrail for resubmitting dtscf request: "+err.message);
          });
          
          res.send({
            message: "Dtscf resubmitted successfully."
          });
        } else {
          res.send({
            message: `${req.body}. Record updated =${num}. Cannot update Dtscf with id=${draft_id}. Maybe Dtscf was not found or req.body is empty!`
          });
        }
      })
      .catch(err => {
        console.log(err);
        res.status(500).send({
          message: `Error updating Dtscf. ${err}`
        });
      }); // await Dtscf_Draft.update()
    } catch (err) {
      console.error(err);
      if (!errorSent) {
        res.status(500).send({
          message: err.message || "Some error occurred while creating the draft."
        });
        errorSent = true;
      }
    }
  });
}; // submitDraftById

exports.acceptDraftById = async (req, res) => {
  
  const id = req.params.id;
  const draft_id = req.params.id;

  console.log("Received2 acceptDraftById:");
  console.log("id=", draft_id);
  console.log(req.body);

  await Dtscf_Draft.update(
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
          action                : "Dtscf "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - accepted",
          name                  : req.body.name,
//          securityname          : req.body.securityname,
          ISIN                  : req.body.ISIN, 
          tokenname             : req.body.tokenname, 
          tokensymbol           : req.body.tokensymbol?.toUpperCase(),
          blockchain            : req.body.blockchain,

//          datafield1_name       : req.body.datafield1_name,
//          datafield1_value      : req.body.datafield1_value,
//          operator1             : req.body.operator1,
//          datafield2_name       : req.body.datafield2_name,
//          datafield2_value      : req.body.datafield2_value,

          facevalue             : (typeof req.body.facevalue === 'string' || req.body.facevalue instanceof String)? parseFloat(req.body.facevalue): req.body.facevalue,
          couponrate            : (typeof req.body.couponrate === 'string' || req.body.couponrate instanceof String)? parseFloat(req.body.couponrate): req.body.couponrate,
          couponinterval        : (typeof req.body.couponinterval === 'string' || req.body.couponinterval instanceof String)? parseInt(req.body.couponinterval): req.body.couponinterval,

          cashTokenID           : req.body.cashTokenID,
          CashTokensmartcontractaddress  : req.body.CashTokensmartcontractaddress,    
          startdate             : req.body.startdate,
          enddate               : req.body.enddate,
          issuer                : req.body.issuer,
          totalsupply           : req.body.totalsupply,
          prospectusurl         : req.body.prospectusurl, // new

          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

          draftdtscfId           : draft_id,
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
        console.log("Data written to audittrail for accepting dtscf request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for accepting dtscf request: "+err.message);
      });
      
      res.send({
        message: "Dtscf was accepted successfully."
      });
    } else {
      res.send({
        message: `${req.body}. Record updated =${num}. Cannot update Dtscf with id=${draft_id}. Maybe Dtscf was not found or req.body is empty!`
      });
    }
  })
  .catch(err => {
    console.log(err);
    res.status(500).send({
      message: `Error updating Dtscf. ${err}`
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

  await Dtscf_Draft.update(
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
          action                : "Dtscf "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - rejected",
          name                  : req.body.name,
//          securityname          : req.body.securityname,
          blockchain            : req.body.blockchain,
        
//          datafield1_name       : req.body.datafield1_name,
//          datafield1_value      : req.body.datafield1_value,
//          operator1             : req.body.operator1,
//          datafield2_name       : req.body.datafield2_name,
//          datafield2_value      : req.body.datafield2_value,

          startdate             : req.body.startdate,
          enddate               : req.body.enddate,

          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

          draftdtscfId           : draft_id,
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
        console.log("Data written to audittrail for rejecting dtscf request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for rejecting dtscf request: "+err.message);
      });
      
      if (!errorSent) {
          res.send({
          message: "Dtscf was rejected."
        });
        errorSent = true;
      }
    } else {
      if (!errorSent) {
        res.send({
          message: `${req.body}. Record updated =${num}. Cannot reject Dtscf with id=${draft_id}. Maybe Dtscf was not found or req.body is empty!`
        });
        errorSent = true;
      }
    }
  })
  .catch(err => {
    console.log(err);
    if (!errorSent) {
      res.status(500).send({
        message: `Error rejecting Dtscf. ${err}`
      });
      errorSent = true;
    }
  });
}; // rejectDraftById

// Update a Dtscf by the id in the request
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
//     ABI = JSON.parse(fs.readFileSync("./server/app/abis/ERC20TokenisedDtscf.abi.json").toString());  // <-- dropdown menu
    ABI = JSON.parse(fs.readFileSync("./server/app/abis/ERC20Dtscf_new.abi.json").toString());

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
        const ERC20TokenisedDtscfcontract = new web3.eth.Contract(ABI);

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
            data: ERC20TokenisedDtscfcontract.methods.updateTotalSupply(
                    1,  // dtscfId
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
                        message: "Timeout after "+TIMEOUT.toString()+" seconds, please check the Dtscf tab after 5 minutes and try again if the Dtscf is not created.",
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
    await Dtscf.update(
      {
          name                  : req.body.name,
//          securityname          : req.body.securityname,
          ISIN                  : req.body.ISIN, 
  // cant update token name once smart contract is deployed
  //    tokenname             : req.body.tokenname, 
  //    tokensymbol           : req.body.tokensymbol.toUpperCase(),
        blockchain            : req.body.blockchain,
      
//        datafield1_name       : req.body.datafield1_name,
//        datafield1_value      : req.body.datafield1_value,
//        operator1             : req.body.operator1,
//        datafield2_name       : req.body.datafield2_name,
//        datafield2_value      : req.body.datafield2_value,

        facevalue             : (typeof req.body.facevalue === 'string' || req.body.facevalue instanceof String)? parseFloat(req.body.facevalue): req.body.facevalue,
        couponrate            : (typeof req.body.couponrate === 'string' || req.body.couponrate instanceof String)? parseFloat(req.body.couponrate): req.body.couponrate,
        couponinterval        : (typeof req.body.couponinterval === 'string' || req.body.couponinterval instanceof String)? parseInt(req.body.couponinterval): req.body.couponinterval,

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
              action                : "Dtscf "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" update request - approved",
              name                  : req.body.name,
//              securityname          : req.body.securityname, 
              ISIN                  : req.body.ISIN, 
              tokenname             : req.body.tokenname, 
              tokensymbol           : req.body.tokensymbol, 
              blockchain            : req.body.blockchain,
            
//              datafield1_name       : req.body.datafield1_name,
//              datafield1_value      : req.body.datafield1_value,
//              operator1             : req.body.operator1,
//              datafield2_name       : req.body.datafield2_name,
//              datafield2_value      : req.body.datafield2_value,
    
              facevalue             : (typeof req.body.facevalue === 'string' || req.body.facevalue instanceof String)? parseFloat(req.body.facevalue): req.body.facevalue,
              couponrate            : (typeof req.body.couponrate === 'string' || req.body.couponrate instanceof String)? parseFloat(req.body.couponrate): req.body.couponrate,
              couponinterval        : (typeof req.body.couponinterval === 'string' || req.body.couponinterval instanceof String)? parseInt(req.body.couponinterval): req.body.couponinterval,

              cashTokenID           : req.body.cashTokenID,
              CashTokensmartcontractaddress  : req.body.CashTokensmartcontractaddress,
        
              startdate             : req.body.startdate,
              enddate               : req.body.enddate,
              issuer                : req.body.issuer,
              totalsupply           : req.body.totalsupply,
              prospectusurl         : req.body.prospectusurl, // new

              txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

              draftdtscfId           : draft_id,
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
            console.log("Data written to audittrail for approving dtscf update request:", auditres);

          })
          .catch(err => {
            console.log("Error while logging to audittrail for approving dtscf update request: "+err.message);
          });

          if (!errorSent) {
            res.send({
              message: "Dtscf was updated successfully."
            });
            errorSent = true;
          }
        } else {
          if (!errorSent) {
            res.send({
              message: `${req.body}. Record updated =${num}. Cannot update Dtscf with id=${id}. Maybe Dtscf was not found or req.body is empty!`
            });
            errorSent = true;
          }
        }
      })
      .catch(err => {
        console.log(err);
        if (!errorSent) {
          res.status(500).send({
            message: `Error updating Dtscf. ${err}`
          });
          errorSent = true;
        }
      });
  } else {
    if (!errorSent) {
      res.status(500).send({
        message: "Error updating Dtscf. "
      });
      errorSent = true;
    }
  }
}; // update

// Delete a Dtscf with the specified id in the request
exports.approveDeleteDraftById = async (req, res) => {
  const draft_id = req.params.id;
  var msgSent = false;

  console.log("Received approveDeleteDraftById:");
  console.log("id=", draft_id);
  console.log(req.body);

  // update draft table
  var Done = await Dtscf_Draft.update(  // update draft table status to "3"
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
          action                : "Dtscf "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - deleted",
          name                  : req.body.name,
//          securityname          : req.body.securityname, 
          ISIN                  : req.body.ISIN, 
          tokenname             : req.body.tokenname, 
          tokensymbol           : req.body.tokensymbol, 
          blockchain            : req.body.blockchain,
        
//          datafield1_name       : req.body.datafield1_name,
//          datafield1_value      : req.body.datafield1_value,
//          operator1             : req.body.operator1,
//          datafield2_name       : req.body.datafield2_name,
//          datafield2_value      : req.body.datafield2_value,

          facevalue             : (typeof req.body.facevalue === 'string' || req.body.facevalue instanceof String)? parseFloat(req.body.facevalue): req.body.facevalue,
          couponrate            : (typeof req.body.couponrate === 'string' || req.body.couponrate instanceof String)? parseFloat(req.body.couponrate): req.body.couponrate,
          couponinterval        : (typeof req.body.couponinterval === 'string' || req.body.couponinterval instanceof String)? parseInt(req.body.couponinterval): req.body.couponinterval,

          cashTokenID           : req.body.cashTokenID,
          CashTokensmartcontractaddress  : req.body.CashTokensmartcontractaddress,    
          startdate             : req.body.startdate,
          enddate               : req.body.enddate,
          issuer                : req.body.issuer,
          totalsupply           : req.body.totalsupply,
          prospectusurl         : req.body.prospectusurl, // new

          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

          draftdtscfId           : draft_id,
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
        console.log("Data written to audittrail for dtscf delete request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for dtscf delete request: "+err.message);
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

  if (Done) await Dtscf.destroy({ // delete entry in approved Dtscf table
    where: { id: req.body.approveddtscfid }
  })
  .then(num => {
    if (num == 1) {
      if (!msgSent) {
        console.log("Sending success dtscf delete to client");
        res.send({
          message: "Dtscf was deleted successfully!"
        });
        msgSent = true;
      }
      return true;
    } else {
      if (!msgSent) {
        res.send({
          message: `Cannot delete Dtscf with id=${req.body.approveddtscfid}. Maybe Dtscf was not found!`
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
        message: 'Error when deleting Dtscf from database, please inform tech support.',
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
  await Dtscf_Draft.update(  // update draft table status to "9" - aborted / dropped requests
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
          action                : "Dtscf "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - dropped",
          name                  : req.body.name,
//          securityname          : req.body.securityname, 
          ISIN                  : req.body.ISIN, 
          tokenname             : req.body.tokenname, 
          tokensymbol           : req.body.tokensymbol, 
          blockchain            : req.body.blockchain,
        
//          datafield1_name       : req.body.datafield1_name,
//          datafield1_value      : req.body.datafield1_value,
//          operator1             : req.body.operator1,
//          datafield2_name       : req.body.datafield2_name,
//          datafield2_value      : req.body.datafield2_value,

          facevalue             : (typeof req.body.facevalue === 'string' || req.body.facevalue instanceof String)? parseFloat(req.body.facevalue): req.body.facevalue,
          couponrate            : (typeof req.body.couponrate === 'string' || req.body.couponrate instanceof String)? parseFloat(req.body.couponrate): req.body.couponrate,
          couponinterval        : (typeof req.body.couponinterval === 'string' || req.body.couponinterval instanceof String)? parseInt(req.body.couponinterval): req.body.couponinterval,

          cashTokenID           : req.body.cashTokenID,
          CashTokensmartcontractaddress  : req.body.CashTokensmartcontractaddress,    
          startdate             : req.body.startdate,
          enddate               : req.body.enddate,
          issuer                : req.body.issuer,
          totalsupply           : req.body.totalsupply,
          prospectusurl         : req.body.prospectusurl, // new

          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

          draftdtscfId           : draft_id,
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
        console.log("Data written to audittrail for dropping dtscf request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for dropping dtscf request: "+err.message);
      });
      
      if (!msgSent) {
        console.log("Sending success dtscf request dropped to client");
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

// Delete a Dtscf with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;
  var errorSent = false;

  console.log(req.body.actionby);

  Dtscf.destroy({
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        if (!errorSent) {
          res.send({
            message: "Dtscf was deleted successfully!"
          });
          errorSent = true;
        }
      } else {
        if (!errorSent) {
          res.send({
            message: `Cannot delete Dtscf with id=${id}. Maybe Dtscf was not found!`
          });
          errorSent = true;
        }
      }
    })
    .catch(err => {
      if (!errorSent) {
        res.status(500).send({
          message: "Could not delete Dtscf with id=" + id
        });
        errorSent = true;
      }
    });
}; // delete

// Delete all Dtscf from the database.
exports.deleteAll = (req, res) => {
  var errorSent = false;

  Dtscf.destroy({
    where: {},
    truncate: false
  })
    .then(nums => {
      res.send({ message: `${nums} Dtscf were deleted successfully!` });
    })
    .catch(err => {
      if (!errorSent) {
        res.status(500).send({
          message:
            err.message || "Some error occurred while removing all dtscf."
        });
        errorSent = true;
      }
    });
}; // deleteAll


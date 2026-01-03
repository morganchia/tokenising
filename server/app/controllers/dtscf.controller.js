const db = require("../models");
const DTSCFProject = db.dtscfprojects;
const AuditTrail = db.audittrail;
const Dtscf_Draft = db.dtscf_draft;
const Dtscf = db.dtscf;
const Milestone = db.milestones;
const Contractor = db.contractors;
const Purchase = db.purchases;
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Assume configured
const Op = db.Sequelize.Op;
const { logDataValues } = require('../utils/logDataValues');

// Absolute paths from __dirname (server/app/controllers)
/*
const smartContractFile = "./server/app/contracts/ERC1155Tokenised_Payable.sol";
const abiFile = "./server/app/abis/ERC1155Tokenised_Payable.abi.json";
const byteCodeFile = "./server/app/abis/ERC1155Tokenised_Payable.bytecode.json";
const smartContractFileName = "ERC1155Tokenised_Payable.sol";
const TokenName = "TokenizedPayable";
*/
const smartContractFile = path.join(__dirname, '../contracts/ERC1155Tokenised_Payable.sol');
const abiFile = path.join(__dirname, '../abis/ERC1155Tokenised_Payable.abi.json');
const byteCodeFile = path.join(__dirname, '../abis/ERC1155Tokenised_Payable.bytecode.json');
const smartContractFileName = "ERC1155Tokenised_Payable.sol";
const TokenName = "TokenizedPayable";
const tokenizedBank_abiFile = path.join(__dirname, '../abis/ERC20TokenDSGD.abi.json');
const tokenizedBank_byteCodeFile = path.join(__dirname, '../abis/ERC20TokenDSGD.bytecode.json');


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

// Recursive function to update or create contractors and subcontractors
async function updateOrCreateContractors(contractors, projectId, files, parentId = null, path = []) {
  for (const [index, con] of contractors.entries()) {
    let contractorId;
    if (con.id) {
      // Update existing
      const num = await db.dtscf_contractors_draft.update({
        name: con.name,
        budget: parseInt(con.budget) || 0,
        walletaddress: con.walletaddress || '',
        dtscf_milestone_id: con.milestone_id || null
      }, { where: { id: con.id } });
      if (num[0] === 1) {
        console.log(`Updated contractor with id=${con.id}`);
      } else {
        console.log(`No changes or cannot update contractor with id=${con.id}. Rows affected: ${num[0]}`);
      }
      contractorId = con.id;
    } else {
      // Create new
      const draftContractor = await db.dtscf_contractors_draft.create({
        name: con.name,
        budget: parseInt(con.budget) || 0,
        walletaddress: con.walletaddress || '',
        dtscf_project_id: projectId,
        dtscf_parent_contractor_id: parentId,
        dtscf_milestone_id: con.milestone_id || null
      });
      console.log(`Created new contractor with id=${draftContractor.id}`);
      contractorId = draftContractor.id;
    }

    const currentPath = [...path, index];

    for (const [purIndex, pur] of (con.purchases || []).entries()) {
      const fieldBase = `contractor_${currentPath.join('_')}_purchase_${purIndex}_invoice`;
      const invoiceFile = files[fieldBase] ? files[fieldBase][0] : null;

      if (pur.id) {
        // Update existing purchase
        const num = await db.dtscf_purchases_draft.update({
          description: pur.description,
          amount: parseFloat(pur.amount) || 0,
          invoice_blob: invoiceFile ? invoiceFile.buffer : undefined  // Skip if no new file
        }, { where: { id: pur.id } });
        if (num[0] === 1) {
          console.log(`Updated purchase with id=${pur.id}`);
        } else {
          console.log(`No changes or cannot update purchase with id=${pur.id}. Rows affected: ${num[0]}`);
        }
      } else {
        // Create new purchase
        const newPurchase = await db.dtscf_purchases_draft.create({
          description: pur.description,
          amount: parseFloat(pur.amount) || 0,
          dtscf_project_id: projectId,
          dtscf_contractor_id: contractorId,
          invoice_blob: invoiceFile ? invoiceFile.buffer : null
        });
        console.log(`Created new purchase with id=${newPurchase.id}`);
      }
    }

    if (con.subcontractors && con.subcontractors.length > 0) {
      await updateOrCreateContractors(con.subcontractors, projectId, files, contractorId, currentPath);
    }
  }
}

// Recursive function to create contractors and subcontractors
async function createContractors(contractors, projectId, files, parentId = null, path = []) {
  for (const [index, con] of contractors.entries()) {
    const draftContractor = await db.dtscf_contractors_draft.create({
      name: con.name,
      budget: parseInt(con.budget) || 0,
      walletaddress: con.walletaddress || '',
      dtscf_project_id: projectId,
      dtscf_parent_contractor_id: parentId,
      dtscf_milestone_id: con.milestone_id || null  // New field for milestone association
    });
    console.log(`Created new contractor with id=${draftContractor.id}`);

    const currentPath = [...path, index];

    for (const [purIndex, pur] of (con.purchases || []).entries()) {
      const fieldBase = `contractor_${currentPath.join('_')}_purchase_${purIndex}_invoice`;
      const invoiceFile = files[fieldBase] ? files[fieldBase][0] : null;

      const newPurchase = await db.dtscf_purchases_draft.create({
        description: pur.description,
        amount: parseFloat(pur.amount) || 0,
        dtscf_project_id: projectId,
        dtscf_contractor_id: draftContractor.id,
        invoice_blob: invoiceFile ? invoiceFile.buffer : null
      });
      console.log(`Created new purchase with id=${newPurchase.id}`);    
    }

    if (con.subcontractors && con.subcontractors.length > 0) {
      await createContractors(con.subcontractors, projectId, files, draftContractor.id, currentPath);
    }
  }
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
        blockchain        : req.body.blockchain || 0, // Default or from form
        underlyingTokenID : req.body.underlyingTokenID || null,
        underlyingDSGDsmartcontractaddress : req.body.underlyingDSGDsmartcontractaddress || '',
        campaign_id        : req.body.campaign_id || null,

        startdate         : req.body.startdate,
        enddate           : req.body.enddate,

        txntype           : 0, // Create
        status            : 1,   // -1 = redo, 0 = draft; 1 = pending checker; 2 = pending approver; 3 = approved
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
          name: ms.name,
          budget: parseInt(ms.budget) || 0,
          startdate: ms.startdate,
          enddate: ms.enddate,
          dtscf_project_id: draftProject.id
        });
      }

      // Parse and create contractors with purchases recursively
      const contractors = JSON.parse(req.body.contractors || '[]');
      await createContractors(contractors, draftProject.id, req.files);

      // Log to audittrail
      await AuditTrail.create({
        action: "Dtscf project draft creation",
        name: projectData.name,
        actionby: projectData.actionby,
        actiontimedate: projectData.actiontimedate,
        //data: logDataValues(draftProject)
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

  const id = req.params.id;
  const checkercomments = req.body.checkerComments || '';

  await Dtscf_Draft.update(
      { 
        checkerComments :   checkercomments,
        status          : 2,   // -1 = redo, 0 = draft; 1 = pending checker; 2 = pending approver; 3 = approved
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

  console.log("Input data for approveDraftById(), ", req.body);

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
  const isNewDtscf = (req.body.txntype === 0? true : false); // Create = true, Edit/Update = false

  console.log("Received approveDraftById for Create/Update:");

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
  const ANCHOR_PRIVATE_KEY = process.env.REACT_APP_ANCHOR_PRIVATE_KEY;
  const ANCHOR_WALLET = process.env.REACT_APP_ANCHOR_WALLET;

  console.log("!!! Signer:", SIGNER_PRIVATE_KEY.substring(0,4)+"..." + SIGNER_PRIVATE_KEY.slice(-3));

      async function compileSmartContract() {
        // solc compiler
        solc = require("solc");
        const solcVersion = 'v0.8.20+commit.a1b79de6';  // Matches pragma ^0.8.20; check https://github.com/ethereum/solc-bin for exact tag

        // file reader
        //fs = require("fs");

        console.log("Reading smart contract file... ");
        file = fs.readFileSync(smartContractFile).toString();
        // console.log(file);

        // input structure for solidity compiler
        const input = {
            language: 'Solidity',
            sources: {
//                'ERC20Dtscf_new.sol': {  
                [smartContractFileName]: {  
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
          let absolutePath;
          if (!relativePath.startsWith('@')) {
            // Local imports (bare filenames or relative paths)
            const mainDir = path.dirname(smartContractFile);
            absolutePath = path.resolve(mainDir, relativePath);
          } else {
            // External libs (e.g., @openzeppelin) from project root's node_modules
            absolutePath = path.resolve(__dirname, '../../../node_modules', relativePath);
          }

          console.log("Reading imported file: ", absolutePath);
          try {
            const source = fs.readFileSync(absolutePath, 'utf8');
            return { contents: source };
          } catch (err) {
            console.error(`Failed to read import: ${relativePath} at ${absolutePath}`, err);
            return { error: 'File not found' };
          }
        }

        return new Promise((resolve, reject) => {
          solc.loadRemoteVersion(solcVersion, (err, solcSnapshot) => {
            if (err) {
              return reject(new Error(`Failed to load solc version ${solcVersion}: ${err.message}`));
            }

            console.log(`Compiling with solc ${solcVersion}...`);
            const outputStr = solcSnapshot.compile(JSON.stringify(input), { import: findImports });
            const output = JSON.parse(outputStr);

            if (output.errors) {
              const severeErrors = output.errors.filter(e => e.severity === 'error');
              if (severeErrors.length > 0) {
                console.error("Compilation errors:", severeErrors);
                return reject(new Error("Compilation failed with errors."));
              }
              console.warn("Compilation warnings:", output.errors);
            }

            if (!output.contracts || !output.contracts[smartContractFileName] || !output.contracts[smartContractFileName][TokenName]) {
              return reject(new Error("No compiled contract found. Check contract name and sources."));
            }

            console.log("Generating bytecode from smart contract file ");
            ABI = output.contracts[smartContractFileName][TokenName].abi;
            bytecode = output.contracts[smartContractFileName][TokenName].evm.bytecode.object;
                    
            fs.writeFileSync(abiFile, JSON.stringify(ABI) , 'utf8', function (err) {
              if (err) {
                console.log("An error occured while writing Dtscf ABI JSON Object to File.");
                return console.log(err);
              }
              console.log("Dtscf ABI JSON file has been saved.");
            });
            fs.writeFileSync(byteCodeFile, JSON.stringify(bytecode) , 'utf8', function (err) {
              if (err) {
                console.log("An error occured while writing Dtscf bytecode JSON Object to File.");
                return console.log(err);
              }
              console.log("Dtscf Bytecode JSON file has been saved.");
            });

            resolve({ ABI, bytecode });
          });
        });

      }

      async function dAppCreate() {
        // Actions:
        // 1. compile Tokenised Payable TP smart contract
        // 2. sign smart contract
        // 3. deploy smart contract
        // 4. keep the new smart contract address
        // 5. allow TP smart contract to pull tokenised deposits TBD from system's wallet
        // 6. call method wrapDepositToPayable() which pulls TBD from system wallet into the TP smart contract

        updatestatus = false;
        //fs = require("fs");

        let ABI, bytecode;
        try {
          if (! (fs.existsSync(abiFile) && fs.existsSync(byteCodeFile))) {
            const compiled = await compileSmartContract();
            ABI = compiled.ABI;
            bytecode = compiled.bytecode;
          } else {
            ABI = JSON.parse(fs.readFileSync(abiFile, 'utf8').toString());
            bytecode = JSON.parse(fs.readFileSync(byteCodeFile, 'utf8').toString());
          }
          console.log("Compilation completed successfully.");
        } catch (err) {
          console.error("Compilation error:", err);
          if (!errorSent) {
            res.status(400).send({ message: "Error compiling Tokenised Payable smart contract. Please check logs and contact tech support." });
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
        const anchor = web3.eth.accounts.privateKeyToAccount(ANCHOR_PRIVATE_KEY);

        web3.setProvider(new Web3.providers.HttpProvider(`https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`));

        console.log("Enddate (unix time) = ", Number(new Date(req.body.enddate)));
        try {

          // Deploy contract
          const deployContract = async () => {

                // Step 1: Validate inputs
                const totalBudget = (typeof req.body.totalBudget === 'string' || req.body.totalBudget instanceof String) ? req.body.totalBudget : req.body.totalBudget.toString();
                const requiredFields = {
                  totalBudget                         : totalBudget,
                  underlyingDSGDsmartcontractaddress  : req.body.underlyingDSGDsmartcontractaddress,
                  enddate                             : req.body.enddate,
                };

                console.log('Proj inputs:', requiredFields);

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

                const stringFields = ['underlyingDSGDsmartcontractaddress'];
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

                const numericFields = ['totalBudget'];
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

                if (isNaN(req.body.totalBudget) || req.body.totalBudget < 0) {
                  console.log("Total budget is invalid: ", req.body.totalBudget);
                  if (!errorSent) {
                    res.status(400).send({
                      message: `Invalid input: totalBudget must be a positive number.`,
                    });
                    errorSent = true;
                  }
                  return false;
                }

                if (!web3.utils.isAddress(requiredFields.underlyingDSGDsmartcontractaddress)) {
                  console.error(`Error: Invalid underlyingDSGDsmartcontractaddress: ${requiredFields.underlyingDSGDsmartcontractaddress}`);
                  if (!errorSent) {
                    res.status(400).send({
                      message: 'Invalid input: underlyingDSGDsmartcontractaddress must be a valid Ethereum address.',
                    });
                    errorSent = true;
                  }
                  return false;
                }

                const startDate = Number(new Date(req.body.startdate));
                const endDate = Number(new Date(req.body.enddate));
                if (isNaN(startDate) || isNaN(endDate) || endDate <= startDate) {
                  console.error(`Error: Invalid dates - startDate: ${req.body.startdate}, endDate: ${req.body.enddate}`);
                  if (!errorSent) {
                    res.status(400).send({
                      message: 'Invalid input: Dates must be valid and maturity date must be after issue date.',
                    });
                    errorSent = true;
                  }
                  return false;
                }

                // Validation for milestones mandatory fields
                console.log("Milestones: ", req.body.milestones);
                let milestones = req.body.milestones || [];
                if (typeof milestones === 'string') {
                  milestones = JSON.parse(milestones);
                }
                for (const ms of milestones) {
                  const requiredMilestoneFields = ['id', 'name', 'budget', 'startdate', 'enddate', 'dtscf_project_id'];
                  for (const field of requiredMilestoneFields) {
                    if (!ms[field] || (typeof ms[field] === 'string' && ms[field].trim() === '')) {
                      throw new Error(`Missing or empty required field '${field}' in milestone '${ms.name || 'unnamed'}'`);
                    }
                  }
                  // Add stricter checks, e.g., if (isNaN(ms.budget) || ms.budget <= 0) throw new Error(...);
                }

                // Validation for contractors mandatory fields (extends existing wallet check)
                console.log("Contractors: ", req.body.contractors);
                let contractors = req.body.contractors || [];
                if (typeof contractors === 'string') {
                  contractors = JSON.parse(contractors);
                }
                for (const con of contractors) {
                  const requiredContractorFields = ['id', 'name', 'budget', 'walletaddress', 'dtscf_project_id'];
                  for (const field of requiredContractorFields) {
                    if (!con[field] || (typeof con[field] === 'string' && con[field].trim() === '')) {
                      throw new Error(`Missing or empty required field '${field}' in contractor '${con.name || 'unnamed'}'`);
                    }
                  }
                  // Validate walletaddress is a valid Ethereum address
                  if (!web3.utils.isAddress(con.walletaddress)) {
                    throw new Error(`Invalid Ethereum wallet address for contractor '${con.name || 'unnamed'}': ${con.walletaddress}`);
                  }
                  // Add stricter checks, e.g., if (isNaN(con.budget) || con.budget <= 0) throw new Error(...);
                }

                // exit first see how
                throw new Error(`exit!!!!!!!!!!!`);

                const dtscfConfig = [
                  req.body.underlyingDSGDsmartcontractaddress,
                  scaleToWei(req.body.totalBudget),
                  Math.floor(Number(new Date(req.body.enddate)) / 1000),
                ];
                console.log('DtscfConfig:', dtscfConfig);


                // Step 2: Prepare for deployment, estimate gas fees

                console.log('Attempting to deploy from account:', signer.address);
                const tokenisedPayableContract = new web3.eth.Contract(ABI);
                const payableDeployTx = tokenisedPayableContract.deploy({
                  data: bytecode,
                  arguments: ['https://tokenising.herokuapp.com/', req.body.underlyingDSGDsmartcontractaddress],
                });

                let gasEstimate = await payableDeployTx.estimateGas({ from: signer.address }).catch((error) => {
                  console.log("Error while estimating Gas fee: ", error);
                  return 2100000;  // default if cannot estimate
                });

                console.log("Initial estimated gas fee: ", gasEstimate);

                const balance = await web3.eth.getBalance(signer.address);
                console.log("Signer balance:", web3.utils.fromWei(balance, "ether"), "ETH");
                if (web3.utils.toBN(balance).lt(web3.utils.toBN(gasEstimate).mul(web3.utils.toBN("1000000000")))) {
                  res.status(400).send({ message: "Insufficient funds for gas." });
                  return false;
                }

                let gasMultiplier = 1.1; // Initial 10% buffer
                const gasIncreaseInterval = 30000; // Increase gas every 30 seconds if pending
                const maxWaitTime = TIMEOUT * 1000; // Total timeout in ms
                let startTime = Date.now();




                // Step 3: Deployment with retry and gas increase
                const deployWithRetry = async () => {
                  let currentGas = Math.floor(gasEstimate * gasMultiplier);
                  console.log(`Attempting deployment with gas: ${currentGas} (multiplier: ${gasMultiplier})`);

                  try {
                    return await retryWithBackoff(async () => {
                      const deployTxData = payableDeployTx.encodeABI();  // Get the encoded deployment data

                      const tx = {
                        from: signer.address,
                        data: deployTxData,
                        gas: currentGas,
                        // Add gasPrice or maxFeePerGas/maxPriorityFeePerGas as needed for the network
                      };

                      const signedTx = await web3.eth.accounts.signTransaction(tx, signer.privateKey);
                      
                      // Await the receipt directly (waits for mining)
                      const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
                      
                      console.log('Deployment receipt:', receipt);
                      
                      if (receipt.status) {
                        newcontractaddress = receipt.contractAddress;
                        updatestatus = true;
                        return true;  // Success
                      } else {
                        throw new Error('Deployment failed (status false)');
                      }
                    }, 3);  // 3 retries
                  } catch (err) {
                    console.error('Deployment attempt failed:', err.message);
                    if (Date.now() - startTime > maxWaitTime) {
                      throw new Error(`Timeout after ${TIMEOUT} seconds`);
                    }
                    gasMultiplier += 0.15;  // Increase for next attempt
                    return await deployWithRetry();  // Recursive retry
                  }
                };

                await deployWithRetry();
          } // deployContract = async ()
          await deployContract();
          
          const wrapDepositToPayable = async () => {
                console.log('Calling wrapDepositToPayable to fund the contract from anchor account');
                
                if (!newcontractaddress) {
                  throw new Error('Contract address not set after deployment');
                }
                
                const tokenizedBankDeposit_ABI = JSON.parse(fs.readFileSync(tokenizedBank_abiFile, 'utf8').toString());
                const depositContract = new web3.eth.Contract(tokenizedBankDeposit_ABI, req.body.underlyingDSGDsmartcontractaddress);
                
                const tokenisedPayableContract = new web3.eth.Contract(ABI, newcontractaddress);

                // Add balance check
                const requiredAmount = web3.utils.toWei(req.body.totalBudget.toString(), 'ether');
                const anchorBalance = await depositContract.methods.balanceOf(anchor.address).call();
                if (web3.utils.toBN(anchorBalance).lt(web3.utils.toBN(requiredAmount))) {
                  throw new Error(`Insufficient DSGD balance in anchor wallet: ${web3.utils.fromWei(anchorBalance, 'ether')} < ${req.body.totalBudget}`);
                }
                console.log(`Anchor DSGD balance sufficient: ${web3.utils.fromWei(anchorBalance, 'ether')}`);

                const gasPrice = await web3.eth.getGasPrice();  
                console.log('Current gas price:', gasPrice);

                // Step 4: Approve (sign and send signed tx)
                const approveGas = await depositContract.methods.approve(newcontractaddress, requiredAmount)
                  .estimateGas({ from: anchor.address })
                  .catch(err => { throw new Error(`Estimate gas for approve failed: ${err.message}`); });
                
                const approveData = depositContract.methods.approve(newcontractaddress, requiredAmount).encodeABI();
                
                const approveTx = {
                  from: anchor.address,
                  to: req.body.underlyingDSGDsmartcontractaddress,
                  data: approveData,
                  gas: Math.floor(approveGas * 1.2),  
                  gasPrice: gasPrice,
                };
                
                const signedApprove = await web3.eth.accounts.signTransaction(approveTx, ANCHOR_PRIVATE_KEY);
                
                const approveReceipt = await web3.eth.sendSignedTransaction(signedApprove.rawTransaction)
                  .catch(err => { throw new Error(`Approve transaction failed: ${err.message}`); });

                console.log("Approved Tokenised Payable contract to pull funds. Receipt:", approveReceipt);

                // Safely parse milestones (assuming first one; adjust if multiple)
                let milestones = req.body.milestones || [];
                if (typeof milestones === 'string') {
                  milestones = JSON.parse(milestones);
                }
                const milestoneId = milestones.length > 0 ? milestones[0].id : 1;  

                // Step 5: Wrap (sign and send signed tx)
                const endDateUnix = Math.floor(new Date(req.body.enddate).getTime() / 1000);
                const wrapGas = await tokenisedPayableContract.methods.wrapDepositToPayable(
                  requiredAmount,
                  endDateUnix,
                  '{"milestone": "structure complete"}',  
                  milestoneId
                ).estimateGas({ from: anchor.address })
                  .catch(err => { throw new Error(`Estimate gas for wrap failed: ${err.message}`); });
                
                const wrapData = tokenisedPayableContract.methods.wrapDepositToPayable(
                  requiredAmount,
                  endDateUnix,
                  '{"milestone": "structure complete"}',
                  milestoneId
                ).encodeABI();
                
                const wrapTx = {
                  from: anchor.address,
                  to: newcontractaddress,
                  data: wrapData,
                  gas: Math.floor(wrapGas * 1.2),  
                  gasPrice: gasPrice,
                };
                
                const signedWrap = await web3.eth.accounts.signTransaction(wrapTx, ANCHOR_PRIVATE_KEY);
                
                const wrapReceipt = await web3.eth.sendSignedTransaction(signedWrap.rawTransaction)
                  .catch(err => { throw new Error(`Wrap transaction failed: ${err.message}`); });

                console.log("Funds wrapped successfully. Receipt:", wrapReceipt);

                // Return needed values for transfer logic
                return { wrapReceipt, gasPrice, tokenisedPayableContract, milestoneId };
          }; // wrapDepositToPayable
          const { wrapReceipt, gasPrice, tokenisedPayableContract, milestoneId } = await wrapDepositToPayable();

          const transferTPtoContractors = async (wrapReceipt, gasPrice, tokenisedPayableContract, milestoneId) => {
                console.log("Transferring Tokenised Payable tokens to contractors as per milestones");
                try {
                  // Fetch all token IDs from the contract (robust alternative to event parsing)
                  const allIds = await tokenisedPayableContract.methods.getAllTokenIds().call();
                  if (allIds.length === 0) {
                    throw new Error('No payable tokens found after wrap - deployment may have failed');
                  }
                  // Assume the last (most recent) ID is the original wrapped one, as contract is new
                  let originalId = allIds[allIds.length - 1];
                  console.log(`Original payable ID: ${originalId}`);

                  // Parse contractors to calculate and split/transfer portions
                  let contractors = req.body.contractors || [];
                  if (typeof contractors === 'string') {
                    contractors = JSON.parse(contractors);
                  }

                  for (const con of contractors) {
                    let contractorAmount = 0;
                    for (const pur of con.purchases || []) {
                      contractorAmount += parseFloat(pur.amount) || 0;
                    }
                    const amountWei = web3.utils.toWei(contractorAmount.toString(), 'ether');

                    if (web3.utils.toBN(amountWei).gt(0)) {
                      if (!con.walletaddress) {
                        throw new Error(`Contractor wallet address not found for ${con.name}`);
                      }

                      // Step 1: Split to create new payable with contractor's amount
                      const splitGas = await tokenisedPayableContract.methods.splitPayable(originalId, amountWei)
                        .estimateGas({ from: anchor.address })
                        .catch(err => { throw new Error(`Estimate gas for split failed: ${err.message}`); });
                      
                      const splitData = tokenisedPayableContract.methods.splitPayable(originalId, amountWei).encodeABI();
                      
                      const splitTx = {
                        from: anchor.address,
                        to: newcontractaddress,
                        data: splitData,
                        gas: Math.floor(splitGas * 1.2),
                        gasPrice: gasPrice,
                      };
                      
                      const signedSplit = await web3.eth.accounts.signTransaction(splitTx, ANCHOR_PRIVATE_KEY);
                      
                      const splitReceipt = await web3.eth.sendSignedTransaction(signedSplit.rawTransaction)
                        .catch(err => { throw new Error(`Split transaction failed: ${err.message}`); });

                      // Extract newId from PayableSplit event in splitReceipt
                      let newId;
                      for (const log of splitReceipt.logs) {
                        if (log.topics[0] === web3.utils.keccak256('PayableSplit(uint256,uint256,uint256)')) {
                          const decoded = web3.eth.abi.decodeLog([
                            { type: 'uint256', name: 'originalId', indexed: true },
                            { type: 'uint256', name: 'newId' },
                            { type: 'uint256', name: 'splitValue' }
                          ], log.data, log.topics);
                          newId = decoded.newId;
                          break;
                        }
                      }
                      if (!newId) {
                        throw new Error('Failed to extract new payable ID from split receipt');
                      }
                      console.log(`Split new payable ID ${newId} with value ${contractorAmount} for contractor ${con.name}`);

                      // Step 2: Transfer the new payable (amount=1) to contractor
                      const transferGas = await tokenisedPayableContract.methods.safeTransferFrom(
                        anchor.address,
                        con.walletaddress,
                        newId,
                        1,
                        '0x'
                      ).estimateGas({ from: anchor.address })
                        .catch(err => { throw new Error(`Estimate gas for transfer failed: ${err.message}`); });
                      
                      const transferData = tokenisedPayableContract.methods.safeTransferFrom(
                        anchor.address,
                        con.walletaddress,
                        newId,
                        1,
                        '0x'
                      ).encodeABI();
                      
                      const transferTx = {
                        from: anchor.address,
                        to: newcontractaddress,
                        data: transferData,
                        gas: Math.floor(transferGas * 1.2),
                        gasPrice: gasPrice,
                      };
                      
                      const signedTransfer = await web3.eth.accounts.signTransaction(transferTx, ANCHOR_PRIVATE_KEY);
                      
                      const transferReceipt = await web3.eth.sendSignedTransaction(signedTransfer.rawTransaction)
                        .catch(err => { throw new Error(`Transfer transaction failed: ${err.message}`); });

                      console.log(`Transferred payable ID ${newId} (${contractorAmount} value) to contractor ${con.name}. Receipt:`, transferReceipt);
                    }
                  }
                } catch (err) {
                  console.error('Error in transferTPtoContractors:', err.message);
                  throw err;
                }
          };  // transferTPtoContractors
          await transferTPtoContractors(wrapReceipt, gasPrice, tokenisedPayableContract, milestoneId);

        } catch (error) {
          console.error('Error in dAppCreate:', error);
          if (!errorSent) {
            res.status(500).send({ message: "Error during contract deployment: " + error.message });
            errorSent = true;
          }
          return false;
        }
        return updatestatus;
      } //dAppCreate

      async function dAppUpdate() {
        updatestatus = false;
   
        // Readng ABI from JSON file
        fs = require("fs");
        ABI = JSON.parse(fs.readFileSync(abiFile).toString());
    
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
            const tokenisedPayableContract = new web3.eth.Contract(ABI);
    
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
                data: tokenisedPayableContract.methods.updateTotalSupply(
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
  console.log("*** req.body.underlyingDSGDsmartcontractaddress = ", req.body.underlyingDSGDsmartcontractaddress);

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
          totalBudget           : parseInt(req.body.totalBudget) || 0,
          blockchain            : req.body.blockchain || 0, // Default or from form
          underlyingTokenID     : req.body.underlyingTokenID || null,
          underlyingDSGDsmartcontractaddress : req.body.underlyingDSGDsmartcontractaddress || '',
          smartcontractaddress  : newcontractaddress,

          campaign_id           : req.body.campaign_id || null,

          startdate             : req.body.startdate, 
          enddate               : req.body.enddate,
          
          actionby              : req.body.actionby,
          draftdtscfid          : req.body.id,             
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
        totalBudget           : parseInt(req.body.totalBudget) || 0,
        blockchain            : req.body.blockchain || 0, // Default or from form
        underlyingTokenID     : req.body.underlyingTokenID || null,
        underlyingDSGDsmartcontractaddress : req.body.underlyingDSGDsmartcontractaddress || '',
        campaign_id           : req.body.campaign_id || null,

        startdate             : req.body.startdate, 
        enddate               : req.body.enddate,
        
        actionby              : req.body.actionby,
        draftdtscfid          : req.body.id,             
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
      ABI = JSON.parse(fs.readFileSync(abiFile).toString());
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
    status : [-1, 0, 1, 2]  // -1 = redo, 0 = draft; 1 = pending checker; 2 = pending approver; 3 = approved
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
    status : [-1, 0, 1, 2]  // status -1=redo, 0, drafted not submitted, 1=pending checker, 2=pending approver, 3=approved
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

    if (!data || data.length === 0) {
      return res.status(404).send({
        message: `Dtscf with id=${Id} not found`
      });
    }

    //console.log("Qery result fo DATA:", data[0].id);

    /// Query blockchain
    // Readng ABI from JSON file
    fs = require("fs");
    ABI = JSON.parse(fs.readFileSync(abiFile).toString());  // <-- dropdown menu

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
exports.findByName = async (req, res) => {
  const name = req.query.name;
  var condition = name ? { name: { [Op.like]: `%${name}%` } } : null;  
  
  try {
    console.log("====== dtscf.findByName() ");

    const dtscfs = await Dtscf.findAll({
        where: condition,
        include: 
          [
            {
              model: db.recipients,
              as: 'anchor',
              attributes: ['name']
            },
            {
              model: db.campaigns,
              as: 'underlyingToken',
              attributes: ['tokenname']
            }
          ]
    });

    const formattedData = dtscfs.map(dtscf => {
      const json = dtscf.toJSON();
      json.anchorName = dtscf.anchor ? dtscf.anchor.name : null;
      json.tokenName = dtscf.underlyingToken ? dtscf.underlyingToken.tokenname : null;
      delete json.anchor;
      delete json.underlyingToken;
      return json;
    });

    logDataValues("Dtscf.findAll: ", formattedData);
    res.send(formattedData);
  } catch (err) {
    console.log("Error while retrieving findByName: "+err.message);
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving dtscf project records."
    });
  }
}; // findByName

exports.getAllByDtscfId = async (req, res) => {
  const id = req.query.id;
  console.log("====== dtscf.getAllByDtscfId(id) ",id);

  if (!id) {
    console.log("ID is required for fetching record.");
    return res.status(400).send({ message: "ID is required" });
  }
  const rec = await Dtscf.findByPk(id, {
    include: [
      { model: db.dtscf_milestones, as: 'dtscf_milestones' }
    ]
  });

  if (!rec) {
    return res.status(404).send({ message: "Record not found" });
  }

  const allContractors = await db.dtscf_contractors.findAll({
    where: { dtscf_project_id: id },
    include: { model: db.dtscf_purchases, as: 'dtscf_purchases' }
  });

  const contractorMap = {};
  allContractors.forEach(con => {
    con.dataValues.subcontractors = [];  // Add dataValues for plain object
    contractorMap[con.id] = con;
  });

  const topLevel = [];
  allContractors.forEach(con => {
    if (con.dtscf_parent_contractor_id) {
      if (contractorMap[con.dtscf_parent_contractor_id]) {
        contractorMap[con.dtscf_parent_contractor_id].dataValues.subcontractors.push(con);
      }
    } else {
      topLevel.push(con);
    }
  });

  rec.dataValues.dtscf_contractors = topLevel;

  res.send(rec);

}; // getAllByDtscfId

// Retrieve all Dtscf from the database.
exports.getAll = async (req, res) => {
  try {
    console.log("====== dtscf.getAll() ");

    const dtscfs = await Dtscf.findAll({
    include: 
      [
        {
          model: db.recipients,
          as: 'anchor',
          attributes: ['name']
        },
        {
          model: db.campaigns,
          as: 'underlyingToken',
          attributes: ['tokenname']
        }
      ]
    });

    const formattedData = dtscfs.map(dtscf => {
      const json = dtscf.toJSON();
      json.anchorName = dtscf.anchor ? dtscf.anchor.name : null;
      json.tokenName = dtscf.underlyingToken ? dtscf.underlyingToken.tokenname : null;
      delete json.anchor;
      delete json.underlyingToken;
      return json;
    });

    logDataValues("Dtscf.findAll: ", formattedData);
    res.send(formattedData);
  } catch (err) {
    console.log("Error while retrieving dtscf4: "+err.message);
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving dtscf project records."
    });
  }
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

exports.getAllDraftsByDtscfId = async (req, res) => {
  const id = req.query.id;
  console.log("====== dtscf.getAllDraftsByDtscfId(id) ",id);
  if (!id) {
    console.log("ID is required for fetching drafts.");
    return res.status(400).send({ message: "ID is required" });
  }
  const draft = await Dtscf_Draft.findByPk(id, {
    include: [
      { model: db.dtscf_milestones_draft, as: 'dtscf_milestones_drafts' }
    ]
  });

  if (!draft) {
    return res.status(404).send({ message: "Draft not found" });
  }

  const allContractors = await db.dtscf_contractors_draft.findAll({
    where: { dtscf_project_id: id },
    include: { model: db.dtscf_purchases_draft, as: 'dtscf_purchases_drafts' }
  });

  const contractorMap = {};
  allContractors.forEach(con => {
    con.dataValues.subcontractors = [];  // Add dataValues for plain object
    contractorMap[con.id] = con;
  });

  const topLevel = [];
  allContractors.forEach(con => {
    if (con.dtscf_parent_contractor_id) {
      if (contractorMap[con.dtscf_parent_contractor_id]) {
        contractorMap[con.dtscf_parent_contractor_id].dataValues.subcontractors.push(con);
      }
    } else {
      topLevel.push(con);
    }
  });

  draft.dataValues.dtscf_contractors_drafts = topLevel;

  res.send(draft);
}; // getAllDraftsByDtscfId

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
      ABI = JSON.parse(fs.readFileSync(abiFile).toString());
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
          const startDate = Number(config.startDate) * 1000; // Seconds to milliseconds
          const endDate = Number(config.endDate) * 1000;
          const couponInterval = Number(config.couponInterval) * 1000; // Seconds to milliseconds
          const couponCount = Number(await retryWithBackoff(() => dtscfContract.methods.couponCount(1).call()));
          console.log("couponCount:", couponCount);
          console.log("startDate (seconds):", config.startDate, "=>", new Date(startDate).toISOString());
          console.log("endDate (seconds):", config.endDate, "=>", new Date(endDate).toISOString());
          console.log("couponInterval (seconds):", config.couponInterval);

          // Calculate coupon dates
          let currentCouponDate = startDate + couponInterval; // First coupon date after issue date
          for (let i = 0; i < couponCount && currentCouponDate <= endDate; i++) {
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

// Recursive function for update or create contractors
async function updateOrCreateContractors(contractors, projectId, files, parentId = null, path = []) {
  for (const [index, con] of contractors.entries()) {
    let contractorId;
    if (con.id) {
      // Update existing
      await db.dtscf_contractors_draft.update({
        name: con.name,
        budget: parseInt(con.budget) || 0,
        walletaddress: con.walletaddress || '',
      }, { where: { id: con.id } });
      contractorId = con.id;
    } else {
      // Create new
      const draftContractor = await db.dtscf_contractors_draft.create({
        name: con.name,
        budget: parseInt(con.budget) || 0,
        walletaddress: con.walletaddress || '',
        dtscf_project_id: projectId,
        dtscf_parent_contractor_id: parentId
      });
      contractorId = draftContractor.id;
    }

    const currentPath = [...path, index];

    for (const [purIndex, pur] of (con.purchases || []).entries()) {
      const fieldBase = `contractor_${currentPath.join('_')}_purchase_${purIndex}_invoice`;
      const invoiceFile = files[fieldBase] ? files[fieldBase][0] : null;

      if (pur.id) {
        // Update existing purchase
        const num = await db.dtscf_purchases_draft.update({
          description: pur.description,
          amount: parseFloat(pur.amount) || 0,
          invoice_blob: invoiceFile ? invoiceFile.buffer : undefined  // Skip if no new file
        }, { where: { id: pur.id } });
        if (num[0] === 1) {
          console.log(`Updated purchase with id=${pur.id}`);
        } else {
          console.log(`No changes or cannot update purchase with id=${pur.id}. Rows affected: ${num[0]}`);
        }      } else {
        // Create new purchase
        const newPurchase = await db.dtscf_purchases_draft.create({
          description: pur.description,
          amount: parseFloat(pur.amount) || 0,
          dtscf_project_id: projectId,
          dtscf_contractor_id: contractorId,
          invoice_blob: invoiceFile ? invoiceFile.buffer : null
        });
        console.log(`Created new purchase with id=${newPurchase.id}`);      }
    }

    if (con.subcontractors && con.subcontractors.length > 0) {
      await updateOrCreateContractors(con.subcontractors, projectId, files, contractorId, currentPath);
    }
  }
}

exports.submitDraftById = async (req, res) => {
  upload.any()(req, res, async (err) => {
    if (err) {
      return res.status(500).send({ message: "Error parsing form data" });
    }

    var errorSent = false;

    const draft_id = req.params.id;

    if (!req.body.name) {
      if (!errorSent) {
        res.status(400).send({
          message: "Content can not be empty!"
        });
        errorSent = true;
      }
      return;
    }

    console.log("Received1 submitDraftById:");
    console.log("id=",req.params.id);
    console.log("Received for Dtscf draft Update:");
    console.log(req.body);

    try {
      // Update the draft project
      await Dtscf_Draft.update(
        {
          name              : req.body.name,
          description       : req.body.description,
          totalBudget       : parseInt(req.body.totalBudget) || 0,
          blockchain        : req.body.blockchain || 0, // Default or from form
          underlyingTokenID : req.body.underlyingTokenID || null,
          underlyingDSGDsmartcontractaddress : req.body.underlyingDSGDsmartcontractaddress || '',
          campaign_id        : req.body.campaign_id || null,
          startdate         : req.body.startdate,
          enddate           : req.body.enddate,
          txntype           : req.body.txntype, // Create
          status            : 1,   // -1 = redo, 0 = draft; 1 = pending checker; 2 = pending approver; 3 = approved
          actionby          : req.body.actionby, // Assuming auth service
          actiontimedate    : new Date(),
          maker             : req.body.maker,
          checker           : req.body.checker,
          approver          : req.body.approver,
          checkerComments   : req.body.checkerComments || '',
          approverComments  : req.body.approverComments || ''
        },
        { where: { id: draft_id } }
      );

      console.log("Dtscf draft project updated successfully.");

      // Parse and update/create milestones
      const milestones = JSON.parse(req.body.milestones || '[]');
      for (const ms of milestones) {
        if (ms.id) {
          await db.dtscf_milestones_draft.update({
            name: ms.name,
            budget: parseInt(ms.budget) || 0,
            startdate: ms.startdate,
            enddate: ms.enddate,
          }, { where: { id: ms.id } });
        } else {
          await db.dtscf_milestones_draft.create({
            name: ms.name,
            budget: parseInt(ms.budget) || 0,
            startdate: ms.startdate,
            enddate: ms.enddate,
            dtscf_project_id: draft_id
          });
        }
      }

// Parse and update/create contractors with purchases recursively
      const contractors = JSON.parse(req.body.contractors || '[]');
      await updateOrCreateContractors(contractors, draft_id, req.files);

      // Log to audittrail
      await AuditTrail.create({
        action: req.body.txntype===0?"create - resubmitted":req.body.txntype===1?"update - resubmitted":req.body.txntype===2?"delete - resubmitted":"",
        name: req.body.name,
        totalBudget: req.body.totalBudget,
        blockchain: req.body.blockchain || 0,
        underlyingTokenID: req.body.underlyingTokenID || null,
        underlyingDSGDsmartcontractaddress: req.body.underlyingDSGDsmartcontractaddress || '',
        campaign_id: req.body.campaign_id || null,
        startdate: req.body.startdate,
        enddate: req.body.enddate,
        txntype: req.body.txntype,
        draftdtscfId: draft_id,
        maker: req.body.maker,
        checker: req.body.checker,
        approver: req.body.approver,
        actionby: req.body.actionby,
        checkerComments: req.body.checkerComments,
        approverComments: req.body.approverComments,
        status: 1,   // pending checker
      })
      .then(auditres => {
        console.log("Data written to audittrail for resubmitting dtscf request:", auditres);
      })
      .catch(err => {
        console.log("Error while logging to audittrail for resubmitting dtscf request: "+err.message);
      });

      res.send({
        message: "Dtscf draft updated successfully."
      });
    } catch (err) {
      console.error(err);
      if (!errorSent) {
        res.status(500).send({
          message: err.message || "Some error occurred while updating the draft."
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
          totalBudget           : req.body.totalBudget,
          blockchain            : req.body.blockchain || 0, // Default or from form
          underlyingTokenID     : req.body.underlyingTokenID || null,
          underlyingDSGDsmartcontractaddress : req.body.underlyingDSGDsmartcontractaddress || '',
          campaign_id           : req.body.campaign_id || null,

          startdate             : req.body.startdate, 
          enddate               : req.body.enddate,

          maker                 : req.body.maker,
          checker               : req.body.checker,
          approver              : req.body.approver,
          actionby              : req.body.actionby,
          checkerComments       : req.body.checkerComments,
          approverComments      : req.body.approverComments,
          status                : 2,   // -1 = redo, 0 = draft; 1 = pending checker; 2 = pending approver; 3 = approved
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
          blockchain            : req.body.blockchain,
        
          startdate             : req.body.startdate,
          enddate               : req.body.enddate,

          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

          maker                 : req.body.maker,
          checker               : req.body.checker,
          approver              : req.body.approver,
          actionby              : req.body.actionby,
          checkerComments       : req.body.checkerComments,
          approverComments      : req.body.approverComments,
          status                : -1,   // -1 = redo, 0 = draft; 1 = pending checker; 2 = pending approver; 3 = approved
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

  console.log("!!! Signer:", SIGNER_PRIVATE_KEY.substring(0,4)+"..." + SIGNER_PRIVATE_KEY.slice(-3));

  async function dAppUpdate() {

    updatestatus = false;

    // Readng ABI from JSON file
    fs = require("fs");
    ABI = JSON.parse(fs.readFileSync(abiFile).toString());

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
        const tokenisedPayableContract = new web3.eth.Contract(ABI);

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
            data: tokenisedPayableContract.methods.updateTotalSupply(
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
        blockchain            : req.body.blockchain || 0, // Default or from form
        underlyingTokenID     : req.body.underlyingTokenID || null,
        underlyingDSGDsmartcontractaddress : req.body.underlyingDSGDsmartcontractaddress || '',
        campaign_id           : req.body.campaign_id || null,
        totalBudget           : req.body.totalBudget,

        startdate             : req.body.startdate, 
        enddate               : req.body.enddate,
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
              totalBudget           : req.body.totalBudget,
              blockchain            : req.body.blockchain || 0, // Default or from form
              underlyingTokenID     : req.body.underlyingTokenID || null,
              underlyingDSGDsmartcontractaddress : req.body.underlyingDSGDsmartcontractaddress || '',
              campaign_id           : req.body.campaign_id || null,

              startdate             : req.body.startdate, 
              enddate               : req.body.enddate,
              
              txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

              draftdtscfId          : draft_id,
              maker                 : req.body.maker,
              checker               : req.body.checker,
              approver              : req.body.approver,
              actionby              : req.body.actionby,
              checkerComments       : req.body.checkerComments,
              approverComments      : req.body.approverComments,
              status                : 3,   // -1 = redo, 0 = draft; 1 = pending checker; 2 = pending approver; 3 = approved
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
          totalBudget           : req.body.totalBudget,
          blockchain            : req.body.blockchain || 0, // Default or from form
          underlyingTokenID     : req.body.underlyingTokenID || null,
          underlyingDSGDsmartcontractaddress : req.body.underlyingDSGDsmartcontractaddress || '',
          campaign_id           : req.body.campaign_id || null,

          startdate             : req.body.startdate, 
          enddate               : req.body.enddate,
          
          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

          maker                 : req.body.maker,
          checker               : req.body.checker,
          approver              : req.body.approver,
          actionby              : req.body.actionby,
          checkerComments       : req.body.checkerComments,
          approverComments      : req.body.approverComments,
          status                : 3,   // -1 = redo, 0 = draft; 1 = pending checker; 2 = pending approver; 3 = approved
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
          totalBudget           : req.body.totalBudget,
          blockchain            : req.body.blockchain || 0, // Default or from form
          underlyingTokenID     : req.body.underlyingTokenID || null,
          underlyingDSGDsmartcontractaddress : req.body.underlyingDSGDsmartcontractaddress || '',
          campaign_id           : req.body.campaign_id || null,

          startdate             : req.body.startdate, 
          enddate               : req.body.enddate,
          
          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

          maker                 : req.body.maker,
          checker               : req.body.checker,
          approver              : req.body.approver,
          actionby              : req.body.actionby,
          checkerComments       : req.body.checkerComments,
          approverComments      : req.body.approverComments,
          status                : 9,   // -1 = redo, 0 = draft; 1 = pending checker; 2 = pending approver; 3 = approved
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


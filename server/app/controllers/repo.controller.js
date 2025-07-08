const { request } = require("http");
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
      startdatetime         : req.body.startdatetime,   // sent in datetime in SGT, but this func auto convert and write in UTC
      enddatetime           : req.body.enddatetime,     // sent in datetime in SGT, but this func auto convert and write in UTC
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
      daycountconvention    : req.body.daycountconvention, 
      blockchain            : req.body.blockchain,

      txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

      maker                 : req.body.maker,
      checker               : req.body.checker,
      approver              : req.body.approver,
      actionby              : req.body.actionby,
      approvedrepoid        : req.body.approvedrepoid,
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
        daycountconvention    : req.body.daycountconvention, 
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

  const id = req.params.id;
  console.log("Received for Repo Review:");
  console.log(req.body);

  await Repo_Draft.update(
    { 
      checkerComments: req.body.checkerComments,
      status: 2 // 0 = draft; 1 = created pending review; 2 = reviewed pending approval; 3 = approved
    }, 
    { where: { id: id } }
  )
  .then(num => {
    if (num == 1) {
      res.send({
        message: "Repo status has been updated successfully."
      });
    } else {
      res.send({
        message: `Record updated =${num}. Cannot update Repo with id=${id}. Maybe Repo was not found or req.body is empty!`
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

// approveDraftById function 
exports.approveDraftById = async (req, res) => {
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
    solc = require("solc");
    fs = require("fs");

    console.log("Reading smart contract file... ");
    file = fs.readFileSync("./server/app/contracts/ERC20TokenRepo.sol").toString();

    // input structure for solidity compiler
    var input = {
      language: "Solidity",
      sources: {
        "ERC20TokenRepo.sol": {
          content: file,
        },
      },
      settings: {
        optimizer: {     // to avoid "Stack too deep" error
          enabled: true, // Enable optimizer to reduce stack depth
          runs: 200,     // Optimize for 200 runs
        },
        viaIR: true,     // Enable IR-based compilation to avoid stack issues
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
      const absolutePath = path.resolve(__dirname, '../../../node_modules', relativePath);
      const source = fs.readFileSync(absolutePath, 'utf8');
      console.log("Reading file: ", absolutePath);
      return { contents: source };
    }
      
    console.log("Compiling smart contract file... ");
    var output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
    // Check for compilation errors
    if (output.errors && output.errors.some(error => error.severity === 'error')) {
      console.error("Compilation errors:", output.errors);
      throw new Error("Smart contract compilation failed");
    }
    
    console.log("Compilation done... ");
    console.log("Generating bytecode from smart contract file ");
    ABI = output.contracts["ERC20TokenRepo.sol"]["ERC20TokenRepo"].abi;
    bytecode = output.contracts["ERC20TokenRepo.sol"]["ERC20TokenRepo"].evm.bytecode.object;

    await fs.writeFile("./server/app/abis/ERC20TokenRepo.abi.json", JSON.stringify(ABI), 'utf8', function (err) {
      if (err) {
        console.log("An error occurred while writing Repo ABI JSON Object to File.");
        throw err;
      }
      console.log("Repo ABI JSON file has been saved.");
    });
    await fs.writeFile("./server/app/abis/ERC20TokenRepo.bytecode.json", JSON.stringify(bytecode), 'utf8', function (err) {
      if (err) {
        console.log("An error occurred while writing Repo bytecode JSON Object to File.");
        throw err;
      }
      console.log("Repo Bytecode JSON file has been saved.");
    });
  }

  async function dAppCreate() {
    var errorSent = false;
    updatestatus = false;

    fs = require("fs");

    console.log("Compiling smart contract...");
    await compileSmartContract();

    // Creation of Web3 class
    Web3 = require("web3");

    // Validate environment variables
    if (!ETHEREUM_NETWORK || !INFURA_API_KEY) {
      console.error("Missing ETHEREUM_NETWORK or INFURA_API_KEY environment variables");
      if (!errorSent) {
        res.status(500).send({ 
          message: "Server configuration error: Missing ETHEREUM_NETWORK or INFURA_API_KEY"
        });
        errorSent = true;
      }
      return false;
    }

    // Initialize Web3 provider
    const providerUrl = `https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`;
    console.log("Initializing Web3 provider with URL:", providerUrl.replace(INFURA_API_KEY, '****'));

    try {
      web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));
      
      // Test provider connection
      await web3.eth.getNodeInfo();
      console.log("Web3 provider connected successfully");
    } catch (err) {
      console.error("Failed to connect to Web3 provider:", err);
      if (!errorSent) {
        res.status(500).send({ 
          message: "Failed to connect to Ethereum network: " + err.message
        });
        errorSent = true;
      }
      return false;
    }

    console.log("!!! Signer:", SIGNER_PRIVATE_KEY.substring(0,4)+"..." + SIGNER_PRIVATE_KEY.slice(-3));
    const signer = web3.eth.accounts.privateKeyToAccount(SIGNER_PRIVATE_KEY)
    console.log("req.body = ", req.body);

    console.log("Startdate (unix time) = ", Number(new Date(req.body.startdate)));
    console.log("Enddate   (unix time) = ", Number(new Date(req.body.enddate)));
    try {
      // Validate inputs
      if (!req.body.amount1 || !req.body.amount2 || isNaN(parseFloat(req.body.amount1)) || isNaN(parseFloat(req.body.amount2))) {
        throw new Error("Invalid amount1 or amount2");
      }

      // Convert amounts to Wei using web3.utils.toWei
      const this_amount1 = web3.utils.toWei(req.body.amount1.toString(), "ether");
      const this_amount2 = web3.utils.toWei(req.body.amount2.toString(), "ether");

      console.log("this_amount1 (Wei): ", this_amount1);
      console.log("this_amount2 (Wei): ", this_amount2);

      const ERC20TokenRepoContract = new web3.eth.Contract(ABI);

      // Deploy contract
      const deployContract = async () => {
        console.log('Creating trade parameters in Repo contract...');
        console.log('createTrade req.body:', JSON.stringify(req.body, null, 2));

        // Validate all required inputs
        const requiredFields = [
          'startdate', 'starttime', 'enddate', 'endtime', 'bondisin',
          'securityLB', 'startamount', 'interestamount',
          'counterparty1', 'counterparty2', 'smartcontractaddress1', 'smartcontractaddress2'
        ];
        for (const field of requiredFields) {
          if (!req.body[field]) {
            throw new Error(`Missing required field: ${field}`);
          }
        }

        // Validate time inputs
        if (!req.body.starttime.match(/^\d{2}:\d{2}(:\d{2})?$/) || !req.body.endtime.match(/^\d{2}:\d{2}(:\d{2})?$/)) {
          throw new Error("Invalid time format for starttime or endtime (expected HH:MM or HH:MM:SS)");
        }

        // Validate addresses
        if (!web3.utils.isAddress(req.body.counterparty1) || !web3.utils.isAddress(req.body.counterparty2)) {
          throw new Error('Invalid counterparty addresses');
        }
        if (!web3.utils.isAddress(req.body.smartcontractaddress1) || !web3.utils.isAddress(req.body.smartcontractaddress2)) {
          throw new Error('Invalid token addresses');
        }

        // Validate numeric fields
        if (isNaN(parseFloat(req.body.startamount)) || isNaN(parseFloat(req.body.interestamount))) {
          throw new Error("Invalid startamount or interestamount");
        }

        // Convert SGT time to UTC
        const startDateTimeSGT = Math.floor(new Date(req.body.startdate).getTime() / 1000) + parseInt(req.body.starttime.split(':')[0]) * 3600 + parseInt(req.body.starttime.split(':')[1]) * 60;
        const maturityDateTimeSGT = Math.floor(new Date(req.body.enddate).getTime() / 1000) + parseInt(req.body.endtime.split(':')[0]) * 3600 + parseInt(req.body.endtime.split(':')[1]) * 60;
        const SGT_OFFSET = 8 * 3600; // SGT is UTC+8
        const startDateTimeUTC = startDateTimeSGT - SGT_OFFSET;
        const maturityDateTimeUTC = maturityDateTimeSGT - SGT_OFFSET;

        const tradeInput = {
          startDateTime: startDateTimeUTC,
          maturityDateTime: maturityDateTimeUTC,
          bondIsin: req.body.bondisin,
          counterparty1RepoType: (req.body.securityLB === "B" ? 0 : 1), // RepoType: 0=Repo, 1=ReverseRepo
          bondAmount: (req.body.securityLB === "B" ? this_amount1 : this_amount2),
          startAmount: web3.utils.toWei(req.body.startamount.toString(), 'ether'),
          interestAmount: web3.utils.toWei(req.body.interestamount.toString(), 'ether'),
          cashAmount: (req.body.securityLB === "B" ? this_amount2 : this_amount1),
          counterparty1: req.body.counterparty1,
          counterparty2: req.body.counterparty2,
          cashToken: (req.body.securityLB === "B" ? req.body.smartcontractaddress2 : req.body.smartcontractaddress1),
          bondToken: (req.body.securityLB === "B" ? req.body.smartcontractaddress1 : req.body.smartcontractaddress2),
        };

        console.log('Attempting to deploy from account:', signer.address);
        let nonce = await web3.eth.getTransactionCount(signer.address, "pending");
        const deployTx = ERC20TokenRepoContract.deploy({ data: bytecode, arguments: [tradeInput] });  
        let gasFees;
        try {
          gasFees = await deployTx.estimateGas({ from: signer.address });
        } catch (error2) {
          console.error("Error while estimating Gas fee: ", error2);
          gasFees = 2100000;
        }
        console.log("Estimated gas fee for deploy: ", gasFees);

        let currentGas = Math.floor(gasFees * 1.1);
        const maxGas = gasFees * 2;
        let gasPrice = await web3.eth.getGasPrice();
        gasPrice = web3.utils.toBN(gasPrice).mul(web3.utils.toBN(12)).div(web3.utils.toBN(10)).toString(); // Increase gas price by 20%

        const createTransaction = await web3.eth.accounts.signTransaction(
          {
            from: signer.address,
            data: deployTx.encodeABI(),
            gas: currentGas,
            gasPrice: gasPrice,
            nonce: nonce,
          },
          signer.privateKey
        );
        console.log('Sending signed Repo deploy txn...');

        const maxRetries = 5;
        let attempt = 0;

        while (attempt < maxRetries) {
          try {
            const createReceipt = await web3.eth.sendSignedTransaction(createTransaction.rawTransaction);
            console.log('**** Txn executed:', createReceipt);
            console.log('New Contract deployed at address', createReceipt.contractAddress);
            newcontractaddress = createReceipt.contractAddress;
            ERC20TokenRepoContract.options.address = newcontractaddress;
            return true;
          } catch (error) {
            console.log(`Attempt ${attempt + 1} failed:`, error.message);
            if (error.message.includes("nonce too low") || error.message.includes("replacement transaction underpriced")) {
              attempt++;
              if (attempt >= maxRetries) {
                console.log("Max retries reached, deployment failed.");
                if (!errorSent) {
                  res.status(400).send({ message: "Max retries reached for transaction deployment." });
                  errorSent = true;
                }
                return false;
              }
              // Update nonce and increase gas price
              nonce = await web3.eth.getTransactionCount(signer.address, "pending");
              currentGas = Math.min(Math.floor(currentGas * 1.1), maxGas);
              gasPrice = web3.utils.toBN(gasPrice).mul(web3.utils.toBN(12)).div(web3.utils.toBN(10)).toString();
              console.log(`Retrying with nonce: ${nonce}, gas: ${currentGas}, gasPrice: ${gasPrice}`);
              const newTransaction = await web3.eth.accounts.signTransaction(
                {
                  from: signer.address,
                  data: deployTx.encodeABI(),
                  gas: currentGas,
                  gasPrice: gasPrice,
                  nonce: nonce,
                },
                signer.privateKey
              );
              createTransaction.rawTransaction = newTransaction.rawTransaction;
            } else {
              console.log("Unexpected error during deployment:", error);
              if (!errorSent) {
                res.status(400).send({ message: error.toString().replace('*', '') });
                errorSent = true;
              }
              return false;
            }
          }
        }
      };

      if (await deployContract()) {
        console.log('**** Contract deployed successfully');
        return(true);
      } else {
        console.log('**** Contract deployed failed!!!');
        return(false);
      }
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
    }
  }

  async function dAppUpdate() {
    var errorSent = false;
    updatestatus = false;

    fs = require("fs");
    ABI = JSON.parse(fs.readFileSync("./server/app/abis/ERC20TokenRepo.abi.json").toString());

    Web3 = require("web3");

    web3 = new Web3( 
      Web3.providers.HttpProvider(
        `https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`
      ) 
    );

    console.log("!!! Signer:", SIGNER_PRIVATE_KEY.substring(0,4)+"..." + SIGNER_PRIVATE_KEY.slice(-3));
    const signer = web3.eth.accounts.privateKeyToAccount(SIGNER_PRIVATE_KEY)

    const UpdateContract = async () => {
      try {
        console.log('Creating Repo contract with ABI');
        const ERC20TokenRepoContract = new web3.eth.Contract(ABI);

        let setToTalSupply = (isNaN(+req.body.amount) ? req.body.amount : req.body.amount.toString()) + createStringWithZeros(adjustdecimals);
        console.log("Repo setToTalSupply = ", setToTalSupply);

        console.log('**** Signing update txn('+signer.address+','+req.body.amount );
        const nonce = await web3.eth.getTransactionCount(signer.address, "latest"); // Store original nonce
        const contractTx = ERC20TokenRepoContract.methods.updateTotalSupply(web3.utils.toBN(setToTalSupply));
        let gasFees;
        try {
          gasFees = await contractTx.estimateGas({ from: signer.address });
        } catch (error) {
          console.error("Error while estimating gas for updateTotalSupply: ", error);
          gasFees = 8700000; // Default gas limit
        }
        console.log("Estimated gas fee for updateTotalSupply: ", gasFees);

        let currentGas = Math.floor(gasFees * 1.1);
        const maxGas = gasFees * 2; // 100% increase maximum

        const createTransaction = await web3.eth.accounts.signTransaction(
          {
            nonce: nonce,
            from: signer.address,
            to: req.body.smartcontractaddress,
            data: contractTx.encodeABI(),
            gas: currentGas,
            gasPrice: await web3.eth.getGasPrice(),
          },
          SIGNER_PRIVATE_KEY
        );
        console.log('**** Sending signed txn...');

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
                const interval = setInterval(async function() {
                  console.log("Attempting to get transaction receipt...");

                  web3.eth.getTransactionReceipt(hash, async function(error3, receipt) {
                    if (receipt) {
                      console.log('>>>>>>>>>>>>>>>> GOT RECEIPT <<<<<<<<<<<<<<<<<<');
                      clearInterval(interval);
                      console.log('Receipt -->>: ', receipt);

                      const trx = await web3.eth.getTransaction(hash);
                      console.log('trx.status -->>: ', trx);

                      return receipt.status;
                    }
                    if (error3) {
                      console.log("!! getTransactionReceipt error: ", error3);
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
                    // Increase gas by 10% every 15 seconds
                    if (timer % 15 === 0 && currentGas < maxGas) {
                      currentGas = Math.min(Math.floor(currentGas * 1.1), maxGas);
                      console.log(`Increasing gas to: ${currentGas}`);
                      try {
                        const newTransaction = await web3.eth.accounts.signTransaction(
                          {
                            nonce: nonce, // Reuse original nonce
                            from: signer.address,
                            to: req.body.smartcontractaddress,
                            data: contractTx.encodeABI(),
                            gas: currentGas,
                            gasPrice: await web3.eth.getGasPrice(),
                          },
                          SIGNER_PRIVATE_KEY
                        );
                        await web3.eth.sendSignedTransaction(newTransaction.rawTransaction);
                      } catch (retryError) {
                        console.log("Error retrying with increased gas: ", retryError);
                      }
                    }
                    timer++;
                  });
                }, 1000);
            }
          })
          .on("error", err => {
              console.log("sentSignedTxn error2: ", err);
              if (!errorSent) {
                console.log("Sending error 400 back to client");
                res.status(400).send({ 
                  message: err.toString().replace('*', ''),
                });
                errorSent = true;
              }
              return false;
          });

        console.log('**** Repo Txn executed:', createReceipt);
        return true;
      } catch(error) {
        console.log('Error4 encountered -->: ', error);
        if (!errorSent) {
          console.log("Sending error 400 back to client");
          res.status(400).send({ 
            message: error.toString().replace('*', ''),
          });
          errorSent = true;
        }
        return false;
      }
    };

    return (await UpdateContract());
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
      status                : 3,
      smartcontractaddress  : newcontractaddress,
      approverComments      : req.body.approvercomments,
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
            daycountconvention    : req.body.daycountconvention, 
            blockchain            : req.body.blockchain,

            txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete
      
            smartcontractaddress  : (isNewRepo? newcontractaddress : req.body.smartcontractaddress),
      
            draftrepoid           : draft_id,
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
          smartcontractaddress  : newcontractaddress, // Add smartcontractaddress
          smartcontractaddress1 : req.body.smartcontractaddress1,
          smartcontractaddress2 : req.body.smartcontractaddress2,
          underlyingTokenID1    : req.body.underlyingTokenID1,
          underlyingTokenID2    : req.body.underlyingTokenID2,
          amount1               : req.body.amount1,
          amount2               : req.body.amount2,
          daycountconvention    : req.body.daycountconvention,
          blockchain            : req.body.blockchain,

          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete
              
          actionby              : req.body.actionby,
          draftrepoid           : req.body.id,          
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
        daycountconvention    : req.body.daycountconvention, 
        blockchain            : req.body.blockchain,

        txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

        actionby              : req.body.actionby,
        draftrepoid           : req.body.id,             
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

// withdrawTokens function (modified section)
exports.withdrawTokens = async (req, res) => {
  const { tradeId, token, to, amount } = req.body;
  let errorSent = false;

  require('dotenv').config();
  const ETHEREUM_NETWORK = (() => {
    switch (req.body.blockchain) {
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
  const INFURA_API_KEY = process.env.REACT_APP_INFURA_API_KEY;
  const SIGNER_PRIVATE_KEY = process.env.REACT_APP_SIGNER_PRIVATE_KEY;
  const CONTRACT_OWNER_WALLET = process.env.REACT_APP_CONTRACT_OWNER_WALLET;

  try {
    const fs = require("fs");
    const Web3 = require("web3");
    const web3 = new Web3(`https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`);
    const ABI = JSON.parse(fs.readFileSync("./server/app/abis/ERC20TokenRepo.abi.json").toString());
    const contract = new web3.eth.Contract(ABI, req.body.smartcontractaddress);
    const signer = web3.eth.accounts.privateKeyToAccount(SIGNER_PRIVATE_KEY);

    const txData = contract.methods.withdrawTokens(tradeId, token, to, web3.utils.toWei(amount.toString(), 'ether')).encodeABI();
    const nonce = await web3.eth.getTransactionCount(CONTRACT_OWNER_WALLET, "latest"); // Store original nonce
    let gasEstimate = await contract.methods.withdrawTokens(tradeId, token, to, web3.utils.toWei(amount.toString(), 'ether')).estimateGas({ from: signer.address });
    let currentGas = Math.floor(gasEstimate * 1.1);
    const maxGas = gasEstimate * 2; // 100% increase maximum

    const signedTx = await web3.eth.accounts.signTransaction(
      {
        nonce: nonce,
        from: signer.address,
        to: req.body.smartcontractaddress,
        data: txData,
        gas: currentGas,
      },
      SIGNER_PRIVATE_KEY
    );

    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction, function (error1, hash) {
      if (error1) {
        console.log("Error in withdrawTokens transaction:", error1);
        if (!errorSent) {
          res.status(400).send({ message: error1.toString().replace('*', '') });
          errorSent = true;
        }
        return false;
      } else {
        console.log("Txn sent!, hash: ", hash);
        var timer = 1;
        const interval = setInterval(async function() {
          console.log("Attempting to get transaction receipt...");

          web3.eth.getTransactionReceipt(hash, async function(error3, receipt) {
            if (receipt) {
              console.log('>>>>>>>>>>>>>>>> GOT RECEIPT <<<<<<<<<<<<<<<<<<');
              clearInterval(interval);
              console.log('Receipt -->>: ', receipt);

              const trx = await web3.eth.getTransaction(hash);
              console.log('trx.status -->>: ', trx);

              return receipt.status;
            }
            if (error3) {
              console.log("!! getTransactionReceipt error: ", error3);
              clearInterval(interval);
              if (!errorSent) {
                res.status(400).send({ message: error3.toString().replace('*', '') });
                errorSent = true;
              }
              return false;
            }
            // Increase gas by 10% every 15 seconds
            if (timer % 15 === 0 && currentGas < maxGas) {
              currentGas = Math.min(Math.floor(currentGas * 1.1), maxGas);
              console.log(`Increasing gas to: ${currentGas}`);
              try {
                const newTransaction = await web3.eth.accounts.signTransaction(
                  {
                    nonce: nonce, // Reuse original nonce
                    from: signer.address,
                    to: req.body.smartcontractaddress,
                    data: txData,
                    gas: currentGas,
                  },
                  SIGNER_PRIVATE_KEY
                );
                await web3.eth.sendSignedTransaction(newTransaction.rawTransaction);
              } catch (retryError) {
                console.log("Error retrying with increased gas: ", retryError);
              }
            }
            timer++;
          });
        }, 1000);
      }
    });

    console.log("WithdrawTokens transaction successful:", receipt);

    await AuditTrail.create({
      action: `Withdraw tokens for trade ${tradeId}`,
      tradeId: tradeId,
      token: token,
      to: to,
      amount: amount,
      status: 4,
      actionby: req.body.actionby,
    });

    res.send({ message: "Tokens withdrawn successfully." });
  } catch (err) {
    console.error("Error in withdrawTokens:", err);
    if (!errorSent) {
      res.status(400).send({ message: err.toString().replace('*', '') });
      errorSent = true;
    }
  }
};

exports.executeRepoById = async (req, res) => {

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
      ABI = JSON.parse(fs.readFileSync("./server/app/abis/ERC20TokenRepo.abi.json").toString());
      console.log("Read Repo Bytecode JSON file.");
      bytecode = JSON.parse(fs.readFileSync("./server/app/abis/ERC20TokenRepo.bytecode.json").toString());
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

    const createInstance = (abi1, contractaddr1) => { // zzzzzzzzz
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
      )();

      async function exec_approve() {
        const tx = {
          from: CONTRACT_OWNER_WALLET,
          to: req.body.smartcontractaddress,
          gas: 9700000,
          data: await RepocontractInstance.contractz.methods.executeTrade().encodeABI(),
        };
        console.log("Create executeTrade() txn data: ", tx.data);

        const nonce = await RepocontractInstance.web3BSC.eth.getTransactionCount(CONTRACT_OWNER_WALLET, "latest"); // Store original nonce
        const signPromise = await RepocontractInstance.web3BSC.eth.accounts.signTransaction(
            tx,
            SIGNER_PRIVATE_KEY,
        );
        console.log("Create signPromise: ", signPromise);

        var url1;
        let currentGas = tx.gas;
        const maxGas = tx.gas * 2; // 100% increase maximum

        try {
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
                    const interval = setInterval(async () => {
                        console.log("Attempting to get transaction receipt...");

                        RepocontractInstance.web3BSC.eth.getTransactionReceipt(hash, async (error3, receipt) => {
                          if (receipt) {
                            clearInterval(interval);
                            console.log('--> RECEIPT received <--');  
                            console.log('Receipt: ', receipt);

                            if (receipt.status && !errorSent) {
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
                          // Increase gas by 10% every 15 seconds
                          if (timer % 15 === 0 && currentGas < maxGas) {
                            currentGas = Math.min(Math.floor(currentGas * 1.1), maxGas);
                            console.log(`Increasing gas to: ${currentGas}`);
                            try {
                              const newTransaction = await RepocontractInstance.web3BSC.eth.accounts.signTransaction(
                                {
                                  from: CONTRACT_OWNER_WALLET,
                                  to: req.body.smartcontractaddress,
                                  data: tx.data,
                                  gas: currentGas,
                                  nonce: nonce, // Reuse original nonce
                                },
                                SIGNER_PRIVATE_KEY
                              );
                              await RepocontractInstance.web3BSC.eth.sendSignedTransaction(newTransaction.rawTransaction);
                            } catch (retryError) {
                              console.log("Error retrying with increased gas: ", retryError);
                            }
                          }
                          if (timer > 700) {
                            clearInterval(interval);
                          } else {
                            timer++;
                          }
                    });
                  }, 1000);
                }
            })
          .on("error", err => {
              console.log("sentSignedTxn error: ", err)
          });
          console.log("sendSignedTxn: ", sendTxn);
          return Promise.resolve(sendTxn);
        } catch(err6c) {
          console.error("Err 6c: ",err6c);
          console.log("Transaction failed, please check "+url1+" for the error.");

          if (!errorSent) {
            res.status(400).send({ 
              message: "Transaction failed, please check "+url1+" for the error.",
            });
            errorSent = true;
          }

          return false;
        }
      } // exec_approve

      return(await exec_approve());

    } catch(ee) { // try 3z
      console.log("Error:", ee)
    } // try 3z createInstance and exec
  }  // repoExec()

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
            daycountconvention    : req.body.daycountconvention,
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
    { 
      raw: true, // display only dataValues, not metadata
      nest: true,
      where: condition,
    }
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
    { 
      raw: true, // display only dataValues, not metadata
      nest: true,
      where: condition 
    }
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
    { 
      raw: true, // display only dataValues, not metadata
      nest: true,
      where: condition 
    }
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
    raw: true, // display only dataValues, not metadata
    nest: true,
    where: { id : Id },
  })
  .then(async data => {

    //console.log("Qery result fo DATA:", data[0].id);

    /// Query blockchain
    // Readng ABI from JSON file
    fs = require("fs");
    ABI = JSON.parse(fs.readFileSync("./server/app/abis/ERC20TokenRepo.abi.json").toString());  // <-- dropdown menu

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
    { 
      raw: true, // display only dataValues, not metadata
      nest: true,
      include: db.recipients,
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
    raw: true, // display only dataValues, not metadata
    nest: true,
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
      raw: true, // display only dataValues, not metadata
      nest: true,
      where: condition,
      //include: db.recipients
      include: [
        {
          model: db.recipients,
          on: 
//              {   id: db.Sequelize.where(db.Sequelize.col("repos_draft.counterparty1"), "=", db.Sequelize.col("recipient.id"))   },
              {   
                id: db.Sequelize.where(db.Sequelize.col("repos_draft.counterparty2"), "=", db.Sequelize.col("recipient.id")),
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
      raw: true, // display only dataValues, not metadata
      nest: true,
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
      raw: true, // display only dataValues, not metadata
      nest: true,
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
    daycountconvention    : req.body.daycountconvention, 
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
          daycountconvention    : req.body.daycountconvention,
          blockchain            : req.body.blockchain,

          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete
    
          draftrepoId           : draft_id,
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
    status            : 2,
    checkerComments   : req.body.checkerComments,
    approverComments  : req.body.approverComments,
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
          daycountconvention    : req.body.daycountconvention,
          blockchain            : req.body.blockchain,

          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete
    
          draftrepoid           : draft_id,
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
    status            : -1,
    checkerComments   : req.body.checkerComments,
    approverComments  : req.body.approverComments,
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
          daycountconvention    : req.body.daycountconvention,
          blockchain            : req.body.blockchain,

          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

          draftrepoid           : draft_id,
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
    ABI = JSON.parse(fs.readFileSync("./server/app/abis/ERC20TokenRepo.abi.json").toString());

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
        const ERC20TokenRepoContract = new web3.eth.Contract(ABI);

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
            data: ERC20TokenRepoContract.methods.updateTotalSupply(
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
          daycountconvention    : req.body.daycountconvention,
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

              draftrepoid           : draft_id,
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
          daycountconvention    : req.body.daycountconvention,
          blockchain            : req.body.blockchain,

          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

          draftrepoid           : draft_id,
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
          daycountconvention    : req.body.daycountconvention,
          blockchain            : req.body.blockchain,

          txntype               : req.body.txntype,   // 0 - create,  1-edit,  2-delete

          draftrepoid           : draft_id,
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

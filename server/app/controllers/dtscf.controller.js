const db = require("../models");
console.log('[SERVER CONTROLLER] Available db model keys:', Object.keys(db).filter(key => key !== 'sequelize' && key !== 'Sequelize'));

const DTSCFProject = db.dtscfprojects;
const AuditTrail = db.audittrail;
const Dtscf_Drafts = db.dtscf_drafts;
const Dtscfs = db.dtscfs;
const Milestone_draft = db.dtscf_milestones_draft;
const Contractor_draft = db.dtscf_contractors_draft;
const Purchase_draft = db.dtscf_purchases_draft;
const Milestone = db.dtscf_milestones;
const Contractor = db.dtscf_contractors;
const Purchase = db.dtscf_purchases;
const Recipients = db.recipients;
const Campaigns = db.campaigns;
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Assume configured
const Op = db.Sequelize.Op;
const { logDataValues } = require('../utils/logDataValues');
const os = require('os');
const axios = require('axios');
const FormData = require('form-data');
const { Blob } = require('buffer'); // Required for Node.js environments

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
const sharp = require('sharp');
const { where, NOW } = require("sequelize");

//var newcontractaddress = null;
const adjustdecimals = 18;
const TIMEOUT = 700;

function createStringWithZeros(num) { return ("0".repeat(num)); }

function parseFormKey(key) {
  const matches = key.match(/([^\[\]]+)|(\[(\d+)\])/g) || [];
  const path = [];
  matches.forEach(match => {
    if (match.startsWith('[')) {
      path.push(parseInt(match.slice(1, -1), 10));
    } else {
      path.push(match);
    }
  });
  return path;
}

function buildNestedObject(body) {
  const result = {};
  Object.keys(body).forEach(key => {
    const path = parseFormKey(key);
    let current = result;
    for (let i = 0; i < path.length - 1; i++) {
      const p = path[i];
      const nextP = path[i + 1];
      if (!current[p]) {
        current[p] = typeof nextP === 'number' ? [] : {};
      }
      current = current[p];
    }
    const lastP = path[path.length - 1];
    current[lastP] = body[key];
  });
  return result;
}

function setupWeb3(blockchain) {
  require('dotenv').config();
  const providerUrl = (() => {
    switch (blockchain) {
      case 80001    : return `https://polygon-mumbai.infura.io/v3/${process.env.REACT_APP_ALCHEMY_API_KEY}`;
      case 80002    : return `https://polygon-amoy.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}`;
      case 11155111 : return `https://eth-sepolia.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}`;
      case 137      : return `https://polygon-mainnet.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}`;
      case 1        : return `https://eth-mainnet.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}`;
      default: return null;
    }
  })();
  console.log("Provider URL:", providerUrl.replace(process.env.REACT_APP_ALCHEMY_API_KEY, "****"));
  const www = require('web3');
  return new www(new www.providers.HttpProvider(providerUrl));
}

function createSVGWithBackground(text1, text2, text3, width, height) {
  return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .line1 { 
        font-size: 35px; 
        font-weight: bold; 
        font-family: 'bell mt', 'Arial Black', sans-serif; 
        fill: #664840;
      }
      .line2 { 
        font-size: 25px; 
        font-weight: normal; 
        font-family: 'bell mt', 'Arial', sans-serif; 
        fill: #664840;
      }
      .line3 { 
        font-size: 25px; 
        font-weight: normal; 
        font-family: 'bell mt', 'Arial', sans-serif; 
        fill: #664840;
      }
    </style>
  </defs>

  <!-- Larger white semi-transparent rectangle -->
  <rect 
    x="4%" 
    y="5%" 
    width="80%" 
    height="210px" 
    rx="18" 
    fill="#ffffff" 
    fill-opacity="0.8" 
  />

  <!-- 3 Lines - Better vertical spacing -->
  <text x="6%" y="12%"  text-anchor="start" class="line1">${text1}</text>
  <text x="6%" y="20%"  text-anchor="start" class="line2">${text2}</text>
  <text x="6%" y="23%" text-anchor="start" class="line3">${text3}</text>
</svg>`;
}

async function generateImage(value, milestoneId, completionDate, outputPath) {
  try {
    const backgroundUrl = 'https://tokenising.herokuapp.com/tp-square.jpg';
    const newvalue = typeof value === 'number' 
      ? value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // 1. Fetch the background image as a buffer
    const response = await axios.get(backgroundUrl, { responseType: 'arraybuffer' });
    const bgBuffer = Buffer.from(response.data);

    // 2. Get metadata of the background to match dimensions
    const metadata = await sharp(bgBuffer).metadata();
    const { width, height } = metadata;

    // 3. Generate SVG with text (scaled to background size)
    const svgText = createSVGWithBackground("Tokenised Payable SGD" + newvalue, "Milestone " + milestoneId , "Completion Date: " + completionDate, width, height);

    // 4. Composite the text over the background buffer
    await sharp(bgBuffer)
      .composite([{ input: Buffer.from(svgText), gravity: 'center' }])
      .jpeg()
      .toFile(outputPath);

    console.log(`Image generated and saved to ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('Error generating image:', error.message);
    throw error;
  }
}

//
// Uploads a file to Pinata (IPFS pinning service)
// Ref: https://docs.pinata.cloud/api-reference/quickstart
// Add PINATA_JWT to .env (from Pinata dashboard: API Keys)
//
async function uploadToPinata(filePath, fileName) {
  try {
    require('dotenv').config();
    const jwt = process.env.PINATA_JWT;
    if (!jwt) throw new Error("Pinata JWT (PINATA_JWT) is missing in .env.");

    const form = new FormData();
    form.append('file', fs.createReadStream(filePath), fileName);

    const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${jwt.trim()}`
      }
    });

    if (response.data && response.data.IpfsHash) {
      const cid = response.data.IpfsHash;
      console.log(`Uploaded to Pinata. CID: ${cid}`);
      return `ipfs://${cid}`;
    } else {
      throw new Error("Unknown API error");
    }
  } catch (error) {
    const errMsg = error.response?.data?.error?.details || error.message;
    console.error('Pinata Upload Error:', errMsg);
    throw new Error(`Upload failed: ${errMsg}`);
  }
}

async function generateMetadataFile(contractAddress, id, value, milestoneId, maturityDate, conditions, tempDir = os.tmpdir()) {
  if (!contractAddress || !id) {
    throw new Error('Missing required parameters: contractAddress or id');
  }

  // Generate image with try-catch
  const imageFileName = `${id}.jpg`;
  const imageOutputPath = path.join(tempDir, imageFileName);
  let imageUrl = "";
  //'https://tokenising.herokuapp.com/tokenisedpayable0.jpg'; 

  try {
    await generateImage(value, milestoneId, maturityDate, imageOutputPath);
    // Use the new Pinata upload function
    imageUrl = await uploadToPinata(imageOutputPath, imageFileName);
  } catch (imgErr) {
    console.error('Image generation/upload failed (continuing with default):', imgErr.message);
  }

  const readableMaturity = (new Date(maturityDate * 1000).toISOString()).slice(0, 10); // format as YYYY-MM-DD

  // ERC-1155 Metadata structure
  const metadata = {
    name: `Tokenised Payable #${id}`,
    description: `Tokenised Payable SGD${value}, Milestone ${milestoneId} completion date: ${readableMaturity}. ${conditions}.`,
    image: imageUrl.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/'), // Use Gateway URL
    attributes: [
      { trait_type: "Value", value: value.toString() },
      { trait_type: "Milestone ID", value: milestoneId.toString() },
      { trait_type: "Maturity Date", value: readableMaturity },
      { trait_type: "Conditions", value: conditions },
      { trait_type: "MintedAt", value: Date.now().toString() } // Cache Buster
    ]
  };

  // Write temp JSON file
  const jsonFileName = `${id}.json`;
  const jsonOutputPath = path.join(tempDir, jsonFileName);
  fs.writeFileSync(jsonOutputPath, JSON.stringify(metadata, null, 2));

  // Upload JSON metadata to Pinata
  const jsonUrl = await uploadToPinata(jsonOutputPath, jsonFileName);

  // Clean up temp files
  try {
//    if (fs.existsSync(imageOutputPath)) fs.unlinkSync(imageOutputPath);
//    if (fs.existsSync(jsonOutputPath)) fs.unlinkSync(jsonOutputPath);
  } catch (cleanupErr) {
    console.warn('Temp file cleanup failed:', cleanupErr.message);
  }

  console.log(`Generated and uploaded metadata to Pinata: ${jsonUrl}`);

      console.log("Image and metadata file for TP is created:", jsonUrl);
      const newUri = `${jsonUrl}?id=${Date.now()}.json`; 
      const newjsonUrl = newUri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
      console.log("Changing metadataPath to https pinata gateway:", newjsonUrl);

  return newjsonUrl; 
}

retryWithBackoff = async (fn, maxRetries = 5, baseDelay = 15000, shouldRetry = () => true) => {
  let gasMultiplier = 1.0;  // Start at 100%
  let priorityMultiplier = 1.0;  // For maxPriorityFeePerGas
  let gasLimitMultiplier = 1.1;  // Slight increase for gas limit
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`retryWithBackoff: Attempt ${attempt} / ${maxRetries}: Gas Multiplier=${gasMultiplier}, Priority Multiplier=${priorityMultiplier}, Delay=${baseDelay * Math.pow(2, attempt - 1)}ms`);
      return await fn(gasMultiplier, priorityMultiplier, gasLimitMultiplier);  // Pass multipliers to fn
    } catch (err) {
      if (!shouldRetry(err) || attempt === maxRetries) throw err;
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 100;
      await new Promise(resolve => setTimeout(resolve, delay));
      console.warn(`Retry attempt ${attempt} after ${delay}ms: ${err.message}`);
      gasMultiplier += 0.05;  // Increase gasPrice/baseFee by 5%
      priorityMultiplier += 0.05;  // Increase maxPriorityFee by 5%
      gasLimitMultiplier += 0.05;  // Increase gas limit by 5% (for underestimation)
    }
  }
};

// Function to scale a number with up to 3 decimal places to a BigNumber with 18 decimal places
function scaleToWei(value, w3) {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
        throw new Error('Invalid number input for scaling');
    }
    // Convert to string with 3 decimal places and scale to wei (10^18)
    return w3.utils.toWei(parsed.toFixed(3), 'ether');
}

// Recursive function to update or create contractors and subcontractors
async function updateOrCreateContractors(contractors, projectId, files, parentId = null, path = []) {
  for (const [index, con] of contractors.entries()) {
    let contractorId;
    if (con.id) {
      // Update existing
      const num = await Contractor_draft.update({
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
      const draftContractor = await Contractor_draft.create({
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
        const num = await Purchase_draft.update({
          description: pur.description,
          amount: parseFloat(pur.amount) || 0,
          dtscf_milestone_id: pur.milestone_id || pur.milestone || null, 
          invoice_blob: invoiceFile ? invoiceFile.buffer : undefined  // Skip if no new file
        }, { where: { id: pur.id } });
        if (num[0] === 1) {
          console.log(`Updated purchase with id=${pur.id}`);
        } else {
          console.log(`No changes or cannot update purchase with id=${pur.id}. Rows affected: ${num[0]}`);
        }
      } else {
        // Create new purchase
        const newPurchase = await Purchase_draft.create({
          description: pur.description,
          amount: parseFloat(pur.amount) || 0,
          dtscf_project_id: projectId,
          dtscf_contractor_id: contractorId,
          dtscf_milestone_id: pur.milestone_id || pur.milestone || null, 
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
    const draftContractor = await Contractor_draft.create({
      name: con.name,
      budget: parseInt(con.budget) || 0,
      walletaddress: con.walletaddress || '',
      dtscf_project_id: projectId,
      dtscf_parent_contractor_id: parentId,
      dtscf_milestone_id: con.milestone_id || null
    });
    console.log(`Created new contractor with id=${draftContractor.id}`);

    const currentPath = [...path, index];

    for (const [purIndex, pur] of (con.purchases || []).entries()) {
      const fieldBase = `contractor_${currentPath.join('_')}_purchase_${purIndex}_invoice`;
      const invoiceFile = files[fieldBase] ? files[fieldBase][0] : null;

      const newPurchase = await Purchase_draft.create({
        description: pur.description,
        amount: parseFloat(pur.amount) || 0,
        dtscf_project_id: projectId,
        dtscf_contractor_id: draftContractor.id,
        dtscf_milestone_id: pur.milestone_id || pur.milestone || null,
        invoice_blob: invoiceFile ? invoiceFile.buffer : null
      });
      console.log(`Created new purchase with id=${newPurchase.id}`);    
    }

    if (con.subcontractors && con.subcontractors.length > 0) {
      await createContractors(con.subcontractors, projectId, files, draftContractor.id, currentPath);
    }
  }
}

async function getTokensInWallet(TPcontract, walletAddress) {
    try {
        // 1. Fetch the exact list of currently active token IDs 
        const activeIds = await TPcontract.methods.getAllTokenIds().call();
        console.log("getTokensInWallet - activeIds: ", activeIds)

        if (activeIds.length === 0) return [];

        // 2. Prepare for batch query: the contract expects an address for every ID checked
        const addresses = Array(activeIds.length).fill(walletAddress);
        console.log("getTokensInWallet - addresses: ", addresses)

        // 3. Perform a single batch call to get all balances
        const balances = await TPcontract.methods.balanceOfBatch(addresses, activeIds).call();
        console.log("getTokensInWallet - balances: ", balances)

        // 4. Map the IDs to their balances and filter out tokens with 0 balance
        const aa = activeIds
            .map((id, index) => ({
                tokenId: id.toString(),
                balance: balances[index].toString()
            }))
            .filter(item => item.balance !== "0");
        console.log("getTokensInWallet - array: ", aa);
        return aa;

    } catch (error) {
        console.error(`getTokensInWallet - Error querying wallet ${walletAddress}:`, error.message);
        throw error;
    }
}

exports.getTPbyOrgId = async (req, res) => {  // make it work for Anchor and contractors and sub-contractors
  let isAnchor = true;
  const orgId = req.query.id; // organisation_id passed as query parameter

  console.log(`Received request to get TP by Organisation ID: ${orgId}`);
  
  const Web3 = require('web3');
  require('dotenv').config();

  try {
    // 1. Query the Recipient database for the wallet address (w1)
    const recipient = await Recipients.findOne({
      where: { id: orgId }
    });

    if (!recipient || !recipient.walletaddress) {
      return res.status(404).send({ message: "Organisation or wallet address not found." });
    }

    const w1 = recipient.walletaddress;
    console.log(`Found wallet address for organisation ${orgId}: ${w1}`);

    try {
      console.log("====== dtscf.getTPbyOrgId() ");

      // find all the TP tokens where the anchor_id matches the orgId, and then we will filter by wallet address on the blockchain query
      // This is useful if the org is a Anchor but not when the org is a contractor or sub-contractor, 
      // as the anchor_id in the Dtscfs table only captures the Anchor's organisation ID, not the contractors or sub-contractors.
      let dtscfs = await Dtscfs.findAll({ 
        include: 
        [
          {
            model: Recipients,
            as: 'anchor',
            attributes: ['name']
          },
          {
            model: Campaigns,
            as: 'underlyingToken',
            attributes: ['tokenname']
          }
        ],
        where: {
          anchor_id: orgId
        },
      }).then(data => {
        return data;
//        logDataValues("Dtscfs.findAll: ", data);
      });
      console.log(`Found ${dtscfs.length} TP tokens with anchor_id ${orgId}. \ndtscfs: ${JSON.stringify(dtscfs, null, 2)}`);

      if (dtscfs.length === 0) {
        isAnchor = false;

        // for contractors and sub-contractors, we need to find the TP tokens where the wallet address matches w1 on the blockchain,
        // assuming Anchor will not be a contractor or sub-contractor in another project, 
        // so we can filter by wallet address on the blockchain query without worrying about duplicate wallet addresses across different projects.
        dtscfs = await Dtscfs.findAll({ 
          include: 
          [
            {
              model: Recipients,
              as: 'anchor',
              attributes: ['name']
            },
            {
              model: Campaigns,
              as: 'underlyingToken',
              attributes: ['tokenname']
            }
          ],
        }).then(data => {
          return data;
//          logDataValues("Dtscfs.findAll: ", data);
        });
        console.log(`Found ${dtscfs.length} TP tokens. \ndtscfs: ${JSON.stringify(dtscfs, null, 2)}`);
      }

      const results = await Promise.all(dtscfs.map(async dtscf => {  // loop thru all the TP smart contract tokens
        const json = dtscf.toJSON();
        json.anchorName = dtscf.anchor ? dtscf.anchor.name : null;
        json.tokenName = dtscf.underlyingToken ? dtscf.underlyingToken.tokenname : null;
        delete json.anchor;
        delete json.underlyingToken;

        const providerUrl = (() => {
          switch (json.blockchain) {
//            case 80001: return `https://polygon-mumbai.infura.io/v3/${process.env.REACT_APP_INFURA_API_KEY}`;
//            case 80002: return `https://polygon-amoy.infura.io/v3/${process.env.REACT_APP_INFURA_API_KEY}`;
//            case 11155111: return `https://sepolia.infura.io/v3/${process.env.REACT_APP_INFURA_API_KEY}`;
//            case 137: return `https://polygon-mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_API_KEY}`;
//            case 1: return `https://mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_API_KEY}`;
            case 80001    : return `https://polygon-mumbai.infura.io/v3/${process.env.REACT_APP_ALCHEMY_API_KEY}`;
            case 80002    : return `https://polygon-amoy.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}`;
            case 11155111 : return `https://eth-sepolia.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}`;
            case 137      : return `https://polygon-mainnet.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}`;
            case 1        : return `https://eth-mainnet.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}`;
            default: return null;
          }
        })();
        console.log("Provider URL:", providerUrl.replace(process.env.REACT_APP_ALCHEMY_API_KEY, "****"));

        try {       // query blockchain for balance of TP tokens in the wallet address (w1)
          const web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));
          const abi = JSON.parse(fs.readFileSync(abiFile, 'utf8')); 
          const TPcontract = new web3.eth.Contract(abi, json.smartcontractaddress);
        
          const walletTokens = await getTokensInWallet(TPcontract, w1);
          console.log(`Tokens in wallet ${w1} for contract ${json.smartcontractaddress}:`, walletTokens);   
          let tokenId = null;

          // Return an array of objects (one for each token found)
          // or an empty array if none found
          return Promise.all(walletTokens.map(async (token) => {
              const details = await TPcontract.methods.payables(token.tokenId).call();
              json.value = web3.utils.fromWei(details.value, 'ether'); // removing 18 zeros from balance
              console.log(`Fetched token ID: `, tokenId);
              console.log(`--- Fetched balance for '${json.name}' on blockchain '${json.blockchain}' wallet '${w1}': '${json.value}'`);
              console.log("--- Payable Details ---");
              console.log(`Value: ${details.value}`); 
              console.log(`Maturity Date: ${new Date(details.maturityDate * 1000).toLocaleString()}`); 
              console.log(`Is Realized: ${details.realized}`); 
              console.log(`Issuer / Anchor: ${details.issuer}`); 
              console.log(`Conditions: ${details.conditions}`); 
              console.log(`Escrowed Deposit: ${details.escrowedDeposit}`); 
              console.log(`Milestone ID: ${details.milestoneId}`);

              return {
                  ...json,
                  tokenId: token.tokenId,
                  value: web3.utils.fromWei(details.value, 'ether'),
                  maturityDate: details.maturityDate,
                  isRealized: details.realized,
                  issuer: details.issuer,
                  conditions: details.condition,
                  escrowedDeposit: details.escrowedDeposit,
                  milestoneId: details.milestoneId
              };
          }));
        } catch (error) {
            console.error("Error fetching data from blockchain:", error);
        } // query blockchain for balance of TP tokens in the wallet address (w1)
      }));

      // Flatten the results so you don't have nested arrays [[{}, {}], []]
      const formattedData = results.flat();

      logDataValues("Dtscfs.findAll: ", formattedData);
      console.log("Formatted Dtscfs data with anchorName and tokenName:", formattedData);
      res.send(formattedData);
    } catch (err) {
      console.log("Error while retrieving dtscf4: "+err.message);
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving dtscf project records."
      });
    }


    return;

  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving TP tokens."
    });
  }
};

exports.getTPNFT = async (req, res) => {  // display TP NFT metadata and image
  var errorSent = false;

  console.log("Received :");
  console.log(req.body);

  const contractAddress = req.body.smartcontractaddress; 
  const blockchain = req.body.blockchain; 
  const index = req.body.id;

  if (!contractAddress) {
    if (!errorSent) {
      res.status(400).send({
        message: "Content can not be empty!"
      });
      errorSent = true;
    }
    return;
  }

  require('dotenv').config();
  // --- RPC SETUP ---
//  const INFURA_API_KEY = process.env.REACT_APP_INFURA_API_KEY;
//  const ETHEREUM_NETWORK = process.env.ETHEREUM_NETWORK || 'sepolia';
  const ALCHEMY_API_KEY = process.env.REACT_APP_ALCHEMY_API_KEY;
  const ETHEREUM_NETWORK = process.env.ETHEREUM_NETWORK || 'eth-sepolia';
  //const providerUrl = `https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`;
  const providerUrl = `https://${ETHEREUM_NETWORK}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;


  // --- WEB3 SETUP ---
  const Web3 = require('web3');
  const web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));
  const ABI = JSON.parse(fs.readFileSync(abiFile, 'utf8'));

    try {
        const contract = new web3.eth.Contract(ABI, contractAddress);
        const metadataUri = await contract.methods.uri(index).call();
        
        if (!metadataUri) return res.status(404).json({ error: "No metadata found" });

        console.log(`📡 Contract returned URI: ${metadataUri}`);

        let finalUrl;

        // LOGIC FIX: Check if the URI is already a full http link
        if (metadataUri.startsWith('http')) {
            finalUrl = metadataUri; // Use it directly, don't append to gateway
        } else {
            // It's a CID or ipfs:// link
            const cid = metadataUri.replace('ipfs://', '');
            finalUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;
        }

        console.log(`📡 Attempting fetch from: ${finalUrl}`);
        
        const response = await axios.get(finalUrl, { timeout: 10000 });
        console.log('📡 Fetched metadata successfully: ', response.data);
        res.json(response.data);

    } catch (e) {
        console.error("❌ View Error:", e.message);
        res.status(500).json({ error: "Could not resolve metadata. Ensure the ID is minted." });
    }
}; // display TP NFT metadata and image

exports.createUnwrapDraft = async (req, res) => {
  let hasSentResponse = false;

  console.log("Received for Unwrap draft Create:");
  const w1 = req.params.id;   // for http PUT
  console.log("user wallet =", w1);
  console.log("req.body = ", req.body);
  const m_id = req.body.id;
  const selectedMilestoneId = req.body.selectedMilestoneId; 
  const TPsmartContractAddress = req.body.smartcontractaddress;
  const blockchain = req.body.blockchain;

  // Step 1: check if select milestone is already completed and if the dtscf record exists
  // Step 2: check if the expiry date of TP is reached or not, if not reached, cannot create unwrap
  // Step 3: if all good, update the dtscf record with status = 1 (unwrap draft created)

  //Step 1: check if select milestone is already completed and if the dtscf record exists
  const data = await Milestone.findOne({ where: { id: selectedMilestoneId }});

  async function handleUnwrap() {
    if (!data) { // if not found milestone
      console.log(`Milestone with id=${selectedMilestoneId} not found.`);
      res.status(404).send({
        message: `Cannot find Milestone with id=${selectedMilestoneId}.`
      });
      return false;
    } else { // if found milestone
      console.log(`Milestone with id=${selectedMilestoneId} found: `, data.toJSON());
      if (data.milestone_completed !== true) { // milestone not completed, cannot unwrap
        console.log(`Milestone '${data.name}' with id=${selectedMilestoneId} is not completed yet.`);
        if (! hasSentResponse) {
          hasSentResponse = true;

          res.status(400).send({
            message: `Milestone '${data.name}' with id=${selectedMilestoneId} is not completed yet.`
          });
          return false;
        }
      } else { // milestone completed, proceed to check TP maturity date
        console.log(`Milestone '${data.name}' with id=${selectedMilestoneId} is completed. Proceeding to check TP maturity date...`);
        // Now will loop thru the TP tokens associated with this milestone and check if the maturity date is reached or not, if not reached, cannot unwrap

        // ok skip checking TP maturity date for now, as we want to allow early unwrap for testing purpose, 
        // will just check milestone completion for now, and we can add TP maturity date check later if needed.

        // Find all the TP tokens associated with this milestone then loop thru them
        try {       // query blockchain for balance of TP tokens in the wallet address (w1)

          // --- WEB3 SETUP ---
          const web3 = setupWeb3(blockchain);

          const abi = JSON.parse(fs.readFileSync(abiFile, 'utf8')); 
          const TPcontract = new web3.eth.Contract(abi, TPsmartContractAddress);
          console.log(`Checking tokens in wallet ${w1} for contract ${TPsmartContractAddress}...`);
//          console.log(`TPcontract.methods: `, TPcontract.methods);
          const walletTokens = await getTokensInWallet(TPcontract, w1);
          console.log(`Tokens in wallet ${w1} for contract ${TPsmartContractAddress}:`, walletTokens);   
          let tokenId = null;

          if (walletTokens && walletTokens.length > 0) {
            for (const token of walletTokens) {
//            await Promise.all(walletTokens.map(async (token) => {
              const details = await TPcontract.methods.payables(token.tokenId).call();
              const dvalue = web3.utils.fromWei(details.value, 'ether'); // removing 18 zeros from balance
              console.log(`Fetched token ID: `, tokenId);
              console.log(`--- Fetched balance for '${req.body.name}' on blockchain '${req.body.blockchain}' wallet '${w1}': '${dvalue}'`);
              console.log("--- Payable Details ---");
              console.log(`Value: ${details.value}`); 
              console.log(`Maturity Date: ${new Date(details.maturityDate * 1000).toLocaleString()}`); 
              console.log(`Is Realized: ${details.realized}`); 
              console.log(`Issuer / Anchor: ${details.issuer}`); 
              console.log(`Conditions: ${details.conditions}`); 
              console.log(`Escrowed Deposit: ${details.escrowedDeposit}`); 
              console.log(`Milestone ID: ${details.milestoneId}`);

              // Now we unWrap the token 
              const unWrapTP = async () => {
                try {
                  console.log('Calling unwrapTP to unwrap the token ID:', token.tokenId);

                  // const gasPrice = await web3.eth.getGasPrice();  
                  // Get gas prices (EIP-1559 support)
                  const block = await web3.eth.getBlock('pending');
                  const unwrapReceipt =  await retryWithBackoff(async (innerGasMultiplier, innerPriorityMultiplier, innerGasLimitMultiplier) => {
                      const endDateUnix = Math.floor(new Date(req.body.enddate).getTime() / 1000);

                      try {                       
                        console.log(`Just testing unwrapping ${token.tokenId}`);
                        let wrapGas = await TPcontract.methods.unwrapToDeposit( token.tokenId ).estimateGas({ from: w1 });
                      } catch (error) {
                          console.error("Gas estimation failed. The contract would revert this transaction.");
                          console.error(">>>>  Reason:", error.message);
                          console.log("hasSentResponse:", hasSentResponse);
                          // Handle the revert (e.g., send a friendly message to the user)
                          if (! hasSentResponse) {
                              hasSentResponse = true;
                              console.error("Sending error response to client due to gas estimation failure.");
                              console.error("Error details:", error.message);
                              if (error.message.includes('Not realized')) {
                                  res.status(400).send({ message: "The token conditions have not been met yet." });
                              } else {
                                  res.status(400).send({ message: "Blockchain revert: " + error.message });
                              }
                          }
                          return false; 
                          throw new Error(`Gas estimation failed: ${error.message}`);
                      }
/*
                      wrapGas = Math.floor(wrapGas * innerGasLimitMultiplier);    
                      let baseFee = BigInt(block.baseFeePerGas || await web3.eth.getGasPrice());
                      let maxPriorityFee = BigInt(2000000000);  // Default 2 gwei; adjust as needed
                      let maxFeePerGas = ((baseFee * BigInt(Math.floor(innerGasMultiplier * 100)) / BigInt(100)) + (maxPriorityFee * BigInt(Math.floor(innerPriorityMultiplier * 100)) / BigInt(100))).toString();
                      let maxPriorityFeePerGas = (maxPriorityFee * BigInt(Math.floor(innerPriorityMultiplier * 100)) / BigInt(100)).toString();

                      console.log('Current maxFeePerGas:', maxFeePerGas);
                      console.log('Current maxPriorityFeePerGas:', maxPriorityFeePerGas);

                      const wrapData = tokenisedPayableContract.methods.unwrapToDeposit( token.tokenId ).encodeABI();

                      const wrapTx = {
                        from: w1,
                        to: w1,
                        data: wrapData,
                        gas: wrapGas,
                        maxPriorityFeePerGas: maxPriorityFeePerGas,
                        maxFeePerGas: maxFeePerGas
                      };
                      
                      const signedUnwrap = await web3.eth.accounts.signTransaction(wrapTx, ANCHOR_PRIVATE_KEY);

                      console.log('Unwrapping now, sending signed transaction:', signedUnwrap);

                      let unwrapHash;
                      try {
                        unwrapHash = await new Promise((resolve, reject) => {
                          web3.eth.sendSignedTransaction(signedUnwrap.rawTransaction)
                            .once('transactionHash', resolve)
                            .once('error', reject);
                        });
                      } catch (err) {
                        console.error('Unwrap transaction failed:', err.message);
                        throw new Error(`Unwrap send failed: ${err.message}`);
                      }

                      // Poll for receipt every 10 seconds
                      let receipt = null;
                      let attempts = 0;
                      while (!receipt && attempts < 6) {  // Max 6 attempts (~1 min at 10s intervals)
                        console.log("Checking receipt for unwrap transaction... #", attempts);
                        await new Promise(resolve => setTimeout(resolve, 10000));  // Wait 10s
                        receipt = await web3.eth.getTransactionReceipt(unwrapHash);
                        attempts++;
                      }

                      if (!receipt) {
                        console.error('Unwrap transaction not mined within expected time.');
                        throw new Error('not mined');
                      }

                      if (!receipt.status) {
                        console.error('Unwrap transaction failed:', receipt);
                        throw new Error('Unwrap transaction failed or not confirmed');
                      }

                      console.log("Funds unwrapped successfully. unwrapReceipt:", receipt);
                      return receipt;
*/
                  }, 5, 15000, (err) => err.message.includes('not mined') || err.message.includes('underpriced') || err.message.includes('TIMEOUT'));

                  console.log(`Unwrapped Tokenised Payable token ID ${token.tokenId}`);
                  console.log('Unwrap receipt:', unwrapReceipt);
                  return unwrapReceipt;
                } catch (err) {
                  console.error('Error in unwrapTP:', err.message);
                  return false;
                }
              }; // unWrapTP
              return await unWrapTP();
              /*
              return {
                  //...json,
                  tokenId: token.tokenId,
                  value: web3.utils.fromWei(details.value, 'ether'),
                  maturityDate: details.maturityDate,
                  isRealized: details.realized,
                  issuer: details.issuer,
                  conditions: details.condition,
                  escrowedDeposit: details.escrowedDeposit,
                  milestoneId: details.milestoneId
              };
              */
//          })); / Promise... may not get back correct exit status if we have multiple tokens, need to loop sequentially instead of Promise.all
            } // for (const token of walletTokens) 
          }
        } catch (error) {
            console.error("Error fetching data from blockchain:", error);
            return false;
        } // query blockchain for balance of TP tokens in the wallet address (w1)
      }
    } // if found milestone
  } // handleUnwrap

  const unwrapStatus = await handleUnwrap();

  console.log("Unwrap status:", unwrapStatus);
  /////////  bye bye bye
  console.log("All checks done, terminating now...");
  if (! hasSentResponse) {
    hasSentResponse = true;
    res.status(500).send({ message: `Stopping now..Bye bye.`});
  }
  return;


  await Dtscfs.update(
  { 
    status       : 1, // 1 = unwrap draft created, 3 = unwrap completed
  }, 
  { where:      { id: m_id }},
  )
  .then(num => {
    if (num == 1) {

      // write to audit
      AuditTrail.create(
        { 
          action                : "Dtscf unwrap - draft created",
          id                    : m_id,
        }, 
      )
      .then(auditres => {
        console.log("Data written to audittrail for setting dtscf unwrap completed request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for setting dtscf unwrap completed request: "+err.message);
      });
      
      res.send({
        message: "Dtscf unwrap draft was created successfully."
      });
    } else {
      res.send({
        message: `${req.body}. Record updated =${num}. Cannot update Dtscf with id=${m_id}. Maybe Dtscf was not found!`
      });
    }
  })
  .catch(err => {
    console.log(err);
    res.status(500).send({
      message: `Error updating Dtscfs. ${err}`
    });
  });
};  // createUnwrapDraft

exports.approveUnwrapDraftById = async (req, res) => {
  console.log("Received for approveUnwrapDraftById:");
  var newTPsmartcontractaddress1 = null
  let hasSentResponse = false;
  res.writeHead(200, {
    'Content-Type': 'text/plain',
    'Transfer-Encoding': 'chunked'
  });

  const sendLog = message => {
    console.log(message);  // Server-side log for debugging

    if (hasSentResponse) return;  // Prevent sending logs after response has ended
    res.write(`LOG: ${message}\n`);
  };

  const sendSuccess = message => {
    console.log(message);  // Server-side log for debugging

    if (hasSentResponse) return;  // Prevent sending logs after response has ended
    res.write(`SUCCESS: ${message}\n`);
    res.end();
    hasSentResponse = true;
  };

  const sendError = message => {
    console.error(message);  // Server-side log for debugging

    if (hasSentResponse) return;  // Prevent sending logs after response has ended
    res.write(`ERROR: ${message}\n`);
    res.end();
    hasSentResponse = true;
  };

  var updatestatus = false;

  // Validate request
  if (!req.body.name) {
    sendError("Content can not be empty!");
    return;
  }

  const draft_id = req.params.id;
  console.log("req.params.id = ", req.params.id);
  console.log("req.body.id = ", req.body.id);

  console.log("Input data for approveUnwrapDraftById(), ", req.body);

  if (req.body.txntype !==0     // create dtscf
    && req.body.txntype !==1    // update dtscf
    ) {
      sendError("Invalid transaction type!");
      return;  
  }

  sendError("Go home server, you are drunk! Just kidding 😄");
  return;

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
    sendError("Invalid blockchain network.");
//    if (!errorSent) {
//      res.status(400).send({
//        message: "Invalid blockchain network."
//      });
//      errorSent = true;
//    }
    return;
  }

  const INFURA_API_KEY = process.env.REACT_APP_INFURA_API_KEY;
  const ALCHEMY_API_KEY = process.env.REACT_APP_ALCHEMY_API_KEY;

//  const providerUrl = `https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`;   
  const providerUrl = `https://${ETHEREUM_NETWORK}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;   

  console.log(`Using HTTP provider: ${providerUrl.replace(ALCHEMY_API_KEY, '****')}`);

  Web3 = require("web3");
  // Create Web3 with HTTP provider (most stable for deployment)
  const web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));

  // Test connection immediately
  async function checkProviderHealth(www) {
    try {
      const isListening = await www.eth.net.isListening();
      const blockNumber = await www.eth.getBlockNumber();
      console.log(`Provider healthy. Connected to ${ETHEREUM_NETWORK}. Current block: ${blockNumber}`);
      return true;
    } catch (err) {
      console.error("Provider health check failed:", err.message);
      throw new Error("Cannot connect to blockchain provider. Please try again later.");
    }
  }

  await checkProviderHealth(web3);   // test provider connection before proceeding

  const SIGNER_PRIVATE_KEY = process.env.REACT_APP_SIGNER_PRIVATE_KEY;
  const CONTRACT_OWNER_WALLET = process.env.REACT_APP_CONTRACT_OWNER_WALLET;
  const ANCHOR_PRIVATE_KEY = process.env.REACT_APP_ANCHOR_PRIVATE_KEY;
  const ANCHOR_WALLET = process.env.REACT_APP_ANCHOR_WALLET;

  console.log("!!! Signer:", SIGNER_PRIVATE_KEY.substring(0,4)+"..." + SIGNER_PRIVATE_KEY.slice(-3));

  async function dAppCreate() {
    // Actions:
    // 1. compile Tokenised Payable TP smart contract
    // 2. sign smart contract
    // 3. deploy smart contract
    // 4. keep the new smart contract address
    // 5. allow TP smart contract to pull tokenised deposits TBD from system's wallet
    // 6. call method wrapDepositToPayable() which pulls TBD from system wallet into the TP smart contract

    updatestatus = false;

    let ABI, bytecode;
    try {     // compile TP smart contract
      if (!(fs.existsSync(abiFile) && fs.existsSync(byteCodeFile)) || mustCompile) {
        sendLog("Compiling Tokenised Payable smart contract...");
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
      sendError("Error compiling Tokenised Payable smart contract. Please check logs and contact tech support.");
      //if (!errorSent) {
      //  res.status(400).send({ message: "Error compiling Tokenised Payable smart contract. Please check logs and contact tech support." });
      //  errorSent = true;
      //}
      return false;
    }  // compile TP smart contract
    console.log("!!! Signer:", SIGNER_PRIVATE_KEY.substring(0,4)+"..." + SIGNER_PRIVATE_KEY.slice(-3));
    const signer = web3.eth.accounts.privateKeyToAccount(SIGNER_PRIVATE_KEY);
    const anchor = web3.eth.accounts.privateKeyToAccount(ANCHOR_PRIVATE_KEY);

    console.log("Enddate (unix time) = ", Number(new Date(req.body.enddate)));
    try {
      // Deploy contract
      const deployContract = async () => {


        // Step 1: Validate inputs
        console.log("=== Step 1: Validate inputs ===");
        //res.write("Step 1: Validate inputs ");
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
            sendError(`Invalid input: ${key} cannot be null or undefined. Please provide a valid value.`);
            //if (!errorSent) {
            //  res.status(400).send({
            //    message: `Invalid input: ${key} cannot be ${value}. Please provide a valid value.`,
            //  });
            //  errorSent = true;
            //}
            return false;
          }
        }

        const stringFields = ['underlyingDSGDsmartcontractaddress'];
        for (const field of stringFields) {
          if (typeof requiredFields[field] !== 'string' || requiredFields[field].trim() === '') {
            console.error(`Error: ${field} is invalid: ${requiredFields[field]}`);
            sendError(`Invalid input: ${field} must be a non-empty string.`);
            //if (!errorSent) {
            //  res.status(400).send({
            //    message: `Invalid input: ${field} must be a non-empty string.`,
            //  });
            //  errorSent = true;
            //}
            return false;
          }
        }

        const numericFields = ['totalBudget'];
        for (const field of numericFields) {
          const value = Number(requiredFields[field]);
          if (isNaN(value) || value <= 0) {
            console.error(`Error: ${field} is invalid: ${requiredFields[field]}`);
            sendError(`Invalid input: ${field} must be a positive number.`);
            //if (!errorSent) {
            //  res.status(400).send({
            //    message: `Invalid input: ${field} must be a positive number.`,
            //  });
            //  errorSent = true;
            //}
            return false;
          }
        }

        if (isNaN(req.body.totalBudget) || req.body.totalBudget < 0) {
          console.error("Total budget is invalid: ", req.body.totalBudget);
          sendError(`Invalid input: totalBudget must be a positive number.`);
          //if (!errorSent) {
          //  res.status(400).send({
          //    message: `Invalid input: totalBudget must be a positive number.`,
          //  });
          //  errorSent = true;
          //}
          return false;
        }

        if (!web3.utils.isAddress(requiredFields.underlyingDSGDsmartcontractaddress)) {
          console.error(`Error: Invalid underlyingDSGDsmartcontractaddress: ${requiredFields.underlyingDSGDsmartcontractaddress}`);
          sendError(`Invalid input: underlyingDSGDsmartcontractaddress must be a valid Ethereum address.`);
          //if (!errorSent) {
          //  res.status(400).send({
          //    message: 'Invalid input: underlyingDSGDsmartcontractaddress must be a valid Ethereum address.',
          //  });
          //  errorSent = true;
          //}
          return false;
        }

        const startdate = Number(new Date(req.body.startdate));
        const enddate = Number(new Date(req.body.enddate));
        if (isNaN(startdate) || isNaN(enddate) || enddate < startdate) {
          console.error(`Error: Invalid dates - startdate: ${req.body.startdate}, enddate: ${req.body.enddate}`);
          sendError(`Invalid input: Dates must be valid and maturity date must be after issue date.`);
          //if (!errorSent) {
          //  res.status(400).send({
          //    message: 'Invalid input: Dates must be valid and maturity date must be after issue date.',
          //  });
          //  errorSent = true;
          //}
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
              sendError(`Missing or empty required field '${field}' in milestone '${ms.name || 'unnamed'}'`);
              return false;
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
              sendError(`Missing or empty required field '${field}' in contractor '${con.name || 'unnamed'}'`);
              return false;
            }
          }
          // Validate walletaddress is a valid Ethereum address
          if (!web3.utils.isAddress(con.walletaddress)) {
            sendError(`Invalid Ethereum wallet address for contractor '${con.name || 'unnamed'}': ${con.walletaddress}`);
            return false;
          }
          // Add stricter checks, e.g., if (isNaN(con.budget) || con.budget <= 0) throw new Error(...);
        }

        // exit first see how
        //throw new Error(`exit!!!!!!!!!!!`);

        const dtscfConfig = [
          req.body.underlyingDSGDsmartcontractaddress,
          scaleToWei(req.body.totalBudget, web3),
          Math.floor(Number(new Date(req.body.enddate)) / 1000),
        ];
        console.log('DtscfConfig:', dtscfConfig);

        // Do balance check before deployment
        const tokenizedBankDeposit_ABI = JSON.parse(fs.readFileSync(tokenizedBank_abiFile, 'utf8').toString());
        const depositContract = new web3.eth.Contract(tokenizedBankDeposit_ABI, req.body.underlyingDSGDsmartcontractaddress);
        const requiredAmount = web3.utils.toWei(req.body.totalBudget.toString(), 'ether');
        const anchorBalance = await depositContract.methods.balanceOf(anchor.address).call();
        if (web3.utils.toBN(anchorBalance).lt(web3.utils.toBN(requiredAmount))) {
          sendError(`Insufficient Tokenised Deposit balance in anchor wallet: ${parseFloat(web3.utils.fromWei(anchorBalance, 'ether')).toLocaleString('en-US')} < ${parseFloat(req.body.totalBudget).toLocaleString('en-US')}`);
          return false;
        }
        console.log(`Anchor Tokenised Deposit balance sufficient: ${web3.utils.fromWei(anchorBalance, 'ether')}`);


        // Step 2: Prepare for deployment, estimate gas fees
        console.log("=== Step 2: Prepare for deployment, estimate gas fees ===")
        //res.write("Step 2: Prepare for deployment, estimate gas fees ");

        console.log('Attempting to deploy from account:', signer.address);
        const tokenisedPayableContract = new web3.eth.Contract(ABI);
        const payableDeployTx = tokenisedPayableContract.deploy({
          data: bytecode,
          arguments: ['https://tokenising.herokuapp.com/', req.body.underlyingDSGDsmartcontractaddress],
        });

        let gasEstimate = await payableDeployTx.estimateGas({ from: signer.address }).catch((error) => {
          console.error("Error while estimating Gas fee: ", error);
          return 4000000;  // default if cannot estimate
        });

        console.log("Initial estimated gas fee: ", gasEstimate);

        const balance = await web3.eth.getBalance(signer.address);
        console.log("Signer balance:", web3.utils.fromWei(balance, "ether"), "ETH");
        if (web3.utils.toBN(balance).lt(web3.utils.toBN(gasEstimate).mul(web3.utils.toBN("1000000000")))) {
          console.error("Insufficient funds for gas. Please ensure the system wallet has enough balance to cover deployment fees.");
          sendError("Insufficient funds for gas. Please ensure the system wallet has enough balance to cover deployment fees.");
          //res.status(400).send({ message: "Insufficient funds for gas." });
          return false;
        }

        let gasMultiplier = 1.1; // Initial 10% buffer
        const gasIncreaseInterval = 30000; // Increase gas every 30 seconds if pending
        const maxWaitTime = TIMEOUT * 1000; // Total timeout in ms
        let startTime = Date.now();




        // Step 3: Deployment with retry and gas increase
        console.log("=== Step 3: Deployment with retry and gas increase ===");
        sendLog("Deploying smart contract to the blockchain. This may take a while...");
        const deployWithRetry = async () => {
          const block = await web3.eth.getBlock('pending');

          try {
            //return await retryWithBackoff(async () => {
            return await retryWithBackoff(async (innerGasMultiplier, innerPriorityMultiplier, innerGasLimitMultiplier) => {
              let currentGas = Math.floor(gasEstimate * innerGasLimitMultiplier);
              let baseFee = BigInt(block.baseFeePerGas || await web3.eth.getGasPrice());
              let maxPriorityFee = BigInt(2000000000);  // Default 2 gwei; adjust as needed
              let maxFeePerGas = (baseFee * BigInt(Math.floor(innerGasMultiplier * 100)) / BigInt(100)) + 
                                  (maxPriorityFee * BigInt(Math.floor(innerPriorityMultiplier * 100)) / BigInt(100));
              maxFeePerGas = maxFeePerGas.toString();
              let maxPriorityFeePerGas = (maxPriorityFee * BigInt(Math.floor(innerPriorityMultiplier * 100)) / BigInt(100)).toString();

              console.log('Current maxFeePerGas:', maxFeePerGas);
              console.log('Current maxPriorityFeePerGas:', maxPriorityFeePerGas);
              const deployTxData = payableDeployTx.encodeABI();  // Get the encoded deployment data

              const tx = {
                from: signer.address,
                data: deployTxData,
                gas: currentGas,
                // gasPrice: gasPrice  // obsolete
                maxFeePerGas: maxFeePerGas,  // Use this instead of gasPrice
                maxPriorityFeePerGas: maxPriorityFeePerGas
              };

              const signedTx = await web3.eth.accounts.signTransaction(tx, signer.privateKey);

              let hash;
              try {
                hash = await new Promise((resolve, reject) => {
                  web3.eth.sendSignedTransaction(signedTx.rawTransaction)
                    .once('transactionHash', resolve)
                    .once('error', reject);
                });
              } catch (err) {
                throw new Error(`Send failed: ${err.message}`);
              }
              console.log(`Transaction hash: ${hash}`);

              // Poll for receipt every 10 seconds
              let receipt = null;
              let pollAttempts = 0;
              const maxPollAttempts = 18; // e.g., 3 minute timeout

              while (!receipt && pollAttempts < maxPollAttempts) {
                console.log("Checking receipt for Deploy Contract transaction... #", pollAttempts);
                await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
                receipt = await web3.eth.getTransactionReceipt(hash);
                pollAttempts++;
              }

              if (!receipt) {
                throw new Error('not mined');
              }

              if (!receipt.status) {
                throw new Error('Deployment failed (status false)');
              }

              console.log('Deployment receipt:', receipt);
              newTPsmartcontractaddress1 = receipt.contractAddress;
              updatestatus = true;
              return true;  // Success
            }, 5, 15000, (err) => err.message.includes('not mined') || err.message.includes('underpriced') || err.message.includes('TIMEOUT'));

          } catch (err) {
            console.error('Deployment attempt failed:', err.message);
            if (Date.now() - startTime > maxWaitTime) {
              throw new Error(`Timeout after ${TIMEOUT} seconds`);
            }
            gasMultiplier += 0.15;  // Increase for next attempt
            return await deployWithRetry();  // Recursive retry
          }
        };  // deployWithRetry

        await deployWithRetry();
        if (!newTPsmartcontractaddress1 || !web3.utils.isAddress(newTPsmartcontractaddress1)) {
          sendError("Deployment succeeded but no contract address was returned");
          return false;
        }
        
        console.log(`Deployment successful, address: ${newTPsmartcontractaddress1}`);
        sendLog(`Deployment successful, address: ${newTPsmartcontractaddress1}`);

        return true;  // Deployment successful
      } // deployContract = async ()
      
      if (! await deployContract()) {
        console.error("TP Smart Contract Deployment failed....");
        sendError("Tokenised Payable smart contract deployment failed. Please contact tech support.");
        return false;  // Deployment failed, exit
      }
      
      const wrapDepositToPayable = async () => {
            console.log('Calling wrapDepositToPayable to fund the contract from anchor account');
            if (!newTPsmartcontractaddress1) {
              sendError('Contract address not set after deployment');
              return false;
            }

            const tokenizedBankDeposit_ABI = JSON.parse(fs.readFileSync(tokenizedBank_abiFile, 'utf8').toString());
            const depositContract = new web3.eth.Contract(tokenizedBankDeposit_ABI, req.body.underlyingDSGDsmartcontractaddress);
            const tokenisedPayableContract = new web3.eth.Contract(ABI, newTPsmartcontractaddress1);

            // Do balance check
            const requiredAmount = web3.utils.toWei(req.body.totalBudget.toString(), 'ether');
            const anchorBalance = await depositContract.methods.balanceOf(anchor.address).call();
            if (web3.utils.toBN(anchorBalance).lt(web3.utils.toBN(requiredAmount))) {
              sendError(`Insufficient Tokenised Deposit balance in anchor wallet: ${web3.utils.fromWei(anchorBalance, 'ether')} < ${req.body.totalBudget}`);
              return false;
            }
            console.log(`Anchor Tokenised Deposit balance sufficient: ${web3.utils.fromWei(anchorBalance, 'ether')}`);

            // const gasPrice = await web3.eth.getGasPrice();  
            // Get gas prices (EIP-1559 support)
            const block = await web3.eth.getBlock('pending');

            // Step 4: Anchor to approve Tokenised Payable contract to pull underlyingDSGDsmartcontractaddress (sign and send signed tx)
            console.log("=== Step 4: Anchor to approve Tokenised Payable contract (sign and send signed tx) ===");
            //res.write("Step 4: Anchor to approve Tokenised Payable contract to pull underlyingDSGDsmartcontractaddress (sign and send signed tx) ");
            await retryWithBackoff(async (innerGasMultiplier, innerPriorityMultiplier, innerGasLimitMultiplier) => {
              console.log("Approving Tokenised Payable contract to pull funds..."); 
              
              let estGas = await depositContract.methods.approve(newTPsmartcontractaddress1, requiredAmount).estimateGas({ from: anchor.address });
              estGas = Math.floor(estGas * innerGasLimitMultiplier);
              let baseFee = BigInt(block.baseFeePerGas || await web3.eth.getGasPrice());
              let maxPriorityFee = BigInt(2000000000);  // Default 2 gwei; adjust
              let maxFeePerGas = (baseFee * BigInt(Math.floor(innerGasMultiplier * 100)) / BigInt(100)) + 
                                (maxPriorityFee * BigInt(Math.floor(innerPriorityMultiplier * 100)) / BigInt(100));
              maxFeePerGas = maxFeePerGas.toString();
              let maxPriorityFeePerGas = (maxPriorityFee * BigInt(Math.floor(innerPriorityMultiplier * 100)) / BigInt(100)).toString();

              const approveData = depositContract.methods.approve(newTPsmartcontractaddress1, requiredAmount).encodeABI();
              const approveTx = {
                from: anchor.address,
                to: req.body.underlyingDSGDsmartcontractaddress,
                data: approveData,
                gas: estGas,  
                maxPriorityFeePerGas: maxPriorityFeePerGas,
                maxFeePerGas: maxFeePerGas
              };
                
              const signedApprove = await web3.eth.accounts.signTransaction(approveTx, ANCHOR_PRIVATE_KEY);

              let approveHash;
              try {
                approveHash = await new Promise((resolve, reject) => {
                  web3.eth.sendSignedTransaction(signedApprove.rawTransaction)
                    .once('transactionHash', resolve)
                    .once('error', reject);
                });
              } catch (err) {
                throw new Error(`Approve send failed: ${err.message}`);
              }

              // Poll for receipt every 10 seconds
              let approveReceipt = null;
              let approvePollAttempts = 0;
              const maxApprovePollAttempts = 6;

              while (!approveReceipt && approvePollAttempts < maxApprovePollAttempts) {
                console.log("Checking receipt for approve transaction... #", approvePollAttempts);
                await new Promise(resolve => setTimeout(resolve, 10000));
                approveReceipt = await web3.eth.getTransactionReceipt(approveHash);
                approvePollAttempts++;
              }

              if (!approveReceipt) {
                throw new Error('not mined');
              }

              if (!approveReceipt.status) {
                throw new Error('Approve transaction failed');
              }

              console.log("Approved Tokenised Payable contract to pull underlying funds. approveReceipt:", approveReceipt);
            }, 5, 15000, (err) => err.message.includes('not mined') || err.message.includes('underpriced') || err.message.includes('TIMEOUT'));

            // Safely parse milestones (assuming first one; adjust if multiple)
            let milestones = req.body.milestones || [];
            if (typeof milestones === 'string') {
              milestones = JSON.parse(milestones);
            }
            const milestoneId = milestones.length > 0 ? milestones[0].id : 1;  

                        // Call generate BEFORE wrapDepositToPayable
                        // This is to create the TP for the Anchor to wrap the TBD into, and to get the metadata URI ready for the wrapDepositToPayable call
                        let metadataPath = await generateMetadataFile(
                          newTPsmartcontractaddress1,  // Contract address
                          1, 
                          req.body.totalBudget.toString(), 
                          milestoneId, // <-- this is draft milestone ID, we will update the metadata with real milestone ID after the wrapDepositToPayable call
                          Math.floor(new Date(req.body.enddate).getTime() / 1000),
                          `Completion of milestone #${milestoneId}`  // <-- this is draft milestone ID, we will update the metadata with real milestone ID after the wrapDepositToPayable call
                        );
                        console.log("Image and metadata file for TP is created:", metadataPath);
                        const newUri = `${metadataPath}?id=${Date.now()}.json`; 
                        metadataPath = newUri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
                        console.log("Changing metadataPath to https pinata gateway:", metadataPath);

            // Step 5: Wrap (sign and send signed tx), new TP is created by Anchor
            console.log("=== Step 5: Wrap (sign and send signed tx), new TP is created by Anchor ===");
            sendLog("Wrapping Tokenised Deposits into Tokenised Payable tokens");
            const wrapReceipt =  retryWithBackoff(async (innerGasMultiplier, innerPriorityMultiplier, innerGasLimitMultiplier) => {
                const endDateUnix = Math.floor(new Date(req.body.enddate).getTime() / 1000);
                let wrapGas = await tokenisedPayableContract.methods.wrapDepositToPayable(
                  requiredAmount,
                  endDateUnix,
                  '{"milestone": "structure complete"}', 
                  milestoneId,
                  metadataPath
                ).estimateGas({ from: anchor.address });
                wrapGas = Math.floor(wrapGas * innerGasLimitMultiplier);
                                
                let baseFee = BigInt(block.baseFeePerGas || await web3.eth.getGasPrice());
                let maxPriorityFee = BigInt(2000000000);  // Default 2 gwei; adjust as needed
                let maxFeePerGas = (baseFee * BigInt(Math.floor(innerGasMultiplier * 100)) / BigInt(100)) + 
                                  (maxPriorityFee * BigInt(Math.floor(innerPriorityMultiplier * 100)) / BigInt(100));
                maxFeePerGas = maxFeePerGas.toString();
                let maxPriorityFeePerGas = (maxPriorityFee * BigInt(Math.floor(innerPriorityMultiplier * 100)) / BigInt(100)).toString();

                console.log('Current maxFeePerGas:', maxFeePerGas);
                console.log('Current maxPriorityFeePerGas:', maxPriorityFeePerGas);

                const wrapData = tokenisedPayableContract.methods.wrapDepositToPayable(
                  requiredAmount,
                  endDateUnix,
                  '{"milestone": "structure complete"}',
                  milestoneId,
                  metadataPath
                ).encodeABI();

                const wrapTx = {
                  from: anchor.address,
                  to: newTPsmartcontractaddress1,
                  data: wrapData,
                  gas: wrapGas,
                  maxPriorityFeePerGas: maxPriorityFeePerGas,
                  maxFeePerGas: maxFeePerGas
                };
                
                const signedWrap = await web3.eth.accounts.signTransaction(wrapTx, ANCHOR_PRIVATE_KEY);

                let wrapHash;
                try {
                  wrapHash = await new Promise((resolve, reject) => {
                    web3.eth.sendSignedTransaction(signedWrap.rawTransaction)
                      .once('transactionHash', resolve)
                      .once('error', reject);
                  });
                } catch (err) {
                  throw new Error(`Wrap send failed: ${err.message}`);
                }

                // Poll for receipt every 10 seconds
                let receipt = null;
                let attempts = 0;
                while (!receipt && attempts < 6) {  // Max 6 attempts (~1 min at 10s intervals)
                  console.log("Checking receipt for wrap transaction... #", attempts);
                  await new Promise(resolve => setTimeout(resolve, 10000));  // Wait 10s
                  receipt = await web3.eth.getTransactionReceipt(wrapHash);
                  attempts++;
                }

                if (!receipt) {
                  throw new Error('not mined');
                }

                if (!receipt.status) {
                  throw new Error('Wrap transaction failed or not confirmed');
                }

                console.log("Funds wrapped successfully. wrapReceipt:", receipt);
                return receipt;
            }, 5, 15000, (err) => err.message.includes('not mined') || err.message.includes('underpriced') || err.message.includes('TIMEOUT'));

            const newId = 1;
            console.log(`Wrapped ${requiredAmount} into payable token ID ${newId}`);

            // Return needed values for transfer logic
            return { wrapReceipt, tokenisedPayableContract, milestoneId, newId };
      }; // wrapDepositToPayable
      const { wrapReceipt, tokenisedPayableContract, milestoneId, newId } = await wrapDepositToPayable();

      // Fallback if undefined
      let newId0 = newId || 1; // Default to 1 if not set

      console.log("after await wrapDepositToPayable()...");
      console.log("wrapReceipt:", wrapReceipt);
      //console.log("tokenisedPayableContract:", tokenisedPayableContract);
      console.log("draft milestoneId:", milestoneId);
      console.log("newId0:", newId0);

      // Step 6: Transfer TP to contractors as per milestones
      console.log("=== Step 6: transfer TP to contractors as per milestones ===");
      //log("Transferring Tokenised Payable tokens to contractors as per milestones ");
      const transferTPtoContractors = async (wrapReceipt, tokenisedPayableContract, milestoneId, newId0) => {
        console.log("Transferring Tokenised Payable tokens to contractors as per milestones");

        if (!newId0) {
          console.warn('newId0 is undefined - skipping transfer.');
          return; // Or throw new Error('Missing token ID');
        }
        // Await the wrapReceipt if it's a promise
        const resolvedReceipt = await wrapReceipt;
        console.log('Resolved wrapReceipt:', resolvedReceipt);                
        try {
          // In transferTPtoContractors, update balance check
          let balance = await tokenisedPayableContract.methods.balanceOf(anchor.address, newId0).call();  // Use anchor.address and newId0
          let attempts = 0;
          while (balance === '0' && attempts < 10) {
            console.log("Checking receipt for balanceOf... #", attempts);
            await new Promise(resolve => setTimeout(resolve, 10000));  // Increase to 10s
            balance = await tokenisedPayableContract.methods.balanceOf(anchor.address, newId0).call();
            attempts++;
          }
          if (balance === '0') { 
            sendError('No payable tokens found after wrap - deployment may have failed');
            return false;
          }

          // Fetch all token IDs from the contract (robust alternative to event parsing)
          let allIds = [];
          try {
            allIds = await tokenisedPayableContract.methods.getAllTokenIds().call();
          } catch (err) {
            console.warn('getAllTokenIds failed:', err.message);
            allIds = [newId0]; // Fallback to known ID
          }                  // Assume the last (most recent) ID is the original wrapped one, as contract is new
          let originalId = allIds[allIds.length - 1];
          console.log(`Original payable ID: ${originalId}`);

          //
          //
          //
          // splitPayable() requires originalId, amount to split, and metadata URI for the split portion. 
          // We loop through contractors, calculate their amounts based on linked purchases, 
          // then call splitPayable for each contractor to create new payable tokens in their wallets. 
          // The metadata URI can include details like milestone completion, contractor name, etc.
          //
          //
          //
          let contractors = req.body.contractors || [];
          if (typeof contractors === 'string') { contractors = JSON.parse(contractors); }

          // 
          // Looping through contractors; for each, calculate total amount from their linked purchases, 
          // then split the payable and transfer to their wallet
          //
          for (const con of contractors) {  
            let contractorAmount = 0;
            for (const pur of con.purchases || []) { contractorAmount += parseFloat(pur.amount) || 0;}
            const amountWei = web3.utils.toWei(contractorAmount.toString(), 'ether');

            if (web3.utils.toBN(amountWei).gt(0)) {
              if (!con.walletaddress) { 
                sendError(`Contractor wallet address not found for ${con.name}`);
                return false;
              }

              const block = await web3.eth.getBlock('pending');
              // Step 7: split TP 
              console.log("=== Step 7: split TP ===");
//                  sendLog(`Splitting Tokenised Payable for contractor ${con.name} with SGD${contractorAmount} for milestone ${milestoneId}`);
              sendLog(`Splitting Tokenised Payable for contractor ${con.name} with SGD${contractorAmount}`);

              // Call generate BEFORE splitPayable
              // This is to create the metadata for the new split token that will go to the contractor, which is needed as a parameter for splitPayable.
              let metadataPath = await generateMetadataFile(
                newTPsmartcontractaddress1,           // Contract address
                parseInt(originalId)+1,       // make assumption, make be risky leading to bug
                contractorAmount.toString(), 
                milestoneId, 
                Math.floor(new Date(req.body.enddate).getTime() / 1000),
                `Completion of milestone #${milestoneId}`
              );
              console.log("Image and metadata file for TP is created:", metadataPath);
              const newUri = `${metadataPath}?id=${Date.now()}.json`; 
              metadataPath = newUri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
              console.log("Changing metadataPath to https pinata gateway:", metadataPath);

              const splitReceipt = await retryWithBackoff(async (innerGasMultiplier, innerPriorityMultiplier, innerGasLimitMultiplier) => {
                  let baseFee = BigInt(block.baseFeePerGas || await web3.eth.getGasPrice());
                  let maxPriorityFee = BigInt(2000000000);  // Default 2 gwei; adjust as needed
                  let maxFeePerGas = (baseFee * BigInt(Math.floor(innerGasMultiplier * 100)) / BigInt(100)) + 
                              (maxPriorityFee * BigInt(Math.floor(innerPriorityMultiplier * 100)) / BigInt(100));
                  maxFeePerGas = maxFeePerGas.toString();
                  let maxPriorityFeePerGas = (maxPriorityFee * BigInt(Math.floor(innerPriorityMultiplier * 100)) / BigInt(100)).toString();

                  let splitGas = await tokenisedPayableContract.methods.splitPayable(originalId, amountWei, metadataPath).estimateGas({ from: anchor.address });
                      splitGas = Math.floor(splitGas * innerGasLimitMultiplier);

                  const splitData = tokenisedPayableContract.methods.splitPayable(
                    originalId,
                    amountWei,
                    metadataPath
                  ).encodeABI();

                  const splitTx = {
                    from: anchor.address,
                    to: newTPsmartcontractaddress1,
                    data: splitData,
                    gas: splitGas,
                    maxPriorityFeePerGas: maxPriorityFeePerGas,
                    maxFeePerGas: maxFeePerGas
                  };

                  const signedSplit = await web3.eth.accounts.signTransaction(splitTx, ANCHOR_PRIVATE_KEY);
                  const sentTx = await web3.eth.sendSignedTransaction(signedSplit.rawTransaction);

                  // Wait for confirmation (simple polling for receipt)
                  let splitReceipt = null;
                  let attempts = 0;
                  while (!splitReceipt && attempts < 30) {  // Max 30 attempts (~5 min at 10s blocks)
                    console.log("Checking receipt for split transaction... #", attempts);
                    splitReceipt = await web3.eth.getTransactionReceipt(sentTx.transactionHash);
                    if (!splitReceipt) {
                      await new Promise(resolve => setTimeout(resolve, 5000));  // Wait 5s
                      attempts++;
                    }
                  }
                  if (!splitReceipt || !splitReceipt.status) {
                    throw new Error('Split transaction failed or not confirmed');
                  }

                  console.log("Funds split successfully. splitReceipt:", splitReceipt);

                return splitReceipt;
              }, 5, 15000, (err) => err.message.includes('not mined') || err.message.includes('underpriced') || err.message.includes('TIMEOUT'));

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
                sendError('Failed to extract new payable ID from split receipt');
                return false;
              }

              console.log(`Split new payable ID ${newId} with value ${contractorAmount} for contractor ${con.name}`);
              
              // Reduce the balance in the original NFT index 1, by the split value
              // 1. Query the NEW reduced value of the original payable (robust; avoids drift)
              const updatedOriginalValueWei = await tokenisedPayableContract.methods
                .payables(originalId)
                .call()
                .then(p => p.value); // struct field .value

              const updatedOriginalValue = web3.utils.fromWei(updatedOriginalValueWei, 'ether');

              // 2. Generate NEW metadata + image for the ORIGINAL token (with reduced value)
              // This is to reflect the reduced value in the original token that remains with the Anchor after the split
              let originalMetadataPath = await generateMetadataFile(
                newTPsmartcontractaddress1,                     // Contract address
                parseInt(originalId),                   // Original ID (e.g. 1)
                updatedOriginalValue.toString(),        // Reduced value
                milestoneId,
                Math.floor(new Date(req.body.enddate).getTime() / 1000),
                `Completion of milestone #${milestoneId}` // or any updated description
              );
              console.log("Image and metadata file for TP is created:", originalMetadataPath);
              const newUri0 = `${originalMetadataPath}?id=${Date.now()}.json`; 
              originalMetadataPath = newUri0.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
              console.log("Changing metadataPath to https pinata gateway:", originalMetadataPath);
              console.log(`Updated metadata for ORIGINAL payable #${originalId}:`, originalMetadataPath);

              // 3. Call setTokenURI (onlyOwner → from anchor)
              await retryWithBackoff(async (innerGasMultiplier, innerPriorityMultiplier, innerGasLimitMultiplier) => {

                const currentOwner = await tokenisedPayableContract.methods.owner().call();
                console.log(`tokenisedPayableContract contract owner: ${currentOwner}, Anchor address: ${anchor.address}`); 

                console.log("Estimating gas for setTokenURI on original payable...");
                let setUriGas = await tokenisedPayableContract.methods
                  .setTokenURI(parseInt(originalId), originalMetadataPath)
                  .estimateGas({ from: signer.address });   // contract owner is signer
                setUriGas = Math.floor(setUriGas * innerGasLimitMultiplier);

                const block = await web3.eth.getBlock('pending');
                let baseFee = BigInt(block.baseFeePerGas || await web3.eth.getGasPrice());
                let maxPriorityFee = BigInt(2000000000);
                let maxFeePerGas = (baseFee * BigInt(Math.floor(innerGasMultiplier * 100)) / BigInt(100)) +
                                  (maxPriorityFee * BigInt(Math.floor(innerPriorityMultiplier * 100)) / BigInt(100));
                maxFeePerGas = maxFeePerGas.toString();
                let maxPriorityFeePerGas = (maxPriorityFee * BigInt(Math.floor(innerPriorityMultiplier * 100)) / BigInt(100)).toString();

                console.log("Encoding setTokenURI transaction data...");
                const setUriData = tokenisedPayableContract.methods
                  .setTokenURI(parseInt(originalId), originalMetadataPath)
                  .encodeABI();

                const setUriTx = {
                  from: signer.address,   // contract owner is signer
                  to: newTPsmartcontractaddress1,
                  data: setUriData,
                  gas: setUriGas,
                  maxPriorityFeePerGas: maxPriorityFeePerGas,
                  maxFeePerGas: maxFeePerGas
                };
                const signedSetUri = await web3.eth.accounts.signTransaction(setUriTx, SIGNER_PRIVATE_KEY);  // sign using signer's private key

                console.log("Sending setTokenURI transaction:", setUriTx);
                const sentSetUri = await web3.eth.sendSignedTransaction(signedSetUri.rawTransaction);

                // Poll for receipt (same pattern you already use)
                let receipt = null;
                let attempts = 0;
                while (!receipt && attempts < 30) {
                  console.log("Checking receipt for split transaction... #", attempts);
                  receipt = await web3.eth.getTransactionReceipt(sentSetUri.transactionHash);
                  console.log("Checking receipt for setTokenURI transaction... #", attempts);
                  if (!receipt) {
                    await new Promise(r => setTimeout(r, 5000));
                    attempts++;
                  }
                }
                if (!receipt || !receipt.status) {
                  throw new Error('setTokenURI transaction failed');
                }

                console.log(`ORIGINAL payable #${originalId} metadata/image updated successfully`);
              }, 5, 15000, (err) => err.message.includes('not mined') || err.message.includes('underpriced') || err.message.includes('TIMEOUT'));

              const currentUri = await tokenisedPayableContract.methods.uri(1).call();
              console.log(`Current on-chain URI for NFT #1: ${currentUri}`);

              // Step 8: Transfer the split TP to contractor
              console.log("=== Step 8: Transfer the split TP to contractor ===");
              sendLog(`Transferring the split Tokenised Payable from Anchor to contractor ${con.name} `);
              await retryWithBackoff(async (innerGasMultiplier, innerPriorityMultiplier, innerGasLimitMultiplier) => {
                let transferGas = await tokenisedPayableContract.methods.safeTransferFrom(anchor.address, con.walletaddress, newId, 1, '0x').estimateGas({ from: anchor.address, to: newTPsmartcontractaddress1 });
                transferGas = Math.floor(transferGas * innerGasLimitMultiplier);

                let baseFee = BigInt(block.baseFeePerGas || await web3.eth.getGasPrice());
                let maxPriorityFee = BigInt(2000000000);  // Default 2 gwei; adjust as needed
                let maxFeePerGas = (baseFee * BigInt(Math.floor(innerGasMultiplier * 100)) / BigInt(100)) + 
                              (maxPriorityFee * BigInt(Math.floor(innerPriorityMultiplier * 100)) / BigInt(100));
                maxFeePerGas = maxFeePerGas.toString();
                let maxPriorityFeePerGas = (maxPriorityFee * BigInt(Math.floor(innerPriorityMultiplier * 100)) / BigInt(100)).toString();

                const transferData = tokenisedPayableContract.methods.safeTransferFrom(
                  anchor.address, 
                  con.walletaddress, 
                  newId, 
                  1, 
                  '0x'                                  
                ).encodeABI();

                const transferTx = {
                  from: anchor.address,
                  to: newTPsmartcontractaddress1,
                  data: transferData,
                  gas: transferGas,
                  maxPriorityFeePerGas: maxPriorityFeePerGas,
                  maxFeePerGas: maxFeePerGas
                };

                const signedTransfer = await web3.eth.accounts.signTransaction(transferTx, ANCHOR_PRIVATE_KEY);
                const sentTx = await web3.eth.sendSignedTransaction(signedTransfer.rawTransaction);

                // Wait for confirmation (simple polling for receipt)
                let transferReceipt = null;
                let attempts = 0;
                while (!transferReceipt && attempts < 30) {  // Max 30 attempts (~5 min at 10s blocks)
                  transferReceipt = await web3.eth.getTransactionReceipt(sentTx.transactionHash);
                  console.log("Checking receipt for transfer transaction... #", attempts);
                  if (!transferReceipt) {
                    await new Promise(resolve => setTimeout(resolve, 5000));  // Wait 5s
                    attempts++;
                  }
                }
                if (!transferReceipt || !transferReceipt.status) {
                  throw new Error('Transfer transaction failed or not confirmed');
                }

                console.log("Funds split successfully. transferReceipt:", transferReceipt);

                console.log(`Transferred payable ID ${newId} (${contractorAmount} value) to contractor ${con.name}. Receipt:`, transferReceipt);
              }, 5, 15000, (err) => err.message.includes('not mined') || err.message.includes('underpriced') || err.message.includes('TIMEOUT'));
            }
          }
        } catch (err) {
          console.error('Error in transferTPtoContractors:', err.message);
          throw err;
        }
      };  // transferTPtoContractors
      await transferTPtoContractors(wrapReceipt, tokenisedPayableContract, milestoneId, newId0);

    } catch (error) {
      console.error('Error in dAppCreate:', error);
      sendError("Error during contract deployment: " + error.message);
      //if (!errorSent) {
      //  res.status(500).send({ message: "Error during contract deployment: " + error.message });
      //  errorSent = true;
      //}
      return false;
    }
    return updatestatus;
  } //dAppCreate

  console.log("*** isNewDtscf = ", isNewDtscf);
  console.log("*** req.body.underlyingDSGDsmartcontractaddress = ", req.body.underlyingDSGDsmartcontractaddress);

  if (isNewDtscf) {   // new dtscf
    updatestatus = await dAppCreate();
    if (!updatestatus) {
      console.error("Error in dAppCreate, sending error response to client.");
      sendError("Error during contract deployment. Please try again. Report to tech support if problem is recurring.");
    }
  } else {            // update dtscf
    updatestatus = await dAppUpdate(); 
    if (!updatestatus) {
      console.error("Error in dAppUpdate, sending error response to client.");
      sendError("Error during update. Please try again. Report to tech support if problem is recurring.");
    }
  }
  console.log("approveDraftById Update status (1):", updatestatus);

////////////////////////////// Blockchain ////////////////////////

  console.log('New Dtscf Contract deployed updating DB: ', newTPsmartcontractaddress1);

  if (updatestatus) { // updatestatus
  // update draft table
    console.log("Updating row in dtscf draft table with status=3 and newTPsmartcontractaddress1("+newTPsmartcontractaddress1+").");
    await Dtscf_Drafts.update(  // update draft table status to "3"
    { 
      status                : 3,
      smartcontractaddress  : newTPsmartcontractaddress1,
      approverComments      : req.body.approvercomments,
    }, 
    { where:      { id: draft_id }},
    )
    .then(num => {
      if (num == 1) {


      } else {
        sendError(`Record updated =${num}. Cannot update Dtscf draft with id=${id}. Maybe Dtscf was not found or req.body is empty!`);
        //if (!errorSent) {
        //  res.send({
        //    message: `${req.body}. Record updated =${num}. Cannot update Dtscf with id=${id}. Maybe Dtscf was not found or req.body is empty!`
        //  });
        //  errorSent = true;
        //}
      }
    })
    .catch(err => {
      console.log(err);
      sendError('Error when signing transaction. Please try again. Report to tech support if problem is recurring.');
      //if (!errorSent) {
      //  console.log("Sending error 400 back to client");
      //  res.status(400).send({ 
      //    message: 'Error when signing transaction. Please try again. Report to tech support if problem is recurring.',
      //  });
      //  errorSent = true;
      //}
      return false;
    });

    try {
      if (isNewDtscf) {
        console.log("Creating row in dtscf prod table.");
        var approved_id;
        const newDtscf = await Dtscfs.create( // create Dtscf in the database !!!!!
          { 
            name                  : req.body.name,
            description           : req.body.description,
            totalBudget           : parseInt(req.body.totalBudget) || 0,
            blockchain            : req.body.blockchain || 0, // Default or from form
            underlyingTokenID     : req.body.underlyingTokenID || null,
            underlyingDSGDsmartcontractaddress : req.body.underlyingDSGDsmartcontractaddress || '',
            smartcontractaddress  : newTPsmartcontractaddress1,
            campaign_id           : req.body.campaign_id || null,
            anchor_id             : req.body.anchor_id || null,

            startdate             : req.body.startdate, 
            enddate               : req.body.enddate,
            draftdtscfid          : draft_id,
            actionby              : req.body.actionby,
            draftdtscfid          : req.body.id,             
          }, 
        )
        .then(data => {
          logDataValues("Dtscf create success: ", data);
          approved_id = data.id;
        })
        .catch(err => {
          console.log("Error while creating dtscf row: "+err.message);
          throw new Error('Error when signing transaction. Please try again. Report to tech support if problem is recurring.');
        });

        console.log("Updating draft table to prod ID:", approved_id);
        await Dtscf_Drafts.update(  // update draft table with dtscf project id
        { 
          approveddtscfid       : approved_id,
        }, 
        { where:      { id: draft_id }},
        )
        .then(num => {
          if (num == 1) {
            console.log("Updated dtscf draft table with dtscf project id.");
          } else {
            throw new Error(`${req.body}. Record updated =${num}. Cannot update Dtscf draft with id=${id}.`);
          }
        })
        .catch(err => {
          console.log(err);
          throw new Error('Error when signing transaction. Please try again. Report to tech support if problem is recurring.');
        });

        // copy draft milestones to prod table
        const milestoneMap9 = {}; // to keep track of new prod milestone ID mapping
        const draftMilestones = await Milestone_draft.findAll({ where: { dtscf_project_id: draft_id } });
        for (const dm of draftMilestones) {
          console.log("Creating milestone:", dm);
          const newMilestone9 = await Milestone.create({
            name: dm.name,
            budget: dm.budget,
            startdate: dm.startdate,
            enddate: dm.enddate,
            dtscf_project_id: approved_id,
          });
          milestoneMap9[dm.id] = newMilestone9.id;  // draft_id --> prod_id 
          console.log("Draft milestone ID:"+ dm.id + " mapped to new prod milestone ID:" + newMilestone9.id);
          console.log("<<<<<<<<<<<<<< milestoneMap9[" + dm.id + "] = newMilestone9.id: "+ newMilestone9.id);
        }
        console.log("Finished creating milestones.");
        console.log("milestoneMap9:", milestoneMap9);

        // copy draft contractors and purchases to prod tables
        async function copyContractorsAndPurchases(draftParentId = null, newParentId = null) {
          const draftContractors = await Contractor_draft.findAll({
            where: {
              dtscf_project_id: draft_id,
              dtscf_parent_contractor_id: draftParentId
            }
          });
          for (const dc of draftContractors) {
            console.log("Creating contractor:", dc);
            const newContractor = await Contractor.create({
              name: dc.name,
              budget: dc.budget,
              walletaddress: dc.walletaddress,
              dtscf_project_id: approved_id,
              dtscf_parent_contractor_id: newParentId,
              dtscf_milestone_id: dc.dtscf_milestone_id || null
            });
            const newConId = newContractor.id;
            console.log("newConId:", newConId);
            console.log("Finished creating contractor.");

            // Copy purchases
            const draftPurchases = await Purchase_draft.findAll({
              where: { dtscf_contractor_id: dc.id }
            });
            for (const dp of draftPurchases) {
              console.log("Creating purchase:", dp);
              const mappedMilestoneId = milestoneMap9[dp.dtscf_milestone_id] || null;    // draft_id --> prod_id; if not found, set to null
              console.log("Draft purchase dtscf_milestone_id:", dp.dtscf_milestone_id, "mapped to prod dtscf_milestone_id:", mappedMilestoneId);
              console.log("<<<<<<<<<<<<<<  mappedMilestoneId:", mappedMilestoneId);

              await Purchase.create({
                description: dp.description,
                amount: dp.amount,
                dtscf_project_id: approved_id,
                dtscf_contractor_id: newConId,
                dtscf_milestone_id: mappedMilestoneId,  // draft_id --> prod_id
                invoice_blob: dp.invoice_blob
              });
            }
            // Recurse for subcontractors
            await copyContractorsAndPurchases(dc.id, newConId);
            console.log("Finished creating purchase.");
          }
        }
        await copyContractorsAndPurchases();
        console.log("Finished creating milestones, contractor and purchase.");

        sendSuccess("Tokenised Payable created successfully and transferred to Anchor and contractors.");
        //if (!errorSent) {
        //  res.send({ id: approved_id, smartcontractaddress: newTPsmartcontractaddress1, message: "Tokenised Payable created successfully."});
        //  errorSent = true;
        //}
        return true;
      } else { // not isNewDtscf
        await Dtscfs.update( // update Dtscf in the database !!!!! 
        { 
          name                  : req.body.name,
          totalBudget           : parseInt(req.body.totalBudget) || 0,
          blockchain            : req.body.blockchain || 0, // Default or from form
          underlyingTokenID     : req.body.underlyingTokenID || null,
          underlyingDSGDsmartcontractaddress : req.body.underlyingDSGDsmartcontractaddress || '',
          campaign_id           : req.body.campaign_id || null,
          anchor_id             : req.body.anchor_id || null,

          startdate             : req.body.startdate, 
          enddate               : req.body.enddate,
          
          actionby              : req.body.actionby,
          draftdtscfid          : req.body.id,             
        }, 
        { where:      { id: req.body.approveddtscfid }},
        )
        .then(data => {
          logDataValues("Dtscf update success: ", data);
          sendSuccess("Dtscf updated successfully. "+data.message);
          //if (!errorSent) {
          //  res.send(data);
          //  errorSent = true;
          //}
        })
        .catch(err => {
          console.log("Error while updating dtscf: "+err.message);
          throw new Error('Please try again. Report to tech support if problem is recurring.');
        });
      }
    } catch(err) {
      sendError("Error during contract deployment: " + err.message );
      //if (!errorSent) {
      //  console.log("Sending error 400 back to client");
      //  res.status(400).send({ message: "Error during contract deployment: " + err.message });
      //  errorSent = true;
      //}
      return false;   
    }
  }  

  await Dtscfs.update(  
  { 
    status       : 3, // 1 = unwrap draft created, 3 = unwrap completed
  }, 
  { where:      { id: m_id }},
  )
  .then(num => {
    if (num == 1) {

      // write to audit
      AuditTrail.create(
        { 
          action                : "Dtscf unwrap - draft created",
          id                    : m_id,
        }, 
      )
      .then(auditres => {
        console.log("Data written to audittrail for setting dtscf unwrap completed request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for setting dtscf unwrap completed request: "+err.message);
      });
      
      res.send({
        message: "Unwrap draft was created successfully."
      });
    } else {
      res.send({
        message: `${req.body}. Record updated =${num}. Cannot update Dtscf with id=${m_id}. Maybe Dtscf was not found!`
      });
    }
  })
  .catch(err => {
    console.log(err);
    res.status(500).send({
      message: `Error updating Dtscfs. ${err}`
    });
  });
};  // approveUnwrapDraftById

exports.draftCreate = async (req, res) => {
  let errorSent = false;
  console.log("Received for Dtscf draft Create:");
  //console.log(req.body); // Your existing log
  console.log(JSON.stringify(req.body, null, 2));

  // Set up streaming response
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.status(200);

  try {
    res.write('LOG: Starting DTSCF draft creation...\n');

    const parsedBody = buildNestedObject(req.body);
    console.log('LOG: Parsed form data successfully.\n');

    const {
      name, description, totalBudget, anchor_id, underlyingTokenID,
      underlyingDSGDsmartcontractaddress, blockchain, campaign_id,
      startdate, enddate, milestones = [], contractors = [],
      maker, approver, actionby, approveddtscfid, txntype
    } = parsedBody;

    if (!name || !totalBudget || !maker || !approver) {
      throw new Error('Missing required fields');
    }
    //res.write('LOG: Validated input data.\n');

    //res.write('LOG: Skipping file uploads (no files provided).\n');

    const newDtscfDraft = await Dtscf_Drafts.create({
      name,
      description,
      anchor_id: parseInt(anchor_id) || null,
      totalBudget: parseInt(totalBudget) || 0,
      underlyingTokenID: parseInt(underlyingTokenID) || null,
      underlyingDSGDsmartcontractaddress: underlyingDSGDsmartcontractaddress || '',
      campaign_id: parseInt(campaign_id) || null,
      blockchain: parseInt(blockchain) || 0,
      startdate,
      enddate,
      txntype: parseInt(txntype) || 0,
      status: 2,
      name_changed: false,
      description_changed: false,
      totalBudget_changed: false,
      startdate_changed: false,
      enddate_changed: false,
      actionby,
      actiontimedate: new Date(),
      maker,
      approver,
//      checkerComments: '',
      approverComments: ''
    });
    const draft_id = newDtscfDraft.id;
    console.log(`LOG: Created DTSCF draft in database with ID ${draft_id}.\n`);

    // 1. Create a dictionary to hold the mapping of Milestone Name -> Newly created Milestone ID
    const milestoneMap = {};

    // 2. Loop through and create your milestones
    for (const [index, ms] of milestones.entries()) {
      const newMilestone = await Milestone_draft.create({
        dtscf_project_id: draft_id,
        name: ms.name,
        budget: parseInt(ms.budget) || 0,
        startdate: ms.startdate,
        enddate: ms.enddate,
        description: ms.description || '',
        name_changed: false,
        budget_changed: false,
        startdate_changed: false,
        enddate_changed: false
      });
      // Save the new ID mapped to the milestone's name
      milestoneMap[ms.name] = newMilestone.id;  // 

      console.log(`LOG: Added milestone ${index + 1}/${milestones.length}.\n`);
    }

    for (const [index, con] of contractors.entries()) {
      const newContractor = await Contractor_draft.create({
        dtscf_project_id: draft_id,
        name: con.name,
        budget: parseInt(con.budget) || 0,
        walletaddress: con.walletaddress || '',
        name_changed: false,
        budget_changed: false,
        walletaddress_changed: false,
        dtscf_project_id_changed: false,
        dtscf_parent_contractor_id_changed: false
      });
      console.log(`LOG: Added contractor ${index + 1}/${contractors.length}.\n`);

// 3. Map the correct ID when creating purchases
      for (const [purIndex, pur] of (con.purchases || []).entries()) {
        
        // Try to get the ID from our map, fallback to null if not found
        const mappedMilestoneId = milestoneMap[pur.milestone] || null;

        await Purchase_draft.create({
          dtscf_project_id: draft_id,
          dtscf_contractor_id: newContractor.id,
          description: pur.description,
          amount: parseInt(pur.amount) || 0,
          dtscf_milestone_id: mappedMilestoneId, 
          description_changed: false,
          amount_changed: false,
          dtscf_project_id_changed: false,
          dtscf_contractor_id_changed: false
        });
        console.log(`LOG: Added purchase ${purIndex + 1} for contractor ${index + 1}.\n`);
      }
    }

    await AuditTrail.create({
      action: "Dtscf create request - drafted",
      name,
      totalBudget: parseInt(totalBudget),
      status: 0
      // Add other fields as needed from your INSERT
    });
    console.log('LOG: Logged to audit trail.\n');

    // Explicit success and close
    res.write('SUCCESS: DTSCF draft created successfully.\n');
    res.end();
    console.log('[SERVER] Sent success and ended response.'); // Diagnostic
  } catch (err) {
    console.error('[SERVER] Error in draftCreate:', err);
    if (!errorSent) {
      res.write(`ERROR: Error creating DTSCF draft: ${err.message}\n`);
      res.end();
      errorSent = true;
    }
  }
}; // draftCreate for new Dtscf creation

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
//  const checkercomments = req.body.checkerComments || '';
  const approvercomments = req.body.approverComments || '';

  await Dtscf_Drafts.update(
      { 
//        checkerComments :   checkercomments,
        approverComments : req.body.approverComments || '',
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
          message: `Error updating Dtscfs. ${err}`
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

  //res.setHeader('Content-Type', 'text/event-stream');
  //res.setHeader('Cache-Control', 'no-cache');
  //res.setHeader('Connection', 'keep-alive');

  const mustCompile = true;  // For now, always compile to ensure latest code is used. Can optimize later by checking timestamps.
  let hasSentResponse = false;
  var newTPsmartcontractaddress2 = null;
  let newMilestoneIdArr = []; // to keep track of draft milestone ID --> prod milestone ID mapping for updates


  res.writeHead(200, {
    'Content-Type': 'text/plain',
    'Transfer-Encoding': 'chunked'
  });

  const sendLog = message => {
    console.log(message);  // Server-side log for debugging

    if (hasSentResponse) return;  // Prevent sending logs after response has ended
    res.write(`LOG: ${message}\n`);
  };

  const sendSuccess = message => {
    console.log(message);  // Server-side log for debugging

    if (hasSentResponse) return;  // Prevent sending logs after response has ended
    res.write(`SUCCESS: ${message}\n`);
    res.end();
    hasSentResponse = true;
  };

  const sendError = message => {
    console.error(message);  // Server-side log for debugging

    if (hasSentResponse) return;  // Prevent sending logs after response has ended
    res.write(`ERROR: ${message}\n`);
    res.end();
    hasSentResponse = true;
  };

//  var errorSent = false;
  var updatestatus = false;

  // Validate request
  if (!req.body.name) {
    sendError("Content can not be empty!");
    return;
  }

/*
  const metadataPath = await generateMetadataFile(
                  "0x0D2AA083E7cDA7B03C099381956F4147a32eaF67",  // Contract address
                  1, 
                  "100", 
                  1, 
                  Math.floor(new Date(req.body.enddate).getTime() / 1000),
                  `Completion of milestone #1`
                );
  console.log("Testing NFT!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
      if (!errorSent) {
        res.status(400).send({
          message: "Exit!!!"
        });
        errorSent = true;
      }
  return;
*/

  const draft_id = req.params.id;
  console.log("req.params.id = ", req.params.id);
  console.log("req.body.id = ", req.body.id);

  //console.log("Input data for approveDraftById(), ", req.body);
  console.log("Input data for approveDraftById(), ", JSON.stringify(req.body, null, 2));

  if (req.body.txntype !==0     // create dtscf
    && req.body.txntype !==1    // update dtscf
    ) {
      sendError("Invalid transaction type!");
      return;  
  }


  const isNewDtscf = (req.body.txntype === 0? true : false); // Create = true, Edit/Update = false

  console.log("Received approveDraftById for Create/Update:");


  // Now we do database operation first, if failed then roll back, and we also set the dbstatus to "PENDING"
  if (isNewDtscf) {
    try {              // atomic txn
      console.log("Creating row in dtscf prod table.");
      const atomicResult = await db.sequelize.transaction(async (ttt) => {
        var approved_id;
        const newDtscf = await Dtscfs.create( // create Dtscf in the database !!!!!
          { 
            name                  : req.body.name,
            description           : req.body.description,
            totalBudget           : parseInt(req.body.totalBudget) || 0,
            blockchain            : req.body.blockchain || 0, // Default or from form
            underlyingTokenID     : req.body.underlyingTokenID || null,
            underlyingDSGDsmartcontractaddress : req.body.underlyingDSGDsmartcontractaddress || '',
            smartcontractaddress  : newTPsmartcontractaddress2,
            campaign_id           : req.body.campaign_id || null,
            anchor_id             : req.body.anchor_id || null,

            startdate             : req.body.startdate, 
            enddate               : req.body.enddate,
            draftdtscfid          : draft_id,
            actionby              : req.body.actionby,
            draftdtscfid          : req.body.id,   

            dbstatus              : "PENDING",
          }, 
          { transaction: ttt }  // pass transaction object to ensure atomicity)
        )
        .then(data => {
          logDataValues("Dtscf create success: ", data);
          approved_id = data.id;
        })
        .catch(err => {
          console.log("Error while creating dtscf row: "+err.message);
          throw new Error('Error when signing transaction. Please try again. Report to tech support if problem is recurring.');
        });

        console.log("Updating draft table to prod ID:", approved_id);
        await Dtscf_Drafts.update(  // update draft table with dtscf project id
        { 
          approveddtscfid       : approved_id,
        }, 
        { where:      { id: draft_id }},
        { transaction: ttt }
        )
        .then(num => {
          if (num == 1) {
            console.log("Updated dtscf draft table with dtscf project id.");
          } else {
            throw new Error(`${req.body}. Record updated =${num}. Cannot update Dtscf draft with id=${id}.`);
          }
        })
        .catch(err => {
          console.log(err);
          throw new Error('Error when signing transaction. Please try again. Report to tech support if problem is recurring.');
        });

        // copy draft milestones to prod table
        const milestoneMap9 = {}; // to keep track of new prod milestone ID mapping
        newMilestoneIdArr = [];
        const draftmilestoneIds = req.body.milestones ? req.body.milestones.map(m => m.id) : [];
        const draftMilestones = await Milestone_draft.findAll({ where: { id: draftmilestoneIds } });        // only create milestones from req.body.milestones
//          const draftMilestones = await Milestone_draft.findAll({ where: { dtscf_project_id: draft_id } }); // this is wrong, it created prod milestones for all drafts
        for (const dm of draftMilestones) {
          console.log("Creating milestone:", dm);
          const newMilestone9 = await Milestone.create({
            name: dm.name,
            budget: dm.budget,
            startdate: dm.startdate,
            enddate: dm.enddate,
            dtscf_project_id: approved_id,
            dbstatus              : "PENDING",
          },
          { transaction: ttt }  // pass transaction object to ensure atomicity)
          );
          milestoneMap9[dm.id] = newMilestone9.id;  // draft_id --> prod_id
          newMilestoneIdArr.push( 
            {
              id: newMilestone9.id,
              name: dm.name,
              budget: dm.budget,
              startdate: dm.startdate,
              enddate: dm.enddate,
            }
          ); // store the new prod milestone ID in the array, to be used later in copyContractorsAndPurchases when setting dtscf_milestone_id for purchases
          console.log("Draft milestone ID:"+ dm.id + " mapped to new prod milestone ID:" + newMilestone9.id);
          console.log("<<<<<<<<<<<<<< milestoneMap9[" + dm.id + "] = newMilestone9.id: "+ newMilestone9.id);
        }
        console.log("Finished creating milestones.");
        console.log("milestoneMap9:", milestoneMap9);

        //newMilestoneIdArr = milestoneMap9; // store the milestone mapping for this draft_id, to be used later in copyContractorsAndPurchases when setting dtscf_milestone_id for purchases
        console.log(">>>>>>  newMilestoneIdArr for draft_id "+ draft_id + ": ", newMilestoneIdArr);

        // copy draft contractors and purchases to prod tables
        async function copyContractorsAndPurchases(draftParentId = null, newParentId = null) {
          const draftContractors = await Contractor_draft.findAll({
            where: {
              dtscf_project_id: draft_id,
              dtscf_parent_contractor_id: draftParentId
            }
          });
          for (const dc of draftContractors) {
            console.log("Creating contractor:", dc);
            const newContractor = await Contractor.create({
              name: dc.name,
              budget: dc.budget,
              walletaddress: dc.walletaddress,
              dtscf_project_id: approved_id,
              dtscf_parent_contractor_id: newParentId,
              dtscf_milestone_id: dc.dtscf_milestone_id || null,
              dbstatus              : "PENDING",
            },
            { transaction: ttt }  // pass transaction object to ensure atomicity)
            );
            const newConId = newContractor.id;
            console.log("newConId:", newConId);
            console.log("Finished creating contractor.");

            // Copy purchases
            const draftPurchases = await Purchase_draft.findAll({
              where: { dtscf_contractor_id: dc.id }
            });
            for (const dp of draftPurchases) {
              console.log("Creating purchase:", dp);
              const mappedMilestoneId = milestoneMap9[dp.dtscf_milestone_id] || null;    // draft_id --> prod_id; if not found, set to null
              console.log("Draft purchase dtscf_milestone_id:", dp.dtscf_milestone_id, "mapped to prod dtscf_milestone_id:", mappedMilestoneId);
              console.log("<<<<<<<<<<<<<<  mappedMilestoneId:", mappedMilestoneId);

              await Purchase.create({
                description: dp.description,
                amount: dp.amount,
                dtscf_project_id: approved_id,
                dtscf_contractor_id: newConId,
                dtscf_milestone_id: mappedMilestoneId,  // draft_id --> prod_id
                invoice_blob: dp.invoice_blob,
                dbstatus              : "PENDING",
              },
              { transaction: ttt }  // pass transaction object to ensure atomicity)
              );
            }
            // Recurse for subcontractors
            await copyContractorsAndPurchases(dc.id, newConId);
            console.log("Finished creating purchase.");
          }
        }
        await copyContractorsAndPurchases();
        console.log("Finished creating milestones, contractor and purchase. Committing transaction...");

        /////////////////// test  
/*
        for (const ms of newMilestoneIdArr) {   // iterate thru milestones
          // find the total amounrt for this milestone by summing budgets of linked contractors
          let milestoneAmount = 0;
          console.log(`Calculating total amount for milestone ${ms.name} (ID: ${ms.id})...`);

          const purchases = await Purchase.findAll({
            where: { dtscf_milestone_id: ms.id },
            transaction: ttt,
            include: [{
              model: Contractor,
              required: false // This ensures it stays a LEFT JOIN
            }]
          }); 

          console.log(`Milestone ${ms.name} has ${purchases.length} linked purchases`);
          console.log('Purchases for this milestone:', purchases.map(p => ({ amount: p.amount, contractor: p.dtscf_contractor ? p.dtscf_contractor.name : 'N/A' }))); 

          // 4. Split the Milestone obligation among Contractors
          for (const purchase of purchases) {
            const contractor = purchase.dtscf_contractor;
            const amountToMint = purchase.amount;
            const contractorWallet = contractor?.walletaddress;

            if (!contractorWallet) {
              console.error(`No wallet address found for contractor: ${contractor.name}`);
              continue;
            }
            console.log(`Processing purchase of amount ${amountToMint} for contractor ${contractor.name} with wallet ${contractorWallet}`); 
          }
        }
*/
        ///////////////////////// 
/*
                  const web3 = setupWeb3(req.body.blockchain);

                  var newId = 0;
                  var originalTPamount = req.body.totalBudget;
                  let contractors = req.body.contractors || [];
                  if (typeof contractors === 'string') { contractors = JSON.parse(contractors); }
                  console.log("Contractors to process for splitting TP: ", contractors);
                  for (const con of contractors) {    // iterate thru contractors
                    //let purAmount = 0;

                    //console.log("Purchases linked to contractor "+ con.name + ": ", con.purchases);
                    // Loop thru purchases linked to this contractor
                    for (const pur of con.purchases || []) { 
                      console.log("Purchases linked to contractor "+ con.name + ": ", pur);

                      const purAmount = parseFloat(pur.amount) || 0;   //zzz <--- cannot total, must create 1 TP for every purchase
                      const amountWei = web3.utils.toWei(purAmount.toString(), 'ether');

                      if (web3.utils.toBN(amountWei).gt(0)) {
                        if (!con.walletaddress) { 
                          sendError(`Contractor wallet address not found for ${con.name}`);
                          return false;
                        }

                        const block = await web3.eth.getBlock('pending');
                        // Step 7: split TP
                        console.log("=== Step 7: split TP ===");
                        sendLog(`Splitting Tokenised Payable for purchase '${pur.description}' for contractor '${con.name}' with SGD${purAmount}`);

                        // Call generate Metadata BEFORE splitPayable
                        console.log("Generate metadata for NFT");
                        console.log("retrywithBackoff splitPayable()");
                        console.log("newId = "+ ++newId);

                        if (!newId) {
                          sendError('Failed to extract new payable ID from split receipt');
                          return false;
                        }

                        sendLog(`Split new payable ID ${newId} with value ${purAmount} for contractor ${con.name}`);
                        
                        // Reduce the balance in the original NFT index 1, by the split value
                        // 1. Query the NEW reduced value of the original payable (robust; avoids drift)
                        originalTPamount -= purAmount;  // reduce the original TP amount by the split amount for this purchase
                        sendLog(`Reduce original TP's value by ${purAmount} since value is splitted out to new TP, remaining amount = ` + originalTPamount);

                        console.log(`Updated metadata for ORIGINAL payable #1`);    // we need to do this everytime we split, to ensure the original payable always reflect the correct remaining amount after splits, in case user split multiple times
                        console.log("setTokenURI to point to new metadata..");      // update the tokenURI else it is not updated
                        console.log(`Transfer split token ${newId} to contractor ${con.name} wallet ${con.walletaddress}`); 
                      }
                    }  // for pur
                  }    // for con
*/
        /////////////////// test end


//        throw new Error("Testing transaction rollback!"); // TESTING, to be removed


      }); // const result = await sequelize.transaction(async (t) => {
    
      //  sendSuccess("Tokenised Payable created successfully and transferred to Anchor and contractors.");
      //if (!errorSent) {
      //  res.send({ id: approved_id, smartcontractaddress: newTPsmartcontractaddress2, message: "Tokenised Payable created successfully."});
      //  errorSent = true;
      //}
    //  return true;
    } catch (err) {
      sendError("Error in adding to database : " + err.message);
      return false;
    }                 // atomic txn
  } else { // not isNewDtscf
    try {  // database operations for creating/updating prod table and copying milestones, contractors, purchases from draft to prod
      await Dtscfs.update( // update Dtscf in the database !!!!! 
      { 
        name                  : req.body.name,
        totalBudget           : parseInt(req.body.totalBudget) || 0,
        blockchain            : req.body.blockchain || 0, // Default or from form
        underlyingTokenID     : req.body.underlyingTokenID || null,
        underlyingDSGDsmartcontractaddress : req.body.underlyingDSGDsmartcontractaddress || '',
        campaign_id           : req.body.campaign_id || null,
        anchor_id             : req.body.anchor_id || null,

        startdate             : req.body.startdate, 
        enddate               : req.body.enddate,
        
        actionby              : req.body.actionby,
        draftdtscfid          : req.body.id,             
      }, 
      { where:      { id: req.body.approveddtscfid }},
      )
      .then(data => {
        logDataValues("Dtscf update success: ", data);
        sendSuccess("Dtscf updated successfully. "+data.message);
        //if (!errorSent) {
        //  res.send(data);
        //  errorSent = true;
        //}
      })
      .catch(err => {
        console.log("Error while updating dtscf: "+err.message);
        throw new Error('Please try again. Report to tech support if problem is recurring.');
      });
    } catch(err) {
      console.error("Error in updating database: ", err.message);
      sendError("Error updating database: " + err.message );
      //if (!errorSent) {
      //  console.log("Sending error 400 back to client");
      //  res.status(400).send({ message: "Error during contract deployment: " + err.message });
      //  errorSent = true;
      //}
      return false;   
    }     // database operations for creating/updating prod table and copying milestones, contractors, purchases from draft to prod
  }

console.log("New milestone IDs:", newMilestoneIdArr);



//sendError("Error in adding to database : bye bye");
//return false;

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
    sendError("Invalid blockchain network.");
    return;
  }

  const INFURA_API_KEY = process.env.REACT_APP_INFURA_API_KEY;
  const ALCHEMY_API_KEY = process.env.REACT_APP_ALCHEMY_API_KEY;

//  const providerUrl = `https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`;   
  const providerUrl = `https://${ETHEREUM_NETWORK}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;   

  console.log(`Using HTTP provider: ${providerUrl.replace(ALCHEMY_API_KEY, '****')}`);

  Web3 = require("web3");
  // Create Web3 with HTTP provider (most stable for deployment)
  const web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));

  // Test connection immediately
  async function checkProviderHealth() {
    try {
      const isListening = await web3.eth.net.isListening();
      const blockNumber = await web3.eth.getBlockNumber();
      console.log(`Provider healthy. Connected to ${ETHEREUM_NETWORK}. Current block: ${blockNumber}`);
      return true;
    } catch (err) {
      console.error("Provider health check failed:", err.message);
      throw new Error("Cannot connect to blockchain provider. Please try again later.");
    }
  }

  await checkProviderHealth();   // test provider connection before proceeding

  const SIGNER_PRIVATE_KEY = process.env.REACT_APP_SIGNER_PRIVATE_KEY;
  const CONTRACT_OWNER_WALLET = process.env.REACT_APP_CONTRACT_OWNER_WALLET;
  const ANCHOR_PRIVATE_KEY = process.env.REACT_APP_ANCHOR_PRIVATE_KEY;
  const ANCHOR_WALLET = process.env.REACT_APP_ANCHOR_WALLET;

  console.log("!!! Signer:", SIGNER_PRIVATE_KEY.substring(0,4)+"..." + SIGNER_PRIVATE_KEY.slice(-3));

      async function compileSmartContract() {
        // solc compiler
        solc = require("solc");
        //const solcVersion = 'v0.8.20+commit.a1b79de6';  // Matches pragma ^0.8.20; check https://github.com/ethereum/solc-bin for exact tag
        const solcVersion = 'v0.8.24+commit.e11b9ed9';

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
                evmVersion: 'cancun',
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
                sendError("Error compiling smart contract. Please contact tech support.");
                //return false;
                return reject(new Error("Compilation failed with errors."));
              }
              console.warn("Compilation warnings:", output.errors);
            }

            if (!output.contracts || !output.contracts[smartContractFileName] || !output.contracts[smartContractFileName][TokenName]) {
              sendError("Error compiling smart contract. Please contact tech support.");
              //return false;
              return reject(new Error("No compiled contract found. Check contract name and sources."));
            }

            console.log("Generating bytecode from smart contract file ");
            ABI = output.contracts[smartContractFileName][TokenName].abi;
            bytecode = output.contracts[smartContractFileName][TokenName].evm.bytecode.object;
                    
            fs.writeFileSync(abiFile, JSON.stringify(ABI) , 'utf8', function (err) {
              if (err) {
                console.log("An error occured while writing Dtscf ABI JSON Object to File.");
                sendError("Error compiling smart contract. Please contact tech support.");
                //return false;
                return console.log(err);
              }
              console.log("Dtscf ABI JSON file has been saved.");
            });
            fs.writeFileSync(byteCodeFile, JSON.stringify(bytecode) , 'utf8', function (err) {
              if (err) {
                console.log("An error occured while writing Dtscf bytecode JSON Object to File.");
                sendError("Error compiling smart contract. Please contact tech support.");
                //return false;
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
        // 1. compile Tokenised Payable TP smart contract, sign and deploy smart contract to blockchain, and get the new smart contract address
        // 2. keep the new smart contract address
        // 3. set allowance() - allow TP smart contract to pull tokenised deposits TBD from system's wallet
        // 4. call method wrapDepositToPayable() which pulls TBD from system wallet into the TP smart contract
        // 5. split the TP into different milestones 
        // 6. split the milestones TP into different contractors and allocate to contractors 
        // 7. transfer split TP to contractors' wallets
        // 8. safeTransferFrom Anchor to contractors

        updatestatus = false;
        //fs = require("fs");

        let ABI, bytecode;
        try {
          if (!(fs.existsSync(abiFile) && fs.existsSync(byteCodeFile)) || mustCompile) {
            sendLog("Compiling Tokenised Payable smart contract...");
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
          sendError("Error compiling Tokenised Payable smart contract. Please check logs and contact tech support.");
          //if (!errorSent) {
          //  res.status(400).send({ message: "Error compiling Tokenised Payable smart contract. Please check logs and contact tech support." });
          //  errorSent = true;
          //}
          return false;
        }
        console.log("!!! Signer:", SIGNER_PRIVATE_KEY.substring(0,4)+"..." + SIGNER_PRIVATE_KEY.slice(-3));
        const signer = web3.eth.accounts.privateKeyToAccount(SIGNER_PRIVATE_KEY);
        const anchor = web3.eth.accounts.privateKeyToAccount(ANCHOR_PRIVATE_KEY);

//        web3.setProvider(new Web3.providers.HttpProvider(`https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`));

        console.log("Enddate (unix time) = ", Number(new Date(req.body.enddate)));
        try {
          // Deploy contract
          const deployContract = async () => {


            // Step 1: Validate inputs
            console.log("=== Step 1: Validate inputs ===");
            //res.write("Step 1: Validate inputs ");
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
                sendError(`Invalid input: ${key} cannot be null or undefined. Please provide a valid value.`);
                //if (!errorSent) {
                //  res.status(400).send({
                //    message: `Invalid input: ${key} cannot be ${value}. Please provide a valid value.`,
                //  });
                //  errorSent = true;
                //}
                return false;
              }
            }

            const stringFields = ['underlyingDSGDsmartcontractaddress'];
            for (const field of stringFields) {
              if (typeof requiredFields[field] !== 'string' || requiredFields[field].trim() === '') {
                console.error(`Error: ${field} is invalid: ${requiredFields[field]}`);
                sendError(`Invalid input: ${field} must be a non-empty string.`);
                //if (!errorSent) {
                //  res.status(400).send({
                //    message: `Invalid input: ${field} must be a non-empty string.`,
                //  });
                //  errorSent = true;
                //}
                return false;
              }
            }

            const numericFields = ['totalBudget'];
            for (const field of numericFields) {
              const value = Number(requiredFields[field]);
              if (isNaN(value) || value <= 0) {
                console.error(`Error: ${field} is invalid: ${requiredFields[field]}`);
                sendError(`Invalid input: ${field} must be a positive number.`);
                //if (!errorSent) {
                //  res.status(400).send({
                //    message: `Invalid input: ${field} must be a positive number.`,
                //  });
                //  errorSent = true;
                //}
                return false;
              }
            }

            if (isNaN(req.body.totalBudget) || req.body.totalBudget < 0) {
              console.error("Total budget is invalid: ", req.body.totalBudget);
              sendError(`Invalid input: totalBudget must be a positive number.`);
              //if (!errorSent) {
              //  res.status(400).send({
              //    message: `Invalid input: totalBudget must be a positive number.`,
              //  });
              //  errorSent = true;
              //}
              return false;
            }

            if (!web3.utils.isAddress(requiredFields.underlyingDSGDsmartcontractaddress)) {
              console.error(`Error: Invalid underlyingDSGDsmartcontractaddress: ${requiredFields.underlyingDSGDsmartcontractaddress}`);
              sendError(`Invalid input: underlyingDSGDsmartcontractaddress must be a valid Ethereum address.`);
              //if (!errorSent) {
              //  res.status(400).send({
              //    message: 'Invalid input: underlyingDSGDsmartcontractaddress must be a valid Ethereum address.',
              //  });
              //  errorSent = true;
              //}
              return false;
            }

            const startdate = Number(new Date(req.body.startdate));
            const enddate = Number(new Date(req.body.enddate));
            if (isNaN(startdate) || isNaN(enddate) || enddate < startdate) {
              console.error(`Error: Invalid dates - startdate: ${req.body.startdate}, enddate: ${req.body.enddate}`);
              sendError(`Invalid input: Dates must be valid and maturity date must be after issue date.`);
              //if (!errorSent) {
              //  res.status(400).send({
              //    message: 'Invalid input: Dates must be valid and maturity date must be after issue date.',
              //  });
              //  errorSent = true;
              //}
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
                  sendError(`Missing or empty required field '${field}' in milestone '${ms.name || 'unnamed'}'`);
                  return false;
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
                  sendError(`Missing or empty required field '${field}' in contractor '${con.name || 'unnamed'}'`);
                  return false;
                }
              }
              // Validate walletaddress is a valid Ethereum address
              if (!web3.utils.isAddress(con.walletaddress)) {
                sendError(`Invalid Ethereum wallet address for contractor '${con.name || 'unnamed'}': ${con.walletaddress}`);
                return false;
              }
              // Add stricter checks, e.g., if (isNaN(con.budget) || con.budget <= 0) throw new Error(...);
            }

            // exit first see how
            //throw new Error(`exit!!!!!!!!!!!`);

            const dtscfConfig = [
              req.body.underlyingDSGDsmartcontractaddress,
              scaleToWei(req.body.totalBudget, web3),
              Math.floor(Number(new Date(req.body.enddate)) / 1000),
            ];
            console.log('DtscfConfig:', dtscfConfig);

            // Do balance check before deployment
            const tokenizedBankDeposit_ABI = JSON.parse(fs.readFileSync(tokenizedBank_abiFile, 'utf8').toString());
            const depositContract = new web3.eth.Contract(tokenizedBankDeposit_ABI, req.body.underlyingDSGDsmartcontractaddress);
            const requiredAmount = web3.utils.toWei(req.body.totalBudget.toString(), 'ether');
            const anchorBalance = await depositContract.methods.balanceOf(anchor.address).call();
            if (web3.utils.toBN(anchorBalance).lt(web3.utils.toBN(requiredAmount))) {
              sendError(`Insufficient Tokenised Deposit balance in anchor wallet: ${parseFloat(web3.utils.fromWei(anchorBalance, 'ether')).toLocaleString('en-US')} < ${parseFloat(req.body.totalBudget).toLocaleString('en-US')}`);
              return false;
            }
            console.log(`Anchor Tokenised Deposit balance sufficient: ${web3.utils.fromWei(anchorBalance, 'ether')}`);


            // Step 2: Prepare for deployment, estimate gas fees
            console.log("=== Step 2: Prepare for deployment, estimate gas fees ===")
            //res.write("Step 2: Prepare for deployment, estimate gas fees ");

            console.log('Attempting to deploy from account:', signer.address);
            const tokenisedPayableContract = new web3.eth.Contract(ABI);
            const payableDeployTx = tokenisedPayableContract.deploy({
              data: bytecode,
              arguments: ['https://tokenising.herokuapp.com/', req.body.underlyingDSGDsmartcontractaddress],
            });

            let gasEstimate = await payableDeployTx.estimateGas({ from: signer.address }).catch((error) => {
              console.error("Error while estimating Gas fee: ", error);
              return 4000000;  // default if cannot estimate
            });

            console.log("Initial estimated gas fee: ", gasEstimate);

            const balance = await web3.eth.getBalance(signer.address);
            console.log("Signer balance:", web3.utils.fromWei(balance, "ether"), "ETH");
            if (web3.utils.toBN(balance).lt(web3.utils.toBN(gasEstimate).mul(web3.utils.toBN("1000000000")))) {
              console.error("Insufficient funds for gas. Please ensure the system wallet has enough balance to cover deployment fees.");
              sendError("Insufficient funds for gas. Please ensure the system wallet has enough balance to cover deployment fees.");
              //res.status(400).send({ message: "Insufficient funds for gas." });
              return false;
            }

            let gasMultiplier = 1.1; // Initial 10% buffer
            const gasIncreaseInterval = 30000; // Increase gas every 30 seconds if pending
            const maxWaitTime = TIMEOUT * 1000; // Total timeout in ms
            let startTime = Date.now();




            // Step 3: Deployment with retry and gas increase
            console.log("=== Step 3: Deployment with retry and gas increase ===");
            sendLog("Deploying smart contract to the blockchain. This may take a while...");
            const deployWithRetry = async () => {
              const block = await web3.eth.getBlock('pending');

              try {
                //return await retryWithBackoff(async () => {
                return await retryWithBackoff(async (innerGasMultiplier, innerPriorityMultiplier, innerGasLimitMultiplier) => {
                  let currentGas = Math.floor(gasEstimate * innerGasLimitMultiplier);
                  let baseFee = BigInt(block.baseFeePerGas || await web3.eth.getGasPrice());
                  let maxPriorityFee = BigInt(2000000000);  // Default 2 gwei; adjust as needed
                  let maxFeePerGas = (baseFee * BigInt(Math.floor(innerGasMultiplier * 100)) / BigInt(100)) + 
                                     (maxPriorityFee * BigInt(Math.floor(innerPriorityMultiplier * 100)) / BigInt(100));
                  maxFeePerGas = maxFeePerGas.toString();
                  let maxPriorityFeePerGas = (maxPriorityFee * BigInt(Math.floor(innerPriorityMultiplier * 100)) / BigInt(100)).toString();

                  console.log('Current maxFeePerGas:', maxFeePerGas);
                  console.log('Current maxPriorityFeePerGas:', maxPriorityFeePerGas);
                  const deployTxData = payableDeployTx.encodeABI();  // Get the encoded deployment data

                  const tx = {
                    from: signer.address,
                    data: deployTxData,
                    gas: currentGas,
                    // gasPrice: gasPrice  // obsolete
                    maxFeePerGas: maxFeePerGas,  // Use this instead of gasPrice
                    maxPriorityFeePerGas: maxPriorityFeePerGas
                  };

                  const signedTx = await web3.eth.accounts.signTransaction(tx, signer.privateKey);

                  let hash;
                  try {
                    hash = await new Promise((resolve, reject) => {
                      web3.eth.sendSignedTransaction(signedTx.rawTransaction)
                        .once('transactionHash', resolve)
                        .once('error', reject);
                    });
                  } catch (err) {
                    throw new Error(`Send failed: ${err.message}`);
                  }
                  console.log(`Transaction hash: ${hash}`);

                  // Poll for receipt every 10 seconds
                  let receipt = null;
                  let pollAttempts = 0;
                  const maxPollAttempts = 18; // e.g., 3 minute timeout

                  while (!receipt && pollAttempts < maxPollAttempts) {
                    console.log("Checking receipt for Deploy Contract transaction... #", pollAttempts);
                    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
                    receipt = await web3.eth.getTransactionReceipt(hash);
                    pollAttempts++;
                  }

                  if (!receipt) {
                    throw new Error('not mined');
                  }

                  if (!receipt.status) {
                    throw new Error('Deployment failed (status false)');
                  }

                  console.log('Deployment receipt:', receipt);
                  newTPsmartcontractaddress2 = receipt.contractAddress;
                  updatestatus = true;
                  return true;  // Success
                }, 5, 15000, (err) => err.message.includes('not mined') || err.message.includes('underpriced') || err.message.includes('TIMEOUT'));

              } catch (err) {
                console.error('Deployment attempt failed:', err.message);
                if (Date.now() - startTime > maxWaitTime) {
                  throw new Error(`Timeout after ${TIMEOUT} seconds`);
                }
                gasMultiplier += 0.15;  // Increase for next attempt
                return await deployWithRetry();  // Recursive retry
              }
            };  // deployWithRetry

            await deployWithRetry();
            if (!newTPsmartcontractaddress2 || !web3.utils.isAddress(newTPsmartcontractaddress2)) {
              sendError("Deployment succeeded but no contract address was returned");
              return false;
            }
            
            console.log(`Deployment successful, address: ${newTPsmartcontractaddress2}`);
            sendLog(`Deployment successful, address: ${newTPsmartcontractaddress2}`);

            return true;  // Deployment successful
          } // deployContract = async ()
          
          if (! await deployContract()) {
            console.error("TP Smart Contract Deployment failed....");
            sendError("Tokenised Payable smart contract deployment failed. Please contact tech support.");
            return false;  // Deployment failed, exit
          }
          
          const wrapDepositToPayable = async () => {
                console.log('Calling wrapDepositToPayable to fund the contract from anchor account');
                if (!newTPsmartcontractaddress2) {
                  sendError('Contract address not set after deployment');
                  return false;
                }

                const tokenizedBankDeposit_ABI = JSON.parse(fs.readFileSync(tokenizedBank_abiFile, 'utf8').toString());
                const depositContract = new web3.eth.Contract(tokenizedBankDeposit_ABI, req.body.underlyingDSGDsmartcontractaddress);
                const tokenisedPayableContract = new web3.eth.Contract(ABI, newTPsmartcontractaddress2);

                // Do balance check
                const requiredAmount = web3.utils.toWei(req.body.totalBudget.toString(), 'ether');
                const anchorBalance = await depositContract.methods.balanceOf(anchor.address).call();
                if (web3.utils.toBN(anchorBalance).lt(web3.utils.toBN(requiredAmount))) {
                  sendError(`Insufficient Tokenised Deposit balance in anchor wallet: ${web3.utils.fromWei(anchorBalance, 'ether')} < ${req.body.totalBudget}`);
                  return false;
                }
                console.log(`Anchor Tokenised Deposit balance sufficient: ${web3.utils.fromWei(anchorBalance, 'ether')}`);

                // const gasPrice = await web3.eth.getGasPrice();  
                // Get gas prices (EIP-1559 support)
                const block = await web3.eth.getBlock('pending');

                // Step 4: Anchor to approve Tokenised Payable contract (sign and send signed tx)
                console.log("=== Step 4: Anchor to approve Tokenised Payable contract (sign and send signed tx) ===");
                //res.write("Step 4: Anchor to approve Tokenised Payable contract (sign and send signed tx) ");
                await retryWithBackoff(async (innerGasMultiplier, innerPriorityMultiplier, innerGasLimitMultiplier) => {
                  console.log("Approving Tokenised Payable contract to pull funds..."); 
                  
                  let estGas = await depositContract.methods.approve(newTPsmartcontractaddress2, requiredAmount).estimateGas({ from: anchor.address });
                  estGas = Math.floor(estGas * innerGasLimitMultiplier);
                  let baseFee = BigInt(block.baseFeePerGas || await web3.eth.getGasPrice());
                  let maxPriorityFee = BigInt(2000000000);  // Default 2 gwei; adjust
                  let maxFeePerGas = (baseFee * BigInt(Math.floor(innerGasMultiplier * 100)) / BigInt(100)) + 
                                    (maxPriorityFee * BigInt(Math.floor(innerPriorityMultiplier * 100)) / BigInt(100));
                  maxFeePerGas = maxFeePerGas.toString();
                  let maxPriorityFeePerGas = (maxPriorityFee * BigInt(Math.floor(innerPriorityMultiplier * 100)) / BigInt(100)).toString();

                  const approveData = depositContract.methods.approve(newTPsmartcontractaddress2, requiredAmount).encodeABI();
                  const approveTx = {
                    from: anchor.address,
                    to: req.body.underlyingDSGDsmartcontractaddress,
                    data: approveData,
                    gas: estGas,  
                    maxPriorityFeePerGas: maxPriorityFeePerGas,
                    maxFeePerGas: maxFeePerGas
                  };
                    
                  const signedApprove = await web3.eth.accounts.signTransaction(approveTx, ANCHOR_PRIVATE_KEY);

                  let approveHash;
                  try {
                    approveHash = await new Promise((resolve, reject) => {
                      web3.eth.sendSignedTransaction(signedApprove.rawTransaction)
                        .once('transactionHash', resolve)
                        .once('error', reject);
                    });
                  } catch (err) {
                    throw new Error(`Approve send failed: ${err.message}`);
                  }

                  // Poll for receipt every 10 seconds
                  let approveReceipt = null;
                  let approvePollAttempts = 0;
                  const maxApprovePollAttempts = 6;

                  while (!approveReceipt && approvePollAttempts < maxApprovePollAttempts) {
                    console.log("Checking receipt for approve transaction... #", approvePollAttempts);
                    await new Promise(resolve => setTimeout(resolve, 10000));
                    approveReceipt = await web3.eth.getTransactionReceipt(approveHash);
                    approvePollAttempts++;
                  }

                  if (!approveReceipt) {
                    throw new Error('not mined');
                  }

                  if (!approveReceipt.status) {
                    throw new Error('Approve transaction failed');
                  }

                  console.log("Approved Tokenised Payable contract to pull funds. approveReceipt:", approveReceipt);
                }, 5, 15000, (err) => err.message.includes('not mined') || err.message.includes('underpriced') || err.message.includes('TIMEOUT'));

                // Safely parse milestones (assuming first one; adjust if multiple)
                let milestones = req.body.milestones || [];
                if (typeof milestones === 'string') {
                  milestones = JSON.parse(milestones);
                }
                const milestoneId = milestones.length > 0 ? milestones[0].id : 1;  

                            // Call generate BEFORE wrapDepositToPayable
                            // This is to create the TP for the Anchor to wrap the TBD into, and to get the metadata URI ready for the wrapDepositToPayable call
                            let metadataPath = await generateMetadataFile(
                              newTPsmartcontractaddress2,                               // Contract address
                              1,                                                        // Token ID (assuming 1 for the first milestone; adjust logic if multiple milestones/tokens)
                              req.body.totalBudget.toString(),                          // Total budget as string
                              milestoneId,                                              // Milestone ID
                              Math.floor(new Date(req.body.enddate).getTime() / 1000),  // Maturity date
                              `Completion of milestone #${milestoneId}`                 // Conditions
                            );

                // Step 5: Wrap (sign and send signed tx), new TP is created by Anchor
                console.log("=== Step 5: Wrap (sign and send signed tx), new TP is created by Anchor ===");
                sendLog("Wrapping Tokenised Deposits into Tokenised Payable tokens");
                const wrapReceipt =  retryWithBackoff(async (innerGasMultiplier, innerPriorityMultiplier, innerGasLimitMultiplier) => {
                    const endDateUnix = Math.floor(new Date(req.body.enddate).getTime() / 1000);
                    let wrapGas = await tokenisedPayableContract.methods.wrapDepositToPayable(
                      requiredAmount,
                      endDateUnix,
                      '{"milestone": "structure complete"}', 
                      milestoneId,
                      metadataPath
                    ).estimateGas({ from: anchor.address });
                    wrapGas = Math.floor(wrapGas * innerGasLimitMultiplier);
                                    
                    let baseFee = BigInt(block.baseFeePerGas || await web3.eth.getGasPrice());
                    let maxPriorityFee = BigInt(2000000000);  // Default 2 gwei; adjust as needed
                    let maxFeePerGas = (baseFee * BigInt(Math.floor(innerGasMultiplier * 100)) / BigInt(100)) + 
                                      (maxPriorityFee * BigInt(Math.floor(innerPriorityMultiplier * 100)) / BigInt(100));
                    maxFeePerGas = maxFeePerGas.toString();
                    let maxPriorityFeePerGas = (maxPriorityFee * BigInt(Math.floor(innerPriorityMultiplier * 100)) / BigInt(100)).toString();

                    console.log('Current maxFeePerGas:', maxFeePerGas);
                    console.log('Current maxPriorityFeePerGas:', maxPriorityFeePerGas);

                    const wrapData = tokenisedPayableContract.methods.wrapDepositToPayable(
                      requiredAmount,
                      endDateUnix,
                      '{"milestone": "structure complete"}',
                      milestoneId,
                      metadataPath
                    ).encodeABI();

                    const wrapTx = {
                      from: anchor.address,
                      to: newTPsmartcontractaddress2,
                      data: wrapData,
                      gas: wrapGas,
                      maxPriorityFeePerGas: maxPriorityFeePerGas,
                      maxFeePerGas: maxFeePerGas
                    };
                    
                    const signedWrap = await web3.eth.accounts.signTransaction(wrapTx, ANCHOR_PRIVATE_KEY);

                    let wrapHash;
                    try {
                      wrapHash = await new Promise((resolve, reject) => {
                        web3.eth.sendSignedTransaction(signedWrap.rawTransaction)
                          .once('transactionHash', resolve)
                          .once('error', reject);
                      });
                    } catch (err) {
                      throw new Error(`Wrap send failed: ${err.message}`);
                    }

                    // Poll for receipt every 10 seconds
                    let receipt = null;
                    let attempts = 0;
                    while (!receipt && attempts < 6) {  // Max 6 attempts (~1 min at 10s intervals)
                      console.log("Checking receipt for wrap transaction... #", attempts);
                      await new Promise(resolve => setTimeout(resolve, 10000));  // Wait 10s
                      receipt = await web3.eth.getTransactionReceipt(wrapHash);
                      attempts++;
                    }

                    if (!receipt) {
                      throw new Error('not mined');
                    }

                    if (!receipt.status) {
                      throw new Error('Wrap transaction failed or not confirmed');
                    }

                    console.log("Funds wrapped successfully. wrapReceipt:", receipt);
                    return receipt;
                }, 5, 15000, (err) => err.message.includes('not mined') || err.message.includes('underpriced') || err.message.includes('TIMEOUT'));

                const newId = 1;
                console.log(`Wrapped ${requiredAmount} into payable token ID ${newId}`);

                // Return needed values for transfer logic
                return { wrapReceipt, tokenisedPayableContract, milestoneId, newId };
          }; // wrapDepositToPayable
          const { wrapReceipt, tokenisedPayableContract, milestoneId, newId } = await wrapDepositToPayable();

          // Fallback if undefined
          let newId0 = newId || 1; // Default to 1 if not set

          console.log("after await wrapDepositToPayable()...");
          console.log("wrapReceipt:", wrapReceipt);
          //console.log("tokenisedPayableContract:", tokenisedPayableContract);
          console.log("milestoneId:", milestoneId);
          console.log("newId0:", newId0);

          // Step 6: Transfer TP to contractors as per milestones
          console.log("=== Step 6: transfer TP to contractors as per milestones ===");
          //log("Transferring Tokenised Payable tokens to contractors as per milestones ");
          const transferTPtoContractors = async (wrapReceipt, tokenisedPayableContract, milestoneId, newId0) => {
            console.log("Transferring Tokenised Payable tokens to contractors as per milestones");

            if (!newId0) {
              console.warn('newId0 is undefined - skipping transfer.');
              return; // Or throw new Error('Missing token ID');
            }
            // Await the wrapReceipt if it's a promise
            const resolvedReceipt = await wrapReceipt;
            console.log('Resolved wrapReceipt:', resolvedReceipt);   

            try {
              // In transferTPtoContractors, update balance check
              let balance = await tokenisedPayableContract.methods.balanceOf(anchor.address, newId0).call();  // Use anchor.address and newId0
              let attempts = 0;
              while (balance === '0' && attempts < 10) {
                console.log("Checking receipt for balanceOf... #", attempts);
                await new Promise(resolve => setTimeout(resolve, 10000));  // Increase to 10s
                balance = await tokenisedPayableContract.methods.balanceOf(anchor.address, newId0).call();
                attempts++;
              }
              if (balance === '0') { 
                sendError('No payable tokens found after wrap - deployment may have failed');
                return false;
              }

              // Fetch all token IDs from the contract (robust alternative to event parsing)
              let allIds = [];
              try {
                allIds = await tokenisedPayableContract.methods.getAllTokenIds().call();
              } catch (err) {
                console.warn('getAllTokenIds failed:', err.message);
                allIds = [newId0]; // Fallback to known ID
              }                  // Assume the last (most recent) ID is the original wrapped one, as contract is new
              let originalId = allIds[allIds.length - 1];
              console.log(`Original payable ID: ${originalId}`);

              //
              //
              //
              // splitPayable() requires originalId, amount to split, and metadata URI for the split portion. 
              // We loop through contractors, calculate their amounts based on linked purchases, 
              // then call splitPayable for each contractor to create new payable tokens in their wallets. 
              // The metadata URI can include details like milestone completion, contractor name, etc.
              //
              //
              //
              let contractors = req.body.contractors || [];
              if (typeof contractors === 'string') { contractors = JSON.parse(contractors); }

              // 
              // Looping through contractors; for each, calculate total amount from their linked purchases, 
              // then split the payable and transfer to their wallet
              //
/*
              for (const ms of newMilestoneIdArr) {   // iterate thru milestones
                // find the total amounrt for this milestone by summing budgets of linked contractors
                let milestoneAmount = 0;
                console.log(`Calculating total amount for milestone ${ms.name} (ID: ${ms.id})...`);

                const purchases = await Purchase.findAll({
                  where: { dtscf_milestone_id: ms.id },
                  transaction: ttt,
                  include: [{
                    model: Contractor,
                    required: false // This ensures it stays a LEFT JOIN
                  }]
                }); 

                console.log(`Milestone ${ms.name} has ${purchases.length} linked purchases`);
                console.log('Purchases for this milestone:', purchases.map(p => ({ amount: p.amount, contractor: p.dtscf_contractor ? p.dtscf_contractor.name : 'N/A' }))); 

                // 4. Split the Milestone obligation among Contractors
                for (const purchase of purchases) {
                  const contractor = purchase.dtscf_contractor;
                  const amountToMint = purchase.amount;
                  const contractorWallet = contractor?.walletaddress;

                  if (!contractorWallet) {
                    console.error(`No wallet address found for contractor: ${contractor.name}`);
                    continue;
                  }
                  console.log(`Processing purchase of amount ${amountToMint} for contractor ${contractor.name} with wallet ${contractorWallet}`); 
                }
            
*/              
                  let NFTindex = parseInt(originalId);
                  // Loop thru contractors linked to ths project
                  for (const con of contractors) {    // iterate thru contractors
                    let purAmount = 0;

                    // Loop thru purchases linked to this contractor
                    for (const pur of con.purchases || []) { 
                      purAmount = parseFloat(pur.amount) || 0;   //zzz <--- cannot total, must create 1 TP for every purchase
                      const amountWei = web3.utils.toWei(purAmount.toString(), 'ether');

                      if (web3.utils.toBN(amountWei).gt(0)) {
                        if (!con.walletaddress) { 
                          sendError(`Contractor wallet address not found for ${con.name}`);
                          return false;
                        }

                        const block = await web3.eth.getBlock('pending');
                        // Step 7: split TP
                        console.log("=== Step 7: split TP ===");
                        sendLog(`Splitting Tokenised Payable for purchase '${pur.description}' for contractor '${con.name}' with SGD${purAmount}`);

                        NFTindex++;
                        // Call generate BEFORE splitPayable
                        // This is to create the metadata for the new split token that will go to the contractor, which is needed as a parameter for splitPayable.
                        let metadataPath = await generateMetadataFile(
                          newTPsmartcontractaddress2,           // Contract address
                          NFTindex,                             // NFTindex increments with each loop, it should have the same value as newId
                          purAmount.toString(), 
                          milestoneId, 
                          Math.floor(new Date(req.body.enddate).getTime() / 1000),
                          `Completion of milestone #${milestoneId}`
                        );

                        const splitReceipt = await retryWithBackoff(async (innerGasMultiplier, innerPriorityMultiplier, innerGasLimitMultiplier) => {
                            let baseFee = BigInt(block.baseFeePerGas || await web3.eth.getGasPrice());
                            let maxPriorityFee = BigInt(2000000000);  // Default 2 gwei; adjust as needed
                            let maxFeePerGas = (baseFee * BigInt(Math.floor(innerGasMultiplier * 100)) / BigInt(100)) + 
                                        (maxPriorityFee * BigInt(Math.floor(innerPriorityMultiplier * 100)) / BigInt(100));
                            maxFeePerGas = maxFeePerGas.toString();
                            let maxPriorityFeePerGas = (maxPriorityFee * BigInt(Math.floor(innerPriorityMultiplier * 100)) / BigInt(100)).toString();

                            let splitGas = await tokenisedPayableContract.methods.splitPayable(originalId, amountWei, metadataPath).estimateGas({ from: anchor.address });
                                splitGas = Math.floor(splitGas * innerGasLimitMultiplier);

                            const splitData = tokenisedPayableContract.methods.splitPayable(
                              originalId, // split TP from Anchor to contractor
                              amountWei,
                              metadataPath
                            ).encodeABI();

                            const splitTx = {
                              from: anchor.address,     // split TP from Anchor to contractor
                              to: newTPsmartcontractaddress2,
                              data: splitData,
                              gas: splitGas,
                              maxPriorityFeePerGas: maxPriorityFeePerGas,
                              maxFeePerGas: maxFeePerGas
                            };

                            const signedSplit = await web3.eth.accounts.signTransaction(splitTx, ANCHOR_PRIVATE_KEY);   // split TP from Anchor to contractor
                            const sentTx = await web3.eth.sendSignedTransaction(signedSplit.rawTransaction);

                            // Wait for confirmation (simple polling for receipt)
                            let splitReceipt = null;
                            let attempts = 0;
                            while (!splitReceipt && attempts < 30) {  // Max 30 attempts (~5 min at 10s blocks)
                              console.log("Checking receipt for split transaction... #", attempts);
                              splitReceipt = await web3.eth.getTransactionReceipt(sentTx.transactionHash);
                              if (!splitReceipt) {
                                await new Promise(resolve => setTimeout(resolve, 5000));  // Wait 5s
                                attempts++;
                              }
                            }
                            if (!splitReceipt || !splitReceipt.status) {
                              throw new Error('Split transaction failed or not confirmed');
                            }

                            console.log("Funds split successfully. splitReceipt:", splitReceipt);

                            return splitReceipt;
                        }, 5, 15000, (err) => err.message.includes('not mined') || err.message.includes('underpriced') || err.message.includes('TIMEOUT'));

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
                          sendError('Failed to extract new payable ID from split receipt');
                          return false;
                        }

                        console.log(`Split new payable ID ${newId} with value ${purAmount} for contractor ${con.name}`);
                        
                        // Reduce the balance in the original NFT index 1, by the split value
                        // 1. Query the NEW reduced value of the original payable (robust; avoids drift)
                        const updatedOriginalValueWei = await tokenisedPayableContract.methods.payables(originalId).call()
                          .then(p => p.value); // struct field .value

                        const updatedOriginalValue = web3.utils.fromWei(updatedOriginalValueWei, 'ether');

                        // 2. Generate NEW metadata + image for the ORIGINAL token (with reduced value)
                        // This is to reflect the reduced value in the original token that remains with the Anchor after the split
                        let originalMetadataPath = await generateMetadataFile(
                          newTPsmartcontractaddress2,             // Contract address
                          parseInt(originalId),                   // Original ID (e.g. 1)
                          updatedOriginalValue.toString(),        // Reduced value
                          milestoneId,
                          Math.floor(new Date(req.body.enddate).getTime() / 1000),
                          `Completion of milestone #${milestoneId}` // or any updated description
                        );
                        console.log(`Updated metadata for ORIGINAL payable #${originalId}:`, originalMetadataPath);

                        // 3. Call setTokenURI (onlyOwner → from anchor)
                        await retryWithBackoff(async (innerGasMultiplier, innerPriorityMultiplier, innerGasLimitMultiplier) => {

                          const currentOwner = await tokenisedPayableContract.methods.owner().call();
                          console.log(`tokenisedPayableContract contract owner: ${currentOwner}, Anchor address: ${anchor.address}`); 

                          console.log("Estimating gas for setTokenURI on original payable...");
                          let setUriGas = await tokenisedPayableContract.methods
                            .setTokenURI(parseInt(originalId), originalMetadataPath)
                            .estimateGas({ from: signer.address });   // contract owner is signer
                          setUriGas = Math.floor(setUriGas * innerGasLimitMultiplier);

                          const block = await web3.eth.getBlock('pending');
                          let baseFee = BigInt(block.baseFeePerGas || await web3.eth.getGasPrice());
                          let maxPriorityFee = BigInt(2000000000);
                          let maxFeePerGas = (baseFee * BigInt(Math.floor(innerGasMultiplier * 100)) / BigInt(100)) +
                                            (maxPriorityFee * BigInt(Math.floor(innerPriorityMultiplier * 100)) / BigInt(100));
                          maxFeePerGas = maxFeePerGas.toString();
                          let maxPriorityFeePerGas = (maxPriorityFee * BigInt(Math.floor(innerPriorityMultiplier * 100)) / BigInt(100)).toString();

                          console.log("Encoding setTokenURI transaction data...");
                          const setUriData = tokenisedPayableContract.methods
                            .setTokenURI(parseInt(originalId), originalMetadataPath)
                            .encodeABI();

                          const setUriTx = {
                            from: signer.address,   // contract owner is signer
                            to: newTPsmartcontractaddress2,
                            data: setUriData,
                            gas: setUriGas,
                            maxPriorityFeePerGas: maxPriorityFeePerGas,
                            maxFeePerGas: maxFeePerGas
                          };
                          const signedSetUri = await web3.eth.accounts.signTransaction(setUriTx, SIGNER_PRIVATE_KEY);  // sign using signer's private key

                          console.log("Sending setTokenURI transaction:", setUriTx);
                          const sentSetUri = await web3.eth.sendSignedTransaction(signedSetUri.rawTransaction);

                          // Poll for receipt (same pattern you already use)
                          let receipt = null;
                          let attempts = 0;
                          while (!receipt && attempts < 30) {
                            console.log("Checking receipt for split transaction... #", attempts);
                            receipt = await web3.eth.getTransactionReceipt(sentSetUri.transactionHash);
                            console.log("Checking receipt for setTokenURI transaction... #", attempts);
                            if (!receipt) {
                              await new Promise(r => setTimeout(r, 5000));
                              attempts++;
                            }
                          }
                          if (!receipt || !receipt.status) {
                            throw new Error('setTokenURI transaction failed');
                          }

                          console.log(`ORIGINAL payable #${originalId} metadata/image updated successfully`);
                        }, 5, 15000, (err) => err.message.includes('not mined') || err.message.includes('underpriced') || err.message.includes('TIMEOUT'));

                        const currentUri = await tokenisedPayableContract.methods.uri(1).call();
                        console.log(`Current on-chain URI for NFT #1: ${currentUri}`);

                        // Step 8: Transfer the split TP to contractor
                        console.log("=== Step 8: Transfer the split TP to contractor ===");
                        sendLog(`Transferring the split Tokenised Payable from Anchor to contractor ${con.name} `);
                        await retryWithBackoff(async (innerGasMultiplier, innerPriorityMultiplier, innerGasLimitMultiplier) => {
                          let transferGas = await tokenisedPayableContract.methods.safeTransferFrom(anchor.address, con.walletaddress, newId, 1, '0x').estimateGas({ from: anchor.address, to: newTPsmartcontractaddress2 });
                          transferGas = Math.floor(transferGas * innerGasLimitMultiplier);

                          let baseFee = BigInt(block.baseFeePerGas || await web3.eth.getGasPrice());
                          let maxPriorityFee = BigInt(2000000000);  // Default 2 gwei; adjust as needed
                          let maxFeePerGas = (baseFee * BigInt(Math.floor(innerGasMultiplier * 100)) / BigInt(100)) + 
                                        (maxPriorityFee * BigInt(Math.floor(innerPriorityMultiplier * 100)) / BigInt(100));
                          maxFeePerGas = maxFeePerGas.toString();
                          let maxPriorityFeePerGas = (maxPriorityFee * BigInt(Math.floor(innerPriorityMultiplier * 100)) / BigInt(100)).toString();

                          const transferData = tokenisedPayableContract.methods.safeTransferFrom(
                            anchor.address, 
                            con.walletaddress, 
                            newId, 
                            1, 
                            '0x'                                  
                          ).encodeABI();

                          const transferTx = {
                            from: anchor.address,
                            to: newTPsmartcontractaddress2,
                            data: transferData,
                            gas: transferGas,
                            maxPriorityFeePerGas: maxPriorityFeePerGas,
                            maxFeePerGas: maxFeePerGas
                          };

                          const signedTransfer = await web3.eth.accounts.signTransaction(transferTx, ANCHOR_PRIVATE_KEY);
                          const sentTx = await web3.eth.sendSignedTransaction(signedTransfer.rawTransaction);

                          // Wait for confirmation (simple polling for receipt)
                          let transferReceipt = null;
                          let attempts = 0;
                          while (!transferReceipt && attempts < 30) {  // Max 30 attempts (~5 min at 10s blocks)
                            transferReceipt = await web3.eth.getTransactionReceipt(sentTx.transactionHash);
                            console.log("Checking receipt for transfer transaction... #", attempts);
                            if (!transferReceipt) {
                              await new Promise(resolve => setTimeout(resolve, 5000));  // Wait 5s
                              attempts++;
                            }
                          }
                          if (!transferReceipt || !transferReceipt.status) {
                            throw new Error('Transfer transaction failed or not confirmed');
                          }

                          console.log("Funds split successfully. transferReceipt:", transferReceipt);

                          console.log(`Transferred payable ID ${newId} (${purAmount} value) to contractor ${con.name}. Receipt:`, transferReceipt);
                        }, 5, 15000, (err) => err.message.includes('not mined') || err.message.includes('underpriced') || err.message.includes('TIMEOUT'));
                      }
                    } // loop thru purchases linked to this contractor
                  } // loop thru contractors linked to this project
              } catch (err) {
              console.error('Error in transferTPtoContractors:', err.message);
              throw err;
            }
          };  // transferTPtoContractors
          await transferTPtoContractors(wrapReceipt, tokenisedPayableContract, milestoneId, newId0);

        } catch (error) {
          console.error('Error in dAppCreate:', error);
          sendError("Error during contract deployment: " + error.message);
          //if (!errorSent) {
          //  res.status(500).send({ message: "Error during contract deployment: " + error.message });
          //  errorSent = true;
          //}
          return false;
        }
        return updatestatus;
      } //dAppCreate

      async function dAppUpdate() {
        updatestatus = false;
   
        // Readng ABI from JSON file
        fs = require("fs");
        ABI = JSON.parse(fs.readFileSync(abiFile).toString());

        console.log("!!! Signer:", SIGNER_PRIVATE_KEY.substring(0,4)+"..." + SIGNER_PRIVATE_KEY.slice(-3));
        // Creating a signing account from a private key
        const signer = web3.eth.accounts.privateKeyToAccount(SIGNER_PRIVATE_KEY)
        // console.log("signer:", signer);  // contains private key
    
        // Update contract
        const UpdateContract = async () => {
          try {
            console.log('Creating Dtscf contract with ABI');
            const tokenisedPayableContract = new web3.eth.Contract(ABI);
                
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
                    sendError("Error when signing transaction. Please try again. Report to tech support if problem is recurring.");
                    //if (!errorSent) {
                    //  console.log("Sending error 400 back to client");
                    //  res.status(400).send({ 
                    //    message: 'Error when signing transaction. Please try again. Report to tech support if problem is recurring.',
                    //  });
                    //  errorSent = true;
                    //}
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
                        sendError("Error when signing transaction. Please try again. Report to tech support if problem is recurring.");
                        //if (!errorSent) {
                        //  console.log("Sending error 400 back to client");
                        //  res.status(400).send({ 
                        //    message: 'Error when signing transaction. Please try again. Report to tech support if problem is recurring.',
                        //  });
                        //  errorSent = true;
                        //}
                        clearInterval(interval);
                        return false;
                      }
                      if (timer > TIMEOUT) {
                        console.log("!! getTransactionReceipt error (2): timeout after "+TIMEOUT.toString()+" seconds");
                        clearInterval(interval);
                        sendError("Timeout after "+TIMEOUT.toString()+" seconds, please check the Dtscf tab after 5 minutes and try again if the Dtscf isnt created.");
                        //if (!errorSent) {
                        //  console.log("Sending error 400 back to client");
                        //  res.status(400).send({ 
                        //    message: "Timeout after "+TIMEOUT.toString()+" seconds, please check the Dtscf tab after 5 minutes and try again if the Dtscf isnt created.",
                        //  });
                        //  errorSent = true;
                        //}
                        return false;
                      }
                    });
                    timer++;
                  }, 10000);
                } // function
              })
              .on("error", err => {
                  console.log("sentSignedTxn error2: ", err)
                  sendError("Error when signing transaction. Please try again. Report to tech support if problem is recurring.");
                  //if (!errorSent) {
                  //  console.log("Sending error 400 back to client");
                  //  res.status(400).send({ 
                  //    message: 'Error when signing transaction. Please try again. Report to tech support if problem is recurring.',
                  //  });
                  //  errorSent = true;
                  //}
                  return false;
            // do something on transaction error
              }); // sendSignedTransaction
    
            console.log('**** Dtscf Txn executed:', createReceipt);
            return true;
          } catch(error) {
            console.log('Error4 encountered -->: ',error);
            sendError("Error when signing transaction. Please try again. Report to tech support if problem is recurring.");
            //if (!errorSent) {
            //  console.log("Sending error 400 back to client");
            //  res.status(400).send({ 
            //    message: 'Error when signing transaction. Please try again. Report to tech support if problem is recurring.',
            //  });
            //  errorSent = true;
            //}
            return false;
          } // try catch
        }; // UpdateContract()
    
        return ( await UpdateContract() );
      } // dAppUpdate

  console.log("*** isNewDtscf = ", isNewDtscf);
  console.log("*** req.body.underlyingDSGDsmartcontractaddress = ", req.body.underlyingDSGDsmartcontractaddress);

  if (isNewDtscf) {   // new dtscf
    updatestatus = await dAppCreate();
    if (!updatestatus) {
      console.error("Error in dAppCreate, sending error response to client.");
      sendError("Error during contract deployment. Please try again. Report to tech support if problem is recurring.");
    }
  } else {            // update dtscf
    updatestatus = await dAppUpdate(); 
    if (!updatestatus) {
      console.error("Error in dAppUpdate, sending error response to client.");
      sendError("Error during update. Please try again. Report to tech support if problem is recurring.");
    }
  }
  console.log("approveDraftById Update status (1):", updatestatus);

////////////////////////////// Blockchain ////////////////////////

  console.log('New Dtscf Contract deployed updating DB: ', newTPsmartcontractaddress2);

  if (updatestatus) { // updatestatus
  // update draft table
    console.log("Updating row in dtscf draft table with status=3 and newTPsmartcontractaddress2("+newTPsmartcontractaddress2+").");
    await Dtscf_Drafts.update(  // update draft table status to "3"
    { 
      status                : 3,
      smartcontractaddress  : newTPsmartcontractaddress2,
      approverComments      : req.body.approvercomments,
    }, 
    { where:      { id: draft_id }},
    )
    .then(num => {
      if (num == 1) {
        sendSuccess('Tokenised Payable has been created and sent to contractors. Dtscf draft with id='+id+' was updated successfully.');
        return true;
      } else {
        sendError(`Record updated =${num}. Cannot update Dtscf draft with id=${id}. Maybe Dtscf was not found or req.body is empty!`);
        return false;
      }
    })
    .catch(err => {
      console.log(err);
      sendError('Error when signing transaction. Please try again. Report to tech support if problem is recurring.');
      return false;
    });
    return true;
  }  
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
    dtscf = await Dtscfs.findByPk(dtscf_id);
    if (!dtscf) {
      if (!errorSent) {
        res.status(404).send({
          message: `Dtscfs with id=${dtscf_id} not found.`
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
  const ALCHEMY_API_KEY = process.env.REACT_APP_ALCHEMY_API_KEY;
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
//    const web3 = new Web3(new Web3.providers.HttpProvider(`https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`));
    const web3 = new Web3(new Web3.providers.HttpProvider(`https://${ETHEREUM_NETWORK}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`));



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
        let gasFees = 4000000; // Default gas limit
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
              }, 10000);
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

  Dtscf_Drafts.findAll(
    { where: condition },
    )
    .then(data => {
      logDataValues("Dtscf_Drafts.findAll: ", data);
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

  Dtscf_Drafts.findAll(
    { where: condition },
    )
    .then(data => {
      logDataValues("Dtscf_Drafts.findAll: ", data);
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

  Dtscfs.findAll(
    { where: condition },
    )
    .then(data => {
      logDataValues("Dtscfs.findAll: ", data);
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
  
  Dtscfs.findAll(
  { 
    where: { id : Id },
  })
  .then(async data => {

    if (!data || data.length === 0) {
      return res.status(404).send({
        message: `Dtscfs with id=${Id} not found`
      });
    }

    //console.log("Qery result fo DATA:", data[0].id);

    /// Query blockchain
    // Readng ABI from JSON file
    fs = require("fs");
    ABI = JSON.parse(fs.readFileSync(abiFile).toString());  // <-- dropdown menu

    // Creation of Web3 class
    Web3 = require("web3");

    logDataValues("In Dtscfs.findAll: ", data);

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

    //const INFURA_API_KEY = process.env.REACT_APP_INFURA_API_KEY;
    //const provider = `https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`;
    const ALCHEMY_API_KEY = process.env.REACT_APP_ALCHEMY_API_KEY;
    const provider = `https://${ETHEREUM_NETWORK}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;

    const Web3Client = new Web3(new Web3.providers.HttpProvider(provider));
    const CONTRACT_OWNER_WALLET = process.env.REACT_APP_CONTRACT_OWNER_WALLET;

    // web3 = new Web3(new Web3.providers.HttpProvider(`https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`));
    web3 = new Web3(new Web3.providers.HttpProvider(`https://${ETHEREUM_NETWORK}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`));


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

    const dtscfs = await Dtscfs.findAll({
        where: condition,
        include: 
          [
            {
              model: Recipients,
              as: 'anchor',
              attributes: ['name']
            },
            {
              model: Campaigns,
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

    logDataValues("Dtscfs.findAll: ", formattedData);
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
  const rec = await Dtscfs.findByPk(id, {
    include: [
      { model: Milestone, as: 'dtscf_milestones' }
    ]
  });

  if (!rec) {
    return res.status(404).send({ message: "Record not found" });
  }

  const allContractors = await Contractor.findAll({
    where: { dtscf_project_id: id },
    include: { model: Purchase, as: 'dtscf_purchases' }
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

    const dtscfs = await Dtscfs.findAll({
    include: 
      [
        {
          model: Recipients,
          as: 'anchor',
          attributes: ['name']
        },
        {
          model: Campaigns,
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

    logDataValues("Dtscfs.findAll: ", formattedData);
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

  Dtscf_Drafts.findAll( 
    { 
      where: condition,
      //include: Recipients
    },
    )
    .then(data => {
      logDataValues("Dtscf_Drafts.findAll: ", data);
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
  const draft = await Dtscf_Drafts.findByPk(id, {
    include: [
      { model: Milestone_draft, as: 'dtscf_milestones_drafts' }
    ]
  });

  if (!draft) {
    return res.status(404).send({ message: "Draft not found" });
  }

  const allContractors = await Contractor_draft.findAll({
    where: { dtscf_project_id: id },
    include: {  
                model: Purchase_draft, 
                as: 'dtscf_purchases_drafts'
             }
  });

  const contractorMap = {};
  allContractors.forEach(con => {
    con.dataValues.subcontractors = [];  // Add dataValues for plain object
    if (con.dtscf_purchases_drafts) {
      con.dtscf_purchases_drafts.sort((a, b) => a.id - b.id);
    }
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
  console.log("Draft with milestones, contractors and purchases: ", JSON.stringify(draft, null, 2));
  res.send(draft);
}; // getAllDraftsByDtscfId

// Find a single Dtscf with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  Dtscfs.findByPk(id, {
    include: Recipients,
    include: Campaigns,
  })
    .then(data => {
      if (data) {
        logDataValues("Dtscfs.findByPk: ", data);
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
  console.log("In Dtscfs.getAllInvestorsById: id=", id);
  let errorSent = false;

  Dtscfs.findByPk(id, {
    include: [Recipients, Campaigns],
  })
  .then(async data => {
    if (!data) {
      res.status(404).send({ message: `Dtscf with id=${id} not found.` });
      return;
    }

    logDataValues("Dtscfs.findByPk: ", data);

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

    const ETHERSCAN_API_KEY = process.env.REACT_APP_ETHERSCAN_API_KEY;
//    const INFURA_API_KEY = process.env.REACT_APP_INFURA_API_KEY;
//    const providerUrl = `https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`;
    const ALCHEMY_API_KEY = process.env.REACT_APP_ALCHEMY_API_KEY;
    const providerUrl = `https://${ETHEREUM_NETWORK}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
    console.log("Provider URL:", providerUrl.replace(ALCHEMY_API_KEY, "****"));

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

    const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 15000, shouldRetry = () => true) => {
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
          1000,  // delay 1000ms
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

exports.approveMilestoneCompletedById = async (req, res) => {
  let hasSentResponse = false;

  console.log("Received approveMilestoneCompletedById:");
  const w1 = req.params.id;   // for http PUT
  console.log("user wallet =", w1);
  console.log("req.body = ", req.body);
  const m_id = req.body.id;
  const selectedMilestoneId = req.body.selectedMilestoneId; 
  const TPsmartContractAddress = req.body.smartcontractaddress;
  const blockchain = req.body.blockchain;


  require('dotenv').config();
  const ANCHOR_WALLET = process.env.REACT_APP_ANCHOR_WALLET;
  const CONTRACT_OWNER_WALLET = process.env.REACT_APP_CONTRACT_OWNER_WALLET;
  console.log("ANCHOR_WALLET:", ANCHOR_WALLET);
  console.log("CONTRACT_OWNER_WALLET:", CONTRACT_OWNER_WALLET);
  const SIGNER_PRIVATE_KEY = process.env.REACT_APP_SIGNER_PRIVATE_KEY;
  
  async function approveMilestone() {
      try {       // query blockchain for balance of TP tokens in the wallet address (w1)
          // --- WEB3 SETUP ---
          const web3 = setupWeb3(blockchain);

          const abi = JSON.parse(fs.readFileSync(abiFile, 'utf8')); 
          const TPcontract = new web3.eth.Contract(abi, TPsmartContractAddress);
          console.log(`Checking tokens in wallet ${w1} for contract ${TPsmartContractAddress}...`);
//          console.log(`TPcontract.methods: `, TPcontract.methods);
          const walletTokens = await getTokensInWallet(TPcontract, w1);
          console.log(`Tokens in wallet ${w1} for contract ${TPsmartContractAddress}:`, walletTokens);   

          // Now we realizeMilestone the token 
          const realizeMilestoneTP = async () => {
            try {
              console.log('Calling realizeMilestone ID:', selectedMilestoneId);

              // const gasPrice = await web3.eth.getGasPrice();  
              // Get gas prices (EIP-1559 support)
              const block = await web3.eth.getBlock('pending');
              const realizeMilestoneReceipt =  await retryWithBackoff(async (innerGasMultiplier, innerPriorityMultiplier, innerGasLimitMultiplier) => {
                  const endDateUnix = Math.floor(new Date(req.body.enddate).getTime() / 1000);
                  let realizeMilestoneGas;
                  try { // test first using estimateGas to see if the transaction would revert   
                      console.log(`Just testing realizing milestone : ${selectedMilestoneId}`);
                      realizeMilestoneGas = await TPcontract.methods.realizeMilestone( selectedMilestoneId ).estimateGas({ from: CONTRACT_OWNER_WALLET });
                  } catch (error) {
                      console.error("Gas estimation for realizeMilestone failed. The contract would revert this transaction.");
                      console.error(">>>>  Reason:", error.message);
                      console.log("hasSentResponse:", hasSentResponse);
                      // Handle the revert (e.g., send a friendly message to the user)
                      if (! hasSentResponse) {
                          hasSentResponse = true;
                          console.error("Sending error response to client due to gas estimation failure.");
                          console.error("Error details:", error.message);
                          if (error.message.includes('Not realized')) {
                              res.status(400).send({ message: "The token conditions have not been met yet." });
                          } else {
                              res.status(400).send({ message: "Blockchain revert: " + error.message });
                          }
                      }
                      return false; 
                      throw new Error(`Gas estimation for realizeMilestone failed: ${error.message}`);
                  }

                  try { // now the actual realizeMilestone call, with the same gas to see if it goes through
                      realizeMilestoneGas = Math.floor(realizeMilestoneGas * innerGasLimitMultiplier);    
                      let baseFee = BigInt(block.baseFeePerGas || await web3.eth.getGasPrice());
                      let maxPriorityFee = BigInt(2000000000);  // Default 2 gwei; adjust as needed
                      let maxFeePerGas = ((baseFee * BigInt(Math.floor(innerGasMultiplier * 100)) / BigInt(100)) + (maxPriorityFee * BigInt(Math.floor(innerPriorityMultiplier * 100)) / BigInt(100))).toString();
                      let maxPriorityFeePerGas = (maxPriorityFee * BigInt(Math.floor(innerPriorityMultiplier * 100)) / BigInt(100)).toString();

                      console.log('Current maxFeePerGas:', maxFeePerGas);
                      console.log('Current maxPriorityFeePerGas:', maxPriorityFeePerGas);

                      const realizeMilestoneData = TPcontract.methods.realizeMilestone( selectedMilestoneId ).encodeABI();

                      const realizeMilestoneTx = {
                        from: CONTRACT_OWNER_WALLET,
                        to: CONTRACT_OWNER_WALLET,
                        data: realizeMilestoneData,
                        gas: realizeMilestoneGas,
                        maxPriorityFeePerGas: maxPriorityFeePerGas,
                        maxFeePerGas: maxFeePerGas
                      };
                      
                      const signedRealizeMilestone = await web3.eth.accounts.signTransaction(realizeMilestoneTx, SIGNER_PRIVATE_KEY);

                      console.log('Realizing milestone now, sending signed transaction:', signedRealizeMilestone);

                      let realizeMilestoneHash;
                      try {
                        realizeMilestoneHash = await new Promise((resolve, reject) => {
                          web3.eth.sendSignedTransaction(signedRealizeMilestone.rawTransaction)
                            .once('transactionHash', resolve)
                            .once('error', reject);
                        });
                      } catch (err) {
                        console.error('Realize milestone transaction failed:', err.message);
                        throw new Error(`Realize milestone send failed: ${err.message}`);
                      }

                      // Poll for receipt every 10 seconds
                      let receipt = null;
                      let attempts = 0;
                      while (!receipt && attempts < 6) {  // Max 6 attempts (~1 min at 10s intervals)
                        console.log("Checking receipt for realize milestone transaction... #", attempts);
                        await new Promise(resolve => setTimeout(resolve, 10000));  // Wait 10s
                        receipt = await web3.eth.getTransactionReceipt(realizeMilestoneHash);
                        attempts++;
                      }

                      if (!receipt) {
                        console.error('Realize milestone transaction not mined within expected time.');
                        throw new Error('not mined');
                      }

                      if (!receipt.status) {
                        console.error('Realize milestone transaction failed:', receipt);
                        throw new Error('Realize milestone transaction failed or not confirmed');
                      }

                      console.log("realizeMilestoneReceipt() executed successfully. realizeMilestoneReceipt:", receipt);
                      return receipt;
                  } catch (err) {
                    console.error('Error during realizeMilestone transaction:', err.message);
                    throw err;
                  }
              }, 5, 15000, (err) => err.message.includes('not mined') || err.message.includes('underpriced') || err.message.includes('TIMEOUT'));

              console.log(`Realized milestone : ${selectedMilestoneId}`);

              //console.log('Realize milestone receipt:', realizeMilestoneReceipt);
              return realizeMilestoneReceipt;
            } catch (err) {
              console.error('Error in realizeMilestoneTP:', err.message);
              return false;
            }
          }; // realizeMilestoneTP
          return await realizeMilestoneTP();
      } catch (error) {
          console.error("Error fetching data from blockchain:", error);
          return false;
      } // query blockchain for balance of TP tokens in the wallet address (w1)
  }

  const status = await approveMilestone();

  console.log("realizeMilestone result: ", status);

/*
    res.status(500).send({
      message: `bye bye.`
    });

return;
*/

  await Milestone.update(  
  { 
    milestone_completed       : 1,
    milestone_completed_date  : Date.now(),
  }, 
  { where:      { id: selectedMilestoneId }},
  )
  .then(num => {
    if (num == 1) {      
      // write to audit
      AuditTrail.create(
        { 
          action                : "Dtscf set milestone completed - accepted",
          id                    : selectedMilestoneId,
        }, 
      )
      .then(auditres => {
        console.log("Data written to audittrail for setting dtscf milestone completed request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for setting dtscf milestone completed request: "+err.message);
      });
      
      res.send({
        message: "Dtscf milestone was set to completed successfully."
      });
    } else {
      res.send({
        message: `${req.body}. Record updated =${num}. Cannot update Dtscf with id=${selectedMilestoneId}. Maybe Dtscf was not found or req.body is empty!`
      });
    }
  })
  .catch(err => {
    console.log(err);
    res.status(500).send({
      message: `Error updating Dtscfs. ${err}`
    });
  });
}; // approveMilestoneCompletedById

exports.submitDraftById = async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/plain',
    'Transfer-Encoding': 'chunked'
  });

  const sendLog = message => {
    console.log(message);  // Server-side log for debugging
    res.write(`LOG: ${message}\n`);
  };

  const sendSuccess = message => {
    console.log(message);  // Server-side log for debugging
    res.write(`SUCCESS: ${message}\n`);
    res.end();
  };

  const sendError = message => {
    console.error(message);  // Server-side log for debugging
    res.write(`ERROR: ${message}\n`);
    res.end();
  };
  
  try {
    const draft_id = req.params.id;
    console.log(`Received submitDraftById for id=${draft_id}`);
    console.log("Content-Type:", req.headers['content-type']);
    console.log("Content-Length:", req.headers['content-length']);
    console.log(`Request headers: ${JSON.stringify(req.headers)}`);  // Debug: Log headers to check Content-Type
    console.log(`Raw body (before parsing): ${req.rawBody || 'No raw body'}`);  // Debug: If you add req.rawBody via middleware (optional)
    console.log(`Parsed req.body: ${JSON.stringify(req.body)}`);  // Debug: What was parsed
    console.log("id=", draft_id);
    // console.log(req.body);
    console.log(JSON.stringify(req.body, null, 2));

    sendLog("Updating draft...");

    const parsedBody = buildNestedObject(req.body);
    console.log('LOG: Parsed form data successfully.\n');

    const {
      name, description, totalBudget, anchor_id, underlyingTokenID,
      underlyingDSGDsmartcontractaddress, blockchain, campaign_id,
      startdate, enddate, milestones = [], contractors = [],
      maker, approver, approverComments, actionby, approveddtscfid, txntype
    } = parsedBody;

    if (!name || !totalBudget || !startdate || !enddate) {
      throw new Error('Missing required fields');
    }

    const [num] = await Dtscf_Drafts.update(
      {
        status: 2, // pending approver

        name,
        description,
        anchor_id,
        totalBudget,
        underlyingTokenID,
        underlyingDSGDsmartcontractaddress,
        campaign_id,
        blockchain,
        startdate,
        enddate,
        txntype,
        maker,
        approver,
//        checkerComments,
        approverComments
      },
      { where: { id: draft_id } }
    );

    for (const [index, ms] of milestones.entries()) {
      await Milestone_draft.update({
        dtscf_project_id: draft_id,
        name: ms.name,
        budget: parseInt(ms.budget) || 0,
        startdate: ms.startdate,
        enddate: ms.enddate,
        description: ms.description || '',
        name_changed: false,
        budget_changed: false,
        startdate_changed: false,
        enddate_changed: false
      }, { where: { id: ms.id } });
      console.log(`LOG: Updated milestone ${index + 1}/${milestones.length}.\n`);
    }

    // If updating existing milestones, capture their IDs
    const milestoneMap = {};

    for (const ms of milestones) {
      if (ms.id) {
        // If it's an existing milestone, just update it and map it
        await Milestone_draft.update({ 
            dtscf_project_id: draft_id,
            name: ms.name,
            budget: parseInt(ms.budget) || 0,
            startdate: ms.startdate,
            enddate: ms.enddate,
            description: ms.description || '',
            name_changed: false,
            budget_changed: false,
            startdate_changed: false,
            enddate_changed: false
        }, { where: { id: ms.id } });
        milestoneMap[ms.name] = ms.id;
      } else {
        // If it's a new milestone added during draft editing
        const newMs = await Milestone_draft.create({
            dtscf_project_id: draft_id,
            name: ms.name,
            budget: parseInt(ms.budget) || 0,
            startdate: ms.startdate,
            enddate: ms.enddate,
            description: ms.description || '',
            name_changed: true,
            budget_changed: true,
            startdate_changed: true,
            enddate_changed: true    
        });
        milestoneMap[ms.name] = newMs.id;
      }
    }


    for (const [index, con] of contractors.entries()) {
      var newContractorId = null;
      console.log("Before Contractor_draft update (con): ", con);  
      console.log("con.id: ", con.id);  

      if (con.id) {
        const newContractor = await Contractor_draft.update({
          dtscf_project_id: draft_id,
          name: con.name,
          budget: parseInt(con.budget) || 0,
          walletaddress: con.walletaddress || '',
          name_changed: false,
          budget_changed: false,
          walletaddress_changed: false,
          dtscf_project_id_changed: false,
          dtscf_parent_contractor_id_changed: false
        }, { where: { id: con.id } });
        console.log(`LOG: Updated contractor ${index + 1}/${contractors.length}.\n`);
        newContractorId = con.id;
        console.log("z con.id: ", con.id);
        console.log("z newContractorId: ", newContractorId);
      } else {
        const newContractor = await Contractor_draft.create({
          dtscf_project_id: draft_id,
          name: con.name,
          budget: parseInt(con.budget) || 0,
          walletaddress: con.walletaddress || '',
          name_changed: false,
          budget_changed: false,
          walletaddress_changed: false,
          dtscf_project_id_changed: false,
          dtscf_parent_contractor_id_changed: false
        });
        console.log(`LOG: Updated contractor ${index + 1}/${contractors.length}.\n`);
        console.log(">>>>>>>>>>>>  newContractor result: ", newContractor);
        newContractorId = newContractor.id;
        console.log("z newContractorId: ", newContractorId);
      }

      for (const [purIndex, pur] of (con.purchases || []).entries()) {
        
        const mappedMilestoneId = milestoneMap[pur.milestone] || pur.milestone_id || null;
        console.log("Before Purchase_draft update (pur): ", pur);  
        console.log("pur.id: ", pur.id);  
        if (pur.id) {
          await Purchase_draft.update({
            dtscf_project_id: draft_id,
            dtscf_contractor_id: newContractorId,
            dtscf_milestone_id: mappedMilestoneId,
            description: pur.description,
            amount: parseInt(pur.amount) || 0
          }, { where: { id: pur.id } });
          console.log(`LOG: Updated purchase #${purIndex + 1}(${pur.id}) for contractor ${index + 1}.\n`);
        } else {
          const newPur = await Purchase_draft.create({
            dtscf_project_id: draft_id,
            dtscf_contractor_id: newContractorId,
            dtscf_milestone_id: mappedMilestoneId,
            description: pur.description,
            amount: parseInt(pur.amount) || 0
          });
          console.log(`LOG: Created purchase #${purIndex + 1}(${newPur.id}) for contractor ${index + 1}.\n`);
        }
      }
    }

    console.log(`Update completed. Rows affected: ${num}`);

    if (num === 1) {
      try {
        await AuditTrail.create(
          {
            action: "Dtscf " + (req.body.txntype === 0 ? "create" : req.body.txntype === 1 ? "update" : req.body.txntype === 2 ? "delete" : "") + " request - submitted",
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
//            checkerComments: req.body.checkerComments,
            approverComments: req.body.approverComments,
            status: 1,
          }
        );
        console.log("AuditTrail created successfully");
      } catch (auditErr) {
        console.log("Error creating AuditTrail:", auditErr.message);
        throw auditErr;
      }

      sendSuccess(`SUCCESS: Draft was submitted successfully.\n`);
    } else {
      throw new Error(`Cannot submit Dtscf with id=${draft_id}. Maybe Dtscf was not found or req.body is empty!`);
    }
    res.end();
  } catch (err) {
    sendError(err.message);
  } finally {
  }
};  // submitDraftById for updating drafts

exports.acceptDraftById = async (req, res) => {
  const id = req.params.id;
  const draft_id = req.params.id;

  console.log("Received2 acceptDraftById:");
  console.log("id=", draft_id);
  console.log(req.body);

  await Dtscf_Drafts.update(
  { 
    status :          2,
//    checkerComments: req.body.checkerComments,
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
          anchor_id             : req.body.anchor_id || null,

          startdate             : req.body.startdate, 
          enddate               : req.body.enddate,

          maker                 : req.body.maker,
          checker               : req.body.checker,
          approver              : req.body.approver,
          actionby              : req.body.actionby,
//          checkerComments       : req.body.checkerComments,
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
      message: `Error updating Dtscfs. ${err}`
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

  await Dtscf_Drafts.update(
  { 
    status :          -1,
//    checkerComments: req.body.checkerComments,
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
//         checkerComments       : req.body.checkerComments,
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
        message: `Error rejecting Dtscfs. ${err}`
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
  const ALCHEMY_API_KEY = process.env.REACT_APP_ALCHEMY_API_KEY;
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
//    web3 = new Web3(new Web3.providers.HttpProvider(`https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`));
    web3 = new Web3(new Web3.providers.HttpProvider(`https://${ETHEREUM_NETWORK}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`));

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
        //web3.setProvider( new Web3.providers.HttpProvider(`https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`) );
        web3.setProvider( new Web3.providers.HttpProvider(`https://${ETHEREUM_NETWORK}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`) );

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
                    console.error("!! getTransactionReceipt error(6): ", error3)
                    clearInterval(interval);
                    return false;
                  }
                  if (timer > TIMEOUT) {
                    console.error("!! getTransactionReceipt error (6): timeout after "+TIMEOUT.toString()+" seconds");
                    clearInterval(interval);                      
                    console.error("Sending 22222 error 400 back to client");
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
              }, 10000);
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
    await Dtscfs.update(
      {
        name                  : req.body.name,
        blockchain            : req.body.blockchain || 0, // Default or from form
        underlyingTokenID     : req.body.underlyingTokenID || null,
        underlyingDSGDsmartcontractaddress : req.body.underlyingDSGDsmartcontractaddress || '',
        campaign_id           : req.body.campaign_id || null,
        anchor_id             : req.body.anchor_id || null,

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
//              checkerComments       : req.body.checkerComments,
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
            message: `Error updating Dtscfs. ${err}`
          });
          errorSent = true;
        }
      });
  } else {
    if (!errorSent) {
      res.status(500).send({
        message: "Error updating Dtscfs. "
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
  var Done = await Dtscf_Drafts.update(  // update draft table status to "3"
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
//          checkerComments       : req.body.checkerComments,
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

  if (Done) await Dtscfs.destroy({ // delete entry in approved Dtscf table
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
  await Dtscf_Drafts.update(  // update draft table status to "9" - aborted / dropped requests
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
//          checkerComments       : req.body.checkerComments,
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

  Dtscfs.destroy({
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

  Dtscfs.destroy({
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


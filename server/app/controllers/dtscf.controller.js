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
const Dtscf_Organisations = db.dtscf_organisations;
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

function getExplorerUrl(chainId, address) {
  const bases = {
    1: 'https://etherscan.io',
    11155111: 'https://sepolia.etherscan.io',
    137: 'https://polygonscan.com',
    80002: 'https://amoy.polygonscan.com',
    80001: 'https://mumbai.polygonscan.com',
    43114: 'https://snowtrace.io',
    43113: 'https://testnet.snowtrace.io',
  };
  const base = bases[parseInt(chainId)];
  return base ? `${base}/address/${address}` : null;
}

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
const proxyAbiFile = path.join(__dirname, '../abis/ERC1967Proxy.abi.json');
const proxyByteCodeFile = path.join(__dirname, '../abis/ERC1967Proxy.bytecode.json');
const smartContractFileName = "ERC1155Tokenised_Payable.sol";
const TokenName = "TokenizedPayable";
const tokenizedBank_abiFile = path.join(__dirname, '../abis/ERC20TokenDSGD.abi.json');
const tokenizedBank_byteCodeFile = path.join(__dirname, '../abis/ERC20TokenDSGD.bytecode.json');
const sharp = require('sharp');
const { where, NOW } = require("sequelize");
const crypto = require('crypto');
const { ethers } = require('ethers');
const encryptionService = require('../services/encryption.service');

function generateEscrowSalt() {
  return '0x' + crypto.randomBytes(32).toString('hex');
}

function computeEscrowCommitment(amountWei, saltHex) {
  const encoded = ethers.solidityPacked(['uint256', 'bytes32'], [BigInt(amountWei.toString()), saltHex]);
  return ethers.keccak256(encoded);
}

//var newcontractaddress = null;
const adjustdecimals = 18;
const TIMEOUT = 700;

function createStringWithZeros(num) { return ("0".repeat(num)); }

function isYYYYMMDDFormat(dateString) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  return regex.test(dateString);
} // isYYYYMMDDFormat

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
} // parseFormKey

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
} // buildNestedObject

async function setupWeb3(blockchain) {
  require('dotenv').config();
  var NETWORK;

  const providerUrl = (() => {
    switch (blockchain) {
      case 80001    : NETWORK = process.env.REACT_APP_POLYGON_MUMBAI_NETWORK;   return `https://polygon-mumbai.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}`;
      case 80002    : NETWORK = process.env.REACT_APP_POLYGON_AMOY_NETWORK;     return `https://polygon-amoy.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}`;
      case 11155111 : NETWORK = process.env.REACT_APP_ETHEREUM_SEPOLIA_NETWORK; return `https://eth-sepolia.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}`;
      case 137      : NETWORK = process.env.REACT_APP_POLYGON_MAINNET_NETWORK;  return `https://polygon-mainnet.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}`;
      case 1        : NETWORK = process.env.REACT_APP_ETHEREUM_MAINNET_NETWORK; return `https://eth-mainnet.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}`;
      default: return null;
    }
  })();
  if (!providerUrl) throw new Error(`Unsupported blockchain ID: ${blockchain}`);
  console.log("Provider URL:", providerUrl.replace(process.env.REACT_APP_ALCHEMY_API_KEY, "****"));
  const www = require('web3');
  const WWW = new www(new www.providers.HttpProvider(providerUrl));

  try {
      const isListening = await WWW.eth.net.isListening();
      const blockNumber = await WWW.eth.getBlockNumber();
      console.log(`Provider healthy. Connected to ${NETWORK}. Current block: ${blockNumber}`);
  } catch (err) {
    console.error("Provider health check failed:", err.message);
    throw new Error("Cannot connect to blockchain provider. Please try again later.");
  }

  return WWW;
} // setupWeb3

function createSVGWithBackground(text1, text2, text3, text4, width, height, text5 = '') {
  const rectHeight = text5 ? '258px' : '210px';
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
      .line4 {
        font-size: 25px;
        font-weight: normal;
        font-family: 'bell mt', 'Arial', sans-serif;
        fill: #664840;
      }
      .line5 {
        font-size: 22px;
        font-weight: bold;
        font-family: 'bell mt', 'Arial', sans-serif;
        fill: #334488;
      }
    </style>
  </defs>

  <!-- Larger white semi-transparent rectangle -->
  <rect
    x="4%"
    y="5%"
    width="80%"
    height="${rectHeight}"
    rx="18"
    fill="#ffffff"
    fill-opacity="0.8"
  />

  <!-- Lines - Better vertical spacing -->
  <text x="6%" y="12%"  text-anchor="start" class="line1">${text1}</text>
  <text x="6%" y="17%"  text-anchor="start" class="line2">${text2}</text>
  <text x="6%" y="20%"  text-anchor="start" class="line3">${text3}</text>
  <text x="6%" y="23%"  text-anchor="start" class="line4">${text4}</text>
  ${text5 ? `<text x="6%" y="27%"  text-anchor="start" class="line5">${text5}</text>` : ''}
</svg>`;
} // createSVGWithBackground

async function generateImage(projectname, milestonename, value, MID, completionDate, outputPath, originalValue = null) {
  try {
    const backgroundUrl = 'https://tokenising.herokuapp.com/tp-square.jpg';
    const fmtSGD = v => { const n = parseFloat(v); return Number.isInteger(n) ? n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    const newvalue = fmtSGD(value);

    // 1. Fetch the background image as a buffer
    const response = await axios.get(backgroundUrl, { responseType: 'arraybuffer' });
    const bgBuffer = Buffer.from(response.data);

    // 2. Get metadata of the background to match dimensions
    const metadata = await sharp(bgBuffer).metadata();
    const { width, height } = metadata;

    // 3. Generate SVG with text (scaled to background size)
    let svgText = "";
    if (MID===0) {
      svgText = createSVGWithBackground(
        "Tokenised Payable SGD" + newvalue,
        "",
        "Project: "+projectname,
        "Completion Date: " + completionDate,
        width,
        height);
    } else {
      svgText = createSVGWithBackground(
        "Tokenised Payable SGD" + newvalue,
        "Project: "+projectname,
        "Milestone (#" + MID +"): "+milestonename,
        "Completion Date: " + completionDate,
        width,
        height);
    }
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
} // generateImage

async function uploadToPinata(filePath, fileName) {
  //
  // Uploads a file to Pinata (IPFS pinning service)
  // Ref: https://docs.pinata.cloud/api-reference/quickstart
  // Add PINATA_JWT to .env (from Pinata dashboard: API Keys)
  //

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
} // uploadToPinata

async function generateMetadataFile(contractAddress, token_ID, value, projectname, milestonename, MID, maturityDate, conditions, originalValue = null, purchaseDescription = '', tempDir = os.tmpdir(), chainId = null) {
  try {
    console.log("Inside generateMetadataFile(): ");
    console.log("Contract address: ", contractAddress);
    console.log("token_ID: ", token_ID);
    console.log("Value: ", value);
    console.log("Project name: ", projectname);
    console.log("Milestone name: ", milestonename);
    console.log("milestone Id: ", MID);
    console.log("maturityDate: ", maturityDate);
    console.log("conditions: ", conditions);
    if (originalValue !== null) console.log("originalValue: ", originalValue);

    if (!contractAddress || !token_ID) {
      throw new Error('Missing required parameters: contractAddress or id');
    }

    // Generate image with try-catch
    const imageFileName = `${token_ID}.jpg`;
    const imageOutputPath = path.join(tempDir, imageFileName);
    let imageUrl = "";
    let previewImageUrl = "";  // blurred version for MetaMask (no sensitive amounts visible)

    try {
      await generateImage(projectname, milestonename, value, MID, maturityDate, imageOutputPath, originalValue);
      imageUrl = await uploadToPinata(imageOutputPath, imageFileName);

      // Generate blurred preview: same image with blur applied so amounts are unreadable
      const previewFileName = `${token_ID}_preview.jpg`;
      const previewOutputPath = path.join(tempDir, previewFileName);
      await sharp(imageOutputPath).blur(12).toFile(previewOutputPath);
      previewImageUrl = await uploadToPinata(previewOutputPath, previewFileName);
    } catch (imgErr) {
      console.error('Image generation/upload failed (continuing with default):', imgErr.message);
    }

    const readableMaturity = (isYYYYMMDDFormat(maturityDate)? maturityDate: (new Date(maturityDate * 1000).toISOString()).slice(0, 10)); // format as YYYY-MM-DD

    const fmtSGD = v => { const n = parseFloat(v); return Number.isInteger(n) ? n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    const origFloat = originalValue !== null && originalValue !== undefined ? parseFloat(originalValue) : null;
    const hasOriginal = origFloat !== null && Math.abs(origFloat - parseFloat(value)) > 0.0001;
    const originalCurrentStr = hasOriginal ? ` (Original: SGD${fmtSGD(origFloat)})` : '';

    // ERC-1155 Metadata structure
    const metadata = {
      name: `${projectname} - Tokenised Payable #${token_ID}`,
      description: `Tokenised Payable SGD${fmtSGD(value)}${originalCurrentStr}${purchaseDescription ? ` for the purchase of '${purchaseDescription}'` : ''}`+(MID===0?". ":(`. Milestone ${MID}. `))+`Completion date: ${readableMaturity}. ${conditions.trim().replace(/\.+$/, '')}.`,
      image: imageUrl.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/'), // Use Gateway URL
      attributes: [
        { trait_type: "Project Name", value: projectname },
        { trait_type: "Value", value: value.toString() },
        ...(hasOriginal ? [
          { trait_type: "Original Value", value: fmtSGD(origFloat) },
          { trait_type: "Current Value", value: fmtSGD(value) }
        ] : []),
        { trait_type: "Milestone Name", value: milestonename },
        { trait_type: "Milestone ID", value: MID },
        { trait_type: "Maturity Date", value: readableMaturity },
        { trait_type: "Conditions", value: conditions },
        { trait_type: "MintedAt", value: Date.now().toString() } // Cache Buster
      ]
    };

    // Write temp JSON file — encrypt with AES-256-GCM if chainId is provided
    const jsonFileName = `${token_ID}.json`;
    const jsonOutputPath = path.join(tempDir, jsonFileName);
    if (chainId) {
      const envelope = JSON.parse(encryptionService.encryptMetadata(JSON.stringify(metadata)));
      // Expose blurred preview image and name in plaintext for external viewers (MetaMask, block explorers).
      // The full detailed image (with amounts) and all financial data stay inside the encrypted ciphertext.
      const previewGatewayUrl = previewImageUrl.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
      envelope.image       = previewGatewayUrl || metadata.image; // fallback to full image if preview failed
      envelope.name        = metadata.name;
      envelope.description = 'Encrypted Tokenised Payable. Connect your wallet on the TP platform to view payment details.';
      fs.writeFileSync(jsonOutputPath, JSON.stringify(envelope));
      console.log(`AES-256-GCM encryption applied to TP #${token_ID} metadata`);
    } else {
      fs.writeFileSync(jsonOutputPath, JSON.stringify(metadata, null, 2));
    }

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
  } catch (err) {
    console.log("Error while generating Meta data file:", err.message)
    throw new Error(`Error while generating Meta data file: ${err.message}`);
    return null;
  }
} // generateMetadataFile

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
};  // retryWithBackoff

// Function to scale a number with up to 3 decimal places to a BigNumber with 18 decimal places
function scaleToWei(value, w3) {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
        throw new Error('Invalid number input for scaling');
    }
    // Convert to string with 3 decimal places and scale to wei (10^18)
    return w3.utils.toWei(parsed.toFixed(3), 'ether');
} // scaleToWei

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
        organisation_id: con.organisation_id || null,
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
        organisation_id: con.organisation_id || null,
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
} // updateOrCreateContractors

// Recursive function to create contractors and subcontractors
async function createContractors(contractors, projectId, files, parentId = null, path = []) {
  for (const [index, con] of contractors.entries()) {
    const draftContractor = await Contractor_draft.create({
      name: con.name,
      budget: parseInt(con.budget) || 0,
      walletaddress: con.walletaddress || '',
      organisation_id: con.organisation_id || null,
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
} // createContractors

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
} // getTokensInWallet

// Returns all dtscf_organisations with type=2 (contractor/subcontractor) for dropdown population
exports.getContractorOrganisations = async (req, res) => {
  try {
    const orgs = await Dtscf_Organisations.findAll({
      where: { type: 2 },
      attributes: ['id', 'name', 'walletaddress'],
      order: [['name', 'ASC']]
    });
    res.json(orgs);
  } catch (e) {
    console.error("getContractorOrganisations error:", e);
    res.status(500).json({ message: e.message });
  }
};

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

    let w1;
    if (recipient && recipient.walletaddress) {
      w1 = recipient.walletaddress;
    } else {
      // Try dtscf_organisations (handles cases where the org was registered there)
      try {
        const dtscfOrg = await Dtscf_Organisations.findOne({ where: { id: orgId } });
        if (dtscfOrg && dtscfOrg.walletaddress) w1 = dtscfOrg.walletaddress;
      } catch (orgErr) {
        console.warn(`[getTPbyOrgId] dtscf_organisations lookup failed for org ${orgId}: ${orgErr.message}`);
      }
      // Fall back to wallet stored directly on the contractor entry
      if (!w1) {
        const contractorEntry = await Contractor.findOne({
          where: { organisation_id: orgId },
          attributes: ['walletaddress']
        });
        if (!contractorEntry || !contractorEntry.walletaddress) {
          console.log(`[getTPbyOrgId] No wallet found for org ${orgId}, returning []`);
          return res.send([]);
        }
        w1 = contractorEntry.walletaddress;
      }
    }
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

        // For contractors/sub-contractors: scan ALL projects and rely on the blockchain
        // balance check to filter. This correctly handles NFTs transferred directly via
        // MetaMask (outside the app), where the receiving contractor has no dtscf_contractors
        // row for the project but does hold the token on-chain.
        dtscfs = await Dtscfs.findAll({
          include: [
            { model: Recipients, as: 'anchor', attributes: ['name'] },
            { model: Campaigns, as: 'underlyingToken', attributes: ['tokenname'] }
          ]
        });
        console.log(`[getTPbyOrgId] Scanning all ${dtscfs.length} projects for contractor wallet ${w1}`);
      }

      const results = await Promise.all(dtscfs.map(async dtscf => {  // loop thru all the TP smart contract tokens
        const json = dtscf.toJSON();
        json.anchorName = dtscf.anchor ? dtscf.anchor.name : null;
        json.tokenName = dtscf.underlyingToken ? dtscf.underlyingToken.tokenname : null;
        delete json.anchor;
        delete json.underlyingToken;

        // FIX: Skip projects that don't have a contract address maybe due to update error
        if (!json.smartcontractaddress) {
          console.warn(`Skipping project ${json.id} - No contract address found.`);
          return []; 
        }

        try {       // query blockchain for balance of TP tokens in the wallet address (w1)
          const web3 = await setupWeb3(json.blockchain); // Assuming all tokens are on the same blockchain, otherwise this needs to be inside the loop
          const abi = JSON.parse(fs.readFileSync(abiFile, 'utf8')); 
          const TPcontract = new web3.eth.Contract(abi, json.smartcontractaddress);
        
          const walletTokens = await getTokensInWallet(TPcontract, w1);
          console.log(`Tokens in wallet ${w1} for contract ${json.smartcontractaddress}:`, walletTokens);   
          let tokenId = null;

          // Return an array of objects (one for each token found)
          // or an empty array if none found
          // payables() struct changed (commitment scheme) — use DB totalBudget for display value.
          return walletTokens.map((token) => ({
              ...json,
              tokenId: token.tokenId,
              value: json.totalBudget,
          }));
        } catch (error) {
            console.error("Error fetching data from blockchain:", error);
        } // query blockchain for balance of TP tokens in the wallet address (w1)
      }));

      // Flatten the results so you don't have nested arrays [[{}, {}], []]
      const flattenedResults = results.flat();
      console.log("Flattened result: ", flattenedResults);

      // Group by a unique identifier (like projectId or scAddress) so that there wont be multiple rows for each milestones if there are more than 1 token
      const distinctProjects = Object.values(flattenedResults.reduce((acc, current) => {
          const key = current.smartcontractaddress; 
          
          if (!acc[key]) {
              // If this project isn't in our list yet, add it
              acc[key] = { ...current };
          } else {
              // Add TOTAL value of all tokens for this project
              acc[key].value = (parseFloat(acc[key].value) + parseFloat(current.value)).toString();
              
              // Keep track of which token IDs were merged
              if (!Array.isArray(acc[key].allTokenIds)) {
                  acc[key].allTokenIds = [acc[key].tokenId];
              }
              acc[key].allTokenIds.push(current.tokenId);
          }
          
          return acc;
      }, {}));

      //logDataValues("Dtscfs.findAll: ", distinctProjects);
      console.log("Distinct projects with anchorName and tokenName:", distinctProjects);
      res.send(distinctProjects);
    } catch (err) {
      console.log("Error while retrieving dtscf4: "+err.message);
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving TP project records."
      });
    }


    return;

  } catch (err) {
    console.error(`[getTPbyOrgId] Error for orgId ${orgId}:`, err.message);
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving TP tokens."
    });
  }
}; // getTPbyOrgId

// Returns the tokenIds, amounts (wei), and salts for a batch unwrap transaction.
// Query params: contractAddress, milestoneId, blockchain
exports.getUnwrapParams = async (req, res) => {
  const { contractAddress, milestoneId, blockchain, tokenIds: tokenIdsParam, projectId } = req.query;
  if (!contractAddress || !milestoneId || !blockchain) {
    return res.status(400).json({ message: 'contractAddress, milestoneId, and blockchain are required' });
  }
  try {
    const web3 = await setupWeb3(parseInt(blockchain));
    const abi = JSON.parse(fs.readFileSync(abiFile, 'utf8'));
    const contract = new web3.eth.Contract(abi, contractAddress);

    // Use caller-supplied token IDs (already filtered to the user's wallet) when provided;
    // fall back to fetching all milestone tokens if not supplied.
    let tokenIds;
    if (tokenIdsParam) {
      tokenIds = tokenIdsParam.split(',').map(s => s.trim()).filter(Boolean);
    } else {
      tokenIds = await contract.methods.getTokensForMilestone(parseInt(milestoneId)).call();
    }
    if (!tokenIds || tokenIds.length === 0) {
      return res.json({ tokenIds: [], amounts: [], salts: [] });
    }

    const purchaseWhere = (id) => {
      const w = { token_id: parseInt(id) };
      if (projectId) w.dtscf_project_id = parseInt(projectId);
      return w;
    };
    const rows = await Promise.all(tokenIds.map(id =>
      Purchase.findOne({ where: purchaseWhere(id) })
    ));

    const amounts = rows.map((row, i) => {
      if (!row?.amount) { console.warn(`No amount for token ${tokenIds[i]}`); return '0'; }
      return web3.utils.toWei(row.amount.toString(), 'ether');
    });
    const salts = rows.map((row, i) => {
      if (!row?.escrow_salt) { console.warn(`No escrow_salt for token ${tokenIds[i]}`); return '0x' + '00'.repeat(32); }
      return row.escrow_salt;
    });

    res.json({ tokenIds, amounts, salts });
  } catch (err) {
    console.error('getUnwrapParams error:', err.message);
    res.status(500).json({ message: err.message });
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
        console.error("View Error:", e.message);
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
          const web3 = await setupWeb3(blockchain);

          const abi = JSON.parse(fs.readFileSync(abiFile, 'utf8')); 
          const TPcontract = new web3.eth.Contract(abi, TPsmartContractAddress);
          console.log(`Checking tokens in wallet ${w1} for contract ${TPsmartContractAddress}...`);
//          console.log(`TPcontract.methods: `, TPcontract.methods);
          const walletTokens = await getTokensInWallet(TPcontract, w1);
          console.log(`Tokens in wallet ${w1} for contract ${TPsmartContractAddress}:`, walletTokens);   
          let tokenId = null;

          if (walletTokens && walletTokens.length > 0) {
            for (const token of walletTokens) {
              console.log(`Processing token ID: ${token.tokenId} in wallet ${w1}`);

              // Now we unWrap the token
              const unWrapTP = async () => {
                try {
                  console.log('Calling unwrapTP to unwrap the token ID:', token.tokenId);

                  // Retrieve the escrow amount and salt from DB to reveal the commitment
                  let unwrapAmount = '0';
                  let unwrapSalt = '0x' + '00'.repeat(32);
                  try {
                    const purchaseRow = await Purchase.findOne({ where: { token_id: parseInt(token.tokenId), dtscf_project_id: data.dtscf_project_id } });
                    if (purchaseRow?.escrow_salt && purchaseRow?.amount) {
                      unwrapSalt = purchaseRow.escrow_salt;
                      unwrapAmount = web3.utils.toWei(purchaseRow.amount.toString(), 'ether');
                    } else {
                      console.warn(`No escrow_salt/amount found for token ${token.tokenId} — unwrap will likely revert`);
                    }
                  } catch (dbErr) {
                    console.warn('DB lookup for escrow_salt failed:', dbErr.message);
                  }

                  // Get gas prices (EIP-1559 support)
                  const block = await web3.eth.getBlock('pending');
                  const unwrapReceipt =  await retryWithBackoff(async (innerGasMultiplier, innerPriorityMultiplier, innerGasLimitMultiplier) => {
                      const endDateUnix = Math.floor(new Date(req.body.enddate).getTime() / 1000);

                      try {
                        console.log(`Just testing unwrapping ${token.tokenId}`);
                        let wrapGas = await TPcontract.methods.unwrapToDeposit( token.tokenId, unwrapAmount, unwrapSalt ).estimateGas({ from: w1 });
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
                  conditions: details.conditions,
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
          action                : "TP unwrap - draft created",
          id                    : m_id,
        }, 
      )
      .then(auditres => {
        console.log("Data written to audittrail for setting TP unwrap completed request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for setting TP unwrap completed request: "+err.message);
      });
      
      res.send({
        message: "TP unwrap draft was created successfully."
      });
    } else {
      res.send({
        message: `${req.body}. Record updated =${num}. Cannot update TP with id=${m_id}. Maybe TP was not found!`
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
  // Steps:
  // 1. aaaa
  // 2. bbbb:

  let hasSentResponse = false;
  var newTPsmartcontractaddress2 = null;
  let newMilestoneIDArr = [];   // to keep track of draft milestone ID --> prod milestone ID mapping for updates
  let newContractorArr = [];    // to keep track of draft contractor ID --> prod contractor ID mapping for updates
  let newPurchaseArr = [];      // to keep track of draft purchase ID --> prod purchase ID mapping for updates
  let milestoneMap9 = {};       // to keep track of new prod milestone ID mapping

  let newDtscf = null;

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

  console.log("Input data for approveUnwrapDraftById(), ", JSON.stringify(req.body, null, 2));

  if (req.body.txntype !==0     // create dtscf
    && req.body.txntype !==1    // update dtscf
    ) {
      sendError("Invalid transaction type!");
      return;  
  }


  const isNewDtscf = (req.body.txntype === 0? true : false); // Create = true, Edit/Update = false


  // Now we do database operation first, if failed then roll back, and we also set the dbstatus to "PENDING"
  
      try {              // atomic txn
        console.log("Creating row in TP prod table.");
        const atomicResult = await db.sequelize.transaction(async (ttt) => {
          var approved_id;
          await Dtscfs.create( // create TP in the database !!!!!
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

              dbstatus              : `PENDING_${draft_id}`,
            },
            { transaction: ttt }  // pass transaction object to ensure atomicity)
          )
          .then(data => {
            logDataValues("TP create success: ", data);
            approved_id = data.id;
            newDtscf = data.id;
          })
          .catch(err => {
            console.log("Error while creating TP row: "+err.message);
            throw new Error('Error when signing transaction. Please try again. Report to tech support if problem is recurring.');
          });
          console.log("Approved ID for new Dtscf:", approved_id);
          console.log("newDtscf:", newDtscf);
          console.log("Updating draft table to prod ID:", approved_id);

          await Dtscf_Drafts.update(  // update draft table with TP project id
          { 
            approveddtscfid       : approved_id,
          }, 
          { where:      { id: draft_id }},
          { transaction: ttt }
          )
          .then(num => {
            if (num == 1) {
              console.log("Updated draft table with project id.");
            } else {
              throw new Error(`${req.body}. Record updated =${num}. Cannot update draft with id=${draft_id}.`);
            }
          })
          .catch(err => {
            console.log(err);
            throw new Error('Error when signing transaction. Please try again. Report to tech support if problem is recurring.');
          });

          // copy draft milestones to prod table
          //newMilestoneIDArr = [];
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
              dbstatus              : `PENDING_${draft_id}`,
            },
            { transaction: ttt }  // pass transaction object to ensure atomicity)
            );
            milestoneMap9[dm.id] = newMilestone9.id;  // draft_id --> prod_id
            newMilestoneIDArr.push( 
              {
                id: newMilestone9.id,
                name: dm.name,
                budget: dm.budget,
                startdate: dm.startdate,
                enddate: dm.enddate,
                dtscf_project_id: approved_id,
              }
            ); // store the new prod milestone ID in the array, to be used later in copyContractorsAndPurchases when setting dtscf_milestone_id for purchases
            console.log("Draft milestone ID:"+ dm.id + " mapped to new prod milestone ID:" + newMilestone9.id);
            console.log("<<<<<<<<<<<<<< milestoneMap9[" + dm.id + "] = newMilestone9.id: "+ newMilestone9.id);
          }
          console.log("Finished creating milestones.");
          console.log("milestoneMap9:", milestoneMap9);

          //newMilestoneIDArr = milestoneMap9; // store the milestone mapping for this draft_id, to be used later in copyContractorsAndPurchases when setting dtscf_milestone_id for purchases
          console.log(">>>>>>  newMilestoneIDArr for draft_id "+ draft_id + ": ", newMilestoneIDArr);

          // copy draft contractors and purchases to prod tables
          newContractorArr = [];
          newPurchaseArr = [];
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
                organisation_id: dc.organisation_id || null,
                dtscf_project_id: approved_id,
                dtscf_parent_contractor_id: newParentId,
                dtscf_milestone_id: dc.dtscf_milestone_id || null,
                dbstatus              : `PENDING_${draft_id}`,
              },
              { transaction: ttt }  // pass transaction object to ensure atomicity)
              );
              newContractorArr.push(
                {
                  id: newContractor.id,
                  name: dc.name,
                  budget: dc.budget,
                  walletaddress: dc.walletaddress,
                  organisation_id: dc.organisation_id || null,
                  dtscf_project_id: approved_id,
                  dtscf_parent_contractor_id: newParentId,
                  dtscf_milestone_id: dc.dtscf_milestone_id || null,
                }
              ); // store the new prod contractor ID in the array, to be used later in copyContractorsAndPurchases when setting dtscf_contractor_id for purchases

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

                const newPurchase = await Purchase.create({
                  description: dp.description,
                  amount: dp.amount,
                  dtscf_project_id: approved_id,
                  dtscf_contractor_id: newConId,
                  dtscf_milestone_id: mappedMilestoneId,  // draft_id --> prod_id
                  invoice_blob: dp.invoice_blob,
                  dbstatus              : `PENDING_${draft_id}`,
                },
                { transaction: ttt }  // pass transaction object to ensure atomicity)
                );
                newPurchaseArr.push(
                  {
                    id: newPurchase.id,
                    description: dp.description,
                    amount: dp.amount,
                    dtscf_project_id: approved_id,
                    dtscf_contractor_id: newConId,
                    dtscf_milestone_id: mappedMilestoneId,  // draft_id --> prod_id
                    invoice_blob: dp.invoice_blob,
                  }
                ); // store the new prod purchase ID in the array, to be used later in copyContractorsAndPurchases when setting dtscf_purchase_id for purchases
              } // for purchase
              // Recurse for subcontractors
              await copyContractorsAndPurchases(dc.id, newConId);
              console.log("Finished creating purchase.");
            }  // for contractor
          }
          await copyContractorsAndPurchases();
          console.log("Finished creating milestones, contractor and purchase. Committing transaction...");

          /////////////////// test  

          console.log("req.body:", JSON.stringify(req.body, null, 2) );
          console.log("milestoneMap9 for draft_id "+ draft_id + ": ", milestoneMap9);
          console.log("newMilestoneIDArr for draft_id "+ draft_id + ": ", newMilestoneIDArr);
          console.log("newContractorArr for draft_id "+ draft_id + ": ", newContractorArr); 
          console.log("newPurchaseArr for draft_id "+ draft_id + ": ", newPurchaseArr);
//          throw new Error("Testing transaction rollback!"); // TESTING, to be removed
//          return false;
          /////////////////// test end
          return true;
        }); // const atomicResult = await db.sequelize.transaction()
      
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
    
//  sendError("Error in adding to database : bye bye");
//  return false;

////////////////////////////// Blockchain ////////////////////////

  // https://www.geeksforgeeks.org/how-to-deploy-contract-from-nodejs-using-web3/

  const web3 = await setupWeb3(req.body.blockchain);

  const SIGNER_PRIVATE_KEY = process.env.REACT_APP_SIGNER_PRIVATE_KEY;
  const CONTRACT_OWNER_WALLET = process.env.REACT_APP_CONTRACT_OWNER_WALLET;
  const ANCHOR_PRIVATE_KEY = process.env.REACT_APP_ANCHOR_PRIVATE_KEY;
  const ANCHOR_WALLET = process.env.REACT_APP_ANCHOR_WALLET;

  console.log("!!! Platform:", SIGNER_PRIVATE_KEY.substring(0,4)+"..." + SIGNER_PRIVATE_KEY.slice(-3));

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

    const ABI = JSON.parse(fs.readFileSync(abiFile, 'utf8').toString());
    const bytecode = JSON.parse(fs.readFileSync(byteCodeFile, 'utf8').toString());

    const signer = web3.eth.accounts.privateKeyToAccount(SIGNER_PRIVATE_KEY);
    const anchor = web3.eth.accounts.privateKeyToAccount(ANCHOR_PRIVATE_KEY);

    console.log("Enddate (unix time) = ", Number(new Date(req.body.enddate)));
    try {                    
      const tokenizedBankDeposit_ABI = JSON.parse(fs.readFileSync(tokenizedBank_abiFile, 'utf8').toString());
      const depositContract = new web3.eth.Contract(tokenizedBankDeposit_ABI, req.body.underlyingDSGDsmartcontractaddress);
      const tokenisedPayableContract = new web3.eth.Contract(ABI, newTPsmartcontractaddress2);
      const requiredAmount = web3.utils.toWei(req.body.totalBudget.toString(), 'ether');          // total budget in wei

      const unwrapToDeposit = async () => {
          console.log('Calling Unwrap()');

              // Step 5: Unwrap TP back to deposit
              console.log("=== Step 5: Unwrap (sign and send signed tx), TP is unwrapped by Anchor ===");
              sendLog("Unwrapping Tokenised Payable(TP) tokens");
              const unWrapReceipt = await retryWithBackoff(async (innerGasMultiplier, innerPriorityMultiplier, innerGasLimitMultiplier) => {
                  let wrapGas = await tokenisedPayableContract.methods.unwrapToDeposit(
                    1
                  ).estimateGas({ from: anchor.address });
                  wrapGas = Math.floor(wrapGas * innerGasLimitMultiplier);

                  let baseFee = BigInt((await web3.eth.getBlock('latest')).baseFeePerGas || await web3.eth.getGasPrice());
                  let maxPriorityFee = BigInt(2000000000);  // Default 2 gwei; adjust as needed
                  let maxFeePerGas = (baseFee * BigInt(Math.floor(innerGasMultiplier * 100)) / BigInt(100)) +
                                      (maxPriorityFee * BigInt(Math.floor(innerPriorityMultiplier * 100)) / BigInt(100));
                  maxFeePerGas = maxFeePerGas.toString();
                  let maxPriorityFeePerGas = (maxPriorityFee * BigInt(Math.floor(innerPriorityMultiplier * 100)) / BigInt(100)).toString();

                  console.log('Current maxFeePerGas:', maxFeePerGas);
                  console.log('Current maxPriorityFeePerGas:', maxPriorityFeePerGas);

                  const wrapData = tokenisedPayableContract.methods.unwrapToDeposit(
                      1   // token ID
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

                  console.log("Funds wrapped successfully. unWrapReceipt:", receipt);
                  return receipt;
              }, 5, 15000, (err) => err.message.includes('not mined') || err.message.includes('underpriced') || err.message.includes('TIMEOUT'));

              const newId = 1;
              console.log(`Wrapped ${requiredAmount} into payable token ID ${newId}`);

              // Return needed values for transfer logic
              return { unWrapReceipt, newId };
          //} // newMilestoneIDArr.forEach
      }; // wrapDepositToPayableForAnchor
      const { unWrapReceipt, newId } = await unwrapToDeposit();

      // Fallback if undefined
      let newId0 = newId || 1; // Default to 1 if not set

      console.log("after await wrapDepositToPayableForAnchor()...");
      console.log("unWrapReceipt:", unWrapReceipt);
      //console.log("tokenisedPayableContract:", tokenisedPayableContract);
      console.log("newId0:", newId0);

      // Step 6: Transfer TP to contractors as per milestones
      console.log("=== Step 6: transfer TP to contractors as per milestones ===");
      //log("Transferring Tokenised Payable tokens to contractors as per milestones ");
      const splitAndTransferTPtoContractors = async (unWrapReceipt, tokenisedPayableContract, newId0) => {
        console.log("Transferring Tokenised Payable tokens to contractors as per milestones");

        if (!newId0) {
          console.warn('newId0 is undefined - skipping transfer.');
          throw new Error('Token ID for the wrapped payable is missing. Cannot proceed with splitting and transferring to contractors.');
        }
        // Await the unWrapReceipt if it's a promise
        const resolvedReceipt = await unWrapReceipt;
        console.log('Resolved unWrapReceipt:', resolvedReceipt);   

        try {
          // In splitAndTransferTPtoContractors, update balance check
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
            allIds = [newId0];  // Fallback to known ID
          }                     // Assume the last (most recent) ID is the original wrapped one, as contract is new
          let originalId = allIds[allIds.length - 1];
          console.log(`Original payable ID: ${originalId}`);

          //
          //
          //
          // splitPayable() requires originalId, amount to split, and metadata URI for the split portion. 
          // We loop through purchases, calculate their amounts based on linked purchases, 
          // then call splitPayable for each contractor to create new payable tokens in their wallets. 
          // The metadata URI can include details like milestone completion, contractor name, etc.
          //
          //
          //
//              let contractors = req.body.contractors || [];
//              if (typeof contractors === 'string') { contractors = JSON.parse(contractors); }


          let NFTindex = parseInt(originalId);  // originalId is the ID of the wrapped TP that Anchor holds, we will split from this ID to create new IDs for contractors. We can use a simple incrementing index for the new IDs, starting from originalId + 1.
          let purAmount = 0;

          // Capture the source TP's value before any splits so "Original" stays fixed across all iterations
          let initialSourceSGD = null;
          try {
            const initSrcPayable = await tokenisedPayableContract.methods.payables(originalId).call();
            initialSourceSGD = parseFloat(web3.utils.fromWei(initSrcPayable.value.toString(), 'ether'));
          } catch (e) {
            sendLog(`Note: could not query initial source value for TP #${originalId}: ${e.message}`);
          }

          // Loop thru purchases then find the contractor and milestone linked to this
          //newPurchaseArr.forEach(async purchase => {
          for (const purchase of newPurchaseArr) {  // do not use forEach as there will be race conditions
              // 1. Find the contractor matching the purchase's contractor ID
              const contractor = newContractorArr.find(c => c.id === purchase.dtscf_contractor_id);
              
              // 2. Find the milestone matching the purchase's milestone ID
              const milestone = newMilestoneIDArr.find(m => m.id === purchase.dtscf_milestone_id);

              // 3. Display the information
              console.log("\n===================");
              console.log(`Purchase: ${purchase.description}`);
              console.log(`- Contractor Name: ${contractor ? contractor.name : 'N/A'}`);
              console.log(`- Contractor Wallet: ${contractor ? contractor.walletaddress : 'Unknown'}`);
              console.log(`- Milestone Name: ${milestone ? milestone.name : 'Unknown'}`);
              console.log('---');
              purAmount = parseFloat(purchase.amount) || 0;   //zzz <--- cannot total, must create 1 TP for every purchase
              
              const amountWei = web3.utils.toWei(purAmount.toString(), 'ether');

              if (!web3.utils.toBN(amountWei).gt(0)) {
                console.log(`Skipping purchase with non-positive amount for contractor ${contractor.name}`);
                return; // acts as continue and skip to next iteration
              }
              if (!contractor?.walletaddress) { 
                sendError(`Contractor wallet address not found for ${contractor.name}`);
                return false;
              }

              // Step 7: split TP
              console.log("=== Step 7: split TP ===");
              console.log(`Creating TP for purchase '${purchase.description}' for contractor '${contractor.name}' with SGD${purAmount}`);

              NFTindex++;
              // Generate metadata for the new split token
              let metadataPath = await generateMetadataFile(
                newTPsmartcontractaddress2,
                NFTindex,
                purAmount.toString(),
                req.body.name,
                milestone.name,
                milestone.id,
                milestone.enddate,
                `Completion of milestone '${milestone.name}'`,
                null,
                purchase.description
              );

              // Pre-generate updated source URI (reflects reduced value after this split)
              const currentOriginalValueWei = await tokenisedPayableContract.methods.payables(originalId).call().then(p => p.value);
              const currentOriginalSGD = parseFloat(web3.utils.fromWei(currentOriginalValueWei, 'ether'));
              const remainingOriginalSGD = currentOriginalSGD - purAmount;
              sendLog(`Splitting TP #${originalId} (SGD${currentOriginalSGD}) → new TP #${NFTindex} (SGD${purAmount}) for '${purchase.description}' to '${contractor.name}'. Source TP #${originalId} will be SGD${remainingOriginalSGD} after split.`);
              const originalMetadataPath = await generateMetadataFile(
                newTPsmartcontractaddress2,
                parseInt(originalId),
                remainingOriginalSGD.toString(),
                req.body.name, '', 0, req.body.enddate, 'Completion of project',
                initialSourceSGD
              );

              let block = await web3.eth.getBlock('pending');
              const maturityDate0 = Math.floor(new Date(milestone.enddate).getTime() / 1000);

              const splitReceipt = await retryWithBackoff(async (innerGasMultiplier, innerPriorityMultiplier, innerGasLimitMultiplier) => {
                  let baseFee = BigInt((await web3.eth.getBlock('latest')).baseFeePerGas || await web3.eth.getGasPrice());
                  let maxPriorityFee = BigInt(2000000000);  // Default 2 gwei; adjust as needed
                  let maxFeePerGas = (baseFee * BigInt(Math.floor(innerGasMultiplier * 100)) / BigInt(100)) +
                              (maxPriorityFee * BigInt(Math.floor(innerPriorityMultiplier * 100)) / BigInt(100));
                  maxFeePerGas = maxFeePerGas.toString();
                  let maxPriorityFeePerGas = (maxPriorityFee * BigInt(Math.floor(innerPriorityMultiplier * 100)) / BigInt(100)).toString();

                  let splitGas = await tokenisedPayableContract.methods.splitPayable(originalId, milestone.id, amountWei, maturityDate0, metadataPath, originalMetadataPath).estimateGas({ from: anchor.address });
                      splitGas = Math.floor(splitGas * innerGasLimitMultiplier);

                  const splitData = tokenisedPayableContract.methods.splitPayable(
                    originalId,
                    milestone.id,
                    amountWei,
                    maturityDate0,
                    metadataPath,
                    originalMetadataPath
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
                  if (!splitReceipt || splitReceipt.status !== true) {
                    throw new Error(`Split transaction failed on-chain. Status: ${splitReceipt?.status}`);
                  }

                  console.log("Funds split successfully. splitReceipt:", splitReceipt);

                  return splitReceipt;
              }, 5, 15000, (err) => err.message.includes('not mined') || err.message.includes('underpriced') || err.message.includes('TIMEOUT'));

              console.log("JSON splitReceipt: ", JSON.stringify(splitReceipt, null, 2));

              // Extract newSplitId from PayableSplit event in splitReceipt
              let newSplitId = null;
              for (const log of splitReceipt.logs) {
                const eventSignature = web3.utils.keccak256(
                    'PayableSplit(uint256,uint256,uint256,uint256,uint256)'
                );

                if (log.topics[0] === eventSignature) {
                  try {
                      const decoded = web3.eth.abi.decodeLog([
                          { type: 'uint256', name: 'originalId', indexed: true },
                          { type: 'uint256', name: 'newId', indexed: false },
                          { type: 'uint256', name: 'splitValue', indexed: false },
                          { type: 'uint256', name: 'newMilestoneId', indexed: false },
                          { type: 'uint256', name: 'newMaturityDate', indexed: false }
                      ], log.data, log.topics);

                      newSplitId = decoded.newId;
                      console.log(`Extracted newSplitId from PayableSplit event: ${newSplitId}`);
                      break;
                  } catch (decodeErr) {
                      console.warn("Failed to decode PayableSplit log:", decodeErr.message);
                  }
                }              
              }
              if (!newSplitId) {
                console.log("PayableSplit event not found, using fallback...");
                try {
                    const allIds = await tokenisedPayableContract.methods.getAllTokenIds().call();
                    if (allIds && allIds.length > 0) {
                        newSplitId = allIds[allIds.length - 1]; // newest token
                        console.log(`Fallback: Took latest token ID = ${newSplitId}`);
                    }
                } catch (fallbackErr) {
                    console.error("Fallback getAllTokenIds failed:", fallbackErr.message);
                }
              }
              if (!newSplitId) {
                sendError('Failed to extract new payable ID from split receipt');
                throw new Error('Could not determine newSplitId after splitPayable');
                return false;
              }

              // Verify the new token was actually minted on-chain (guards against RPC false-positive receipts)
              const splitBalance = await tokenisedPayableContract.methods.balanceOf(anchor.address, newSplitId).call();
              if (String(splitBalance) !== '1') {
                throw new Error(`Split verification failed: token #${newSplitId} not in anchor wallet (balance=${splitBalance}). On-chain revert likely.`);
              }

              sendLog(`TP #${newSplitId} (SGD${purAmount}) created for '${contractor.name}'. Source TP #${originalId} updated to SGD${remainingOriginalSGD}.`);

              // Step 8: Transfer the split TP to contractor
              console.log("=== Step 8: Transfer the split TP to contractor ===");
              sendLog(`Transferring TP to contractor '${contractor.name}' `);
              await retryWithBackoff(async (innerGasMultiplier, innerPriorityMultiplier, innerGasLimitMultiplier) => {
                let transferGas = await tokenisedPayableContract.methods.safeTransferFrom(anchor.address, contractor.walletaddress, newSplitId, 1, '0x').estimateGas({ from: anchor.address, to: newTPsmartcontractaddress2 });
                transferGas = Math.floor(transferGas * innerGasLimitMultiplier);

                let baseFee = BigInt((await web3.eth.getBlock('latest')).baseFeePerGas || await web3.eth.getGasPrice());
                let maxPriorityFee = BigInt(2000000000);  // Default 2 gwei; adjust as needed
                let maxFeePerGas = (baseFee * BigInt(Math.floor(innerGasMultiplier * 100)) / BigInt(100)) + 
                              (maxPriorityFee * BigInt(Math.floor(innerPriorityMultiplier * 100)) / BigInt(100));
                maxFeePerGas = maxFeePerGas.toString();
                let maxPriorityFeePerGas = (maxPriorityFee * BigInt(Math.floor(innerPriorityMultiplier * 100)) / BigInt(100)).toString();

                const transferData = tokenisedPayableContract.methods.safeTransferFrom(
                  anchor.address, 
                  contractor.walletaddress, 
                  newSplitId, 
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
                if (!transferReceipt || transferReceipt.status !== true) {
                  throw new Error(`Transfer transaction failed on-chain. Status: ${transferReceipt?.status}`);
                }

                console.log("Funds split successfully. transferReceipt:", transferReceipt);

                console.log(`Transferred payable ID ${newSplitId} (${purAmount} value) to contractor ${contractor.name}. Receipt:`, transferReceipt);
              }, 5, 15000, (err) => err.message.includes('not mined') || err.message.includes('underpriced') || err.message.includes('TIMEOUT'));

              // Re-emit URI events via owner wallet so MetaMask/indexers detect the metadata change
              try {
                const uriGasPrice = Math.ceil(Number(await web3.eth.getGasPrice()) * 1.2).toString();
                const uriGas = 60000;
                const signedUri1 = await web3.eth.accounts.signTransaction(
                  { from: signer.address, to: newTPsmartcontractaddress2, data: tokenisedPayableContract.methods.setTokenURI(parseInt(newSplitId), metadataPath).encodeABI(), gas: uriGas, gasPrice: uriGasPrice },
                  SIGNER_PRIVATE_KEY
                );
                await web3.eth.sendSignedTransaction(signedUri1.rawTransaction);
                const signedUri2 = await web3.eth.accounts.signTransaction(
                  { from: signer.address, to: newTPsmartcontractaddress2, data: tokenisedPayableContract.methods.setTokenURI(parseInt(originalId), originalMetadataPath).encodeABI(), gas: uriGas, gasPrice: uriGasPrice },
                  SIGNER_PRIVATE_KEY
                );
                await web3.eth.sendSignedTransaction(signedUri2.rawTransaction);
                sendLog(`MetaMask refresh: URI events re-emitted for TP #${newSplitId} and TP #${originalId}`);
              } catch (e) {
                console.log(`URI refresh event failed (non-critical): ${e.message}`);
              }
//                    } // loop thru purchases linked to this contractor
          };  //for Purchase

//                  } // loop thru contractors linked to this project
//                } // loop thru milestones
        } catch (err) {
          console.error('Error in splitAndTransferTPtoContractors:', err.message);
          throw err;
        }
      };  // splitAndTransferTPtoContractors
      await splitAndTransferTPtoContractors(unWrapReceipt, tokenisedPayableContract, newId0);

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

  updatestatus = await dAppCreate();

  if (!updatestatus) {
    console.error("Error in dAppCreate, sending error response to client.");
    if (newDtscf) {
      try {
        const pendingStatus = `PENDING_${draft_id}`;
        await Purchase.destroy({ where: { dtscf_project_id: newDtscf, dbstatus: pendingStatus } });
        await Contractor.destroy({ where: { dtscf_project_id: newDtscf, dbstatus: pendingStatus } });
        await Milestone.destroy({ where: { dtscf_project_id: newDtscf, dbstatus: pendingStatus } });
        await Dtscfs.destroy({ where: { id: newDtscf, dbstatus: pendingStatus } });
        await Dtscf_Drafts.update({ approveddtscfid: -1 }, { where: { id: draft_id } });
        console.log(`Rollback complete: deleted prod rows with dbstatus=${pendingStatus}`);
      } catch (rollbackErr) {
        console.error("Rollback failed:", rollbackErr.message);
      }
    }
    sendError("Error during contract deployment. Please try again. Report to tech support if problem is recurring.");
  }
  console.log("approveDraftById Update status (1):", updatestatus);

////////////////////////////// Blockchain ////////////////////////

  console.log('New TP Contract deployed updating DB: ', newTPsmartcontractaddress2);

  if (updatestatus) { // updatestatus
  // update draft table
    console.log("Updating row in TP table with newTPsmartcontractaddress2("+newTPsmartcontractaddress2+").");
    console.log("newDtscf = ", newDtscf);
    await Dtscfs.update(  // update table with new smart contract address
    {
      smartcontractaddress  : newTPsmartcontractaddress2,
      dbstatus              : "OK",
    },
    { where:      { id: newDtscf }},
    )
    .then(num => {
      if (num == 1) {
      } else {
        sendError(`Record updated =${num}. Cannot update TP with smart contract address. `);
        return false;
      }
    })
    .catch(err => {
      console.log(err);
      sendError('Error when signing transaction. Please try again. Report to tech support if problem is recurring.');
      return false;
    });

    const pendingStatus = `PENDING_${draft_id}`;
    await Milestone.update({ dbstatus: "OK" }, { where: { dtscf_project_id: newDtscf, dbstatus: pendingStatus } });
    await Contractor.update({ dbstatus: "OK" }, { where: { dtscf_project_id: newDtscf, dbstatus: pendingStatus } });
    await Purchase.update({ dbstatus: "OK" }, { where: { dtscf_project_id: newDtscf, dbstatus: pendingStatus } });
    console.log(`Updated prod rows to dbstatus=OK for draft_id=${draft_id}`);

    console.log("Updating row in draft table with status=3 and newTPsmartcontractaddress2("+newTPsmartcontractaddress2+").");
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
        const explorerUrl1 = newTPsmartcontractaddress2 ? getExplorerUrl(req.body.blockchain, newTPsmartcontractaddress2) : null;
        if (explorerUrl1) sendLog('EXPLORER:' + explorerUrl1);
        sendSuccess('TP has been created, TP draft with id='+draft_id+' was updated successfully.');
        return true;
      } else {
        sendError(`Record updated =${num}. Cannot update draft with id=${draft_id}. Maybe TP was not found or req.body is empty!`);
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

};  // approveUnwrapDraftById

exports.draftCreate = async (req, res) => {
  let errorSent = false;
  console.log("Received for draft Create:");
  //console.log(req.body); // Your existing log
  console.log(JSON.stringify(req.body, null, 2));

  // Set up streaming response
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.status(200);

  try {
    res.write('LOG: Starting draft creation...\n');

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
    console.log(`LOG: Created draft in database with ID ${draft_id}.\n`);

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
        organisation_id: con.organisation_id || null,
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
      action: "TP create request - drafted",
      name,
      totalBudget: parseInt(totalBudget),
      status: 0
      // Add other fields as needed from your INSERT
    });
    console.log('LOG: Logged to audit trail.\n');

    // Explicit success and close
    res.write('SUCCESS: Draft created successfully.\n');
    res.end();
    console.log('[SERVER] Sent success and ended response.'); // Diagnostic
  } catch (err) {
    console.error('[SERVER] Error in draftCreate:', err);
    if (!errorSent) {
      res.write(`ERROR: Error creating draft: ${err.message}\n`);
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

  console.log("Received for TP Review:");
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
            message: "TP status has been updated successfully."
          });
        } else {
          res.send({
            message: `${req.body}. Record updated =${num}. Cannot update TP with id=${id}. Maybe TP was not found or req.body is empty!`
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

  const mustCompile = false;  // ABI and bytecode are pre-compiled by Hardhat (scripts/deployImplementation.js) and stored in server/app/abis/. No runtime compilation needed.
  let hasSentResponse = false;
  var newTPsmartcontractaddress2 = null;
  let newMilestoneIDArr = [];   // to keep track of draft milestone ID --> prod milestone ID mapping for updates
  let newContractorArr = [];    // to keep track of draft contractor ID --> prod contractor ID mapping for updates
  let newPurchaseArr = [];      // to keep track of draft purchase ID --> prod purchase ID mapping for updates
  let milestoneMap9 = {};       // to keep track of new prod milestone ID mapping

  let newDtscf = null;

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
        console.log("Creating row in TP prod table.");
        const atomicResult = await db.sequelize.transaction(async (ttt) => {
          var approved_id;
          await Dtscfs.create( // create TP in the database !!!!!
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

              dbstatus              : `PENDING_${draft_id}`,
            },
            { transaction: ttt }  // pass transaction object to ensure atomicity)
          )
          .then(data => {
            logDataValues("TP create success: ", data);
            approved_id = data.id;
            newDtscf = data.id;
          })
          .catch(err => {
            console.log("Error while creating TP row: "+err.message);
            throw new Error('Error when signing transaction. Please try again. Report to tech support if problem is recurring.');
          });
          console.log("Approved ID for new Dtscf:", approved_id);
          console.log("newDtscf:", newDtscf);
          console.log("Updating draft table to prod ID:", approved_id);

          await Dtscf_Drafts.update(  // update draft table with TP project id
          { 
            approveddtscfid       : approved_id,
          }, 
          { where:      { id: draft_id }},
          { transaction: ttt }
          )
          .then(num => {
            if (num == 1) {
              console.log("Updated draft table with project id.");
            } else {
              throw new Error(`${req.body}. Record updated =${num}. Cannot update draft with id=${draft_id}.`);
            }
          })
          .catch(err => {
            console.log(err);
            throw new Error('Error when signing transaction. Please try again. Report to tech support if problem is recurring.');
          });

          // copy draft milestones to prod table
          //newMilestoneIDArr = [];
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
              dbstatus              : `PENDING_${draft_id}`,
            },
            { transaction: ttt }  // pass transaction object to ensure atomicity)
            );
            milestoneMap9[dm.id] = newMilestone9.id;  // draft_id --> prod_id
            newMilestoneIDArr.push( 
              {
                id: newMilestone9.id,
                name: dm.name,
                budget: dm.budget,
                startdate: dm.startdate,
                enddate: dm.enddate,
                dtscf_project_id: approved_id,
              }
            ); // store the new prod milestone ID in the array, to be used later in copyContractorsAndPurchases when setting dtscf_milestone_id for purchases
            console.log("Draft milestone ID:"+ dm.id + " mapped to new prod milestone ID:" + newMilestone9.id);
            console.log("<<<<<<<<<<<<<< milestoneMap9[" + dm.id + "] = newMilestone9.id: "+ newMilestone9.id);
          }
          console.log("Finished creating milestones.");
          console.log("milestoneMap9:", milestoneMap9);

          //newMilestoneIDArr = milestoneMap9; // store the milestone mapping for this draft_id, to be used later in copyContractorsAndPurchases when setting dtscf_milestone_id for purchases
          console.log(">>>>>>  newMilestoneIDArr for draft_id "+ draft_id + ": ", newMilestoneIDArr);

          // copy draft contractors and purchases to prod tables
          newContractorArr = [];
          newPurchaseArr = [];
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
                organisation_id: dc.organisation_id || null,
                dtscf_project_id: approved_id,
                dtscf_parent_contractor_id: newParentId,
                dtscf_milestone_id: dc.dtscf_milestone_id || null,
                dbstatus              : `PENDING_${draft_id}`,
              },
              { transaction: ttt }  // pass transaction object to ensure atomicity)
              );
              newContractorArr.push(
                {
                  id: newContractor.id,
                  name: dc.name,
                  budget: dc.budget,
                  walletaddress: dc.walletaddress,
                  organisation_id: dc.organisation_id || null,
                  dtscf_project_id: approved_id,
                  dtscf_parent_contractor_id: newParentId,
                  dtscf_milestone_id: dc.dtscf_milestone_id || null,
                }
              ); // store the new prod contractor ID in the array, to be used later in copyContractorsAndPurchases when setting dtscf_contractor_id for purchases

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

                const newPurchase = await Purchase.create({
                  description: dp.description,
                  amount: dp.amount,
                  dtscf_project_id: approved_id,
                  dtscf_contractor_id: newConId,
                  dtscf_milestone_id: mappedMilestoneId,  // draft_id --> prod_id
                  invoice_blob: dp.invoice_blob,
                  dbstatus              : `PENDING_${draft_id}`,
                },
                { transaction: ttt }  // pass transaction object to ensure atomicity)
                );
                newPurchaseArr.push(
                  {
                    id: newPurchase.id,
                    description: dp.description,
                    amount: dp.amount,
                    dtscf_project_id: approved_id,
                    dtscf_contractor_id: newConId,
                    dtscf_milestone_id: mappedMilestoneId,  // draft_id --> prod_id
                    invoice_blob: dp.invoice_blob,
                  }
                ); // store the new prod purchase ID in the array, to be used later in copyContractorsAndPurchases when setting dtscf_purchase_id for purchases
              } // for purchase
              // Recurse for subcontractors
              await copyContractorsAndPurchases(dc.id, newConId);
              console.log("Finished creating purchase.");
            }  // for contractor
          }
          await copyContractorsAndPurchases();
          console.log("Finished creating milestones, contractor and purchase. Committing transaction...");

          /////////////////// test  

          console.log("req.body:", JSON.stringify(req.body, null, 2) );
          console.log("milestoneMap9 for draft_id "+ draft_id + ": ", milestoneMap9);
          console.log("newMilestoneIDArr for draft_id "+ draft_id + ": ", newMilestoneIDArr);
          console.log("newContractorArr for draft_id "+ draft_id + ": ", newContractorArr); 
          console.log("newPurchaseArr for draft_id "+ draft_id + ": ", newPurchaseArr);
//          throw new Error("Testing transaction rollback!"); // TESTING, to be removed
//          return false;
          /////////////////// test end
          return true;
        }); // const atomicResult = await db.sequelize.transaction()
      
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
          logDataValues("TP update success: ", data);
          sendSuccess("TP updated successfully. "+data.message);
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
  




//  sendError("Error in adding to database : bye bye");
//  return false;

////////////////////////////// Blockchain ////////////////////////

  // https://www.geeksforgeeks.org/how-to-deploy-contract-from-nodejs-using-web3/

/*
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

  //const INFURA_API_KEY = process.env.REACT_APP_INFURA_API_KEY;
  const ALCHEMY_API_KEY = process.env.REACT_APP_ALCHEMY_API_KEY;

//  const providerUrl = `https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`;
  const providerUrl = `https://${ETHEREUM_NETWORK}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;   

  console.log(`Using HTTP provider: ${providerUrl.replace(ALCHEMY_API_KEY, '****')}`);

  Web3 = require("web3");
  // Create Web3 with HTTP provider (most stable for deployment)
  const web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));
*/
  const web3 = await setupWeb3(req.body.blockchain);

  const SIGNER_PRIVATE_KEY = process.env.REACT_APP_SIGNER_PRIVATE_KEY;
  const CONTRACT_OWNER_WALLET = process.env.REACT_APP_CONTRACT_OWNER_WALLET;
  const ANCHOR_PRIVATE_KEY = process.env.REACT_APP_ANCHOR_PRIVATE_KEY;
  const ANCHOR_WALLET = process.env.REACT_APP_ANCHOR_WALLET;

  console.log("!!! Platform:", SIGNER_PRIVATE_KEY.substring(0,4)+"..." + SIGNER_PRIVATE_KEY.slice(-3));

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

            const clientAbiFile = path.join(__dirname, '../../../client/src/abis/ERC1155Tokenised_Payable.abi.json');
            const clientBytecodeFile = path.join(__dirname, '../../../client/src/abis/ERC1155Tokenised_Payable.bytecode.json');

            fs.writeFileSync(abiFile, JSON.stringify(ABI), 'utf8');
            console.log("TP ABI JSON file has been saved (server).");
            fs.writeFileSync(byteCodeFile, JSON.stringify(bytecode), 'utf8');
            console.log("TP Bytecode JSON file has been saved (server).");

            try {
              fs.writeFileSync(clientAbiFile, JSON.stringify(ABI), 'utf8');
              console.log("TP ABI JSON file has been synced to client.");
              fs.writeFileSync(clientBytecodeFile, JSON.stringify(bytecode), 'utf8');
              console.log("TP Bytecode JSON file has been synced to client.");
            } catch (clientErr) {
              console.warn("Could not sync ABI to client (non-fatal):", clientErr.message);
            }

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
            for (const m1 of milestones) {
              const requiredMilestoneFields = ['id', 'name', 'budget', 'startdate', 'enddate', 'dtscf_project_id'];
              for (const field of requiredMilestoneFields) {
                const val = m1[field];
                if (val == null || (typeof val === 'string' && val.trim() === '')) {
                  sendError(`Missing or empty required field '${field}' in milestone '${m1.name || 'unnamed'}'`);
                  return false;
                }
              }
              // Add stricter checks, e.g., if (isNaN(m1.budget) || m1.budget <= 0) throw new Error(...);
            }

            // Validation for contractors mandatory fields (extends existing wallet check)
            console.log("Contractors: ", req.body.contractors);
            let contractors = req.body.contractors || [];
            if (typeof contractors === 'string') {
              contractors = JSON.parse(contractors);
            }
            for (const c1 of contractors) {
              const requiredContractorFields = ['id', 'name', 'budget', 'walletaddress', 'dtscf_project_id'];
              for (const field of requiredContractorFields) {
                const val = c1[field];
                if (val == null || (typeof val === 'string' && val.trim() === '')) {
                  sendError(`Missing or empty required field '${field}' in contractor '${c1.name || 'unnamed'}'`);
                  return false;
                }
              }
              // Validate walletaddress is a valid Ethereum address
              if (!web3.utils.isAddress(c1.walletaddress)) {
                sendError(`Invalid Ethereum wallet address for contractor '${c1.name || 'unnamed'}': ${c1.walletaddress}`);
                return false;
              }
              // Add stricter checks, e.g., if (isNaN(c1.budget) || c1.budget <= 0) throw new Error(...);
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


            // Step 2: Prepare for proxy deployment, estimate gas fees
            // Each project deploys a lightweight ERC1967Proxy pointing to the shared
            // TokenizedPayable implementation (TP_IMPLEMENTATION_ADDRESS_<chainId> in .env).
            // This saves ~70% gas vs deploying the full implementation each time, and
            // allows future bug fixes to be applied to all proxies without migrating state.
            console.log("=== Step 2: Prepare for proxy deployment, estimate gas fees ===")

            const chainId = parseInt(req.body.blockchain);
            const implAddress = process.env[`TP_IMPLEMENTATION_ADDRESS_${chainId}`] || process.env.TP_IMPLEMENTATION_ADDRESS;
            if (!implAddress || !web3.utils.isAddress(implAddress)) {
              sendError(`TP_IMPLEMENTATION_ADDRESS_${chainId} is not set in .env. Run scripts/deployImplementation.js first.`);
              return false;
            }

            console.log('Deploying proxy → implementation:', implAddress);
            console.log('Attempting to deploy from account:', signer.address);

            const proxyABI = JSON.parse(fs.readFileSync(proxyAbiFile, 'utf8').toString());
            const proxyBytecode = JSON.parse(fs.readFileSync(proxyByteCodeFile, 'utf8').toString());
            const initData = (new web3.eth.Contract(ABI)).methods
              .initialize('https://tokenising.herokuapp.com/', req.body.underlyingDSGDsmartcontractaddress)
              .encodeABI();
            const proxyContract = new web3.eth.Contract(proxyABI);
            const payableDeployTx = proxyContract.deploy({
              data: proxyBytecode,
              arguments: [implAddress, initData],
            });

            let gasEstimate = await payableDeployTx.estimateGas({ from: signer.address }).catch((error) => {
              console.error("Error while estimating Gas fee: ", error);
              return 4000000;  // default if cannot estimate
            });

            console.log("Initial estimated gas fee: ", gasEstimate);

            const balance = await web3.eth.getBalance(signer.address);
            console.log("Platform balance:", web3.utils.fromWei(balance, "ether"), "ETH");
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
                  let baseFee = BigInt((await web3.eth.getBlock('latest')).baseFeePerGas || await web3.eth.getGasPrice());
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
                  return receipt.contractAddress;  // Success
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
            
            sendLog(`Deployment successful, address: ${newTPsmartcontractaddress2}`);

            return true;  // Deployment successful
          } // deployContract = async ()
          
          if (! await deployContract()) {
            console.error("TP Smart Contract Deployment failed....");
            sendError("Tokenised Payable smart contract deployment failed. Please contact tech support.");
            return false;  // Deployment failed, exit
          }
          
          const tokenizedBankDeposit_ABI = JSON.parse(fs.readFileSync(tokenizedBank_abiFile, 'utf8').toString());
          const depositContract = new web3.eth.Contract(tokenizedBankDeposit_ABI, req.body.underlyingDSGDsmartcontractaddress);
          const tokenisedPayableContract = new web3.eth.Contract(ABI, newTPsmartcontractaddress2);
          const requiredAmount = web3.utils.toWei(req.body.totalBudget.toString(), 'ether');          // total budget in wei

          // Step 4: Anchor to approve Tokenised Payable contract (sign and send signed tx)
          console.log("=== Step 4: Anchor to approve Tokenised Payable contract (sign and send signed tx) ===");
          //res.write("Step 4: Anchor to approve Tokenised Payable contract (sign and send signed tx) ");

          const approveTPContract = async () => {
                console.log("Calling approve()...");
                if (!newTPsmartcontractaddress2) {
                  sendError('Contract address not set after deployment');
                  return false;
                }

                // Do balance check
                const anchorBalance = await depositContract.methods.balanceOf(anchor.address).call();
                if (web3.utils.toBN(anchorBalance).lt(web3.utils.toBN(requiredAmount))) {
                  sendError(`Insufficient Tokenised Deposit balance in anchor wallet: ${web3.utils.fromWei(anchorBalance, 'ether')} < ${req.body.totalBudget}`);
                  return false;
                }
                console.log(`Anchor Tokenised Deposit balance sufficient: ${web3.utils.fromWei(anchorBalance, 'ether')}`);

                // const gasPrice = await web3.eth.getGasPrice();  
                // Get gas prices (EIP-1559 support)
                const block = await web3.eth.getBlock('pending');
                
                const approveReceipt = await retryWithBackoff(async (innerGasMultiplier, innerPriorityMultiplier, innerGasLimitMultiplier) => {
                  console.log("Approving Tokenised Payable contract to pull funds..."); 
                  
                  let estGas = await depositContract.methods.approve(newTPsmartcontractaddress2, requiredAmount).estimateGas({ from: anchor.address });
                  estGas = Math.floor(estGas * innerGasLimitMultiplier);
                  let baseFee = BigInt((await web3.eth.getBlock('latest')).baseFeePerGas || await web3.eth.getGasPrice());
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
                    throw new Error('Approve transaction not mined within timeout');
                  }

                  if (!approveReceipt.status) {
                    throw new Error('Approve transaction reverted on chain');
                  }

                  console.log("Approved Tokenised Payable contract to pull funds. approveReceipt:", approveReceipt);

                  return approveReceipt;
                }, 5, 15000, (err) => err.message.includes('not mined') || err.message.includes('underpriced') || err.message.includes('TIMEOUT'));
                return approveReceipt;
          }  // approveTPContract;
          let approveReceipt;
          try {
              approveReceipt = await approveTPContract();
              console.log("Approve transaction successful. Receipt:", approveReceipt);
          } catch (error) {
              console.error("ApproveTPContract failed:", error.message);
              sendError("Failed to approve Tokenised Payable contract to pull funds. " + error.message);
              throw error;                    // Re-throw to stop execution
          }

          const wrapDepositToPayableForAnchor = async () => {
                  // Step 5: Wrap (sign and send signed tx), new TP is created by Anchor
                  console.log("=== Step 5: Wrap (sign and send signed tx), new TP is created by Anchor ===");
                  sendLog("Wrapping Tokenised Deposits into Tokenised Payable(TP) tokens");
                  console.log('Calling wrapDepositToPayable to fund the contract from anchor account');

                  // Call generate BEFORE wrapDepositToPayable() because we need the metadata URI ready for the wrapDepositToPayable() call
                  // This is to create the TP for the Anchor to wrap the TBD into, and to get the metadata URI ready for the wrapDepositToPayable call
                  let metadataPath;
                  try {
                    metadataPath = await generateMetadataFile(
                      newTPsmartcontractaddress2,                               // Contract address
                      1,                                                        // Token ID (assuming 1 for the first milestone; adjust logic if multiple milestones/tokens)
                      req.body.totalBudget.toString(),                          // Total budget as string
                      req.body.name,                                            // Project name
                      "",                                                       // Milestone name is empty because this is Anchor's project TP
                      0,                                                        // Milestone ID as this is for whole project not for any milestone
                      req.body.enddate,                                         // Maturity date
                      `Completion of project '${req.body.name}'`,               // Conditions (encrypted into Lit metadata)
                      null,                                                     // originalValue
                      '',                                                       // purchaseDescription
                      undefined,                                                // tempDir (default)
                      req.body.blockchain                                       // chainId — enables Lit encryption
                    );
                    console.log(`Metadata generated: ${metadataPath}`);
                  } catch (err) {
                      console.error("Metadata generation failed:", err.message);
                      sendError("Failed to generate metadata for wrapped TP.");
                      throw err;   // Stop execution
                  }

                  const endDateUnix = Math.floor(new Date(req.body.enddate).getTime() / 1000);
                  const requiredAmount = web3.utils.toWei(req.body.totalBudget.toString(), 'ether');
                  const anchorSalt = generateEscrowSalt();
                  const anchorCommitment = computeEscrowCommitment(requiredAmount, anchorSalt);
                  try {
                      const wrapReceipt = await retryWithBackoff(async (innerGasMultiplier, innerPriorityMultiplier, innerGasLimitMultiplier) => {
                          const block = await web3.eth.getBlock('pending');
                          let wrapGas;
                          try {
                              wrapGas = await tokenisedPayableContract.methods.wrapDepositToPayable(
                                  requiredAmount,
                                  anchorCommitment,
                                  endDateUnix,
                                  0,                          // milestone id
                                  metadataPath
                              ).estimateGas({ from: anchor.address });
                          } catch (estErr) {
                              console.error("Gas estimation failed for wrapDepositToPayable:", estErr.message);
                              sendError("Transaction would fail on blockchain (likely insufficient allowance or balance).");
                              throw estErr;
                          }
                          wrapGas = Math.floor(wrapGas * innerGasLimitMultiplier);
                                          
                          const baseFee = BigInt((await web3.eth.getBlock('latest')).baseFeePerGas || await web3.eth.getGasPrice());
                          const maxPriorityFee = BigInt(2000000000);  // Default 2 gwei; adjust as needed
                          const maxFeePerGas = ((baseFee * BigInt(Math.floor(innerGasMultiplier * 100)) / BigInt(100)) + 
                                            (maxPriorityFee * BigInt(Math.floor(innerPriorityMultiplier * 100)) / BigInt(100))).toString();
                          const maxPriorityFeePerGas = (maxPriorityFee * BigInt(Math.floor(innerPriorityMultiplier * 100)) / BigInt(100)).toString();

                          console.log('Current maxFeePerGas:', maxFeePerGas);
                          console.log('Current maxPriorityFeePerGas:', maxPriorityFeePerGas);

                          const wrapData = tokenisedPayableContract.methods.wrapDepositToPayable(
                              requiredAmount,
                              anchorCommitment,
                              endDateUnix,
                              0,                          // milestone id
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

                          if (!receipt) throw new Error('Wrap transaction not mined within timeout');
                          if (!receipt.status) throw new Error('Wrap transaction reverted on-chain');

                          console.log("Funds wrapped successfully. wrapReceipt:", receipt);
                          return receipt;
                      }, 5, 15000, (err) => err.message.includes('not mined') || err.message.includes('underpriced') || err.message.includes('TIMEOUT'));

                      // ====================== CRITICAL: POST-WRAP BALANCE CHECK WITH RETRY ======================
                      console.log("Verifying balance after wrap...");
                      const newId = 1;
                      let balance = '0';
                      let balanceAttempts = 0;
                      const MAX_BALANCE_ATTEMPTS = 12;   // up to ~2 minutes

                      while (BigInt(balance) === BigInt(0) && balanceAttempts < MAX_BALANCE_ATTEMPTS) {
                          balance = await tokenisedPayableContract.methods.balanceOf(anchor.address, newId).call();
                          console.log(`Balance check #${balanceAttempts + 1}: ${web3.utils.fromWei(balance, 'ether')} TP`);

                          if (BigInt(balance) > BigInt(0)) break;

                          balanceAttempts++;
                          if (balanceAttempts < MAX_BALANCE_ATTEMPTS) {
                              await new Promise(r => setTimeout(r, 10000)); // 10s delay
                          }
                      }
                      if (BigInt(balance) === BigInt(0)) {
                          throw new Error(`Wrap appeared successful but balance is still 0 for token ${newId} after ${MAX_BALANCE_ATTEMPTS} checks`);
                      }
                      console.log(`Balance verified successfully: ${web3.utils.fromWei(balance, 'ether')} TP`);

                      // Persist anchor salt so it can be retrieved for future splits/unwrap
                      try {
                        await Dtscfs.update({ anchor_token_salt: anchorSalt }, { where: { smartcontractaddress: newTPsmartcontractaddress2 } });
                      } catch (dbErr) {
                        console.warn('Failed to persist anchor_token_salt:', dbErr.message);
                      }

                      return { wrapReceipt, newId };
                  } catch (error) {
                      console.error("wrapDepositToPayableForAnchor failed:", error.message);
                      sendError(`Failed to wrap deposit: ${error.message}`);
                      throw error;   // Stop the entire deployment
                  }
          }; // wrapDepositToPayableForAnchor
          const { wrapReceipt, newId } = await wrapDepositToPayableForAnchor();

          // Fallback if undefined
          let newId0 = newId || 1; // Default to 1 if not set

          console.log("after await wrapDepositToPayableForAnchor()...");
          console.log("wrapReceipt:", wrapReceipt);
          //console.log("tokenisedPayableContract:", tokenisedPayableContract);
          console.log("newId0:", newId0);

          // Step 6: Transfer TP to contractors as per milestones
          console.log("=== Step 6: transfer TP to contractors as per milestones ===");
          //log("Transferring Tokenised Payable tokens to contractors as per milestones ");
          const splitAndTransferTPtoContractors = async (wrapReceipt, tokenisedPayableContract, newId0) => {
            console.log("Transferring Tokenised Payable tokens to contractors as per milestones");

            try {
              if (!newId0) {
                console.warn('newId0 is undefined - skipping transfer.');
                throw new Error('Token ID for the wrapped payable is missing. Cannot proceed with splitting and transferring to contractors.');
              }
              // Await the wrapReceipt if it's a promise. Ensure we have the resolved receipt
              const resolvedReceipt = await wrapReceipt;
              console.log('Resolved wrapReceipt:', resolvedReceipt);   

              // Verify Anchor still holds the original token
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

              // Get current list of token IDs from the contract (robust alternative to event parsing)
              let allIds = [];
              try {
                allIds = await tokenisedPayableContract.methods.getAllTokenIds().call();
              } catch (err) {
                console.warn('getAllTokenIds failed:', err.message);
                allIds = [newId0];  // Fallback to known ID
              }                     // Assume the last (most recent) ID is the original wrapped one, as contract is new
              let originalId = allIds[allIds.length - 1];
              console.log(`Original payable ID: ${originalId}`);

              //
              //
              //
              // splitPayable() requires originalId, amount to split, and metadata URI for the split portion. 
              // We loop through purchases, calculate their amounts based on linked purchases, 
              // then call splitPayable for each contractor to create new payable tokens in their wallets. 
              // The metadata URI can include details like milestone completion, contractor name, etc.
              //
              //
              //
//              let contractors = req.body.contractors || [];
//              if (typeof contractors === 'string') { contractors = JSON.parse(contractors); }


              let NFTindex = parseInt(originalId);  // originalId is the ID of the wrapped TP that Anchor holds, we will split from this ID to create new IDs for contractors. We can use a simple incrementing index for the new IDs, starting from originalId + 1.

              // Track remaining amount in-memory (escrow amounts are hidden in on-chain commitments)
              let initialSourceSGD2 = parseFloat(req.body.totalBudget.toString());
              let remainingSourceWei2 = web3.utils.toWei(req.body.totalBudget.toString(), 'ether');
              // Load the anchor token's current salt from DB so we can update its commitment after each split
              let currentAnchorSalt = generateEscrowSalt(); // fallback if not found
              try {
                const dtscfRow = await Dtscfs.findOne({ where: { smartcontractaddress: newTPsmartcontractaddress2 }, attributes: ['anchor_token_salt'] });
                if (dtscfRow?.anchor_token_salt) currentAnchorSalt = dtscfRow.anchor_token_salt;
              } catch (e) {
                sendLog(`Could not retrieve anchor_token_salt from DB: ${e.message}`);
              }

              // ====================== MAIN LOOP ======================
              // Loop thru purchases then find the contractor and milestone linked to this
              //newPurchaseArr.forEach(async purchase => {
              for (const purchase of newPurchaseArr) {  // do not use forEach as there will be race conditions
                  // 1. Find the contractor matching the purchase's contractor ID
                  const contractor = newContractorArr.find(c => c.id === purchase.dtscf_contractor_id);
                  
                  // 2. Find the milestone matching the purchase's milestone ID
                  const milestone = newMilestoneIDArr.find(m => m.id === purchase.dtscf_milestone_id);

                  if (!contractor?.walletaddress || !milestone) {
                    throw new Error(`Missing contractor or milestone data for purchase ${purchase.description}`);
                  }
                  // 3. Display the information
                  console.log("\n===================");
                  console.log(`Purchase: ${purchase.description}`);
                  console.log(`- Contractor Name: ${contractor ? contractor.name : 'N/A'}`);
                  console.log(`- Contractor Wallet: ${contractor ? contractor.walletaddress : 'Unknown'}`);
                  console.log(`- Milestone Name: ${milestone ? milestone.name : 'Unknown'}`);
                  console.log('---');
                  
                  const purAmount = parseFloat(purchase.amount) || 0;   //zzz <--- cannot total, must create 1 TP for every purchase
                  if (purAmount <= 0) {
                      console.log(`Skipping zero-amount purchase for ${contractor.name}`);
                      continue;
                  }

                  const amountWei = web3.utils.toWei(purAmount.toString(), 'ether');

                  console.log(`Processing purchase: ${purchase.description} ---> ${contractor.name} (SGD${purAmount})`);

                  if (!web3.utils.toBN(amountWei).gt(0)) {
                    console.log(`Skipping purchase with non-positive amount for contractor ${contractor.name}`);
                    return; // acts as continue and skip to next iteration
                  }
                  if (!contractor?.walletaddress) { 
                    sendError(`Contractor wallet address not found for ${contractor.name}`);
                    return false;
                  }

                  // Step 7: split TP
                  console.log("=== Step 7: split TP ===");
                  console.log(`Creating TP for purchase '${purchase.description}' for contractor '${contractor.name}' with SGD${purAmount}`);

                  NFTindex++;
                  // Call generate BEFORE splitPayable (metadata encrypted with Lit, keyed to NFTindex token ID)
                  let metadataPath;
                  try {
                    metadataPath = await generateMetadataFile(
                      newTPsmartcontractaddress2,
                      NFTindex,
                      purAmount.toString(),
                      req.body.name,
                      milestone.name,
                      milestone.id,
                      milestone.enddate,
                      `Completion of milestone '${milestone.name}'`,
                      null,
                      purchase.description,
                      undefined,
                      req.body.blockchain  // enables Lit encryption
                    );
                  } catch (err) {
                    throw new Error(`Metadata generation failed for contractor ${contractor.name}: ${err.message}`);
                  }

                  // Track remaining amount in-memory (no on-chain read needed)
                  const currentOriginalSGD2 = parseFloat(web3.utils.fromWei(remainingSourceWei2, 'ether'));
                  const remainingOriginalSGD2 = currentOriginalSGD2 - purAmount;
                  const remainingAmountWei2 = web3.utils.toWei(Math.max(0, remainingOriginalSGD2).toString(), 'ether');
                  sendLog(`Splitting TP #${originalId} (SGD${currentOriginalSGD2}) → new TP #${NFTindex} (SGD${purAmount}) for '${purchase.description}' to '${contractor.name}'. Source TP #${originalId} will be SGD${remainingOriginalSGD2} after split.`);

                  let originalMetadataPath2 = '';
                  try {
                    originalMetadataPath2 = await generateMetadataFile(
                      newTPsmartcontractaddress2,
                      parseInt(originalId),
                      remainingOriginalSGD2.toString(),
                      req.body.name, '', 0, req.body.enddate, 'Completion of project',
                      initialSourceSGD2,
                      '',
                      undefined,
                      req.body.blockchain  // enables Lit encryption
                    );
                  } catch (err) {
                    console.warn(`Updated source URI generation failed for TP #${originalId}: ${err.message}`);
                  }

                  // Compute commitments for the new split token and the updated original
                  const splitSalt = generateEscrowSalt();
                  const newOriginalSalt = generateEscrowSalt();
                  const splitCommitment = computeEscrowCommitment(amountWei, splitSalt);
                  const updatedOriginalCommitment = computeEscrowCommitment(remainingAmountWei2, newOriginalSalt);

                  const maturityDate0 = Math.floor(new Date(milestone.enddate).getTime() / 1000);

                  const splitReceipt = await retryWithBackoff(async (innerGasMultiplier, innerPriorityMultiplier, innerGasLimitMultiplier) => {
                      const block = await web3.eth.getBlock('pending');

                      let splitGas;
                      try {
                          splitGas = await tokenisedPayableContract.methods.splitPayable(
                            originalId, milestone.id, splitCommitment, updatedOriginalCommitment,
                            maturityDate0, metadataPath, originalMetadataPath2
                          ).estimateGas({ from: anchor.address });
                      } catch (estErr) {
                          console.error("Gas estimation failed for splitPayable:", estErr.message);
                          sendError("Split transaction would revert on blockchain.");
                          throw estErr;
                      }
                      splitGas = Math.floor(splitGas * innerGasLimitMultiplier);

                      const splitData = tokenisedPayableContract.methods.splitPayable(
                        originalId,
                        milestone.id,
                        splitCommitment,
                        updatedOriginalCommitment,
                        maturityDate0,
                        metadataPath,
                        originalMetadataPath2
                      ).encodeABI();

                      const splitTx = {
                          from: anchor.address,
                          to: newTPsmartcontractaddress2,
                          data: splitData,
                          gas: splitGas,
                          maxPriorityFeePerGas: (BigInt(2000000000) * BigInt(Math.floor(innerPriorityMultiplier * 100)) / BigInt(100)).toString(),
                          maxFeePerGas: ((BigInt((await web3.eth.getBlock('latest')).baseFeePerGas || await web3.eth.getGasPrice()) * BigInt(Math.floor(innerGasMultiplier * 100)) / BigInt(100)) + 
                                        (BigInt(2000000000) * BigInt(Math.floor(innerPriorityMultiplier * 100)) / BigInt(100))).toString()
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
                      if (!splitReceipt || splitReceipt.status !== true) {
                        throw new Error(`Split transaction failed on-chain. Status: ${splitReceipt?.status}`);
                      }

                      console.log("Funds split successfully. splitReceipt:", splitReceipt);

                      return splitReceipt;
                  }, 5, 15000, (err) => err.message.includes('not mined') || err.message.includes('underpriced') || err.message.includes('TIMEOUT'));

                  
                  // Extract newSplitId from PayableSplit event in splitReceipt
                  let newSplitId;
                  for (const log of splitReceipt.logs) {
                    if (log.topics[0] === web3.utils.keccak256('PayableSplit(uint256,uint256,bytes32,uint256,uint256)')) {
                      try {
                        const decoded = web3.eth.abi.decodeLog([
                          { type: 'uint256', name: 'originalId', indexed: true },
                          { type: 'uint256', name: 'newSplitId' },
                          { type: 'bytes32', name: 'newCommitment' },
                          { type: 'uint256', name: 'newMilestoneId' },
                          { type: 'uint256', name: 'newMaturityDate' }
                        ], log.data, log.topics);
                        newSplitId = decoded.newSplitId;
                        break;
                      } catch(e) {
                        // do nothing
                      }
                    }
                  }
                  // Fallback
                  if (!newSplitId) {
                      const allIds = await tokenisedPayableContract.methods.getAllTokenIds().call();
                      newSplitId = allIds[allIds.length - 1];
                  }
                  if (!newSplitId) {
                    sendError('Failed to extract new payable ID from split receipt');
                    return false;
                  }

                  // Verify the new token was actually minted on-chain (guards against RPC false-positive receipts)
                  const splitBalance = await tokenisedPayableContract.methods.balanceOf(anchor.address, newSplitId).call();
                  if (String(splitBalance) !== '1') {
                    throw new Error(`Split verification failed: token #${newSplitId} not in anchor wallet (balance=${splitBalance}). On-chain revert likely.`);
                  }

                  // Persist salts: split token's salt in Purchase row, updated anchor salt in Dtscfs row
                  try {
                    await Purchase.update({ token_id: parseInt(newSplitId), escrow_salt: splitSalt }, { where: { id: purchase.id } });
                    await Dtscfs.update({ anchor_token_salt: newOriginalSalt }, { where: { smartcontractaddress: newTPsmartcontractaddress2 } });
                    currentAnchorSalt = newOriginalSalt;
                    remainingSourceWei2 = remainingAmountWei2;
                  } catch (dbErr) {
                    console.warn('Failed to persist escrow salts after split:', dbErr.message);
                  }

                  sendLog(`TP #${newSplitId} (SGD${purAmount}) created for '${contractor.name}'. Source TP #${originalId} updated to SGD${remainingOriginalSGD2}.`);

                  // Step 8: Transfer the split TP to contractor
                  console.log("=== Step 8: Transfer the split TP to contractor ===");
                  sendLog(`Transferring TP from Anchor to contractor '${contractor.name}' `);
                  await retryWithBackoff(async (innerGasMultiplier, innerPriorityMultiplier, innerGasLimitMultiplier) => {
                    let transferGas = await tokenisedPayableContract.methods.safeTransferFrom(anchor.address, contractor.walletaddress, newSplitId, 1, '0x').estimateGas({ from: anchor.address, to: newTPsmartcontractaddress2 });
                    transferGas = Math.floor(transferGas * innerGasLimitMultiplier);

                    let baseFee = BigInt((await web3.eth.getBlock('latest')).baseFeePerGas || await web3.eth.getGasPrice());
                    let maxPriorityFee = BigInt(2000000000);  // Default 2 gwei; adjust as needed
                    let maxFeePerGas = (baseFee * BigInt(Math.floor(innerGasMultiplier * 100)) / BigInt(100)) + 
                                  (maxPriorityFee * BigInt(Math.floor(innerPriorityMultiplier * 100)) / BigInt(100));
                    maxFeePerGas = maxFeePerGas.toString();
                    let maxPriorityFeePerGas = (maxPriorityFee * BigInt(Math.floor(innerPriorityMultiplier * 100)) / BigInt(100)).toString();

                    const transferData = tokenisedPayableContract.methods.safeTransferFrom(
                      anchor.address, 
                      contractor.walletaddress, 
                      newSplitId, 
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
                    if (!transferReceipt || transferReceipt.status !== true) {
                      throw new Error(`Transfer transaction failed on-chain. Status: ${transferReceipt?.status}`);
                    }

                    console.log("Funds split successfully. transferReceipt:", transferReceipt);

                    console.log(`Transferred payable ID ${newSplitId} (${purAmount} value) to contractor ${contractor.name}. Receipt:`, transferReceipt);
                  }, 5, 15000, (err) => err.message.includes('not mined') || err.message.includes('underpriced') || err.message.includes('TIMEOUT'));

                  // Re-emit URI events via owner wallet so MetaMask/indexers detect the metadata change
                  try {
                    const uriGasPrice = Math.ceil(Number(await web3.eth.getGasPrice()) * 1.2).toString();
                    const uriGas = 60000;
                    const signedUri1 = await web3.eth.accounts.signTransaction(
                      { from: signer.address, to: newTPsmartcontractaddress2, data: tokenisedPayableContract.methods.setTokenURI(parseInt(newSplitId), metadataPath).encodeABI(), gas: uriGas, gasPrice: uriGasPrice },
                      SIGNER_PRIVATE_KEY
                    );
                    await web3.eth.sendSignedTransaction(signedUri1.rawTransaction);
                    const signedUri2 = await web3.eth.accounts.signTransaction(
                      { from: signer.address, to: newTPsmartcontractaddress2, data: tokenisedPayableContract.methods.setTokenURI(parseInt(originalId), originalMetadataPath2).encodeABI(), gas: uriGas, gasPrice: uriGasPrice },
                      SIGNER_PRIVATE_KEY
                    );
                    await web3.eth.sendSignedTransaction(signedUri2.rawTransaction);
                    sendLog(`MetaMask refresh: URI events re-emitted for TP #${newSplitId} and TP #${originalId}`);
                  } catch (e) {
                    console.log(`URI refresh event failed (non-critical): ${e.message}`);
                  }
              };  //for Purchase

              console.log("All splits and transfers completed successfully");
              return true;

            } catch (err) {
              console.error('Error in splitAndTransferTPtoContractors:', err.message);
              sendError(`Split & transfer failed: ${err.message}`);
              throw err;
            }
          };  // splitAndTransferTPtoContractors
          const splitResult = await splitAndTransferTPtoContractors(wrapReceipt, tokenisedPayableContract, newId0);
          if (!splitResult) {
              sendError("Split and transfer to contractors failed");
              return false;
          }

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

        console.log("!!! Platform:", SIGNER_PRIVATE_KEY.substring(0,4)+"..." + SIGNER_PRIVATE_KEY.slice(-3));
        // Creating a signing account from a private key
        const signer = web3.eth.accounts.privateKeyToAccount(SIGNER_PRIVATE_KEY)
        // console.log("signer:", signer);  // contains private key
    
        // Update contract
        const UpdateContract = async () => {
          try {
            console.log('Creating TP contract with ABI');
            const tokenisedPayableContract = new web3.eth.Contract(ABI);
                
            let setToTalSupply = (isNaN(+req.body.totalsupply)? req.body.totalsupply: req.body.totalsupply.toString())   
            + createStringWithZeros(adjustdecimals);  // pad zeros behind
            console.log("TP setToTalSupply = ", setToTalSupply);
    
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
                        sendError("Timeout after "+TIMEOUT.toString()+" seconds, please check the TP tab after 5 minutes and try again if the TP isnt created.");
                        //if (!errorSent) {
                        //  console.log("Sending error 400 back to client");
                        //  res.status(400).send({ 
                        //    message: "Timeout after "+TIMEOUT.toString()+" seconds, please check the TP tab after 5 minutes and try again if the TP isnt created.",
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
    
            console.log('**** TP Txn executed:', createReceipt);
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
      if (newDtscf) {
        try {
          const pendingStatus = `PENDING_${draft_id}`;
          await Purchase.destroy({ where: { dtscf_project_id: newDtscf, dbstatus: pendingStatus } });
          await Contractor.destroy({ where: { dtscf_project_id: newDtscf, dbstatus: pendingStatus } });
          await Milestone.destroy({ where: { dtscf_project_id: newDtscf, dbstatus: pendingStatus } });
          await Dtscfs.destroy({ where: { id: newDtscf, dbstatus: pendingStatus } });
          await Dtscf_Drafts.update({ approveddtscfid: -1 }, { where: { id: draft_id } });
          console.log(`Rollback complete: deleted prod rows with dbstatus=${pendingStatus}`);
        } catch (rollbackErr) {
          console.error("Rollback failed:", rollbackErr.message);
        }
      }
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

  console.log('New TP Contract deployed updating DB: ', newTPsmartcontractaddress2);

  if (updatestatus) { // updatestatus
  // update draft table
    console.log("Updating row in TP table with newTPsmartcontractaddress2("+newTPsmartcontractaddress2+").");
    console.log("newDtscf = ", newDtscf);
    await Dtscfs.update(  // update table with new smart contract address
    {
      smartcontractaddress  : newTPsmartcontractaddress2,
      dbstatus              : "OK",
    },
    { where:      { id: newDtscf }},
    )
    .then(num => {
      if (num == 1) {
      } else {
        sendError(`Record updated =${num}. Cannot update TP with smart contract address. `);
        return false;
      }
    })
    .catch(err => {
      console.log(err);
      sendError('Error when signing transaction. Please try again. Report to tech support if problem is recurring.');
      return false;
    });

    if (isNewDtscf) {
      const pendingStatus = `PENDING_${draft_id}`;
      await Milestone.update({ dbstatus: "OK" }, { where: { dtscf_project_id: newDtscf, dbstatus: pendingStatus } });
      await Contractor.update({ dbstatus: "OK" }, { where: { dtscf_project_id: newDtscf, dbstatus: pendingStatus } });
      await Purchase.update({ dbstatus: "OK" }, { where: { dtscf_project_id: newDtscf, dbstatus: pendingStatus } });
      console.log(`Updated prod rows to dbstatus=OK for draft_id=${draft_id}`);
    }

    console.log("Updating row in draft table with status=3 and newTPsmartcontractaddress2("+newTPsmartcontractaddress2+").");
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
        const explorerUrl2 = newTPsmartcontractaddress2 ? getExplorerUrl(req.body.blockchain, newTPsmartcontractaddress2) : null;
        if (explorerUrl2) sendLog('EXPLORER:' + explorerUrl2);
        sendSuccess('TP has been created successfully, draft id #'+draft_id+' is updated.');
        return true;
      } else {
        sendError(`Record updated =${num}. Cannot update draft with id=${draft_id}. Maybe TP was not found or req.body is empty!`);
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
        message: "Error fetching TP details."
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

  //const INFURA_API_KEY = process.env.REACT_APP_INFURA_API_KEY;
  const ALCHEMY_API_KEY = process.env.REACT_APP_ALCHEMY_API_KEY;
  const SIGNER_PRIVATE_KEY = process.env.REACT_APP_SIGNER_PRIVATE_KEY;
  const CONTRACT_OWNER_WALLET = process.env.REACT_APP_CONTRACT_OWNER_WALLET;

  async function triggerCoupon() {
    updatestatus = false;
    let ABI;

    // Load ABI
    const fs = require("fs");
    try {
      console.log("Reading TP ABI JSON file.");
      ABI = JSON.parse(fs.readFileSync(abiFile).toString());
    } catch (err) {
      console.error("Err reading ABI:", err);
      if (!errorSent) {
        res.status(400).send({
          message: "Error reading TP smart contract ABI."
        });
        errorSent = true;
      }
      return false;
    }

    // Initialize Web3
    const Web3 = require("web3");
//    const web3 = new Web3(new Web3.providers.HttpProvider(`https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`));
    const web3 = new Web3(new Web3.providers.HttpProvider(`https://${ETHEREUM_NETWORK}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`));



    console.log("!!! Platform:", SIGNER_PRIVATE_KEY.substring(0,4) + "..." + SIGNER_PRIVATE_KEY.slice(-3));
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

        console.log("TP smart contract address:", dtscf.smartcontractaddress);
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
            errMessage = "Insufficient cash tokens in the TP contract for coupon payment.";
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
        action: "TP coupon payment",
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
      console.log("Audit trail logged for TP coupon payment.");
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
          err.message || "Some error occurred while retrieving draft."
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
          err.message || "Some error occurred while retrieving draft."
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
      message: err.message || "Some error occurred while retrieving TP project records."
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
    if (con.dtscf_purchases) {
      con.dtscf_purchases.sort((a, b) => a.id - b.id);
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

  rec.dataValues.dtscf_contractors = topLevel;
  console.log("Dtscf with milestones, contractors and purchases: ", JSON.stringify(rec, null, 2));
  res.send(rec);

}; // getAllByDtscfId

// ── Direct contractor purchase update (no draft/approval needed) ──────────────
exports.updateContractorPurchases = async (req, res) => {
  try {
    const { dtscf_project_id, organisation_id, purchases, subcontractors } = req.body;
    if (!dtscf_project_id || !organisation_id)
      return res.status(400).json({ message: 'dtscf_project_id and organisation_id are required' });

    // Find the live contractor for this org in this project
    const liveContractor = await Contractor.findOne({
      where: { dtscf_project_id: parseInt(dtscf_project_id), organisation_id: parseInt(organisation_id) }
    });
    if (!liveContractor)
      return res.status(404).json({ message: 'Contractor not found in this project for your organisation' });

    const contractorId = liveContractor.id;

    // Load project milestones once so we can resolve milestone name → id
    const projectMilestones = await Milestone.findAll({ where: { dtscf_project_id: parseInt(dtscf_project_id) } });
    const milestoneIdByName = (name) => {
      if (!name) return null;
      const ms = projectMilestones.find(m => m.name === name);
      return ms ? ms.id : null;
    };

    // Replace purchases for this contractor
    await Purchase.destroy({ where: { dtscf_contractor_id: contractorId } });
    for (const pur of (purchases || [])) {
      await Purchase.create({
        description: pur.description || '',
        amount: parseInt(pur.amount) || 0,
        dtscf_contractor_id: contractorId,
        dtscf_project_id: parseInt(dtscf_project_id),
        dtscf_milestone_id: milestoneIdByName(pur.milestone)
      });
    }

    // Replace sub-contractors and their purchases
    const existingSubs = await Contractor.findAll({
      where: { dtscf_project_id: parseInt(dtscf_project_id), dtscf_parent_contractor_id: contractorId }
    });
    for (const sub of existingSubs) {
      await Purchase.destroy({ where: { dtscf_contractor_id: sub.id } });
    }
    await Contractor.destroy({
      where: { dtscf_project_id: parseInt(dtscf_project_id), dtscf_parent_contractor_id: contractorId }
    });

    for (const sub of (subcontractors || [])) {
      const newSub = await Contractor.create({
        name: sub.name || '',
        budget: parseInt(sub.budget) || 0,
        walletaddress: sub.walletaddress || '',
        organisation_id: sub.organisation_id || null,
        dtscf_project_id: parseInt(dtscf_project_id),
        dtscf_parent_contractor_id: contractorId
      });
      for (const pur of (sub.purchases || [])) {
        await Purchase.create({
          description: pur.description || '',
          amount: parseInt(pur.amount) || 0,
          dtscf_contractor_id: newSub.id,
          dtscf_project_id: parseInt(dtscf_project_id),
          dtscf_milestone_id: milestoneIdByName(pur.milestone)
        });
      }
    }

    console.log(`updateContractorPurchases: updated contractor ${contractorId} for project ${dtscf_project_id}`);
    res.json({ message: 'Contractor purchases updated successfully' });
  } catch (e) {
    console.error('updateContractorPurchases error:', e);
    res.status(500).json({ message: e.message });
  }
};

// ── Contractor Amendment Draft: get approvers from same organisation ──────────
exports.getApproversByOrg = async (req, res) => {
  try {
    const { organisation_id } = req.query;
    if (!organisation_id) return res.status(400).json({ message: 'organisation_id is required' });

    const approvers = await db.user.findAll({
      where: { organisation_id: parseInt(organisation_id) },
      attributes: ['id', 'username', 'organisation_id'],
      include: [{
        model: db.opsrole,
        as: 'opsrole',
        through: { where: { transactionType: { [Op.like]: 'dtscf' } } },
        where: { name: { [Op.like]: 'approver' } },
        required: true,
        attributes: []
      }]
    });
    res.json(approvers);
  } catch (e) {
    console.error('getApproversByOrg error:', e);
    res.status(500).json({ message: e.message });
  }
};

// ── Contractor Amendment Draft: submit ───────────────────────────────────────
exports.submitContractorAmendment = async (req, res) => {
  try {
    const { dtscf_project_id, maker, approver, actionby, myBranches, myContractor } = req.body;
    // Accept both new multi-branch format (myBranches) and legacy single-contractor format (myContractor)
    const branches = myBranches || (myContractor ? [{ branchType: 'top-level', parentRef: null, contractor: myContractor }] : null);
    if (!dtscf_project_id) return res.status(400).json({ message: 'Missing required fields: dtscf_project_id' });
    if (!maker) return res.status(400).json({ message: 'Missing required fields: maker' });
    if (!approver) return res.status(400).json({ message: 'Missing required fields: approver' });
    if (!branches || branches.length === 0) return res.status(400).json({ message: 'Missing required fields: branches (myBranches)' });

    const project = await Dtscfs.findByPk(dtscf_project_id, {
      include: [{ model: Milestone, as: 'dtscf_milestones' }]
    });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Reuse an existing rejected draft for this project+maker to avoid duplicate inbox entries.
    // If multiple old rejected drafts exist (from before this logic was introduced), clean them up.
    const allRejectedDrafts = await Dtscf_Drafts.findAll({
      where: {
        txntype: 1,
        status: -1,
        approveddtscfid: parseInt(dtscf_project_id),
        maker: parseInt(maker)
      },
      order: [['id', 'DESC']]
    });

    let draft;
    if (allRejectedDrafts.length > 0) {
      // Reuse the most recent one
      draft = allRejectedDrafts[0];
      // Delete any older duplicates and their sub-records
      for (let i = 1; i < allRejectedDrafts.length; i++) {
        const old = allRejectedDrafts[i];
        await Purchase_draft.destroy({ where: { dtscf_project_id: old.id } });
        await Contractor_draft.destroy({ where: { dtscf_project_id: old.id } });
        await Milestone_draft.destroy({ where: { dtscf_project_id: old.id } });
        await old.destroy();
      }
      // Update the reused draft to pending-approver status
      await draft.update({
        status: 2,
        approver: parseInt(approver),
        actionby: actionby || '',
        actiontimedate: new Date(),
        approverComments: ''
      });
      // Clear old sub-records so they can be rebuilt
      await Purchase_draft.destroy({ where: { dtscf_project_id: draft.id } });
      await Contractor_draft.destroy({ where: { dtscf_project_id: draft.id } });
      await Milestone_draft.destroy({ where: { dtscf_project_id: draft.id } });
      console.log(`submitContractorAmendment: reusing rejected draft ${draft.id} for project ${dtscf_project_id}`);
    } else {
      draft = await Dtscf_Drafts.create({
        name: project.name,
        description: project.description || '',
        anchor_id: project.anchor_id,
        totalBudget: project.totalBudget,
        underlyingTokenID: project.underlyingTokenID,
        underlyingDSGDsmartcontractaddress: project.underlyingDSGDsmartcontractaddress || '',
        campaign_id: project.campaign_id,
        blockchain: project.blockchain || 0,
        startdate: project.startdate,
        enddate: project.enddate,
        txntype: 1,
        status: 2,
        actionby: actionby || '',
        actiontimedate: new Date(),
        maker: parseInt(maker),
        approver: parseInt(approver),
        approverComments: '',
        approveddtscfid: parseInt(dtscf_project_id)
      });
      console.log(`submitContractorAmendment: created new draft ${draft.id} for project ${dtscf_project_id}`);
    }

    // Build draft milestones and track name → draft_id mapping for purchase linkage
    const draftMilestoneIdByName = {};
    for (const ms of (project.dtscf_milestones || [])) {
      const draftMs = await Milestone_draft.create({
        name: ms.name,
        budget: ms.budget,
        startdate: ms.startdate,
        enddate: ms.enddate,
        description: ms.description || '',
        dtscf_project_id: draft.id
      });
      draftMilestoneIdByName[ms.name] = draftMs.id;
    }

    const resolveDraftMilestoneId = (name) => name ? (draftMilestoneIdByName[name] || null) : null;

    // Recursively create contractor draft entries (handles arbitrary nesting depth)
    const createContractorDraftTree = async (con, parentDraftId) => {
      const conDraft = await Contractor_draft.create({
        name: con.name || '',
        budget: con.budget || 0,
        walletaddress: con.walletaddress || '',
        organisation_id: con.organisation_id || null,
        dtscf_project_id: draft.id,
        dtscf_parent_contractor_id: parentDraftId || null
      });
      for (const pur of (con.purchases || [])) {
        await Purchase_draft.create({
          description: pur.description || '',
          amount: parseInt(pur.amount) || 0,
          dtscf_contractor_id: conDraft.id,
          dtscf_project_id: draft.id,
          dtscf_milestone_id: resolveDraftMilestoneId(pur.milestone)
        });
      }
      for (const sub of (con.subcontractors || [])) {
        await createContractorDraftTree(sub, conDraft.id);
      }
      return conDraft;
    };

    // Process each branch: top-level branches create a top-level draft entry;
    // sub-contractor branches create a wrapper for the parent first, then the contractor beneath it.
    for (const branch of branches) {
      const { branchType, parentRef, contractor } = branch;
      if (branchType === 'sub' && parentRef) {
        // Create a parent wrapper so the approver sees the correct tree context
        const parentDraft = await Contractor_draft.create({
          name: parentRef.name || '',
          budget: 0,
          walletaddress: parentRef.walletaddress || '',
          organisation_id: parentRef.organisation_id || null,
          dtscf_project_id: draft.id,
          dtscf_parent_contractor_id: null
        });
        await createContractorDraftTree(contractor, parentDraft.id);
      } else {
        await createContractorDraftTree(contractor, null);
      }
    }

    res.json({ message: 'Contractor amendment draft submitted successfully', draftId: draft.id });
  } catch (e) {
    console.error('submitContractorAmendment error:', e);
    res.status(500).json({ message: e.message });
  }
};

// ── Contractor Amendment Draft: get pending drafts for a project ──────────────
exports.getContractorAmendmentDrafts = async (req, res) => {
  try {
    const { dtscf_project_id, approver_id } = req.query;
    if (!dtscf_project_id) return res.status(400).json({ message: 'dtscf_project_id is required' });

    const condition = { txntype: 1, approveddtscfid: parseInt(dtscf_project_id), status: 2 };
    if (approver_id) condition.approver = parseInt(approver_id);

    const drafts = await Dtscf_Drafts.findAll({
      where: condition,
      order: [['id', 'DESC']]
    });

    // Fetch all live contractors+purchases for this project once (used for is_new marking)
    const allLiveContractors = await Contractor.findAll({
      where: { dtscf_project_id: parseInt(dtscf_project_id) },
      include: [{ model: Purchase, as: 'dtscf_purchases' }]
    });

    const walletMatch = (a, b) =>
      a && b && a.toLowerCase() === b.toLowerCase();

    // build contractor+purchase hierarchy for each draft
    const results = await Promise.all(drafts.map(async draft => {
      const json = draft.toJSON();
      // Include draft milestones so the client can map draft MS IDs → names
      const draftMilestones = await Milestone_draft.findAll({
        where: { dtscf_project_id: draft.id },
        attributes: ['id', 'name']
      });
      json.draftMilestones = draftMilestones.map(m => ({ id: m.id, name: m.name }));

      const allCons = await Contractor_draft.findAll({
        where: { dtscf_project_id: draft.id },
        include: [{ model: Purchase_draft, as: 'dtscf_purchases_drafts' }]
      });
      const conMap = {};
      allCons.forEach(c => { c.dataValues.subcontractors = []; conMap[c.id] = c; });
      const topLevel = [];
      allCons.forEach(c => {
        if (c.dtscf_parent_contractor_id) {
          if (conMap[c.dtscf_parent_contractor_id])
            conMap[c.dtscf_parent_contractor_id].dataValues.subcontractors.push(c.toJSON());
        } else {
          topLevel.push(c); // keep Sequelize instance so sub-contractors added below are included
        }
      });
      // Convert to JSON AFTER all sub-contractors have been attached to parents
      const topLevelJson = topLevel.map(c => c.toJSON());

      // Mark each purchase/sub-contractor as is_new by comparing against live DB (recursive)
      const markIsNew = (draftCon, liveCon, parentIsNew = false) => {
        const livePurchases = liveCon ? (liveCon.dtscf_purchases || []) : [];
        (draftCon.dtscf_purchases_drafts || []).forEach(pur => {
          pur.is_new = parentIsNew || !livePurchases.some(lp =>
            lp.description === pur.description && parseInt(lp.amount) === parseInt(pur.amount)
          );
        });
        (draftCon.subcontractors || []).forEach(sub => {
          const liveSub = liveCon ? allLiveContractors.find(lc =>
            parseInt(lc.dtscf_parent_contractor_id) === parseInt(liveCon.id) &&
            ((sub.organisation_id && lc.organisation_id === sub.organisation_id) ||
             walletMatch(lc.walletaddress, sub.walletaddress))
          ) : null;
          sub.is_new = !liveSub;
          markIsNew(sub, liveSub, sub.is_new);
        });
      };
      topLevelJson.forEach(draftCon => {
        const liveCon = allLiveContractors.find(lc =>
          !lc.dtscf_parent_contractor_id &&
          ((draftCon.organisation_id && lc.organisation_id === draftCon.organisation_id) ||
           walletMatch(lc.walletaddress, draftCon.walletaddress))
        );
        markIsNew(draftCon, liveCon, false);
      });

      json.contractors = topLevelJson;
      return json;
    }));

    res.json(results);
  } catch (e) {
    console.error('getContractorAmendmentDrafts error:', e);
    res.status(500).json({ message: e.message });
  }
};

// ── Contractor Amendment Draft: get in-flight status (for read-only gating) ──
exports.getContractorAmendmentStatus = async (req, res) => {
  try {
    const { dtscf_project_id } = req.query;
    if (!dtscf_project_id)
      return res.status(400).json({ message: 'dtscf_project_id required' });
    const draft = await Dtscf_Drafts.findOne({
      where: {
        txntype: 1,
        approveddtscfid: parseInt(dtscf_project_id),
        status: 2
      },
      attributes: ['id', 'status', 'maker', 'approver', 'approverComments'],
      order: [['id', 'DESC']]
    });
    res.json(draft ? draft.toJSON() : null);
  } catch (e) {
    console.error('getContractorAmendmentStatus error:', e);
    res.status(500).json({ message: e.message });
  }
};

// ── Contractor Amendment Draft: get my rejected draft (for maker re-submission) ──
exports.getMyRejectedContractorAmendmentDraft = async (req, res) => {
  try {
    const { dtscf_project_id, maker_id } = req.query;
    if (!dtscf_project_id || !maker_id)
      return res.status(400).json({ message: 'dtscf_project_id and maker_id are required' });

    const draft = await Dtscf_Drafts.findOne({
      where: {
        txntype: 1,
        status: -1,
        approveddtscfid: parseInt(dtscf_project_id),
        maker: parseInt(maker_id)
      },
      order: [['id', 'DESC']]
    });

    if (!draft) return res.json(null);

    const json = draft.toJSON();

    const draftMilestones = await Milestone_draft.findAll({
      where: { dtscf_project_id: draft.id },
      attributes: ['id', 'name']
    });
    json.draftMilestones = draftMilestones.map(m => ({ id: m.id, name: m.name }));

    const allLiveContractors = await Contractor.findAll({
      where: { dtscf_project_id: parseInt(dtscf_project_id) },
      include: [{ model: Purchase, as: 'dtscf_purchases' }]
    });

    const walletMatch = (a, b) => a && b && a.toLowerCase() === b.toLowerCase();

    const allCons = await Contractor_draft.findAll({
      where: { dtscf_project_id: draft.id },
      include: [{ model: Purchase_draft, as: 'dtscf_purchases_drafts' }]
    });

    const conMap = {};
    allCons.forEach(c => { c.dataValues.subcontractors = []; conMap[c.id] = c; });
    const topLevel = [];
    allCons.forEach(c => {
      if (c.dtscf_parent_contractor_id) {
        if (conMap[c.dtscf_parent_contractor_id])
          conMap[c.dtscf_parent_contractor_id].dataValues.subcontractors.push(c.toJSON());
      } else {
        topLevel.push(c);
      }
    });
    const topLevelJson = topLevel.map(c => c.toJSON());

    const markIsNewRejected = (draftCon, liveCon, parentIsNew = false) => {
      const livePurchases = liveCon ? (liveCon.dtscf_purchases || []) : [];
      (draftCon.dtscf_purchases_drafts || []).forEach(pur => {
        pur.is_new = parentIsNew || !livePurchases.some(lp =>
          lp.description === pur.description && parseInt(lp.amount) === parseInt(pur.amount)
        );
      });
      (draftCon.subcontractors || []).forEach(sub => {
        const liveSub = liveCon ? allLiveContractors.find(lc =>
          parseInt(lc.dtscf_parent_contractor_id) === parseInt(liveCon.id) &&
          ((sub.organisation_id && lc.organisation_id === sub.organisation_id) ||
           walletMatch(lc.walletaddress, sub.walletaddress))
        ) : null;
        sub.is_new = !liveSub;
        markIsNewRejected(sub, liveSub, sub.is_new);
      });
    };
    topLevelJson.forEach(draftCon => {
      const liveCon = allLiveContractors.find(lc =>
        !lc.dtscf_parent_contractor_id &&
        ((draftCon.organisation_id && lc.organisation_id === draftCon.organisation_id) ||
         walletMatch(lc.walletaddress, draftCon.walletaddress))
      );
      markIsNewRejected(draftCon, liveCon, false);
    });

    json.contractors = topLevelJson;
    res.json(json);
  } catch (e) {
    console.error('getMyRejectedContractorAmendmentDraft error:', e);
    res.status(500).json({ message: e.message });
  }
};

// ── Contractor Amendment Draft: approve ──────────────────────────────────────
exports.approveContractorAmendment = async (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain', 'Transfer-Encoding': 'chunked' });
  let responded = false;
  const sendLog     = msg => { if (!responded) res.write(`LOG: ${msg}\n`); console.log(msg); };
  const sendSuccess = msg => { if (!responded) { res.write(`SUCCESS: ${msg}\n`); res.end(); responded = true; } };
  const sendError   = msg => { if (!responded) { res.write(`ERROR: ${msg}\n`);   res.end(); responded = true; } console.error(msg); };

  try {
    const draft_id = req.params.id;
    const { approver, approverComments } = req.body;

    sendLog('Fetching contractor amendment draft...');
    const draft = await Dtscf_Drafts.findByPk(draft_id);
    if (!draft) return sendError('Draft not found');
    if (draft.status !== 2) return sendError('Draft is not in pending approval state');
    if (parseInt(draft.approver) !== parseInt(approver)) return sendError('You are not the designated approver for this draft');

    const dtscf_project_id = draft.approveddtscfid;
    if (!dtscf_project_id) return sendError('No associated live project found in draft');

    // Get the live project for blockchain details
    const liveProject = await Dtscfs.findByPk(dtscf_project_id);
    if (!liveProject) return sendError('Live project not found');

    // Build draft_milestone_id → prod_milestone_id mapping via name matching
    const draftMilestones = await Milestone_draft.findAll({ where: { dtscf_project_id: draft_id } });
    const prodMilestones = await Milestone.findAll({ where: { dtscf_project_id } });
    const draftMsIdToProdId = {};
    const prodMilestoneById = {};
    for (const dm of draftMilestones) {
      const pm = prodMilestones.find(m => m.name === dm.name);
      if (pm) draftMsIdToProdId[dm.id] = pm.id;
    }
    prodMilestones.forEach(pm => { prodMilestoneById[pm.id] = pm; });
    const resolveProdMilestoneId = (draftMsId) => draftMsId ? (draftMsIdToProdId[draftMsId] || null) : null;
    sendLog(`Milestone mapping: ${JSON.stringify(draftMsIdToProdId)}`);

    // Set up blockchain connection for ERC1155 token splitting
    let web3 = null;
    let tokenisedPayableContract = null;
    let anchor = null;
    let ANCHOR_PRIVATE_KEY_LOCAL = null;
    let anchorTokenId = null;
    let NFTindex = 0;

    if (liveProject.smartcontractaddress && liveProject.blockchain) {
      try {
        sendLog('Setting up blockchain connection for token splitting...');
        web3 = await setupWeb3(liveProject.blockchain);
        ANCHOR_PRIVATE_KEY_LOCAL = process.env.REACT_APP_ANCHOR_PRIVATE_KEY;
        anchor = web3.eth.accounts.privateKeyToAccount(ANCHOR_PRIVATE_KEY_LOCAL);
        const abi = JSON.parse(fs.readFileSync(abiFile, 'utf8'));
        tokenisedPayableContract = new web3.eth.Contract(abi, liveProject.smartcontractaddress);
        const anchorTokens = await getTokensInWallet(tokenisedPayableContract, anchor.address);
        if (anchorTokens && anchorTokens.length > 0) {
          anchorTokenId = anchorTokens[0].tokenId;
          sendLog(`Anchor's token ID for splitting: ${anchorTokenId}`);
        } else {
          sendLog('Warning: No tokens found in anchor wallet — blockchain splits will be skipped');
        }
        const allIds = await tokenisedPayableContract.methods.getAllTokenIds().call().catch(() => []);
        NFTindex = allIds.length > 0 ? Math.max(...allIds.map(id => parseInt(id))) : 0;
      } catch (bcErr) {
        sendLog(`Blockchain setup warning: ${bcErr.message} — DB updates will proceed without splits`);
        web3 = null; tokenisedPayableContract = null; anchor = null; anchorTokenId = null;
      }
    }

    // Collect blockchain split tasks for MetaMask execution on the frontend.
    const splitTasks = [];
    // Track the split history per source token — only populated with SUCCESSFUL on-chain splits.
    // Key: fromTokenId (string), Value: { valueAtStart: number|null, milestoneId: number|null, splits: [{actualNewId, amount, description}] }
    const splitHistoryBySource = {};
    // Track DB records created during this approval so we can roll them back if blockchain fails.
    const newlyAddedPurchaseIds = [];
    const newlyAddedContractorIds = [];
    // Subset of the above: contractor-MetaMask-signed additions only.
    // These are the records to clean up if the user rejects the MetaMask prompt on the client.
    const contractorSplitPurchaseIds = [];
    const contractorSplitContractorIds = [];

    const addSplitTask = async (fromTokenId, toWallet, amount, prodMsId, purchaseDescription, contractorName, signerType = 'anchor', purchaseId = null) => {
      if (!fromTokenId || !toWallet) return;
      const purAmount = parseFloat(amount) || 0;
      if (purAmount <= 0) return;
      const prodMs = prodMilestoneById[prodMsId];
      if (!prodMs) { sendLog(`Milestone ${prodMsId} not found, skipping TP task`); return; }

      NFTindex++;
      const expectedNewId = NFTindex;
      const amountWei = web3 ? web3.utils.toWei(purAmount.toString(), 'ether') : String(BigInt(Math.round(purAmount * 1e18)));
      const maturityDate = Math.floor(new Date(prodMs.enddate).getTime() / 1000);

      // Initialise split history entry for this source token on first encounter
      const srcKey = fromTokenId.toString();
      if (!splitHistoryBySource[srcKey]) {
        try {
          // Value is hidden in escrowCommitment on-chain — read from DB instead.
          const srcPurchaseRow = await Purchase.findOne({ where: { token_id: parseInt(fromTokenId), dtscf_project_id } });
          const srcSGD = srcPurchaseRow ? parseFloat(srcPurchaseRow.amount) : null;

          // milestoneId IS stored plaintext on-chain.
          let onChainMilestoneId = null;
          if (tokenisedPayableContract) {
            try {
              const srcPayable = await tokenisedPayableContract.methods.payables(fromTokenId).call();
              onChainMilestoneId = parseInt(srcPayable.milestoneId);
            } catch (_) {}
          }

          // Preserve the true original minted value across multiple splits so the metadata
          // always records what was minted, not what remained at the time of each split.
          let trulyOriginalValue = null;
          if (tokenisedPayableContract) {
            try {
              const existingUri = await tokenisedPayableContract.methods.uri(fromTokenId).call();
              if (existingUri) {
                const metaUrl = existingUri.startsWith('http')
                  ? existingUri
                  : `https://gateway.pinata.cloud/ipfs/${existingUri.replace('ipfs://', '')}`;
                const metaResp = await axios.get(metaUrl, { timeout: 15000 });
                const originalAttr = (metaResp.data.attributes || []).find(a => a.trait_type === 'Original Value');
                if (originalAttr) {
                  trulyOriginalValue = parseFloat(String(originalAttr.value).replace(/,/g, ''));
                  sendLog(`Source TP #${fromTokenId} original minted value (from metadata): SGD${trulyOriginalValue}`);
                }
              }
            } catch (metaErr) {
              sendLog(`Could not read existing metadata for TP #${fromTokenId} (will use current value as original): ${metaErr.message}`);
            }
          }

          splitHistoryBySource[srcKey] = { valueAtStart: srcSGD, trulyOriginalValue, milestoneId: onChainMilestoneId, splits: [], cumulativeSplit: 0, plannedSplits: [], srcPurchaseId: srcPurchaseRow ? srcPurchaseRow.id : null };
          if (srcSGD != null) sendLog(`Source TP #${fromTokenId} starting value: SGD${srcSGD}`);
        } catch (e) {
          sendLog(`Note: could not initialise history for TP #${fromTokenId}: ${e.message}`);
          splitHistoryBySource[srcKey] = { valueAtStart: null, trulyOriginalValue: null, milestoneId: null, splits: [], cumulativeSplit: 0, plannedSplits: [] };
        }
      }

      // Track cumulative splits against this source token
      const srcHistory = splitHistoryBySource[srcKey];
      srcHistory.cumulativeSplit = (srcHistory.cumulativeSplit || 0) + purAmount;
      srcHistory.plannedSplits = srcHistory.plannedSplits || [];
      srcHistory.plannedSplits.push({ amount: purAmount, description: purchaseDescription });

      const srcAmountStr = srcHistory && srcHistory.valueAtStart != null ? `SGD${srcHistory.valueAtStart}` : 'unknown';
      const remainingAfterSplit = srcHistory.valueAtStart != null
        ? srcHistory.valueAtStart - srcHistory.cumulativeSplit
        : null;
      const remainingStr = remainingAfterSplit != null ? `SGD${remainingAfterSplit}` : 'unknown';

      // Build conditions string that records this token's split provenance
      const conditions = `Completion of milestone '${prodMs.name}'. Split from TP #${fromTokenId} (source pool: ${srcAmountStr})`;

      let metadataUri = null;
      try {
        metadataUri = await generateMetadataFile(
          liveProject.smartcontractaddress, expectedNewId, purAmount.toString(),
          liveProject.name, prodMs.name, prodMsId, prodMs.enddate,
          conditions, null, purchaseDescription, undefined, liveProject.blockchain
        );
      } catch (e) {
        sendLog(`Metadata generation failed for '${purchaseDescription}': ${e.message}`);
      }

      // Pre-generate updated source URI so splitPayable can update the source token atomically
      let updatedSourceUri = '';
      if (srcHistory.valueAtStart != null && remainingAfterSplit != null) {
        const srcMsId = srcHistory.milestoneId;
        const srcMs = prodMilestones ? prodMilestones.find(m => m.id === srcMsId) : null;
        const sourceConditions = srcMs
          ? `Completion of milestone '${srcMs.name}'`
          : `Completion of project '${liveProject.name}'`;
        try {
          const originalValueToUse = srcHistory.trulyOriginalValue !== null
            ? srcHistory.trulyOriginalValue
            : srcHistory.valueAtStart;
          updatedSourceUri = await generateMetadataFile(
            liveProject.smartcontractaddress, parseInt(fromTokenId), remainingAfterSplit.toString(),
            liveProject.name, srcMs ? srcMs.name : 'Completion of project', srcMsId || 0,
            srcMs ? srcMs.enddate : (liveProject.enddate || new Date().toISOString().slice(0, 10)),
            sourceConditions,
            originalValueToUse, undefined, undefined, liveProject.blockchain
          );
        } catch (e) {
          sendLog(`Source metadata generation failed for TP #${fromTokenId}: ${e.message}`);
        }
      }

      // Compute commitments for the new split and the updated source token
      const taskSplitSalt = generateEscrowSalt();
      const taskNewOriginalSalt = generateEscrowSalt();
      const taskSplitCommitment = computeEscrowCommitment(amountWei, taskSplitSalt);
      const remainingAmountWeiForTask = remainingAfterSplit != null
        ? web3.utils.toWei(Math.max(0, remainingAfterSplit).toString(), 'ether')
        : '0';
      const taskUpdatedOriginalCommitment = computeEscrowCommitment(remainingAmountWeiForTask, taskNewOriginalSalt);

      splitTasks.push({
        fromTokenId: fromTokenId.toString(),
        signerType,
        toWallet,
        amount: purAmount.toString(),
        amountWei,
        splitCommitment: taskSplitCommitment,
        splitSalt: taskSplitSalt,
        updatedOriginalCommitment: taskUpdatedOriginalCommitment,
        newOriginalSalt: taskNewOriginalSalt,
        milestoneId: prodMsId,
        maturityDate,
        metadataUri,
        updatedSourceUri,
        purchaseDescription,
        contractorName: contractorName || '',
        purchaseId,
        sourcePurchaseId: srcHistory.srcPurchaseId || null,
        sourceRemainingAmount: remainingAfterSplit != null ? remainingAfterSplit.toString() : null
      });
      sendLog(`Split task queued: TP #${fromTokenId} (${srcAmountStr}) → new TP ~#${expectedNewId} (SGD${purAmount}) for '${purchaseDescription}' to '${contractorName}', source remaining: ${remainingStr} (signer: ${signerType})`);
    };

    const allCons = await Contractor_draft.findAll({
      where: { dtscf_project_id: draft_id },
      include: [{ model: Purchase_draft, as: 'dtscf_purchases_drafts' }]
    });

    // Build hierarchy
    const conMap = {};
    allCons.forEach(c => { c.dataValues.subcontractors = []; conMap[c.id] = c; });
    const topLevel = [];
    allCons.forEach(c => {
      if (c.dtscf_parent_contractor_id) {
        if (conMap[c.dtscf_parent_contractor_id]) conMap[c.dtscf_parent_contractor_id].dataValues.subcontractors.push(c);
      } else {
        topLevel.push(c);
      }
    });

    // Recursive: find/create live contractor at any depth, add new purchases, recurse into sub-contractors.
    // getSourceTokenId(milestoneId) → { tokenId, signerType } | null
    const processContractorDraft = async (conDraft, liveParentContractorId, getSourceTokenId) => {
      const label = liveParentContractorId ? 'sub-contractor' : 'contractor';
      sendLog(`Processing ${label}: ${conDraft.name}`);

      // Find matching live contractor, scoped by parent if present
      const parentFilter = liveParentContractorId ? { dtscf_parent_contractor_id: liveParentContractorId } : {};
      let liveContractor = null;
      if (conDraft.organisation_id) {
        liveContractor = await Contractor.findOne({ where: { dtscf_project_id, organisation_id: conDraft.organisation_id, ...parentFilter } });
      }
      if (!liveContractor && conDraft.walletaddress) {
        liveContractor = await Contractor.findOne({ where: { dtscf_project_id, walletaddress: conDraft.walletaddress, ...parentFilter } });
      }

      let liveContractorId;
      if (liveContractor) {
        await Contractor.update(
          { name: conDraft.name, budget: conDraft.budget, walletaddress: conDraft.walletaddress, organisation_id: conDraft.organisation_id || null },
          { where: { id: liveContractor.id } }
        );
        liveContractorId = liveContractor.id;
        sendLog(`Updated existing ${label} ${conDraft.name} (id=${liveContractorId})`);
      } else {
        const newCon = await Contractor.create({
          name: conDraft.name, budget: conDraft.budget,
          walletaddress: conDraft.walletaddress, organisation_id: conDraft.organisation_id || null,
          dtscf_project_id,
          dbstatus: `PENDING_${draft_id}`,
          ...(liveParentContractorId ? { dtscf_parent_contractor_id: liveParentContractorId } : {})
        });
        liveContractorId = newCon.id;
        newlyAddedContractorIds.push(liveContractorId);
        if (liveParentContractorId) contractorSplitContractorIds.push(liveContractorId);
        sendLog(`Created new ${label} ${conDraft.name} (id=${liveContractorId})`);
      }

      // Add only NEW purchases — skip any that already exist in prod
      const existingPurchases = await Purchase.findAll({ where: { dtscf_contractor_id: liveContractorId } });
      for (const pur of (conDraft.dtscf_purchases_drafts || [])) {
        const prodMsId = resolveProdMilestoneId(pur.dtscf_milestone_id);
        const alreadyExists = existingPurchases.some(ep =>
          ep.description === pur.description &&
          parseInt(ep.amount) === parseInt(pur.amount) &&
          ep.dtscf_milestone_id === prodMsId
        );
        if (alreadyExists) {
          console.log(`Purchase '${pur.description}' already in prod — skipping`);
          continue;
        }
        const newPur = await Purchase.create({
          description: pur.description, amount: pur.amount,
          dtscf_contractor_id: liveContractorId, dtscf_project_id,
          dtscf_milestone_id: prodMsId,
          dbstatus: `PENDING_${draft_id}`
        });
        newlyAddedPurchaseIds.push(newPur.id);
        sendLog(`Added new purchase '${pur.description}' for ${conDraft.name}`);
        if (conDraft.walletaddress && prodMsId) {
          const src = getSourceTokenId(prodMsId);
          if (src) {
            await addSplitTask(src.tokenId, conDraft.walletaddress, pur.amount, prodMsId, pur.description, conDraft.name, src.signerType, newPur.id);
            if (src.signerType === 'contractor') contractorSplitPurchaseIds.push(newPur.id);
          } else {
            sendLog(`No source TP for milestone ${prodMsId} — skipping blockchain split for '${pur.description}'`);
          }
        }
      }

      // Build per-milestone source map for sub-contractor splits.
      // Each TP in the contractor's wallet is matched to a milestone; anchor-held TPs sign server-side,
      // contractor-held TPs require MetaMask.
      let childGetSourceTokenId = getSourceTokenId; // default: inherit parent source (e.g. first-level sub of anchor)
      const subDrafts = (conDraft.dataValues ? conDraft.dataValues.subcontractors : conDraft.subcontractors) || [];

      if (subDrafts.length > 0 && tokenisedPayableContract && anchor && conDraft.walletaddress) {
        try {
          const conWalletTokens = await getTokensInWallet(tokenisedPayableContract, conDraft.walletaddress);
          if (conWalletTokens && conWalletTokens.length > 0) {
            // For each TP the contractor holds, query its milestoneId
            const milestoneToSrc = {}; // milestoneId (string) → { tokenId, signerType }
            for (const tp of conWalletTokens) {
              try {
                const payableData = await tokenisedPayableContract.methods.payables(tp.tokenId).call();
                const msId = payableData.milestoneId.toString();
                if (milestoneToSrc[msId]) continue; // keep first (lowest tokenId)
                const anchorBal = await tokenisedPayableContract.methods
                  .balanceOf(anchor.address, tp.tokenId).call();
                const signerType = anchorBal === '1' ? 'anchor' : 'contractor';
                milestoneToSrc[msId] = { tokenId: tp.tokenId, signerType };
                sendLog(`${conDraft.name} TP #${tp.tokenId} → milestone ${msId} (signer: ${signerType})`);
              } catch (e) {
                sendLog(`Could not query milestone for TP #${tp.tokenId}: ${e.message}`);
              }
            }

            if (Object.keys(milestoneToSrc).length > 0) {
              // Set source function FIRST so sub-contractor splits use the correct parent TP
              // even if the pre-flight checks below throw.
              childGetSourceTokenId = (milestoneId) => milestoneToSrc[milestoneId.toString()] || null;

              // Pre-flight: log planned sub-purchase amounts per milestone.
              // NOTE: on-chain TP value is hidden in escrowCommitment and cannot be read directly,
              // so we only log the planned amounts as a sanity check.
              const newSubAmountByMs = {};
              for (const subDraft of subDrafts) {
                for (const pur of (subDraft.dtscf_purchases_drafts || [])) {
                  const msId = resolveProdMilestoneId(pur.dtscf_milestone_id);
                  if (msId) {
                    const key = msId.toString();
                    newSubAmountByMs[key] = (newSubAmountByMs[key] || 0) + (parseFloat(pur.amount) || 0);
                  }
                }
              }
              for (const [msId, totalNew] of Object.entries(newSubAmountByMs)) {
                const src = milestoneToSrc[msId];
                if (src) {
                  sendLog(`Pre-flight: SGD${totalNew} queued for sub-contractors splitting from ${conDraft.name} TP #${src.tokenId} (milestone ${msId})`);
                } else {
                  sendLog(`Warning: ${conDraft.name} has no TP for milestone ${msId} — sub-contractor splits for that milestone will be skipped`);
                }
              }
            }
          } else {
            sendLog(`${conDraft.name} holds no TPs — sub-contractor splits will inherit parent source`);
          }
        } catch (e) {
          sendLog(`Could not build TP milestone map for ${conDraft.name}: ${e.message}`);
        }
      }

      // Recurse into sub-contractors (works at any depth)
      for (const subDraft of subDrafts) {
        await processContractorDraft(subDraft, liveContractorId, childGetSourceTokenId);
      }
    };

    // Anchor source: always uses anchorTokenId (single TP per project), anchor signs server-side
    const anchorSourceFn = (_milestoneId) =>
      anchorTokenId ? { tokenId: anchorTokenId.toString(), signerType: 'anchor' } : null;

    for (const conDraft of topLevel) {
      await processContractorDraft(conDraft, null, anchorSourceFn);
    }

    // Separate tasks: anchor signs server-side; contractor signs via MetaMask
    const anchorTasks = splitTasks.filter(t => t.signerType === 'anchor');
    const contractorTasks = splitTasks.filter(t => t.signerType === 'contractor');

    // Helper: roll back DB records added during this approval attempt
    const rollbackDbChanges = async () => {
      if (newlyAddedPurchaseIds.length > 0) {
        await Purchase.destroy({ where: { id: newlyAddedPurchaseIds } });
        sendLog(`Rolled back ${newlyAddedPurchaseIds.length} purchase(s) added to prod.`);
      }
      if (newlyAddedContractorIds.length > 0) {
        await Contractor.destroy({ where: { id: newlyAddedContractorIds } });
        sendLog(`Rolled back ${newlyAddedContractorIds.length} contractor(s) added to prod.`);
      }
    };

    let allAnchorSplitsOk = true;

    if (anchorTasks.length > 0 && web3 && tokenisedPayableContract && anchor && ANCHOR_PRIVATE_KEY_LOCAL) {
      sendLog(`Executing ${anchorTasks.length} anchor split(s) server-side...`);
      web3.eth.accounts.wallet.add(ANCHOR_PRIVATE_KEY_LOCAL);
      const gasPrice = await web3.eth.getGasPrice();
      const gasPriceAdjusted = Math.ceil(Number(gasPrice) * 1.2).toString();

      for (const task of anchorTasks) {
        try {
          const srcHistory = splitHistoryBySource[task.fromTokenId.toString()];
          const srcValueStr = srcHistory && srcHistory.valueAtStart != null ? `${srcHistory.valueAtStart} SGD` : 'unknown';
          sendLog(`Splitting TP #${task.fromTokenId} (${srcValueStr}) → new TP ~#${task.fromTokenId} (SGD${task.amount}) for '${task.purchaseDescription}' to '${task.contractorName}'`);

          // Estimate gas — catches potential reverts before sending
          let splitGasEstimate;
          try {
            splitGasEstimate = await tokenisedPayableContract.methods
              .splitPayable(task.fromTokenId, task.milestoneId, task.splitCommitment, task.updatedOriginalCommitment, task.maturityDate, task.metadataUri || '', task.updatedSourceUri || '')
              .estimateGas({ from: anchor.address });
          } catch (estimateErr) {
            sendLog(`Gas estimation failed for '${task.purchaseDescription}': ${estimateErr.message}`);
            allAnchorSplitsOk = false;
            continue;
          }
          const splitGasWithBuffer = Math.ceil(splitGasEstimate * 1.1);

          // Check anchor ETH balance covers this split + a transfer
          const anchorBalance = BigInt(await web3.eth.getBalance(anchor.address));
          const estimatedCost = BigInt(splitGasWithBuffer + 150000) * BigInt(gasPriceAdjusted);
          if (anchorBalance < estimatedCost) {
            const needed  = parseFloat(web3.utils.fromWei(estimatedCost.toString(), 'ether')).toFixed(6);
            const hasEth  = parseFloat(web3.utils.fromWei(anchorBalance.toString(), 'ether')).toFixed(6);
            sendLog(`Insufficient ETH in anchor wallet for '${task.purchaseDescription}'. Required: ~${needed} ETH, Available: ${hasEth} ETH.`);
            sendLog(`Please top up the anchor wallet ${anchor.address} with ETH on the Sepolia test network, then retry.`);
            allAnchorSplitsOk = false;
            continue;
          }
          sendLog(`Estimated gas: ${splitGasEstimate} (using ${splitGasWithBuffer} with 10% buffer).`);

          const splitReceipt = await tokenisedPayableContract.methods
            .splitPayable(task.fromTokenId, task.milestoneId, task.splitCommitment, task.updatedOriginalCommitment, task.maturityDate, task.metadataUri || '', task.updatedSourceUri || '')
            .send({ from: anchor.address, gas: splitGasWithBuffer, gasPrice: gasPriceAdjusted });

          const newTokenId = splitReceipt.events && splitReceipt.events.PayableSplit
            ? splitReceipt.events.PayableSplit.returnValues.newId
            : null;
          if (!newTokenId) {
            sendLog(`Warning: splitPayable succeeded but PayableSplit event not found for '${task.purchaseDescription}' — transfer skipped`);
            allAnchorSplitsOk = false;
            continue;
          }
          sendLog(`TP #${newTokenId} created. Transferring to ${task.toWallet}...`);

          await tokenisedPayableContract.methods
            .safeTransferFrom(anchor.address, task.toWallet, newTokenId, 1, '0x')
            .send({ from: anchor.address, gas: 150000, gasPrice: gasPriceAdjusted });

          sendLog(`TP #${task.fromTokenId} → TP #${newTokenId} (SGD${task.amount} for '${task.purchaseDescription}') transferred to ${task.toWallet}. Source TP #${task.fromTokenId} metadata updated atomically.`);

          // Persist salts for this split token so unwrap can reveal the commitment later
          try {
            if (task.purchaseId) {
              await Purchase.update({ token_id: parseInt(newTokenId), escrow_salt: task.splitSalt }, { where: { id: task.purchaseId } });
            }
            await Dtscfs.update({ anchor_token_salt: task.newOriginalSalt }, { where: { smartcontractaddress: liveProject.smartcontractaddress } });
          } catch (dbErr) {
            console.warn('Failed to persist escrow salts after dAppUpdate split:', dbErr.message);
          }

          // Re-emit URI events in standalone transactions so MetaMask detects the metadata change
          try {
            if (task.metadataUri) {
              await tokenisedPayableContract.methods.setTokenURI(parseInt(newTokenId), task.metadataUri).send({ from: anchor.address, gas: 60000, gasPrice: gasPriceAdjusted });
            }
            if (task.updatedSourceUri) {
              await tokenisedPayableContract.methods.setTokenURI(parseInt(task.fromTokenId), task.updatedSourceUri).send({ from: anchor.address, gas: 60000, gasPrice: gasPriceAdjusted });
            }
            sendLog(`MetaMask refresh: URI events re-emitted for TP #${newTokenId} and TP #${task.fromTokenId}`);
          } catch (e) {
            console.log(`URI refresh event failed (non-critical): ${e.message}`);
          }

          const srcKey = task.fromTokenId.toString();
          if (!splitHistoryBySource[srcKey]) splitHistoryBySource[srcKey] = { valueAtStart: null, milestoneId: null, splits: [], cumulativeSplit: 0, plannedSplits: [] };
          splitHistoryBySource[srcKey].splits.push({ actualNewId: newTokenId, amount: parseFloat(task.amount), description: task.purchaseDescription });
        } catch (e) {
          sendLog(`Blockchain split failed for '${task.purchaseDescription}': ${e.message}`);
          allAnchorSplitsOk = false;
        }
      }

      if (!allAnchorSplitsOk) {
        sendLog('One or more anchor splits failed — rolling back DB changes. Draft remains in pending state for retry.');
        await rollbackDbChanges();
        sendError('Blockchain split failed. DB changes reverted. Please fix the issue and click "Approve and deploy" again.');
        return;
      }

      sendLog(`${anchorTasks.length} anchor split(s) complete.`);
    } else if (anchorTasks.length > 0) {
      sendLog('Warning: anchor splits could not be executed — anchor key or web3 not available.');
      allAnchorSplitsOk = false;
      await rollbackDbChanges();
      sendError('Anchor key or blockchain connection not available. DB changes reverted.');
      return;
    }

    // Mark draft as approved only after blockchain operations succeed
    await Dtscf_Drafts.update(
      { status: 3, approverComments: approverComments || '' },
      { where: { id: draft_id } }
    );
    await Dtscfs.update({ draftdtscfid: draft_id }, { where: { id: dtscf_project_id } });
    sendLog('Draft marked as approved (status=3)');

    // Mark all newly created DB records as OK (mirrors the dbstatus flow in initial project creation)
    if (newlyAddedContractorIds.length > 0) {
      await Contractor.update({ dbstatus: 'OK' }, { where: { id: newlyAddedContractorIds } });
    }
    if (newlyAddedPurchaseIds.length > 0) {
      await Purchase.update({ dbstatus: 'OK' }, { where: { id: newlyAddedPurchaseIds } });
    }
    sendLog(`DB records marked OK: ${newlyAddedContractorIds.length} contractor(s), ${newlyAddedPurchaseIds.length} purchase(s).`);

    if (contractorTasks.length > 0 && !responded) {
      sendLog(`${contractorTasks.length} sub-contractor split(s) require MetaMask signing by the contractor (TP #${contractorTasks[0].fromTokenId} holder).`);
      res.write(`TASKS: ${JSON.stringify({ contractAddress: liveProject.smartcontractaddress, splitTasks: contractorTasks, rollbackIds: { purchaseIds: contractorSplitPurchaseIds, contractorIds: contractorSplitContractorIds, draftId: draft_id } })}\n`);
    }
    const explorerUrlAmend = liveProject.smartcontractaddress ? getExplorerUrl(liveProject.blockchain, liveProject.smartcontractaddress) : null;
    if (explorerUrlAmend && !responded) sendLog('EXPLORER:' + explorerUrlAmend);
    sendSuccess(contractorTasks.length > 0
      ? 'Anchor splits complete. Sign sub-contractor splits via MetaMask to finish.'
      : 'Contractor amendment approved — all splits complete.');
  } catch (e) {
    console.error('approveContractorAmendment error:', e);
    sendError(e.message);
  }
};

// Called by the client after the user rejects the MetaMask prompt for contractor sub-splits.
// Removes the DB records that were created for those splits and resets the draft to pending (status=2).
exports.revertContractorSplit = async (req, res) => {
  try {
    const { purchaseIds, contractorIds, draftId } = req.body || {};
    if (purchaseIds && purchaseIds.length > 0) {
      await Purchase.destroy({ where: { id: purchaseIds } });
    }
    if (contractorIds && contractorIds.length > 0) {
      await Contractor.destroy({ where: { id: contractorIds } });
    }
    if (draftId) {
      await Dtscf_Drafts.update({ status: 2 }, { where: { id: draftId } });
    }
    res.send({ message: 'Contractor split reverted. Draft reset to pending.' });
  } catch (e) {
    console.error('revertContractorSplit error:', e);
    res.status(500).send({ message: e.message });
  }
};

// Called by the client after MetaMask signs contractor sub-splits.
// Writes the on-chain token_id and escrow_salt back to each purchase row so unwrap can reveal the commitment later.
exports.confirmContractorSplit = async (req, res) => {
  try {
    const { updates, sourceUpdates } = req.body || {};
    // New token records: set token_id and escrow_salt for newly minted split tokens
    if (Array.isArray(updates)) {
      for (const { purchaseId, tokenId, splitSalt } of updates) {
        if (!purchaseId || !tokenId) continue;
        await Purchase.update(
          { token_id: parseInt(tokenId), escrow_salt: splitSalt || null },
          { where: { id: purchaseId } }
        );
      }
    }
    // Source token records: update amount and escrow_salt for the source token after split
    if (Array.isArray(sourceUpdates)) {
      for (const { purchaseId, amount, salt } of sourceUpdates) {
        if (!purchaseId) continue;
        const upd = {};
        if (amount !== null && amount !== undefined) upd.amount = parseFloat(amount);
        if (salt) upd.escrow_salt = salt;
        if (Object.keys(upd).length) {
          await Purchase.update(upd, { where: { id: purchaseId } });
        }
      }
    }
    res.json({ message: 'ok' });
  } catch (e) {
    console.error('confirmContractorSplit error:', e);
    res.status(500).json({ message: e.message });
  }
};

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

    // For each project, find the latest approved contractor amendment draft so the list
    // "View" link always points to the most up-to-date draft, not just the initial one.
    const projectIds = dtscfs.map(d => d.id);
    const latestAmendmentDrafts = projectIds.length > 0
      ? await Dtscf_Drafts.findAll({
          where: { txntype: 1, approveddtscfid: { [Op.in]: projectIds }, status: 3 },
          attributes: ['id', 'approveddtscfid'],
          order: [['id', 'DESC']]
        })
      : [];
    const latestAmendmentDraftByProject = {};
    latestAmendmentDrafts.forEach(d => {
      if (!latestAmendmentDraftByProject[d.approveddtscfid]) {
        latestAmendmentDraftByProject[d.approveddtscfid] = d.id;
      }
    });

    const formattedData = dtscfs.map(dtscf => {
      const json = dtscf.toJSON();
      json.anchorName = dtscf.anchor ? dtscf.anchor.name : null;
      json.tokenName = dtscf.underlyingToken ? dtscf.underlyingToken.tokenname : null;
      if (latestAmendmentDraftByProject[json.id]) {
        json.draftdtscfid = latestAmendmentDraftByProject[json.id];
      }
      delete json.anchor;
      delete json.underlyingToken;
      return json;
    });

    logDataValues("Dtscfs.findAll: ", formattedData);
    res.send(formattedData);
  } catch (err) {
    console.log("Error while retrieving dtscf4: "+err.message);
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving TP project records."
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
    include: { model: Purchase_draft, as: 'dtscf_purchases_drafts' }
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
          message: `Cannot find TP with id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving TP with id=" + id
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
      res.status(404).send({ message: `TP with id=${id} not found.` });
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
      res.status(500).send({ message: "Error reading TP contract ABI." });
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
        res.status(400).send({ message: "Error retrieving TP holders. Please try again." });
        errorSent = true;
      }
    }
  })
  .catch(err => {
    console.error("Error retrieving dtscf:", err.message);
    if (!errorSent) {
      res.status(500).send({ message: "Error retrieving TP data." });
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
  const selectedMilestone = req.body.selectedMilestone; 
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
          const web3 = await setupWeb3(blockchain);

          const abi = JSON.parse(fs.readFileSync(abiFile, 'utf8')); 
          const TPcontract = new web3.eth.Contract(abi, TPsmartContractAddress);
          console.log(`Checking tokens in wallet ${w1} for contract ${TPsmartContractAddress}...`);
//          console.log(`TPcontract.methods: `, TPcontract.methods);
          const walletTokens = await getTokensInWallet(TPcontract, w1);
          console.log(`Tokens in wallet ${w1} for contract ${TPsmartContractAddress}:`, walletTokens);   

          // Now we realizeMilestone the token 
          const realizeMilestoneTP = async () => {
            try {
              console.log(`Calling realizeMilestone '${selectedMilestone}' ID: ${selectedMilestoneId}`);

              // const gasPrice = await web3.eth.getGasPrice();  
              // Get gas prices (EIP-1559 support)
              const block = await web3.eth.getBlock('pending');
              const realizeMilestoneReceipt =  await retryWithBackoff(async (innerGasMultiplier, innerPriorityMultiplier, innerGasLimitMultiplier) => {
                  const endDateUnix = Math.floor(new Date(req.body.enddate).getTime() / 1000);
                  let realizeMilestoneGas;
                  try { // test first using estimateGas to see if the transaction would revert   
                      console.log(`Just testing realizing milestone '${selectedMilestone}' ID: ${selectedMilestoneId}`);
                      realizeMilestoneGas = await TPcontract.methods.forceRealizeMilestone( selectedMilestoneId ).estimateGas({ from: CONTRACT_OWNER_WALLET });
                  } catch (error) {
                      console.error("Gas estimation for forceRealizeMilestone failed. The contract would revert this transaction.");
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
                      throw new Error(`Gas estimation for forceRealizeMilestone failed: ${error.message}`);
                  }

                  try { // now the actual forceRealizeMilestone call, with the same gas to see if it goes through
                      realizeMilestoneGas = Math.floor(realizeMilestoneGas * innerGasLimitMultiplier);    
                      let baseFee = BigInt((await web3.eth.getBlock('latest')).baseFeePerGas || await web3.eth.getGasPrice());
                      let maxPriorityFee = BigInt(2000000000);  // Default 2 gwei; adjust as needed
                      let maxFeePerGas = ((baseFee * BigInt(Math.floor(innerGasMultiplier * 100)) / BigInt(100)) + (maxPriorityFee * BigInt(Math.floor(innerPriorityMultiplier * 100)) / BigInt(100))).toString();
                      let maxPriorityFeePerGas = (maxPriorityFee * BigInt(Math.floor(innerPriorityMultiplier * 100)) / BigInt(100)).toString();

                      console.log('Current maxFeePerGas:', maxFeePerGas);
                      console.log('Current maxPriorityFeePerGas:', maxPriorityFeePerGas);

                      const realizeMilestoneData = TPcontract.methods.forceRealizeMilestone( selectedMilestoneId ).encodeABI();

                      const realizeMilestoneTx = {
                        from: CONTRACT_OWNER_WALLET,
                        to: TPsmartContractAddress,
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

              console.log(`Realized milestone '${selectedMilestone}' ID: ${selectedMilestoneId}`);

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
          action                : "TP set milestone completed - accepted",
          id                    : selectedMilestoneId,
        }, 
      )
      .then(auditres => {
        console.log("Data written to audittrail for setting TP milestone completed request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for setting TP milestone completed request: "+err.message);
      });
      
      res.send({
        message: "TP milestone was set to completed successfully."
      });
    } else {
      res.send({
        message: `${req.body}. Record updated =${num}. Cannot update TP with id=${selectedMilestoneId}. Maybe TP was not found or req.body is empty!`
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

    console.log(">>> milestones:", milestones)
    for (const [index, ms] of milestones.entries()) {
      if (ms.id) { // if this is existing milestone, just update
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
      } else {  // if this is new milestone added during editing
        await Milestone_draft.create({
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
        console.log(`LOG: Created milestone ${index + 1}/${milestones.length}.\n`);
      }
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

    console.log(">>> contractors:", contractors)
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
          organisation_id: con.organisation_id || null,
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

      console.log(">>> con.purchases:", con.purchases)

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
            action: "TP " + (req.body.txntype === 0 ? "create" : req.body.txntype === 1 ? "update" : req.body.txntype === 2 ? "delete" : "") + " request - submitted",
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
      throw new Error(`Cannot submit TP with id=${draft_id}. Maybe TP was not found or req.body is empty!`);
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
          action                : "TP "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - accepted",
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
        console.log("Data written to audittrail for accepting TP request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for accepting TP request: "+err.message);
      });
      
      res.send({
        message: "TP was accepted successfully."
      });
    } else {
      res.send({
        message: `${req.body}. Record updated =${num}. Cannot update TP with id=${draft_id}. Maybe TP was not found or req.body is empty!`
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
          action                : "TP "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - rejected",
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
        console.log("Data written to audittrail for rejecting TP request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for rejecting TP request: "+err.message);
      });
      
      if (!errorSent) {
          res.send({
          message: "TP was rejected."
        });
        errorSent = true;
      }
    } else {
      if (!errorSent) {
        res.send({
          message: `${req.body}. Record updated =${num}. Cannot reject TP with id=${draft_id}. Maybe TP was not found or req.body is empty!`
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

  //const INFURA_API_KEY = process.env.REACT_APP_INFURA_API_KEY;
  const ALCHEMY_API_KEY = process.env.REACT_APP_ALCHEMY_API_KEY;
  const SIGNER_PRIVATE_KEY = process.env.REACT_APP_SIGNER_PRIVATE_KEY;
  const CONTRACT_OWNER_WALLET = process.env.REACT_APP_CONTRACT_OWNER_WALLET;

  console.log("!!! Platform:", SIGNER_PRIVATE_KEY.substring(0,4)+"..." + SIGNER_PRIVATE_KEY.slice(-3));

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

    console.log("!!! Platform:", SIGNER_PRIVATE_KEY.substring(0,4)+"..." + SIGNER_PRIVATE_KEY.slice(-3));
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
                        message: "Timeout after "+TIMEOUT.toString()+" seconds, please check the TP tab after 5 minutes and try again if the TP is not created.",
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
              action                : "TP "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" update request - approved",
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
            console.log("Data written to audittrail for approving TP update request:", auditres);

          })
          .catch(err => {
            console.log("Error while logging to audittrail for approving TP update request: "+err.message);
          });

          if (!errorSent) {
            res.send({
              message: "TP was updated successfully."
            });
            errorSent = true;
          }
        } else {
          if (!errorSent) {
            res.send({
              message: `${req.body}. Record updated =${num}. Cannot update TP with id=${id}. Maybe TP was not found or req.body is empty!`
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
          action                : "TP "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - deleted",
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
        console.log("Data written to audittrail for TP delete request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for TP delete request: "+err.message);
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
        console.log("Sending success TP delete to client");
        res.send({
          message: "TP was deleted successfully!"
        });
        msgSent = true;
      }
      return true;
    } else {
      if (!msgSent) {
        res.send({
          message: `Cannot delete TP with id=${req.body.approveddtscfid}. Maybe TP was not found!`
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
        message: 'Error when deleting TP from database, please inform tech support.',
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
          action                : "TP "+(req.body.txntype===0?"create":req.body.txntype===1?"update":req.body.txntype===2?"delete":"")+" request - dropped",
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
        console.log("Data written to audittrail for dropping TP request:", auditres);

      })
      .catch(err => {
        console.log("Error while logging to audittrail for dropping TP request: "+err.message);
      });
      
      if (!msgSent) {
        console.log("Sending success TP request dropped to client");
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
            message: "TP was deleted successfully!"
          });
          errorSent = true;
        }
      } else {
        if (!errorSent) {
          res.send({
            message: `Cannot delete TP with id=${id}. Maybe TP was not found!`
          });
          errorSent = true;
        }
      }
    })
    .catch(err => {
      if (!errorSent) {
        res.status(500).send({
          message: "Could not delete TP with id=" + id
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
      res.send({ message: `${nums} TP were deleted successfully!` });
    })
    .catch(err => {
      if (!errorSent) {
        res.status(500).send({
          message:
            err.message || "Some error occurred while removing all TP."
        });
        errorSent = true;
      }
    });
}; // deleteAll

const MILESTONE_REALISED_ABI = [
  {
    inputs: [{ internalType: 'uint256', name: 'milestoneId', type: 'uint256' }],
    name: 'getTokensForMilestone',
    outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }],
    stateMutability: 'view', type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'payables',
    outputs: [
      { internalType: 'bytes32', name: 'escrowCommitment', type: 'bytes32' },
      { internalType: 'uint256', name: 'maturityDate', type: 'uint256' },
      { internalType: 'bool', name: 'realized', type: 'bool' },
      { internalType: 'address', name: 'issuer', type: 'address' },
      { internalType: 'uint256', name: 'milestoneId', type: 'uint256' }
    ],
    stateMutability: 'view', type: 'function'
  }
];

exports.getMilestoneRealisedStatus = async (req, res) => {
  const { contractAddress, blockchain, milestoneIds } = req.query;
  if (!contractAddress || !blockchain || !milestoneIds) {
    return res.status(400).json({ message: 'contractAddress, blockchain, and milestoneIds are required' });
  }

  try {
    const web3 = await setupWeb3(parseInt(blockchain));
    const contract = new web3.eth.Contract(MILESTONE_REALISED_ABI, contractAddress);
    const ids = milestoneIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    const statuses = {};

    await Promise.all(ids.map(async milestoneId => {
      try {
        const tokenIds = await contract.methods.getTokensForMilestone(milestoneId).call();
        if (!tokenIds || tokenIds.length === 0) {
          statuses[milestoneId] = 'no_tokens';
          return;
        }
        const results = await Promise.all(tokenIds.map(id => contract.methods.payables(id).call()));
        const realizedCount = results.filter(p => p.realized).length;
        if (realizedCount === 0)                    statuses[milestoneId] = 'not_realised';
        else if (realizedCount === tokenIds.length) statuses[milestoneId] = 'realised';
        else                                        statuses[milestoneId] = 'partial';
      } catch (e) {
        console.error(`getMilestoneRealisedStatus: milestone ${milestoneId} error:`, e.message);
        statuses[milestoneId] = 'error';
      }
    }));

    res.json({ statuses });
  } catch (error) {
    console.error("getMilestoneRealisedStatus error:", error.message);
    res.status(500).json({ message: error.message });
  }
}; // getMilestoneRealisedStatus

// POST /api/dtscf/refreshtokenmeta
// Body: { contractAddress, tokenId, chainId }
// Anchor-only. Fetches the on-chain token URI, decrypts the metadata, adds plaintext image+name,
// re-uploads to IPFS, then calls setTokenURI to update the contract.
exports.refreshTokenMetadata = async (req, res) => {
  const { contractAddress, tokenId, chainId } = req.body;
  if (!contractAddress || tokenId == null || !chainId)
    return res.status(400).json({ message: 'Missing required fields' });

  // Require any valid login session
  const jwtLib = require('jsonwebtoken');
  const authConfig = require('../config/auth.config');
  const token = req.headers['x-access-token'];
  if (!token) return res.status(401).json({ message: 'Authentication required' });
  try { jwtLib.verify(token, authConfig.secret); }
  catch (e) { return res.status(401).json({ message: 'Invalid or expired session' }); }

  // setTokenURI is onlyOwner — use the contract owner/signer key, not the anchor key
  const OWNER_PRIVATE_KEY = process.env.REACT_APP_SIGNER_PRIVATE_KEY;
  if (!OWNER_PRIVATE_KEY) return res.status(500).json({ message: 'Contract owner key not configured (REACT_APP_SIGNER_PRIVATE_KEY)' });

  const ALCHEMY_API_KEY = process.env.REACT_APP_ALCHEMY_API_KEY;
  const RPC_BY_CHAIN = {
    11155111: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    80002:    `https://polygon-amoy.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    137:      `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    1:        `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
  };
  const rpcUrl = RPC_BY_CHAIN[parseInt(chainId)];
  if (!rpcUrl) return res.status(400).json({ message: `Unsupported chainId: ${chainId}` });

  try {
    const Web3 = require('web3');
    const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
    const ABI = JSON.parse(fs.readFileSync(abiFile, 'utf8'));
    const contract = new web3.eth.Contract(ABI, contractAddress);

    // 1. Get current token URI from chain
    const metadataUri = await contract.methods.uri(tokenId).call();
    if (!metadataUri) return res.status(404).json({ message: 'Token has no URI on-chain' });
    const fetchUrl = metadataUri.startsWith('http')
      ? metadataUri
      : `https://gateway.pinata.cloud/ipfs/${metadataUri.replace('ipfs://', '')}`;
    console.log(`refreshTokenMetadata: fetching ${fetchUrl}`);

    // 2. Fetch current metadata from IPFS
    const ipfsResp = await axios.get(fetchUrl, { timeout: 10000 });
    const envelope = ipfsResp.data;

    if (!envelope.encrypted)
      return res.status(200).json({ message: 'Metadata is not encrypted — no refresh needed' });

    // 3. Decrypt to recover full image URL and name
    const plaintext = encryptionService.decryptMetadata(envelope);
    const metadata = JSON.parse(plaintext);
    console.log(`refreshTokenMetadata: decrypted token #${tokenId}, name="${metadata.name}"`);

    // 4. Download the full image and blur it for the plaintext preview
    let previewImageUrl = metadata.image;  // fallback: use full image if blur fails
    try {
      const imgResp = await axios.get(metadata.image, { responseType: 'arraybuffer', timeout: 15000 });
      const blurredBuf = await sharp(Buffer.from(imgResp.data)).blur(12).jpeg().toBuffer();
      const blurredTmp = path.join(os.tmpdir(), `token_${tokenId}_preview_${Date.now()}.jpg`);
      fs.writeFileSync(blurredTmp, blurredBuf);
      const blurredIpfs = await uploadToPinata(blurredTmp, path.basename(blurredTmp));
      fs.unlinkSync(blurredTmp);
      previewImageUrl = blurredIpfs.startsWith('http')
        ? blurredIpfs
        : `https://gateway.pinata.cloud/ipfs/${blurredIpfs.replace('ipfs://', '')}`;
      console.log(`refreshTokenMetadata: blurred preview uploaded → ${previewImageUrl}`);
    } catch (blurErr) {
      console.warn(`refreshTokenMetadata: blur failed, using full image as fallback: ${blurErr.message}`);
    }

    // 5. Re-build envelope: blurred image + name in plaintext, financial details stay in ciphertext
    const refreshed = { ...envelope, image: previewImageUrl, name: metadata.name };

    // 5. Write to temp file and upload to IPFS
    const tmpFile = path.join(os.tmpdir(), `token_${tokenId}_refreshed_${Date.now()}.json`);
    fs.writeFileSync(tmpFile, JSON.stringify(refreshed));
    const newIpfsUrl = await uploadToPinata(tmpFile, path.basename(tmpFile));
    fs.unlinkSync(tmpFile);
    const newUri = newIpfsUrl.startsWith('http')
      ? newIpfsUrl
      : `https://gateway.pinata.cloud/ipfs/${newIpfsUrl.replace('ipfs://', '')}`;
    console.log(`refreshTokenMetadata: uploaded new metadata → ${newUri}`);

    // 6. Call setTokenURI on the contract (contract owner signs — setTokenURI is onlyOwner)
    const owner = web3.eth.accounts.privateKeyToAccount(OWNER_PRIVATE_KEY);
    const gasPrice = Math.ceil(Number(await web3.eth.getGasPrice()) * 1.2).toString();
    const data = contract.methods.setTokenURI(parseInt(tokenId), newUri).encodeABI();
    const gas = await contract.methods.setTokenURI(parseInt(tokenId), newUri).estimateGas({ from: owner.address });
    const signed = await web3.eth.accounts.signTransaction(
      { from: owner.address, to: contractAddress, data, gas: Math.ceil(gas * 1.2), gasPrice },
      OWNER_PRIVATE_KEY
    );
    const receipt = await web3.eth.sendSignedTransaction(signed.rawTransaction);
    console.log(`refreshTokenMetadata: setTokenURI tx ${receipt.transactionHash}`);

    return res.json({ message: `Token #${tokenId} metadata refreshed successfully.`, newUri, txHash: receipt.transactionHash });
  } catch (e) {
    console.error('refreshTokenMetadata error:', e.message);
    return res.status(500).json({ message: e.message });
  }
};

// POST /api/dtscf/testmetadata
// Dev-only endpoint: builds the metadata JSON (+ encrypted envelope if chainId given) without
// generating an image or uploading to Pinata. Use this to verify name/description formatting.
exports.testMetadata = (req, res) => {
  require('dotenv').config();
  try {
    const {
      contractAddress = '0xTEST',
      token_ID = 1,
      value = '1000',
      projectname = 'Test Project',
      milestonename = 'Milestone 1',
      MID = 1,
      maturityDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      conditions = 'Upon delivery of goods.',
      originalValue = null,
      purchaseDescription = '',
      chainId = null,
    } = req.body;

    const fmtSGD = v => {
      const n = parseFloat(v);
      return Number.isInteger(n)
        ? n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
        : n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };
    const origFloat = originalValue != null ? parseFloat(originalValue) : null;
    const hasOriginal = origFloat !== null && Math.abs(origFloat - parseFloat(value)) > 0.0001;
    const originalCurrentStr = hasOriginal ? ` (Original: SGD${fmtSGD(origFloat)})` : '';
    const readableMaturity = String(maturityDate).slice(0, 10);
    const midNum = parseInt(MID, 10);

    const metadata = {
      name: `${projectname} - Tokenised Payable #${token_ID}`,
      description: `Tokenised Payable SGD${fmtSGD(value)}${originalCurrentStr}${purchaseDescription ? ` for the purchase of '${purchaseDescription}'` : ''}` +
        (midNum === 0 ? '. ' : `. Milestone ${midNum}. `) +
        `Completion date: ${readableMaturity}. ${String(conditions).trim().replace(/\.+$/, '')}.`,
      image: '[image placeholder — not generated in test mode]',
      attributes: [
        { trait_type: 'Project Name', value: projectname },
        { trait_type: 'Value', value: String(value) },
        ...(hasOriginal ? [
          { trait_type: 'Original Value', value: fmtSGD(origFloat) },
          { trait_type: 'Current Value', value: fmtSGD(value) },
        ] : []),
        { trait_type: 'Milestone Name', value: milestonename },
        { trait_type: 'Milestone ID', value: MID },
        { trait_type: 'Maturity Date', value: readableMaturity },
        { trait_type: 'Conditions', value: conditions },
      ],
    };

    const result = { plaintext: metadata };

    if (chainId) {
      try {
        const envelope = JSON.parse(encryptionService.encryptMetadata(JSON.stringify(metadata)));
        envelope.image = '[blurred preview image — not generated in test mode]';
        envelope.name = metadata.name;
        result.envelope = envelope;
        result.external_view = { name: envelope.name, image: envelope.image };
      } catch (encErr) {
        result.encryption_error = encErr.message;
      }
    }

    return res.json(result);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

// POST /api/dtscf/decryptmetadata
// Body: { contractAddress, tokenId, chainId, signature, message, envelope }
// Verifies the caller holds the token (via MetaMask personal_sign + on-chain balanceOf),
// then decrypts the AES-256-GCM envelope server-side and returns the plaintext metadata.
exports.decryptMetadata = async (req, res) => {
  const { contractAddress, tokenId, chainId, signature, message, envelope } = req.body;

  if (!contractAddress || tokenId == null || !chainId || !envelope) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  // Either a MetaMask signature OR a valid JWT session is required (checked below)
  if (!signature && !req.headers['x-access-token']) {
    return res.status(401).json({ message: 'Provide a MetaMask signature or sign in first' });
  }

  require('dotenv').config();
  let signerAddress;

  if (signature && message) {
    // ── Contractor path: verify MetaMask personal_sign ──
    try {
      signerAddress = ethers.verifyMessage(message, signature);
    } catch (e) {
      return res.status(400).json({ message: 'Invalid signature' });
    }
    // Replay protection: timestamp must be within 5 minutes
    const tsMatch = message.match(/timestamp=(\d+)/);
    if (!tsMatch) return res.status(400).json({ message: 'Message missing timestamp' });
    const msgTs = parseInt(tsMatch[1], 10);
    if (Math.abs(Math.floor(Date.now() / 1000) - msgTs) > 300) {
      return res.status(400).json({ message: 'Signature expired — please retry' });
    }
    console.log(`decryptMetadata [MetaMask path]: recovered signer=${signerAddress}`);
  } else {
    // ── Anchor path: verify JWT session, then use server-held anchor wallet ──
    const jwtLib = require('jsonwebtoken');
    const authConfig = require('../config/auth.config');
    const token = req.headers['x-access-token'];
    if (!token) return res.status(401).json({ message: 'Authentication required' });
    let decoded;
    try {
      decoded = jwtLib.verify(token, authConfig.secret);
    } catch (e) {
      return res.status(401).json({ message: 'Invalid or expired session' });
    }
    // Confirm user has anchor role
    const user = await db.user.findByPk(decoded.id);
    if (!user) return res.status(401).json({ message: 'User not found' });
    const roles = await user.getRoles();
    const isAnchor = roles.some(r => r.name.toLowerCase() === 'anchor');
    if (!isAnchor) return res.status(403).json({ message: 'Session auth is only available for anchor users' });
    const anchorPrivKey = process.env.REACT_APP_ANCHOR_PRIVATE_KEY;
    if (!anchorPrivKey) return res.status(500).json({ message: 'Anchor key not configured on server' });
    signerAddress = new ethers.Wallet(anchorPrivKey).address;
    console.log(`decryptMetadata [JWT path]: anchor wallet=${signerAddress}`);
  }

  console.log(`decryptMetadata: contract=${contractAddress} tokenId=${tokenId} chainId=${chainId} signer=${signerAddress}`);

  // 3. Verify ownership — on-chain balanceOf is the sole gate for all roles
  const ALCHEMY_API_KEY = process.env.REACT_APP_ALCHEMY_API_KEY;
  const RPC_BY_CHAIN = {
    11155111: process.env.SEPOLIA_RPC_URL  || `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    80002:    process.env.AMOY_RPC_URL     || `https://polygon-amoy.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    137:      `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    80001:    `https://polygon-mumbai.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
  };
  const rpcUrl = RPC_BY_CHAIN[parseInt(chainId)];
  if (!rpcUrl) return res.status(400).json({ message: `Unsupported chainId: ${chainId}` });

  try {
    const Web3 = require('web3');
    const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
    const ABI = JSON.parse(fs.readFileSync(abiFile, 'utf8'));
    const contract = new web3.eth.Contract(ABI, contractAddress);
    const balance = await contract.methods.balanceOf(signerAddress, tokenId).call();
    console.log(`decryptMetadata: balanceOf(${signerAddress}, ${tokenId}) = ${balance}`);
    if (BigInt(balance) < 1n) {
      console.log(`decryptMetadata: access denied — balanceOf(${signerAddress}, ${tokenId}) = 0`);
      return res.status(403).json({ message: 'Access denied: wallet does not hold this token' });
    }
  } catch (e) {
    console.error('decryptMetadata: on-chain balance check failed:', e.message);
    return res.status(500).json({ message: 'Could not verify token ownership on-chain' });
  }
  // 4. Decrypt
  try {
    const plaintext = encryptionService.decryptMetadata(envelope);
    return res.json(JSON.parse(plaintext));
  } catch (e) {
    console.error('decryptMetadata: decryption failed:', e.message);
    return res.status(500).json({ message: 'Decryption failed' });
  }
};

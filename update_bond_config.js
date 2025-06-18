const Web3 = require('web3');
const fs = require('fs');
require('dotenv').config();

async function updateBondConfig() {
  // Validate environment variables
  const requiredEnvVars = ['REACT_APP_SIGNER_PRIVATE_KEY', 'REACT_APP_INFURA_API_KEY'];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing environment variable: ${envVar}`);
    }
  }

  // Validate private key format
  const privateKey = process.env.REACT_APP_SIGNER_PRIVATE_KEY;

  const providerUrl = `https://sepolia.infura.io/v3/${process.env.REACT_APP_INFURA_API_KEY}`;
  const web3 = new Web3(providerUrl);
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  web3.eth.accounts.wallet.add(account);

  console.log('Using account:', account.address);

  const bondTokenAddr = '0x481CBfd7119F65E56d2c82Df3199f8C921851d6d'; 
  if (!web3.utils.isAddress(bondTokenAddr)) {
    throw new Error('Invalid bond contract address');
  }

  const ABI = JSON.parse(fs.readFileSync('./server/app/abis/ERC20Bond_new.abi.json').toString());
  const bondContract = new web3.eth.Contract(ABI, bondTokenAddr);

  const config = {
    securityName: 'SEAL 2.55 28/3/2028',
    isinNumber: 'XX12345678',
    faceValue: '100000000000000000000', // 100 * 10^18
    couponRate: 255, // 2.55% = 255 basis points
    couponInterval: 15768000, // ~182.5 days
    issueDate: 1743120000, // March 28, 2025, in seconds
    maturityDate: 1837814400, // March 28, 2028, in seconds
    issuer: 'French Bank',
    totalSupply: '100000000000000000000000000000', // Current total supply
    cashToken: '0x7db290a32832B740E602465024c63F887a2b0A91',
    prospectusUrl: 'https://whatever.com'
  };

  try {
    // Verify connection
    const blockNumber = await web3.eth.getBlockNumber();
    console.log('Connected to blockchain, current block:', blockNumber);

    // Estimate gas
    const gasEstimate = await bondContract.methods
      .updateBondConfig(config)
      .estimateGas({ from: account.address });
    console.log('Estimated gas:', gasEstimate);

    // Apply 10% buffer and ensure integer
    const gasWithBuffer = Math.ceil(gasEstimate * 1.1);
    console.log('Gas with 10% buffer:', gasWithBuffer);

    // Check account balance
    const balance = await web3.eth.getBalance(account.address);
    console.log('Account balance (wei):', balance, '(', web3.utils.fromWei(balance, 'ether'), 'ETH)');

    // Send transaction
    const tx = await bondContract.methods
      .updateBondConfig(config)
      .send({ from: account.address, gas: gasWithBuffer });
    console.log('Config updated, tx hash:', tx.transactionHash);

    // Verify updated config
    const updatedConfig = await bondContract.methods.config().call();
    console.log('Updated config:', updatedConfig);
    const couponCount = await bondContract.methods.couponCount().call();
    console.log('Updated couponCount:', couponCount);
  } catch (err) {
    console.error('Error updating config:', err.message);
    throw err;
  }
}

updateBondConfig()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Script failed:', err.message);
    process.exit(1);
  });
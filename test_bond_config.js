const Web3 = require('web3');
const fs = require('fs');
require('dotenv').config();

const INFURA_API_KEY = process.env.REACT_APP_INFURA_API_KEY;
const provider = `https://sepolia.infura.io/v3/${INFURA_API_KEY}`;
const web3 = new Web3(new Web3.providers.HttpProvider(provider));
const bondTokenAddr = '0x481CBfd7119F65E56d2c82Df3199f8C921851d6d';
const ABI = JSON.parse(fs.readFileSync('./server/app/abis/ERC20Bond_new.abi.json').toString());

async function testConfig() {
  try {
    const bondContract = new web3.eth.Contract(ABI, bondTokenAddr);
    console.log('Fetching config...');
    const config = await bondContract.methods.config().call();
    console.log('Config:', config);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testConfig();
const Web3 = require('web3');
require('dotenv').config();

const INFURA_API_KEY = process.env.REACT_APP_INFURA_API_KEY;
//console.log('INFURA_API_KEY:', INFURA_API_KEY);
const provider = `https://sepolia.infura.io/v3/${INFURA_API_KEY}`;
const web3 = new Web3(provider);
web3.eth.getBlockNumber()
  .then(block => console.log('Current block:', block))
  .catch(err => console.error('Error:', err.message));
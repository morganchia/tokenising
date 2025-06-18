const Web3 = require('web3');
const web3 = new Web3('https://sepolia.infura.io/v3/9e5e7f94e05c4a7ea7bc11400626dc0b');
const bridgeDestAbi = require('../src/abis/BridgeDestination.json').abi;
const bridgeDest = new web3.eth.Contract(bridgeDestAbi, '0xf5B4Dd90D3154FB7c6315800fB1630465e431Bb2');
bridgeDest.methods.wrappedCBDC().call()
  .then(address => console.log(`WrappedCBDC address: ${address}`))
  .catch(err => console.error('Error fetching wrappedCBDC:', err.message));
bridgeDest.methods.setWrappedCBDC // Check if function exists
  ? console.log('setWrappedCBDC function exists')
  : console.log('setWrappedCBDC function does not exist');
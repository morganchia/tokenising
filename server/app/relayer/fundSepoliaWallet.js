// Fund user address with Sepolia ETH for gas fees

const Web3 = require('web3');
require('dotenv').config();

const web3 = new Web3(process.env.SEPOLIA_RPC_URL);

async function fund(address, amountInEth = "0.05") {
    const amount = web3.utils.toWei(amountInEth, 'ether');

    const tx = {
        from: process.env.ADMIN_ADDRESS,
        to: address,
        value: amount,
        gas: 21000,
    };

    const signed = await web3.eth.accounts.signTransaction(tx, process.env.ADMIN_PRIVATE_KEY);
    const receipt = await web3.eth.sendSignedTransaction(signed.rawTransaction);
    console.log(`Funded ${address} with ${amountInEth} Sepolia ETH`);
}

const addressToFund = process.argv[2];
if (!addressToFund) {
    console.error("Please provide an address");
    process.exit(1);
}

fund(addressToFund);

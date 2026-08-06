module.exports = {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: { enabled: true, runs: 200 },
            viaIR: true
        }
    },
    networks: {
        sepolia: {
            //url: `https://sepolia.infura.io/v3/${process.env.REACT_APP_INFURA_API_KEY}`,
            url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}`,
            accounts: [process.env.REACT_APP_SIGNER_PRIVATE_KEY]
        }
    }
};
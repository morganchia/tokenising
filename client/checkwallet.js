// https://www.quicknode.com/guides/web3-sdks/how-to-get-the-balance-of-an-erc-20-token

const Web3 = require("web3");

const ETHEREUM_NETWORK = "polygon-mumbai";
const INFURA_API_KEY = "719cca812e274e8fad2ad8b574891343";

const provider = `https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`

const Web3Client = new Web3(new Web3.providers.HttpProvider(provider));

// https://ethereum.stackexchange.com/questions/54960/web3-getting-variable-value-from-deployed-contract-without-abi
// The minimum ABI required to get the ERC20 Token balance
const minABI1 = [
  // balanceOf
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  // Minted
  {
    "inputs": [],
    "name": "_incirculation",
    "outputs": [
        {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
        }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // total supply
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [
        {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
        }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // Symbol
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "name": "",
        "type": "string"
      }
    ],
    "payable": false,
    "type": "function"
  },  
];

const tokenAddress = [
  "0xAEf00AaF9586C5c30c49f4b97Ab17cC7A297d5E4", // AAA
  "0x899968AAc26eB3eF6052A64DEf512E6030F361e0", // DSGD
]

const TokenID=1;
const walletAddress = "0x357f4976bd4567fcb34fc637ec5d41a0140551d3";

async function getBalanceInWallet(_tokenAddress, _walletAddress) {
  console.log("Querying token: ", _tokenAddress);
  console.log("From wallet: ", _walletAddress);
  const contract1 = new Web3Client.eth.Contract(minABI1, _tokenAddress);

  const inWallet = await contract1.methods.balanceOf(_walletAddress).call(); 
  console.log("In Wallet: ", await Web3Client.utils.fromWei(inWallet));

  const totalMinted = await contract1.methods._incirculation().call(); 
  console.log("total Minted: ", await Web3Client.utils.fromWei(totalMinted));

  const totalSupply = await contract1.methods.totalSupply().call(); 
  console.log("total Supply: ", await Web3Client.utils.fromWei(totalSupply));
}

async function getSymbol(_tokenAddress) {
  const contract2 = new Web3Client.eth.Contract(minABI1, _tokenAddress);
  const symbol = await contract2.methods.symbol().call();
  console.log(symbol);
}

getBalanceInWallet(tokenAddress[TokenID], walletAddress);
getSymbol(tokenAddress[TokenID]);

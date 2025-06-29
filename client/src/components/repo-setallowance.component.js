import React, { Component } from "react";
import Web3 from 'web3';
import './uniswap.css';

import repoContract_jsonData from '../abis/ERC20TokenRepo.abi.json';
import cashToken_jsonData from '../abis/ERC20TokenDSGD.abi.json';
import bondToken_jsonData from '../abis/ERC20Bond_new.abi.json';
import Token1_jsonData from '../abis/ERC20TokenDSGD.abi.json';
import Token2_jsonData from '../abis/ERC20Bond_new.abi.json';

import Modal from '../Modal.js';
import LoadingSpinner from "../LoadingSpinner.js";
import "../LoadingSpinner.css";

export default class repocouponallowance extends Component {
  constructor(props) {
    super(props);
    this.onChangeApproveTokenAmount1 = this.onChangeApproveTokenAmount1.bind(this);
    this.onChangeApproveTokenAmount2 = this.onChangeApproveTokenAmount2.bind(this);
    this.onChangeSmartContract = this.onChangeSmartContract.bind(this);
    this.onChangeNetwork = this.onChangeNetwork.bind(this);
    this.askUser2SignTxn = this.askUser2SignTxn.bind(this);

    this.state = {
      RepoType: "",
      content: "",
      approve_token_amount1: "",
      approve_token_amount2: "",
      TokenBalance: 0,
      Token1Balance: 0,
      Token2Balance: 0,
      TokenBalanceLeg1: 0,
      TokenBalanceLeg2: 0,
      TokenRequiredLeg1: 0,
      TokenRequiredLeg2: 0,
      TokenAbiLeg2: "",
      TokenAbiLeg1: "",
      symbolLeg1: "",
      symbolLeg2: "",
      deployedContract: "",
      account: "",
      balance: "",
      name: "",
      symbol1: "",
      symbol2: "",
      walleterror: false,
      eventover: false,
      REPOsmartcontractaddress: "",
      selectedNetwork: "",
      connectionStatus: "",
      tradeDetails: null,
      connectedAccount: "",
      Token1Addr: "",
      Token2Addr: "",
      TokenAddr: "",
      TokenAddrLeg1: "",
      TokenAddrLeg2: "",
      Token2Owner: "",
    };

    this.networkOptions = [
      { name: "Sepolia Testnet", chainId: "0xaa36a7" }, // 11155111
      { name: "Amoy Testnet", chainId: "0x13882" }, // 80002
//      { name: "Ethereum Mainnet", chainId: "0x1" }, // 1
//      { name: "Polygon Mainnet", chainId: "0x89" }, // 137
    ];
  }

  componentDidMount() {
    const loadWeb3 = async () => {
      if (window.ethereum) {
        window.web3 = new Web3(window.ethereum);
        const networkId = await window.web3.eth.net.getId();
        const network = this.networkOptions.find(opt => parseInt(opt.chainId, 16) === networkId);
        this.setState({ selectedNetwork: network ? network.name : "" });
        this.refreshData();
      } else if (window.web3) {
        window.web3 = new Web3(window.web3.currentProvider);
      } else {
        window.alert('Non-Ethereum browser detected. Please connect using MetaMask or EIP-1193 compatible wallet.');
        this.setState({ walleterror: true });
      }

      this.setupMetaMaskAccountListener();
    };

    const loadBlockchainData = async () => {
      const web3 = window.web3;
      const networkId = await web3.eth.net.getId();
      console.log("Current Network ID:", networkId);
      if (![1, 137, 80002, 11155111].includes(networkId)) {
        this.setState({ walleterror: true });
      }
    };

    const load = async () => {
      await loadWeb3();
      await loadBlockchainData();
    };
    load();
  }

  componentWillUnmount() {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.removeListener('accountsChanged', this.handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', this.handleChainChanged);
    }
  }

  onChangeNetwork = async (e) => {
    const networkName = e.target.value;
    this.setState({ selectedNetwork: networkName });

    const network = this.networkOptions.find(opt => opt.name === networkName);
    if (network) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: network.chainId }],
        });
        console.log(`Switched to ${networkName}`);
        this.refreshData();
      } catch (error) {
        console.error("Error switching network:", error);
        this.setState({
          connectionStatus: `Failed to switch network: ${error.message}`,
          tradeDetails: null,
          Token1Addr: "",
          Token2Addr: "",
          symbolLeg1: "",
          symbolLeg2: "",
          TokenBalanceLeg1: 0,
          TokenBalanceLeg2: 0,
          TokenRequiredLeg1: 0,
          TokenRequiredLeg2: 0,
          TokenAbiLeg2: "",
          TokenAbiLeg1: "",
          TokenAddrLeg1: "",
          TokenAddrLeg2: "",
          approve_token_amount1: "",
          approve_token_amount2: "",
        });
        this.displayModal(`Failed to switch network: ${error.message}`, null, null, null, "OK");
      }
    }
  };
  
  clearState(status) {
    this.setState({
      connectionStatus: status,
      tradeDetails: null,
      Token1Addr: "",
      Token2Addr: "",
      symbolLeg1: "",
      symbolLeg2: "",
      TokenBalanceLeg1: 0,
      TokenBalanceLeg2: 0,
      TokenRequiredLeg1: 0,
      TokenRequiredLeg2: 0,
      TokenAbiLeg2: "",
      TokenAbiLeg1: "",
      TokenAddrLeg1: "",
      TokenAddrLeg2: "",
      approve_token_amount1: "",
      approve_token_amount2: "",
    });
  }

  refreshData = async () => {
    try {
      const web3 = window.web3;
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      this.setState({ connectedAccount: accounts[0] });
      console.log("ConnectedAccount:", accounts[0]);

      if (this.state.REPOsmartcontractaddress && Web3.utils.isAddress(this.state.REPOsmartcontractaddress)) {
        const code = await web3.eth.getCode(this.state.REPOsmartcontractaddress);
        if (code === '0x') {
          this.clearState("No contract deployed at the specified address.");
/*
          this.setState({
            connectionStatus: "No contract deployed at the specified address.",
            tradeDetails: null,
            Token1Addr: "",
            Token2Addr: "",
            symbolLeg1: "",
            symbolLeg2: "",
            TokenBalanceLeg1: 0,
            TokenBalanceLeg2: 0,
            TokenRequiredLeg1: 0,
            TokenRequiredLeg2: 0,
            TokenAbiLeg2: "",
            TokenAbiLeg1: "",
            TokenAddrLeg1: "",
            TokenAddrLeg2: "",
            approve_token_amount1: "",
            approve_token_amount2: "",
          });
*/
          return;
        }

        const RepoContract_abi = JSON.parse(JSON.stringify(repoContract_jsonData));
        const RepoContract = new web3.eth.Contract(RepoContract_abi, this.state.REPOsmartcontractaddress);

        const tradeCount = await RepoContract.methods.tradeCount().call();
        if (tradeCount < 1) {
          this.clearState("No trades exist in the smart contract.");
/*
          this.setState({
            connectionStatus: "No trades exist in the smart contract.",
            tradeDetails: null,
            Token1Addr: "",
            Token2Addr: "",
            symbolLeg1: "",
            symbolLeg2: "",
            TokenBalanceLeg1: 0,
            TokenBalanceLeg2: 0,
            TokenRequiredLeg1: 0,
            TokenRequiredLeg2: 0,
            TokenAbiLeg2: "",
            TokenAbiLeg1: "",
            TokenAddrLeg1: "",
            TokenAddrLeg2: "",
            approve_token_amount1: "",
            approve_token_amount2: "",
          });
*/
          return;
        }

        let tradeDetails;
        try {
          const basics = await RepoContract.methods.getTradeBasicsSGT(1).call();
          const details = await RepoContract.methods.getTradeDetails(1).call();
          const endDate = await RepoContract.methods.getEndDateSGT().call();
          tradeDetails = {
            tradeId: basics[0],
            startDateTime: parseInt(basics[1]),
            maturityDateTime: parseInt(basics[2]),
            bondIsin: basics[3],
            counterparty1RepoType: basics[4],
            startAmount: basics[5],
            interestAmount: basics[6],
            bondAmount: basics[7],
            cashAmount: basics[8],
            status: basics[9],
            counterparty1: details[1],
            counterparty2: details[2],
            cashToken: details[3],
            bondToken: details[4],
            endDate: parseInt(endDate) !== 0 ? parseInt(endDate) : null
          };

          console.log("Trade Details:", tradeDetails);

          const counterparty1 = tradeDetails.counterparty1;
          const counterparty2 = tradeDetails.counterparty2;
          const repotype = parseInt(tradeDetails.counterparty1RepoType) === 0 ? "Repo" : "Reverse Repo";
          const Token1Addr = repotype === "Repo" ? tradeDetails.bondToken : tradeDetails.cashToken;
          const Token2Addr = repotype === "Repo" ? tradeDetails.cashToken : tradeDetails.bondToken;

          const Token1_abi = repotype === "Repo" ? JSON.parse(JSON.stringify(bondToken_jsonData)) : JSON.parse(JSON.stringify(cashToken_jsonData));
          const Token2_abi = repotype === "Repo" ? JSON.parse(JSON.stringify(cashToken_jsonData)) : JSON.parse(JSON.stringify(bondToken_jsonData));

          let balance1 = 0, balance2 = 0, symbol1 = "Unknown", symbol2 = "Unknown";
          try {
            const tokenInst1 = new web3.eth.Contract(Token1_abi, Token1Addr);
            balance1 = await tokenInst1.methods.balanceOf(accounts[0]).call();
            symbol1 = await tokenInst1.methods.symbol().call();
          } catch (token1Err) {
            console.log(`Failed to fetch Token1 (${Token1Addr}) data: ${token1Err.message}`);
            this.clearState(`Failed to fetch Token1 data: ${token1Err.message}`);
/*
            this.setState({
              connectionStatus: `Failed to fetch Token1 data: ${token1Err.message}`,
              tradeDetails: null,
              Token1Addr: "",
              Token2Addr: "",
              symbolLeg1: "",
              symbolLeg2: "",
              TokenBalanceLeg1: 0,
              TokenBalanceLeg2: 0,
              TokenRequiredLeg1: 0,
              TokenRequiredLeg2: 0,
              TokenAbiLeg2: "",
              TokenAbiLeg1: "",
              TokenAddrLeg1: "",
              TokenAddrLeg2: "",
              approve_token_amount1: "",
              approve_token_amount2: "",
            });
*/
            return;
          }

          try {
            const tokenInst2 = new web3.eth.Contract(Token2_abi, Token2Addr);
            balance2 = await tokenInst2.methods.balanceOf(accounts[0]).call();
            symbol2 = await tokenInst2.methods.symbol().call();
          } catch (token2Err) {
            console.log(`Failed to fetch Token2 (${Token2Addr}) data: ${token2Err.message}`);
            this.clearState(`Failed to fetch Token2 data: ${token2Err.message}`);
/*
            this.setState({
              connectionStatus: `Failed to fetch Token2 data: ${token2Err.message}`,
              tradeDetails: null,
              Token1Addr: "",
              Token2Addr: "",
              symbolLeg1: "",
              symbolLeg2: "",
              TokenBalanceLeg1: 0,
              TokenBalanceLeg2: 0,
              TokenRequiredLeg1: 0,
              TokenRequiredLeg2: 0,
              TokenAbiLeg2: "",
              TokenAbiLeg1: "",
              TokenAddrLeg1: "",
              TokenAddrLeg2: "",
              approve_token_amount1: "",
              approve_token_amount2: "",
            });
*/
            return;
          }

          let stateUpdate = {
            RepoType: repotype,
            Token1Addr,
            Token2Addr,
            Token1Balance: balance1 / 1e18,
            Token2Balance: balance2 / 1e18,
            symbol1,
            symbol2,
            tradeDetails,
            REPOsmartcontractaddress: this.state.REPOsmartcontractaddress,
          };

          if (accounts[0].toUpperCase() === counterparty1.toUpperCase()) {
            if (repotype === "Repo") {
              stateUpdate = {
                ...stateUpdate,
                TokenAddrLeg1: Token1Addr,
                TokenAddrLeg2: Token2Addr,
                TokenBalanceLeg1: balance1 / 1e18,
                TokenBalanceLeg2: balance2 / 1e18,
                symbolLeg1: symbol1,
                symbolLeg2: symbol2,
                TokenRequiredLeg1: tradeDetails.bondAmount / 1e18,
                TokenRequiredLeg2: (tradeDetails.interestAmount / 1e18) + (tradeDetails.cashAmount / 1e18),
                TokenAbiLeg1: cashToken_jsonData,
                TokenAbiLeg2: bondToken_jsonData,
                approve_token_amount1: tradeDetails.bondAmount / 1e18,
                approve_token_amount2: ((tradeDetails.interestAmount / 1e18) + (tradeDetails.cashAmount / 1e18)).toFixed(2),
                connectionStatus: `Connected to Counterparty1's wallet, with Token[${symbol1}]`,
              };
            } else {
              stateUpdate = {  // Reverse Repo
                ...stateUpdate,
                TokenAddrLeg1: Token1Addr,
                TokenAddrLeg2: Token2Addr,
                TokenBalanceLeg1: balance1 / 1e18,
                TokenBalanceLeg2: balance2 / 1e18,
                symbolLeg1: symbol1,
                symbolLeg2: symbol2,
                TokenRequiredLeg1: tradeDetails.cashAmount / 1e18,
                TokenRequiredLeg2: tradeDetails.bondAmount / 1e18,
                TokenAbiLeg1: cashToken_jsonData,
                TokenAbiLeg2: bondToken_jsonData,
                approve_token_amount1: tradeDetails.cashAmount / 1e18,
                approve_token_amount2: tradeDetails.bondAmount / 1e18,
                connectionStatus: `Connected to Counterparty1's wallet, with Token[${symbol1}]`,
              };
            }
          } else if (accounts[0].toUpperCase() === counterparty2.toUpperCase()) {
            if (repotype === "Repo") {
              stateUpdate = {
                ...stateUpdate,
                TokenAddrLeg1: Token2Addr,
                TokenAddrLeg2: Token1Addr,
                TokenBalanceLeg1: balance2 / 1e18,
                TokenBalanceLeg2: balance1 / 1e18,
                symbolLeg1: symbol2,
                symbolLeg2: symbol1,
                TokenRequiredLeg1: tradeDetails.cashAmount / 1e18,
                TokenRequiredLeg2: tradeDetails.bondAmount / 1e18,
                TokenAbiLeg2: cashToken_jsonData,
                TokenAbiLeg1: bondToken_jsonData,
                approve_token_amount1: tradeDetails.cashAmount / 1e18,
                approve_token_amount2: tradeDetails.bondAmount / 1e18,
                connectionStatus: `Connected to Counterparty2's wallet, with Token[${symbol2}]`,
              };
            } else {
              stateUpdate = {  // Reverse Repo
                ...stateUpdate,
                TokenAddrLeg1: Token2Addr,
                TokenAddrLeg2: Token1Addr,
                TokenBalanceLeg1: balance2 / 1e18,
                TokenBalanceLeg2: balance1 / 1e18,
                symbolLeg1: symbol2,
                symbolLeg2: symbol1,
                TokenRequiredLeg1: tradeDetails.bondAmount / 1e18,
                TokenRequiredLeg2: (tradeDetails.interestAmount / 1e18) + (tradeDetails.cashAmount / 1e18),
                TokenAbiLeg2: cashToken_jsonData,
                TokenAbiLeg1: bondToken_jsonData,
                approve_token_amount1: tradeDetails.bondAmount / 1e18,
                approve_token_amount2: ((tradeDetails.interestAmount / 1e18) + (tradeDetails.cashAmount / 1e18)).toFixed(2),
                connectionStatus: `Connected to Counterparty2's wallet, with Token[${symbol2}]`,
              };
            }
          } else {
            stateUpdate = {
              ...stateUpdate,
              connectionStatus: "You have connected a wallet which is not used in the Repo smart contract, please connect a wallet that belongs to either Counter Party.",
            };
          }

          this.setState(stateUpdate);
        } catch (err) {
          console.log('Failed to fetch trade: ' + err.message);
          this.clearState(`Failed to fetch trade details: ${err.message}. Please verify the contract address and trade ID.`);
/*
          this.setState({
            connectionStatus: `Failed to fetch trade details: ${err.message}. Please verify the contract address and trade ID.`,
            tradeDetails: null,
            Token1Addr: "",
            Token2Addr: "",
            symbolLeg1: "",
            symbolLeg2: "",
            TokenBalanceLeg1: 0,
            TokenBalanceLeg2: 0,
            TokenRequiredLeg1: 0,
            TokenRequiredLeg2: 0,
            TokenAbiLeg2: "",
            TokenAbiLeg1: "",
            TokenAddrLeg1: "",
            TokenAddrLeg2: "",
            approve_token_amount1: "",
            approve_token_amount2: "",
          });
*/
        }
      }
    } catch (error) {
      console.log(error);
      this.setState({
        connectionStatus: `Error connecting to wallet or contract: ${error.message}`,
      });
    }
  };

  setupMetaMaskAccountListener = () => {
    const ethereum = window.ethereum;
    if (typeof ethereum !== 'undefined') {
      this.handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          console.log('Selected account changed:', accounts[0]);
          this.refreshData();
        }
      };
      this.handleChainChanged = (chainId) => {
        console.log('Network changed:', chainId);
        const network = this.networkOptions.find(opt => opt.chainId === chainId);
        this.setState({ selectedNetwork: network ? network.name : "" });
        this.refreshData();
      };
      ethereum.on('accountsChanged', this.handleAccountsChanged);
      ethereum.on('chainChanged', this.handleChainChanged);
    }
  };

  askUser2SignTxn = async (token_addr, token_amount, symbol, jsonData) => {
    const web3 = window.web3;
    const Token1_abi = JSON.parse(JSON.stringify(jsonData));
    const Token = new web3.eth.Contract(Token1_abi, token_addr);
    const spenderAddr1 = this.state.REPOsmartcontractaddress;
    const connectedAccount = this.state.connectedAccount;

    console.log("jsonData:", jsonData);

    const BN = require('bn.js');
    const amountToSend = new BN(Math.ceil(token_amount)).mul(new BN("1000000000000000000"));

    console.log("Token Amount to Approve:", token_amount, "Converted Amount:", amountToSend.toString());

    try {
    // Check account balance
    const balance = await web3.eth.getBalance(connectedAccount);
    if (web3.utils.fromWei(balance, 'ether') < 0.01) {
      this.displayModal("Insufficient crypto for gas fees. Please fund your wallet.", null, null, null, "OK");
      return;
    }

    // Simulate transaction to catch potential reverts
    try {
      await Token.methods.approve(spenderAddr1, amountToSend.toString()).call({ from: connectedAccount });
      console.log("Transaction simulation successful");
    } catch (err) {
      console.error("Simulation failed:", err);
      this.displayModal(`Transaction will fail: ${err.message}. Check token or contract address.`, null, null, null, "OK");
      return;
    }

// Estimate gas limit with retry logic
    let gasLimit;
    const maxRetries = 3;
    let retryCount = 0;
    const baseDelay = 1000; // 1 second base delay for retries

    while (retryCount < maxRetries) {
      try {
        gasLimit = await Token.methods.approve(spenderAddr1, amountToSend.toString()).estimateGas({
          from: connectedAccount
        });
        // Add a 20% buffer to the estimated gas
        gasLimit = Math.floor(gasLimit * 1.2);
        console.log("Estimated Gas Limit (with 20% buffer):", gasLimit);
        break; // Exit loop on success
      } catch (err) {
        retryCount++;
        console.error(`Gas estimation attempt ${retryCount} failed:`, err.message);
        if (err.message.includes("Request is being rate limited") && retryCount < maxRetries) {
          const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff
          console.log(`Rate limited, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          console.error("Gas estimation failed after retries:", err);
          // Use fallback gas limit
          gasLimit = 100000; // Reasonable default for ERC20 approve
          console.log("Using fallback gas limit:", gasLimit);
          this.displayModal(
            `Gas estimation failed due to rate limiting or other error: ${err.message}. Using fallback gas limit of ${gasLimit}.`,
            null, null, null, "OK"
          );
          break;
        }
      }
    }

    if (!gasLimit) {
      this.displayModal("Failed to estimate gas after retries. Please try again later.", null, null, null, "OK");
      return;
    }

    // Get dynamic gas price
    let gasPrice;
    try {
      gasPrice = await web3.eth.getGasPrice();
      console.log("Current Gas Price:", web3.utils.fromWei(gasPrice, 'gwei'), "Gwei");
    } catch (err) {
      console.error("Gas price fetch failed:", err);
      gasPrice = web3.utils.toWei('30', 'gwei'); // Fallback gas price
      console.log("Using fallback gas price:", web3.utils.fromWei(gasPrice, 'gwei'), "Gwei");
      this.displayModal(
        `Failed to fetch gas price: ${err.message}. Using fallback gas price of 30 Gwei.`,
        null, null, null, "OK"
      );
    }

    // Send the transaction
    await Token.methods.approve(spenderAddr1, amountToSend.toString()).send({
        from: connectedAccount,
        gasLimit: gasLimit,
        gasPrice: Math.max(gasPrice, web3.utils.toWei('30', 'gwei')) // Ensure minimum gas price
      }).on('transactionHash', (hash) => {
        console.log("Transaction Hash:", hash);
        this.displayModal(`Transaction submitted: ${hash}. Waiting for confirmation...`, null, null, null, "OK");      
      }).on('receipt', async (receipt) => {
        console.log("Approval Receipt:", receipt);
        await Token.methods.allowance(connectedAccount, spenderAddr1).call().then((allowance) => {
          console.log("Allowance set:", allowance);
          this.displayModal(
            `Successfully approved ${parseFloat(token_amount).toLocaleString()} ${symbol} tokens for the Repo smart contract.`,
            null, null, null, "OK"
          );
        });
      }).on('error', (error) => {
        console.error("Transaction Error:", error);
        let errMsg = error.message;
        if (errMsg.includes("not mined within 50 blocks")) {
          errMsg = "Transaction was not mined within 50 blocks. Check the transaction status on the block explorer or try increasing the gas price.";
        }
        if (errMsg.includes("User denied transaction signature")) {
          errMsg = "You have denied the transaction signature in Metamask. Please try again.";
        } else if (errMsg.includes("Execution prevented because the circuit breaker is open")) {
          errMsg = "Execution prevented because Metamask internal error, please restart Metamask and try again later.";
        } else if (errMsg.includes("Insufficient token")) {
          errMsg = "You have insufficient tokens in your wallet.";
        }

        this.displayModal(`Transaction failed: ${errMsg}`, null, null, null, "OK");
      });
    } catch (err) {
      console.log("Error approving in Metamask: ", err);
      let errMsg = err.message;
      if (errMsg.includes("User denied transaction signature")) {
        errMsg = "You have denied the transaction signature in Metamask. Please try again.";
      } else if (errMsg.includes("Execution prevented because the circuit breaker is open")) {
        errMsg = "Execution prevented because Metamask internal error, please restart Metamask and try again later.";
      } else if (errMsg.includes("Insufficient token")) {
        errMsg = "You have insufficient tokens in your wallet.";
      }
      this.displayModal("Error approving in Metamask: " + errMsg, null, null, null, "OK");
    }
  };

  onChangeApproveTokenAmount1(e) {
    this.setState({
      approve_token_amount1: e.target.value,
      datachanged: true
    });
  }

  onChangeApproveTokenAmount2(e) {
    this.setState({
      approve_token_amount2: e.target.value,
      datachanged: true
    });
  }

  onChangeSmartContract(e) {
    const address = e.target.value;
    console.log("Entered Smart Contract Address:", address);
    this.setState({
      REPOsmartcontractaddress: address,
      datachanged: true
    }, () => {
      if (Web3.utils.isAddress(address)) {
        this.refreshData();
      } else {
        this.setState({
          connectionStatus: "Invalid smart contract address. Please enter a valid Ethereum address.",
          tradeDetails: null,
          Token1Addr: "",
          Token2Addr: "",
          symbolLeg1: "",
          symbolLeg2: "",
          TokenBalanceLeg1: 0,
          TokenBalanceLeg2: 0,
          TokenRequiredLeg1: 0,
          TokenRequiredLeg2: 0,
          approve_token_amount1: "",
          approve_token_amount2: "",
        });
      }
    });
  }

  displayModal(msg, b1text, b2text, b3text, b0text) {
    this.setState({
      showm: true,
      modalmsg: msg,
      button1text: b1text,
      button2text: b2text,
      button3text: b3text,
      button0text: b0text,
    });
  }

  hideModal = () => {
    this.setState({ showm: false });
  };

  render() {
    return (
      <center>
        <div className="outer">
          <div className="swap-container">
            <h1>Approve Repo Smart Contract to Pull Tokens from my Wallet</h1>
            <br/>
            <form className="swap-form">
              <div className="input-group">
                <label htmlFor="networkSelect">Select Network</label>
                <select
                  onChange={this.onChangeNetwork}
                  className="select"
                  id="networkSelect"
                  value={this.state.selectedNetwork}
                >
                  <option value="">Select a network</option>
                  {this.networkOptions.map((network) => (
                    <option key={network.chainId} value={network.name} selected={this.state.networkId === network.chainId}>
                      {network.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label htmlFor="Reposmartcontract">Enter Repo Smart Contract Address</label>
                <input
                  type="text"
                  className="input"
                  id="Reposmartcontract"
                  placeholder="0x..."
                  value={this.state.REPOsmartcontractaddress}
                  onChange={this.onChangeSmartContract}
                />
              </div>

              {this.state.connectedAccount && (
                <>
                  <div className="input-group">
                    <label style={{color: 'blue'}}><small>{this.state.connectionStatus}</small></label>
                  </div>
                </>
              )}
              <div className="input-group">
                <label htmlFor="approve_token_amount1">
                  <small>
                    Set Allowance for Start Trade (First leg) [required: {this.state.TokenRequiredLeg1.toLocaleString()}, balance: {this.state.TokenBalanceLeg1.toLocaleString()} {this.state.symbolLeg1} tokens]
                  </small>
                </label>
                <input
                  type="number"
                  id="approve_token_amount1"
                  placeholder="0"
                  min="0"
                  value={this.state.approve_token_amount1}
                  onChange={this.onChangeApproveTokenAmount1}
                  disabled={this.state.REPOsmartcontractaddress === "" || !Web3.utils.isAddress(this.state.REPOsmartcontractaddress)}
                />
                <label><small>{this.state.TokenAddrLeg1}</small></label>
              </div>
              <button
                type="button"
                className={(this.state.REPOsmartcontractaddress === "" || !Web3.utils.isAddress(this.state.REPOsmartcontractaddress) || this.state.approve_token_amount1 <= 0) ? "uniswapdisabled" : "uniswap"}
                disabled={this.state.REPOsmartcontractaddress === "" || !Web3.utils.isAddress(this.state.REPOsmartcontractaddress) || this.state.approve_token_amount1 <= 0}
                onClick={() => {
                  if (this.state.approve_token_amount1 > 0) this.askUser2SignTxn(this.state.TokenAddrLeg1, this.state.approve_token_amount1, this.state.symbolLeg1, this.state.TokenAbiLeg1);
                }}
              >
                Approve {this.state.symbolLeg1} for Start Trade (1st Leg)
              </button>
              <br/><br/>
              <div className="input-group">
                <label htmlFor="approve_token_amount2">
                  <small>
                    Set Allowance for Mature Trade (Second leg) [required: {this.state.TokenRequiredLeg2.toLocaleString()}, balance: {this.state.TokenBalanceLeg2.toLocaleString()} {this.state.symbolLeg2} tokens]
                  </small>
                </label>
                <input
                  type="number"
                  id="approve_token_amount2"
                  placeholder="0"
                  min="0"
                  value={this.state.approve_token_amount2}
                  onChange={this.onChangeApproveTokenAmount2}
                  disabled={this.state.REPOsmartcontractaddress === "" || !Web3.utils.isAddress(this.state.REPOsmartcontractaddress)}
                />
                <label><small>{this.state.TokenAddrLeg2}</small></label>
              </div>
              <button
                type="button"
                className={(this.state.REPOsmartcontractaddress === "" || !Web3.utils.isAddress(this.state.REPOsmartcontractaddress) || this.state.approve_token_amount2 <= 0) ? "uniswapdisabled" : "uniswap"}
                disabled={this.state.REPOsmartcontractaddress === "" || !Web3.utils.isAddress(this.state.REPOsmartcontractaddress) || this.state.approve_token_amount2 <= 0}
                onClick={() => {
                  if (this.state.approve_token_amount2 > 0) this.askUser2SignTxn(this.state.TokenAddrLeg2, this.state.approve_token_amount2, this.state.symbolLeg2, this.state.TokenAbiLeg2);
                }}
              >
                Approve {this.state.symbolLeg2} for Mature Trade (2nd Leg)
              </button>
              <br/>
              {this.state.connectedAccount && (
                <>
                  <br/>
                  <div className="input-group">
                    <label style={{color: 'green'}}>Connected wallet:</label>
                    <label style={{color: 'green'}}><small>{this.state.connectedAccount}</small></label>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
        <Modal
          showm={this.state.showm}
          handleProceed1={event => window.location.href='/repo'}
          handleProceed2={this.deleteRepo}
          handleProceed3={this.dropRequest}
          button1text={this.state.button1text}
          button2text={this.state.button2text}
          button3text={this.state.button3text}
          button0text={this.state.button0text}
          handleCancel={this.hideModal}
        >
          {this.state.modalmsg}
        </Modal>
      </center>
    );
  }
}
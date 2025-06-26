import React, { Component } from "react";
import Web3 from 'web3';
import './uniswap.css';

import repoContract_jsonData from '../abis/ERC20TokenRepo.abi.json';
import cashToken_jsonData from '../abis/ERC20TokenDSGD.abi.json';
import bondToken_jsonData from '../abis/ERC20Bond_new.abi.json';
import Token1_jsonData from '../abis/ERC20TokenDSGD.abi.json';
import Token2_jsonData from '../abis/ERC20Bond_new.abi.json';

import Modal from '../Modal.js';
import LoadingSpinner from "../LoadingSpinner";
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
      Token2Owner: "",
    };

    this.networkOptions = [
      { name: "Sepolia Testnet", chainId: "0xaa36a7" }, // 11155111
      { name: "Amoy Testnet", chainId: "0x13882" }, // 80002
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
          approve_token_amount1: "",
          approve_token_amount2: "",
        });
        this.displayModal(`Failed to switch network: ${error.message}`, null, null, null, "OK");
      }
    }
  };

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
            approve_token_amount1: "",
            approve_token_amount2: "",
          });
          return;
        }

        const RepoContract_abi = JSON.parse(JSON.stringify(repoContract_jsonData));
        const RepoContract = new web3.eth.Contract(RepoContract_abi, this.state.REPOsmartcontractaddress);

        const tradeCount = await RepoContract.methods.tradeCount().call();
        if (tradeCount < 1) {
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
            approve_token_amount1: "",
            approve_token_amount2: "",
          });
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
          const repotype = tradeDetails.counterparty1RepoType === 0 ? "Repo" : "Reverse Repo";
          const Token1Addr = repotype === "Repo" ? tradeDetails.bondToken : tradeDetails.cashToken;
          const Token2Addr = repotype === "Repo" ? tradeDetails.cashToken : tradeDetails.bondToken;

          const Token1_abi = repotype === "Repo" ? JSON.parse(JSON.stringify(bondToken_jsonData)) : JSON.parse(JSON.stringify(cashToken_jsonData));
          const Token2_abi = repotype === "Repo" ? JSON.parse(JSON.stringify(cashToken_jsonData)) : JSON.parse(JSON.stringify(bondToken_jsonData));

          const tokenInst1 = new web3.eth.Contract(Token1_abi, Token1Addr);
          const balance1 = await tokenInst1.methods.balanceOf(accounts[0]).call();
          const symbol1 = await tokenInst1.methods.symbol().call();

          const tokenInst2 = new web3.eth.Contract(Token2_abi, Token2Addr);
          const balance2 = await tokenInst2.methods.balanceOf(accounts[0]).call();
          const symbol2 = await tokenInst2.methods.symbol().call();

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
            stateUpdate = {
              ...stateUpdate,
              TokenAddr: Token1Addr,
              TokenBalanceLeg1: balance1 / 1e18,
              TokenBalanceLeg2: balance2 / 1e18,
              symbolLeg1: symbol1,
              symbolLeg2: symbol2,
              TokenRequiredLeg1: tradeDetails.bondAmount / 1e18,
              TokenRequiredLeg2: tradeDetails.cashAmount / 1e18,
              approve_token_amount1: tradeDetails.bondAmount / 1e18,
              approve_token_amount2: ((tradeDetails.interestAmount / 1e18) + (tradeDetails.cashAmount / 1e18)).toFixed(2),
              connectionStatus: `Connected to Counterparty1's wallet, with Token[${symbol1}]`,
            };
          } else if (accounts[0].toUpperCase() === counterparty2.toUpperCase()) {
            stateUpdate = {
              ...stateUpdate,
              TokenAddr: Token2Addr,
              TokenBalanceLeg1: balance2 / 1e18,
              TokenBalanceLeg2: balance1 / 1e18,
              symbolLeg1: symbol2,
              symbolLeg2: symbol1,
              TokenRequiredLeg1: tradeDetails.cashAmount / 1e18,
              TokenRequiredLeg2: tradeDetails.bondAmount / 1e18,
              approve_token_amount1: tradeDetails.cashAmount / 1e18,
              approve_token_amount2: tradeDetails.bondAmount / 1e18,
              connectionStatus: `Connected to Counterparty2's wallet, with Token[${symbol2}]`,
            };
          } else {
            stateUpdate = {
              ...stateUpdate,
              connectionStatus: "You have connected a wallet which is not used in the Repo smart contract, please connect a wallet that belongs to either Counter Party.",
            };
          }

          this.setState(stateUpdate);
        } catch (err) {
          console.log('Failed to fetch trade: ' + err.message);
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
            approve_token_amount1: "",
            approve_token_amount2: "",
          });
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

  askUser2SignTxn = async (token_amount, symbol) => {
    const web3 = window.web3;
    const Token1_abi = JSON.parse(JSON.stringify(Token1_jsonData));
    const Token = new web3.eth.Contract(Token1_abi, this.state.TokenAddr);
    const spenderAddr1 = this.state.REPOsmartcontractaddress;
    const connectedAccount = this.state.connectedAccount;

    const BN = require('bn.js');
    const amountToSend = new BN(Math.ceil(token_amount)).mul(new BN("1000000000000000000"));

    try {
      await Token.methods.approve(spenderAddr1, amountToSend.toString()).send({
        from: connectedAccount
      }, (err, result) => {
        if (err) {
          this.displayModal("Error encountered: " + err.message, null, null, null, "OK");
          console.log("Error executing approve(): " + err);
          return;
        } else {
          console.log("Transaction executed! Txn hash / Account address: " + result);
        }
      }).on('receipt', async (data1) => {
        console.log("Setting approve() for Holder(" + connectedAccount + "), Spender (" + spenderAddr1 + ") - Return values from Receipt of approve(): ", data1.events.Approval.returnValues);
        try {
          await Token.methods.allowance(connectedAccount, spenderAddr1).call().then(async (data2) => {
            console.log("Checking allowance() for Holder(" + connectedAccount + "), \nSpender (" + spenderAddr1 + ") \n- Return values from Receipt of allowance(): ", data2);
          });
          this.displayModal(`You have successfully approved the Repo smart contract to pull ${token_amount} ${symbol} tokens from your wallet to transact with the other CounterParty.`, "OK", null, null, null);
        } catch (err) {
          console.log(err);
          this.displayModal(err, null, null, null, "OK");
        }
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
                    <option key={network.chainId} value={network.name}>
                      {network.name}
                    </option>
                  ))}
                </select>
              </div>
              <br/>
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
                  <br/>
                  <div className="input-group">
                    <label style={{color: 'blue'}}><small>{this.state.connectionStatus}</small></label>
                  </div>
                </>
              )}
              <br/>
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
                <label><small>{this.state.Token1Addr}</small></label>
              </div>
              <button
                type="button"
                className={(this.state.REPOsmartcontractaddress === "" || !Web3.utils.isAddress(this.state.REPOsmartcontractaddress) || this.state.approve_token_amount1 <= 0) ? "uniswapdisabled" : "uniswap"}
                disabled={this.state.REPOsmartcontractaddress === "" || !Web3.utils.isAddress(this.state.REPOsmartcontractaddress) || this.state.approve_token_amount1 <= 0}
                onClick={() => {
                  if (this.state.approve_token_amount1 > 0) this.askUser2SignTxn(this.state.approve_token_amount1, this.state.symbolLeg1);
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
                <label><small>{this.state.Token2Addr}</small></label>
              </div>
              <button
                type="button"
                className={(this.state.REPOsmartcontractaddress === "" || !Web3.utils.isAddress(this.state.REPOsmartcontractaddress) || this.state.approve_token_amount2 <= 0) ? "uniswapdisabled" : "uniswap"}
                disabled={this.state.REPOsmartcontractaddress === "" || !Web3.utils.isAddress(this.state.REPOsmartcontractaddress) || this.state.approve_token_amount2 <= 0}
                onClick={() => {
                  if (this.state.approve_token_amount2 > 0) this.askUser2SignTxn(this.state.approve_token_amount2, this.state.symbolLeg2);
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
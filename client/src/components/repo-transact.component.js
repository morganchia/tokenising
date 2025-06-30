import React, { Component } from "react";
import Modal from '../Modal.js';
import LoadingSpinner from "../LoadingSpinner.js";
import "../LoadingSpinner.css";
import moment from 'moment';
import Web3 from 'web3';
import repoContract_jsonData from '../abis/ERC20TokenRepo.abi.json';

function getToday() {
  const today = new Date();
  return moment(today).format('YYYY-MM-DD');
}

class Repo extends Component {
  constructor(props) {
    super(props);
    this.showModal_Leave = this.showModal_Leave.bind(this);
    this.showModal_dropRequest = this.showModal_dropRequest.bind(this);
    this.hideModal = this.hideModal.bind(this);
    this.onChangeSmartContract = this.onChangeSmartContract.bind(this);
    this.onChangeNetwork = this.onChangeNetwork.bind(this);

    this.state = {      
      adddatafield: false,
      hidedatafield1: true,
      hidedatafield2: true,  

      currentRepo: {
        id: 0,    // 0 for new repo draft
        name: "",
        underlyingTokenID1: "",
        underlyingTokenID2: "",
        blockchain: "",
        smartcontractaddress: "",
        smartcontractaddress1: "",
        smartcontractaddress2: "",
        counterpartyname: "",
        counterparty1: "",
        counterparty2: "",
        amount1: "",
        amount2: "",
        tradedate: getToday(),
        startdate: getToday(),
        enddate: getToday(),
        starttime: "00:00:00",
        endtime: "00:00:00",
        securityLB: "",
        repotype: "",
        nominal: "",
        cleanprice: "",
        dirtyprice: "",
        haircut: "",
        startamount: "",
        reporate: "",
        interestAmount: "",
        daycountconvention: "",
        currency: "",
        bondisin: "",
        
        txntype: 0,
        checker: "",
        approver: "",
        checkerComments: "",
        approverComments: "",
        approvedrepoid: null,
        actionby: "",
        name_changed: 0,
        startdate_changed: 0,
        enddate_changed: 0,
        starttime_changed: 0,
        endtime_changed: 0,
        underlyingTokenID1_changed: 0,
        underlyingTokenID2_changed: 0,
        smartcontractaddress_changed: 0,
        smartcontractaddress1_changed: 0,
        smartcontractaddress2_changed: 0,
        blockchain_changed: 0,
        counterparty1_changed: 0,
        counterparty2_changed: 0,
        amount1_changed: 0,
        amount2_changed: 0,
      },

      connectedAccount: "",
      message: "",
      txnstatus: "",
      isLoading: false,

      modal: {
        showm: false,
        modalmsg: "",
        button1text: null,
        button2text: null,
        button0text: null,
        handleProceed1: undefined,
        handleProceed2: undefined,
        handleCancel: undefined,
      },

      connectionStatus: "",
      showDetails: false,
      networkId: 0,
      selectedNetwork: "",
    };

    this.networkOptions = [
      { name: "Sepolia Ethereum Testnet", chainId: "0xaa36a7" }, // 11155111
      { name: "Amoy Polygon Testnet", chainId: "0x13882" }, // 80002
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
        this.setState({ 
          networkId: networkId,
          selectedNetwork: network ? network.name : ""
        });
        this.refreshData();
      } else if (window.web3) {
        window.web3 = new Web3(window.web3.currentProvider);
        const networkId = await window.web3.eth.net.getId();
        this.setState({ networkId: networkId });
      } else {
        window.alert('Non-Ethereum browser detected. Please connect using MetaMask or EIP-1193 compatible wallet.');
        this.setState({ walleterror: true });
      }

      this.setupMetaMaskAccountListener();
    };

    const loadBlockchainData = async () => {
      const web3 = window.web3;
      const networkId = await web3.eth.net.getId();
      console.log("loadBlockchainData() networkId: ", networkId);
      const network = this.networkOptions.find(opt => parseInt(opt.chainId, 16) === networkId);
      this.setState({ 
        networkId: networkId,
        selectedNetwork: network ? network.name : ""
      });
      if (![1, 137, 80002, 11155111].includes(networkId)) {
        this.setState({ walleterror: true });
      }
      // Trigger smart contract query if a smart contract address is already set
      if (this.state.currentRepo.smartcontractaddress) {
        this.onChangeSmartContract({ target: { value: this.state.currentRepo.smartcontractaddress } });
      }
    };

    const load = async () => {
      await loadWeb3();
      await loadBlockchainData();
    };
    load();
  }

  refreshData = async () => {
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      this.setState({ connectedAccount: accounts[0] });
      console.log("ConnectedAccount:", accounts[0]);
    } catch (error) {
      console.log(error);
      this.setState({
        connectionStatus: `Error connecting to wallet: ${error.message}`
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
        const networkId = parseInt(chainId, 16);
        const network = this.networkOptions.find(opt => parseInt(opt.chainId, 16) === networkId);
        this.setState({ 
          networkId: networkId,
          selectedNetwork: network ? network.name : "",
          connectionStatus: network ? `Switched to ${network.name}` : "Unsupported network selected"
        });
        this.refreshData();
        // Trigger smart contract query if a smart contract address is set
        if (this.state.currentRepo.smartcontractaddress) {
          this.onChangeSmartContract({ target: { value: this.state.currentRepo.smartcontractaddress } });
        }
      };
      ethereum.on('accountsChanged', this.handleAccountsChanged);
      ethereum.on('chainChanged', this.handleChainChanged);
    }
  };

  componentWillUnmount() {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.removeListener('accountsChanged', this.handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', this.handleChainChanged);
    }
  }

  formatNumber2decimals(num) {
    const trimmed = parseFloat(parseFloat(num).toFixed(10));
    if (trimmed % 1 === 0) {
      return trimmed.toFixed(2);
    }
    return trimmed.toString();
  }

  clearState(status) {
    this.setState({
      connectionStatus: status,
      currentRepo: {
        ...this.state.currentRepo,
        name: "",
        bondisin: "",
        securityLB: "",
        repotype: "",
        nominal: "",
        startamount: "",
        interestAmount: "",
        amount1: "",
        amount2: "",
        startdate: getToday(),
        starttime: "00:00:00",
        enddate: getToday(),
        endtime: "00:00:00",
        tradedate: getToday(),
        currency: "",
        counterparty1: "",
        counterparty2: "",
        underlyingTokenID1: "",
        underlyingTokenID2: "",
        smartcontractaddress1: "",
        smartcontractaddress2: "",
        blockchain: ""
      },
      showDetails: false
    });
  }

  onChangeSmartContract(e) {
    const address = e.target.value;
    console.log("Entered Smart Contract Address:", address);
    this.setState({
      currentRepo: {
        ...this.state.currentRepo,
        smartcontractaddress: address
      },
      datachanged: true
    }, async () => {
      if (Web3.utils.isAddress(address)) {
        try {
          const web3 = window.web3;
          const code = await web3.eth.getCode(address);
          if (code === '0x') {
            this.clearState("No contract deployed at the specified address.");
            return;
          }

          const RepoContract_abi = JSON.parse(JSON.stringify(repoContract_jsonData));
          const RepoContract = new web3.eth.Contract(RepoContract_abi, address);

          const tradeCount = await RepoContract.methods.tradeCount().call();
          if (tradeCount < 1) {
            this.clearState("No trades exist in the smart contract.");
            return;
          }

          const basics = await RepoContract.methods.getTradeBasicsSGT(1).call();
          const details = await RepoContract.methods.getTradeDetails(1).call();
          const tradeDetails = {
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
            bondToken: details[4]
          };

          console.log("Trade Details:", tradeDetails);

          const repotype = tradeDetails.counterparty1RepoType === "0" ? "repo" : "reverserepo";
          const securityLB = tradeDetails.counterparty1RepoType === "0" ? "B" : "L";
          const startDateTime = new Date(tradeDetails.startDateTime * 1000);
          const maturityDateTime = new Date(tradeDetails.maturityDateTime * 1000);

          this.setState({
            currentRepo: {
              ...this.state.currentRepo,
              smartcontractaddress: address,
              bondisin: tradeDetails.bondIsin,
              securityLB: securityLB,
              repotype: repotype,
              nominal: this.formatNumber2decimals(tradeDetails.bondAmount / 1e18),
              startamount: this.formatNumber2decimals(tradeDetails.startAmount / 1e18),
              interestAmount: this.formatNumber2decimals(tradeDetails.interestAmount / 1e18),
              amount1: this.formatNumber2decimals(tradeDetails.counterparty1RepoType === "0" ? tradeDetails.bondAmount / 1e18 : tradeDetails.startAmount / 1e18),
              amount2: this.formatNumber2decimals(tradeDetails.counterparty1RepoType === "0" ? tradeDetails.startAmount / 1e18 : tradeDetails.bondAmount / 1e18),
              startdate: moment(startDateTime).format('YYYY-MM-DD'),
              starttime: moment(startDateTime).format('HH:mm:ss'),
              enddate: moment(maturityDateTime).format('YYYY-MM-DD'),
              endtime: moment(maturityDateTime).format('HH:mm:ss'),
              tradedate: moment(startDateTime).format('YYYY-MM-DD'),
              counterparty1: tradeDetails.counterparty1,
              counterparty2: tradeDetails.counterparty2,
              smartcontractaddress1: tradeDetails.cashToken,
              smartcontractaddress2: tradeDetails.bondToken
            },
            connectionStatus: "Successfully fetched trade details from the smart contract.",
            showDetails: true,
          });
        } catch (err) {
          let errorMessage;
          console.log('Failed to fetch trade: ' + err.message);
          if (err.msg.includes("Execution prevented because the circuit breaker is open")) {
            errorMessage = "Execution prevented due to MetaMask internal error. Please restart MetaMask and try again.";
          }
                    
          this.clearState(`Failed to fetch trade details: ${errorMessage}. Please verify the contract address.`);
        }
      } else {
        this.clearState("Invalid smart contract address. Please enter a valid Ethereum address.");
      }
    });
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
        const networkId = parseInt(network.chainId, 16);
        console.log(`Switched to ${networkName} (chainId: ${networkId})`);
        this.setState({
          networkId: networkId,
          connectionStatus: `Switched to ${networkName}`,
          showDetails: false
        });
        this.refreshData();
        // Trigger smart contract query if a smart contract address is set
        if (this.state.currentRepo.smartcontractaddress) {
          this.onChangeSmartContract({ target: { value: this.state.currentRepo.smartcontractaddress } });
        }
      } catch (error) {
        console.error("Error switching network:", error);
        this.clearState(`Failed to switch network: ${error.message}`);

        this.displayModal(`Failed to switch network: ${error.message}`, null, null, null, "OK");
      }
    }
  };

/*
  componentDidUpdate(prevProps, prevState) {
  }
*/

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

  show_loading() {
    this.setState({ isLoading: true });
  }

  hide_loading() {
    this.setState({ isLoading: false });
  }

  showModal_Leave = () => {
    this.displayModal("You have made changes. Are you sure you want to leave this page without submitting?", "Yes, leave", null, null, "Cancel");
  };

  showModal_dropRequest = () => {
    this.displayModal("Are you sure you want to Drop this Request?", null, null, "Yes, drop", "Cancel");
  };
  
  showModalDelete = () => {
    this.displayModal("Are you sure you want to Delete this Repo?", null, "Yes, delete", null, "Cancel");
  };

  hideModal = () => {
    this.setState({ showm: false });
  };

  triggerStartRepo = async (event) => {
    event.preventDefault(); // Prevent form submission
    const web3 = window.web3;
    const repo_abi = JSON.parse(JSON.stringify(repoContract_jsonData));
    const repoContract = new web3.eth.Contract(repo_abi, this.state.currentRepo.smartcontractaddress);
    const connectedAccount = this.state.connectedAccount;    
        
    try {
      // Check trade status first
      const tradeDetails = await repoContract.methods.getTradeDetails(1).call( {from: connectedAccount} );
      console.log("Trade Status:", tradeDetails.status); // 0=Pending, 1=Started, 2=Matured, 3=Cancelled

      // simulate matureTrade
      await repoContract.methods.startTrade(1).call( { from: connectedAccount } ); // Use .call() for testing
      console.log("startTrade would succeed");
    } catch (error) {
      let errorMessage;

      if (typeof error.message === 'string' && error.message.includes('Internal JSON-RPC error')) {
          // Extract the JSON part after "Internal JSON-RPC error.\n"
          const jsonStart = error.message.indexOf('{');
          if (jsonStart !== -1) {
              const jsonString = error.message.substring(jsonStart);
              try {
                  const errorData = JSON.parse(jsonString);
                  errorMessage = this.removeHex(errorData.message);
              } catch (parseError) {
                  console.error('Failed to parse JSON:', parseError);
                  errorMessage = this.removeHex(error.message); // Fallback to raw message
              }
          } else {
              errorMessage = this.removeHex(error.message); // Fallback if no JSON found
          }
      } if (error.message.includes("Execution prevented because the circuit breaker is open")) {
        errorMessage = "Execution prevented due to MetaMask internal error. Please restart MetaMask and try again.";
      } else {
          errorMessage = this.removeHex(error.message); // Fallback for non-JSON-RPC errors
      }
      console.log(errorMessage); // Output: execution reverted: Trade not started

      this.displayModal(`Transaction failed: ${errorMessage.trim()}.`, null, null, null, "OK");
      return;
    }


    this.show_loading();

    try {
      // Execute the transaction
      const transaction = await repoContract.methods.startTrade(1).send({ from: connectedAccount });

      this.hide_loading();

      // Log transaction details
      console.log("Transaction executed! Txn hash: ", transaction.transactionHash);

      // Check for TradeStarted event
      if (transaction.events && transaction.events.TradeStarted) {
        console.log("TradeStarted event:", transaction.events.TradeStarted.returnValues);
        this.displayModal(`Successfully started Repo trade! Transaction hash: ${transaction.transactionHash}`, null, null, null, "OK");
      } else {
        console.log("No TradeStarted event found, but transaction was successful");
        this.displayModal(`Successfully started Repo trade!`, null, null, null, "OK");
      }
    } catch (error) {

      this.hide_loading();

      let errorMessage = error.message;

      // Handle JSON-RPC errors
      if (typeof error.message === 'string' && error.message.includes('Internal JSON-RPC error')) {
        const jsonStart = error.message.indexOf('{');
        if (jsonStart !== -1) {
          try {
            const errorData = JSON.parse(error.message.substring(jsonStart));
            errorMessage = this.removeHex(errorData.message);
          } catch (parseError) {
            console.error('Failed to parse JSON:', parseError);
            errorMessage = this.removeHex(error.message);
          }
        } else {
          errorMessage = this.removeHex(error.message);
        }
      } else {
        errorMessage = this.removeHex(error.message);
      }

      // Customize error messages for specific cases
      if (errorMessage.includes("User denied transaction signature")) {
        errorMessage = "You have denied the transaction signature in MetaMask. Please try again.";
      } else if (errorMessage.includes("Execution prevented because the circuit breaker is open")) {
        errorMessage = "Execution prevented due to MetaMask internal error. Please restart MetaMask and try again.";
      } else if (errorMessage.includes("Insufficient token")) {
        errorMessage = "You have insufficient tokens in your wallet.";
      } else if (errorMessage.includes("Insufficient cash token allowance")) {
        errorMessage = "Insufficient cash token allowance. Please approve the required amount.";
      } else if (errorMessage.includes("Insufficient bond token allowance")) {
        errorMessage = "Insufficient bond token allowance. Please approve the required amount.";
      } else if (errorMessage.includes("Insufficient cash balance")) {
        errorMessage = "Insufficient cash balance in your wallet.";
      } else if (errorMessage.includes("Insufficient bond balance")) {
        errorMessage = "Insufficient bond balance in your wallet.";
      } else if (errorMessage.includes("Trade not pending")) {
        errorMessage = "The trade is not in a pending state.";
      } else if (errorMessage.includes("Too early for start")) {
        errorMessage = "Too early to start the trade.";
      } else if (errorMessage.includes("Start window expired")) {
        errorMessage = "The start window for the trade has expired.";
      }

      console.error("Error executing startTrade(1):", error);
      this.displayModal(`Failed to start trade: ${errorMessage.trim()}`, null, null, null, "OK");
    }
            
    this.hide_loading();

  };

  // Decode revert reason from hex
  decodeRevertReason(hex) {
    if (hex && hex.startsWith("0x08c379a0")) {
      const data = hex.slice(10); // Remove Error(string) selector
      return window.web3.eth.abi.decodeParameter("string", data);
    }
    return null;
  }

  removeHex(str) {
    return str.replace(/0x[0-9a-fA-F]+/g, '');
  }

  triggerMatureRepo = async (event) => {
    event.preventDefault(); // Prevent form submission
    const web3 = window.web3;
    const repo_abi = JSON.parse(JSON.stringify(repoContract_jsonData));
    const repoContract = new web3.eth.Contract(repo_abi, this.state.currentRepo.smartcontractaddress);
    const connectedAccount = this.state.connectedAccount;    
    

    try {
      // Check trade status first
      const tradeDetails = await repoContract.methods.getTradeDetails(1).call( {from: connectedAccount} );
      console.log("Trade Status:", tradeDetails.status); // 0=Pending, 1=Started, 2=Matured, 3=Cancelled

      // simulate matureTrade
      await repoContract.methods.matureTrade(1).call( { from: connectedAccount } ); // Use .call() for testing
      console.log("matureTrade would succeed");
    } catch (error) {
      let errorMessage;
      if (typeof error.message === 'string' && error.message.includes('Internal JSON-RPC error')) {
          // Extract the JSON part after "Internal JSON-RPC error.\n"
          const jsonStart = error.message.indexOf('{');
          if (jsonStart !== -1) {
              const jsonString = error.message.substring(jsonStart);
              try {
                  const errorData = JSON.parse(jsonString);
                  errorMessage = this.removeHex(errorData.message);
              } catch (parseError) {
                  console.error('Failed to parse JSON:', parseError);
                  errorMessage = this.removeHex(error.message); // Fallback to raw message
              }
          } else {
              errorMessage = this.removeHex(error.message); // Fallback if no JSON found
          }
      } else {
          errorMessage = this.removeHex(error.message); // Fallback for non-JSON-RPC errors
      }
      console.log(errorMessage); // Output: execution reverted: Trade not started

      this.displayModal(`Transaction failed: ${errorMessage.trim()}.`, null, null, null, "OK");
      return;
    }
/*
    try {
      await repoContract.methods.matureTrade(1).send({
        from: connectedAccount
      }, (err, result) => {
        if (err) {
          this.displayModal("Error encountered: " + err.message, null, null, null, "OK");
          console.log("Error executing matureTrade(1): " + err);
          return;
        } else {
          console.log("Transaction executed! Txn hash / Account address: " + result);
        }
      }).on('receipt', async (data1) => {
        console.log("Starting Repo trade (Leg1) - Return values from Receipt of approve(): ", data1.events.Approval.returnValues);
      });
    } catch (err) {
      console.log("Error executing matureTrade(1) in Metamask: ", err);
      var errMsg = err.message;
      if (errMsg.includes("User denied transaction signature")) {
        errMsg = "You have denied the transaction signature in Metamask. Please try again.";
      } else if (errMsg.includes("Execution prevented because the circuit breaker is open")) {
        errMsg = "Execution prevented because Metamask internal error, please restart Metamask and try again later.";
      } else if (errMsg.includes("Insufficient token")) {
        errMsg = "You have insufficient tokens in your wallet.";
      }
      this.displayModal("Error executing Mature Trade in Metamask: " + errMsg, null, null, null, "OK");
    }
  */
    try {
            // Execute the transaction
      const transaction = await repoContract.methods.matureTrade(1).send({ from: connectedAccount });

      // Log transaction details
      console.log("Transaction executed! Txn hash: ", transaction.transactionHash);

      // Check for TradeStarted event
      if (transaction.events && transaction.events.TradeStarted) {
        console.log("TradeMatured event:", transaction.events.TradeStarted.returnValues);
        this.displayModal(`Successfully matured Repo trade! Transaction hash: ${transaction.transactionHash}`, null, null, null, "OK");
      } else {
        console.log("No TradeMature event found, but transaction was successful");
        this.displayModal(`Successfully matured Repo trade!`, null, null, null, "OK");
      }

    } catch (error) {
      let errorMessage = error.message;

      // Handle JSON-RPC errors
      if (typeof error.message === 'string' && error.message.includes('Internal JSON-RPC error')) {
        const jsonStart = error.message.indexOf('{');
        if (jsonStart !== -1) {
          try {
            const errorData = JSON.parse(error.message.substring(jsonStart));
            errorMessage = this.removeHex(errorData.message);
          } catch (parseError) {
            console.error('Failed to parse JSON:', parseError);
            errorMessage = this.removeHex(error.message);
          }
        } else {
          errorMessage = this.removeHex(error.message);
        }
      } else {
        errorMessage = this.removeHex(error.message);
      }

      // Customize error messages for specific cases
      if (errorMessage.includes("User denied transaction signature")) {
        errorMessage = "You have denied the transaction signature in MetaMask. Please try again.";
      } else if (errorMessage.includes("Execution prevented because the circuit breaker is open")) {
        errorMessage = "Execution prevented due to MetaMask internal error. Please restart MetaMask and try again.";
      } else if (errorMessage.includes("Insufficient token")) {
        errorMessage = "You have insufficient tokens in your wallet.";
      } else if (errorMessage.includes("Insufficient cash token allowance")) {
        errorMessage = "Insufficient cash token allowance. Please approve the required amount.";
      } else if (errorMessage.includes("Insufficient bond token allowance")) {
        errorMessage = "Insufficient bond token allowance. Please approve the required amount.";
      } else if (errorMessage.includes("Insufficient cash balance")) {
        errorMessage = "Insufficient cash balance in your wallet.";
      } else if (errorMessage.includes("Insufficient bond balance")) {
        errorMessage = "Insufficient bond balance in your wallet.";
      } else if (errorMessage.includes("Trade not pending")) {
        errorMessage = "The trade is not in a pending state.";
      } else if (errorMessage.includes("Too early for start")) {
        errorMessage = "Too early to start the trade.";
      } else if (errorMessage.includes("Start window expired")) {
        errorMessage = "The start window for the trade has expired.";
      }

      console.error("Error executing matureTrade(1):", error);
      this.displayModal(`Failed to mature trade: ${errorMessage.trim()}`, null, null, null, "OK");
    }
  };
  
  render() {
    const {  currentRepo, connectionStatus, selectedNetwork } = this.state;
    console.log("Render currentRepo:", currentRepo);
    console.log("networkId:", this.state.networkId);

    try {
      return (
        <div className="container">
          <div>
            <header className="jumbotron col-md-8">
              <h3>
                <strong>Execute Repo</strong>
              </h3>
            </header>
          </div> 

          <div className="edit-form list-row">
            <h4></h4>
            <div className="col-md-8">
              <form autoComplete="off">
                <div className="input-group">
                  <label htmlFor="networkSelect">Select Network</label>
                  <select
                    onChange={this.onChangeNetwork}
                    className="select"
                    id="networkSelect"
                    value={selectedNetwork}
                  >
                    <option value="">Select a network</option>
                    {this.networkOptions.map((network) => (
                      <option key={network.chainId} value={network.name}>
                        {network.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="smartcontractaddress">Enter Smart Contract Address</label>
                  <input
                    type="text"
                    className="form-control"
                    id="smartcontractaddress"
                    maxLength="45"
                    placeholder="0x..."
                    value={currentRepo.smartcontractaddress}
                    onChange={this.onChangeSmartContract}
                  />
                </div>
                {connectionStatus && (
                  <div className="form-group">
                    <label style={{ color: 'blue' }}><small>{connectionStatus}</small></label>
                  </div>
                )}
                { this.state.showDetails ? 
                <>
                <table style={{ border: '0px solid blue', width: '100%', backgroundColor: '#ffffff' }}>
                  <tbody>
                    <tr>
                      <td style={{ border: '0', margin: '0px', padding: '0px' }}>
                        <div className="form-group">
                          <label htmlFor="startdate">Start Date*</label>
                          <input
                            type="date"
                            className="form-control"
                            id="startdate"
                            required
                            value={currentRepo.startdate}
                            name="startdate"
                            autoComplete="off"
                            disabled={true}
                          />
                        </div>
                      </td>
                      <td style={{ border: '0' }}>
                        {currentRepo.startdate === currentRepo.enddate ?
                          <div className="form-group">
                            <label htmlFor="starttime">Start Time*</label>
                            <input
                              type="time"
                              className="form-control"
                              id="starttime"
                              required
                              value={currentRepo.starttime}
                              name="starttime"
                              autoComplete="off"
                              disabled={true}
                            />
                          </div>
                          : null}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: '0', backgroundColor: 'white', margin: '0px', padding: '0px' }}>
                        <div className="form-group">
                          <label htmlFor="enddate">Maturity Date*</label>
                          <input
                            type="date"
                            className="form-control"
                            id="enddate"
                            required
                            value={currentRepo.enddate}
                            name="enddate"
                            autoComplete="off"
                            disabled={true}
                          />
                        </div>
                      </td>
                      <td style={{ border: '0', backgroundColor: 'white' }}>
                        {currentRepo.startdate === currentRepo.enddate ?
                          <div className="form-group">
                            <label htmlFor="endtime">Maturity Time*</label>
                            <input
                              type="time"
                              className="form-control"
                              id="endtime"
                              required
                              value={currentRepo.endtime}
                              name="endtime"
                              autoComplete="off"
                              disabled={true}
                            />
                          </div>
                          : null}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <label htmlFor="datafield1_name">Start Repo (1st Leg)</label>
                <table style={{ border: '1px solid blue', width: '100%', backgroundColor: '#ffffff' }}>
                  <tbody>
                    <tr>
                      <td style={{ border: '0' }}>
                        <div className="form-group">
                          <label htmlFor="amount1"><small>Counterparty 1 {(currentRepo.securityLB !== "" && currentRepo.securityLB === 'B' ? 'Bond Lot' : currentRepo.securityLB === 'L' ? 'Cash' : null)} amount</small></label>
                          <input
                            type="text"
                            className="form-control"
                            id="amount1"
                            min="0"
                            step="1"
                            required
                            value={parseFloat(currentRepo.amount1).toLocaleString()}
                            name="amount1"
                            autoComplete="off"
                            disabled={true}
                          />
                        </div>
                      </td>
                      <td style={{ border: '0' }}>
                        vs
                      </td>
                      <td style={{ border: '0' }}>
                        <div className="form-group">
                          <label htmlFor="amount2"><small>Counterparty 2 {(currentRepo.securityLB !== "" && currentRepo.securityLB === 'B' ? 'Cash' : currentRepo.securityLB === 'L' ? 'Bond Lot' : null)} amount</small></label>
                          <input
                            type="text"
                            className="form-control"
                            id="amount2"
                            value={parseFloat(currentRepo.amount2).toLocaleString()}
                            name="amount2"
                            disabled={true}
                          />
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: '0', backgroundColor: '#ffffff' }}>
                        <button
                          type="button" // Changed from submit to button
                          className="m-3 btn btn-sm btn-primary"
                          onClick={this.triggerStartRepo}
                        >
                          Trigger Start Repo
                        </button> 
                      </td>
                    </tr>
                  </tbody>
                </table>
                <br/>
                <label htmlFor="datafield1_name">Mature Repo (2nd Leg)</label>
                <table style={{ border: '1px solid blue', width: '100%' }}>
                  <tbody>
                    <tr>
                      <td style={{ border: '0' }}>
                        <div className="form-group">
                          <label htmlFor="amount2"><small>Counterparty 1 {(currentRepo.securityLB !== "" && currentRepo.securityLB === 'B' ? 'Cash amount(with interest)' : (currentRepo.securityLB === 'L' ? 'Bond Lot amount' : null))}</small></label>
                          <input
                            type="text"
                            className="form-control"
                            id="amount2"
                            value={currentRepo.securityLB === 'B' ? (parseFloat(currentRepo.amount2) + parseFloat(currentRepo.interestAmount)).toLocaleString() : parseFloat(currentRepo.amount2).toLocaleString()}
                            name="amount2_leg2"
                            disabled={true}
                          />
                        </div>
                      </td>
                      <td style={{ border: '0' }}>
                        vs
                      </td>
                      <td style={{ border: '0' }}>
                        <div className="form-group">
                          <label htmlFor="amount1"><small>Counterparty 2 {(currentRepo.securityLB !== "" && currentRepo.securityLB === 'B' ? 'Bond Lot amount' : (currentRepo.securityLB === 'L' ? 'Cash amount(with interest)' : null))}</small></label>
                          <input
                            type="text"
                            className="form-control"
                            id="amount1"
                            value={currentRepo.securityLB === 'L' ? (parseFloat(currentRepo.amount1) + parseFloat(currentRepo.interestAmount)).toLocaleString() : parseFloat(currentRepo.amount1).toLocaleString()}
                            name="amount1_leg2"
                            disabled={true}
                          />
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: '0', backgroundColor: '#ffffff' }}>
                        <button
                          type="button" // Changed from submit to button
                          className="m-3 btn btn-sm btn-primary"
                          onClick={this.triggerMatureRepo}
                        >
                          Trigger Mature Repo
                        </button> 
                      </td>
                    </tr>
                  </tbody>
                </table>
                <br/>

                <div className="form-group">
                  <label htmlFor="tradedate">Trade Date*</label>
                  <input
                    type="date"
                    className="form-control"
                    id="tradedate"
                    required
                    value={currentRepo.tradedate}
                    name="tradedate"
                    autoComplete="off"
                    disabled={true}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="bondisin">Bond ISIN*</label>
                  <input
                    type="text"
                    className="form-control"
                    id="bondisin"
                    required
                    value={currentRepo.bondisin}
                    name="bondisin"
                    autoComplete="off"
                    disabled={true}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="securityLB">Security L/B*</label>
                  <select
                    className="form-control"
                    id="securityLB"
                    disabled={true}
                  >
                    <option> </option>
                    <option value="B" selected={currentRepo.securityLB === "B"}>Borrow</option>
                    <option value="L" selected={currentRepo.securityLB === "L"}>Lend</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="repotype">Repo Type*</label>
                  <select
                    className="form-control"
                    id="repotype"
                    disabled={true}
                  >
                    <option> </option>
                    <option value="repo" selected={currentRepo.repotype === "repo"}>Repo</option>
                    <option value="reverserepo" selected={currentRepo.repotype === "reverserepo"}>Reverse Repo</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="nominal">Nominal*</label>
                  <input
                    type="text"
                    className="form-control"
                    id="nominal"
                    required
                    min="0"
                    value={parseFloat(currentRepo.nominal).toLocaleString()}
                    name="nominal"
                    autoComplete="off"
                    disabled={true}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="startamount">Start Amount</label>
                  <input
                    type="text"
                    className="form-control"
                    id="startamount"
                    required
                    min="0"
                    value={parseFloat(currentRepo.startamount).toLocaleString()}
                    name="startamount"
                    autoComplete="off"
                    disabled={true}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="interestAmount">Interest Amount</label>
                  <input 
                    type="text"
                    className="form-control"
                    id="interestAmount"
                    value={parseFloat(currentRepo.interestAmount).toLocaleString()}
                    name="interestAmount"
                    disabled={true}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="counterparty1">Counterparty 1 Wallet Addr *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="counterparty1"
                    name="counterparty1"
                    value={currentRepo.counterparty1}
                    disabled={true}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="counterparty2">Counterparty 2 Wallet Addr *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="counterparty2"
                    name="counterparty2"
                    value={currentRepo.counterparty2}
                    disabled={true}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="underlyingTokenID1">Counterparty 1 {(currentRepo.securityLB !== "" && currentRepo.securityLB === 'B' ? 'Bond' : currentRepo.securityLB === 'L' ? 'Cash' : null)} Token*</label>
                  <input
                    type="text"
                    className="form-control"
                    id="underlyingTokenID1"
                    name="underlyingTokenID1"
                    value={currentRepo.securityLB === 'B' ? currentRepo.smartcontractaddress2 : currentRepo.smartcontractaddress1}
                    disabled={true}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="underlyingTokenID2">Counterparty 2 {(currentRepo.securityLB !== "" && currentRepo.securityLB === 'B' ? 'Cash' : currentRepo.securityLB === 'L' ? 'Bond' : null)} Token*</label>
                  <input
                    type="text"
                    className="form-control"
                    id="underlyingTokenID2"
                    name="underlyingTokenID2"
                    value={currentRepo.securityLB === 'B' ? currentRepo.smartcontractaddress1 : currentRepo.smartcontractaddress2}
                    disabled={true}
                  />
                </div>
                </>
              : null }

              </form>

              <br/>

              {this.state.isLoading ? <LoadingSpinner /> : null}

              <Modal
                showm={this.state.showm}
                handleProceed1={event => window.location.href='/inbox'}
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

              <p>{this.state.message}</p>
            </div>
          </div>
        </div>
      );
    } catch (e) {
      console.error("Render error:", e);
      return <div>Error rendering component: {e.message}</div>;
    }
  }
}

export default Repo;
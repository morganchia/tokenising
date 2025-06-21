import React, { Component, useState, useEffect } from "react";
import RepoDataService from "../services/repo.service";

import Web3 from 'web3'
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
    this.onChangeApproveTokenAmount1     = this.onChangeApproveTokenAmount1.bind(this);
    this.onChangeApproveTokenAmount2     = this.onChangeApproveTokenAmount2.bind(this);
    this.onChangeSmartContract  = this.onChangeSmartContract.bind(this);
    this.askUser2SignTxn        = this.askUser2SignTxn.bind(this);

    this.state = {
      RepoType: "",  // "Repo" or "Reverse Repo"
      REPOList: "",
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
      selectedREPO: 0,
      REPOsmartcontractaddress: "",
      connectionStatus: "",
      tradeDetails: null,

      connectedAccount: "",
      Token1Addr: "",
      Token2Addr: "", 
      TokenAddr: "",
      Token2Owner: "", // PBM smart contract owner
    };
  }  // constructor

  retrieveRepo() {
    RepoDataService.getAll()
      .then(response => {
        this.setState({
          REPOList: response.data
        });
        console.log("Response data from retrieveRepo() RepoDataService.getAll:", response.data);
      })
      .catch(e => {
        console.log(e);
      });
  } // retrieveRepo

  componentDidMount() {
    
    this.retrieveRepo();

    const loadWeb3 = async () => {
      if (window.ethereum) {
        //if (window.web3 === "" || window.web3 === null || window.web3 === undefined) {
          window.web3 = new Web3(window.ethereum);
        //}

        this.refreshData();
      }
      else if (window.web3) {
        window.web3 = new Web3(window.web3.currentProvider)
      }
      else {
        window.alert('Non-Ethereum browser detected. Please connect using MetaMask or EIP-1193 compatible wallet.')
        //setWalleterror( true );
        this.setState({ ...this.state, walleterror:true });
      }

      this.setupMetaMaskAccountListener();

    }
    
    const loadBlockchainData = async () => {
      const web3 = window.web3
      const networkId = await web3.eth.net.getId()
      if (networkId !== 4 && networkId !== 3 && networkId !== 80001 && networkId !== 137) {
        //setWalleterror( true );
        this.setState({ ...this.state, walleterror:true });
      }
    };
  
    const load = async () => {
      await loadWeb3()
      await loadBlockchainData()
    };
    load();

  } // componentDidMount

  componentWillUnmount() {
    if (typeof window.ethereum !== 'undefined') {
      // Remove the event listener when the component unmounts
      window.ethereum.removeListener('accountsChanged', this.handleAccountsChanged);
    }
  } // componentWillUnmount

  refreshData = async () => {
    try {
      const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
      });

      this.setState({ ...this.state, connectedAccount: accounts[0] });

      console.log(accounts);
      console.log("ConnectedAccount:", accounts[0]);

      let counterparty1 = null;
      let counterparty2 = null;
      if (this.state.REPOList.length > 0) {  // if selected Repo
        counterparty1 = this.state.REPOList.find((ee) => ee.id === parseInt(this.state.selectedREPO)).counterparty1;
        counterparty2 = this.state.REPOList.find((ee) => ee.id === parseInt(this.state.selectedREPO)).counterparty2;
      }
      
      console.log("counterparty1:", counterparty1);
      console.log("counterparty2:", counterparty2);

      if ((accounts[0]).toUpperCase() === counterparty1.toUpperCase()) {
        console.log("Connected counterparty1 wallet");

        const repotype = this.state.REPOList.find((ee) => ee.id === parseInt(this.state.selectedREPO)).securityLB === "B" ? "Repo" : "Reverse Repo";
        console.log("Security LB:", repotype);
        if (repotype === "Repo") {
          console.log("This is a Repo, using Bond Token as the Counterparty1 for 1st leg");
        } else {
          console.log("This is a Reverse Repo, using Cash Token as the Counterparty1 for 1st leg");
        }
        const Token1Addr = this.state.REPOList.find((ee) => ee.id === parseInt(this.state.selectedREPO)).smartcontractaddress1;
        const Token2Addr = this.state.REPOList.find((ee) => ee.id === parseInt(this.state.selectedREPO)).smartcontractaddress2;

        console.log("Token1:", Token1Addr);
        console.log("Token2:", Token2Addr);

        var Token1_abi, Token2_abi;
        if (repotype === "Repo") {
          Token1_abi = JSON.parse(JSON.stringify(bondToken_jsonData));  // Token 1 is bond
          Token2_abi = JSON.parse(JSON.stringify(cashToken_jsonData));  // Token 2 is cash
        } else {
          Token1_abi = JSON.parse(JSON.stringify(cashToken_jsonData));
          Token2_abi = JSON.parse(JSON.stringify(bondToken_jsonData));
        }

        var tokenInst1 = new window.web3.eth.Contract(Token1_abi, Token1Addr);       
        var balance1 =  await tokenInst1.methods.balanceOf(accounts[0]).call()
          .then(function (bal) {
            console.log("Token1 Bal:" +bal);      
            return bal;
          })  
        var symbol1 =  await tokenInst1.methods.symbol().call()
        .then(function (sym) {
          console.log("Token1 symbol:" +sym);      
          return sym;
        });

        var tokenInst2 = new window.web3.eth.Contract(Token2_abi, Token2Addr);       
        var balance2 =  await tokenInst2.methods.balanceOf(accounts[0]).call()
          .then(function (bal) {
            console.log("Token2 Bal:" +bal);      
            return bal;
          })  
        var symbol2 =  await tokenInst2.methods.symbol().call()
        .then(function (sym) {
          console.log("Token2 symbol:" +sym);      
          return sym;
        });

                const RepoContract_abi = JSON.parse(JSON.stringify(repoContract_jsonData));
                const RepoSmartContractAddress = this.state.REPOList.find((ee) => ee.id === parseInt(this.state.selectedREPO)).smartcontractaddress;
                console.log("RepoSmartContractAddress:", RepoSmartContractAddress);
                const RepoContract = new window.web3.eth.Contract(RepoContract_abi, RepoSmartContractAddress);       
                var tradeDetails;
                try {
                  const basics = await RepoContract.methods.getTradeBasicsSGT(1).call();  // tradeId 1
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

                  console.log("Trade Details Leg 1:", tradeDetails);
                } catch (err) {
                  console.log('Failed to fetch trade: ' + err.message);
                }

        this.setState({ ...this.state, 
          RepoType: repotype,
          Token1Addr: Token1Addr,  
          Token2Addr: Token2Addr, 
          TokenAddr: Token1Addr,

          Token1Balance: balance1 / 1e18,
          Token2Balance: balance2 / 1e18,
          symbol1 : symbol1,
          symbol2 : symbol2,
          TokenBalanceLeg1: balance1 / 1e18,
          TokenBalanceLeg2: balance2 / 1e18,
          symbolLeg1: symbol1,
          symbolLeg2: symbol2,
          tradeDetails: tradeDetails,
          TokenRequiredLeg1: tradeDetails.bondAmount / 1e18,
          TokenRequiredLeg2: tradeDetails.cashAmount / 1e18,
          approve_token_amount2: ((tradeDetails.interestAmount/1e18) + (tradeDetails.cashAmount/1e18)).toFixed(2),  //  add interest on returning 
          approve_token_amount1: tradeDetails.bondAmount / 1e18,
          connectionStatus: "Connected to Counterparty1's wallet, with Token["+symbol1+"]",
          REPOsmartcontractaddress : RepoSmartContractAddress,
        });
      } else if ((accounts[0]).toUpperCase() === counterparty2.toUpperCase()) {
        console.log("Connected counterparty2 wallet");
        const repotype = this.state.REPOList.find((ee) => ee.id === parseInt(this.state.selectedREPO)).securityLB === "B" ? "Repo" : "Reverse Repo";
        console.log("Security LB:", repotype);
        if (repotype === "Repo") {
          console.log("This is a Repo, using Cash Token as the Counterparty2 for 1st leg");
        } else {
          console.log("This is a Reverse Repo, using Bond Token as the Counterparty2 for 1st leg");
        }

        const Token2Addr = this.state.REPOList.find((ee) => ee.id === parseInt(this.state.selectedREPO)).smartcontractaddress2;
        const Token1Addr = this.state.REPOList.find((ee) => ee.id === parseInt(this.state.selectedREPO)).smartcontractaddress1;

        console.log("Token1:", Token1Addr);
        console.log("Token2:", Token2Addr);

        var Token1_abi, Token2_abi;
        if (repotype === "Repo") {
          Token1_abi = JSON.parse(JSON.stringify(bondToken_jsonData));
          Token2_abi = JSON.parse(JSON.stringify(cashToken_jsonData));
        } else {
          Token1_abi = JSON.parse(JSON.stringify(cashToken_jsonData));
          Token2_abi = JSON.parse(JSON.stringify(bondToken_jsonData));
        }

        var tokenInst1 = new window.web3.eth.Contract(Token1_abi, Token1Addr);       
        var balance1 =  await tokenInst1.methods.balanceOf(accounts[0]).call()
          .then(function (bal) {
            console.log("Token1 Bal:" +bal);      
            return bal;
          })  
        var symbol1 =  await tokenInst1.methods.symbol().call()
        .then(function (sym) {
          console.log("Token1 symbol:" +sym);      
          return sym;
        });

        var tokenInst2 = new window.web3.eth.Contract(Token2_abi, Token2Addr);       
        var balance2 =  await tokenInst2.methods.balanceOf(accounts[0]).call()
          .then(function (bal) {
            console.log("Token2 Bal:" +bal);      
            return bal;
          })  
        var symbol2 =  await tokenInst2.methods.symbol().call()
        .then(function (sym) {
          console.log("Token2 symbol:" +sym);      
          return sym;
        });


                const RepoContract_abi = JSON.parse(JSON.stringify(repoContract_jsonData));
                console.log("RepoContract_abi: ", RepoContract_abi);
                const RepoSmartContractAddress = this.state.REPOList.find((ee) => ee.id === parseInt(this.state.selectedREPO)).smartcontractaddress;
                console.log("RepoSmartContractAddress:", RepoSmartContractAddress);
                const RepoContract = new window.web3.eth.Contract(RepoContract_abi, RepoSmartContractAddress);       
                console.log("RepoContract: ", RepoContract);
                
                var tradeDetails;
                try {
                  const basics = await RepoContract.methods.getTradeBasicsSGT(1).call();  // tradeId 1
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

                  console.log("Trade Details Leg 1:", tradeDetails);
                } catch (err) {
                  console.log('Failed to fetch trade: ' + err.message);
                }



        this.setState({ ...this.state, 
          RepoType: repotype,
          Token1Addr: Token1Addr,  
          Token2Addr: Token2Addr, 
          TokenAddr: Token2Addr,

          Token1Balance: balance1 / 1e18,
          Token2Balance: balance2 / 1e18,
          symbol1 : symbol1,
          symbol2 : symbol2,
          TokenBalanceLeg1: balance2 / 1e18,
          TokenBalanceLeg2: balance1 / 1e18,
          symbolLeg1: symbol2,
          symbolLeg2: symbol1,
          tradeDetails: tradeDetails,
          TokenRequiredLeg2: tradeDetails.bondAmount / 1e18,
          TokenRequiredLeg1: tradeDetails.cashAmount / 1e18,
          approve_token_amount1: tradeDetails.cashAmount / 1e18,
          approve_token_amount2: tradeDetails.bondAmount / 1e18,
          connectionStatus: "Connected to Counterparty2's wallet, with Token["+symbol2+"]",
          REPOsmartcontractaddress : RepoSmartContractAddress,
        });
  
      } else {
        console.log("You have connected a wallet which is not used in the Repo smart contract, please connect a wallet that belongs to either Counter Party.")
        this.setState({ ...this.state, 
          connectionStatus: "You have connected a wallet which is not used in the Repo smart contract, please connect a wallet that belongs to either Counter Party.",
        });

      }

    } catch (error) {
        console.log(error)
    }
  } // refreshData

  setupMetaMaskAccountListener = () => {
    const ethereum = window.ethereum;

    // Check if MetaMask is installed
    if (typeof ethereum !== 'undefined') {
      // Handler for account changes
      this.handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          // Account has been changed, you can refresh the page, or update state here
          console.log('Selected account changed:', accounts[0]);
          // Refresh the page
          this.refreshData();
          //window.location.reload();
          // Or you could update the component's state to reflect the account change
        }
      };

      ethereum.on('accountsChanged', this.handleAccountsChanged);
    }
  } // setupMetaMaskAccountListener

  askUser2SignTxn = async (token_amount, symbol) => {
    const web3 = window.web3;

    //
    // Step 1: User approves spending by PBM smart contract
    //
    const Token1_abi =  JSON.parse(JSON.stringify(Token1_jsonData));
    const Token = new web3.eth.Contract(Token1_abi, this.state.TokenAddr);
    const spenderAddr1 = this.state.REPOsmartcontractaddress;
    const connectedAccount = this.state.connectedAccount;
    const Token2_abi =  JSON.parse(JSON.stringify(Token2_jsonData));
    const Token2Addr1 = this.state.Token2Addr;
    const Token2Owner1 = this.state.Token2Owner;
    

    console.log("token_amount:", token_amount);
    console.log("symbol:", symbol);
    
    //var amountToSend = Meth.ceil(token_amount) * 1e18;
    const BN = require('bn.js');
    const amountToSend = new BN(Math.ceil(token_amount)).mul(new BN("1000000000000000000")); // round up to whole number, this is needed for Metamask else it will auto round down
    

    try { // try 0
      await Token.methods.approve(spenderAddr1,  amountToSend.toString()).send({  // executing via Metamask's private key hence need user to approve via Metamask
          from: connectedAccount
        },
        (err, result) => {
          if(err) {
            this.displayModal("Error encountered: "+ err.message , null, null, null, "OK");

            console.log("Error executing approve(): "+ err);
            return;
          } else {
            console.log("Transaction executed! Txn hash / Account address: "+ result);
          }
        }      
      ).on('receipt', async (data1) => {
        console.log("Setting approve() for Holder("+connectedAccount+"), Spender ("+spenderAddr1+") - Return values from Receipt of approve(): ", data1.events.Approval.returnValues);
        try { // try 1
          await Token.methods.allowance(connectedAccount, spenderAddr1)
          .call().then(async (data2) => {
            console.log("Checking allowance() for Holder("+connectedAccount+"), \nSpender ("+spenderAddr1+") \n- Return values from Receipt of allowance(): ", data2);
          });  // Token1.methods.allowance

          this.displayModal("You have successfully approved the the Repo smart contract to pull "+token_amount+" "+ symbol +" tokens from you wallet to transact with the other CounterParty." , "OK", null, null, null);

        } // try 1
        catch(err){
          console.log(err);
          this.displayModal(err , null, null, null, "OK");

        } // try 1
      });
    } // try 0
    catch(err){ // approve()
      console.log("Error approving in Metamask: ", err);

      var errMsg = err.message;
      if (errMsg.includes("User denied transaction signature")) {
        errMsg = "You have denied the transaction signature in Metamask. Please try again.";
      } else if (errMsg.includes("Execution prevented because the circuit breaker is open")) {
        errMsg = "Execution prevented because Metamask internal error, please restart Metamask and try again later.";
      } else if (errMsg.includes("Insufficient token")) {
        errMsg = "You have insufficient tokens in your wallet.";
      }
      this.displayModal("Error approving in Metamask: "+errMsg , null, null, null, "OK");
    } // try 0
  }  // askUser2SignTxn

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
    const index = e.target.value;
    console.log("Selected Index = ", index);
    const newREPOsmartcontractaddress = this.state.REPOList.find((ee) => ee.id === parseInt(index)).smartcontractaddress
    console.log("newREPOsmartcontractaddress:", newREPOsmartcontractaddress);
    this.setState({
      selectedREPO: index,
      REPOsmartcontractaddress: newREPOsmartcontractaddress,
      datachanged: true
    });

    this.refreshData(); // check Metamask

  }  // onChangeSmartContract

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
      <div class="outer">
        <div class="swap-container">
        <h1>Approve Repo Smart Contract to Pull Tokens from my Wallet</h1>
        <br/>
        <form class="swap-form">
          <div class="input-group">
                <label htmlFor="Reposmartcontract">Select Repo Smart Contract</label>
                <select
                  onChange={this.onChangeSmartContract}                         
                  class="select"
                  id="Reposmartcontract"
                >
                  <option value=""> </option>
                  {
                    Array.isArray(this.state.REPOList) ?
                    this.state.REPOList.map( (d) => {
                        // https://stackoverflow.com/questions/61128847/react-adding-a-default-option-while-using-map-in-select-tag
                          return <option value={d.id}>{d.name} ({d.smartcontractaddress})</option>
                      })
                    : null
                  }
                </select>
          </div>

          {this.state.connectedAccount && (
            <>
              <br/>
              <div class="input-group">
                <label style={{color:'blue'}}><small>{this.state.connectionStatus}</small></label>

              </div>

            </>
          )}
          <br/>
          <div class="input-group">
              <label for="approve_token_amount1"><small>Set Allowance for Start Trade(First leg) [required: {this.state.TokenRequiredLeg1.toLocaleString()}, balance: {this.state.TokenBalanceLeg1.toLocaleString()} {this.state.symbolLeg1} tokens]</small></label>
              <input 
                type="number" 
                id="approve_token_amount1" 
                placeholder="0"  
                min="0"
                value={this.state.approve_token_amount1}
                onChange={this.onChangeApproveTokenAmount1}
                disabled={this.state.REPOsmartcontractaddress === ""}
              />
              <label><small>{this.state.Token1Addr}  {this.state.REPOsmartcontractaddress}</small></label>
          </div>
          <button 
            type="button"
            class={(this.state.REPOsmartcontractaddress === "" || this.state.approve_token_amount1 <= 0)? "uniswapdisabled" : "uniswap"}
            disabled={this.state.REPOsmartcontractaddress === "" || this.state.approve_token_amount1 <= 0}

            onClick = {()=> {
                if (this.state.approve_token_amount1 > 0) this.askUser2SignTxn(this.state.approve_token_amount1, this.state.symbolLeg1)
              }
            } >
            Approve {this.state.symbolLeg1} for Start Trade(1st Leg)
          </button>
<br/>
<br/>
          <div class="input-group">
              <label for="approve_token_amount2"><small>Set Allowance for Mature Trade(Second leg) [required: {this.state.TokenRequiredLeg2.toLocaleString()}, balance: {this.state.TokenBalanceLeg2.toLocaleString()} {this.state.symbolLeg2} tokens]</small></label>
              <input 
                type="number" 
                id="approve_token_amount2" 
                placeholder="0"  
                min="0"
                value={this.state.approve_token_amount2}
                onChange={this.onChangeApproveTokenAmount2}
                disabled={this.state.REPOsmartcontractaddress === ""}
              />
              <label><small>{this.state.Token2Addr}</small></label>
          </div>

          <button 
            type="button"
            class={(this.state.REPOsmartcontractaddress === "" || this.state.approve_token_amount2 <= 0)? "uniswapdisabled" : "uniswap"}
            disabled={this.state.REPOsmartcontractaddress === "" || this.state.approve_token_amount2 <= 0}

            onClick = {()=> {
                if (this.state.approve_token_amount2 > 0) this.askUser2SignTxn(this.state.approve_token_amount2, this.state.symbolLeg2)
              }
            } >
            Approve {this.state.symbolLeg2} for Mature Trade(2nd Leg)          
          </button>
          <br/>
          {this.state.connectedAccount && (
            <>
              <br/>
              <div class="input-group">
                <label style={{color:'green'}}>Connected wallet:</label>
                <label style={{color:'green'}}><small>{this.state.connectedAccount}</small></label>

              </div>
            </>
            )}
        </form>
        </div>
      </div>

      <Modal showm={this.state.showm} handleProceed1={event =>  window.location.href='/repo'} handleProceed2={this.deleteRepo} handleProceed3={this.dropRequest} button1text={this.state.button1text} button2text={this.state.button2text} button3text={this.state.button3text} button0text={this.state.button0text} handleCancel={this.hideModal}>
                    {this.state.modalmsg}
      </Modal>

      </center>
    );  // return
  }  // render
}  // class repocouponallowance

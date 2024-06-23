import React, { Component, useState, useEffect } from "react";
import PBMDataService from "../services/pbm.service";
import DvPDataService from "../services/dvp.service";

import Web3 from 'web3'
import './uniswap.css';
import Token_jsonData from '../abis/ERC20TokenDSGD.abi.json';
import Token1_jsonData from '../abis/ERC20TokenDSGD.abi.json';
import Token2_jsonData from '../abis/ERC20TokenPBM.abi.json';
//import DvPList from "./dvp-list.component";
import Modal from '../Modal.js';
import LoadingSpinner from "../LoadingSpinner";
import "../LoadingSpinner.css";

export default class dvpaddallowance extends Component {
  constructor(props) {
    super(props);
    this.onChangeTokenAmount     = this.onChangeTokenAmount.bind(this);
    this.onChangeSmartContract  = this.onChangeSmartContract.bind(this);
    this.askUser2SignTxn        = this.askUser2SignTxn.bind(this);

    this.state = {
      DVPList: "",
      content: "",
      token_amount: 0,
      TokenBalance: 0,
      Token1Balance: 0,
      Token2Balance: 0,
      Symbol: "",
      deployedContract: "",
      account: "",
      balance: "",
      name: "",
      symbol: "",
      walleterror: false,
      eventover: false,
      selectedDVP: 0,
      DVPsmartcontractaddress: "",
      connectionStatus: "",

      connectedAccount: "",
      Token1Addr: "",
      Token2Addr: "", 
      TokenAddr: "",
      Token2Owner: "", // PBM smart contract owner
    };
  }  // constructor

  retrieveDvP() {
    DvPDataService.getAll()
      .then(response => {
        this.setState({
          DVPList: response.data
        });
        console.log("Response data from retrieveDvP() DvPDataService.getAll:", response.data);
      })
      .catch(e => {
        console.log(e);
      });
  } // retrieveDvP

  componentDidMount() {
    
    this.retrieveDvP();

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
        window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
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

      const counterparty1 = this.state.DVPList.find((ee) => ee.id === parseInt(this.state.selectedDVP)).counterparty1;
      const counterparty2 = this.state.DVPList.find((ee) => ee.id === parseInt(this.state.selectedDVP)).counterparty2;

      console.log("counterparty1:", counterparty1);
      console.log("counterparty2:", counterparty2);

      if ((accounts[0]).toUpperCase() === counterparty1.toUpperCase()) {
        console.log("Connected counterparty1 wallet");
        const Token1Addr = this.state.DVPList.find((ee) => ee.id === parseInt(this.state.selectedDVP)).smartcontractaddress1;
        const Token2Addr = "";

        console.log("Token1:", Token1Addr);
        console.log("Token2:", Token2Addr);

        const Token1_abi =  JSON.parse(JSON.stringify(Token_jsonData));

        var tokenInst = new window.web3.eth.Contract(Token1_abi, Token1Addr);       
        var balance =  await tokenInst.methods.balanceOf(accounts[0]).call()
          .then(function (bal) {
            console.log("Token1 Bal:" +bal);      
            return bal;
          })  

        var symbol =  await tokenInst.methods.symbol().call()
        .then(function (sym) {
          console.log("Token1 symbol:" +sym);      
          return sym;
        });

        this.setState({ ...this.state, 
          Token1Addr: Token1Addr,  
          Token2Addr: Token2Addr, 
          TokenAddr: Token1Addr,

          TokenBalance: balance / 1e18,
          Token1Balance: balance / 1e18,
          Symbol : symbol,
          connectionStatus: "Connected Counterparty1's wallet, with Token["+symbol+"]",
        });

      } else if ((accounts[0]).toUpperCase() === counterparty2.toUpperCase()) {
        console.log("Connected counterparty2 wallet");
        const Token2Addr = this.state.DVPList.find((ee) => ee.id === parseInt(this.state.selectedDVP)).smartcontractaddress2;
        const Token1Addr = "";

        console.log("Token1:", Token1Addr);
        console.log("Token2:", Token2Addr);

        const Token2_abi =  JSON.parse(JSON.stringify(Token_jsonData));

        var tokenInst = new window.web3.eth.Contract(Token2_abi, Token2Addr);       
        var balance =  await tokenInst.methods.balanceOf(accounts[0]).call()
          .then(function (bal) {
            console.log("Token2 Bal:" +bal);      
            return bal;
          });

          var symbol =  await tokenInst.methods.symbol().call()
          .then(function (sym) {
            console.log("Token2 symbol:" +sym);      
            return sym;
          });

          this.setState({ ...this.state, 
            Token1Addr: Token1Addr,  
            Token2Addr: Token2Addr, 
            TokenAddr: Token2Addr,
  
            TokenBalance: balance / 1e18,
            Token2Balance: balance / 1e18,
            Symbol : symbol,
            connectionStatus: "Connected Counterparty2's wallet, with Token["+symbol+"]",
          });
  
      } else {
        console.log("You have connected a wallet which is not used in the DvP smart contract, please connect a wallet that belongs to either Counter Party.")
        this.setState({ ...this.state, 
          connectionStatus: "You have connected a wallet which is not used in the DvP smart contract, please connect a wallet that belongs to either Counter Party.",
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

  askUser2SignTxn = async () => {
    const web3 = window.web3;

    //
    // Step 1: User approves spending by PBM smart contract
    //
    const Token1_abi =  JSON.parse(JSON.stringify(Token1_jsonData));
    const Token = new web3.eth.Contract(Token1_abi, this.state.TokenAddr);
    const spenderAddr1 = this.state.DVPsmartcontractaddress;
    const connectedAccount = this.state.connectedAccount;
    const Token2_abi =  JSON.parse(JSON.stringify(Token2_jsonData));
    const Token2Addr1 = this.state.Token2Addr;
    const Token2Owner1 = this.state.Token2Owner;
    var amountToSend = this.state.token_amount * 1e18;


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
            console.log('Transaction executed!');
            console.log("Txn hash / Account address: "+ result);
          }
        }      
      ).on('receipt', async (data1) => {
        console.log("Setting approve() for Holder("+connectedAccount+"), Spender ("+spenderAddr1+") - Return values from Receipt of approve(): ", data1.events.Approval.returnValues);
        try { // try 1
          await Token.methods.allowance(connectedAccount, spenderAddr1)
          .call().then(async (data2) => {
            console.log("Checking allowance() for Holder("+connectedAccount+"), \nSpender ("+spenderAddr1+") \n- Return values from Receipt of allowance(): ", data2);
          });  // Token1.methods.allowance

          this.displayModal("You have successfully approved the the DvP smart contract to pull "+this.state.token_amount+" "+this.state.Symbol+" tokens from you wallet to transact with the other CounterParty." , "OK", null, null, null);

        } // try 1
        catch(err){
          console.log(err);
          this.displayModal(err , null, null, null, "OK");

        } // try 1
      });
    } // try 0
    catch(err){ // approve()
      console.log("Error approving in Metamask: ", err);
      this.displayModal("Error approving in Metamask: "+err.message , null, null, null, "OK");
    } // try 0
  }  // askUser2SignTxn

  onChangeTokenAmount(e) {
    this.setState({
      token_amount: parseInt(e.target.value),
      datachanged: true
    });
  }

  onChangeSmartContract(e) {
    const index = e.target.value;
    console.log("Selected Index = ", index);
    const newDVPsmartcontractaddress = this.state.DVPList.find((ee) => ee.id === parseInt(index)).smartcontractaddress

    this.setState({
      selectedDVP: index,
      DVPsmartcontractaddress: newDVPsmartcontractaddress,
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
      <h1>Approve DvP Smart Contract to Pull Tokens from my Wallet</h1>
      <br/>
      <form class="swap-form">
        <div class="input-group">
              <label htmlFor="DvPsmartcontract">Select DvP Smart Contract</label>
              <select
                onChange={this.onChangeSmartContract}                         
                class="select"
                id="DvPsmartcontract"
              >
                <option value=""> </option>
                {
                  Array.isArray(this.state.DVPList) ?
                  this.state.DVPList.map( (d) => {
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
              <label for="currency-from">Set Allowance [balance: {this.state.TokenBalance} {this.state.Symbol} tokens]</label>
              <input 
                type="number" 
                id="token_amount" 
                placeholder="0"  
                min="0"
                value={this.state.token_amount}
                onChange={this.onChangeTokenAmount}
                disabled={this.state.DVPsmartcontractaddress === ""}
              />
              <label>
              {this.state.Symbol} tokens 
              </label>
              <label><small>{this.state.TokenAddr}</small></label>
          </div>
    
          <button 
            type="button"
            class={(this.state.DVPsmartcontractaddress === "" || this.state.token_amount <= 0)? "uniswapdisabled" : "uniswap"}
            disabled={this.state.DVPsmartcontractaddress === "" || this.state.token_amount <= 0}

            onClick = {()=> {
                if (this.state.token_amount > 0) this.askUser2SignTxn()
              }
            } >
            Approve</button>

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

      <Modal showm={this.state.showm} handleProceed1={event =>  window.location.href='/dvpaddallowance'} handleProceed2={this.deleteDvP} handleProceed3={this.dropRequest} button1text={this.state.button1text} button2text={this.state.button2text} button3text={this.state.button3text} button0text={this.state.button0text} handleCancel={this.hideModal}>
                    {this.state.modalmsg}
      </Modal>

      </center>
    );  // return
  }  // render
}  // class dvpaddallowance



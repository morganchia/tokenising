import React, { Component, useState, useEffect } from "react";
import BondDataService from "../services/bond.service.js";
import { withRouter } from '../common/with-router.js';

import Web3 from 'web3'
import './uniswap.css';
import ERC20Token_jsonData from '../abis/ERC20TokenDSGD.abi.json';
import CashToken_jsonData from '../abis/ERC20TokenDSGD.abi.json';
import BondToken_jsonData from '../abis/ERC20TokenisedBond.abi.json';
//import BondList from "./bond-list.component";
import Modal from '../Modal.js';
import LoadingSpinner from "../LoadingSpinner.js";
import "../LoadingSpinner.css";

const BOND_UNITS = 2500;

class BondCouponAllowance extends Component {
  constructor(props) {
    super(props);
    this.onChangeTokenAmount     = this.onChangeTokenAmount.bind(this);
    this.onChangeSmartContract  = this.onChangeSmartContract.bind(this);
    this.askUser2SignTxn        = this.askUser2SignTxn.bind(this);

    this.state = {
      bondHolders: "",
      BondList: "",
      content: "",
      couponToPay: 0,
      TokenBalance: 0,
      CashTokenBalance: 0,
      BondTokenBalance: 0,
      Symbol: "",
      deployedContract: "",
      account: "",
      balance: "",
      name: "",
      symbol: "",
      walleterror: false,
      eventover: false,
      selectedBond: 0,
      selectedBondObj: null,
      Bondsmartcontractaddress: "",
      connectionStatus: "",

      connectedAccount: "",
      CashTokenAddr: "",
      BondTokenAddr: "", 
      TokenAddr: "",
      BondIssuerWallet: "", // Bond smart contract owner
    };
  }  // constructor

  async retrieveBond() {
    BondDataService.getAll()
      .then(response => {
        this.setState({
            BondList: response.data
          }, () => { // execute this after setState is completed
            this.updateBond(this.props.router.params.id)
          }
        );
        console.log("Response data from retrieveBond() BondDataService.getAll:", response.data);
      })
      .catch(e => {
        console.log(e);
      });
  } // retrieveBond

  componentDidMount() {
    
    Promise.all([this.retrieveBond(), this.setupMetaMaskAccountListener()])
    .then(() => {
      console.log("selectedBond:", this.props.router.params.id);
      this.setState({ ...this.state, selectedBond: this.props.router.params.id });  
      this.refreshData();
    })
    .catch(error => {
      console.error("Error fetching data:", error);
      // Handle error appropriately
    });

    
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
        window.alert('Please connect using MetaMask or EIP-1193 compatible wallet.')
        //setWalleterror( true );
        this.setState({ ...this.state, walleterror:true });
      }
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

  async switchNetwork(networkId) {
    try {
      if (window.ethereum) {
        // Create a new Web3 instance with the injected Ethereum provider (MetaMask or EIP-1193)
        const web3 = new Web3(window.ethereum);
  
        // Request to switch the network using Web3 and MetaMask
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: networkId }],
        });
  
        console.log('Network switched successfully!');
      } else {
        console.error('Please connect using MetaMask or EIP-1193 compatible wallet.');
      }
    } catch (error) {
      if (error.code === 4902) {
        console.log('This network is not available. You can try adding it.');
      } else {
        console.error('Failed to switch network:', error);
      }
    }
  }

  refreshData = async () => {
    try {
      console.log("Selected Bond Obj (in refreshData) = ", this.state.selectedBondObj);

      const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
      });

      this.setState({ ...this.state, connectedAccount: accounts[0] });

      console.log(accounts);
      console.log("ConnectedAccount:", accounts[0]);

      const issuerwalletaddr = this.state.selectedBondObj.recipient.walletaddress;

      console.log("issuer wallet addr:", issuerwalletaddr);

        const CashTokenAddr = this.state.selectedBondObj.campaign.smartcontractaddress;
        const BondTokenAddr = this.state.selectedBondObj.smartcontractaddress;

        console.log("CashToken:", CashTokenAddr);
//        console.log("BondToken:", BondTokenAddr);

        const CashToken_abi =  JSON.parse(JSON.stringify(ERC20Token_jsonData));

        console.log("Checking balance of cash token "+CashTokenAddr+" in wallet:"+accounts[0]+"...");

        // make sure we are connecting to the blockchain of the tokens
        this.switchNetwork( window.web3.utils.toHex(this.state.selectedBondObj.blockchain) );
        
        // Instantiate contract
        const tokenInst = new window.web3.eth.Contract(CashToken_abi, CashTokenAddr);       
        
        // Check balance
        var balance =  await tokenInst.methods.balanceOf(accounts[0]).call()
          .then(function (bal) {
            console.log("CashToken Bal:" +bal);      
            return bal;
          })  


  
        // check if the coupon rate of Bond
        const BondToken_abi =  JSON.parse(JSON.stringify(BondToken_jsonData));
        const bondContract = new window.web3.eth.Contract(BondToken_abi, BondTokenAddr);       
        
        const bondHolders = await bondContract.methods.bondHolders().call();
        console.log("bondHolders", bondHolders);
        console.log("Num holders:", bondHolders.holders.length);
        console.log("Holders:", bondHolders.holders);
        console.log("Bond holdings:", bondHolders.balances);

        var couponRate = 0;
        try {
          couponRate = await bondContract.methods.couponRate().call();
          console.log("coupon rate", couponRate.toString());
        } catch (error) {
          couponRate = this.state.selectedBondObj.couponrate;
          console.log("Error getting coupon rate:", error);
        }
        var couponinterval = 0;
        try {
          couponinterval = await bondContract.methods.couponInterval().call();
          console.log("coupon interval", couponinterval.toString());
        } catch (error) {
          couponinterval = this.state.selectedBondObj.couponinterval;
          console.log("Error getting coupon interval:", error);
        }
        const couponFreq = (() => {
          switch (couponinterval) {
            case '31536000':
              return 'Yearly'
            case '15768000':
              return 'Half-yearly'
            case '7884000':
              return 'Quarterly'
            case '2628000':
              return 'Monthly'
            default:
              return null
            }
          }
          )();
        console.log("coupon interval", couponFreq);
        const couponAdjustment = (() => {
          switch (couponinterval) {
            case '31536000':
              return 1
            case '15768000':
              return 0.5
            case '7884000':
              return 0.25
            case '2628000':
              return 1/12
            default:
              return null
            }
          }
          )();


/*
        var symbol =  await tokenInst.methods.symbol().call()
        .then(function (sym) {
          console.log("CashToken symbol:" +sym);      
          return sym;
        });
*/
        var symbol = this.state.selectedBondObj.tokenname;
        console.log("Bond Token symbol:" +symbol);      
        console.log("CashToken Balance:" +balance);      

        this.setState({ 
          ...this.state, 
          CashTokenAddr: CashTokenAddr,  
          BondTokenAddr: BondTokenAddr, 
          TokenAddr: CashTokenAddr,
          Symbol: symbol,
        }, () => {
          // do somthing in this callback
        });
        
        //const BN = require('bn.js');
        //const couponToPay = new BN(this.state.selectedBondObj.totalsupply * couponrate / 100).mul(new BN("1000000000000000000")); 
    
      if ((accounts[0]).toUpperCase() === issuerwalletaddr.toUpperCase()) {
        console.log("Connected Issuer wallet");
        this.setState({ ...this.state, 
          connectionStatus: "Connected to "+symbol+" bond Issuer's wallet:",
          CashTokenBalance: Math.floor(balance / 1e18),  
          TokenBalance: Math.floor(balance / 1e18),  
          couponToPay: this.state.selectedBondObj.totalsupply * (couponinterval/31536000) * (this.state.selectedBondObj.couponrate / 10000), // coupon rate is in basis points hence divide by 10000
          couponInterval: couponFreq,
          couponRate: this.state.selectedBondObj.couponrate,
          couponAdjustment: couponAdjustment,
          bondHolders: bondHolders,
        });
      } else {
        console.log("You have connected a wallet which is not the issuer of "+this.state.selectedBondObj.tokenname+" Bond smart contract, please connect a wallet that is the issuer of the bond token.")
        this.setState({ ...this.state, 
          CashTokenBalance: Math.floor(balance / 1e18),  
          TokenBalance: Math.floor(balance / 1e18),  
          couponToPay: this.state.selectedBondObj.totalsupply * (couponinterval/31536000) * (this.state.selectedBondObj.couponrate / 10000), // coupon rate is in basis points hence divide by 10000
          couponInterval: couponFreq,
          couponRate: this.state.selectedBondObj.couponrate,
          couponAdjustment: couponAdjustment,
          bondHolders: bondHolders,
        });
        this.setState({ ...this.state, 
          connectionStatus: "You have connected a wallet which is not the issuer of "+this.state.selectedBondObj.tokenname+" Bond smart contract, please connect a wallet that is the issuer of the bond token.",
        });
      }
    } catch (error) {
        console.log(error)
    }
  } // refreshData

  setupMetaMaskAccountListener = () => {
    const ethereum = window.ethereum;

    // Check if MetaMask or EIP-1193 wallet is installed
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
    // Step 1: User approves spending by Bond smart contract
    //
    const CashToken_abi =  JSON.parse(JSON.stringify(CashToken_jsonData));
    console.log("this.state.BondList: ", this.state.selectedBondObj);
    console.log("this.state.CashTokenAddr: ", this.state.selectedBondObj.CashTokensmartcontractaddress);
    const CashToken = new web3.eth.Contract(CashToken_abi, this.state.selectedBondObj.CashTokensmartcontractaddress);
    const spenderAddr1 = this.state.selectedBondObj.smartcontractaddress;
    const connectedAccount = this.state.connectedAccount;
    const BondToken_abi =  JSON.parse(JSON.stringify(BondToken_jsonData));
    const BondTokenAddr1 = this.state.BondTokenAddr;
    const BondIssuerWallet1 = this.state.BondIssuerWallet;
    
    
    //var amountToSend = this.state.couponToPay * 1e18;
    const BN = require('bn.js');
    const amountToSend = new BN(this.state.couponToPay).mul(new BN("1000000000000000000")); 
    

    try { // try 0
      await CashToken.methods.approve(spenderAddr1,  amountToSend.toString()).send({  // executing via Metamask's private key hence need user to approve via Metamask
          from: connectedAccount
        },
        (err, result) => {
          if(err) {
            this.displayModal("Error encountered: "+ err.message , null, null, null, "OK");

            console.log("Error executing txn(): "+ err);
            return;
          } else {
            console.log('Transaction executed!');
            console.log("Txn hash / Account address: "+ result);
          }
        }      
      ).on('receipt', async (data1) => {
        console.log("Setting approve() for Holder("+connectedAccount+"), Spender ("+spenderAddr1+") - Return values from Receipt of approve(): ", data1.events.Approval.returnValues);
        try { // try 1
          await CashToken.methods.allowance(connectedAccount, spenderAddr1)
          .call().then(async (data2) => {
            console.log("Checking allowance() for Holder("+connectedAccount+"), \nSpender ("+spenderAddr1+") \n- Return values from Receipt of allowance(): ", data2);
          });  // CashToken.methods.allowance

          this.displayModal("You have successfully approved the the Bond smart contract to pull "+this.state.couponToPay.toLocaleString()+" "+this.state.selectedBondObj.campaign.tokenname+" tokens from your wallet for coupon payment." , "OK", null, null, null);

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

  transferToSmartContract = async () => {
    const web3 = window.web3;

    //
    // Step 1: User approves spending by Bond smart contract
    //
    const CashToken_abi =  JSON.parse(JSON.stringify(CashToken_jsonData));
    console.log("this.state.BondList: ", this.state.selectedBondObj);
    console.log("this.state.CashTokenAddr: ", this.state.selectedBondObj.CashTokensmartcontractaddress);
    const CashToken = new web3.eth.Contract(CashToken_abi, this.state.selectedBondObj.CashTokensmartcontractaddress);
    const spenderAddr1 = this.state.selectedBondObj.smartcontractaddress;
    const connectedAccount = this.state.connectedAccount;
    const BondToken_abi =  JSON.parse(JSON.stringify(BondToken_jsonData));
    const BondTokenAddr1 = this.state.BondTokenAddr;
    const BondIssuerWallet1 = this.state.BondIssuerWallet;
    
    
    //var amountToSend = this.state.couponToPay * 1e18;
    const BN = require('bn.js');
    const amountToSend = new BN(this.state.couponToPay).mul(new BN("1000000000000000000")); 
    

    try { // try 0


      const gasEstimate = await CashToken.methods.transfer(spenderAddr1, amountToSend.toString())
  .estimateGas({ from: connectedAccount });

      await CashToken.methods.transfer(spenderAddr1,  amountToSend.toString()).send({  // executing via Metamask's private key hence need user to approve via Metamask
          from: connectedAccount,
          gas: gasEstimate * 2,
        },
        (err, result) => {
          if(err) {
            this.displayModal("Error encountered: "+ err.message , null, null, null, "OK");

            console.log("Error executing txn(): "+ err);
            return;
          } else {
            console.log('Transaction executed!');
            console.log("Txn hash / Account address: "+ result);
          }
        }      
      ).on('receipt', async (data1) => {
        console.log("Response:", data1)
        //console.log("Setting approve() for Holder("+connectedAccount+"), Spender ("+spenderAddr1+") - Return values from Receipt of approve(): ", data1.events.Approval.returnValues);
        if (data1.status === true) {
          this.displayModal("You have successfully transferred "+this.state.couponToPay.toLocaleString()+" "+this.state.selectedBondObj.campaign.tokenname+" to the Bond smart contract for coupon payment." , "OK", null, null, null);
        } else {
          this.displayModal("Error encountered, please check your wallet if the token has been transferred after 5 minutes. If not, please try again." , "OK", null, null, null);
        }
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
  }  // transferToSmartContract

  onChangeTokenAmount(e) {
    this.setState({
      couponToPay: parseInt(e.target.value),
      datachanged: true
    });
  }

  updateBond(tokenid) {
    const selectedBondObj1 = this.state.BondList.find((ee) => ee.id === parseInt(tokenid));
    const newBondsmartcontractaddress = selectedBondObj1? selectedBondObj1.smartcontractaddress: null;

    console.log("Selected Bond Obj (in updateBond) = ", selectedBondObj1);

    this.setState({
        selectedBond: tokenid,
        Bondsmartcontractaddress: newBondsmartcontractaddress,
        selectedBondObj: selectedBondObj1,
        datachanged: true
      }, () => { // execute next step only after setState is completed
        this.refreshData(); // check Metamask
      }
    );

  }

  onChangeSmartContract(e) {
    const tokenid = e.target.value;
    console.log("Selected Index = ", tokenid);
    this.updateBond(tokenid);
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

  shorten(s) {
    return(s.substring(0,6) + "..." + s.slice(-3));
  }

  render() {
    return (
      <center>
      <div class="outer">
        <div class="swap-container">
        <h1>Issuer funds <b>Cash Tokens</b> for <b>Coupon Payment</b></h1>
        <br/>
        <form class="swap-form">
          <div class="input-group">
                <label htmlFor="Bondsmartcontract"><small>Select Bond Smart Contract</small></label>
                <select
                  onChange={this.onChangeSmartContract}                         
                  class="select"
                  id="Bondsmartcontract"
                >
                  <option value=""> </option>
                  {
                    Array.isArray(this.state.BondList) ?
                    this.state.BondList.map( (d) => {
                        // https://stackoverflow.com/questions/61128847/react-adding-a-default-option-while-using-map-in-select-tag
                          return <option value={d.id} selected={parseInt(d.id) === parseInt(this.state.selectedBond? this.state.selectedBond : "")}>{d.tokenname} ({d.name} - {d.smartcontractaddress})</option>

                          //return <option value={d.id}>{d.name} ({d.smartcontractaddress})</option>
                      })
                    : null
                  }
                  {//this.refreshData()
                  }
                </select>
          </div>
          <div class="input-group">
              <label for="currency-from"><small>Coupon payment {this.state.couponInterval? "["+this.state.couponInterval+"]":""} {this.state.selectedBondObj? "[balance: "+this.state.CashTokenBalance+" "+this.state.selectedBondObj.campaign.tokenname+"]" : null}</small></label>
              <input 
                type="number" 
                id="token_amount" 
                placeholder="0"  
                min="0"
                value={this.state.couponToPay}
                onChange={this.onChangeTokenAmount}
                
              />

  {/*
              <label><small>{this.state.selectedBondObj ? "Cash token: "+this.state.selectedBondObj.campaign.tokenname : null}  &nbsp;&nbsp;&nbsp;</small></label>
              <label><small>{this.state.selectedBondObj ? "Bond token: "+this.state.selectedBondObj.tokenname : null} <br /></small></label>
  */}
              <label><small>
              {this.state.selectedBondObj ? "Blockchain: "+(() => {
                          switch (this.state.selectedBondObj.blockchain) {
                            case 80001:
                              return 'Polygon Testnet Mumbai (Deprecated)'
                            case 80002:
                              return 'Polygon Testnet Amoy'
                            case 11155111:
                              return 'Ethereum Testnet Sepolia'
                            case 43113:
                              return 'Avalanche Testnet Fuji'
                            case 137:
                              return 'Polygon Mainnet'
                            case 1:
                              return 'Ethereum  Mainnet'
                            case 43114:
                              return 'Avalanche Mainnet'
                            default:
                              return null
                          }
                        }
                      )()
                    : null}                
              <br /></small></label>
              <br />
              <div>
              <label><small>
              {
              // this.state.selectedBondObj? this.state.selectedBondObj.smartcontractaddress: null
              }
              {Array.isArray(this.state.bondHolders.holders) && Array.isArray(this.state.bondHolders.balances)?
              (
              <>
              <b>Bond Investors:</b>
              <table style={{border : '1px solid', width: '100%'}}>
              <tr><td>S/N</td><td>Investors</td><td>Holdings</td><td>Coupon due</td></tr>
              
                {this.state.bondHolders.holders.map((hh, index) => 
                    {
                      return (<tr><td>{index}</td><td>{this.shorten(hh)}</td><td>{Math.floor(this.state.bondHolders.balances[index]/1e18)}</td><td>{(this.state.bondHolders.balances[index]/1e18) * (this.state.couponInterval/31536000) * (this.state.couponRate / 10000)} {this.state.selectedBondObj.campaign.tokenname}</td></tr>)
                    }
                )}
              
              </table>              
              </>
              )
              : null
              }
              </small></label>
              </div>
          </div>

          <button 
            type="button"
            class={this.state.Bondsmartcontractaddress === "" || (this.state.couponToPay <= 0 )? "uniswapdisabled" : "uniswap"}
            disabled={this.state.Bondsmartcontractaddress === "" || (this.state.couponToPay <= 0 )}

            onClick = {()=> {
                //if (this.state.couponToPay > 0) this.askUser2SignTxn()
                if (this.state.couponToPay > 0) this.transferToSmartContract()
              }
            } >
            Transfer
          </button>

          <br/>
          {this.state.connectedAccount && (
            <>
              <div class="input-group">
                <label style={{color:'blue'}}><small>{this.state.connectionStatus}</small></label>
                <label style={{color:'blue'}}><small>{this.state.connectedAccount}</small></label>

              </div>

            </>
          )}
        </form>
        </div>
      </div>

      <Modal showm={this.state.showm} handleProceed1={event =>  window.location.href='/bondcouponallowance'} handleProceed2={this.deleteBond} handleProceed3={this.dropRequest} button1text={this.state.button1text} button2text={this.state.button2text} button3text={this.state.button3text} button0text={this.state.button0text} handleCancel={this.hideModal}>
                    {this.state.modalmsg}
      </Modal>

      </center>
    );  // return
  }  // render
}  // class bondcouponallowance

export default withRouter(BondCouponAllowance);
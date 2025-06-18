import React, { Component, useState, useEffect } from "react";
import PBMDataService from "../services/pbm.service";

import Web3 from 'web3'
import './uniswap.css';
import DSGDContract_jsonData from '../abis/ERC20TokenDSGD.abi.json';
import PBMContract_jsonData from '../abis/ERC20TokenPBM.abi.json';

const INFURA_API_KEY = "9e5e7f94e05c4a7ea7bc11400626dc0b";
const CONTRACT_OWNER_WALLET = "0x35f4b28D730398992525F0f6Cf5b6D1d94c98feA";
// const ETHEREUM_NETWORK = "polygon-mumbai"; // decommed
const ETHEREUM_NETWORK = "sepolia";
const APP_SIGNER_PRIVATE_KEY = "7c791cb354549572b12691ac095f1e0c8e5509d2da07afd1b6bd0b999e39eb21";

//const INFURA_API_KEY = process.env.REACT_APP_INFURA_API_KEY;
//const CONTRACT_OWNER_WALLET = process.env.REACT_APP_CONTRACT_OWNER_WALLET;
//const ETHEREUM_NETWORK = process.env.REACT_APP_ETHEREUM_NETWORK;


export default class dsgd2pbm extends Component {
  constructor(props) {
    super(props);
    this.onChangeDSGDamount = this.onChangeDSGDamount.bind(this);
    this.askUser2SignTxn = this.askUser2SignTxn.bind(this);

    this.state = {
      content: "",
      dsgd_amount: 0,
      pbm_amount: 0,
      dsgdavailable: 0,
      deployedContract: "",
      account: "",
      balance: "",
      name: "",
      symbol: "",
      walleterror: false,
      eventover: false,
      connectedAccount: "",
      DSGDContractAddr: "0x7db290a32832B740E602465024c63F887a2b0A91",
      PBMContractAddr: "0xEd4a30a56eA2318B5a5E8F5C6E08996Db8551847", 
//      spenderAddr: "0x0822a8B31975982bB19e930A22B98f724b1675C6",  // PBM smart contract addr      
      PBMContractOwner: "0xf72e9F9a9a5F0e031d2507692b884b4444133688", // PBM smart contract owner
    };
  }

  retrievePBM() {
    PBMDataService.getAll()
      .then(response => {
        this.setState({
          pbm: response.data
        });
        console.log("Response data from retrievePBM() PBMDataService.getAll:", response.data);
      })
      .catch(e => {
        console.log(e);
      });
  }

  componentDidMount() {
    
    const loadWeb3 = async () => {
      if (window.ethereum) {
        //if (window.web3 === "" || window.web3 === null || window.web3 === undefined) {
          window.web3 = new Web3(window.ethereum);
        //}

        this.updateData();
        /*
        try {
            const accounts = await window.ethereum.request({
                method: "eth_requestAccounts",
            });
            console.log(accounts);
            this.setState({ ...this.state, connectedAccount: accounts[0] });

            const DSGDContract_abi =  JSON.parse(JSON.stringify(DSGDContract_jsonData));

            var tokenInst = new window.web3.eth.Contract(DSGDContract_abi, this.state.DSGDContractAddr);       
            var balance =  await tokenInst.methods.balanceOf(accounts[0]).call()
              .then(function (bal) {
                console.log("Bal:" +bal);      
                return bal;
              })
            this.setState({ ...this.state, dsgdavailable: balance / 1e18});

        } catch (error) {
            console.log(error)
        }
        */
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
      this.retrievePBM();

    }
  /*
    useEffect(() => {
      if (window.ethereum) {
     
        window.ethereum.on("accountsChanged", () => {
          //window.location.reload();
          console.log("Metamask acct changed!!!");
        });
      }
    });

    componentDidMount() {
      this.setupMetaMaskAccountListener();
    }
  

  */
    
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

  }

  componentWillUnmount() {
    if (typeof window.ethereum !== 'undefined') {
      // Remove the event listener when the component unmounts
      window.ethereum.removeListener('accountsChanged', this.handleAccountsChanged);
    }
  }

   updateData = async () => {
    try {
      const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
      });
      console.log(accounts);
      this.setState({ ...this.state, connectedAccount: accounts[0] });

      const DSGDContract_abi =  JSON.parse(JSON.stringify(DSGDContract_jsonData));

      var tokenInst = new window.web3.eth.Contract(DSGDContract_abi, this.state.DSGDContractAddr);       
      var balance =  await tokenInst.methods.balanceOf(accounts[0]).call()
        .then(function (bal) {
          console.log("Bal:" +bal);      
          return bal;
        })  
      this.setState({ ...this.state, dsgdavailable: balance / 1e18});

    } catch (error) {
        console.log(error)
    }
  }
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
          this.updateData();
          //window.location.reload();
          // Or you could update the component's state to reflect the account change
        }
      };

      ethereum.on('accountsChanged', this.handleAccountsChanged);
    }
  }
/*
  async function checkDSGDBalance() {
    const DSGDContract_abi =  JSON.parse(JSON.stringify(DSGDContract_jsonData));

    var tokenInst = new window.web3.eth.Contract(DSGDContract_abi, this.state.DSGDContractAddr);       
    var balance =  await tokenInst.methods.balanceOf(this.state.connectedAccount).call()
      .then(function (bal) {
        console.log("Bal:" +bal);      
        return bal;
      })
    this.setState({ ...this.state, dsgdavailable: balance / 1e18});
  }
  */

  askUser2SignTxn = async () => {
    const web3 = window.web3;

    //
    // Step 1: User approves spending by PBM smart contract
    //
    const DSGDContract_abi =  JSON.parse(JSON.stringify(DSGDContract_jsonData));
    const DSGDContract = new web3.eth.Contract(DSGDContract_abi, this.state.DSGDContractAddr);
//    const spenderAddr1 = this.state.spenderAddr;
    const connectedAccount = this.state.connectedAccount;
    const PBMContract_abi =  JSON.parse(JSON.stringify(PBMContract_jsonData));
    const PBMContractAddr1 = this.state.PBMContractAddr;
    const PBMContractOwner1 = this.state.PBMContractOwner;
    
    //var amountToSend = this.state.dsgd_amount * 1e18;
    const BN = require('bn.js');
    const amountToSend = new BN(this.state.dsgd_amount).mul(new BN("1000000000000000000")); 


    try { // try 0
      await DSGDContract.methods.approve(PBMContractAddr1,  amountToSend.toString()).send({  // executing via Metamask's private key hence need user to approve via Metamask
          from: connectedAccount
        },
        (err, result) => {
          if(err) {
            alert("Error encountered: "+ err.message);
            console.log("Error executing approve(): "+ err);
            return;
          } else {
            console.log('Transaction executed!');
            console.log("Txn hash / Account address: "+ result);
          }
        }      
      ).on('receipt', async (data1) => {
        console.log("Setting approve() for Holder("+connectedAccount+"), Spender ("+PBMContractAddr1+") - Return values from Receipt of approve(): ", data1.events.Approval.returnValues);
        try { // try 1
          await DSGDContract.methods.allowance(connectedAccount, PBMContractAddr1)
          .call().then(async (data2) => {
            console.log("Checking allowance() for Holder("+connectedAccount+"), \nSpender ("+PBMContractAddr1+") \n- Return values from Receipt of allowance(): ", data2);
            try {  // try 2
              // https://stackoverflow.com/questions/67736753/using-local-private-key-with-web3-js
              const createInstance = () => {
                const bscProvider = new Web3(
                  new Web3.providers.HttpProvider(
                    `https://${ETHEREUM_NETWORK}.infura.io/v3/${INFURA_API_KEY}`
                  ),
                );
                console.log("PBM Contract Addr: "+ PBMContractAddr1);
                const web3BSC = new Web3(bscProvider);
                const transactionContractInstance = new web3BSC.eth.Contract(
                  PBMContract_abi,
                  PBMContractAddr1,
                );
                return { web3BSC, transactionContractInstance };
              }; // createInstance

              const updateSmartContract = async () => {  //parameters you need
                try {  // try 3
                  const contractInstance = createInstance();   // executing via Infura using PBMcontractowner's private key
                // need to calculate gas fees for the addBonus
                //  console.log("Estimating gas fee for wrapMint....");
                  console.log("wrapMint(): From ("+PBMContractAddr1+"), To ("+connectedAccount+")");

                  const gasFees =
                  await contractInstance.transactionContractInstance.methods
                  .wrapMint(
                    connectedAccount, amountToSend.toString() 
                  )
                  .estimateGas({ 
                    from: PBMContractOwner1, //caller of this func
//                      to:PBMContractAddr1 
                  })
                  .then((gasAmount) => {
                    console.log("Estimated gas amount for wrapMint: ", gasAmount)
                    return gasAmount;
                  })
                  .catch((error2) => {
                    console.log("Error while estimating Gas fee: ", error2)
                    return 2100000;  // if error then use default fee
                  });
                  console.log("Estimated gas fee for wrapMint: ", gasFees);

                  const tx = {
                    // this is the address responsible for this transaction
                    from: CONTRACT_OWNER_WALLET,
                    // target address, this could be a smart contract address
                    to: PBMContractAddr1,
                    // gas fees for the transaction
                    gas: gasFees,
                    //gas: 2100000,
                    // this encodes the ABI of the method and the arguments
                    data: await contractInstance.transactionContractInstance.methods
                      .wrapMint(
                        connectedAccount, amountToSend.toString()
                      )
                      .encodeABI(),
                  };

                  console.log("Create wrapMint() txn data: ", tx.data);

                  // sign the transaction with a private key. It'll return messageHash, v, r, s, rawTransaction, transactionHash
                  const signPromise =
                    await contractInstance.web3BSC.eth.accounts.signTransaction(
                      tx,
                      APP_SIGNER_PRIVATE_KEY,
                    );
                  console.log("Create signPromise: ", signPromise);

                  // the rawTransaction here is already serialized so you don't need to serialize it again
                  // Send the signed txn
                  const sendTxn =
                    await contractInstance.web3BSC.eth.sendSignedTransaction(
                      signPromise.rawTransaction,
                      (error1, hash) => {
                        if (error1) {
                            console.log("Something went wrong when submitting your signed transaction:", error1)
                        } else {
                            console.log("Txn sent!, hash: ", hash);
                            var timer = 1;
                            // retry every second to chk for receipt
                            const interval = setInterval(() => {
                                console.log("Attempting to get transaction receipt...");
    
                                // https://ethereum.stackexchange.com/questions/67232/how-to-wait-until-transaction-is-confirmed-web3-js
                                web3.eth.getTransactionReceipt(hash, (error3, receipt) => {
                                    if (receipt) {
                                        clearInterval(interval);

                                        console.log('--> RECEIPT received <--');
                                        console.log('Receipt: ', receipt);
                                        if (receipt.status) {  // true === success
                                          alert("Transaction status: Success");

                                          this.setState({
                                            dsgd_amount: 0,
                                            pbm_amount: 0,
                                            datachanged: true
                                          });
                                          
                                        } else {
                                          alert("Transaction status: Failed! ");
                                          clearInterval(interval);
                                        }
                                    }
                                    if (error3) {
                                        console.log("!! getTransactionReceipt error: ", error3)
                                        clearInterval(interval);
                                    }
                                });
                                timer++;
                            }, 1000);
                        }
                    })
                  .on("error", err => {
                      console.log("sentSignedTxn error: ", err)
                      // do something on transaction error
                  });
                  console.log("sendSignedTxn: ", sendTxn);
                  return Promise.resolve(sendTxn);
                } catch(error) {
                  throw error;
                } // try 3
              } // function updateSmartContract

              await updateSmartContract();

            } // try 2
            catch(err){
              console.log(err);
            }  // try 2
          });  // DSGDContract.methods.allowance
        } // try 1
        catch(err){
          console.log(err);
        } // try 1
      });
    } // try 0
    catch(err){ // approve()
      console.log("Error approving in Metamask: ", err);
    } // try 0
  }  // askUser2SignTxn

  onChangeDSGDamount(e) {
    this.setState({
      dsgd_amount: e.target.value,
      pbm_amount: e.target.value,
      datachanged: true
    });
  }

  render() {
    return (
      <center>
      <div class="outer">
      <div class="swap-container">
      <h1>Swap DSGD for PBM</h1>
      <br/>
      <form class="swap-form">
          <div class="input-group">
              <label for="currency-from">You pay [balance: {this.state.dsgdavailable} DSGD]</label>
              <input 
                type="number" 
                id="currency-from" 
                placeholder="0"  
                min="0"
                value={this.state.dsgd_amount}
                onChange={this.onChangeDSGDamount}
              />
              <label>
                  Digital Singapore Dollar (DSGD) 
              </label>
              <label><small>{this.state.DSGDContractAddr}</small></label>

          </div>
    <br/>
          <div class="input-group">
              <label for="currency-to">You receive</label>
              <input type="number" id="currency-to" placeholder="0" value={this.state.pbm_amount} disabled />
              <label>
                  Purpose Bound Money (PBM)
              </label>
              <label><small>{this.state.PBMContractAddr}</small></label>

          </div>
          <button 
            type="button"
            class="uniswap"
            onClick = {()=> {
                if (this.state.dsgd_amount > 0 && this.state.pbm_amount > 0) this.askUser2SignTxn()
              }
            } >
            Swap</button>
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
      </center>
    );  // return
  }  // render
}  // class dsgd2pbm


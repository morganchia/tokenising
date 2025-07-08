import React, { Component } from "react";
import BondDataService from "../services/bond.service";
import CampaignDataService from "../services/campaign.service";
import TransferDataService from "../services/transfer.service";
import PBMDataService from "../services/pbm.service";
import RecipientDataService from "../services/recipient.service";
import UserOpsRoleDataService from "../services/user_opsrole.service";
import { withRouter } from '../common/with-router';
import AuthService from "../services/auth.service";
import { Link } from "react-router-dom";
import validator from 'validator';
import Modal from '../Modal.js';
import LoadingSpinner from "../LoadingSpinner";
import "../LoadingSpinner.css";

const BOND_UNITS = 2500;

class Bond extends Component {
  constructor(props) {
    super(props);

    this.getBond = this.getBond.bind(this);
    this.triggerBondCouponPayment = this.triggerBondCouponPayment.bind(this);
    this.showModal_Leave = this.showModal_Leave.bind(this);
    this.showModal_dropRequest = this.showModal_dropRequest.bind(this);
    this.hideModal = this.hideModal.bind(this);

    this.state = {      
      recipientList: {
        id: null,
        name: "",
        walletaddress: "",
        bank: "",
        bankaccount: "",
        type: ""
      },

      adddatafield : false,
      hidedatafield1 : true,
      hidedatafield2 : true,  


      currentBond: {
        id: null,
        name: "",
        description: "",
        underlyingTokenID1: "",
        underlyingTokenID2: "",
        blockchain: "",
        smartcontractaddress:"",
        smartcontractaddress1:"",
        smartcontractaddress2:"",
        counterparty1: "",
        counterparty2: "",
        amount1: "",
        amount2: "",
        issuedate: "",
        maturitydate: "",

        txntype: 0,
        checker: "",
        approver: "",
        checkerComments: "",
        approverComments: "",
        approvedbondid: null,
        actionby: "",
        name_changed: 0,
        description_changed: 0,
        issuedate_changed: 0,
        maturitydate_changed: 0,
        counterparty1_changed: 0,
        counterparty2_changed: 0,
        amount1_changed: 0,
        amount2_changed: 0,
      },

      originalBond: {
        id: null,
        name: "",
        description: "",
        underlyingTokenID1: "",
        underlyingTokenID2: "",
        smartcontractaddress:"",
        smartcontractaddress1:"",
        smartcontractaddress2:"",
        blockchain: "",
        counterparty1: "",
        counterparty2: "",
        amount1: "",
        amount2: "",
        issuedate: "",
        maturitydate: "",
  
        txntype: 0,
        checker: "",
        approver: "",
        checkerComments: "",
        approverComments: "",
        approvedbondid: null,
        actionby: "",
        name_original: "",
        description_original: "",
        issuedate_original: "",
        maturitydate_original: "",
        counterparty1_original: "",
        counterparty2_original: "",
        amount1_original: "",
        amount2_original: "",
      },

      checkerList: {
        id: null,
        username: "",
      },
      approverList: {
        id: null,
        username: "",
      },

      option1 : undefined,
      currentUser: undefined,
      isMaker: false,
      isChecker: false,
      isApprover: false,
      isNewBond: null,
      
      err: "",
      datachanged: false,
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
      }
    };
  }

  retrieveAllMakersCheckersApprovers() {
    UserOpsRoleDataService.getAllMakersCheckersApprovers("bond")
      .then(response => {
        console.log("Data received by getAllCheckerApprovers:", response.data);
        let chkList = response.data.find(element => element.name.toUpperCase() === "CHECKER");
        let apprList = response.data.find(element => element.name.toUpperCase() === "APPROVER");

        const first_array_record = [{}];
        this.setState({
          checkerList: [first_array_record].concat(chkList.user || []), // Fallback to empty array
          approverList: [first_array_record].concat(apprList.user || []) // Fallback to empty array
        });
        console.log("checkerList: ", chkList.user);
        console.log("approverList: ", apprList.user);      
      })
      .catch(e => {
        console.log(e);
        //return(null);
      });
  }

  componentDidMount() {
    const user = AuthService.getCurrentUser();

    if (!user) this.setState({ redirect: "/home" });
    this.setState({ currentUser: user, userReady: true })

    this.getBond(user, this.props.router.params.id);
//    this.getAllUnderlyingAssets();
//    this.getAllCounterpartys();
//    this.retrieveAllMakersCheckersApprovers();
  }

  getAllInvestorsById(id) {
    if (id !== undefined) {
      console.log("getAllInvestorsById ID :", id);

      try {
        BondDataService.getAllInvestorsById(id)
          .then(response => {
            console.log("response.data :", response.data);

            this.setState({
              bondHolders: response.data,
            });
  /*
            console.log("Response from findOne(id):",response.data);
            console.log("totalsupply: ", response.data.totalsupply);
            console.log("couponrate: ", response.data.couponrate);
            console.log("couponFreq: ", response.data.couponFreq);
            console.log("couponAdjustment: ", couponAdjustment);
            console.log("couponinterval: ", response.data.couponinterval);
            console.log("couponToPay: ", response.data.totalsupply * couponAdjustment * (response.data.couponrate / 100));
  */
          })
          .catch(e => {
            console.log("Error from getAllInvestorsById(id):", e);
            //alert("Error: " + e.response.data.message);
          });
      } catch(e) {
        console.log("Error9:"+ e);
      }
    }
  }


  getBond(user, id) {
    console.log("+++ findOne(id):", id);

    if (id !== undefined) {
      BondDataService.findOne(id)
        .then(response => {
          response.data.actionby = user.username;
          console.log("response.data :", response.data);
          
          const couponFreq = (() => {
            switch (response.data.couponinterval.toString()) {
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
  
            const couponAdjustment = (() => {
              switch (response.data.couponinterval.toString()) {
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
    
          this.setState({
            currentBond: {
              ...response.data,
              couponFreq: couponFreq,
              couponToPay: response.data.totalsupply * couponAdjustment * (response.data.couponrate / 100) * BOND_UNITS,
              originalBond: response.data,
              couponRate: parseInt(response.data.couponrate),
              couponAdjustment: parseFloat(couponAdjustment),
            }
          });
          
          console.log("Response from findOne(id):",response.data);
          console.log("totalsupply: ", response.data.totalsupply);
          console.log("couponrate: ", response.data.couponrate);
          console.log("couponFreq: ", response.data.couponFreq);
          console.log("couponAdjustment: ", couponAdjustment);
          console.log("couponinterval: ", response.data.couponinterval);
          console.log("couponToPay: ", response.data.totalsupply * couponAdjustment * (response.data.couponrate / 100));

          this.getAllInvestorsById(id);


          let ismaker= user.opsrole.find((el) => el.opsrole.name.toUpperCase() === "MAKER" && user.id === response.data.maker);
          console.log("isMaker:", (ismaker === undefined? false: true));
          this.setState({ isMaker: (ismaker === undefined? false: true),});
      
          let ischecker= user.opsrole.find((el) => el.opsrole.name.toUpperCase() === "CHECKER" && user.id === response.data.checker);
          console.log("isChecker:", (ischecker === undefined? false: true));
          this.setState({ isChecker: (ischecker === undefined? false: true),});
          //if (ischecker !== undefined) {  // clears the checkers comments
          //  this.setState({ isChecker: true, currentBond: {checkerComments: ""}, });
          //}
          
          let isapprover= user.opsrole.find((el) => el.opsrole.name.toUpperCase() === "APPROVER" && user.id === response.data.approver);
          console.log("isApprover:", (isapprover === undefined? false: true));
          this.setState({ isApprover: (isapprover === undefined? false: true),});
          /*
          if (isapprover !== undefined) {
            this.setState({ isApprover: true, currentBond: {approverComments: ""}, });
          }
          */

          this.setState({ isNewBond : (response.data.smartcontractaddress === "" || response.data.smartcontractaddress === null) });
        })
        .catch(e => {
          console.log("Error from findOne(id):", e);
          //alert("Error: " + e.response.data.message);
        });
    }
  }

  getAllUnderlyingAssets() {
    CampaignDataService.getAll()
      .then(response => {
        if (response.data.length === 0) {
          this.setState({
            underlyingDSGDList: [ { id:-1, name:"No campaign available, please create a campaign first."}],
          });
        } else {          
          this.setState({
            underlyingDSGDList: response.data
          });
        }
      })
      .catch(e => {
        console.log(e);
        //return(null);
      });

      PBMDataService.getAll()
      .then(response => {
        if (response.data.length === 0) {
          this.setState({
            PBMList: [ { id:-1, name:""}],
          });
        } else {          
          var first_array_record = [  // add 1 empty record to front of array which is the option list
            { }
          ];
          this.setState({
            PBMList: [first_array_record].concat(response.data)
          });
        }
        console.log("Response data from retrievePBM() PBMDataService.getAll:", response.data);
      })
      .catch(e => {
        console.log(e);
      });
  }

  getAllCounterpartys() {
    RecipientDataService.findAllRecipients()
      .then(response => {

        this.setState({
            recipientList: response.data
        });
      })
      .catch(e => {
        console.log(e);
        //return(null);
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

async validateForm() {    
    var err = "";
        
      // dont need t check description, it can be empty
    if (this.state.currentBond.amount1 === "") err += "- Amount 1 cannot be empty\n";
    if (parseInt(this.state.currentBond.amount1) <=  0) err += "- Amount 1 must be more than zero\n";
    if (! validator.isDate(this.state.currentBond.issuedate)) err += "- Start Date is invalid\n";
    if (! validator.isDate(this.state.currentBond.maturitydate)) err += "- End Date is invalid\n";
    if (this.state.currentBond.issuedate.trim() !== "" && this.state.currentBond.maturitydate.trim() !== "" && this.state.currentBond.issuedate > this.state.currentBond.maturitydate) err += "- Start date cannot be later than End date\n";    

    console.log("start date:'"+this.state.currentBond.issuedate+"'");
    console.log("end date:'"+this.state.currentBond.maturitydate+"'");
    console.log("Start > End? "+ (this.state.currentBond.issuedate > this.state.currentBond.maturitydate));
/*
    if (this.state.currentBond.checker === "" || this.state.currentBond.checker === null) err += "- Checker cannot be empty\n";
    if (this.state.currentBond.approver === "" || this.state.currentBond.approver === null) err += "- Approver cannot be empty\n";
    if (this.state.currentBond.checker === this.state.currentUser.id.toString() 
        && this.state.currentBond.approver === this.state.currentUser.id.toString()) {
      err += "- Maker, Checker and Approver cannot be the same person\n";
    } else {
      if (this.state.currentBond.checker === this.state.currentUser.id.toString()) err += "- Maker and Checker cannot be the same person (yourself)\n";
      if (this.state.currentBond.approver === this.state.currentUser.id.toString()) err += "- Maker and Approver cannot be the same person (yourself)\n";
      if (this.state.currentBond.checker!==null && this.state.currentBond.checker!=="" 
            && this.state.currentBond.checker === this.state.currentBond.approver) err += "- Checker and Approver cannot be the same person\n";
    }
*/
    if (err !=="" ) {
      err = "Form validation issues found:\n"+err;
      //alert(err);
      this.displayModal(err, null, null, null, "OK");
      err = ""; // clear var
      return false;
    }
    return true;
  }

  async triggerBondCouponPayment() {
  
  if (await this.validateForm()) { 
        console.log("Form Validation passed");
  
        console.log("this.state.bondHolders.length = ", this.state.bondHolders.holders.length);
        this.show_loading();
        var error1 = false;
        var transferData = null;
        var index = 0;
       // for (index = 0; index<this.state.bondHolders.holders.length && !error1; index++) {
          for (index = 0; index<1 && !error1; index++) {

          console.log("this.state.bondHolders.balances[index])", this.state.bondHolders.balances[index]);
          console.log("this.state.bondHolders.holders[index])", this.state.bondHolders.holders[index]);
          console.log("this.state.currentBond.couponRate", this.state.currentBond.couponRate);
          console.log("this.state.currentBond.couponAdjustment", this.state.currentBond.couponAdjustment);

          var recipientwallet1 = this.state.bondHolders.holders[index];

          var amountToPay = (this.state.bondHolders.balances[index]/1e18) * (this.state.currentBond.couponRate/100) * this.state.currentBond.couponAdjustment;
          console.log("amountToPay", amountToPay);

          transferData = {
              campaign: this.state.currentBond.campaign,
              transferAmount: amountToPay,
              receiver: recipientwallet1,
              sender: this.state.currentBond.smartcontractaddress,
          }

          console.log("transferData: ", transferData);

//          await TransferDataService.transferToWallet(
          await BondDataService.triggerBondCouponPaymentById(
            this.state.currentBond.id,
            transferData,
          ) // BondDataService.transferToWallet
          .then(response => {
//            this.hide_loading();
    
            console.log("Response: ", response);
            console.log("IsLoad=false");
      
            this.setState({  
              datachanged: false,
            });
//            this.displayModal("Bond coupon payment of "+amountToPay.toLocaleString()+" "+this.state.currentBond.campaign.tokenname+" to "+recipientwallet1+" transferred successfully.", "OK", null, null, null);
            if (index === this.state.bondHolders.holders.length) {
              this.hide_loading();
              this.displayModal("Bond coupon payment completed successfully.", null, null, null, "OK");
            }
          }) // BondDataService.transferToWallet
          .catch(e => {
            this.hide_loading();
            error1 = true;

            try {
              console.log("e->response->data->msg:  ", e.response.data.message);
              console.log(e.message);
              this.displayModal("Bond coupon payment submit failed.\n"+e.response.data.message, null, null, null, "OK");
//              window.alert("Bond coupon payment submit failed. "+e.response.data.message, null, null, null, "OK");
                  // Need to check draft and approved bond names
  //            if (e.response.data.message.includes("SequelizeUniqueConstraintError")) {
  //              this.displayModal("The Bond submit failed. The new bond name is already used, please use another name.", null, null, null, "OK");
  //            }
            } catch(e) {
              this.hide_loading();
    
              console.log("Error: ",e);
              console.log("Response error:", e.response.data.message);
              if (e.response.data.message !== "") 
                this.displayModal("Error: "+e.response.data.message+". Please contact tech support.", null, null, null, "OK");
              else
                this.displayModal("Error: "+e.message+". Please contact tech support.", null, null, null, "OK");
            } 
          }); // BondDataService.transferToWallet
          

          this.hide_loading();
          if (error1) 
              break;
        } // for loop
    } // if
  } // triggerBondCouponPayment()
  

  show_loading() {
    this.setState({isLoading: true});
  }

  hide_loading(){
    this.setState({isLoading: false});
  }

  showModal_Leave = () => {
    this.displayModal("You have made changes. Are you sure you want to leave this page without submitting?", "Yes, leave", null, null, "Cancel");
  };

  showModal_dropRequest = () => {
    this.displayModal("Are you sure you want to Drop this Request?", null, null, "Yes, drop", "Cancel");
  };
  
  showModalDelete = () => {
    this.displayModal("Are you sure you want to Delete this Bond?", null, "Yes, delete", null, "Cancel");
  };

  hideModal = () => {
    this.setState({ showm: false });
  };

  shorten(s) {
    return(s.substring(0,6) + "..." + s.slice(-3));
  }

  render() {
    const { underlyingDSGDList, bondHolders, PBMList, recipientList, currentBond, checkerList, approverList } = this.state;
    console.log("Render underlyingDSGDList:", underlyingDSGDList);
    console.log("Render recipientList:", recipientList);
    console.log("Render currentBond:", currentBond);
    console.log("Render bondHolders:", bondHolders);

    try {
      return (
        <div className="container">
          {(this.state.userReady) ?
          <div>
          <header className="jumbotron col-md-8">
            <h3>
              <strong>{this.state.currentBond.txntype===0?"Execute ":""} Trigger Bond Coupon Payment from Issuer Wallet { this.state.isMaker? "(Maker)": (this.state.isChecker? "(Checker)": (this.state.isApprover? "(Approver)":null) )}</strong>
            </h3>
          </header>

        </div>: null}

                <div className="edit-form list-row">
                  <h4></h4>
                  <div className="col-md-8">

                  <form autoComplete="off">
                    <div className="form-group">
                      <label htmlFor="name">Bond Smart Contract Name</label>
                      <input
                        type="text"
                        className="form-control"
                        id="name"
                        maxLength="45"
                        value={currentBond.name}
                        onChange={this.onChangeName}
                        disabled="true"
                        />
                    </div>
                  <div className="form-group">
                    <label htmlFor="tokenname">Cash Token to be paid as coupon</label>
                    <input
                      type="text"
                      className="form-control"
                      id="tokenname"
                      maxLength="255"
                      required
                      value={currentBond.campaign.tokenname}
                      name="tokenname"
                      autoComplete="off"
                      disabled="true"
                      />
                  </div>
                  <div className="form-group">
                    <label htmlFor="couponamount">Coupon Amount {this.state.couponFreq? "["+this.state.couponFreq+"]": ""}</label>
                    <input
                      type="text"
                      className="form-control"
                      id="couponamount"
                      maxLength="255"
                      required
                      value={this.state.currentBond.couponToPay}
                      name="tokenname"
                      autoComplete="off"
                      disabled="true"
                      />
                  </div>
                  <div className="form-group">
                    <label htmlFor="blockchain">Blockchain</label>
                    {// use the blockchain where the underlying was deployed
                    }
                    <select
                          onChange={this.onChangeBlockchain}                         
                          className="form-control"
                          id="blockchain"
                          disabled="true"
                        >
                          <option >   </option>
                          <option value="80002"  selected={this.state.currentBond.blockchain === 80002}>Polygon   Testnet Amoy</option>
                          <option value="11155111" selected={this.state.currentBond.blockchain === 11155111}>Ethereum  Testnet Sepolia</option>
                          <option value="80001"  selected={this.state.currentBond.blockchain === 80001} disabled>Polygon   Testnet Mumbai (Deprecated)</option>
                          <option value="43113"      disabled>Avalanche Testnet Fuji    (not in use at the moment)</option>
                          <option value="137"      disabled>Polygon   Mainnet (not in use at the moment)</option>
                          <option value="1"        disabled>Ethereum  Mainnet (not in use at the moment)</option>
                          <option value="43114"      disabled>Avalanche Mainnet (not in use at the moment)</option>
                        </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="investors">Investors</label>
                    {Array.isArray(this.state.bondHolders.holders) && Array.isArray(this.state.bondHolders.balances)?
                    (
                    <>
                    <table style={{border : '1px solid', width: '100%'}}>
                      <tr><td>S/N</td><td>Investors</td><td>Holdings</td><td>Coupon due</td></tr>
                    
                      {this.state.bondHolders.holders.map((hh, index) => 
                          {
                            return (
                              <tr>
                              <td>{index}</td><td>{this.shorten(hh)}</td>
                              <td>{Math.floor(this.state.bondHolders.balances[index]/1e18)}</td>
                              <td>{(this.state.bondHolders.balances[index]/1e18) * (this.state.currentBond.couponRate/100) * this.state.currentBond.couponAdjustment * BOND_UNITS} {currentBond.campaign.tokenname}</td>
                              </tr>
                            )
                          }
                      )}
                    
                    </table>              
                    </>
                    )
                    : null
                    }

                  </div>


                    <br/>

                  </form>
                  {
                  //this.state.isMaker?
                  <>
                    <button
                    type="submit"
                    className="m-3 btn btn-sm btn-primary"
                    onClick={this.triggerBondCouponPayment}
                    disabled={this.state.currentBond.smartcontractaddress === ""}

                    >
                      Trigger Coupon Payment 
                      {
                        //(this.state.currentBond.txntype===0? " Create ":
                        //(this.state.currentBond.txntype===1? " Update ":
                        //(this.state.currentBond.txntype===2? " Delete ":null)))
                      }
                      
                    </button> 
{/*
                    <button
                      className="m-3 btn btn-sm btn-danger"
                      onClick={this.showModal_dropRequest}
                    >
                      Drop Request
                    </button>
*/}
                </>

                  
                  /*
                  :
                  (this.state.isChecker? 
                  <button
                  type="submit"
                  className="m-3 btn btn-sm btn-primary"
                  onClick={this.acceptBond}
                  >
                    Endorse
                    {
                      (this.state.currentBond.txntype===0? " Create ":
                      (this.state.currentBond.txntype===1? " Update ":
                      (this.state.currentBond.txntype===2? " Delete ":null)))
                    }
                    Request

                  </button> 
                  :
                  (
                    this.state.isApprover?
                    <button
                    type="submit"
                    className="m-3 btn btn-sm btn-primary"
                    onClick={this.state.currentBond.txntype===2? this.deleteDraft: this.approveBond}
                    >
                      Approve
                      {
                        (this.state.currentBond.txntype===0? " Create ":
                        (this.state.currentBond.txntype===1? " Update ":
                        (this.state.currentBond.txntype===2? " Delete ":null)))
                      }
                      Request

                    </button> 
                  */
//                    : null
//                  ))
                  }
   &nbsp;
                  {
                    this.state.isChecker || this.state.isApprover ?

                  <button
                  type="submit"
                  className="m-3 btn btn-sm btn-danger"
                  onClick={this.rejectBond}
                  >
                    Reject
                  </button> 
                  : null
                  }
  &nbsp;
                  { 

                   ((this.state.datachanged) ? 
                    <button className="m-3 btn btn-sm btn-secondary" onClick={this.showModal_Leave}>
                      Back
                    </button>
                    : 
                    <Link to="/inbox">
                    <button className="m-3 btn btn-sm btn-secondary">
                      Back
                    </button>
                    </Link>
                   )
                   }


                  {this.state.isLoading ? <LoadingSpinner /> : null}

                  <Modal showm={this.state.showm} handleProceed1={event =>  window.location.href='/bond'} handleProceed2={this.deleteBond} handleProceed3={this.dropRequest} button1text={this.state.button1text} button2text={this.state.button2text} button3text={this.state.button3text} button0text={this.state.button0text} handleCancel={this.hideModal}>
                    {this.state.modalmsg}
                  </Modal>


                  <p>{this.state.message}</p>
                </div>
            </div>
            </div>
      );
    } // try
    catch (e) {

    }
  }
}

export default withRouter(Bond);
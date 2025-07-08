import React, { Component } from "react";
import { Link, Navigate } from "react-router-dom";
import { withRouter } from '../common/with-router';

import PBMDataService from "../services/pbm.service";
import CampaignDataService from "../services/campaign.service";
import RecipientDataService from "../services/recipient.service";
import UserOpsRoleDataService from "../services/user_opsrole.service";
import AuthService from "../services/auth.service";
import validator from 'validator';
import Modal from '../Modal.js';
import LoadingSpinner from "../LoadingSpinner";
import "../LoadingSpinner.css";

class PBMWrap extends Component {
  constructor(props) {
    super(props);

    this.onChangeUnderlying = this.onChangeUnderlying.bind(this);
    this.onChangePBM        = this.onChangePBM.bind(this);
    this.onChangeAmount     = this.onChangeAmount.bind(this);
    this.onChangeChecker    = this.onChangeChecker.bind(this);
    this.onChangeApprover   = this.onChangeApprover.bind(this);
    this.createWrapMint     = this.createWrapMint.bind(this);
    this.newPBM             = this.newPBM.bind(this);

    this.state = {

      checkerList: {
        id: null,
        username: "",
      },
      approverList: {
        id: null,
        username: "",
      },
      param_underlyingDSGDToken : "",
      param_PBMToken : "",
  
      PBMList: [],
      pbm_id: "",
      id: null,
      template: "",
      name: "",
      tokenname: "",
      description: "",
      smartcontractaddress: "",
      inwallet      : 0,
      minted_tokens : 0,
      totalsupply   : 0,
  
      underlyingTokenID: "",
      startdate: "",
      enddate: "",
      sponsor: "",
      amount: "",
      checker: "",
      approver: "",

      currentUser: undefined,
      isMaker: false,
      isChecker: false,
      isApprover: false,
      
      actionby: undefined,
      err: "",
      datachanged: false,
      submitted: false,
      isLoading: false,

      modal: {
        showm: false,
        modalmsg: "",
        button1text: undefined,
        button2text: undefined,
        button3text: undefined,
        button0text: undefined,
      }
    };
  }

  componentDidMount() {
    const user = AuthService.getCurrentUser();

    if (!user) this.setState({ redirect: "/home" });
    this.setState({ currentUser: user, actionby:user.username, userReady: true });

    this.setState({
      param_underlyingDSGDToken : this.props.router.params.dsgd,
      param_PBMToken            : this.props.router.params.pbm,
    });

    console.log("DSGD = ", this.state.param_underlyingDSGDToken);
    console.log("PBM = ", this.state.param_PBMToken);

    let ismaker= user.opsrole.find((el) => 
      el.opsrole.name.toUpperCase() === "MAKER"
    );
    console.log("isMaker:", (ismaker === undefined? false: true));
    this.setState({ isMaker: (ismaker === undefined? false: true),});

    let ischecker= user.opsrole.find((el) => 
      el.opsrole.name.toUpperCase() === "CHECKER"
    );
    console.log("isChecker:", (ischecker === undefined? false: true));
    this.setState({ isChecker: (ischecker === undefined? false: true),});

    let isapprover= user.opsrole.find((el) => 
    el.opsrole.name.toUpperCase() === "APPROVER"
    );
    console.log("isApprover:", (isapprover === undefined? false: true));
    this.setState({ isApprover: (isapprover === undefined? false: true),});

    this.getAllUnderlyingAssets();
    this.retrievePBM();
    this.retrieveAllMakersCheckersApprovers();
  }

  onChangeUnderlying(e) {
    const underlyingTokenID = e.target.value;
    console.log("New underlying=", underlyingTokenID);
    var newBlockchain = 0;
    var newSmartcontractaddress = "";
    if (underlyingTokenID !=="") {
      newBlockchain = this.state.underlyingDSGDList.find((ee) => ee.id === parseInt(underlyingTokenID)).blockchain;
      newSmartcontractaddress = this.state.underlyingDSGDList.find((ee) => ee.id === parseInt(underlyingTokenID)).smartcontractaddress;
    }
    console.log("New blockchain=", newBlockchain);

// when underlying changes, blockchain might change also bccos underlying could be in different blockchain
    this.setState({
      underlyingTokenID: underlyingTokenID,
      blockchain: newBlockchain,
      smartcontractaddress: newSmartcontractaddress,
      datachanged: true
    });

    if (underlyingTokenID !== "") {
      CampaignDataService.getInWalletMintedTotalSupply(underlyingTokenID)
      .then(response => {
        console.log("getInWalletMintedTotalSupply from server:", response.data);
        console.log("Response.data length:", response.data.length);
        if (! response.data) {
          this.setState({
            inwallet      : 0,
            minted_tokens : 0,
            totalsupply   : 0,
          });
        } else {          
          this.setState({
            inwallet      : response.data.inWallet,
            minted_tokens : response.data.totalMinted,
            totalsupply   : response.data.totalSupply,
          });
        }
      })
      .catch(e => {
        console.log(e);
        //return(null);
      });
    } else {
      this.setState({
        inwallet      : 0,
        minted_tokens : 0,
        totalsupply   : 0,
      });
    }
  }

  onChangePBM(e) {
    const pbm_id = e.target.value;  // remove . and other chars

    this.setState({
      pbm_id: pbm_id,
      datachanged: true
    });

  }

  onChangeAmount(e) {
    const amount1 = e.target.value.replace(/[^0-9]/g, "");  // remove . and other chars
    
    /*
    this.setState({
      datachanged: true
    });

    this.setState(prevState => ({
      currentPBM: {
        ...prevState.currentPBM,
        amount: amount
      }
    }));
    */
    this.setState({
      amount: amount1,
      datachanged: true
    });

  }

  onChangeChecker(e) {
    //console.log("currentUser:", this.state.currentUser)
    this.setState({
      checker: e.target.value,
      datachanged: true
    });
  }

  onChangeApprover(e) {
    this.setState({
      approver: e.target.value,
      datachanged: true
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

    if (this.state.underlyingTokenID === "") err += "- Underlying Digital SGD cannot be empty\n"; 
    if (this.state.pbm_id === "") err += "- PBM cannot be empty\n"; 

    if (parseFloat(this.state.inwallet) === 0) err += "- Underlying Digital SGD must be more than zero. You need to mint the tokens before wrapping it.\n"
    if (this.state.amount === "") err += "- Amount cannot be empty\n";
    if (parseFloat(this.state.inwallet) > 0 && this.state.amount !== "" && this.state.amount > parseFloat(this.state.inwallet)) err += "- Amount cannot be more than Digital SGD available in the wallet. You need to mint more tokens to wrap and mint PBM.\n"; 
    if (this.state.checker === "") err += "- Checker cannot be empty\n";
    if (this.state.approver === "") err += "- Approver cannot be empty\n";
    if (this.state.checker === this.state.currentUser.id.toString() 
        && this.state.approver === this.state.currentUser.id.toString()) {
      err += "- Maker, Checker and Approver cannot be the same person\n";
    } else {
      if (this.state.checker === this.state.currentUser.id.toString()) err += "- Maker and Checker cannot be the same person (yourself)\n";
      if (this.state.approver === this.state.currentUser.id.toString()) err += "- Maker and Approver cannot be the same person (yourself)\n";
      if (this.state.checker!==null && this.state.checker!=="" 
            && this.state.checker === this.state.approver) err += "- Checker and Approver cannot be the same person\n";
    }
    console.log("user:'"+this.state.currentUser.id+"'");
    console.log("checker:'"+this.state.checker+"'");


    if (err !== '') {
      err = "Form validation issues found:\n"+err;
      this.displayModal(err, null, null, null, "OK");      

      err = ""; // clear var

      return false;
    }

    return true;
  }

  async createWrapMint() {  // for Maker

    if (this.state.isMaker) {  // only for Makers
      
        if (await this.validateForm() === true) { 

        console.log("Creating PBM draft this.state.underlyingDSGDList= ", this.state.underlyingDSGDList);
        console.log("Creating PBM draft underlyingDSGDsmartcontractaddress= ", this.state.underlyingDSGDList.find((e) => e.id === parseInt(this.state.underlyingTokenID)).smartcontractaddress);
  
        var data = {
          underlyingTokenID : this.state.underlyingTokenID,
          pbm_id            : this.state.pbm_id,
          blockchain        : this.state.blockchain,
          amount            : this.state.amount,
          txntype           : 0,    // create
          maker             : this.state.currentUser.id,
          checker           : this.state.checker,
          approver          : this.state.approver,
          actionby          : this.state.currentUser.username,
        };
    
        console.log("Form Validation passed! creating pbm...");
        //alert("Form validation passed! creating pbm...");
        console.log("IsLoad=true");
        this.show_loading();  // show progress

        await PBMDataService.wrapMint_draftCreate(data)
        .then(response => {
          console.log("Response: ", response);
          console.log("IsLoad=false");
          this.hide_loading();  // hide progress
    
          this.setState({  
            underlyingTokenID   : response.data.underlyingTokenID,
            smartcontractaddress: response.data.smartcontractaddress,
            amount              : response.data.amount,

            submitted: true,
          });
//          this.displayModal("PBM draft submitted for review" + (response.data.smartcontractaddress !==""? " with smart contract deployed at "+response.data.smartcontractaddress + ". You can start minting now.": "." ) ,
//                              "OK", null, null);
          this.displayModal("PBM creation request submitted for review.", "OK", null, null, null);

          //console.log("Responseeeee"+response.data);
        })
        .catch(e => {
        
          this.hide_loading();  // hide progress

          console.log("Error: ",e);
          console.log("Response error:",e.response.data.message);
          if (e.response.data.message !== "") 
            this.displayModal("Error: "+e.response.data.message+".\n\nPlease contact tech support.", null, null, null, "OK");
          else
            this.displayModal("Error: "+e.message+".\n\nPlease contact tech support.", null, null, null, "OK");
        });
      } else {
        console.log("Form Validation failed >>>");
        //alert("Form Validation failed >>>");
        this.hide_loading();  // hide progress
      }
    } else {
      this.displayModal("Error: this role is only for maker.", null, null, null, "OK");
    }

    console.log("IsLoad=false");
    this.hide_loading();  // hide progress

  }

  newPBM() {
    this.setState({
      id: null,
      name: "",
      tokenname: "",
      description: "",
      
      datafield1_name   : "",
      datafield1_value  : "",
      operator1         : "",
      datafield2_name   : "",
      datafield2_value  : "",

      underlyingTokenID: "",
      startdate: "",
      enddate: "",
      sponsor: "",
      amount: "",

      currentUser: undefined,
      actionby: undefined,
      datachanged: false,
      submitted: false
    });
  }

  getAllUnderlyingAssets() {
    CampaignDataService.getAll()
      .then(response => {
        if (response.data.length === 0) {
          this.setState({
            underlyingDSGDList: [ { id:-1, name:"No campaign available, please create a campaign first."}],
          });
        } else {          
          var first_array_record = [  // add 1 empty record to front of array which is the option list
            { }
          ];
          this.setState({
            underlyingDSGDList: [first_array_record].concat(response.data)
          });
        }
      })
      .catch(e => {
        console.log(e);
        //return(null);
      });
  }

  retrievePBM() {
    PBMDataService.getAll()
      .then(response => {
        this.setState({
          PBMList: response.data
        });
        console.log("Response data from retrievePBM() PBMDataService.getAll:", response.data);
      })
      .catch(e => {
        console.log(e);
      });
  }
/*
  getAllPBMTemplates() {
    PBMDataService.getAllPBMTemplates()
      .then(response => {
        if (response.data.length === 0) {
          this.setState({
            PBMTemplatesList: [ { id:-1, name:"Error retrieving templates"}],
          });
        } else {          
          var first_array_record = [  // add 1 empty record to front of array which is the option list
            { }
          ];
          this.setState({
            PBMTemplatesList: [first_array_record].concat(response.data)
          });
        }
      })
      .catch(e => {
        console.log(e);
        //return(null);
      });
  }
*/

/*
  getAllSponsors() {
    RecipientDataService.findAllRecipients()
      .then(response => {
        if (response.data.length === 0) {
          this.setState({
            recipientList: [ { id:-1, name:"No recipients available, please create a recipient first."}],
          });
        } else {          
          var first_array_record = [  // add 1 empty record to front of array which is the option list
            { }
          ];
          this.setState({
            recipientList: [first_array_record].concat(response.data)
          });
        }
      })
      .catch(e => {
        console.log(e);
        //return(null);
      });
  }
*/
  retrieveAllMakersCheckersApprovers() {
    UserOpsRoleDataService.getAllMakersCheckersApprovers("pbm")
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

  show_loading() {  // show progress
    this.setState({isLoading: true});
  }
  hide_loading(){  // hide progress
    this.setState({isLoading: false});
  }

  showModal_Leave = () => {
    this.displayModal("You have made changes. Are you sure you want to leave this page without submitting?",
                      "Yes, leave", null, null, "Cancel");
  };

  hideModal = () => {
    this.setState({ showm: false });
  };

  render() {
    if (this.state.redirect) {
      return <Navigate to={this.state.redirect} />
    }

    const { underlyingDSGDList, PBMList, 
    //  recipientList, PBMTemplatesList, 
      checkerList, approverList } = this.state;
    console.log("Render underlyingDSGDList:", underlyingDSGDList);
    console.log("Render PBMList:", PBMList);
    console.log("Render param_underlyingDSGDToken:", this.state.param_underlyingDSGDToken);
    console.log("Render param_PBMToken:", this.state.param_PBMToken);
    

    return (
      <div className="container">
      {(this.state.userReady) ?
        <div>
        <header className="jumbotron col-md-8">
          <h3>
            <strong>Wrap DSGD to Mint PBM ({ (this.state.isMaker? "Maker" : (this.state.isChecker? "Checker": (this.state.isApprover? "Approver":null)) )})</strong>
          </h3>
        </header>

        </div>: null}

          <div className="submit-form list-row">
            <h4> </h4>
              <div className="col-md-8">
                <div className="form-group">
                  <label htmlFor="name">Digital SGD *  { ((this.state.totalsupply !== undefined && this.state.totalsupply != null && this.state.totalsupply !=="" && this.state.minted_tokens !== undefined && this.state.minted_tokens != null && this.state.minted_tokens !=="") ? `(${ (parseFloat(this.state.inwallet)).toLocaleString() } in Wallet,  ${ (parseFloat(this.state.minted_tokens)).toLocaleString() } Minted,  ${ (this.state.totalsupply).toLocaleString() } Total Supply)` : null)}</label>
                  <select
                        onChange={this.onChangeUnderlying}                         
                        className="form-control"
                        id="underlyingTokenID"
                        disabled={!this.state.isMaker}
                      >
                        <option value=""> </option>

                        {
                          Array.isArray(underlyingDSGDList) ?
                          underlyingDSGDList.map( (d) => {
                            // https://stackoverflow.com/questions/61128847/react-adding-a-default-option-while-using-map-in-select-tag
                              if (typeof d.id === "number")
                                return <option value={d.id} selected={d.id === this.state.param_underlyingDSGDToken}>{d.tokenname} ({d.name} - {d.smartcontractaddress})</option>
                            })
                          : null
                        }
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="name">PBM *</label>
                  <select
                        onChange={this.onChangePBM}                         
                        className="form-control"
                        id="PBM"
                        disabled={!this.state.isMaker || this.state.underlyingTokenID===""}
                      >
                        <option > </option>
                        {
                          Array.isArray(PBMList) ?
                          PBMList.map( (d) => {
                            // https://stackoverflow.com/questions/61128847/react-adding-a-default-option-while-using-map-in-select-tag
                              if (this.state.smartcontractaddress === d.underlyingDSGDsmartcontractaddress)
                              return <option value={d.id} selected={d.id === this.state.param_PBMToken}>{d.tokenname} ({d.name} - {d.smartcontractaddress})</option>
                            })
                          : null
                        }
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="blockchain">Blockchain </label>
                  {// use the blockchain where the underlying was deployed
                  }
                  <select
                        onChange={this.onChangeBlockchain}                         
                        className="form-control"
                        id="blockchain"
                        disabled="true"
                      >
                        <option >   </option>
                        <option value="80002"  selected={this.state.blockchain === 80002}>Polygon   Testnet Amoy</option>
                        <option value="11155111" selected={this.state.blockchain === 11155111}>Ethereum  Testnet Sepolia</option>
                        <option value="80001"  selected={this.state.blockchain === 80001} disabled>Polygon   Testnet Mumbai (Deprecated)</option>
                        <option value="43113"      disabled>Avalanche Testnet Fuji    (not in use at the moment)</option>
                        <option value="137"      disabled>Polygon   Mainnet (not in use at the moment)</option>
                        <option value="1"        disabled>Ethereum  Mainnet (not in use at the moment)</option>
                        <option value="43114"      disabled>Avalanche Mainnet (not in use at the moment)</option>
                      </select>
                </div>
                <div className="form-group">
                  <label htmlFor="amount">Max Amount of PBM to issue * (only integers without decimals)</label>
                  <input
                    type="number"
                    className="form-control"
                    id="amount"
                    min="0"
                    step="1"
                    required
                    value={this.state.amount}
                    onChange={this.onChangeAmount}
                    name="amount"
                    autoComplete="off"
                    disabled={!this.state.isMaker}
                  />
                </div>                
                <div className="form-group">
                  <label htmlFor="checker">Checker *</label>
                  <select
                        onChange={this.onChangeChecker}                         
                        className="form-control"
                        id="checker"
                        disabled={!this.state.isMaker}
                      >
                        {
                          Array.isArray(checkerList) ?
                            checkerList.map( (d) => {
                              return <option value={d.id}>{d.username}</option>
                            })
                          : null
                        }
                      </select>
                </div>

                <div className="form-group">
                <label htmlFor="approver">Approver *</label>
                <select
                      onChange={this.onChangeApprover}                         
                      className="form-control"
                      id="approver"
                      disabled={!this.state.isMaker}
                    >
                      {
                        Array.isArray(approverList) ?
                        approverList.map( (d) => {
                            return <option value={d.id}>{d.username}</option>
                          })
                        : null
                      }
                    </select>
                </div>

                { this.state.isMaker?
                  <button onClick={this.createWrapMint} className="btn btn-primary">
                    Submit for Review
                  </button>
                : null
                }
                { this.state.isMaker?
                 (this.state.datachanged) ? 
                  <button className="m-3 btn btn-sm btn-secondary" onClick={this.showModal_Leave}>
                    Cancel
                  </button>
                  : 
                  <Link to="/pbm">
                  <button className="m-3 btn btn-sm btn-secondary">
                    Cancel
                  </button>
                  </Link>
                : 
                  <Link to="/pbm">
                  <button className="m-3 btn btn-sm btn-secondary">
                    Back
                  </button>
                  </Link>
                }
                {this.state.isLoading ? <LoadingSpinner /> : null}

                <Modal showm={this.state.showm} handleProceed1={event =>  window.location.href='/pbm'} handleProceed2={null} handleProceed3={null} button1text={this.state.button1text} button2text={this.state.button2text} button3text={this.state.button3text} button0text={this.state.button0text} handleCancel={this.hideModal}>
                  {this.state.modalmsg}
                </Modal>

                <p>{this.state.message}</p>

              </div>
          </div>
      </div>
    );
  }
}

export default withRouter(PBMWrap);
import React, { Component } from "react";
import { Link, Navigate } from "react-router-dom";
import CampaignDataService from "../services/campaign.service";
import RecipientDataService from "../services/recipient.service";
import UserOpsRoleDataService from "../services/user_opsrole.service";
import AuthService from "../services/auth.service";
import validator from 'validator';
import Modal from '../Modal.js';
import LoadingSpinner from "../LoadingSpinner";
import "../LoadingSpinner.css";

export default class CampaignEdit extends Component {
  constructor(props) {
    super(props);
    this.onChangeName = this.onChangeName.bind(this);
    this.onChangeTokenName = this.onChangeTokenName.bind(this);
    this.onChangeDescription = this.onChangeDescription.bind(this);
    this.onChangeBlockchain = this.onChangeBlockchain.bind(this);
    this.onChangeStartDate = this.onChangeStartDate.bind(this);
    this.onChangeEndDate = this.onChangeEndDate.bind(this);
    this.onChangeSponsor = this.onChangeSponsor.bind(this);
    this.onChangeAmount = this.onChangeAmount.bind(this);
    this.onChangeChecker = this.onChangeChecker.bind(this);
    this.onChangeApprover = this.onChangeApprover.bind(this);
    this.createCampaign = this.createCampaign.bind(this);
    this.newCampaign = this.newCampaign.bind(this);

    this.state = {
      recipientList: {
        id: null,
        name: "",
        tokenname: "",
        description: "",
        walletaddress: "",
        bank: "",
        bankaccount: "",
        type: ""
      },

      checkerList: {
        id: null,
        username: "",
      },
      approverList: {
        id: null,
        username: "",
      },

      id: null,
      name: "",
      tokenname: "",
      description: "",
      blockchain: "",
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

  onChangeName(e) {
    this.setState({
      name: e.target.value,
      datachanged: true
    });
  }

  onChangeTokenName(e) {
    this.setState({
      tokenname: e.target.value.toUpperCase(),
      datachanged: true
    });
  }

  onChangeDescription(e) {
    this.setState({
      description: e.target.value,
      datachanged: true
    });
  }

  onChangeBlockchain(e) {
    this.setState({
      blockchain: e.target.value,
      datachanged: true
    });
  }

  onChangeStartDate(e) {
    this.setState({
      startdate: e.target.value,
      datachanged: true
    });
  }

  onChangeEndDate(e) {
    this.setState({
      enddate: e.target.value,
      datachanged: true
    });
  }

  onChangeSponsor(e) {
    const sponsor = e.target.value;

    this.setState({
      sponsor: sponsor,
      datachanged: true
    });
  }

  onChangeAmount(e) {
    e.target.value = e.target.value.replace(/[^0-9]/g, "");  // remove . and other chars
    const amount = e.target.value;
    
    /*
    this.setState({
      datachanged: true
    });

    this.setState(prevState => ({
      currentCampaign: {
        ...prevState.currentCampaign,
        amount: amount
      }
    }));
    */
    this.setState({
      amount: amount,
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

    if (!(typeof this.state.name ==='string' || this.state.name instanceof String)) {
      err += "- Name cannot be empty\n";
    } else if ((this.state.name.trim() === "")) {
      err += "- Name cannot be empty\n"; 
    } else {
      await CampaignDataService.findByNameExact(this.state.name.trim())
      .then(response => {
        console.log("Find duplicate name:",response.data);

        if (response.data.length > 0) {
          err += "- Name of campaign is already present (duplicate name)\n";
          console.log("Found campaign name (duplicate!):"+this.state.name);
        } else {
          console.log("Didnt find campaign name1 (ok no duplicate):"+this.state.name);
        }
      })
      .catch(e => {
        console.log("Didnt find campaign name2 (ok no duplicate):"+this.state.name);
        // ok to proceed
      });
    }

    if (!(typeof this.state.tokenname ==='string' || this.state.tokenname instanceof String)) {
      err += "- Token Name cannot be empty\n";
    } else 
      if (this.state.tokenname.trim() === "") err += "- Token Name cannot be empty\n";
    
    // dont need t check description, it can be empty
    if (! validator.isDate(this.state.startdate)) err += "- Start Date is invalid\n";
    if (! validator.isDate(this.state.enddate)) err += "- End Date is invalid\n";
    if (this.state.sponsor === "") err += "- Sponsor cannot be empty\n";
    if (this.state.amount === "") err += "- Amount cannot be empty\n";
    if (this.state.checker === "") err += "- Checker cannot be empty\n";
    if (this.state.approver === "") err += "- Approver cannot be empty\n";
    if (this.state.startdate.trim() !== "" && this.state.enddate.trim() !== "" && this.state.startdate > this.state.enddate) err += "- Start date cannot be later than End date\n";    
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
    console.log("start date:'"+this.state.startdate+"'");
    console.log("end date:'"+this.state.enddate+"'");
    console.log("Start > End? "+ (this.state.startdate > this.state.enddate));

    if (err !== '') {
      err = "Form validation issues found:\n"+err;
      this.displayModal(err, null, null, null, "OK");      

      err = ""; // clear var

      return false;
    }

    return true;
  }

  async createCampaign() {  // for Maker

    if (this.state.isMaker) {  // only for Makers
      var data = {
        name              : this.state.name,
        tokenname         : this.state.tokenname,
        description       : this.state.description,
        blockchain        : this.state.blockchain,

        startdate         : this.state.startdate,
        enddate           : this.state.enddate,
        sponsor           : this.state.sponsor,
        amount            : this.state.amount,
        txntype           : 0,    // create
        maker             :  this.state.currentUser.id,
        checker           : this.state.checker,
        approver          : this.state.approver,
        actionby          : this.state.currentUser.username,
        approvedcampaignid: -1,
      };
  
      if (await this.validateForm() === true) { 
        console.log("Form Validation passed! creating campaign...");
        //alert("Form validation passed! creating campaign...");

        console.log("IsLoad=true");
        this.show_loading();  // show progress


        await CampaignDataService.draftCreate(data)
        .then(response => {
          console.log("Response: ", response);
          console.log("IsLoad=false");
          this.hide_loading();  // hide progress
    
          this.setState({
            id: response.data.id,
            name: response.data.name,
            tokenname: response.data.tokenname,
            description: response.data.description,
            blockchain: response.data.blockchain,
            startdate: response.data.startdate,
            enddate: response.data.enddate,
            sponsor: response.data.sponsor,
            smartcontractaddress: response.data.smartcontractaddress,
            amount: response.data.amount,

            submitted: true,

          });
//          this.displayModal("Campaign draft submitted for review" + (response.data.smartcontractaddress !==""? " with smart contract deployed at "+response.data.smartcontractaddress + ". You can start minting now.": "." ) ,
//                              "OK", null, null);
          this.displayModal("Campaign creation request submitted for review.", "OK", null, null, null);

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

  newCampaign() {
    this.setState({
      id: null,
      name: "",
      tokenname: "",
      description: "",
      blockchain: "",
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

  retrieveAllMakersCheckersApprovers() {
    UserOpsRoleDataService.getAllMakersCheckersApprovers("campaign")
      .then(response => {
        console.log("Data received by getAllCheckerApprovers:", response.data);
        let chkList = response.data.find((element) => {
          //var el_id = element.id;                       console.log("typeof(el_id)", typeof(el_id));
          //console.log("element.name:", element.name);   console.log("typeof(element.name)", typeof(element.name));
          try {
            if (element.name.toUpperCase() === "CHECKER") 
              return element;
          } catch(e) {
            // do nothing, sometime when campaignList not loaded yet, element/el_id will be undefined, so need make sure it doesnt bomb
          }
          return null;
        });
        let apprList = response.data.find((element) => {
          //var el_id = element.id;                       console.log("typeof(el_id)", typeof(el_id));
          //console.log("element.name:", element.name);   console.log("typeof(element.name)", typeof(element.name));
          try {
            if (element.name.toUpperCase() === "APPROVER") 
              return element;
          } catch(e) {
            // do nothing, sometime when campaignList not loaded yet, element/el_id will be undefined, so need make sure it doesnt bomb
          }
          return null;
        });

        var first_array_record = [  // add 1 empty record to front of array which is the option list
          { }
        ];
        this.setState({
          checkerList: [first_array_record].concat(chkList.user),
          approverList: [first_array_record].concat(apprList.user)
        });
        console.log("checkerList: ",chkList.user);
        console.log("approverList: ",apprList.user);
      })
      .catch(e => {
        console.log(e);
        //return(null);
      });
  }

  componentDidMount() {
    const user = AuthService.getCurrentUser();

    if (!user) this.setState({ redirect: "/login" });
    this.setState({ currentUser: user, actionby:user.username, userReady: true })

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

    this.getAllSponsors();

    this.retrieveAllMakersCheckersApprovers();

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

    const { recipientList, checkerList, approverList } = this.state;
    console.log("Render recipientList:", recipientList);

    return (
      <div className="container">
      {(this.state.userReady) ?
        <div>
        <header className="jumbotron col-md-8">
          <h3>
            <strong>Add Campaign ({ (this.state.isMaker? "Maker" : (this.state.isChecker? "Checker": (this.state.isApprover? "Approver":null)) )})</strong>
          </h3>
        </header>

        </div>: null}

          <div className="submit-form list-row">
            <h4> </h4>
              <div className="col-md-8">
                <div className="form-group">
                  <label htmlFor="name">Campaign Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    maxLength="45"
                    required
                    value={this.state.name}
                    onChange={this.onChangeName}
                    name="name"
                    autoComplete="off"
                    disabled={!this.state.isMaker}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <input
                    type="text"
                    className="form-control"
                    id="description"
                    maxLength="255"

                    required
                    value={this.state.description}
                    onChange={this.onChangeDescription}
                    name="description"
                    autoComplete="off"
                    disabled={!this.state.isMaker}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="name">Token Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="tokenname"
                    maxLength="9"
                    required
                    value={this.state.tokenname}
                    onChange={this.onChangeTokenName}
                    name="tokenname"
                    autoComplete="off"
                    style={{textTransform : "uppercase"}}
                    disabled={!this.state.isMaker}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="blockchain">Blockchain *</label>
                  <select
                        onChange={this.onChangeBlockchain}                         
                        className="form-control"
                        id="blockchain"
                        disabled={!this.state.isMaker}
                      >
                        <option value="80001"  selected={this.state.blockchain === 80001}>Polygon   Testnet Mumbai</option>
                        <option value="80002"  selected={this.state.blockchain === 80002}>Polygon   Testnet Amoy</option>
                        <option value="11155111" disabled>Ethereum  Testnet Sepolia (not in use at the moment)</option>
                        <option value="43113"      disabled>Avalanche Testnet Fuji    (not in use at the moment)</option>
                        <option value="137"      disabled>Polygon   Mainnet (not in use at the moment)</option>
                        <option value="1"        disabled>Ethereum  Mainnet (not in use at the moment)</option>
                        <option value="43114"      disabled>Avalanche Mainnet (not in use at the moment)</option>
                      </select>
                </div>


                <div className="form-group">
                  <label htmlFor="startdate">Start Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    id="startdate"
                    required
                    value={this.state.startdate}
                    onChange={this.onChangeStartDate}
                    name="startdate"
                    disabled={!this.state.isMaker}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="enddate">End Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    id="enddate"
                    required
                    value={this.state.enddate}
                    onChange={this.onChangeEndDate}
                    name="enddate"
                    disabled={!this.state.isMaker}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="sponsor">Sponsor *</label>
                  <select
                        onChange={this.onChangeSponsor}                         
                        className="form-control"
                        id="sponsor"
                        disabled={!this.state.isMaker}
                      >
                        {
                          Array.isArray(recipientList) ?
                          recipientList.map( (d) => {
                              return <option value={d.id}>{d.name}</option>
                            })
                          : null
                        }
                      </select>
                </div>

                <div className="form-group">
                  <label htmlFor="amount">Amount * (only integers without decimals)</label>
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
                  <button onClick={this.createCampaign} className="btn btn-primary">
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
                  <Link to="/campaign">
                  <button className="m-3 btn btn-sm btn-secondary">
                    Cancel
                  </button>
                  </Link>
                : 
                  <Link to="/campaign">
                  <button className="m-3 btn btn-sm btn-secondary">
                    Back
                  </button>
                  </Link>
                }
                  {this.state.isLoading ? <LoadingSpinner /> : null}

                  <Modal showm={this.state.showm} handleProceed1={event =>  window.location.href='/campaign'} handleProceed2={null} handleProceed3={null} button1text={this.state.button1text} button2text={this.state.button2text} button3text={this.state.button3text} button0text={this.state.button0text} handleCancel={this.hideModal}>
                    {this.state.modalmsg}
                  </Modal>

                  <p>{this.state.message}</p>

              </div>
          </div>
      </div>
    );
  }
}

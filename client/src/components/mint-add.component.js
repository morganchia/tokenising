import React, { Component } from "react";
import { Link } from "react-router-dom";
import MintDataService from "../services/mint.service";
import CampaignDataService from "../services/campaign.service";
import UserOpsRoleDataService from "../services/user_opsrole.service";
import AuthService from "../services/auth.service";
import Modal from '../Modal.js';
import LoadingSpinner from "../LoadingSpinner";
import "../LoadingSpinner.css";


export default class MintAdd extends Component {
  constructor(props) {
    super(props);
    /*
    this.onChangeName = this.onChangeName.bind(this);
    this.onChangeStartDate = this.onChangeStartDate.bind(this);
    this.onChangeEndDate = this.onChangeEndDate.bind(this);
    */
    this.onChangeCampaign = this.onChangeCampaign.bind(this);
    this.onChangeMintAmount = this.onChangeMintAmount.bind(this);
    this.onChangeChecker = this.onChangeChecker.bind(this);
    this.onChangeApprover = this.onChangeApprover.bind(this);

    this.saveMint = this.saveMint.bind(this);
    this.newMint = this.newMint.bind(this);

    this.state = {
      campaignList: {
        id: null,
        name: "",
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
      campaignid: "",
      campaignname: "",
      smartcontractaddress: "",
      startdate: "",
      enddate: "",
      mintAmount: "",

      currentUser: undefined,
      isMaker: false,
      isChecker: false,
      isApprover: false,

      actionby: undefined,
      maker: "",
      checker: "",
      approver: "",
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
/*
// Cant change name
  onChangeName(e) {
    this.setState({
      name: e.target.value,
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
*/
  onChangeCampaign(e) {

    const selectedCampaign = this.state.campaignList.find((element) => { 
      var el_id = element.id;             console.log("typeof(el_id)", typeof(el_id));
      var campaign_id = e.target.value;   console.log("typeof(campaign_id)", typeof(campaign_id));
      console.log("element.id:", element.id);   console.log("campaign_id:", campaign_id)
      try {
        if (el_id.toString() === campaign_id) 
          return element;
      } catch(e) {
        // do nothing, sometime when campaignList not loaded yet, element/el_id will be undefined, so need make sure it doesnt bomb
      }
      return null;
    });
    console.log("selectedCampaign: ", selectedCampaign);

    CampaignDataService.getInWalletMintedTotalSupply(selectedCampaign.id)
    .then(response => {
      console.log("getInWalletMintedTotalSupply from server:", response.data);
      console.log("Response.data length:", response.data.length);
      if (! response.data) {
        this.setState({
          inwallet      : 0,
          minted_tokens : 0,
          totalSupply   : 0,
        });
      } else {          
        this.setState({
          inwallet      : response.data.inWallet,
          minted_tokens : response.data.totalMinted,
          totalSupply   : response.data.totalSupply,
        });
      }
    })
    .catch(e => {
      console.log(e);
      //return(null);
    });

    this.setState({
      campaignid: e.target.value,
      tokenname: (selectedCampaign ? selectedCampaign.tokenname : ""),
      blockchain: (selectedCampaign ? selectedCampaign.blockchain : ""),
      smartcontractaddress: (selectedCampaign ? selectedCampaign.smartcontractaddress : ""),
      startdate: (selectedCampaign ? selectedCampaign.startdate : ""), 
      enddate: (selectedCampaign ? selectedCampaign.enddate : ""), 
      totalsupply: (selectedCampaign ? selectedCampaign.amount : ""),  // total supply
    });
    console.log("CampaignId value:", e.target.value)
  }

  onChangeMintAmount(e) {
    this.setState({
      mintAmount: e.target.value,
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

    if (this.state.mintAmount === "") {
      err += "- Amount cannot be empty\n" 
    } else if (this.state.mintAmount <= 0) {
      err += "- Amount must be more than zero\n";
    }

    if (this.state.checker===null || this.state.checker === "") err += "- Checker cannot be empty\n";
    if (this.state.approver===null || this.state.approver === "") err += "- Approver cannot be empty\n";

    if(this.state.checker === this.state.currentUser.id.toString() && this.state.approver === this.state.currentUser.id.toString()) {
      err += "- Maker, Checker and Approver cannot be the same person\n";
    } else {
      if (this.state.checker === this.state.currentUser.id.toString()) err += "- Maker and Checker cannot be the same person (yourself)\n";
      if (this.state.approver === this.state.currentUser.id.toString()) err += "- Maker and Approver cannot be the same person (yourself)\n";
      if (this.state.checker!==null && this.state.checker!=="" 
          && this.state.checker === this.state.approver) err += "- Checker and Approver cannot be the same person\n";
    }

    if (!(typeof this.state.campaignid ==='string' || this.state.campaignid instanceof String)) {
      err = "Please choose a Campaign\n";
    } else if ((this.state.campaignid.trim() === "")) {
      err = "Please choose a Campaign\n"; 
    }


    if (err !== '') {
      err = "Form validation issues found:\n"+err;
      this.displayModal(err, null, null, null, "OK");

      err = ""; // clear var

      return false;
    }
    return true;
  }

  async saveMint() {
    if (this.state.isMaker) {  // only for Makers
      var data = {
        tokenname             : this.state.tokenname,
        blockchain            : this.state.blockchain,
        smartcontractaddress  : this.state.smartcontractaddress,
        description           : this.state.description,
        startdate             : this.state.startdate,
        enddate               : this.state.enddate,
        campaignId            : this.state.campaignid,
        mintAmount            : this.state.mintAmount,
        txntype               : 0,    // create
        actionby              : this.state.currentUser.username,
        maker                 :  this.state.currentUser.id,
        checker               : this.state.checker,
        approver              : this.state.approver,
      };

      if (await this.validateForm() === true) { 
        console.log("Form Validation passed! creating mint...");
        //alert("Form validation passed! creating mint...");

        console.log("IsLoad=true");
        this.show_loading();  // show progress

        await MintDataService.draftCreate(data)
        .then(response => {
          console.log("Response: ", response);
          this.hide_loading();  // hide progress

          console.log("IsLoad=false");

          this.setState({
            id                    : response.data.id,
            //name                : response.data.name,
            tokenname             : response.data.tokenname,
            blockchain            : response.data.blockchain,
            smartcontractaddress  : response.data.smartcontractaddress,
            description           : response.data.description,
            startdate             : response.data.startdate,
            enddate               : response.data.enddate,
            campaign              : response.data.campaign,
            mintAmount            : response.data.mintamount, 

            submitted: true,
          });
          //console.log("Responseeeee"+response.data);
          this.displayModal("Minting request submitted for review", "OK", null, null, null);

        })
        .catch(e => {
          this.hide_loading();  // hide progress

          console.log("Error: ",e);
          console.log("Response error:",e.response.data.message);
          if (e.response.data.message !==null && e.response.data.message !== "") 
            this.displayModal("Error: "+e.response.data.message+".\n\nPlease contact tech support.", null, null, null, "OK");
          else
            this.displayModal("Error: "+e.message+".\n\nPlease contact tech support.", null, null, null, "OK");

        });
      } else {
        this.hide_loading();  // hide progress

        console.log("Form Validation failed >>>");
        //alert("Form Validation failed >>>");
      }
    }
  }

  newMint() {
    this.setState({
      id: null,
      campaignid: "",
      tokenname: "",
      blockchain: "",
      smartcontractaddress: "",
      description: "",
      startdate: "",
      enddate: "",
      campaign: "",
      totalsupply: "",
      mintAmount: "",

      currentUser: undefined,
      actionby: undefined,
      datachanged: false,
      submitted: false
    });
  }

  getAllCampaigns() {
    CampaignDataService.getAll()
      .then(response => {
        console.log("CampaignList from server:", response.data);
        console.log("Response.data length:", response.data.length);
        if (response.data.length === 0) {
          this.setState({
            campaignList: [ { id:-1, name:"No campaign available, please create a campaign first."}],
          });
        } else {          
          var first_array_record = [  // add 1 empty record to front of array which is the option list
            { }
          ];
          this.setState({
            campaignList: [first_array_record].concat(response.data)
          });
        }
      })
      .catch(e => {
        console.log(e);
        //return(null);
      });
  }

  getAllMints() {
    MintDataService.findAllByCampaign()
      .then(response => {
        var first_array_record = [  // add 1 empty record to front of array which is the option list
          { }
        ];
        this.setState({
            campaignList: [first_array_record].concat(response.data)
        });
      })
      .catch(e => {
        console.log(e);
        //return(null);
      });
  }


  retrieveAllMakersCheckersApprovers() {
    UserOpsRoleDataService.getAllMakersCheckersApprovers("mint")
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

    this.getAllCampaigns();

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
    const { campaignList, checkerList, approverList } = this.state;
    console.log("Render campaignList:", campaignList);

    return (
      <div className="container">
      {(this.state.userReady) ?
        <div>
        <header className="jumbotron col-md-8">
          <h3>
            <strong>Mint Tokens ({ (this.state.isMaker? "Maker" : (this.state.isChecker? "Checker": (this.state.isApprover? "Approver":null)) )})</strong>
          </h3>
        </header>

        </div>: null}

          <div className="submit-form list-row">

            <div className="col-md-8">
              <div className="form-group">
                  <label htmlFor="campaignid">Campaign</label>
                  <select
                        onChange={this.onChangeCampaign}                         
                        className="form-control"
                        id="campaignid"
                        disabled={!this.state.isMaker}
                      >
                        {
                          Array.isArray(campaignList) ?
                            campaignList.map( (d) => {
                              return <option value={d.id}>{d.name}</option>
                            })
                          : null
                        }
                      </select>
                </div>
                <div className="form-group">
                  <label htmlFor="name">Name of Token</label>
                  <input
                    type="text"
                    className="form-control"
                    id="tokenname"
                    required
                    value={this.state.tokenname}
                    onChange={this.onChangeTokenName}
                    autoComplete="off"
                    disabled={true}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="blockchain">Blockchain</label>
                  <input
                    type="text"
                    className="form-control"
                    id="blockchain"
                    required
                    value={
                      (() => {
                        switch (this.state.blockchain) {
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
                    }
                    onChange={this.onChangeBlockchain}
                    autoComplete="off"
                    disabled={true}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="smartcontractaddress">Smart Contract</label>
                  <input
                    type="text"
                    className="form-control"
                    id="smartcontractaddress"
                    required
                    value={this.state.smartcontractaddress}
                    autoComplete="off"
                    disabled={true}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="startdate">Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    id="startdate"
                    required
                    value={this.state.startdate}
                    onChange={this.onChangeStartDate}
                    disabled={true}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="enddate">Expiry Date</label>
                  <input
                    type="date"
                    className="form-control"
                    id="enddate"
                    required
                    value={this.state.enddate}
                    onChange={this.onChangeEndDate}
                    disabled={true}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="mintAmount">Mint Amount * { ((this.state.totalsupply !== undefined && this.state.totalsupply != null && this.state.totalsupply !=="" && this.state.minted_tokens !== undefined && this.state.minted_tokens != null && this.state.minted_tokens !=="") ? `(${ (parseFloat(this.state.inwallet)).toLocaleString() } in Wallet,  ${ (parseFloat(this.state.minted_tokens)).toLocaleString() } Minted,  ${ (this.state.totalsupply).toLocaleString() } Total Supply)` : null)}</label>
                  <input
                    type="number"
                    className="form-control"
                    id="mintAmount"
                    min="0"
                    max={this.state.totalsupply - this.state.minted_tokens}
                    step="1"
                    required
                    onChange={this.onChangeMintAmount}
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
                {
                  (this.state.isMaker)?
                    <button onClick={this.saveMint} className="btn btn-primary">
                      Submit Mint Request
                    </button>
                    :null
                }

                { 
                  (this.state.isMaker)? (
                    (this.state.datachanged) ? 
                    <button className="m-3 btn btn-sm btn-secondary" onClick={this.showModal_Leave}>
                      Cancel
                    </button>
                    : 
                    <Link to="/mint">
                    <button className="m-3 btn btn-sm btn-secondary">
                      Cancel
                    </button>
                    </Link>
                    )
                  : 
                  <Link to="/mint">
                  <button className="m-3 btn btn-sm btn-secondary">
                    Back
                  </button>
                  </Link>
                }
                  {this.state.isLoading ? <LoadingSpinner /> : null}

                  <Modal showm={this.state.showm} handleProceed1={event =>  window.location.href='/mint'} handleProceed2={null} handleProceed3={null} button1text={this.state.button1text} button2text={this.state.button2text} button3text={this.state.button3text} button0text={this.state.button0text} handleCancel={this.hideModal}>
                    {this.state.modalmsg}
                  </Modal>

                  <p>{this.state.message}</p>

              </div>
          </div>
      </div>
    );
  }
}

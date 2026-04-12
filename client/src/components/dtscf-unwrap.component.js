import React, { Component } from "react";
import CampaignDataService from "../services/campaign.service.js";
import DtscfDataService from "../services/dtscf.service.js";
import RecipientDataService from "../services/recipient.service.js";
import UserOpsRoleDataService from "../services/user_opsrole.service.js";
import { withRouter } from '../common/with-router.js';
import AuthService from "../services/auth.service.js";
import { Link, Navigate } from "react-router-dom";
import validator from 'validator';
import Modal from '../Modal.js';
import LoadingSpinner from "../LoadingSpinner.js";
import "../LoadingSpinner.css";
import moment from 'moment';
//import { recipients } from "../../../server/app/models/index.js";
// Requires js-sha3 library: npm install js-sha3
import { keccak256 } from 'js-sha3';

(function disableMetaMask() {
  if (typeof document !== 'undefined') {
    const meta = document.createElement('meta');
    meta.name = "ethereum-protocol";
    meta.content = "disabled";
    document.head.appendChild(meta);
  }
})();

function isChecksumAddress(address) {
  address = address.replace('0x', '');
  const addressHash = keccak256(address.toLowerCase());
  
  for (let i = 0; i < 40; i++) {
    // Check if the nth letter should be uppercase
    if ((parseInt(addressHash[i], 16) > 7 && address[i].toUpperCase() !== address[i]) ||
        (parseInt(addressHash[i], 16) <= 7 && address[i].toLowerCase() !== address[i])) {
      return false;
    }
  }
  return true;
}

function isValidAddress(address) {
  if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) return false;
  if (/^(0x)?[0-9a-f]{40}$/.test(address) || /^(0x)?[0-9A-F]{40}$/.test(address)) return true;
  return isChecksumAddress(address);
}

function getToday() {
  const today = new Date();
  return moment(today).format('YYYY-MM-DD')
}

class DTSCFProjectCreation extends Component {
  constructor(props) {
    super(props);
    this.onChangeName = this.onChangeName.bind(this);
    this.onChangeDescription = this.onChangeDescription.bind(this);
    this.onChangeTotalBudget = this.onChangeTotalBudget.bind(this);
    this.onChangeUnderlying = this.onChangeUnderlying.bind(this);
    this.onChangeStartDate = this.onChangeStartDate.bind(this);
    this.onChangeEndDate = this.onChangeEndDate.bind(this);
    this.addMilestone = this.addMilestone.bind(this);
    this.onChangeMilestone = this.onChangeMilestone.bind(this);
    this.removeMilestone = this.removeMilestone.bind(this);
    this.addContractor = this.addContractor.bind(this);
    this.onChangeContractor = this.onChangeContractor.bind(this);
    this.removeContractor = this.removeContractor.bind(this);
    this.addPurchase = this.addPurchase.bind(this);
    this.onChangePurchase = this.onChangePurchase.bind(this);
    this.onChangePurchaseAmount = this.onChangePurchaseAmount.bind(this);
    this.onChangePurchaseMilestone = this.onChangePurchaseMilestone.bind(this);
    this.removePurchase = this.removePurchase.bind(this);
    this.handleInvoiceUpload = this.handleInvoiceUpload.bind(this);
    //this.onChangeChecker = this.onChangeChecker.bind(this);
    this.onChangeApprover = this.onChangeApprover.bind(this);
    //this.onChangeCheckerComments = this.onChangeCheckerComments.bind(this);
    this.onChangeApproverComments = this.onChangeApproverComments.bind(this);
    this.handleMilestoneChange = this.handleMilestoneChange.bind(this); 


    this.createProject = this.createProject.bind(this);
    this.updateProject = this.updateProject.bind(this);
    this.submitDtscf = this.submitDtscf.bind(this);
    this.acceptDtscf = this.acceptDtscf.bind(this);
    this.approveDtscf = this.approveDtscf.bind(this);
    this.rejectDtscf = this.rejectDtscf.bind(this);
    this.deleteDtscf = this.deleteDtscf.bind(this);
    this.dropRequest = this.dropRequest.bind(this);

    this.showModal_Leave = this.showModal_Leave.bind(this);
    this.hideModal = this.hideModal.bind(this);
    
    this.state = {
      redirect : null,
      currentUser: { id: null, username: "" },
      recipients: { id: null, name: null },
      currentProject: {
        id: 0,
        name: "ppp",
        description: "pppp",
        totalBudget: 11110,
        anchor_id: 16,
        underlyingTokenID: 0,
        underlyingDSGDsmartcontractaddress: "",
        smartcontractaddress: "",
        blockchain: 0,
        campaign: null,
        campaign_id: 0,
        startdate: getToday(),
        enddate: getToday(),
        milestones: [{name: "mmm", budget: 222, startdate: getToday(), enddate: getToday()}],
        contractors: [{name: "ccc", budget: 3333, walletaddress: "", purchases: [{description: "ppp", amount: 4444}],  invoices: []}], // invoices as File objects

        selectedMilestone: "", // Track selected milestone name
      },
      underlyingDSGDList: [],
      checkerList: {
        id: null,
        username: "",
      },
      approverList: {
        id: null,
        username: "",
      },

      isNewProject: true,
      datachanged: false,
      message: "",
      isLoading: false,
      logs: [], // New state for streaming logs
      modal: {
        showm: false,
        modalmsg: "",
        button1text: null,
        button0text: null,
      }
    };
  }

  retrieveAllMakersCheckersApprovers() {
    UserOpsRoleDataService.getAllMakersCheckersApprovers("dtscf")
      .then(response => {
        console.log("Data received by getAllCheckerApprovers:", response.data);
//        let chkList = response.data.find(element => element.name.toUpperCase() === "CHECKER");
        let apprList = response.data.find(element => element.name.toUpperCase() === "APPROVER");

        this.setState({
//          checkerList: (chkList.user || []), // Fallback to empty array
          approverList: (apprList.user || []) // Fallback to empty array
        });
//        console.log("checkerList: ", chkList.user);
        console.log("approverList: ", apprList.user);      
      })
      .catch(e => {
        console.log(e);
        //return(null);
      });
  }

  componentDidMount() {
    // Tell MetaMask this page is not for them
    if (window.ethereum) {
      window.ethereum.autoRefreshOnNetworkChange = false; // Prevents some auto-connect errors
    }
    
    const user = AuthService.getCurrentUser();
    this.setState({ currentUser: user });
    console.log("Current user:", user); 

    if (!user) {
      this.setState({ redirect: "/login" });
    } else {
      this.setState({ currentUser: user, actionby:user.username, userReady: true })

      let ismaker= user.opsrole.find((el) => 
        el.opsrole.name.toUpperCase() === "MAKER"
      );
      console.log("isMaker:", (ismaker === undefined? false: true));
      this.setState({ isMaker: (ismaker === undefined? false: true),});

//      let ischecker= user.opsrole.find((el) => 
//        el.opsrole.name.toUpperCase() === "CHECKER"
//      );
//      console.log("isChecker:", (ischecker === undefined? false: true));
//      this.setState({ isChecker: (ischecker === undefined? false: true),});

      let isapprover= user.opsrole.find((el) => 
      el.opsrole.name.toUpperCase() === "APPROVER"
      );
      console.log("isApprover:", (isapprover === undefined? false: true));
      this.setState({ isApprover: (isapprover === undefined? false: true),});

      this.getAllUnderlyingAssets();
      this.getProject(user, typeof this.props.router.params.id === "string" ? parseInt(this.props.router.params.id) : this.props.router.params.id);
      this.retrieveAllMakersCheckersApprovers();
    }
  }

  componentWillUnmount() {
    // Remove the tag when leaving this page so MetaMask works on other pages
    const meta = document.getElementById('disable-metamask-meta');
    if (meta) {
      meta.parentNode.removeChild(meta);
    }
  }

  async getProject(user, id) {
    console.log("+++ id:'"+id+"' +++");
    console.log("typeof id:'"+typeof id+"' +++");

    this.setState({ isLoading: true });
    if (id !== undefined && id !== 0) {
      console.log("Calling getAllByDtscfId... ");

      await DtscfDataService.getAllByDtscfId(id)
      .then(response => {
        if (response && response.data) {
          console.log("Response from getAllByDtscfId(id):", response.data);

          const data = response.data;
          this.setState({
            currentProject: {
              id: data.id,
              name: data.name,
              description: data.description,
              totalBudget: data.totalBudget,
              anchor_id: data.anchor_id,
              underlyingTokenID: parseInt(data.underlyingTokenID) || "",
              underlyingDSGDsmartcontractaddress: data.underlyingDSGDsmartcontractaddress,
              smartcontractaddress: data.smartcontractaddress,
              blockchain: data.blockchain,
              campaign_id: data.campaign_id,
              startdate: moment(data.startdate).format('YYYY-MM-DD'),
              enddate: moment(data.enddate).format('YYYY-MM-DD'),
              actionby: data.actionby,
              status: data.status,
              txntype: data.txntype,
              actiontimedate: data.actiontimedate,
              maker: data.maker,
              approver: data.approver,
              approverComments: data.approverComments,
              milestones: (data.dtscf_milestones || []).map(ms => ({
                ...ms,
                id: ms.id,
                description: ms.description || "",
                budget: ms.budget || 0,
                startdate: moment(ms.startdate).format('YYYY-MM-DD'),
                enddate: moment(ms.enddate).format('YYYY-MM-DD'),
              })),
              contractors: (data.dtscf_contractors || []).map(con => ({
                ...con,
                id: con.id,
                name: con.name || "",
                budget: con.budget || 0,
                walletaddress: con.walletaddress || "",
                purchases: (con.dtscf_purchases || []).map(pur => {
                  const matchedMilestone = (data.dtscf_milestones || []).find(m => m.id === pur.dtscf_milestone_id);
                  return {
                    ...pur,
                    id: pur.id,
                    description: pur.description || "",
                    amount: pur.amount || 0,
                    milestone: matchedMilestone ? matchedMilestone.name : (pur.milestone || ""),
                    invoices: [] // Initialize as empty array for new uploads
                  };
                }),
                subcontractors: con.subcontractors || []
              }))            
            },
            isLoading: false
          });

          RecipientDataService.findOne(data.anchor_id)
          .then(response => {
            this.setState({
              recipients: response.data
            });
            console.log("Organisation:",response.data);
          })
          .catch(e => {
            console.log(e);
          });

        } else {
          console.log("Invalid response from getAllDraftsByDtscfId(id)!");
          this.setState({
            message: "Invalid response data",
            isLoading: false
          });
        }
      })
      .catch(e => {
        console.log(e);
        this.setState({ isLoading: false, message: "Error fetching project data: " + e.message });
      });
    } else { // id == 0, new project
      console.log("Organisation id = ", user.organisation_id);
      RecipientDataService.findOne(user.organisation_id)
        .then(response => {
          this.setState({
            recipients: response.data
          });
          console.log("Organisation:",response.data);
        })
        .catch(e => {
          console.log(e);
        });
    }
    this.setState({ isLoading: false });
  }

  getAllUnderlyingAssets() {
    CampaignDataService.getAll()
      .then(response => {
        if (response.data.length === 0) {
          this.setState({
            underlyingDSGDList: [ { id:-1, name:"No campaign available, please create a campaign first."}],
          });
        } else {        
          console.log("UnderlyingDSGDList:, ", response.data);  
          this.setState({
            underlyingDSGDList: response.data,
          });
        }
      })
      .catch(e => {
        console.log(e);
        //return(null);
      });
  }
  
  onChangeName(e) {
    const name = e.target.value;
    this.setState({
      datachanged: true
    });

    this.setState(function(prevState) {
      return {
        currentProject: {
          ...prevState.currentProject,
          name: name
        }
      };
    });
  }

  onChangeDescription(e) {
    const description = e.target.value;
    this.setState(prevState => ({
      currentProject: { ...prevState.currentProject, description },
      datachanged: true
    }));
  }

  onChangeTotalBudget(e) {
    const totalBudget = parseFloat(e.target.value);
    this.setState(prevState => ({
      currentProject: { ...prevState.currentProject, totalBudget },
      datachanged: true
    }));
  }

  onChangeUnderlying(e) {
    const underlyingTokenID = parseInt(e.target.value);
    console.log("New underlyingTokenID=", underlyingTokenID);
    const newBlockchain = this.state.underlyingDSGDList.find((ee) => ee.id === parseInt(underlyingTokenID)).blockchain;
    console.log("New blockchain=", newBlockchain);
    const newUnderlyingDSGDsmartcontractaddress = this.state.underlyingDSGDList.find((ee) => ee.id === parseInt(underlyingTokenID)).smartcontractaddress
    console.log("New UnderlyingDSGDsmartcontractaddress=", newUnderlyingDSGDsmartcontractaddress);
    const newCampaign = this.state.underlyingDSGDList.find((ee) => ee.id === parseInt(underlyingTokenID));
    console.log("New Campaign=", newCampaign);

    // when underlying changes, blockchain might change also bccos underlying could be in different blockchain
    this.setState({
      datachanged: true
    });
    this.setState(function(prevState) {
      return {
        currentProject: {
          ...prevState.currentProject,
          underlyingTokenID: underlyingTokenID,
          blockchain: newBlockchain,
          underlyingDSGDsmartcontractaddress: newUnderlyingDSGDsmartcontractaddress,
          campaign: newCampaign,  // updating this will change the blockchain field also
        }
      };
    });
    console.log("New currentProject=", this.state.currentProject);

  }

  onChangeStartDate(e) {
    const startdate = e.target.value;
    this.setState({
      datachanged: true
    });

    this.setState(prevState => ({
      currentProject: {
        ...prevState.currentProject,
        startdate: startdate
      }
    }));
  }

  onChangeEndDate(e) {
    const enddate = e.target.value;
    this.setState({
      datachanged: true
    });

    this.setState(prevState => ({
      currentProject: {
        ...prevState.currentProject,
        enddate: enddate
      }
    }));
  }

  addMilestone() {
    this.setState(prevState => ({
      currentProject: {
        ...prevState.currentProject,
        milestones: [...prevState.currentProject.milestones, { name: "", budget: 0, startdate: getToday(), enddate: getToday() }]
      },
      datachanged: true
    }));
  }

  onChangeMilestone(index, field, value) {
    const milestones = [...this.state.currentProject.milestones];
    const oldName = milestones[index].name;
    milestones[index][field] = field === 'budget' ? parseFloat(value) : value;

    // Update purchases if the milestone name changes
    let contractors = [...this.state.currentProject.contractors];
    if (field === 'name') {
      contractors.forEach(con => {
        con.purchases.forEach(pur => {
          if (pur.milestone === oldName) {
            pur.milestone = value; // update to new name dynamically
          }
        });
      });
    }

    this.setState(prevState => ({
      currentProject: { ...prevState.currentProject, milestones, contractors },
      datachanged: true
    }));
  }

  removeMilestone(index) {
    const milestones = [...this.state.currentProject.milestones];
    milestones.splice(index, 1);
    
    // Reset purchase dropdown to blank if its tagged milestone is deleted
    const contractors = [...this.state.currentProject.contractors];
    const validMilestoneNames = milestones.map(m => m.name);
    
    contractors.forEach(con => {
      con.purchases.forEach(pur => {
        if (!validMilestoneNames.includes(pur.milestone)) {
          pur.milestone = ""; 
        }
      });
    });

    this.setState(prevState => ({
      currentProject: { ...prevState.currentProject, milestones, contractors },
      datachanged: true
    }));
  }

  addContractor() {
    this.setState(prevState => ({
      currentProject: {
        ...prevState.currentProject,
        contractors: [...prevState.currentProject.contractors, { name: "", budget: 0, walletaddress: "", purchases: [], invoices: [] }]
      },
      datachanged: true
    }));
  }

  onChangeContractor(index, field, value) {
    const contractors = [...this.state.currentProject.contractors];
    contractors[index][field] = field === 'budget' ? parseFloat(value) : value;
    this.setState(prevState => ({
      currentProject: { ...prevState.currentProject, contractors },
      datachanged: true
    }));
  }

  removeContractor(index) {
    const contractors = [...this.state.currentProject.contractors];
    contractors.splice(index, 1);
    this.setState(prevState => ({
      currentProject: { ...prevState.currentProject, contractors },
      datachanged: true
    }));
  }

  addPurchase(conIndex) {
    const contractors = [...this.state.currentProject.contractors];
    contractors[conIndex].purchases.push({ description: "", amount: 0, milestone: "", invoices: [] });
    this.setState(prevState => ({
      currentProject: { ...prevState.currentProject, contractors },
      datachanged: true
    }));
  }

  onChangePurchase(conIndex, purIndex, value) {
    const contractors = [...this.state.currentProject.contractors];
    contractors[conIndex].purchases[purIndex].description = value;
    this.setState(prevState => ({
      currentProject: { ...prevState.currentProject, contractors },
      datachanged: true
    }));
  }

  onChangePurchaseAmount(conIndex, purIndex, value) {
    const contractors = [...this.state.currentProject.contractors];
    contractors[conIndex].purchases[purIndex].amount = parseFloat(value);
    this.setState(prevState => ({
      currentProject: { ...prevState.currentProject, contractors },
      datachanged: true
    }));
  }
  
  onChangePurchaseMilestone(conIndex, purIndex, value) {
    const contractors = [...this.state.currentProject.contractors];
    contractors[conIndex].purchases[purIndex].milestone = value;
    this.setState(prevState => ({
      currentProject: { ...prevState.currentProject, contractors },
      datachanged: true
    }));
  }

  removePurchase(conIndex, purIndex) {
    const contractors = [...this.state.currentProject.contractors];
    contractors[conIndex].purchases.splice(purIndex, 1);
    this.setState(prevState => ({
      currentProject: { ...prevState.currentProject, contractors },
      datachanged: true
    }));
  }

  handleInvoiceUpload(conIndex, purIndex, e) {
    const file = e.target.files[0];
    if (!file) return;

    const contractors = [...this.state.currentProject.contractors];
    const purchase = contractors[conIndex].purchases[purIndex];

    // FIX: Ensure the invoices array exists before pushing
    if (!purchase.invoices) {
      purchase.invoices = [];
    }

    purchase.invoices.push(file);
    this.setState(prevState => ({
      currentProject: { ...prevState.currentProject, contractors },
      datachanged: true
    }));
  }

  onChangeApprover(e) {
    const approver = e.target.value;
    /*
    this.setState({
      datachanged: true
    });
  */
    this.setState(prevState => ({
      currentProject: {
        ...prevState.currentProject,
        approver: approver
      }
    }));
  }

  onChangeApproverComments(e) {
    const approverComments = e.target.value;

    this.setState({
      datachanged: true
    });
    this.setState(function(prevState) {
      return {
        currentProject: {
          ...prevState.currentProject,
          approverComments: approverComments
        }
      };
    });
  }

  handleMilestoneChange(e) {
    this.setState({ selectedMilestone: e.target.value });
  }

  async validateForm() {    
    var err = "";

    if (!(typeof this.state.currentProject.name ==='string' || this.state.currentProject.name instanceof String) || (this.state.currentProject.name.trim() === "" || this.state.currentProject.name === null || this.state.currentProject.name === undefined)) {
      err += "- Name cannot be empty\n";
    } 

    this.state.currentProject.contractors.forEach(con => {
      if (!(typeof con.name ==='string' || con.name instanceof String) || (con.name.trim() === "" || con.name === null || con.name === undefined)) {
        err += "- Contractor's Name cannot be empty\n"; 
      } 

      if (!(typeof con.walletaddress ==='string' || con.walletaddress instanceof String) || (con.walletaddress.trim() === "" || con.walletaddress === null || con.walletaddress === undefined)) {
        err += "- Contractor's Wallet Address cannot be empty\n"; 
      } else if (!isValidAddress(con.walletaddress)) {
        err += `- Contractor ${con.name}'s Wallet Address is invalid\n`;
      }
    });

    this.state.currentProject.milestones.forEach(ms => {
      if (! validator.isDate(ms.startdate)) err += "- Milestone '" + ms.name + "' Start Date is invalid\n";
      if (! validator.isDate(ms.enddate)) err += "- Milestone '" + ms.name + "' End Date is invalid\n";
      if (validator.isDate(ms.startdate) && validator.isDate(ms.enddate)) {
        if (moment(ms.startdate).isAfter(moment(ms.enddate))) err += "- Milestone '" + ms.name + "' Start date cannot be later than End date\n";
        if (! moment(ms.enddate).isAfter(moment(ms.startdate))) err += "- Milestone '" + ms.name + "' End date must be after Start date\n";
      }
    });

      // dont need t check description, it can be empty
    if (! validator.isDate(this.state.currentProject.startdate)) err += "- Start Date is invalid\n";
    if (! validator.isDate(this.state.currentProject.enddate)) err += "- End Date is invalid\n";
    if (validator.isDate(this.state.currentProject.startdate) && validator.isDate(this.state.currentProject.enddate)) {
      if (moment(this.state.currentProject.startdate).isAfter(moment(this.state.currentProject.enddate))) err += "- Project Start date cannot be later than End date\n";
      if (! moment(this.state.currentProject.enddate).isAfter(moment(this.state.currentProject.startdate))) err += "- Project End date must be after Start date\n";
    }
    if (this.state.currentProject.underlyingTokenID === 0 || this.state.currentProject.underlyingTokenID === "" || this.state.currentProject.underlyingTokenID === null || this.state.currentProject.underlyingTokenID === undefined) err += "- Underlying Digital Money cannot be empty\n";
    if (this.state.currentProject.totalBudget === "" || this.state.currentProject.totalBudget === null || this.state.currentProject.totalBudget === undefined) 
    {
        err += "- Budget cannot be empty\n";
    } else
        if (parseInt(this.state.currentProject.totalBudget) <=  0) err += "- Budget must be more than zero\n";
    if (this.state.currentProject.startdate!== "" && this.state.currentProject.enddate !== "" && this.state.currentProject.startdate > this.state.currentProject.enddate) err += "- Start date cannot be later than End date\n";    

    console.log("start date:'"+this.state.currentProject.startdate+"'");
    console.log("end date:'"+this.state.currentProject.enddate+"'");
    console.log("Start > End? "+ (this.state.currentProject.startdate > this.state.currentProject.enddate));

//    console.log("Checker:'"+this.state.currentProject.checker+"'");
    console.log("Approver:'"+this.state.currentProject.approver+"'");

//    if (this.state.currentProject.checker === "" || this.state.currentProject.checker === null || this.state.currentProject.checker === undefined) err += "- Checker cannot be empty\n";
    if (this.state.currentProject.approver === "" || this.state.currentProject.approver === null || this.state.currentProject.approver === undefined) err += "- Approver cannot be empty\n";
    if (
      //this.state.currentProject.checker === this.state.currentUser.id.toString() && 
        this.state.currentProject.approver === this.state.currentUser.id.toString()) {
      err += "- Maker and Approver cannot be the same person\n";
    } else {
//      if (this.state.currentProject.checker === this.state.currentUser.id.toString()) err += "- Maker and Checker cannot be the same person (yourself)\n";
      if (this.state.currentProject.approver === this.state.currentUser.id.toString()) err += "- Maker and Approver cannot be the same person (yourself)\n";
//      if (this.state.currentProject.checker!==null && this.state.currentProject.checker!=="" && this.state.currentProject.checker !== undefined
//            && this.state.currentProject.checker === this.state.currentProject.approver) err += "- Checker and Approver cannot be the same person\n";
    }

    if (err !=="" ) {
      err = "Form validation issues found:\n"+err;
      //alert(err);
      this.displayModal(err, null, null, null, "OK");
      err = ""; // clear var
      return false;
    }
    return true;
  }  // validateForm()
  

  //////////////////////////////////////////////////////////////////////

  async createProject(){
    this.setState({
      isLoading: true,
      logs: [] ,
      message: "",
      showm: true,
      modalmsg: "Processing...\n",
      button1text: null,
      button2text: null,
      button3text: null,
      button0text: null,
      afterModalClose: null,
    });

    console.log('[CLIENT] createProject called with data:', this.state.currentProject);

    this.setState({ isLoading: true, logs: [], message: '' });

    if (await this.validateForm() === true) {   
      const draftData = {
          name: this.state.currentProject.name,
          description: this.state.currentProject.description,
          totalBudget: this.state.currentProject.totalBudget,
          underlyingDSGDsmartcontractaddress: this.state.currentProject.underlyingDSGDsmartcontractaddress,
          underlyingTokenID: this.state.currentProject.underlyingTokenID,
          campaign_id: this.state.currentProject.campaign_id,
          blockchain: this.state.currentProject.blockchain,
          startdate: this.state.currentProject.startdate,
          enddate: this.state.currentProject.enddate,
          txntype: this.state.currentProject.txntype || 0,  // Fallback only if truly missing, but ensure set
          anchor_id: this.state.currentProject.anchor_id,  // From state, even if undefined
          maker: this.state.currentProject.maker || this.state.currentUser.id,
          approver: this.state.currentProject.approver,
          actionby: this.state.currentUser.username,  // Use username for consistency
          approveddtscfid: this.state.currentProject.approveddtscfid || -1,
          milestones: this.state.currentProject.milestones.map(ms => ({
            id: ms.id,
            name: ms.name,
            budget: ms.budget,
            startdate: ms.startdate,
            enddate: ms.enddate,
            description: ms.description || ''  // Include if needed
          })),
          contractors: this.state.currentProject.contractors.map(con => ({
            id: con.id,
            name: con.name,
            budget: con.budget,
            walletaddress: con.walletaddress,
            purchases: con.purchases.map(pur => ({
              id: pur.id,
              description: pur.description,
              amount: pur.amount,
              milestone: pur.milestone, 
              invoices: pur.invoices  
            })),
            subcontractors: con.subcontractors || []  // If applicable
          }))
      };

      console.log('Full draftData being sent:', JSON.stringify(draftData));  // This should now show all data

      this.setState({ isLoading: true });

      DtscfDataService.draftCreate(draftData, (log1) => {
        this.setState(prevState => ({
          modalmsg: prevState.modalmsg + log1 + "\n"
        }));
        console.log('[CLIENT UI] Received log:', log1); // NEW: Confirm onLog calls
        this.setState({ logs: [...this.state.logs, log1] });
      })
      .then(response => {
        this.setState(prevState => ({
          modalmsg: prevState.modalmsg + response.message + "\n",
          button0text: "Close",
          isLoading: false,
          afterModalClose: () => this.props.router.navigate("/dtscf")
        }));
        console.log('[CLIENT UI] draftCreate success:', response); // NEW: Confirm resolve
        //this.setState({ logs: [...this.state.logs, log1] });

        this.setState({
/*          currentProject: {
            ...this.state.currentProject,
            id: response.data.id || response.message?.match(/id=(\d+)/)?.[1] || this.state.currentProject.id,  // Parse id if in message
            maker: this.state.currentUser.id,
            txntype: 0  // For new creation requests
          },
*/
          message: response.message,
          isLoading: false
        });
      })
      .catch(e => {
        const errMsg = (e.response && e.response.data && e.response.data.message) || e.message || e.toString();
        this.setState(prevState => ({
          modalmsg: prevState.modalmsg + "Error: " + errMsg + "\n",
          button0text: "Close",
          isLoading: false,
        }));
        console.error('[CLIENT UI] draftCreate error:', errMsg); // NEW: Confirm reject
        //this.setState({ logs: [...this.state.logs, log1] });
      });
    } // await this.validateForm()
    this.hide_loading();

  }
  
  async submitDtscf() {
    this.setState({ // show loading modal with logs
      isLoading: true,
      logs: [] ,
      message: "",
      showm: true,
      modalmsg: "Processing...\n",
      button1text: null,
      button2text: null,
      button3text: null,
      button0text: null,
      afterModalClose: null,
    });

    if (await this.validateForm() === true) {   
      const submitData = {
        name: this.state.currentProject.name,
        description: this.state.currentProject.description,
        totalBudget: this.state.currentProject.totalBudget,
        underlyingDSGDsmartcontractaddress: this.state.currentProject.underlyingDSGDsmartcontractaddress,
        underlyingTokenID: this.state.currentProject.underlyingTokenID,
        campaign_id: this.state.currentProject.campaign_id,
        blockchain: this.state.currentProject.blockchain,
        startdate: this.state.currentProject.startdate,
        enddate: this.state.currentProject.enddate,
        txntype: this.state.currentProject.txntype || 0,  // Fallback only if truly missing, but ensure set
        anchor_id: this.state.currentProject.anchor_id,  // From state, even if undefined
        maker: this.state.currentProject.maker || this.state.currentUser.id,
        approver: this.state.currentProject.approver,
        actionby: this.state.currentUser.username,  // Use username for consistency
        approveddtscfid: this.state.currentProject.approveddtscfid || -1,
        milestones: this.state.currentProject.milestones.map(ms => ({
          id: ms.id,
          name: ms.name,
          budget: ms.budget,
          startdate: ms.startdate,
          enddate: ms.enddate,
          description: ms.description || ''  // Include if needed
        })),
        contractors: this.state.currentProject.contractors.map(con => ({
          id: con.id,
          name: con.name,
          budget: con.budget,
          walletaddress: con.walletaddress,
          purchases: con.purchases.map(pur => ({
            id: pur.id,
            description: pur.description,
            milestone: pur.milestone, 
            amount: pur.amount
            // invoices: pur.invoices  // Omit files since no upload in submit; already handled in create/update
          })),
          subcontractors: con.subcontractors || []  // If applicable
        }))
      };

      console.log('Full submitData being sent:', JSON.stringify(submitData));  // This should now show all data

      this.setState({ isLoading: true });

      DtscfDataService.submitDraftById(this.state.currentProject.id, submitData, (log1) => {
        this.setState(prevState => ({
          modalmsg: prevState.modalmsg + log1 + "\n"
        }));
        //this.setState({ logs: [...this.state.logs, log1] });
      })
      .then(response => {
        this.setState(prevState => ({
          modalmsg: prevState.modalmsg + response.message + "\n",
          button0text: "Close",
          isLoading: false,
          afterModalClose: () => this.props.router.navigate("/dtscf")
        }));
        //this.setState({ logs: [...this.state.logs, log1] });

        this.setState({
/*          currentProject: {
            ...this.state.currentProject,
            id: response.data.id || response.message?.match(/id=(\d+)/)?.[1] || this.state.currentProject.id,  // Parse id if in message
            maker: this.state.currentUser.id,
            txntype: 0  // For new creation requests
          },
*/
          message: response.message,
          isLoading: false
        });
      })
      .catch(e => {
        const errMsg = (e.response && e.response.data && e.response.data.message) || e.message || e.toString();
        this.setState(prevState => ({
          modalmsg: prevState.modalmsg + "Error: " + errMsg + "\n",
          button0text: "Close",
          isLoading: false,
        }));
        //this.setState({ logs: [...this.state.logs, log1] });
      });
    }
    this.setState({ isLoading: false });
  } // submitDtscf()

  async acceptDtscf() {
      console.log("IsLoad=true");
      this.show_loading();

      await DtscfDataService.acceptDraftById(
        this.state.currentProject.id,
        this.state.currentProject
      )
      .then(response => {
        this.hide_loading();

        console.log("Response: ", response);
        console.log("IsLoad=false");
        this.hide_loading();
  
        this.setState({  
          datachanged: false,
        });
        this.displayModal("Dtscf request checked, sending for approval.", "OK", null, null, null);
      })
      .catch(e => {
        this.hide_loading();

        console.log(e);
        console.log(e.message);
        this.displayModal("Dtscf accept failed.", null, null, null, "OK");

        try {
          console.log(e.response.data.message);
          if (e.response.data.message.includes("SequelizeUniqueConstraintError")) {
            this.displayModal("The Dtscf accept failed. The Dtscf name is already used, please use another name.", null, null, null, "OK");
          }
        } catch(e) {
          this.hide_loading();

          console.log("Error: ",e);
          console.log("Response error:",e.response.data.message);
          if (e.response.data.message !== "") 
            this.displayModal("Error: "+e.response.data.message+". Please contact tech support.", null, null, null, "OK");
          else
            this.displayModal("Error: "+e.message+". Please contact tech support.", null, null, null, "OK");
        } 
      });
    this.hide_loading();
  } //  acceptDtscf()

  async approveDtscf() {
    this.setState({ // show loading modal with logs
      isLoading: true,
      logs: [] ,
      message: "",
      showm: true,
      modalmsg: "Processing...\n",
      button1text: null,
      button2text: null,
      button3text: null,
      button0text: null,
      afterModalClose: null,
    });
    
    console.log("IsLoad=true");
    this.show_loading();

    console.log("Approving Dtscf ID:", this.state.currentProject.id);
    console.log("Approving Dtscf:", this.state.currentProject);

    await DtscfDataService.approveDraftById(this.state.currentProject.id, this.state.currentProject, (log1) => {
      this.setState(prevState => ({
        modalmsg: prevState.modalmsg + log1 + "\n"
      }));
      //this.setState({ logs: [...this.state.logs, log1] });
    })
    .then(response => {
      this.setState(prevState => ({
        modalmsg: prevState.modalmsg + response.message + "\n",
        button0text: "Close",
        isLoading: false,
        afterModalClose: () => this.props.router.navigate("/dtscf")
      }));
      //this.setState({ logs: [...this.state.logs, log1] });

      this.setState({
/*          currentProject: {
          ...this.state.currentProject,
          id: response.data.id || response.message?.match(/id=(\d+)/)?.[1] || this.state.currentProject.id,  // Parse id if in message
          maker: this.state.currentUser.id,
          txntype: 0  // For new creation requests
        },
*/
        message: response.message,
        isLoading: false
      });
    })
    .catch(e => {
      const errMsg = (e.response && e.response.data && e.response.data.message) || e.message || e.toString();
      this.setState(prevState => ({
        modalmsg: prevState.modalmsg + "Error: " + errMsg + "\n",
        button0text: "Close",
        isLoading: false,
      }));
      //this.setState({ logs: [...this.state.logs, log1] });
    });

  } // approveDtscf()

  async updateProject() {
    this.setState({ isLoading: true });
    const formData = new FormData();
    formData.append('id', this.state.currentProject.id);
    formData.append('name', this.state.currentProject.name);
    formData.append('description', this.state.currentProject.description);
    formData.append('totalBudget', this.state.currentProject.totalBudget);
    formData.append('startdate', this.state.currentProject.startdate);
    formData.append('enddate', this.state.currentProject.enddate);
    formData.append('milestones', JSON.stringify(this.state.currentProject.milestones));
    formData.append('contractors', JSON.stringify(this.state.currentProject.contractors.map(c => (
      {...c, purchases: c.purchases.map(p => (
        { ...p, 
          milestone: p.milestone || "", 
          invoices: []
        }
      ))}
    )))); // Send metadata

    this.state.currentProject.contractors.forEach((con, conIndex) => {
      con.purchases.forEach((pur, purIndex) => {
        if (pur.invoices.length > 0) {
          formData.append(`contractor_${conIndex}_purchase_${purIndex}_invoice`, pur.invoices[0]);
        }
      });
    });

    await DtscfDataService.update(this.state.currentProject.id, formData)
      .then(response => {
        //this.setState({ message: "Project updated successfully!", isLoading: false });
        this.displayModal("Dtscf project update request submitted for review.", "OK", null, null, null);
      })
      .catch(e => {
        console.log(e);
        this.setState({ isLoading: false });
      });
  }

  async rejectDtscf() {

//    console.log("isChecker? ", this.state.isChecker);
//    console.log("this.state.currentProject.checkerComments: ", this.state.currentProject.checkerComments);
    console.log("isApprover? ", this.state.isApprover);
    console.log("this.state.currentProject.approverComments: ", this.state.currentProject.approverComments);

//    if ( this.state.isChecker && (typeof this.state.currentProject.checkerComments==="undefined" || this.state.currentProject.checkerComments==="" || this.state.currentProject.checkerComments===null)) { 
//      this.displayModal("Please enter the reason for rejection in the Checker Comments.", null, null, null, "OK");
//    } else 
    if (this.state.isApprover && (typeof this.state.currentProject.approverComments==="undefined" || this.state.currentProject.approverComments==="" || this.state.currentProject.approverComments===null)) {
      this.displayModal("Please enter the reason for rejection in the Approver Comments.", null, null, null, "OK");
    } else {
      //console.log("Form Validation passed");
    
      console.log("IsLoad=true");
      this.show_loading();

      await DtscfDataService.rejectDraftById(
        this.state.currentProject.id,
        this.state.currentProject,
      )
      .then(response => {
        this.hide_loading();

        console.log("Response: ", response);
        console.log("IsLoad=false");
        this.hide_loading();

        this.setState({  
          datachanged: false,
        });
        this.displayModal("This Dtscf request is rejected. Routing back to maker.", "OK", null, null, null);
      })
      .catch(e => {
        this.hide_loading();

        console.log(e);
        console.log(e.message);
        this.displayModal("Dtscf rejection failed.", null, null, null, "OK");
      });
    }
    this.hide_loading();
  }
    
  async deleteDtscf() {    
    console.log("IsLoad=true");
    this.show_loading();        // show progress

    await DtscfDataService.approveDeleteDraftById(
      this.state.currentProject.id,
      this.state.currentProject,
    )
    .then(response => {
      console.log("IsLoad=false");
      this.hide_loading();     // hide progress

      this.displayModal("Dtscf is deleted.", "OK", null, null, null);
      console.log(response.data);
      //this.props.router.navigate('/inbox');
    })
    .catch(e => {
      console.log("IsLoad=false");
      this.hide_loading();     // hide progress
      this.displayModal(e.message+". "+(typeof(e.response.data.message)!=='undefined' && e.response.data.message!==null ? e.response.data.message:""), null, null, null, "OK");

      console.log(e);
    });
  } // deleteDtscf()

  async dropRequest() {    
    console.log("IsLoad=true");
    this.show_loading();        // show progress

    await DtscfDataService.dropRequestById(
      this.state.currentProject.id,
      this.state.currentProject,
    )
    .then(response => {
      console.log("IsLoad=false");
      this.hide_loading();     // hide progress

      this.displayModal("Request is dropped (deleted).", "OK", null, null, null);
      console.log(response.data);
      //this.props.router.navigate('/inbox');
    })
    .catch(e => {
      console.log("IsLoad=false");
      this.hide_loading();     // hide progress
      this.displayModal(e.message+". "+(typeof(e.response.data.message)!=='undefined' && e.response.data.message!==null ? e.response.data.message:""), null, null, null, "OK");

      console.log(e);
    });
  } // dropRequest()

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
    this.displayModal("Are you sure you want to Delete this Dtscf?", null, "Yes, delete", null, "Cancel");
  };

  hideModal() {
    this.setState({
      showm: false,
      modalmsg: "",
      button1text: null,
      button2text: null,
      button3text: null,
      button0text: null,
    }, () => {
      if (this.state.afterModalClose) {
        this.state.afterModalClose();
      }
      this.setState({ afterModalClose: null });
    });
  }

  displayModal(msg, ...rest) {
    let options = {};
    if (rest.length === 1 && rest[0] && typeof rest[0] === 'object') {
      options = rest[0];
    } else {
      const [button1text, button2text, button3text, button0text] = rest;
      options = { button1text, button2text, button3text, button0text };
    }
    const {
      button1text = null,
      button2text = null,
      button3text = null,
      button0text = "OK",
      afterClose = null
    } = options;
    this.setState({
      showm: true,
      modalmsg: msg,
      button1text,
      button2text,
      button3text,
      button0text,
      afterModalClose: afterClose,
    });
  }
  // Modal functions similar to dtscf

  renderContractor(contractor, tier = 1) {
    return (
      <div key={contractor.id} style={{ marginLeft: `${tier * 20}px` }}>
        <h5>Tier-{tier} Contractor: {contractor.name} (Budget: {contractor.budget}) (Wallet Address: {contractor.walletaddress})</h5>
        <h6>Purchases</h6>
        {contractor.purchases.map((purchase, purIndex) => (
          <div key={purIndex}>
            <p>Description: {purchase.description}</p>
            <p>Amount: {purchase.amount}</p>
            <p>Invoice: {purchase.invoice_blob ? "Uploaded" : "None"}</p> {/* Placeholder; add download if needed */}
          </div>
        ))}
        {contractor.subcontractors && contractor.subcontractors.length > 0 && (
          <div>
            <h6>Subcontractors</h6>
            {contractor.subcontractors.map(sub => this.renderContractor(sub, tier + 1))}
          </div>
        )}
      </div>
    );
  }

  render() {

    if (this.state.redirect) {
      return <Navigate to={this.state.redirect} replace />;
    }

    const { underlyingDSGDList, currentProject, selectedMilestone, approverList } = this.state;
    console.log("currentProject: ", currentProject);

    // Filter logic: Find contractors who have at least one purchase in the selected milestone
    const filteredDisplay = currentProject.contractors.map(con => {
      const relevantPurchases = con.purchases.filter(pur => pur.milestone === selectedMilestone);
      if (relevantPurchases.length > 0) {
        return { ...con, relevantPurchases };
      }
      return null;
    }).filter(con => con !== null);
    
    return (
        <div className="container">
          { 
            (this.state.userReady) ?
            <div>
            <header className="jumbotron col-md-8">
              <h3>
                <strong>
                  {this.state.currentProject.txntype===0?"Create ":
                    (this.state.currentProject.txntype===1?"Update ":
                      (this.state.currentProject.txntype===2?"Delete ":null))
                  }DTSCF Project 
                  { this.state.isMaker? "(Maker)": 
                    (
                //      this.state.isChecker? "(Checker)": 
                      (this.state.isApprover? "(Approver)":null) 
                    )
                  }</strong>
              </h3>
            </header>

            </div>
          : null
          }

          <div className="edit-form list-row">
            <h4></h4>
            <div className="col-md-8">

          <form autoComplete="off">
          <div className="form-group">
            { this.state.recipients.id !== null && 
            <>
              <label htmlFor="description">Organisation</label>
              <input 
                type="text" 
                className="form-control" 
                id="id" 
                value={this.state.recipients.name} 
                disabled="true"
              />
            </>
            }
            { currentProject.id !== 0 && 
            <>
              <label htmlFor="description">Project ID</label>
              <input 
                type="text" 
                className="form-control" 
                id="id" 
                value={currentProject.id} 
                disabled="true"
              />
            </>
            }
            <label htmlFor="description">Project Name</label>
            <input 
              type="text" 
              className="form-control" 
              id="name" 
              maxlength="50"
              value={currentProject.name} 
              onChange={this.onChangeName} 
              disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}
            />
            <label htmlFor="description">Project Description</label>
            <input 
              type="text" 
              className="form-control" 
              id="description" 
              maxlength="255"
              value={currentProject.description} 
              onChange={this.onChangeDescription} 
              disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}
            />
          </div>
          <div className="form-group">
            <label htmlFor="totalBudget">Total Budget</label>
            <input 
              type="number" 
              className="form-control" 
              id="totalBudget" 
              max="1000000000000"
              value={currentProject.totalBudget} 
              onChange={this.onChangeTotalBudget} 
              disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}
            />
          </div>
          { (currentProject && currentProject.smartcontractaddress !== "" && currentProject.smartcontractaddress !== null && currentProject.smartcontractaddress !=='undefined') && 
          <div className="form-group">
            <label htmlFor="smartcontractaddress">Tokenised Payable Address</label>
            <input 
              type="text" 
              className="form-control" 
              id="name" 
              maxlength="50"
              value={currentProject.smartcontractaddress} 
              disabled="true"
            />
          </div>
          }
          <div className="form-group">
            <label htmlFor="name">Underlying Digital Money *</label>
            <select
                  onChange={this.onChangeUnderlying}                         
                  className="form-control"
                  id="underlyingTokenID"
                  required
                  disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}
            >
                  <option value=""> </option>
                  {
                    Array.isArray(underlyingDSGDList) ?
                    underlyingDSGDList.map( (d) => {
                      if (typeof d.id === "number")
                      // https://stackoverflow.com/questions/61128847/react-adding-a-default-option-while-using-map-in-select-tag
                        return <option value={d.id} selected={d.id === (currentProject.campaign ? currentProject.campaign.underlyingTokenID : this.state.currentProject.underlyingTokenID)}>{d.tokenname} ({d.name} - {d.smartcontractaddress})</option>
                      })
                    : null
                  }
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="blockchain">Blockchain *</label>
            <select
                  onChange={this.onChangeBlockchain}                         
                  className="form-control"
                  id="blockchain"
                  disabled="true"
                  >
                  <option >   </option>
                  <option value="80002"  selected={currentProject.campaign ? currentProject.campaign.blockchain === 80002 : this.state.currentProject.blockchain === 80002}>Polygon   Testnet Amoy</option>
                  <option value="11155111" selected={currentProject.campaign ? currentProject.campaign.blockchain === 11155111 : this.state.currentProject.blockchain === 11155111}>Ethereum  Testnet Sepolia</option>
                  <option value="80001"  selected={currentProject.campaign ? currentProject.campaign.blockchain === 80001 : this.state.currentProject.blockchain === 80001} disabled>Polygon   Testnet Mumbai (Deprecated)</option>
                  <option value="43113"      disabled>Avalanche Testnet Fuji    (not in use at the moment)</option>
                  <option value="137"      disabled>Polygon   Mainnet (not in use at the moment)</option>
                  <option value="1"        disabled>Ethereum  Mainnet (not in use at the moment)</option>
                  <option value="43114"      disabled>Avalanche Mainnet (not in use at the moment)</option>
                </select>
          </div>
          <div className="form-group">
            <label htmlFor="startdate">Start Date</label>
            <input
              type="date"
              className="form-control"
              id="startdate"
              value={currentProject.startdate}
              onChange={this.onChangeStartDate}
              disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}
            />
          </div>
          <div className="form-group">
            <label htmlFor="enddate">End Date</label>
            <input
              type="date"
              className="form-control"
              id="enddate"
              value={currentProject.enddate}
              onChange={this.onChangeEndDate}
              disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}
            />
          </div>
          <br />

      <div className="mt-4 card p-3">
        <h5>View Milestone Details</h5>
        <div className="form-group">
          <label htmlFor="milestoneSelect">Select Milestone:</label>
          <select 
            id="milestoneSelect"
            className="form-control" 
            value={selectedMilestone} 
            onChange={this.handleMilestoneChange}
          >
            <option value="">-- Select a Milestone --</option>
            {currentProject.milestones.map((ms, index) => (
              <option key={index} value={ms.name}>{ms.name}</option>
            ))}
          </select>
        </div>

        {selectedMilestone && (
          <div className="mt-3">
            <h6>Contractors & Purchases for: {selectedMilestone}</h6>
            {filteredDisplay.length > 0 ? (
              filteredDisplay.map((con, cIdx) => (
                <div key={cIdx} className="border p-2 mb-2">
                  <strong>Contractor: {con.name}</strong> (Wallet: {con.walletaddress})
                  <ul>
                    {con.relevantPurchases.map((pur, pIdx) => (
                      <li key={pIdx}>
                        Purchase: {pur.description} - Amount: {pur.amount}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <p className="text-muted">No associated contractors or purchases found for this milestone.</p>
            )}
          </div>
        )}
      </div>

          { 
          (currentProject.id !== 0 ? // add new project
          <div className="form-group">
            <label htmlFor="approverComments">Approver Comments</label>
            <input
              type="text"
              maxLength="255"
              className="form-control"
              id="approverComments"
              required
              value={currentProject.approverComments}
              onChange={this.onChangeApproverComments}
              name="approverComments"
              autoComplete="off"
              disabled={this.state.currentUser.id !== currentProject.approver || currentProject.status!==2}
              />
          </div>
          : null
          )
          }

          </form>


              {  //// buttons!


                  this.state.isMaker && currentProject.id === 0 &&  // creating new draft
                        <button 
                        onClick={this.createProject} 
                        type="submit"
                        className="m-3 btn btn-sm btn-primary"
                        >
                          Submit Request
                        </button>
              }

              { 
                  this.state.isMaker && currentProject.status !== null && currentProject.status <= 0 &&  // creating draft or amending draft
                        <>
                            <button
                            type="submit"
                            className="m-3 btn btn-sm btn-primary"
                            onClick={this.submitDtscf}
                            >
                              Submit&nbsp;
                              {
                                (currentProject.txntype===0? " Creation ":
                                (currentProject.txntype===1? " Updation ":
                                (currentProject.txntype===2? " Deletion ":null)))
                              }
                              Request
                            </button> 

                            <button
                              className="m-3 btn btn-sm btn-danger"
                              onClick={this.showModal_dropRequest}
                            >
                              Drop Request
                            </button>

                        </>
              }
              {
/*
                this.state.isChecker && currentProject.status === 1 && 
                    <button
                      type="submit"
                      className="m-3 btn btn-sm btn-primary"
                      onClick={this.acceptDtscf}
                    >
                      Endorse&nbsp;
                      {
                        (currentProject.txntype===0? " Creation ":
                        (currentProject.txntype===1? " Updation ":
                        (currentProject.txntype===2? " Deletion ":null)))
                      }
                      Request
                    </button> 
*/
              }
              {
                    this.state.isApprover && currentProject.status === 2 &&
                    <button
                    type="submit"
                    className="m-3 btn btn-sm btn-primary"
                    onClick={currentProject.txntype===2? this.deleteDraft: this.approveDtscf}
                    >
                      Approve & Deploy
                      {
                        (currentProject.txntype===0? " Creation ":
                        (currentProject.txntype===1? " Updation ":
                        (currentProject.txntype===2? " Deletion ":null)))
                      }
                      Request

                    </button> 
                
              }
&nbsp;
              {
                currentProject.id !== 0 && (
//                  this.state.isChecker || 
                  this.state.isApprover) && 
                currentProject.status <= 2 &&  currentProject.status >= 1 && // status < 2 still in draft and not deployed yet
                    <button
                    type="submit"
                    className="m-3 btn btn-sm btn-danger"
                    onClick={this.rejectDtscf}
                    >
                      Reject
                    </button> 
              }
&nbsp;
              { 
                this.state.isMaker?
                (this.state.datachanged ? 
                  <button className="m-3 btn btn-sm btn-secondary" onClick={this.showModal_Leave}>
                    Cancel
                  </button>
                  : 
                  <Link to="/dtscf">
                  <button className="m-3 btn btn-sm btn-secondary">
                    Cancel
                  </button>
                  </Link>
                )
              : 
                <Link to="/dtscf">
                <button className="m-3 btn btn-sm btn-secondary">
                  Cancel
                </button>
                </Link>
              }  

              {this.state.isLoading ? <LoadingSpinner /> : null}

              <Modal showm={this.state.showm} handleProceed1={event =>  window.location.href='/dtscf'} handleProceed2={this.deleteDtscf} handleProceed3={this.dropRequest} button1text={this.state.button1text} button2text={this.state.button2text} button3text={this.state.button3text} button0text={this.state.button0text} handleCancel={this.hideModal}>
                {this.state.modalmsg}
              </Modal>
              {this.state.logs.length > 0 && (
                <div className="progress-logs">
                  <h5>Processing Logs:</h5>
                  <ul>
                    {this.state.logs.map((log, index) => (
                      <li key={index}>{log}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
    );
  }
}

export default withRouter(DTSCFProjectCreation);
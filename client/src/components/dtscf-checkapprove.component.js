// dtscf-project-creation.component.js
import React, { Component } from "react";
import CampaignDataService from "../services/campaign.service";
import DtscfDataService from "../services/dtscf.service.js";
import RecipientDataService from "../services/recipient.service";
import UserOpsRoleDataService from "../services/user_opsrole.service";
import { withRouter } from '../common/with-router.js';
import AuthService from "../services/auth.service.js";
import { Link, Navigate } from "react-router-dom";
import validator from 'validator';
import Modal from '../Modal.js';
import LoadingSpinner from "../LoadingSpinner.js";
import "../LoadingSpinner.css";
import moment from 'moment';
//import { recipients } from "../../../server/app/models/index.js";

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
    this.removePurchase = this.removePurchase.bind(this);
    this.handleInvoiceUpload = this.handleInvoiceUpload.bind(this);
    //this.onChangeChecker = this.onChangeChecker.bind(this);
    this.onChangeApprover = this.onChangeApprover.bind(this);
    //this.onChangeCheckerComments = this.onChangeCheckerComments.bind(this);
    this.onChangeApproverComments = this.onChangeApproverComments.bind(this);

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
        name: "",
        description: "",
        totalBudget: 0,
        anchor_id: 0,
        underlyingTokenID: 0,
        underlyingDSGDsmartcontractaddress: "",
        smartcontractaddress: "",
        blockchain: 0,
        campaign: null,
        campaign_id: 0,
        startdate: getToday(),
        enddate: getToday(),
        milestones: [{name: "", budget: 0, startdate: "", enddate: ""}],
        contractors: [{name: "", budget: 0, walletaddress: "",purchases: [{description: ""}], amount: 0, invoices: []}], // invoices as File objects
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
      this.getProject(user, this.props.router.params.id);
      this.retrieveAllMakersCheckersApprovers();
    }
  }

  async getProject(user, id) {
    console.log("+++ id:", id);
    this.setState({ isLoading: true });
    if (id !== undefined && id != 0) {
      console.log("Calling getAllDraftsByDtscfId... ");

      await DtscfDataService.getAllDraftsByDtscfId(id)
      .then(response => {
        if (response && response.data) {
          console.log("Response from getAllDraftsByDtscfId(id):", response.data);

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
//              checker: data.checker,
              approver: data.approver,
//              checkerComments: data.checkerComments,
              approverComments: data.approverComments,
              milestones: (data.dtscf_milestones_drafts || []).map(ms => ({
                ...ms,
                description: ms.description || "",
                budget: ms.budget || 0,
                startdate: moment(ms.startdate).format('YYYY-MM-DD'),
                enddate: moment(ms.enddate).format('YYYY-MM-DD'),
              })),
              contractors: (data.dtscf_contractors_drafts || []).map(con => ({
                ...con,
                name: con.name || "",
                budget: con.budget || 0,
                walletaddress: con.walletaddress || "",
                purchases: (con.dtscf_purchases_drafts || []).map(pur => ({
                  ...pur,
                  description: pur.description || "",
                  amount: pur.amount || 0,
                  invoices: [] // Initialize as empty array for new uploads
                })),
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
    milestones[index][field] = field === 'budget' ? parseFloat(value) : value;
    this.setState(prevState => ({
      currentProject: { ...prevState.currentProject, milestones },
      datachanged: true
    }));
  }

  removeMilestone(index) {
    const milestones = [...this.state.currentProject.milestones];
    milestones.splice(index, 1);
    this.setState(prevState => ({
      currentProject: { ...prevState.currentProject, milestones },
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
    contractors[conIndex].purchases.push({ description: "", invoices: [] });
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
/*
  onChangeChecker(e) {
    const checker = e.target.value;
    
    //this.setState({
    //  datachanged: true
    //});
    
    this.setState(prevState => ({
      currentProject: {
        ...prevState.currentProject,
        checker: checker
      }
    }));
  }

  onChangeCheckerComments(e) {
    const checkerComments = e.target.value;

    this.setState({
      datachanged: true
    });
    this.setState(function(prevState) {
      return {
        currentProject: {
          ...prevState.currentProject,
          checkerComments: checkerComments
        }
      };
    });
  }
*/
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

  async validateForm() {    
    var err = "";

    if (!(typeof this.state.currentProject.name ==='string' || this.state.currentProject.name instanceof String) || (this.state.currentProject.name.trim() === "" || this.state.currentProject.name === null || this.state.currentProject.name === undefined)) {
      err += "- Name cannot be empty\n";
    } 

    if (!(typeof this.state.currentProject.contractors[0].name ==='string' || this.state.currentProject.contractors[0].name instanceof String) || (this.state.currentProject.contractors[0].name.trim() === "" || this.state.currentProject.contractors[0].name === null || this.state.currentProject.contractors[0].name === undefined)) {
      err += "- Contractor's Name cannot be empty\n"; 
    } 

    if (!(typeof this.state.currentProject.contractors[0].walletaddress ==='string' || this.state.currentProject.contractors[0].walletaddress instanceof String) || (this.state.currentProject.contractors[0].walletaddress.trim() === "" || this.state.currentProject.contractors[0].walletaddress === null || this.state.currentProject.contractors[0].walletaddress === undefined)) {
      err += "- Contractor's Wallet Address cannot be empty\n"; 
    } 

      // dont need t check description, it can be empty
    if (! validator.isDate(this.state.currentProject.startdate)) err += "- Start Date is invalid\n";
    if (! validator.isDate(this.state.currentProject.enddate)) err += "- End Date is invalid\n";
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
  
  async createProject() {
    this.setState({ isLoading: true });

    if (await this.validateForm() === true) {   

      const formData = new FormData();
      formData.append('name', this.state.currentProject.name);
      formData.append('description', this.state.currentProject.description);
      formData.append('totalBudget', this.state.currentProject.totalBudget);
      formData.append('underlyingDSGDsmartcontractaddress', this.state.currentProject.underlyingDSGDsmartcontractaddress);
      formData.append('underlyingTokenID', this.state.currentProject.underlyingTokenID);
      formData.append('campaign_id', this.state.currentProject.campaign_id);
      formData.append('blockchain', this.state.currentProject.blockchain);
      formData.append('startdate', this.state.currentProject.startdate);
      formData.append('enddate', this.state.currentProject.enddate);
      formData.append('txntype', 0); // create
      formData.append('anchor_id', this.state.currentUser.organisation_id);
      formData.append('maker', this.state.currentUser.id);
//      formData.append('checker', this.state.currentProject.checker);
      formData.append('approver', this.state.currentProject.approver);
      formData.append('actionby', this.state.currentUser.username);
      formData.append('approveddtscfid', -1);

      formData.append('milestones', JSON.stringify(this.state.currentProject.milestones));
      formData.append('contractors', JSON.stringify(this.state.currentProject.contractors.map(c => ({...c, purchases: c.purchases.map(p => ({...p, invoices: []}))})))); // Send metadata

      this.state.currentProject.contractors.forEach((con, conIndex) => {
        con.purchases.forEach((pur, purIndex) => {
          if (pur.invoices?.length > 0) {
            pur.invoices.forEach((inv, invIndex) => {
              formData.append(`contractor_${conIndex}_purchase_${purIndex}_invoice_${invIndex}`, inv);
            });
          }
        });
      });

      console.log("Form Datacon to be sent:");
      for (const [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
      }

      await DtscfDataService.draftCreate(formData)
        .then(response => {
          //this.setState({ message: "Project created successfully!", isLoading: false });
          this.displayModal("Dtscf project creation request submitted for review.", "OK", null, null, null);
        })
        .catch(e => {
          console.log(e);
          this.setState({ isLoading: false });
        });
    }
    this.setState({ isLoading: false });
  }

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
    formData.append('contractors', JSON.stringify(this.state.currentProject.contractors.map(c => ({...c, purchases: c.purchases.map(p => ({...p, invoices: []}))})))); // Send metadata

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

  async submitDtscf() {
    this.setState({
      isLoading: true,
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

      const formData = new FormData();
      formData.append('name', this.state.currentProject.name);
      formData.append('description', this.state.currentProject.description);
      formData.append('totalBudget', this.state.currentProject.totalBudget);
      formData.append('underlyingDSGDsmartcontractaddress', this.state.currentProject.underlyingDSGDsmartcontractaddress);
      formData.append('underlyingTokenID', this.state.currentProject.underlyingTokenID);
      formData.append('campaign_id', this.state.currentProject.campaign_id);
      formData.append('blockchain', this.state.currentProject.blockchain);
      formData.append('startdate', this.state.currentProject.startdate);
      formData.append('enddate', this.state.currentProject.enddate);
      formData.append('txntype', 0); // create
      formData.append('anchor_id', this.state.currentUser.organisation_id);
      formData.append('maker', this.state.currentUser.id);
//      formData.append('checker', this.state.currentProject.checker);
      formData.append('approver', this.state.currentProject.approver);
      formData.append('actionby', this.state.currentUser.username);
      formData.append('approveddtscfid', -1);

      formData.append('milestones', JSON.stringify(this.state.currentProject.milestones));
      formData.append('contractors', JSON.stringify(this.state.currentProject.contractors.map(c => ({...c, purchases: c.purchases.map(p => ({...p, invoices: []}))})))); // Send metadata

      const contractors = this.state.currentProject.contractors || [];
      contractors.forEach((con, conIndex) => {
        const purchases = con.purchases || [];
        purchases.forEach((pur, purIndex) => {
          if (pur.invoices?.length > 0) {
            formData.append(`contractor_${conIndex}_purchase_${purIndex}_invoice`, pur.invoices[0]);
          }
        });
      });

      console.log("Form Datacon to be sent:");
      for (const [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
      }
/*
      await DtscfDataService.submitDraftById(this.state.currentProject.id, formData)
        .then(response => {
          this.hide_loading();
  
          console.log("Response: ", response);
          console.log("IsLoad=false");
          this.hide_loading();
    
          this.setState({  
            datachanged: false,
          });
//          this.displayModal("Dtscf submitted. Routing to checker.", "OK", null, null, null);
          this.displayModal("Dtscf submitted. Routing to approver.", "OK", null, null, null);
        })
        .catch(e => {
          this.hide_loading();
  
          console.log(e);
          console.log(e.message);
          this.displayModal("Dtscf submit failed.", null, null, null, "OK");
  
          try {
            console.log(e.response.data.message);
            // Need to check draft and approved dtscf names
            if (e.response.data.message.includes("SequelizeUniqueConstraintError")) {
              this.displayModal("The Dtscf submit failed. The new dtscf name is already used, please use another name.", null, null, null, "OK");
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
  */
      console.log('Data being sent:', formData); // Add this to debug in browser console

      DtscfDataService.submitDraftById(this.state.currentProject.id, formData, (log) => {
        this.setState(prevState => ({
          modalmsg: prevState.modalmsg + log + "\n"
        }));
      })
      .then(response => {
        this.setState(prevState => ({
          modalmsg: prevState.modalmsg + response.message + "\n",
          button0text: "Close",
          isLoading: false,
          afterModalClose: () => this.props.router.navigate("/dtscf")
        }));
      })
      .catch(e => {
        const errMsg = (e.response && e.response.data && e.response.data.message) || e.message || e.toString();
        this.setState(prevState => ({
          modalmsg: prevState.modalmsg + "Error: " + errMsg + "\n",
          button0text: "Close",
          isLoading: false,
        }));
      });
    }
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
  
    //    if (await this.validateForm()) { 
    //      console.log("Form Validation passed");
    
    console.log("IsLoad=true");
    this.show_loading();

    console.log("Approving Dtscf ID:", this.state.currentProject.id);
    console.log("Approving Dtscf:", this.state.currentProject);

    await DtscfDataService.approveDraftById(
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
      this.displayModal("The Tokenised Payable is created "+ (typeof(response.data.smartcontractaddress)!=="undefined" && response.data.smartcontractaddress!==null && response.data.smartcontractaddress!==""? " with address "+response.data.smartcontractaddress+". \n\nThe Tokenised Payables are sent to the Anchor and Contractor(s).": "."), "OK", null, null, null);
    })
    .catch(e => {
      this.hide_loading();

      console.log("-->response:",e);
      console.log(e.message);
      //this.displayModal("Dtscf approval failed. "+e.message+".", null, null, "OK");
      this.displayModal(e.message+". "+(typeof(e.response.data.message)!=='undefined' && e.response.data.message!==null ? e.response.data.message:""), null, null, null, "OK");

      try {
        console.log(e.response.data.message);
        if (e.response.data.message.includes("SequelizeUniqueConstraintError")) {
          this.displayModal("The dtscf update failed. The new dtscf name is already used, please use another name.", null, null, null, "OK");
        }
      } catch(e) {
        this.hide_loading();

        console.log("Error: ",e);
        if (e.response.data && e.response.data.message && typeof (e.response.data.message) !== "undefined" && e.response.data.message !== null && e.response.data.message !== "" ) {
          console.log("Response error:", e.response.data.message);
          this.displayModal("Error: "+e.response.data.message+". Please contact tech support.", null, null, null, "OK");
        } else
          this.displayModal("Error: "+e.message+". Please contact tech support.", null, null, null, "OK");
      } 
    });
//    }
    this.hide_loading();
  } // approveDtscf()

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
/*
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
*/
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

  displayModal(msg, options = {}) {
    const { button0text = "OK", afterClose = null } = options;
    this.setState({
      showm: true,
      modalmsg: msg,
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

    const { underlyingDSGDList, currentProject, isNewProject, isLoading, 
//      checkerList, 
      approverList } = this.state;
    console.log("currentProject: ", currentProject);

    
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
          <label htmlFor="milestone">Milestones</label>
          <table style={{border : '1px solid blue', width: '100%'}}>
          <tr>
            <td style={{border : '1px solid blue', width: '100%'}}>
              {currentProject.milestones.map((milestone, index) => (
                <div key={index}>
                  <label htmlFor="milestone.name">Milestone #{index+1} Name</label>
                  <div>
                    <input 
                      type="text" 
                      className="form-control" 
                      maxlength="50" 
                      value={milestone.name} 
                      onChange={(e) => this.onChangeMilestone(index, 'name', e.target.value)} 
                      placeholder="Milestone Name" 
                      disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}
                    />
                  </div>
                  <label htmlFor="milestone.budget">Budget</label>
                  <div>
                    <input 
                      type="number" 
                      className="form-control"
                      max="1000000000000" 
                      value={milestone.budget} 
                      onChange={(e) => this.onChangeMilestone(index, 'budget', e.target.value)} 
                      placeholder="Milestone Budget" 
                      disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}
                    />
                  </div>
                  <label htmlFor="milestone.startdate">Start Date</label>
                  <div>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={milestone.startdate} 
                      onChange={(e) => this.onChangeMilestone(index, 'startdate', e.target.value)} 
                      placeholder="Start Date" 
                      disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}
                    />
                  </div>
                  <label htmlFor="milestone.endDate">End Date</label>
                  <div>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={milestone.enddate} 
                      onChange={(e) => this.onChangeMilestone(index, 'enddate', e.target.value)} 
                      placeholder="End Date" 
                      disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}
                    />
                  </div>

                  <div>
                    { (currentProject.status<=0 || this.state.currentProject.id===0) &&
                    <button type="button" className="m-3 btn btn-sm btn-danger" onClick={() => this.removeMilestone(index)} disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}>Remove</button>
                    }
                    <br/>
                  </div>
                </div>
              ))}
                    { (currentProject.status<=0 || this.state.currentProject.id===0) &&
                <button type="button" className="m-3 btn btn-sm btn-primary" onClick={this.addMilestone} disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}>Add Milestone</button>
              }
            </td>
          </tr>
          </table>
          
          <br />
          <label htmlFor="contractors">Contractors</label>
          <table style={{border : '1px solid blue', width: '100%'}}>
          <tr>
            <td style={{border : '1px solid blue', width: '100%'}}>
              {currentProject.contractors && currentProject.contractors.map((contractor, conIndex) => (
                <div key={conIndex}>
                  <label htmlFor="contractor.name">Contractor #{conIndex+1} Name</label>
                  <div>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={contractor.name} 
                      onChange={(e) => this.onChangeContractor(conIndex, 'name', e.target.value)} 
                      placeholder="Name" 
                      disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}
                    />
                  </div>
                  <label htmlFor="contractor.budget">Budget</label>
                  <div>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={contractor.budget} 
                      onChange={(e) => this.onChangeContractor(conIndex, 'budget', e.target.value)} 
                      placeholder="Budget" 
                      disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}
                    />
                  </div>
                  <label htmlFor="contractor.name">Contractor's Wallet Address</label>
                  <div>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={contractor.walletaddress} 
                      onChange={(e) => this.onChangeContractor(conIndex, 'walletaddress', e.target.value)} 
                      placeholder="Wallet Address" 
                      disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}
                    />
                  </div>

                  <br />
                  <label htmlFor="contractor.name">Purchases</label>
                  <table style={{border : '2px solid lightblue', width: '100%'}}>
                  <tr>
                    <td style={{border : '2px solid lightblue', width: '100%'}}>
                      {contractor.purchases && contractor.purchases.map((purchase, purIndex) => (
                      <div key={purIndex}>
                        <label htmlFor="contractor.name">Purchase #{purIndex+1}</label>
                        <div>
                          <input 
                            type="text" 
                            className="form-control" 
                            value={purchase.description} 
                            onChange={(e) => this.onChangePurchase(conIndex, purIndex, e.target.value)} 
                            placeholder="Purchase Description"
                            disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}
                          />
                        </div>
                        <label htmlFor="contractor.name">Invoice(s) Amount</label>
                        <div>
                          <input 
                            type="text" 
                            className="form-control" 
                            value={purchase.amount} 
                            onChange={(e) => this.onChangePurchaseAmount(conIndex, purIndex, e.target.value)} 
                            placeholder="Invoice Amount" 
                            disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}
                          />
                        </div>
                        <label htmlFor="contractor.name">Invoice(s)</label>
                        {purchase.invoices && purchase.invoices.map((inv, invIndex) => (
                          <div key={invIndex}>{inv.name}</div>
                        ))}
                        <div>
                          <input 
                            type="file" 
                            onChange={(e) => this.handleInvoiceUpload(conIndex, purIndex, e)} 
                            disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}
                          /> <i style={{fontSize: 'small'}}>combine multiple invoices into one zip file if needed</i>
                        </div>
                        {currentProject.status<=0 || this.state.currentProject.id===0 &&
                        <button type="button" className="m-3 btn btn-sm btn-danger" onClick={() => this.removePurchase(conIndex, purIndex)} disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}>Remove</button>
                        }
                        <br/>
                      </div>
                      ))}
                      {currentProject.status<=0 || this.state.currentProject.id===0 &&
                      <button type="button" className="m-3 btn btn-sm btn-primary" onClick={() => this.addPurchase(conIndex)} disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}>Add Purchase</button>
                      }
                    </td>
                  </tr>
                  </table>
                  {currentProject.status<=0 || this.state.currentProject.id===0 &&
                  <button type="button" className="m-3 btn btn-sm btn-danger" onClick={() => this.removeContractor(conIndex)} disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}>Remove Contractor</button>
                  }
                  <br/>
                </div>
              ))}
              {currentProject.status<=0 || this.state.currentProject.id===0 &&
              <button type="button" className="m-3 btn btn-sm btn-primary" onClick={this.addContractor} disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}>Add Contractor</button>
              }
            </td>
          </tr>
          </table>
          <br />
{ 
/*
          <div className="form-group">
            <label htmlFor="checker">Checker *</label>
            <select
                  value={currentProject.checker}
                  onChange={this.onChangeChecker}                         
                  className="form-control"
                  id="checker"
                  disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}
                  >
                  <option></option>
                  {
                    Array.isArray(checkerList) ?
                      checkerList.map( (d) => {
                        return <option value={d.id}>{d.username}</option>
                      })
                    : null
                  }
                </select>
          </div>
          {
          (currentProject.id !== 0 ? // add new project
          <div className="form-group">
            <label htmlFor="checkerComments">Checker Comments</label>
            <input
              type="text"
              maxLength="255"
              className="form-control"
              id="checkerComments"
              required
              value={currentProject.checkerComments}
              onChange={this.onChangeCheckerComments}
              name="checkerComments"
              autoComplete="off"
              disabled={this.state.currentUser.id !== currentProject.checker || currentProject.status!==1}
              />
          </div>
          :
          null
          )
          }
*/
}
          <div className="form-group">
            <label htmlFor="approver">Approver *</label>
            <select
                value={currentProject.approver}
                onChange={this.onChangeApprover}                         
                className="form-control"
                id="approver"
                disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status<=0) && this.state.currentProject.id!==0}
                >
                <option></option>
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

              <p>{this.state.message}</p>
            </div>
          </div>
        </div>
    );
  }
}

export default withRouter(DTSCFProjectCreation);
/* global BigInt */
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
// Requires js-sha3 library: npm install js-sha3
import { keccak256 } from 'js-sha3';
import Web3 from 'web3';
import TPAbi from '../abis/ERC1155Tokenised_Payable.abi.json';


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
    this.onChangeContractorOrg = this.onChangeContractorOrg.bind(this);
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

    this.createProject = this.createProject.bind(this);
    this.updateProject = this.updateProject.bind(this);
    this.submitDtscf = this.submitDtscf.bind(this);
    this.acceptDtscf = this.acceptDtscf.bind(this);
    this.approveDtscf = this.approveDtscf.bind(this);
    this.rejectDtscf = this.rejectDtscf.bind(this);
    this.deleteDtscf = this.deleteDtscf.bind(this);
    this.dropRequest = this.dropRequest.bind(this);

    this.addSubContractor = this.addSubContractor.bind(this);
    this.onChangeSubContractor = this.onChangeSubContractor.bind(this);
    this.removeSubContractor = this.removeSubContractor.bind(this);
    this.addSubContractorPurchase = this.addSubContractorPurchase.bind(this);
    this.onChangeSubContractorPurchase = this.onChangeSubContractorPurchase.bind(this);
    this.removeSubContractorPurchase = this.removeSubContractorPurchase.bind(this);
    this.handleSubContractorInvoiceUpload = this.handleSubContractorInvoiceUpload.bind(this);
    this.addSubSubContractor = this.addSubSubContractor.bind(this);
    this.onChangeSubSubContractor = this.onChangeSubSubContractor.bind(this);
    this.removeSubSubContractor = this.removeSubSubContractor.bind(this);
    this.addSubSubContractorPurchase = this.addSubSubContractorPurchase.bind(this);
    this.onChangeSubSubContractorPurchase = this.onChangeSubSubContractorPurchase.bind(this);
    this.removeSubSubContractorPurchase = this.removeSubSubContractorPurchase.bind(this);
    this.saveContractorChanges = this.saveContractorChanges.bind(this);
    this.getMyContractorIndex = this.getMyContractorIndex.bind(this);
    this.getMyContractorBranches = this.getMyContractorBranches.bind(this);
    this.submitContractorAmendment = this.submitContractorAmendment.bind(this);
    this.submitAnchorAmendment = this.submitAnchorAmendment.bind(this);
    this.preFlightContractorMetaMask = this.preFlightContractorMetaMask.bind(this);
    this.approveContractorAmendment = this.approveContractorAmendment.bind(this);
    this.rejectContractorAmendment = this.rejectContractorAmendment.bind(this);

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
      isAnchor: false,
      isContractor: false,
      contractorOrgList: [],

      orgApproverList: [],
      selectedOrgApprover: "",
      pendingAmendmentDrafts: [],
      pendingAmendmentDraftsLoaded: false,
      myPendingDraftId: null,
      rejectedDraft: null,
      rejectedDraftComments: '',
      inFlightAmendment: null,

      isNewProject: true,
      datachanged: false,
      message: "",
      isLoading: false,
      logs: [], // New state for streaming logs
      explorerUrl: "",
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

      let iscontractor = user.roles.find((el) =>
        el.toUpperCase() === "ROLE_CONTRACTOR"
      );
      console.log("isContractor:", (iscontractor === undefined ? false : true));
      this.setState({ isContractor: (iscontractor === undefined ? false : true) });
      let isanchor = user.roles.find((el) =>
        el.toUpperCase() === "ROLE_ANCHOR"
      );
      console.log("isAnchor:", (isanchor === undefined ? false : true));
      this.setState({ isAnchor: (isanchor === undefined ? false : true) });

      this.getAllUnderlyingAssets();
      this.getContractorOrganisations();
      const projectId = typeof this.props.router.params.id === "string" ? parseInt(this.props.router.params.id) : this.props.router.params.id;
      this.getProject(user, projectId);
      this.retrieveAllMakersCheckersApprovers();

      // Load approvers from same org (for contractor's submit-for-approval dropdown)
      if (user.organisation_id) {
        DtscfDataService.getApproversByOrg(user.organisation_id)
          .then(r => this.setState({ orgApproverList: r.data || [] }))
          .catch(e => console.log('getApproversByOrg error:', e));
      }
      // Load pending contractor amendment drafts where this user is the designated approver
      if (isapprover && projectId) {
        DtscfDataService.getContractorAmendmentDrafts(projectId, user.id)
          .then(r => {
            console.log('[AmendmentDrafts] server response:', JSON.stringify(r.data, null, 2));
            this.setState({ pendingAmendmentDrafts: r.data || [], pendingAmendmentDraftsLoaded: true });
          })
          .catch(e => {
            console.log('getContractorAmendmentDrafts error:', e);
            this.setState({ pendingAmendmentDraftsLoaded: true });
          });
      } else {
        this.setState({ pendingAmendmentDraftsLoaded: true });
      }

      // For all users: check if there is any in-flight amendment so read-only mode can be applied correctly
      if (projectId) {
        DtscfDataService.getContractorAmendmentStatus(projectId)
          .then(r => {
            if (r.data) {
              console.log('[AmendmentStatus] in-flight draft:', r.data.id, 'status:', r.data.status);
              this.setState({ inFlightAmendment: r.data });
            }
          })
          .catch(e => console.log('getContractorAmendmentStatus error:', e));
      }

      // For makers: load any rejected contractor amendment draft so the form can be pre-populated
      if (ismaker && projectId) {
        DtscfDataService.getMyRejectedContractorAmendmentDraft(projectId, user.id)
          .then(r => {
            if (r.data) {
              console.log('[RejectedDraft] found:', r.data.id, 'comments:', r.data.approverComments);
              this.setState({ rejectedDraft: r.data }, () => {
                // Apply immediately if project is already loaded, otherwise getProject callback handles it
                if (this.state.currentProject.id !== 0) {
                  this.applyRejectedDraftToContractors(r.data);
                }
              });
            }
          })
          .catch(e => console.log('getMyRejectedContractorAmendmentDraft error:', e));
      }

    }
  }

  componentWillUnmount() {
  }

  async getProject(user, id) {
    console.log("+++ id:'"+id+"' +++");

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
//              checker: data.checker,
              approver: data.approver,
//              checkerComments: data.checkerComments,
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
                subcontractors: (con.subcontractors || []).map(sub => {
                  const subSelf = sub.dataValues ? sub.dataValues : sub;
                  return {
                    ...subSelf,
                    purchases: (subSelf.dtscf_purchases || subSelf.purchases || []).map(pur => {
                      const matchedMs = (data.dtscf_milestones || []).find(m => m.id === pur.dtscf_milestone_id);
                      return {
                        ...pur,
                        description: pur.description || '',
                        amount: pur.amount || 0,
                        milestone: matchedMs ? matchedMs.name : (pur.milestone || ''),
                        invoices: []
                      };
                    })
                  };
                })
              }))
            },
            isLoading: false
          }, () => {
            if (this.state.isMaker && this.state.rejectedDraft) {
              this.applyRejectedDraftToContractors(this.state.rejectedDraft);
            }
            this.reconcileContractorOrgs();
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
          console.log("Invalid response from getAllByDtscfId(id)!");
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

  getContractorOrganisations() {
    DtscfDataService.getContractorOrganisations()
      .then(response => {
        this.setState({ contractorOrgList: response.data || [] }, () => {
          this.reconcileContractorOrgs();
        });
      })
      .catch(e => console.log('getContractorOrganisations error:', e));
  }

  reconcileContractorOrgs() {
    const { contractorOrgList, currentProject } = this.state;
    if (!contractorOrgList || !contractorOrgList.length || !currentProject || !currentProject.contractors || !currentProject.contractors.length) return;

    let changed = false;
    const updated = currentProject.contractors.map(con => {
      if (con.organisation_id) {
        const asInt = parseInt(con.organisation_id, 10);
        if (asInt !== con.organisation_id) { changed = true; return { ...con, organisation_id: asInt }; }
        return con;
      }
      if (con.name) {
        const org = contractorOrgList.find(o => o.name.toLowerCase() === con.name.toLowerCase());
        if (org) {
          changed = true;
          return { ...con, organisation_id: org.id, walletaddress: con.walletaddress || org.walletaddress || '' };
        }
      }
      if (con.walletaddress) {
        const org = contractorOrgList.find(o => o.walletaddress && o.walletaddress.toLowerCase() === con.walletaddress.toLowerCase());
        if (org) {
          changed = true;
          return { ...con, organisation_id: org.id, name: con.name || org.name };
        }
      }
      return con;
    });

    if (changed) {
      this.setState(prevState => ({
        currentProject: { ...prevState.currentProject, contractors: updated }
      }));
      console.log("reconcileContractorOrgs: updated contractors with organisation_id");
    }
  }

  applyRejectedDraftToContractors(draft) {
    this.setState(prevState => {
      if (!prevState.currentProject || prevState.currentProject.id === 0) return {};
      const mapPur = (pur) => {
        const ms = (draft.draftMilestones || []).find(m => m.id === pur.dtscf_milestone_id);
        return {
          description: pur.description || '',
          amount: pur.amount || 0,
          milestone: ms ? ms.name : '',
          invoices: [],
          _isNew: pur.is_new === true,
          id: pur.id
        };
      };
      const updatedContractors = (prevState.currentProject.contractors || []).map(liveCon => {
        const draftCon = (draft.contractors || []).find(dc =>
          (dc.organisation_id && dc.organisation_id === liveCon.organisation_id) ||
          (dc.walletaddress && liveCon.walletaddress &&
            dc.walletaddress.toLowerCase() === liveCon.walletaddress.toLowerCase())
        );
        if (!draftCon) return liveCon;
        return {
          ...liveCon,
          purchases: (draftCon.dtscf_purchases_drafts || []).map(mapPur),
          subcontractors: (draftCon.subcontractors || []).map(sub => ({
            ...sub,
            purchases: (sub.dtscf_purchases_drafts || []).map(mapPur),
            subcontractors: [],
            _isNew: sub.is_new === true
          }))
        };
      });
      return {
        currentProject: { ...prevState.currentProject, contractors: updatedContractors },
        rejectedDraftComments: draft.approverComments || ''
      };
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
        contractors: [...prevState.currentProject.contractors, { name: "", budget: 0, walletaddress: "", purchases: [], invoices: [], _isNew: true }]
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

  onChangeContractorOrg(index, orgId) {
    const contractors = [...this.state.currentProject.contractors];
    const org = this.state.contractorOrgList.find(o => o.id === parseInt(orgId));
    if (org) {
      contractors[index].organisation_id = org.id;
      contractors[index].name = org.name;
      contractors[index].walletaddress = org.walletaddress || '';
    } else {
      contractors[index].organisation_id = null;
      contractors[index].name = '';
      contractors[index].walletaddress = '';
    }
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

  addPurchase(conIndex, defaultMilestone = '') {
    this.setState(prevState => ({
      currentProject: {
        ...prevState.currentProject,
        contractors: prevState.currentProject.contractors.map((con, ci) => {
          if (ci !== conIndex) return con;
          return {
            ...con,
            purchases: [...(con.purchases || []), { description: '', dtscf_contractor_id: con.id, amount: 0, milestone: defaultMilestone, invoices: [], _isNew: true }]
          };
        })
      },
      datachanged: true
    }));
  }

  onChangePurchase(conIndex, purIndex, value) {
    this.setState(prevState => ({
      currentProject: {
        ...prevState.currentProject,
        contractors: prevState.currentProject.contractors.map((con, ci) => {
          if (ci !== conIndex) return con;
          return {
            ...con,
            purchases: con.purchases.map((p, pi) => pi !== purIndex ? p : { ...p, description: value })
          };
        })
      },
      datachanged: true
    }));
  }

  onChangePurchaseAmount(conIndex, purIndex, value) {
    this.setState(prevState => ({
      currentProject: {
        ...prevState.currentProject,
        contractors: prevState.currentProject.contractors.map((con, ci) => {
          if (ci !== conIndex) return con;
          return {
            ...con,
            purchases: con.purchases.map((p, pi) => pi !== purIndex ? p : { ...p, amount: parseFloat(value) })
          };
        })
      },
      datachanged: true
    }));
  }

  onChangePurchaseMilestone(conIndex, purIndex, value) {
    this.setState(prevState => ({
      currentProject: {
        ...prevState.currentProject,
        contractors: prevState.currentProject.contractors.map((con, ci) => {
          if (ci !== conIndex) return con;
          return {
            ...con,
            purchases: con.purchases.map((p, pi) => pi !== purIndex ? p : { ...p, milestone: value })
          };
        })
      },
      datachanged: true
    }));
  }

  removePurchase(conIndex, purIndex) {
    this.setState(prevState => ({
      currentProject: {
        ...prevState.currentProject,
        contractors: prevState.currentProject.contractors.map((con, ci) => {
          if (ci !== conIndex) return con;
          return { ...con, purchases: con.purchases.filter((_, pi) => pi !== purIndex) };
        })
      },
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
  // Returns the index of the contractor entry that matches the current user
  // Match by wallet address (primary) or organisation_id (secondary)
  getMyContractorIndex() {
    const { currentProject, currentUser } = this.state;
    if (!currentProject || !currentProject.contractors || !currentUser) return -1;
    // Primary: organisation_id match
    if (currentUser.organisation_id) {
      const idx = currentProject.contractors.findIndex(
        con => con.organisation_id && parseInt(con.organisation_id) === parseInt(currentUser.organisation_id)
      );
      if (idx >= 0) return idx;
    }
    // Fallback: wallet address match
    if (currentUser.walletaddress) {
      return currentProject.contractors.findIndex(
        con => con.walletaddress && con.walletaddress.toLowerCase() === currentUser.walletaddress.toLowerCase()
      );
    }
    return -1;
  }

  // Returns ALL branches (top-level and sub-contractor) where the current user appears.
  // Searches the entire contractor tree recursively — no depth limit.
  // Each branch carries a path array (e.g. [2] = top-level index 2, [0,1] = sub at con[0].sub[1])
  // and parentChain array for display context.
  getMyContractorBranches() {
    const { currentProject, currentUser } = this.state;
    if (!currentProject || !currentProject.contractors || !currentUser) return [];

    const isMe = (node) => {
      if (currentUser.organisation_id && node.organisation_id &&
          parseInt(node.organisation_id) === parseInt(currentUser.organisation_id)) return true;
      if (currentUser.walletaddress && node.walletaddress &&
          node.walletaddress.toLowerCase() === currentUser.walletaddress.toLowerCase()) return true;
      return false;
    };

    const getDeployedMilestone = (node) => {
      const dp = (node.purchases || []).find(p => !p._isNew && p.milestone);
      return dp ? dp.milestone : null;
    };

    const branches = [];

    const search = (node, path, parentChain) => {
      if (isMe(node)) {
        const parentEntry = parentChain.length > 0 ? parentChain[parentChain.length - 1] : null;
        const topLevelMilestone = getDeployedMilestone(currentProject.contractors[path[0]]);
        branches.push({
          path,
          parentChain,
          con: node,
          milestone: getDeployedMilestone(node) || (parentChain.length > 0 ? topLevelMilestone : null),
          // Legacy compat fields used by renderBranchCard for depth 0 and 1
          type: path.length === 1 ? 'top-level' : 'sub',
          conIndex: path[0],
          subIndex: path.length > 1 ? path[1] : undefined,
          parentName: parentEntry ? parentEntry.name : null,
          parentOrgId: parentEntry ? parentEntry.orgId : null,
          parentWallet: parentEntry ? parentEntry.wallet : null,
        });
      }
      (node.subcontractors || []).forEach((sub, si) => {
        search(sub, [...path, si], [
          ...parentChain,
          { name: node.name, orgId: node.organisation_id || null, wallet: node.walletaddress || null }
        ]);
      });
    };

    (currentProject.contractors || []).forEach((con, conIdx) => {
      search(con, [conIdx], []);
    });

    return branches;
  }

  // ── Sub-sub-contractor state handlers ──────────────────────────────────────
  // These manage contractors[conIndex].subcontractors[subIndex].subcontractors[*]
  // Used when the current user is a sub-contractor and wants to add their own sub-contractors.

  addSubSubContractor(conIndex, subIndex) {
    this.setState(prevState => ({
      currentProject: {
        ...prevState.currentProject,
        contractors: prevState.currentProject.contractors.map((con, ci) => {
          if (ci !== conIndex) return con;
          return {
            ...con,
            subcontractors: (con.subcontractors || []).map((sub, si) => {
              if (si !== subIndex) return sub;
              return {
                ...sub,
                subcontractors: [...(sub.subcontractors || []), { name: '', budget: 0, walletaddress: '', organisation_id: null, purchases: [], subcontractors: [], _isNew: true }]
              };
            })
          };
        })
      },
      datachanged: true
    }));
  }

  onChangeSubSubContractor(conIndex, subIndex, subSubIndex, field, value) {
    this.setState(prevState => ({
      currentProject: {
        ...prevState.currentProject,
        contractors: prevState.currentProject.contractors.map((con, ci) => {
          if (ci !== conIndex) return con;
          return {
            ...con,
            subcontractors: (con.subcontractors || []).map((sub, si) => {
              if (si !== subIndex) return sub;
              return {
                ...sub,
                subcontractors: (sub.subcontractors || []).map((ssub, ssi) => {
                  if (ssi !== subSubIndex) return ssub;
                  return { ...ssub, [field]: field === 'budget' ? parseFloat(value) : value };
                })
              };
            })
          };
        })
      },
      datachanged: true
    }));
  }

  removeSubSubContractor(conIndex, subIndex, subSubIndex) {
    this.setState(prevState => ({
      currentProject: {
        ...prevState.currentProject,
        contractors: prevState.currentProject.contractors.map((con, ci) => {
          if (ci !== conIndex) return con;
          return {
            ...con,
            subcontractors: (con.subcontractors || []).map((sub, si) => {
              if (si !== subIndex) return sub;
              return { ...sub, subcontractors: (sub.subcontractors || []).filter((_, ssi) => ssi !== subSubIndex) };
            })
          };
        })
      },
      datachanged: true
    }));
  }

  addSubSubContractorPurchase(conIndex, subIndex, subSubIndex, defaultMilestone = '') {
    this.setState(prevState => ({
      currentProject: {
        ...prevState.currentProject,
        contractors: prevState.currentProject.contractors.map((con, ci) => {
          if (ci !== conIndex) return con;
          return {
            ...con,
            subcontractors: (con.subcontractors || []).map((sub, si) => {
              if (si !== subIndex) return sub;
              return {
                ...sub,
                subcontractors: (sub.subcontractors || []).map((ssub, ssi) => {
                  if (ssi !== subSubIndex) return ssub;
                  return { ...ssub, purchases: [...(ssub.purchases || []), { description: '', amount: 0, milestone: defaultMilestone, invoices: [], _isNew: true }] };
                })
              };
            })
          };
        })
      },
      datachanged: true
    }));
  }

  onChangeSubSubContractorPurchase(conIndex, subIndex, subSubIndex, purIndex, field, value) {
    this.setState(prevState => ({
      currentProject: {
        ...prevState.currentProject,
        contractors: prevState.currentProject.contractors.map((con, ci) => {
          if (ci !== conIndex) return con;
          return {
            ...con,
            subcontractors: (con.subcontractors || []).map((sub, si) => {
              if (si !== subIndex) return sub;
              return {
                ...sub,
                subcontractors: (sub.subcontractors || []).map((ssub, ssi) => {
                  if (ssi !== subSubIndex) return ssub;
                  return {
                    ...ssub,
                    purchases: (ssub.purchases || []).map((pur, pi) => {
                      if (pi !== purIndex) return pur;
                      return { ...pur, [field]: field === 'amount' ? parseFloat(value) : value };
                    })
                  };
                })
              };
            })
          };
        })
      },
      datachanged: true
    }));
  }

  removeSubSubContractorPurchase(conIndex, subIndex, subSubIndex, purIndex) {
    this.setState(prevState => ({
      currentProject: {
        ...prevState.currentProject,
        contractors: prevState.currentProject.contractors.map((con, ci) => {
          if (ci !== conIndex) return con;
          return {
            ...con,
            subcontractors: (con.subcontractors || []).map((sub, si) => {
              if (si !== subIndex) return sub;
              return {
                ...sub,
                subcontractors: (sub.subcontractors || []).map((ssub, ssi) => {
                  if (ssi !== subSubIndex) return ssub;
                  return { ...ssub, purchases: (ssub.purchases || []).filter((_, pi) => pi !== purIndex) };
                })
              };
            })
          };
        })
      },
      datachanged: true
    }));
  }

  addSubContractor(conIndex) {
    this.setState(prevState => ({
      currentProject: {
        ...prevState.currentProject,
        contractors: prevState.currentProject.contractors.map((con, ci) => {
          if (ci !== conIndex) return con;
          return {
            ...con,
            subcontractors: [...(con.subcontractors || []), { name: '', budget: 0, walletaddress: '', organisation_id: null, purchases: [], subcontractors: [], _isNew: true }]
          };
        })
      },
      datachanged: true
    }));
  }

  onChangeSubContractor(conIndex, subIndex, field, value) {
    this.setState(prevState => ({
      currentProject: {
        ...prevState.currentProject,
        contractors: prevState.currentProject.contractors.map((con, ci) => {
          if (ci !== conIndex) return con;
          return {
            ...con,
            subcontractors: (con.subcontractors || []).map((sub, si) => {
              if (si !== subIndex) return sub;
              return { ...sub, [field]: field === 'budget' ? parseFloat(value) : value };
            })
          };
        })
      },
      datachanged: true
    }));
  }

  removeSubContractor(conIndex, subIndex) {
    this.setState(prevState => ({
      currentProject: {
        ...prevState.currentProject,
        contractors: prevState.currentProject.contractors.map((con, ci) => {
          if (ci !== conIndex) return con;
          return { ...con, subcontractors: (con.subcontractors || []).filter((_, si) => si !== subIndex) };
        })
      },
      datachanged: true
    }));
  }

  addSubContractorPurchase(conIndex, subIndex, defaultMilestone = '') {
    this.setState(prevState => ({
      currentProject: {
        ...prevState.currentProject,
        contractors: prevState.currentProject.contractors.map((con, ci) => {
          if (ci !== conIndex) return con;
          return {
            ...con,
            subcontractors: (con.subcontractors || []).map((sub, si) => {
              if (si !== subIndex) return sub;
              return { ...sub, purchases: [...(sub.purchases || []), { description: '', amount: 0, milestone: defaultMilestone, invoices: [], _isNew: true }] };
            })
          };
        })
      },
      datachanged: true
    }));
  }

  onChangeSubContractorPurchase(conIndex, subIndex, purIndex, field, value) {
    this.setState(prevState => ({
      currentProject: {
        ...prevState.currentProject,
        contractors: prevState.currentProject.contractors.map((con, ci) => {
          if (ci !== conIndex) return con;
          return {
            ...con,
            subcontractors: (con.subcontractors || []).map((sub, si) => {
              if (si !== subIndex) return sub;
              return {
                ...sub,
                purchases: (sub.purchases || []).map((p, pi) => {
                  if (pi !== purIndex) return p;
                  return { ...p, [field]: field === 'amount' ? parseFloat(value) : value };
                })
              };
            })
          };
        })
      },
      datachanged: true
    }));
  }

  removeSubContractorPurchase(conIndex, subIndex, purIndex) {
    this.setState(prevState => ({
      currentProject: {
        ...prevState.currentProject,
        contractors: prevState.currentProject.contractors.map((con, ci) => {
          if (ci !== conIndex) return con;
          return {
            ...con,
            subcontractors: (con.subcontractors || []).map((sub, si) => {
              if (si !== subIndex) return sub;
              return { ...sub, purchases: (sub.purchases || []).filter((_, pi) => pi !== purIndex) };
            })
          };
        })
      },
      datachanged: true
    }));
  }

  handleSubContractorInvoiceUpload(conIndex, subIndex, purIndex, e) {
    const file = e.target.files[0];
    if (!file) return;
    const contractors = [...this.state.currentProject.contractors];
    const purchase = contractors[conIndex].subcontractors[subIndex].purchases[purIndex];
    if (!purchase.invoices) purchase.invoices = [];
    purchase.invoices.push(file);
    this.setState(prevState => ({
      currentProject: { ...prevState.currentProject, contractors },
      datachanged: true
    }));
  }

  async saveContractorChanges() {
    this.setState({
      isLoading: true, logs: [], message: "", showm: true,
      modalmsg: "Saving your changes...\n",
      button1text: null, button2text: null, button3text: null, button0text: null, afterModalClose: null,
    });

    const myBranches = this.getMyContractorBranches();
    if (myBranches.length === 0) {
      this.setState({ isLoading: false });
      this.displayModal("Unable to identify your contractor entry. Please ensure your wallet address is registered.", null, null, null, "OK");
      return;
    }
    const myConIndex = myBranches[0].type === 'top-level' ? myBranches[0].conIndex : -1;

    const formData = new FormData();
    formData.append('id', this.state.currentProject.id);
    formData.append('name', this.state.currentProject.name);
    formData.append('description', this.state.currentProject.description);
    formData.append('totalBudget', this.state.currentProject.totalBudget);
    formData.append('startdate', this.state.currentProject.startdate);
    formData.append('enddate', this.state.currentProject.enddate);
    formData.append('milestones', JSON.stringify(this.state.currentProject.milestones));
    formData.append('contractors', JSON.stringify(
      this.state.currentProject.contractors.map(c => ({
        ...c,
        purchases: (c.purchases || []).map(p => ({ ...p, invoices: [] })),
        subcontractors: (c.subcontractors || []).map(sub => ({
          ...sub,
          purchases: (sub.purchases || []).map(p => ({ ...p, invoices: [] }))
        }))
      }))
    ));

    const myContractor = this.state.currentProject.contractors[myConIndex];
    (myContractor.purchases || []).forEach((pur, purIndex) => {
      if (pur.invoices && pur.invoices.length > 0)
        formData.append(`contractor_${myConIndex}_purchase_${purIndex}_invoice`, pur.invoices[0]);
    });
    (myContractor.subcontractors || []).forEach((sub, subIndex) => {
      (sub.purchases || []).forEach((pur, purIndex) => {
        if (pur.invoices && pur.invoices.length > 0)
          formData.append(`contractor_${myConIndex}_sub_${subIndex}_purchase_${purIndex}_invoice`, pur.invoices[0]);
      });
    });

    await DtscfDataService.update(this.state.currentProject.id, formData)
      .then(() => {
        this.setState(prevState => ({
          modalmsg: prevState.modalmsg + "Changes saved successfully.\n",
          button0text: "Close", isLoading: false,
        }));
      })
      .catch(e => {
        const errMsg = (e.response && e.response.data && e.response.data.message) || e.message || e.toString();
        this.setState(prevState => ({
          modalmsg: prevState.modalmsg + "Error: " + errMsg + "\n",
          button0text: "Close", isLoading: false,
        }));
      });
  }

  async submitContractorAmendment() {
    const { currentProject, currentUser, selectedOrgApprover } = this.state;
    const myBranches = this.getMyContractorBranches();
    if (myBranches.length === 0) {
      this.displayModal("Unable to identify your contractor entry.", null, null, null, "OK");
      return;
    }
    if (!selectedOrgApprover) {
      this.displayModal("Please select an approver before submitting.", null, null, null, "OK");
      return;
    }
    const approverIdNum = parseInt(selectedOrgApprover, 10);
    if (isNaN(approverIdNum) || approverIdNum <= 0) {
      this.displayModal("Invalid approver selection — please re-select the approver from the dropdown.", null, null, null, "OK");
      return;
    }
    if (approverIdNum === parseInt(currentUser.id, 10)) {
      this.displayModal("You cannot be the approver for your own submission.", null, null, null, "OK");
      return;
    }

    this.setState({ isLoading: true, showm: true, modalmsg: "Submitting contractor amendment...\n", button0text: null });

    // Serialize a contractor tree entry (handles arbitrary depth of sub-contractors)
    const serializeCon = (con) => ({
      name: con.name, budget: con.budget,
      walletaddress: con.walletaddress, organisation_id: con.organisation_id || null,
      purchases: (con.purchases || []).map(p => ({ description: p.description, amount: p.amount, milestone: p.milestone || '' })),
      subcontractors: (con.subcontractors || []).map(serializeCon)
    });

    const branchPayloads = myBranches.map(branch => ({
      branchType: branch.type,
      parentRef: branch.type === 'sub' ? {
        name: branch.parentName || '',
        organisation_id: branch.parentOrgId || null,
        walletaddress: branch.parentWallet || null,
      } : null,
      contractor: serializeCon(branch.con),
    }));

    const payload = {
      dtscf_project_id: currentProject.id,
      maker: currentUser.id,
      approver: approverIdNum,
      actionby: currentUser.username,
      myBranches: branchPayloads,
    };
    console.log('[Submit] payload:', JSON.stringify(payload, null, 2));

    DtscfDataService.submitContractorAmendment(payload)
      .then(r => {
        this.setState({
          modalmsg: "Amendment submitted for approval. Draft ID: " + (r.data.draftId || ''),
          button0text: "Close", isLoading: false,
          myPendingDraftId: r.data.draftId,
          datachanged: false,
          afterModalClose: () => this.setState({ redirect: '/inbox' })
        });
      })
      .catch(e => {
        const errMsg = (e.response && e.response.data && e.response.data.message) || e.message || e.toString();
        this.setState({ modalmsg: "Error: " + errMsg, button0text: "Close", isLoading: false });
      });
  }

  // Anchor submits new top-level contractors as a contractor amendment draft for approver review.
  async submitAnchorAmendment() {
    const { currentProject, currentUser } = this.state;
    const newContractors = (currentProject.contractors || []).filter(c => c._isNew);

    if (newContractors.length === 0) {
      this.displayModal("Please add at least one new contractor before submitting.", null, null, null, "OK");
      return;
    }
    if (!currentProject.approver) {
      this.displayModal("Please select an approver before submitting.", null, null, null, "OK");
      return;
    }
    const approverIdNum = parseInt(currentProject.approver, 10);
    if (approverIdNum === parseInt(currentUser.id, 10)) {
      this.displayModal("You cannot be the approver for your own submission.", null, null, null, "OK");
      return;
    }

    this.setState({ isLoading: true, showm: true, modalmsg: "Submitting new contractors for approval...\n", button0text: null });

    const payload = {
      dtscf_project_id: currentProject.id,
      maker: currentUser.id,
      approver: approverIdNum,
      actionby: currentUser.username,
      myBranches: newContractors.map(con => ({
        branchType: 'top-level',
        parentRef: null,
        contractor: {
          name: con.name,
          budget: con.budget || 0,
          walletaddress: con.walletaddress || '',
          organisation_id: con.organisation_id || null,
          purchases: (con.purchases || []).map(p => ({
            description: p.description,
            amount: p.amount,
            milestone: p.milestone || ''
          })),
          subcontractors: []
        }
      }))
    };

    DtscfDataService.submitContractorAmendment(payload)
      .then(r => {
        this.setState({
          modalmsg: "New contractors submitted for approval. Draft ID: " + (r.data.draftId || ''),
          button0text: "Close",
          isLoading: false,
          myPendingDraftId: r.data.draftId,
          datachanged: false,
          afterModalClose: () => this.setState({ redirect: '/inbox' })
        });
      })
      .catch(e => {
        const errMsg = e.response?.data?.message || e.message || 'Unknown error';
        this.setState({ modalmsg: "Error: " + errMsg, button0text: "Close", isLoading: false });
      });
  }

  // Returns an error string if MetaMask pre-conditions for contractor splits are not met,
  // or null if everything is ready (or no contractor signing is needed at all).
  async preFlightContractorMetaMask(draftId) {
    const { pendingAmendmentDrafts, currentProject } = this.state;
    const draft = pendingAmendmentDrafts.find(d => d.id === draftId);
    if (!draft || !draft.contractors || !currentProject.smartcontractaddress) return null;

    // Identify contractor wallets that will need to sign sub-contractor splits via MetaMask.
    // A contractor needs to sign if it has any new sub-contractors or new sub-contractor purchases.
    const contractorWalletsNeeded = [];
    for (const contractor of draft.contractors) {
      const hasNewSubContent = (contractor.subcontractors || []).some(sub =>
        sub.is_new || (sub.dtscf_purchases_drafts || []).some(p => p.is_new)
      );
      if (hasNewSubContent && contractor.walletaddress) {
        contractorWalletsNeeded.push({ name: contractor.name, wallet: contractor.walletaddress });
      }
    }

    if (contractorWalletsNeeded.length === 0) return null; // no contractor MetaMask needed

    if (!window.ethereum) {
      return `MetaMask is required to sign sub-contractor splits as the contractor.\nPlease install MetaMask and try again.`;
    }

    // Step 1: check what is already connected (non-prompting).
    let connectedAccounts;
    try {
      connectedAccounts = await window.ethereum.request({ method: 'eth_accounts' });
    } catch (e) {
      return `Could not read MetaMask accounts: ${e.message}`;
    }

    // Step 2: if nothing is connected, prompt the user to connect now.
    if (!connectedAccounts || connectedAccounts.length === 0) {
      const walletList = contractorWalletsNeeded.map(c => `  ${c.name}: ${c.wallet}`).join('\n');
      this.setState(prev => ({
        modalmsg: prev.modalmsg +
          `Sub-contractor splits require MetaMask signing.\nPlease connect the contractor wallet when prompted:\n${walletList}\n`
      }));
      try {
        connectedAccounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      } catch (e) {
        // User rejected the connection popup
        return `MetaMask connection was cancelled.\nPlease click "Approve and deploy" again and connect when prompted.`;
      }
    }

    const connectedLower = connectedAccounts[0].toLowerCase();
    const matched = contractorWalletsNeeded.find(c => c.wallet.toLowerCase() === connectedLower);
    if (!matched) {
      const walletList = contractorWalletsNeeded.map(c => `  ${c.name}: ${c.wallet}`).join('\n');
      return `MetaMask is connected as ${connectedAccounts[0]}, but a different contractor wallet is needed to sign sub-contractor splits:\n${walletList}\nPlease switch MetaMask to the correct account and click "Approve and deploy" again.`;
    }

    // Verify the connected contractor wallet holds at least one TP, then estimate gas costs.
    try {
      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(TPAbi, currentProject.smartcontractaddress);
      const allIds = await contract.methods.getAllTokenIds().call();
      const balances = await Promise.all(allIds.map(id => contract.methods.balanceOf(connectedAccounts[0], id).call()));
      const ownedTokenIds = allIds.filter((_, i) => balances[i] === '1');
      if (ownedTokenIds.length === 0) {
        return `MetaMask account ${connectedAccounts[0]} (${matched.name}) is connected but holds no Tokenised Payables in this contract.\nMake sure you are using the correct contractor wallet.`;
      }

      // Count new sub-contractor purchases in this draft that will require contractor MetaMask signing
      let totalNewSplits = 0;
      const matchedContractor = draft.contractors.find(c => c.walletaddress && c.walletaddress.toLowerCase() === connectedLower);
      if (matchedContractor) {
        for (const sub of (matchedContractor.subcontractors || [])) {
          totalNewSplits += (sub.dtscf_purchases_drafts || []).filter(p => p.is_new).length;
        }
      }

      // Estimate gas using a representative splitPayable call with minimal dummy values
      if (totalNewSplits > 0) {
        try {
          const sampleTokenId = ownedTokenIds[0];
          const sampleMaturity = Math.floor(Date.now() / 1000) + 86400;
          const dummyCommitment = '0x' + '0'.repeat(64);
          const singleSplitGas = await contract.methods
            .splitPayable(sampleTokenId, 0, dummyCommitment, dummyCommitment, sampleMaturity, '', '')
            .estimateGas({ from: connectedAccounts[0] });
          const transferGasEst = 80000;
          const totalGasEst = Math.ceil((singleSplitGas * totalNewSplits + transferGasEst * totalNewSplits) * 1.15);
          const [gasPrice, ethBalance] = await Promise.all([
            web3.eth.getGasPrice(),
            web3.eth.getBalance(connectedAccounts[0])
          ]);
          const ethRequired = BigInt(totalGasEst) * BigInt(gasPrice);
          if (BigInt(ethBalance) < ethRequired) {
            const requiredEth = parseFloat(web3.utils.fromWei(ethRequired.toString(), 'ether')).toFixed(6);
            const balanceEth  = parseFloat(web3.utils.fromWei(ethBalance, 'ether')).toFixed(6);
            return `Insufficient ETH to pay for gas fees (${totalNewSplits} split(s) estimated).\n  Required: ~${requiredEth} ETH  |  Wallet balance: ${balanceEth} ETH\nPlease top up wallet ${connectedAccounts[0]} with ETH on the Sepolia test network, then click "Approve and deploy" again.`;
          }
        } catch (gasErr) {
          // Non-fatal: skip the gas pre-check if estimation fails (will catch later in executeBlockchainSplits)
        }
      }
    } catch (e) {
      // Non-fatal: skip the on-chain checks if queries fail
    }

    return null; // all pre-conditions met
  }

  async approveContractorAmendment(draftId) {
    const { currentUser } = this.state;
    const approverComments = this.state.pendingApproverComments || '';

    this.setState({ isLoading: true, showm: true, modalmsg: "Checking pre-conditions...\n", button0text: null });

    // Pre-flight: verify MetaMask is connected with the right contractor wallet before hitting the server.
    // This avoids triggering the server-side DB rollback for a problem we can detect upfront.
    const preFlightErr = await this.preFlightContractorMetaMask(draftId);
    if (preFlightErr) {
      this.setState({ modalmsg: preFlightErr, button0text: "Close", isLoading: false });
      return;
    }

    this.setState(prev => ({ modalmsg: prev.modalmsg + "Approving contractor amendment...\n" }));

    let result;
    try {
      result = await DtscfDataService.approveContractorAmendment(
        draftId,
        { approver: currentUser.id, approverComments },
        msg => {
          if (msg.startsWith('EXPLORER:')) {
            this.setState({ explorerUrl: msg.substring(9) });
          } else {
            this.setState(prev => ({ modalmsg: prev.modalmsg + msg + "\n" }));
          }
        }
      );
    } catch (e) {
      const errMsg = (e.response && e.response.data && e.response.data.message) || e.message || e.toString();
      this.setState({ modalmsg: "Error: " + errMsg, button0text: "Close", isLoading: false });
      return;
    }

    const { contractAddress, splitTasks, rollbackIds } = result || {};
    if (contractAddress && splitTasks && splitTasks.length > 0) {
      await this.executeBlockchainSplits(contractAddress, splitTasks, draftId, rollbackIds);
    } else {
      this.setState(prev => ({
        modalmsg: prev.modalmsg + "Approval complete.\n",
        button0text: "Close", isLoading: false,
        pendingAmendmentDrafts: prev.pendingAmendmentDrafts.filter(d => d.id !== draftId),
        afterModalClose: () => this.setState({ redirect: '/inbox' })
      }));
    }
  }

  async executeBlockchainSplits(contractAddress, splitTasks, draftId, rollbackIds) {
    const log = msg => this.setState(prev => ({ modalmsg: prev.modalmsg + msg + "\n" }));

    const revertSplits = async () => {
      if (!rollbackIds) return;
      try {
        await DtscfDataService.revertContractorSplit(rollbackIds);
        log('Sub-contractor split cancelled — draft reset to pending. Please click "Approve and deploy" to retry.');
      } catch (revertErr) {
        log(`Warning: could not revert DB changes automatically (${revertErr.message}). Please contact the administrator.`);
      }
    };

    if (!window.ethereum) {
      log("MetaMask not detected. Please install MetaMask to complete the blockchain splits.");
      this.setState({ button0text: "Close", isLoading: false });
      return;
    }

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    } catch (e) {
      log("MetaMask connection rejected: " + e.message);
      this.setState({ button0text: "Close", isLoading: false });
      return;
    }

    const web3 = new Web3(window.ethereum);
    const accounts = await web3.eth.getAccounts();
    const userAccount = accounts[0];
    log(`Connected MetaMask account: ${userAccount}`);

    const contract = new web3.eth.Contract(TPAbi, contractAddress);

    // Verify the MetaMask account holds the source token for the first task.
    // These are contractor splits — the contractor must sign with the wallet that holds their TP.
    const firstFromToken = splitTasks[0].fromTokenId;
    const bal = await contract.methods.balanceOf(userAccount, firstFromToken).call().catch(() => '0');
    if (bal !== '1') {
      log(`Your MetaMask account (${userAccount}) does not hold TP #${firstFromToken}.`);
      log(`These are sub-contractor splits that must be signed by the contractor whose wallet holds TP #${firstFromToken}.`);
      log(`Please switch MetaMask to that contractor's wallet and click "Approve and deploy" again.`);
      this.setState({ button0text: "Close", isLoading: false });
      return;
    }

    // Determine next token IDs by reading current state just before the batch
    const allIds = await contract.methods.getAllTokenIds().call();
    const lastTokenId = allIds.length > 0 ? Math.max(...allIds.map(id => parseInt(id))) : 0;
    const nextTokenId = lastTokenId + 1;
    log(`Current last token ID: ${lastTokenId}. New tokens will be #${nextTokenId}–#${nextTokenId + splitTasks.length - 1}`);
    log(`Planned splits:`);
    splitTasks.forEach((task, i) => {
      log(`  TP #${task.fromTokenId} → new TP #${nextTokenId + i}: ${task.amount} SGD for '${task.purchaseDescription}' to '${task.contractorName || task.toWallet}'`);
    });

    // Check if multicall is available (contract was deployed with Multicall support)
    const hasMulticall = TPAbi.some(entry => entry.name === 'multicall');

    let multicallSucceeded = false;

    if (hasMulticall) {
      // Batch: all splitPayable calls first, then all safeTransferFrom calls — one MetaMask approval
      log(`Batching ${splitTasks.length * 2} operations into a single transaction...`);
      const splitCalls = splitTasks.map(task =>
        contract.methods.splitPayable(
          task.fromTokenId, task.milestoneId, task.splitCommitment, task.updatedOriginalCommitment, task.maturityDate, task.metadataUri || '', task.updatedSourceUri || ''
        ).encodeABI()
      );
      const transferCalls = splitTasks.map((task, i) =>
        contract.methods.safeTransferFrom(
          userAccount, task.toWallet, nextTokenId + i, 1, '0x'
        ).encodeABI()
      );

      // Estimate gas — fall back to individual transactions if multicall estimation fails
      let multicallGasEstimate = null;
      try {
        multicallGasEstimate = await contract.methods
          .multicall([...splitCalls, ...transferCalls])
          .estimateGas({ from: userAccount });
      } catch (e) {
        // Diagnose which sub-call fails by trying each split individually (console only — not shown to user)
        console.log(`Multicall gas estimation failed (${e.message}) — diagnosing...`);
        for (let i = 0; i < splitCalls.length; i++) {
          try {
            await contract.methods.multicall([splitCalls[i]]).estimateGas({ from: userAccount });
            console.log(`  Split ${i + 1}: OK individually`);
          } catch (diagErr) {
            console.log(`  Split ${i + 1} fails individually: ${diagErr.message}`);
          }
        }
        log(`Falling back to individual transactions.`);
      }

      if (multicallGasEstimate !== null) {
        try {
          const gasWithBuffer = Math.ceil(multicallGasEstimate * 1.1);
          const [gasPrice, ethBalanceWei] = await Promise.all([
            web3.eth.getGasPrice(),
            web3.eth.getBalance(userAccount)
          ]);
          const ethRequired = BigInt(gasWithBuffer) * BigInt(gasPrice);
          if (BigInt(ethBalanceWei) < ethRequired) {
            const requiredEth = parseFloat(web3.utils.fromWei(ethRequired.toString(), 'ether')).toFixed(6);
            const balanceEth  = parseFloat(web3.utils.fromWei(ethBalanceWei, 'ether')).toFixed(6);
            log(`Insufficient ETH to pay for gas fees.`);
            log(`  Required : ~${requiredEth} ETH  |  Wallet balance: ${balanceEth} ETH`);
            log(`Please top up wallet ${userAccount} with at least ${requiredEth} ETH on the Sepolia test network, then click "Approve and deploy" again.`);
            this.setState({ button0text: "Close", isLoading: false });
            return;
          }
          log(`Gas estimate: ${multicallGasEstimate} (using ${gasWithBuffer} with 10% buffer).`);

          const receipt = await contract.methods
            .multicall([...splitCalls, ...transferCalls])
            .send({ from: userAccount, gas: gasWithBuffer });

          log(`Batch transaction confirmed: ${receipt.transactionHash}`);
          splitTasks.forEach((task, i) => {
            log(`TP #${task.fromTokenId} → TP #${nextTokenId + i} (${task.amount} SGD for '${task.purchaseDescription}') transferred to '${task.contractorName || task.toWallet}'. Source TP #${task.fromTokenId} metadata updated atomically.`);
          });

          // Persist token_id and escrow_salt back to DB for each contractor split purchase
          try {
            const rawEvents = receipt.events && receipt.events.PayableSplit;
            const splitEvents = !rawEvents ? [] : (Array.isArray(rawEvents) ? rawEvents : [rawEvents]);
            const updates = splitTasks
              .map((task, i) => {
                if (!task.purchaseId || !splitEvents[i]) return null;
                return { purchaseId: task.purchaseId, tokenId: splitEvents[i].returnValues.newId, splitSalt: task.splitSalt };
              })
              .filter(Boolean);
            const sourceUpdates = splitTasks
              .filter(task => task.sourcePurchaseId && task.sourceRemainingAmount != null)
              .map(task => ({ purchaseId: task.sourcePurchaseId, amount: task.sourceRemainingAmount, salt: task.newOriginalSalt }));
            await DtscfDataService.confirmContractorSplit(updates, sourceUpdates);
          } catch (e) {
            log(`Warning: token_id/salt not saved to DB (${e.message}). Unwrap may require manual lookup.`);
          }

          multicallSucceeded = true;
          this.setState(prev => ({
            modalmsg: prev.modalmsg + "All blockchain splits complete in one transaction.\n",
            button0text: "Close", isLoading: false,
            pendingAmendmentDrafts: prev.pendingAmendmentDrafts.filter(d => d.id !== draftId),
            afterModalClose: () => this.setState({ redirect: '/inbox' })
          }));
        } catch (e) {
          log(`Batch transaction failed: ${e.message}`);
          await revertSplits();
          this.setState({ button0text: "Close", isLoading: false });
          return;
        }
      }
    }

    if (!multicallSucceeded) {
      // Individual transactions: used when multicall is unavailable or its gas estimation failed
      if (hasMulticall) {
        log(`Running as individual transactions (${splitTasks.length * 2} MetaMask approvals).`);
      } else {
        log(`Note: contract does not support multicall — ${splitTasks.length * 2} separate MetaMask approvals required.`);
      }
      const fallbackGasPrice = await web3.eth.getGasPrice();
      let allSucceeded = true;
      for (let i = 0; i < splitTasks.length; i++) {
        const task = splitTasks[i];
        log(`[${i + 1}/${splitTasks.length}] Splitting for '${task.purchaseDescription}' (${task.amount} SGD)...`);
        try {
          // Estimate gas and check balance before each split+transfer pair
          let splitGasEst;
          try {
            splitGasEst = await contract.methods
              .splitPayable(task.fromTokenId, task.milestoneId, task.splitCommitment, task.updatedOriginalCommitment, task.maturityDate, task.metadataUri || '', task.updatedSourceUri || '')
              .estimateGas({ from: userAccount });
          } catch (e) {
            log(`Gas estimation failed for '${task.purchaseDescription}': ${e.message}`);
            allSucceeded = false;
            continue;
          }
          const transferGasEst = 150000; // generous fixed allowance for safeTransferFrom (custom override adds tokenOwners write + event)
          const totalGas = Math.ceil((splitGasEst + transferGasEst) * 1.1);
          const ethRequired = BigInt(totalGas) * BigInt(fallbackGasPrice);
          const ethBalance = BigInt(await web3.eth.getBalance(userAccount));
          if (ethBalance < ethRequired) {
            const requiredEth = parseFloat(web3.utils.fromWei(ethRequired.toString(), 'ether')).toFixed(6);
            const balanceEth  = parseFloat(web3.utils.fromWei(ethBalance.toString(), 'ether')).toFixed(6);
            log(`Insufficient ETH for '${task.purchaseDescription}'. Required: ~${requiredEth} ETH | Balance: ${balanceEth} ETH`);
            log(`Please top up wallet ${userAccount} with ETH on the Sepolia test network, then click "Approve and deploy" again.`);
            allSucceeded = false;
            break;
          }

          const splitGasWithBuffer = Math.ceil(splitGasEst * 1.1);
          const splitReceipt = await contract.methods
            .splitPayable(task.fromTokenId, task.milestoneId, task.splitCommitment, task.updatedOriginalCommitment, task.maturityDate, task.metadataUri || '', task.updatedSourceUri || '')
            .send({ from: userAccount, gas: splitGasWithBuffer });

          let newTokenId = null;
          const splitEvent = splitReceipt.events && splitReceipt.events.PayableSplit;
          if (splitEvent) newTokenId = splitEvent.returnValues.newId;
          if (!newTokenId) {
            const freshIds = await contract.methods.getAllTokenIds().call();
            newTokenId = freshIds.length > 0 ? Math.max(...freshIds.map(id => parseInt(id))) : null;
          }
          if (!newTokenId) { log(`Could not determine new token ID for '${task.purchaseDescription}'`); allSucceeded = false; continue; }

          try {
            const newTokenUpdates = task.purchaseId ? [{ purchaseId: task.purchaseId, tokenId: newTokenId, splitSalt: task.splitSalt }] : [];
            const srcUpdates = task.sourcePurchaseId && task.sourceRemainingAmount != null
              ? [{ purchaseId: task.sourcePurchaseId, amount: task.sourceRemainingAmount, salt: task.newOriginalSalt }]
              : [];
            if (newTokenUpdates.length > 0 || srcUpdates.length > 0) {
              await DtscfDataService.confirmContractorSplit(newTokenUpdates, srcUpdates);
            }
          } catch (e) {
            log(`Warning: token_id/salt not saved to DB for TP #${newTokenId}: ${e.message}`);
          }

          log(`TP #${task.fromTokenId} → TP #${newTokenId} (${task.amount} SGD) minted — transferring to '${task.contractorName || task.toWallet}'`);
          let xferGas;
          try {
            xferGas = Math.ceil((await contract.methods.safeTransferFrom(userAccount, task.toWallet, newTokenId, 1, '0x').estimateGas({ from: userAccount })) * 1.2);
          } catch (estErr) {
            log(`Transfer gas estimation failed for '${task.purchaseDescription}': ${estErr.message}`);
            allSucceeded = false;
            continue;
          }
          await contract.methods.safeTransferFrom(userAccount, task.toWallet, newTokenId, 1, '0x').send({ from: userAccount, gas: xferGas });
          log(`TP #${task.fromTokenId} → TP #${newTokenId} (${task.amount} SGD for '${task.purchaseDescription}') complete. Source TP #${task.fromTokenId} metadata updated atomically.`);
        } catch (e) {
          log(`Failed for '${task.purchaseDescription}': ${e.message}`);
          allSucceeded = false;
        }
      }
      if (!allSucceeded) await revertSplits();
      this.setState(prev => ({
        modalmsg: prev.modalmsg + (allSucceeded ? "All blockchain splits complete.\n" : "Some splits failed — check logs above.\n"),
        button0text: "Close", isLoading: false,
        pendingAmendmentDrafts: prev.pendingAmendmentDrafts.filter(d => d.id !== draftId),
        afterModalClose: () => this.setState({ redirect: '/inbox' })
      }));
    }
  }

  rejectContractorAmendment(draftId) {
    DtscfDataService.rejectDraftById(draftId, { approver: this.state.currentUser.id, approverComments: this.state.pendingApproverComments || '' })
      .then(() => {
        this.setState({ redirect: '/inbox' });
      })
      .catch(e => this.displayModal("Reject error: " + e.message, null, null, null, "OK"));
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

//    if (!(typeof this.state.currentProject.name ==='string' || this.state.currentProject.name instanceof String) || (this.state.currentProject.name.trim() === "" || this.state.currentProject.name === null || this.state.currentProject.name === undefined)) {
//      err += "- Name cannot be empty\n";
//    } 
//    if (this.state.currentProject.totalBudget && (isNaN(this.state.currentProject.totalBudget) || this.state.currentProject.totalBudget <= 0)) err += "- Total Budget is invalid\n";

    this.state.currentProject.contractors.forEach(con => {
      if (!(typeof con.name ==='string' || con.name instanceof String) || (con.name.trim() === "" || con.name === null || con.name === undefined)) {
        err += "- Contractor's Name cannot be empty\n"; 
      } 
      if (con.budget && (isNaN(con.budget) || con.budget <= 0)) {
        err += "- Contractor '" + con.name + "' Budget is invalid\n";
      } else {
//        if (con.budget > this.state.currentProject.totalBudget) {
//          err += `- Contractor '${con.name}' budget cannot be more than Total Budget\n`;
//        }
      }
      if (!(typeof con.walletaddress ==='string' || con.walletaddress instanceof String) || (con.walletaddress.trim() === "" || con.walletaddress === null || con.walletaddress === undefined)) {
        err += "- Contractor's Wallet Address cannot be empty\n"; 
      } else if (!isValidAddress(con.walletaddress)) {
        err += `- Contractor ${con.name}'s Wallet Address is invalid\n`;
      }
    });

//    this.state.currentProject.milestones.forEach(ms => {
//      if (! validator.isDate(ms.startdate)) err += "- Milestone '" + ms.name + "' Start Date is invalid\n";
//      if (! validator.isDate(ms.enddate)) err += "- Milestone '" + ms.name + "' End Date is invalid\n";
//      if (validator.isDate(ms.startdate) && validator.isDate(ms.enddate)) {
//        if (moment(ms.startdate).isAfter(moment(ms.enddate))) err += "- Milestone '" + ms.name + "' Start date cannot be later than End date\n";
//        if (! moment(ms.enddate).isAfter(moment(ms.startdate))) err += "- Milestone '" + ms.name + "' End date must be after Start date\n";
//      }
//      if (isNaN(ms.budget) || ms.budget <= 0) {
//        err += "- Milestone '" + ms.name + "' Budget is invalid\n";
//      } 
//      if (ms.budget > this.state.currentProject.totalBudget) {
//        err += `- Milestone '${ms.name}' budget cannot be more than Total Budget\n`;
//      }
//    });

      // dont need t check description, it can be empty
//    if (! validator.isDate(this.state.currentProject.startdate)) err += "- Start Date is invalid\n";
//    if (! validator.isDate(this.state.currentProject.enddate)) err += "- End Date is invalid\n";
//    if (validator.isDate(this.state.currentProject.startdate) && validator.isDate(this.state.currentProject.enddate)) {
//      if (moment(this.state.currentProject.startdate).isAfter(moment(this.state.currentProject.enddate))) err += "- Project Start date cannot be later than End date\n";
//      if (! moment(this.state.currentProject.enddate).isAfter(moment(this.state.currentProject.startdate))) err += "- Project End date must be after Start date\n";
//    }
//    if (this.state.currentProject.underlyingTokenID === 0 || this.state.currentProject.underlyingTokenID === "" || this.state.currentProject.underlyingTokenID === null || this.state.currentProject.underlyingTokenID === undefined) err += "- Underlying Digital Money cannot be empty\n";
//    if (this.state.currentProject.totalBudget === "" || this.state.currentProject.totalBudget === null || this.state.currentProject.totalBudget === undefined) 
//    {
//        err += "- Budget cannot be empty\n";
//    } else
//        if (parseInt(this.state.currentProject.totalBudget) <=  0) err += "- Budget must be more than zero\n";
//    if (this.state.currentProject.startdate!== "" && this.state.currentProject.enddate !== "" && this.state.currentProject.startdate > this.state.currentProject.enddate) err += "- Start date cannot be later than End date\n";    

//    console.log("start date:'"+this.state.currentProject.startdate+"'");
//    console.log("end date:'"+this.state.currentProject.enddate+"'");
//    console.log("Start > End? "+ (this.state.currentProject.startdate > this.state.currentProject.enddate));

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

//      DtscfDataService.submitDraftById(this.state.currentProject.id, submitData, (log1) => {
      DtscfDataService.submitDraftById(this.state.currentProject.id, this.state.currentProject, (log1) => {
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
      if (log1.startsWith('EXPLORER:')) {
        this.setState({ explorerUrl: log1.substring(9) });
      } else {
        this.setState(prevState => ({
          modalmsg: prevState.modalmsg + log1 + "\n"
        }));
      }
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

  show_loading() { this.setState({isLoading: true}); }

  hide_loading(){ this.setState({isLoading: false}); }

  showModal_Leave = () => { this.displayModal("You have made changes. Are you sure you want to leave this page without submitting?", "Yes, leave", null, null, "Cancel"); };

  showModal_dropRequest = () => { this.displayModal("Are you sure you want to Drop this Request?", null, null, "Yes, drop", "Cancel"); };
  
  showModalDelete = () => { this.displayModal("Are you sure you want to Delete this Dtscf?", null, "Yes, delete", null, "Cancel"); };

  hideModal() {
    this.setState({
      showm: false,
      modalmsg: "",
      explorerUrl: "",
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














//////////////////// RENDERING ///////////////////////















  renderContractor(contractor, tier = 1) {
    return (
      <div key={contractor.id} style={{ marginLeft: `${tier * 20}px` }}>
        <h5>Tier-{tier} Contractor: {contractor.name} (Wallet Address: {contractor.walletaddress})</h5>
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

  
  renderProjectDiagram() {
    const { currentProject } = this.state;
    if (!currentProject) return null;

    const projectName = currentProject.name || "Untitled Project";

    return (
      <div className="project-diagram mt-5 mb-4" style={{
        background: '#ffffff',
        borderRadius: '12px',
        padding: '30px 20px',
        border: '1px solid #334155',
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)',
        color: '#e2e8f0',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        width: '100%'
      }}>
        <div style={{ maxWidth: '360px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            display: 'block',
            background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
            color: 'white',
            padding: '14px 32px',
            borderRadius: '9px',
            fontSize: '18px',
            fontWeight: '700',
            boxShadow: '0 4px 6px -1px rgb(59 130 246 / 0.3)',
            border: '2px solid #60a5fa',
            textAlign: 'center'
          }}>
            Project: <span style={{ fontSize: '20px' }}>{projectName}</span>
          </div>
          {this.state.isAnchor && currentProject.totalBudget && (
            <div style={{
              marginTop: '12px',
              fontSize: '15px',
              color: '#94a3b8'
            }}>
              Total Budget: <strong style={{ color: '#22c55e' }}>
                ${parseFloat(currentProject.totalBudget).toLocaleString()}
              </strong>
            </div>
          )}
        </div>

        {/* Main connector line from project to milestones */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          position: 'relative',
          margin: '20px 0 40px 0'
        }}>
          <div style={{
            position: 'absolute',
            width: '4px',
            height: '60px',
            background: '#64748b',
            top: '-30px',
            zIndex: 1
          }}></div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {currentProject.milestones && currentProject.milestones.map((milestone, msIndex) => {
            // Group contractors that have purchases tagged to this milestone
            const milestoneContractors = currentProject.contractors ?
              currentProject.contractors.filter(con =>
                con.purchases && con.purchases.some(p => p.milestone === milestone.name)
              ) : [];

            return (
              <div key={msIndex} style={{
                width: '100%',
                background: '#ffffff',
                borderRadius: '12px',
                padding: '16px',
                border: '2px solid #3b82f6',
                position: 'relative',
                boxSizing: 'border-box'
              }}>
                {/* Milestone Box */}
                <div style={{
                  background: '#1e40af',
                  color: 'white',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  fontWeight: '600',
                  marginBottom: '16px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  <div style={{ fontSize: '13px', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    MILESTONE #{msIndex + 1}
                  </div>
                  <div style={{ fontSize: '15px', marginTop: '4px' }}>
                    {milestone.name || `Milestone ${msIndex + 1}`}
                  </div>
                  <div style={{ fontSize: '13px', marginTop: '6px', opacity: 0.85 }}>
                    Budget: ${parseFloat(milestone.budget || 0).toLocaleString()}
                  </div>
                </div>

                {/* Contractors & Purchases under this milestone */}
                <div style={{ marginTop: '12px' }}>
                  {milestoneContractors.length > 0 ? (
                    milestoneContractors.map((contractor, conIndex) => (
                      <div key={conIndex} style={{
                        background: '#334155',
                        borderRadius: '8px',
                        padding: '12px',
                        marginBottom: '12px',
                        borderLeft: '4px solid #22c55e'
                      }}>
                        <div style={{ fontWeight: '600', fontSize: '14px', color: '#86efac' }}>
                          {contractor.name || `Contractor ${conIndex + 1}`}
                        </div>
{/*  
                        <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '2px' }}>
                          Budget: ${parseFloat(contractor.budget || 0).toLocaleString()}
                        </div>
*/}
                        {/* Purchases tagged to this milestone */}
                        <div style={{ marginTop: '10px' }}>
                          {contractor.purchases && contractor.purchases
                            .filter(p => p.milestone === milestone.name)
                            .map((purchase, purIndex) => (
                            <div key={purIndex} style={{
                              background: '#1e2937',
                              borderRadius: '6px',
                              padding: '8px 12px',
                              marginTop: '6px',
                              fontSize: '13px',
                              border: '1px solid #475569'
                            }}>
                              <div style={{ fontWeight: '500' }}>{purchase.description || `Purchase ${purIndex + 1}`}</div>
                              <div style={{ color: '#a3e635', fontSize: '12px', marginTop: '2px' }}>
                                ${parseFloat(purchase.amount || 0).toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      color: '#64748b',
                      fontStyle: 'italic',
                      fontSize: '13px',
                      padding: '20px 10px',
                      border: '2px dashed #475569',
                      borderRadius: '8px'
                    }}>
                      No purchases tagged to this milestone yet
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {(!currentProject.milestones || currentProject.milestones.length === 0) && (
          <div style={{
            textAlign: 'center',
            color: '#64748b',
            padding: '40px 20px',
            fontStyle: 'italic',
            border: '2px dashed #475569',
            borderRadius: '12px',
            background: '#1e2937'
          }}>
            Add at least one Milestone and tag Purchases to Milestones (via the "Tag to Milestone" dropdown) to build the full project hierarchy diagram.
          </div>
        )}

        <div style={{
          textAlign: 'center',
          marginTop: '30px',
          fontSize: '12px',
          color: '#64748b',
          fontStyle: 'italic'
        }}>
{/*
          Live Project Hierarchy Diagram • Updates instantly as you edit the form
 */}
        </div>
        </div>
      </div>
    );
  }


  renderContractorAmendmentApproverView() {
    const { currentProject, currentUser, pendingAmendmentDrafts, recipients } = this.state;

    // Show only the single draft that was linked from the inbox
    const draft = pendingAmendmentDrafts[0];
    if (!draft) {
      return (
        <div className="container">
          <div className="alert alert-info mt-4">No contractor amendment drafts pending your approval for this project.</div>
          <Link to="/dtscf"><button type="button" className="btn btn-secondary me-2">Back to List</button></Link>
        </div>
      );
    }

    const newItemStyle = { background: '#f0fdf4', border: '2px solid #16a34a' };
    const newBadge = <span className="badge ms-1" style={{ background: '#16a34a', color: 'white' }}>NEW</span>;

    // Recursive helper: renders a contractor entry at any depth (purchases + sub-contractors)
    const renderDraftEntry = (con, depth) => {
      const depthColors    = ['#7c3aed', '#0ea5e9', '#10b981', '#f59e0b'];
      const depthHeaderBgs = ['#5b21b6', '#0369a1', '#065f46', '#92400e'];
      const borderColor = depthColors[Math.min(depth, depthColors.length - 1)];
      const headerBg    = depthHeaderBgs[Math.min(depth, depthHeaderBgs.length - 1)];
      const depthLabel  = depth === 0 ? 'Submitted Section' : 'Sub-Contractor';
      const indentStyle = depth > 0 ? { marginLeft: `${depth * 16}px` } : {};
      return (
        <div key={`${con.id || con.name}-${depth}`} className="card mb-3"
          style={{ border: `2px solid ${borderColor}`, ...indentStyle }}>
          <div className="card-header" style={{ background: headerBg, color: 'white' }}>
            <h5 style={{ marginBottom: 0 }}>
              {depthLabel}: {con.name}
              {con.is_new && newBadge}
            </h5>
          </div>
          <div className="card-body">
            <p><strong>Wallet:</strong> <code>{con.walletaddress || '—'}</code></p>
            {/* Purchases */}
            <div className="mb-4">
              <h6 className="border-bottom pb-2">Purchases</h6>
              {(!con.dtscf_purchases_drafts || con.dtscf_purchases_drafts.length === 0) && (
                <p className="text-muted fst-italic">No purchases submitted.</p>
              )}
              {(con.dtscf_purchases_drafts || []).map((pur, purIndex) => {
                const isNew = pur.is_new === true;
                return (
                  <div key={purIndex} className={`rounded p-3 mb-2${isNew ? '' : ' border'}`}
                    style={isNew ? newItemStyle : { background: '#f8fafc' }}>
                    <div className="row g-2">
                      <div className="col-md-5">
                        <label className="form-label form-label-sm">Description {isNew && newBadge}</label>
                        <input type="text" className="form-control form-control-sm" disabled value={pur.description} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label form-label-sm">Milestone</label>
                        <input type="text" className="form-control form-control-sm" disabled
                          value={getMsName(pur.dtscf_milestone_id)} />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label form-label-sm">Amount</label>
                        <input type="number" className="form-control form-control-sm" disabled value={pur.amount} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Sub-contractors (recursive) */}
            {(con.subcontractors || []).length > 0 && (
              <div>
                <h6 className="border-bottom pb-2">Sub-Contractors</h6>
                {(con.subcontractors || []).map(sub => renderDraftEntry(sub, depth + 1))}
              </div>
            )}
          </div>
        </div>
      );
    };

    // Map draft milestone ID → name using data returned from server
    const draftMsMap = {};
    (draft.draftMilestones || []).forEach(m => { draftMsMap[m.id] = m.name; });
    const getMsName = (draftMsId) => draftMsMap[draftMsId] || (draftMsId ? `MS #${draftMsId}` : '—');

    return (
      <div className="container">
        <header className="jumbotron col-md-10" style={{
          background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
          color: 'white', padding: '20px 30px', borderRadius: '12px',
          marginBottom: '25px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)',
          border: '2px solid #a78bfa'
        }}>
          <h3><strong>DTSCF Project — Contractor Amendment Approval</strong></h3>
          <p style={{ marginBottom: 0, opacity: 0.9 }}>
            Logged in as: <strong>{currentUser.username}</strong> &nbsp;|&nbsp;
            Project: <strong>{currentProject.name}</strong>
          </p>
        </header>

        <div className="alert alert-warning py-2">
          <strong>Read-only review.</strong> Draft #{draft.id} submitted by <strong>{draft.actionby}</strong>.
          Items highlighted in <span style={{ color: '#16a34a', fontWeight: 'bold' }}>green</span> are newly added.
        </div>

        {/* ── Project Overview (same as contractor view) ── */}
        <div className="card mb-4" style={{ border: '1px solid #3b82f6' }}>
          <div className="card-header" style={{ background: '#1e40af', color: 'white' }}>
            <h5 style={{ marginBottom: 0 }}>Project Overview</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <p><strong>Anchor:</strong> {recipients?.name || '—'}</p>
                <p><strong>Project Name:</strong> {currentProject.name}</p>
                <p><strong>Description:</strong> {currentProject.description || '—'}</p>
                <p><strong>Smart Contract Address:</strong> {currentProject.smartcontractaddress || '—'}</p>
              </div>
              <div className="col-md-6">
                <p><strong>Start Date:</strong> {currentProject.startdate}</p>
                <p><strong>End Date:</strong> {currentProject.enddate}</p>
                <p><strong>Project ID:</strong> {currentProject.id}</p>
              </div>
            </div>
            {currentProject.milestones && currentProject.milestones.length > 0 && (
              <>
                <h6 className="mt-2 border-top pt-2">Milestones</h6>
                <table className="table table-sm table-bordered">
                  <thead className="table-dark">
                    <tr><th>#</th><th>Name</th><th>Start</th><th>End</th></tr>
                  </thead>
                  <tbody>
                    {currentProject.milestones.map((ms, i) => (
                      <tr key={i}><td>{i+1}</td><td>{ms.name}</td><td>{ms.startdate}</td><td>{ms.enddate}</td></tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>

        {/* ── Submitted contractor sections — one card per top-level draft entry ── */}
        {(draft.contractors || []).length === 0 ? (
          <div className="alert alert-warning">No contractor data found in this draft.</div>
        ) : (
          (draft.contractors || []).map((con, idx) => renderDraftEntry(con, 0))
        )}

        {/* ── Approver action panel ── */}
        <div className="card mb-4" style={{ border: '2px solid #7c3aed' }}>
          <div className="card-header" style={{ background: '#5b21b6', color: 'white' }}>
            <h5 style={{ marginBottom: 0 }}>Approver Action</h5>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label fw-bold">Assigned Approver</label>
              <select className="form-control" disabled value={currentUser.id}>
                <option value={currentUser.id}>{currentUser.username}</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">
                Approver Comments <span className="text-danger">* required to Reject</span>
              </label>
              <textarea className="form-control" rows={3}
                value={this.state.pendingApproverComments || ''}
                onChange={e => this.setState({ pendingApproverComments: e.target.value })}
                placeholder="Enter comments (mandatory before rejecting, optional for approval)" />
            </div>

            {draft.status === 2 ? (
              <>
                <button type="button" className="btn btn-success me-2"
                  disabled={this.state.isLoading}
                  onClick={() => this.approveContractorAmendment(draft.id)}>
                  {this.state.isLoading ? 'Processing…' : 'Approve and deploy'}
                </button>&nbsp;&nbsp;
                <button type="button" className="btn btn-danger me-2"
                  disabled={this.state.isLoading || !(this.state.pendingApproverComments || '').trim()}
                  title={!(this.state.pendingApproverComments || '').trim() ? 'Please enter comments before rejecting' : ''}
                  onClick={() => this.rejectContractorAmendment(draft.id)}>
                  Reject
                </button>&nbsp;&nbsp;
              </>
            ) : (
              <div className="alert alert-secondary py-2 mb-0">This amendment has already been processed.</div>
            )}
            <Link to="/inbox">
              <button type="button" className="btn btn-secondary me-2 ms-2">Back to Inbox</button>
            </Link>
          </div>
        </div>

        {this.state.isLoading ? <LoadingSpinner /> : null}
        <Modal showm={this.state.showm} handleProceed1={null} handleCancel={this.hideModal}
          handleProceed2={null} button1text={null} button2text={null} button0text={this.state.button0text}>
          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '1rem' }}>{this.state.modalmsg}</pre>
        </Modal>

      <br />
      <br />
      </div>
    );
  }

  renderContractorView() {
    const { currentProject, currentUser, recipients, isAnchor } = this.state;
    const myBranches = this.getMyContractorBranches();

    // Read-only / status banner (applies globally to all branches)
    const { inFlightAmendment } = this.state;
    let isReadOnly = this.state.isApprover; // Approvers can never edit
    let statusBanner = null;
    if (inFlightAmendment) {
      if (inFlightAmendment.status === 2) {
        isReadOnly = true;
        if (inFlightAmendment.maker !== currentUser.id) {
          statusBanner = (
            <div className="alert alert-info mb-4" style={{ border: '2px solid #0ea5e9', borderRadius: '8px', padding: '16px 20px' }}>
              <h5 style={{ color: '#0c4a6e', marginBottom: '8px' }}>&#9432; Amendment Pending Approval</h5>
              <p style={{ color: '#075985', marginBottom: 0 }}>An amendment for this project is pending approval. No changes can be made at this time.</p>
            </div>
          );
        }
      } else if (inFlightAmendment.status === 3) {
        isReadOnly = true;
      } else if (inFlightAmendment.status === -1) {
        if (inFlightAmendment.maker === currentUser.id) {
          statusBanner = (
            <div className="alert mb-4" style={{ background: '#fef3c7', border: '2px solid #d97706', borderRadius: '8px', padding: '16px 20px' }}>
              <h5 style={{ color: '#92400e', marginBottom: '8px' }}>&#9888; Amendment Rejected</h5>
              <p style={{ color: '#78350f', marginBottom: '4px' }}>Your previous amendment was rejected. Please review the comments, make any necessary changes, and resubmit.</p>
              {inFlightAmendment.approverComments && (
                <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '4px', padding: '8px 12px', marginTop: '8px' }}>
                  <strong style={{ color: '#92400e' }}>Approver Comments:</strong>
                  <p style={{ color: '#78350f', marginBottom: 0, marginTop: '4px' }}>{inFlightAmendment.approverComments}</p>
                </div>
              )}
            </div>
          );
        } else {
          isReadOnly = true;
          statusBanner = (
            <div className="alert alert-secondary mb-4" style={{ border: '2px solid #94a3b8', borderRadius: '8px', padding: '16px 20px' }}>
              <h5 style={{ color: '#374151', marginBottom: '8px' }}>Amendment Under Revision</h5>
              <p style={{ color: '#4b5563', marginBottom: 0 }}>This amendment was rejected and is awaiting revision from the maker. No changes can be made at this time.</p>
            </div>
          );
        }
      }
    }

    // Build org IDs that the current user should never see in any sub-contractor dropdown
    // (the user's own org, plus any org that is an ancestor in any branch)
    const globalExcludedOrgIds = new Set();
    if (currentUser.organisation_id) globalExcludedOrgIds.add(parseInt(currentUser.organisation_id));
    myBranches.forEach(b => { if (b.parentOrgId) globalExcludedOrgIds.add(parseInt(b.parentOrgId)); });

    // ── Helper: render a purchases list for any contractor entry ─────────────
    const renderPurchasesList = (purchases, lockedMilestone, onChangDesc, onChangeMilestone, onChangeAmt, onRemove, onAdd) => (
      <div className="mb-4">
        <h6 className="border-bottom pb-2">
          Purchases
          {lockedMilestone && <small className="text-muted ms-2 fw-normal">(milestone locked to <strong>{lockedMilestone}</strong>)</small>}
        </h6>
        {(!purchases || purchases.length === 0) && <p className="text-muted fst-italic">No purchases yet.</p>}
        {(purchases || []).map((pur, purIndex) => (
          <div key={purIndex} className={`rounded p-3 mb-2${pur._isNew ? '' : ' border'}`}
            style={pur._isNew ? { background: '#f0fdf4', border: '2px solid #16a34a' } : { background: '#f8fafc' }}>
            {!pur._isNew && <small className="text-muted d-block mb-1">&#128274; Deployed — read only</small>}
            <div className="row g-2">
              <div className="col-md-5">
                <label className="form-label form-label-sm">Description</label>
                <input type="text" className="form-control form-control-sm"
                  value={pur.description} readOnly={!pur._isNew}
                  style={!pur._isNew ? { background: '#e9ecef' } : {}}
                  onChange={e => pur._isNew && onChangDesc(purIndex, e.target.value)}
                  placeholder="Description" />
              </div>
              <div className="col-md-4">
                <label className="form-label form-label-sm">Milestone</label>
                {pur._isNew
                  ? <select className="form-control form-control-sm"
                      value={pur.milestone || ''}
                      onChange={e => onChangeMilestone(purIndex, e.target.value)}>
                      <option value="">-- Milestone --</option>
                      {(currentProject.milestones || [])
                        .filter(ms => !lockedMilestone || ms.name === lockedMilestone)
                        .map((ms, i) => <option key={i} value={ms.name}>{ms.name}</option>)}
                    </select>
                  : <input type="text" className="form-control form-control-sm"
                      value={pur.milestone || ''} readOnly
                      style={{ background: '#e9ecef' }} />
                }
              </div>
              <div className="col-md-2">
                <label className="form-label form-label-sm">Amount</label>
                <input type="number" className="form-control form-control-sm"
                  value={pur.amount} readOnly={!pur._isNew}
                  style={!pur._isNew ? { background: '#e9ecef' } : {}}
                  onChange={e => pur._isNew && onChangeAmt(purIndex, e.target.value)} />
              </div>
              <div className="col-md-1 d-flex align-items-end">
                {pur._isNew && <button type="button" className="btn btn-sm btn-danger" onClick={() => onRemove(purIndex)}>✕</button>}
              </div>
            </div>
          </div>
        ))}
        {!isReadOnly && <button type="button" className="btn btn-sm btn-primary mt-1 me-2" onClick={onAdd}>+ Add Purchase</button>}
      </div>
    );

    // ── Helper: render one sub-contractor entry inside a branch ───────────────
    const renderSubEntry = (sub, subIndex, lockedMilestone, excludedOrgIds, onChangeSubField, onChangePur, onChangePurMilestone, onChangePurAmt, onRemovePur, onAddPur, onRemoveSub, subSubSection) => (
      <div key={subIndex} className={`rounded p-3 mb-3${sub._isNew ? '' : ' border'}`}
        style={sub._isNew
          ? { background: '#f0fdf4', border: '2px solid #16a34a', borderLeft: '4px solid #16a34a' }
          : { background: '#f8fafc', borderLeft: '4px solid #64748b' }}>
        {!sub._isNew && <small className="text-muted d-block mb-1">&#128274; Deployed — sub-contractor details read only</small>}
        <div className="row g-2 mb-2">
          <div className="col-md-5">
            <label className="form-label form-label-sm">Name</label>
            {sub._isNew ? (
              <select className="form-control form-control-sm"
                value={sub.organisation_id || ''}
                onChange={e => {
                  const org = this.state.contractorOrgList.find(o => o.id === parseInt(e.target.value));
                  onChangeSubField(subIndex, org);
                }}>
                <option value="">-- Select Sub-Contractor --</option>
                {this.state.contractorOrgList
                  .filter(org => !excludedOrgIds.has(org.id))
                  .map((org, i) => <option key={i} value={org.id}>{org.name}</option>)}
              </select>
            ) : (
              <input type="text" className="form-control form-control-sm" value={sub.name || ''} readOnly style={{ background: '#e9ecef' }} />
            )}
          </div>
          <div className="col-md-7">
            <label className="form-label form-label-sm">Wallet Address</label>
            <input type="text" className="form-control form-control-sm"
              value={sub.walletaddress || ''} readOnly style={{ background: '#e9ecef' }}
              placeholder="Auto-filled from selection" />
          </div>
        </div>
        <div className="ms-2">
          <label className="form-label form-label-sm fw-bold">Purchases</label>
          {(sub.purchases || []).map((pur, purIndex) => {
            const purEditable = sub._isNew || pur._isNew;
            return (
              <div key={purIndex} className={`rounded p-2 mb-1${purEditable ? '' : ' border'}`}
                style={purEditable ? { background: '#f0fdf4', border: '2px solid #16a34a' } : { background: '#fff' }}>
                {!purEditable && <small className="text-muted d-block" style={{fontSize:'0.7rem'}}>&#128274; Deployed</small>}
                <div className="row g-1">
                  <div className="col-md-5">
                    <input type="text" className="form-control form-control-sm"
                      value={pur.description} readOnly={!purEditable}
                      style={!purEditable ? { background: '#e9ecef' } : {}}
                      onChange={e => purEditable && onChangePur(subIndex, purIndex, 'description', e.target.value)}
                      placeholder="Description" />
                  </div>
                  <div className="col-md-3">
                    {purEditable
                      ? <select className="form-control form-control-sm"
                          value={pur.milestone || ''}
                          onChange={e => onChangePurMilestone(subIndex, purIndex, e.target.value)}>
                          <option value="">-- Milestone --</option>
                          {(currentProject.milestones || [])
                            .filter(ms => !lockedMilestone || ms.name === lockedMilestone)
                            .map((ms, i) => <option key={i} value={ms.name}>{ms.name}</option>)}
                        </select>
                      : <input type="text" className="form-control form-control-sm"
                          value={pur.milestone || ''} readOnly
                          style={{ background: '#e9ecef' }} />
                    }
                  </div>
                  <div className="col-md-3">
                    <input type="number" className="form-control form-control-sm"
                      value={pur.amount} readOnly={!purEditable}
                      style={!purEditable ? { background: '#e9ecef' } : {}}
                      onChange={e => purEditable && onChangePurAmt(subIndex, purIndex, e.target.value)}
                      placeholder="Amount" />
                  </div>
                  <div className="col-md-1">
                    {purEditable && <button type="button" className="btn btn-sm btn-danger" onClick={() => onRemovePur(subIndex, purIndex)}>✕</button>}
                  </div>
                </div>
              </div>
            );
          })}
          {!isReadOnly && <button type="button" className="btn btn-sm btn-outline-primary mt-1 me-2"
            onClick={() => onAddPur(subIndex, lockedMilestone || '')}>+ Add Purchase</button>}
        </div>
        {subSubSection}
        {sub._isNew && !isReadOnly && (
          <button type="button" className="btn btn-sm btn-danger mt-2 me-2"
            onClick={() => onRemoveSub(subIndex)}>Remove Sub-Contractor</button>
        )}
      </div>
    );

    // ── Render a single branch card ───────────────────────────────────────────
    const renderBranchCard = (branch, branchIdx) => {
      const { con, milestone: lockedMilestone, type, conIndex, subIndex, parentName, path, parentChain } = branch;

      // Depth > 2: state handlers only support up to depth 2, so always show read-only
      if (path && path.length > 2) {
        const parentEntry = parentChain && parentChain.length > 0 ? parentChain[parentChain.length - 1] : null;
        const deepLabel = parentEntry
          ? `My Section under ${parentEntry.name}${lockedMilestone ? ` — ${lockedMilestone}` : ''}`
          : `My Section`;
        const renderSubPurchasesTable = (purchases) =>
          (!purchases || purchases.length === 0)
            ? <p className="text-muted fst-italic small">No purchases.</p>
            : <table className="table table-sm table-bordered mb-0">
                <thead className="table-light"><tr><th>Purchase</th><th>Milestone</th><th>Amount</th></tr></thead>
                <tbody>
                  {purchases.map((p, pi) => (
                    <tr key={pi}><td>{p.description}</td><td>{p.milestone}</td><td>{p.amount}</td></tr>
                  ))}
                </tbody>
              </table>;
        return (
          <div key={branchIdx} className="card mb-4" style={{ border: '2px solid #7c3aed' }}>
            <div className="card-header" style={{ background: '#5b21b6', color: 'white' }}>
              <h5 style={{ marginBottom: 0 }}>{deepLabel}</h5>
            </div>
            <div className="card-body">
              <p><strong>Wallet:</strong> <code>{con.walletaddress || '—'}</code></p>
              <h6 className="border-bottom pb-2">
                Purchases
                {lockedMilestone && <small className="text-muted ms-2 fw-normal">(milestone: <strong>{lockedMilestone}</strong>)</small>}
              </h6>
              {renderSubPurchasesTable(con.purchases)}
              {(con.subcontractors || []).length > 0 && (
                <div className="mt-3">
                  <h6 className="border-bottom pb-2">My Sub-Contractors</h6>
                  {(con.subcontractors || []).map((ssub, ssi) => (
                    <div key={ssi} className="ms-3 mb-3 p-3 rounded" style={{ background: '#f5f3ff', borderLeft: '4px solid #7c3aed' }}>
                      <p className="mb-1"><strong>{ssub.name}</strong></p>
                      <p className="mb-2"><small><strong>Wallet:</strong> <code>{ssub.walletaddress || '—'}</code></small></p>
                      {renderSubPurchasesTable(ssub.purchases)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      }

      // Org IDs excluded from sub-contractor dropdown for this branch
      const branchExcludedOrgIds = new Set(globalExcludedOrgIds);
      if (branch.parentOrgId) branchExcludedOrgIds.add(parseInt(branch.parentOrgId));

      const isTopLevel = type === 'top-level';
      const headerLabel = isTopLevel
        ? `My Section: ${con.name}`
        : `My Section under ${parentName} — ${lockedMilestone || 'Milestone N/A'}`;
      const headerBg = isTopLevel ? '#15803d' : '#0e7490';
      const borderColor = isTopLevel ? '#16a34a' : '#06b6d4';

      if (isTopLevel) {
        // ── Top-level branch: use onChangePurchase / addSubContractor handlers ──
        return (
          <div key={branchIdx} className="card mb-4" style={{ border: `2px solid ${borderColor}` }}>
            <div className="card-header" style={{ background: headerBg, color: 'white' }}>
              <h5 style={{ marginBottom: 0 }}>{headerLabel}</h5>
            </div>
            <div className="card-body">
              <p><strong>Wallet:</strong> <code>{con.walletaddress || '—'}</code></p>
              <fieldset disabled={isReadOnly} style={{ border: 'none', padding: 0, margin: 0 }}>
                {renderPurchasesList(
                  con.purchases, lockedMilestone,
                  (purIdx, val) => this.onChangePurchase(conIndex, purIdx, val),
                  (purIdx, val) => this.onChangePurchaseMilestone(conIndex, purIdx, val),
                  (purIdx, val) => this.onChangePurchaseAmount(conIndex, purIdx, val),
                  (purIdx) => this.removePurchase(conIndex, purIdx),
                  () => this.addPurchase(conIndex, lockedMilestone || '')
                )}
                <div>
                  <h6 className="border-bottom pb-2">My Sub-Contractors</h6>
                  {(!con.subcontractors || con.subcontractors.length === 0) && <p className="text-muted fst-italic">No sub-contractors yet.</p>}
                  {(con.subcontractors || []).map((sub, si) =>
                    renderSubEntry(
                      sub, si, lockedMilestone, branchExcludedOrgIds,
                      (si2, org) => this.setState(prev => {
                        const contractors = prev.currentProject.contractors.map((c, ci) => {
                          if (ci !== conIndex) return c;
                          return { ...c, subcontractors: (c.subcontractors || []).map((s, ssi) => ssi !== si2 ? s : org ? { ...s, organisation_id: org.id, name: org.name, walletaddress: org.walletaddress || '' } : { ...s, organisation_id: null, name: '', walletaddress: '' }) };
                        });
                        return { currentProject: { ...prev.currentProject, contractors }, datachanged: true };
                      }),
                      (si2, pi, field, val) => this.onChangeSubContractorPurchase(conIndex, si2, pi, field, val),
                      (si2, pi, val) => this.onChangeSubContractorPurchase(conIndex, si2, pi, 'milestone', val),
                      (si2, pi, val) => this.onChangeSubContractorPurchase(conIndex, si2, pi, 'amount', val),
                      (si2, pi) => this.removeSubContractorPurchase(conIndex, si2, pi),
                      (si2, ml) => this.addSubContractorPurchase(conIndex, si2, ml),
                      (si2) => this.removeSubContractor(conIndex, si2),
                      null
                    )
                  )}
                  {!isReadOnly && <button type="button" className="btn btn-sm btn-success me-2"
                    onClick={() => this.addSubContractor(conIndex)}>+ Add Sub-Contractor</button>}
                </div>
              </fieldset>
            </div>
          </div>
        );
      } else {
        // ── Sub-contractor branch: editing con = contractors[conIndex].subcontractors[subIndex] ──
        // Purchases use onChangeSubContractorPurchase; sub-sub-contractors use the new handlers.
        const subExcludedOrgIds = new Set(branchExcludedOrgIds);
        // Also exclude any org that is already a sub-sub-contractor in this branch (prevent duplicates)
        (con.subcontractors || []).forEach(ssub => { if (ssub.organisation_id) subExcludedOrgIds.add(parseInt(ssub.organisation_id)); });

        return (
          <div key={branchIdx} className="card mb-4" style={{ border: `2px solid ${borderColor}` }}>
            <div className="card-header" style={{ background: headerBg, color: 'white' }}>
              <h5 style={{ marginBottom: 0 }}>{headerLabel}</h5>
            </div>
            <div className="card-body">
              <p><strong>Wallet:</strong> <code>{con.walletaddress || '—'}</code></p>
              <fieldset disabled={isReadOnly} style={{ border: 'none', padding: 0, margin: 0 }}>
                {renderPurchasesList(
                  con.purchases, lockedMilestone,
                  (purIdx, val) => this.onChangeSubContractorPurchase(conIndex, subIndex, purIdx, 'description', val),
                  (purIdx, val) => this.onChangeSubContractorPurchase(conIndex, subIndex, purIdx, 'milestone', val),
                  (purIdx, val) => this.onChangeSubContractorPurchase(conIndex, subIndex, purIdx, 'amount', val),
                  (purIdx) => this.removeSubContractorPurchase(conIndex, subIndex, purIdx),
                  () => this.addSubContractorPurchase(conIndex, subIndex, lockedMilestone || '')
                )}
                <div>
                  <h6 className="border-bottom pb-2">My Sub-Contractors</h6>
                  {(!con.subcontractors || con.subcontractors.length === 0) && <p className="text-muted fst-italic">No sub-contractors yet.</p>}
                  {(con.subcontractors || []).map((ssub, ssi) =>
                    renderSubEntry(
                      ssub, ssi, lockedMilestone, subExcludedOrgIds,
                      (ssi2, org) => this.setState(prev => {
                        const contractors = prev.currentProject.contractors.map((c, ci) => {
                          if (ci !== conIndex) return c;
                          return { ...c, subcontractors: (c.subcontractors || []).map((s, si2) => {
                            if (si2 !== subIndex) return s;
                            return { ...s, subcontractors: (s.subcontractors || []).map((ss, ssii) => ssii !== ssi2 ? ss : org ? { ...ss, organisation_id: org.id, name: org.name, walletaddress: org.walletaddress || '' } : { ...ss, organisation_id: null, name: '', walletaddress: '' }) };
                          }) };
                        });
                        return { currentProject: { ...prev.currentProject, contractors }, datachanged: true };
                      }),
                      (ssi2, pi, field, val) => this.onChangeSubSubContractorPurchase(conIndex, subIndex, ssi2, pi, field, val),
                      (ssi2, pi, val) => this.onChangeSubSubContractorPurchase(conIndex, subIndex, ssi2, pi, 'milestone', val),
                      (ssi2, pi, val) => this.onChangeSubSubContractorPurchase(conIndex, subIndex, ssi2, pi, 'amount', val),
                      (ssi2, pi) => this.removeSubSubContractorPurchase(conIndex, subIndex, ssi2, pi),
                      (ssi2, ml) => this.addSubSubContractorPurchase(conIndex, subIndex, ssi2, ml),
                      (ssi2) => this.removeSubSubContractor(conIndex, subIndex, ssi2),
                      null
                    )
                  )}
                  {!isReadOnly && <button type="button" className="btn btn-sm btn-success me-2"
                    onClick={() => this.addSubSubContractor(conIndex, subIndex)}>+ Add Sub-Contractor</button>}
                </div>
              </fieldset>
            </div>
          </div>
        );
      }
    };

    return (
      <div className="container">
        <header className="jumbotron col-md-10" style={{
          background: 'linear-gradient(135deg, #16a34a, #15803d)',
          color: 'white', padding: '20px 30px', borderRadius: '12px',
          marginBottom: '25px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)',
          border: '2px solid #4ade80'
        }}>
          <h3><strong>DTSCF Project — Contractor View</strong></h3>
          <p style={{ marginBottom: 0, opacity: 0.9 }}>Logged in as: <strong>{currentUser.username}</strong></p>
        </header>

        {/* ── Project Overview (read-only) ── */}
        <div className="card mb-4" style={{ border: '1px solid #3b82f6' }}>
          <div className="card-header" style={{ background: '#1e40af', color: 'white' }}>
            <h5 style={{ marginBottom: 0 }}>Project Overview</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <p><strong>Anchor:</strong> {recipients?.name || '—'}</p>
                <p><strong>Project Name:</strong> {currentProject.name}</p>
                <p><strong>Description:</strong> {currentProject.description || '—'}</p>
                <p><strong>Smart Contract Address:</strong> {currentProject.smartcontractaddress || '—'}</p>
              </div>
              <div className="col-md-6">
                <p><strong>Start Date:</strong> {currentProject.startdate}</p>
                <p><strong>End Date:</strong> {currentProject.enddate}</p>
                <p><strong>Project ID:</strong> {currentProject.id}</p>
              </div>
            </div>
            {currentProject.milestones && currentProject.milestones.length > 0 && (
              <>
                <h6 className="mt-2 border-top pt-2">Milestones</h6>
                <table className="table table-sm table-bordered">
                  <thead className="table-dark">
                    <tr><th>#</th><th>Name</th><th>Start</th><th>End</th></tr>
                  </thead>
                  <tbody>
                    {currentProject.milestones.map((ms, i) => (
                      <tr key={i}><td>{i+1}</td><td>{ms.name}</td><td>{ms.startdate}</td><td>{ms.enddate}</td></tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>

        {statusBanner}

        {/* ── One card per branch (role-filtered) ── */}
        {isAnchor
          ? /* Anchor view: all top-level contractors, their purchases only (no sub-contractors) */
            (currentProject.contractors || []).length === 0
              ? <div className="alert alert-info">No contractors have been added to this project yet.</div>
              : (currentProject.contractors || []).map((con, ci) => (
                  <div key={ci} className="card mb-4" style={{ border: '2px solid #2563eb' }}>
                    <div className="card-header" style={{ background: '#1d4ed8', color: 'white' }}>
                      <h5 style={{ marginBottom: 0 }}>{con.name}</h5>
                    </div>
                    <div className="card-body">
                      <p><strong>Wallet:</strong> <code>{con.walletaddress || '—'}</code></p>
                      {(!con.purchases || con.purchases.length === 0)
                        ? <p className="text-muted fst-italic">No purchases.</p>
                        : <table className="table table-sm table-bordered mb-0">
                            <thead className="table-light">
                              <tr><th>Purchase</th><th>Milestone</th><th>Amount</th></tr>
                            </thead>
                            <tbody>
                              {(con.purchases || []).map((p, pi) => (
                                <tr key={pi}>
                                  <td>{p.description}</td>
                                  <td>{p.milestone}</td>
                                  <td>{p.amount}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                      }
                    </div>
                  </div>
                ))
          : myBranches.length > 0
            ? myBranches.map((branch, branchIdx) => renderBranchCard(branch, branchIdx))
            : <div className="alert alert-warning"><strong>No matching contractor found.</strong> Your organisation ID ({currentUser.organisation_id || 'not set'}) does not match any contractor in this project.</div>
        }

        {/* ── Submit / Cancel (shared across all branches) ── */}
        {isReadOnly ? (
          <div className="mt-2 mb-4">
            <Link to="/inbox"><button type="button" className="btn btn-secondary me-2">Back to Inbox</button></Link>
          </div>
        ) : (
          <div className="card mb-4" style={{ border: '1px solid #64748b' }}>
            <div className="card-body">
              {this.state.myPendingDraftId && (
                <div className="alert alert-info py-2 mb-3">
                  A previous amendment is pending approval (Draft ID: {this.state.myPendingDraftId}). Submitting again will create a new draft.
                </div>
              )}
              <div className="mb-3">
                <label className="form-label fw-bold">Select Approver <small className="text-muted">(must be from your organisation)</small></label>
                <select className="form-control"
                  value={this.state.selectedOrgApprover || ''}
                  onChange={e => this.setState({ selectedOrgApprover: e.target.value })}>
                  <option value="">-- Select Approver --</option>
                  {(this.state.orgApproverList || [])
                    .filter(u => u.id !== currentUser.id)
                    .map((u, i) => <option key={i} value={u.id}>{u.username}</option>)}
                </select>
                {this.state.orgApproverList && this.state.orgApproverList.length === 0 && (
                  <small className="text-danger">No approvers found in your organisation.</small>
                )}
              </div>
              <button type="button" className="btn btn-primary me-2"
                onClick={() => this.submitContractorAmendment()}
                disabled={this.state.isLoading || !this.state.selectedOrgApprover}>
                {this.state.isLoading ? 'Submitting…' : 'Submit for Approval'}
              </button>
              <Link to="/dtscf" style={{ marginLeft: '8px' }}>
                <button type="button" className="btn btn-secondary">Cancel</button>
              </Link>
            </div>
          </div>
        )}

        {this.state.isLoading ? <LoadingSpinner /> : null}
        <Modal showm={this.state.showm} handleProceed1={null} handleCancel={this.hideModal}
          handleProceed2={null} button1text={null} button2text={null} button0text={this.state.button0text}>
          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '1rem' }}>{this.state.modalmsg}</pre>
        </Modal>

      <br />
      <br />
      </div>
    );
  }

  render() {

    if (this.state.redirect) {
      return <Navigate to={this.state.redirect} replace />;
    }

    const { underlyingDSGDList, currentProject, isNewProject, isLoading, isAnchor, isContractor, isMaker, isApprover, userReady,
      //      checkerList,
      approverList } = this.state;
    console.log("currentProject: ", currentProject);

    // Approver check takes priority: if user is the designated approver for a pending draft,
    // If user is an approver, wait for draft data before deciding what to show.
    // This prevents the contractor view from flashing briefly while the draft API call is in flight.
    if (isApprover && !this.state.pendingAmendmentDraftsLoaded) {
      return <div className="container mt-4"><div className="d-flex align-items-center gap-2"><div className="spinner-border spinner-border-sm text-secondary" role="status" />&nbsp;<span>Loading ...</span></div></div>;
    }

    if (currentProject.id !== 0 && isApprover && this.state.pendingAmendmentDrafts.length > 0) {
      return this.renderContractorAmendmentApproverView();
    }

    // Show contractor view if the user appears in any branch of the contractor tree
    // Anchors always see the anchor main view, even if their org_id happens to match a contractor entry
    if (currentProject.id !== 0 && !this.state.isAnchor && this.getMyContractorBranches().length > 0) {
      return this.renderContractorView();
    }

    // Block contractors not involved in this project
    if (currentProject.id !== 0 && isContractor && !isAnchor && this.getMyContractorBranches().length === 0) {
      return (
        <div className="container mt-4">
          <p className="text-danger">You do not have access to this project.</p>
          <a href="/dashboard"><button type="button" className="btn btn-sm btn-secondary">Back to Dashboard</button></a>
        </div>
      );
    }

    // Anchor main view: hide all edit buttons when the project is already deployed or
    // has an approved contractor amendment (inFlightAmendment.status === 3)
    const { inFlightAmendment } = this.state;
    const mainViewReadOnly = !!(
      currentProject.smartcontractaddress && currentProject.smartcontractaddress.length > 0
    );

    return (
      <div className="container">
        {
          (userReady) ?
            <div>
              <header className="jumbotron col-md-8"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
                  color: 'white',
                  padding: '20px 30px',
                  borderRadius: '12px',
                  marginBottom: '25px',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)',
                  border: '2px solid #60a5fa'
                }}
              >
                <h3>
                  <strong>
                    {this.state.currentProject.txntype === 0 ? "Create " :
                      (this.state.currentProject.txntype === 1 ? "Update " :
                        (this.state.currentProject.txntype === 2 ? "Delete " : null))
                    }Tokenised Payable Project&nbsp;
                    {this.state.isMaker ? "(Maker)" :
                      (
                        //      this.state.isChecker? "(Checker)": 
                        (this.state.isApprover ? "(Approver)" : null)
                      )
                    }</strong>
                </h3>
              </header>

            </div>
            : null
        }

        {/* In-flight amendment notice */}
        {inFlightAmendment && inFlightAmendment.status === 2 && (
          <div className="alert alert-warning mt-2 mb-2" role="alert">
            <strong>Contractor amendment pending approval</strong> — Draft #{inFlightAmendment.id} has been submitted and is awaiting approver review. No new amendments can be submitted until it is approved or rejected.
          </div>
        )}
        <div className="edit-form list-row">
          <h4></h4>
          <div className="row gx-4">

            {/* ==================== LEFT COLUMN: FORM ==================== */}
            <div className="col-lg-7 col-md-12">
              <form autoComplete="off">
                <div className="form-group">
                  {this.state.recipients.id !== null &&
                    <>
                      <label htmlFor="description">Organisation</label>
                      <input
                        type="text"
                        className="form-control"
                        id="id"
                        value={this.state.recipients.name}
                        disabled={true}
                      />
                    </>
                  }
                  {currentProject.id !== 0 &&
                    <>
                      <label htmlFor="description">Project ID</label>
                      <input
                        type="text"
                        className="form-control"
                        id="id"
                        value={currentProject.id}
                        disabled={true}
                      />
                    </>
                  }
                  <label htmlFor="description">Project Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    maxLength="50"
                    value={currentProject.name}
                    onChange={this.onChangeName}
                    disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status <= 0) && this.state.currentProject.id !== 0}
                  />
                  <label htmlFor="description">Project Description</label>
                  <input
                    type="text"
                    className="form-control"
                    id="description"
                    maxLength="255"
                    value={currentProject.description}
                    onChange={this.onChangeDescription}
                    disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status <= 0) && this.state.currentProject.id !== 0}
                  />
                  <label htmlFor="smartcontractaddress">Smart Contract Address</label>
                  <input
                    type="text"
                    className="form-control"
                    id="smartcontractaddress"
                    maxLength="255"
                    value={currentProject.smartcontractaddress}
                    onChange={this.onChangeSmartContractAddress}
                    disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status <= 0) && this.state.currentProject.id !== 0}
                  />
                </div>
{/* Dont display Anchor's budget to contractors
                <div className="form-group">
                  <label htmlFor="totalBudget">Total Budget</label>
                  <input
                    type="number"
                    className="form-control"
                    id="totalBudget"
                    max="1000000000000"
                    value={currentProject.totalBudget}
                    onChange={this.onChangeTotalBudget}
                    disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status <= 0) && this.state.currentProject.id !== 0}
                  />
                </div>
*/}
                {(currentProject && currentProject.smartcontractaddress !== "" && currentProject.smartcontractaddress !== null && currentProject.smartcontractaddress !== 'undefined') &&
                  <div className="form-group">
                    <label htmlFor="smartcontractaddress">Tokenised Payable Address</label>
                    <input
                      type="text"
                      className="form-control"
                      id="name"
                      maxLength="50"
                      value={currentProject.smartcontractaddress}
                      disabled={true}
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
                    value={currentProject.campaign ? currentProject.campaign.underlyingTokenID : (this.state.currentProject.underlyingTokenID || "")}
                    disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status <= 0) && this.state.currentProject.id !== 0}
                  >
                    <option value=""> </option>
                    {
                      Array.isArray(underlyingDSGDList) ?
                        underlyingDSGDList.map((d) => {
                          if (typeof d.id === "number")
                            return <option key={d.id} value={d.id}>{d.tokenname} ({d.name} - {d.smartcontractaddress})</option>
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
                    value={currentProject.campaign ? currentProject.campaign.blockchain : (this.state.currentProject.blockchain || "")}
                    disabled={true}
                  >
                    <option value="">   </option>
                    <option value="80002">Polygon   Testnet Amoy</option>
                    <option value="11155111">Ethereum  Testnet Sepolia</option>
                    <option value="80001" disabled>Polygon   Testnet Mumbai (Deprecated)</option>
                    <option value="43113" disabled>Avalanche Testnet Fuji    (not in use at the moment)</option>
                    <option value="137" disabled>Polygon   Mainnet (not in use at the moment)</option>
                    <option value="1" disabled>Ethereum  Mainnet (not in use at the moment)</option>
                    <option value="43114" disabled>Avalanche Mainnet (not in use at the moment)</option>
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
                    disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status <= 0) && this.state.currentProject.id !== 0}
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
                    disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status <= 0) && this.state.currentProject.id !== 0}
                  />
                </div>
                <br />
                <label htmlFor="milestone">Milestones</label>
                <table style={{ border: '1px solid blue', width: '100%' }}>
                  <tbody><tr>
                    <td style={{ border: '1px solid blue', width: '100%' }}>
                      {currentProject.milestones.map((milestone, index) => (
                        <div key={index}>
                          <label htmlFor="milestone.name">Milestone #{index + 1} Name</label>
                          <div>
                            <input
                              type="text"
                              className="form-control"
                              maxLength="50"
                              value={milestone.name}
                              onChange={(e) => this.onChangeMilestone(index, 'name', e.target.value)}
                              placeholder="Milestone Name"
                              disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status <= 0) && this.state.currentProject.id !== 0}
                            />
                          </div>
{/* Don't display budgets to contractors
                          <label htmlFor="milestone.budget">Budget</label>
                          <div>
                            <input
                              type="number"
                              className="form-control"
                              max="1000000000000"
                              value={milestone.budget}
                              onChange={(e) => this.onChangeMilestone(index, 'budget', e.target.value)}
                              placeholder="Milestone Budget"
                              disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status <= 0) && this.state.currentProject.id !== 0}
                            />
                          </div>
*/}
                          <label htmlFor="milestone.startdate">Start Date</label>
                          <div>
                            <input
                              type="date"
                              className="form-control"
                              value={milestone.startdate}
                              onChange={(e) => this.onChangeMilestone(index, 'startdate', e.target.value)}
                              placeholder="Start Date"
                              disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status <= 0) && this.state.currentProject.id !== 0}
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
                              disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status <= 0) && this.state.currentProject.id !== 0}
                            />
                          </div>

                          <div>
                            {!mainViewReadOnly && (currentProject.status === null || currentProject.status <= 0 || this.state.currentProject.id === 0) &&
                              <button type="button" className="m-3 btn btn-sm btn-danger" onClick={() => this.removeMilestone(index)} disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status <= 0) && this.state.currentProject.id !== 0}>Remove</button>
                            }
                            <br />
                          </div>
                        </div>
                      ))}
                      {!mainViewReadOnly && (currentProject.status === null || currentProject.status <= 0 || this.state.currentProject.id === 0) &&
                        <button type="button" className="m-3 btn btn-sm btn-primary" onClick={this.addMilestone} disabled={!(this.state.currentUser.id === this.state.currentProject.maker && currentProject.status <= 0) && this.state.currentProject.id !== 0}>Add Milestone</button>
                      }
                    </td>
                  </tr></tbody>
                </table>

                <br />
                <label htmlFor="contractors">Contractors</label>
                <table style={{ border: '1px solid blue', width: '100%' }}>
                  <tbody><tr>
                    <td style={{ border: '1px solid blue', width: '100%' }}>
                      {currentProject.contractors && currentProject.contractors.map((contractor, conIndex) => {
                        // canEdit: existing fields editable only on drafts; new amendment contractors always editable
                        const canEdit = contractor._isNew
                          ? true
                          : (this.state.currentUser.id === this.state.currentProject.maker && currentProject.status <= 0) || this.state.currentProject.id === 0;
                        const fieldDisabled = !canEdit && this.state.currentProject.id !== 0;
                        return (
                        <div key={conIndex}>
                          {contractor._isNew && (
                            <div className="alert alert-success py-1 mb-2" style={{ fontSize: '13px' }}>
                              &#10010; New contractor (pending amendment approval)
                            </div>
                          )}
                          {contractor._isNew ? (
                            <>
                              <label htmlFor="contractor.organisation_id">Contractor #{conIndex + 1} Organisation</label>
                              <div>
                                <select
                                  className="form-control"
                                  value={contractor.organisation_id ? parseInt(contractor.organisation_id, 10) : ""}
                                  onChange={(e) => this.onChangeContractorOrg(conIndex, e.target.value)}
                                >
                                  <option value="">-- Select Contractor Organisation --</option>
                                  {this.state.contractorOrgList.map(org => (
                                    <option key={org.id} value={org.id}>{org.name}</option>
                                  ))}
                                </select>
                              </div>
                            </>
                          ) : (
                            <>
                              <label htmlFor="contractor.name">Contractor #{conIndex + 1} Name</label>
                              <div>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={contractor.name}
                                  onChange={(e) => this.onChangeContractor(conIndex, 'name', e.target.value)}
                                  placeholder="Name"
                                  disabled={fieldDisabled}
                                />
                              </div>
                            </>
                          )}
{/* Don't display budgets to contractors
                          <label htmlFor="contractor.budget">Budget</label>
                          <div>
                            <input
                              type="number"
                              className="form-control"
                              value={contractor.budget}
                              onChange={(e) => this.onChangeContractor(conIndex, 'budget', e.target.value)}
                              placeholder="Budget"
                              disabled={fieldDisabled}
                            />
                          </div>
*/}
                  {!contractor._isNew && <><label htmlFor="contractor.id">ID</label>
                  <div>
                    <input
                      type="number"
                      className="form-control"
                      value={contractor.id ?? ""}
                      placeholder="ID"
                      disabled
                    />
                  </div>
                  <label htmlFor="contractor.id">Org ID</label>
                  <div>
                    <input
                      type="number"
                      className="form-control"
                      value={contractor.organisation_id ?? ""}
                      placeholder="OrgID"
                      disabled
                    />
                  </div></>}

                          <label htmlFor="contractor.name">Contractor's Wallet Address</label>
                          <div>
                            <input
                              type="text"
                              className="form-control"
                              value={contractor.walletaddress}
                              onChange={(e) => this.onChangeContractor(conIndex, 'walletaddress', e.target.value)}
                              placeholder="Wallet Address"
                              disabled={fieldDisabled}
                            />
                          </div>

                          <br />
                          <label htmlFor="contractor.name">Purchases</label>
                          <table style={{ border: '2px solid lightblue', width: '100%' }}>
                            <tbody><tr>
                              <td style={{ border: '2px solid lightblue', width: '100%' }}>
                                {contractor.purchases && contractor.purchases.map((purchase, purIndex) => (
                                  <div key={purIndex}>
                                    <label htmlFor="purchase.description">Purchase #{purIndex + 1}</label>
                                    <div>
                                      <input
                                        type="text"
                                        className="form-control"
                                        value={purchase.description}
                                        onChange={(e) => this.onChangePurchase(conIndex, purIndex, e.target.value)}
                                        placeholder="Purchase Description"
                                        disabled={fieldDisabled}
                                      />
                                    </div>
                                    <label htmlFor="purchase.milestone">Tag to Milestone</label>
                                    <div>
                                      <select
                                        className="form-control"
                                        value={purchase.milestone || ""}
                                        onChange={(e) => this.onChangePurchaseMilestone(conIndex, purIndex, e.target.value)}
                                        disabled={fieldDisabled}
                                      >
                                        <option value="">-- Select a Milestone --</option>
                                        {this.state.currentProject.milestones.map((ms, msIndex) => (
                                          <option key={msIndex} value={ms.name}>
                                            {ms.name || `Unnamed Milestone ${msIndex + 1}`}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <label htmlFor="purchase.amount">Invoice(s) Amount</label>
                                    <div>
                                      <input
                                        type="text"
                                        className="form-control"
                                        value={purchase.amount}
                                        onChange={(e) => this.onChangePurchaseAmount(conIndex, purIndex, e.target.value)}
                                        placeholder="Invoice Amount"
                                        disabled={fieldDisabled}
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
                                        disabled={fieldDisabled}
                                      /> <i style={{ fontSize: 'small' }}>combine multiple invoices into one zip file if needed</i>
                                    </div>
                                    {canEdit && !inFlightAmendment && this.state.isMaker &&
                                      <button type="button" className="m-3 btn btn-sm btn-danger" onClick={() => this.removePurchase(conIndex, purIndex)}>Remove</button>
                                    }
                                    <br />
                                  </div>
                                ))}
                                {canEdit && !inFlightAmendment && this.state.isMaker &&
                                  <button type="button" className="m-3 btn btn-sm btn-primary" onClick={() => this.addPurchase(conIndex)}>Add Purchase</button>
                                }
                              </td>
                            </tr></tbody>
                          </table>
                          {canEdit && !inFlightAmendment && this.state.isMaker &&
                            <button type="button" className="m-3 btn btn-sm btn-danger" onClick={() => this.removeContractor(conIndex)}>Remove Contractor</button>
                          }
                          <br />
                        </div>
                        );
                      })}
                      {!inFlightAmendment && this.state.isMaker &&
                        <button type="button" className="m-3 btn btn-sm btn-primary" onClick={this.addContractor}>Add Contractor</button>
                      }
                    </td>
                  </tr></tbody>
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
                                          return <option key={d.id} value={d.id}>{d.username}</option>
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
                    value={currentProject.approver || ""}
                    onChange={this.onChangeApprover}
                    className="form-control"
                    id="approver"
                    disabled={
                      // Editable: draft phase, or anchor maker adding new contractors on live project
                      !(
                        (this.state.currentUser.id === this.state.currentProject.maker && currentProject.status <= 0) ||
                        (this.state.isMaker && !inFlightAmendment && currentProject.id !== 0 && (currentProject.contractors || []).some(c => c._isNew))
                      ) && this.state.currentProject.id !== 0
                    }
                  >
                    <option></option>
                    {
                      Array.isArray(approverList) ?
                        approverList
                          .filter(d => d.organisation_id === this.state.currentUser.organisation_id)
                          .map((d) => {
                            return <option key={d.id} value={d.id}>{d.username}</option>
                          })
                        : null
                    }
                  </select>
                </div>
                {currentProject.id !== 0 && (
                  <div className="form-group">
                    <label htmlFor="approverComments">Approver Comments</label>
                    <input
                      type="text"
                      maxLength="255"
                      className="form-control"
                      id="approverComments"
                      required
                      value={currentProject.approverComments || ""}
                      onChange={this.onChangeApproverComments}
                      name="approverComments"
                      autoComplete="off"
                      disabled={this.state.currentUser.id !== currentProject.approver || currentProject.status !== 2}
                    />
                  </div>
                )}

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
                      (currentProject.txntype === 0 ? " Creation " :
                        (currentProject.txntype === 1 ? " Updation " :
                          (currentProject.txntype === 2 ? " Deletion " : null)))
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
                  onClick={currentProject.txntype === 2 ? this.deleteDraft : this.approveDtscf}
                >
                  Approve & Deploy
                  {
                    (currentProject.txntype === 0 ? " Creation " :
                      (currentProject.txntype === 1 ? " Updation " :
                        (currentProject.txntype === 2 ? " Deletion " : null)))
                  }
                  Request

                </button>

              }
              &nbsp;
              {
                currentProject.id !== 0 && (
                  //                  this.state.isChecker || 
                  this.state.isApprover) &&
                currentProject.status <= 2 && currentProject.status >= 1 && // status < 2 still in draft and not deployed yet
                <button
                  type="submit"
                  className="m-3 btn btn-sm btn-danger"
                  onClick={this.rejectDtscf}
                >
                  Reject
                </button>
              }
              {/* Submit anchor contractor amendment — shown when maker adds new contractors to a live project */}
              {this.state.isMaker && !inFlightAmendment && currentProject.id !== 0 &&
                (currentProject.status > 0 || currentProject.status === null) &&
                (currentProject.contractors || []).some(c => c._isNew) && (
                <button
                  type="button"
                  className="m-3 btn btn-sm btn-primary"
                  disabled={this.state.isLoading || !currentProject.approver}
                  onClick={this.submitAnchorAmendment}
                >
                  {this.state.isLoading ? 'Submitting…' : 'Submit for Approval'}
                </button>
              )}
              &nbsp;
              {
                this.state.isMaker ?
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
            </div>

            {/* ==================== RIGHT COLUMN: DIAGRAM (now on the right + vertically centered) ==================== */}
            <div className="col-lg-5 col-md-12 d-flex align-items-center" style={{ minHeight: '100%' }}>
              <div style={{ width: '100%', position: 'sticky', top: '30px' }}>
                {this.renderProjectDiagram()}
              </div>
            </div>

          </div>
        </div>
        <br />
        <br />
        {this.state.isLoading ? <LoadingSpinner /> : null}

        <Modal showm={this.state.showm} handleProceed1={event => window.location.href = '/dtscf'} handleProceed2={this.deleteDtscf} handleProceed3={this.dropRequest} button1text={this.state.button1text} button2text={this.state.button2text} button3text={this.state.button3text} button0text={this.state.button0text} handleCancel={this.hideModal}>
          <>
            {(this.state.modalmsg || '').split('\n').map((line, i) => (
              <p key={i} style={{ fontSize: '1rem', marginBottom: '4px' }}>{line}</p>
            ))}
            {this.state.explorerUrl && (
              <p style={{ marginTop: '8px' }}>
                <a href={this.state.explorerUrl} target="_blank" rel="noreferrer" style={{ color: '#4a90e2' }}>
                  View contract on blockchain explorer ↗
                </a>
              </p>
            )}
          </>
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
      <br />
      <br />
      </div>
    );
  }
}

export default withRouter(DTSCFProjectCreation);
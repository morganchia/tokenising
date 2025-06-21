import React, { Component } from "react";
import BondDataService from "../services/bond.service";
import CampaignDataService from "../services/campaign.service";
import RecipientDataService from "../services/recipient.service";
import UserOpsRoleDataService from "../services/user_opsrole.service";
import { withRouter } from '../common/with-router';
import AuthService from "../services/auth.service";
import { Link } from "react-router-dom";
import validator from 'validator';
import Modal from '../Modal.js';
import LoadingSpinner from "../LoadingSpinner";
import "../LoadingSpinner.css";
import moment from 'moment';

const YEARLY =      31536000;
const HALFYEARLY =  15768000;
const QUARTERLY =   7884000;
const MONTHLY =     2628000;
const WEEKLY =      604800;
const DAILY =       86400;
const HOURLY =      3600;

function getToday() {
  const today = new Date();
  return moment(today).format('YYYY-MM-DD')
}

function getNextYear() {
  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear() + 1;
  const day = today.getDate();
  //alert("Next year is: "+day+"/"+month+"/"+year);
//  return `${day}/${month}/${year}`;
return `${year}-${month}-${day}`;
}

class Bond extends Component {
  constructor(props) {
    super(props);
    this.onChangeName = this.onChangeName.bind(this);
    this.onChangeISIN = this.onChangeISIN.bind(this);
    this.onChangeSecurityName = this.onChangeSecurityName.bind(this);
    this.onChangeTokenName = this.onChangeTokenName.bind(this);
    this.onChangeTokenSymbol = this.onChangeTokenSymbol.bind(this);
    this.onChangeCashToken = this.onChangeCashToken.bind(this);
    this.onChangeCouponInterval = this.onChangeCouponInterval.bind(this);
    this.onChangeCouponRate = this.onChangeCouponRate.bind(this);
    this.onChangeFaceValue = this.onChangeFaceValue.bind(this);
/*
    this.onChangeDatafield1_name = this.onChangeDatafield1_name.bind(this);
    this.onChangeDatafield1_value = this.onChangeDatafield1_value.bind(this);
    this.onChangeDatafield2_name = this.onChangeDatafield2_name.bind(this);
    this.onChangeDatafield2_value = this.onChangeDatafield2_value.bind(this);
    this.onChangeOperator1 = this.onChangeOperator1.bind(this);
*/
    this.onChangeIssueDate = this.onChangeIssueDate.bind(this);
    this.onChangeMaturityDate = this.onChangeMaturityDate.bind(this);
    this.onChangeStartTime = this.onChangeStartTime.bind(this);
    this.onChangeEndTime = this.onChangeEndTime.bind(this);
    this.onChangeIssuer = this.onChangeIssuer.bind(this);
    this.onChangeTotalSupply = this.onChangeTotalSupply.bind(this);
    this.onChangeProspectusUrl = this.onChangeProspectusUrl.bind(this);
    this.onChangeChecker = this.onChangeChecker.bind(this);
    this.onChangeApprover = this.onChangeApprover.bind(this);
    this.onChangeCheckerComments = this.onChangeCheckerComments.bind(this);
    this.onChangeApproverComments = this.onChangeApproverComments.bind(this);
    this.getAllBonds = this.getAllBonds.bind(this);
    this.createBondDraft = this.createBondDraft.bind(this);
    this.submitBond = this.submitBond.bind(this);
    this.acceptBond = this.acceptBond.bind(this);
    this.approveBond = this.approveBond.bind(this);
    this.rejectBond = this.rejectBond.bind(this);
    this.deleteBond = this.deleteBond.bind(this);
    this.dropRequest = this.dropRequest.bind(this);
    this.showModal_Leave = this.showModal_Leave.bind(this);
//  this.showModal_nochange = this.showModal_nochange.bind(this);
//  this.showModalDelete = this.showModalDelete.bind(this);
  this.showModal_dropRequest = this.showModal_dropRequest.bind(this);
  this.hideModal = this.hideModal.bind(this);

    this.state = {      
      recipient: {
        id: null,
        name: "",
        walletaddress: "",
        bank: "",
        bankaccount: "",
        type: ""
      },

      adddatafield : false,
      hidedatafield1 : false,
      hidedatafield2 : true,  

      currentBond: {
        id: 0,    // 0 for new bond draft
        name: "",
        securityname: "",
        ISIN: "",
        tokenname: "",
        tokensymbol: "",
        couponinterval: "",
        couponrate: "",
        facevalue: 100,

        smartcontractaddress: "",
        cashTokenID:"",      // cashTokenID
        CashTokensmartcontractaddress: "",
        blockchain: "",
        issuedate: getToday(),
        maturitydate: getToday(),
        starttime: "00:00:00",
        endtime: "23:59:00",
        issuer: "",
        totalsupply: "",
        txntype: 0,
        checker: "",
        approver: "",
        checkerComments: "",
        approverComments: "",
        approvedbondid: null,
        actionby: "",
        name_changed: 0,
        ISIN_changed: 0,
        issuedate_changed: 0,
        maturitydate_changed: 0,
        starttime_changed: 0,
        endtime_changed: 0,
        underlyingTokenID1_changed: 0,
        underlyingTokenID2_changed: 0,
        smartcontractaddress_changed: 0,
        smartcontractaddress1_changed: 0,
        smartcontractaddress2_changed: 0,
        blockchain_changed: 0,
        issuer_changed: 0,
        totalsupply_changed: 0,
        couponinterval_changed: "",
        couponrate_changed: "",
        facevalue_changed: "",
      },

      originalBond: {
        id: null,
        name: "",
        securityname: "",
        ISIN: "",
        tokenname: "",
        tokensymbol: "",
        couponinterval: "",
        couponrate: "",
        facevalue: "",

        smartcontractaddress: "",
        blockchain: "",
        cashTokenID:"",      // cashTokenID
        CashTokensmartcontractaddress: "",
        issuedate: getToday(),
        maturitydate: getToday(),
        starttime: "00:00:00",
        endtime: "23:59:00",
        issuer: "",
        totalsupply: "",
        txntype: 0,
        checker: "",
        approver: "",
        checkerComments: "",
        approverComments: "",
        approvedbondid: null,
        actionby: "",
        name_original: "",
        ISIN_original: "",
        issuedate_original: "",
        maturitydate_original: "",
        starttime_original: "",
        endtime_original: "",
        issuer_original: "",
        totalsupply_original: "",
        couponinterval_original: "",
        couponrate_original: "",
        facevalue_original: "",
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
        let chkList = response.data.find((element) => {
          //var el_id = element.id;                       console.log("typeof(el_id)", typeof(el_id));
          //console.log("element.name:", element.name);   console.log("typeof(element.name)", typeof(element.name));
          try {
            if (element.name.toUpperCase() === "CHECKER") 
              return element;
          } catch(e) {
            // do nothing, sometime when bondList not loaded yet, element/el_id will be undefined, so need make sure it doesnt bomb
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
            // do nothing, sometime when bondList not loaded yet, element/el_id will be undefined, so need make sure it doesnt bomb
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

    this.getAllBonds(user, this.props.router.params.id);
    //this.getAllBondsTemplates();
    this.getAllCashTokenAssets();
    this.getAllIssuers();
    this.retrieveAllMakersCheckersApprovers();
  }

  onChangeName(e) {
    const name = e.target.value;
    this.setState({
      datachanged: true
    });

    this.setState(function(prevState) {
      return {
        currentBond: {
          ...prevState.currentBond,
          name: name
        }
      };
    });
  }

  onChangeSecurityName(e) {
    const securityname = e.target.value;
    this.setState({
      datachanged: true
    });

    this.setState(function(prevState) {
      return {
        currentBond: {
          ...prevState.currentBond,
          securityname: securityname
        }
      };
    });
  }

  onChangeTokenName(e) {
    const tokenname = e.target.value;
    this.setState({
      datachanged: true
    });

    this.setState(function(prevState) {
      return {
        currentBond: {
          ...prevState.currentBond,
          tokenname: tokenname
        }
      };
    });
  }

  onChangeTokenSymbol(e) {
    const tokensymbol = e.target.value;
    this.setState({
      datachanged: true
    });

    this.setState(function(prevState) {
      return {
        currentBond: {
          ...prevState.currentBond,
          tokensymbol: tokensymbol
        }
      };
    });
  }

  onChangeISIN(e) {
    const ISIN = e.target.value;

    this.setState({
      datachanged: true
    });
    this.setState(function(prevState) {
      return {
        currentBond: {
          ...prevState.currentBond,
          ISIN: ISIN
        }
      };
    });
  }

  onChangeCouponInterval(e) {
    const couponinterval = e.target.value;

    this.setState({
      datachanged: true
    });
    this.setState(function(prevState) {
      return {
        currentBond: {
          ...prevState.currentBond,
          couponinterval: couponinterval
        }
      };
    });
  }

  onChangeCouponRate(e) {
    const couponrate = e.target.value;

    this.setState({
      datachanged: true
    });
    this.setState(function(prevState) {
      return {
        currentBond: {
          ...prevState.currentBond,
          couponrate: couponrate
        }
      };
    });
  }

  onChangeFaceValue(e) {
    const facevalue = e.target.value;

    this.setState({
      datachanged: true
    });
    this.setState(function(prevState) {
      return {
        currentBond: {
          ...prevState.currentBond,
          facevalue: facevalue
        }
      };
    });
  }

  onChangeCashToken(e) {
    const cashTokenID = e.target.value;
    console.log("New CashToken=", cashTokenID);
    const newCampaign = this.state.cashTokenList.find((ee) => ee.id === parseInt(cashTokenID));
    const newBlockchain = newCampaign.blockchain;
    console.log("New blockchain=", newBlockchain);
    const newCashTokensmartcontractaddress = newCampaign.smartcontractaddress

    // when CashToken changes, blockchain might change also bccos CashToken could be in different blockchain
    this.setState({
      datachanged: true
    });
    this.setState(function(prevState) {
      return {
        currentBond: {
          ...prevState.currentBond,
          cashTokenID: cashTokenID,
          blockchain: newBlockchain,
          CashTokensmartcontractaddress: newCashTokensmartcontractaddress,
          campaign: newCampaign,
        }
      };
    });
    console.log("New currentBond=", this.state.currentBond);
  }

  onChangeIssueDate(e) {
    const issuedate = e.target.value;
    this.setState({
      datachanged: true
    });

    this.setState(prevState => ({
      currentBond: {
        ...prevState.currentBond,
        issuedate: issuedate
      }
    }));
  }

  onChangeMaturityDate(e) {
    const maturitydate = e.target.value;
    this.setState({
      datachanged: true
    });

    this.setState(prevState => ({
      currentBond: {
        ...prevState.currentBond,
        maturitydate: maturitydate
      }
    }));
  }

  onChangeStartTime(e) {
    const starttime = e.target.value;
    this.setState({
      datachanged: true
    });

    this.setState(prevState => ({
      currentBond: {
        ...prevState.currentBond,
        starttime: starttime
      }
    }));
  }

  onChangeEndTime(e) {
    const endtime = e.target.value;
    this.setState({
      datachanged: true
    });

    this.setState(prevState => ({
      currentBond: {
        ...prevState.currentBond,
        endtime: endtime
      }
    }));
  }

  onChangeIssuer(e) {
    const issuer = e.target.value;
    this.setState({
      datachanged: true
    });

    this.setState(prevState => ({
      currentBond: {
        ...prevState.currentBond,
        issuer: issuer
      }
    }));
  }

  onChangeTotalSupply(e) {
    e.target.value = e.target.value.replace(/[^0-9]/g, "");  // remove . and other chars
    const totalsupply = e.target.value;
    
    this.setState({
      datachanged: true
    });
 
    console.log("onChangeTotalSupply: totalsupply=", totalsupply);

    this.setState(prevState => ({
      currentBond: {
        ...prevState.currentBond,
        totalsupply: totalsupply,
        notional: totalsupply 
      }
    }));
  }

  onChangeProspectusUrl(e) {
    const prospectusurl = e.target.value;
    
    this.setState({
      datachanged: true
    });

    console.log("ProspectusUrl=", prospectusurl);

    this.setState(prevState => ({
      currentBond: {
        ...prevState.currentBond,
        prospectusurl: prospectusurl
      }
    }));
  }

  onChangeChecker(e) {
    const checker = e.target.value;
    /*
    this.setState({
      datachanged: true
    });
    */
    this.setState(prevState => ({
      currentBond: {
        ...prevState.currentBond,
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
        currentBond: {
          ...prevState.currentBond,
          checkerComments: checkerComments
        }
      };
    });
  }

  onChangeApprover(e) {
    const approver = e.target.value;
    /*
    this.setState({
      datachanged: true
    });
  */
    this.setState(prevState => ({
      currentBond: {
        ...prevState.currentBond,
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
        currentBond: {
          ...prevState.currentBond,
          approverComments: approverComments
        }
      };
    });
  }

  getAllBonds(user, id) {
    console.log("+++ id:", id);

    if (id !== undefined && id != 0) {
      BondDataService.getAllDraftsByBondId(id)
        .then(response => {
          response.data[0].actionby = user.username;
          this.setState({
            currentBond: response.data[0],
            originalBond: response.data[0],
          });
          console.log("Response from getAllDraftsByBondId(id):",response.data[0]);

          this.setState({ isNewBond : (response.data[0].smartcontractaddress === "" || response.data[0].smartcontractaddress === null) });
        })
        .catch(e => {
          console.log("Error from getAllDraftsByBondId(id):", e);
          alert("Error: " + e.response.data.message);

        });
    }
  }

  getAllCashTokenAssets() {
    CampaignDataService.getAll()
      .then(response => {
        if (response.data.length === 0) {
          this.setState({
            cashTokenList: [ { id:-1, name:"No campaign available, please create a campaign first."}],
          });
        } else {          
          var first_array_record = [  // add 1 empty record to front of array which is the option list
            { }
          ];
          this.setState({
            cashTokenList: [first_array_record].concat(response.data)
          });
        }
      })
      .catch(e => {
        console.log(e);
        //return(null);
      });
  }

  getAllIssuers() {
    RecipientDataService.findAllRecipients()
      .then(response => {
        if (response.data.length === 0) {
          this.setState({
            recipient: [ { id:-1, name:"No recipients available, please create a recipient first."}],
          });
        } else {          
//          var first_array_record = [  // add 1 empty record to front of array which is the option list
//            { }
//          ];
          this.setState({
//            recipient: [first_array_record].concat(response.data)
            recipient: response.data
          });
        }
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

    if (!(typeof this.state.currentBond.name ==='string' || this.state.currentBond.name instanceof String)) {
      err += "- Name cannot be empty\n";
    } else if ((this.state.currentBond.name.trim() === "")) {
      err += "- Name cannot be empty\n"; 
    } else if (this.state.isNewBond) { // only check if new bond, dont need to check if it is existing bond because surely will have name alrdy
      await BondDataService.findByNameExact(this.state.currentBond.name.trim())
      .then(response => {
        console.log("Find duplicate name:",response.data);

        if (response.data.length > 0) {
          err += "- Name of bond is already present (duplicate name)\n";
          console.log("Found bond name (duplicate!):"+this.state.currentBond.name);
        } else {
          console.log("Didnt find bond name1 (ok no duplicate):"+this.state.currentBond.name);
        }
      })
      .catch(e => {
        console.log("Didnt find bond name2 (ok no duplicate):"+this.state.currentBond.name);
        // ok to proceed
      });
    }
        
      // dont need t check ISIN, it can be empty
    if (! validator.isDate(this.state.currentBond.issuedate)) err += "- Start Date is invalid\n";
    if (! validator.isDate(this.state.currentBond.maturitydate)) err += "- End Date is invalid\n";
    if (this.state.currentBond.facevalue === "") err += "- Face value cannot be empty\n";
    if (this.state.currentBond.couponrate === "") err += "- Coupon Rate cannot be empty\n";
    if (this.state.currentBond.counponinterval === "") err += "- Coupon Interval cannot be empty\n";
    if (this.state.currentBond.issuer === "") err += "- Issuer cannot be empty\n";
    if (this.state.currentBond.totalsupply === "") err += "- TotalSupply cannot be empty\n";
    if (parseInt(this.state.currentBond.totalsupply) <=  0) err += "- TotalSupply must be more than zero\n";
    if (this.state.currentBond.issuedate.trim() !== "" && this.state.currentBond.maturitydate.trim() !== "" && this.state.currentBond.issuedate > this.state.currentBond.maturitydate) err += "- Start date cannot be later than End date\n";    

    console.log("start date:'"+this.state.currentBond.issuedate+"'");
    console.log("end date:'"+this.state.currentBond.maturitydate+"'");
    console.log("Start > End? "+ (this.state.currentBond.issuedate > this.state.currentBond.maturitydate));

    if (! validator.isURL(this.state.currentBond.prospectusurl)) err += "- Prospectus URL is invalid\n";

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

    if (err !=="" ) {
      err = "Form validation issues found:\n"+err;
      //alert(err);
      this.displayModal(err, null, null, null, "OK");
      err = ""; // clear var
      return false;
    }
    return true;
  }

  async createBondDraft() {  // for Maker

    if (this.state.isMaker) {  // only for Makers
      
        if (await this.validateForm() === true) { 

        console.log("this.state.currentBond.cashTokenID= ", this.state.currentBond.cashTokenID);

        console.log("Creating Bond draft this.state.cashTokenList= ", this.state.cashTokenList);
        console.log("Creating Bond draft CashTokensmartcontractaddress= ", this.state.cashTokenList.find((e) => e.id === parseInt(this.state.currentBond.cashTokenID)).smartcontractaddress);
  
        var data = {
          name              : this.state.currentBond.name,
          securityname      : this.state.currentBond.securityname,
          ISIN              : this.state.currentBond.ISIN,
          tokenname         : this.state.currentBond.tokenname,
          tokensymbol       : this.state.currentBond.tokensymbol,

          couponinterval    : this.state.currentBond.couponinterval,
          couponrate        : this.state.currentBond.couponrate,
          facevalue         : this.state.currentBond.facevalue,

          cashTokenID       : this.state.currentBond.cashTokenID,
          CashTokensmartcontractaddress  : this.state.cashTokenList.find((e) => e.id === parseInt(this.state.currentBond.cashTokenID)).smartcontractaddress,
          blockchain        : this.state.currentBond.blockchain,
          issuedate         : this.state.currentBond.issuedate,
          maturitydate      : this.state.currentBond.maturitydate,
          issuer            : this.state.currentBond.issuer,
          totalsupply       : this.state.currentBond.totalsupply,
          prospectusurl     : this.state.currentBond.prospectusurl,

          txntype           : 0,    // create
          maker             : this.state.currentUser.id,
          checker           : this.state.currentBond.checker,
          approver          : this.state.currentBond.approver,
          actionby          : this.state.currentUser.username,
          approvedbondid    : -1,
        };
    
        console.log("Form Validation passed! creating bond...");
        //alert("Form validation passed! creating bond...");

        console.log("IsLoad=true");
        this.show_loading();  // show progress


        await BondDataService.draftCreate(data)
        .then(response => {
          console.log("Response: ", response);
          console.log("IsLoad=false");
          this.hide_loading();  // hide progress
    
          this.setState({
            id                  : response.data.id,
            name                : response.data.name,
            securityname        : response.data.securityname,
            ISIN                : response.data.ISIN,
            tokenname           : response.data.tokenname,
            tokensymbol         : response.data.tokensymbol,

            couponinterval      : response.data.couponinterval,
            couponrate          : response.data.couponrate,
            facevalue           : response.data.facevalue,
  
            cashTokenID         : response.data.cashTokenID,
            CashTokensmartcontractaddress: response.data.CashTokensmartcontractaddress,
            smartcontractaddress: response.data.smartcontractaddress,
            blockchain          : response.data.blockchain,
            issuedate           : response.data.issuedate,
            maturitydate        : response.data.maturitydate,
            issuer              : response.data.issuer,
            totalsupply         : response.data.totalsupply,
            prospectusurl       : response.data.prospectusurl,

            submitted: true,

          });
//          this.displayModal("Bond draft submitted for review" + (response.data.smartcontractaddress !==""? " with smart contract deployed at "+response.data.smartcontractaddress : "." ) ,
//                              "OK", null, null);
          this.displayModal("Bond creation request submitted for review.", "OK", null, null, null);

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

  } // createBondDraft()

  async submitBond() {
    
    if (await this.validateForm()) { 
        console.log("Form Validation passed");
  
        console.log("IsLoad=true");
        this.show_loading();

        console.log("Submitting Bond draft this.state.bond=", this.state.currentBond);
  
        await BondDataService.submitDraftById(
          this.state.currentBond.id,
          this.state.currentBond,
        )
        .then(response => {
          this.hide_loading();
  
          console.log("Response: ", response);
          console.log("IsLoad=false");
          this.hide_loading();
    
          this.setState({  
            datachanged: false,
          });
          this.displayModal("Bond submitted. Routing to checker.", "OK", null, null, null);
        })
        .catch(e => {
          this.hide_loading();
  
          console.log(e);
          console.log(e.message);
          this.displayModal("Bond submit failed.", null, null, null, "OK");
  
          try {
            console.log(e.response.data.message);
            // Need to check draft and approved bond names
            if (e.response.data.message.includes("SequelizeUniqueConstraintError")) {
              this.displayModal("The Bond submit failed. The new bond name is already used, please use another name.", null, null, null, "OK");
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
  //    }
      this.hide_loading();
    }
  } // submitBond()
    
  async acceptBond() {
  
//    if (await this.validateForm()) { 
//      console.log("Form Validation passed");

      console.log("IsLoad=true");
      this.show_loading();

      await BondDataService.acceptDraftById(
        this.state.currentBond.id,
        this.state.currentBond,
      )
      .then(response => {
        this.hide_loading();

        console.log("Response: ", response);
        console.log("IsLoad=false");
        this.hide_loading();
  
        this.setState({  
          datachanged: false,
        });
        this.displayModal("Bond request checked, sending for approval.", "OK", null, null, null);
      })
      .catch(e => {
        this.hide_loading();

        console.log(e);
        console.log(e.message);
        this.displayModal("Bond accept failed.", null, null, null, "OK");

        try {
          console.log(e.response.data.message);
          if (e.response.data.message.includes("SequelizeUniqueConstraintError")) {
            this.displayModal("The bond accept failed. The new bond name is already used, please use another name.", null, null, null, "OK");
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
//    }
    this.hide_loading();
  } //  acceptBond()

  async approveBond() {
  
    //    if (await this.validateForm()) { 
    //      console.log("Form Validation passed");
    
    console.log("IsLoad=true");
    this.show_loading();

    await BondDataService.approveDraftById(
      this.state.currentBond.id,
      this.state.currentBond,
    )
    .then(response => {
      this.hide_loading();

      console.log("Response: ", response);
      console.log("IsLoad=false");
      this.hide_loading();

      this.setState({  
        datachanged: false,
      });
      this.displayModal("The bond is approved and executed successfully"+ (typeof(response.data.smartcontractaddress)!=="undefined" && response.data.smartcontractaddress!==null && response.data.smartcontractaddress!==""? " with smart contract deployed at "+response.data.smartcontractaddress+". \n\nThe Bond tokens are minted into the platform wallet.": "."), "OK", null, null, null);
    })
    .catch(e => {
      this.hide_loading();

      console.log("-->response:",e);
      console.log(e.message);
      //this.displayModal("Bond approval failed. "+e.message+".", null, null, "OK");
      this.displayModal(e.message+". "+(typeof(e.response.data.message)!=='undefined' && e.response.data.message!==null ? e.response.data.message:""), null, null, null, "OK");

      try {
        console.log(e.response.data.message);
        if (e.response.data.message.includes("SequelizeUniqueConstraintError")) {
          this.displayModal("The bond update failed. The new bond name is already used, please use another name.", null, null, null, "OK");
        }
      } catch(e) {
        this.hide_loading();

        console.log("Error: ",e);
        if (typeof (e.response.data.message) !== "undefined" && e.response.data.message !== null && e.response.data.message !== "" ) {
          console.log("Response error:", e.response.data.message);
          this.displayModal("Error: "+e.response.data.message+". Please contact tech support.", null, null, null, "OK");
        } else
          this.displayModal("Error: "+e.message+". Please contact tech support.", null, null, null, "OK");
      } 
    });
//    }
    this.hide_loading();
  } // approveBond()

  async rejectBond() {

    console.log("isChecker? ", this.state.isChecker);
    console.log("this.state.currentBond.checkerComments: ", this.state.currentBond.checkerComments);
    console.log("isApprover? ", this.state.isApprover);
    console.log("this.state.currentBond.approverComments: ", this.state.currentBond.approverComments);

    if ( this.state.isChecker && (typeof this.state.currentBond.checkerComments==="undefined" || this.state.currentBond.checkerComments==="" || this.state.currentBond.checkerComments===null)) { 
      this.displayModal("Please enter the reason for rejection in the Checker Comments.", null, null, null, "OK");
    } else 
    if (this.state.isApprover && (typeof this.state.currentBond.approverComments==="undefined" || this.state.currentBond.approverComments==="" || this.state.currentBond.approverComments===null)) {
      this.displayModal("Please enter the reason for rejection in the Approver Comments.", null, null, null, "OK");
    } else {
      //console.log("Form Validation passed");
    
      console.log("IsLoad=true");
      this.show_loading();

      await BondDataService.rejectDraftById(
        this.state.currentBond.id,
        this.state.currentBond,
      )
      .then(response => {
        this.hide_loading();

        console.log("Response: ", response);
        console.log("IsLoad=false");
        this.hide_loading();

        this.setState({  
          datachanged: false,
        });
        this.displayModal("This bond request is rejected. Routing back to maker.", "OK", null, null, null);
      })
      .catch(e => {
        this.hide_loading();

        console.log(e);
        console.log(e.message);
        this.displayModal("Bond rejection failed.", null, null, null, "OK");
      });
    }
    this.hide_loading();
  }
    
  async deleteBond() {    
    console.log("IsLoad=true");
    this.show_loading();        // show progress

    await BondDataService.approveDeleteDraftById(
      this.state.currentBond.id,
      this.state.currentBond,
    )
    .then(response => {
      console.log("IsLoad=false");
      this.hide_loading();     // hide progress

      this.displayModal("Bond is deleted.", "OK", null, null, null);
      console.log(response.data);
      //this.props.router.navigate('/inbox');
    })
    .catch(e => {
      console.log("IsLoad=false");
      this.hide_loading();     // hide progress
      this.displayModal(e.message+". "+(typeof(e.response.data.message)!=='undefined' && e.response.data.message!==null ? e.response.data.message:""), null, null, null, "OK");

      console.log(e);
    });
  } // deleteBond()

  async dropRequest() {    
    console.log("IsLoad=true");
    this.show_loading();        // show progress

    await BondDataService.dropRequestById(
      this.state.currentBond.id,
      this.state.currentBond,
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
    this.displayModal("Are you sure you want to Delete this Bond?", null, "Yes, delete", null, "Cancel");
  };

  hideModal = () => {
    this.setState({ showm: false });
  };


  render() {
    const { cashTokenList, recipient, currentBond, checkerList, approverList } = this.state;
    console.log("Render cashTokenList:", cashTokenList);
    console.log("Render recipient:", recipient);
    console.log("Render currentBond:", currentBond);

    try {
      return (
        <div className="container">
          { 
            (this.state.userReady) ?
            <div>
            <header className="jumbotron col-md-8">
              <h3>
                <strong>{this.state.currentBond.txntype===0?"Create ":(this.state.currentBond.txntype===1?"Update ":(this.state.currentBond.txntype===2?"Delete ":null))}Bond { this.state.isMaker? "(Maker)": (this.state.isChecker? "(Checker)": (this.state.isApprover? "(Approver)":null) )}</strong>
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
                  <label htmlFor="name">Name & description *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    maxLength="45"
                    value={currentBond.name}
                    onChange={this.onChangeName}
                    required
                    disabled={!this.state.isMaker || currentBond.txntype===2 || currentBond.status > 0 }
                    />
                </div>
                { currentBond.smartcontractaddress !== "" && currentBond.smartcontractaddress !== null ?
                  <div className="form-group">
                    <label htmlFor="name">Smart Contract Address</label>
                    <input
                      type="text"
                      className="form-control"
                      id="smartcontractaddress"
                      maxLength="45"
                      value={currentBond.smartcontractaddress}
                      required
                      disabled={true}
                      />
                  </div> 
                : null 
                }
                <div className="form-group">
                  <label htmlFor="ISIN">ISIN (e.g. XS2405871570) *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="ISIN"
                    maxLength="255"
                    required
                    value={currentBond.ISIN}
                    onChange={this.onChangeISIN}
                    name="ISIN"
                    autoComplete="off"
                    disabled={!this.state.isMaker || this.state.currentBond.txntype===2 || currentBond.status > 0 }
                    />
                </div>
                <div className="form-group">
                  <label htmlFor="name">Token Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="tokenname"
                    maxLength="20"
                    required
                    value={currentBond.tokenname}
                    onChange={this.onChangeTokenName}
                    name="tokenname"
                    disabled={!this.state.isMaker || this.state.currentBond.txntype===2 || currentBond.status > 0 }
                    />
                </div>
                <div className="form-group">
                  <label htmlFor="name">Token Symbol *</label>
                  <input
                    type="text"
                    className="form-control"
                    id="tokensymbol"
                    maxLength="20"
                    required
                    value={currentBond.tokensymbol}
                    onChange={this.onChangeTokenSymbol}
                    name="tokensymbol"
                    style={{textTransform : "uppercase"}}
                    disabled={!this.state.isMaker || this.state.currentBond.txntype===2 || currentBond.status > 0 }
                    />
                </div>
                <div className="form-group">
                  <label htmlFor="facevalue">Face Value * (only integers without decimals)</label>
                  <input
                    type="number"
                    className="form-control"
                    id="facevalue"
                    min="0"
                    step="1"
                    required
                    value={currentBond.facevalue}
                    onChange={this.onChangeFaceValue}
                    name="facevalue"
                    autoComplete="off"
                    disabled={!this.state.isMaker || currentBond.status > 0 }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="couponrate">Coupon Rate * (in basis point without decimals)</label>
                  <input
                    type="number"
                    className="form-control"
                    id="couponrate"
                    min="0"
                    step="100"
                    required
                    value={currentBond.couponrate}
                    onChange={this.onChangeCouponRate}
                    name="couponrate"
                    autoComplete="off"
                    disabled={!this.state.isMaker || currentBond.status > 0 }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="couponinterval">Coupon Interval * </label>
                  <select
                        onChange={this.onChangeCouponInterval}                         
                        className="form-control"
                        id="couponinterval"
                        required
                        disabled={!this.state.isMaker || this.state.currentBond.txntype===2 || currentBond.status > 0 }
                  >
                        <option value="0">Nil</option>
                        <option value={YEARLY} selected={currentBond.couponinterval==YEARLY}>Annually</option>
                        <option value={HALFYEARLY} selected={currentBond.couponinterval==HALFYEARLY}>Semi Annually</option>
                        <option value={QUARTERLY} selected={currentBond.couponinterval==QUARTERLY}>Quarterly</option>
                        <option value={MONTHLY} selected={currentBond.couponinterval==MONTHLY}>Monthly</option>
                        {
                          /*
                          <option value={WEEKLY} selected={currentBond.couponinterval==WEEKLY}>Weekly (only for testnet)</option>
                          <option value={DAILY} selected={currentBond.couponinterval==DAILY}>Daily (only for testnet)</option>
                          <option value={HOURLY} selected={currentBond.couponinterval==HOURLY}>Hourly (only for testnet)</option>
                          */
                        }                        
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="name">Digital Cash Token (for settlement and coupon payment) *</label>
                  <select
                        onChange={this.onChangeCashToken}                         
                        className="form-control"
                        id="cashTokenID"
                        required
                        disabled={!this.state.isMaker || this.state.currentBond.txntype===2 || currentBond.status > 0 }
                  >
                        <option value=""> </option>
                        {
                          Array.isArray(cashTokenList) ?
                          cashTokenList.map( (d) => {
                            if (typeof d.id === "number")
                            // https://stackoverflow.com/questions/61128847/react-adding-a-default-option-while-using-map-in-select-tag
                              return <option value={d.id} selected={d.id === (currentBond.campaign? currentBond.campaign.id : this.state.cashTokenID)}>{d.tokenname} ({d.name} - {d.smartcontractaddress})</option>
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
                        <option value="80002"  selected={currentBond.campaign ? currentBond.campaign.blockchain === 80002 : this.state.blockchain === 80002}>Polygon   Testnet Amoy</option>
                        <option value="11155111" selected={currentBond.campaign ? currentBond.campaign.blockchain === 11155111 : this.state.blockchain === 11155111}>Ethereum  Testnet Sepolia</option>
                        <option value="80001"  selected={currentBond.campaign ? currentBond.campaign.blockchain === 80001 : this.state.blockchain === 80001} disabled>Polygon   Testnet Mumbai (Deprecated)</option>
                        <option value="43113"      disabled>Avalanche Testnet Fuji    (not in use at the moment)</option>
                        <option value="137"      disabled>Polygon   Mainnet (not in use at the moment)</option>
                        <option value="1"        disabled>Ethereum  Mainnet (not in use at the moment)</option>
                        <option value="43114"      disabled>Avalanche Mainnet (not in use at the moment)</option>
                      </select>
                </div>

                <div className="form-group">
                  <label htmlFor="issuedate">Issue Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    id="issuedate"
                    value={currentBond.issuedate}
                    onChange={this.onChangeIssueDate}
                    min={getToday()}
                    disabled={!this.state.isMaker || currentBond.txntype===2 || currentBond.status > 0 }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="maturitydate">Maturity Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    id="maturitydate"
                    value={currentBond.maturitydate}
                    min={getToday()}
                    onChange={this.onChangeMaturityDate}
                    disabled={!this.state.isMaker || currentBond.txntype===2 || currentBond.status > 0 }
                  />
                </div>
{/*  
                <div className="form-group">
                  <label htmlFor="starttime">Start Time</label>
                  <input 
                    aria-label="Time" 
                    className="form-control"
                    type="time" 
                    name="starttime"
                    id="starttime"
                    value={currentBond.starttime}
                    onChange={this.onChangeStartTime}
                    disabled={!this.state.isMaker || currentBond.txntype===2 || currentBond.issuedate !== currentBond.maturitydate && (currentBond.couponinterval != DAILY && currentBond.couponinterval != HOURLY)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="endtime">End Time</label>
                  <input 
                    aria-label="Time" 
                    className="form-control"
                    type="time" 
                    name="endtime"
                    id="endtime"
                    value={currentBond.endtime}
                    onChange={this.onChangeEndTime}
                    disabled={!this.state.isMaker || currentBond.txntype===2 || currentBond.issuedate !== currentBond.maturitydate && (currentBond.couponinterval != DAILY && currentBond.couponinterval != HOURLY)}
                  />
                </div>
*/}
                <div className="form-group">
                  <label htmlFor="issuer">Issuer *</label>
                  <select
                    value={currentBond.issuer}
                    onChange={this.onChangeIssuer}                         
                    className="form-control"
                    id="issuer"
                    required
                    disabled={!this.state.isMaker || currentBond.txntype===2 || currentBond.status > 0 }
                    >
                      <option value=""> </option>
                      {
                        Array.isArray(recipient) ?
                          recipient.map( (d) => {
                            //return <option value={d.id}>{d.name}</option>
                            // https://stackoverflow.com/questions/61128847/react-adding-a-default-option-while-using-map-in-select-tag
                            return <option value={d.id} selected={d.id === currentBond.issuer}>{d.name}</option>

                          })
                        : null
                      }
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="totalsupply">Total Issue Size (Notional) *</label>
                  <input
                    type="number"
                    className="form-control"
                    id="totalsupply"
                    min="1"
                    step="1"
                    value={currentBond.totalsupply}
                    onChange={this.onChangeTotalSupply}
                    required
                    disabled={!this.state.isMaker || currentBond.txntype===2 || currentBond.status > 0 }
                    />
                </div>
                {/* Notional
                <div className="form-group">
                  <label htmlFor="notional">Notional</label>
                  <input
                    type="text"
                    className="form-control"
                    id="notional"
                    value={(currentBond.totalsupply*250000).toLocaleString()}
                    disabled
                    />
                </div>
                */}
                <div className="form-group">
                  <label htmlFor="prospectusurl">Prospectus URL *</label>
                  <input
                    type="url"
                    className="form-control"
                    id="prospectusurl"
                    value={currentBond.prospectusurl}
                    onChange={this.onChangeProspectusUrl}
                    required
                    disabled={!this.state.isMaker || currentBond.txntype===2 || currentBond.status > 0 }
                    />
                </div>
                <div className="form-group">
                  <label htmlFor="checker">Checker *</label>
                  <select
                        value={currentBond.checker}
                        onChange={this.onChangeChecker}                         
                        className="form-control"
                        id="checker"
                        required
                        disabled={!this.state.isMaker || currentBond.txntype===2 || currentBond.status > 0 }
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
                {
                (currentBond.id !== 0 ? // add new bond
                <div className="form-group">
                  <label htmlFor="checkerComments">Checker Comments</label>
                  <input
                    type="text"
                    maxLength="255"
                    className="form-control"
                    id="checkerComments"
                    required
                    value={currentBond.checkerComments}
                    onChange={this.onChangeCheckerComments}
                    name="checkerComments"
                    autoComplete="off"
                    disabled={!this.state.isChecker || currentBond.id === 0 || currentBond.status !== 1 }
                    />
                </div>
                :
                null
                )
                }
                <div className="form-group">
                  <label htmlFor="approver">Approver *</label>
                  <select
                      value={currentBond.approver}
                      onChange={this.onChangeApprover}                         
                      className="form-control"
                      id="approver"
                      required
                      disabled={!this.state.isMaker || currentBond.txntype===2 || currentBond.status > 0 }
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
                (currentBond.id !== 0 ? // add new bond
                <div className="form-group">
                  <label htmlFor="approverComments">Approver Comments</label>
                  <input
                    type="text"
                    maxLength="255"
                    className="form-control"
                    id="approverComments"
                    required
                    value={currentBond.approverComments}
                    onChange={this.onChangeApproverComments}
                    name="approverComments"
                    autoComplete="off"
                    disabled={!this.state.isApprover || currentBond.id === 0 || currentBond.status !== 2 }
                    />
                </div>
                : null
                )
                }
              </form>


              {  //// buttons!


                  this.state.isMaker && currentBond.id === 0 &&  // creating new draft
                        <button 
                        onClick={this.createBondDraft} 
                        type="submit"
                        className="m-3 btn btn-sm btn-primary"
                        >
                          Submit Request
                        </button>
              }
                    
              { 
                  this.state.isMaker && currentBond.status <= 0 &&  // creating draft or amending draft
                        <>
                            <button
                            type="submit"
                            className="m-3 btn btn-sm btn-primary"
                            onClick={this.submitBond}
                            >
                              Submit 
                              {
                                (currentBond.txntype===0? " Create ":
                                (currentBond.txntype===1? " Update ":
                                (currentBond.txntype===2? " Delete ":null)))
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
                this.state.isChecker && currentBond.status === 1 && 
                    <button
                      type="submit"
                      className="m-3 btn btn-sm btn-primary"
                      onClick={this.acceptBond}
                    >
                      Endorse
                      {
                        (currentBond.txntype===0? " Create ":
                        (currentBond.txntype===1? " Update ":
                        (currentBond.txntype===2? " Delete ":null)))
                      }
                      Request
                    </button> 
              }
              
              {
                    this.state.isApprover && currentBond.status === 2 &&
                    <button
                    type="submit"
                    className="m-3 btn btn-sm btn-primary"
                    onClick={currentBond.txntype===2? this.deleteDraft: this.approveBond}
                    >
                      Approve
                      {
                        (currentBond.txntype===0? " Create ":
                        (currentBond.txntype===1? " Update ":
                        (currentBond.txntype===2? " Delete ":null)))
                      }
                      Request

                    </button> 
                
              }
&nbsp;
              {
                currentBond.id !== 0 && (this.state.isChecker || this.state.isApprover) && 
                currentBond.status <= 2 &&   // status < 2 still in draft and not deployed yet
                    <button
                    type="submit"
                    className="m-3 btn btn-sm btn-danger"
                    onClick={this.rejectBond}
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
                  <Link to="/bond">
                  <button className="m-3 btn btn-sm btn-secondary">
                    Cancel
                  </button>
                  </Link>
                )
              : 
                <Link to="/bond">
                <button className="m-3 btn btn-sm btn-secondary">
                  Cancel
                </button>
                </Link>
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
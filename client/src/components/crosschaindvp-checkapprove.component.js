import React, { Component } from "react";
import CrossChainDvPDataService from "../services/crosschaindvp.service.js";
import CampaignDataService from "../services/campaign.service.js";
import BondDataService from "../services/bond.service.js";
import RecipientDataService from "../services/recipient.service.js";
import UserOpsRoleDataService from "../services/user_opsrole.service.js";
import { withRouter } from '../common/with-router.js';
import AuthService from "../services/auth.service.js";
import { Link } from "react-router-dom";
import validator from 'validator';
import Modal from '../Modal.js';
import LoadingSpinner from "../LoadingSpinner.js";
import "../LoadingSpinner.css";
import moment from 'moment';
import { blockchainName } from "../common/crosschaindvp-constants";

function getToday() {
  const today = new Date();
  return moment(today).format('YYYY-MM-DD')
}

// This mirrors repo-checkapprove.component.js (the Bond/Repo maker-checker form),
// extended for Cross Chain DvP:
//  - underlyingTokenID1/underlyingTokenID2 may now come from tokens deployed on
//    DIFFERENT chains (the same-chain filter that repo-checkapprove.component.js
//    applies to underlyingTokenID2 is removed here on purpose).
//  - `blockchain2` is a new field: the chain Token2/Counterparty2 lives on, derived
//    the same way `blockchain` (Token1's chain) already was.
//  - There is no single deployed "smartcontractaddress" anymore: CrossChainRepoEscrow
//    is a long-lived contract per chain, not deployed per trade (see
//    scripts/deployCrossChainRepoEscrow.js). Approval only registers the trade;
//    fund movement happens later via crosschaindvp-transact.component.js.
//  - No Checker step: only Maker and Approver are required. A submitted draft
//    (status 1) goes straight to the Approver instead of pausing at status 2.
class CrossChainDvP extends Component {
  constructor(props) {
    super(props);
    this.onChangeName = this.onChangeName.bind(this);
    this.onChangeUnderlying1 = this.onChangeUnderlying1.bind(this);
    this.onChangeUnderlying2 = this.onChangeUnderlying2.bind(this);
    this.onChangeCounterpartyName = this.onChangeCounterpartyName.bind(this);
    this.onChangeCounterParty1 = this.onChangeCounterParty1.bind(this);
    this.onChangeCounterParty2 = this.onChangeCounterParty2.bind(this);
    this.onChangeAmount1 = this.onChangeAmount1.bind(this);
    this.onChangeAmount2 = this.onChangeAmount2.bind(this);
    this.onChangeTradeDate = this.onChangeTradeDate.bind(this);
    this.onChangeStartDate = this.onChangeStartDate.bind(this);
    this.onChangeEndDate = this.onChangeEndDate.bind(this);
    this.onChangeStartTime = this.onChangeStartTime.bind(this);
    this.onChangeEndTime = this.onChangeEndTime.bind(this);

    this.onChangeBondISIN = this.onChangeBondISIN.bind(this);
    this.onChangeSecurityLB = this.onChangeSecurityLB.bind(this);
    this.onChangeNominal = this.onChangeNominal.bind(this);
    this.onChangeCleanPrice = this.onChangeCleanPrice.bind(this);
    this.onChangeDirtyPrice = this.onChangeDirtyPrice.bind(this);
    this.onChangeHairCut = this.onChangeHairCut.bind(this);
    this.onChangeRepoRate = this.onChangeRepoRate.bind(this);
    this.onChangeCurrency = this.onChangeCurrency.bind(this);
    this.onChangeDayCountConvention = this.onChangeDayCountConvention.bind(this);

    this.onChangeApprover = this.onChangeApprover.bind(this);
    this.onChangeApproverComments = this.onChangeApproverComments.bind(this);
    this.getCrossChainDvP = this.getCrossChainDvP.bind(this);
    this.createCrossChainDvPDraft = this.createCrossChainDvPDraft.bind(this);
    this.submitCrossChainDvP = this.submitCrossChainDvP.bind(this);
    this.approveCrossChainDvP = this.approveCrossChainDvP.bind(this);
    this.rejectCrossChainDvP = this.rejectCrossChainDvP.bind(this);
    this.deleteCrossChainDvP = this.deleteCrossChainDvP.bind(this);
    this.dropRequest = this.dropRequest.bind(this);
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

      currentCrossChainDvP: {
        id: 0,    // 0 for new draft
        name: "",
        underlyingTokenID1: "",
        underlyingTokenID2: "",
        blockchain: "",
        blockchain2: "",
        smartcontractaddress1: "",
        smartcontractaddress2: "",
        securityLB: "",
        repotype: "",
        nominal: "",
        cleanprice: "",
        dirtyprice: "",
        haircut: "",
        startamount: "",
        reporate: "",
        interestamount: "",
        daycountconvention: "",
        currency: "",
        bondisin: "",
        counterpartyname: "",
        counterparty1: "",
        counterparty2: "",
        amount1: "",
        amount2: "",
        tradedate: getToday(),
        startdate: getToday(),
        enddate: getToday(),
        starttime: "00:00:00",
        endtime: "00:00:00",

        txntype: 0,
        approver: "",
        approverComments: "",
        approvedcrosschaindvpid: null,
        actionby: "",
        name_original: "",
        startdate_original: "",
        enddate_original: "",
        amount1_original: "",
        amount2_original: "",
      },

      approverList: {
        id: null,
        username: "",
      },

      currentUser: undefined,
      isMaker: false,
      isApprover: false,
      isNewTrade: null,

      datachanged: false,
      message: "",
      isLoading: false,

      modal: {
        showm: false,
        modalmsg: "",
        button1text: null,
        button2text: null,
        button0text: null,
      }
    };
  }

  retrieveAllMakersCheckersApprovers() {
    UserOpsRoleDataService.getAllMakersCheckersApprovers("crosschaindvp")
      .then(response => {
        let apprList = response.data.find(element => element.name.toUpperCase() === "APPROVER");

        const first_array_record = [{}];
        this.setState({
          approverList: [first_array_record].concat(apprList.user || [])
        });
      })
      .catch(e => {
        console.log(e);
      });
  }

  componentDidMount() {
    const user = AuthService.getCurrentUser();

    if (!user) this.setState({ redirect: "/home" });
    this.setState({ currentUser: user, userReady: true })

    let ismaker = user.opsrole.find((el) => el.opsrole.name.toUpperCase() === "MAKER");
    this.setState({ isMaker: (ismaker === undefined ? false : true) });

    let isapprover = user.opsrole.find((el) => el.opsrole.name.toUpperCase() === "APPROVER");
    this.setState({ isApprover: (isapprover === undefined ? false : true) });

    this.show_loading();

    this.getCrossChainDvP(user, this.props.router.params.id);
    this.getAllUnderlyingAssets();
    this.getAllCounterpartys();
    this.retrieveAllMakersCheckersApprovers();

    this.hide_loading();
  }

  formatNumber2decimals(num) {
    const trimmed = parseFloat(parseFloat(num).toFixed(10));
    if (trimmed % 1 === 0) {
      return trimmed.toFixed(2);
    }
    return trimmed.toString();
  }

  isTime(time1) {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
    return timeRegex.test(time1);
  }

  // Auto-computes startamount and interestamount from nominal/dirtyprice/haircut/
  // reporate/daycountconvention/dates, and derives amount1/amount2 from securityLB
  // and currency — ported as-is from repo-checkapprove.component.js.
  componentDidUpdate(prevProps, prevState) {
    if (!this.state.currentCrossChainDvP.status > 0) {
      const { currentCrossChainDvP } = this.state;

      let new_startamount = null;

      if (
        currentCrossChainDvP.nominal !== prevState.currentCrossChainDvP.nominal ||
        currentCrossChainDvP.dirtyprice !== prevState.currentCrossChainDvP.dirtyprice ||
        currentCrossChainDvP.haircut !== prevState.currentCrossChainDvP.haircut
      ) {
        new_startamount = (currentCrossChainDvP.nominal !== undefined && currentCrossChainDvP.nominal !== "" && currentCrossChainDvP.nominal !== null && currentCrossChainDvP.nominal > 0 ?
          (currentCrossChainDvP.haircut !== undefined && currentCrossChainDvP.haircut !== "" && currentCrossChainDvP.haircut !== null ?
            (currentCrossChainDvP.dirtyprice !== undefined && currentCrossChainDvP.dirtyprice !== "" && currentCrossChainDvP.dirtyprice !== null ?
              (Math.round((((1 - (currentCrossChainDvP.haircut / 100)) * currentCrossChainDvP.dirtyprice) * (currentCrossChainDvP.nominal / 100)) * 100) / 100).toFixed(2) : null) : null) : null);

        this.setState(prevState => ({
          currentCrossChainDvP: { ...prevState.currentCrossChainDvP, startamount: new_startamount }
        }));
      }

      if (
        new_startamount != null ||
        currentCrossChainDvP.startamount !== prevState.currentCrossChainDvP.startamount ||
        currentCrossChainDvP.startdate !== prevState.currentCrossChainDvP.startdate ||
        currentCrossChainDvP.starttime !== prevState.currentCrossChainDvP.starttime ||
        currentCrossChainDvP.enddate !== prevState.currentCrossChainDvP.enddate ||
        currentCrossChainDvP.endtime !== prevState.currentCrossChainDvP.endtime ||
        currentCrossChainDvP.reporate !== prevState.currentCrossChainDvP.reporate ||
        currentCrossChainDvP.currency !== prevState.currentCrossChainDvP.currency ||
        currentCrossChainDvP.daycountconvention !== prevState.currentCrossChainDvP.daycountconvention
      ) {
        let startamount = (new_startamount !== undefined && new_startamount !== "" && new_startamount !== null && new_startamount > 0 ? new_startamount : currentCrossChainDvP.startamount);

        const startDateTime = new Date(`${currentCrossChainDvP.startdate}T${currentCrossChainDvP.starttime}`);
        const endDateTime = new Date(`${currentCrossChainDvP.enddate}T${currentCrossChainDvP.endtime}`);

        let interestamount =
          (validator.isDate(currentCrossChainDvP.startdate) && validator.isDate(currentCrossChainDvP.enddate) && this.isTime(currentCrossChainDvP.starttime) && this.isTime(currentCrossChainDvP.endtime) ?
            (currentCrossChainDvP.reporate !== undefined && currentCrossChainDvP.reporate !== "" && currentCrossChainDvP.reporate >= 0 ?
              (startamount !== undefined && startamount !== "" && startamount > 0 ?
                (currentCrossChainDvP.daycountconvention !== undefined && currentCrossChainDvP.daycountconvention !== "" && currentCrossChainDvP.daycountconvention !== 0 ?
                  (Math.round(((currentCrossChainDvP.reporate / 100) * startamount * (endDateTime - startDateTime) / (currentCrossChainDvP.daycountconvention * 60 * 60 * 24 * 1000)) * 100) / 100).toFixed(2) : null) : null) : null) : null);

        this.setState(prevState => ({
          currentCrossChainDvP: { ...prevState.currentCrossChainDvP, interestamount: interestamount }
        }));
      }

      if (
        currentCrossChainDvP.currency !== prevState.currentCrossChainDvP.currency ||
        currentCrossChainDvP.securityLB !== prevState.currentCrossChainDvP.securityLB ||
        currentCrossChainDvP.nominal !== prevState.currentCrossChainDvP.nominal
      ) {
        let startamount = (new_startamount !== undefined && new_startamount !== "" && new_startamount !== null && new_startamount > 0 ? new_startamount : currentCrossChainDvP.startamount);
        let lot = currentCrossChainDvP.nominal;

        if (currentCrossChainDvP.securityLB === "B") {
          this.setState(prevState => ({
            currentCrossChainDvP: { ...prevState.currentCrossChainDvP, amount1: lot, amount2: startamount }
          }));
        } else if (currentCrossChainDvP.currency !== "") {
          this.setState(prevState => ({
            currentCrossChainDvP: { ...prevState.currentCrossChainDvP, amount1: startamount, amount2: lot }
          }));
        }
      }
    }
  }

  onChangeName(e) {
    const name = e.target.value;
    this.setState({ datachanged: true });
    this.setState(prevState => ({ currentCrossChainDvP: { ...prevState.currentCrossChainDvP, name } }));
  }

  // Finds the token's own record (Bond or DSGD list) and derives that side's chain +
  // token address from it — the key cross-chain relaxation vs. repo-checkapprove.component.js,
  // which forces both sides onto the same `blockchain`.
  onChangeUnderlying1(e) {
    const underlyingTokenID = e.target.value;
    const isToken1Bond = this.state.currentCrossChainDvP.securityLB === "B";
    const list = isToken1Bond ? this.state.BondList : this.state.underlyingDSGDList;
    let tokenObj = null;
    try {
      tokenObj = list.find((ee) => ee.id === parseInt(underlyingTokenID));
    } catch (e) { /* ignore */ }

    this.setState({ datachanged: true });
    this.setState(prevState => ({
      currentCrossChainDvP: {
        ...prevState.currentCrossChainDvP,
        underlyingTokenID1: underlyingTokenID,
        blockchain: tokenObj ? tokenObj.blockchain : prevState.currentCrossChainDvP.blockchain,
        smartcontractaddress1: tokenObj ? tokenObj.smartcontractaddress : "",
        bondisin: isToken1Bond && tokenObj ? tokenObj.ISIN : prevState.currentCrossChainDvP.bondisin,
      }
    }));
  }

  onChangeUnderlying2(e) {
    const underlyingTokenID = e.target.value;
    const isToken2Bond = this.state.currentCrossChainDvP.securityLB === "L";
    const list = isToken2Bond ? this.state.BondList : this.state.underlyingDSGDList;
    let tokenObj = null;
    try {
      tokenObj = list.find((ee) => ee.id === parseInt(underlyingTokenID));
    } catch (e) { /* ignore */ }

    this.setState({ datachanged: true });
    this.setState(prevState => ({
      currentCrossChainDvP: {
        ...prevState.currentCrossChainDvP,
        underlyingTokenID2: underlyingTokenID,
        blockchain2: tokenObj ? tokenObj.blockchain : prevState.currentCrossChainDvP.blockchain2,
        smartcontractaddress2: tokenObj ? tokenObj.smartcontractaddress : "",
        bondisin: isToken2Bond && tokenObj ? tokenObj.ISIN : prevState.currentCrossChainDvP.bondisin,
      }
    }));
  }

  onChangeCounterpartyName(e) {
    const counterpartyname = e.target.value;
    this.setState({ datachanged: true });
    this.setState(prevState => ({ currentCrossChainDvP: { ...prevState.currentCrossChainDvP, counterpartyname } }));
  }

  onChangeCounterParty1(e) {
    const v = e.target.value;
    this.setState({ datachanged: true });
    this.setState(prevState => ({ currentCrossChainDvP: { ...prevState.currentCrossChainDvP, counterparty1: v } }));
  }

  onChangeCounterParty2(e) {
    const v = e.target.value;
    this.setState({ datachanged: true });
    this.setState(prevState => ({ currentCrossChainDvP: { ...prevState.currentCrossChainDvP, counterparty2: v } }));
  }

  onChangeAmount1(e) {
    e.target.value = e.target.value.replace(/[^0-9]/g, "");
    const amount = e.target.value;
    this.setState({ datachanged: true });
    this.setState(prevState => ({ currentCrossChainDvP: { ...prevState.currentCrossChainDvP, amount1: amount } }));
  }

  onChangeAmount2(e) {
    e.target.value = e.target.value.replace(/[^0-9]/g, "");
    const amount = e.target.value;
    this.setState({ datachanged: true });
    this.setState(prevState => ({ currentCrossChainDvP: { ...prevState.currentCrossChainDvP, amount2: amount } }));
  }

  onChangeTradeDate(e) {
    const tradedate = e.target.value;
    this.setState({ datachanged: true });
    this.setState(prevState => ({ currentCrossChainDvP: { ...prevState.currentCrossChainDvP, tradedate } }));
  }

  onChangeStartDate(e) {
    const startdate = e.target.value;
    this.setState({ datachanged: true });
    this.setState(prevState => ({ currentCrossChainDvP: { ...prevState.currentCrossChainDvP, startdate, startdatetime: startdate + "T" + this.state.currentCrossChainDvP.starttime } }));
  }

  onChangeStartTime(e) {
    const starttime = e.target.value;
    this.setState({ datachanged: true });
    this.setState(prevState => ({ currentCrossChainDvP: { ...prevState.currentCrossChainDvP, starttime, startdatetime: this.state.currentCrossChainDvP.startdate + "T" + starttime } }));
  }

  onChangeEndDate(e) {
    const enddate = e.target.value;
    this.setState({ datachanged: true });
    this.setState(prevState => ({ currentCrossChainDvP: { ...prevState.currentCrossChainDvP, enddate, enddatetime: enddate + "T" + this.state.currentCrossChainDvP.endtime } }));
  }

  onChangeEndTime(e) {
    const endtime = e.target.value;
    this.setState({ datachanged: true });
    this.setState(prevState => ({ currentCrossChainDvP: { ...prevState.currentCrossChainDvP, endtime, enddatetime: this.state.currentCrossChainDvP.enddate + "T" + endtime } }));
  }

  onChangeBondISIN(e) {
    const bondisin = e.target.value;
    this.setState({ datachanged: true });
    this.setState(prevState => ({ currentCrossChainDvP: { ...prevState.currentCrossChainDvP, bondisin } }));
  }

  onChangeSecurityLB(e) {
    const securityLB = e.target.value;
    this.setState({ datachanged: true });
    this.setState(prevState => ({
      currentCrossChainDvP: {
        ...prevState.currentCrossChainDvP,
        securityLB,
        repotype: (securityLB === "B" ? "repo" : (securityLB === "L" ? "reverserepo" : "")),
        bondisin: "",
        underlyingTokenID1: "",
        underlyingTokenID2: "",
      }
    }));
  }

  onChangeNominal(e) {
    const nominal = e.target.value;
    this.setState({ datachanged: true });
    this.setState(prevState => ({ currentCrossChainDvP: { ...prevState.currentCrossChainDvP, nominal } }));
  }

  onChangeCleanPrice(e) {
    const cleanprice = e.target.value;
    this.setState({ datachanged: true });
    this.setState(prevState => ({ currentCrossChainDvP: { ...prevState.currentCrossChainDvP, cleanprice } }));
  }

  onChangeDirtyPrice(e) {
    const dirtyprice = e.target.value;
    this.setState({ datachanged: true });
    this.setState(prevState => ({ currentCrossChainDvP: { ...prevState.currentCrossChainDvP, dirtyprice } }));
  }

  onChangeHairCut(e) {
    const haircut = e.target.value;
    this.setState({ datachanged: true });
    this.setState(prevState => ({ currentCrossChainDvP: { ...prevState.currentCrossChainDvP, haircut } }));
  }

  onChangeCurrency(e) {
    const currency = e.target.value;
    this.setState({ datachanged: true });
    const daycountconvention = (() => {
      switch (currency) {
        case "SGD": return 365
        case "AUD": return 365
        default: return 360
      }
    })();
    this.setState(prevState => ({ currentCrossChainDvP: { ...prevState.currentCrossChainDvP, currency, daycountconvention } }));
  }

  onChangeRepoRate(e) {
    const reporate = e.target.value;
    this.setState({ datachanged: true });
    this.setState(prevState => ({ currentCrossChainDvP: { ...prevState.currentCrossChainDvP, reporate } }));
  }

  onChangeDayCountConvention(e) {
    const daycountconvention = e.target.value;
    this.setState({ datachanged: true });
    this.setState(prevState => ({ currentCrossChainDvP: { ...prevState.currentCrossChainDvP, daycountconvention } }));
  }

  onChangeApprover(e) {
    const approver = e.target.value;
    this.setState(prevState => ({ currentCrossChainDvP: { ...prevState.currentCrossChainDvP, approver } }));
  }

  onChangeApproverComments(e) {
    const approverComments = e.target.value;
    this.setState({ datachanged: true });
    this.setState(prevState => ({ currentCrossChainDvP: { ...prevState.currentCrossChainDvP, approverComments } }));
  }

  getCrossChainDvP(user, id) {
    (typeof id === "string" ? id = parseInt(id) : id = id);

    if (id !== undefined && (typeof id === "number" && id !== 0)) {
      CrossChainDvPDataService.getAllDraftsByTradeId(id)
        .then(response => {
          response.data[0].actionby = user.username;

          this.setState({
            currentCrossChainDvP: {
              ...response.data[0],
              startdate: (response.data[0].startdatetime ? response.data[0].startdatetime.split("T")[0] : "0000-00-00"),
              starttime: (response.data[0].startdatetime ? response.data[0].startdatetime.split("T")[1].split(".")[0] : "00:00:00"),
              enddate: (response.data[0].enddatetime ? response.data[0].enddatetime.split("T")[0] : "0000-00-00"),
              endtime: (response.data[0].enddatetime ? response.data[0].enddatetime.split("T")[1].split(".")[0] : "00:00:00"),
              tradedate: (response.data[0].tradedate ? response.data[0].tradedate.split("T")[0] : "0000-00-00"),
              repotype: (response.data[0].securityLB === "B" ? "repo" : (response.data[0].securityLB === "L" ? "reverserepo" : "")),
              cleanprice: this.formatNumber2decimals(response.data[0].cleanprice),
              dirtyprice: this.formatNumber2decimals(response.data[0].dirtyprice),
            },
          });

          this.setState({ isNewTrade: (response.data[0].approvedcrosschaindvpid === -1 || response.data[0].approvedcrosschaindvpid === null) });
        })
        .catch(e => {
          console.log("Error from getAllDraftsByTradeId(id):", e);
        });
    }
  }

  getAllUnderlyingAssets() {
    CampaignDataService.getAll()
      .then(response => {
        const first_array_record = [{}];
        this.setState({
          underlyingDSGDList: response.data.length === 0
            ? [{ id: -1, name: "No campaign available, please create a campaign first." }]
            : [first_array_record].concat(response.data)
        });
      })
      .catch(e => console.log(e));

    BondDataService.getAll()
      .then(response => {
        const first_array_record = [{}];
        this.setState({
          BondList: response.data.length === 0 ? [{ id: -1, name: "" }] : [first_array_record].concat(response.data)
        });
      })
      .catch(e => console.log(e));
  }

  getAllCounterpartys() {
    RecipientDataService.findAllRecipients()
      .then(response => {
        this.setState({ recipientList: response.data });
      })
      .catch(e => console.log(e));
  }

  displayModal(msg, b1text, b2text, b3text, b0text) {
    this.setState({ showm: true, modalmsg: msg, button1text: b1text, button2text: b2text, button3text: b3text, button0text: b0text });
  }

  async validateForm() {
    var err = "";
    const t = this.state.currentCrossChainDvP;

    if (!(typeof t.name === 'string' || t.name instanceof String) || t.name.trim() === "") {
      err += "- Name cannot be empty\n";
    } else if (this.state.isNewTrade) {
      await CrossChainDvPDataService.findByNameExact(t.name.trim())
        .then(response => {
          if (response.data.length > 0) err += "- Name of trade is already present (duplicate name)\n";
        })
        .catch(e => { /* ok to proceed - no duplicate found */ });
    }

    if (!validator.isDate(t.tradedate)) err += "- Trade Date is invalid\n";
    if (!validator.isDate(t.startdate)) err += "- Start Date is invalid\n";
    if (!validator.isDate(t.enddate)) err += "- Maturity Date is invalid\n";
    if (!this.isTime(t.starttime)) err += "- Start Time is invalid\n";
    if (!this.isTime(t.endtime)) err += "- Maturity Time is invalid\n";

    const startDateTime = new Date(`${t.startdate}T${t.starttime}`);
    const endDateTime = new Date(`${t.enddate}T${t.endtime}`);
    if (startDateTime > endDateTime) err += "- Start date and time cannot be later than Maturity date and time\n";

    if (t.counterpartyname === "") err += "- Counterparty name cannot be empty\n";
    if (t.underlyingTokenID1 === "") err += "- Counterparty 1 " + (t.securityLB === 'B' ? 'Bond ' : t.securityLB === 'L' ? 'Cash ' : " ") + "token cannot be empty\n";
    if (t.underlyingTokenID2 === "") err += "- Counterparty 2 " + (t.securityLB === 'B' ? 'Cash ' : t.securityLB === 'L' ? 'Bond ' : " ") + "token cannot be empty\n";
    if (t.blockchain === "" || t.blockchain === null) err += "- Blockchain 1 could not be derived from Counterparty 1's token\n";
    if (t.blockchain2 === "" || t.blockchain2 === null) err += "- Blockchain 2 could not be derived from Counterparty 2's token\n";
    if (t.blockchain !== "" && t.blockchain === t.blockchain2) err += "- Cross Chain DvP requires Counterparty 1 and Counterparty 2's tokens to be on different chains\n";

    if (parseInt(t.nominal) <= 0) err += "- Nominal must be more than zero\n";
    if (parseInt(t.cleanprice) <= 0) err += "- Clean Price must be more than zero\n";
    if (parseInt(t.dirtyprice) <= 0) err += "- Dirty Price must be more than zero\n";
    if (t.currency === "") err += "- Currency cannot be empty\n";
    if (t.daycountconvention === "") err += "- Day Count Convention cannot be empty\n";
    if (t.counterparty1 === "") err += "- Counterparty 1 Wallet Address cannot be empty\n";
    if (t.counterparty2 === "") err += "- Counterparty 2 Wallet Address cannot be empty\n";
    if (t.counterparty1 !== "" && t.counterparty2 !== "" && t.counterparty1.toLowerCase() === t.counterparty2.toLowerCase()) err += "- Counterparty 1 and Counterparty 2 Wallet Addresses cannot be the same\n";

    if (t.amount1 === "") err += "- Amount 1 cannot be empty\n";
    if (t.amount2 === "") err += "- Amount 2 cannot be empty\n";
    if (parseInt(t.amount1) <= 0) err += "- Amount 1 must be more than zero\n";
    if (parseInt(t.amount2) <= 0) err += "- Amount 2 must be more than zero\n";

    if (t.approver === "" || t.approver === null) err += "- Approver cannot be empty\n";
    if (t.approver === this.state.currentUser.id.toString()) err += "- Maker and Approver cannot be the same person (yourself)\n";

    if (err !== "") {
      this.displayModal("Form validation issues found:\n" + err, null, null, null, "OK");
      return false;
    }
    return true;
  }

  async createCrossChainDvPDraft() {
    if (this.state.isMaker) {
      if (await this.validateForm() === true) {
        const t = this.state.currentCrossChainDvP;
        var data = {
          tradedate: t.tradedate,
          startdatetime: t.startdate + "T" + t.starttime,
          enddatetime: t.enddate + "T" + t.endtime,
          bondisin: t.bondisin,
          securityLB: t.securityLB,
          nominal: t.nominal,
          cleanprice: t.cleanprice,
          dirtyprice: t.dirtyprice,
          haircut: t.haircut,
          startamount: t.startamount,
          currency: t.currency,
          reporate: t.reporate,
          interestamount: t.interestamount,
          counterpartyname: t.counterpartyname,
          daycountconvention: t.daycountconvention,

          name: t.name,
          counterparty1: t.counterparty1,
          counterparty2: t.counterparty2,
          underlyingTokenID1: t.underlyingTokenID1,
          underlyingTokenID2: t.underlyingTokenID2,
          smartcontractaddress1: t.smartcontractaddress1,
          smartcontractaddress2: t.smartcontractaddress2,
          blockchain: t.blockchain,
          blockchain2: t.blockchain2,

          amount1: t.amount1,
          amount2: t.amount2,

          txntype: 0,
          maker: this.state.currentUser.id,
          approver: t.approver,
          actionby: this.state.currentUser.username,
          approvedcrosschaindvpid: -1,
        };

        this.show_loading();

        console.log("createCrossChainDvPDraft: sending draftCreate payload", data);

        await CrossChainDvPDataService.draftCreate(data)
          .then(response => {
            this.hide_loading();
            console.log("createCrossChainDvPDraft: draftCreate succeeded", response.data);
            this.setState({
              currentCrossChainDvP: { ...this.state.currentCrossChainDvP, ...response.data },
              submitted: true,
            });
            this.displayModal("Cross Chain DvP request submitted for review.", "OK", null, null, null);
          })
          .catch(e => {
            this.hide_loading();
            const msg = e.response && e.response.data && e.response.data.message ? e.response.data.message : e.message;
            console.log("createCrossChainDvPDraft: draftCreate failed", msg, e.response ? e.response.data : e);
            this.displayModal("Error: " + msg + ".\n\nPlease contact tech support.", null, null, null, "OK");
          });
      } else {
        this.hide_loading();
      }
    } else {
      this.displayModal("Error: this role is only for maker.", null, null, null, "OK");
    }
    this.hide_loading();
  }

  async submitCrossChainDvP() {
    if (await this.validateForm()) {
      this.show_loading();
      await CrossChainDvPDataService.submitDraftById(this.state.currentCrossChainDvP.id, this.state.currentCrossChainDvP)
        .then(response => {
          this.setState({ datachanged: false });
          this.displayModal("Cross Chain DvP submitted. Routing to approver.", "OK", null, null, null);
        })
        .catch(e => {
          const msg = e.response && e.response.data && e.response.data.message ? e.response.data.message : e.message;
          this.displayModal("Error: " + msg + ". Please contact tech support.", null, null, null, "OK");
        });
      this.hide_loading();
    }
  }

  async approveCrossChainDvP() {
    this.show_loading();
    await CrossChainDvPDataService.approveDraftById(this.state.currentCrossChainDvP.id, this.state.currentCrossChainDvP)
      .then(response => {
        this.setState({ datachanged: false });
        this.displayModal("The Cross Chain DvP trade is approved. Counterparties must now set token allowances, then the Start Leg can be triggered.", "OK", null, null, null);
      })
      .catch(e => {
        const msg = e.response && e.response.data && e.response.data.message ? e.response.data.message : e.message;
        this.displayModal("Error: " + msg, null, null, null, "OK");
      });
    this.hide_loading();
  }

  async rejectCrossChainDvP() {
    const t = this.state.currentCrossChainDvP;
    if (this.state.isApprover && (!t.approverComments)) {
      this.displayModal("Please enter the reason for rejection in the Approver Comments.", null, null, null, "OK");
    } else {
      this.show_loading();
      await CrossChainDvPDataService.rejectDraftById(t.id, t)
        .then(response => {
          this.setState({ datachanged: false });
          this.displayModal("This request is rejected. Routing back to maker.", "OK", null, null, null);
        })
        .catch(e => {
          this.displayModal("Cross Chain DvP rejection failed.", null, null, null, "OK");
        });
      this.hide_loading();
    }
  }

  async deleteCrossChainDvP() {
    this.show_loading();
    await CrossChainDvPDataService.approveDeleteDraftById(this.state.currentCrossChainDvP.id, this.state.currentCrossChainDvP)
      .then(response => {
        this.hide_loading();
        this.displayModal("Cross Chain DvP is deleted.", "OK", null, null, null);
      })
      .catch(e => {
        this.hide_loading();
        const msg = e.response && e.response.data && e.response.data.message ? e.response.data.message : e.message;
        this.displayModal(msg, null, null, null, "OK");
      });
  }

  async dropRequest() {
    this.show_loading();
    await CrossChainDvPDataService.dropRequestById(this.state.currentCrossChainDvP.id, this.state.currentCrossChainDvP)
      .then(response => {
        this.hide_loading();
        this.displayModal("Request is dropped (deleted).", "OK", null, null, null);
      })
      .catch(e => {
        this.hide_loading();
        const msg = e.response && e.response.data && e.response.data.message ? e.response.data.message : e.message;
        this.displayModal(msg, null, null, null, "OK");
      });
  }

  show_loading() { this.setState({ isLoading: true }); }
  hide_loading() { this.setState({ isLoading: false }); }

  showModal_Leave = () => {
    this.displayModal("You have made changes. Are you sure you want to leave this page without submitting?", "Yes, leave", null, null, "Cancel");
  };

  showModal_dropRequest = () => {
    this.displayModal("Are you sure you want to Drop this Request?", null, null, "Yes, drop", "Cancel");
  };

  showModalDelete = () => {
    this.displayModal("Are you sure you want to Delete this Cross Chain DvP?", null, "Yes, delete", null, "Cancel");
  };

  hideModal = () => {
    this.setState({ showm: false });
  };

  render() {
    const { underlyingDSGDList, BondList, recipientList, currentCrossChainDvP, approverList } = this.state;

    try {
      return (
        <div className="container">
          {(this.state.userReady) ?
            <div>
              <header className="jumbotron col-md-8">
                <h3>
                  <strong>{currentCrossChainDvP.txntype === 0 ? "Create " : (currentCrossChainDvP.txntype === 1 ? "Update " : (currentCrossChainDvP.txntype === 2 ? "Delete " : null))}Cross Chain DvP { this.state.isMaker ? "(Maker)" : (this.state.isApprover ? "(Approver)" : null)}</strong>
                </h3>
              </header>
            </div> : null}

          <div className="edit-form list-row">
            <div className="col-md-8">
              <form autoComplete="off">
                <div className="form-group">
                  <label htmlFor="name">Cross Chain DvP Trade Name*</label>
                  <input type="text" className="form-control" id="name" maxLength="45"
                    value={currentCrossChainDvP.name} onChange={this.onChangeName}
                    disabled={!this.state.isMaker || currentCrossChainDvP.txntype === 2 || currentCrossChainDvP.status > 0} />
                </div>

                <div className="form-group">
                  <label htmlFor="tradedate">Trade Date*</label>
                  <input type="date" className="form-control" id="tradedate" required
                    value={currentCrossChainDvP.tradedate} onChange={this.onChangeTradeDate}
                    disabled={!this.state.isMaker || currentCrossChainDvP.txntype === 2 || currentCrossChainDvP.status > 0} />
                </div>
                <div className="form-group">
                  <label htmlFor="startdate">Start Date*</label>
                  <input type="date" className="form-control" id="startdate" required
                    value={currentCrossChainDvP.startdate} onChange={this.onChangeStartDate}
                    disabled={!this.state.isMaker || currentCrossChainDvP.txntype === 2 || currentCrossChainDvP.status > 0} />
                </div>
                <div className="form-group">
                  <label htmlFor="starttime">Start Time (SG Time)*</label>
                  <input type="time" className="form-control" id="starttime" required
                    value={currentCrossChainDvP.starttime} onChange={this.onChangeStartTime}
                    disabled={!this.state.isMaker || currentCrossChainDvP.txntype === 2 || currentCrossChainDvP.status > 0} />
                </div>
                <div className="form-group">
                  <label htmlFor="enddate">Maturity Date*</label>
                  <input type="date" className="form-control" id="enddate" required
                    value={currentCrossChainDvP.enddate} onChange={this.onChangeEndDate}
                    disabled={!this.state.isMaker || currentCrossChainDvP.txntype === 2 || currentCrossChainDvP.status > 0} />
                </div>
                <div className="form-group">
                  <label htmlFor="endtime">Maturity Time (SG Time)*</label>
                  <input type="time" className="form-control" id="endtime" required
                    value={currentCrossChainDvP.endtime} onChange={this.onChangeEndTime}
                    disabled={!this.state.isMaker || currentCrossChainDvP.txntype === 2 || currentCrossChainDvP.status > 0} />
                </div>

                <div className="form-group">
                  <label htmlFor="securityLB">Security L/B*</label>
                  <select onChange={this.onChangeSecurityLB} className="form-control" id="securityLB"
                    disabled={!this.state.isMaker || currentCrossChainDvP.txntype === 2 || currentCrossChainDvP.status > 0}>
                    <option> </option>
                    <option value="B" selected={currentCrossChainDvP.securityLB === "B"}>Borrow</option>
                    <option value="L" selected={currentCrossChainDvP.securityLB === "L"}>Lend</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="repotype">Repo Type*</label>
                  <select className="form-control" id="repotype" disabled={true}>
                    <option> </option>
                    <option value="repo" selected={currentCrossChainDvP.repotype === "repo"}>Repo</option>
                    <option value="reverserepo" selected={currentCrossChainDvP.repotype === "reverserepo"}>Reverse Repo</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="nominal">Nominal*</label>
                  <input type="number" className="form-control" id="nominal" required min="0"
                    value={currentCrossChainDvP.nominal} onChange={this.onChangeNominal}
                    disabled={!this.state.isMaker || currentCrossChainDvP.txntype === 2 || currentCrossChainDvP.status > 0} />
                </div>
                <div className="form-group">
                  <label htmlFor="cleanprice">Clean Price*</label>
                  <input type="number" className="form-control" id="cleanprice" required min="0"
                    value={currentCrossChainDvP.cleanprice} onChange={this.onChangeCleanPrice}
                    disabled={!this.state.isMaker || currentCrossChainDvP.txntype === 2 || currentCrossChainDvP.status > 0} />
                </div>
                <div className="form-group">
                  <label htmlFor="dirtyprice">Dirty Price*</label>
                  <input type="number" className="form-control" id="dirtyprice" required min="0"
                    value={currentCrossChainDvP.dirtyprice} onChange={this.onChangeDirtyPrice}
                    disabled={!this.state.isMaker || currentCrossChainDvP.txntype === 2 || currentCrossChainDvP.status > 0} />
                </div>
                <div className="form-group">
                  <label htmlFor="haircut">Hair Cut %*</label>
                  <input type="number" className="form-control" id="haircut" required min="0"
                    value={currentCrossChainDvP.haircut} onChange={this.onChangeHairCut}
                    disabled={!this.state.isMaker || currentCrossChainDvP.txntype === 2 || currentCrossChainDvP.status > 0} />
                </div>
                <div className="form-group">
                  <label htmlFor="startamount">Start Amount</label>
                  <input type="number" className="form-control" id="startamount" min="0"
                    value={currentCrossChainDvP.startamount} disabled={true} />
                </div>
                <div className="form-group">
                  <label htmlFor="currency">Currency*</label>
                  <select onChange={this.onChangeCurrency} className="form-control" id="currency"
                    disabled={!this.state.isMaker || currentCrossChainDvP.txntype === 2 || currentCrossChainDvP.status > 0}>
                    <option> </option>
                    <option value="SGD" selected={currentCrossChainDvP.currency === "SGD"}>SGD</option>
                    <option value="USD" selected={currentCrossChainDvP.currency === "USD"}>USD</option>
                    <option value="EUR" selected={currentCrossChainDvP.currency === "EUR"}>EUR</option>
                    <option value="JPY" selected={currentCrossChainDvP.currency === "JPY"}>JPY</option>
                    <option value="GBP" selected={currentCrossChainDvP.currency === "GBP"}>GBP</option>
                    <option value="CAD" selected={currentCrossChainDvP.currency === "CAD"}>CAD</option>
                    <option value="AUD" selected={currentCrossChainDvP.currency === "AUD"}>AUD</option>
                    <option value="CHF" selected={currentCrossChainDvP.currency === "CHF"}>CHF</option>
                    <option value="NZD" selected={currentCrossChainDvP.currency === "NZD"}>NZD</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="daycountconvention">Day Count Convention*</label>
                  <select onChange={this.onChangeDayCountConvention} className="form-control" id="daycountconvention"
                    disabled={!this.state.isMaker || currentCrossChainDvP.txntype === 2 || currentCrossChainDvP.status > 0}>
                    <option> </option>
                    <option value="360" selected={currentCrossChainDvP.daycountconvention === 360}>360</option>
                    <option value="365" selected={currentCrossChainDvP.daycountconvention === 365}>365</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="reporate">Repo Rate %*</label>
                  <input type="number" className="form-control" id="reporate" required min="0"
                    value={currentCrossChainDvP.reporate} onChange={this.onChangeRepoRate}
                    disabled={!this.state.isMaker || currentCrossChainDvP.txntype === 2 || currentCrossChainDvP.status > 0} />
                </div>
                <div className="form-group">
                  <label htmlFor="interestamount">Interest Amount</label>
                  <input type="number" className="form-control" id="interestamount" min="0"
                    value={currentCrossChainDvP.interestamount} disabled={true} />
                </div>

                <div className="form-group">
                  <label htmlFor="counterpartyname">Counterparty Name*</label>
                  <input type="text" className="form-control" id="counterpartyname" maxLength="255"
                    value={currentCrossChainDvP.counterpartyname} onChange={this.onChangeCounterpartyName}
                    disabled={!this.state.isMaker || currentCrossChainDvP.txntype === 2 || currentCrossChainDvP.status > 0} />
                </div>
                <div className="form-group">
                  <label htmlFor="counterparty1">Counterparty 1 Wallet Addr *</label>
                  <select onChange={this.onChangeCounterParty1} className="form-control" id="counterparty1"
                    disabled={!this.state.isMaker || currentCrossChainDvP.txntype === 2 || currentCrossChainDvP.status > 0}>
                    <option value=""> </option>
                    {Array.isArray(recipientList) ? recipientList.map((d) => (
                      typeof d.id === "number" ? <option value={d.walletaddress} selected={d.walletaddress === currentCrossChainDvP.counterparty1}>{d.name} ({d.walletaddress})</option> : ""
                    )) : null}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="counterparty2">Counterparty 2 Wallet Addr *</label>
                  <select onChange={this.onChangeCounterParty2} className="form-control" id="counterparty2"
                    disabled={!this.state.isMaker || currentCrossChainDvP.txntype === 2 || currentCrossChainDvP.status > 0}>
                    <option value=""> </option>
                    {Array.isArray(recipientList) ? recipientList.map((d) => (
                      typeof d.id === "number" ? <option value={d.walletaddress} selected={d.walletaddress === currentCrossChainDvP.counterparty2}>{d.name} ({d.walletaddress})</option> : ""
                    )) : null}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="underlyingTokenID1">Counterparty 1 {(currentCrossChainDvP.securityLB === 'B' ? 'Bond' : currentCrossChainDvP.securityLB === 'L' ? 'Cash' : null)} Token* (on Blockchain 1)</label>
                  <select onChange={this.onChangeUnderlying1} className="form-control" id="underlyingTokenID1"
                    disabled={!this.state.isMaker || currentCrossChainDvP.securityLB === "" || currentCrossChainDvP.status > 0}>
                    <option value=""> </option>
                    {currentCrossChainDvP.securityLB === 'B' ?
                      (Array.isArray(BondList) ? BondList.map((d) => (
                        typeof d.id === "number" ? <option value={d.id} selected={d.id === currentCrossChainDvP.underlyingTokenID1}>{d.tokenname} ({d.name} - {d.smartcontractaddress} - {blockchainName(d.blockchain)})</option> : ""
                      )) : null)
                      :
                      (Array.isArray(underlyingDSGDList) ? underlyingDSGDList.map((d) => (
                        typeof d.id === "number" ? <option value={d.id} selected={d.id === currentCrossChainDvP.underlyingTokenID1}>{d.tokenname} ({d.name} - {d.smartcontractaddress} - {blockchainName(d.blockchain)})</option> : ""
                      )) : null)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="blockchain">Blockchain 1 (derived from Counterparty 1's Token)</label>
                  <input type="text" className="form-control" id="blockchain" disabled={true}
                    value={blockchainName(currentCrossChainDvP.blockchain) || ""} />
                </div>

                <div className="form-group">
                  <label htmlFor="underlyingTokenID2">Counterparty 2 {(currentCrossChainDvP.securityLB === 'B' ? 'Cash' : currentCrossChainDvP.securityLB === 'L' ? 'Bond' : null)} Token* (on Blockchain 2)</label>
                  <select onChange={this.onChangeUnderlying2} className="form-control" id="underlyingTokenID2"
                    disabled={!this.state.isMaker || currentCrossChainDvP.securityLB === "" || currentCrossChainDvP.status > 0}>
                    <option value=""> </option>
                    {currentCrossChainDvP.securityLB === 'L' ?
                      (Array.isArray(BondList) ? BondList.map((d) => (
                        typeof d.id === "number" ? <option value={d.id} selected={d.id === currentCrossChainDvP.underlyingTokenID2}>{d.tokenname} ({d.name} - {d.smartcontractaddress} - {blockchainName(d.blockchain)})</option> : ""
                      )) : null)
                      :
                      (Array.isArray(underlyingDSGDList) ? underlyingDSGDList.map((d) => (
                        typeof d.id === "number" ? <option value={d.id} selected={d.id === currentCrossChainDvP.underlyingTokenID2}>{d.tokenname} ({d.name} - {d.smartcontractaddress} - {blockchainName(d.blockchain)})</option> : ""
                      )) : null)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="blockchain2">Blockchain 2 (derived from Counterparty 2's Token)</label>
                  <input type="text" className="form-control" id="blockchain2" disabled={true}
                    value={blockchainName(currentCrossChainDvP.blockchain2) || ""} />
                </div>

                <div className="form-group">
                  <label htmlFor="bondisin">Bond ISIN*</label>
                  <input type="text" className="form-control" id="bondisin" value={currentCrossChainDvP.bondisin} disabled={true} />
                </div>

                <label>Exchange Rate between Tokens</label>
                <table style={{ border: '1px solid blue', width: '100%' }}>
                  <tr>
                    <td style={{ border: '0' }}>
                      <div className="form-group">
                        <label htmlFor="amount1">Our {(currentCrossChainDvP.securityLB === 'B' ? 'Bond Lot' : currentCrossChainDvP.securityLB === 'L' ? 'Cash' : null)} amount</label>
                        <input type="number" className="form-control" id="amount1" min="0" step="1"
                          value={currentCrossChainDvP.amount1} disabled={true} />
                      </div>
                    </td>
                    <td style={{ border: '0' }}>vs</td>
                    <td style={{ border: '0' }}>
                      <div className="form-group">
                        <label htmlFor="amount2">Counterparty {(currentCrossChainDvP.securityLB === 'B' ? 'Cash' : currentCrossChainDvP.securityLB === 'L' ? 'Bond Lot' : null)} amount</label>
                        <input type="number" className="form-control" id="amount2" min="0" step="1"
                          value={currentCrossChainDvP.amount2} disabled={true} />
                      </div>
                    </td>
                  </tr>
                </table>
                <br />

                <div className="form-group">
                  <label htmlFor="approver">Approver *</label>
                  <select value={currentCrossChainDvP.approver} onChange={this.onChangeApprover} className="form-control" id="approver"
                    disabled={!this.state.isMaker || currentCrossChainDvP.txntype === 2 || currentCrossChainDvP.status > 0}>
                    {Array.isArray(approverList) ? approverList.map((d) => <option value={d.id}>{d.username}</option>) : null}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="approverComments">Approver Comments</label>
                  <input type="text" maxLength="255" className="form-control" id="approverComments"
                    value={currentCrossChainDvP.approverComments} onChange={this.onChangeApproverComments}
                    disabled={!this.state.isApprover || currentCrossChainDvP.id === 0 || currentCrossChainDvP.status !== 1} />
                </div>
              </form>

              {this.state.isMaker && currentCrossChainDvP.id === 0 &&
                <button onClick={this.createCrossChainDvPDraft} type="submit" className="m-3 btn btn-sm btn-primary">
                  Submit Request
                </button>
              }

              {this.state.isMaker && currentCrossChainDvP.status <= 0 && currentCrossChainDvP.id !== 0 &&
                <>
                  <button type="submit" className="m-3 btn btn-sm btn-primary" onClick={this.submitCrossChainDvP}>
                    Submit {(currentCrossChainDvP.txntype === 0 ? " Create " : (currentCrossChainDvP.txntype === 1 ? " Update " : (currentCrossChainDvP.txntype === 2 ? " Delete " : null)))} Request
                  </button>
                  <button className="m-3 btn btn-sm btn-danger" onClick={this.showModal_dropRequest}>
                    Drop Request
                  </button>
                </>
              }

              {this.state.isApprover && currentCrossChainDvP.status === 1 &&
                <button type="submit" className="m-3 btn btn-sm btn-primary"
                  onClick={currentCrossChainDvP.txntype === 2 ? this.deleteCrossChainDvP : this.approveCrossChainDvP}>
                  Approve {(currentCrossChainDvP.txntype === 0 ? " Create" : (currentCrossChainDvP.txntype === 1 ? " Update" : (currentCrossChainDvP.txntype === 2 ? " Delete" : null)))}
                </button>
              }
              &nbsp;
              {currentCrossChainDvP.id !== 0 && this.state.isApprover && currentCrossChainDvP.status === 1 &&
                <button type="submit" className="m-3 btn btn-sm btn-danger" onClick={this.rejectCrossChainDvP}>
                  Reject
                </button>
              }
              &nbsp;
              {this.state.isMaker ?
                (this.state.datachanged ?
                  <button className="m-3 btn btn-sm btn-secondary" onClick={this.showModal_Leave}>Cancel</button>
                  :
                  <Link to="/xchaindvp"><button className="m-3 btn btn-sm btn-secondary">Cancel</button></Link>
                )
                :
                <Link to="/xchaindvp"><button className="m-3 btn btn-sm btn-secondary">Cancel</button></Link>
              }

              {this.state.isLoading ? <LoadingSpinner /> : null}

              <Modal showm={this.state.showm} handleProceed1={event => window.location.href = '/inbox'} handleProceed2={this.deleteCrossChainDvP} handleProceed3={this.dropRequest} button1text={this.state.button1text} button2text={this.state.button2text} button3text={this.state.button3text} button0text={this.state.button0text} handleCancel={this.hideModal}>
                {this.state.modalmsg}
              </Modal>

              <p>{this.state.message}</p>
            </div>
          </div>
        </div>
      );
    } catch (e) {
      console.log("Render error:", e);
      return <div className="container">Error rendering Cross Chain DvP form: {e.message}</div>;
    }
  }
}

export default withRouter(CrossChainDvP);

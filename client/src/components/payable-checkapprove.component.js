// payable-checkapprove.component.js (UI for checking/approving tokenized payables, similar to bond-checkapprove.component.js)
import React, { Component } from "react";
import PayableDataService from "../services/payable.service";
import { withRouter } from '../common/with-router.js';
import AuthService from "../services/auth.service.js";
import Modal from '../Modal.js';
import moment from 'moment';

class PayableCheckApprove extends Component {
  constructor(props) {
    super(props);
    this.onChangeName = this.onChangeName.bind(this);
    this.onChangeValue = this.onChangeValue.bind(this);
    this.onChangeMaturityDate = this.onChangeMaturityDate.bind(this);
    this.onChangeIssuer = this.onChangeIssuer.bind(this);
    this.onChangeConditions = this.onChangeConditions.bind(this);
    this.createPayableDraft = this.createPayableDraft.bind(this);
    this.submitPayable = this.submitPayable.bind(this);
    this.acceptPayable = this.acceptPayable.bind(this);
    this.approvePayable = this.approvePayable.bind(this);
    this.rejectPayable = this.rejectPayable.bind(this);
    this.deletePayable = this.deletePayable.bind(this);
    this.dropRequest = this.dropRequest.bind(this);
    this.showModal_Leave = this.showModal_Leave.bind(this);
    this.showModal_dropRequest = this.showModal_dropRequest.bind(this);
    this.hideModal = this.hideModal.bind(this);

    this.state = {
      currentPayable: {
        id: 0,
        name: "",
        value: "",
        maturityDate: moment().format('YYYY-MM-DD'),
        issuer: "",
        conditions: "",
        status: null,
      },
      datachanged: false,
      message: "",
      modal: {
        showm: false,
        modalmsg: "",
        button1text: null,
        button0text: null,
      }
    };
  }

  // Similar methods as in bond-checkapprove.component.js for handling changes, submissions, etc.
  // Omitted for brevity; implement similarly with PayableDataService calls.

  render() {
    const { currentPayable } = this.state;

    return (
      <div>
        <form>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              className="form-control"
              id="name"
              value={currentPayable.name}
              onChange={this.onChangeName}
            />
          </div>
          {/* Other fields: value, maturityDate, issuer, conditions */}
        </form>
        {/* Buttons for submit, endorse, approve, reject, etc., similar to bond */}
        <Modal /* ... */ />
      </div>
    );
  }
}

export default withRouter(PayableCheckApprove);
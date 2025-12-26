// payable-list.component.js (UI for listing tokenized payables, similar to bond-list.component.js)
import React, { Component } from "react";
import PayableDataService from "../services/payable.service";
import { Link } from "react-router-dom";
import AuthService from "../services/auth.service";
import Modal from '../Modal.js';

export default class PayableList extends Component {
  constructor(props) {
    super(props);
    this.onChangeSearchName = this.onChangeSearchName.bind(this);
    this.retrievePayables = this.retrievePayables.bind(this);
    this.refreshList = this.refreshList.bind(this);
    this.setActivePayable = this.setActivePayable.bind(this);
    this.removeAllPayables = this.removeAllPayables.bind(this);
    this.searchName = this.searchName.bind(this);

    this.state = {
      payables: [],
      currentPayable: null,
      currentIndex: -1,
      searchName: "",
      modal: {
        showm: false,
        modalmsg: "",
        button1text: undefined,
        button2text: undefined,
        button0text: undefined,
      }
    };
  }

  componentDidMount() {
    this.retrievePayables();
  }

  onChangeSearchName(e) {
    const searchName = e.target.value;
    this.setState({ searchName });
  }

  retrievePayables() {
    PayableDataService.getAll()
      .then(response => {
        this.setState({ payables: response.data });
      })
      .catch(e => {
        console.log(e);
      });
  }

  refreshList() {
    this.retrievePayables();
    this.setState({ currentPayable: null, currentIndex: -1 });
  }

  setActivePayable(payable, index) {
    this.setState({ currentPayable: payable, currentIndex: index });
  }

  removeAllPayables() {
    PayableDataService.deleteAll()
      .then(response => {
        this.refreshList();
      })
      .catch(e => {
        console.log(e);
      });
  }

  searchName() {
    this.setState({ currentPayable: null, currentIndex: -1 });
    PayableDataService.findByName(this.state.searchName)
      .then(response => {
        this.setState({ payables: response.data });
      })
      .catch(e => {
        console.log(e);
      });
  }

  showModal = () => {
    this.setState({
      showm: true,
      modalmsg: "This action is irreversible. Do you want to remove all Payables?",
      button1text: "Remove all",
      button0text: "Cancel",
    });
  };

  hideModal = () => {
    this.setState({ showm: false });
  };

  render() {
    const { searchName, payables } = this.state;

    return (
      <div className="container">
        <div className="list row">
          <div className="col-md-8">
            <div className="input-group mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Search by name"
                value={searchName}
                onChange={this.onChangeSearchName}
              />
              <div className="input-group-append">
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={this.searchName}
                >
                  Search
                </button>
              </div>
            </div>
          </div>
          <div className="col-md-12">
            <table style={{ border: "1px solid" }}>
              {payables.length > 0 && (
                <tr>
                  <th>Name</th>
                  <th>Value</th>
                  <th>Maturity Date</th>
                  <th>Issuer</th>
                  <th>Actions</th>
                </tr>
              )}
              {payables.map((payable, index) => (
                <tr key={index}>
                  <td>{payable.name}</td>
                  <td>{payable.value}</td>
                  <td>{payable.maturityDate}</td>
                  <td>{payable.issuer}</td>
                  <td>
                    <Link to={`/payablecheckapprove/${payable.id}`}>
                      <button className="m-3 btn btn-sm btn-primary">View</button>
                    </Link>
                  </td>
                </tr>
              ))}
            </table>
            <Link to="/payablecheckapprove/0">
              <button className="m-3 btn btn-sm btn-primary">Create Payable</button>
            </Link>
            {payables.length > 0 && (
              <button className="m-3 btn btn-sm btn-danger" onClick={this.showModal}>
                Remove All
              </button>
            )}
            <Modal
              showm={this.state.showm}
              handleProceed1={this.removeAllPayables}
              handleCancel={this.hideModal}
              button1text={this.state.button1text}
              button0text={this.state.button0text}
            >
              {this.state.modalmsg}
            </Modal>
          </div>
        </div>
      </div>
    );
  }
}
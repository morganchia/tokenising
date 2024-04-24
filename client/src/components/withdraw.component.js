import React, { Component } from "react";
import CampaignDataService from "../services/campaign.service";
import { Link, Navigate } from "react-router-dom";
import AuthService from "../services/auth.service";
import Modal from '../Modal.js';

export default class CampaignList extends Component {
  constructor(props) {
    super(props);
    this.onChangeSearchName = this.onChangeSearchName.bind(this);
    this.retrieveCampaigns = this.retrieveCampaigns.bind(this);
    this.refreshList = this.refreshList.bind(this);
    this.setActiveCampaign = this.setActiveCampaign.bind(this);
    this.withdrawAllCampaigns = this.withdrawAllCampaigns.bind(this);
    this.searchName = this.searchName.bind(this);

    this.state = {
      campaigns: [],
      currentCampaign: null,
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

  onChangeSearchName(e) {
    const searchName = e.target.value;

    this.setState({
      searchName: searchName
    });
  }

  retrieveCampaigns() {
    CampaignDataService.getAll()
      .then(response => {
        this.setState({
          campaigns: response.data
        });
        console.log("Campaign_getAll():", response.data);
      })
      .catch(e => {
        console.log(e);
      });
  }

  refreshList() {
    this.retrieveCampaigns();
    this.setState({
      currentCampaign: null,
      currentIndex: -1
    });
  }

  setActiveCampaign(campaign, index) {
    this.setState({
      currentCampaign: campaign,
      currentIndex: index
    });
  }

  withdrawAllCampaigns() {
    CampaignDataService.withdrawAll()
      .then(response => {
        console.log(response.data);
        this.refreshList();
      })
      .catch(e => {
        console.log(e);
      });
  }

  searchName() {
    this.setState({
      currentCampaign: null,
      currentIndex: -1
    });

    CampaignDataService.findByName(this.state.searchName)
      .then(response => {
        this.setState({
          campaigns: response.data
        });
        console.log(response.data);
      })
      .catch(e => {
        console.log(e);
      });
  }

  componentDidMount() {
    const currentUser = AuthService.getCurrentUser();

    if (!currentUser) this.setState({ redirect: "/login" });
    this.setState({ currentUser: currentUser, userReady: true })

    this.retrieveCampaigns();

  }

  showModal = () => {
    this.setState({ showm: true,
                    modalmsg: "This function is still under development", 
                    button1text : null,
                    button0text: "Cancel",
    });
  };

  hideModal = () => {
    this.setState({ showm: false });
  };

  shorten(s) {
    return(s.substring(0,6) + "..." + s.slice(-4));
  }


  render() {
    if (this.state.redirect) {
      return <Navigate to={this.state.redirect} />
    }

    const { searchName, campaigns, currentUser } = this.state;

    return (
      <div className="container">
          {(this.state.userReady) ?
          <div>
          <header className="jumbotron col-md-8">
            <h3>
              <strong>Withdraw (End and close Campaign) - Work in progress</strong>
            </h3>
          </header>

        </div>: null}

          <div className="list row">
            <div className="col-md-8">
            {
              // (campaigns.length > 0) ?
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
              // : null
            }
            </div>
            <div className="col-md-12">

              <table style={{ border:"1px solid"}}>
                {(campaigns.length > 0)?
                <tr>
                  <th>Campaign</th>
                  <th>Token</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Sponsor</th>
                  <th>Amount</th>
                  <th>Smart Contract</th>
                  <th>Action</th>
                </tr>
                : null}
                {campaigns &&
                  campaigns.map((campaign, index) => (
                    <tr>
                      <td>{campaign.name}</td>
                      <td>{campaign.tokenname}</td>
                      <td>{campaign.startdate}</td>
                      <td>{campaign.enddate}</td>
                      <td>{campaign.recipient.name}</td>
                      <td>{campaign.amount}</td>
                      <td>{this.shorten(campaign.smartcontractaddress)}</td>
                      <td>
                        <Link
                //          to={"/campaignclose/" + campaign.id}
                          className="badge badge-warning"
                        >
                          View / Withdraw
                        </Link>
                      </td>
                    </tr>
                  ))}
              </table>

              { (campaigns.length > 0) ? 
                <button className="m-3 btn btn-sm btn-danger" onClick={this.showModal}>
                  Withdraw All
                </button>
              : null }

              <br/>

              <Modal showm={this.state.showm} handleProceed1={this.withdrawAllCampaigns} handleCancel={this.hideModal} handleProceed2={null} button1text={this.state.button1text} button2text={this.state.button2text} button0text={this.state.button0text}>
                {this.state.modalmsg}
              </Modal>
            </div>
          </div>
      </div>

    );
  }
}


  

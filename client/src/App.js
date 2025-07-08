import React, { Component } from "react";
import { Routes, Route, Link } from "react-router-dom";

import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import "./sidebar.css";

import AuthService from "./services/auth.service";

import Login from "./components/login.component";
import Register from "./components/register.component";
import Home from "./components/home.component";
import Profile from "./components/profile.component";
import BoardUser from "./components/board-user.component";
import BoardModerator from "./components/board-moderator.component";
import BoardAdmin from "./components/board-admin.component";
import Dashboard from "./components/dashboard.component";
import Inbox from "./components/inbox.component";

import RecipientAdd from "./components/recipient-add.component";
import RecipientList from "./components/recipients-list.component";
import RecipientCheckApprove from "./components/recipient-checkapprove.component";

import Withdraw from "./components/withdraw.component";

import TransferList from "./components/transfers-list.component";
import TransferCheckApprove from "./components/transfer-checkapprove.component";

import Order from "./components/order.component";
import AuditTrail from "./components/audittrail.component";
import UserRoles from "./components/userroles.component";
import Settings from "./components/settings.component";

import MintAdd from "./components/mint-add.component";
import MintList from "./components/mints-list.component";
import MintCheckApprove from "./components/mint-checkapprove.component";

import CampaignAdd from "./components/campaign-add.component";
import CampaignEdit from "./components/campaign-edit.component";
import CampaignCheckApprove from "./components/campaign-checkapprove.component";
import CampaignsList from "./components/campaigns-list.component";

import BridgeList from "./components/bridge.component";

import BondCouponAllowance from "./components/bond-couponallowance.component";
import BondCouponTrigger from "./components/bond-coupontrigger.component";
import BondCheckApprove from "./components/bond-checkapprove.component";
import BondList from "./components/bond-list.component";

import PBMCheckApprove from "./components/pbm-checkapprove.component";
import PBMAdd from "./components/pbm-add.component";
import PBMList from "./components/pbm-list.component";

import DvPCheckApprove from "./components/dvp-checkapprove.component";
import DvPList from "./components/dvp-list.component";
import DvPAddAllowance from "./components/dvp-addallowance.component";
import DvPTransact from "./components/dvp-transact.component";

import RepoList from "./components/repo-list.component";
import RepoCheckApprove from "./components/repo-checkapprove.component";
import RepoSetAllowance from "./components/repo-setallowance.component";
import RepoTradeManager from "./components/RepoTradeManager.component";
import RepoTransact from "./components/repo-transact.component";

import PBMWrapCheckApprove from "./components/pbmwrap-checkapprove.component";
import PBMWrapAdd from "./components/pbmwrap-add.component";
import PBMWrapList from "./components/pbmwrap-list.component";
import DSGD2PBM from "./components/dsgd2pbm.component";

import PBMTemplateAdd from "./components/pbm-template-add.component";
import PBMTemplateList from "./components/pbm-template-list.component";

import AuthVerify from "./common/auth-verify";
import EventBus from "./common/EventBus";
import moment from "moment-timezone";

class App extends Component {
  constructor(props) {
    super(props);
    this.logOut = this.logOut.bind(this);
    this.toggleMenu = this.toggleMenu.bind(this);

    this.state = {
      showModeratorBoard: false,
      showAdminBoard: false,
      currentUser: undefined,
      openMenus: {
        pbm: false,
        bonds: false,
      },
    };
  }

  componentDidMount() {
    const user = AuthService.getCurrentUser();

    if (user) {
      console.log("USer token:", user);
      this.setState({
        currentUser: user,
        showModeratorBoard: user.roles.includes("ROLE_MODERATOR"),
        showAdminBoard: user.roles.includes("ROLE_ADMIN"),
      });
    }
    
    EventBus.on("logout", () => {
      this.logOut();
    });
  }

  componentWillUnmount() {
    EventBus.remove("logout");
  }

  logOut() {
    AuthService.logout();
    this.setState({
      showModeratorBoard: false,
      showAdminBoard: false,
      currentUser: undefined,
    });
  }

  toggleMenu(menu) {
    this.setState(prevState => ({
      openMenus: {
        ...prevState.openMenus,
        [menu]: !prevState.openMenus[menu],
      },
    }));
  }

  render() {
    const { currentUser, showModeratorBoard, showAdminBoard, openMenus } = this.state;

    return (
      <div>
        <link
          rel="stylesheet"
          href="//unpkg.com/boxicons@2.1.4/css/boxicons.min.css"
        />
        <nav className="navbar navbar-expand navbar-dark bg-dark">
          <Link to={"/"} className="navbar-brand">
            BCDA
          </Link>
          <div className="navbar-nav mr-auto">
            <li className="nav-item">
              <Link to={"/login"} className="nav-link">
                Home
              </Link>
            </li>

            {showModeratorBoard && (
              <li className="nav-item">
                <Link to={"/mod"} className="nav-link">
                  Moderator Board
                </Link>
              </li>
            )}

            {showAdminBoard && (
              <li className="nav-item">
                <Link to={"/admin"} className="nav-link">
                  Admin Board
                </Link>
              </li>
            )}

            {currentUser && (
              <li className="nav-item">
                <Link to={"/user"} className="nav-link">
                  User
                </Link>
              </li>
            )}
          </div>

          {currentUser ? (
            <div className="navbar-nav ml-auto">
              <li className="nav-item">
                <span className="nav-link">
                  {currentUser.username}
                </span>
              </li>
              <li className="nav-item">
                <div className="nav-link">
                Last login: {(currentUser.lastlogin === null || currentUser.lastlogin === "") ? " None ":
                              moment.tz(
                                currentUser.lastlogin
                                , "Asia/Singapore"
                              ).format()
                              .replace('T', ' ')
                              .substring(0, currentUser.lastlogin.indexOf('.'))
                            }
                </div>
              </li>
              <div className="sidebar open">
                <div className="logo-details">
                  <i className='bx bxl-graphql'></i>
                    <div className="logo_name">BCDA DSGD and PBM Portal</div>
                </div>
                <ul className="nav-list">
                  <li>
                    <Link to={"/dashboard"} className="nav-link">
                      <i className='bx bx-grid-alt'></i>
                      <span className="links_name">Dashboard</span>
                    </Link>
                    <span className="tooltip">Dashboard</span>
                  </li>
                  <li>
                    <a href="/inbox" className="nav-link">
                      <i className='bx bx-task' ></i>
                      <span className="links_name">Inbox</span>
                    </a>
                    <span className="tooltip">Inbox</span>
                  </li>
                  <li>
                    <a onClick={() => this.toggleMenu('cash')} className="nav-link">
                      <i className='bx bx-atom'></i>
                      <span className="links_name">Digital Cash</span>
                      <i className={`bx ${openMenus.cash ? 'bx-chevron-up' : 'bx-chevron-down'}`}></i>
                    </a>
                    <span className="tooltip">Cash</span>
                    {openMenus.cash && (
                      <ul className="nav-list" style={{ paddingLeft: '20px' }}>
                        <li>
                          <Link to={"/campaign"} className="nav-link">
                            <i className='bx bx-atom' ></i>
                            <span className="links_name">Campaigns (Cash)</span>
                          </Link>
                          <span className="tooltip">Campaigns (Cash)</span>
                        </li>
                        <li>
                          <Link to={"/mint"} className="nav-link">
                            <i className='bx bx-atom' ></i>
                            <span className="links_name">Mint</span>
                          </Link>
                          <span className="tooltip">Mint</span>
                        </li>
                        <li>
                          <Link to={"/transfer"} className="nav-link">
                            <i className='bx bx-transfer' ></i>
                            <span className="links_name">Transfer</span>
                          </Link>
                          <span className="tooltip">Transfer</span>
                        </li>
                        <li>
                          <Link to={"/withdraw"} className="nav-link">
                            <i className='bx bx-money-withdraw' ></i>
                            <span className="links_name">Withdraw (Off Ramp)</span>
                          </Link>
                          <span className="tooltip">Withdraw (Off Ramp)</span>
                        </li>
                      </ul>
                    )}
                  </li>
                  <li>
                    <a onClick={() => this.toggleMenu('bonds')} className="nav-link">
                      <i className='bx bx-atom'></i>
                      <span className="links_name">Bonds</span>
                      <i className={`bx ${openMenus.bonds ? 'bx-chevron-up' : 'bx-chevron-down'}`}></i>
                    </a>
                    <span className="tooltip">Bonds</span>
                    {openMenus.bonds && (
                      <ul className="nav-list" style={{ paddingLeft: '20px' }}>
                        <li>
                          <Link to={"/bond"} className="nav-link">
                            <i className='bx bx-atom'></i>
                            <span className="links_name">Bond</span>
                          </Link>
                          <span className="tooltip">Bond</span>
                        </li>
                        <li>
                          <Link to={"/repo"} className="nav-link">
                            <i className='bx bx-atom'></i>
                            <span className="links_name">Repo</span>
                          </Link>
                          <span className="tooltip">Repo</span>
                        </li>
                      </ul>
                    )}
                  </li>
                  <li>
                    <a onClick={() => this.toggleMenu('pbm')} className="nav-link">
                      <i className='bx bx-atom'></i>
                      <span className="links_name">PBMs</span>
                      <i className={`bx ${openMenus.pbm ? 'bx-chevron-up' : 'bx-chevron-down'}`}></i>
                    </a>
                    <span className="tooltip">PBMs</span>
                    {openMenus.pbm && (
                      <ul className="nav-list" style={{ paddingLeft: '20px' }}>
                        <li>
                          <Link to={"/pbm"} className="nav-link">
                            <i className='bx bx-atom'></i>
                            <span className="links_name">PBM</span>
                          </Link>
                          <span className="tooltip">PBM</span>
                        </li>
                        <li>
                          <Link to={"/pbmtemplate"} className="nav-link">
                            <i className='bx bx-atom'></i>
                            <span className="links_name">PBM Templates</span>
                          </Link>
                          <span className="tooltip">PBM Templates</span>
                        </li>
                        <li>
                          <Link to={"/pbmwraplist"} className="nav-link">
                            <i className='bx bx-atom'></i>
                            <span className="links_name">Wrap Mint PBM</span>
                          </Link>
                          <span className="tooltip">Wrap Mint PBM</span>
                        </li>
                      </ul>
                    )}
                  </li>
                  <li>
                    <a onClick={() => this.toggleMenu('utilities')} className="nav-link">
                      <i className='bx bx-atom'></i>
                      <span className="links_name">Utilities</span>
                      <i className={`bx ${openMenus.utilities ? 'bx-chevron-up' : 'bx-chevron-down'}`}></i>
                    </a>
                    <span className="tooltip">Utilities</span>
                    {openMenus.utilities && (
                      <ul className="nav-list" style={{ paddingLeft: '20px' }}>
                        <li>
                          <Link to={"/bridge"} className="nav-link">
                            <i className='bx bx-atom' ></i>
                            <span className="links_name">Bridge</span>
                          </Link>
                          <span className="tooltip">Bridge</span>
                        </li>
                        <li>
                          <Link to={"/dvp"} className="nav-link">
                            <i className='bx bx-atom' ></i>
                            <span className="links_name">DvP</span>
                          </Link>
                          <span className="tooltip">DvP</span>
                        </li>
                      </ul>
                    )}
                  </li>
                  <li>
                    <a onClick={() => this.toggleMenu('admin')} className="nav-link">
                      <i className='bx bx-atom'></i>
                      <span className="links_name">Admin Functions</span>
                      <i className={`bx ${openMenus.admin ? 'bx-chevron-up' : 'bx-chevron-down'}`}></i>
                    </a>
                    <span className="tooltip">Admin Functions</span>
                    {openMenus.admin && (
                      <ul className="nav-list" style={{ paddingLeft: '20px' }}>
                        <li>
                          <Link to={"/recipient"} className="nav-link">
                            <i className='bx bx-atom' ></i>
                            <span className="links_name">Recipients / Sponsors</span>
                          </Link>
                          <span className="tooltip">Recipients / Sponsors</span>
                        </li>
                        <li>
                          <Link to={"/audittrail"} className="nav-link">
                            <i className='bx bx-folder' ></i>
                            <span className="links_name">Audit Trail</span>
                          </Link>
                          <span className="tooltip">Audit Trail</span>
                        </li>
                        <li>
                          <Link to={"/userroles"} className="nav-link">
                            <i className='bx bx-user' ></i>
                            <span className="links_name">User Roles</span>
                          </Link>
                          <span className="tooltip">User Roles</span>
                        </li>
                        <li>
                          <Link to={"/settings"} className="nav-link">
                            <i className='bx bx-cog' ></i>
                            <span className="links_name">Setting</span>
                          </Link>
                          <span className="tooltip">Setting</span>
                        </li>
                      </ul>
                    )}
                  </li>

                  <li>
                    <a href="/login" onClick={this.logOut}>                   
                      <i className='bx bx-log-out' id="log_out"></i>
                      <span className="name_job">Logout</span>
                    </a>
                    <span className="tooltip">Logout</span>
                  </li>
                </ul>
              </div>
            </div> 
          ) : (
            <div className="navbar-nav ml-auto">
            </div>
          )}
        </nav>
        <div>
          <Routes>
            <Route path="/dsgd2pbm" element={<DSGD2PBM />} />
            <Route path="/dvpaddallowance" element={<DvPAddAllowance />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </div>

        <div className="container mt-3">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/home" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/recipient" element={<RecipientList />} />
            <Route path="/recipientadd" element={<RecipientAdd/>} />
            <Route path="/recipientcheckapprove/:id" element={<RecipientCheckApprove/>} />
            <Route path="/withdraw" element={<Withdraw />} />
            <Route path="/transfer" element={<TransferList />} />
            <Route path="/transfercheckapprove/:id" element={<TransferCheckApprove/>} />
            <Route path="/audittrail" element={<AuditTrail />} />
            <Route path="/order" element={<Order />} />
            <Route path="/userroles" element={<UserRoles />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/user" element={<BoardUser />} />
            <Route path="/mod" element={<BoardModerator />} />
            <Route path="/admin" element={<BoardAdmin />} />
            <Route path="/mint" element={<MintList/>} />
            <Route path="/mintadd" element={<MintAdd/>} />
            <Route path="/mintcheckapprove/:id" element={<MintCheckApprove/>} />
            <Route path="/campaign" element={<CampaignsList/>} />
            <Route path="/campaignadd" element={<CampaignAdd/>} />
            <Route path="/campaigncheckapprove/:id" element={<CampaignCheckApprove/>} />
            <Route path="/campaignedit/:id" element={<CampaignEdit/>} />
            <Route path="/bridge" element={<BridgeList/>} />
            <Route path="/bond" element={<BondList/>} />
            <Route path="/bondcheckapprove/:id" element={<BondCheckApprove/>} />
            <Route path="/bondcouponallowance/:id" element={<BondCouponAllowance />} />
            <Route path="/bondcouponallowance" element={<BondCouponAllowance />} />
            <Route path="/bondcoupontrigger/:id" element={<BondCouponTrigger />} />
            <Route path="/dvp" element={<DvPList/>} />
            <Route path="/dvpcheckapprove/:id" element={<DvPCheckApprove/>} />
            <Route path="/dvptransact/:id" element={<DvPTransact/>} />
            <Route path="/repo" element={<RepoList/>} />
            <Route path="/repocheckapprove/:id" element={<RepoCheckApprove/>} />
            <Route path="/reposetallowance/:id" element={<RepoSetAllowance />} />
            <Route path="/repotrademanager/:id" element={<RepoTradeManager />} />
            <Route path="/repotransact/:id" element={<RepoTransact/>} />
            <Route path="/pbm" element={<PBMList/>} />
            <Route path="/pbmadd" element={<PBMAdd/>} />
            <Route path="/pbmcheckapprove/:id" element={<PBMCheckApprove/>} />
            <Route path="/pbmtemplate" element={<PBMTemplateList/>} />
            <Route path="/pbmtemplateadd" element={<PBMTemplateAdd/>} />
            <Route path="/pbmwrapadd/" element={<PBMWrapAdd/>} />
            <Route path="/pbmwrapcheckapprove/:id" element={<PBMWrapCheckApprove/>} />
            <Route path="/pbmwraplist" element={<PBMWrapList/>} />
          </Routes>
        </div>

        {
          <AuthVerify logOut={this.logOut}/>   
        }
      </div>
    );
  }
}

export default App;
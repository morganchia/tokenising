import React, { Component } from "react";
import AuthService from "../services/auth.service.js";
import { withRouter } from "../common/with-router.js";
import axios from 'axios';
import { useParams } from "react-router-dom";
import DtscfDataService from "../services/dtscf.service.js";


class DTSCFView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      smartcontractaddress: '',
      status: '',
      indexN: '',
      description: '',
      value: '',
      viewId: 1,
    };
  }

    componentDidMount() {
        // Tell MetaMask this page is not for them
        if (window.ethereum) {
        window.ethereum.autoRefreshOnNetworkChange = false; // Prevents some auto-connect errors
        }

        const user = AuthService.getCurrentUser();
        this.setState({ currentUser: user });
        console.log("Current user:", user); 

        const { id, smartcontractaddress } = this.props.router.params;

        if (!user) {
            this.setState({ redirect: "/login" });
        } else {
            this.setState({ currentUser: user, actionby:user.username, userReady: true, smartcontractaddress: smartcontractaddress })
        }


        console.log(`Smart Contract Address: ${smartcontractaddress} and ID: ${id}`);
        this.handleShowNFT(smartcontractaddress, id); // TP address is passed as id in the URL
    }

/*
  handleMint = async () => {
    if (!this.state.smartcontractaddress) return setStatus('Please enter a contract address.');
    setStatus('🚀 Minting...');
    try {
      const res = await axios.post('http://localhost:5000/api/mint', {
        contractAddress: this.state.smartcontractaddress, // Send to server 
        id: this.state.indexN,
        value: this.state.value,
        conditions: this.state.description
      });
      setStatus(`✅ Success! Assigned Token ID: ${res.data.assignedId}`);
      setViewId(res.data.assignedId);
    } catch (err) {
      setStatus('Error: ' + err.message);
    }
  };
*/

handleShowNFT = async (address, id) => {
    // Fallback to state if arguments aren't passed
    const targetAddress = address || this.state.smartcontractaddress;
    const targetId = id || this.state.viewId;

    if (!targetAddress) {
      this.setState({ status: '❌ Missing Contract Address.' });
      return;
    }

    this.setState({ status: `Searching for Token #${targetId}...`, viewData: null });


    try {
      //const res = await axios.get(`http://localhost:5000/api/view/${targetAddress}/${targetId}`);

      const draftData = {
          smartcontractaddress: targetAddress,
          id: targetId,
      };
      await DtscfDataService.getTPNFT(
              targetId,
              draftData
          )
      .then(response => {
        if (response.data) {
            this.setState({ 
            viewData: response.data,
            status: `Loaded NFT #${targetId} successfully.` 
            });
        }
        console.log('[CLIENT UI] draftCreate success:', response); // NEW: Confirm resolve
      })
      .catch(e => {
        const errMsg = (e.response && e.response.data && e.response.data.message) || e.message || e.toString();
        this.setState(prevState => ({
          status: prevState.status + "Error: " + errMsg + "\n",
        }));
        console.error('[CLIENT UI] draftCreate error:', errMsg); // NEW: Confirm reject
      });

    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.error || "Server connection failed.";
      this.setState({ status: `Error: ${errorMsg}` });
    }
  };

  render() {
    // Simple Styles
    const sectionStyle = { border: '1px solid #ddd', padding: '20px', marginBottom: '20px', borderRadius: '8px' };
    const inputStyle = { width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box' };
    const btnStyle = { width: '100%', padding: '10px', cursor: 'pointer', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px' };

    return(
        <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto' }}>        
{/* 
        <input 
            placeholder="Smart Contract Address (0x...)" 
            value={this.state.smartcontractaddress} 
            onChange={e => this.setState({ smartcontractaddress: e.target.value })} 
            style={inputStyle} 
        />

        <div style={sectionStyle}>
            <h3>Mint NFT</h3>
            <input placeholder="Temp ID" value={this.state.indexN} onChange={e => this.setState({ indexN: e.target.value })} style={inputStyle}/>
            <textarea placeholder="Description" value={this.state.description} onChange={e => this.setState({ description: e.target.value })} style={inputStyle}/>
            <button onClick={this.handleMint} style={btnStyle}>Mint</button>
        </div>

        <div style={sectionStyle}>
            <h3>View NFT</h3>
            <input placeholder="Token ID" value={this.state.viewId} onChange={e => this.setState({ viewId: e.target.value })} style={inputStyle}/>
            <button onClick={this.handleShowNFT} style={{...btnStyle, backgroundColor: 'green'}}>Show</button>
        </div>
*/}

        {this.state.viewData && (
            <div style={{ marginTop: '20px', border: '1px solid #eee', padding: '15px', textAlign: 'center' }}>
            <h4>{this.state.viewData.name}</h4>
            <img src={this.state.viewData.image} alt="NFT" style={{ width: '100%', borderRadius: '8px' }} />
            <p>{this.state.viewData.description}</p>
            </div>
        )}

        <p><strong>Status:</strong> {this.state.status}</p>

        </div>
    );
  }

}

export default withRouter(DTSCFView);
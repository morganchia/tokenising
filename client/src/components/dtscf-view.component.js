import React, { Component } from "react";
import AuthService from "../services/auth.service.js";
import { withRouter } from "../common/with-router.js";
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
      allTokenIds: [],
      selectedTokenId: '',
      decryptStatus: '',
      isLoading: false,
    };
  }


    componentDidMount() {
        const user = AuthService.getCurrentUser();
        this.setState({ currentUser: user });
        console.log("Current user:", user); 

        const { smartcontractaddress, allTokenIds } = this.props.router.params;
        console.log(`Smart Contract Address: ${smartcontractaddress}, tokens: ${allTokenIds} `);
        console.log(`allTokenIds is array? ${typeof allTokenIds}`)

        // Parse allTokenIds: it can be a string "2,3,4" or already an array
        let tokenList = [];
        if (allTokenIds) {
          if (Array.isArray(allTokenIds)) {
            tokenList = allTokenIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
          } else if (typeof allTokenIds === 'string') {
            tokenList = allTokenIds
              .split(',')
              .map(id => parseInt(id.trim(), 10))
              .filter(id => !isNaN(id));
          }
        }

        this.setState({ 
          smartcontractaddress: smartcontractaddress || '', 
          allTokenIds: tokenList 
        });

        if (!user) {
            this.setState({ redirect: "/login" });
        } else {
            this.setState({ currentUser: user, actionby:user.username, userReady: true });
        }

        console.log(`Smart Contract Address: ${smartcontractaddress} `);
        
        if (tokenList.length > 0) {
          const firstId = tokenList[0];
          this.setState({ selectedTokenId: firstId });
          //this.handleShowNFT(smartcontractaddress, firstId);
        } else {
          this.setState({ status: 'No token IDs available to display.' });
        }
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
      this.setState({ status: 'Missing Contract Address.' });
      return;
    }

    this.setState({ status: `Loading Token #${targetId}...`, viewData: null, isLoading: true });


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
      .then(async response => {
        if (response.data) {
          let metadata = response.data;

          if (metadata.encrypted) {
            this.setState({ decryptStatus: 'Verifying access...', status: `Loaded NFT #${targetId} (encrypted).` });
            try {
              if (!window.ethereum) throw new Error('MetaMask is required to decrypt this token.');
              await window.ethereum.request({ method: 'eth_requestAccounts' });
              const chainId = parseInt(await window.ethereum.request({ method: 'eth_chainId' }), 16);
              const basePayload = { contractAddress: targetAddress, tokenId: targetId, chainId, envelope: metadata };

              // The anchor's private key lives on the server (not in MetaMask), so they
              // authenticate via JWT session. Everyone else signs with MetaMask.
              const isAnchor = this.state.currentUser?.roles?.includes('ROLE_ANCHOR');

              let response;
              if (isAnchor) {
                this.setState({ decryptStatus: 'Authenticating via session...' });
                response = await DtscfDataService.decryptMetadata(basePayload);
              } else {
                this.setState({ decryptStatus: 'Requesting wallet signature...' });
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                const registeredWallet = this.state.currentUser?.walletaddress;
                let wallet;
                if (registeredWallet) {
                  wallet = accounts.find(a => a.toLowerCase() === registeredWallet.toLowerCase());
                  if (!wallet) {
                    throw new Error(
                      `Your registered wallet (${registeredWallet}) is not connected to MetaMask. ` +
                      `Please add or switch to that account in MetaMask and try again.`
                    );
                  }
                } else {
                  wallet = accounts[0];
                }
                const timestamp = Math.floor(Date.now() / 1000);
                const message = `Decrypt NFT: contract=${targetAddress}, tokenId=${targetId}, timestamp=${timestamp}`;
                const signature = await window.ethereum.request({
                  method: 'personal_sign',
                  params: [message, wallet],
                });
                response = await DtscfDataService.decryptMetadata({ ...basePayload, signature, message });
              }

              metadata = response.data;
              this.setState({ decryptStatus: 'Decrypted successfully.' });
            } catch (decErr) {
              const msg = decErr.response?.data?.message || decErr.message;
              this.setState({ decryptStatus: `Decryption failed: ${msg}` });
              metadata = null;
            }
          } else {
            this.setState({ decryptStatus: '' });
          }

          this.setState({
            viewData: metadata,
            status: metadata ? `Loaded NFT #${targetId} successfully.` : `NFT #${targetId} could not be decrypted.`,
            isLoading: false,
          });
        }
        console.log('[CLIENT UI] getTPNFT success:', response);
      })
      .catch(e => {
        const errMsg = (e.response && e.response.data && e.response.data.message) || e.message || e.toString();
        this.setState(prevState => ({
          status: prevState.status + "Error: " + errMsg + "\n",
          isLoading: false,
        }));
        console.error('[CLIENT UI] getTPNFT error:', errMsg);
      });

    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.error || "Server connection failed.";
      this.setState({ status: `Error: ${errorMsg}` });
    }
  };

  
  handleAddToMetaMask = async () => {
    const { smartcontractaddress, selectedTokenId } = this.state;
    if (!smartcontractaddress || !selectedTokenId) {
      this.setState({ status: 'Select a token first.' });
      return;
    }
    if (!window.ethereum) {
      this.setState({ status: 'MetaMask is not installed or not detected.' });
      return;
    }
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const added = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC1155',
          options: {
            address: smartcontractaddress,
            tokenId: String(selectedTokenId),
          },
        },
      });
      this.setState({ status: added ? 'Token added to MetaMask successfully.' : 'MetaMask import was dismissed.' });
    } catch (err) {
      // Fallback: copy contract address and show manual instructions
      navigator.clipboard?.writeText(smartcontractaddress).catch(() => {});
      this.setState({
        status: `To view in MetaMask: open MetaMask → NFTs tab → Import NFT → enter Contract Address: ${smartcontractaddress} and Token ID: ${selectedTokenId}. (Contract address copied to clipboard.)`,
      });
    }
  };

  render() {
    // Simple Styles
    const sectionStyle = { border: '1px solid #ddd', padding: '20px', marginBottom: '20px', borderRadius: '8px' };
    const inputStyle = { width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box' };
    const btnStyle = { width: '100%', padding: '10px', cursor: 'pointer', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px' };

    // Build dropdown options using a for loop 
    let tokenOptions = [];
    if (this.state.allTokenIds && this.state.allTokenIds.length > 0) {
      for (let i = 0; i < this.state.allTokenIds.length; i++) {
        const id = this.state.allTokenIds[i];
        tokenOptions.push(
          <option key={id} value={id}>
            Token #{id}
          </option>
        );
      }
    }

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
        {/* Token Selection Dropdown */}
        {this.state.allTokenIds && this.state.allTokenIds.length > 0 && (
          <div style={sectionStyle}>
            {this.state.smartcontractaddress && (
              <p style={{ color: '#666', wordBreak: 'break-all', marginBottom: '8px' }}>
                Contract: {this.state.smartcontractaddress}
              </p>
            )}
            <h3>Select Token to Display</h3>
            <select 
              value={this.state.selectedTokenId} 
              onChange={e => this.setState({ selectedTokenId: parseInt(e.target.value, 10) })}
              style={inputStyle}
            >
              <option></option>
              {tokenOptions}
            </select>
            <button
              onClick={() => this.handleShowNFT(this.state.smartcontractaddress, this.state.selectedTokenId)}
              style={{...btnStyle, backgroundColor: '#0084ff', marginBottom: '8px'}}
            >
              Display
            </button>
            <button
              onClick={this.handleAddToMetaMask}
              style={{...btnStyle, backgroundColor: '#e2761b'}}
            >
              Add to MetaMask
            </button>
          </div>
        )}

        {this.state.viewData && (
            <div style={{ marginTop: '20px', border: '1px solid #eee', padding: '15px', textAlign: 'center' }}>
            <h4>{this.state.viewData.name}</h4>
            <img src={this.state.viewData.image} alt="NFT" style={{ width: '100%', borderRadius: '8px' }} />
            <p>{this.state.viewData.description}</p>
            </div>
        )}

        <style>{`@keyframes dtscf-spin { to { transform: rotate(360deg); } }`}</style>
        <p>
          {this.state.status !== '' && <strong>Status:</strong>}{' '}
          {this.state.isLoading && (
            <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #ccc', borderTopColor: '#0084ff', borderRadius: '50%', animation: 'dtscf-spin 0.8s linear infinite', marginRight: 6, verticalAlign: 'middle' }} />
          )}
          {this.state.status}
        </p>
        {this.state.decryptStatus && <p><em>{this.state.decryptStatus}</em></p>}

        </div>
    );
  }
}

export default withRouter(DTSCFView);
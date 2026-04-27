import http from "../common/http";

class DtscfDataService {
  getAll() {
    return http.get("/dtscf");
  }
  getAllDtscfTemplates() {
    return http.get("/dtscf/getalldtscftemplates");
  }
  findOne(id) {
    return http.get(`/dtscf/${id}`);
  }
  getAllInvestorsById(id) {
    return http.get(`/dtscf/getallinvestorsbyid?id=${id}`);
  }
  getTPbyOrgId(id) {
    return http.get(`/dtscf/gettpbyorgid?id=${id}`);
  }
  getAllByDtscfId(id) {
    return http.get(`/dtscf/getallbydtscfid?id=${id}`);
  }
/*
  approveMilestoneCompletedById(id) {
    return http.get(`/dtscf/approvemilestonecompletedbyid?id=${id}`);
  }
*/

//  draftCreate(data) {
//    return http.post("/dtscf/draftcreate", data);
//  }
//  update(id, data) {
//    return http.put(`/dtscf/${id}`, data);
//  }
//  submitDraftById(id, data) {
//    return http.put(`/dtscf/submitdraftbyid/${id}`, data);
//  }

/*
  draftCreate(data, onLog = () => {}) {
    const baseURL = http.defaults.baseURL;
    return new Promise((resolve, reject) => {
      const hasFiles = data.contractors && data.contractors.some(con => 
        con.purchases && con.purchases.some(pur => 
          pur.invoices && pur.invoices.length > 0 && pur.invoices.some(file => file instanceof File)
        )
      );
      let body;
      let headers = {};
      if (hasFiles) {
        const formData = new FormData();
        formData.append('name', data.name || '');
        formData.append('description', data.description || '');
        formData.append('totalBudget', data.totalBudget || 0);
        formData.append('anchor_id', data.anchor_id || 0);
        formData.append('underlyingTokenID', data.underlyingTokenID || 0);
        formData.append('underlyingDSGDsmartcontractaddress', data.underlyingDSGDsmartcontractaddress || '');
        formData.append('blockchain', data.blockchain || 0);
        formData.append('campaign_id', data.campaign_id || 0);
        formData.append('startdate', data.startdate || '');
        formData.append('enddate', data.enddate || '');

        (data.milestones || []).forEach((ms, msIndex) => {
          if (ms.id) formData.append(`milestones[${msIndex}][id]`, ms.id);
          formData.append(`milestones[${msIndex}][name]`, ms.name || '');
          formData.append(`milestones[${msIndex}][budget]`, ms.budget || 0);
          formData.append(`milestones[${msIndex}][startdate]`, ms.startdate || '');
          formData.append(`milestones[${msIndex}][enddate]`, ms.enddate || '');
        });

        (data.contractors || []).forEach((con, conIndex) => {
          if (con.id) formData.append(`contractors[${conIndex}][id]`, con.id);
          formData.append(`contractors[${conIndex}][name]`, con.name || '');
          formData.append(`contractors[${conIndex}][budget]`, con.budget || 0);
          formData.append(`contractors[${conIndex}][walletaddress]`, con.walletaddress || '');

          (con.purchases || []).forEach((pur, purIndex) => {
            if (pur.id) formData.append(`contractors[${conIndex}][purchases][${purIndex}][id]`, pur.id);
            formData.append(`contractors[${conIndex}][purchases][${purIndex}][description]`, pur.description || '');
            formData.append(`contractors[${conIndex}][purchases][${purIndex}][amount]`, pur.amount || 0);

            (pur.invoices || []).forEach((file) => {
              if (file instanceof File) {
                formData.append(`contractors[${conIndex}][purchases][${purIndex}][invoices]`, file);
              }
            });
          });
        });
        body = formData;
      } else {
        body = JSON.stringify(data);
        headers = { 'Content-Type': 'application/json' };
      }

      const url = `${baseURL}/dtscf/draftcreate`; // For debugging
      console.log(`[CLIENT] Sending draftCreate request to ${url} | hasFiles: ${hasFiles} | headers:`, headers); // NEW: Diagnostic log
      fetch(url, {
        method: 'POST',
        headers: headers,
        body: body
      })
      .then(response => {
        console.log('[CLIENT] Received response status:', response.status); // NEW: Log response start
        if (!response.ok) {
          reject(new Error(`HTTP error! status: ${response.status}`));
          return;
        }
        const reader = response.body.getReader();
        let buffer = '';
        const processStream = ({ done, value }) => {
          if (done) {
            // ... (unchanged)
          }
          // ... (rest of stream processing unchanged)
        };
        reader.read().then(processStream).catch(reject);
      })
      .catch(err => {
        console.error('[CLIENT] Fetch error:', err); // NEW: Log any fetch rejection
        reject(err);
      });  
    });
  }
*/


  draftCreate(data, onLog = () => {}) {
    const baseURL = http.defaults.baseURL;
    return new Promise((resolve, reject) => {
      const hasFiles = data.contractors && data.contractors.some(con => 
        con.purchases && con.purchases.some(pur => 
          pur.invoices && pur.invoices.length > 0 && pur.invoices.some(file => file instanceof File)
        )
      );
      let body;
      let headers = {};
      if (hasFiles) {
        const formData = new FormData();
        formData.append('name', data.name || '');
        formData.append('description', data.description || '');
        formData.append('totalBudget', data.totalBudget || 0);
        formData.append('anchor_id', data.anchor_id || 0);
        formData.append('underlyingTokenID', data.underlyingTokenID || 0);
        formData.append('underlyingDSGDsmartcontractaddress', data.underlyingDSGDsmartcontractaddress || '');
        formData.append('blockchain', data.blockchain || 0);
        formData.append('campaign_id', data.campaign_id || 0);
        formData.append('startdate', data.startdate || '');
        formData.append('enddate', data.enddate || '');

        (data.milestones || []).forEach((ms, msIndex) => {
          if (ms.id) formData.append(`milestones[${msIndex}][id]`, ms.id);
          formData.append(`milestones[${msIndex}][name]`, ms.name || '');
          formData.append(`milestones[${msIndex}][budget]`, ms.budget || 0);
          formData.append(`milestones[${msIndex}][startdate]`, ms.startdate || '');
          formData.append(`milestones[${msIndex}][enddate]`, ms.enddate || '');
        });

        (data.contractors || []).forEach((con, conIndex) => {
          if (con.id) formData.append(`contractors[${conIndex}][id]`, con.id);
          formData.append(`contractors[${conIndex}][name]`, con.name || '');
          formData.append(`contractors[${conIndex}][budget]`, con.budget || 0);
          formData.append(`contractors[${conIndex}][walletaddress]`, con.walletaddress || '');

          (con.purchases || []).forEach((pur, purIndex) => {
            if (pur.id) formData.append(`contractors[${conIndex}][purchases][${purIndex}][id]`, pur.id);
            formData.append(`contractors[${conIndex}][purchases][${purIndex}][description]`, pur.description || '');
            formData.append(`contractors[${conIndex}][purchases][${purIndex}][amount]`, pur.amount || 0);

            (pur.invoices || []).forEach((file) => {
              if (file instanceof File) {
                formData.append(`contractors[${conIndex}][purchases][${purIndex}][invoices]`, file);
              }
            });
          });
        });
        body = formData;
      } else {
        body = JSON.stringify(data);
        headers = { 'Content-Type': 'application/json' };
      }

      const url = `${baseURL}/dtscf/draftcreate`;
      console.log(`[CLIENT] Sending draftCreate request to ${url} | hasFiles: ${hasFiles} | headers:`, headers);

      fetch(url, {
        method: 'POST',
        headers: headers,
        body: body
      })
      .then(response => {
        console.log('[CLIENT] Received response status:', response.status, '| Headers:', response.headers);
        if (!response.ok) {
          reject(new Error(`HTTP error! status: ${response.status}`));
          return;
        }
        const reader = response.body.getReader();
        let buffer = '';
        const processStream = ({ done, value }) => {
          console.log('[CLIENT STREAM] Read event | done:', done, '| value length:', value ? value.length : 'none'); // NEW: Log each read
          if (done) {
            const lines = (buffer ? [buffer] : []);
            lines.forEach(line => {
              if (line) {
                console.log('[CLIENT STREAM DONE] Processing line:', line); // NEW: Log remaining lines
                if (line.startsWith('LOG: ')) {
                  onLog(line.substring(5));
                } else if (line.startsWith('SUCCESS: ')) {
                  resolve({ message: line.substring(9) });
                  return;
                } else if (line.startsWith('ERROR: ')) {
                  reject(new Error(line.substring(7)));
                  return;
                }
              }
            });
            if (!resolve) { // Avoid double resolve
              resolve({ message: 'Operation completed successfully.' });
            }
            console.log('[CLIENT STREAM] Stream ended and resolved.'); // NEW: Confirm end
            return;
          }
          buffer += new TextDecoder().decode(value);
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          lines.forEach(line => {
            if (line) {
              console.log('[CLIENT STREAM] Processing line:', line); // NEW: Log each complete line
              if (line.startsWith('LOG: ')) {
                onLog(line.substring(5));
              } else if (line.startsWith('SUCCESS: ')) {
                resolve({ message: line.substring(9) });
                console.log('[CLIENT STREAM] Resolved on SUCCESS.'); // NEW
                return;
              } else if (line.startsWith('ERROR: ')) {
                reject(new Error(line.substring(7)));
                console.log('[CLIENT STREAM] Rejected on ERROR.'); // NEW
                return;
              }
            }
          });
          reader.read().then(processStream).catch(reject);
        };
        reader.read().then(processStream).catch(reject);
      })
      .catch(err => {
        console.error('[CLIENT] Fetch error:', err);
        reject(err);
      });
    });
  }

  update(id, data, onLog = () => {}) {
    const baseURL = http.defaults.baseURL;

    // Check if there are any files
    const hasFiles = data.contractors && data.contractors.some(con => 
      con.purchases && con.purchases.some(pur => 
        pur.invoices && pur.invoices.length > 0 && pur.invoices.some(file => file instanceof File)
      )
    );

    let body;
    let headers = {};
    if (hasFiles) {
      const formData = new FormData();
      formData.append('name', data.name || '');
      formData.append('description', data.description || '');
      formData.append('totalBudget', data.totalBudget || 0);
      formData.append('anchor_id', data.anchor_id || 0);
      formData.append('underlyingTokenID', data.underlyingTokenID || 0);
      formData.append('underlyingDSGDsmartcontractaddress', data.underlyingDSGDsmartcontractaddress || '');
      formData.append('blockchain', data.blockchain || 0);
      formData.append('campaign_id', data.campaign_id || 0);
      formData.append('startdate', data.startdate || '');
      formData.append('enddate', data.enddate || '');

      (data.milestones || []).forEach((ms, msIndex) => {
        if (ms.id) formData.append(`milestones[${msIndex}][id]`, ms.id);
        formData.append(`milestones[${msIndex}][name]`, ms.name || '');
        formData.append(`milestones[${msIndex}][budget]`, ms.budget || 0);
        formData.append(`milestones[${msIndex}][startdate]`, ms.startdate || '');
        formData.append(`milestones[${msIndex}][enddate]`, ms.enddate || '');
      });

      (data.contractors || []).forEach((con, conIndex) => {
        if (con.id) formData.append(`contractors[${conIndex}][id]`, con.id);
        formData.append(`contractors[${conIndex}][name]`, con.name || '');
        formData.append(`contractors[${conIndex}][budget]`, con.budget || 0);
        formData.append(`contractors[${conIndex}][walletaddress]`, con.walletaddress || '');

        (con.purchases || []).forEach((pur, purIndex) => {
          if (pur.id) formData.append(`contractors[${conIndex}][purchases][${purIndex}][id]`, pur.id);
          formData.append(`contractors[${conIndex}][purchases][${purIndex}][description]`, pur.description || '');
          formData.append(`contractors[${conIndex}][purchases][${purIndex}][amount]`, pur.amount || 0);

          (pur.invoices || []).forEach((file) => {
            if (file instanceof File) {
              formData.append(`contractors[${conIndex}][purchases][${purIndex}][invoices]`, file);
            }
          });
        });
      });

      body = formData;
    } else {
      headers = { 'Content-Type': 'application/json' };
      body = JSON.stringify(data);
    }

    return new Promise((resolve, reject) => {
      fetch(`${baseURL}/dtscf/${id}`, {
        method: 'PUT',
        headers,
        body
      })
      .then(response => {
        if (!response.ok) {
          reject(new Error(`HTTP error! status: ${response.status}`));
          return;
        }
        const reader = response.body.getReader();
        let buffer = '';
        const processStream = ({ done, value }) => {
          if (done) {
            const lines = buffer.split('\n').filter(line => line);
            lines.forEach(line => {
              if (line.startsWith('LOG: ')) {
                onLog(line.substring(5));
              } else if (line.startsWith('SUCCESS: ')) {
                resolve({ message: line.substring(9) });
              } else if (line.startsWith('ERROR: ')) {
                reject(new Error(line.substring(7)));
              }
            });
            if (!lines.some(line => line.startsWith('SUCCESS: ') || line.startsWith('ERROR: '))) {
              resolve({ message: 'Operation completed successfully.' });
            }
            return;
          }
          buffer += new TextDecoder().decode(value);
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          lines.forEach(line => {
            if (line) {
              if (line.startsWith('LOG: ')) {
                onLog(line.substring(5));
              } else if (line.startsWith('SUCCESS: ')) {
                resolve({ message: line.substring(9) });
              } else if (line.startsWith('ERROR: ')) {
                reject(new Error(line.substring(7)));
              }
            }
          });
          reader.read().then(processStream).catch(reject);
        };
        reader.read().then(processStream).catch(reject);
      })
      .catch(reject);
    });
  }

  createUnwrapDraft(id, data) {
    console.log("Calling /dtscf/createunwrapdraft?id");
    return http.put(`/dtscf/createunwrapdraft/${id}`, data);
  }

  approveUnwrapDraftById(id, data, onLog = () => {}) {
    console.log(`Calling /dtscf/approveunwrapdraftbyid?${id}`);

    const baseURL = http.defaults.baseURL;
    return new Promise((resolve, reject) => {
      fetch(`${baseURL}/dtscf/approveunwrapdraftbyid/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      .then(response => {
        if (!response.ok) {
          reject(new Error(`HTTP error! status: ${response.status}`));
          return;
        }
        const reader = response.body.getReader();
        let buffer = '';
        const processStream = ({ done, value }) => {
          if (done) {
            const lines = (buffer ? [buffer] : []); // Treat remaining buffer as a line if present
            lines.forEach(line => {
              if (line) {
                if (line.startsWith('LOG: ')) {
                  onLog(line.substring(5));
                } else if (line.startsWith('SUCCESS:')) {
                  resolve({ message: line.substring(9) });
                  return; // Prevent double resolve
                } else if (line.startsWith('ERROR:')) {
                  reject(new Error(line.substring(7)));
                  return;
                }
              }
            });
            resolve({ message: 'Operation completed successfully.' });
            return;
          }
          buffer += new TextDecoder().decode(value);
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          lines.forEach(line => {
            if (line) {
              if (line.startsWith('LOG: ')) {
                onLog(line.substring(5));
              } else if (line.startsWith('SUCCESS: ')) {
                resolve({ message: line.substring(9) });
              } else if (line.startsWith('ERROR: ')) {
                reject(new Error(line.substring(7)));
              }
            }
          });
          reader.read().then(processStream).catch(reject);
        };
        reader.read().then(processStream).catch(reject);
      })
      .catch(reject);
    });
  } // approveUnwrapDraft
  

  approveMilestoneCompletedById(id, data) {
    console.log("Calling /dtscf/approvemilestonecompletedbyid?id");
    return http.put(`/dtscf/approvemilestonecompletedbyid/${id}`, data);
  }

  getTPNFT(id, data) {
    console.log("Calling /dtscf/gettpnft?id");
    return http.put(`/dtscf/gettpnft/${id}`, data);
  }

  submitDraftById(id, data, onLog = () => {}) {
    console.log(`Calling /dtscf/submitdraftbyid?${id}`);
    const baseURL = http.defaults.baseURL;
    return new Promise((resolve, reject) => {
      fetch(`${baseURL}/dtscf/submitdraftbyid/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      .then(response => {
        if (!response.ok) {
          reject(new Error(`HTTP error! status: ${response.status}`));
          return;
        }
        const reader = response.body.getReader();
        let buffer = '';
        const processStream = ({ done, value }) => {
          if (done) {
            const lines = (buffer ? [buffer] : []); // Treat remaining buffer as a line if present
            lines.forEach(line => {
              if (line) {
                if (line.startsWith('LOG: ')) {
                  onLog(line.substring(5));
                } else if (line.startsWith('SUCCESS: ')) {
                  resolve({ message: line.substring(9) });
                  return; // Prevent double resolve
                } else if (line.startsWith('ERROR: ')) {
                  reject(new Error(line.substring(7)));
                  return;
                }
              }
            });
            resolve({ message: 'Operation completed successfully.' });
            return;
          }
          buffer += new TextDecoder().decode(value);
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          lines.forEach(line => {
            if (line) {
              if (line.startsWith('LOG: ')) {
                onLog(line.substring(5));
              } else if (line.startsWith('SUCCESS: ')) {
                resolve({ message: line.substring(9) });
              } else if (line.startsWith('ERROR: ')) {
                reject(new Error(line.substring(7)));
              }
            }
          });
          reader.read().then(processStream).catch(reject);
        };
        reader.read().then(processStream).catch(reject);
      })
      .catch(reject);
    });
  }

  acceptDraftById(id, data) {
    console.log("Calling /dtscf/acceptdraftbyid?id");
    return http.put(`/dtscf/acceptdraftbyid/${id}`, data);
  }

  approveDraftById(id, data, onLog = () => {}) {
    console.log(`Calling /dtscf/approvedraftbyid?${id}`);

    const baseURL = http.defaults.baseURL;
    return new Promise((resolve, reject) => {
      fetch(`${baseURL}/dtscf/approvedraftbyid/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      .then(response => {
        if (!response.ok) {
          reject(new Error(`HTTP error! status: ${response.status}`));
          return;
        }
        const reader = response.body.getReader();
        let buffer = '';
        const processStream = ({ done, value }) => {
          if (done) {
            const lines = (buffer ? [buffer] : []); // Treat remaining buffer as a line if present
            lines.forEach(line => {
              if (line) {
                if (line.startsWith('LOG: ')) {
                  onLog(line.substring(5));
                } else if (line.startsWith('SUCCESS:')) {
                  resolve({ message: line.substring(9) });
                  return; // Prevent double resolve
                } else if (line.startsWith('ERROR:')) {
                  reject(new Error(line.substring(7)));
                  return;
                }
              }
            });
            resolve({ message: 'Operation completed successfully.' });
            return;
          }
          buffer += new TextDecoder().decode(value);
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          lines.forEach(line => {
            if (line) {
              if (line.startsWith('LOG: ')) {
                onLog(line.substring(5));
              } else if (line.startsWith('SUCCESS: ')) {
                resolve({ message: line.substring(9) });
              } else if (line.startsWith('ERROR: ')) {
                reject(new Error(line.substring(7)));
              }
            }
          });
          reader.read().then(processStream).catch(reject);
        };
        reader.read().then(processStream).catch(reject);
      })
      .catch(reject);
    });
  }

  triggerDtscfCouponPaymentById(id, data) {
    console.log("Calling /dtscf/triggerDtscfCouponPaymentById?id");
    return http.put(`/dtscf/triggerDtscfCouponPaymentById/${id}`, data);
  }

  approveDeleteDraftById(id, data) {
    console.log("Calling /dtscf/approvedeletedraftbyid?id");
    return http.put(`/dtscf/approvedeletedraftbyid/${id}`, data);
  }

  rejectDraftById(id, data) {
    console.log("Calling /dtscf/rejectdraftbyid?id");
    return http.put(`/dtscf/rejectdraftbyid/${id}`, data);
  }

  dropRequestById(id, data) {
    console.log("Calling /dtscf/droprequestbyid?id");
    return http.put(`/dtscf/droprequestbyid/${id}`, data);
  }

  delete(id) {
    return http.delete(`/dtscf/${id}`);
  }
  
  deleteAll() {
    return http.delete(`/dtscf`);
  }


  
/*
  update(id, data, onLog = () => {}) {
    const baseURL = http.defaults.baseURL;
    return new Promise((resolve, reject) => {
      fetch(`${baseURL}/dtscf/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      .then(response => {
        if (!response.ok) {
          reject(new Error(`HTTP error! status: ${response.status}`));
          return;
        }
        const reader = response.body.getReader();
        let buffer = '';
        const processStream = ({ done, value }) => {
          if (done) {
            const lines = (buffer ? [buffer] : []); // Treat remaining buffer as a line if present
            lines.forEach(line => {
              if (line) {
                if (line.startsWith('LOG: ')) {
                  onLog(line.substring(5));
                } else if (line.startsWith('SUCCESS: ')) {
                  resolve({ message: line.substring(9) });
                  return; // Prevent double resolve
                } else if (line.startsWith('ERROR: ')) {
                  reject(new Error(line.substring(7)));
                  return;
                }
              }
            });
            resolve({ message: 'Operation completed successfully.' });
            return;
          }
          buffer += new TextDecoder().decode(value);
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          lines.forEach(line => {
            if (line) {
              if (line.startsWith('LOG: ')) {
                onLog(line.substring(5));
              } else if (line.startsWith('SUCCESS: ')) {
                resolve({ message: line.substring(9) });
              } else if (line.startsWith('ERROR: ')) {
                  reject(new Error(line.substring(7)));
                }
              }
            }
          });
          reader.read().then(processStream).catch(reject);
        };
        reader.read().then(processStream).catch(reject);
      })
      .catch(reject);
    });
  }

  acceptDraftById(id, data, onLog = () => {}) {
    const baseURL = http.defaults.baseURL;
    return new Promise((resolve, reject) => {
      fetch(`${baseURL}/dtscf/acceptdraftbyid/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      .then(response => {
        if (!response.ok) {
          reject(new Error(`HTTP error! status: ${response.status}`));
          return;
        }
        const reader = response.body.getReader();
        let buffer = '';
        const processStream = ({ done, value }) => {
          if (done) {
            const lines = (buffer ? [buffer] : []); // Treat remaining buffer as a line if present
            lines.forEach(line => {
              if (line) {
                if (line.startsWith('LOG: ')) {
                  onLog(line.substring(5));
                } else if (line.startsWith('SUCCESS: ')) {
                  resolve({ message: line.substring(9) });
                  return; // Prevent double resolve
                } else if (line.startsWith('ERROR: ')) {
                  reject(new Error(line.substring(7)));
                  return;
                }
              }
            });
            resolve({ message: 'Operation completed successfully.' });
            return;
          }
          buffer += new TextDecoder().decode(value);
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          lines.forEach(line => {
            if (line) {
              if (line.startsWith('LOG: ')) {
                onLog(line.substring(5));
              } else if (line.startsWith('SUCCESS: ')) {
                resolve({ message: line.substring(9) });
              } else if (line.startsWith('ERROR: ')) {
                reject(new Error(line.substring(7)));
              }
            }
          });
          reader.read().then(processStream).catch(reject);
        };
        reader.read().then(processStream).catch(reject);
      })
      .catch(reject);
    });
  }

  approveDraftById(id, data, onLog = () => {}) {
    const baseURL = http.defaults.baseURL;
    return new Promise((resolve, reject) => {
      fetch(`${baseURL}/dtscf/approvedraftbyid/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      .then(response => {
        if (!response.ok) {
          reject(new Error(`HTTP error! status: ${response.status}`));
          return;
        }
        const reader = response.body.getReader();
        let buffer = '';
        const processStream = ({ done, value }) => {
          if (done) {
            const lines = (buffer ? [buffer] : []); // Treat remaining buffer as a line if present
            lines.forEach(line => {
              if (line) {
                if (line.startsWith('LOG: ')) {
                  onLog(line.substring(5));
                } else if (line.startsWith('SUCCESS: ')) {
                  resolve({ message: line.substring(9) });
                  return; // Prevent double resolve
                } else if (line.startsWith('ERROR: ')) {
                  reject(new Error(line.substring(7)));
                  return;
                }
              }
            });
            resolve({ message: 'Operation completed successfully.' });
            return;
          }
          buffer += new TextDecoder().decode(value);
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          lines.forEach(line => {
            if (line) {
              if (line.startsWith('LOG: ')) {
                onLog(line.substring(5));
              } else if (line.startsWith('SUCCESS: ')) {
                  resolve({ message: line.substring(9) });
                } else if (line.startsWith('ERROR: ')) {
                  reject(new Error(line.substring(7)));
                }
              }
            }
          });
          reader.read().then(processStream).catch(reject);
        };
        reader.read().then(processStream).catch(reject);
      })
      .catch(reject);
    });
  }

  approveDeleteDraftById(id, data, onLog = () => {}) {
    const baseURL = http.defaults.baseURL;
    return new Promise((resolve, reject) => {
      fetch(`${baseURL}/dtscf/approvedeletedraftbyid/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      .then(response => {
        if (!response.ok) {
          reject(new Error(`HTTP error! status: ${response.status}`));
          return;
        }
        const reader = response.body.getReader();
        let buffer = '';
        const processStream = ({ done, value }) => {
          if (done) {
            const lines = (buffer ? [buffer] : []); // Treat remaining buffer as a line if present
            lines.forEach(line => {
              if (line) {
                if (line.startsWith('LOG: ')) {
                  onLog(line.substring(5));
                } else if (line.startsWith('SUCCESS: ')) {
                  resolve({ message: line.substring(9) });
                  return; // Prevent double resolve
                } else if (line.startsWith('ERROR: ')) {
                  reject(new Error(line.substring(7)));
                  return;
                }
              }
            });
            resolve({ message: 'Operation completed successfully.' });
            return;
          }
          buffer += new TextDecoder().decode(value);
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          lines.forEach(line => {
            if (line) {
              if (line.startsWith('LOG: ')) {
                onLog(line.substring(5));
              } else if (line.startsWith('SUCCESS: ')) {
                resolve({ message: line.substring(9) });
              } else if (line.startsWith('ERROR: ')) {
                reject(new Error(line.substring(7)));
              }
            }
          });
          reader.read().then(processStream).catch(reject);
        };
        reader.read().then(processStream).catch(reject);
      })
      .catch(reject);
    });
  }

  rejectDraftById(id, data, onLog = () => {}) {
    const baseURL = http.defaults.baseURL;
    return new Promise((resolve, reject) => {
      fetch(`${baseURL}/dtscf/rejectdraftbyid/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      .then(response => {
        if (!response.ok) {
          reject(new Error(`HTTP error! status: ${response.status}`));
          return;
        }
        const reader = response.body.getReader();
        let buffer = '';
        const processStream = ({ done, value }) => {
          if (done) {
            const lines = (buffer ? [buffer] : []); // Treat remaining buffer as a line if present
            lines.forEach(line => {
              if (line) {
                if (line.startsWith('LOG: ')) {
                  onLog(line.substring(5));
                } else if (line.startsWith('SUCCESS: ')) {
                  resolve({ message: line.substring(9) });
                  return; // Prevent double resolve
                } else if (line.startsWith('ERROR: ')) {
                  reject(new Error(line.substring(7)));
                  return;
                }
              }
            });
            resolve({ message: 'Operation completed successfully.' });
            return;
          }
          buffer += new TextDecoder().decode(value);
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          lines.forEach(line => {
            if (line) {
              if (line.startsWith('LOG: ')) {
                onLog(line.substring(5));
              } else if (line.startsWith('SUCCESS: ')) {
                resolve({ message: line.substring(9) });
              } else if (line.startsWith('ERROR: ')) {
                reject(new Error(line.substring(7)));
              }
            }
          });
          reader.read().then(processStream).catch(reject);
        };
        reader.read().then(processStream).catch(reject);
      })
      .catch(reject);
    });
  }

  dropRequestById(id, data, onLog = () => {}) {
    const baseURL = http.defaults.baseURL;
    return new Promise((resolve, reject) => {
      fetch(`${baseURL}/dtscf/droprequestbyid/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      .then(response => {
        if (!response.ok) {
          reject(new Error(`HTTP error! status: ${response.status}`));
          return;
        }
        const reader = response.body.getReader();
        let buffer = '';
        const processStream = ({ done, value }) => {
          if (done) {
            const lines = (buffer ? [buffer] : []); // Treat remaining buffer as a line if present
            lines.forEach(line => {
              if (line) {
                if (line.startsWith('LOG: ')) {
                  onLog(line.substring(5));
                } else if (line.startsWith('SUCCESS: ')) {
                  resolve({ message: line.substring(9) });
                  return; // Prevent double resolve
                } else if (line.startsWith('ERROR: ')) {
                  reject(new Error(line.substring(7)));
                  return;
                }
              }
            });
            resolve({ message: 'Operation completed successfully.' });
            return;
          }
          buffer += new TextDecoder().decode(value);
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          lines.forEach(line => {
            if (line) {
              if (line.startsWith('LOG: ')) {
                onLog(line.substring(5));
              } else if (line.startsWith('SUCCESS: ')) {
                resolve({ message: line.substring(9) });
              } else if (line.startsWith('ERROR: ')) {
                reject(new Error(line.substring(7)));
              }
            }
          });
          reader.read().then(processStream).catch(reject);
        };
        reader.read().then(processStream).catch(reject);
      })
      .catch(reject);
    });
  }

  delete(id, data, onLog = () => {}) {
    const baseURL = http.defaults.baseURL;
    return new Promise((resolve, reject) => {
      fetch(`${baseURL}/dtscf/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      .then(response => {
        if (!response.ok) {
          reject(new Error(`HTTP error! status: ${response.status}`));
          return;
        }
        const reader = response.body.getReader();
        let buffer = '';
        const processStream = ({ done, value }) => {
          if (done) {
            const lines = (buffer ? [buffer] : []); // Treat remaining buffer as a line if present
            lines.forEach(line => {
              if (line) {
                if (line.startsWith('LOG: ')) {
                  onLog(line.substring(5));
                } else if (line.startsWith('SUCCESS: ')) {
                  resolve({ message: line.substring(9) });
                  return; // Prevent double resolve
                } else if (line.startsWith('ERROR: ')) {
                  reject(new Error(line.substring(7)));
                  return;
                }
              }
            });
            resolve({ message: 'Operation completed successfully.' });
            return;
          }
          buffer += new TextDecoder().decode(value);
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          lines.forEach(line => {
            if (line) {
              if (line.startsWith('LOG: ')) {
                onLog(line.substring(5));
              } else if (line.startsWith('SUCCESS: ')) {
                resolve({ message: line.substring(9) });
              } else if (line.startsWith('ERROR: ')) {
                reject(new Error(line.substring(7)));
              }
            }
          });
          reader.read().then(processStream).catch(reject);
        };
        reader.read().then(processStream).catch(reject);
      })
      .catch(reject);
    });
  }

  deleteAll(data, onLog = () => {}) {
    const baseURL = http.defaults.baseURL;
    return new Promise((resolve, reject) => {
      fetch(`${baseURL}/dtscf`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      .then(response => {
        if (!response.ok) {
          reject(new Error(`HTTP error! status: ${response.status}`));
          return;
        }
        const reader = response.body.getReader();
        let buffer = '';
        const processStream = ({ done, value }) => {
          if (done) {
            const lines = (buffer ? [buffer] : []); // Treat remaining buffer as a line if present
            lines.forEach(line => {
              if (line) {
                if (line.startsWith('LOG: ')) {
                  onLog(line.substring(5));
                } else if (line.startsWith('SUCCESS: ')) {
                  resolve({ message: line.substring(9) });
                  return; // Prevent double resolve
                } else if (line.startsWith('ERROR: ')) {
                  reject(new Error(line.substring(7)));
                  return;
                }
              }
            });
            resolve({ message: 'Operation completed successfully.' });
            return;
          }
          buffer += new TextDecoder().decode(value);
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          lines.forEach(line => {
            if (line) {
              if (line.startsWith('LOG: ')) {
                onLog(line.substring(5));
              } else if (line.startsWith('SUCCESS: ')) {
                resolve({ message: line.substring(9) });
              } else if (line.startsWith('ERROR: ')) {
                reject(new Error(line.substring(7)));
              }
            }
          });
          reader.read().then(processStream).catch(reject);
        };
        reader.read().then(processStream).catch(reject);
      })
      .catch(reject);
    });
  }
*/
  findByName(name) {
    return http.get(`/dtscf/findByName?name=${name}`);
  }
  getAllDraftsByUserId(id) {
    return http.get(`/dtscf/getalldraftsbyuserid?id=${id}`);
  }
  getAllDraftsByDtscfId(id) {
    return http.get(`/dtscf/getalldraftsbydtscfid?id=${id}`);
  }
  findDraftByNameExact(name) {
    return http.get(`/dtscf/finddraftbynameexact?name=${name}`);
  }
  findDraftByApprovedId(id) {
    return http.get(`/dtscf/finddraftbyapprovedid?id=${id}`);
  }
  findByNameExact(name) {
    return http.get(`/dtscf/findexact?name=${name}`);
  }
  getInWalletMintedTotalSupply(id) {
    return http.get(`/dtscf/getInWalletMintedTotalSupply?id=${id}`);
  }
}

export default new DtscfDataService();
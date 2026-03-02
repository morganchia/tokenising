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
  getAllByDtscfId(id) {
    return http.get(`/dtscf/getallbydtscfid?id=${id}`);
  }
  draftCreate(data) {
    return http.post("/dtscf/draftcreate", data);
  }
  update(id, data) {
    return http.put(`/dtscf/${id}`, data);
  }
/*
  submitDraftById(id, data) {
    return http.put(`/dtscf/submitdraftbyid/${id}`, data);
  }
*/
submitDraftById(id, data, onLog = () => {}) {
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
  approveDraftById(id, data) {
    console.log("Calling /dtscf/approvedraftbyid?id");
    return http.put(`/dtscf/approvedraftbyid/${id}`, data);
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
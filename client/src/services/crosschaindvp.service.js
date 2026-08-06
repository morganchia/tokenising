import http from "../common/http";

class CrossChainDvPDataService {

  getAll() {
    return http.get("/crosschaindvp");
  }

  draftCreate(data) {
    return http.post("/crosschaindvp/draftcreate", data);
  }

  submitDraftById(id, data) {
    return http.put(`/crosschaindvp/submitdraftbyid/${id}`, data);
  }

  acceptDraftById(id, data) {
    return http.put(`/crosschaindvp/acceptdraftbyid/${id}`, data);
  }

  approveDraftById(id, data) {
    return http.put(`/crosschaindvp/approvedraftbyid/${id}`, data);
  }

  approveDeleteDraftById(id, data) {
    return http.put(`/crosschaindvp/approvedeletedraftbyid/${id}`, data);
  }

  rejectDraftById(id, data) {
    return http.put(`/crosschaindvp/rejectdraftbyid/${id}`, data);
  }

  dropRequestById(id, data) {
    return http.put(`/crosschaindvp/droprequestbyid/${id}`, data);
  }

  executeStartLegById(id, data, onLog = () => {}) {
    return this._executeLegStreamed('executestartlegbyid', id, data, onLog);
  }

  executeMaturityLegById(id, data, onLog = () => {}) {
    return this._executeLegStreamed('executematuritylegbyid', id, data, onLog);
  }

  // Reads the chunked LOG:/LOCKS:/SUCCESS:/ERROR: response written by executeLeg in
  // crosschaindvp.controller.js - same streaming convention as
  // dtscf.service.js's approveContractorAmendment - so onLog can show real backend
  // progress (which counterparty's tokens are being pulled, on which chain) instead
  // of a plain spinner during the ~30-60s a leg lock can take.
  _executeLegStreamed(path, id, data, onLog) {
    const baseURL = http.defaults.baseURL;
    return new Promise((resolve, reject) => {
      fetch(`${baseURL}/crosschaindvp/${path}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      .then(response => {
        if (!response.ok) { reject(new Error(`HTTP error! status: ${response.status}`)); return; }
        const reader = response.body.getReader();
        let buffer = '';
        let pendingLocks = null;
        const handleLine = line => {
          if (line.startsWith('LOG: ')) onLog(line.substring(5));
          else if (line.startsWith('LOCKS: ')) { try { pendingLocks = JSON.parse(line.substring(7)); } catch (_) {} }
          else if (line.startsWith('SUCCESS: ')) resolve({ message: line.substring(9), locks: pendingLocks });
          else if (line.startsWith('ERROR: ')) reject(new Error(line.substring(7)));
        };
        const processStream = ({ done, value }) => {
          if (done) {
            (buffer ? buffer.split('\n') : []).filter(l => l).forEach(handleLine);
            return;
          }
          buffer += new TextDecoder().decode(value);
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          lines.filter(l => l).forEach(handleLine);
          reader.read().then(processStream).catch(reject);
        };
        reader.read().then(processStream).catch(reject);
      })
      .catch(reject);
    });
  }

  refundLegById(id, data) {
    return http.put(`/crosschaindvp/refundlegbyid/${id}`, data);
  }

  findByName(name) {
    return http.get(`/crosschaindvp/findByName?name=${name}`);
  }

  findOne(id) {
    return http.get(`/crosschaindvp/findone?id=${id}`);
  }

  getAllDraftsByUserId(id) {
    return http.get(`/crosschaindvp/getallcrosschaindvpdraftsbyuserid?id=${id}`);
  }

  getAllDraftsByTradeId(id) {
    return http.get(`/crosschaindvp/getalldraftsbycrosschaindvpid?id=${id}`);
  }

  findByNameExact(name) {
    return http.get(`/crosschaindvp/findexact?name=${name}`);
  }

}

export default new CrossChainDvPDataService();

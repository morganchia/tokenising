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

  executeStartLegById(id, data) {
    return http.put(`/crosschaindvp/executestartlegbyid/${id}`, data);
  }

  executeMaturityLegById(id, data) {
    return http.put(`/crosschaindvp/executematuritylegbyid/${id}`, data);
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

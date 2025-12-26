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
  submitDraftById(id, data) {
    console.log("Calling /dtscf/submitdraftbyid?id");
    return http.put(`/dtscf/submitdraftbyid/${id}`, data);
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
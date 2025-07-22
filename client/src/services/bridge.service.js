import http from "../common/http";

class BridgeDataService {
  getAll() {
    return http.get("/bridge");
  }
  getAllBridgeTemplates() {
    return http.get("/bridge/getallbridgetemplates");
  }
  findOne(id) {
    return http.get(`/bridge/${id}`);
  }
  getAllInvestorsById(id) {
    return http.get(`/bridge/getallinvestorsbyid?id=${id}`);
  }
  getAllByBridgeId(id) {
    return http.get(`/bridge/getallbybridgeid?id=${id}`);
  }
  draftCreate(data) {
    return http.post("/bridge/draftcreate", data);
  }
  update(id, data) {
    return http.put(`/bridge/${id}`, data);
  }
  submitDraftById(id, data) {
    console.log("Calling /bridge/submitdraftbyid?id");
    return http.put(`/bridge/submitdraftbyid/${id}`, data);
  }
  acceptDraftById(id, data) {
    console.log("Calling /bridge/acceptdraftbyid?id");
    return http.put(`/bridge/acceptdraftbyid/${id}`, data);
  }
  approveDraftById(id, data) {
    console.log("Calling /bridge/approvedraftbyid?id");
    return http.put(`/bridge/approvedraftbyid/${id}`, data);
  }
  triggerBridgeCouponPaymentById(id, data) {
    console.log("Calling /bridge/triggerBridgeCouponPaymentById?id");
    return http.put(`/bridge/triggerBridgeCouponPaymentById/${id}`, data);
  }
  approveDeleteDraftById(id, data) {
    console.log("Calling /bridge/approvedeletedraftbyid?id");
    return http.put(`/bridge/approvedeletedraftbyid/${id}`, data);
  }
  rejectDraftById(id, data) {
    console.log("Calling /bridge/rejectdraftbyid?id");
    return http.put(`/bridge/rejectdraftbyid/${id}`, data);
  }
  dropRequestById(id, data) {
    console.log("Calling /bridge/droprequestbyid?id");
    return http.put(`/bridge/droprequestbyid/${id}`, data);
  }
  delete(id) {
    return http.delete(`/bridge/${id}`);
  }
  deleteAll() {
    return http.delete(`/bridge`);
  }
  findByName(name) {
    return http.get(`/bridge/findByName?name=${name}`);
  }
  getAllDraftsByUserId(id) {
    return http.get(`/bridge/getalldraftsbyuserid?id=${id}`);
  }
  getAllDraftsByBridgeId(id) {
    return http.get(`/bridge/getalldraftsbybridgeid?id=${id}`);
  }
  findDraftByNameExact(name) {
    return http.get(`/bridge/finddraftbynameexact?name=${name}`);
  }
  findDraftByApprovedId(id) {
    return http.get(`/bridge/finddraftbyapprovedid?id=${id}`);
  }
  findByNameExact(name) {
    return http.get(`/bridge/findexact?name=${name}`);
  }
  getInWalletMintedTotalSupply(id) {
    return http.get(`/bridge/getInWalletMintedTotalSupply?id=${id}`);
  }
}

export default new BridgeDataService();
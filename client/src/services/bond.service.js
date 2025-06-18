import http from "../common/http";

class BondDataService {
  getAll() {
    return http.get("/bond");
  }
  getAllBondTemplates() {
    return http.get("/bond/getallbondtemplates");
  }
  findOne(id) {
    return http.get(`/bond/${id}`);
  }
  getAllInvestorsById(id) {
    return http.get(`/bond/getallinvestorsbyid?id=${id}`);
  }
  getAllByBondId(id) {
    return http.get(`/bond/getallbybondid?id=${id}`);
  }
  draftCreate(data) {
    return http.post("/bond/draftcreate", data);
  }
  update(id, data) {
    return http.put(`/bond/${id}`, data);
  }
  submitDraftById(id, data) {
    console.log("Calling /bond/submitdraftbyid?id");
    return http.put(`/bond/submitdraftbyid/${id}`, data);
  }
  acceptDraftById(id, data) {
    console.log("Calling /bond/acceptdraftbyid?id");
    return http.put(`/bond/acceptdraftbyid/${id}`, data);
  }
  approveDraftById(id, data) {
    console.log("Calling /bond/approvedraftbyid?id");
    return http.put(`/bond/approvedraftbyid/${id}`, data);
  }
  triggerBondCouponPaymentById(id, data) {
    console.log("Calling /bond/triggerBondCouponPaymentById?id");
    return http.put(`/bond/triggerBondCouponPaymentById/${id}`, data);
  }
  approveDeleteDraftById(id, data) {
    console.log("Calling /bond/approvedeletedraftbyid?id");
    return http.put(`/bond/approvedeletedraftbyid/${id}`, data);
  }
  rejectDraftById(id, data) {
    console.log("Calling /bond/rejectdraftbyid?id");
    return http.put(`/bond/rejectdraftbyid/${id}`, data);
  }
  dropRequestById(id, data) {
    console.log("Calling /bond/droprequestbyid?id");
    return http.put(`/bond/droprequestbyid/${id}`, data);
  }
  delete(id) {
    return http.delete(`/bond/${id}`);
  }
  deleteAll() {
    return http.delete(`/bond`);
  }
  findByName(name) {
    return http.get(`/bond/findByName?name=${name}`);
  }
  getAllDraftsByUserId(id) {
    return http.get(`/bond/getalldraftsbyuserid?id=${id}`);
  }
  getAllDraftsByBondId(id) {
    return http.get(`/bond/getalldraftsbybondid?id=${id}`);
  }
  findDraftByNameExact(name) {
    return http.get(`/bond/finddraftbynameexact?name=${name}`);
  }
  findDraftByApprovedId(id) {
    return http.get(`/bond/finddraftbyapprovedid?id=${id}`);
  }
  findByNameExact(name) {
    return http.get(`/bond/findexact?name=${name}`);
  }
  getInWalletMintedTotalSupply(id) {
    return http.get(`/bond/getInWalletMintedTotalSupply?id=${id}`);
  }
}

export default new BondDataService();
import http from "../common/http";

class TransferDataService {

  findAllTransfers() {
    return http.get("/transfers/findAllTransfers");
  }

  getAll() {
    return http.get("/transfers");
  }
  
  get(id) {
    return http.get(`/transfers/${id}`);
  }

  create(data) {
    return http.post("/transfers", data);
  }

  draftCreate(data) {
    return http.post("/transfers/draftcreate", data);
  }

  update(id, data) {
    return http.put(`/transfers/${id}`, data);
  }

  submitDraftById(id, data) {
    console.log("Calling /transfers/submitdraftbyid?id");
    return http.put(`/transfers/submitdraftbyid/${id}`, data);
  }

  acceptDraftById(id, data) {
    console.log("Calling /transfers/acceptdraftbyid?id");
    return http.put(`/transfers/acceptdraftbyid/${id}`, data);
  }

  approveDraftById(id, data) {
    console.log("Calling /transfers/approvedraftbyid?id");
    return http.put(`/transfers/approvedraftbyid/${id}`, data);
  }

  approveDeleteDraftById(id, data) {
    console.log("Calling /transfers/approvedeletedraftbyid?id");
    return http.put(`/transfers/approvedeletedraftbyid/${id}`, data);
  }

  rejectDraftById(id, data) {
    console.log("Calling /transfers/rejectdraftbyid?id");
    return http.put(`/transfers/rejectdraftbyid/${id}`, data);
  }



  delete(id) {
    return http.delete(`/transfers/${id}`);
  }

  deleteAll() {
    return http.delete(`/transfers`);
  }

  findByName(name) {
    return http.get(`/transfers?name=${name}`);
  }

  findByNameExact(name) {
    return http.get(`/transfers/findexact?name=${name}`);
  }

  getAllDraftsByUserId(id) {
    return http.get(`/transfers/getalldraftsbyuserid?id=${id}`);
  }

  getAllDraftsByTransferId(id) {
    return http.get(`/transfers/getalldraftsbytransferid?id=${id}`);
  }

  findAllByCampaignId(id) {
    return http.get(`/transfers/findAllByCampaignId?id=${id}`);
  }
}

export default new TransferDataService();
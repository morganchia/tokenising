import http from "../common/http";

class RecipientDataService {

  findAllRecipients() {
    return http.get("/recipients/findAllRecipients");
  }

  draftCreate(data) {
    return http.post("/recipients/draftcreate", data);
  }

  getAllDraftsByUserId(id) {
    return http.get(`/recipients/getalldraftsbyuserid?id=${id}`);
  }

  getAllDraftsByRecipientId(id) {
    return http.get(`/recipients/getalldraftsbyrecipientid?id=${id}`);
  }

  submitDraftById(id, data) {
    console.log("Calling /recipients/submitdraftbyid?id");
    return http.put(`/recipients/submitdraftbyid/${id}`, data);
  }

  acceptDraftById(id, data) {
    console.log("Calling /recipients/acceptdraftbyid?id");
    return http.put(`/recipients/acceptdraftbyid/${id}`, data);
  }

  approveDraftById(id, data) {
    console.log("Calling /recipients/approvedraftbyid?id");
    return http.put(`/recipients/approvedraftbyid/${id}`, data);
  }

  approveDeleteDraftById(id, data) {
    console.log("Calling /recipients/approvedeletedraftbyid?id");
    return http.put(`/recipients/approvedeletedraftbyid/${id}`, data);
  }

  rejectDraftById(id, data) {
    console.log("Calling /recipients/rejectdraftbyid?id");
    return http.put(`/recipients/rejectdraftbyid/${id}`, data);
  }

  dropRequestById(id, data) {
    console.log("Calling /recipients/droprequestbyid?id");
    return http.put(`/recipients/droprequestbyid/${id}`, data);
  }


/*
  getAll() {
    return http.get("/recipients");
  }

  get(id) {
    return http.get(`/recipients/${id}`);
  }

  create(data) {
    return http.post("/recipients", data);
  }

  update(id, data) {
    return http.put(`/recipients/${id}`, data);
  }

  delete(id) {
    return http.delete(`/recipients/${id}`);
  }

  deleteAll() {
    return http.delete(`/recipients`);
  }

  findByName(name) {
    return http.get(`/recipients?name=${name}`);
  }

  findByNameExact(name) {
    return http.get(`/recipients/findexact?name=${name}`);
  }

  */
}

export default new RecipientDataService();
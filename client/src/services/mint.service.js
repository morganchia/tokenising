import http from "../common/http";

class MintDataService {

  findAllMints() {
    return http.get("/mints/findAllMints");
  }

  getAll() {
    return http.get("/mints");
  }
  
  get(id) {
    return http.get(`/mints/${id}`);
  }

  draftCreate(data) {
    return http.post("/mints/draftcreate", data);
  }

  create(data) {
    return http.post("/mints", data);
  }

  update(id, data) {
    return http.put(`/mints/${id}`, data);
  }

  submitDraftById(id, data) {
    console.log("Calling /mints/submitdraftbyid?id");
    return http.put(`/mints/submitdraftbyid/${id}`, data);
  }

  acceptDraftById(id, data) {
    console.log("Calling /mints/acceptdraftbyid?id");
    return http.put(`/mints/acceptdraftbyid/${id}`, data);
  }

  approveDraftById(id, data) {
    console.log("Calling /mints/approvedraftbyid?id");
    return http.put(`/mints/approvedraftbyid/${id}`, data);
  }

  approveDeleteDraftById(id, data) {
    console.log("Calling /mints/approvedeletedraftbyid?id");
    return http.put(`/mints/approvedeletedraftbyid/${id}`, data);
  }

  rejectDraftById(id, data) {
    console.log("Calling /mints/rejectdraftbyid?id");
    return http.put(`/mints/rejectdraftbyid/${id}`, data);
  }

  dropRequestById(id, data) {
    console.log("Calling /mints/droprequestbyid?id");
    return http.put(`/mints/droprequestbyid/${id}`, data);
  }


  delete(id) {
    return http.delete(`/mints/${id}`);
  }

  deleteAll() {
    return http.delete(`/mints`);
  }

  findByName(name) {
    return http.get(`/mints?name=${name}`);
  }

  findByNameExact(name) {
    return http.get(`/mints/findexact?name=${name}`);
  }

  getAllDraftsByUserId(id) {
    return http.get(`/mints/getalldraftsbyuserid?id=${id}`);
  }

  getAllDraftsByMintId(id) {
    return http.get(`/mints/getalldraftsbymintid?id=${id}`);
  }

  findAllByCampaignId(id) {
    return http.get(`/mints/findAllByCampaignId?id=${id}`);
  }
}

export default new MintDataService();
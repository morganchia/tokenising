import http from "../common/http";

class CampaignDataService {
  getAll() {
    return http.get("/campaigns");
  }
  
  get(id) {
    return http.get(`/campaigns/${id}`);
  }

  /*
  create(data) {
    return http.post("/campaigns", data);
  }
  */

  draftCreate(data) {
    return http.post("/campaigns/draftcreate", data);
  }

  update(id, data) {
    return http.put(`/campaigns/${id}`, data);
  }

  submitDraftById(id, data) {
    console.log("Calling /campaigns/submitdraftbyid?id");
    return http.put(`/campaigns/submitdraftbyid/${id}`, data);
  }

  acceptDraftById(id, data) {
    console.log("Calling /campaigns/acceptdraftbyid?id");
    return http.put(`/campaigns/acceptdraftbyid/${id}`, data);
  }

  approveDraftById(id, data) {
    console.log("Calling /campaigns/approvedraftbyid?id");
    return http.put(`/campaigns/approvedraftbyid/${id}`, data);
  }

  approveDeleteDraftById(id, data) {
    console.log("Calling /campaigns/approvedeletedraftbyid?id");
    return http.put(`/campaigns/approvedeletedraftbyid/${id}`, data);
  }

  rejectDraftById(id, data) {
    console.log("Calling /campaigns/rejectdraftbyid?id");
    return http.put(`/campaigns/rejectdraftbyid/${id}`, data);
  }

  dropRequestById(id, data) {
    console.log("Calling /campaigns/droprequestbyid?id");
    return http.put(`/campaigns/droprequestbyid/${id}`, data);
  }

  delete(id) {
    return http.delete(`/campaigns/${id}`);
  }

  deleteAll() {
    return http.delete(`/campaigns`);
  }

  findByName(name) {
    return http.get(`/campaigns/findByName?name=${name}`);
  }

  getAllDraftsByUserId(id) {
    return http.get(`/campaigns/getalldraftsbyuserid?id=${id}`);
  }

  getAllDraftsByCampaignId(id) {
    return http.get(`/campaigns/getalldraftsbycampaignid?id=${id}`);
  }

  findDraftByNameExact(name) {
    return http.get(`/campaigns/finddraftbynameexact?name=${name}`);
  }

  findDraftByApprovedId(id) {
    return http.get(`/campaigns/finddraftbyapprovedid?id=${id}`);
  }
  
  findByNameExact(name) {
    return http.get(`/campaigns/findexact?name=${name}`);
  }

  getInWalletMintedTotalSupply(id) {
    return http.get(`/campaigns/getInWalletMintedTotalSupply?id=${id}`);
  }

}

export default new CampaignDataService();
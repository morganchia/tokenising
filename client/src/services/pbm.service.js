import http from "../common/http";

class PBMDataService {
  getAll() {
    return http.get("/pbm");
  }

  getAllPBMTemplates() {
    return http.get("/pbm/getallpbmtemplates");
  }

  get(id) {
    return http.get(`/pbm/${id}`);
  }

  /*
  create(data) {
    return http.post("/pbm", data);
  }
  */

  draftCreate(data) {
    return http.post("/pbm/draftcreate", data);
  }

  templateCreate(data) {
    return http.post("/pbm/templatecreate", data);
  }

  update(id, data) {
    return http.put(`/pbm/${id}`, data);
  }

  submitDraftById(id, data) {
    console.log("Calling /pbm/submitdraftbyid?id");
    return http.put(`/pbm/submitdraftbyid/${id}`, data);
  }

  acceptDraftById(id, data) {
    console.log("Calling /pbm/acceptdraftbyid?id");
    return http.put(`/pbm/acceptdraftbyid/${id}`, data);
  }

  approveDraftById(id, data) {
    console.log("Calling /pbm/approvedraftbyid?id");
    return http.put(`/pbm/approvedraftbyid/${id}`, data);
  }

  approveDeleteDraftById(id, data) {
    console.log("Calling /pbm/approvedeletedraftbyid?id");
    return http.put(`/pbm/approvedeletedraftbyid/${id}`, data);
  }

  rejectDraftById(id, data) {
    console.log("Calling /pbm/rejectdraftbyid?id");
    return http.put(`/pbm/rejectdraftbyid/${id}`, data);
  }

  dropRequestById(id, data) {
    console.log("Calling /pbm/droprequestbyid?id");
    return http.put(`/pbm/droprequestbyid/${id}`, data);
  }

  delete(id) {
    return http.delete(`/pbm/${id}`);
  }

  deleteAll() {
    return http.delete(`/pbm`);
  }

  findByName(name) {
    return http.get(`/pbm/findByName?name=${name}`);
  }

  getAllDraftsByUserId(id) {
    return http.get(`/pbm/getalldraftsbyuserid?id=${id}`);
  }

  getAllDraftsByPBMId(id) {
    return http.get(`/pbm/getalldraftsbypbmid?id=${id}`);
  }

  findDraftByNameExact(name) {
    return http.get(`/pbm/finddraftbynameexact?name=${name}`);
  }

  findDraftByApprovedId(id) {
    return http.get(`/pbm/finddraftbyapprovedid?id=${id}`);
  }
  
  findByNameExact(name) {
    return http.get(`/pbm/findexact?name=${name}`);
  }

  findByTemplateNameExact(name) {
    return http.get(`/pbm/findexacttemplate?name=${name}`);
  }

  getInWalletMintedTotalSupply(id) {
    return http.get(`/pbm/getInWalletMintedTotalSupply?id=${id}`);
  }

}

export default new PBMDataService();
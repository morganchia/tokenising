import http from "../common/http";

class DvPDataService {

  getAll() {
    return http.get("/dvp");
  }
/*

  get(id) {
    return http.get(`/dvp/${id}`);
  }


  create(data) {
    return http.post("/dvp", data);
  }


  wrapMint_draftCreate(data) {
    return http.post("/dvp/wrapmintdraftcreate", data);
  }
*/
  draftCreate(data) {
    return http.post("/dvp/draftcreate", data);
  }

  /*

  update(id, data) {
    return http.put(`/dvp/${id}`, data);
  }
*/

  submitDraftById(id, data) {
    console.log("Calling /dvp/submitdraftbyid?id");
    return http.put(`/dvp/submitdraftbyid/${id}`, data);
  }

  acceptDraftById(id, data) {
    console.log("Calling /dvp/acceptdraftbyid?id");
    return http.put(`/dvp/acceptdraftbyid/${id}`, data);
  }

  approveDraftById(id, data) {
    console.log("Calling /dvp/approvedraftbyid?id");
    return http.put(`/dvp/approvedraftbyid/${id}`, data);
  }

  approveDeleteDraftById(id, data) {
    console.log("Calling /dvp/approvedeletedraftbyid?id");
    return http.put(`/dvp/approvedeletedraftbyid/${id}`, data);
  }

  rejectDraftById(id, data) {
    console.log("Calling /dvp/rejectdraftbyid?id");
    return http.put(`/dvp/rejectdraftbyid/${id}`, data);
  }

  dropRequestById(id, data) {
    console.log("Calling /dvp/droprequestbyid?id");
    return http.put(`/dvp/droprequestbyid/${id}`, data);
  }

  executeDvPById(id, data) {
    console.log("Calling /dvp/executedvpbyid?id");
    return http.put(`/dvp/executedvpbyid/${id}`, data);
  }
/*
  delete(id) {
    return http.delete(`/dvp/${id}`);
  }

  deleteAll() {
    return http.delete(`/dvp`);
  }

  findByName(name) {
    return http.get(`/dvp/findByName?name=${name}`);
  }
*/
  findOne(id) {
    return http.get(`/dvp/findone?id=${id}`);
  }

  getAllDraftsByUserId(id) {
    return http.get(`/dvp/getalldraftsbyuserid?id=${id}`);
  }
  
  getAllDraftsByDvPId(id) {
    return http.get(`/dvp/getalldraftsbydvpid?id=${id}`);
  }
/*

  findDraftByNameExact(name) {
    return http.get(`/dvp/finddraftbynameexact?name=${name}`);
  }

  findDraftByApprovedId(id) {
    return http.get(`/dvp/finddraftbyapprovedid?id=${id}`);
  }
  */

  findByNameExact(name) {
    return http.get(`/dvp/findexact?name=${name}`);
  }
/*
  findByTemplateNameExact(name) {
    return http.get(`/dvp/findexacttemplate?name=${name}`);
  }

  getInWalletMintedTotalSupply(id) {
    return http.get(`/dvp/getInWalletMintedTotalSupply?id=${id}`);
  }

*/

}

export default new DvPDataService();
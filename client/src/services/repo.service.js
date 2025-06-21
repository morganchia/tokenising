import http from "../common/http";

class RepoDataService {

  getAll() {
    return http.get("/repo");
  }

/*
  get(id) {
    return http.get(`/repo/${id}`);
  }

  create(data) {
    return http.post("/repo", data);
  }

  wrapMint_draftCreate(data) {
    return http.post("/repo/wrapmintdraftcreate", data);
  }
*/
  draftCreate(data) {
    return http.post("/repo/draftcreate", data);
  }

/*
  update(id, data) {
    return http.put(`/repo/${id}`, data);
  }
*/

  withdrawTokens(id, data) {
    console.log("Calling /repo/withdrawtokens?id");
    return http.put(`/repo/withdrawtokens/${id}`, data);
  }

  submitDraftById(id, data) {
    console.log("Calling /repo/submitdraftbyid?id");
    return http.put(`/repo/submitdraftbyid/${id}`, data);
  }

  acceptDraftById(id, data) {
    console.log("Calling /repo/acceptdraftbyid?id");
    return http.put(`/repo/acceptdraftbyid/${id}`, data);
  }

  approveDraftById(id, data) {
    console.log("Calling /repo/approvedraftbyid?id");
    return http.put(`/repo/approvedraftbyid/${id}`, data);
  }

  approveDeleteDraftById(id, data) {
    console.log("Calling /repo/approvedeletedraftbyid?id");
    return http.put(`/repo/approvedeletedraftbyid/${id}`, data);
  }

  rejectDraftById(id, data) {
    console.log("Calling /repo/rejectdraftbyid?id");
    return http.put(`/repo/rejectdraftbyid/${id}`, data);
  }

  dropRequestById(id, data) {
    console.log("Calling /repo/droprequestbyid?id");
    return http.put(`/repo/droprequestbyid/${id}`, data);
  }

  executeRepoById(id, data) {
    console.log("Calling /repo/executerepobyid?id");
    return http.put(`/repo/executerepobyid/${id}`, data);
  }

/*
  delete(id) {
    return http.delete(`/repo/${id}`);
  }

  deleteAll() {
    return http.delete(`/repo`);
  }

  findByName(name) {
    return http.get(`/repo/findByName?name=${name}`);
  }
*/
  findOne(id) {
    return http.get(`/repo/findone?id=${id}`);
  }

  getAllRepoDraftsByUserId(id) {
    return http.get(`/repo/getallrepodraftsbyuserid?id=${id}`);
  }
  
  getAllDraftsByRepoId(id) {
    return http.get(`/repo/getalldraftsbyrepoid?id=${id}`);
  }
/*

  findDraftByNameExact(name) {
    return http.get(`/repo/finddraftbynameexact?name=${name}`);
  }

  findDraftByApprovedId(id) {
    return http.get(`/repo/finddraftbyapprovedid?id=${id}`);
  }
  */

  findByNameExact(name) {
    return http.get(`/repo/findexact?name=${name}`);
  }
/*
  findByTemplateNameExact(name) {
    return http.get(`/repo/findexacttemplate?name=${name}`);
  }

  getInWalletMintedTotalSupply(id) {
    return http.get(`/repo/getInWalletMintedTotalSupply?id=${id}`);
  }

*/

}

export default new RepoDataService();
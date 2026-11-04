import http from "../common/http";

class CantonDataService {
  health() {
    return http.get("/canton/health");
  }
  listParties() {
    return http.get("/canton/parties");
  }
  allocateParty(partyIdHint) {
    return http.post("/canton/parties", { partyIdHint });
  }
  listHoldings(party) {
    return http.get("/canton/bonds/holdings", { params: { party } });
  }
  issueBond(data) {
    return http.post("/canton/bonds/issue", data);
  }
  transferBond(data) {
    return http.post("/canton/bonds/transfer", data);
  }
}

export default new CantonDataService();

import http from "../common/http";

class AudittrailDataService {
/*
  getAllDraftsByCampaignId(id) {
    return http.get(`/campaigns/getalldraftsbycampaignid?id=${id}`);
  }
*/
  getdata(startdate1, enddate1) {
    return http.get(`/audittrails/getdata?startdate=${startdate1}&enddate=${enddate1}`);
//    return http.get(`/audittrails/getdata?startdate=2023-01-01&enddate=2023-05-04`);
  }

}

export default new AudittrailDataService();
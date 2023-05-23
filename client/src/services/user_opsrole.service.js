import http from "../common/http";

class UserOpsRoleDataService {

  getAllMakersCheckersApprovers(name) {
    return http.get(`/useropsrole/getallmakerscheckersapprovers?name=${name}`);
  }

  findOpsRoleByID(id) {
    return http.get(`/useropsrole/findopsrolebyid?id=${id}`);
  }

  findAll() {
    return http.get(`/useropsrole`);
  }

  /*
  get(id) {
    return http.get(`/useropsrole/${id}`);
  }

  create(data) {
    return http.post("/useropsrole", data);
  }

  update(id, data) {
    return http.put(`/useropsrole/${id}`, data);
  }

  delete(id) {
    return http.delete(`/useropsrole/${id}`);
  }

  deleteAll() {
    return http.delete(`/useropsrole`);
  }

  findByName(name) {
    return http.get(`/useropsrole?name=${name}`);
  }
*/

}

export default new UserOpsRoleDataService();
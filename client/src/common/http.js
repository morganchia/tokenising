import axios from "axios";

let host = "http://localhost:8080";
host = "";

export default axios.create({
  baseURL: host+"/api",
  headers: {
    "Content-type": "application/json"
  }
  /*

  ,
  proxy: {
    protocol: 'http',
    host: '127.0.0.1',
    port: '8080'
  },
  */
});
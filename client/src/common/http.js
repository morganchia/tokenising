import axios from "axios";

// Dev: call the backend directly (streamed server messages don't pass through the CRA proxy).
// Production (Heroku): the same Express server serves the client, so use relative URLs.
let host = process.env.NODE_ENV === "development" ? "http://localhost:8080" : "";

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
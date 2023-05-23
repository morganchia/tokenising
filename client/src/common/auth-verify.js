import React, { useEffect } from "react";
import { withRouter } from "./with-router";

const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

const AuthVerify = (props) => {
  let location = props.router.location;
  let timeout = 14400 // 10minutes
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (user) {
      const decodedJwt = parseJwt(user.accessToken);
/*
      console.log("======== decodedJwt.exp:", decodedJwt.exp);
      console.log("======== timeout:", timeout);
      console.log("decodedJwt.exp * timeout:", decodedJwt.exp*timeout);
      console.log("======== Date.now():", Date.now());
*/
      if (decodedJwt.exp * timeout < Date.now()) {
        props.logOut();
      }
    }
  }, [location]);

  return <div></div>;
};

export default withRouter(AuthVerify);

const { authJwt } = require("../middleware");
const { audittrail } = require("../models");

module.exports = app => {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  const audittrails = require("../controllers/audittrail.controller.js");

  var router = require("express").Router();

  router.get("/getdata", audittrails.getdata);
  

  app.use('/api/audittrails', router);


};

module.exports = app => {
  const canton = require("../controllers/canton.controller.js");

  var router = require("express").Router();

  router.get("/health", canton.health);
  router.get("/parties", canton.listParties);
  router.post("/parties", canton.allocateParty);
  router.get("/bonds/holdings", canton.listHoldings);
  router.post("/bonds/issue", canton.issueBond);
  router.post("/bonds/transfer", canton.transferBond);

  app.use('/api/canton', router);
};

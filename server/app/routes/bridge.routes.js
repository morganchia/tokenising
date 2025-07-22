const { authJwt } = require("../middleware/index.js");

module.exports = app => {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  const bridge = require("../controllers/bridge.controller.js");

  var router = require("express").Router();

  // Create a new Bridge
  //router.post("/", bridge.create);
//  router.post("/wrapmintdraftcreate/", bridge.wrapMint_draftCreate);
  router.post("/draftcreate/", bridge.draftCreate);
//  router.post("/templatecreate/", bridge.templateCreate);

  // Retrieve all Bridge with LIKE condition
  router.get("/findByName", bridge.findByName);

  router.get("/getallbybridgeid", bridge.getAllByBridgeId);

  router.get("/getalldraftsbyuserid", bridge.getAllDraftsByUserId);
//  router.get("/getallwrapmintdraftsbyuserid", bridge.getAllWrapMintDraftsByUserId);

  router.get("/getallinvestorsbyid", bridge.getAllInvestorsById);

  router.get("/getalldraftsbybridgeid", bridge.getAllDraftsByBridgeId);
//  router.get("/getallwrapmintdraftsbyid", bridge.getAllWrapMintDraftsById);

  router.get("/", bridge.getAll);
//  router.get("/getallbridgetemplates", bridge.getAllBridgeTemplates);

  router.get("/getInWalletMintedTotalSupply", bridge.getInWalletMintedTotalSupply);

  // Retrieve all Bridge with == condition
  router.get("/findexact", bridge.findExact);
//  router.get("/findexacttemplate", bridge.findExactTemplate);
  router.get("/finddraftbynameexact", bridge.findDraftByNameExact);
  router.get("/finddraftbyapprovedid", bridge.findDraftByApprovedId);
  
  // Retrieve a single Bridge with id
  router.get("/:id", bridge.findOne);

  // sequence matters
  router.put("/submitdraftbyid/:id", bridge.submitDraftById);
  router.put("/acceptdraftbyid/:id", bridge.acceptDraftById);
  router.put("/approvedraftbyid/:id", bridge.approveDraftById);
  router.put("/triggerBridgeCouponPaymentById/:id", bridge.triggerBridgeCouponPaymentById);
  router.put("/rejectdraftbyid/:id", bridge.rejectDraftById);
  router.put("/approvedeletedraftbyid/:id", bridge.approveDeleteDraftById); 
  router.put("/droprequestbyid/:id", bridge.dropRequestById);

  // Update a Bridge with id
  router.put("/:id", bridge.update);


  // Delete a Bridge with id
  router.delete("/:id", bridge.delete);

  // Delete all Bridge
  router.delete("/", bridge.deleteAll);

  app.use('/api/bridge', router);


};

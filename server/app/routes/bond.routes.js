const { authJwt } = require("../middleware");

module.exports = app => {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  const bond = require("../controllers/bond.controller.js");

  var router = require("express").Router();

  // Create a new Bond
  //router.post("/", bond.create);
//  router.post("/wrapmintdraftcreate/", bond.wrapMint_draftCreate);
  router.post("/draftcreate/", bond.draftCreate);
//  router.post("/templatecreate/", bond.templateCreate);

  // Retrieve all Bond with LIKE condition
  router.get("/findByName", bond.findByName);

  router.get("/getallbybondid", bond.getAllByBondId);

  router.get("/getalldraftsbyuserid", bond.getAllDraftsByUserId);
//  router.get("/getallwrapmintdraftsbyuserid", bond.getAllWrapMintDraftsByUserId);

  router.get("/getallinvestorsbyid", bond.getAllInvestorsById);

  router.get("/getalldraftsbybondid", bond.getAllDraftsByBondId);
//  router.get("/getallwrapmintdraftsbyid", bond.getAllWrapMintDraftsById);

  router.get("/", bond.getAll);
//  router.get("/getallbondtemplates", bond.getAllBondTemplates);

  router.get("/getInWalletMintedTotalSupply", bond.getInWalletMintedTotalSupply);

  // Retrieve all Bond with == condition
  router.get("/findexact", bond.findExact);
//  router.get("/findexacttemplate", bond.findExactTemplate);
  router.get("/finddraftbynameexact", bond.findDraftByNameExact);
  router.get("/finddraftbyapprovedid", bond.findDraftByApprovedId);
  
  // Retrieve a single Bond with id
  router.get("/:id", bond.findOne);

  // sequence matters
  router.put("/submitdraftbyid/:id", bond.submitDraftById);
  router.put("/acceptdraftbyid/:id", bond.acceptDraftById);
  router.put("/approvedraftbyid/:id", bond.approveDraftById);
  router.put("/triggerBondCouponPaymentById/:id", bond.triggerBondCouponPaymentById);
  router.put("/rejectdraftbyid/:id", bond.rejectDraftById);
  router.put("/approvedeletedraftbyid/:id", bond.approveDeleteDraftById); 
  router.put("/droprequestbyid/:id", bond.dropRequestById);

//  router.put("/submitwrapmintdraftbyid/:id", bond.submitWrapMintDraftById);
//  router.put("/acceptwrapmintdraftbyid/:id", bond.acceptWrapMintDraftById);
//  router.put("/approvewrapmintdraftbyid/:id", bond.approveWrapMintDraftById);
//  router.put("/rejectwrapmintdraftbyid/:id", bond.rejectWrapMintDraftById);
//  router.put("/approvedeletewrapmintdraftbyid/:id", bond.approveDeleteWrapMintDraftById); 
//  router.put("/dropwrapmintrequestbyid/:id", bond.dropWrapMintRequestById);

  // Update a Bond with id
  router.put("/:id", bond.update);


  // Delete a Bond with id
  router.delete("/:id", bond.delete);

  // Delete all Bond
  router.delete("/", bond.deleteAll);

  app.use('/api/bond', router);


};

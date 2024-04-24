const { authJwt } = require("../middleware");

module.exports = app => {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  const pbm = require("../controllers/pbm.controller.js");

  var router = require("express").Router();

  // Create a new PBM
  //router.post("/", pbm.create);
  router.post("/draftcreate/", pbm.draftCreate);
  router.post("/templatecreate/", pbm.templateCreate);

  // Retrieve all PBM with LIKE condition
  router.get("/findByName", pbm.findByName);

  router.get("/getalldraftsbyuserid", pbm.getAllDraftsByUserId);

  router.get("/getalldraftsbypbmid", pbm.getAllDraftsByPBMId);

  router.get("/", pbm.getAll);
  router.get("/getallpbmtemplates", pbm.getAllPBMTemplates);

  router.get("/getInWalletMintedTotalSupply", pbm.getInWalletMintedTotalSupply);

  // Retrieve all PBM with == condition
  router.get("/findexact", pbm.findExact);
  router.get("/findexacttemplate", pbm.findExactTemplate);
  router.get("/finddraftbynameexact", pbm.findDraftByNameExact);
  router.get("/finddraftbyapprovedid", pbm.findDraftByApprovedId);
  
  // Retrieve a single PBM with id
  router.get("/:id", pbm.findOne);

  // sequence matters
  router.put("/submitdraftbyid/:id", pbm.submitDraftById);
  router.put("/acceptdraftbyid/:id", pbm.acceptDraftById);
  router.put("/approvedraftbyid/:id", pbm.approveDraftById);
  router.put("/rejectdraftbyid/:id", pbm.rejectDraftById);
  router.put("/approvedeletedraftbyid/:id", pbm.approveDeleteDraftById); 
  router.put("/droprequestbyid/:id", pbm.dropRequestById);

  // Update a PBM with id
  router.put("/:id", pbm.update);


  // Delete a PBM with id
  router.delete("/:id", pbm.delete);

  // Delete all PBM
  router.delete("/", pbm.deleteAll);

  app.use('/api/pbm', router);


};

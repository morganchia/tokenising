const { authJwt } = require("../middleware");

module.exports = app => {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  const dvp = require("../controllers/dvp.controller.js");

  var router = require("express").Router();

  // Create a new DvP
  //router.post("/", dvp.create);
  router.post("/draftcreate/", dvp.draftCreate);


  /*

  // Retrieve all DvP with LIKE condition
  router.get("/findByName", dvp.findByName);
*/
  router.get("/getalldraftsbyuserid", dvp.getAllDraftsByUserId);

  router.get("/getalldraftsbydvpid", dvp.getAllDraftsByDvPId);

  router.get("/", dvp.getAll);

  /*
  router.get("/getInWalletMintedTotalSupply", dvp.getInWalletMintedTotalSupply);
*/
  // Retrieve all DvP with == condition
  router.get("/findexact", dvp.findExact);
/*
  router.get("/finddraftbynameexact", dvp.findDraftByNameExact);
  router.get("/finddraftbyapprovedid", dvp.findDraftByApprovedId);
  
  // Retrieve a single DvP with id
  router.get("/:id", dvp.findOne);

*/
  // sequence matters
  router.put("/submitdraftbyid/:id", dvp.submitDraftById);
  router.put("/acceptdraftbyid/:id", dvp.acceptDraftById);
  router.put("/approvedraftbyid/:id", dvp.approveDraftById);
  router.put("/rejectdraftbyid/:id", dvp.rejectDraftById);
  router.put("/approvedeletedraftbyid/:id", dvp.approveDeleteDraftById); 
  router.put("/droprequestbyid/:id", dvp.dropRequestById);
/*
  router.put("/submitwrapmintdraftbyid/:id", dvp.submitWrapMintDraftById);
  router.put("/acceptwrapmintdraftbyid/:id", dvp.acceptWrapMintDraftById);
  router.put("/approvewrapmintdraftbyid/:id", dvp.approveWrapMintDraftById);
  router.put("/rejectwrapmintdraftbyid/:id", dvp.rejectWrapMintDraftById);
  router.put("/approvedeletewrapmintdraftbyid/:id", dvp.approveDeleteWrapMintDraftById); 
  router.put("/dropwrapmintrequestbyid/:id", dvp.dropWrapMintRequestById);

  // Update a DvP with id
  router.put("/:id", dvp.update);


  // Delete a DvP with id
  router.delete("/:id", dvp.delete);

  // Delete all DvP
  router.delete("/", dvp.deleteAll);
*/
  app.use('/api/dvp', router);


};

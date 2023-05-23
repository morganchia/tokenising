const { authJwt } = require("../middleware");

module.exports = app => {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  const mints = require("../controllers/mint.controller.js");

  var router = require("express").Router();

  // Create a new Mint
  //router.post("/", mints.create);
  router.post("/draftcreate/", mints.draftCreate);


  // Retrieve all Mints with LIKE condition
  router.get("/", mints.findAll);

  router.get("/findAllMints", mints.findAllMints);

  router.get("/getalldraftsbyuserid", mints.getAllDraftsByUserId);

  router.get("/getalldraftsbymintid", mints.getAllDraftsByMintId);

  // Retrieve all Mints with == condition
  router.get("/findAllByCampaignId", mints.findAllByCampaignId);

  // Retrieve a single Mint with id
  router.get("/:id", mints.findOne);

  // sequence matters
  router.put("/submitdraftbyid/:id", mints.submitDraftById);
  router.put("/acceptdraftbyid/:id", mints.acceptDraftById);
  router.put("/approvedraftbyid/:id", mints.approveDraftById);
  router.put("/rejectdraftbyid/:id", mints.rejectDraftById);
  router.put("/droprequestbyid/:id", mints.dropRequestById);

  // no such thing as delete Mint 
  // router.put("/approvedeletedraftbyid/:id", mints.approveDeleteDraftById);

  // Update a Mint with id
  //router.put("/:id", mints.update);

  // Delete a Mint with id
  router.delete("/:id", mints.delete);

  // Delete all Mints
  router.delete("/", mints.deleteAll);

  app.use('/api/mints', router);


};

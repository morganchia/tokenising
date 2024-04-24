const { authJwt } = require("../middleware");

module.exports = app => {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  const campaigns = require("../controllers/campaign.controller.js");

  var router = require("express").Router();

  // Create a new Campaign
  //router.post("/", campaigns.create);
  router.post("/draftcreate/", campaigns.draftCreate);

  // Retrieve all Campaigns with LIKE condition
  router.get("/findByName", campaigns.findByName);

  router.get("/getalldraftsbyuserid", campaigns.getAllDraftsByUserId);

  router.get("/getalldraftsbycampaignid", campaigns.getAllDraftsByCampaignId);

  router.get("/", campaigns.getAll);

  router.get("/getInWalletMintedTotalSupply", campaigns.getInWalletMintedTotalSupply);

  // Retrieve all Campaigns with == condition
  router.get("/findexact", campaigns.findExact);
  router.get("/finddraftbynameexact", campaigns.findDraftByNameExact);
  router.get("/finddraftbyapprovedid", campaigns.findDraftByApprovedId);
  
  // Retrieve a single Campaign with id
  router.get("/:id", campaigns.findOne);

  // sequence matters
  router.put("/submitdraftbyid/:id", campaigns.submitDraftById);
  router.put("/acceptdraftbyid/:id", campaigns.acceptDraftById);
  router.put("/approvedraftbyid/:id", campaigns.approveDraftById);
  router.put("/rejectdraftbyid/:id", campaigns.rejectDraftById);
  router.put("/approvedeletedraftbyid/:id", campaigns.approveDeleteDraftById); 
  router.put("/droprequestbyid/:id", campaigns.dropRequestById);

  // Update a Campaign with id
  router.put("/:id", campaigns.update);


  // Delete a Campaign with id
  router.delete("/:id", campaigns.delete);

  // Delete all Campaigns
  router.delete("/", campaigns.deleteAll);

  app.use('/api/campaigns', router);


};

const { authJwt } = require("../middleware/index.js");

module.exports = app => {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  const repo = require("../controllers/repo.controller.js");

  var router = require("express").Router();

  // Create a new Repo
  //router.post("/", repo.create);
  router.post("/draftcreate/", repo.draftCreate);


/*
  // Retrieve all Repo with LIKE condition
  router.get("/findByName", repo.findByName);
*/
  router.get("/getallrepodraftsbyuserid", repo.getAllRepoDraftsByUserId);

  router.get("/getalldraftsbyrepoid", repo.getAllDraftsByRepoId);

  router.get("/", repo.getAll);

  /*
  router.get("/getInWalletMintedTotalSupply", repo.getInWalletMintedTotalSupply);
*/
  // Retrieve all Repo with == condition
  router.get("/findexact", repo.findExact);
/*
  router.get("/finddraftbynameexact", repo.findDraftByNameExact);
  router.get("/finddraftbyapprovedid", repo.findDraftByApprovedId);
*/
  // Retrieve a single Repo with id
  router.get("/findone", repo.findOne);

  // sequence matters
  router.put("/submitdraftbyid/:id", repo.submitDraftById);
  router.put("/acceptdraftbyid/:id", repo.acceptDraftById);
  router.put("/approvedraftbyid/:id", repo.approveDraftById);
  router.put("/rejectdraftbyid/:id", repo.rejectDraftById);
  router.put("/approvedeletedraftbyid/:id", repo.approveDeleteDraftById); 
  router.put("/droprequestbyid/:id", repo.dropRequestById);
  router.put("/executerepobyid/:id", repo.executeRepoById);


/*
  router.put("/submitwrapmintdraftbyid/:id", repo.submitWrapMintDraftById);
  router.put("/acceptwrapmintdraftbyid/:id", repo.acceptWrapMintDraftById);
  router.put("/approvewrapmintdraftbyid/:id", repo.approveWrapMintDraftById);
  router.put("/rejectwrapmintdraftbyid/:id", repo.rejectWrapMintDraftById);
  router.put("/approvedeletewrapmintdraftbyid/:id", repo.approveDeleteWrapMintDraftById); 
  router.put("/dropwrapmintrequestbyid/:id", repo.dropWrapMintRequestById);

  // Update a Repo with id
  router.put("/:id", repo.update);


  // Delete a Repo with id
  router.delete("/:id", repo.delete);

  // Delete all Repo
  router.delete("/", repo.deleteAll);
*/
  app.use('/api/repo', router);


};

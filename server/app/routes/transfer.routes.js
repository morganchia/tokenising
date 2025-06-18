const { authJwt } = require("../middleware");

module.exports = app => {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  const transfers = require("../controllers/transfer.controller.js");

  var router = require("express").Router();

  // Create a new Transfer
  router.post("/", transfers.create);  // for transfer without maker/checker
  router.post("/draftcreate/", transfers.draftCreate);

  // Retrieve all Transfers with LIKE condition
  router.get("/", transfers.findAll);

  router.get("/findAllTransfers", transfers.findAllTransfers);

  router.get("/getalldraftsbyuserid", transfers.getAllDraftsByUserId);

  router.get("/getalldraftsbytransferid", transfers.getAllDraftsByTransferId);


  // Retrieve all Transfers with == condition
  router.get("/findAllByCampaignId", transfers.findAllByCampaignId);

  // Retrieve a single Transfer with id
  router.get("/:id", transfers.findOne);

  // sequence matters
  router.put("/submitdraftbyid/:id", transfers.submitDraftById);
  router.put("/acceptdraftbyid/:id", transfers.acceptDraftById);
  router.put("/approvedraftbyid/:id", transfers.approveDraftById);
  router.put("/rejectdraftbyid/:id", transfers.rejectDraftById);
  router.put("/transferToWallet/:id", transfers.transferToWallet);
  router.put("/droprequestbyid/:id", transfers.dropRequestById);

  // Update a Transfer with id
  //router.put("/:id", transfers.update);

  // Delete a Transfer with id
  router.delete("/:id", transfers.delete);

  // Delete all Transfers
  router.delete("/", transfers.deleteAll);

  app.use('/api/transfers', router);


};

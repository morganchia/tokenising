const { authJwt } = require("../middleware");

module.exports = app => {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  const recipients = require("../controllers/recipient.controller.js");

  var router = require("express").Router();

  router.post("/draftcreate/", recipients.draftCreate);

  router.get("/findAllRecipients", recipients.findAllRecipients);

  router.get("/getalldraftsbyuserid", recipients.getAllDraftsByUserId);

  router.get("/getalldraftsbyrecipientid", recipients.getAllDraftsByRecipientId);

    // sequence matters
    router.put("/submitdraftbyid/:id", recipients.submitDraftById);
    router.put("/acceptdraftbyid/:id", recipients.acceptDraftById);
    router.put("/approvedraftbyid/:id", recipients.approveDraftById);
    router.put("/rejectdraftbyid/:id", recipients.rejectDraftById);
    router.put("/approvedeletedraftbyid/:id", recipients.approveDeleteDraftById); 
    router.put("/droprequestbyid/:id", recipients.dropRequestById);

  /*
  // Create a new Recipient
  router.post("/", recipients.create);

  // Retrieve all recipients with LIKE condition
  router.get("/", recipients.findAll);

  // Retrieve all Recipients with == condition
  router.get("/findexact", recipients.findExact);

  // Retrieve all published recipients

  // Retrieve a single recipient with id
  router.get("/:id", recipients.findOne);

  // Update a recipient with id
  router.put("/:id", recipients.update);

  // Delete a recipient with id
  router.delete("/:id", recipients.delete);

  // Delete all recipients
  router.delete("/", recipients.deleteAll);
*/

  app.use('/api/recipients', router);

};

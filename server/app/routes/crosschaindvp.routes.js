module.exports = app => {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  const crosschaindvp = require("../controllers/crosschaindvp.controller.js");

  var router = require("express").Router();

  router.post("/draftcreate/", crosschaindvp.draftCreate);

  router.get("/findByName", crosschaindvp.findByName);
  router.get("/getallcrosschaindvpdraftsbyuserid", crosschaindvp.getAllDraftsByUserId);
  router.get("/getalldraftsbycrosschaindvpid", crosschaindvp.getAllDraftsByTradeId);
  router.get("/", crosschaindvp.getAll);
  router.get("/findexact", crosschaindvp.findExact);
  router.get("/findone", crosschaindvp.findOne);

  // sequence matters
  router.put("/submitdraftbyid/:id", crosschaindvp.submitDraftById);
  router.put("/acceptdraftbyid/:id", crosschaindvp.acceptDraftById);
  router.put("/approvedraftbyid/:id", crosschaindvp.approveDraftById);
  router.put("/rejectdraftbyid/:id", crosschaindvp.rejectDraftById);
  router.put("/approvedeletedraftbyid/:id", crosschaindvp.approveDeleteDraftById);
  router.put("/droprequestbyid/:id", crosschaindvp.dropRequestById);

  router.put("/executestartlegbyid/:id", crosschaindvp.executeStartLegById);
  router.put("/executematuritylegbyid/:id", crosschaindvp.executeMaturityLegById);
  router.put("/refundlegbyid/:id", crosschaindvp.refundLegById);

  app.use('/api/crosschaindvp', router);
};

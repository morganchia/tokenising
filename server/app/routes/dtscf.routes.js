const { authJwt } = require("../middleware/index.js");
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const multerMiddleware = (req, res, next) => {
  if (req.headers['content-type'] && req.headers['content-type'].startsWith('multipart/form-data')) {
    upload.any()(req, res, next);
  } else {
    next();
  }
};

module.exports = app => {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  const dtscf = require("../controllers/dtscf.controller.js");

  var router = require("express").Router();

  // Create a new Dtscf
  //router.post("/", dtscf.create);
//  router.post("/wrapmintdraftcreate/", dtscf.wrapMint_draftCreate);
  //router.post("/draftcreate/", dtscf.draftCreate);
//  router.post("/draftcreate/", upload.any(), dtscf.draftCreate);
  router.post("/draftcreate/", multerMiddleware, dtscf.draftCreate);
//  router.post("/templatecreate/", dtscf.templateCreate);

  // Retrieve all Dtscf with LIKE condition
  router.get("/findByName", dtscf.findByName);

  router.get("/getallbydtscfid", dtscf.getAllByDtscfId);

  router.get("/getalldraftsbyuserid", dtscf.getAllDraftsByUserId);
//  router.get("/getallwrapmintdraftsbyuserid", dtscf.getAllWrapMintDraftsByUserId);

  router.get("/getalldraftsbydtscfid", dtscf.getAllDraftsByDtscfId);
//  router.get("/getallwrapmintdraftsbyid", dtscf.getAllWrapMintDraftsById);

  router.get("/", dtscf.getAll);
//  router.get("/getalldtscftemplates", dtscf.getAllDtscfTemplates);

  router.get("/getInWalletMintedTotalSupply", dtscf.getInWalletMintedTotalSupply);

  // Retrieve all Dtscf with == condition
  router.get("/findexact", dtscf.findExact);
//  router.get("/findexacttemplate", dtscf.findExactTemplate);
  router.get("/finddraftbynameexact", dtscf.findDraftByNameExact);
  router.get("/finddraftbyapprovedid", dtscf.findDraftByApprovedId);
  
  // Retrieve a single Dtscf with id
  router.get("/:id", dtscf.findOne);

  // sequence matters
  router.put("/submitdraftbyid/:id", dtscf.submitDraftById);
  router.put("/acceptdraftbyid/:id", dtscf.acceptDraftById);
  router.put("/approvedraftbyid/:id", dtscf.approveDraftById);
  router.put("/rejectdraftbyid/:id", dtscf.rejectDraftById);
  router.put("/approvedeletedraftbyid/:id", dtscf.approveDeleteDraftById); 
  router.put("/droprequestbyid/:id", dtscf.dropRequestById);

//  router.put("/submitwrapmintdraftbyid/:id", dtscf.submitWrapMintDraftById);
//  router.put("/acceptwrapmintdraftbyid/:id", dtscf.acceptWrapMintDraftById);
//  router.put("/approvewrapmintdraftbyid/:id", dtscf.approveWrapMintDraftById);
//  router.put("/rejectwrapmintdraftbyid/:id", dtscf.rejectWrapMintDraftById);
//  router.put("/approvedeletewrapmintdraftbyid/:id", dtscf.approveDeleteWrapMintDraftById); 
//  router.put("/dropwrapmintrequestbyid/:id", dtscf.dropWrapMintRequestById);

  // Update a Dtscf with id
  router.put("/:id", dtscf.update);


  // Delete a Dtscf with id
  router.delete("/:id", dtscf.delete);

  // Delete all Dtscf
  router.delete("/", dtscf.deleteAll);

  app.use('/api/dtscf', router);


};

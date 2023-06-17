const { authJwt } = require("../middleware");

module.exports = app => {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  const opsrole = require("../controllers/opsrole.controller.js");

  var router = require("express").Router();

  // Create a new Opsrole
//  router.post("/", opsrole.create);

//  router.get("/getallmakerscheckersapprovers", opsrole.getAllMakersCheckersApprovers);

  // Retrieve all Opsrole with LIKE condition
//  router.get("/", opsrole.findAll);

  // Retrieve all Opsrole with == condition
//  router.get("/findexact", opsrole.findExact);
/*
  // Retrieve a single Opsrole with id
  router.get("/:id", opsrole.findOne);
*/
  // Update a Opsrole with id
//  router.put("/:id", opsrole.update);

  // Delete a Opsrole with id
//  router.delete("/:id", opsrole.delete);

  // Delete all Opsrole
//  router.delete("/", opsrole.deleteAll);

  app.use('/api/opsrole', router);


};

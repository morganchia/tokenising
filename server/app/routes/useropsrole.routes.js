const { authJwt } = require("../middleware");

module.exports = app => {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  const useropsrole = require("../controllers/useropsrole.controller.js");
  const opsrole = require("../controllers/opsrole.controller.js");

  var router = require("express").Router();

  // Create a new UserOpsRole
//  router.post("/", useropsrole.create);

  router.get("/getallmakerscheckersapprovers", useropsrole.getAllMakersCheckersApprovers);

//  router.get("/findbyusername", opsrole.findByUserName);

  router.get("/findopsrolebyid", useropsrole.findOpsRoleByID);

  // Retrieve all Useropsrole 
  router.get("/", useropsrole.findAll);

  // Retrieve all Useropsrole with == condition
//  router.get("/findexact", useropsrole.findExact);
/*
  // Retrieve a single UserOpsRole with id
  router.get("/:id", useropsrole.findOne);
*/
  // Update a UserOpsRole with id
//  router.put("/:id", useropsrole.update);

  // Delete a UserOpsRole with id
//  router.delete("/:id", useropsrole.delete);

  // Delete all Useropsrole
//  router.delete("/", useropsrole.deleteAll);

  app.use('/api/useropsrole', router);


};

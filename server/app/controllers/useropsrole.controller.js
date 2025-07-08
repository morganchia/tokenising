const db = require("../models");
const UserOpsRole = db.useropsrole;
const UserRole = db.userrole;
const Op = db.Sequelize.Op;
const Opsrole = db.opsrole;

// Find a single Opsrole with a ID
exports.findOpsRoleByID = (req, res) => {
  const id = req.query.id;
  var condition = id ? { userId: id } : null;

  console.log("findById codidtion:", condition);
  //var condition = username ? { username: { [Op.eq]: `${username}` } } : null;
  UserOpsRole.findAll(
    { 
//      raw: true, 
//      nest: true,
      include: db.opsrole,
      //attributes: ['id', 'name', 'transactionType'],
      where: {userId: id} ,
    }
    )
  .then(data => {
    console.log("UserOpsRole.findOpsRoleByID:", data.map(item => item.dataValues));
    res.send(data);
  })
  .catch(err => {
    console.log("Error while retreiving findOpsRoleByID: "+err.message);

    res.status(500).send({
      message:
        err.message || "Some error occurred while retrieving opsrole."
    });
  });
};

exports.getAllMakersCheckersApprovers = (req, res) => {
  const txnType = req.query.name;
  var filters = {};
  if (typeof(txnType) === "string" && txnType !== "" && txnType.toUpperCase() !== "ALL") 
    filters = {'$user->user_opsroles.transactionType$': txnType};
  console.log("filters:", filters);
  console.log(`getAllMakersCheckersApprovers(${txnType})`);
  
  Opsrole.findAll(
      { 
//        raw: true, 
//        nest: true,
        include:
        [{
          model: db.user,
          as: 'user',
          attributes: ['id', 'username'],
        }],
        where : filters,
//        where: { 
//                '$user->user_opsroles.transactionType$': txnType
//              }
      },
    )
    .then(data => {
      console.log("OpsRole.getAllMakersCheckersApprovers2:", data.map(item => item.dataValues));
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving opsrole1: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving opsrole."
      });
    });
};
// Retrieve all Useropsrole from the database.
exports.findAll = (req, res) => {
  //  const name = req.query.name;
  //  var condition = name ? { name: { [Op.like]: `%${name}%` } } : null;
    
    UserOpsRole.findAll(
          { 
//            raw: true, 
//            nest: true,
            include: db.opsrole,
            order: [
              ['transactionType'],
              ['opsroleId'],
              ['userId'],
            ],
            include: 
            [{
              model: db.user,
              as: 'user',
              attributes: ['id', 'username'],
            }],
          },
      )
      .then(data => {
        console.log("UserOpsRole.findAll:", data.map(item => item.dataValues));
        res.send(data);
      })
      .catch(err => {
        console.log("Error while retreiving useropsrole: "+err.message);
  
        res.status(500).send({
          message:
            err.message || "Some error occurred while retrieving useropsrole."
        });
      });
  };
  
/*
// Create and Save a new UserOpsRole
exports.create = async (req, res) => {
  // Validate request
  if (!req.body.name) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }


  // Save UserOpsRole in the database
  await UserOpsRole.create(
    { name:       req.body.name,
      startdate:  req.body.startdate, 
      enddate:    req.body.enddate, 
      sponsor:    req.body.sponsor, 
      amount:     req.body.amount,
    }, 
  )
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the UserOpsRole."
      });
      console.log("Error while creating useropsrole: "+err.message);
    });
};

exports.findExact = (req, res) => {
  const name = req.query.name;
  var condition = name ? { name: name } : null;

  UserOpsRole.findAll(
    { where: condition },
    )
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving useropsrole: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving useropsrole."
      });
    });
};
*/
/*
// Find a single UserOpsRole with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  UserOpsRole.findByPk(id, {
    include: db.users
  })
    .then(data => {
      //console.log("UserOpsRole.findByPk:", data)
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find UserOpsRole with id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving UserOpsRole with id=" + id
      });
    });
};

// Update a UserOpsRole by the id in the request
exports.update = async (req, res) => {
  
  const id = req.params.id;

  console.log("Received:");

  await UserOpsRole.update(
    { name:       req.body.name,
      startdate:  req.body.startdate, 
      enddate:    req.body.enddate, 
      sponsor:    req.body.sponsor, 
      amount:     req.body.amount,
    }, 
    { where:      { id: id }},
    )
    .then(num => {
      if (num == 1) {
        res.send({
          message: "UserOpsRole was updated successfully."
        });
      } else {
        res.send({
          message: `${req.body}. Record updated =${num}. Cannot update UserOpsRole with id=${id}. Maybe UserOpsRole was not found or req.body is empty!`
        });
      }
    })
    .catch(err => {
      console.log(err);
      res.status(500).send({
        message: `Error updating UserOpsRole. ${err}`
      });
    });
};

// Delete a UserOpsRole with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  console.log(req.body.actionby);

  UserOpsRole.destroy({
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "UserOpsRole was deleted successfully!"
        });
      } else {
        res.send({
          message: `Cannot delete UserOpsRole with id=${id}. Maybe UserOpsRole was not found!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Could not delete UserOpsRole with id=" + id
      });
    });
};

// Delete all Useropsrole from the database.
exports.deleteAll = (req, res) => {
  UserOpsRole.destroy({
    where: {},
    truncate: false
  })
    .then(nums => {
      res.send({ message: `${nums} Useropsrole were deleted successfully!` });
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while removing all useropsrole."
      });
    });
};

*/

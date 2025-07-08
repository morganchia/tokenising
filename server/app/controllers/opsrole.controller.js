const db = require("../models");
const Opsrole = db.opsrole;
const User_Opsrole = db.useropsrole;
const Op = db.Sequelize.Op;

/*
// Create and Save a new Opsrole
exports.create = async (req, res) => {
  // Validate request
  if (!req.body.name) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }


  // Save Opsrole in the database
  await Opsrole.create(
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
          err.message || "Some error occurred while creating the Opsrole."
      });
      console.log("Error while creating opsrole: "+err.message);
    });
};

exports.findExact = (req, res) => {
  const name = req.query.name;
  var condition = name ? { name: name } : null;

  Opsrole.findAll(
    { where: condition },
    )
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving opsrole: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving opsrole."
      });
    });
};
*/


// Find a single Opsrole with a username
exports.findByUserName = (req, res) => {
  const username = req.params.username;
  var condition = username ? { username: { [Op.eq]: `${username}` } } : null;
  Opsrole.findAll(
    { 
//      raw: true,
//      nest: true,
      include: [{
        model: db.user,
        as: 'user',
        through: {
          attributes: ['createdAt', 'startedAt', 'finishedAt'],
          where: {username: username}
        }
      }],
    
      /*
      include:
      [{
        model: db.user,
        as: 'user',
      }],
      */
    },
   // { where: condition },
  )
  .then(data => {
    console.log("OpsRole.findByUserName:", data.map(item => item.dataValues));
    res.send(data);
  })
  .catch(err => {
    console.log("Error while retreiving findByUserName: "+err.message);

    res.status(500).send({
      message:
        err.message || "Some error occurred while retrieving opsrole."
    });
  });
};

/*
// Retrieve all Opsrole from the database.
exports.findAll = (req, res) => {
  const name = req.query.name;
  var condition = name ? { name: { [Op.like]: `%${name}%` } } : null;
  
  Opsrole.findAll(
        { include: db.users},
        { where: condition },
    )
    .then(data => {
      console.log("Opsrole.findAll:", data)
      res.send(data);
    })
    .catch(err => {
      console.log("Error while retreiving opsrole: "+err.message);

      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving opsrole."
      });
    });
};

// Find a single Opsrole with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  Opsrole.findByPk(id, {
    include: db.users
  })
    .then(data => {
      //console.log("Opsrole.findByPk:", data)
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find Opsrole with id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving Opsrole with id=" + id
      });
    });
};

// Update a Opsrole by the id in the request
exports.update = async (req, res) => {
  
  const id = req.params.id;

  console.log("Received:");

  await Opsrole.update(
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
          message: "Opsrole was updated successfully."
        });
      } else {
        res.send({
          message: `${req.body}. Record updated =${num}. Cannot update Opsrole with id=${id}. Maybe Opsrole was not found or req.body is empty!`
        });
      }
    })
    .catch(err => {
      console.log(err);
      res.status(500).send({
        message: `Error updating Opsrole. ${err}`
      });
    });
};

// Delete a Opsrole with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  console.log(req.body.actionby);

  Opsrole.destroy({
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Opsrole was deleted successfully!"
        });
      } else {
        res.send({
          message: `Cannot delete Opsrole with id=${id}. Maybe Opsrole was not found!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Could not delete Opsrole with id=" + id
      });
    });
};

// Delete all Opsrole from the database.
exports.deleteAll = (req, res) => {
  Opsrole.destroy({
    where: {},
    truncate: false
  })
    .then(nums => {
      res.send({ message: `${nums} Opsrole were deleted successfully!` });
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while removing all opsrole."
      });
    });
};

// find all published Opsrole
exports.findAllPublished = (req, res) => {
  Opsrole.findAll({ where: { published: true } })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving opsrole."
      });
    });
};

*/

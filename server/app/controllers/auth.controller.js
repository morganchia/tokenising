const db = require("../models");
const config = require("../config/auth.config");
const User = db.user;
const Role = db.role;
const UserOpsRole  = db.useropsrole;

const Op = db.Sequelize.Op;

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

exports.signup = async (req, res) => {
  // Save User to Database
  await User.create({
    username: req.body.username,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 8)
  })
    .then(user => {
      if (req.body.roles) {
        Role.findAll({
          where: {
            name: {
              [Op.or]: req.body.roles
            }
          }
        }).then(roles => {
          user.setRoles(roles).then(() => {
            res.send({ message: "User registered successfully!" });
          });
        });
      } else {
        // user role = 1
        user.setRoles([1]).then(() => {
          res.send({ message: "User registered successfully!" });
        });
      }
    })
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
};

exports.signin = async (req, res) => {
  await User.findOne({
    where: { username: req.body.username }
  })
    .then(user => {
      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }

      console.log("==== user object:", user);
      var passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );

      if (!passwordIsValid) {
        return res.status(401).send({
          accessToken: null,
          message: "Invalid Password!"
        });
      }

      // user found and password valid 


      var token = jwt.sign({ id: user.id }, config.secret, {
        expiresIn: 14400 // 10 mins
      });
     // res.status(500).send({ message: "last login:"+user.lastlogin });

     var opsRoles = [];
     UserOpsRole.findAll(
      { 
        include: db.opsrole,
        //attributes: ['id', 'name', 'transactionType'],
        where: {userId: user.id} ,
      }
    )
    .then(data => {
      console.log("UserOpsRole.findAll:", data)
      opsRoles = data;
    })
    .catch(err => {
      console.log("Error while retreiving findAll: "+err.message);
  
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving opsrole."
      });
    });
  

      var authorities = [];
      user.getRoles().then(roles => {
        for (let i = 0; i < roles.length; i++) {
          authorities.push("ROLE_" + roles[i].name.toUpperCase());
        }
        console.log("Retrieving from DB, lastlogin = "+user.lastlogin)
        console.log("==== user roles:", authorities);
        console.log("==== user accessToken:", token);

        res.status(200).send({
          id: user.id,
          username: user.username,
          email: user.email,
          lastlogin: user.lastlogin,
          opsrole: opsRoles,
          roles: authorities,
          accessToken: token
        });
      });

      let date_ob = new Date();

      // current date
      // adjust 0 before single digit date
      let date = ("0" + date_ob.getDate()).slice(-2);
      // current month
      let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
      // current year
      let year = date_ob.getFullYear();
      // current hours
      let hours = date_ob.getHours();
      // current minutes
      let minutes = date_ob.getMinutes();
      // current seconds
      let seconds = date_ob.getSeconds();
      // prints date & time in YYYY-MM-DD HH:MM:SS format
      let yyyymmddhhmmss = year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds;
      console.log("Updating last login to "+yyyymmddhhmmss);
      // update last login
      User.update(
        { lastlogin:  yyyymmddhhmmss }, 
        { where: { username: req.body.username }}
        )
        .then(num => {
          console.log("Updated lastlogin in num records:"+num);
        })
        .catch(err => {
          console.log("Error updating lastlogin:",err);
        }
      );           
    })
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
};

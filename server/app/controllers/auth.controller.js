const db = require("../models");
const config = require("../config/auth.config");
const User = db.user;
const Role = db.role;
const UserOpsRole  = db.useropsrole;
const Recipients = db.recipients;

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
//        UserOpsRole.findAll({
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
  try {
    // 1. Find User
    const user = await User.findOne({
      where: { username: req.body.username }
    });
    if (!user) {
      return res.status(404).send({ message: "User Not found." });
    }
    console.log("==== user object:", user);

    // 2. Validate Password
    var passwordIsValid = bcrypt.compareSync( req.body.password, user.password );
    if (!passwordIsValid) {
      return res.status(401).send({ accessToken: null, message: "Invalid Password!" });
    }

    // 3. Generate Token
    var token = jwt.sign({ id: user.id }, config.secret, {  expiresIn: 14400 });
     // res.status(500).send({ message: "last login:"+user.lastlogin });

    // 4. Get Ops Roles
    const opsRoles = await UserOpsRole.findAll(
      { 
        include: db.opsrole,
        //attributes: ['id', 'name', 'transactionType'],
        where: {userId: user.id} ,
      }
    );
    if (!opsRoles) {        
      console.log("Error while retreiving findAll: "+err.message);
  
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving opsrole."
      });
    }

    // 5. Get Recipients
    const recipients = await Recipients.findAll(
      { 
        where: {id: user.organisation_id} ,
      }
    );
    if (!recipients) {        
      console.log("Error while retreiving findAll: "+err.message);
  
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving recipients."
      });
    }

    // 6. Get Roles (Sequelize association)
      const roles = await user.getRoles();
      const authorities = roles.map(role => "ROLE_" + role.name.toUpperCase());

    // 7. Update Last Login (Async but don't necessarily need to await it before responding)
    const yyyymmddhhmmss = new Date().toISOString().slice(0, 19).replace('T', ' ');
    User.update({ lastlogin: yyyymmddhhmmss }, { where: { username: req.body.username } });

    // 8. Send Final Response
    res.status(200).send({
      id: user.id,
      username: user.username,
      email: user.email,
      organisation_id: user.organisation_id,
      walletaddress: recipients[0] ? recipients[0].walletaddress : recipients.walletaddress,
      lastlogin: user.lastlogin,
      opsrole: opsRoles,
      roles: authorities,
      accessToken: token
    });

  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

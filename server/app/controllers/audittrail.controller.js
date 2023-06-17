const db = require("../models");
const AuditTrail = db.audittrail;
const Op = db.Sequelize.Op;

//exports.getdata = async (startdate0, enddate0) => {
exports.getdata = async (req, res)  => {


  console.log("Received1:");
  console.log(req.query.startdate);
  console.log(req.query.enddate);

  await AuditTrail.findAll(
  { where: 
  
    { 
      [Op.and]: [
        {
          timestamp  : 
          {
            [Op.gte]: req.query.startdate,
          }
        },  
        {
          timestamp  : 
          {
            [Op.lte]: req.query.enddate,
          }
        },  
     ]
    },  
  })
  .then(data => {
    console.log("Audittrail.findAll:", data)
    res.send(data);
  })
  .catch(err => {
    console.log("Error while retreiving audittrail: "+err.message);

    res.status(500).send({
      message:
        err.message || "Some error occurred while retrieving audittrail."
    });
  });
};


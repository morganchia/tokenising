const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();


var corsOptions = {
  origin: "http://localhost:8081"
};
app.use(cors(
  // origin
));




// parse requests of content-type - application/json
//app.use(express.json());
app.use(express.json({ limit: '50mb' }));

// parse requests of content-type - application/x-www-form-urlencoded
//app.use(express.urlencoded({ extended: true }));
//app.use(express.urlencoded({ limit: '50mb', extended: true }));


// database
const db = require("./app/models");
const Role = db.role;
//const UserOpsRole  = db.useropsrole;

db.sequelize.sync();
// force: true will drop the table if it already exists
// db.sequelize.sync({force: true}).then(() => {
//   console.log('Drop and Resync Database with { force: true }');
//   initial();
// });


// routes
require('./app/routes/audittrail.routes')(app);
require('./app/routes/auth.routes')(app);
require('./app/routes/user.routes')(app);
require("./app/routes/campaign.routes")(app);
require("./app/routes/recipient.routes")(app);
require("./app/routes/opsrole.routes")(app);
require("./app/routes/useropsrole.routes")(app);
require("./app/routes/mint.routes")(app);
require("./app/routes/transfer.routes")(app);
require("./app/routes/pbm.routes")(app);
require("./app/routes/dvp.routes")(app);
require("./app/routes/bond.routes")(app);
require("./app/routes/bridge.routes")(app);
require("./app/routes/repo.routes")(app);
require("./app/routes/dtscf.routes")(app);

app.use((err, req, res, next) => {
  if (err.message === 'Unexpected end of form') {
    console.error('Multer form error:', err);
    res.status(400).send({ message: 'Incomplete form data - request may be truncated.' });
  } else {
    next(err);
  }
});

if (process.env.NODE_ENV === 'production') {
  // https://www.freecodecamp.org/news/how-to-create-a-react-app-with-a-node-backend-the-complete-guide/
  // Have Node serve the files for our built React app
  app.use(express.static(path.resolve(__dirname, '../client/build')));

  // All other GET requests not handled before will return our React app
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to BCDA application" });
});

// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

function initial() {
  Role.create({
//  UserOpsRole.create({
    id: 1,
    name: "user"  // or banker
  });
 
  Role.create({
//  UserOpsRole.create({
    id: 2,
    name: "moderator"
  });
 
  Role.create({
//  UserOpsRole.create({
    id: 3,
    name: "admin"
  });

  Role.create({
//  UserOpsRole.create({
    id: 4,
    name: "anchor"
  });
  
  Role.create({
//  UserOpsRole.create({
    id: 5,
    name: "conctractor"
  });
}

//exports.api = functions.https.onRequest(app)

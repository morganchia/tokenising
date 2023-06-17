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
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));


// database
const db = require("./app/models");
const Role = db.role;

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
    id: 1,
    name: "user"
  });
 
  Role.create({
    id: 2,
    name: "moderator"
  });
 
  Role.create({
    id: 3,
    name: "admin"
  });
}

//exports.api = functions.https.onRequest(app)

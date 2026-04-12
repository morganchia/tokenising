exports.allAccess = (req, res) => {
  res.status(200).send("Welcome to BCDA Tokenising Engine");
};

exports.userBoard = (req, res) => {
  res.status(200).send("User Content.");
};

exports.adminBoard = (req, res) => {
  res.status(200).send("Admin Content.");
};

exports.moderatorBoard = (req, res) => {
  res.status(200).send("Moderator Content.");
};
/*
exports.bankBoard = (req, res) => {
  res.status(200).send("Bank Content.");
};
*/
exports.anchorBoard = (req, res) => {
  res.status(200).send("Anchor Content.");
};

exports.contractorBoard = (req, res) => {
  res.status(200).send("Contractor Content.");
};

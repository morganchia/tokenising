const canton = require('../services/canton.service');

// Wraps a handler so Canton/validation errors become { message } responses like the other controllers.
const handle = (fn) => async (req, res) => {
  try {
    res.send(await fn(req));
  } catch (err) {
    res.status(err.status || 500).send({ message: err.message || 'Some error occurred while calling Canton.' });
  }
};

function requireFields(body, fields) {
  const missing = fields.filter((f) => body[f] === undefined || body[f] === '');
  if (missing.length) {
    const err = new Error(`Missing field(s): ${missing.join(', ')}`);
    err.status = 400;
    throw err;
  }
}

exports.health = handle(() => canton.health());

exports.listParties = handle(() => canton.listParties());

exports.allocateParty = handle(async (req) => {
  requireFields(req.body, ['partyIdHint']);
  return { party: await canton.allocateParty(req.body.partyIdHint) };
});

exports.listHoldings = handle((req) => {
  requireFields(req.query, ['party']);
  return canton.listHoldings(req.query.party);
});

exports.issueBond = handle((req) => {
  requireFields(req.body, ['issuer', 'owner', 'bondName', 'bondCode', 'faceValue', 'couponRate', 'maturityDate', 'quantity']);
  return canton.issueBond(req.body);
});

exports.transferBond = handle((req) => {
  requireFields(req.body, ['owner', 'contractId', 'newOwner', 'amount']);
  return canton.transferBond(req.body);
});

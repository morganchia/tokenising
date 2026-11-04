// Thin client for a Canton participant's JSON Ledger API (v2).
// Defaults target the local sandbox started from canton/ (see canton/README.md).
// For Canton LocalNet / TestNet point CANTON_JSON_API_URL at the validator's JSON API
// and set CANTON_AUTH_TOKEN to a JWT for CANTON_USER_ID.
const axios = require('axios');
const crypto = require('crypto');

const BOND_TEMPLATE_ID = '#tokenising-bond:Bond:BondHolding';

const api = axios.create({
  baseURL: process.env.CANTON_JSON_API_URL || 'http://localhost:7575',
  headers: process.env.CANTON_AUTH_TOKEN ? { Authorization: `Bearer ${process.env.CANTON_AUTH_TOKEN}` } : {},
  timeout: 30000,
});
const userId = process.env.CANTON_USER_ID || 'tokenising-server';

// Canton returns { code, cause } on failure; surface the cause instead of axios' generic message.
async function call(promise) {
  try {
    return (await promise).data;
  } catch (err) {
    const body = err.response && err.response.data;
    const detail = body && (body.cause || body.code || (typeof body === 'string' ? body : null));
    throw new Error(detail ? `Canton: ${detail}` : `Canton: ${err.message}`);
  }
}

async function submit(actAs, commands) {
  const body = { commands: { commands, userId, commandId: crypto.randomUUID(), actAs: [actAs] } };
  const { transaction } = await call(api.post('/v2/commands/submit-and-wait-for-transaction', body));
  return { updateId: transaction.updateId, offset: transaction.offset };
}

async function health() {
  const [ready, version] = await Promise.all([
    api.get('/readyz').then(() => true, () => false),
    call(api.get('/v2/version')),
  ]);
  return { ready, version: version.version };
}

async function listParties() {
  const { partyDetails } = await call(api.get('/v2/parties'));
  return partyDetails.map((p) => p.party);
}

async function allocateParty(partyIdHint) {
  const { partyDetails } = await call(api.post('/v2/parties', { partyIdHint, identityProviderId: '' }));
  return partyDetails.party;
}

function issueBond({ issuer, owner, bondName, bondCode, faceValue, couponRate, maturityDate, quantity }) {
  return submit(issuer, [{
    CreateCommand: {
      templateId: BOND_TEMPLATE_ID,
      createArguments: {
        issuer, owner, bondName, bondCode, maturityDate,
        // Daml Decimals are sent as strings to avoid float rounding.
        faceValue: String(faceValue), couponRate: String(couponRate), quantity: String(quantity),
      },
    },
  }]);
}

function transferBond({ owner, contractId, newOwner, amount }) {
  return submit(owner, [{
    ExerciseCommand: {
      templateId: BOND_TEMPLATE_ID,
      contractId,
      choice: 'Transfer',
      choiceArgument: { newOwner, amount: String(amount) },
    },
  }]);
}

// Active BondHolding contracts visible to `party` (as issuer or owner).
async function listHoldings(party) {
  const { offset } = await call(api.get('/v2/state/ledger-end'));
  if (offset === 0) return [];
  const filter = { identifierFilter: { TemplateFilter: { value: { templateId: BOND_TEMPLATE_ID, includeCreatedEventBlob: false } } } };
  const entries = await call(api.post('/v2/state/active-contracts', {
    eventFormat: { filtersByParty: { [party]: { cumulative: [filter] } }, verbose: false },
    activeAtOffset: offset,
  }));
  return entries
    .map((e) => e.contractEntry && e.contractEntry.JsActiveContract)
    .filter(Boolean)
    .map(({ createdEvent }) => ({ contractId: createdEvent.contractId, createdAt: createdEvent.createdAt, ...createdEvent.createArgument }));
}

module.exports = { health, listParties, allocateParty, issueBond, transferBond, listHoldings };

'use strict';

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';

function getKey() {
  const k = process.env.METADATA_ENCRYPTION_KEY;
  if (!k) throw new Error('METADATA_ENCRYPTION_KEY not set in environment');
  const buf = Buffer.from(k, 'hex');
  if (buf.length !== 32) throw new Error('METADATA_ENCRYPTION_KEY must be 32 bytes (64 hex chars)');
  return buf;
}

// Encrypt a plaintext JSON string. Returns the full envelope JSON string.
function encryptMetadata(plaintextJson) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  let ciphertext = cipher.update(plaintextJson, 'utf8', 'base64');
  ciphertext += cipher.final('base64');
  const authTag = cipher.getAuthTag().toString('base64');
  return buildEncryptedEnvelope(iv.toString('base64'), ciphertext, authTag);
}

// Decrypt an AES-GCM envelope object. Returns plaintext string.
function decryptMetadata(envelope) {
  const { iv, ciphertext, authTag } = envelope;
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(authTag, 'base64'));
  let plaintext = decipher.update(ciphertext, 'base64', 'utf8');
  plaintext += decipher.final('utf8');
  return plaintext;
}

function buildEncryptedEnvelope(iv, ciphertext, authTag) {
  return JSON.stringify({
    encrypted: true,
    version: 'aes-256-gcm-v1',
    iv,
    ciphertext,
    authTag,
  });
}

module.exports = { encryptMetadata, decryptMetadata, buildEncryptedEnvelope };

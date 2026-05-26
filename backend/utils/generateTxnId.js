/**
 * utils/generateTxnId.js
 * --------------------------------------------------------------------
 * Generates human-readable transaction IDs on the BACKEND.
 *
 * Format: TXN-YYYYMMDD-XXXXXX
 *   YYYYMMDD = current date (UTC)
 *   XXXXXX   = 6-char random alphanumeric, uppercase
 *
 * The brief requires that the transactionId is generated server-side
 * (Section 11, rule 12) and is unique. The randomness gives us
 * effectively zero collision probability at our demo scale, but the
 * Mongoose schema also enforces a unique index as a safety net.
 * --------------------------------------------------------------------
 */

const crypto = require('crypto');

const generateTxnId = () => {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');

  // 6 random uppercase alphanumeric chars (no ambiguous 0/O, 1/I).
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const random = Array.from(crypto.randomBytes(6))
    .map((b) => chars[b % chars.length])
    .join('');

  return `TXN-${yyyy}${mm}${dd}-${random}`;
};

module.exports = generateTxnId;

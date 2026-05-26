/**
 * utils/suspiciousRules.js
 * --------------------------------------------------------------------
 * Backend-only suspicious transaction rule engine.
 *
 * The brief (Section 6, objective 15 + Section 9, requirement 46)
 * REQUIRES at least 5 backend rules. We implement 6 here for safety.
 * Each rule returns a string reason if it fires, otherwise null.
 *
 * Rules implemented:
 *   1. LARGE_AMOUNT   — single transaction above threshold (default 100k)
 *   2. RAPID_FIRE     — >N transactions from same user within X minutes
 *   3. ROUND_AMOUNT   — exact 50,000 / 100,000 / 500,000 (common fraud signal)
 *   4. MIDNIGHT_HOUR  — transaction between 00:00–05:00 UTC
 *   5. NEW_ACCOUNT    — sender's account is younger than 24 hours
 *   6. ZERO_BALANCE_AFTER — withdrawal/transfer leaves wallet at 0 balance
 *
 * Returns: { suspicious: boolean, reasons: string[] }
 * --------------------------------------------------------------------
 */

const Transaction = require('../models/Transaction');

const evaluateRules = async ({ user, wallet, amount, type, balanceAfter }) => {
  const reasons = [];

  // ----- Read tunable thresholds from env (fall back to defaults) -----
  const LARGE = Number(process.env.SUSPICIOUS_LARGE_AMOUNT || 100000);
  const RAPID_COUNT = Number(process.env.SUSPICIOUS_RAPID_COUNT || 5);
  const RAPID_WINDOW_MIN = Number(process.env.SUSPICIOUS_RAPID_WINDOW_MINUTES || 10);

  // RULE 1 — Large amount.
  if (amount >= LARGE) {
    reasons.push(`Amount ${amount} is at or above the suspicious threshold of ${LARGE}`);
  }

  // RULE 2 — Rapid-fire transactions from same user.
  if (user) {
    const since = new Date(Date.now() - RAPID_WINDOW_MIN * 60 * 1000);
    const recentCount = await Transaction.countDocuments({
      senderId: user._id,
      createdAt: { $gte: since },
    });
    if (recentCount >= RAPID_COUNT) {
      reasons.push(`User has ${recentCount} transactions in the last ${RAPID_WINDOW_MIN} minutes`);
    }
  }

  // RULE 3 — Suspicious round amount.
  const roundAmounts = [50000, 100000, 500000, 1000000];
  if (roundAmounts.includes(amount)) {
    reasons.push(`Exact round amount ${amount} commonly seen in laundering patterns`);
  }

  // RULE 4 — Midnight-hour transactions.
  const hour = new Date().getUTCHours();
  if (hour >= 0 && hour < 5) {
    reasons.push(`Transaction at unusual hour (UTC ${hour}:00–05:00)`);
  }

  // RULE 5 — Brand-new account doing financial action.
  if (user && user.createdAt) {
    const ageMs = Date.now() - new Date(user.createdAt).getTime();
    if (ageMs < 24 * 60 * 60 * 1000 && (type === 'transfer' || type === 'withdrawal')) {
      reasons.push('Account is less than 24 hours old');
    }
  }

  // RULE 6 — Wallet drained to zero in single action.
  if ((type === 'transfer' || type === 'withdrawal') && balanceAfter === 0 && amount > 1000) {
    reasons.push('Transaction drains wallet to zero balance');
  }

  return {
    suspicious: reasons.length > 0,
    reasons,
  };
};

module.exports = { evaluateRules };

/**
 * middlewares/rateLimiter.js
 * --------------------------------------------------------------------
 * Pre-configured rate limiters for sensitive endpoints.
 *
 * authLimiter      — login/register (brute force protection)
 * walletLimiter    — wallet deposits/withdrawals/transfers
 *
 * The brief asks (Section 14, 15) for rate limiting on auth and
 * sensitive financial routes.
 * --------------------------------------------------------------------
 */

const rateLimit = require('express-rate-limit');

// Login / register: 10 requests / 15 min per IP. Generous for demo,
// tight enough to slow brute force.
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts. Try again in 15 minutes.' },
});

// Wallet actions: 30 / minute per IP. Plenty for demo, blocks scripted abuse.
exports.walletLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many wallet actions. Slow down.' },
});

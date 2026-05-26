/**
 * middlewares/requireActive.js
 * --------------------------------------------------------------------
 * Blocks blocked users from financial actions.
 *
 * The brief calls for this in multiple places:
 *   - Backend Business Logic Rules #2: "A blocked user cannot perform
 *     deposits, withdrawals, or transfers."
 *   - Security Requirements #20.
 *
 * Apply this AFTER auth on every wallet/financial route.
 * --------------------------------------------------------------------
 */

const { fail } = require('../utils/response');

const requireActive = (req, res, next) => {
  if (!req.user) return fail(res, 'Authentication required', 401);
  if (req.user.status === 'blocked') {
    return fail(res, 'Your account has been blocked. Contact support.', 403);
  }
  next();
};

module.exports = requireActive;

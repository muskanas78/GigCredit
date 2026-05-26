/**
 * middlewares/role.js
 * --------------------------------------------------------------------
 * Restrict a route to one or more roles.
 *
 * Usage:
 *   router.get('/admin/users', auth, requireRole('admin'), handler);
 *
 * The brief is very firm about this: hiding admin pages in React is NOT
 * security. The backend check here is what actually stops a non-admin
 * from hitting an admin endpoint.
 * --------------------------------------------------------------------
 */

const { fail } = require('../utils/response');

const requireRole = (...allowed) => (req, res, next) => {
  if (!req.user) return fail(res, 'Authentication required', 401);
  if (!allowed.includes(req.user.role)) {
    return fail(res, 'Forbidden: insufficient permissions', 403);
  }
  next();
};

module.exports = requireRole;

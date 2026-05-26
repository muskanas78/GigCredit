/**
 * middlewares/auth.js
 * --------------------------------------------------------------------
 * Verifies the JWT in the Authorization header and attaches req.user.
 *
 * Header format: "Authorization: Bearer <token>"
 *
 * On any failure (missing, malformed, expired, signature invalid)
 * we respond 401 with a generic message — never echo the JWT secret
 * or token internals.
 * --------------------------------------------------------------------
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { fail } = require('../utils/response');

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      return fail(res, 'Authentication required: missing or malformed token', 401);
    }
    const token = header.slice(7); // remove "Bearer "

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // Distinguish expired vs invalid — frontend may redirect on expiry.
      if (err.name === 'TokenExpiredError') {
        return fail(res, 'Session expired, please log in again', 401);
      }
      return fail(res, 'Invalid authentication token', 401);
    }

    // Pull a fresh user document so blocks/role changes apply IMMEDIATELY.
    const user = await User.findById(decoded.id);
    if (!user) {
      return fail(res, 'User no longer exists', 401);
    }

    req.user = user; // available to every downstream handler
    next();
  } catch (err) {
    next(err); // forward to centralized error handler
  }
};

module.exports = auth;

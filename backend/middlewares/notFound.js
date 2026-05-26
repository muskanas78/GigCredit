/**
 * middlewares/notFound.js
 * --------------------------------------------------------------------
 * Catches any request that didn't match a route. Sends a consistent
 * 404 JSON response (matching our standard shape).
 * Mounted AFTER all routes in app.js.
 * --------------------------------------------------------------------
 */

const { fail } = require('../utils/response');

const notFound = (req, res) => {
  return fail(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
};

module.exports = notFound;

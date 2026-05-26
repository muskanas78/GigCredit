/**
 * middlewares/validateObjectId.js
 * --------------------------------------------------------------------
 * Validates an ObjectId param BEFORE we hit the database.
 *
 * Why: Mongoose throws a CastError on malformed IDs. That's catchable,
 * but defending in middleware makes routes cleaner and gives a clean
 * 400 response. Required by the brief (Section 11 #22, Section 15 #11).
 *
 * Usage:
 *   router.get('/:id', validateObjectId('id'), handler);
 * --------------------------------------------------------------------
 */

const mongoose = require('mongoose');
const { fail } = require('../utils/response');

const validateObjectId = (paramName = 'id') => (req, res, next) => {
  const value = req.params[paramName];
  if (!mongoose.isValidObjectId(value)) {
    return fail(res, `Invalid id parameter: ${paramName}`, 400);
  }
  next();
};

module.exports = validateObjectId;

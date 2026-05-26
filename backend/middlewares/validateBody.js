/**
 * middlewares/validateBody.js
 * --------------------------------------------------------------------
 * Lightweight request-body validator.
 *
 * We DELIBERATELY don't pull in Joi/Zod/Yup here — the brief expects
 * code the student can explain in viva. Pure JS validation rules are
 * easy to read and easy to defend.
 *
 * Each rule has the shape:
 *   { field: 'amount', type: 'number', required: true, min: 0.01 }
 *
 * Supported keys: type ('string'|'number'|'boolean'|'email'),
 *                 required, min, max, minLength, maxLength, enum.
 * --------------------------------------------------------------------
 */

const { fail } = require('../utils/response');

const validateBody = (rules) => (req, res, next) => {
  const errors = [];
  const body = req.body || {};

  for (const rule of rules) {
    const { field, type, required, min, max, minLength, maxLength, enum: allowed } = rule;
    const value = body[field];
    const present = value !== undefined && value !== null && value !== '';

    if (required && !present) {
      errors.push(`${field} is required`);
      continue;
    }
    if (!present) continue; // optional field, skip the rest

    // type checks
    if (type === 'number') {
      if (typeof value !== 'number' || Number.isNaN(value)) {
        errors.push(`${field} must be a number`);
        continue;
      }
      if (min !== undefined && value < min) errors.push(`${field} must be at least ${min}`);
      if (max !== undefined && value > max) errors.push(`${field} must be at most ${max}`);
    } else if (type === 'string') {
      if (typeof value !== 'string') {
        errors.push(`${field} must be a string`);
        continue;
      }
      if (minLength !== undefined && value.length < minLength)
        errors.push(`${field} must be at least ${minLength} characters`);
      if (maxLength !== undefined && value.length > maxLength)
        errors.push(`${field} must be at most ${maxLength} characters`);
    } else if (type === 'email') {
      if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors.push(`${field} must be a valid email`);
      }
    } else if (type === 'boolean') {
      if (typeof value !== 'boolean') errors.push(`${field} must be true or false`);
    }

    if (allowed && !allowed.includes(value)) {
      errors.push(`${field} must be one of: ${allowed.join(', ')}`);
    }
  }

  if (errors.length) {
    return fail(res, 'Validation failed', 400, errors);
  }
  next();
};

module.exports = validateBody;

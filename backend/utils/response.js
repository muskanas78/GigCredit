/**
 * utils/response.js
 * --------------------------------------------------------------------
 * Consistent API response shape across the entire backend.
 *
 * SUCCESS:  { success: true,  message, data }
 * FAILURE:  { success: false, message, errors? }
 *
 * Every controller should use these helpers instead of ad-hoc res.json().
 * --------------------------------------------------------------------
 */

exports.ok = (res, data = null, message = 'Success', status = 200) => {
  return res.status(status).json({ success: true, message, data });
};

exports.created = (res, data = null, message = 'Created') => {
  return res.status(201).json({ success: true, message, data });
};

exports.fail = (res, message = 'Request failed', status = 400, errors = null) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(status).json(body);
};

/**
 * Tiny wrapper to forward async errors into Express's error pipeline.
 * Without this we'd need try/catch in every controller.
 */
exports.asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

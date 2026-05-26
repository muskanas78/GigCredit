/**
 * middlewares/errorHandler.js
 * --------------------------------------------------------------------
 * Centralized error handler. Express recognises this signature
 * (4 args: err, req, res, next) — it must come LAST in app.js.
 *
 * In production we never leak stack traces to the client.
 * --------------------------------------------------------------------
 */

const errorHandler = (err, req, res, next) => {
  console.error('🔥 Error:', err.message);

  // Mongoose validation errors → 400 with field details
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }

  // Mongoose duplicate key (unique index) → 409 Conflict
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `Duplicate value for ${field}`,
    });
  }

  // Mongoose cast error (bad ObjectId etc.)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path}: ${err.value}`,
    });
  }

  const status = err.status || err.statusCode || 500;
  const body = {
    success: false,
    message: err.message || 'Server error',
  };

  // Only expose stack in development.
  if (process.env.NODE_ENV !== 'production') {
    body.stack = err.stack;
  }

  res.status(status).json(body);
};

module.exports = errorHandler;

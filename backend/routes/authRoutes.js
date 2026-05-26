/**
 * routes/authRoutes.js
 * --------------------------------------------------------------------
 * Mounted at /api/auth in app.js.
 * --------------------------------------------------------------------
 */

const router = require('express').Router();
const ctrl = require('../controllers/authController');
const auth = require('../middlewares/auth');
const validateBody = require('../middlewares/validateBody');
const { authLimiter } = require('../middlewares/rateLimiter');
const {
  registerRules,
  loginRules,
  changePasswordRules,
} = require('../validations/schemas');

// Public — but rate-limited to slow brute force.
router.post('/register', authLimiter, validateBody(registerRules), ctrl.register);
router.post('/login',    authLimiter, validateBody(loginRules),    ctrl.login);

// Protected.
router.post('/logout', auth, ctrl.logout);
router.get('/me',      auth, ctrl.me);
router.put('/change-password', auth, validateBody(changePasswordRules), ctrl.changePassword);

module.exports = router;

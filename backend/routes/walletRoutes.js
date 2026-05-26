/**
 * routes/walletRoutes.js
 * --------------------------------------------------------------------
 * Wallet operations. Every route requires auth + active status, and the
 * mutating routes are also rate-limited.
 * --------------------------------------------------------------------
 */

const router = require('express').Router();
const ctrl = require('../controllers/walletController');
const auth = require('../middlewares/auth');
const requireActive = require('../middlewares/requireActive');
const validateBody = require('../middlewares/validateBody');
const { walletLimiter } = require('../middlewares/rateLimiter');
const { amountRules, transferRules } = require('../validations/schemas');

router.get('/',         auth, ctrl.getOwnWallet);
router.get('/summary',  auth, ctrl.getSummary);

router.post('/deposit',  auth, requireActive, walletLimiter, validateBody(amountRules),   ctrl.deposit);
router.post('/withdraw', auth, requireActive, walletLimiter, validateBody(amountRules),   ctrl.withdraw);
router.post('/transfer', auth, requireActive, walletLimiter, validateBody(transferRules), ctrl.transfer);

module.exports = router;

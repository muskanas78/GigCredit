/**
 * routes/adminRoutes.js
 * --------------------------------------------------------------------
 * All routes here require [auth, requireRole('admin')].
 * --------------------------------------------------------------------
 */

const router = require('express').Router();
const ctrl = require('../controllers/adminController');
const auth = require('../middlewares/auth');
const requireRole = require('../middlewares/role');
const validateObjectId = require('../middlewares/validateObjectId');
const validateBody = require('../middlewares/validateBody');
const { categoryRules } = require('../validations/schemas');

// Apply auth + admin gate to EVERY route in this router.
router.use(auth, requireRole('admin'));

// Dashboard / reports
router.get('/dashboard',                    ctrl.dashboard);
router.get('/reports/transaction-volume',   ctrl.transactionVolume);
router.get('/reports/system-balance',       ctrl.systemBalance);

// Users
router.get('/users',                                ctrl.listUsers);
router.get('/users/:id',         validateObjectId('id'), ctrl.getUser);
router.patch('/users/:id/block',   validateObjectId('id'), ctrl.blockUser);
router.patch('/users/:id/unblock', validateObjectId('id'), ctrl.unblockUser);

// Wallets / transactions
router.get('/wallets',                ctrl.listWallets);
router.get('/transactions',           ctrl.listTransactions);
router.get('/transactions/flagged',   ctrl.listFlaggedTransactions);

// Categories
router.post('/categories',                                  validateBody(categoryRules), ctrl.createCategory);
router.put('/categories/:id',         validateObjectId('id'), ctrl.updateCategory);
router.patch('/categories/:id/disable', validateObjectId('id'), ctrl.disableCategory);

// Audit (optional)
router.get('/audit-logs', ctrl.listAuditLogs);

module.exports = router;

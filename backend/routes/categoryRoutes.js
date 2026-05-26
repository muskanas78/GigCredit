/**
 * routes/categoryRoutes.js
 * --------------------------------------------------------------------
 * Public-list categories (admin writes are under /api/admin/categories).
 * --------------------------------------------------------------------
 */

const router = require('express').Router();
const ctrl = require('../controllers/categoryController');
const auth = require('../middlewares/auth');

router.get('/', auth, ctrl.listActive);

module.exports = router;

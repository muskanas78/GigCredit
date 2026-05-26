/**
 * routes/expenseRoutes.js
 * --------------------------------------------------------------------
 * CRUD + summaries for the logged-in user's own expenses.
 * --------------------------------------------------------------------
 */

const router = require('express').Router();
const ctrl = require('../controllers/expenseController');
const auth = require('../middlewares/auth');
const validateObjectId = require('../middlewares/validateObjectId');
const validateBody = require('../middlewares/validateBody');
const { expenseRules } = require('../validations/schemas');

router.post('/',                    auth, validateBody(expenseRules), ctrl.create);
router.get('/',                     auth, ctrl.listOwn);
router.get('/summary/monthly',      auth, ctrl.monthlySummary);
router.get('/summary/categories',   auth, ctrl.categorySummary);
router.put('/:id',                  auth, validateObjectId('id'), ctrl.update);
router.delete('/:id',               auth, validateObjectId('id'), ctrl.remove);

module.exports = router;

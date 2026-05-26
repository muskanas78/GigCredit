/**
 * routes/budgetRoutes.js
 * --------------------------------------------------------------------
 * Monthly + category budgets.
 * --------------------------------------------------------------------
 */

const router = require('express').Router();
const ctrl = require('../controllers/budgetController');
const auth = require('../middlewares/auth');
const validateObjectId = require('../middlewares/validateObjectId');
const validateBody = require('../middlewares/validateBody');
const { budgetRules } = require('../validations/schemas');

router.post('/',         auth, validateBody(budgetRules), ctrl.create);
router.get('/',          auth, ctrl.listOwn);
router.get('/current',   auth, ctrl.current);
router.put('/:id',       auth, validateObjectId('id'), ctrl.update);
router.delete('/:id',    auth, validateObjectId('id'), ctrl.remove);

module.exports = router;

/**
 * routes/reportRoutes.js — GigCredit User Analytics
 */

const router = require('express').Router();
const ctrl   = require('../controllers/reportController');
const auth   = require('../middlewares/auth');

router.get('/user-dashboard', auth, ctrl.userDashboard);
router.get('/advance-plan',   auth, ctrl.advancePlan);
router.get('/income-expense', auth, ctrl.incomeVsExpense);
router.get('/budget-usage',   auth, ctrl.budgetUsage);

module.exports = router;

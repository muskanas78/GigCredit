/**
 * routes/transactionRoutes.js
 * --------------------------------------------------------------------
 * Transaction history + receipt for the logged-in user.
 * --------------------------------------------------------------------
 */

const router = require('express').Router();
const ctrl = require('../controllers/transactionController');
const auth = require('../middlewares/auth');
const validateObjectId = require('../middlewares/validateObjectId');

router.get('/',                       auth, ctrl.listOwn);
router.get('/summary/monthly',        auth, ctrl.monthlySummary);
router.get('/:id',                    auth, validateObjectId('id'), ctrl.getOne);
router.get('/:id/receipt',            auth, validateObjectId('id'), ctrl.getReceipt);

module.exports = router;

/**
 * routes/notificationRoutes.js
 * --------------------------------------------------------------------
 * In-app notifications.
 * --------------------------------------------------------------------
 */

const router = require('express').Router();
const ctrl = require('../controllers/notificationController');
const auth = require('../middlewares/auth');
const validateObjectId = require('../middlewares/validateObjectId');

router.get('/',                  auth, ctrl.listOwn);
router.patch('/read-all',        auth, ctrl.markAllRead);
router.patch('/:id/read',        auth, validateObjectId('id'), ctrl.markRead);

module.exports = router;

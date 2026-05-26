/**
 * routes/userRoutes.js
 * --------------------------------------------------------------------
 * Profile read + update for the logged-in user.
 * --------------------------------------------------------------------
 */

const router = require('express').Router();
const ctrl = require('../controllers/userController');
const auth = require('../middlewares/auth');
const validateBody = require('../middlewares/validateBody');
const { profileUpdateRules } = require('../validations/schemas');

router.get('/profile', auth, ctrl.getProfile);
router.put('/profile', auth, validateBody(profileUpdateRules), ctrl.updateProfile);
router.delete('/profile', auth, ctrl.deleteProfile);

module.exports = router;

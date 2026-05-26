/**
 * controllers/userController.js
 * --------------------------------------------------------------------
 * Profile read + update for the LOGGED-IN user only.
 *
 * Important: we strictly whitelist editable fields. Role, status, email,
 * and balance are NOT editable from this route — those would let a user
 * promote themselves to admin or change their identity.
 * (Brief Section 11, rule 24; Section 15 #29.)
 * --------------------------------------------------------------------
 */

const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');
const { ok, asyncHandler, fail } = require('../utils/response');

// GET /api/users/profile
exports.getProfile = asyncHandler(async (req, res) => {
  return ok(res, { user: req.user.toSafeJSON() });
});

// PUT /api/users/profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['name', 'phone', 'employerName', 'employmentType', 'monthlyIncome'];        // <-- WHITELIST
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });
  if (!user) return fail(res, 'User not found', 404);

  return ok(res, { user: user.toSafeJSON() }, 'Profile updated');
});

// DELETE /api/users/profile
// Soft-delete: anonymize user, mark as deleted, remove related data
exports.deleteProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return fail(res, 'User not found', 404);

  // Mark deleted and anonymize personal data
  user.status = 'deleted';
  user.email = `deleted+${user._id}@removed.local`;
  user.name = 'Deleted User';
  user.phone = null;
  user.deletedAt = new Date();
  await user.save();

  // Remove wallet and transactions
  await Wallet.deleteMany({ userId: user._id });
  await Transaction.deleteMany({ $or: [{ senderId: user._id }, { receiverId: user._id }] });

  // Log the deletion for audit trail
  await AuditLog.create({
    actorId: user._id,
    action: 'SELF_DELETE',
    targetType: 'user',
    targetId: user._id.toString(),
    ipAddress: req.ip,
  });

  return ok(res, {}, 'Account deleted successfully');
});

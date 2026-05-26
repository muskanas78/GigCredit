/**
 * controllers/notificationController.js
 * --------------------------------------------------------------------
 * List + mark-as-read for the user's own notifications.
 * --------------------------------------------------------------------
 */

const Notification = require('../models/Notification');
const { ok, fail, asyncHandler } = require('../utils/response');

// GET /api/notifications
exports.listOwn = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(100);
  return ok(res, { notifications });
});

// PATCH /api/notifications/:id/read
exports.markRead = asyncHandler(async (req, res) => {
  const notif = await Notification.findById(req.params.id);
  if (!notif) return fail(res, 'Notification not found', 404);
  if (!notif.userId.equals(req.user._id)) return fail(res, 'Forbidden', 403);
  notif.readStatus = true;
  await notif.save();
  return ok(res, { notification: notif }, 'Marked as read');
});

// PATCH /api/notifications/read-all
exports.markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ userId: req.user._id, readStatus: false }, { readStatus: true });
  return ok(res, null, 'All notifications marked as read');
});

/**
 * models/Notification.js
 * --------------------------------------------------------------------
 * In-app alerts for users / admins.
 *
 * Brief reference: Section 12 (notifications collection)
 *
 * Triggered by: transaction success/failure, low balance, budget
 * warning, suspicious activity, account block events, etc.
 * --------------------------------------------------------------------
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true, maxlength: 120 },
    message: { type: String, required: true, maxlength: 500 },
    type: {
      type: String,
      enum: ['transaction', 'budget', 'security', 'account', 'system'],
      required: true,
    },
    readStatus: { type: Boolean, default: false },
    relatedTransactionId: { type: String }, // human-readable txn id
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, readStatus: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

/**
 * models/Transaction.js
 * --------------------------------------------------------------------
 * Stores every wallet operation: deposits, withdrawals, transfers,
 * including failed and flagged ones (so we can audit suspicious activity).
 *
 * Brief reference: Section 12 (transactions collection)
 * --------------------------------------------------------------------
 */

const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true, // we'll filter and look up by this often
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // null on plain deposits (money "comes from nowhere" — demo funds)
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // null on plain withdrawals
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, 'Amount must be greater than zero'],
    },
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'transfer', 'refund', 'fee', 'billPayment'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'successful', 'failed', 'flagged'],
      default: 'pending',
    },
    category: { type: String, default: 'general' },
    description: { type: String, default: '' },

    // Suspicious-rule output — written by the rule engine before save.
    suspiciousFlag: { type: Boolean, default: false },
    suspiciousReasons: [{ type: String }],

    // Reason a transaction failed (helpful for support / audit).
    failureReason: { type: String },
  },
  { timestamps: true }
);

// Useful compound index for transaction history filters.
transactionSchema.index({ senderId: 1, createdAt: -1 });
transactionSchema.index({ receiverId: 1, createdAt: -1 });
transactionSchema.index({ status: 1, suspiciousFlag: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);

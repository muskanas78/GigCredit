/**
 * models/Budget.js
 * --------------------------------------------------------------------
 * Monthly + category-wise budget limits per user.
 *
 * Brief reference: Section 12 (budgets collection)
 *
 * Status calculation:
 *   safe       — spent < warningThreshold * totalLimit
 *   nearLimit  — warningThreshold * totalLimit <= spent < totalLimit
 *   exceeded   — spent >= totalLimit
 * The status is computed by the budget controller (NOT the frontend).
 * --------------------------------------------------------------------
 */

const mongoose = require('mongoose');

const categoryLimitSchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    limit: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // We store the month as "YYYY-MM" — easier to query than full Date
    // for monthly summaries.
    month: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}$/,
    },
    totalLimit: {
      type: Number,
      required: true,
      min: 1,
    },
    categoryLimits: [categoryLimitSchema],
    spentAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['safe', 'nearLimit', 'exceeded'],
      default: 'safe',
    },
    // 0–1. Default 0.8 = 80% triggers the "near limit" warning.
    warningThreshold: { type: Number, default: 0.8, min: 0.1, max: 0.99 },
  },
  { timestamps: true }
);

// Prevent the same user creating two budgets for the same month.
budgetSchema.index({ userId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);

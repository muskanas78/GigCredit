/**
 * models/Expense.js
 * --------------------------------------------------------------------
 * Personal spending records owned by a user.
 *
 * Brief reference: Section 12 (expenses collection)
 *
 * Ownership rule: every controller that updates / reads an expense must
 * verify that expense.userId === req.user._id (or req.user.role==='admin').
 * --------------------------------------------------------------------
 */

const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 120,
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, 'Amount must be greater than zero'],
    },
    category: { type: String, default: 'general', index: true },
    paymentMethod: {
      type: String,
      enum: ['Wallet', 'Cash', 'Card', 'Other'],
      default: 'Wallet',
    },
    date: { type: Date, required: true, default: Date.now },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expense', expenseSchema);

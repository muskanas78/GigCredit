/**
 * models/Category.js
 * --------------------------------------------------------------------
 * Categories for transactions / expenses / budgets.
 *
 * Brief reference: Section 12 (categories collection)
 * Admin-only writes; all logged-in users can read.
 * --------------------------------------------------------------------
 */

const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    type: {
      type: String,
      enum: ['transaction', 'expense', 'budget'],
      required: true,
    },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Avoid duplicate active categories of the same name + type.
categorySchema.index({ name: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);

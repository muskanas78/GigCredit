/**
 * models/Wallet.js
 * --------------------------------------------------------------------
 * Mongoose schema for wallets. One wallet per user (1:1 enforced by
 * the unique index on userId).
 *
 * Brief reference: Section 12 (wallets collection)
 * --------------------------------------------------------------------
 */

const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // enforces 1 wallet per user
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Balance cannot be negative'],
    },
    currency: {
      type: String,
      enum: ['PKR', 'USD', 'EUR'],
      default: 'PKR',
    },
    status: {
      type: String,
      enum: ['active', 'frozen'],
      default: 'active',
    },
    // Lifetime aggregates — useful for the wallet summary API.
    totalDeposits:      { type: Number, default: 0 },
    totalWithdrawals:   { type: Number, default: 0 },
    totalTransfersIn:   { type: Number, default: 0 },
    totalTransfersOut:  { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Wallet', walletSchema);

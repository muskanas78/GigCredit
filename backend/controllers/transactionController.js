/**
 * controllers/transactionController.js
 * --------------------------------------------------------------------
 * List own transactions, view details, monthly summary.
 *
 * Ownership rule: a regular user only sees transactions where they are
 * the sender OR the receiver. Admin sees everything via /admin routes.
 * --------------------------------------------------------------------
 */

const Transaction = require('../models/Transaction');
const { ok, fail, asyncHandler } = require('../utils/response');

// GET /api/transactions  (with filters)
exports.listOwn = asyncHandler(async (req, res) => {
  const { type, status, category, search, from, to } = req.query;

  // Base ownership filter.
  const filter = {
    $or: [{ senderId: req.user._id }, { receiverId: req.user._id }],
  };

  if (type) filter.type = type;
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }
  if (search) {
    filter.$or = [
      ...filter.$or,
      { transactionId: new RegExp(search, 'i') },
      { description: new RegExp(search, 'i') },
    ];
  }

  const txns = await Transaction.find(filter)
    .sort({ createdAt: -1 })
    .limit(200)
    .populate('senderId', 'name email')
    .populate('receiverId', 'name email');

  return ok(res, { transactions: txns });
});

// GET /api/transactions/:id
exports.getOne = asyncHandler(async (req, res) => {
  const txn = await Transaction.findById(req.params.id)
    .populate('senderId', 'name email')
    .populate('receiverId', 'name email');
  if (!txn) return fail(res, 'Transaction not found', 404);

  // Ownership: user must be sender / receiver, or admin.
  const isOwner =
    (txn.senderId && txn.senderId._id.equals(req.user._id)) ||
    (txn.receiverId && txn.receiverId._id.equals(req.user._id));
  if (!isOwner && req.user.role !== 'admin') {
    return fail(res, 'Forbidden', 403);
  }

  return ok(res, { transaction: txn });
});

// GET /api/transactions/:id/receipt
// Same as getOne but the frontend renders it differently.
exports.getReceipt = exports.getOne;

// GET /api/transactions/summary/monthly
exports.monthlySummary = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const summary = await Transaction.aggregate([
    {
      $match: {
        $or: [{ senderId: userId }, { receiverId: userId }],
        status: { $in: ['successful', 'flagged'] },
      },
    },
    {
      $group: {
        _id: {
          y: { $year: '$createdAt' },
          m: { $month: '$createdAt' },
          type: '$type',
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.y': -1, '_id.m': -1 } },
  ]);

  return ok(res, { summary });
});

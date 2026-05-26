/**
 * controllers/reportController.js — GigCredit Reports
 * User-side analytics: dashboard summary, income vs expense,
 * budget usage, and advance eligibility plan.
 */

const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const { buildAdvancePlan } = require('../utils/loanCalculator');
const { ok, asyncHandler } = require('../utils/response');

// GET /api/reports/user-dashboard
exports.userDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const wallet = await Wallet.findOne({ userId });

  const recentTxns = await Transaction.find({
    $or: [{ senderId: userId }, { receiverId: userId }],
  }).sort({ createdAt: -1 }).limit(5);

  const txnCount = await Transaction.countDocuments({
    $or: [{ senderId: userId }, { receiverId: userId }],
  });

  const since = new Date();
  since.setMonth(since.getMonth() - 5);
  since.setDate(1);

  const monthlyExpenses = await Expense.aggregate([
    { $match: { userId, date: { $gte: since } } },
    {
      $group: {
        _id: { y: { $year: '$date' }, m: { $month: '$date' } },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { '_id.y': 1, '_id.m': 1 } },
  ]);

  return ok(res, {
    walletBalance: wallet ? wallet.balance : 0,
    currency: wallet ? wallet.currency : 'PKR',
    transactionCount: txnCount,
    recentTransactions: recentTxns,
    monthlyExpenses,
  });
});

// GET /api/reports/advance-plan?pendingEarnings=...&feeRate=...
exports.advancePlan = asyncHandler(async (req, res) => {
  const plan = buildAdvancePlan({
    pendingEarnings: req.query.pendingEarnings,
    feeRate: req.query.feeRate || 4,
  });
  return ok(res, { plan });
});

// GET /api/reports/income-expense
exports.incomeVsExpense = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const incomeAgg = await Transaction.aggregate([
    {
      $match: {
        receiverId: userId,
        type: { $in: ['deposit', 'transfer'] },
        status: { $in: ['successful', 'flagged'] },
      },
    },
    {
      $group: {
        _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
        total: { $sum: '$amount' },
      },
    },
  ]);

  const outAgg = await Transaction.aggregate([
    {
      $match: {
        senderId: userId,
        type: { $in: ['withdrawal', 'transfer'] },
        status: { $in: ['successful', 'flagged'] },
      },
    },
    {
      $group: {
        _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
        total: { $sum: '$amount' },
      },
    },
  ]);

  return ok(res, { income: incomeAgg, outflow: outAgg });
});

// GET /api/reports/budget-usage
exports.budgetUsage = asyncHandler(async (req, res) => {
  const budgets = await Budget.find({ userId: req.user._id }).sort({ month: -1 }).limit(12);
  return ok(res, { budgets });
});

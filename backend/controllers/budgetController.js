/**
 * controllers/budgetController.js
 * --------------------------------------------------------------------
 * CRUD + status calculation for monthly budgets.
 *
 * Status (calculated by BACKEND):
 *   exceeded   — spent >= totalLimit
 *   nearLimit  — spent >= warningThreshold * totalLimit
 *   safe       — otherwise
 * --------------------------------------------------------------------
 */

const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const Notification = require('../models/Notification');
const { recomputeBudgetFor } = require('./expenseController');
const { ok, created, fail, asyncHandler } = require('../utils/response');

// POST /api/budgets
exports.create = asyncHandler(async (req, res) => {
  const { month, totalLimit, categoryLimits = [], warningThreshold = 0.8 } = req.body;

  // Reject duplicate budget for same month — unique index would also reject this,
  // but explicit message is friendlier.
  const existing = await Budget.findOne({ userId: req.user._id, month });
  if (existing) return fail(res, `Budget for ${month} already exists`, 409);

  const budget = await Budget.create({
    userId: req.user._id,
    month,
    totalLimit,
    categoryLimits,
    warningThreshold,
  });
  await recomputeBudgetFor(req.user._id, new Date(`${month}-01`));

  return created(res, { budget }, 'Budget created');
});

// GET /api/budgets
exports.listOwn = asyncHandler(async (req, res) => {
  const budgets = await Budget.find({ userId: req.user._id }).sort({ month: -1 });
  return ok(res, { budgets });
});

// GET /api/budgets/current
exports.current = asyncHandler(async (req, res) => {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const budget = await Budget.findOne({ userId: req.user._id, month });
  if (!budget) return ok(res, { budget: null });
  await recomputeBudgetFor(req.user._id, now);
  const refreshed = await Budget.findById(budget._id);
  return ok(res, { budget: refreshed });
});

// PUT /api/budgets/:id
exports.update = asyncHandler(async (req, res) => {
  const budget = await Budget.findById(req.params.id);
  if (!budget) return fail(res, 'Budget not found', 404);
  if (!budget.userId.equals(req.user._id)) return fail(res, 'Forbidden', 403);

  const allowed = ['totalLimit', 'categoryLimits', 'warningThreshold'];
  for (const k of allowed) if (req.body[k] !== undefined) budget[k] = req.body[k];
  await budget.save();
  await recomputeBudgetFor(req.user._id, new Date(`${budget.month}-01`));
  return ok(res, { budget }, 'Budget updated');
});

// DELETE /api/budgets/:id
exports.remove = asyncHandler(async (req, res) => {
  const budget = await Budget.findById(req.params.id);
  if (!budget) return fail(res, 'Budget not found', 404);
  if (!budget.userId.equals(req.user._id)) return fail(res, 'Forbidden', 403);
  await budget.deleteOne();
  return ok(res, null, 'Budget deleted');
});

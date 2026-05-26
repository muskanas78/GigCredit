/**
 * controllers/expenseController.js
 * --------------------------------------------------------------------
 * CRUD for personal expenses. Strict ownership: a user can only read,
 * update, or delete their own records.
 *
 * Brief: every expense route checks expense.userId === req.user._id.
 * --------------------------------------------------------------------
 */

const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const { ok, created, fail, asyncHandler } = require('../utils/response');

// POST /api/expenses
exports.create = asyncHandler(async (req, res) => {
  const { title, amount, category = 'general', paymentMethod = 'Wallet', date, notes = '' } = req.body;

  const expense = await Expense.create({
    userId: req.user._id,
    title,
    amount,
    category,
    paymentMethod,
    date: date || new Date(),
    notes,
  });

  // Recompute the current month's budget if one exists.
  await recomputeBudgetFor(req.user._id, new Date(expense.date));

  return created(res, { expense }, 'Expense created');
});

// GET /api/expenses  (filters: category, from, to, search)
exports.listOwn = asyncHandler(async (req, res) => {
  const { category, from, to, search } = req.query;
  const filter = { userId: req.user._id };
  if (category) filter.category = category;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }
  if (search) filter.title = new RegExp(search, 'i');

  const expenses = await Expense.find(filter).sort({ date: -1 });
  return ok(res, { expenses });
});

// PUT /api/expenses/:id
exports.update = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);
  if (!expense) return fail(res, 'Expense not found', 404);

  // OWNERSHIP CHECK — the cornerstone of the brief.
  if (!expense.userId.equals(req.user._id)) {
    return fail(res, 'Forbidden: you do not own this expense', 403);
  }

  const allowed = ['title', 'amount', 'category', 'paymentMethod', 'date', 'notes'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) expense[key] = req.body[key];
  }
  await expense.save();
  await recomputeBudgetFor(req.user._id, new Date(expense.date));
  return ok(res, { expense }, 'Expense updated');
});

// DELETE /api/expenses/:id
exports.remove = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);
  if (!expense) return fail(res, 'Expense not found', 404);
  if (!expense.userId.equals(req.user._id)) {
    return fail(res, 'Forbidden: you do not own this expense', 403);
  }
  const dateRef = new Date(expense.date);
  await expense.deleteOne();
  await recomputeBudgetFor(req.user._id, dateRef);
  return ok(res, null, 'Expense deleted');
});

// GET /api/expenses/summary/monthly
exports.monthlySummary = asyncHandler(async (req, res) => {
  const summary = await Expense.aggregate([
    { $match: { userId: req.user._id } },
    {
      $group: {
        _id: { y: { $year: '$date' }, m: { $month: '$date' } },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.y': -1, '_id.m': -1 } },
  ]);
  return ok(res, { summary });
});

// GET /api/expenses/summary/categories
exports.categorySummary = asyncHandler(async (req, res) => {
  const summary = await Expense.aggregate([
    { $match: { userId: req.user._id } },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { total: -1 } },
  ]);
  return ok(res, { summary });
});

// ----- helper ------------------------------------------------------
async function recomputeBudgetFor(userId, date) {
  const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const budget = await Budget.findOne({ userId, month });
  if (!budget) return;

  const start = new Date(`${month}-01T00:00:00.000Z`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const spentAgg = await Expense.aggregate([
    { $match: { userId, date: { $gte: start, $lt: end } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const spent = spentAgg.length ? spentAgg[0].total : 0;

  budget.spentAmount = spent;
  if (spent >= budget.totalLimit) budget.status = 'exceeded';
  else if (spent >= budget.totalLimit * budget.warningThreshold) budget.status = 'nearLimit';
  else budget.status = 'safe';
  await budget.save();
}

exports.recomputeBudgetFor = recomputeBudgetFor;

/**
 * controllers/adminController.js
 * --------------------------------------------------------------------
 * Admin-only operations. Every route that uses these handlers must be
 * gated by [auth, requireRole('admin')] in the router file.
 * --------------------------------------------------------------------
 */

const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const { buildCreditAnalysis } = require('../utils/loanCalculator');
const { ok, created, fail, asyncHandler } = require('../utils/response');

// ---------- Dashboard / analytics ---------------------------------

// GET /api/admin/dashboard
exports.dashboard = asyncHandler(async (req, res) => {
  const [totalUsers, activeUsers, blockedUsers, totalTxns, flaggedTxns, volumeAgg, balanceAgg] =
    await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ status: 'blocked' }),
      Transaction.countDocuments({}),
      Transaction.countDocuments({ suspiciousFlag: true }),
      Transaction.aggregate([
        { $match: { status: 'successful' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Wallet.aggregate([{ $group: { _id: null, total: { $sum: '$balance' } } }]),
    ]);

  return ok(res, {
    totalUsers,
    activeUsers,
    blockedUsers,
    totalTransactions: totalTxns,
    flaggedTransactions: flaggedTxns,
    transactionVolume: volumeAgg.length ? volumeAgg[0].total : 0,
    systemBalance: balanceAgg.length ? balanceAgg[0].total : 0,
  });
});

// GET /api/admin/reports/transaction-volume
exports.transactionVolume = asyncHandler(async (req, res) => {
  const data = await Transaction.aggregate([
    { $match: { status: { $in: ['successful', 'flagged'] } } },
    {
      $group: {
        _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' }, type: '$type' },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.y': 1, '_id.m': 1 } },
  ]);
  return ok(res, { data });
});

// GET /api/admin/reports/system-balance
exports.systemBalance = asyncHandler(async (req, res) => {
  const wallets = await Wallet.aggregate([
    { $group: { _id: '$status', total: { $sum: '$balance' }, count: { $sum: 1 } } },
  ]);
  return ok(res, { wallets });
});

// ---------- Users -------------------------------------------------

// GET /api/admin/users  (search + filter)
exports.listUsers = asyncHandler(async (req, res) => {
  const { search, status, role } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { name: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
    ];
  }
  const users = await User.find(filter).sort({ createdAt: -1 });
  return ok(res, { users: users.map((u) => u.toSafeJSON()) });
});

// GET /api/admin/users/:id
exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return fail(res, 'User not found', 404);
  const wallet = await Wallet.findOne({ userId: user._id });
  const creditAnalysis = await buildCreditAnalysis(user);
  return ok(res, { user: user.toSafeJSON(), wallet, creditAnalysis });
});

// PATCH /api/admin/users/:id/block
exports.blockUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return fail(res, 'User not found', 404);
  if (user.role === 'admin') return fail(res, 'Cannot block another admin', 403);

  user.status = 'blocked';
  await user.save();

  await AuditLog.create({
    actorId: req.user._id,
    action: 'BLOCK_USER',
    targetType: 'user',
    targetId: user._id.toString(),
    ipAddress: req.ip,
  });

  await Notification.create({
    userId: user._id,
    title: 'Account blocked',
    message: 'Your account has been blocked by an administrator.',
    type: 'account',
  });

  return ok(res, { user: user.toSafeJSON() }, 'User blocked');
});

// PATCH /api/admin/users/:id/unblock
exports.unblockUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return fail(res, 'User not found', 404);

  user.status = 'active';
  await user.save();

  await AuditLog.create({
    actorId: req.user._id,
    action: 'UNBLOCK_USER',
    targetType: 'user',
    targetId: user._id.toString(),
    ipAddress: req.ip,
  });

  await Notification.create({
    userId: user._id,
    title: 'Account reactivated',
    message: 'Your account has been reactivated.',
    type: 'account',
  });

  return ok(res, { user: user.toSafeJSON() }, 'User unblocked');
});

// ---------- Wallets / Transactions --------------------------------

// GET /api/admin/wallets
exports.listWallets = asyncHandler(async (req, res) => {
  const wallets = await Wallet.find({}).populate('userId', 'name email role status');
  return ok(res, { wallets });
});

// GET /api/admin/transactions  (with filters)
exports.listTransactions = asyncHandler(async (req, res) => {
  const { type, status, suspicious, search } = req.query;
  const filter = {};
  if (type) filter.type = type;
  if (status) filter.status = status;
  if (suspicious === 'true') filter.suspiciousFlag = true;
  if (search) filter.transactionId = new RegExp(search, 'i');

  const transactions = await Transaction.find(filter)
    .sort({ createdAt: -1 })
    .limit(500)
    .populate('senderId', 'name email')
    .populate('receiverId', 'name email');
  return ok(res, { transactions });
});

// GET /api/admin/transactions/flagged
exports.listFlaggedTransactions = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({ suspiciousFlag: true })
    .sort({ createdAt: -1 })
    .populate('senderId', 'name email')
    .populate('receiverId', 'name email');
  return ok(res, { transactions });
});

// ---------- Categories --------------------------------------------

// POST /api/admin/categories
exports.createCategory = asyncHandler(async (req, res) => {
  const { name, type, description = '' } = req.body;
  const cat = await Category.create({ name, type, description, createdBy: req.user._id });
  await AuditLog.create({
    actorId: req.user._id,
    action: 'CREATE_CATEGORY',
    targetType: 'category',
    targetId: cat._id.toString(),
    details: { name, type },
  });
  return created(res, { category: cat }, 'Category created');
});

// PUT /api/admin/categories/:id
exports.updateCategory = asyncHandler(async (req, res) => {
  const cat = await Category.findById(req.params.id);
  if (!cat) return fail(res, 'Category not found', 404);
  const allowed = ['name', 'description', 'isActive', 'type'];
  for (const k of allowed) if (req.body[k] !== undefined) cat[k] = req.body[k];
  await cat.save();
  return ok(res, { category: cat }, 'Category updated');
});

// PATCH /api/admin/categories/:id/disable
exports.disableCategory = asyncHandler(async (req, res) => {
  const cat = await Category.findById(req.params.id);
  if (!cat) return fail(res, 'Category not found', 404);
  cat.isActive = false;
  await cat.save();
  return ok(res, { category: cat }, 'Category disabled');
});

// GET /api/admin/audit-logs
exports.listAuditLogs = asyncHandler(async (req, res) => {
  const logs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(200).populate('actorId', 'name email');
  return ok(res, { logs });
});

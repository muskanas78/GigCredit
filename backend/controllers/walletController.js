/**
 * controllers/walletController.js
 * --------------------------------------------------------------------
 * The most safety-critical controller. ALL balance changes happen here,
 * and they are calculated from the database value, never from a number
 * the frontend sent (brief Section 11, rules 11 & 24).
 *
 * Operations:
 *   GET  /api/wallet            — view own wallet
 *   GET  /api/wallet/summary    — wallet aggregates
 *   POST /api/wallet/deposit    — add demo funds
 *   POST /api/wallet/withdraw   — remove funds (with balance check)
 *   POST /api/wallet/transfer   — peer-to-peer transfer
 *
 * Suspicious-rule engine runs BEFORE the final response so flagged
 * transactions are recorded with their reasons.
 *
 * NOTE on transfers: a true production system would use a MongoDB
 * session/transaction with replica-set support. MongoDB Atlas does
 * provide that, but for a demo project running on a free tier, we
 * keep ordering carefully and write both wallets, then the txn record.
 * If the second wallet write fails, we attempt a compensating revert.
 * --------------------------------------------------------------------
 */

const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const generateTxnId = require('../utils/generateTxnId');
const { evaluateRules } = require('../utils/suspiciousRules');
const { ok, created, fail, asyncHandler } = require('../utils/response');

// ----- helpers ------------------------------------------------------

const findOwnWallet = async (userId) => Wallet.findOne({ userId });

const recordFailedTxn = async ({ user, amount, type, reason }) => {
  return Transaction.create({
    transactionId: generateTxnId(),
    senderId: user._id,
    amount,
    type,
    status: 'failed',
    failureReason: reason,
  });
};

// ----- handlers -----------------------------------------------------

// GET /api/wallet
exports.getOwnWallet = asyncHandler(async (req, res) => {
  const wallet = await findOwnWallet(req.user._id);
  if (!wallet) return fail(res, 'Wallet not found', 404);
  return ok(res, { wallet });
});

// GET /api/wallet/summary
exports.getSummary = asyncHandler(async (req, res) => {
  const wallet = await findOwnWallet(req.user._id);
  if (!wallet) return fail(res, 'Wallet not found', 404);

  const lastTxns = await Transaction.find({
    $or: [{ senderId: req.user._id }, { receiverId: req.user._id }],
  })
    .sort({ createdAt: -1 })
    .limit(5);

  return ok(res, {
    balance: wallet.balance,
    currency: wallet.currency,
    status: wallet.status,
    totals: {
      deposits: wallet.totalDeposits,
      withdrawals: wallet.totalWithdrawals,
      transfersIn: wallet.totalTransfersIn,
      transfersOut: wallet.totalTransfersOut,
    },
    recentTransactions: lastTxns,
  });
});

// POST /api/wallet/deposit
exports.deposit = asyncHandler(async (req, res) => {
  const { amount, description = 'Deposit' } = req.body;

  // amount is already validated by validateBody (>0, number) — but defensive check anyway.
  if (typeof amount !== 'number' || amount <= 0) {
    return fail(res, 'Amount must be a positive number', 400);
  }

  const wallet = await findOwnWallet(req.user._id);
  if (!wallet) return fail(res, 'Wallet not found', 404);
  if (wallet.status !== 'active') return fail(res, 'Wallet is not active', 403);

  const balanceAfter = wallet.balance + amount;

  // Run suspicious rules BEFORE marking successful.
  const evaluation = await evaluateRules({
    user: req.user,
    wallet,
    amount,
    type: 'deposit',
    balanceAfter,
  });

  // Apply.
  wallet.balance = balanceAfter;
  wallet.totalDeposits += amount;
  await wallet.save();

  const txn = await Transaction.create({
    transactionId: generateTxnId(),
    receiverId: req.user._id,
    amount,
    type: 'deposit',
    status: evaluation.suspicious ? 'flagged' : 'successful',
    description,
    suspiciousFlag: evaluation.suspicious,
    suspiciousReasons: evaluation.reasons,
  });

  // Notify user.
  await Notification.create({
    userId: req.user._id,
    title: 'Deposit successful',
    message: `${amount} ${wallet.currency} credited to your wallet.`,
    type: 'transaction',
    relatedTransactionId: txn.transactionId,
  });
  if (evaluation.suspicious) {
    await Notification.create({
      userId: req.user._id,
      title: 'Transaction flagged for review',
      message: `Your deposit of ${amount} was flagged: ${evaluation.reasons.join('; ')}`,
      type: 'security',
      relatedTransactionId: txn.transactionId,
    });
  }

  return created(res, { transaction: txn, balance: wallet.balance }, 'Deposit successful');
});

// POST /api/wallet/withdraw
exports.withdraw = asyncHandler(async (req, res) => {
  const { amount, description = 'Withdrawal' } = req.body;

  if (typeof amount !== 'number' || amount <= 0) {
    return fail(res, 'Amount must be a positive number', 400);
  }

  const wallet = await findOwnWallet(req.user._id);
  if (!wallet) return fail(res, 'Wallet not found', 404);
  if (wallet.status !== 'active') return fail(res, 'Wallet is not active', 403);

  // Backend balance check — NEVER trust the frontend on this.
  if (wallet.balance < amount) {
    // Record the failed attempt so admin / suspicious rules can see it.
    await recordFailedTxn({
      user: req.user,
      amount,
      type: 'withdrawal',
      reason: 'Insufficient balance',
    });
    return fail(res, 'Insufficient balance', 400);
  }

  const balanceAfter = wallet.balance - amount;

  const evaluation = await evaluateRules({
    user: req.user,
    wallet,
    amount,
    type: 'withdrawal',
    balanceAfter,
  });

  wallet.balance = balanceAfter;
  wallet.totalWithdrawals += amount;
  await wallet.save();

  const txn = await Transaction.create({
    transactionId: generateTxnId(),
    senderId: req.user._id,
    amount,
    type: 'withdrawal',
    status: evaluation.suspicious ? 'flagged' : 'successful',
    description,
    suspiciousFlag: evaluation.suspicious,
    suspiciousReasons: evaluation.reasons,
  });

  // Low-balance notice.
  if (wallet.balance < 1000) {
    await Notification.create({
      userId: req.user._id,
      title: 'Low balance',
      message: `Your wallet balance is low (${wallet.balance}).`,
      type: 'transaction',
    });
  }

  await Notification.create({
    userId: req.user._id,
    title: 'Withdrawal successful',
    message: `${amount} ${wallet.currency} withdrawn from your wallet.`,
    type: 'transaction',
    relatedTransactionId: txn.transactionId,
  });

  return created(res, { transaction: txn, balance: wallet.balance }, 'Withdrawal successful');
});

// POST /api/wallet/transfer
exports.transfer = asyncHandler(async (req, res) => {
  const { receiverEmail, amount, description = 'Transfer' } = req.body;

  if (typeof amount !== 'number' || amount <= 0) {
    return fail(res, 'Amount must be a positive number', 400);
  }

  // Find receiver user.
  const receiver = await User.findOne({ email: receiverEmail.toLowerCase() });
  if (!receiver) return fail(res, 'Receiver not found', 404);

  // Block self-transfer.
  if (receiver._id.equals(req.user._id)) {
    return fail(res, 'You cannot transfer to yourself', 400);
  }

  // Receiver must be active.
  if (receiver.status === 'blocked') {
    return fail(res, 'Receiver account is blocked', 403);
  }

  // Get both wallets.
  const senderWallet = await findOwnWallet(req.user._id);
  const receiverWallet = await Wallet.findOne({ userId: receiver._id });
  if (!senderWallet) return fail(res, 'Sender wallet not found', 404);
  if (!receiverWallet) return fail(res, 'Receiver wallet not found', 404);
  if (senderWallet.status !== 'active') return fail(res, 'Sender wallet is not active', 403);
  if (receiverWallet.status !== 'active') return fail(res, 'Receiver wallet is not active', 403);

  if (senderWallet.balance < amount) {
    await recordFailedTxn({
      user: req.user,
      amount,
      type: 'transfer',
      reason: 'Insufficient balance for transfer',
    });
    return fail(res, 'Insufficient balance', 400);
  }

  const balanceAfter = senderWallet.balance - amount;

  const evaluation = await evaluateRules({
    user: req.user,
    wallet: senderWallet,
    amount,
    type: 'transfer',
    balanceAfter,
  });

  // Update sender first, then receiver.  If anything goes wrong, revert sender.
  senderWallet.balance = balanceAfter;
  senderWallet.totalTransfersOut += amount;
  await senderWallet.save();

  try {
    receiverWallet.balance += amount;
    receiverWallet.totalTransfersIn += amount;
    await receiverWallet.save();
  } catch (err) {
    // Rollback sender to avoid losing money to the void.
    senderWallet.balance += amount;
    senderWallet.totalTransfersOut -= amount;
    await senderWallet.save();
    return fail(res, 'Transfer could not complete; please try again', 500);
  }

  const txn = await Transaction.create({
    transactionId: generateTxnId(),
    senderId: req.user._id,
    receiverId: receiver._id,
    amount,
    type: 'transfer',
    status: evaluation.suspicious ? 'flagged' : 'successful',
    description,
    suspiciousFlag: evaluation.suspicious,
    suspiciousReasons: evaluation.reasons,
  });

  // Notifications for both parties.
  await Notification.create({
    userId: req.user._id,
    title: 'Transfer sent',
    message: `${amount} ${senderWallet.currency} sent to ${receiver.email}.`,
    type: 'transaction',
    relatedTransactionId: txn.transactionId,
  });
  await Notification.create({
    userId: receiver._id,
    title: 'Money received',
    message: `${amount} ${receiverWallet.currency} received from ${req.user.email}.`,
    type: 'transaction',
    relatedTransactionId: txn.transactionId,
  });

  return created(
    res,
    { transaction: txn, balance: senderWallet.balance },
    'Transfer successful'
  );
});

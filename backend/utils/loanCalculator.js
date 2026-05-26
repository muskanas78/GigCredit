/**
 * utils/loanCalculator.js — GigCredit Advance Calculator
 *
 * Calculates:
 *   - Eligible advance amount (up to 75% of pending earnings)
 *   - Fee/markup on the advance
 *   - Credit analysis score for a freelancer
 */

const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const Expense = require('../models/Expense');

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const round2 = (v) => Math.round(Number(v || 0) * 100) / 100;

const creditBandForScore = (score) => {
  if (score >= 750) return 'excellent';
  if (score >= 650) return 'good';
  return 'fair';
};

/**
 * Build an advance eligibility breakdown for a freelancer.
 * pendingEarnings: amount the freelancer has in pending/cleared state
 * feeRate: percentage fee charged on the advance (default 4%)
 */
const buildAdvancePlan = ({ pendingEarnings, feeRate = 4 }) => {
  const pending = Number(pendingEarnings);
  const rate    = Number(feeRate);
  const minThreshold = 5000; // PKR minimum advance

  if (!Number.isFinite(pending) || pending <= 0) {
    const err = new Error('pendingEarnings must be a positive number');
    err.status = 400;
    throw err;
  }

  const eligiblePct = 0.75; // 75% of pending earnings
  const maxAdvance  = round2(pending * eligiblePct);
  const fee         = round2((maxAdvance * rate) / 100);
  const netDisbursed = round2(maxAdvance - fee);

  return {
    pendingEarnings: round2(pending),
    eligiblePercent: eligiblePct * 100,
    maxAdvance,
    feeRate: rate,
    fee,
    netDisbursed,
    minimumThreshold: minThreshold,
    eligible: maxAdvance >= minThreshold,
  };
};

/**
 * Build a full credit analysis for a user.
 * Used by admin user-detail page.
 */
const buildCreditAnalysis = async (user) => {
  const since = new Date();
  since.setMonth(since.getMonth() - 5);
  since.setDate(1);

  const [wallet, incomeAgg, expenseAgg, flaggedCount, incomeCount] = await Promise.all([
    Wallet.findOne({ userId: user._id }),
    Transaction.aggregate([
      {
        $match: {
          receiverId: user._id,
          type: { $in: ['deposit', 'transfer'] },
          status: { $in: ['successful', 'flagged'] },
          createdAt: { $gte: since },
        },
      },
      { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, total: { $sum: '$amount' } } },
    ]),
    Expense.aggregate([
      { $match: { userId: user._id, date: { $gte: since } } },
      { $group: { _id: { y: { $year: '$date' }, m: { $month: '$date' } }, total: { $sum: '$amount' } } },
    ]),
    Transaction.countDocuments({
      $or: [{ senderId: user._id }, { receiverId: user._id }],
      suspiciousFlag: true,
    }),
    Transaction.countDocuments({
      receiverId: user._id,
      type: { $in: ['deposit', 'transfer'] },
      status: { $in: ['successful', 'flagged'] },
      createdAt: { $gte: since },
    }),
  ]);

  const totalIncome  = incomeAgg.reduce((s, r) => s + Number(r.total || 0), 0);
  const monthlyIncome = Number(user.monthlyIncome) > 0
    ? Number(user.monthlyIncome)
    : totalIncome > 0 ? totalIncome / 6 : 0;
  const monthlyExpense = expenseAgg.reduce((s, r) => s + Number(r.total || 0), 0) / 6;
  const expenseRatio   = monthlyIncome > 0 ? monthlyExpense / monthlyIncome : 1;
  const balanceToIncome = monthlyIncome > 0 && wallet ? Number(wallet.balance || 0) / monthlyIncome : 0;
  const accountAgeMonths = Math.max(0, Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)));

  let score = 300;
  const reasons = [];

  // Income scoring
  const incomeScore = monthlyIncome >= 200000 ? 220 : monthlyIncome >= 120000 ? 180 : monthlyIncome >= 60000 ? 130 : monthlyIncome >= 30000 ? 80 : monthlyIncome > 0 ? 35 : 0;
  score += incomeScore;
  reasons.push(monthlyIncome > 0
    ? `Monthly income: PKR ${Math.round(monthlyIncome).toLocaleString()}`
    : 'Monthly income not set; using transaction history.');

  // Employment type scoring
  const empMap = { salaried: 70, contract: 50, self_employed: 55, student: 20, other: 30, unspecified: 15 };
  score += empMap[user.employmentType || 'unspecified'] || 15;

  // Platform scoring (freelancers on established platforms get bonus)
  const platMap = { upwork: 30, fiverr: 25, toptal: 35, freelancer: 20, multiple: 40, other: 10 };
  score += platMap[user.freelancePlatform || 'other'] || 10;

  // Account age
  const ageScore = accountAgeMonths >= 24 ? 80 : accountAgeMonths >= 12 ? 65 : accountAgeMonths >= 6 ? 45 : accountAgeMonths >= 3 ? 25 : 10;
  score += ageScore;

  // Income regularity
  score += incomeCount >= 5 ? 80 : incomeCount >= 3 ? 55 : incomeCount >= 1 ? 30 : 0;

  // Balance-to-income ratio
  score += balanceToIncome >= 1 ? 60 : balanceToIncome >= 0.5 ? 45 : balanceToIncome >= 0.25 ? 25 : balanceToIncome > 0 ? 10 : 0;

  // Expense ratio
  score += expenseRatio <= 0.35 ? 80 : expenseRatio <= 0.5 ? 55 : expenseRatio <= 0.7 ? 25 : 0;

  // Suspicious transaction penalty
  if (flaggedCount > 0) {
    score -= Math.min(100, flaggedCount * 35);
    reasons.push(`${flaggedCount} suspicious transaction(s) found.`);
  } else {
    reasons.push('No suspicious transactions found.');
  }

  if (user.status === 'blocked') {
    score -= 160;
    reasons.push('Account is blocked — advance not eligible.');
  }

  score = clamp(Math.round(score), 300, 850);
  const band     = creditBandForScore(score);
  const eligible = user.status === 'active' && score >= 650 && expenseRatio <= 0.7 && flaggedCount < 3;

  return {
    score, band, eligible,
    decision: eligible ? 'Eligible for advance review' : 'Not yet eligible',
    reasons,
    metrics: {
      monthlyIncome: round2(monthlyIncome),
      monthlyExpense: round2(monthlyExpense),
      expenseRatio: round2(expenseRatio),
      balanceToIncome: round2(balanceToIncome),
      accountAgeMonths, flaggedCount, incomeMonths: incomeCount,
      walletBalance: round2(wallet ? wallet.balance : 0),
      currency: wallet ? wallet.currency : 'PKR',
      employmentType: user.employmentType,
      freelancePlatform: user.freelancePlatform,
      employerName: user.employerName || '',
    },
  };
};

module.exports = { buildAdvancePlan, buildCreditAnalysis, creditBandForScore };

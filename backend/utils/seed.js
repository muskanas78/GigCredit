/**
 * utils/seed.js — GigCredit Demo Data Seeder
 * Run: npm run seed
 *
 * Creates:
 *   - 1 admin  (admin@gigcredit.test / Admin@123)
 *   - 3 demo freelancers (muskan@..., eman@..., anaya@... / Demo@123)
 *   - default categories
 *   - starter transactions per user
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const Notification = require('../models/Notification');
const generateTxnId = require('./generateTxnId');

const run = async () => {
  await connectDB();
  console.log('🌱 Seeding GigCredit demo data...');

  const testEmails = [
    'admin@gigcredit.test',
    'muskan@gigcredit.test',
    'eman@gigcredit.test',
    'anaya@gigcredit.test',
  ];

  const oldUsers = await User.find({ email: { $in: testEmails } });
  const oldIds = oldUsers.map((u) => u._id);
  await Wallet.deleteMany({ userId: { $in: oldIds } });
  await Transaction.deleteMany({
    $or: [{ senderId: { $in: oldIds } }, { receiverId: { $in: oldIds } }],
  });
  await Notification.deleteMany({ userId: { $in: oldIds } });
  await User.deleteMany({ email: { $in: testEmails } });
  await Category.deleteMany({});

  // Create admin
  const adminHash = await User.hashPassword('Admin@123');
  const admin = await User.create({
    name: 'GigCredit Admin',
    email: 'admin@gigcredit.test',
    passwordHash: adminHash,
    role: 'admin',
    status: 'active',
  });
  await Wallet.create({ userId: admin._id, balance: 0 });
  console.log('   👤 admin@gigcredit.test / Admin@123');

  // Demo freelancers
  const userHash = await User.hashPassword('Demo@123');
  const seedUsers = [
    {
      name: 'Muskan Ahmed', email: 'muskan@gigcredit.test',
      balance: 85000, monthlyIncome: 220000,
      employerName: 'Upwork (Freelance)', employmentType: 'self_employed',
    },
    {
      name: 'Eman Fatima', email: 'eman@gigcredit.test',
      balance: 42000, monthlyIncome: 150000,
      employerName: 'Fiverr (Freelance)', employmentType: 'contract',
    },
    {
      name: 'Anaya Noor', email: 'anaya@gigcredit.test',
      balance: 18000, monthlyIncome: 75000,
      employerName: 'Freelance / Other', employmentType: 'self_employed',
    },
  ];

  for (const u of seedUsers) {
    const user = await User.create({
      name: u.name, email: u.email,
      passwordHash: userHash, role: 'user', status: 'active',
      monthlyIncome: u.monthlyIncome,
      employerName: u.employerName,
      employmentType: u.employmentType,
    });
    await Wallet.create({ userId: user._id, balance: u.balance, totalDeposits: u.balance });
    await Transaction.create({
      transactionId: generateTxnId(),
      receiverId: user._id,
      amount: u.balance,
      type: 'deposit',
      status: 'successful',
      description: 'Initial demo deposit',
    });
    await Notification.create({
      userId: user._id,
      title: 'Welcome to GigCredit',
      message: 'Your account and wallet are ready. You can now deposit and request advances.',
      type: 'system',
    });
    console.log(`   👤 ${u.email} / Demo@123  (balance: ${u.balance})`);
  }

  // Categories
  const cats = [
    { name: 'Advance Request', type: 'transaction', description: 'Freelance advance disbursement' },
    { name: 'Repayment',       type: 'transaction', description: 'Advance repayment' },
    { name: 'Deposit',         type: 'transaction', description: 'Wallet deposit' },
    { name: 'Withdrawal',      type: 'transaction', description: 'Wallet withdrawal' },
    { name: 'Transfer',        type: 'transaction', description: 'Peer-to-peer transfer' },
    { name: 'Tools & Software',type: 'expense',     description: 'Freelance tools, subscriptions' },
    { name: 'Internet & Data', type: 'expense',     description: 'Connectivity costs' },
    { name: 'Rent',            type: 'expense',     description: 'Home/office rent' },
    { name: 'Food',            type: 'expense',     description: 'Meals and groceries' },
    { name: 'Transport',       type: 'expense',     description: 'Commuting and travel' },
    { name: 'Marketing',       type: 'expense',     description: 'Ads and promotion' },
    { name: 'Medical',         type: 'expense',     description: 'Health expenses' },
    { name: 'Utilities',       type: 'expense',     description: 'Electricity, gas, water' },
    { name: 'Other',           type: 'expense',     description: 'Miscellaneous' },
    { name: 'Monthly',         type: 'budget',      description: 'Monthly spending budget' },
  ];

  for (const c of cats) {
    await Category.create({ ...c, createdBy: admin._id, isActive: true });
  }
  console.log(`   📂 ${cats.length} categories seeded`);

  console.log('\n✅ Seeding complete!');
  console.log('   Admin:    admin@gigcredit.test / Admin@123');
  console.log('   Users:    muskan@gigcredit.test | eman@gigcredit.test | anaya@gigcredit.test');
  console.log('   Password: Demo@123\n');
  mongoose.disconnect();
};

run().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});

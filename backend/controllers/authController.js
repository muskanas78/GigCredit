/**
 * controllers/authController.js
 * --------------------------------------------------------------------
 * Handles register, login, logout, "me", and change-password.
 *
 * Key safety properties:
 *   - Passwords never stored in plain text (bcrypt hash via User model).
 *   - JWT is signed with HS256 using process.env.JWT_SECRET.
 *   - Wallet is auto-created right after user creation (brief 9.6).
 *   - Login error message is identical for "user not found" vs
 *     "wrong password" — prevents email enumeration.
 * --------------------------------------------------------------------
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Notification = require('../models/Notification');
const { ok, created, fail, asyncHandler } = require('../utils/response');

// Sign a JWT containing minimal user info.
const signToken = (user) =>
  jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Reject duplicate email proactively (cleaner than waiting for unique-index error).
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return fail(res, 'Email already registered', 409);

  const passwordHash = await User.hashPassword(password);

  // Public registration is ALWAYS role:user. Admin can only be created
  // via the seed script (so the API can't be abused to self-promote).
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: 'user',
    status: 'active',
  });

  // Auto-create wallet (brief Section 6, objective 2).
  await Wallet.create({ userId: user._id, balance: 0 });

  // Welcome notification — nice touch, low cost.
  await Notification.create({
    userId: user._id,
    title: 'Welcome to GigCredit',
    message: 'Your GigCredit account and wallet are ready. You can now deposit and request advances.',
    type: 'system',
  });

  const token = signToken(user);
  return created(res, { token, user: user.toSafeJSON() }, 'Registration successful');
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Need passwordHash for compare → use .select('+passwordHash')
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user) return fail(res, 'Invalid email or password', 401);

  if (user.status === 'blocked') {
    return fail(res, 'Your account is blocked. Contact support.', 403);
  }

  const valid = await user.comparePassword(password);
  if (!valid) return fail(res, 'Invalid email or password', 401);

  user.lastLogin = new Date();
  await user.save();

  const token = signToken(user);
  return ok(res, { token, user: user.toSafeJSON() }, 'Login successful');
});

// POST /api/auth/logout
// JWTs are stateless, so server-side "logout" just acknowledges the
// request. The frontend is responsible for clearing the token.
exports.logout = (req, res) => {
  return ok(res, null, 'Logged out');
};

// GET /api/auth/me
exports.me = asyncHandler(async (req, res) => {
  return ok(res, { user: req.user.toSafeJSON() });
});

// PUT /api/auth/change-password
exports.changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!user) return fail(res, 'User not found', 404);

  const valid = await user.comparePassword(oldPassword);
  if (!valid) return fail(res, 'Current password is incorrect', 400);

  user.passwordHash = await User.hashPassword(newPassword);
  user.passwordChangedAt = new Date();
  await user.save();

  return ok(res, null, 'Password changed successfully');
});

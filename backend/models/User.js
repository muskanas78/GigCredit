/**
 * models/User.js — GigCredit User Schema
 * Stores account identity, credentials, role, and freelance profile data.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String, required: [true, 'Name is required'],
      trim: true, minlength: 2, maxlength: 80,
    },
    email: {
      type: String, required: [true, 'Email is required'],
      unique: true, lowercase: true, trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'],
    },
    passwordHash: {
      type: String, required: true, select: false,
    },
    role: {
      type: String, enum: ['user', 'admin'], default: 'user',
    },
    status: {
      type: String, enum: ['active', 'blocked'], default: 'active',
    },
    phone: { type: String, trim: true },
    // Freelance-specific fields
    freelancePlatform: {
      type: String,
      enum: ['upwork', 'fiverr', 'toptal', 'freelancer', 'other', 'multiple'],
      default: 'other',
    },
    employerName:    { type: String, trim: true, maxlength: 120 },
    employmentType:  {
      type: String,
      enum: ['salaried', 'contract', 'self_employed', 'student', 'other'],
      default: 'self_employed',
    },
    monthlyIncome:   { type: Number, min: 0 },
    lastLogin:       { type: Date },
    passwordChangedAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = async function (plain) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.toSafeJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

userSchema.statics.hashPassword = async function (plain) {
  const rounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
  return bcrypt.hash(plain, rounds);
};

module.exports = mongoose.model('User', userSchema);

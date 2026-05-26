/**
 * validations/schemas.js — GigCredit Request Validation Rules
 */

exports.registerRules = [
  { field: 'name',     type: 'string', required: true, minLength: 2, maxLength: 80 },
  { field: 'email',    type: 'email',  required: true },
  { field: 'password', type: 'string', required: true, minLength: 6, maxLength: 80 },
];

exports.loginRules = [
  { field: 'email',    type: 'email',  required: true },
  { field: 'password', type: 'string', required: true, minLength: 1 },
];

exports.changePasswordRules = [
  { field: 'oldPassword', type: 'string', required: true, minLength: 1 },
  { field: 'newPassword', type: 'string', required: true, minLength: 6, maxLength: 80 },
];

exports.profileUpdateRules = [
  { field: 'name',             type: 'string', minLength: 2, maxLength: 80 },
  { field: 'phone',            type: 'string', maxLength: 30 },
  { field: 'employerName',     type: 'string', maxLength: 120 },
  { field: 'employmentType',   type: 'string', enum: ['salaried', 'contract', 'self_employed', 'student', 'other'] },
  { field: 'freelancePlatform',type: 'string', enum: ['upwork', 'fiverr', 'toptal', 'freelancer', 'other', 'multiple'] },
  { field: 'monthlyIncome',    type: 'number', min: 0 },
];

exports.amountRules = [
  { field: 'amount', type: 'number', required: true, min: 0.01 },
];

exports.transferRules = [
  { field: 'receiverEmail', type: 'email',  required: true },
  { field: 'amount',        type: 'number', required: true, min: 0.01 },
  { field: 'description',   type: 'string', maxLength: 200 },
];

exports.expenseRules = [
  { field: 'title',         type: 'string', required: true, minLength: 1, maxLength: 120 },
  { field: 'amount',        type: 'number', required: true, min: 0.01 },
  { field: 'category',      type: 'string', maxLength: 50 },
  { field: 'paymentMethod', type: 'string', enum: ['Wallet', 'Cash', 'Card', 'Other'] },
  { field: 'notes',         type: 'string', maxLength: 500 },
];

exports.budgetRules = [
  { field: 'month',      type: 'string', required: true, minLength: 7, maxLength: 7 },
  { field: 'totalLimit', type: 'number', required: true, min: 1 },
];

exports.categoryRules = [
  { field: 'name',        type: 'string', required: true, minLength: 1, maxLength: 50 },
  { field: 'type',        type: 'string', required: true, enum: ['transaction', 'expense', 'budget'] },
  { field: 'description', type: 'string', maxLength: 200 },
];

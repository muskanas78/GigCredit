/**
 * controllers/categoryController.js
 * --------------------------------------------------------------------
 * Public-list categories for any logged-in user; admin manages writes.
 * --------------------------------------------------------------------
 */

const Category = require('../models/Category');
const { ok, asyncHandler } = require('../utils/response');

// GET /api/categories
exports.listActive = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ type: 1, name: 1 });
  return ok(res, { categories });
});

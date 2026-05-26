/**
 * models/AuditLog.js
 * --------------------------------------------------------------------
 * Records important admin / system actions for accountability.
 * (Marked optional in the brief — we include it because Section 24
 *  mentions it under marking and it costs nothing to add.)
 *
 * Brief reference: Section 12 (auditLogs collection — optional)
 * --------------------------------------------------------------------
 */

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true }, // e.g. "BLOCK_USER", "CREATE_CATEGORY"
    targetType: { type: String, required: true }, // e.g. "user", "category", "transaction"
    targetId: { type: String }, // ObjectId or natural id (string for flexibility)
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    ipAddress: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);

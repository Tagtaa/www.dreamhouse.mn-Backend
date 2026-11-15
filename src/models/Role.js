const mongoose = require('mongoose');

// Dashboard role (Roles & Permission page). Admin accounts reference it by `key`
// (admins.role). `permissions` are "<page>.<action>" strings from config/permissions.js.
const roleSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-z][a-z0-9_]{1,29}$/, 'Role key must be 2-30 lowercase letters, numbers or _']
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  description: {
    type: String,
    trim: true,
    maxlength: 200,
    default: ''
  },
  permissions: {
    type: [String],
    default: []
  },
  // Built-in roles (superadmin, admin, operator) can't be deleted; superadmin can't be edited
  isSystem: {
    type: Boolean,
    default: false
  },
  locked: {
    type: Boolean,
    default: false
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Dashboard (admin panel) accounts. Stored in the `admins` collection,
// fully separate from app users in `users`.
const ADMIN_ROLES = ['superadmin', 'admin', 'operator'];
// Dashboard language each admin picks for themselves (Settings → Basic Information)
const ADMIN_LANGUAGES = ['mn', 'en'];

const adminSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: (v) => /^\+976[0-9]{8}$/.test(v),
      message: 'Phone number must be in Mongolia format (+976XXXXXXXX)'
    }
  },
  username: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    sparse: true,
    default: undefined
  },
  password: {
    type: String,
    required: true,
    minlength: 4
  },
  // Key of a role in the `roles` collection (built-in: superadmin, admin, operator; or a custom one).
  // Checked against that collection when an admin is created or updated.
  role: {
    type: String,
    trim: true,
    match: /^[a-z][a-z0-9_]{1,29}$/,
    default: 'admin'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  language: {
    type: String,
    enum: ADMIN_LANGUAGES,
    default: 'mn'
  },
  profileImage: {
    type: String,
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  }
}, {
  timestamps: true,
  collection: 'admins',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

adminSchema.index({ role: 1 });
adminSchema.index({ isActive: 1 });

// Compatibility fields so existing controllers that read req.user keep working
adminSchema.virtual('isAdmin').get(function () {
  return true; // every dashboard account (what it may do is decided by its role permissions)
});
adminSchema.virtual('isBanned').get(() => false);
adminSchema.virtual('accountType').get(() => 'admin');

adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

adminSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Admins are never limited by premium membership checks
adminSchema.methods.isPremiumMember = () => true;

adminSchema.methods.toSafeJSON = function () {
  return {
    _id: this._id,
    id: this._id,
    phone: this.phone,
    username: this.username,
    email: this.email || null,
    role: this.role,
    isAdmin: this.isAdmin,
    isActive: this.isActive,
    language: this.language || 'mn',
    profileImage: this.profileImage,
    lastLogin: this.lastLogin,
    accountType: 'admin',
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

const Admin = mongoose.model('Admin', adminSchema);
Admin.ADMIN_ROLES = ADMIN_ROLES;

module.exports = Admin;

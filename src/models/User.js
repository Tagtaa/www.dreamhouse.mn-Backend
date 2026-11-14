const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^\+976[0-9]{8}$/.test(v);
      },
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
    sparse: true, // Allows null values to be unique
    validate: {
      validator: function(v) {
        return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  password: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        // Allow hashed passwords (starts with $2a$ or $2b$) or 4-digit passwords
        return /^(\$2[ab]\$|^\d{4}$)/.test(v);
      },
      message: 'Password must be exactly 4 digits or a valid hash'
    }
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator', 'superadmin', 'operator'],
    default: 'user'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  bannedAt: {
    type: Date,
    default: null
  },
  banReason: {
    type: String,
    default: null
  },
  membership: {
    type: {
      type: String,
      enum: ['free', 'premium'],
      default: 'free'
    },
    expiresAt: {
      type: Date,
      default: null
    },
    purchasedAt: {
      type: Date,
      default: null
    }
  },
  wallet: {
    type: Number,
    default: 0,
    min: 0
  },
  profileImage: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  purchasedIdeas: [{
    ideaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Idea'
    },
    purchasedAt: {
      type: Date,
      default: Date.now
    },
    price: {
      type: Number,
      required: true
    }
  }]
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ phone: 1 });
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ 'membership.type': 1 });
userSchema.index({ role: 1 });
userSchema.index({ isBanned: 1 });
userSchema.index({ isActive: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if user has premium membership
userSchema.methods.isPremiumMember = function() {
  // Premium only if time-based premium membership is active
  const hasActiveMembership = this.membership.type === 'premium' &&
    this.membership.expiresAt &&
    this.membership.expiresAt > new Date();
  return hasActiveMembership;
};

// Get masked phone number
userSchema.methods.getMaskedPhone = function() {
  const phone = this.phone;
  if (!phone || phone.length < 4) return phone || '';
  return `${phone.substring(0, 4)}****${phone.substring(phone.length - 2)}`;
};

// Check if user has purchased a specific idea
userSchema.methods.hasPurchasedIdea = function(ideaId) {
  return this.purchasedIdeas.some(purchase => 
    purchase.ideaId.toString() === ideaId.toString()
  );
};

// Virtual for display name
userSchema.virtual('displayName').get(function() {
  return this.username || this.getMaskedPhone();
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema); 
const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 100
  },
  plan: {
    type: String,
    required: true,
    unique: true,
    enum: ['1_month', '2_month', '2_months', '3_month', '3_months', '6_month', '6_months', '1_year'],
    trim: true
  },
  day: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Helper function to generate title based on days and language
subscriptionSchema.methods.generateTitle = function (language = 'en') {
  const days = this.day;

  if (language === 'mn') {
    // Mongolian titles
    if (days === 30) return '1 сар';
    if (days === 60) return '2 сар';
    if (days === 90) return '3 сар';
    if (days === 180) return '6 сар';
    if (days === 360) return '1 жил';

    // For other day counts
    if (days < 30) return `${days} хоног`;
    if (days < 365) {
      const months = Math.round(days / 30);
      return `${months} сар`;
    }
    const years = Math.round(days / 365);
    return `${years} жил`;
  } else {
    // English titles
    if (days === 30) return '1 month';
    if (days === 60) return '2 months';
    if (days === 90) return '3 months';
    if (days === 180) return '6 months';
    if (days === 360) return '1 year';

    // For other day counts
    if (days < 30) return `${days} days`;
    if (days < 365) {
      const months = Math.round(days / 30);
      return months === 1 ? '1 month' : `${months} months`;
    }
    const years = Math.round(days / 365);
    return years === 1 ? '1 year' : `${years} years`;
  }
};

// Helper function to generate localized name based on days and language
subscriptionSchema.methods.generateName = function (language = 'en') {
  const days = this.day;

  if (language === 'mn') {
    // Mongolian names
    if (days === 30) return '30 хоногийн эрх';
    if (days === 60) return '60 хоногийн эрх';
    if (days === 90) return '90 хоногийн эрх';
    if (days === 180) return '180 хоногийн эрх';
    if (days === 360) return '360 хоногийн эрх';
    return `${days} хоногийн эрх`;
  } else {
    // English names (use existing name from database)
    return this.name;
  }
};

// Index for better query performance
subscriptionSchema.index({ name: 1 });
subscriptionSchema.index({ day: 1 });
subscriptionSchema.index({ price: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);

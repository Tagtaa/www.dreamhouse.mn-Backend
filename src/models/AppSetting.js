const mongoose = require('mongoose');

// Key/value settings editable from the admin dashboard (Settings → Preferences)
const appSettingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  }
}, {
  timestamps: true,
  collection: 'appsettings'
});

module.exports = mongoose.model('AppSetting', appSettingSchema);

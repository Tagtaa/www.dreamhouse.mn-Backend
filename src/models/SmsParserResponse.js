const mongoose = require('mongoose');

const smsParserResponseSchema = new mongoose.Schema({
  // API endpoint information
  endpoint: {
    type: String,
    required: true,
    enum: ['verify-otp', 'bank-transaction', 'parse-sms', 'validate-phone']
  },
  
  // Request information
  requestData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  // Response information
  responseData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  // HTTP status code
  statusCode: {
    type: Number,
    required: true
  },
  
  // Response time (ms)
  responseTime: {
    type: Number,
    required: true
  },
  
  // SMS Parser App information
  parserAppVersion: {
    type: String,
    default: null
  },
  
  parserDeviceInfo: {
    type: String,
    default: null
  },
  
  // IP address
  clientIp: {
    type: String,
    default: null
  },
  
  // User agent
  userAgent: {
    type: String,
    default: null
  },
  
  // Error information (if any)
  error: {
    message: String,
    code: String,
    details: mongoose.Schema.Types.Mixed
  },
  
  // Operation result
  isSuccess: {
    type: Boolean,
    required: true
  },
  
  // Additional information
  metadata: {
    phoneNumber: String,
    smsContent: String,
    amount: Number,
    bankName: String,
    transactionType: String
  },
  
  // For TTL
  expiresAt: {
    type: Date,
    default: function() {
      // Automatically delete after 30 days
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  }
}, {
  timestamps: true
});

// Indexes
smsParserResponseSchema.index({ endpoint: 1 });
smsParserResponseSchema.index({ isSuccess: 1 });
smsParserResponseSchema.index({ statusCode: 1 });
smsParserResponseSchema.index({ createdAt: 1 });
smsParserResponseSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
smsParserResponseSchema.index({ 'metadata.phoneNumber': 1 });
smsParserResponseSchema.index({ 'metadata.bankName': 1 });

// Static method to get response statistics
smsParserResponseSchema.statics.getResponseStats = async function(filters = {}) {
  const matchStage = {};
  
  if (filters.endpoint) matchStage.endpoint = filters.endpoint;
  if (filters.isSuccess !== undefined) matchStage.isSuccess = filters.isSuccess;
  if (filters.statusCode) matchStage.statusCode = filters.statusCode;
  if (filters.startDate || filters.endDate) {
    matchStage.createdAt = {};
    if (filters.startDate) matchStage.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) matchStage.createdAt.$lte = new Date(filters.endDate);
  }

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          endpoint: '$endpoint',
          statusCode: '$statusCode',
          isSuccess: '$isSuccess'
        },
        count: { $sum: 1 },
        avgResponseTime: { $avg: '$responseTime' },
        minResponseTime: { $min: '$responseTime' },
        maxResponseTime: { $max: '$responseTime' }
      }
    },
    {
      $group: {
        _id: '$_id.endpoint',
        statusCodes: {
          $push: {
            statusCode: '$_id.statusCode',
            isSuccess: '$_id.isSuccess',
            count: '$count',
            avgResponseTime: '$avgResponseTime',
            minResponseTime: '$minResponseTime',
            maxResponseTime: '$maxResponseTime'
          }
        },
        totalRequests: { $sum: '$count' }
      }
    },
    { $sort: { totalRequests: -1 } }
  ]);

  return stats;
};

// Static method to get error summary
smsParserResponseSchema.statics.getErrorSummary = async function(days = 7) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return await this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        isSuccess: false
      }
    },
    {
      $group: {
        _id: {
          endpoint: '$endpoint',
          statusCode: '$statusCode'
        },
        count: { $sum: 1 },
        errors: {
          $push: {
            message: '$error.message',
            code: '$error.code',
            timestamp: '$createdAt'
          }
        }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Static method to cleanup old responses
smsParserResponseSchema.statics.cleanupOldResponses = async function(days = 30) {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const result = await this.deleteMany({
    createdAt: { $lt: cutoffDate }
  });
  
  return result;
};

module.exports = mongoose.model('SmsParserResponse', smsParserResponseSchema);

const mongoose = require('mongoose');

const ideaSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  category: {
    type: Number,
    required: true,
    ref: 'IdeaCategory'
  },
  heatingType: {
    type: Number,
    required: true,
    ref: 'HeatingType'
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  shortDetail: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  images: [{
    url: String,
    caption: String,
    isPrimary: Boolean
  }],
  size: {
    value: {
      type: Number,
      required: true,
      min: 0,
      description: 'Size value'
    },
    unit: {
      type: String,
      required: true,
      enum: ['m2', 'm3', 'sqft', 'sqm'],
      default: 'm2',
      description: 'Size unit'
    }
  },
  totalCost: {
    type: Number,
    required: true,
    min: 0,
    description: 'Total cost of the project'
  },
  soldCount: {
    type: Number,
    default: 0,
    min: 0,
    description: 'Number of times this idea was sold'
  },
  addItem: [{
    itemName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    itemQuantity: {
      type: Number,
      required: true,
      min: 0
    },
    itemPrice: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  isPremium: {
    type: Boolean,
    default: false
  },
  purchasePrice: {
    type: Number,
    default: 50000, // Default 50,000 MNT
    min: 0,
    description: 'Price to purchase this idea'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  popularity: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  likeCount: {
    type: Number,
    default: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
ideaSchema.index({ category: 1 });
ideaSchema.index({ heatingType: 1 });
ideaSchema.index({ title: 'text', description: 'text', shortDetail: 'text' });
ideaSchema.index({ isPremium: 1 });
ideaSchema.index({ isActive: 1 });
ideaSchema.index({ isPublished: 1 });
ideaSchema.index({ popularity: -1 });
ideaSchema.index({ size: 1 });
ideaSchema.index({ totalCost: 1 });
ideaSchema.index({ soldCount: -1 });

// Method to increment view count
ideaSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

// Method to increment purchase count
ideaSchema.methods.incrementPurchaseCount = function() {
  this.soldCount += 1;
  return this.save();
};

// Static method for searching ideas
ideaSchema.statics.search = async function(query, options = {}) {
  const {
    category,
    heatingType,
    isPremium,
    sizeRange,
    limit = 20,
    skip = 0
  } = options;

  // Build search filter
  const searchFilter = {
    isActive: true,
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } }
    ]
  };

  // Add additional filters
  if (category) searchFilter.category = category;
  if (heatingType) searchFilter.heatingType = heatingType;
  if (isPremium !== undefined) searchFilter.isPremium = isPremium;

  // Add size range filter
  if (sizeRange && sizeRange !== 'all') {
    switch (sizeRange) {
      case '0-30':
        searchFilter['size.value'] = { $gte: 0, $lte: 30 };
        break;
      case '31-60':
        searchFilter['size.value'] = { $gte: 31, $lte: 60 };
        break;
      case '61-90':
        searchFilter['size.value'] = { $gte: 61, $lte: 90 };
        break;
      case '91-120':
        searchFilter['size.value'] = { $gte: 91, $lte: 120 };
        break;
      case '121-150':
        searchFilter['size.value'] = { $gte: 121, $lte: 150 };
        break;
      case '151-180':
        searchFilter['size.value'] = { $gte: 151, $lte: 180 };
        break;
      case '181-210':
        searchFilter['size.value'] = { $gte: 181, $lte: 210 };
        break;
      case '211-240':
        searchFilter['size.value'] = { $gte: 211, $lte: 240 };
        break;
      case '241-270':
        searchFilter['size.value'] = { $gte: 241, $lte: 270 };
        break;
      case '271-300':
        searchFilter['size.value'] = { $gte: 271, $lte: 300 };
        break;
    }
  }

  return await this.find(searchFilter)
    .populate('category', 'name description')
    .populate('heatingType', 'name description')
    .limit(limit)
    .skip(skip)
    .sort('-popularity');
};

// Ensure virtual fields are serialized
ideaSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Idea', ideaSchema); 
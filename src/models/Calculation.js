const mongoose = require('mongoose');

const calculationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'wall',           // Хана
      'fundament',      // Суурь
      'roof',           // Дээвэр
      'inner_wall',     // Дотор хана
      'underfloor',     // Шалны доорх
      'floor_tiles',    // Шалны хучилт
      'wall_decoration' // Ханын чимэглэл
    ]
  },
  title: {
    type: String,
    trim: true,
    maxlength: 200
  },
  inputs: {
    // Selected models for calculation
    selectedTypeModel: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CalculationType',
        required: false
      },
      calculationType: {
        type: String,
        required: true,
        enum: ['wall', 'fundament', 'roof', 'inner_wall', 'underfloor', 'floor_tiles', 'wall_decoration']
      },
      key: String,
      name: String,
      imageUrl: String,
      description: String,
      isActive: Boolean,
      sortOrder: Number,
      createdAt: Date,
      updatedAt: Date
    },
    
    selectedShapeModel: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
      },
      calculationType: String,
      key: String,
      name: String,
      imageUrl: String,
      description: String,
      isActive: Boolean,
      sortOrder: Number,
      createdAt: Date,
      updatedAt: Date
    },
    
    selectedMaterialModel: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Material',
        required: false
      },
      name: String,
      type: String,
      category: {
        _id: mongoose.Schema.Types.ObjectId,
        name: String,
        parentCategory: {
          _id: mongoose.Schema.Types.ObjectId,
          name: String
        },
        images: [String]
      },
      price: Number,
      specs: String,
      rating: Number,
      width: Number,
      length: Number,
      height: Number,
      unit: String,
      description: String,
      images: [String],
      ingredients: [{
        name: String,
        requiredPercent: Number,
        unit: String,
        costPerM3: Number,
        costPerPacket: Number,
        packageWeight: Number
      }],
      thicknessOptions: [{
        thickness: {
          value: Number,
          unit: String
        },
        fileUrl: String,
        _id: mongoose.Schema.Types.ObjectId
      }],
      likeCount: Number,
      likedBy: [String],
      isLiked: Boolean,
      isPremium: Boolean,
      isActive: Boolean,
      tags: [String],
      popularity: Number,
      viewCount: Number,
      costPerUnit: {
        perM2: Number,
        perM3: Number,
        currency: String
      },
      supplier: {
        name: String,
        contact: String,
        location: String
      },
      formattedPrice: String,
      createdAt: Date,
      updatedAt: Date
    },
    
    selectedThicknessModel: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
      },
      calculationType: String,
      key: String,
      name: String,
      thickness: Number,
      unit: String,
      imageUrl: String,
      description: String,
      isActive: Boolean,
      sortOrder: Number,
      createdAt: Date,
      updatedAt: Date
    },
    
    // Calculation results
    totalPrice: {
      type: Number,
      required: true
    },
    totalVolume: {
      type: Number,
      required: false // Either totalArea or totalVolume must be provided (validated in controller)
    },
    totalArea: {
      type: Number,
      required: false // Either totalArea or totalVolume must be provided (validated in controller)
    },
    materialItemCount: {
      type: Number,
      required: true
    },
    
    // Door and window lists
    doorList: [{
      width: Number,
      length: Number
    }],
    windowList: [{
      width: Number,
      length: Number
    }],
    
    // Ingredient calculations
    ingCalcModelList: [{
      name: String,
      unit: String,
      amount: Number,
      price: Number
    }],
    
    // Calculation custom model
    calculationCustomModel: {
      blockLength: Number,
      blockWidth: Number,
      blockHeight: Number,
      blockThickness: Number,
      price: Number,
      imageUrl: String
    },
    
    // Custom block dimensions (nullable) - legacy support
    blockLength: {
      type: Number,
      default: null
    },
    blockWidth: {
      type: Number,
      default: null
    },
    blockHeight: {
      type: Number,
      default: null
    },
    blockThickness: {
      type: Number,
      default: null
    },
    
    // Legacy fields for backward compatibility
    length: Number,
    width: Number,
    height: Number,
    thickness: Number,
    shape: String,
    materialType: String,
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material'
    },
    
    // Openings (for walls) - legacy format
    windows: [{
      width: Number,
      height: Number,
      count: { type: Number, default: 1 }
    }],
    doors: [{
      width: Number,
      height: Number,
      count: { type: Number, default: 1 }
    }],
    
    // Additional parameters
    includeWaste: {
      type: Boolean,
      default: true
    },
    wastePercentage: {
      type: Number,
      default: 10,
      min: 0,
      max: 50
    },
    
    // Custom inputs (flexible for different calculation types)
    customInputs: mongoose.Schema.Types.Mixed,
    
    // Image URL for the calculation
    imageUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: 'Image URL must be a valid HTTP/HTTPS URL'
      }
    }
  },
  results: {
    // Calculated values
    area: Number,          // м2
    volume: Number,        // м3
    perimeter: Number,     // м
    
    // Material quantities
    materials: [{
      materialId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Material'
      },
      quantity: Number,
      unit: String,
      unitPrice: Number,
      totalPrice: Number
    }],
    
    // Summary
    totalArea: Number,
    totalVolume: Number,
    totalMaterialCost: Number,
    estimatedLaborCost: Number,
    totalCost: Number,
    
    // Additional calculations
    additionalCosts: [{
      name: String,
      amount: Number,
      description: String
    }],
    
    // Custom results (flexible for different calculation types)
    customResults: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['draft', 'calculated', 'saved'],
    default: 'calculated'
  },
  isBookmarked: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    maxlength: 1000
  },
  projectName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  tags: [{
    type: String,
    trim: true
  }],
  sharedWith: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['view', 'edit'],
      default: 'view'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastAccessed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
calculationSchema.index({ userId: 1, type: 1 });
calculationSchema.index({ userId: 1, createdAt: -1 });
calculationSchema.index({ userId: 1, isBookmarked: 1 });
calculationSchema.index({ type: 1 });
calculationSchema.index({ status: 1 });
calculationSchema.index({ tags: 1 });

// Virtual for formatted total cost
calculationSchema.virtual('formattedTotalCost').get(function() {
  return this.results.totalCost 
    ? `${this.results.totalCost.toLocaleString()} MNT`
    : 'N/A';
});

// Virtual for display title
calculationSchema.virtual('displayTitle').get(function() {
  if (this.title) return this.title;
  if (this.projectName) return this.projectName;
  
  const typeNames = {
    'wall': 'Wall Calculation',
    'fundament': 'Foundation Calculation',
    'roof': 'Roof Calculation',
    'inner_wall': 'Inner Wall Calculation',
    'underfloor': 'Underfloor Calculation',
    'floor_tiles': 'Floor Tiles Calculation',
    'wall_decoration': 'Wall Decoration Calculation'
  };
  
  return typeNames[this.type] || 'Calculation';
});

// Method to update last accessed
calculationSchema.methods.updateLastAccessed = function() {
  this.lastAccessed = new Date();
  return this.save();
};

// Method to bookmark/unbookmark
calculationSchema.methods.toggleBookmark = function() {
  this.isBookmarked = !this.isBookmarked;
  return this.save();
};

// Method to check if user can access this calculation
calculationSchema.methods.canUserAccess = function(userId) {
  // Owner can always access
  if (this.userId.toString() === userId.toString()) {
    return true;
  }
  
  // Check if shared with user
  return this.sharedWith.some(share => 
    share.userId.toString() === userId.toString()
  );
};

// Method to share calculation with another user
calculationSchema.methods.shareWith = function(userId, permission = 'view') {
  // Remove existing share if any
  this.sharedWith = this.sharedWith.filter(share => 
    share.userId.toString() !== userId.toString()
  );
  
  // Add new share
  this.sharedWith.push({
    userId,
    permission,
    sharedAt: new Date()
  });
  
  return this.save();
};

// Static method to get user's calculations with filtering
calculationSchema.statics.getUserCalculations = function(userId, options = {}) {
  const {
    type,
    isBookmarked,
    limit = 20,
    skip = 0,
    sort = '-createdAt'
  } = options;

  const searchCriteria = {
    $or: [
      { userId },
      { 'sharedWith.userId': userId }
    ],
    ...(type && { type }),
    ...(isBookmarked !== undefined && { isBookmarked })
  };

  return this.find(searchCriteria)
    .populate('inputs.materialId', 'name price')
    .populate('results.materials.materialId', 'name price')
    .populate('userId', 'username phone')
    .limit(limit)
    .skip(skip)
    .sort(sort);
};

// Static method to get calculation statistics
calculationSchema.statics.getStatistics = function(userId) {
  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalCost: { $sum: '$results.totalCost' },
        avgCost: { $avg: '$results.totalCost' },
        lastCalculation: { $max: '$createdAt' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Ensure virtual fields are serialized
calculationSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Calculation', calculationSchema); 
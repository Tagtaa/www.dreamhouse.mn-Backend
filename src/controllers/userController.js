const User = require('../models/User');
const Calculation = require('../models/Calculation');
const Idea = require('../models/Idea');
const { uploadAvatar, deleteAvatar, deleteUserAvatars } = require('../config/firebase');
const multer = require('multer');
const path = require('path');
const errorMessageService = require('../services/errorMessageService');

// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: errorMessageService.getMessage('USER_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { username } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: errorMessageService.getMessage('USER_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Update fields
    if (username) user.username = username;

    await user.save();

    // Return updated user without password
    const updatedUser = await User.findById(user._id).select('-password');

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('PROFILE_UPDATED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get user's calculation history
// @route   GET /api/user/calculations
// @access  Private
const getCalculations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const type = req.query.type;
    const isBookmarked = req.query.bookmarked === 'true';

    const calculations = await Calculation.getUserCalculations(req.user._id, {
      type,
      isBookmarked,
      limit,
      skip
    });

    const total = await Calculation.countDocuments({
      userId: req.user._id,
      ...(type && { type }),
      ...(isBookmarked !== undefined && { isBookmarked })
    });

    // Process calculations similar to history endpoint but more concise for user profile
    const processedCalculations = calculations.map(calc => {
      const calcObj = calc.toObject();

      // Extract data from new model structure if available
      let materialName = 'Unknown Material';
      let materialImageUrl = null;
      let typeName = calcObj.type;
      let calculationCustomModel = null;

      // Extract calculationCustomModel if exists
      if (calcObj.inputs && calcObj.inputs.calculationCustomModel) {
        calculationCustomModel = calcObj.inputs.calculationCustomModel;
      }

      // If new structure exists, use it
      if (calcObj.inputs && calcObj.inputs.selectedMaterialModel) {
        materialName = calcObj.inputs.selectedMaterialModel.name || materialName;
        materialImageUrl = (calcObj.inputs.selectedMaterialModel.images && calcObj.inputs.selectedMaterialModel.images[0]) ||
          calcObj.inputs.selectedMaterialModel.imageUrl ||
          calcObj.inputs.imageUrl;
      }

      // If selectedMaterialModel is null but calculationCustomModel exists, use its imageUrl
      if (!materialImageUrl && calculationCustomModel && calculationCustomModel.imageUrl) {
        materialImageUrl = calculationCustomModel.imageUrl;
      }

      // If selectedMaterialModel is null but calculationCustomModel exists, use custom material name
      if (materialName === 'Unknown Material' && calculationCustomModel) {
        materialName = 'Custom Material';
      }

      if (calcObj.inputs && calcObj.inputs.selectedTypeModel) {
        typeName = calcObj.inputs.selectedTypeModel.name || calcObj.inputs.selectedTypeModel.calculationType;
      }

      // Fallback to legacy mappings if new structure doesn't exist
      if (materialName === 'Unknown Material') {
        const legacyMaterialNames = {
          'wall': 'Brick',
          'fundament': 'Concrete Foundation',
          'roof': 'Roof Tiles',
          'inner_wall': 'Gypsum Board',
          'underfloor': 'Insulation',
          'floor_tiles': 'Parquet',
          'wall_decoration': 'Paint'
        };
        materialName = legacyMaterialNames[calcObj.type] || 'Unknown Material';
      }

      const typeNames = {
        'wall': 'Wall',
        'fundament': 'Foundation',
        'roof': 'Roof',
        'inner_wall': 'Inner Wall',
        'underfloor': 'Underfloor',
        'floor_tiles': 'Floor Tiles',
        'wall_decoration': 'Wall Decoration'
      };

      // Normalize doorList and windowList: convert height to length if needed (for internal processing)
      let normalizedDoorList = null;
      if (calcObj.inputs?.doorList && Array.isArray(calcObj.inputs.doorList) && calcObj.inputs.doorList.length > 0) {
        normalizedDoorList = calcObj.inputs.doorList.map(door => ({
          width: door.width,
          length: door.length !== undefined && door.length !== null ? door.length : (door.height !== undefined && door.height !== null ? door.height : door.length)
        }));
      }
      
      let normalizedWindowList = null;
      if (calcObj.inputs?.windowList && Array.isArray(calcObj.inputs.windowList) && calcObj.inputs.windowList.length > 0) {
        normalizedWindowList = calcObj.inputs.windowList.map(window => ({
          width: window.width,
          length: window.length !== undefined && window.length !== null ? window.length : (window.height !== undefined && window.height !== null ? window.height : window.length)
        }));
      }
      
      // Convert normalized lists back to height format for response (Dart model uses height)
      let responseDoorList = null;
      if (normalizedDoorList && normalizedDoorList.length > 0) {
        responseDoorList = normalizedDoorList.map(door => ({
          width: door.width,
          height: door.length
        }));
      }
      
      let responseWindowList = null;
      if (normalizedWindowList && normalizedWindowList.length > 0) {
        responseWindowList = normalizedWindowList.map(window => ({
          width: window.width,
          height: window.length
        }));
      }

      // Remove userId and add processed data
      const { userId, ...calcWithoutUserId } = calcObj;

      return {
        ...calcWithoutUserId,
        typeName: typeNames[calcObj.type] || typeName,
        materialName,
        materialImageUrl,
        // Extract summary info from new structure
        summary: {
          totalPrice: calcObj.inputs?.totalPrice || calcObj.results?.totalCost,
          totalVolume: calcObj.inputs?.totalVolume || calcObj.results?.totalVolume,
          totalArea: calcObj.inputs?.totalArea || calcObj.results?.totalArea,
          materialItemCount: calcObj.inputs?.materialItemCount,
          doorCount: responseDoorList?.length || normalizedDoorList?.length || calcObj.inputs?.doorList?.length || calcObj.inputs?.doors?.length || 0,
          windowCount: responseWindowList?.length || normalizedWindowList?.length || calcObj.inputs?.windowList?.length || calcObj.inputs?.windows?.length || 0
        },
        // Update inputs with response doorList and windowList (using height)
        inputs: {
          ...calcObj.inputs,
          doorList: responseDoorList || calcObj.inputs?.doorList,
          windowList: responseWindowList || calcObj.inputs?.windowList
        },
        // Add total price as number
        totalPrice: calcObj.inputs?.totalPrice || calcObj.results?.totalCost || 0,
        // Add status info
        isRecent: (new Date() - new Date(calcObj.createdAt)) < (7 * 24 * 60 * 60 * 1000), // Last 7 days
        hasNewStructure: !!(calcObj.inputs?.selectedMaterialModel || calcObj.inputs?.calculationCustomModel)
      };
    });

    // Add user summary statistics
    const userStats = {
      totalCalculations: total,
      recentCalculations: processedCalculations.filter(calc => calc.isRecent).length,
      bookmarkedCalculations: processedCalculations.filter(calc => calc.isBookmarked).length,
      newStructureCalculations: processedCalculations.filter(calc => calc.hasNewStructure).length,
      totalSpent: processedCalculations.reduce((sum, calc) => sum + (calc.summary.totalPrice || 0), 0)
    };

    res.status(200).json({
      success: true,
      data: {
        calculations: processedCalculations,
        userStats: {
          ...userStats,
          totalSpent: userStats.totalSpent,
          newStructurePercentage: total > 0 ? Math.round((userStats.newStructureCalculations / total) * 100) : 0
        },
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get calculations error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get user's purchased ideas
// @route   GET /api/user/purchased-ideas
// @access  Private
const getPurchasedIdeas = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'purchasedIdeas.ideaId',
      populate: [
        { path: 'category', select: 'name description' },
        { path: 'heatingType', select: 'name description' }
      ]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: errorMessageService.getMessage('USER_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Format purchased ideas to match /api/ideas response format
    const purchasedIdeas = user.purchasedIdeas.map(purchase => {
      const idea = purchase.ideaId;
      if (!idea) return null;

      return {
        ...idea.toJSON(),
        purchasedAt: purchase.purchasedAt,
        purchasedPrice: purchase.price,
        isPremiumLocked: false // User has purchased, so not locked
      };
    }).filter(Boolean); // Remove null entries

    res.status(200).json({
      success: true,
      data: {
        ideas: purchasedIdeas
      }
    });
  } catch (error) {
    console.error('Get purchased ideas error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get wallet information
// @route   GET /api/user/wallet
// @access  Private
const getWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('wallet');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: errorMessageService.getMessage('USER_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    res.status(200).json({
      success: true,
      data: {
        wallet: {
          balance: user.wallet,
          currency: 'MNT'
        }
      }
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get membership information
// @route   GET /api/user/membership
// @access  Private
const getMembership = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('membership');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('USER_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    const isPremium = user.isPremiumMember();
    const daysLeft = isPremium && user.membership.expiresAt
      ? Math.ceil((user.membership.expiresAt - new Date()) / (1000 * 60 * 60 * 24))
      : 0;

    res.status(200).json({
      success: true,
      data: {
        membership: {
          type: user.membership.type,
          isPremium,
          expiresAt: user.membership.expiresAt,
          purchasedAt: user.membership.purchasedAt,
          daysLeft: Math.max(0, daysLeft)
        }
      }
    });
  } catch (error) {
    console.error('Get membership error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Update user email and username
// @route   PUT /api/user/account-info
// @access  Private
const updateAccountInfo = async (req, res) => {
  try {
    const { email, username } = req.body;

    if (!email && !username) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('EMAIL_USERNAME_REQUIRED', errorMessageService.getLocaleFromRequest(req))
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: errorMessageService.getMessage('USER_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Update email if provided
    if (email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: errorMessageService.getMessage('INVALID_EMAIL', errorMessageService.getLocaleFromRequest(req))
        });
      }

      // Check if email already exists
      const existingUser = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: req.user._id }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: errorMessageService.getMessage('EMAIL_ALREADY_EXISTS', errorMessageService.getLocaleFromRequest(req))
        });
      }

      user.email = email.toLowerCase();
    }

    // Update username if provided
    if (username) {
      // Check if username already exists
      const existingUsername = await User.findOne({
        username: username,
        _id: { $ne: req.user._id }
      });

      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: errorMessageService.getMessage('USERNAME_ALREADY_EXISTS', errorMessageService.getLocaleFromRequest(req))
        });
      }

      user.username = username;
    }

    await user.save();

    const updatedUser = await User.findById(user._id).select('-password');

    const updatedFields = [];
    if (email) updatedFields.push('email');
    if (username) updatedFields.push('username');

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('ACCOUNT_INFO_UPDATED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    console.error('Update account info error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Delete user account
// @route   DELETE /api/user/account
// @access  Private
const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('USER_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Soft delete by deactivating account
    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('ACCOUNT_DEACTIVATED_SUCCESS', errorMessageService.getLocaleFromRequest(req))
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// Multer configuration for avatar upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG and WebP images are allowed'), false);
    }
  }
});

// @desc    Upload profile avatar
// @route   POST /api/user/upload-avatar
// @access  Private
const uploadUserAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('NO_IMAGE_FILE', errorMessageService.getLocaleFromRequest(req))
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('USER_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Delete old avatar if exists
    if (user.profileImage) {
      try {
        const oldFileName = path.basename(user.profileImage);
        await deleteAvatar(user._id.toString(), oldFileName);
      } catch (error) {
        console.error('Error deleting old avatar:', error);
        // Continue with upload even if delete fails
      }
    }

    // Generate unique filename
    const fileExtension = path.extname(req.file.originalname);
    const fileName = `avatar-${Date.now()}${fileExtension}`;

    // Upload to Firebase Storage
    const imageUrl = await uploadAvatar(req.file.buffer, fileName, user._id.toString());

    // Update user profile
    user.profileImage = imageUrl;
    await user.save();

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('AVATAR_UPLOADED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        imageUrl,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          profileImage: user.profileImage
        }
      }
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    
    if (error.message.includes('Only JPEG, PNG and WebP')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('Firebase Admin is not initialized')) {
      return res.status(503).json({
        success: false,
        message: errorMessageService.getMessage('UPLOAD_SERVICE_UNAVAILABLE', errorMessageService.getLocaleFromRequest(req))
      });
    }

    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Delete profile avatar
// @route   DELETE /api/user/avatar
// @access  Private
const deleteUserAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('USER_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    if (!user.profileImage) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('NO_AVATAR_TO_DELETE', errorMessageService.getLocaleFromRequest(req))
      });
    }

    try {
      // Extract filename from URL and delete from Firebase
      const fileName = path.basename(user.profileImage);
      await deleteAvatar(user._id.toString(), fileName);
    } catch (error) {
      console.error('Error deleting avatar from Firebase:', error);
      // Continue with database update even if Firebase delete fails
    }

    // Remove from user profile
    user.profileImage = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('AVATAR_DELETED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          profileImage: user.profileImage
        }
      }
    });
  } catch (error) {
    console.error('Delete avatar error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get avatar URL
// @route   GET /api/user/avatar
// @access  Private
const getUserAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('profileImage username');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('USER_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    res.status(200).json({
      success: true,
      data: {
        profileImage: user.profileImage,
        hasAvatar: !!user.profileImage
      }
    });
  } catch (error) {
    console.error('Get avatar error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Change own 4-digit PIN (password) while signed in
// @route   PUT /api/user/change-pin
// @access  Private
const changePin = async (req, res) => {
  try {
    const { currentPin, newPin } = req.body;
    if (!/^[0-9]{4}$/.test(String(newPin || ''))) {
      return res.status(400).json({ success: false, message: 'Шинэ ПИН 4 оронтой тоо байх ёстой' });
    }
    if (String(currentPin || '') === String(newPin)) {
      return res.status(400).json({ success: false, message: 'Шинэ ПИН одоогийнхоос өөр байх ёстой' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: errorMessageService.getMessage('USER_NOT_FOUND', errorMessageService.getLocaleFromRequest(req)) });
    }
    if (!(await user.comparePassword(String(currentPin || '')))) {
      return res.status(400).json({ success: false, message: 'Одоогийн ПИН буруу байна', code: 'WRONG_PIN' });
    }

    user.password = String(newPin); // hashed by the model's pre-save hook
    await user.save();
    res.status(200).json({ success: true, message: 'ПИН амжилттай солигдлоо' });
  } catch (error) {
    console.error('Change PIN error:', error);
    res.status(500).json({ success: false, message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req)) });
  }
};

module.exports = {
  changePin,
  getProfile,
  updateProfile,
  updateAccountInfo,
  getCalculations,
  getPurchasedIdeas,
  getWallet,
  getMembership,
  deleteAccount,
  upload, // Multer middleware export
  uploadUserAvatar,
  deleteUserAvatar,
  getUserAvatar
};
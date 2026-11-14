const Idea = require('../models/Idea');
const User = require('../models/User');
const IdeaCategory = require('../models/IdeaCategory');
const HeatingType = require('../models/HeatingType');
const errorMessageService = require('../services/errorMessageService');

// @desc    Get ideas list
// @route   GET /api/ideas
// @access  Public
const getIdeas = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const category = req.query.category;
    const heatingType = req.query.heatingType;
    const isPremium = req.query.isPremium === 'true' ? true : req.query.isPremium === 'false' ? false : undefined;
    const sizeRange = req.query.sizeRange;
    const query = req.query.q; // Search query parameter

    // Size range filter logic
    let sizeFilter = {};
    if (sizeRange && sizeRange !== 'all') {
      switch (sizeRange) {
        case '0-30':
          sizeFilter = { 'size.value': { $gte: 0, $lte: 30 } };
          break;
        case '31-60':
          sizeFilter = { 'size.value': { $gte: 31, $lte: 60 } };
          break;
        case '61-90':
          sizeFilter = { 'size.value': { $gte: 61, $lte: 90 } };
          break;
        case '91-120':
          sizeFilter = { 'size.value': { $gte: 91, $lte: 120 } };
          break;
        case '121-150':
          sizeFilter = { 'size.value': { $gte: 121, $lte: 150 } };
          break;
        case '151-180':
          sizeFilter = { 'size.value': { $gte: 151, $lte: 180 } };
          break;
        case '181-210':
          sizeFilter = { 'size.value': { $gte: 181, $lte: 210 } };
          break;
        case '211-240':
          sizeFilter = { 'size.value': { $gte: 211, $lte: 240 } };
          break;
        case '241-270':
          sizeFilter = { 'size.value': { $gte: 241, $lte: 270 } };
          break;
        case '271-300':
          sizeFilter = { 'size.value': { $gte: 271, $lte: 300 } };
          break;
      }
    }

    // Admin can see unpublished and deleted ideas with includeUnpublished=true
    const includeUnpublished = req.query.includeUnpublished === 'true';
    const isAdmin = req.user && req.user.isAdmin;

    const filter = {
      // Admin with includeUnpublished can see deleted ideas (isActive: false)
      ...((!isAdmin || !includeUnpublished) && { isActive: true }),
      // Only filter by isPublished if not admin or admin didn't request unpublished
      ...((!isAdmin || !includeUnpublished) && { isPublished: true }),
      ...(category && category !== 'all' && { category: parseInt(category) }),
      ...(heatingType && heatingType !== 'all' && { heatingType: parseInt(heatingType) }),
      ...(isPremium !== undefined && { isPremium }),
      ...sizeFilter
    };

    let ideas;
    let total;

    if (query) {
      // If search query exists, use search functionality
      ideas = await Idea.search(query, {
        category: category !== 'all' ? parseInt(category) : undefined,
        heatingType: heatingType !== 'all' ? parseInt(heatingType) : undefined,
        isPremium,
        sizeRange,
        limit,
        skip
      });
      total = ideas.length;
    } else {
      // If no search query, get all ideas
      ideas = await Idea.find(filter)
        .populate('category', 'name description')
        .populate('heatingType', 'name description')
        .limit(limit)
        .skip(skip)
        .sort('-popularity');
      total = await Idea.countDocuments(filter);
    }

    total = Math.max(0, total);

    let purchasedIdeaIds = [];
    if (req.user) {
      const user = await User.findById(req.user._id).select('purchasedIdeas');
      if (user && user.purchasedIdeas) {
        purchasedIdeaIds = user.purchasedIdeas.map(p => p.ideaId.toString());
      }
    }

    const filteredIdeas = ideas.map(idea => {
      const ideaJSON = idea.toJSON();
      const isPurchased = purchasedIdeaIds.includes(idea._id.toString());

      if (idea.isPremium && (!req.user || !req.user.isPremiumMember())) {
        return {
          ...ideaJSON,
          isPremiumLocked: !isPurchased,
          isPurchased,
          purchasePrice: idea.purchasePrice || 0
        };
      }
      return {
        ...ideaJSON,
        isPremiumLocked: false,
        isPurchased,
        purchasePrice: idea.purchasePrice || 0
      };
    });

    res.status(200).json({
      success: true,
      data: {
        ideas: filteredIdeas,
        query: query || null,
        pagination: {
          page,
          limit,
          total,
          pages: Math.max(1, Math.ceil(total / limit))
        }
      }
    });
  } catch (error) {
    console.error('Get ideas error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get idea categories
// @route   GET /api/ideas/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const categories = await IdeaCategory.find({ isActive: true })
      .sort('_id');

    res.status(200).json({
      success: true,
      data: {
        categories
      }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get heating types
// @route   GET /api/ideas/heating-types
// @access  Public
const getHeatingTypes = async (req, res) => {
  try {
    const heatingTypes = await HeatingType.find({ isActive: true })
      .sort('_id');

    res.status(200).json({
      success: true,
      data: {
        heatingTypes
      }
    });
  } catch (error) {
    console.error('Get heating types error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get featured ideas
// @route   GET /api/ideas/featured
// @access  Public
const getFeaturedIdeas = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const ideas = await Idea.find({ isFeatured: true, isActive: true, isPublished: true })
      .populate('category', 'name description')
      .populate('heatingType', 'name description')
      .limit(limit)
      .sort('-popularity');

    res.status(200).json({
      success: true,
      data: {
        ideas
      }
    });
  } catch (error) {
    console.error('Get featured ideas error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get popular ideas
// @route   GET /api/ideas/popular
// @access  Public
const getPopularIdeas = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const ideas = await Idea.find({ isActive: true, isPublished: true })
      .populate('category', 'name description')
      .populate('heatingType', 'name description')
      .limit(limit)
      .sort('-popularity');

    res.status(200).json({
      success: true,
      data: {
        ideas
      }
    });
  } catch (error) {
    console.error('Get popular ideas error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Search ideas
// @route   GET /api/ideas/search
// @access  Public
const searchIdeas = async (req, res) => {
  try {
    const query = req.query.q;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const category = req.query.category;
    const heatingType = req.query.heatingType;
    const sizeRange = req.query.sizeRange;

    if (!query) {
      const locale = errorMessageService.getLocaleFromRequest(req);
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('SEARCH_QUERY_REQUIRED', locale)
      });
    }

    const ideas = await Idea.search(query, {
      category: category !== 'all' ? parseInt(category) : undefined,
      heatingType: heatingType !== 'all' ? parseInt(heatingType) : undefined,
      sizeRange,
      limit,
      skip
    });

    res.status(200).json({
      success: true,
      data: {
        ideas,
        query,
        pagination: {
          page,
          limit,
          total: ideas.length
        }
      }
    });
  } catch (error) {
    console.error('Search ideas error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get idea by ID
// @route   GET /api/ideas/:id
// @access  Public (Admin can see unpublished/deleted)
const getIdeaById = async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id)
      .populate('category', 'name description')
      .populate('heatingType', 'name description');

    if (!idea) {
      const locale = errorMessageService.getLocaleFromRequest(req);
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('IDEA_NOT_FOUND', locale)
      });
    }

    // Admin can see all ideas (including unpublished and deleted)
    const isAdmin = req.user && req.user.isAdmin;

    // For non-admin users, check if idea is published and active
    if (!isAdmin && (!idea.isActive || !idea.isPublished)) {
      const locale = errorMessageService.getLocaleFromRequest(req);
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('IDEA_NOT_FOUND', locale)
      });
    }

    // Check if user has purchased this idea
    let isPurchased = false;
    if (req.user) {
      const user = await User.findById(req.user._id).select('purchasedIdeas');
      if (user && user.purchasedIdeas) {
        isPurchased = user.purchasedIdeas.some(p => p.ideaId.toString() === idea._id.toString());
      }
    }

    // Check premium access - not locked if user purchased it
    if (idea.isPremium && (!req.user || !req.user.isPremiumMember) && !isPurchased) {
      return res.status(200).json({
        success: true,
        data: {
          idea: {
            ...idea.toJSON(),
            isPremiumLocked: true,
            isPurchased,
            purchasePrice: idea.purchasePrice || 0
          }
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        idea: {
          ...idea.toJSON(),
          isPremiumLocked: false,
          isPurchased,
          purchasePrice: idea.purchasePrice || 0
        }
      }
    });
  } catch (error) {
    console.error('Get idea by ID error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Increment idea view count
// @route   POST /api/ideas/:id/view
// @access  Public
const incrementViewCount = async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id);

    if (!idea || !idea.isActive) {
      const locale = errorMessageService.getLocaleFromRequest(req);
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('IDEA_NOT_FOUND', locale)
      });
    }

    await idea.incrementViewCount();

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('VIEW_COUNT_UPDATED', errorMessageService.getLocaleFromRequest(req))
    });
  } catch (error) {
    console.error('Increment view count error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Purchase premium idea
// @route   POST /api/ideas/:id/purchase
// @access  Private
const purchaseIdea = async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id);

    if (!idea || !idea.isActive) {
      const locale = errorMessageService.getLocaleFromRequest(req);
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('IDEA_NOT_FOUND', locale)
      });
    }

    // All ideas can be purchased as long as the user has enough balance

    const user = await User.findById(req.user._id);

    // Check if already purchased
    const alreadyPurchased = user.purchasedIdeas.some(purchase =>
      purchase.ideaId.toString() === idea._id.toString()
    );

    if (alreadyPurchased) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('IDEA_ALREADY_PURCHASED_ERROR', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Get purchase price from idea
    console.log('🔍 DEBUG - Idea ID:', idea._id);
    console.log('🔍 DEBUG - Idea purchasePrice:', idea.purchasePrice);
    console.log('🔍 DEBUG - Idea purchasePrice type:', typeof idea.purchasePrice);
    console.log('🔍 DEBUG - Idea purchasePrice is null?', idea.purchasePrice === null);
    console.log('🔍 DEBUG - Idea purchasePrice is undefined?', idea.purchasePrice === undefined);
    const purchasePrice = idea.purchasePrice;
    console.log('🔍 DEBUG - Final purchasePrice:', purchasePrice);

    // Check wallet balance
    if (user.wallet < purchasePrice) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('INSUFFICIENT_WALLET_BALANCE', errorMessageService.getLocaleFromRequest(req)),
        required: purchasePrice,
        current: user.wallet
      });
    }

    // Deduct from wallet and add to purchased ideas using atomic operation to prevent race conditions
    console.log('🔍 DEBUG - Before wallet deduction - User wallet:', user.wallet);
    console.log('🔍 DEBUG - Deducting amount:', purchasePrice);

    // Use atomic operation to deduct wallet and add purchased idea in one operation
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $inc: { wallet: -purchasePrice },
        $push: { purchasedIdeas: { ideaId: idea._id, price: purchasePrice } }
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('USER_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    console.log('🔍 DEBUG - After wallet deduction - User wallet:', updatedUser.wallet);
    await idea.incrementPurchaseCount();

    console.log('🔍 DEBUG - Response data - purchasePrice:', purchasePrice);
    console.log('🔍 DEBUG - Response data - remainingBalance:', updatedUser.wallet);

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('IDEA_PURCHASED_SUCCESS', errorMessageService.getLocaleFromRequest(req)),
      data: {
        idea: {
          ...idea.toJSON(),
          purchasePrice: purchasePrice
        },
        remainingBalance: updatedUser.wallet
      }
    });
  } catch (error) {
    console.error('Purchase idea error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Like/unlike idea
// @route   POST /api/ideas/:id/like
// @access  Private
const toggleLike = async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id);

    if (!idea || !idea.isActive) {
      const locale = errorMessageService.getLocaleFromRequest(req);
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('IDEA_NOT_FOUND', locale)
      });
    }

    // For simplicity, just increment like count
    // In a real app, you'd track individual user likes
    idea.likeCount += 1;
    await idea.save();

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('IDEA_LIKED_SUCCESS', errorMessageService.getLocaleFromRequest(req)),
      data: {
        likeCount: idea.likeCount
      }
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Create new idea (Admin only)
// @route   POST /api/ideas
// @access  Admin
const createIdea = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      heatingType,
      shortDetail,
      images,
      size,
      totalCost,
      addItem,
      isPremium,
      isPublished,
      tags,
      purchasePrice
    } = req.body;

    // Basic required field validation to avoid generic 500s from Mongoose
    const validationErrors = [];
    const locale = errorMessageService.getLocaleFromRequest(req);
    if (!title) validationErrors.push({ field: 'title', message: errorMessageService.getMessage('TITLE_REQUIRED', locale) });
    if (!description) validationErrors.push({ field: 'description', message: errorMessageService.getMessage('DESCRIPTION_REQUIRED', locale) });
    if (!shortDetail) validationErrors.push({ field: 'shortDetail', message: errorMessageService.getMessage('SHORT_DETAIL_REQUIRED', locale) });
    if (!category) validationErrors.push({ field: 'category', message: errorMessageService.getMessage('CATEGORY_REQUIRED', locale) });
    if (!heatingType) validationErrors.push({ field: 'heatingType', message: errorMessageService.getMessage('HEATING_TYPE_REQUIRED', locale) });
    if (!images || images.length === 0) validationErrors.push({ field: 'images', message: errorMessageService.getMessage('IMAGES_REQUIRED', locale) });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('VALIDATION_ERROR', errorMessageService.getLocaleFromRequest(req)),
        errors: validationErrors
      });
    }

    // Prevent duplicate titles
    const existingIdea = await Idea.findOne({ title });
    if (existingIdea) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('IDEA_TITLE_EXISTS', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Upload images to Firebase if they are base64
    let uploadedImages = [];
    if (images && images.length > 0) {
      const { uploadImageToFirebase } = require('../config/firebase');

      for (let i = 0; i < images.length; i++) {
        const image = images[i];

        // If image is a string (base64 or URL)
        if (typeof image === 'string') {
          if (image.startsWith('data:image') || !image.startsWith('http')) {
            try {
              const imageUrl = await uploadImageToFirebase(image, 'ideas', `${title}-${i}.jpg`);
              uploadedImages.push({ url: imageUrl, caption: '', isPrimary: i === 0 });
            } catch (uploadError) {
              console.error(`Failed to upload image ${i}:`, uploadError);
              return res.status(500).json({
                success: false,
                message: errorMessageService.getMessage('FAILED_TO_UPLOAD_IMAGE_WITH_INDEX', errorMessageService.getLocaleFromRequest(req), { index: i + 1 })
              });
            }
          } else {
            // Already a URL
            uploadedImages.push({ url: image, caption: '', isPrimary: i === 0 });
          }
        }
        // If image is an object with url property
        else if (image && image.url) {
          if (image.url.startsWith('data:image') || !image.url.startsWith('http')) {
            try {
              const imageUrl = await uploadImageToFirebase(image.url, 'ideas', `${title}-${i}.jpg`);
              uploadedImages.push({
                url: imageUrl,
                caption: image.caption || '',
                isPrimary: image.isPrimary !== undefined ? image.isPrimary : (i === 0)
              });
            } catch (uploadError) {
              console.error(`Failed to upload image ${i}:`, uploadError);
              return res.status(500).json({
                success: false,
                message: errorMessageService.getMessage('FAILED_TO_UPLOAD_IMAGE_WITH_INDEX', errorMessageService.getLocaleFromRequest(req), { index: i + 1 })
              });
            }
          } else {
            // Already a URL, keep object structure
            uploadedImages.push({
              url: image.url,
              caption: image.caption || '',
              isPrimary: image.isPrimary !== undefined ? image.isPrimary : (i === 0)
            });
          }
        }
      }
    }

    const idea = new Idea({
      title,
      description,
      shortDetail,
      category: parseInt(category),
      heatingType: parseInt(heatingType),
      images: uploadedImages,
      size: size || { value: 0, unit: 'm2' },
      totalCost: totalCost || 0,
      addItem: addItem || [],
      isPremium: !!isPremium,
      isPublished: isPublished !== undefined ? !!isPublished : false,
      tags: tags || [],
      purchasePrice: purchasePrice !== undefined ? purchasePrice : 50000,
      viewCount: 0,
      likeCount: 0,
      popularity: 0,
      isActive: true,
      isFeatured: false
    });

    await idea.save();

    const populatedIdea = await Idea.findById(idea._id)
      .populate('category', 'name description')
      .populate('heatingType', 'name description');

    res.status(201).json({
      success: true,
      message: errorMessageService.getMessage('IDEA_CREATED', locale),
      data: {
        idea: populatedIdea
      }
    });
  } catch (error) {
    // If this is a validation error from mongoose, convert to 400 with details
    if (error && error.name === 'ValidationError') {
      const locale = errorMessageService.getLocaleFromRequest(req);
      const errors = Object.keys(error.errors || {}).map((key) => ({
        field: key,
        message: errorMessageService.localizeValidationError(error.errors[key], locale)
      }));
      return res.status(400).json({ success: false, message: errorMessageService.getMessage('VALIDATION_ERROR', locale), errors });
    }

    console.error('Create idea error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Update idea (Admin only)
// @route   PUT /api/ideas/:id
// @access  Admin
const updateIdea = async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id);

    if (!idea) {
      const locale = errorMessageService.getLocaleFromRequest(req);
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('IDEA_NOT_FOUND', locale)
      });
    }

    const updates = req.body;

    // Handle image uploads if images are being updated
    if (updates.images && updates.images.length > 0) {
      const { uploadImageToFirebase } = require('../config/firebase');
      let uploadedImages = [];

      for (let i = 0; i < updates.images.length; i++) {
        const image = updates.images[i];

        // If image is a string (base64 or URL)
        if (typeof image === 'string') {
          if (image.startsWith('data:image') || !image.startsWith('http')) {
            try {
              const imageUrl = await uploadImageToFirebase(image, 'ideas', `${idea.title}-${Date.now()}-${i}.jpg`);
              uploadedImages.push({ url: imageUrl, caption: '', isPrimary: i === 0 });
            } catch (uploadError) {
              console.error(`Failed to upload image ${i}:`, uploadError);
              return res.status(500).json({
                success: false,
                message: errorMessageService.getMessage('FAILED_TO_UPLOAD_IMAGE_WITH_INDEX', errorMessageService.getLocaleFromRequest(req), { index: i + 1 })
              });
            }
          } else {
            // Already a URL
            uploadedImages.push({ url: image, caption: '', isPrimary: i === 0 });
          }
        }
        // If image is an object with url property
        else if (image && image.url) {
          if (image.url.startsWith('data:image') || !image.url.startsWith('http')) {
            try {
              const imageUrl = await uploadImageToFirebase(image.url, 'ideas', `${idea.title}-${Date.now()}-${i}.jpg`);
              uploadedImages.push({
                url: imageUrl,
                caption: image.caption || '',
                isPrimary: image.isPrimary !== undefined ? image.isPrimary : (i === 0)
              });
            } catch (uploadError) {
              console.error(`Failed to upload image ${i}:`, uploadError);
              return res.status(500).json({
                success: false,
                message: errorMessageService.getMessage('FAILED_TO_UPLOAD_IMAGE_WITH_INDEX', errorMessageService.getLocaleFromRequest(req), { index: i + 1 })
              });
            }
          } else {
            // Already a URL, keep object structure
            uploadedImages.push({
              url: image.url,
              caption: image.caption || '',
              isPrimary: image.isPrimary !== undefined ? image.isPrimary : (i === 0)
            });
          }
        }
      }

      updates.images = uploadedImages;
    }

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        idea[key] = updates[key];
      }
    });

    // If publishing an idea that was deleted, automatically reactivate it
    if (updates.isPublished === true && idea.isActive === false) {
      idea.isActive = true;
    }

    await idea.save();

    const populatedIdea = await Idea.findById(idea._id)
      .populate('category', 'name description')
      .populate('heatingType', 'name description');

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('IDEA_UPDATED_SUCCESS', errorMessageService.getLocaleFromRequest(req)),
      data: {
        idea: populatedIdea
      }
    });
  } catch (error) {
    console.error('Update idea error:', error);
    console.error('Update idea error details:', error.message);

    // If this is a validation error from mongoose, convert to 400 with details
    if (error && error.name === 'ValidationError') {
      const locale = errorMessageService.getLocaleFromRequest(req);
      const errors = Object.keys(error.errors || {}).map((key) => ({
        field: key,
        message: errorMessageService.localizeValidationError(error.errors[key], locale)
      }));
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('VALIDATION_ERROR', locale),
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req)),
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete idea (Admin only)
// @route   DELETE /api/ideas/:id
// @access  Admin
const deleteIdea = async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id);

    if (!idea) {
      const locale = errorMessageService.getLocaleFromRequest(req);
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('IDEA_NOT_FOUND', locale)
      });
    }

    // Hard delete - remove from database completely
    // Also remove references from users' purchasedIdeas array
    await User.updateMany(
      { 'purchasedIdeas.ideaId': idea._id },
      { $pull: { purchasedIdeas: { ideaId: idea._id } } }
    );

    // Delete the idea from database
    await Idea.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('IDEA_DELETED_SUCCESS', errorMessageService.getLocaleFromRequest(req))
    });
  } catch (error) {
    console.error('Delete idea error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Toggle featured status (Admin only)
// @route   PATCH /api/ideas/:id/featured
// @access  Admin
const toggleFeatured = async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id);

    if (!idea) {
      const locale = errorMessageService.getLocaleFromRequest(req);
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('IDEA_NOT_FOUND', locale)
      });
    }

    idea.isFeatured = !idea.isFeatured;
    await idea.save();

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('IDEA_FEATURED_UPDATED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        idea
      }
    });
  } catch (error) {
    console.error('Toggle featured error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Create idea category
// @route   POST /api/ideas/categories
// @access  Admin
const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Get the highest _id and increment by 1
    const lastCategory = await IdeaCategory.findOne().sort({ _id: -1 }).select('_id');
    const newId = lastCategory ? lastCategory._id + 1 : 1;

    const category = await IdeaCategory.create({
      _id: newId,
      name,
      description
    });

    res.status(201).json({
      success: true,
      data: {
        category
      }
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Update idea category
// @route   PUT /api/ideas/categories/:id
// @access  Admin
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    const category = await IdeaCategory.findByIdAndUpdate(
      id,
      { name, description, isActive },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('CATEGORY_NOT_FOUND_ERROR', errorMessageService.getLocaleFromRequest(req))
      });
    }

    res.status(200).json({
      success: true,
      data: {
        category
      }
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Delete idea category
// @route   DELETE /api/ideas/categories/:id
// @access  Admin
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await IdeaCategory.findByIdAndDelete(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('CATEGORY_NOT_FOUND_ERROR', errorMessageService.getLocaleFromRequest(req))
      });
    }

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('CATEGORY_DELETED_SUCCESS', errorMessageService.getLocaleFromRequest(req))
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Create heating type
// @route   POST /api/ideas/heating-types
// @access  Admin
const createHeatingType = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Get the highest _id and increment by 1
    const lastHeatingType = await HeatingType.findOne().sort({ _id: -1 }).select('_id');
    const newId = lastHeatingType ? lastHeatingType._id + 1 : 1;

    const heatingType = await HeatingType.create({
      _id: newId,
      name,
      description
    });

    res.status(201).json({
      success: true,
      data: {
        heatingType
      }
    });
  } catch (error) {
    console.error('Create heating type error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Update heating type
// @route   PUT /api/ideas/heating-types/:id
// @access  Admin
const updateHeatingType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    const heatingType = await HeatingType.findByIdAndUpdate(
      id,
      { name, description, isActive },
      { new: true, runValidators: true }
    );

    if (!heatingType) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('HEATING_TYPE_NOT_FOUND_ERROR', errorMessageService.getLocaleFromRequest(req))
      });
    }

    res.status(200).json({
      success: true,
      data: {
        heatingType
      }
    });
  } catch (error) {
    console.error('Update heating type error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Delete heating type
// @route   DELETE /api/ideas/heating-types/:id
// @access  Admin
const deleteHeatingType = async (req, res) => {
  try {
    const { id } = req.params;

    const heatingType = await HeatingType.findByIdAndDelete(id);

    if (!heatingType) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('HEATING_TYPE_NOT_FOUND_ERROR', errorMessageService.getLocaleFromRequest(req))
      });
    }

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('HEATING_TYPE_DELETED_SUCCESS', errorMessageService.getLocaleFromRequest(req))
    });
  } catch (error) {
    console.error('Delete heating type error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get all ideas for admin (including inactive)
// @route   GET /api/admin/ideas
// @access  Admin
const getAllIdeasAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const includeInactive = req.query.includeInactive === 'true';

    const filter = includeInactive ? {} : { isActive: true };

    const ideas = await Idea.find(filter)
      .populate('category', 'name description')
      .populate('heatingType', 'name description')
      .limit(limit)
      .skip(skip)
      .sort('-createdAt');

    const total = await Idea.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        ideas,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all ideas admin error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get all purchased ideas for admin
// @route   GET /api/admin/purchased-ideas
// @access  Admin
const getAllPurchasedIdeasAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Find all users who have purchased ideas
    const usersWithPurchases = await User.find({ 'purchasedIdeas.0': { $exists: true } })
      .populate({
        path: 'purchasedIdeas.ideaId',
        populate: [
          { path: 'category', select: 'name description' },
          { path: 'heatingType', select: 'name description' }
        ]
      })
      .select('phone username email purchasedIdeas');

    // Flatten all purchases into a single array with user info
    let allPurchases = [];
    usersWithPurchases.forEach(user => {
      user.purchasedIdeas.forEach(purchase => {
        if (purchase.ideaId) {
          allPurchases.push({
            user: {
              _id: user._id,
              phone: user.phone,
              username: user.username,
              email: user.email
            },
            idea: purchase.ideaId.toJSON(),
            purchasedAt: purchase.purchasedAt,
            purchasedPrice: purchase.price,
            isPremiumLocked: false
          });
        }
      });
    });

    // Sort by purchasedAt descending (most recent first)
    allPurchases.sort((a, b) => new Date(b.purchasedAt) - new Date(a.purchasedAt));

    // Get total count
    const total = allPurchases.length;

    // Apply pagination
    const paginatedPurchases = allPurchases.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      data: {
        ideas: paginatedPurchases,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all purchased ideas admin error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get size ranges for filtering
// @route   GET /api/ideas/size-ranges
// @access  Public
const getSizeRanges = async (req, res) => {
  try {
    const sizeRanges = [
      { value: 'all', label: 'All' },
      { value: '0-30', label: '0-30м2' },
      { value: '31-60', label: '31-60м2' },
      { value: '61-90', label: '61-90м2' },
      { value: '91-120', label: '91-120м2' },
      { value: '121-150', label: '121-150м2' },
      { value: '151-180', label: '151-180м2' },
      { value: '181-210', label: '181-210м2' },
      { value: '211-240', label: '211-240м2' },
      { value: '241-270', label: '241-270м2' },
      { value: '271-300', label: '271-300м2' }
    ];

    res.status(200).json({
      success: true,
      data: {
        sizeRanges
      }
    });
  } catch (error) {
    console.error('Get size ranges error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

module.exports = {
  getIdeas,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getHeatingTypes,
  createHeatingType,
  updateHeatingType,
  deleteHeatingType,
  getSizeRanges,
  getFeaturedIdeas,
  getPopularIdeas,
  searchIdeas,
  getIdeaById,
  createIdea,
  updateIdea,
  deleteIdea,
  incrementViewCount,
  purchaseIdea,
  toggleLike,
  toggleFeatured,
  getAllIdeasAdmin,
  getAllPurchasedIdeasAdmin
};
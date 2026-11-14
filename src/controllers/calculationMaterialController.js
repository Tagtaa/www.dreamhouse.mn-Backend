const CalculationMaterial = require('../models/CalculationMaterial');
const Material = require('../models/Material');
const MaterialCategory = require('../models/MaterialCategory');
const errorMessageService = require('../services/errorMessageService');
const { uploadImageToFirebase } = require('../config/firebase');

// @desc    Get all calculation materials for a specific calculation
// @route   GET /api/calculations/:type/choose-materials
// @access  Private
const getCalculationMaterials = async (req, res) => {
  try {
    const { type } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const query = req.query.q; // Search query parameter
    
    // Filter materials by calculation type
    const filter = {
      calculationType: type
    };

    // Add search functionality
    if (query) {
      const regexQuery = new RegExp(query, 'i');
      filter.$or = [
        { name: regexQuery },
        { description: regexQuery }
      ];
    }

    // Get materials with pagination
    const materials = await CalculationMaterial.find(filter)
      .sort({ sortOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await CalculationMaterial.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        materials,
        query: query || null,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get calculation materials error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get calculation material by ID
// @route   GET /api/calculations/materials/:id
// @access  Private
const getCalculationMaterialById = async (req, res) => {
  try {
    const material = await CalculationMaterial.findById(req.params.id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('CALCULATION_MATERIAL_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    res.status(200).json({
      success: true,
      data: {
        material
      }
    });
  } catch (error) {
    console.error('Get calculation material by ID error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Create new calculation material for a specific calculation
// @route   POST /api/calculations/:type/choose-materials
// @access  Admin
const createCalculationMaterial = async (req, res) => {
  try {
    const { type } = req.params;
    const { 
      key, 
      name, 
      image,
      imageUrl, 
      description, 
      priceAmount,
      pricePerUnit, // Alternative name for priceAmount
      priceUnit,
      unit, // Alternative name for priceUnit
      priceCurrency,
      rating,
      likes,
      sortOrder,
      isActive
    } = req.body;
    const calculationType = type;
    
    // Support both parameter naming conventions
    const finalPriceAmount = priceAmount || pricePerUnit;
    const finalPriceUnit = priceUnit || unit;
    
    console.log('🔍 Create Material - Request Body:', req.body);
    console.log('🔍 Create Material - File:', req.file);
    
    // Handle file upload (if image is uploaded as file)
    let finalImageUrl = image || imageUrl;
    if (req.file) {
      // Upload file to Firebase Storage (multer single file)
      console.log('📤 Uploading image to Firebase:', req.file.originalname);
      finalImageUrl = await uploadImageToFirebase(req.file.buffer, 'calculation-materials', req.file.originalname);
      console.log('✅ Image uploaded:', finalImageUrl);
    } else if (image && image.startsWith('data:image/')) {
      // Handle base64 image
      console.log('📤 Uploading base64 image to Firebase');
      finalImageUrl = await uploadImageToFirebase(image, 'calculation-materials', 'image.jpg');
      console.log('✅ Base64 image uploaded:', finalImageUrl);
    }

    // Convert form-data strings to appropriate types
    const parsedPriceAmount = finalPriceAmount ? parseFloat(finalPriceAmount) : undefined;
    const parsedRating = rating ? parseFloat(rating) : 0;
    const parsedLikes = likes ? parseInt(likes) : 0;
    const parsedSortOrder = sortOrder ? parseInt(sortOrder) : 0;
    const parsedIsActive = isActive !== undefined ? (isActive === 'true' || isActive === true) : true;

    // Validate required fields
    if (!key || !name || !finalImageUrl) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('KEY_NAME_IMAGE_REQUIRED', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Validate price fields (both are required)
    if (!finalPriceAmount || !finalPriceUnit) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('PRICE_AMOUNT_UNIT_REQUIRED', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Check if material already exists
    const existingMaterial = await CalculationMaterial.findOne({ 
      calculationType, 
      key 
    });

    if (existingMaterial) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('CALCULATION_MATERIAL_EXISTS', errorMessageService.getLocaleFromRequest(req))
      });
    }

    const newMaterial = new CalculationMaterial({
      calculationType,
      key,
      name,
      imageUrl: finalImageUrl,
      description,
      price: {
        amount: parsedPriceAmount,
        unit: finalPriceUnit,
        currency: priceCurrency || '₸'
      },
      rating: parsedRating,
      likes: parsedLikes,
      isActive: parsedIsActive,
      sortOrder: parsedSortOrder
    });

    await newMaterial.save();

    res.status(201).json({
      success: true,
      message: errorMessageService.getMessage('CALCULATION_MATERIAL_CREATED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        material: newMaterial
      }
    });
  } catch (error) {
    console.error('Create calculation material error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Update calculation material
// @route   PUT /api/calculations/materials/:id
// @access  Admin
const updateCalculationMaterial = async (req, res) => {
  try {
    const { 
      name, 
      image,
      imageUrl, 
      description, 
      price,
      rating,
      likes,
      isActive, 
      sortOrder 
    } = req.body;
    const finalImageUrl = image || imageUrl;

    const material = await CalculationMaterial.findById(req.params.id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('CALCULATION_MATERIAL_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Update fields
    if (name !== undefined) material.name = name;
    if (finalImageUrl !== undefined) material.imageUrl = finalImageUrl;
    if (description !== undefined) material.description = description;
    if (price !== undefined) material.price = price;
    if (rating !== undefined) material.rating = rating;
    if (likes !== undefined) material.likes = likes;
    if (isActive !== undefined) material.isActive = isActive;
    if (sortOrder !== undefined) material.sortOrder = sortOrder;

    await material.save();

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('CALCULATION_MATERIAL_UPDATED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        material
      }
    });
  } catch (error) {
    console.error('Update calculation material error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Delete calculation material
// @route   DELETE /api/calculations/materials/:id
// @access  Admin
const deleteCalculationMaterial = async (req, res) => {
  try {
    const material = await CalculationMaterial.findById(req.params.id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('CALCULATION_MATERIAL_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    await CalculationMaterial.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('CALCULATION_MATERIAL_DELETED', errorMessageService.getLocaleFromRequest(req))
    });
  } catch (error) {
    console.error('Delete calculation material error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Update calculation material by key
// @route   PUT /api/calculations/:type/choose-materials
// @access  Admin
const updateCalculationMaterialByKey = async (req, res) => {
  try {
    const { type } = req.params;
    const { 
      key, 
      name, 
      image, 
      imageUrl, 
      description, 
      priceAmount, 
      pricePerUnit, // Alternative name for priceAmount
      priceUnit, 
      unit, // Alternative name for priceUnit
      priceCurrency, 
      rating, 
      likes, 
      isActive, 
      sortOrder 
    } = req.body;
    const calculationType = type;
    
    // Support both parameter naming conventions
    const finalPriceAmount = priceAmount || pricePerUnit;
    const finalPriceUnit = priceUnit || unit;
    
    console.log('🔍 Update Material - Request Body:', req.body);
    console.log('🔍 Update Material - File:', req.file);
    
    // Handle file upload (if image is uploaded as file)
    let finalImageUrl = image || imageUrl;
    if (req.file) {
      // Upload file to Firebase Storage (multer single file)
      console.log('📤 Uploading image to Firebase:', req.file.originalname);
      finalImageUrl = await uploadImageToFirebase(req.file.buffer, 'calculation-materials', req.file.originalname);
      console.log('✅ Image uploaded:', finalImageUrl);
    } else if (image && image.startsWith('data:image/')) {
      // Handle base64 image
      console.log('📤 Uploading base64 image to Firebase');
      finalImageUrl = await uploadImageToFirebase(image, 'calculation-materials', 'image.jpg');
      console.log('✅ Base64 image uploaded:', finalImageUrl);
    }

    // Convert form-data strings to appropriate types
    const parsedPriceAmount = finalPriceAmount ? parseFloat(finalPriceAmount) : undefined;
    const parsedRating = rating ? parseFloat(rating) : undefined;
    const parsedLikes = likes ? parseInt(likes) : undefined;
    const parsedIsActive = isActive !== undefined ? (isActive === 'true' || isActive === true) : undefined;
    const parsedSortOrder = sortOrder ? parseInt(sortOrder) : undefined;

    const material = await CalculationMaterial.findOne({ 
      calculationType, 
      key 
    });

    if (!material) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('CALCULATION_MATERIAL_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Update fields
    if (name !== undefined) material.name = name;
    if (finalImageUrl !== undefined) material.imageUrl = finalImageUrl;
    if (description !== undefined) material.description = description;
    if (parsedPriceAmount !== undefined) {
      material.price = {
        amount: parsedPriceAmount,
        unit: finalPriceUnit || material.price?.unit || 'm2',
        currency: priceCurrency || material.price?.currency || '₸'
      };
    }
    if (parsedRating !== undefined) material.rating = parsedRating;
    if (parsedLikes !== undefined) material.likes = parsedLikes;
    if (parsedIsActive !== undefined) material.isActive = parsedIsActive;
    if (parsedSortOrder !== undefined) material.sortOrder = parsedSortOrder;

    await material.save();

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('CALCULATION_MATERIAL_UPDATED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        material
      }
    });
  } catch (error) {
    console.error('Update calculation material by key error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Delete calculation material by key
// @route   DELETE /api/calculations/:type/choose-materials
// @access  Admin
const deleteCalculationMaterialByKey = async (req, res) => {
  try {
    const { type } = req.params;
    const { key } = req.body;
    const calculationType = type;

    const material = await CalculationMaterial.findOne({ 
      calculationType, 
      key 
    });

    if (!material) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('CALCULATION_MATERIAL_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    await CalculationMaterial.findByIdAndDelete(material._id);

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('CALCULATION_MATERIAL_DELETED', errorMessageService.getLocaleFromRequest(req))
    });
  } catch (error) {
    console.error('Delete calculation material by key error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

module.exports = {
  getCalculationMaterials,
  getCalculationMaterialById,
  createCalculationMaterial,
  updateCalculationMaterial,
  deleteCalculationMaterial,
  updateCalculationMaterialByKey,
  deleteCalculationMaterialByKey
};

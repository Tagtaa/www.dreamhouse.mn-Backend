const WallThickness = require('../models/WallThickness');
const errorMessageService = require('../services/errorMessageService');
const { uploadImageToFirebase } = require('../config/firebase');

// @desc    Get all wall thickness options
// @route   GET /api/calculations/wall/thickness or /api/calculations/:type/thickness
// @access  Private
const getWallThicknessOptions = async (req, res) => {
  try {
    // Check if type parameter exists (from route)
    const calculationType = req.params.type || 'wall';
    
    const thicknessOptions = await WallThickness.find({ 
      calculationType: calculationType
    }).sort('sortOrder');

    res.json({
      success: true,
      data: {
        thicknessOptions
      }
    });
  } catch (error) {
    console.error('Error getting wall thickness options:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get wall thickness by ID
// @route   GET /api/calculations/wall/thickness/:id
// @access  Private
const getWallThicknessById = async (req, res) => {
  try {
    const { id } = req.params;

    const thicknessOption = await WallThickness.findById(id);
    
    if (!thicknessOption) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('WALL_THICKNESS_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    res.json({
      success: true,
      data: {
        thicknessOption
      }
    });
  } catch (error) {
    console.error('Error getting wall thickness by ID:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Create new wall thickness option
// @route   POST /api/calculations/wall/thickness
// @access  Admin
const createWallThickness = async (req, res) => {
  try {
    const { 
      key, 
      name, 
      thickness,
      unit,
      image,
      imageUrl, 
      description, 
      sortOrder 
    } = req.body;
    const finalImageUrl = image || imageUrl;

    // Check if thickness option already exists
    const existingThickness = await WallThickness.findOne({ 
      calculationType: 'wall',
      key 
    });

    if (existingThickness) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('WALL_THICKNESS_EXISTS', errorMessageService.getLocaleFromRequest(req))
      });
    }

    const newThicknessOption = new WallThickness({
      calculationType: 'wall',
      key,
      name,
      thickness,
      unit,
      imageUrl: finalImageUrl,
      description,
      sortOrder
    });

    await newThicknessOption.save();

    res.status(201).json({
      success: true,
      message: errorMessageService.getMessage('WALL_THICKNESS_CREATED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        thicknessOption: newThicknessOption
      }
    });
  } catch (error) {
    console.error('Error creating wall thickness option:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('VALIDATION_ERROR', errorMessageService.getLocaleFromRequest(req)),
        errors: Object.values(error.errors).map(err => errorMessageService.localizeValidationError(err, errorMessageService.getLocaleFromRequest(req)))
      });
    }

    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Update wall thickness option
// @route   PUT /api/calculations/wall/thickness/:id
// @access  Admin
const updateWallThickness = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      key, 
      name, 
      thickness,
      unit,
      imageUrl, 
      description, 
      isActive,
      sortOrder 
    } = req.body;

    const thicknessOption = await WallThickness.findById(id);
    
    if (!thicknessOption) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('WALL_THICKNESS_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Check if key is being changed and if new key already exists
    if (key && key !== thicknessOption.key) {
      const existingThickness = await WallThickness.findOne({ 
        calculationType: 'wall',
        key,
        _id: { $ne: id }
      });

      if (existingThickness) {
        return res.status(400).json({
          success: false,
          message: errorMessageService.getMessage('WALL_THICKNESS_EXISTS', errorMessageService.getLocaleFromRequest(req))
        });
      }
    }

    // Update fields
    if (key !== undefined) thicknessOption.key = key;
    if (name !== undefined) thicknessOption.name = name;
    if (thickness !== undefined) thicknessOption.thickness = thickness;
    if (unit !== undefined) thicknessOption.unit = unit;
    if (imageUrl !== undefined) thicknessOption.imageUrl = imageUrl;
    if (description !== undefined) thicknessOption.description = description;
    if (isActive !== undefined) thicknessOption.isActive = isActive;
    if (sortOrder !== undefined) thicknessOption.sortOrder = sortOrder;

    await thicknessOption.save();

    res.json({
      success: true,
      message: errorMessageService.getMessage('WALL_THICKNESS_UPDATED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        thicknessOption
      }
    });
  } catch (error) {
    console.error('Error updating wall thickness option:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('VALIDATION_ERROR', errorMessageService.getLocaleFromRequest(req)),
        errors: Object.values(error.errors).map(err => errorMessageService.localizeValidationError(err, errorMessageService.getLocaleFromRequest(req)))
      });
    }

    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Delete wall thickness option
// @route   DELETE /api/calculations/wall/thickness/:id
// @access  Admin
const deleteWallThickness = async (req, res) => {
  try {
    const { id } = req.params;

    const thicknessOption = await WallThickness.findById(id);
    
    if (!thicknessOption) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('WALL_THICKNESS_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    await WallThickness.findByIdAndDelete(id);

    res.json({
      success: true,
      message: errorMessageService.getMessage('WALL_THICKNESS_DELETED', errorMessageService.getLocaleFromRequest(req))
    });
  } catch (error) {
    console.error('Error deleting wall thickness option:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Create wall thickness by key
// @route   POST /api/calculations/:type/thickness
// @access  Admin
const createWallThicknessByKey = async (req, res) => {
  try {
    const { type } = req.params;
    const { 
      key, 
      name, 
      thickness,
      value, // Alternative name for thickness
      unit,
      image,
      imageUrl, 
      description, 
      sortOrder,
      isActive
    } = req.body;
    
    console.log('🔍 Create Thickness - Request Body:', req.body);
    console.log('🔍 Create Thickness - File:', req.file);
    
    // Handle file upload (if image is uploaded as file)
    let finalImageUrl = image || imageUrl;
    if (req.file) {
      // Upload file to Firebase Storage (multer single file)
      console.log('📤 Uploading image to Firebase:', req.file.originalname);
      finalImageUrl = await uploadImageToFirebase(req.file.buffer, 'wall-thickness', req.file.originalname);
      console.log('✅ Image uploaded:', finalImageUrl);
    } else if (image && image.startsWith('data:image/')) {
      // Handle base64 image
      console.log('📤 Uploading base64 image to Firebase');
      finalImageUrl = await uploadImageToFirebase(image, 'wall-thickness', 'image.jpg');
      console.log('✅ Base64 image uploaded:', finalImageUrl);
    }

    // Support both parameter naming conventions
    const finalThickness = thickness || value;

    // Convert form-data strings to appropriate types
    const parsedThickness = finalThickness ? parseFloat(finalThickness) : undefined;
    const parsedSortOrder = sortOrder ? parseInt(sortOrder) : 0;
    const parsedIsActive = isActive !== undefined ? (isActive === 'true' || isActive === true) : true;

    // Validate required fields
    if (!key || !name || !finalImageUrl) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('KEY_NAME_IMAGE_REQUIRED', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Check if thickness option already exists
    const existingThickness = await WallThickness.findOne({ 
      calculationType: type,
      key 
    });

    if (existingThickness) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('WALL_THICKNESS_EXISTS', errorMessageService.getLocaleFromRequest(req))
      });
    }

    const newThicknessOption = new WallThickness({
      calculationType: type,
      key,
      name,
      thickness: parsedThickness,
      unit,
      imageUrl: finalImageUrl,
      description,
      isActive: parsedIsActive,
      sortOrder: parsedSortOrder
    });

    await newThicknessOption.save();

    res.status(201).json({
      success: true,
      message: errorMessageService.getMessage('WALL_THICKNESS_CREATED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        thicknessOption: newThicknessOption
      }
    });
  } catch (error) {
    console.error('Error creating wall thickness by key:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('VALIDATION_ERROR', errorMessageService.getLocaleFromRequest(req)),
        errors: Object.values(error.errors).map(err => errorMessageService.localizeValidationError(err, errorMessageService.getLocaleFromRequest(req)))
      });
    }

    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Update wall thickness by key
// @route   PUT /api/calculations/:type/thickness
// @access  Admin
const updateWallThicknessByKey = async (req, res) => {
  try {
    const { type } = req.params;
    const { 
      key, 
      name, 
      thickness,
      value, // Alternative name for thickness
      unit,
      image,
      imageUrl, 
      description, 
      isActive,
      sortOrder 
    } = req.body;
    
    console.log('🔍 Update Thickness - Request Body:', req.body);
    console.log('🔍 Update Thickness - File:', req.file);
    
    // Handle file upload (if image is uploaded as file)
    let finalImageUrl = image || imageUrl;
    if (req.file) {
      // Upload file to Firebase Storage (multer single file)
      console.log('📤 Uploading image to Firebase:', req.file.originalname);
      finalImageUrl = await uploadImageToFirebase(req.file.buffer, 'wall-thickness', req.file.originalname);
      console.log('✅ Image uploaded:', finalImageUrl);
    } else if (image && image.startsWith('data:image/')) {
      // Handle base64 image
      console.log('📤 Uploading base64 image to Firebase');
      finalImageUrl = await uploadImageToFirebase(image, 'wall-thickness', 'image.jpg');
      console.log('✅ Base64 image uploaded:', finalImageUrl);
    }

    // Support both parameter naming conventions
    const finalThickness = thickness || value;

    // Convert form-data strings to appropriate types
    const parsedThickness = finalThickness ? parseFloat(finalThickness) : undefined;
    const parsedIsActive = isActive !== undefined ? (isActive === 'true' || isActive === true) : undefined;
    const parsedSortOrder = sortOrder ? parseInt(sortOrder) : undefined;

    const thicknessOption = await WallThickness.findOne({ 
      calculationType: type,
      key 
    });
    
    if (!thicknessOption) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('WALL_THICKNESS_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Update fields
    if (name !== undefined) thicknessOption.name = name;
    if (parsedThickness !== undefined) thicknessOption.thickness = parsedThickness;
    if (unit !== undefined) thicknessOption.unit = unit;
    if (finalImageUrl !== undefined) thicknessOption.imageUrl = finalImageUrl;
    if (description !== undefined) thicknessOption.description = description;
    if (parsedIsActive !== undefined) thicknessOption.isActive = parsedIsActive;
    if (parsedSortOrder !== undefined) thicknessOption.sortOrder = parsedSortOrder;

    await thicknessOption.save();

    res.json({
      success: true,
      message: errorMessageService.getMessage('WALL_THICKNESS_UPDATED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        thicknessOption
      }
    });
  } catch (error) {
    console.error('Error updating wall thickness by key:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('VALIDATION_ERROR', errorMessageService.getLocaleFromRequest(req)),
        errors: Object.values(error.errors).map(err => errorMessageService.localizeValidationError(err, errorMessageService.getLocaleFromRequest(req)))
      });
    }

    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Delete wall thickness by key
// @route   DELETE /api/calculations/:type/thickness
// @access  Admin
const deleteWallThicknessByKey = async (req, res) => {
  try {
    const { type } = req.params;
    const { key } = req.body;

    const thicknessOption = await WallThickness.findOne({ 
      calculationType: type,
      key 
    });
    
    if (!thicknessOption) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('WALL_THICKNESS_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    await WallThickness.findByIdAndDelete(thicknessOption._id);

    res.json({
      success: true,
      message: errorMessageService.getMessage('WALL_THICKNESS_DELETED', errorMessageService.getLocaleFromRequest(req))
    });
  } catch (error) {
    console.error('Error deleting wall thickness by key:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

module.exports = {
  getWallThicknessOptions,
  getWallThicknessById,
  createWallThickness,
  updateWallThickness,
  deleteWallThickness,
  createWallThicknessByKey,
  updateWallThicknessByKey,
  deleteWallThicknessByKey
};

const RoofShape = require('../models/RoofShape');
const errorMessageService = require('../services/errorMessageService');
const { uploadImageToFirebase } = require('../config/firebase');

// @desc    Get all roof shape options
// @route   GET /api/calculations/roof/choose-shapes or /api/calculations/:type/choose-shapes
// @access  Private
const getRoofShapeOptions = async (req, res) => {
  try {
    // Check if type parameter exists (from route)
    const calculationType = req.params.type || 'roof';
    
    const shapeOptions = await RoofShape.find({ 
      calculationType: calculationType
    }).sort('sortOrder');

    res.json({
      success: true,
      data: {
        shapeOptions
      }
    });
  } catch (error) {
    console.error('Error getting roof shape options:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get roof shape by ID
// @route   GET /api/calculations/roof/choose-shapes/:id
// @access  Private
const getRoofShapeById = async (req, res) => {
  try {
    const { id } = req.params;

    const shapeOption = await RoofShape.findById(id);
    
    if (!shapeOption) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('ROOF_SHAPE_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    res.json({
      success: true,
      data: {
        shapeOption
      }
    });
  } catch (error) {
    console.error('Error getting roof shape by ID:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Create new roof shape option
// @route   POST /api/calculations/roof/choose-shapes
// @access  Admin
const createRoofShape = async (req, res) => {
  try {
    const { 
      key, 
      name, 
      image,
      imageUrl, 
      description, 
      sortOrder 
    } = req.body;
    const finalImageUrl = image || imageUrl;

    // Check if shape option already exists
    const existingShape = await RoofShape.findOne({ 
      calculationType: 'roof',
      key 
    });

    if (existingShape) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('ROOF_SHAPE_EXISTS', errorMessageService.getLocaleFromRequest(req))
      });
    }

    const newShapeOption = new RoofShape({
      calculationType: 'roof',
      key,
      name,
      imageUrl: finalImageUrl,
      description,
      sortOrder
    });

    await newShapeOption.save();

    res.status(201).json({
      success: true,
      message: errorMessageService.getMessage('ROOF_SHAPE_CREATED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        shapeOption: newShapeOption
      }
    });
  } catch (error) {
    console.error('Error creating roof shape option:', error);
    
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

// @desc    Update roof shape option
// @route   PUT /api/calculations/roof/choose-shapes/:id
// @access  Admin
const updateRoofShape = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      key, 
      name, 
      imageUrl, 
      description, 
      isActive,
      sortOrder 
    } = req.body;

    const shapeOption = await RoofShape.findById(id);
    
    if (!shapeOption) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('ROOF_SHAPE_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Check if key is being changed and if new key already exists
    if (key && key !== shapeOption.key) {
      const existingShape = await RoofShape.findOne({ 
        calculationType: 'roof',
        key,
        _id: { $ne: id }
      });

      if (existingShape) {
        return res.status(400).json({
          success: false,
          message: errorMessageService.getMessage('ROOF_SHAPE_EXISTS', errorMessageService.getLocaleFromRequest(req))
        });
      }
    }

    // Update fields
    if (key !== undefined) shapeOption.key = key;
    if (name !== undefined) shapeOption.name = name;
    if (imageUrl !== undefined) shapeOption.imageUrl = imageUrl;
    if (description !== undefined) shapeOption.description = description;
    if (isActive !== undefined) shapeOption.isActive = isActive;
    if (sortOrder !== undefined) shapeOption.sortOrder = sortOrder;

    await shapeOption.save();

    res.json({
      success: true,
      message: errorMessageService.getMessage('ROOF_SHAPE_UPDATED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        shapeOption
      }
    });
  } catch (error) {
    console.error('Error updating roof shape option:', error);
    
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

// @desc    Delete roof shape option
// @route   DELETE /api/calculations/roof/choose-shapes/:id
// @access  Admin
const deleteRoofShape = async (req, res) => {
  try {
    const { id } = req.params;

    const shapeOption = await RoofShape.findById(id);
    
    if (!shapeOption) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('ROOF_SHAPE_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    await RoofShape.findByIdAndDelete(id);

    res.json({
      success: true,
      message: errorMessageService.getMessage('ROOF_SHAPE_DELETED', errorMessageService.getLocaleFromRequest(req))
    });
  } catch (error) {
    console.error('Error deleting roof shape option:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Create roof shape by key
// @route   POST /api/calculations/:type/choose-shapes
// @access  Admin
const createRoofShapeByKey = async (req, res) => {
  try {
    const { type } = req.params;
    const { 
      key, 
      name, 
      image,
      imageUrl, 
      description, 
      sortOrder,
      isActive
    } = req.body;
    
    console.log('🔍 Create Shape - Request Body:', req.body);
    console.log('🔍 Create Shape - File:', req.file);
    
    // Handle file upload (if image is uploaded as file)
    let finalImageUrl = image || imageUrl;
    if (req.file) {
      // Upload file to Firebase Storage (multer single file)
      console.log('📤 Uploading image to Firebase:', req.file.originalname);
      finalImageUrl = await uploadImageToFirebase(req.file.buffer, 'roof-shapes', req.file.originalname);
      console.log('✅ Image uploaded:', finalImageUrl);
    } else if (image && image.startsWith('data:image/')) {
      // Handle base64 image
      console.log('📤 Uploading base64 image to Firebase');
      finalImageUrl = await uploadImageToFirebase(image, 'roof-shapes', 'image.jpg');
      console.log('✅ Base64 image uploaded:', finalImageUrl);
    }

    // Convert form-data strings to appropriate types
    const parsedSortOrder = sortOrder ? parseInt(sortOrder) : 0;
    const parsedIsActive = isActive !== undefined ? (isActive === 'true' || isActive === true) : true;

    // Validate required fields
    if (!key || !name || !finalImageUrl) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('KEY_NAME_IMAGE_REQUIRED', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Check if shape option already exists
    const existingShape = await RoofShape.findOne({ 
      calculationType: type,
      key 
    });

    if (existingShape) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('ROOF_SHAPE_EXISTS', errorMessageService.getLocaleFromRequest(req))
      });
    }

    const newShapeOption = new RoofShape({
      calculationType: type,
      key,
      name,
      imageUrl: finalImageUrl,
      description,
      sortOrder: parsedSortOrder
    });

    await newShapeOption.save();

    res.status(201).json({
      success: true,
      message: errorMessageService.getMessage('ROOF_SHAPE_CREATED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        shapeOption: newShapeOption
      }
    });
  } catch (error) {
    console.error('Error creating roof shape by key:', error);
    
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

// @desc    Update roof shape by key
// @route   PUT /api/calculations/:type/choose-shapes
// @access  Admin
const updateRoofShapeByKey = async (req, res) => {
  try {
    const { type } = req.params;
    const { 
      key, 
      name, 
      image,
      imageUrl, 
      description, 
      isActive,
      sortOrder 
    } = req.body;
    
    console.log('🔍 Update Shape - Request Body:', req.body);
    console.log('🔍 Update Shape - File:', req.file);
    
    // Handle file upload (if image is uploaded as file)
    let finalImageUrl = image || imageUrl;
    if (req.file) {
      // Upload file to Firebase Storage (multer single file)
      console.log('📤 Uploading image to Firebase:', req.file.originalname);
      finalImageUrl = await uploadImageToFirebase(req.file.buffer, 'roof-shapes', req.file.originalname);
      console.log('✅ Image uploaded:', finalImageUrl);
    } else if (image && image.startsWith('data:image/')) {
      // Handle base64 image
      console.log('📤 Uploading base64 image to Firebase');
      finalImageUrl = await uploadImageToFirebase(image, 'roof-shapes', 'image.jpg');
      console.log('✅ Base64 image uploaded:', finalImageUrl);
    }

    // Convert form-data strings to appropriate types
    const parsedIsActive = isActive !== undefined ? (isActive === 'true' || isActive === true) : undefined;
    const parsedSortOrder = sortOrder ? parseInt(sortOrder) : undefined;

    const shapeOption = await RoofShape.findOne({ 
      calculationType: type,
      key 
    });
    
    if (!shapeOption) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('ROOF_SHAPE_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Update fields
    if (name !== undefined) shapeOption.name = name;
    if (finalImageUrl !== undefined) shapeOption.imageUrl = finalImageUrl;
    if (description !== undefined) shapeOption.description = description;
    if (parsedIsActive !== undefined) shapeOption.isActive = parsedIsActive;
    if (parsedSortOrder !== undefined) shapeOption.sortOrder = parsedSortOrder;

    await shapeOption.save();

    res.json({
      success: true,
      message: errorMessageService.getMessage('ROOF_SHAPE_UPDATED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        shapeOption
      }
    });
  } catch (error) {
    console.error('Error updating roof shape by key:', error);
    
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

// @desc    Delete roof shape by key
// @route   DELETE /api/calculations/:type/choose-shapes
// @access  Admin
const deleteRoofShapeByKey = async (req, res) => {
  try {
    const { type } = req.params;
    const { key } = req.body;

    const shapeOption = await RoofShape.findOne({ 
      calculationType: type,
      key 
    });
    
    if (!shapeOption) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('ROOF_SHAPE_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    await RoofShape.findByIdAndDelete(shapeOption._id);

    res.json({
      success: true,
      message: errorMessageService.getMessage('ROOF_SHAPE_DELETED', errorMessageService.getLocaleFromRequest(req))
    });
  } catch (error) {
    console.error('Error deleting roof shape by key:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

module.exports = {
  getRoofShapeOptions,
  getRoofShapeById,
  createRoofShape,
  updateRoofShape,
  deleteRoofShape,
  createRoofShapeByKey,
  updateRoofShapeByKey,
  deleteRoofShapeByKey
};

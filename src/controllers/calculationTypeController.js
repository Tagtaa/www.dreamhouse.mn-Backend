const CalculationType = require('../models/CalculationType');
const errorMessageService = require('../services/errorMessageService');
const { uploadImageToFirebase } = require('../config/firebase');

// @desc    Get all calculation types for a specific calculation
// @route   GET /api/calculations/:type/choose-types
// @access  Private
const getCalculationTypes = async (req, res) => {
  try {
    const { type } = req.params;
    
    // Find the calculation type by key (e.g., "wall")
    const calculationType = await CalculationType.findOne({ 
      key: type
    });

    if (!calculationType) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('CALCULATION_TYPE_NOT_FOUND_WITH_KEY_PARAM', errorMessageService.getLocaleFromRequest(req), { key: type })
      });
    }

    // Return choose-types from the array, or empty array if none
    // Add calculationType field and id to each choose-type
    // Sorted by order number (then creation time) so web and mobile show the admin's order
    const chooseTypes = [...(calculationType.chooseTypes || [])]
      .sort((a, b) => ((a.sortOrder || 0) - (b.sortOrder || 0)) || (new Date(a.createdAt || 0) - new Date(b.createdAt || 0)))
      .map(chooseType => {
      const chooseTypeObj = chooseType.toObject ? chooseType.toObject() : chooseType;
      return {
        ...chooseTypeObj,
        id: chooseTypeObj._id || chooseTypeObj.id,
        _id: chooseTypeObj._id,
        calculationType: calculationType.key || type
      };
    });

    res.status(200).json({
      success: true,
      data: {
        types: chooseTypes
      }
    });
  } catch (error) {
    console.error('Get calculation types error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get calculation type by ID
// @route   GET /api/calculations/types/:id
// @access  Private
const getCalculationTypeById = async (req, res) => {
  try {
    const type = await CalculationType.findById(req.params.id);

    if (!type) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('CALCULATION_TYPE_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    res.status(200).json({
      success: true,
      data: {
        type
      }
    });
  } catch (error) {
    console.error('Get calculation type by ID error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Create new choose-type for a specific calculation type
// @route   POST /api/calculations/:type/choose-types
// @access  Admin
// @note    The URL parameter (e.g., "wall") should be a CalculationType with key="wall"
//          We create a new choose-type option under this CalculationType with the key from request body
const createCalculationType = async (req, res) => {
  try {
    // Get the calculation type key from URL parameter (e.g., "wall" from /api/calculations/wall/choose-types)
    const calculationTypeKey = req.params.type;
    const { key, name, image, imageUrl, description, sortOrder, isActive } = req.body;
    
    console.log('🔍 Create Choose-Type - CalculationType Key from URL:', calculationTypeKey);
    console.log('🔍 Create Choose-Type - Request Body:', req.body);
    console.log('🔍 Create Choose-Type - File:', req.file);
    
    // First, verify that the calculation type exists (e.g., key="wall" should exist as a CalculationType)
    const parentCalculationType = await CalculationType.findOne({ 
      key: calculationTypeKey 
    });

    if (!parentCalculationType) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('CALCULATION_TYPE_NOT_FOUND_CREATE_FIRST_PARAM', errorMessageService.getLocaleFromRequest(req), { key: calculationTypeKey })
      });
    }

    // Use the parent calculation type's calculationType field as the calculationType for the new choose-type
    const calculationType = parentCalculationType.calculationType || parentCalculationType.key;
    
    // Handle file upload (if image is uploaded as file)
    let finalImageUrl = image || imageUrl;
    if (req.file) {
      // Upload file to Firebase Storage (multer single file)
      console.log('📤 Uploading image to Firebase:', req.file.originalname);
      finalImageUrl = await uploadImageToFirebase(req.file.buffer, 'calculation-types', req.file.originalname);
      console.log('✅ Image uploaded:', finalImageUrl);
    } else if (image && image.startsWith('data:image/')) {
      // Handle base64 image
      console.log('📤 Uploading base64 image to Firebase');
      finalImageUrl = await uploadImageToFirebase(image, 'calculation-types', 'image.jpg');
      console.log('✅ Base64 image uploaded:', finalImageUrl);
    }

    // Convert form-data strings to appropriate types
    const parsedSortOrder = sortOrder ? parseInt(sortOrder) : 0;
    const parsedIsActive = isActive !== undefined ? (isActive === 'true' || isActive === true) : true;

    // Validate required fields
    if (!key || !name) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('KEY_AND_NAME_REQUIRED', errorMessageService.getLocaleFromRequest(req))
      });
    }

    if (!finalImageUrl) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('IMAGE_REQUIRED', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Check if choose-type with this key already exists in wall's chooseTypes array
    if (parentCalculationType.chooseTypes && parentCalculationType.chooseTypes.some(ct => ct.key === key)) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('CALCULATION_TYPE_EXISTS', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Initialize chooseTypes array if it doesn't exist
    if (!parentCalculationType.chooseTypes) {
      parentCalculationType.chooseTypes = [];
    }

    // Create new choose-type object
    const newChooseType = {
      key,
      name,
      imageUrl: finalImageUrl,
      description,
      sortOrder: parsedSortOrder,
      isActive: parsedIsActive,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add choose-type to wall's chooseTypes array
    parentCalculationType.chooseTypes.push(newChooseType);
    await parentCalculationType.save();

    res.status(201).json({
      success: true,
      message: errorMessageService.getMessage('CALCULATION_TYPE_CREATED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        type: parentCalculationType,
        chooseType: newChooseType
      }
    });
  } catch (error) {
    console.error('Create calculation type error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Update calculation type
// @route   PUT /api/calculations/types/:id
// @access  Admin
const updateCalculationType = async (req, res) => {
  try {
    const { name, imageUrl, description, isActive, sortOrder } = req.body;

    const type = await CalculationType.findById(req.params.id);

    if (!type) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('CALCULATION_TYPE_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Update fields
    if (name !== undefined) type.name = name;
    if (imageUrl !== undefined) type.imageUrl = imageUrl;
    if (description !== undefined) type.description = description;
    if (isActive !== undefined) type.isActive = isActive;
    if (sortOrder !== undefined) type.sortOrder = sortOrder;

    await type.save();

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('CALCULATION_TYPE_UPDATED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        type
      }
    });
  } catch (error) {
    console.error('Update calculation type error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Delete calculation type
// @route   DELETE /api/calculations/types/:id
// @access  Admin
const deleteCalculationType = async (req, res) => {
  try {
    const type = await CalculationType.findById(req.params.id);

    if (!type) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('CALCULATION_TYPE_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    await CalculationType.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('CALCULATION_TYPE_DELETED', errorMessageService.getLocaleFromRequest(req))
    });
  } catch (error) {
    console.error('Delete calculation type error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Update calculation type by key
// @route   PUT /api/calculations/:type/choose-types
// @access  Admin
const updateCalculationTypeByKey = async (req, res) => {
  try {
    const { type } = req.params;
    const { key, name, image, imageUrl, description, isActive, sortOrder } = req.body;
    
    console.log('🔍 Update Choose-Type - Request Body:', req.body);
    console.log('🔍 Update Choose-Type - File:', req.file);
    
    // Find the parent calculation type (e.g., "wall")
    const parentCalculationType = await CalculationType.findOne({ 
      key: type
    });

    if (!parentCalculationType) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('CALCULATION_TYPE_NOT_FOUND_WITH_KEY_PARAM', errorMessageService.getLocaleFromRequest(req), { key: type })
      });
    }

    // Find the choose-type in the array
    if (!parentCalculationType.chooseTypes || parentCalculationType.chooseTypes.length === 0) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('CALCULATION_TYPE_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    const chooseTypeIndex = parentCalculationType.chooseTypes.findIndex(ct => ct.key === key);
    if (chooseTypeIndex === -1) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('CALCULATION_TYPE_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Handle file upload (if image is uploaded as file)
    let finalImageUrl = image || imageUrl;
    if (req.file) {
      console.log('📤 Uploading image to Firebase:', req.file.originalname);
      finalImageUrl = await uploadImageToFirebase(req.file.buffer, 'calculation-types', req.file.originalname);
      console.log('✅ Image uploaded:', finalImageUrl);
    } else if (image && image.startsWith('data:image/')) {
      console.log('📤 Uploading base64 image to Firebase');
      finalImageUrl = await uploadImageToFirebase(image, 'calculation-types', 'image.jpg');
      console.log('✅ Base64 image uploaded:', finalImageUrl);
    }

    // Convert form-data strings to appropriate types
    const parsedIsActive = isActive !== undefined ? (isActive === 'true' || isActive === true) : undefined;
    const parsedSortOrder = sortOrder ? parseInt(sortOrder) : undefined;

    // Update choose-type in array
    const chooseType = parentCalculationType.chooseTypes[chooseTypeIndex];
    if (name !== undefined) chooseType.name = name;
    if (finalImageUrl !== undefined) chooseType.imageUrl = finalImageUrl;
    if (description !== undefined) chooseType.description = description;
    if (parsedIsActive !== undefined) chooseType.isActive = parsedIsActive;
    if (parsedSortOrder !== undefined) chooseType.sortOrder = parsedSortOrder;
    chooseType.updatedAt = new Date();

    await parentCalculationType.save();

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('CALCULATION_TYPE_UPDATED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        type: parentCalculationType,
        chooseType: chooseType
      }
    });
  } catch (error) {
    console.error('Update calculation type by key error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Delete calculation type by key
// @route   DELETE /api/calculations/:type/choose-types
// @access  Admin
const deleteCalculationTypeByKey = async (req, res) => {
  try {
    const { type } = req.params;
    const { key } = req.body;

    // Find the parent calculation type (e.g., "wall")
    const parentCalculationType = await CalculationType.findOne({ 
      key: type
    });

    if (!parentCalculationType) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('CALCULATION_TYPE_NOT_FOUND_WITH_KEY_PARAM', errorMessageService.getLocaleFromRequest(req), { key: type })
      });
    }

    // Find the choose-type in the array
    if (!parentCalculationType.chooseTypes || parentCalculationType.chooseTypes.length === 0) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('CALCULATION_TYPE_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    const chooseTypeIndex = parentCalculationType.chooseTypes.findIndex(ct => ct.key === key);
    if (chooseTypeIndex === -1) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('CALCULATION_TYPE_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Remove choose-type from array
    parentCalculationType.chooseTypes.splice(chooseTypeIndex, 1);
    await parentCalculationType.save();

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('CALCULATION_TYPE_DELETED', errorMessageService.getLocaleFromRequest(req))
    });
  } catch (error) {
    console.error('Delete calculation type by key error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

module.exports = {
  getCalculationTypes,
  getCalculationTypeById,
  createCalculationType,
  updateCalculationType,
  deleteCalculationType,
  updateCalculationTypeByKey,
  deleteCalculationTypeByKey
};

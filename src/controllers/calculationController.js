const Calculation = require('../models/Calculation');
const Material = require('../models/Material');
const CalculationType = require('../models/CalculationType');
const errorMessageService = require('../services/errorMessageService');
const { uploadImageToFirebase } = require('../config/firebase');

// @desc    Get calculation types
// @route   GET /api/calculations/types
// @access  Private
const getCalculationTypes = async (req, res) => {
  try {
    const types = await CalculationType.find({}).sort('sortOrder');

    // Check if user is premium member
    const userIsPremium = req.user.isPremiumMember();

    // Add accessibility info to each type
    const typesWithAccess = types.map(type => ({
      _id: type._id,
      calculationType: type.calculationType,
      key: type.key,
      name: type.name,
      description: type.description,
      icon: type.icon,
      imageUrl: type.imageUrl,
      isPremium: type.isPremium,
      isActive: type.isActive,
      sortOrder: type.sortOrder,
      isAccessible: !type.isPremium || userIsPremium, // User can access if not premium OR user is premium
      requiresUpgrade: type.isPremium && !userIsPremium, // Show upgrade prompt
      createdAt: type.createdAt,
      updatedAt: type.updatedAt
    }));

    res.status(200).json({
      success: true,
      data: {
        types: typesWithAccess,
        userIsPremium
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

// @desc    Create calculation type (Admin only)
// @route   POST /api/calculations/types
// @access  Admin
const createCalculationType = async (req, res) => {
  try {
    const { calculationType, key, name, description, icon, imageUrl, isPremium, isActive, sortOrder } = req.body;
    
    console.log('🔍 Create Calculation Type - Request Body:', req.body);
    console.log('🔍 Create Calculation Type - File:', req.file);
    
    // Handle file upload (if image is uploaded as file)
    let finalImageUrl = imageUrl;
    if (req.file) {
      // Upload file to Firebase Storage (multer single file)
      console.log('📤 Uploading image to Firebase:', req.file.originalname);
      finalImageUrl = await uploadImageToFirebase(req.file.buffer, 'calculation-types', req.file.originalname);
      console.log('✅ Image uploaded:', finalImageUrl);
    } else if (req.body.image && req.body.image.startsWith('data:image/')) {
      // Handle base64 image
      console.log('📤 Uploading base64 image to Firebase');
      finalImageUrl = await uploadImageToFirebase(req.body.image, 'calculation-types', 'image.jpg');
      console.log('✅ Base64 image uploaded:', finalImageUrl);
    }

    // Convert form-data strings to appropriate types
    const parsedIsActive = isActive === 'true' || isActive === true;
    const parsedSortOrder = sortOrder ? parseInt(sortOrder) : 999;
    const parsedIsPremium = isPremium === 'true' || isPremium === true;

    // Validate required fields
    if (!key || !name || !finalImageUrl) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('KEY_NAME_IMAGE_REQUIRED', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Check if type already exists
    const existingType = await CalculationType.findOne({ key });

    if (existingType) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('CALCULATION_TYPE_EXISTS', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Create new calculation type
    const newType = await CalculationType.create({
      calculationType: calculationType || key,
      key,
      name,
      description,
      icon,
      imageUrl: finalImageUrl,
      isPremium: parsedIsPremium,
      isActive: parsedIsActive,
      sortOrder: parsedSortOrder
    });

    res.status(201).json({
      success: true,
      message: errorMessageService.getMessage('CALCULATION_TYPE_CREATED_SUCCESS', errorMessageService.getLocaleFromRequest(req)),
      data: {
        type: newType
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

// @desc    Update calculation type (Admin only)
// @route   PUT /api/calculations/types
// @access  Admin
const updateCalculationType = async (req, res) => {
  try {
    const { key, name, description, icon, imageUrl, isPremium, isActive, sortOrder } = req.body;
    
    console.log('🔍 Update Calculation Type - Request Body:', req.body);
    console.log('🔍 Update Calculation Type - File:', req.file);
    
    // Handle file upload (if image is uploaded as file)
    let finalImageUrl = imageUrl;
    if (req.file) {
      // Upload file to Firebase Storage (multer single file)
      console.log('📤 Uploading image to Firebase:', req.file.originalname);
      finalImageUrl = await uploadImageToFirebase(req.file.buffer, 'calculation-types', req.file.originalname);
      console.log('✅ Image uploaded:', finalImageUrl);
    } else if (req.body.image && req.body.image.startsWith('data:image/')) {
      // Handle base64 image
      console.log('📤 Uploading base64 image to Firebase');
      finalImageUrl = await uploadImageToFirebase(req.body.image, 'calculation-types', 'image.jpg');
      console.log('✅ Base64 image uploaded:', finalImageUrl);
    }

    // Convert form-data strings to appropriate types
    const parsedIsActive = isActive !== undefined ? (isActive === 'true' || isActive === true) : undefined;
    const parsedSortOrder = sortOrder ? parseInt(sortOrder) : undefined;
    const parsedIsPremium = isPremium !== undefined ? (isPremium === 'true' || isPremium === true) : undefined;

    console.log('🔍 Parsed values:');
    console.log('  - isPremium:', isPremium, '→', parsedIsPremium);
    console.log('  - isActive:', isActive, '→', parsedIsActive);
    console.log('  - sortOrder:', sortOrder, '→', parsedSortOrder);

    // Find the calculation type by key
    const existingType = await CalculationType.findOne({ key });

    if (!existingType) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('CALCULATION_TYPE_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    console.log('🔍 Existing type:', {
      isPremium: existingType.isPremium,
      isActive: existingType.isActive,
      sortOrder: existingType.sortOrder
    });

    // Build update object - only include fields that are provided
    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (description !== undefined) updateFields.description = description;
    if (icon !== undefined) updateFields.icon = icon;
    if (finalImageUrl !== undefined) updateFields.imageUrl = finalImageUrl;
    if (parsedIsPremium !== undefined) updateFields.isPremium = parsedIsPremium;
    if (parsedIsActive !== undefined) updateFields.isActive = parsedIsActive;
    if (parsedSortOrder !== undefined) updateFields.sortOrder = parsedSortOrder;

    console.log('🔍 Update fields:', updateFields);

    // Update the calculation type
    const updatedType = await CalculationType.findByIdAndUpdate(
      existingType._id,
      updateFields,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('CALCULATION_TYPE_UPDATED_SUCCESS', errorMessageService.getLocaleFromRequest(req)),
      data: {
        type: updatedType
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

// @desc    Delete calculation type (Admin only)
// @route   DELETE /api/calculations/types
// @access  Admin
const deleteCalculationType = async (req, res) => {
  try {
    const { key } = req.body;

    // Find the calculation type by key
    const existingType = await CalculationType.findOne({ key });

    if (!existingType) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('CALCULATION_TYPE_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Delete the calculation type
    await CalculationType.findByIdAndDelete(existingType._id);

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('CALCULATION_TYPE_DELETED_SUCCESS', errorMessageService.getLocaleFromRequest(req))
    });
  } catch (error) {
    console.error('Delete calculation type error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// Calculation helper functions
const calculateArea = (length, width) => length * width;
const calculateVolume = (length, width, height) => length * width * height;
const calculatePerimeter = (length, width) => 2 * (length + width);

const applyWastePercentage = (quantity, wastePercentage = 10) => {
  return quantity * (1 + wastePercentage / 100);
};

// Helper functions for new calculation structure
const calculateAreaFromInputs = (selectedShapeModel, selectedThicknessModel) => {
  // Basic area calculation - can be extended based on shape model
  // For now, return a default calculation
  return 50; // Default area in m2
};

const calculatePerimeterFromInputs = (selectedShapeModel) => {
  // Basic perimeter calculation - can be extended based on shape model
  // For now, return a default calculation
  return 30; // Default perimeter in m
};

// Helper function to calculate ingredients
const calculateIngredients = (material, calculatedVolume, calculatedArea, calculationType) => {
  const ingredientCalculations = [];
  
  if (!material.ingredients || material.ingredients.length === 0) {
    return ingredientCalculations;
  }

  material.ingredients.forEach(ingredient => {
    let baseValue = calculatedVolume; // Default to volume calculation
    
    // For certain calculation types, use area instead of volume
    if (calculationType === 'floor_tiles' || calculationType === 'wall_decoration') {
      baseValue = calculatedArea;
    }

    // Calculate required amount based on percentage
    const requiredAmount = baseValue * (ingredient.requiredPercent / 100);
    const totalCost = requiredAmount * ingredient.costPerM3;

    ingredientCalculations.push({
      type: 'ingredient',
      name: ingredient.name,
      quantity: Math.round(requiredAmount * 100) / 100, // Round to 2 decimals
      unit: ingredient.unit,
      unitPrice: ingredient.costPerM3,
      totalPrice: Math.round(totalCost * 100) / 100,
      parentMaterial: material.name,
      description: `Required for ${material.name}`,
      percentage: ingredient.requiredPercent
    });
  });

  return ingredientCalculations;
};

// @desc    Calculate materials for any type
// @route   POST /api/calculations
// @access  Private
const calculate = async (req, res) => {
  try {
    const { 
      selectedTypeModel,
      selectedShapeModel,
      selectedMaterialModel,
      selectedThicknessModel,
      calculationCustomModel,
      totalPrice,
      totalVolume,
      totalArea,
      materialItemCount,
      doorList = [],
      windowList = [],
      ingCalcModelList = [],
      blockLength,
      blockWidth,
      blockHeight,
      blockThickness
    } = req.body;
    
    // Extract block dimensions from calculationCustomModel if provided, otherwise use direct values
    const finalBlockLength = calculationCustomModel?.blockLength || blockLength;
    const finalBlockWidth = calculationCustomModel?.blockWidth || blockWidth;
    const finalBlockHeight = calculationCustomModel?.blockHeight || blockHeight;
    const finalBlockThickness = calculationCustomModel?.blockThickness || blockThickness;

    // Extract calculation type from selectedTypeModel (with safety check)
    const calculationType = selectedTypeModel?.calculationType || selectedTypeModel?.key || 'wall';

    // Check premium requirements from database
    const calculationTypeDoc = await CalculationType.findOne({ 
      $or: [
        { key: calculationType },
        { calculationType: calculationType }
      ]
    });

    if (calculationTypeDoc && calculationTypeDoc.isPremium && !req.user.isPremiumMember()) {
      return res.status(403).json({
        success: false,
        message: errorMessageService.getMessage('PREMIUM_REQUIRED', errorMessageService.getLocaleFromRequest(req)),
        data: {
          calculationType: calculationTypeDoc.name,
          isPremium: true,
          userIsPremium: req.user.isPremiumMember()
        },
        code: 'PREMIUM_REQUIRED'
      });
    }

    // Normalize doorList and windowList: convert height to length if length is not provided
    const normalizedDoorList = (doorList || []).map(door => ({
      width: door.width,
      length: door.length !== undefined && door.length !== null ? door.length : (door.height !== undefined && door.height !== null ? door.height : door.length)
    }));
    
    const normalizedWindowList = (windowList || []).map(window => ({
      width: window.width,
      length: window.length !== undefined && window.length !== null ? window.length : (window.height !== undefined && window.height !== null ? window.height : window.length)
    }));

    // Use totalArea if provided, otherwise use totalVolume
    // Validation ensures only one is provided (not both), but null values are allowed
    const finalTotalArea = totalArea !== undefined && totalArea !== null ? parseFloat(totalArea) : null;
    const finalTotalVolume = totalVolume !== undefined && totalVolume !== null ? parseFloat(totalVolume) : null;
    
    // Ensure at least one is provided (not both null)
    if (finalTotalArea === null && finalTotalVolume === null) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('EITHER_TOTAL_AREA_OR_VOLUME_REQUIRED', errorMessageService.getLocaleFromRequest(req)),
        errors: [{
          msg: errorMessageService.getMessage('EITHER_TOTAL_AREA_OR_VOLUME_REQUIRED', errorMessageService.getLocaleFromRequest(req)),
          param: 'totalArea',
          location: 'body'
        }]
      });
    }
    
    // Validate that the provided value is a positive number
    if (finalTotalArea !== null && (isNaN(finalTotalArea) || finalTotalArea <= 0)) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('TOTAL_AREA_MUST_BE_POSITIVE', errorMessageService.getLocaleFromRequest(req)),
        errors: [{
          msg: errorMessageService.getMessage('TOTAL_AREA_MUST_BE_POSITIVE', errorMessageService.getLocaleFromRequest(req)),
          param: 'totalArea',
          location: 'body'
        }]
      });
    }
    
    if (finalTotalVolume !== null && (isNaN(finalTotalVolume) || finalTotalVolume <= 0)) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('TOTAL_VOLUME_MUST_BE_POSITIVE', errorMessageService.getLocaleFromRequest(req)),
        errors: [{
          msg: errorMessageService.getMessage('TOTAL_VOLUME_MUST_BE_POSITIVE', errorMessageService.getLocaleFromRequest(req)),
          param: 'totalVolume',
          location: 'body'
        }]
      });
    }

    // Create calculation results based on the provided data
    const calculation = {
      area: finalTotalArea !== null ? finalTotalArea : calculateAreaFromInputs(selectedShapeModel, selectedThicknessModel),
      volume: finalTotalVolume,
      perimeter: calculatePerimeterFromInputs(selectedShapeModel),
      
      materials: selectedMaterialModel ? [{
        materialId: selectedMaterialModel._id,
        quantity: materialItemCount || 0,
        unit: selectedMaterialModel.unit || 'piece',
        unitPrice: selectedMaterialModel.price || 0,
        totalPrice: (selectedMaterialModel.price || 0) * (materialItemCount || 0),
        type: 'main_material',
        name: selectedMaterialModel.name || 'Unknown Material'
      }] : [],
      
      // Add ingredient calculations
      ingredients: (ingCalcModelList || []).map(ingredient => {
        // If calculationCustomModel exists, use it for parentMaterial, otherwise use selectedMaterialModel
        const parentMaterialName = calculationCustomModel 
          ? (selectedMaterialModel?.name || selectedTypeModel?.name || 'Custom Material')
          : (selectedMaterialModel?.name || 'Custom Material');
        
        return {
          type: 'ingredient',
          name: ingredient.name,
          quantity: ingredient.amount,
          unit: ingredient.unit,
          unitPrice: ingredient.price / ingredient.amount,
          totalPrice: ingredient.price,
          parentMaterial: parentMaterialName,
          description: `Required for ${parentMaterialName}`
        };
      }),
      
      totalArea: finalTotalArea,
      totalVolume: finalTotalVolume,
      totalMaterialCost: totalPrice,
      estimatedLaborCost: totalPrice * 0.3, // 30% labor cost
      totalCost: totalPrice * 1.3, // Total + 30% labor
      
      openings: {
        windows: { 
          area: normalizedWindowList.reduce((total, window) => total + (window.width * window.length), 0),
          count: normalizedWindowList.length 
        },
        doors: { 
          area: normalizedDoorList.reduce((total, door) => total + (door.width * door.length), 0),
          count: normalizedDoorList.length 
        }
      }
    };

    // Save calculation to database with new structure
    const calculationDoc = new Calculation({
      userId: req.user._id,
      type: calculationType,
      inputs: {
        selectedTypeModel,
        selectedShapeModel,
        selectedMaterialModel,
        selectedThicknessModel,
        totalPrice,
        totalVolume: finalTotalVolume,
        totalArea: finalTotalArea,
        materialItemCount,
        doorList: normalizedDoorList,
        windowList: normalizedWindowList,
        ingCalcModelList,
        calculationCustomModel,
        blockLength: finalBlockLength,
        blockWidth: finalBlockWidth,
        blockHeight: finalBlockHeight,
        blockThickness: finalBlockThickness,
        imageUrl: selectedMaterialModel?.images && selectedMaterialModel.images[0] || selectedMaterialModel?.imageUrl || calculationCustomModel?.imageUrl || selectedTypeModel?.imageUrl || null
      },
      results: calculation
    });

    await calculationDoc.save();

    // Determine message based on calculation type
    const locale = errorMessageService.getLocaleFromRequest(req);
    const typeMessages = {
      'wall': errorMessageService.getMessage('WALL_CALCULATION_COMPLETED', locale),
      'fundament': errorMessageService.getMessage('FOUNDATION_CALCULATION_COMPLETED', locale),
      'roof': errorMessageService.getMessage('ROOF_CALCULATION_COMPLETED', locale),
      'inner_wall': errorMessageService.getMessage('WALL_CALCULATION_COMPLETED', locale),
      'underfloor': errorMessageService.getMessage('FLOOR_CALCULATION_COMPLETED', locale),
      'floor_tiles': errorMessageService.getMessage('FLOOR_CALCULATION_COMPLETED', locale),
      'wall_decoration': errorMessageService.getMessage('WALL_DECORATION_CALCULATION_COMPLETED', locale)
    };

    const message = typeMessages[calculationType] || errorMessageService.getMessage('CALCULATION_COMPLETED', locale);

    res.status(200).json({
      success: true,
      message,
      data: {
        calculation: {
          id: calculationDoc._id,
          type: calculationType,
          inputs: {
            totalPrice,
            totalVolume: finalTotalVolume,
            totalArea: finalTotalArea,
            materialItemCount
          },
          results: {
            totalArea: calculation.totalArea,
            totalVolume: calculation.totalVolume,
            totalMaterialCost: calculation.totalMaterialCost,
            totalCost: calculation.totalCost
          }
        }
      }
    });

  } catch (error) {
    console.error('Calculate error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// Helper functions for each calculation type
const performWallCalculation = async (inputs) => {
  const { length, width, height, thickness, windows = [], doors = [], materialType, wastePercentage = 10 } = inputs;

  if (!length || !width || !height) {
    throw new Error('Length, width, and height are required');
  }

  const wallArea = calculatePerimeter(length, width) * height;
  const windowsArea = windows.reduce((total, window) => 
    total + (window.width * window.height * (window.count || 1)), 0);
  const doorsArea = doors.reduce((total, door) => 
    total + (door.width * door.height * (door.count || 1)), 0);
  
  const netWallArea = wallArea - windowsArea - doorsArea;
  const wallVolume = netWallArea * (thickness || 0.25);

  let materials = [];
  let totalMaterialCost = 0;

  if (materialType && materialType !== 'custom') {
    const material = await Material.findOne({ 
      category: 'wall', 
      subcategory: materialType,
      isActive: true 
    });

    if (material) {
      let quantity;
      switch (material.price.unit) {
        case 'm2':
          quantity = applyWastePercentage(netWallArea, wastePercentage);
          break;
        case 'm3':
          quantity = applyWastePercentage(wallVolume, wastePercentage);
          break;
        case 'piece':
          quantity = Math.ceil(applyWastePercentage(netWallArea * 50, wastePercentage));
          break;
        default:
          quantity = applyWastePercentage(netWallArea, wastePercentage);
      }

      const totalPrice = quantity * material.price.amount;
      totalMaterialCost += totalPrice;

      materials.push({
        materialId: material._id,
        quantity: Math.ceil(quantity),
        unit: material.price.unit,
        unitPrice: material.price.amount,
        totalPrice,
        type: 'main_material',
        name: material.name
      });

      // Calculate ingredients for this material
      const ingredients = calculateIngredients(material, wallVolume, netWallArea, 'wall');
      ingredients.forEach(ingredient => {
        materials.push(ingredient);
        totalMaterialCost += ingredient.totalPrice;
      });
    }
  }

  const estimatedLaborCost = totalMaterialCost * 0.3;
  const totalCost = totalMaterialCost + estimatedLaborCost;

  return {
    area: netWallArea,
    volume: wallVolume,
    perimeter: calculatePerimeter(length, width),
    materials,
    totalArea: netWallArea,
    totalVolume: wallVolume,
    totalMaterialCost,
    estimatedLaborCost,
    totalCost,
    openings: {
      windows: { area: windowsArea, count: windows.length },
      doors: { area: doorsArea, count: doors.length }
    }
  };
};

const performFundamentCalculation = async (inputs) => {
  const { length, width, height, materialType, wastePercentage = 10 } = inputs;

  if (!length || !width || !height) {
    throw new Error('Length, width, and height are required');
  }

  const volume = calculateVolume(length, width, height);
  const area = calculateArea(length, width);

  let materials = [];
  let totalMaterialCost = 0;

  if (materialType && materialType !== 'custom') {
    const material = await Material.findOne({ 
      category: 'fundament', 
      subcategory: materialType,
      isActive: true 
    });

    if (material) {
      const quantity = applyWastePercentage(volume, wastePercentage);
      const totalPrice = quantity * material.price.amount;
      totalMaterialCost += totalPrice;

      materials.push({
        materialId: material._id,
        quantity: Math.ceil(quantity),
        unit: material.price.unit,
        unitPrice: material.price.amount,
        totalPrice
      });
    }
  }

  const estimatedLaborCost = totalMaterialCost * 0.4;
  const totalCost = totalMaterialCost + estimatedLaborCost;

  return {
    area,
    volume,
    materials,
    totalArea: area,
    totalVolume: volume,
    totalMaterialCost,
    estimatedLaborCost,
    totalCost
  };
};

const performRoofCalculation = async (inputs) => {
  const { length, width, shape = 'triangle', materialType, wastePercentage = 15 } = inputs;

  if (!length || !width) {
    throw new Error('Length and width are required');
  }

  let roofArea;
  switch (shape) {
    case 'triangle':
      roofArea = length * width * 0.5;
      break;
    case 'flat':
      roofArea = length * width;
      break;
    case 'gable':
      roofArea = length * width * 1.2; // 20% more for gable roof
      break;
    default:
      roofArea = length * width;
  }

  let materials = [];
  let totalMaterialCost = 0;

  if (materialType && materialType !== 'custom') {
    const material = await Material.findOne({ 
      category: 'roof', 
      subcategory: materialType,
      isActive: true 
    });

    if (material) {
      const quantity = applyWastePercentage(roofArea, wastePercentage);
      const totalPrice = quantity * material.price.amount;
      totalMaterialCost += totalPrice;

      materials.push({
        materialId: material._id,
        quantity: Math.ceil(quantity),
        unit: material.price.unit,
        unitPrice: material.price.amount,
        totalPrice,
        type: 'main_material',
        name: material.name
      });

      // Calculate ingredients for roof (basalt, insulation, etc.)
      const ingredients = calculateIngredients(material, roofArea * 0.05, roofArea, 'roof'); // Small volume for roof materials
      ingredients.forEach(ingredient => {
        materials.push(ingredient);
        totalMaterialCost += ingredient.totalPrice;
      });
    }
  }

  const estimatedLaborCost = totalMaterialCost * 0.5; // Roof work is more labor-intensive
  const totalCost = totalMaterialCost + estimatedLaborCost;

  return {
    area: roofArea,
    shape,
    materials,
    totalArea: roofArea,
    totalMaterialCost,
    estimatedLaborCost,
    totalCost
  };
};

// Placeholder functions for other calculation types
const performInnerWallCalculation = async (inputs) => {
  // Similar to wall calculation but for inner walls
  return performWallCalculation(inputs);
};

const performUnderfloorCalculation = async (inputs) => {
  const { length, width, thickness = 0.1, materialType, wastePercentage = 10 } = inputs;
  
  if (!length || !width) {
    throw new Error('Length and width are required');
  }

  const area = calculateArea(length, width);
  const volume = area * thickness;

  let materials = [];
  let totalMaterialCost = 0;

  if (materialType && materialType !== 'custom') {
    const material = await Material.findOne({ 
      category: 'underfloor', 
      subcategory: materialType,
      isActive: true 
    });

    if (material) {
      const quantity = applyWastePercentage(volume, wastePercentage);
      const totalPrice = quantity * material.price.amount;
      totalMaterialCost += totalPrice;

      materials.push({
        materialId: material._id,
        quantity: Math.ceil(quantity),
        unit: material.price.unit,
        unitPrice: material.price.amount,
        totalPrice
      });
    }
  }

  const estimatedLaborCost = totalMaterialCost * 0.3;
  const totalCost = totalMaterialCost + estimatedLaborCost;

  return {
    area,
    volume,
    materials,
    totalArea: area,
    totalVolume: volume,
    totalMaterialCost,
    estimatedLaborCost,
    totalCost
  };
};

const performFloorTilesCalculation = async (inputs) => {
  const { length, width, tileSize = 0.3, materialType, wastePercentage = 15 } = inputs;
  
  if (!length || !width) {
    throw new Error('Length and width are required');
  }

  const area = calculateArea(length, width);
  const tileArea = tileSize * tileSize;
  const numberOfTiles = Math.ceil(area / tileArea);

  let materials = [];
  let totalMaterialCost = 0;

  if (materialType && materialType !== 'custom') {
    const material = await Material.findOne({ 
      category: 'floor_tiles', 
      subcategory: materialType,
      isActive: true 
    });

    if (material) {
      const quantity = applyWastePercentage(numberOfTiles, wastePercentage);
      const totalPrice = quantity * material.price.amount;
      totalMaterialCost += totalPrice;

      materials.push({
        materialId: material._id,
        quantity: Math.ceil(quantity),
        unit: material.price.unit,
        unitPrice: material.price.amount,
        totalPrice,
        type: 'main_material',
        name: material.name
      });

      // Calculate ingredients for floor tiles (adhesive, grout, etc.)
      const ingredients = calculateIngredients(material, area * 0.01, area, 'floor_tiles'); // Minimal volume for tiles
      ingredients.forEach(ingredient => {
        materials.push(ingredient);
        totalMaterialCost += ingredient.totalPrice;
      });
    }
  }

  const estimatedLaborCost = totalMaterialCost * 0.4;
  const totalCost = totalMaterialCost + estimatedLaborCost;

  return {
    area,
    numberOfTiles,
    tileSize,
    materials,
    totalArea: area,
    totalMaterialCost,
    estimatedLaborCost,
    totalCost
  };
};

const performWallDecorationCalculation = async (inputs) => {
  const { length, width, height, materialType, wastePercentage = 10 } = inputs;
  
  if (!length || !width || !height) {
    throw new Error('Length, width, and height are required');
  }

  const area = calculatePerimeter(length, width) * height;

  let materials = [];
  let totalMaterialCost = 0;

  if (materialType && materialType !== 'custom') {
    const material = await Material.findOne({ 
      category: 'wall_decoration', 
      subcategory: materialType,
      isActive: true 
    });

    if (material) {
      const quantity = applyWastePercentage(area, wastePercentage);
      const totalPrice = quantity * material.price.amount;
      totalMaterialCost += totalPrice;

      materials.push({
        materialId: material._id,
        quantity: Math.ceil(quantity),
        unit: material.price.unit,
        unitPrice: material.price.amount,
        totalPrice
      });
    }
  }

  const estimatedLaborCost = totalMaterialCost * 0.5;
  const totalCost = totalMaterialCost + estimatedLaborCost;

  return {
    area,
    materials,
    totalArea: area,
    totalMaterialCost,
    estimatedLaborCost,
    totalCost
  };
};

// @desc    Get calculation history
// @route   GET /api/calculations/history
// @access  Private
const getHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const type = req.query.type;
    const isBookmarked = req.query.bookmarked === 'true';
    
    // Check if user is admin
    const isAdmin = req.accountType === 'admin'; // dashboard account
    
    // Build query based on admin status
    let query = {};
    if (!isAdmin) {
      // Regular users can only see their own calculations
      query.userId = req.user._id;
    }
    
    // Add filters
    if (type) query.type = type;
    if (isBookmarked !== undefined) query.isBookmarked = isBookmarked;

    const calculations = await Calculation.find(query)
      .populate('userId', 'phone username')
      .sort('-createdAt')
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Calculation.countDocuments(query);

    // Process calculations to include new model data
    const processedCalculations = calculations.map(calc => {
      const calcObj = calc.toObject();
      
      // Extract data from new model structure if available
      let materialName = 'Unknown Material';
      let materialImageUrl = null;
      let typeName = calcObj.type;
      let shapeInfo = null;
      let thicknessInfo = null;
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
      
      if (calcObj.inputs && calcObj.inputs.selectedShapeModel) {
        shapeInfo = {
          name: calcObj.inputs.selectedShapeModel.name,
          description: calcObj.inputs.selectedShapeModel.description,
          imageUrl: calcObj.inputs.selectedShapeModel.imageUrl
        };
      }
      
      if (calcObj.inputs && calcObj.inputs.selectedThicknessModel) {
        thicknessInfo = {
          name: calcObj.inputs.selectedThicknessModel.name,
          thickness: calcObj.inputs.selectedThicknessModel.thickness,
          unit: calcObj.inputs.selectedThicknessModel.unit
        };
      }
      
      // Fallback to legacy mappings if new structure doesn't exist
      if (materialName === 'Unknown Material') {
        const legacyMaterialNames = {
          'wall': 'Brick',
          'fundament': 'Concrete Foundation',
          'roof': 'Roof Tiles',
          'inner_wall': 'Gypsum Board',
          'underfloor': 'Insulation',
          'floor_tiles': 'Parket',
          'wall_decoration': 'Paint'
        };
        materialName = legacyMaterialNames[calcObj.type] || 'Unknown Material';
      }
      
      if (!materialImageUrl) {
        const legacyImageUrls = {
          'Brick': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop',
          'Concrete Foundation': 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&h=300&fit=crop',
          'Roof Tiles': 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&h=300&fit=crop',
          'Gypsum Board': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
          'Insulation': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop',
          'Parket': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
          'Paint': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop'
        };
        materialImageUrl = legacyImageUrls[materialName];
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
      
      // Remove userId and add processed data
      const { userId, ...calcWithoutUserId } = calcObj;
      
      // Format ingCalcModelList to match materials endpoint ingredient structure
      let formattedIngredients = null;
      if (calcObj.inputs?.ingCalcModelList && Array.isArray(calcObj.inputs.ingCalcModelList) && calcObj.inputs.ingCalcModelList.length > 0) {
        formattedIngredients = calcObj.inputs.ingCalcModelList.map(ingredient => {
          // Get percentValue
          const percentValue = ingredient.percentValue !== undefined && ingredient.percentValue !== null 
            ? ingredient.percentValue 
            : (ingredient.requiredPercent !== undefined && ingredient.requiredPercent !== null 
              ? ingredient.requiredPercent 
              : null);
          
          // Calculate unit price based on amount
          const unitPrice = ingredient.amount && ingredient.amount > 0 
            ? ingredient.price / ingredient.amount 
            : 0;
          
          // Build ingredient object matching materials endpoint format
          const formattedIngredient = {
            _id: ingredient._id || null, // Include _id if available
            name: ingredient.name,
            unit: ingredient.unit,
            percentValue: percentValue
          };
          
          // Add price field based on unit type (matching materials endpoint format)
          if (ingredient.unit === 'm3') {
            formattedIngredient.pricePerM3 = unitPrice;
          } else if (ingredient.unit === 'm2') {
            formattedIngredient.pricePerM2 = unitPrice;
          } else {
            // For percentage type or other units, use priceForPer1Percent
            formattedIngredient.priceForPer1Percent = unitPrice;
          }
          
          return formattedIngredient;
        });
      }
      
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
      
      return {
        ...calcWithoutUserId,
        typeName: typeNames[calcObj.type] || typeName,
        materialName,
        materialImageUrl,
        shapeInfo,
        thicknessInfo,
        // Format inputs.ingCalcModelList to include percentValue and convert length to height for response
        inputs: {
          ...calcObj.inputs,
          ingCalcModelList: formattedIngredients || calcObj.inputs?.ingCalcModelList,
          doorList: responseDoorList || calcObj.inputs?.doorList,
          windowList: responseWindowList || calcObj.inputs?.windowList
        },
        // Extract summary info from new structure
        summary: {
          totalPrice: calcObj.inputs?.totalPrice || calcObj.results?.totalCost,
          totalVolume: calcObj.inputs?.totalVolume || calcObj.results?.totalVolume,
          totalArea: calcObj.inputs?.totalArea || calcObj.results?.totalArea,
          materialItemCount: calcObj.inputs?.materialItemCount,
          doorCount: responseDoorList?.length || normalizedDoorList?.length || calcObj.inputs?.doorList?.length || calcObj.inputs?.doors?.length || 0,
          windowCount: responseWindowList?.length || normalizedWindowList?.length || calcObj.inputs?.windowList?.length || calcObj.inputs?.windows?.length || 0,
          ingredientCount: calcObj.inputs?.ingCalcModelList?.length || 0
        },
        // Add formatted price
        totalPrice: calcObj.inputs?.totalPrice || calcObj.results?.totalCost || 0
      };
    });

    // Get user info once
    const user = calculations.length > 0 ? {
      _id: calculations[0].userId._id,
      phone: calculations[0].userId.phone,
      username: calculations[0].userId.username,
      displayName: calculations[0].userId.username
    } : null;

    res.status(200).json({
      success: true,
      data: {
        user,
        calculations: processedCalculations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get calculation by ID
// @route   GET /api/calculations/:id
// @access  Private
const getCalculationById = async (req, res) => {
  try {
    const calculation = await Calculation.findById(req.params.id)
      .populate('inputs.materialId')
      .populate('inputs.selectedMaterialModel._id')
      .populate('results.materials.materialId');

    if (!calculation) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('CALCULATION_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Check if user can access this calculation
    if (!calculation.canUserAccess(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: errorMessageService.getMessage('ACCESS_DENIED', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Update last accessed
    await calculation.updateLastAccessed();

    // Process calculation data to include enhanced information
    const calcObj = calculation.toObject();
    
    // Add enhanced data for new model structure
    let enhancedCalculation = { ...calcObj };
    
    if (calcObj.inputs && calcObj.inputs.selectedMaterialModel) {
      enhancedCalculation.materialInfo = {
        name: calcObj.inputs.selectedMaterialModel.name,
        type: calcObj.inputs.selectedMaterialModel.type,
        description: calcObj.inputs.selectedMaterialModel.description,
        price: calcObj.inputs.selectedMaterialModel.price,
        unit: calcObj.inputs.selectedMaterialModel.unit,
        images: calcObj.inputs.selectedMaterialModel.images,
        rating: calcObj.inputs.selectedMaterialModel.rating,
        supplier: calcObj.inputs.selectedMaterialModel.supplier,
        formattedPrice: calcObj.inputs.selectedMaterialModel.formattedPrice,
        costPerUnit: calcObj.inputs.selectedMaterialModel.costPerUnit
      };
    }
    
    if (calcObj.inputs && calcObj.inputs.selectedTypeModel) {
      enhancedCalculation.typeInfo = {
        name: calcObj.inputs.selectedTypeModel.name,
        key: calcObj.inputs.selectedTypeModel.key,
        description: calcObj.inputs.selectedTypeModel.description,
        imageUrl: calcObj.inputs.selectedTypeModel.imageUrl
      };
    }
    
    if (calcObj.inputs && calcObj.inputs.selectedShapeModel) {
      enhancedCalculation.shapeInfo = {
        name: calcObj.inputs.selectedShapeModel.name,
        key: calcObj.inputs.selectedShapeModel.key,
        description: calcObj.inputs.selectedShapeModel.description,
        imageUrl: calcObj.inputs.selectedShapeModel.imageUrl
      };
    }
    
    if (calcObj.inputs && calcObj.inputs.selectedThicknessModel) {
      enhancedCalculation.thicknessInfo = {
        name: calcObj.inputs.selectedThicknessModel.name,
        thickness: calcObj.inputs.selectedThicknessModel.thickness,
        unit: calcObj.inputs.selectedThicknessModel.unit,
        description: calcObj.inputs.selectedThicknessModel.description,
        imageUrl: calcObj.inputs.selectedThicknessModel.imageUrl
      };
    }
    
    // Normalize doorList and windowList: convert height to length if needed
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
    
    // Add calculation summary
    enhancedCalculation.calculationSummary = {
      totalPrice: calcObj.inputs?.totalPrice || calcObj.results?.totalCost,
      totalVolume: calcObj.inputs?.totalVolume || calcObj.results?.totalVolume,
      totalArea: calcObj.inputs?.totalArea || calcObj.results?.totalArea,
      materialItemCount: calcObj.inputs?.materialItemCount,
      doorCount: normalizedDoorList?.length || calcObj.inputs?.doorList?.length || calcObj.inputs?.doors?.length || 0,
      windowCount: normalizedWindowList?.length || calcObj.inputs?.windowList?.length || calcObj.inputs?.windows?.length || 0,
      ingredientCount: calcObj.inputs?.ingCalcModelList?.length || 0,
      formattedPrice: calcObj.inputs?.totalPrice 
        ? `${calcObj.inputs.totalPrice.toLocaleString('tr-TR')} TL`
        : calcObj.results?.totalCost 
          ? `${calcObj.results.totalCost.toLocaleString('tr-TR')} TL`
          : 'N/A'
    };
    
    // Add ingredient details if available (formatted to match materials endpoint structure)
    if (calcObj.inputs && calcObj.inputs.ingCalcModelList && calcObj.inputs.ingCalcModelList.length > 0) {
      enhancedCalculation.ingredientDetails = calcObj.inputs.ingCalcModelList.map(ingredient => {
        // Get percentValue
        const percentValue = ingredient.percentValue !== undefined && ingredient.percentValue !== null 
          ? ingredient.percentValue 
          : (ingredient.requiredPercent !== undefined && ingredient.requiredPercent !== null 
            ? ingredient.requiredPercent 
            : null);
        
        // Calculate unit price based on amount
        const unitPrice = ingredient.amount && ingredient.amount > 0 
          ? ingredient.price / ingredient.amount 
          : 0;
        
        // Build ingredient object matching materials endpoint format
        const formattedIngredient = {
          _id: ingredient._id || null,
          name: ingredient.name,
          unit: ingredient.unit,
          percentValue: percentValue
        };
        
        // Add price field based on unit type
        if (ingredient.unit === 'm3') {
          formattedIngredient.pricePerM3 = unitPrice;
        } else if (ingredient.unit === 'm2') {
          formattedIngredient.pricePerM2 = unitPrice;
        } else {
          formattedIngredient.priceForPer1Percent = unitPrice;
        }
        
        return formattedIngredient;
      });
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
    
    // Add door and window details (using height for response)
    if (responseDoorList && responseDoorList.length > 0) {
      enhancedCalculation.doorDetails = responseDoorList.map((door, index) => ({
        id: index + 1,
        width: door.width,
        height: door.height,
        area: (door.width * door.height).toFixed(2),
        formattedArea: `${(door.width * door.height).toFixed(2)} m²`
      }));
    }
    
    if (responseWindowList && responseWindowList.length > 0) {
      enhancedCalculation.windowDetails = responseWindowList.map((window, index) => ({
        id: index + 1,
        width: window.width,
        height: window.height,
        area: (window.width * window.height).toFixed(2),
        formattedArea: `${(window.width * window.height).toFixed(2)} m²`
      }));
    }
    
    // Update inputs with response doorList and windowList (using height)
    if (responseDoorList || responseWindowList) {
      enhancedCalculation.inputs = {
        ...enhancedCalculation.inputs,
        doorList: responseDoorList || enhancedCalculation.inputs?.doorList,
        windowList: responseWindowList || enhancedCalculation.inputs?.windowList
      };
    }

    res.status(200).json({
      success: true,
      data: {
        calculation: enhancedCalculation
      }
    });
  } catch (error) {
    console.error('Get calculation by ID error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Update calculation
// @route   PUT /api/calculations/:id
// @access  Private
const updateCalculation = async (req, res) => {
  try {
    const { 
      title, 
      notes, 
      projectName, 
      tags,
      // New model fields that can be updated
      selectedMaterialModel,
      selectedThicknessModel,
      totalPrice,
      totalVolume,
      totalArea,
      materialItemCount,
      doorList,
      windowList,
      ingCalcModelList
    } = req.body;
    
    const calculation = await Calculation.findById(req.params.id);

    if (!calculation) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('CALCULATION_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    if (!calculation.canUserAccess(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: errorMessageService.getMessage('ACCESS_DENIED', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Update basic fields
    if (title !== undefined) calculation.title = title;
    if (notes !== undefined) calculation.notes = notes;
    if (projectName !== undefined) calculation.projectName = projectName;
    if (tags !== undefined) calculation.tags = tags;

    // Update new model fields if provided
    if (selectedMaterialModel !== undefined) {
      calculation.inputs.selectedMaterialModel = selectedMaterialModel;
    }
    
    if (selectedThicknessModel !== undefined) {
      calculation.inputs.selectedThicknessModel = selectedThicknessModel;
    }
    
    if (totalPrice !== undefined) {
      calculation.inputs.totalPrice = totalPrice;
      // Update results total cost if calculation uses new structure
      if (calculation.results) {
        calculation.results.totalCost = totalPrice * 1.3; // Include labor cost
        calculation.results.totalMaterialCost = totalPrice;
        calculation.results.estimatedLaborCost = totalPrice * 0.3;
      }
    }
    
    // Update totalVolume or totalArea (only one should be provided)
    if (totalVolume !== undefined) {
      calculation.inputs.totalVolume = totalVolume;
      calculation.inputs.totalArea = null; // Clear totalArea if totalVolume is set
      if (calculation.results) {
        calculation.results.totalVolume = totalVolume;
        calculation.results.totalArea = null;
      }
    }
    
    if (totalArea !== undefined) {
      calculation.inputs.totalArea = totalArea;
      calculation.inputs.totalVolume = null; // Clear totalVolume if totalArea is set
      if (calculation.results) {
        calculation.results.totalArea = totalArea;
        calculation.results.totalVolume = null;
      }
    }
    
    if (materialItemCount !== undefined) {
      calculation.inputs.materialItemCount = materialItemCount;
    }
    
    if (doorList !== undefined) {
      // Normalize doorList: convert height to length if length is not provided
      const normalizedDoorList = doorList.map(door => ({
        width: door.width,
        length: door.length !== undefined && door.length !== null ? door.length : (door.height !== undefined && door.height !== null ? door.height : door.length)
      }));
      calculation.inputs.doorList = normalizedDoorList;
      // Update results if needed
      if (calculation.results && calculation.results.openings) {
        calculation.results.openings.doors = {
          area: normalizedDoorList.reduce((total, door) => total + (door.width * door.length), 0),
          count: normalizedDoorList.length
        };
      }
    }
    
    if (windowList !== undefined) {
      // Normalize windowList: convert height to length if length is not provided
      const normalizedWindowList = windowList.map(window => ({
        width: window.width,
        length: window.length !== undefined && window.length !== null ? window.length : (window.height !== undefined && window.height !== null ? window.height : window.length)
      }));
      calculation.inputs.windowList = normalizedWindowList;
      // Update results if needed
      if (calculation.results && calculation.results.openings) {
        calculation.results.openings.windows = {
          area: normalizedWindowList.reduce((total, window) => total + (window.width * window.length), 0),
          count: normalizedWindowList.length
        };
      }
    }
    
    if (ingCalcModelList !== undefined) {
      calculation.inputs.ingCalcModelList = ingCalcModelList;
      // Update results ingredients if needed
      if (calculation.results) {
        calculation.results.ingredients = ingCalcModelList.map(ingredient => ({
          type: 'ingredient',
          name: ingredient.name,
          quantity: ingredient.amount,
          unit: ingredient.unit,
          unitPrice: ingredient.amount > 0 ? ingredient.price / ingredient.amount : 0,
          totalPrice: ingredient.price,
          parentMaterial: calculation.inputs.selectedMaterialModel?.name || 'Unknown',
          description: `Required for ${calculation.inputs.selectedMaterialModel?.name || 'calculation'}`
        }));
      }
    }

    // Update image URL if material changed
    if (selectedMaterialModel && selectedMaterialModel.images && selectedMaterialModel.images.length > 0) {
      calculation.inputs.imageUrl = selectedMaterialModel.images[0];
    }

    await calculation.save();

    // Return enhanced calculation data
    const calcObj = calculation.toObject();
    let enhancedCalculation = { ...calcObj };
    
    // Add enhanced data similar to getCalculationById
    if (calcObj.inputs && calcObj.inputs.selectedMaterialModel) {
      enhancedCalculation.materialInfo = {
        name: calcObj.inputs.selectedMaterialModel.name,
        type: calcObj.inputs.selectedMaterialModel.type,
        description: calcObj.inputs.selectedMaterialModel.description,
        price: calcObj.inputs.selectedMaterialModel.price,
        unit: calcObj.inputs.selectedMaterialModel.unit,
        images: calcObj.inputs.selectedMaterialModel.images,
        formattedPrice: calcObj.inputs.selectedMaterialModel.formattedPrice
      };
    }
    
    // Add calculation summary
    enhancedCalculation.calculationSummary = {
      totalPrice: calcObj.inputs?.totalPrice || calcObj.results?.totalCost,
      totalVolume: calcObj.inputs?.totalVolume || calcObj.results?.totalVolume,
      totalArea: calcObj.inputs?.totalArea || calcObj.results?.totalArea,
      materialItemCount: calcObj.inputs?.materialItemCount,
      doorCount: calcObj.inputs?.doorList?.length || 0,
      windowCount: calcObj.inputs?.windowList?.length || 0,
      ingredientCount: calcObj.inputs?.ingCalcModelList?.length || 0,
      formattedPrice: calcObj.inputs?.totalPrice 
        ? `${calcObj.inputs.totalPrice.toLocaleString('tr-TR')} TL`
        : calcObj.results?.totalCost 
          ? `${calcObj.results.totalCost.toLocaleString('tr-TR')} TL`
          : 'N/A'
    };

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('CALCULATION_UPDATED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        calculation: enhancedCalculation
      }
    });
  } catch (error) {
    console.error('Update calculation error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Delete calculation
// @route   DELETE /api/calculations/:id
// @access  Private (Owner or Admin)
const deleteCalculation = async (req, res) => {
  try {
    const calculation = await Calculation.findById(req.params.id);

    if (!calculation) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('CALCULATION_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Check if user is admin
    const isAdmin = req.accountType === 'admin'; // dashboard account

    // Only owner or admin can delete
    if (!isAdmin && calculation.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: errorMessageService.getMessage('ACCESS_DENIED', errorMessageService.getLocaleFromRequest(req))
      });
    }

    await Calculation.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('CALCULATION_DELETED', errorMessageService.getLocaleFromRequest(req))
    });
  } catch (error) {
    console.error('Delete calculation error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Toggle bookmark
// @route   POST /api/calculations/:id/bookmark
// @access  Private
const toggleBookmark = async (req, res) => {
  try {
    const calculation = await Calculation.findById(req.params.id);

    if (!calculation) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('CALCULATION_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    if (!calculation.canUserAccess(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: errorMessageService.getMessage('ACCESS_DENIED', errorMessageService.getLocaleFromRequest(req))
      });
    }

    await calculation.toggleBookmark();

    // Get basic calculation info for response
    const calcInfo = {
      id: calculation._id,
      type: calculation.type,
      typeName: {
        'wall': 'Wall',
        'fundament': 'Foundation', 
        'roof': 'Roof',
        'inner_wall': 'Inner Wall',
        'underfloor': 'Underfloor',
        'floor_tiles': 'Floor Tiles',
        'wall_decoration': 'Wall Decoration'
      }[calculation.type] || calculation.type,
      materialName: calculation.inputs?.selectedMaterialModel?.name || 'Unknown Material',
      totalPrice: calculation.inputs?.totalPrice || calculation.results?.totalCost,
      formattedPrice: calculation.inputs?.totalPrice 
        ? `${calculation.inputs.totalPrice.toLocaleString('tr-TR')} TL`
        : calculation.results?.totalCost 
          ? `${calculation.results.totalCost.toLocaleString('tr-TR')} TL`
          : 'N/A',
      createdAt: calculation.createdAt
    };

    res.status(200).json({
      success: true,
      message: calculation.isBookmarked 
        ? 'Calculation bookmarked successfully' 
        : 'Calculation removed from bookmarks',
      data: {
        isBookmarked: calculation.isBookmarked,
        calculation: calcInfo
      }
    });
  } catch (error) {
    console.error('Toggle bookmark error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Share calculation
// @route   POST /api/calculations/:id/share
// @access  Private
const shareCalculation = async (req, res) => {
  try {
    const { userPhone, permission = 'view' } = req.body;

    const calculation = await Calculation.findById(req.params.id);

    if (!calculation) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('CALCULATION_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    if (calculation.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: errorMessageService.getMessage('ONLY_OWNER_SHARE', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Find user to share with
    const targetUser = await User.findOne({ phone: userPhone });
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('USER_NOT_FOUND_PHONE', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Check if already shared
    const alreadyShared = calculation.sharedWith.some(share => 
      share.userId.toString() === targetUser._id.toString()
    );

    await calculation.shareWith(targetUser._id, permission);

    // Get calculation info for response
    const calcInfo = {
      id: calculation._id,
      type: calculation.type,
      typeName: {
        'wall': 'Wall',
        'fundament': 'Foundation', 
        'roof': 'Roof',
        'inner_wall': 'Inner Wall',
        'underfloor': 'Underfloor',
        'floor_tiles': 'Floor Tiles',
        'wall_decoration': 'Wall Decoration'
      }[calculation.type] || calculation.type,
      materialName: calculation.inputs?.selectedMaterialModel?.name || 'Unknown Material',
      totalPrice: calculation.inputs?.totalPrice || calculation.results?.totalCost,
      formattedPrice: calculation.inputs?.totalPrice 
        ? `${calculation.inputs.totalPrice.toLocaleString('tr-TR')} TL`
        : calculation.results?.totalCost 
          ? `${calculation.results.totalCost.toLocaleString('tr-TR')} TL`
          : 'N/A',
      createdAt: calculation.createdAt,
      sharedWith: calculation.sharedWith.length
    };

    const targetUserInfo = {
      id: targetUser._id,
      username: targetUser.username,
      phone: targetUser.phone,
      permission
    };

    res.status(200).json({
      success: true,
      message: alreadyShared 
        ? 'Calculation sharing permission updated'
        : 'Calculation shared successfully',
      data: {
        calculation: calcInfo,
        sharedWith: targetUserInfo,
        wasAlreadyShared: alreadyShared
      }
    });
  } catch (error) {
    console.error('Share calculation error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get calculation statistics
// @route   GET /api/calculations/statistics/summary
// @access  Private
const getStatistics = async (req, res) => {
  try {
    // Get basic statistics from model
    const basicStatistics = await Calculation.getStatistics(req.user._id);
    
    // Get enhanced statistics for new model structure
    const enhancedStatistics = await Calculation.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          // Use new structure price if available, fallback to old
          totalCost: { 
            $sum: {
              $ifNull: ['$inputs.totalPrice', '$results.totalCost']
            }
          },
          avgCost: { 
            $avg: {
              $ifNull: ['$inputs.totalPrice', '$results.totalCost']
            }
          },
          totalVolume: {
            $sum: {
              $ifNull: ['$inputs.totalVolume', '$results.totalVolume']
            }
          },
          avgVolume: {
            $avg: {
              $ifNull: ['$inputs.totalVolume', '$results.totalVolume']
            }
          },
          totalMaterialItems: {
            $sum: {
              $ifNull: ['$inputs.materialItemCount', 0]
            }
          },
          totalDoors: {
            $sum: {
              $ifNull: [
                { $size: { $ifNull: ['$inputs.doorList', []] } },
                { $size: { $ifNull: ['$inputs.doors', []] } }
              ]
            }
          },
          totalWindows: {
            $sum: {
              $ifNull: [
                { $size: { $ifNull: ['$inputs.windowList', []] } },
                { $size: { $ifNull: ['$inputs.windows', []] } }
              ]
            }
          },
          totalIngredients: {
            $sum: {
              $ifNull: [
                { $size: { $ifNull: ['$inputs.ingCalcModelList', []] } },
                0
              ]
            }
          },
          lastCalculation: { $max: '$createdAt' },
          // Count by material types from new structure
          materialTypes: {
            $addToSet: '$inputs.selectedMaterialModel.type'
          },
          // Count bookmarked calculations
          bookmarkedCount: {
            $sum: {
              $cond: [{ $eq: ['$isBookmarked', true] }, 1, 0]
            }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get total calculations count
    const totalCalculations = await Calculation.countDocuments({ userId: req.user._id });
    const bookmarkedCalculations = await Calculation.countDocuments({ 
      userId: req.user._id, 
      isBookmarked: true 
    });

    // Get most used materials from new structure
    const mostUsedMaterials = await Calculation.aggregate([
      { $match: { 
        userId: req.user._id,
        'inputs.selectedMaterialModel.name': { $exists: true }
      }},
      {
        $group: {
          _id: {
            id: '$inputs.selectedMaterialModel._id',
            name: '$inputs.selectedMaterialModel.name',
            type: '$inputs.selectedMaterialModel.type'
          },
          count: { $sum: 1 },
          totalCost: { 
            $sum: {
              $ifNull: ['$inputs.totalPrice', 0]
            }
          },
          lastUsed: { $max: '$createdAt' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Calculate type names in English
    const typeNames = {
      'wall': 'Wall',
      'fundament': 'Foundation', 
      'roof': 'Roof',
      'inner_wall': 'Inner Wall',
      'underfloor': 'Underfloor',
      'floor_tiles': 'Floor Tiles',
      'wall_decoration': 'Wall Decoration'
    };

    // Process enhanced statistics
    const processedStatistics = enhancedStatistics.map(stat => ({
      ...stat,
      typeName: typeNames[stat._id] || stat._id,
      totalCost: stat.totalCost || 0,
      avgCost: Math.round(stat.avgCost) || 0,
      totalVolume: stat.totalVolume ? parseFloat(stat.totalVolume.toFixed(2)) : 0,
      avgVolume: stat.avgVolume ? parseFloat(stat.avgVolume.toFixed(2)) : 0
    }));

    // Calculate overall totals
    const overallTotals = enhancedStatistics.reduce((acc, stat) => ({
      totalCost: acc.totalCost + (stat.totalCost || 0),
      totalVolume: acc.totalVolume + (stat.totalVolume || 0),
      totalMaterialItems: acc.totalMaterialItems + (stat.totalMaterialItems || 0),
      totalDoors: acc.totalDoors + (stat.totalDoors || 0),
      totalWindows: acc.totalWindows + (stat.totalWindows || 0),
      totalIngredients: acc.totalIngredients + (stat.totalIngredients || 0)
    }), {
      totalCost: 0,
      totalVolume: 0,
      totalMaterialItems: 0,
      totalDoors: 0,
      totalWindows: 0,
      totalIngredients: 0
    });

    res.status(200).json({
      success: true,
      data: {
        statistics: processedStatistics,
        legacy: basicStatistics, // Keep for backward compatibility
        summary: {
          totalCalculations,
          bookmarkedCalculations,
          bookmarkPercentage: totalCalculations > 0 
            ? Math.round((bookmarkedCalculations / totalCalculations) * 100)
            : 0,
          ...overallTotals,
          totalCost: overallTotals.totalCost,
          totalVolume: parseFloat(overallTotals.totalVolume.toFixed(2)),
          avgCostPerCalculation: totalCalculations > 0 
            ? Math.round(overallTotals.totalCost / totalCalculations)
            : 0
        },
        mostUsedMaterials: mostUsedMaterials.map(material => ({
          ...material,
          materialName: material._id.name,
          materialType: material._id.type,
          totalCost: material.totalCost,
          avgCost: material.count > 0 
            ? Math.round(material.totalCost / material.count)
            : 0
        }))
      }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

module.exports = {
  getCalculationTypes,
  createCalculationType,
  updateCalculationType,
  deleteCalculationType,
  calculate,
  getHistory,
  getCalculationById,
  updateCalculation,
  deleteCalculation,
  toggleBookmark,
  shareCalculation,
  getStatistics
};
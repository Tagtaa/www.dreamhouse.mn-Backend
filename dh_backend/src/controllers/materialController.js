const Material = require('../models/Material');
const MaterialCategory = require('../models/MaterialCategory');
const ParentCategory = require('../models/ParentCategory');
const Ingredient = require('../models/Ingredient');
const errorMessageService = require('../services/errorMessageService');

// @desc    Get materials list
// @route   GET /api/materials
// @access  Public
const getMaterials = async (req, res) => {
  try {
    const category = req.query.category;
    const parentCategory = req.query.parentCategory;
    const subcategory = req.query.subcategory;
    const isPremium = req.query.isPremium === 'true' ? true : req.query.isPremium === 'false' ? false : undefined;
    const query = req.query.q; // Search query parameter

    const filter = {
      ...(category && category !== 'all' && { category }),
      ...(subcategory && { subcategory }),
      ...(isPremium !== undefined && { isPremium })
    };

    // Check if parentCategory or category is provided
    const hasParentCategory = parentCategory && parentCategory !== '0' && parentCategory !== 0;
    const hasCategory = category && category !== 'all' && category !== '0' && category !== 0;
    
    // If parentCategory or category is provided, get all materials without pagination
    // Otherwise, use pagination
    let page, limit, skip;
    if (hasParentCategory || hasCategory) {
      // Get all materials when parentCategory or category is specified (ignore page/limit)
      page = 1;
      limit = 10000; // Very high limit to get all materials
      skip = 0;
    } else {
      page = parseInt(req.query.page) || 1;
      limit = parseInt(req.query.limit) || 20;
      skip = (page - 1) * limit;
    }

    // Add parent category filter
    if (hasParentCategory) {
      // Find all categories that belong to this parent category
      const MaterialCategory = require('../models/MaterialCategory');
      
      let parentCategoryId;
      // Check if parentCategory is a number (ID) or string (name)
      if (!isNaN(parentCategory) && !isNaN(parseInt(parentCategory))) {
        // It's a number, use as ID
        parentCategoryId = parseInt(parentCategory);
      } else {
        // It's a string, find by name (case-insensitive)
        const parentCategoryDoc = await ParentCategory.findOne({ 
          name: { $regex: new RegExp(`^${parentCategory}$`, 'i') },
          isActive: true 
        });
        if (!parentCategoryDoc) {
          return res.status(404).json({
            success: false,
            message: errorMessageService.getMessage('PARENT_CATEGORY_NOT_FOUND_WITH_NAME', errorMessageService.getLocaleFromRequest(req), { name: parentCategory })
          });
        }
        parentCategoryId = parentCategoryDoc._id;
      }
      
      const categories = await MaterialCategory.find({ 
        parentCategory: parentCategoryId,
        isActive: true 
      }).select('_id');
      
      const categoryIds = categories.map(cat => cat._id);
      filter.category = { $in: categoryIds };
    }

    let materials;
    let total;

    if (query) {
      // Search functionality
      const regexQuery = new RegExp(query, 'i');
      filter.$or = [
        { name: regexQuery },
        { description: regexQuery }
      ];
    }

    // Debug: Check collection name and count
    const collectionName = Material.collection.name;
    const dbName = Material.db.name;
    const totalCount = await Material.countDocuments({});
    const activeCount = await Material.countDocuments({ isActive: true });
    const inactiveCount = await Material.countDocuments({ isActive: false });
    
    console.log(`🔍 Material Collection: ${collectionName}`);
    console.log(`🔍 Database: ${dbName}`);
    console.log(`🔍 Total Materials in DB (no filter): ${totalCount}`);
    console.log(`🔍 Active Materials: ${activeCount}`);
    console.log(`🔍 Inactive Materials: ${inactiveCount}`);
    console.log(`🔍 Filter applied:`, JSON.stringify(filter, null, 2));

    materials = await Material.find(filter)
      .populate({
        path: 'category',
        select: '_id name images parentCategory',
        populate: {
          path: 'parentCategory',
          model: 'ParentCategory',
          select: 'name'
        }
      })
      .populate('ingredients')
      .select('_id name category price specs rating width length height unit description images ingredients thicknessOptions likeCount likedBy isPremium isActive tags popularity viewCount createdAt updatedAt supplier')
      .limit(limit)
      .skip(skip)
      .sort('-createdAt');

    total = await Material.countDocuments(filter);
    console.log(`🔍 Materials found with filter: ${materials.length}`);
    console.log(`🔍 Total matching filter: ${total}`);

    // Get locale from request
    const locale = errorMessageService.getLocaleFromRequest(req);
    const pieceText = errorMessageService.getMessage('PIECE', locale);
    
    // Add ingredients to each category in materials and process materials
    const filteredMaterials = await Promise.all(
      materials.map(async (material) => {
        const materialObj = material.toObject();
        
        // If category exists, add its ingredients (category güncellendiğinde burada güncel ingredients görünecek)
        if (materialObj.category && materialObj.category._id) {
          const categoryIngredients = await Ingredient.find({ 
            materialCategory: materialObj.category._id,
            isActive: true 
          }).sort({ sortOrder: 1, createdAt: -1 });
          
          // Format category ingredients based on unit (same as material ingredients)
          const formattedCategoryIngredients = categoryIngredients.map(ingredient => {
            const processedIngredient = {
              _id: ingredient._id,
              name: ingredient.name,
              unit: ingredient.unit
            };
            
            // Determine type based on unit
            const unit = String(ingredient.unit || '').trim().toLowerCase();
            const isM3 = unit === 'm3';
            const isM2 = unit === 'm2';
            
            // Add fields based on unit
            if (isM3) {
              // m3 type - use percentValue and pricePerM3
              processedIngredient.percentValue = ingredient.requiredPercent ?? null;
              processedIngredient.pricePerM3 = ingredient.pricePerM3 ?? null;
            } else if (isM2) {
              // m2 type - use percentValue and pricePerM2
              processedIngredient.percentValue = ingredient.requiredPercent ?? null;
              processedIngredient.pricePerM2 = ingredient.pricePerM2 ?? null;
            } else {
              // percentage type - use percentValue and priceForPer1Percent
              processedIngredient.percentValue = ingredient.requiredPercent ?? null;
              processedIngredient.priceForPer1Percent = ingredient.priceForPer1Percent ?? null;
            }
            
            return processedIngredient;
          });
          
          materialObj.category.ingredients = formattedCategoryIngredients;
        }
        
        // Localize specs - replace "piece" with localized text
        if (materialObj.specs) {
          materialObj.specs = materialObj.specs.replace(/piece/gi, pieceText);
        }
        
        // Remove parentCategory from category response
        if (materialObj.category && materialObj.category.parentCategory) {
          delete materialObj.category.parentCategory;
        }
        
        // Remove material's own ingredients field (category.ingredients is used instead)
        delete materialObj.ingredients;
        
        if (req.user) {
          const userId = req.user._id.toString();
          const userLiked = material.likedBy && material.likedBy.some(likedUserId => likedUserId.toString() === userId);
          materialObj.isLiked = userLiked;
        } else {
          materialObj.isLiked = false;
        }
        
        return materialObj;
      })
    );

    res.status(200).json({
      success: true,
      data: {
        materials: filteredMaterials,
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
    console.error('Get materials error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get material categories
// @route   GET /api/materials/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const categories = await MaterialCategory.find({ isActive: true })
      .populate('parentCategory', 'name')
      .sort('-createdAt');

    // Get ingredients for each category
    const categoriesWithIngredients = await Promise.all(
      categories.map(async (category) => {
        const categoryObj = category.toObject();
        const ingredients = await Ingredient.find({ 
          materialCategory: category._id,
          isActive: true 
        }).sort({ sortOrder: 1, createdAt: -1 });
        categoryObj.ingredients = ingredients;
        return categoryObj;
      })
    );

    res.status(200).json({
      success: true,
      data: {
        categories: categoriesWithIngredients
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

// @desc    Create material category
// @route   POST /api/materials/categories
// @access  Admin
const createCategory = async (req, res) => {
  try {
    const { name, parentCategory, images, ingredients, percentValue } = req.body;
    
    // Debug: Log ingredients value to understand what's being received
    console.log('🔍 DEBUG createCategory - ingredients value:', ingredients);
    console.log('🔍 DEBUG createCategory - ingredients type:', typeof ingredients);
    console.log('🔍 DEBUG createCategory - ingredients isArray:', Array.isArray(ingredients));
    console.log('🔍 DEBUG createCategory - ingredients length:', ingredients?.length);

    // Check if category name already exists
    const existingCategory = await MaterialCategory.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('CATEGORY_NAME_EXISTS', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Get parent category
    const ParentCategory = require('../models/ParentCategory');
    const parentCategoryDoc = await ParentCategory.findById(parentCategory);
    if (!parentCategoryDoc) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('PARENT_CATEGORY_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }
    
    // Debug: Log parent category info
    console.log('🔍 DEBUG createCategory - parentCategory name:', parentCategoryDoc.name);
    console.log('🔍 DEBUG createCategory - parentCategory _id:', parentCategoryDoc._id);

    // Upload images to Firebase and store URLs in database
    let uploadedImageUrls = [];
    if (images && images.length > 0) {
      const { uploadImageToFirebase } = require('../config/firebase');
      
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        
        // Check if it's a base64 string (needs upload)
        if (typeof image === 'string' && image.startsWith('data:image')) {
          try {
            // Upload base64 image to Firebase
            const imageUrl = await uploadImageToFirebase(image, 'categories', `${name}-${Date.now()}-${i}.jpg`);
            uploadedImageUrls.push(imageUrl);
            console.log(`✅ Image ${i + 1} uploaded to Firebase: ${imageUrl}`);
          } catch (uploadError) {
            console.error(`❌ Failed to upload image ${i + 1}:`, uploadError);
            return res.status(500).json({
              success: false,
              message: errorMessageService.getMessage('FAILED_TO_UPLOAD_IMAGE_WITH_ERROR', errorMessageService.getLocaleFromRequest(req), { index: i + 1, error: uploadError.message })
            });
          }
        } 
        // If it's already a valid URL (http/https), use it directly
        else if (typeof image === 'string' && (image.startsWith('http://') || image.startsWith('https://'))) {
          uploadedImageUrls.push(image);
          console.log(`📎 Using existing URL for image ${i + 1}: ${image}`);
        }
        // Invalid format
        else {
          return res.status(400).json({
            success: false,
            message: errorMessageService.getMessage('INVALID_IMAGE_FORMAT', errorMessageService.getLocaleFromRequest(req), { index: i + 1 })
          });
        }
      }
    }

    const category = new MaterialCategory({
      name,
      parentCategory,
      images: uploadedImageUrls,
      percentValue: percentValue !== undefined && percentValue !== null ? percentValue : null
    });

    await category.save();

    // Create ingredients if provided AND not empty
    // Only validate percentage if ingredients are actually provided and not empty
    // IMPORTANT: Skip validation completely if ingredients is undefined, null, empty array, or not an array
    if (ingredients !== undefined && ingredients !== null && Array.isArray(ingredients) && ingredients.length > 0) {
      const createdIngredients = [];
      
      for (const ingredientData of ingredients) {
        const { name: ingredientName, unit } = ingredientData;
        
        // Determine type based on unit
        const unitStr = String(unit || '').trim().toLowerCase();
        const isM3 = unitStr === 'm3';
        const isM2 = unitStr === 'm2';
        
        // Extract fields based on unit - support both old and new field names
        let requiredPercent, priceForPer1Percent, pricePerM3, pricePerM2;
        
        if (isM3) {
          // m3 type - use m3Amount and pricePerM3
          requiredPercent = ingredientData.m3Amount ?? ingredientData.requiredPercent;
          pricePerM3 = ingredientData.pricePerM3;
          
          // m3Amount and pricePerM3 are nullable
        } else if (isM2) {
          // m2 type - use m2Amount and pricePerM2
          requiredPercent = ingredientData.m2Amount ?? ingredientData.requiredPercent;
          pricePerM2 = ingredientData.pricePerM2;
          
          // m2Amount and pricePerM2 are nullable
        } else {
          // percentage type (default) - use percentValue and priceForPer1Percent
          requiredPercent = ingredientData.percentValue ?? ingredientData.requiredPercent;
          priceForPer1Percent = ingredientData.priceForPer1Percent;
          
          // Validate: percentValue and priceForPer1Percent must be provided together
          if (ingredientName) {
            const hasPercentValue = requiredPercent !== undefined && requiredPercent !== null;
            const hasPrice = priceForPer1Percent !== undefined && priceForPer1Percent !== null;
            
            if (!hasPercentValue || !hasPrice) {
              await MaterialCategory.findByIdAndDelete(category._id);
              return res.status(400).json({
                success: false,
                message: errorMessageService.getMessage('PERCENTAGE_TYPE_FIELDS_REQUIRED', errorMessageService.getLocaleFromRequest(req))
              });
            }
          }
        }

        const ingredient = new Ingredient({
          materialCategory: category._id,
          name: ingredientName,
          unit,
          // Set fields based on unit
          requiredPercent: isM3 || isM2 ? requiredPercent : (requiredPercent),
          priceForPer1Percent: !isM3 && !isM2 ? priceForPer1Percent : undefined,
          pricePerM3: isM3 ? pricePerM3 : undefined,
          pricePerM2: isM2 ? pricePerM2 : undefined
        });

        await ingredient.save();
        createdIngredients.push(ingredient);
      }

      // CRITICAL: Only validate percentage if:
      // NO ingredient has unit 'm3' or 'm2'
      // If any ingredient has unit 'm3' or 'm2', skip percentage validation
      
      // Check if any ingredient has unit 'm3' or 'm2'
      const hasM3OrM2Unit = ingredients.some(ing => {
        const unit = String(ing.unit || '').trim().toLowerCase();
        return unit === 'm3' || unit === 'm2';
      });
      
      console.log('🔍 DEBUG createCategory - hasM3OrM2Unit:', hasM3OrM2Unit);
      console.log('🔍 DEBUG createCategory - ingredients units:', ingredients.map(ing => ing.unit));
      
      // Only validate percentage if no ingredient has m3/m2 unit
      if (!hasM3OrM2Unit && createdIngredients.length > 0) {
        const totalPercent = createdIngredients.reduce((sum, ing) => {
          const percent = ing.requiredPercent || 0;
          console.log('🔍 DEBUG createCategory - ingredient:', ing.name, 'requiredPercent:', ing.requiredPercent);
          return sum + percent;
        }, 0);
        console.log('🔍 DEBUG createCategory - percentage validation - totalPercent:', totalPercent);
        console.log('🔍 DEBUG createCategory - createdIngredients:', createdIngredients.map(ing => ({ name: ing.name, requiredPercent: ing.requiredPercent })));
        if (Math.abs(totalPercent - 100) > 0.01) {
          // Delete created ingredients
          await Ingredient.deleteMany({ materialCategory: category._id });
          await MaterialCategory.findByIdAndDelete(category._id);
          return res.status(400).json({
            success: false,
            message: errorMessageService.getMessage('TOTAL_PERCENTAGE_MUST_BE_100', errorMessageService.getLocaleFromRequest(req), { total: totalPercent })
          });
        }
      } else {
        // Skip percentage validation if any ingredient has unit 'm3' or 'm2'
        console.log('🔍 DEBUG createCategory - skipping percentage validation. Reason: ingredient has m3/m2 unit');
      }
    }
    // If ingredients not provided, undefined, null, empty array, or not an array - skip validation completely
    // This means NO validation will run, and category will be created successfully without ingredients

    // Populate parent category info
    await category.populate('parentCategory', 'name');

    // Get ingredients for this category
    const categoryIngredients = await Ingredient.find({ materialCategory: category._id });

    // Convert category to object and add ingredients
    const categoryObj = category.toObject();
    categoryObj.ingredients = categoryIngredients;

    res.status(201).json({
      success: true,
      message: errorMessageService.getMessage('MATERIAL_CATEGORY_CREATED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        category: categoryObj
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

// @desc    Update material category
// @route   PUT /api/materials/categories/:id
// @access  Admin
const updateCategory = async (req, res) => {
  try {
    const category = await MaterialCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('CATEGORY_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    const { name, parentCategory, images, percentValue, ...otherUpdates } = req.body;
    const updates = { ...otherUpdates };
    
    // Update name if provided
    if (name !== undefined) {
      updates.name = name;
    }
    
    // Update parentCategory if provided
    if (parentCategory !== undefined) {
      updates.parentCategory = parentCategory;
    }
    
    // Update percentValue if provided
    if (percentValue !== undefined) {
      updates.percentValue = percentValue !== null ? percentValue : null;
    }
    
    // Handle images upload to Firebase if images are provided
    if (updates.images && Array.isArray(updates.images)) {
      const { uploadImageToFirebase } = require('../config/firebase');
      const uploadedImageUrls = [];
      
      for (let i = 0; i < updates.images.length; i++) {
        const image = updates.images[i];
        
        // Check if it's a base64 string (needs upload)
        if (typeof image === 'string' && image.startsWith('data:image')) {
          try {
            // Upload base64 image to Firebase
            const imageUrl = await uploadImageToFirebase(image, 'categories', `${category.name}-${Date.now()}-${i}.jpg`);
            uploadedImageUrls.push(imageUrl);
            console.log(`✅ Image ${i + 1} uploaded to Firebase: ${imageUrl}`);
          } catch (uploadError) {
            console.error(`❌ Failed to upload image ${i + 1}:`, uploadError);
            return res.status(500).json({
              success: false,
              message: errorMessageService.getMessage('FAILED_TO_UPLOAD_IMAGE_WITH_ERROR', errorMessageService.getLocaleFromRequest(req), { index: i + 1, error: uploadError.message })
            });
          }
        } 
        // If it's already a valid URL (http/https), use it directly
        else if (typeof image === 'string' && (image.startsWith('http://') || image.startsWith('https://'))) {
          uploadedImageUrls.push(image);
          console.log(`📎 Using existing URL for image ${i + 1}: ${image}`);
        }
        // Invalid format
        else {
          return res.status(400).json({
            success: false,
            message: errorMessageService.getMessage('INVALID_IMAGE_FORMAT', errorMessageService.getLocaleFromRequest(req), { index: i + 1 })
          });
        }
      }
      
      // Replace images with uploaded URLs
      updates.images = uploadedImageUrls;
    }

    // Apply other updates
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && key !== 'images') {
        category[key] = updates[key];
      } else if (key === 'images') {
        category[key] = updates[key];
      }
    });

    await category.save();
    await category.populate('parentCategory', 'name');

    // Get ingredients for this category
    const categoryIngredients = await Ingredient.find({ materialCategory: category._id });

    // Convert category to object and add ingredients
    const categoryObj = category.toObject();
    categoryObj.ingredients = categoryIngredients;

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('CATEGORY_UPDATED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        category: categoryObj
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

// @desc    Delete material category
// @route   DELETE /api/materials/categories/:id
// @access  Admin
const deleteCategory = async (req, res) => {
  try {
    const category = await MaterialCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('CATEGORY_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Check if category is used by any materials
    const materialsUsingCategory = await Material.findOne({ category: category._id });
    if (materialsUsingCategory) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('CATEGORY_CANNOT_DELETE', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Hard delete
    await MaterialCategory.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('CATEGORY_DELETED', errorMessageService.getLocaleFromRequest(req))
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get parent categories
// @route   GET /api/materials/parent-categories
// @access  Public
const getParentCategories = async (req, res) => {
  try {
    const parentCategories = await ParentCategory.find({ isActive: true })
      .select('_id name')
      .sort('-createdAt');

    // Add "All" option at the beginning
    const allOption = { _id: 0, name: 'All' };
    const categoriesWithAll = [allOption, ...parentCategories];

    res.status(200).json({
      success: true,
      data: {
        parentCategories: categoriesWithAll
      }
    });
  } catch (error) {
    console.error('Get parent categories error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Create parent category
// @route   POST /api/materials/parent-categories
// @access  Admin
const createParentCategory = async (req, res) => {
  try {
    const { name } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('NAME_REQUIRED', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Validate name length
    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('NAME_LENGTH_REQUIRED', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Check if name already exists
    const existingByName = await ParentCategory.findOne({ name: name.trim() });
    if (existingByName) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('PARENT_CATEGORY_NAME_EXISTS', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Get the highest _id and increment by 1
    const lastCategory = await ParentCategory.findOne().sort({ _id: -1 }).select('_id');
    const newId = lastCategory ? lastCategory._id + 1 : 1;

    // Create new parent category
    const parentCategory = new ParentCategory({
      _id: newId,
      name: name.trim(),
      isActive: true
    });

    await parentCategory.save();

    res.status(201).json({
      success: true,
      message: errorMessageService.getMessage('PARENT_CATEGORY_CREATED_SUCCESS', errorMessageService.getLocaleFromRequest(req)),
      data: {
        parentCategory
      }
    });
  } catch (error) {
    console.error('Create parent category error:', error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('PARENT_CATEGORY_EXISTS', errorMessageService.getLocaleFromRequest(req))
      });
    }

    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Delete parent category
// @route   DELETE /api/materials/parent-categories/:id
// @access  Admin
const deleteParentCategory = async (req, res) => {
  try {
    const parentCategory = await ParentCategory.findById(req.params.id);

    if (!parentCategory) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('PARENT_CATEGORY_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Hard delete
    await ParentCategory.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('PARENT_CATEGORY_DELETED_SUCCESS', errorMessageService.getLocaleFromRequest(req))
    });
  } catch (error) {
    console.error('Delete parent category error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get popular materials
// @route   GET /api/materials/popular
// @access  Public
const getPopularMaterials = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const materials = await Material.getPopular(limit);

    res.status(200).json({
      success: true,
      data: {
        materials
      }
    });
  } catch (error) {
    console.error('Get popular materials error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Search materials
// @route   GET /api/materials/search
// @access  Public
const searchMaterials = async (req, res) => {
  try {
    const query = req.query.q;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const category = req.query.category;
    const minPrice = parseFloat(req.query.minPrice);
    const maxPrice = parseFloat(req.query.maxPrice);

    if (!query) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('SEARCH_QUERY_REQUIRED', errorMessageService.getLocaleFromRequest(req))
      });
    }

    const materials = await Material.search(query, {
      category,
      minPrice,
      maxPrice,
      limit,
      skip
    });

    // Get locale from request
    const locale = errorMessageService.getLocaleFromRequest(req);
    const pieceText = errorMessageService.getMessage('PIECE', locale);
    
    // Localize specs - replace "piece" with localized text
    const localizedMaterials = materials.map(material => {
      const materialObj = material.toObject ? material.toObject() : material;
      if (materialObj.specs) {
        materialObj.specs = materialObj.specs.replace(/piece/gi, pieceText);
      }
      return materialObj;
    });

    res.status(200).json({
      success: true,
      data: {
        materials: localizedMaterials,
        query,
        pagination: {
          page,
          limit,
          total: materials.length,
          pages: Math.ceil(materials.length / limit)
        }
      }
    });
  } catch (error) {
    console.error('Search materials error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get material by ID
// @route   GET /api/materials/:id
// @access  Public
const getMaterialById = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id)
      .populate('ingredients')
      .populate({
        path: 'category',
        select: '_id name images parentCategory percentValue',
        populate: {
          path: 'parentCategory',
          model: 'ParentCategory',
          select: 'name'
        }
      });

    if (!material) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('MATERIAL_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Get locale from request
    const locale = errorMessageService.getLocaleFromRequest(req);
    const pieceText = errorMessageService.getMessage('PIECE', locale);
    
    // Add isLiked field to material
    const materialObj = material.toJSON();
    
    // Localize specs - replace "piece" with localized text
    if (materialObj.specs) {
      materialObj.specs = materialObj.specs.replace(/piece/gi, pieceText);
    }
    
    // Remove parentCategory from category response
    if (materialObj.category && materialObj.category.parentCategory) {
      delete materialObj.category.parentCategory;
    }
    
    // Ensure ingredients field always exists (even if empty)
    if (!materialObj.ingredients) {
      materialObj.ingredients = [];
    }
    
    // Format existing ingredients based on unit (if they exist)
    if (materialObj.ingredients && materialObj.ingredients.length > 0) {
      materialObj.ingredients = materialObj.ingredients.map(ingredient => {
        const processedIngredient = {
          _id: ingredient._id,
          name: ingredient.name,
          unit: ingredient.unit
        };
        
        // Determine type based on unit
        const unit = String(ingredient.unit || '').trim().toLowerCase();
        const isM3 = unit === 'm3';
        const isM2 = unit === 'm2';
        
        // Add fields based on unit
        if (isM3) {
          // m3 type - use percentValue and pricePerM3
          processedIngredient.percentValue = ingredient.requiredPercent ?? null;
          processedIngredient.pricePerM3 = ingredient.pricePerM3 ?? null;
        } else if (isM2) {
          // m2 type - use percentValue and pricePerM2
          processedIngredient.percentValue = ingredient.requiredPercent ?? null;
          processedIngredient.pricePerM2 = ingredient.pricePerM2 ?? null;
        } else {
          // percentage type - use percentValue and priceForPer1Percent
          processedIngredient.percentValue = ingredient.requiredPercent ?? null;
          processedIngredient.priceForPer1Percent = ingredient.priceForPer1Percent ?? null;
        }
        
        return processedIngredient;
      });
    }
    
    // Add category ingredients if category exists
    if (materialObj.category && materialObj.category._id) {
      const categoryIngredients = await Ingredient.find({ 
        materialCategory: materialObj.category._id,
        isActive: true 
      }).sort({ sortOrder: 1, createdAt: -1 });
      
      // Format category ingredients based on unit
      const formattedCategoryIngredients = categoryIngredients.map(ingredient => {
        const processedIngredient = {
          _id: ingredient._id,
          name: ingredient.name,
          unit: ingredient.unit
        };
        
        // Determine type based on unit
        const unit = String(ingredient.unit || '').trim().toLowerCase();
        const isM3 = unit === 'm3';
        const isM2 = unit === 'm2';
        
        // Add fields based on unit
        if (isM3) {
          processedIngredient.percentValue = ingredient.requiredPercent ?? null;
          processedIngredient.pricePerM3 = ingredient.pricePerM3 ?? null;
        } else if (isM2) {
          processedIngredient.percentValue = ingredient.requiredPercent ?? null;
          processedIngredient.pricePerM2 = ingredient.pricePerM2 ?? null;
        } else {
          processedIngredient.percentValue = ingredient.requiredPercent ?? null;
          processedIngredient.priceForPer1Percent = ingredient.priceForPer1Percent ?? null;
        }
        
        return processedIngredient;
      });
      
      materialObj.category.ingredients = formattedCategoryIngredients;
    }
    
    if (req.user) {
      const userId = req.user._id.toString();
      const userLiked = material.likedBy && material.likedBy.some(likedUserId => likedUserId.toString() === userId);
      materialObj.isLiked = userLiked;
    } else {
      materialObj.isLiked = false;
    }

    res.status(200).json({
      success: true,
      data: {
        material: materialObj
      }
    });
  } catch (error) {
    console.error('Get material by ID error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Increment material view count
// @route   POST /api/materials/:id/view
// @access  Public
const incrementViewCount = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('MATERIAL_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    await material.incrementViewCount();

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

// @desc    Create new material (Admin only)
// @route   POST /api/materials
// @access  Admin
const createMaterial = async (req, res) => {
  try {
    console.log('🔍 Material create request received:', {
      name: req.body.name,
      category: req.body.category,
      hasIngredients: !!req.body.ingredients,
      ingredientsCount: req.body.ingredients?.length || 0
    });
    
    const {
      name,
      category,
      price,
      specs,
      rating,
      width,
      length,
      height,
      unit,
      description,
      images,
      ingredients, // Optional: ingredient IDs to override default category ingredients
      thicknessOptions,
      isPremium,
      tags,
      supplier
    } = req.body;

    // Check if material name already exists
    const existingMaterial = await Material.findOne({ name });
    if (existingMaterial) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('MATERIAL_NAME_EXISTS', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Get category
    const categoryDoc = await MaterialCategory.findById(category).populate('parentCategory', 'name');
    if (!categoryDoc) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('MATERIAL_CATEGORY_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Get ingredients from category if not provided
    let ingredientIds = ingredients;
    if (!ingredientIds || ingredientIds.length === 0) {
      const categoryIngredients = await Ingredient.find({ 
        materialCategory: category,
        isActive: true 
      }).select('_id');
      ingredientIds = categoryIngredients.map(ing => ing._id);
      console.log('🔍 Material create - Auto-loaded ingredients from category:', {
        categoryId: category,
        ingredientsFound: categoryIngredients.length,
        ingredientIds: ingredientIds
      });
    } else {
      console.log('🔍 Material create - Ingredients provided in request:', {
        ingredientIds: ingredientIds
      });
    }

    // Validate total percentage is 100
    // BUT skip validation if any ingredient has unit 'm3' or 'm2'
    if (ingredientIds.length > 0) {
      const ingredientDocs = await Ingredient.find({ 
        _id: { $in: ingredientIds },
        isActive: true 
      });
      
      // Check if any ingredient has unit 'm3' or 'm2'
      const hasM3OrM2Unit = ingredientDocs.some(ing => {
        const unit = String(ing.unit || '').trim().toLowerCase();
        return unit === 'm3' || unit === 'm2';
      });
      
      // Only validate percentage if NO ingredient has m3/m2 unit
      if (!hasM3OrM2Unit) {
        const totalPercent = ingredientDocs.reduce((sum, ing) => sum + (ing.requiredPercent || 0), 0);
        if (Math.abs(totalPercent - 100) > 0.01) {
          return res.status(400).json({
            success: false,
            message: errorMessageService.getMessage('TOTAL_PERCENTAGE_MUST_BE_100', errorMessageService.getLocaleFromRequest(req), { total: totalPercent })
          });
        }
      }
    }

    // Upload images to Firebase if they are base64
    let uploadedImageUrls = [];
    if (images && images.length > 0) {
      const { uploadImageToFirebase } = require('../config/firebase');
      
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        
        // Check if it's a base64 string or already a URL
        if (image.startsWith('data:image') || !image.startsWith('http')) {
          try {
            const imageUrl = await uploadImageToFirebase(image, 'materials', `${name}-${i}.jpg`);
            uploadedImageUrls.push(imageUrl);
          } catch (uploadError) {
            console.error(`Failed to upload image ${i}:`, uploadError);
            return res.status(500).json({
              success: false,
              message: errorMessageService.getMessage('FAILED_TO_UPLOAD_IMAGE_WITH_INDEX', errorMessageService.getLocaleFromRequest(req), { index: i + 1 })
            });
          }
        } else {
          // Already a URL, keep it
          uploadedImageUrls.push(image);
        }
      }
    }

    const material = new Material({
      name,
      category,
      price,
      specs,
      rating,
      width,
      length,
      height,
      unit,
      description,
      images: uploadedImageUrls,
      ingredients: ingredientIds,
      thicknessOptions,
      isPremium: isPremium || false,
      tags: tags || [],
      supplier,
      popularity: 0,
      viewCount: 0,
      isActive: true
    });

    await material.save();
    
    console.log('✅ Material created successfully:', {
      _id: material._id,
      name: material.name,
      category: material.category,
      ingredientsCount: ingredientIds.length,
      isActive: material.isActive
    });
    
    // Populate ingredients for response
    await material.populate('ingredients');

    res.status(201).json({
      success: true,
      message: errorMessageService.getMessage('MATERIAL_CREATED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        material
      }
    });
  } catch (error) {
    console.error('Create material error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req)),
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update material (Admin only)
// @route   PUT /api/materials/:id
// @access  Admin
const updateMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('MATERIAL_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    const updates = req.body;
    const categoryChanged = updates.category && updates.category.toString() !== material.category.toString();
    
    // If category changed, get new category ingredients
    if (categoryChanged) {
      const categoryDoc = await MaterialCategory.findById(updates.category).populate('parentCategory', 'name');
      if (!categoryDoc) {
        return res.status(404).json({
          success: false,
          message: errorMessageService.getMessage('MATERIAL_CATEGORY_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
        });
      }

      // Get ingredients from new category if not provided
      if (!updates.ingredients || updates.ingredients.length === 0) {
        const categoryIngredients = await Ingredient.find({ 
          materialCategory: updates.category,
          isActive: true 
        }).select('_id');
        updates.ingredients = categoryIngredients.map(ing => ing._id);
      }

      // Validate total percentage is 100
      // BUT skip validation if any ingredient has unit 'm3' or 'm2'
      if (updates.ingredients.length > 0) {
        const ingredientDocs = await Ingredient.find({ 
          _id: { $in: updates.ingredients },
          isActive: true 
        });
        
        // Check if any ingredient has unit 'm3' or 'm2'
        const hasM3OrM2Unit = ingredientDocs.some(ing => {
          const unit = String(ing.unit || '').trim().toLowerCase();
          return unit === 'm3' || unit === 'm2';
        });
        
        // Only validate percentage if NO ingredient has m3/m2 unit
        if (!hasM3OrM2Unit) {
          const totalPercent = ingredientDocs.reduce((sum, ing) => sum + (ing.requiredPercent || 0), 0);
          if (Math.abs(totalPercent - 100) > 0.01) {
            return res.status(400).json({
              success: false,
              message: errorMessageService.getMessage('TOTAL_PERCENTAGE_MUST_BE_100', errorMessageService.getLocaleFromRequest(req), { total: totalPercent })
            });
          }
        }
      }
    } else if (updates.ingredients && updates.ingredients.length > 0) {
      // Category didn't change but ingredients were updated, validate percentage
      const ingredientDocs = await Ingredient.find({ 
        _id: { $in: updates.ingredients },
        isActive: true 
      });
      
      // Check if any ingredient has unit 'm3' or 'm2'
      const hasM3OrM2Unit = ingredientDocs.some(ing => {
        const unit = String(ing.unit || '').trim().toLowerCase();
        return unit === 'm3' || unit === 'm2';
      });
      
      // Only validate percentage if NO ingredient has m3/m2 unit
      if (!hasM3OrM2Unit) {
        const totalPercent = ingredientDocs.reduce((sum, ing) => sum + (ing.requiredPercent || 0), 0);
        if (Math.abs(totalPercent - 100) > 0.01) {
          return res.status(400).json({
            success: false,
            message: errorMessageService.getMessage('TOTAL_PERCENTAGE_MUST_BE_100', errorMessageService.getLocaleFromRequest(req), { total: totalPercent })
          });
        }
      }
    }

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        material[key] = updates[key];
      }
    });

    await material.save();
    
    // Populate ingredients for response
    await material.populate('ingredients');

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('MATERIAL_UPDATED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        material
      }
    });
  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Delete material (Admin only)
// @route   DELETE /api/materials/:id
// @access  Admin
const deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('MATERIAL_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Hard delete - directly remove from database
    await Material.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('MATERIAL_DELETED', errorMessageService.getLocaleFromRequest(req))
    });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get all materials for admin (including inactive)
// @route   GET /api/admin/materials
// @access  Admin
const getAllMaterialsAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const includeInactive = req.query.includeInactive === 'true';

    const filter = includeInactive ? {} : { isActive: true };

    // Get locale from request
    const locale = errorMessageService.getLocaleFromRequest(req);
    const pieceText = errorMessageService.getMessage('PIECE', locale);

    const materials = await Material.find(filter)
      .limit(limit)
      .skip(skip)
      .sort('-createdAt');

    const total = await Material.countDocuments(filter);

    // Localize specs - replace "piece" with localized text
    const localizedMaterials = materials.map(material => {
      const materialObj = material.toObject ? material.toObject() : material.toJSON();
      if (materialObj.specs) {
        materialObj.specs = materialObj.specs.replace(/piece/gi, pieceText);
      }
      return materialObj;
    });

    res.status(200).json({
      success: true,
      data: {
        materials: localizedMaterials,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all materials admin error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Like a material
// @route   POST /api/materials/:id/like
// @access  Private
const likeMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('MATERIAL_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Check if user already liked this material
    const userLiked = material.likedBy && material.likedBy.includes(req.user._id);
    
    if (userLiked) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('MATERIAL_ALREADY_LIKED', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Add user to likedBy array and increment likeCount
    if (!material.likedBy) {
      material.likedBy = [];
    }
    material.likedBy.push(req.user._id);
    material.likeCount += 1;

    await material.save();

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('MATERIAL_LIKED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        material: {
          _id: material._id,
          likeCount: material.likeCount,
          isLiked: true
        }
      }
    });
  } catch (error) {
    console.error('Like material error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Unlike a material
// @route   DELETE /api/materials/:id/like
// @access  Private
const unlikeMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('MATERIAL_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Check if user liked this material
    const userLiked = material.likedBy && material.likedBy.includes(req.user._id);
    
    if (!userLiked) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('MATERIAL_NOT_LIKED', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Remove user from likedBy array and decrement likeCount
    material.likedBy = material.likedBy.filter(userId => !userId.equals(req.user._id));
    material.likeCount = Math.max(0, material.likeCount - 1);

    await material.save();

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('MATERIAL_UNLIKED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        material: {
          _id: material._id,
          likeCount: material.likeCount,
          isLiked: false
        }
      }
    });
  } catch (error) {
    console.error('Unlike material error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Toggle like status of a material
// @route   POST /api/materials/:id/toggle-like
// @access  Private
const toggleLikeMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('MATERIAL_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Check if user already liked this material
    const userLiked = material.likedBy && material.likedBy.includes(req.user._id);
    
    if (userLiked) {
      // Unlike the material
      material.likedBy = material.likedBy.filter(userId => !userId.equals(req.user._id));
      material.likeCount = Math.max(0, material.likeCount - 1);
      var action = 'unliked';
    } else {
      // Like the material
      if (!material.likedBy) {
        material.likedBy = [];
      }
      material.likedBy.push(req.user._id);
      material.likeCount += 1;
      var action = 'liked';
    }

    await material.save();

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('MATERIAL_ACTION_SUCCESS_PARAM', errorMessageService.getLocaleFromRequest(req), { action }),
      data: {
        material: {
          _id: material._id,
          likeCount: material.likeCount,
          isLiked: !userLiked
        }
      }
    });
  } catch (error) {
    console.error('Toggle like material error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

module.exports = {
  getMaterials,
  getCategories,
  getPopularMaterials,
  searchMaterials,
  getMaterialById,
  incrementViewCount,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  getAllMaterialsAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
  getParentCategories,
  createParentCategory,
  deleteParentCategory,
  likeMaterial,
  unlikeMaterial,
  toggleLikeMaterial
};
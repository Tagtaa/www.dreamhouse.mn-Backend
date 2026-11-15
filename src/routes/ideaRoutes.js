const express = require('express');
const router = express.Router();
const { requirePermission: can } = require('../middleware/auth');
const ideaController = require('../controllers/ideaController');
const { auth, optionalAuth, premium, admin } = require('../middleware/auth');
const { 
  validateObjectId,
  validatePagination,
  validateSearch,
  handleValidationErrors 
} = require('../middleware/validation');
const { lockPremiumIdeas } = require('../services/ideaAccessService');

// Premium ideas: total cost and materials list only for buyers (all responses below)
router.use(lockPremiumIdeas);

// @route   GET /api/ideas
// @desc    Get ideas list
// @access  Public (optionalAuth for admin to see unpublished)
router.get('/',
  optionalAuth,
  validatePagination(),
  validateSearch(),
  handleValidationErrors,
  ideaController.getIdeas
);

// @route   GET /api/ideas/categories
// @desc    Get idea categories
// @access  Public
router.get('/categories', ideaController.getCategories);
router.post('/categories', auth, admin, can('article_categories.create'), ideaController.createCategory);
router.put('/categories/:id', auth, admin, can('article_categories.edit'), ideaController.updateCategory);
router.delete('/categories/:id', auth, admin, can('article_categories.delete'), ideaController.deleteCategory);

// @route   GET /api/ideas/heating-types
// @desc    Get heating types
// @access  Public
router.get('/heating-types', ideaController.getHeatingTypes);
router.post('/heating-types', auth, admin, can('articles.edit'), ideaController.createHeatingType);
router.put('/heating-types/:id', auth, admin, can('articles.edit'), ideaController.updateHeatingType);
router.delete('/heating-types/:id', auth, admin, can('articles.edit'), ideaController.deleteHeatingType);

// @route   GET /api/ideas/size-ranges
// @desc    Get size ranges for filtering
// @access  Public
router.get('/size-ranges', ideaController.getSizeRanges);

// @route   GET /api/ideas/featured
// @desc    Get featured ideas
// @access  Public
router.get('/featured', optionalAuth, ideaController.getFeaturedIdeas);

// @route   GET /api/ideas/popular
// @desc    Get popular ideas
// @access  Public
router.get('/popular', optionalAuth, ideaController.getPopularIdeas);

// @route   GET /api/ideas/search
// @desc    Search ideas
// @access  Public
router.get('/search',
  optionalAuth,
  validateSearch(),
  validatePagination(),
  handleValidationErrors,
  ideaController.searchIdeas
);

// @route   GET /api/ideas/:id
// @desc    Get idea by ID
// @access  Public (optionalAuth for admin to see unpublished/deleted)
router.get('/:id',
  optionalAuth,
  validateObjectId(),
  handleValidationErrors,
  ideaController.getIdeaById
);

// @route   POST /api/ideas/:id/view
// @desc    Increment idea view count
// @access  Public
router.post('/:id/view',
  validateObjectId(),
  handleValidationErrors,
  ideaController.incrementViewCount
);

// @route   POST /api/ideas/:id/like
// @desc    Like/unlike idea
// @access  Private
router.post('/:id/like',
  auth,
  validateObjectId(),
  handleValidationErrors,
  ideaController.toggleLike
);

// @route   POST /api/ideas/:id/purchase
// @desc    Purchase premium idea
// @access  Private
router.post('/:id/purchase',
  auth,
  validateObjectId(),
  handleValidationErrors,
  ideaController.purchaseIdea
);

// Admin routes
// @route   POST /api/ideas
// @desc    Create new idea
// @access  Admin
router.post('/',
  auth,
  admin, can('articles.create'),
  ideaController.createIdea
);

// @route   PUT /api/ideas/:id
// @desc    Update idea
// @access  Admin
router.put('/:id',
  auth,
  admin, can('articles.edit'),
  validateObjectId(),
  handleValidationErrors,
  ideaController.updateIdea
);

// @route   DELETE /api/ideas/:id
// @desc    Delete idea (soft delete)
// @access  Admin
router.delete('/:id',
  auth,
  admin, can('articles.delete'),
  validateObjectId(),
  handleValidationErrors,
  ideaController.deleteIdea
);

// @route   PATCH /api/ideas/:id/featured
// @desc    Toggle featured status
// @access  Admin
router.patch('/:id/featured',
  auth,
  admin, can('articles.publish'),
  validateObjectId(),
  handleValidationErrors,
  ideaController.toggleFeatured
);

module.exports = router; 
const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { auth, admin } = require('../middleware/auth');
const { validateFileUpload, handleValidationErrors } = require('../middleware/validation');

// @route   POST /api/upload/profile-image
// @desc    Upload profile image
// @access  Private
router.post('/profile-image',
  auth,
  validateFileUpload(),
  handleValidationErrors,
  uploadController.uploadProfileImage
);

// @route   POST /api/upload/material-image
// @desc    Upload material image
// @access  Admin
router.post('/material-image',
  auth,
  admin,
  uploadController.uploadMaterialImage
);

// @route   POST /api/upload/idea-image
// @desc    Upload idea image
// @access  Admin
router.post('/idea-image',
  auth,
  admin,
  validateFileUpload(),
  handleValidationErrors,
  uploadController.uploadIdeaImage
);

// @route   DELETE /api/upload/:path
// @desc    Delete uploaded file
// @access  Private/Admin
router.delete('/:path(*)',
  auth,
  uploadController.deleteFile
);

// @route   GET /api/upload/signed-url
// @desc    Get signed URL for direct upload
// @access  Private
router.get('/signed-url',
  auth,
  uploadController.getSignedUrl
);

module.exports = router; 
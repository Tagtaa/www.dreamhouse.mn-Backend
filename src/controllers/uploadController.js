const errorMessageService = require('../services/errorMessageService');
const { getBucket } = require('../config/firebase');
const multer = require('multer');
const path = require('path');

// Multer configuration for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
}).single('image');

// @desc    Upload profile image
// @route   POST /api/upload/profile-image
// @access  Private
const uploadProfileImage = async (req, res) => {
  try {
    // Firebase Storage upload implementation would go here
    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('UPLOAD_SUCCESSFUL', errorMessageService.getLocaleFromRequest(req)),
      data: {
        imageUrl: 'https://via.placeholder.com/150'
      }
    });
  } catch (error) {
    console.error('Upload profile image error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Upload material image
// @route   POST /api/upload/material-image
// @access  Admin
const uploadMaterialImage = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('NO_IMAGE_FILE', errorMessageService.getLocaleFromRequest(req))
      });
    }

    try {
      const bucket = getBucket();
      const timestamp = Date.now();
      const fileName = `${timestamp}-${req.file.originalname}`;
      const file = bucket.file(`materials/${fileName}`);

      const stream = file.createWriteStream({
        metadata: {
          contentType: req.file.mimetype
        },
        public: true,
        validation: 'md5'
      });

      stream.on('error', (error) => {
        console.error('Upload error:', error);
        return res.status(500).json({
          success: false,
          message: errorMessageService.getMessage('FAILED_TO_UPLOAD_TO_FIREBASE', errorMessageService.getLocaleFromRequest(req))
        });
      });

      stream.on('finish', async () => {
        try {
          await file.makePublic();
          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
          
          res.status(200).json({
            success: true,
            message: errorMessageService.getMessage('MATERIAL_IMAGE_UPLOADED_SUCCESS', errorMessageService.getLocaleFromRequest(req)),
            data: {
              imageUrl: publicUrl
            }
          });
        } catch (error) {
          console.error('Error making file public:', error);
          return res.status(500).json({
            success: false,
            message: errorMessageService.getMessage('FAILED_TO_MAKE_IMAGE_PUBLIC', errorMessageService.getLocaleFromRequest(req))
          });
        }
      });

      stream.end(req.file.buffer);
    } catch (error) {
      console.error('Upload material image error:', error);
      res.status(500).json({
        success: false,
        message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
      });
    }
  });
};

// @desc    Upload idea image
// @route   POST /api/upload/idea-image
// @access  Admin
const uploadIdeaImage = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('IDEA_IMAGE_UPLOAD_NOT_IMPLEMENTED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        imageUrl: 'https://via.placeholder.com/400x300'
      }
    });
  } catch (error) {
    console.error('Upload idea image error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Delete uploaded file
// @route   DELETE /api/upload/:path
// @access  Private/Admin
const deleteFile = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('FILE_DELETION_NOT_IMPLEMENTED', errorMessageService.getLocaleFromRequest(req))
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get signed URL for direct upload
// @route   GET /api/upload/signed-url
// @access  Private
const getSignedUrl = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('SIGNED_URL_NOT_IMPLEMENTED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        signedUrl: 'https://example.com/upload',
        expiresIn: 3600
      }
    });
  } catch (error) {
    console.error('Get signed URL error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

module.exports = {
  uploadProfileImage,
  uploadMaterialImage,
  uploadIdeaImage,
  deleteFile,
  getSignedUrl
};
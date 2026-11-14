const { body, param, query, validationResult } = require('express-validator');
const errorMessageService = require('../services/errorMessageService');

// Map of validation messages to locale keys (for express-validator messages)
const validationMessageMap = {
  'Phone number must be in Mongolia format (+976XXXXXXXX)': 'PHONE_MONGOLIA_FORMAT',
  'Phone number must be in Mongolia format': 'PHONE_MONGOLIA_FORMAT',
  'Code must be exactly 5 digits': 'CODE_5_DIGITS',
  'Code must contain only numbers': 'CODE_NUMERIC_ONLY',
  'OTP code must be exactly 5 digits': 'CODE_5_DIGITS',
  'Password must be exactly 4 digits': 'PASSWORD_4_DIGITS',
  'Password must contain only numbers': 'PASSWORD_NUMERIC_ONLY',
  'Username must be between 2 and 50 characters': 'USERNAME_LENGTH',
  'Username can only contain letters, numbers, and spaces': 'USERNAME_FORMAT',
  'Page must be a positive integer': 'PAGE_POSITIVE_INTEGER',
  'Limit must be between 1 and 100': 'LIMIT_RANGE',
  'Search query must be between 1 and 100 characters': 'SEARCH_QUERY_LENGTH',
  'Amount must be a number between 1,000 and 1,000,000 MNT': 'AMOUNT_RANGE',
  'ProcessedBy must be a string between 2 and 50 characters': 'PROCESSED_BY_LENGTH',
  'Item must be a string between 2 and 100 characters': 'ITEM_NAME_LENGTH',
  'Status is required and must be wrong or confirmed': 'INVALID_DEPOSIT_STATUS',
  'Status is required and must be pending, processing, completed, failed, or cancelled': 'INVALID_STATUS',
  'totalVolume must be a positive number': 'TOTAL_VOLUME_MUST_BE_POSITIVE',
  'totalArea must be a positive number': 'TOTAL_AREA_MUST_BE_POSITIVE',
  'Either totalArea or totalVolume must be provided, but not both': 'EITHER_TOTAL_AREA_OR_VOLUME',
  'Either phone or userId must be provided': 'EITHER_PHONE_OR_USERID',
  'SMS content is required': 'SMS_CONTENT_REQUIRED',
  'SMS timestamp must be a valid ISO 8601 date': 'SMS_TIMESTAMP_INVALID',
  'Parser app version must be a string': 'PARSER_APP_VERSION_STRING',
  'Amount must be a positive number': 'AMOUNT_POSITIVE_NUMBER',
  'Bank name is required (2-50 characters)': 'BANK_NAME_REQUIRED',
  'Transaction note must be less than 500 characters': 'TRANSACTION_NOTE_MAX_LENGTH',
  'isProcessed must be true or false': 'IS_PROCESSED_BOOLEAN',
  'Start date must be a valid ISO 8601 date': 'START_DATE_INVALID',
  'End date must be a valid ISO 8601 date': 'END_DATE_INVALID',
  'Invalid endpoint': 'INVALID_ENDPOINT',
  'isSuccess must be true or false': 'IS_SUCCESS_BOOLEAN_STRING',
  'isSuccess must be a boolean': 'IS_SUCCESS_BOOLEAN',
  'Status code must be between 100 and 599': 'STATUS_CODE_RANGE',
  'Days must be between 1 and 365': 'DAYS_RANGE_1_365',
  'Days must be between 0 and 365': 'DAYS_RANGE_0_365',
  'Invalid response ID format': 'INVALID_RESPONSE_ID_FORMAT',
  'IDs must be an array': 'IDS_MUST_BE_ARRAY',
  'Each ID must be a valid MongoDB ObjectId': 'ID_MUST_BE_MONGOID',
  'Ingredient name must be between 1 and 100 characters': 'INGREDIENT_NAME_LENGTH',
  'Unit must be between 1 and 20 characters': 'UNIT_LENGTH',
  'Required percent must be between 0 and 100': 'REQUIRED_PERCENT_RANGE',
  'Price for 100% must be a positive number': 'PRICE_FOR_100_PERCENT_POSITIVE',
  'Price per m3 must be a positive number': 'PRICE_PER_M3_POSITIVE',
  'Price per m2 must be a positive number': 'PRICE_PER_M2_POSITIVE',
  'Sort order must be a non-negative integer': 'SORT_ORDER_NON_NEGATIVE',
  'Ingredient name is required': 'INGREDIENT_NAME_REQUIRED',
  'Name must be between 1 and 200 characters': 'NAME_LENGTH_1_200',
  'isActive must be a boolean': 'IS_ACTIVE_BOOLEAN',
  'Minimum charge amount is 1000 MNT': 'MIN_CHARGE_AMOUNT',
  'Invalid payment method': 'INVALID_PAYMENT_METHOD',
  'Invalid membership plan': 'INVALID_MEMBERSHIP_PLAN',
  'Invalid file type': 'INVALID_FILE_TYPE_VALIDATION',
  'totalPrice must be a positive number': 'TOTAL_PRICE_POSITIVE',
  'materialItemCount must be a positive integer': 'MATERIAL_ITEM_COUNT_POSITIVE',
  'doorList must be an array': 'DOOR_LIST_ARRAY',
  'Door width must be a positive number': 'DOOR_WIDTH_POSITIVE',
  'Door length must be a positive number': 'DOOR_LENGTH_POSITIVE',
  'Door height must be a positive number': 'DOOR_HEIGHT_POSITIVE',
  'windowList must be an array': 'WINDOW_LIST_ARRAY',
  'Window width must be a positive number': 'WINDOW_WIDTH_POSITIVE',
  'Window length must be a positive number': 'WINDOW_LENGTH_POSITIVE',
  'Window height must be a positive number': 'WINDOW_HEIGHT_POSITIVE',
  'ingCalcModelList must be an array': 'ING_CALC_MODEL_LIST_ARRAY',
  'Ingredient name must be a string': 'INGREDIENT_NAME_STRING',
  'Ingredient amount must be a positive number': 'INGREDIENT_AMOUNT_POSITIVE',
  'Ingredient price must be a positive number': 'INGREDIENT_PRICE_POSITIVE',
  'Block length must be a positive number': 'BLOCK_LENGTH_POSITIVE',
  'Block width must be a positive number': 'BLOCK_WIDTH_POSITIVE',
  'Block height must be a positive number': 'BLOCK_HEIGHT_POSITIVE',
  'Block thickness must be a positive number': 'BLOCK_THICKNESS_POSITIVE',
  'Title must be between 1 and 200 characters': 'TITLE_LENGTH_1_200',
  'Notes must be maximum 1000 characters': 'NOTES_MAX_LENGTH',
  'Project name must be maximum 100 characters': 'PROJECT_NAME_MAX_LENGTH',
  'Tags must be an array': 'TAGS_ARRAY',
  'Invalid calculation type': 'INVALID_CALCULATION_TYPE',
  'selectedTypeModel.id must be a valid MongoDB ObjectId': 'SELECTED_TYPE_MODEL_ID_MONGOID',
  'selectedShapeModel.id must be a valid MongoDB ObjectId': 'SELECTED_SHAPE_MODEL_ID_MONGOID',
  'selectedMaterialModel._id must be a valid MongoDB ObjectId': 'SELECTED_MATERIAL_MODEL_ID_MONGOID',
  'selectedThicknessModel.id must be a valid MongoDB ObjectId': 'SELECTED_THICKNESS_MODEL_ID_MONGOID',
  'userId must be a valid MongoDB ObjectId': 'USER_ID_MONGOID'
};

// Helper function to localize express-validator messages
const localizeValidationMessage = (originalMessage, locale) => {
  if (validationMessageMap[originalMessage]) {
    return errorMessageService.getMessage(validationMessageMap[originalMessage], locale);
  }
  return originalMessage;
};

// Helper function to handle validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const locale = errorMessageService.getLocaleFromRequest(req);
    const localizedErrors = errors.array().map(error => ({
      ...error,
      msg: localizeValidationMessage(error.msg, locale)
    }));
    
    return res.status(400).json({
      success: false,
      message: errorMessageService.getMessage('VALIDATION_ERROR', locale),
      errors: localizedErrors
    });
  }
  
  next();
};

// Phone number validation
const validatePhone = () => [
  body('phone')
    .matches(/^\+976[0-9]{8}$/)
    .withMessage('Phone number must be in Mongolia format (+976XXXXXXXX)')
];

// SMS code validation
const validateSmsCode = () => [
  body('code')
    .isLength({ min: 5, max: 5 })
    .withMessage('Code must be exactly 5 digits')
    .isNumeric()
    .withMessage('Code must contain only numbers')
];

// Password validation (4 digits)
const validatePassword = () => [
  body('password')
    .isLength({ min: 4, max: 4 })
    .withMessage('Password must be exactly 4 digits')
    .isNumeric()
    .withMessage('Password must contain only numbers')
];

// Username validation
const validateUsername = () => [
  body('username')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Username must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9\u0400-\u04FF\s]+$/)
    .withMessage('Username can only contain letters, numbers, and spaces')
];

// MongoDB ObjectId validation
const validateObjectId = (field = 'id') => [
  param(field)
    .isMongoId()
    .withMessage(`Invalid ${field} format`)
];

// Pagination validation
const validatePagination = () => [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// Search validation
const validateSearch = () => [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
];

// Calculation validation for new request structure
const validateCalculationInputs = () => [
  body('selectedTypeModel')
    .optional(),
  body('selectedTypeModel.id')
    .optional()
    .isMongoId()
    .withMessage('selectedTypeModel.id must be a valid MongoDB ObjectId'),
  body('selectedTypeModel.calculationType')
    .optional()
    .isIn(['wall', 'fundament', 'roof', 'inner_wall', 'underfloor', 'floor_tiles', 'wall_decoration'])
    .withMessage('Invalid calculation type'),
  
  body('selectedShapeModel')
    .optional(),
  body('selectedShapeModel.id')
    .optional()
    .isMongoId()
    .withMessage('selectedShapeModel.id must be a valid MongoDB ObjectId'),
  
  body('selectedMaterialModel')
    .optional(),
  body('selectedMaterialModel._id')
    .optional()
    .isMongoId()
    .withMessage('selectedMaterialModel._id must be a valid MongoDB ObjectId'),
  
  body('selectedThicknessModel')
    .optional(),
  body('selectedThicknessModel.id')
    .optional()
    .isMongoId()
    .withMessage('selectedThicknessModel.id must be a valid MongoDB ObjectId'),
  
  body('calculationCustomModel')
    .optional(),
  
  body('totalPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('totalPrice must be a positive number'),
  body('totalVolume')
    .optional()
    .custom((value) => {
      // If value is provided (not undefined and not null), validate it
      if (value !== undefined && value !== null) {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < 0) {
          throw new Error('totalVolume must be a positive number');
        }
      }
      return true;
    }),
  body('totalArea')
    .optional()
    .custom((value) => {
      // If value is provided (not undefined and not null), validate it
      if (value !== undefined && value !== null) {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < 0) {
          throw new Error('totalArea must be a positive number');
        }
      }
      return true;
    })
    // Custom validation: totalArea and totalVolume cannot both be provided
    .custom((value, { req }) => {
      const hasTotalArea = value !== undefined && value !== null;
      const hasTotalVolume = req.body.totalVolume !== undefined && req.body.totalVolume !== null;
      
      if (hasTotalArea && hasTotalVolume) {
        throw new Error('Either totalArea or totalVolume must be provided, but not both');
      }
      return true;
    }),
  body('materialItemCount')
    .optional()
    .isInt({ min: 0 })
    .withMessage('materialItemCount must be a positive integer'),
  
  body('doorList')
    .optional()
    .isArray()
    .withMessage('doorList must be an array'),
  body('doorList.*.width')
    .optional()
    .isFloat({ min: 0.1 })
    .withMessage('Door width must be a positive number'),
  body('doorList.*.length')
    .optional()
    .isFloat({ min: 0.1 })
    .withMessage('Door length must be a positive number'),
  body('doorList.*.height')
    .optional()
    .isFloat({ min: 0.1 })
    .withMessage('Door height must be a positive number'),
  
  body('windowList')
    .optional()
    .isArray()
    .withMessage('windowList must be an array'),
  body('windowList.*.width')
    .optional()
    .isFloat({ min: 0.1 })
    .withMessage('Window width must be a positive number'),
  body('windowList.*.length')
    .optional()
    .isFloat({ min: 0.1 })
    .withMessage('Window length must be a positive number'),
  body('windowList.*.height')
    .optional()
    .isFloat({ min: 0.1 })
    .withMessage('Window height must be a positive number'),
  
  body('ingCalcModelList')
    .optional()
    .isArray()
    .withMessage('ingCalcModelList must be an array'),
  body('ingCalcModelList.*.name')
    .optional()
    .isString()
    .withMessage('Ingredient name must be a string'),
  body('ingCalcModelList.*.amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Ingredient amount must be a positive number'),
  body('ingCalcModelList.*.price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Ingredient price must be a positive number'),
  
  // Custom block dimensions (nullable)
  body('blockLength')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Block length must be a positive number'),
  body('blockWidth')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Block width must be a positive number'),
  body('blockHeight')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Block height must be a positive number'),
  body('blockThickness')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Block thickness must be a positive number')
];

// Calculation update validation for PUT requests
const validateCalculationUpdate = () => [
  body('title')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must be maximum 1000 characters'),
  body('projectName')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Project name must be maximum 100 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('selectedMaterialModel')
    .optional(),
  body('selectedThicknessModel')
    .optional(),
  body('totalPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('totalPrice must be a positive number'),
  body('totalVolume')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('totalVolume must be a positive number'),
  body('totalArea')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('totalArea must be a positive number')
    // Custom validation: totalArea and totalVolume cannot both be provided (for update, both can be omitted)
    .custom((value, { req }) => {
      const hasTotalArea = value !== undefined && value !== null;
      const hasTotalVolume = req.body.totalVolume !== undefined && req.body.totalVolume !== null;
      
      if (hasTotalArea && hasTotalVolume) {
        throw new Error('Either totalArea or totalVolume must be provided, but not both');
      }
      return true;
    }),
  body('materialItemCount')
    .optional()
    .isInt({ min: 0 })
    .withMessage('materialItemCount must be a positive integer'),
  body('doorList')
    .optional()
    .isArray()
    .withMessage('doorList must be an array'),
  body('windowList')
    .optional()
    .isArray()
    .withMessage('windowList must be an array'),
  body('ingCalcModelList')
    .optional()
    .isArray()
    .withMessage('ingCalcModelList must be an array')
];

// File upload validation
const validateFileUpload = () => [
  body('type')
    .optional()
    .isIn(['profile', 'material', 'idea'])
    .withMessage('Invalid file type')
];

// Deposit validation
const validateDeposit = () => [
  body('phone')
    .matches(/^\+976[0-9]{8}$/)
    .withMessage('Phone number must be in Mongolia format (+976XXXXXXXX)'),
  body('amount')
    .isFloat({ min: 1000, max: 1000000 })
    .withMessage('Amount must be a number between 1,000 and 1,000,000 MNT'),
  body('processedBy')
    .isString()
    .isLength({ min: 2, max: 50 })
    .withMessage('ProcessedBy must be a string between 2 and 50 characters')
];

// Withdrawal validation
const validateWithdrawal = () => [
  body('phone')
    .optional()
    .matches(/^\+976[0-9]{8}$/)
    .withMessage('Phone number must be in Mongolia format (+976XXXXXXXX)'),
  body('userId')
    .optional()
    .isMongoId()
    .withMessage('userId must be a valid MongoDB ObjectId'),
  body('amount')
    .isFloat({ min: 1000, max: 1000000 })
    .withMessage('Amount must be a number between 1,000 and 1,000,000 MNT'),
  body('processedBy')
    .isString()
    .isLength({ min: 2, max: 50 })
    .withMessage('ProcessedBy must be a string between 2 and 50 characters'),
  body()
    .custom((value) => {
      if (!value.phone && !value.userId) {
        throw new Error('Either phone or userId must be provided');
      }
      return true;
    })
];

// Purchase validation
const validatePurchase = () => [
  body('phone')
    .matches(/^\+976[0-9]{8}$/)
    .withMessage('Phone number must be in Mongolia format (+976XXXXXXXX)'),
  body('item')
    .isString()
    .isLength({ min: 2, max: 100 })
    .withMessage('Item must be a string between 2 and 100 characters'),
  body('amount')
    .isFloat({ min: 1000, max: 1000000 })
    .withMessage('Amount must be a number between 1,000 and 1,000,000 MNT'),
  body('processedBy')
    .isString()
    .isLength({ min: 2, max: 50 })
    .withMessage('ProcessedBy must be a string between 2 and 50 characters')
];

// Status validation for deposits
const validateDepositStatus = () => [
  body('status')
    .isIn(['wrong', 'confirmed'])
    .withMessage('Status is required and must be wrong or confirmed')
];

// Status validation for withdrawals and purchases
const validateTransactionStatus = () => [
  body('status')
    .isIn(['pending', 'processing', 'completed', 'failed', 'cancelled'])
    .withMessage('Status is required and must be pending, processing, completed, failed, or cancelled')
];

module.exports = {
  handleValidationErrors,
  validatePhone,
  validateSmsCode,
  validatePassword,
  validateUsername,
  validateObjectId,
  validatePagination,
  validateSearch,
  validateCalculationInputs,
  validateCalculationUpdate,
  validateFileUpload,
  validateDeposit,
  validateWithdrawal,
  validatePurchase,
  validateDepositStatus,
  validateTransactionStatus
}; 
const fs = require('fs');
const path = require('path');

class ErrorMessageService {
  constructor() {
    this.messages = {};
    this.loadMessages();
  }

  loadMessages() {
    try {
      // Load English messages
      const enPath = path.join(__dirname, '../locales/en.json');
      const enMessages = JSON.parse(fs.readFileSync(enPath, 'utf8'));
      this.messages.en = enMessages;

      // Load Mongolian messages
      const mnPath = path.join(__dirname, '../locales/mn.json');
      const mnMessages = JSON.parse(fs.readFileSync(mnPath, 'utf8'));
      this.messages.mn = mnMessages;
    } catch (error) {
      console.error('Error loading locale messages:', error);
      // Fallback messages
      this.messages = {
        en: {
          'INTERNAL_SERVER_ERROR': 'Internal server error',
          'VALIDATION_ERROR': 'Validation error',
          'NOT_FOUND': 'Not found',
          'UNAUTHORIZED': 'Unauthorized',
          'FORBIDDEN': 'Forbidden',
          'DUPLICATE_ENTRY': 'Already exists',
          'INVALID_TOKEN': 'Invalid token',
          'TOKEN_EXPIRED': 'Token expired',
          'FILE_TOO_LARGE': 'File size exceeds limit',
          'INVALID_FILE_TYPE': 'Invalid file type',
          'INVALID_FILE_FIELD': 'Invalid file upload',
          'INVALID_ID_FORMAT': 'Invalid ID format',
          'USER_NOT_FOUND': 'User not found',
          'IDEA_NOT_FOUND': 'Idea not found',
          'MATERIAL_NOT_FOUND': 'Material not found',
          'CALCULATION_NOT_FOUND': 'Calculation not found',
          'SUBSCRIPTION_NOT_FOUND': 'Subscription not found',
          'CATEGORY_NOT_FOUND': 'Category not found',
          'HEATING_TYPE_NOT_FOUND': 'Heating type not found',
          'INSUFFICIENT_BALANCE': 'Insufficient wallet balance',
          'ALREADY_PURCHASED': 'Already purchased',
          'SEARCH_QUERY_REQUIRED': 'Search query is required',
          'TITLE_REQUIRED': 'Title is required',
          'DESCRIPTION_REQUIRED': 'Description is required',
          'SHORT_DETAIL_REQUIRED': 'Short detail is required',
          'CATEGORY_REQUIRED': 'Category is required',
          'HEATING_TYPE_REQUIRED': 'Heating type is required',
          'IMAGES_REQUIRED': 'At least one image is required',
          'TITLE_ALREADY_EXISTS': 'Idea with this title already exists',
          'SUBSCRIPTION_NAME_EXISTS': 'Subscription with this name already exists',
          'SUCCESS': 'Success',
          'IDEA_CREATED': 'Idea created successfully',
          'IDEA_UPDATED': 'Idea updated successfully',
          'IDEA_DELETED': 'Idea deleted successfully',
          'IDEA_LIKED': 'Idea liked',
          'IDEA_PURCHASED': 'Idea purchased successfully',
          'VIEW_COUNT_UPDATED': 'View count updated',
          'FEATURED_UPDATED': 'Featured status updated',
          'CATEGORY_DELETED': 'Category deleted successfully',
          'HEATING_TYPE_DELETED': 'Heating type deleted successfully',
          'SUBSCRIPTION_CREATED': 'Subscription created successfully',
          'SUBSCRIPTION_UPDATED': 'Subscription updated successfully',
          'SUBSCRIPTION_DELETED': 'Subscription deactivated successfully',
          'SUBSCRIPTION_STATUS_UPDATED': 'Subscription status updated'
        },
        mn: {
          'INTERNAL_SERVER_ERROR': 'Серверийн дотоод алдаа',
          'VALIDATION_ERROR': 'Баталгаажуулалтын алдаа',
          'NOT_FOUND': 'Олдсонгүй',
          'UNAUTHORIZED': 'Эрх байхгүй',
          'FORBIDDEN': 'Хориглосон',
          'DUPLICATE_ENTRY': 'Аль хэдийн байна',
          'INVALID_TOKEN': 'Буруу токен',
          'TOKEN_EXPIRED': 'Токен хугацаа дууссан',
          'FILE_TOO_LARGE': 'Файлын хэмжээ хэт том',
          'INVALID_FILE_TYPE': 'Буруу файлын төрөл',
          'INVALID_FILE_FIELD': 'Буруу файл оруулах',
          'INVALID_ID_FORMAT': 'Буруу ID формат',
          'USER_NOT_FOUND': 'Хэрэглэгч олдсонгүй',
          'IDEA_NOT_FOUND': 'Санаа олдсонгүй',
          'MATERIAL_NOT_FOUND': 'Материал олдсонгүй',
          'CALCULATION_NOT_FOUND': 'Тооцоо олдсонгүй',
          'SUBSCRIPTION_NOT_FOUND': 'Захиалга олдсонгүй',
          'CATEGORY_NOT_FOUND': 'Ангилал олдсонгүй',
          'HEATING_TYPE_NOT_FOUND': 'Халаалтын төрөл олдсонгүй',
          'INSUFFICIENT_BALANCE': 'Ханшийн үлдэгдэл хүрэлцэхгүй',
          'ALREADY_PURCHASED': 'Аль хэдийн худалдаж авсан',
          'SEARCH_QUERY_REQUIRED': 'Хайлтын хүсэлт шаардлагатай',
          'TITLE_REQUIRED': 'Гарчиг шаардлагатай',
          'DESCRIPTION_REQUIRED': 'Тайлбар шаардлагатай',
          'SHORT_DETAIL_REQUIRED': 'Богино дэлгэрэнгүй шаардлагатай',
          'CATEGORY_REQUIRED': 'Ангилал шаардлагатай',
          'HEATING_TYPE_REQUIRED': 'Халаалтын төрөл шаардлагатай',
          'IMAGES_REQUIRED': 'Дор хаяж нэг зураг шаардлагатай',
          'TITLE_ALREADY_EXISTS': 'Энэ гарчигтай санаа аль хэдийн байна',
          'SUBSCRIPTION_NAME_EXISTS': 'Энэ нэртэй захиалга аль хэдийн байна',
          'SUCCESS': 'Амжилттай',
          'IDEA_CREATED': 'Санаа амжилттай үүсгэгдлээ',
          'IDEA_UPDATED': 'Санаа амжилттай шинэчлэгдлээ',
          'IDEA_DELETED': 'Санаа амжилттай устгагдлаа',
          'IDEA_LIKED': 'Санаа таалагдлаа',
          'IDEA_PURCHASED': 'Санаа амжилттай худалдаж авлаа',
          'VIEW_COUNT_UPDATED': 'Үзэлтийн тоо шинэчлэгдлээ',
          'FEATURED_UPDATED': 'Онцлох статус шинэчлэгдлээ',
          'CATEGORY_DELETED': 'Ангилал амжилттай устгагдлаа',
          'HEATING_TYPE_DELETED': 'Халаалтын төрөл амжилттай устгагдлаа',
          'SUBSCRIPTION_CREATED': 'Захиалга амжилттай үүсгэгдлээ',
          'SUBSCRIPTION_UPDATED': 'Захиалга амжилттай шинэчлэгдлээ',
          'SUBSCRIPTION_DELETED': 'Захиалга амжилттай идэвхгүй болгогдлоо',
          'SUBSCRIPTION_STATUS_UPDATED': 'Захиалгын статус шинэчлэгдлээ'
        }
      };
    }
  }

  getMessage(key, locale = 'en', params = {}) {
    const messages = this.messages[locale] || this.messages.en;
    let message = this.getNestedValue(messages, key) || key;

    // Replace parameters
    Object.keys(params).forEach(param => {
      message = message.replace(`{${param}}`, params[param]);
    });

    return message;
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  // Helper function to localize Mongoose validation error messages
  localizeValidationError(error, locale = 'en') {
    // Map of validation messages to locale keys
    const validationMessageMap = {
      'Phone number must be in Mongolia format (+976XXXXXXXX)': 'PHONE_MONGOLIA_FORMAT',
      'Please enter a valid email address': 'VALID_EMAIL_ADDRESS',
      'Password must be exactly 4 digits or a valid hash': 'PASSWORD_4_DIGITS_OR_HASH',
      'Image URL must be a valid HTTP/HTTPS URL': 'IMAGE_URL_INVALID'
    };

    const originalMessage = error.message || error;
    let localizedMessage = originalMessage;

    // Check if we have a mapping for this message
    if (validationMessageMap[originalMessage]) {
      localizedMessage = this.getMessage(validationMessageMap[originalMessage], locale);
    } else {
      // Make validation messages containing sensitive information secure
      let safeMessage = originalMessage;
      safeMessage = safeMessage.replace(/Path `.*?`/, 'Field');
      safeMessage = safeMessage.replace(/mongoose/gi, '');
      safeMessage = safeMessage.replace(/mongodb/gi, '');
      localizedMessage = safeMessage.trim();
    }

    return localizedMessage;
  }

  getErrorResponse(key, locale = 'en', statusCode = 500, params = {}) {
    return {
      success: false,
      message: this.getMessage(key, locale, params),
      code: key
    };
  }

  getSuccessResponse(key, locale = 'en', data = null, params = {}) {
    const response = {
      success: true,
      message: this.getMessage(key, locale, params)
    };

    if (data) {
      response.data = data;
    }

    return response;
  }

  // Locale'i request'ten al
  getLocaleFromRequest(req) {
    // 1. Query parameter'dan
    if (req.query.locale) {
      return req.query.locale;
    }

    // 2. Header'dan
    if (req.headers['accept-language']) {
      const acceptLanguage = req.headers['accept-language'].toLowerCase();
      // İlk gelen dile öncelik ver
      if (acceptLanguage.startsWith('en')) return 'en';
      if (acceptLanguage.startsWith('mn')) return 'mn';
      // Fallback: herhangi bir yerde varsa
      if (acceptLanguage.includes('en')) return 'en';
      if (acceptLanguage.includes('mn')) return 'mn';
    }

    // 3. From User model (if authenticated)
    if (req.user && req.user.locale) {
      return req.user.locale;
    }

    // 4. Default to English
    return 'en';
  }
}

module.exports = new ErrorMessageService();

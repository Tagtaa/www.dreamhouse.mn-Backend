const AppSetting = require('../models/AppSetting');

// The number users text their verification code to (the SMS parser phone).
// Order: value saved from the dashboard → SMS_PARSER_PHONE_NUMBER env → default.
// Every API that tells the mobile app / website where to send the code reads it here.
const SMS_PARSER_PHONE_KEY = 'smsParserPhone';
const DEFAULT_SMS_PARSER_PHONE = '88367853';
const SMS_PARSER_PHONE_PATTERN = /^[0-9]{8}$/;

const CACHE_MS = 30 * 1000;
let cache = { value: null, at: 0 };

const envOrDefault = () => process.env.SMS_PARSER_PHONE_NUMBER || DEFAULT_SMS_PARSER_PHONE;

async function getSmsParserPhoneSetting() {
  const doc = await AppSetting.findOne({ key: SMS_PARSER_PHONE_KEY }).lean();
  if (doc && typeof doc.value === 'string' && doc.value) {
    return { value: doc.value, source: 'dashboard', updatedAt: doc.updatedAt, updatedBy: doc.updatedBy };
  }
  return {
    value: envOrDefault(),
    source: process.env.SMS_PARSER_PHONE_NUMBER ? 'env' : 'default',
    updatedAt: null,
    updatedBy: null
  };
}

// Fast path used on every code request (cached briefly)
async function getSmsParserPhone() {
  if (cache.value && Date.now() - cache.at < CACHE_MS) return cache.value;
  try {
    const { value } = await getSmsParserPhoneSetting();
    cache = { value, at: Date.now() };
    return value;
  } catch (error) {
    console.error('Read SMS parser phone setting error:', error);
    return cache.value || envOrDefault();
  }
}

async function setSmsParserPhone(value, adminId) {
  const phone = String(value || '').replace(/\s/g, '');
  if (!SMS_PARSER_PHONE_PATTERN.test(phone)) {
    const err = new Error('SMS parser phone must be exactly 8 digits');
    err.status = 400;
    throw err;
  }
  await AppSetting.findOneAndUpdate(
    { key: SMS_PARSER_PHONE_KEY },
    { value: phone, updatedBy: adminId || null },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  cache = { value: phone, at: Date.now() };
  return getSmsParserPhoneSetting();
}

module.exports = {
  getSmsParserPhone,
  getSmsParserPhoneSetting,
  setSmsParserPhone,
  DEFAULT_SMS_PARSER_PHONE
};

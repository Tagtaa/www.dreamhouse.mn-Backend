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

// How long support-chat messages (text + images) are kept.
const CHAT_RETENTION_KEY = 'chatRetention';
const DAY_MS = 24 * 60 * 60 * 1000;
const CHAT_RETENTION_OPTIONS = {
  '1d': DAY_MS,
  '2d': 2 * DAY_MS,
  '1w': 7 * DAY_MS,
  '2w': 14 * DAY_MS,
  '1m': 30 * DAY_MS,
  never: null
};
const DEFAULT_CHAT_RETENTION = 'never';

async function getChatRetentionSetting() {
  const doc = await AppSetting.findOne({ key: CHAT_RETENTION_KEY }).lean();
  const value = doc && Object.prototype.hasOwnProperty.call(CHAT_RETENTION_OPTIONS, doc.value) ? doc.value : DEFAULT_CHAT_RETENTION;
  return { value, updatedAt: doc ? doc.updatedAt : null };
}

async function setChatRetention(value, adminId) {
  if (!Object.prototype.hasOwnProperty.call(CHAT_RETENTION_OPTIONS, value)) {
    const err = new Error(`Chat deletion must be one of: ${Object.keys(CHAT_RETENTION_OPTIONS).join(', ')}`);
    err.status = 400;
    throw err;
  }
  await AppSetting.findOneAndUpdate(
    { key: CHAT_RETENTION_KEY },
    { value, updatedBy: adminId || null },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return getChatRetentionSetting();
}

// Website links: "Андройд апп" / "IOS апп" download buttons and the "Facebook page" buttons
const APP_LINK_KEYS = { android: 'androidAppUrl', ios: 'iosAppUrl', facebook: 'facebookPageUrl' };
const DEFAULT_APP_LINKS = {
  android: 'https://play.google.com/store/apps',
  ios: 'https://www.apple.com/app-store/',
  facebook: 'https://www.facebook.com/dreamhouse.mn/'
};

const isValidAppUrl = (value) => {
  if (value === '') return true;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && value.length <= 500;
  } catch (e) {
    return false;
  }
};

async function getAppLinks() {
  const docs = await AppSetting.find({ key: { $in: Object.values(APP_LINK_KEYS) } }).lean();
  const byKey = Object.fromEntries(docs.map((d) => [d.key, d.value]));
  return {
    androidAppUrl: byKey[APP_LINK_KEYS.android] || DEFAULT_APP_LINKS.android,
    iosAppUrl: byKey[APP_LINK_KEYS.ios] || DEFAULT_APP_LINKS.ios,
    facebookPageUrl: byKey[APP_LINK_KEYS.facebook] || DEFAULT_APP_LINKS.facebook
  };
}

// Empty string resets a link to its default store page
const LINK_LABELS = { android: 'Android app link', ios: 'IOS app link', facebook: 'Facebook page link' };

async function setAppLinks({ androidAppUrl, iosAppUrl, facebookPageUrl }, adminId) {
  const updates = [
    ['android', androidAppUrl],
    ['ios', iosAppUrl],
    ['facebook', facebookPageUrl]
  ].filter(([, v]) => v !== undefined);

  for (const [kind, raw] of updates) {
    const value = String(raw || '').trim();
    if (!isValidAppUrl(value)) {
      const err = new Error(`${LINK_LABELS[kind]} must be a valid http(s) URL`);
      err.status = 400;
      throw err;
    }
  }
  for (const [kind, raw] of updates) {
    const value = String(raw || '').trim();
    if (value) {
      await AppSetting.findOneAndUpdate(
        { key: APP_LINK_KEYS[kind] },
        { value, updatedBy: adminId || null },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } else {
      await AppSetting.deleteOne({ key: APP_LINK_KEYS[kind] });
    }
  }
  return getAppLinks();
}

// Phone (SMS) verification during sign-up. On by default; when turned off from
// Settings → General Preferences, new users register with phone + password only.
const PHONE_VERIFICATION_KEY = 'phoneVerification';
let phoneVerificationCache = { value: null, at: 0 };

async function getPhoneVerificationSetting() {
  const doc = await AppSetting.findOne({ key: PHONE_VERIFICATION_KEY }).lean();
  return { value: doc ? doc.value !== false : true, updatedAt: doc ? doc.updatedAt : null };
}

// Fast path used by the sign-up endpoints (cached briefly). Fails safe: verification stays on.
async function isPhoneVerificationRequired() {
  if (phoneVerificationCache.value !== null && Date.now() - phoneVerificationCache.at < CACHE_MS) {
    return phoneVerificationCache.value;
  }
  try {
    const { value } = await getPhoneVerificationSetting();
    phoneVerificationCache = { value, at: Date.now() };
    return value;
  } catch (error) {
    console.error('Read phone verification setting error:', error);
    return phoneVerificationCache.value !== null ? phoneVerificationCache.value : true;
  }
}

async function setPhoneVerification(value, adminId) {
  if (typeof value !== 'boolean') {
    const err = new Error('Phone verification must be true or false');
    err.status = 400;
    throw err;
  }
  await AppSetting.findOneAndUpdate(
    { key: PHONE_VERIFICATION_KEY },
    { value, updatedBy: adminId || null },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  phoneVerificationCache = { value, at: Date.now() };
  return getPhoneVerificationSetting();
}

// Bank account users transfer money to when topping up their wallet (deposits).
// Shown by the mobile app and the website; edited in Settings → General Preferences.
const BANK_ACCOUNT_KEY = 'bankAccount';
const DEFAULT_BANK_ACCOUNT = '5403388975';
const BANK_ACCOUNT_PATTERN = /^[0-9]{6,20}$/;

async function getBankAccountSetting() {
  const doc = await AppSetting.findOne({ key: BANK_ACCOUNT_KEY }).lean();
  return {
    value: doc && typeof doc.value === 'string' && doc.value ? doc.value : DEFAULT_BANK_ACCOUNT,
    updatedAt: doc ? doc.updatedAt : null
  };
}

async function setBankAccount(value, adminId) {
  const account = String(value || '').replace(/[\s-]/g, '');
  if (!BANK_ACCOUNT_PATTERN.test(account)) {
    const err = new Error('Bank account must be 6-20 digits');
    err.status = 400;
    throw err;
  }
  await AppSetting.findOneAndUpdate(
    { key: BANK_ACCOUNT_KEY },
    { value: account, updatedBy: adminId || null },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return getBankAccountSetting();
}

module.exports = {
  getBankAccountSetting,
  setBankAccount,
  DEFAULT_BANK_ACCOUNT,
  getPhoneVerificationSetting,
  isPhoneVerificationRequired,
  setPhoneVerification,
  getAppLinks,
  setAppLinks,
  DEFAULT_APP_LINKS,
  getSmsParserPhone,
  getSmsParserPhoneSetting,
  setSmsParserPhone,
  DEFAULT_SMS_PARSER_PHONE,
  CHAT_RETENTION_OPTIONS,
  getChatRetentionSetting,
  setChatRetention
};

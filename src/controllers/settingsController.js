const errorMessageService = require('../services/errorMessageService');
const {
  getSmsParserPhoneSetting,
  setSmsParserPhone,
  getChatRetentionSetting,
  setChatRetention,
  getAppLinks,
  setAppLinks,
  getPhoneVerificationSetting,
  setPhoneVerification,
  getBankAccountSetting,
  setBankAccount
} = require('../services/appSettingsService');
const { runChatCleanup } = require('../services/chatRetentionService');

const internalError = (req, res, error, label) => {
  console.error(label, error);
  res.status(500).json({
    success: false,
    message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
  });
};

const buildResponse = async () => {
  const [sms, retention, links, verification, bank] = await Promise.all([
    getSmsParserPhoneSetting(),
    getChatRetentionSetting(),
    getAppLinks(),
    getPhoneVerificationSetting(),
    getBankAccountSetting()
  ]);
  return {
    smsParserPhone: sms.value,
    source: sms.source, // 'dashboard' | 'env' | 'default'
    updatedAt: sms.updatedAt,
    chatRetention: retention.value, // '1d' | '2d' | '1w' | '2w' | '1m' | 'never'
    chatRetentionUpdatedAt: retention.updatedAt,
    androidAppUrl: links.androidAppUrl,
    iosAppUrl: links.iosAppUrl,
    facebookPageUrl: links.facebookPageUrl,
    phoneVerification: verification.value, // false → sign-up without SMS verification
    bankAccount: bank.value // deposit (wallet top-up) bank account
  };
};

// @desc    Public website settings (app download links for the landing pages)
// @route   GET /api/public-settings
// @access  Public
const getPublicSettings = async (req, res) => {
  try {
    res.set('Cache-Control', 'public, max-age=60');
    const [links, verification, bank] = await Promise.all([getAppLinks(), getPhoneVerificationSetting(), getBankAccountSetting()]);
    res.status(200).json({ success: true, data: { ...links, phoneVerification: verification.value, bankAccount: bank.value } });
  } catch (error) {
    internalError(req, res, error, 'Get public settings error:');
  }
};

// @desc    App settings shown in Settings → Preferences
// @route   GET /api/admin/settings
// @access  Admin
const getSettings = async (req, res) => {
  try {
    res.status(200).json({ success: true, data: await buildResponse() });
  } catch (error) {
    internalError(req, res, error, 'Get settings error:');
  }
};

// @desc    Update app settings: SMS parser phone and/or chat deletion period
// @route   PUT /api/admin/settings
// @access  Superadmin
const updateSettings = async (req, res) => {
  try {
    const { smsParserPhone, chatRetention, androidAppUrl, iosAppUrl, facebookPageUrl, phoneVerification, bankAccount } = req.body;
    if ([smsParserPhone, chatRetention, androidAppUrl, iosAppUrl, facebookPageUrl, phoneVerification, bankAccount].every((v) => v === undefined)) {
      return res.status(400).json({ success: false, message: 'Nothing to update' });
    }

    // App links first: both are validated before either is saved
    if ([androidAppUrl, iosAppUrl, facebookPageUrl].some((v) => v !== undefined)) {
      await setAppLinks({ androidAppUrl, iosAppUrl, facebookPageUrl }, req.user._id);
    }
    if (bankAccount !== undefined) await setBankAccount(bankAccount, req.user._id);
    if (phoneVerification !== undefined) await setPhoneVerification(phoneVerification, req.user._id);
    if (smsParserPhone !== undefined) await setSmsParserPhone(smsParserPhone, req.user._id);

    let cleanup;
    if (chatRetention !== undefined) {
      await setChatRetention(chatRetention, req.user._id);
      // Apply the new period right away instead of waiting for the hourly run
      cleanup = await runChatCleanup({ reason: 'setting changed' });
    }

    res.status(200).json({
      success: true,
      message: 'Settings updated',
      data: { ...(await buildResponse()), ...(cleanup ? { cleanup } : {}) }
    });
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }
    internalError(req, res, error, 'Update settings error:');
  }
};

module.exports = { getSettings, updateSettings, getPublicSettings };

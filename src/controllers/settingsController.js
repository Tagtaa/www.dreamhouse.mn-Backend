const errorMessageService = require('../services/errorMessageService');
const {
  getSmsParserPhoneSetting,
  setSmsParserPhone,
  getChatRetentionSetting,
  setChatRetention
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
  const [sms, retention] = await Promise.all([getSmsParserPhoneSetting(), getChatRetentionSetting()]);
  return {
    smsParserPhone: sms.value,
    source: sms.source, // 'dashboard' | 'env' | 'default'
    updatedAt: sms.updatedAt,
    chatRetention: retention.value, // '1d' | '2d' | '1w' | '2w' | '1m' | 'never'
    chatRetentionUpdatedAt: retention.updatedAt
  };
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
    const { smsParserPhone, chatRetention } = req.body;
    if (smsParserPhone === undefined && chatRetention === undefined) {
      return res.status(400).json({ success: false, message: 'Nothing to update' });
    }

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

module.exports = { getSettings, updateSettings };

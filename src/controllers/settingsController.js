const errorMessageService = require('../services/errorMessageService');
const { getSmsParserPhoneSetting, setSmsParserPhone } = require('../services/appSettingsService');

const internalError = (req, res, error, label) => {
  console.error(label, error);
  res.status(500).json({
    success: false,
    message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
  });
};

const toResponse = (setting) => ({
  smsParserPhone: setting.value,
  source: setting.source, // 'dashboard' | 'env' | 'default'
  updatedAt: setting.updatedAt
});

// @desc    App settings shown in Settings → Preferences
// @route   GET /api/admin/settings
// @access  Admin
const getSettings = async (req, res) => {
  try {
    const setting = await getSmsParserPhoneSetting();
    res.status(200).json({ success: true, data: toResponse(setting) });
  } catch (error) {
    internalError(req, res, error, 'Get settings error:');
  }
};

// @desc    Update app settings (SMS parser phone used by the mobile app and website)
// @route   PUT /api/admin/settings
// @access  Superadmin
const updateSettings = async (req, res) => {
  try {
    const setting = await setSmsParserPhone(req.body.smsParserPhone, req.user._id);
    res.status(200).json({
      success: true,
      message: 'SMS parser number updated',
      data: toResponse(setting)
    });
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }
    internalError(req, res, error, 'Update settings error:');
  }
};

module.exports = { getSettings, updateSettings };

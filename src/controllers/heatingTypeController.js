const HeatingType = require('../models/HeatingType');
const errorMessageService = require('../services/errorMessageService');

// @desc    Get all heating types
// @route   GET /api/heating-types
// @access  Public
const getHeatingTypes = async (req, res) => {
  try {
    const heatingTypes = await HeatingType.find({ isActive: true })
      .sort('_id');

    res.status(200).json({
      success: true,
      data: {
        heatingTypes
      }
    });
  } catch (error) {
    console.error('Get heating types error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Create heating type
// @route   POST /api/heating-types
// @access  Admin
const createHeatingType = async (req, res) => {
  try {
    const { _id, name, description } = req.body;

    const heatingType = await HeatingType.create({
      _id,
      name,
      description
    });

    res.status(201).json({
      success: true,
      data: {
        heatingType
      }
    });
  } catch (error) {
    console.error('Create heating type error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Update heating type
// @route   PUT /api/heating-types/:id
// @access  Admin
const updateHeatingType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    const heatingType = await HeatingType.findByIdAndUpdate(
      id,
      { name, description, isActive },
      { new: true, runValidators: true }
    );

    if (!heatingType) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('HEATING_TYPE_NOT_FOUND_ERROR', errorMessageService.getLocaleFromRequest(req))
      });
    }

    res.status(200).json({
      success: true,
      data: {
        heatingType
      }
    });
  } catch (error) {
    console.error('Update heating type error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Delete heating type
// @route   DELETE /api/heating-types/:id
// @access  Admin
const deleteHeatingType = async (req, res) => {
  try {
    const { id } = req.params;

    const heatingType = await HeatingType.findByIdAndDelete(id);

    if (!heatingType) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('HEATING_TYPE_NOT_FOUND_ERROR', errorMessageService.getLocaleFromRequest(req))
      });
    }

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('HEATING_TYPE_DELETED_SUCCESS', errorMessageService.getLocaleFromRequest(req))
    });
  } catch (error) {
    console.error('Delete heating type error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

module.exports = {
  getHeatingTypes,
  createHeatingType,
  updateHeatingType,
  deleteHeatingType
};

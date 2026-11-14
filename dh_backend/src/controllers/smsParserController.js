const User = require('../models/User');
const SmsVerification = require('../models/SmsVerification');
const BankTransaction = require('../models/BankTransaction');
const Deposit = require('../models/Deposit');
const SmsParserResponse = require('../models/SmsParserResponse');
const errorMessageService = require('../services/errorMessageService');

// Helper function to save SMS Parser response
const saveSmsParserResponse = async (endpoint, requestData, responseData, statusCode, responseTime, isSuccess, error = null, metadata = {}) => {
  try {
    const response = new SmsParserResponse({
      endpoint,
      requestData,
      responseData,
      statusCode,
      responseTime,
      isSuccess,
      error,
      metadata,
      parserAppVersion: requestData.parserAppVersion,
      clientIp: requestData.clientIp || req?.ip,
      userAgent: requestData.userAgent || req?.headers['user-agent']
    });
    
    await response.save();
    return response;
  } catch (saveError) {
    console.error('Failed to save SMS Parser response:', saveError);
    return null;
  }
};

// @desc    Handle OTP verification from SMS Parser App
// @route   POST /api/sms-parser/verify-otp
// @access  Public (but requires API key from SMS Parser App)
const handleOtpVerification = async (req, res) => {
  const startTime = Date.now();
  const requestData = {
    ...req.body,
    clientIp: req.ip,
    userAgent: req.headers['user-agent']
  };
  
  try {
    const { 
      phoneNumber, 
      otpCode, 
      smsContent,
      smsTimestamp,
      parserAppVersion 
    } = req.body;

    // Validate required fields
    if (!phoneNumber || !otpCode || !smsContent) {
      const responseData = {
        success: false,
        message: errorMessageService.getMessage('MISSING_REQUIRED_FIELDS', errorMessageService.getLocaleFromRequest(req))
      };
      
      const responseTime = Date.now() - startTime;
      await saveSmsParserResponse(
        'verify-otp',
        requestData,
        responseData,
        400,
        responseTime,
        false,
        { message: errorMessageService.getMessage('MISSING_REQUIRED_FIELDS', errorMessageService.getLocaleFromRequest(req)), code: 'VALIDATION_ERROR' },
        { phoneNumber, smsContent: smsContent?.substring(0, 100) }
      );
      
      return res.status(400).json(responseData);
    }

    // Find the verification record with this code
    const verification = await SmsVerification.findOne({
      code: otpCode,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    if (!verification) {
      const responseData = {
        success: false,
        message: errorMessageService.getMessage('INVALID_EXPIRED_OTP', errorMessageService.getLocaleFromRequest(req)),
        data: {
          receivedCode: otpCode,
          phoneNumber: phoneNumber
        }
      };
      
      const responseTime = Date.now() - startTime;
      await saveSmsParserResponse(
        'verify-otp',
        requestData,
        responseData,
        400,
        responseTime,
        false,
        { message: errorMessageService.getMessage('INVALID_EXPIRED_OTP', errorMessageService.getLocaleFromRequest(req)), code: 'OTP_INVALID' },
        { phoneNumber, smsContent: smsContent?.substring(0, 100) }
      );
      
      return res.status(400).json(responseData);
    }

    // Verify the phone number matches
    if (verification.phone !== phoneNumber) {
      const responseData = {
        success: false,
        message: errorMessageService.getMessage('PHONE_NUMBER_MISMATCH', errorMessageService.getLocaleFromRequest(req)),
        data: {
          expectedPhone: verification.phone,
          receivedPhone: phoneNumber
        }
      };
      
      const responseTime = Date.now() - startTime;
      await saveSmsParserResponse(
        'verify-otp',
        requestData,
        responseData,
        400,
        responseTime,
        false,
        { message: errorMessageService.getMessage('PHONE_NUMBER_MISMATCH', errorMessageService.getLocaleFromRequest(req)), code: 'PHONE_MISMATCH' },
        { phoneNumber, expectedPhone: verification.phone, smsContent: smsContent?.substring(0, 100) }
      );
      
      return res.status(400).json(responseData);
    }

    // Mark verification as confirmed by SMS Parser
    verification.isUsed = true;
    verification.parserConfirmedAt = new Date();
    verification.parserAppVersion = parserAppVersion;
    verification.actualSmsContent = smsContent;
    
    await verification.save();

    console.log(`✅ OTP verified by SMS Parser: ${otpCode} for ${phoneNumber}`);

    const responseData = {
      success: true,
      message: errorMessageService.getMessage('OTP_VERIFICATION_CONFIRMED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        phoneNumber,
        otpCode,
        verificationId: verification._id,
        confirmedAt: verification.parserConfirmedAt
      }
    };

    const responseTime = Date.now() - startTime;
    await saveSmsParserResponse(
      'verify-otp',
      requestData,
      responseData,
      200,
      responseTime,
      true,
      null,
      { phoneNumber, smsContent: smsContent?.substring(0, 100) }
    );

    res.status(200).json(responseData);

  } catch (error) {
    console.error('SMS Parser OTP verification error:', error);
    
    const responseData = {
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req)),
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };

    const responseTime = Date.now() - startTime;
    await saveSmsParserResponse(
      'verify-otp',
      requestData,
      responseData,
      500,
      responseTime,
      false,
      { message: error.message, code: 'INTERNAL_ERROR', details: error.stack },
      { phoneNumber, smsContent: smsContent?.substring(0, 100) }
    );
    
    res.status(500).json(responseData);
  }
};

// @desc    Handle bank SMS parsing for wallet recharge
// @route   POST /api/sms-parser/bank-transaction
// @access  Public (but requires API key from SMS Parser App)
const handleBankTransaction = async (req, res) => {
  const startTime = Date.now();
  const requestData = {
    ...req.body,
    clientIp: req.ip,
    userAgent: req.headers['user-agent']
  };
  
  try {
    const {
      smsContent,
      phoneNumber,
      amount,
      bankName,
      transactionNote,
      smsTimestamp,
      parserAppVersion
    } = req.body;

    // Validate required fields
    if (!smsContent || !phoneNumber || !amount || !bankName) {
      const responseData = {
        success: false,
        message: errorMessageService.getMessage('MISSING_REQUIRED_FIELDS', errorMessageService.getLocaleFromRequest(req))
      };
      
      const responseTime = Date.now() - startTime;
      await saveSmsParserResponse(
        'bank-transaction',
        requestData,
        responseData,
        400,
        responseTime,
        false,
        { message: errorMessageService.getMessage('MISSING_REQUIRED_FIELDS', errorMessageService.getLocaleFromRequest(req)), code: 'VALIDATION_ERROR' },
        { phoneNumber, smsContent: smsContent?.substring(0, 100), amount, bankName }
      );
      
      return res.status(400).json(responseData);
    }

    // Validate phone number format
    if (!/^\+976[0-9]{8}$/.test(phoneNumber)) {
      const responseData = {
        success: false,
        message: errorMessageService.getMessage('INVALID_PHONE_FORMAT', errorMessageService.getLocaleFromRequest(req))
      };
      
      const responseTime = Date.now() - startTime;
      await saveSmsParserResponse(
        'bank-transaction',
        requestData,
        responseData,
        400,
        responseTime,
        false,
        { message: errorMessageService.getMessage('INVALID_PHONE_FORMAT', errorMessageService.getLocaleFromRequest(req)), code: 'INVALID_PHONE_FORMAT' },
        { phoneNumber, smsContent: smsContent?.substring(0, 100), amount, bankName }
      );
      
      return res.status(400).json(responseData);
    }

    // Validate amount
    if (amount <= 0) {
      const responseData = {
        success: false,
        message: errorMessageService.getMessage('INVALID_AMOUNT', errorMessageService.getLocaleFromRequest(req))
      };
      
      const responseTime = Date.now() - startTime;
      await saveSmsParserResponse(
        'bank-transaction',
        requestData,
        responseData,
        400,
        responseTime,
        false,
        { message: errorMessageService.getMessage('INVALID_AMOUNT', errorMessageService.getLocaleFromRequest(req)), code: 'INVALID_AMOUNT' },
        { phoneNumber, smsContent: smsContent?.substring(0, 100), amount, bankName }
      );
      
      return res.status(400).json(responseData);
    }

    // Find user by phone number to determine deposit status
    const user = await User.findOne({ phone: phoneNumber });
    
    // Set deposit status based on whether user exists
    // If user exists: status = 'confirmed', if not: status = 'wrong'
    const depositStatus = user ? 'confirmed' : 'wrong';
    
    // Create deposit record
    const deposit = new Deposit({
      phone: phoneNumber,
        amount,
      processedBy: bankName, // Use bankName as processedBy
      notes: transactionNote || `SMS: ${smsContent?.substring(0, 100)}`,
      status: depositStatus,
      date: smsTimestamp ? new Date(smsTimestamp) : new Date()
      });

    await deposit.save();
    console.log(`📝 Deposit created with status: ${deposit.status} for phone: ${phoneNumber}`);

    // If user exists, add amount to wallet and handle premium membership
    if (user && depositStatus === 'confirmed') {
    // Store current wallet balance
    const balanceBefore = user.wallet;

    // Add amount to user wallet using atomic operation to prevent race conditions
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $inc: { wallet: amount } },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
        // User exists but update failed - change deposit status to wrong
        deposit.status = 'wrong';
        await deposit.save();

      const responseTime = Date.now() - startTime;
      await saveSmsParserResponse(
        'bank-transaction',
        requestData,
        { success: false, message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req)) },
        500,
        responseTime,
        false,
        { message: errorMessageService.getMessage('USER_NOT_FOUND_AFTER_WALLET_UPDATE', errorMessageService.getLocaleFromRequest(req)), code: 'UPDATE_ERROR' },
        { phoneNumber, smsContent: smsContent?.substring(0, 100), amount, bankName }
      );

      return res.status(500).json({
        success: false,
        message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req)),
        data: {
          phoneNumber,
          amount,
          bankName,
            depositId: deposit._id,
            status: deposit.status
        }
      });
    }

      // Check if amount is sufficient for premium membership
    let premiumDurationDays = 0;
    
    // Use same pricing as payment controller for consistency
    if (amount >= 140000) {
      premiumDurationDays = 365; // 1 year
    } else if (amount >= 75000) {
      premiumDurationDays = 180; // 6 months
    } else if (amount >= 40000) {
      premiumDurationDays = 90; // 3 months
    } else if (amount >= 28000) {
      premiumDurationDays = 60; // 2 months
    } else if (amount >= 15000) {
      premiumDurationDays = 30; // 1 month
    }

    let finalUser = updatedUser;

    if (premiumDurationDays > 0) {
      // Calculate expiration date properly (like payment controller)
      const currentExpiry = updatedUser.membership?.expiresAt || new Date();
      const startDate = currentExpiry > new Date() ? currentExpiry : new Date();
      const expirationDate = new Date(startDate.getTime() + premiumDurationDays * 24 * 60 * 60 * 1000);
      
      // Update membership using atomic operation
      finalUser = await User.findByIdAndUpdate(
        updatedUser._id,
        {
          $set: {
            'membership.type': 'premium',
            'membership.expiresAt': expirationDate,
            'membership.purchasedAt': updatedUser.membership?.purchasedAt || new Date()
          }
        },
        { new: true, runValidators: true }
      );
      
      console.log(`👑 Premium membership added for ${phoneNumber} (${finalUser.username})`);
      console.log(`💰 Transaction amount: ${amount} MNT`);
      console.log(`📅 Duration added: ${premiumDurationDays} days`);
      console.log(`📅 Previous expiry: ${currentExpiry.toISOString()}`);
      console.log(`📅 New expiry: ${expirationDate.toISOString()}`);
    }

    console.log(`💰 Wallet recharged: ${amount} MNT for ${phoneNumber} (${finalUser.username})`);
    console.log(`📱 Balance: ${balanceBefore} → ${finalUser.wallet} MNT`);

    const responseData = {
      success: true,
      message: errorMessageService.getMessage('WALLET_RECHARGED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        user: {
          id: finalUser._id,
          phone: finalUser.phone,
          username: finalUser.username,
          wallet: finalUser.wallet,
          membership: finalUser.membership
        },
          deposit: {
            id: deposit._id,
            orderId: deposit.orderId,
          amount,
          bankName,
          balanceBefore,
          balanceAfter: finalUser.wallet,
            status: deposit.status,
            createdAt: deposit.createdAt
        }
      }
    };

    const responseTime = Date.now() - startTime;
    await saveSmsParserResponse(
      'bank-transaction',
      requestData,
      responseData,
      200,
      responseTime,
      true,
      null,
      { 
        phoneNumber, 
        smsContent: smsContent?.substring(0, 100), 
        amount, 
        bankName,
          transactionType: 'wallet_recharge',
          depositStatus: deposit.status
      }
    );

      return res.status(200).json(responseData);
    } else {
      // User not found - deposit created with 'wrong' status
      const responseData = {
        success: true,
        message: errorMessageService.getMessage('DEPOSIT_CREATED', errorMessageService.getLocaleFromRequest(req)),
        data: {
          phoneNumber,
          amount,
          bankName,
          deposit: {
            id: deposit._id,
            orderId: deposit.orderId,
            status: deposit.status,
            createdAt: deposit.createdAt
          }
        }
      };
      
      const responseTime = Date.now() - startTime;
      await saveSmsParserResponse(
        'bank-transaction',
        requestData,
        responseData,
        200,
        responseTime,
        true,
        null,
        { 
          phoneNumber, 
          smsContent: smsContent?.substring(0, 100), 
          amount, 
          bankName,
          transactionType: 'deposit_created',
          depositStatus: deposit.status
        }
      );
      
      return res.status(200).json(responseData);
    }

  } catch (error) {
    console.error('SMS Parser bank transaction error:', error);
    
    // Try to save error deposit record if we have enough info
    if (req.body.phoneNumber && req.body.amount) {
      try {
        // Check if user exists to set correct status
        const userExists = await User.findOne({ phone: req.body.phoneNumber });
        const depositStatus = userExists ? 'confirmed' : 'wrong';
        
        const errorDeposit = new Deposit({
          phone: req.body.phoneNumber,
          amount: req.body.amount,
          processedBy: req.body.bankName || 'Unknown',
          notes: `Error: ${error.message}`,
          status: depositStatus,
          date: req.body.smsTimestamp ? new Date(req.body.smsTimestamp) : new Date()
        });
        
        await errorDeposit.save();
      } catch (saveError) {
        console.error('Failed to save error deposit:', saveError);
      }
    }

    const responseData = {
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req)),
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };

    const responseTime = Date.now() - startTime;
    await saveSmsParserResponse(
      'bank-transaction',
      requestData,
      responseData,
      500,
      responseTime,
      false,
      { message: error.message, code: 'INTERNAL_ERROR', details: error.stack },
      { 
        phoneNumber: req.body.phoneNumber, 
        smsContent: req.body.smsContent?.substring(0, 100), 
        amount: req.body.amount, 
        bankName: req.body.bankName 
      }
    );

    res.status(500).json(responseData);
  }
};

// @desc    Get bank transaction history for admin
// @route   GET /api/sms-parser/transactions
// @access  Private (Admin only)
const getBankTransactions = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      isProcessed, 
      phoneNumber,
      startDate,
      endDate 
    } = req.query;

    // Build filter
    const filter = {};
    
    if (isProcessed !== undefined) {
      filter.isProcessed = isProcessed === 'true';
    }
    
    if (phoneNumber) {
      filter.phoneNumber = phoneNumber;
    }
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const transactions = await BankTransaction.find(filter)
      .populate('userId', 'phone username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await BankTransaction.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: transactions.length,
          totalItems: total
        }
      }
    });

  } catch (error) {
    console.error('Get bank transactions error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Retry failed bank transaction
// @route   POST /api/sms-parser/transactions/:id/retry
// @access  Private (Admin only)
const retryBankTransaction = async (req, res) => {
  try {
    const transaction = await BankTransaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('TRANSACTION_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    if (transaction.isProcessed) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('TRANSACTION_ALREADY_PROCESSED', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Find user by phone number
    const user = await User.findOne({ phone: transaction.phoneNumber });
    
    if (!user) {
      await transaction.markProcessingError('User not found with this phone number');
      
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('USER_NOT_FOUND_PHONE', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Store current wallet balance
    const balanceBefore = user.wallet;

    // Add amount to user wallet using atomic operation to prevent race conditions
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $inc: { wallet: transaction.amount } },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      await transaction.markProcessingError('User not found after wallet update');
      return res.status(500).json({
        success: false,
        message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Mark transaction as processed
    await transaction.markAsProcessed(updatedUser._id, balanceBefore, updatedUser.wallet);

    console.log(`💰 Wallet recharged (retry): ${transaction.amount} MNT for ${transaction.phoneNumber}`);

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('TRANSACTION_PROCESSED_SUCCESS', errorMessageService.getLocaleFromRequest(req)),
      data: {
        transaction,
        user: {
          id: updatedUser._id,
          phone: updatedUser.phone,
          username: updatedUser.username,
          newBalance: updatedUser.wallet
        }
      }
    });

  } catch (error) {
    console.error('Retry bank transaction error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get SMS Parser response statistics
// @route   GET /api/sms-parser/responses/stats
// @access  Private (Admin only)
const getResponseStats = async (req, res) => {
  try {
    const { endpoint, isSuccess, statusCode, startDate, endDate } = req.query;
    
    const filters = {};
    if (endpoint) filters.endpoint = endpoint;
    if (isSuccess !== undefined) filters.isSuccess = isSuccess === 'true';
    if (statusCode) filters.statusCode = parseInt(statusCode);
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const stats = await SmsParserResponse.getResponseStats(filters);

    res.status(200).json({
      success: true,
      data: {
        stats,
        filters
      }
    });

  } catch (error) {
    console.error('Get response stats error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get SMS Parser error summary
// @route   GET /api/sms-parser/responses/errors
// @access  Private (Admin only)
const getErrorSummary = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const errorSummary = await SmsParserResponse.getErrorSummary(parseInt(days));

    res.status(200).json({
      success: true,
      data: {
        errorSummary,
        period: `${days} days`
      }
    });

  } catch (error) {
    console.error('Get error summary error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get SMS Parser responses with pagination
// @route   GET /api/sms-parser/responses
// @access  Private (Admin only)
const getResponses = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      endpoint, 
      isSuccess, 
      statusCode,
      phoneNumber,
      startDate,
      endDate 
    } = req.query;

    // Build filter
    const filter = {};
    
    if (endpoint) filter.endpoint = endpoint;
    if (isSuccess !== undefined) filter.isSuccess = isSuccess === 'true';
    if (statusCode) filter.statusCode = parseInt(statusCode);
    if (phoneNumber) filter['metadata.phoneNumber'] = phoneNumber;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const responses = await SmsParserResponse.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await SmsParserResponse.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        responses,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          count: responses.length,
          totalItems: total
        }
      }
    });

  } catch (error) {
    console.error('Get responses error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Cleanup old SMS Parser responses
// @route   POST /api/sms-parser/responses/cleanup
// @access  Public (with SMS Parser API key)
const cleanupOldResponses = async (req, res) => {
  try {
    const { days = 30 } = req.body;
    
    let result;
    let message;
    
    if (days === 0) {
      // Delete all responses
      result = await SmsParserResponse.deleteMany({});
      message = errorMessageService.getMessage('ALL_RESPONSES_CLEARED', errorMessageService.getLocaleFromRequest(req));
    } else {
      // Delete responses older than specified days
      result = await SmsParserResponse.cleanupOldResponses(days);
      message = errorMessageService.getMessage('RESPONSES_CLEANED_UP', errorMessageService.getLocaleFromRequest(req), { days });
    }

    res.status(200).json({
      success: true,
      message: message,
      data: {
        deletedCount: result.deletedCount
      }
    });

  } catch (error) {
    console.error('Cleanup responses error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Delete single SMS Parser response
// @route   DELETE /api/sms-parser/responses/:id
// @access  Public (with SMS Parser API key)
const deleteResponse = async (req, res) => {
  try {
    const responseId = req.params.id;

    // Validate ObjectId format
    if (!responseId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('INVALID_OBJECT_ID', errorMessageService.getLocaleFromRequest(req))
      });
    }

    const response = await SmsParserResponse.findById(responseId);

    if (!response) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('RESPONSE_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    await SmsParserResponse.findByIdAndDelete(responseId);

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('RESPONSE_DELETED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        deletedResponse: {
          id: responseId,
          endpoint: response.endpoint,
          createdAt: response.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Delete response error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Delete multiple SMS Parser responses
// @route   DELETE /api/sms-parser/responses
// @access  Public (with SMS Parser API key)
const deleteMultipleResponses = async (req, res) => {
  try {
    const { 
      ids, 
      endpoint, 
      isSuccess, 
      statusCode,
      phoneNumber,
      startDate,
      endDate,
      days 
    } = req.body;

    let filter = {};

    // If specific IDs provided
    if (ids && Array.isArray(ids) && ids.length > 0) {
      // Validate all IDs
      const invalidIds = ids.filter(id => !id.match(/^[0-9a-fA-F]{24}$/));
      if (invalidIds.length > 0) {
        return res.status(400).json({
          success: false,
          message: errorMessageService.getMessage('INVALID_OBJECT_ID', errorMessageService.getLocaleFromRequest(req)),
          data: { invalidIds }
        });
      }
      filter._id = { $in: ids };
    } else {
      // Build filter based on criteria
      if (endpoint) filter.endpoint = endpoint;
      if (isSuccess !== undefined) filter.isSuccess = isSuccess;
      if (statusCode) filter.statusCode = parseInt(statusCode);
      if (phoneNumber) filter['metadata.phoneNumber'] = phoneNumber;
      
      // Date range filter
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }
      
      // Days filter (delete responses older than X days)
      if (days && days > 0) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        filter.createdAt = { $lt: cutoffDate };
      }
    }

    // Check if any responses match the filter
    const matchingResponses = await SmsParserResponse.find(filter).select('_id endpoint createdAt');
    
    if (matchingResponses.length === 0) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('NO_RESPONSES_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Delete matching responses
    const result = await SmsParserResponse.deleteMany(filter);

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('RESPONSES_DELETED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        deletedCount: result.deletedCount,
        deletedResponses: matchingResponses.map(r => ({
          id: r._id,
          endpoint: r.endpoint,
          createdAt: r.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('Delete multiple responses error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

module.exports = {
  handleOtpVerification,
  handleBankTransaction,
  getBankTransactions,
  retryBankTransaction,
  getResponseStats,
  getErrorSummary,
  getResponses,
  cleanupOldResponses,
  deleteResponse,
  deleteMultipleResponses
};
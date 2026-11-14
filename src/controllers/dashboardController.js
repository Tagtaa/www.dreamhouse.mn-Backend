const User = require('../models/User');
const Calculation = require('../models/Calculation');
const Material = require('../models/Material');
const Purchase = require('../models/Purchase');
const Deposit = require('../models/Deposit');
const Withdraw = require('../models/Withdraw');
const Subscription = require('../models/Subscription');
const Idea = require('../models/Idea');
const errorMessageService = require('../services/errorMessageService');

// Dashboard Summary
const getDashboardSummary = async (req, res) => {
  try {
    const [
      totalUsers,
      totalCalculations,
      totalMaterials,
      totalIdeas,
      totalPurchases,
      totalDeposits,
      totalWithdrawals,
      activeSubscriptions
    ] = await Promise.all([
      User.countDocuments({ role: { $nin: ['admin', 'moderator', 'superadmin', 'operator'] } }), // Count only non-admin users
      Calculation.countDocuments(),
      Material.countDocuments({ isActive: true }),
      Idea.countDocuments({ isActive: true }),
      Purchase.countDocuments({ status: 'completed' }),
      Deposit.countDocuments({ status: 'confirmed' }),
      Withdraw.countDocuments({ status: 'completed' }),
      Subscription.countDocuments({ isActive: true })
    ]);

    // Last 30 days data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      newUsersLast30Days,
      newCalculationsLast30Days,
      totalRevenueLast30Days,
      totalDepositsLast30Days
    ] = await Promise.all([
      User.countDocuments({ 
        createdAt: { $gte: thirtyDaysAgo },
        role: { $nin: ['admin', 'moderator', 'superadmin', 'operator'] }
      }), // Count new non-admin user registrations
      Calculation.countDocuments({ 
        createdAt: { $gte: thirtyDaysAgo } 
      }),
      Purchase.aggregate([
        { 
          $match: { 
            status: 'completed', 
            date: { $gte: thirtyDaysAgo } 
          } 
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Deposit.aggregate([
        { 
          $match: { 
            status: 'confirmed', 
            date: { $gte: thirtyDaysAgo } 
          } 
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const revenue = totalRevenueLast30Days[0]?.total || 0;
    const deposits = totalDepositsLast30Days[0]?.total || 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalCalculations,
          totalMaterials,
          totalIdeas,
          activeSubscriptions
        },
        last30Days: {
          newUsers: newUsersLast30Days,
          newCalculations: newCalculationsLast30Days,
          totalRevenue: revenue,
          totalDeposits: deposits,
          totalTransactions: totalPurchases + totalDeposits + totalWithdrawals
        },
        growth: {
          userGrowthRate: totalUsers > 0 ? ((newUsersLast30Days / totalUsers) * 100).toFixed(2) : 0,
          calculationGrowthRate: totalCalculations > 0 ? ((newCalculationsLast30Days / totalCalculations) * 100).toFixed(2) : 0
        }
      }
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// Calculation Analytics
const getCalculationAnalytics = async (req, res) => {
  try {
    const { period = 'last30days' } = req.query;
    
    let dateFilter = {};
    if (period === 'last30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter = { createdAt: { $gte: thirtyDaysAgo } };
    } else if (period === 'last7days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      dateFilter = { createdAt: { $gte: sevenDaysAgo } };
    }

    // Calculation types distribution
    const calculationTypes = await Calculation.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalCost: { $sum: '$results.totalCost' },
          avgCost: { $avg: '$results.totalCost' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Most popular materials
    const popularMaterials = await Calculation.aggregate([
      { $match: dateFilter },
      { $unwind: '$inputs.selectedMaterialModel' },
      {
        $group: {
          _id: '$inputs.selectedMaterialModel.name',
          usageCount: { $sum: 1 },
          avgCost: { $avg: '$results.totalCost' }
        }
      },
      { $sort: { usageCount: -1 } },
      { $limit: 10 }
    ]);

    // Monthly trend (last 12 months)
    const monthlyTrend = await Calculation.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          totalCost: { $sum: '$results.totalCost' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    res.json({
      success: true,
      data: {
        calculationTypes,
        popularMaterials,
        monthlyTrend,
        period
      }
    });
  } catch (error) {
    console.error('Calculation analytics error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// User Analytics
const getUserAnalytics = async (req, res) => {
  try {
    // User segmentation
    const userSegmentation = await User.aggregate([
      {
        $group: {
          _id: '$membership.type',
          count: { $sum: 1 },
          avgWallet: { $avg: '$wallet' }
        }
      }
    ]);

    // Most active users (by calculation count)
    const topActiveUsers = await Calculation.aggregate([
      {
        $group: {
          _id: '$userId',
          calculationCount: { $sum: 1 },
          totalSpent: { $sum: '$results.totalCost' },
          lastActivity: { $max: '$createdAt' }
        }
      },
      { $sort: { calculationCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$_id',
          username: '$user.username',
          phone: '$user.phone',
          calculationCount: 1,
          totalSpent: 1,
          lastActivity: 1,
          membership: '$user.membership.type'
        }
      }
    ]);

    // User registration trend (last 12 months)
    const registrationTrend = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    // Premium vs Free users
    const membershipStats = await User.aggregate([
      {
        $group: {
          _id: {
            membership: '$membership.type',
            isActive: '$isActive'
          },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        userSegmentation,
        topActiveUsers,
        registrationTrend,
        membershipStats
      }
    });
  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// Financial Analytics
const getFinancialAnalytics = async (req, res) => {
  try {
    const { period = 'last30days' } = req.query;
    
    let dateFilter = {};
    if (period === 'last30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter = { date: { $gte: thirtyDaysAgo } };
    }

    // Total revenue (Purchase + Deposit)
    const totalRevenue = await Purchase.aggregate([
      { $match: { ...dateFilter, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalDeposits = await Deposit.aggregate([
      { $match: { ...dateFilter, status: 'confirmed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalWithdrawals = await Withdraw.aggregate([
      { $match: { ...dateFilter, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Monthly financial trend
    const monthlyFinancialTrend = await Promise.all([
      Purchase.aggregate([
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' }
            },
            revenue: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 }
      ]),
      Deposit.aggregate([
        { $match: { status: 'confirmed' } },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' }
            },
            deposits: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 }
      ]),
      Withdraw.aggregate([
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' }
            },
            withdrawals: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 }
      ])
    ]);

    // Top transactions
    const topTransactions = await Promise.all([
      Purchase.find({ status: 'completed' })
        .sort({ amount: -1 })
        .limit(5)
        .select('phone orderId item amount date processedBy'),
      Deposit.find({ status: 'confirmed' })
        .sort({ amount: -1 })
        .limit(5)
        .select('phone orderId amount date processedBy'),
      Withdraw.find({ status: 'completed' })
        .sort({ amount: -1 })
        .limit(5)
        .select('phone orderId amount date processedBy')
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalRevenue: totalRevenue[0]?.total || 0,
          totalDeposits: totalDeposits[0]?.total || 0,
          totalWithdrawals: totalWithdrawals[0]?.total || 0,
          netIncome: (totalRevenue[0]?.total || 0) + (totalDeposits[0]?.total || 0) - (totalWithdrawals[0]?.total || 0)
        },
        monthlyTrend: {
          purchases: monthlyFinancialTrend[0],
          deposits: monthlyFinancialTrend[1],
          withdrawals: monthlyFinancialTrend[2]
        },
        topTransactions: {
          purchases: topTransactions[0],
          deposits: topTransactions[1],
          withdrawals: topTransactions[2]
        },
        period
      }
    });
  } catch (error) {
    console.error('Financial analytics error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// Material Analytics
const getMaterialAnalytics = async (req, res) => {
  try {
    // Most popular materials
    const popularMaterials = await Material.find({ isActive: true })
      .sort({ popularity: -1, viewCount: -1 })
      .limit(10)
      .select('name price rating popularity viewCount likeCount category')
      .populate('category', 'name parentCategory');

    // Material categories distribution
    const materialCategories = await Material.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'materialcategories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      { $unwind: '$categoryInfo' },
      {
        $group: {
          _id: '$categoryInfo.parentCategory.name',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          avgRating: { $avg: '$rating' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Premium vs Regular materials
    const materialStats = await Material.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$isPremium',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          avgRating: { $avg: '$rating' }
        }
      }
    ]);

    // Most liked materials
    const mostLikedMaterials = await Material.find({ isActive: true })
      .sort({ likeCount: -1 })
      .limit(10)
      .select('name likeCount rating price category')
      .populate('category', 'name');

    res.json({
      success: true,
      data: {
        popularMaterials,
        materialCategories,
        materialStats,
        mostLikedMaterials
      }
    });
  } catch (error) {
    console.error('Material analytics error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// Idea Analytics
const getIdeaAnalytics = async (req, res) => {
  try {
    // Most popular ideas
    const popularIdeas = await Idea.find({ isActive: true, isPublished: true })
      .sort({ popularity: -1, soldCount: -1 })
      .limit(10)
      .select('title category heatingType totalCost soldCount popularity viewCount rating')
      .populate('category', 'name')
      .populate('heatingType', 'name');

    // Idea categories distribution
    const ideaCategories = await Idea.aggregate([
      { $match: { isActive: true, isPublished: true } },
      {
        $lookup: {
          from: 'ideacategories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      { $unwind: '$categoryInfo' },
      {
        $group: {
          _id: '$categoryInfo.name',
          count: { $sum: 1 },
          avgCost: { $avg: '$totalCost' },
          totalSold: { $sum: '$soldCount' },
          avgRating: { $avg: '$rating.average' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Premium vs Free ideas
    const ideaStats = await Idea.aggregate([
      { $match: { isActive: true, isPublished: true } },
      {
        $group: {
          _id: '$isPremium',
          count: { $sum: 1 },
          avgCost: { $avg: '$totalCost' },
          totalSold: { $sum: '$soldCount' },
          avgRating: { $avg: '$rating.average' }
        }
      }
    ]);

    // Best selling ideas
    const bestSellingIdeas = await Idea.find({ isActive: true, isPublished: true })
      .sort({ soldCount: -1 })
      .limit(10)
      .select('title soldCount totalCost purchasePrice rating category')
      .populate('category', 'name');

    res.json({
      success: true,
      data: {
        popularIdeas,
        ideaCategories,
        ideaStats,
        bestSellingIdeas
      }
    });
  } catch (error) {
    console.error('Idea analytics error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// Real-time Dashboard
const getRealtimeDashboard = async (req, res) => {
  try {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Last 24 hours activities
    const [
      recentCalculations,
      recentUsers,
      recentPurchases,
      recentDeposits,
      recentWithdrawals
    ] = await Promise.all([
      Calculation.countDocuments({ createdAt: { $gte: last24Hours } }),
      User.countDocuments({ 
        createdAt: { $gte: last24Hours },
        role: { $nin: ['admin', 'moderator', 'superadmin', 'operator'] }
      }), // Count only new non-admin users
      Purchase.countDocuments({ date: { $gte: last24Hours }, status: 'completed' }),
      Deposit.countDocuments({ date: { $gte: last24Hours }, status: 'confirmed' }),
      Withdraw.countDocuments({ date: { $gte: last24Hours }, status: 'completed' })
    ]);

    // Last 7 days trend
    const weeklyTrend = await Calculation.aggregate([
      { $match: { createdAt: { $gte: last7Days } } },
      {
        $group: {
          _id: {
            day: { $dayOfWeek: '$createdAt' },
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Active users (logged in within last 7 days)
    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: last7Days }
    });

    // Latest calculations
    const latestCalculations = await Calculation.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('userId type results.totalCost createdAt')
      .populate('userId', 'username phone');

    res.json({
      success: true,
      data: {
        last24Hours: {
          calculations: recentCalculations,
          users: recentUsers,
          purchases: recentPurchases,
          deposits: recentDeposits,
          withdrawals: recentWithdrawals
        },
        weeklyTrend,
        activeUsers,
        latestCalculations,
        timestamp: now
      }
    });
  } catch (error) {
    console.error('Realtime dashboard error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// Mobile Dashboard
const getMobileDashboard = async (req, res) => {
  try {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Basic metrics
    const [
      totalUsers,
      totalCalculations,
      totalMaterials,
      totalIdeas,
      monthlyRevenue
    ] = await Promise.all([
      User.countDocuments({ role: { $nin: ['admin', 'moderator', 'superadmin', 'operator'] } }), // Count only non-admin users
      Calculation.countDocuments(),
      Material.countDocuments({ isActive: true }),
      Idea.countDocuments({ isActive: true }),
      Purchase.aggregate([
        { 
          $match: { 
            status: 'completed', 
            date: { $gte: last30Days } 
          } 
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    // Today's activities
    const [
      todayCalculations,
      todayUsers,
      todayRevenue
    ] = await Promise.all([
      Calculation.countDocuments({ createdAt: { $gte: last24Hours } }),
      User.countDocuments({ 
        createdAt: { $gte: last24Hours },
        role: { $nin: ['admin', 'moderator', 'superadmin', 'operator'] }
      }), // Count only new non-admin users
      Purchase.aggregate([
        { 
          $match: { 
            status: 'completed', 
            date: { $gte: last24Hours } 
          } 
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    // Quick statistics
    const quickStats = await Promise.all([
      Calculation.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      Material.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$isPremium', count: { $sum: 1 } } }
      ]),
      User.aggregate([
        { $group: { _id: '$membership.type', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        keyMetrics: {
          totalUsers,
          totalCalculations,
          totalMaterials,
          totalIdeas,
          monthlyRevenue: monthlyRevenue[0]?.total || 0
        },
        todayStats: {
          calculations: todayCalculations,
          users: todayUsers,
          revenue: todayRevenue[0]?.total || 0
        },
        quickStats: {
          calculationTypes: quickStats[0],
          materialTypes: quickStats[1],
          userTypes: quickStats[2]
        },
        timestamp: now
      }
    });
  } catch (error) {
    console.error('Mobile dashboard error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

module.exports = {
  getDashboardSummary,
  getCalculationAnalytics,
  getUserAnalytics,
  getFinancialAnalytics,
  getMaterialAnalytics,
  getIdeaAnalytics,
  getRealtimeDashboard,
  getMobileDashboard
};

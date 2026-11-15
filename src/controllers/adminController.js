const User = require('../models/User');
const Admin = require('../models/Admin');
const Material = require('../models/Material');
const Idea = require('../models/Idea');
const Calculation = require('../models/Calculation');
const errorMessageService = require('../services/errorMessageService');
const roleService = require('../services/roleService');

const permissionDenied = (res) => res.status(403).json({
  success: false,
  message: 'You do not have permission for this action',
  code: 'PERMISSION_DENIED'
});

// Roles an app user (users collection) may hold
const USER_ROLES = ['user', 'moderator'];
// @desc    Change admin password
// @route   POST /api/admin/change-password
// @access  Admin
const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('CURRENT_PASSWORD_REQUIRED', errorMessageService.getLocaleFromRequest(req))
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('PASSWORDS_DO_NOT_MATCH', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Dashboard passwords: at least 4 characters
    if (String(newPassword).length < 4) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 4 characters'
      });
    }

    const adminUser = await Admin.findById(req.user._id);

    if (!adminUser) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('USER_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    const isMatch = await adminUser.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('CURRENT_PASSWORD_INCORRECT', errorMessageService.getLocaleFromRequest(req))
      });
    }

    adminUser.password = newPassword;
    await adminUser.save();

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('PASSWORD_UPDATED_SUCCESS', errorMessageService.getLocaleFromRequest(req)),
      data: {
        user: {
          _id: adminUser._id,
          username: adminUser.username,
          role: adminUser.role,
          updatedAt: adminUser.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Change admin password error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};


// @desc    Get dashboard analytics
// @route   GET /api/admin/dashboard
// @access  Admin
const getDashboardAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const premiumUsers = await User.countDocuments({ 'membership.type': 'premium' });
    const totalMaterials = await Material.countDocuments({ isActive: true });
    const totalIdeas = await Idea.countDocuments({ isActive: true });
    const totalCalculations = await Calculation.countDocuments();

    const recentUsers = await User.find({ isActive: true })
      .select('username phone createdAt lastLogin')
      .sort('-createdAt')
      .limit(10);

    const popularMaterials = await Material.find({ isActive: true })
      .select('name viewCount popularity category')
      .sort('-popularity')
      .limit(5);

    const popularIdeas = await Idea.find({ isActive: true })
      .select('title viewCount likeCount purchaseCount category')
      .sort('-popularity')
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          premiumUsers,
          totalMaterials,
          totalIdeas,
          totalCalculations
        },
        recentUsers,
        popularMaterials,
        popularIdeas
      }
    });
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get users list
// @route   GET /api/admin/users
// @access  Admin
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search;
    const isActive = req.query.isActive;
    const membershipType = req.query.membershipType;
    const role = req.query.role;
    const banned = req.query.banned; // 'all', 'active', 'banned'

    const filter = {};
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (membershipType) filter['membership.type'] = membershipType;
    if (role) filter.role = role;

    // Handle banned filter
    if (banned === 'banned') {
      filter.isBanned = true;
    } else if (banned === 'active') {
      filter.isBanned = false;
    }
    // 'all' means no filter applied

    const users = await User.find(filter)
      .select('-password')
      .limit(limit)
      .skip(skip)
      .sort('-createdAt');

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get admins list
// @route   GET /api/admin/admins
// @access  Admin
const getAdmins = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const roleParam = req.query.role; // a role key (built-in or custom) or all
    const search = req.query.search;

    // Build filter
    const filter = {};

    // Role filter - default to all admin roles if not specified or 'all'
    if (!roleParam || roleParam === 'all') {
      // every dashboard account
    } else if (/^[a-z][a-z0-9_]{1,29}$/.test(roleParam)) {
      filter.role = roleParam;
    } else {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('INVALID_ROLE_PARAMETER', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Search filter - only by username
    if (search) {
      filter.username = { $regex: search, $options: 'i' };
    }

    const admins = await Admin.find(filter)
      .select('-password')
      .limit(limit)
      .skip(skip)
      .sort('-createdAt');

    const total = await Admin.countDocuments(filter);

    // Get counts by role
    const roleStats = await Admin.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = {
      total: total,
      byRole: roleStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    };

    res.status(200).json({
      success: true,
      data: {
        admins,
        stats,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Admin
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('USER_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Get user's calculation statistics
    const calculationStats = await Calculation.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalCost: { $sum: '$results.totalCost' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        user,
        calculationStats
      }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Update admin
// @route   PUT /api/admin/admins/:id
// @access  Admin
const updateAdmin = async (req, res) => {
  try {
    const { username, email, role, isActive, phone, password } = req.body;

    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('USER_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Validate role if provided (built-in or custom role from Roles & Permission)
    if (role && !(await roleService.roleExists(role))) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('INVALID_ROLE_ADMIN', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Own information and password are always editable; everything else needs a permission
    const isSelf = admin._id.toString() === req.user._id.toString();
    const changesInfo = [username, email, phone].some((v) => v !== undefined);
    const changesPassword = password !== undefined && password !== null && password !== '';
    const changesRole = role !== undefined || isActive !== undefined;
    if (!isSelf) {
      if (changesInfo && !(await roleService.hasPermission(req, 'admins.edit'))) return permissionDenied(res);
      if (changesPassword && !(await roleService.hasPermission(req, 'admins.password'))) return permissionDenied(res);
    }
    if (changesRole && !(await roleService.hasPermission(req, isActive === false && role === undefined ? 'admins.deactivate' : 'admins.role'))) {
      return permissionDenied(res);
    }
    // Only a superadmin can make someone superadmin or change a superadmin
    const touchesSuperadmin = (role !== undefined && role !== admin.role && (role === 'superadmin' || admin.role === 'superadmin')) ||
      (isActive === false && admin.role === 'superadmin');
    if (touchesSuperadmin && req.user.role !== 'superadmin') return permissionDenied(res);

    if (password !== undefined && password !== null && password !== '' && String(password).length < 4) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 4 characters'
      });
    }

    // Lock-out protection: no one can change their own role or deactivate themselves
    if (isSelf && role !== undefined && role !== admin.role) {
      return res.status(400).json({ success: false, message: "You can't change your own role" });
    }
    if (isSelf && isActive === false) {
      return res.status(400).json({ success: false, message: "You can't deactivate your own account" });
    }
    // ...and the last active superadmin can't be demoted or deactivated
    const losesSuperadmin = admin.role === 'superadmin' && admin.isActive &&
      ((role !== undefined && role !== 'superadmin') || isActive === false);
    if (losesSuperadmin) {
      const otherSuperadmins = await Admin.countDocuments({ role: 'superadmin', isActive: true, _id: { $ne: admin._id } });
      if (otherSuperadmins === 0) {
        return res.status(400).json({ success: false, message: 'At least one active superadmin is required' });
      }
    }

    // Update fields if provided
    if (username !== undefined) admin.username = username;
    if (email !== undefined) admin.email = email || undefined;
    if (phone !== undefined) admin.phone = phone;
    if (role !== undefined) admin.role = role;
    if (isActive !== undefined) admin.isActive = isActive;
    if (password) admin.password = password; // hashed by pre-save hook

    await admin.save();

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('ADMIN_UPDATED_SUCCESS', errorMessageService.getLocaleFromRequest(req)),
      data: {
        admin: admin.toSafeJSON()
      }
    });
  } catch (error) {
    console.error('Update admin error:', error);

    if (error.name === 'ValidationError') {
      const first = Object.values(error.errors || {})[0];
      return res.status(400).json({ success: false, message: first?.message || error.message });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('FIELD_ALREADY_EXISTS', errorMessageService.getLocaleFromRequest(req), { field })
      });
    }

    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get one dashboard admin (admin edit page)
// @route   GET /api/admin/admins/:id
// @access  Admin
const getAdminById = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id).populate('createdBy', 'username');
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('USER_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }
    res.status(200).json({
      success: true,
      data: {
        admin: {
          ...admin.toSafeJSON(),
          createdBy: admin.createdBy ? { id: admin.createdBy._id, username: admin.createdBy.username } : null
        }
      }
    });
  } catch (error) {
    console.error('Get admin error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Delete admin
// @route   DELETE /api/admin/admins/:id
// @access  Admin
const deleteAdmin = async (req, res) => {
  try {
    if (!(await roleService.hasPermission(req, 'admins.deactivate'))) return permissionDenied(res);

    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('USER_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }
    if (admin.role === 'superadmin' && req.user.role !== 'superadmin') return permissionDenied(res);

    // Prevent deleting yourself
    if (admin._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('CANNOT_DELETE_YOURSELF', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Soft delete - deactivate dashboard account (kept in admins collection)
    admin.isActive = false;
    await admin.save();

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('ADMIN_DELETED_SUCCESS', errorMessageService.getLocaleFromRequest(req))
    });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Admin
const updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('USER_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    user.isActive = isActive;
    await user.save();

    const locale = errorMessageService.getLocaleFromRequest(req);
    const statusText = isActive ? (locale === 'mn' ? 'идэвхжүүлсэн' : 'activated') : (locale === 'mn' ? 'идэвхгүй болгосон' : 'deactivated');
    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('USER_ACTIVATED_DEACTIVATED_SUCCESS', locale, { status: statusText }),
      data: {
        user: {
          id: user._id,
          username: user.username,
          phone: user.phone,
          isActive: user.isActive
        }
      }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Ban/Unban user
// @route   PUT /api/admin/users/:id/ban
// @access  Operator only
const banUser = async (req, res) => {
  try {
    // Roles & Permission: users.ban (by default only the Operator role has it)
    if (!(await roleService.hasPermission(req, 'users.ban'))) {
      return res.status(403).json({
        success: false,
        message: errorMessageService.getMessage('ONLY_OPERATORS_CAN_BAN', errorMessageService.getLocaleFromRequest(req)),
        code: 'PERMISSION_DENIED'
      });
    }

    const { isBanned, banReason } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('USER_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    user.isBanned = isBanned;
    if (isBanned) {
      user.bannedAt = new Date();
      user.banReason = banReason || 'No reason provided';
    } else {
      user.bannedAt = null;
      user.banReason = null;
    }

    await user.save();

    const locale = errorMessageService.getLocaleFromRequest(req);
    const statusText = isBanned ? (locale === 'mn' ? 'хориглосон' : 'banned') : (locale === 'mn' ? 'хориглохгүй болгосон' : 'unbanned');
    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('USER_BANNED_UNBANNED_SUCCESS', locale, { status: statusText }),
      data: {
        user: {
          id: user._id,
          username: user.username,
          phone: user.phone,
          isBanned: user.isBanned,
          bannedAt: user.bannedAt,
          banReason: user.banReason
        }
      }
    });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Admin
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    // App users can only be 'user' or 'moderator'. Dashboard admins live in the admins collection.
    if (!USER_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('INVALID_ROLE', errorMessageService.getLocaleFromRequest(req))
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('USER_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    user.role = role;
    user.isAdmin = false;

    await user.save();

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('USER_ROLE_UPDATED_SUCCESS', errorMessageService.getLocaleFromRequest(req), { role }),
      data: {
        user: {
          id: user._id,
          username: user.username,
          phone: user.phone,
          role: user.role,
          isAdmin: user.isAdmin
        }
      }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Admin, Superadmin only
const deleteUser = async (req, res) => {
  try {
    // Roles & Permission: users.delete (by default Admin and Superadmin)
    if (!(await roleService.hasPermission(req, 'users.delete'))) {
      return res.status(403).json({
        success: false,
        message: errorMessageService.getMessage('ONLY_ADMIN_CAN_DELETE', errorMessageService.getLocaleFromRequest(req)),
        code: 'PERMISSION_DENIED'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('USER_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Prevent deleting admin users through this endpoint
    if (['admin', 'superadmin', 'operator'].includes(user.role)) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('CANNOT_DELETE_ADMIN', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('CANNOT_DELETE_YOURSELF', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Hard delete - permanently remove user from database
    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('USER_PERMANENTLY_DELETED', errorMessageService.getLocaleFromRequest(req))
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get materials list for admin
// @route   GET /api/admin/materials
// @access  Admin
const getMaterials = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const category = req.query.category;
    const isActive = req.query.isActive;

    const filter = {};
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const materials = await Material.find(filter)
      .limit(limit)
      .skip(skip)
      .sort('-createdAt');

    const total = await Material.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        materials,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Create new material
// @route   POST /api/admin/materials
// @access  Admin
const createMaterial = async (req, res) => {
  try {
    // Whitelist allowed fields to prevent NoSQL injection
    const allowedFields = [
      'name', 'description', 'category', 'price', 'specs', 'rating',
      'width', 'length', 'height', 'unit', 'images', 'ingredients',
      'thicknessOptions', 'isPremium', 'isActive', 'tags',
      'supplier', 'likeCount', 'popularity', 'viewCount'
    ];

    const materialData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        materialData[field] = req.body[field];
      }
    });

    const material = new Material(materialData);
    await material.save();

    res.status(201).json({
      success: true,
      message: errorMessageService.getMessage('MATERIAL_CREATED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        material
      }
    });
  } catch (error) {
    console.error('Create material error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Update material
// @route   PUT /api/admin/materials/:id
// @access  Admin
const updateMaterial = async (req, res) => {
  try {
    // Whitelist allowed fields to prevent NoSQL injection
    const allowedFields = [
      'name', 'description', 'category', 'price', 'specs', 'rating',
      'width', 'length', 'height', 'unit', 'images', 'ingredients',
      'thicknessOptions', 'isPremium', 'isActive', 'tags',
      'supplier', 'likeCount', 'popularity', 'viewCount'
    ];

    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const material = await Material.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!material) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('MATERIAL_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('MATERIAL_UPDATED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        material
      }
    });
  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Delete material
// @route   DELETE /api/admin/materials/:id
// @access  Admin
const deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('MATERIAL_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Hard delete
    await Material.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('MATERIAL_DELETED', errorMessageService.getLocaleFromRequest(req))
    });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get ideas list for admin
// @route   GET /api/admin/ideas
// @access  Admin
const getIdeas = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const category = req.query.category;
    const isActive = req.query.isActive;

    const filter = {};
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const ideas = await Idea.find(filter)
      .populate('relatedMaterials', 'name category')
      .limit(limit)
      .skip(skip)
      .sort('-createdAt');

    const total = await Idea.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        ideas,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get ideas error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Create new idea
// @route   POST /api/admin/ideas
// @access  Admin
const createIdea = async (req, res) => {
  try {
    // Whitelist allowed fields to prevent NoSQL injection
    const allowedFields = [
      'title', 'description', 'category', 'heatingType', 'shortDetail',
      'images', 'size', 'totalCost', 'addItem', 'isPremium', 'isPublished', 'tags'
    ];

    const ideaData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        ideaData[field] = req.body[field];
      }
    });

    const idea = new Idea(ideaData);
    await idea.save();

    res.status(201).json({
      success: true,
      message: errorMessageService.getMessage('IDEA_CREATED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        idea
      }
    });
  } catch (error) {
    console.error('Create idea error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Update idea
// @route   PUT /api/admin/ideas/:id
// @access  Admin
const updateIdea = async (req, res) => {
  try {
    // Whitelist allowed fields to prevent NoSQL injection
    const allowedFields = [
      'title', 'description', 'category', 'heatingType', 'shortDetail',
      'images', 'size', 'totalCost', 'addItem', 'isPremium', 'isPublished', 'tags'
    ];

    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const idea = await Idea.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!idea) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('IDEA_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('IDEA_UPDATED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        idea
      }
    });
  } catch (error) {
    console.error('Update idea error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Delete idea
// @route   DELETE /api/admin/ideas/:id
// @access  Admin
const deleteIdea = async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id);

    if (!idea) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('IDEA_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Soft delete by deactivating
    idea.isActive = false;
    await idea.save();

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('IDEA_DEACTIVATED', errorMessageService.getLocaleFromRequest(req))
    });
  } catch (error) {
    console.error('Delete idea error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// Analytics endpoints
const getUserAnalytics = async (req, res) => {
  try {
    const analytics = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
          premiumUsers: { $sum: { $cond: [{ $eq: ['$membership.type', 'premium'] }, 1, 0] } },
          avgWalletBalance: { $avg: '$wallet' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: { analytics: analytics[0] }
    });
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

const getCalculationAnalytics = async (req, res) => {
  try {
    // Enhanced analytics with new model structure support
    const analytics = await Calculation.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          // Use new structure price if available, fallback to old
          avgCost: {
            $avg: {
              $ifNull: ['$inputs.totalPrice', '$results.totalCost']
            }
          },
          totalCost: {
            $sum: {
              $ifNull: ['$inputs.totalPrice', '$results.totalCost']
            }
          },
          totalVolume: {
            $sum: {
              $ifNull: ['$inputs.totalVolume', '$results.totalVolume']
            }
          },
          avgVolume: {
            $avg: {
              $ifNull: ['$inputs.totalVolume', '$results.totalVolume']
            }
          },
          totalMaterialItems: {
            $sum: {
              $ifNull: ['$inputs.materialItemCount', 0]
            }
          },
          newStructureCount: {
            $sum: {
              $cond: [
                { $ne: ['$inputs.selectedMaterialModel', null] },
                1,
                0
              ]
            }
          },
          bookmarkedCount: {
            $sum: {
              $cond: [{ $eq: ['$isBookmarked', true] }, 1, 0]
            }
          },
          recentCount: {
            $sum: {
              $cond: [
                { $gte: ['$createdAt', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] },
                1,
                0
              ]
            }
          },
          lastCalculation: { $max: '$createdAt' },
          firstCalculation: { $min: '$createdAt' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get most used materials from new structure
    const materialAnalytics = await Calculation.aggregate([
      {
        $match: {
          'inputs.selectedMaterialModel.name': { $exists: true }
        }
      },
      {
        $group: {
          _id: {
            materialId: '$inputs.selectedMaterialModel._id',
            materialName: '$inputs.selectedMaterialModel.name',
            materialType: '$inputs.selectedMaterialModel.type'
          },
          usageCount: { $sum: 1 },
          totalCost: {
            $sum: {
              $ifNull: ['$inputs.totalPrice', 0]
            }
          },
          avgCost: {
            $avg: {
              $ifNull: ['$inputs.totalPrice', 0]
            }
          },
          lastUsed: { $max: '$createdAt' },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      { $sort: { usageCount: -1 } },
      { $limit: 20 }
    ]);

    // Overall system analytics
    const totalCalculations = await Calculation.countDocuments();
    const newStructureCalculations = await Calculation.countDocuments({
      'inputs.selectedMaterialModel': { $exists: true }
    });
    const bookmarkedCalculations = await Calculation.countDocuments({
      isBookmarked: true
    });

    // Calculate type names in English
    const typeNames = {
      'wall': 'Wall',
      'fundament': 'Foundation',
      'roof': 'Roof',
      'inner_wall': 'Inner Wall',
      'underfloor': 'Underfloor',
      'floor_tiles': 'Floor Tiles',
      'wall_decoration': 'Wall Decoration'
    };

    // Process analytics with enhanced data
    const processedAnalytics = analytics.map(stat => ({
      ...stat,
      typeName: typeNames[stat._id] || stat._id,
      totalCost: stat.totalCost || 0,
      avgCost: Math.round(stat.avgCost) || 0,
      totalVolume: stat.totalVolume ? parseFloat(stat.totalVolume.toFixed(2)) : 0,
      avgVolume: stat.avgVolume ? parseFloat(stat.avgVolume.toFixed(2)) : 0,
      newStructurePercentage: stat.count > 0
        ? Math.round((stat.newStructureCount / stat.count) * 100)
        : 0,
      bookmarkPercentage: stat.count > 0
        ? Math.round((stat.bookmarkedCount / stat.count) * 100)
        : 0,
      recentPercentage: stat.count > 0
        ? Math.round((stat.recentCount / stat.count) * 100)
        : 0
    }));

    // Process material analytics
    const processedMaterialAnalytics = materialAnalytics.map(material => ({
      ...material,
      materialName: material._id.materialName,
      materialType: material._id.materialType,
      totalCost: material.totalCost,
      avgCost: Math.round(material.avgCost),
      uniqueUsersCount: material.uniqueUsers.length,
      avgCostPerUser: material.uniqueUsers.length > 0
        ? Math.round(material.totalCost / material.uniqueUsers.length)
        : 0
    }));

    // Calculate overall totals
    const overallTotals = analytics.reduce((acc, stat) => ({
      totalCost: acc.totalCost + (stat.totalCost || 0),
      totalVolume: acc.totalVolume + (stat.totalVolume || 0),
      totalMaterialItems: acc.totalMaterialItems + (stat.totalMaterialItems || 0)
    }), {
      totalCost: 0,
      totalVolume: 0,
      totalMaterialItems: 0
    });

    res.status(200).json({
      success: true,
      data: {
        analytics: processedAnalytics,
        materialAnalytics: processedMaterialAnalytics,
        systemOverview: {
          totalCalculations,
          newStructureCalculations,
          bookmarkedCalculations,
          legacyCalculations: totalCalculations - newStructureCalculations,
          newStructurePercentage: totalCalculations > 0
            ? Math.round((newStructureCalculations / totalCalculations) * 100)
            : 0,
          bookmarkPercentage: totalCalculations > 0
            ? Math.round((bookmarkedCalculations / totalCalculations) * 100)
            : 0,
          ...overallTotals,
          totalCost: overallTotals.totalCost,
          totalVolume: parseFloat(overallTotals.totalVolume.toFixed(2)),
          avgCostPerCalculation: totalCalculations > 0
            ? Math.round(overallTotals.totalCost / totalCalculations)
            : 0
        }
      }
    });
  } catch (error) {
    console.error('Get calculation analytics error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

const getRevenueAnalytics = async (req, res) => {
  try {
    // In a real implementation, you would calculate from transaction records
    res.status(200).json({
      success: true,
      data: {
        analytics: {
          totalRevenue: 0,
          monthlyRevenue: 0,
          message: errorMessageService.getMessage('REVENUE_ANALYTICS_NOT_IMPLEMENTED', errorMessageService.getLocaleFromRequest(req))
        }
      }
    });
  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

const getSystemStats = async (req, res) => {
  try {
    const stats = {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV
    };

    res.status(200).json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

const cleanupSystem = async (req, res) => {
  try {
    // Cleanup expired SMS verifications
    const SmsVerification = require('../models/SmsVerification');
    const deletedVerifications = await SmsVerification.cleanupExpired();

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('SYSTEM_CLEANUP_COMPLETED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        deletedVerifications: deletedVerifications.deletedCount || 0
      }
    });
  } catch (error) {
    console.error('Cleanup system error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};


// @desc    Get material ingredients for admin editing
// @route   GET /api/admin/materials/:id/ingredients
// @access  Admin
const getMaterialIngredients = async (req, res) => {
  try {
    const { id } = req.params;

    const material = await Material.findById(id).select('name ingredients category');
    if (!material) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('MATERIAL_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    res.status(200).json({
      success: true,
      data: {
        material: {
          id: material._id,
          name: material.name,
          category: material.category,
          ingredients: material.ingredients || []
        }
      }
    });
  } catch (error) {
    console.error('Get material ingredients error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Update material ingredients
// @route   PUT /api/admin/materials/:id/ingredients
// @access  Admin
const updateMaterialIngredients = async (req, res) => {
  try {
    const { id } = req.params;
    const { ingredients } = req.body;

    // Validate ingredients structure
    if (!Array.isArray(ingredients)) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('INGREDIENTS_ARRAY', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Validate each ingredient
    for (const ingredient of ingredients) {
      if (!ingredient.name || !ingredient.unit ||
        typeof ingredient.requiredPercent !== 'number' ||
        typeof ingredient.costPerM3 !== 'number') {
        return res.status(400).json({
          success: false,
          message: errorMessageService.getMessage('INGREDIENT_FIELDS_REQUIRED', errorMessageService.getLocaleFromRequest(req))
        });
      }

      // Validate percentage range
      if (ingredient.requiredPercent < 0 || ingredient.requiredPercent > 100) {
        return res.status(400).json({
          success: false,
          message: errorMessageService.getMessage('REQUIRED_PERCENT_RANGE', errorMessageService.getLocaleFromRequest(req))
        });
      }
    }

    const material = await Material.findById(id);
    if (!material) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('MATERIAL_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    material.ingredients = ingredients;
    await material.save();

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('MATERIAL_INGREDIENTS_UPDATED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        material: {
          id: material._id,
          name: material.name,
          ingredients: material.ingredients
        }
      }
    });
  } catch (error) {
    console.error('Update material ingredients error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Preview ingredients calculation
// @route   POST /api/admin/materials/:id/ingredients/preview
// @access  Admin
const previewIngredientsCalculation = async (req, res) => {
  try {
    const { id } = req.params;
    const { sampleVolume = 1, sampleArea = 1, calculationType = 'wall' } = req.body;

    const material = await Material.findById(id).select('name ingredients');
    if (!material) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('MATERIAL_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    const preview = {
      material: {
        name: material.name,
        id: material._id
      },
      sampleCalculation: {
        volume: sampleVolume,
        area: sampleArea,
        calculationType,
        ingredients: []
      },
      totalIngredientCost: 0
    };

    if (material.ingredients && material.ingredients.length > 0) {
      material.ingredients.forEach(ingredient => {
        // Calculate based on calculation type
        let baseValue = sampleVolume; // Default to volume

        // Some ingredients might be calculated per area instead of volume
        if (calculationType === 'floor_tiles' || calculationType === 'wall_decoration') {
          baseValue = sampleArea;
        }

        const requiredAmount = baseValue * (ingredient.requiredPercent / 100); // requiredPercent as percentage
        const totalCost = requiredAmount * ingredient.costPerM3;

        preview.sampleCalculation.ingredients.push({
          name: ingredient.name,
          requiredAmount: Math.round(requiredAmount * 100) / 100,
          unit: ingredient.unit,
          unitCost: ingredient.costPerM3,
          totalCost: Math.round(totalCost * 100) / 100,
          percentage: ingredient.requiredPercent
        });

        preview.totalIngredientCost += totalCost;
      });
    }

    preview.totalIngredientCost = Math.round(preview.totalIngredientCost * 100) / 100;

    res.status(200).json({
      success: true,
      data: { preview }
    });
  } catch (error) {
    console.error('Preview ingredients calculation error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// ====================
// Manual User Management (CRUD - No OTP Required)
// ====================

// @desc    Create user manually (no OTP verification)
// @route   POST /api/admin/manual-users
// @access  Admin
const createManualUser = async (req, res) => {
  try {
    const { username, phone, password, role, email } = req.body;

    if (role !== undefined && role !== null && role !== '' && !USER_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('INVALID_ROLE', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Validate required fields
    if (!username || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, phone and password are required'
      });
    }

    // Validate phone format
    if (!/^\+976[0-9]{8}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be in Mongolia format (+976XXXXXXXX)'
      });
    }

    // Validate password (4 digits)
    if (!/^\d{4}$/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be exactly 4 digits'
      });
    }

    // Check if phone already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this phone number already exists'
      });
    }

    // Create user
    const user = new User({
      username,
      phone,
      password,
      role: role || 'user',
      email: email || null,
      isVerified: true, // Manual users are verified by default
      isActive: true
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: {
          _id: user._id,
          username: user.username,
          phone: user.phone,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          isActive: user.isActive,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Create manual user error:', error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `A user with this ${field} already exists`
      });
    }

    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get all manual users with filters
// @route   GET /api/admin/manual-users
// @access  Admin
const getManualUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search;
    const role = req.query.role;
    const isActive = req.query.isActive;

    const filter = {};

    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const users = await User.find(filter)
      .select('-password')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get manual users error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get single user by ID
// @route   GET /api/admin/manual-users/:id
// @access  Admin
const getManualUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get manual user by ID error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Update user manually
// @route   PUT /api/admin/manual-users/:id
// @access  Admin
const updateManualUser = async (req, res) => {
  try {
    const { username, phone, password, role, email, isActive, premiumDays } = req.body;

    // premiumDays: whole days of premium from now; 0 ends premium (admin user edit page)
    if (premiumDays !== undefined && premiumDays !== null) {
      const days = Number(premiumDays);
      if (!Number.isInteger(days) || days < 0 || days > 3650) {
        return res.status(400).json({
          success: false,
          message: 'premiumDays must be a whole number between 0 and 3650'
        });
      }
    }

    if (role !== undefined && role !== null && role !== '' && !USER_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('INVALID_ROLE', errorMessageService.getLocaleFromRequest(req))
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate phone format if provided
    if (phone && !/^\+976[0-9]{8}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be in Mongolia format (+976XXXXXXXX)'
      });
    }

    // Validate password (4 digits) if provided
    if (password && !/^\d{4}$/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be exactly 4 digits'
      });
    }

    // Check if new phone number already exists (exclude current user)
    if (phone && phone !== user.phone) {
      const existingUser = await User.findOne({ phone, _id: { $ne: user._id } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'A user with this phone number already exists'
        });
      }
    }

    // Update fields
    if (username !== undefined) user.username = username;
    if (phone !== undefined) user.phone = phone;
    if (password !== undefined) user.password = password; // Will be hashed by pre-save hook
    if (role) {
      user.role = role;
      user.isAdmin = false;
    }
    // Empty email clears it (stored as missing, so the unique+sparse index allows many users without one)
    if (email !== undefined) user.email = email ? String(email).trim() : undefined;
    if (isActive !== undefined) user.isActive = isActive;
    if (premiumDays !== undefined && premiumDays !== null) {
      const days = Number(premiumDays);
      if (days === 0) {
        user.membership.type = 'free';
        user.membership.expiresAt = null;
      } else {
        user.membership.type = 'premium';
        user.membership.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        if (!user.membership.purchasedAt) user.membership.purchasedAt = new Date();
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: {
          _id: user._id,
          username: user.username,
          phone: user.phone,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          isAdmin: user.isAdmin,
          membership: user.membership,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Update manual user error:', error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `A user with this ${field} already exists`
      });
    }

    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Delete user manually (hard delete)
// @route   DELETE /api/admin/manual-users/:id
// @access  Admin
const deleteManualUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete yourself'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete manual user error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Change user password (admin only)
// @route   PUT /api/admin/users/:id/password
// @access  Admin
const changeUserPassword = async (req, res) => {
  try {
    const { password } = req.body;

    // Validate password (4 digits)
    if (!password || !/^\d{4}$/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be exactly 4 digits'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.password = password; // Will be hashed by pre-save hook
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      data: {
        user: {
          _id: user._id,
          username: user.username,
          phone: user.phone
        }
      }
    });
  } catch (error) {
    console.error('Change user password error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

module.exports = {
  getDashboardAnalytics,
  getUsers,
  getAdmins,
  getAdminById,
  getUserById,
  updateAdmin,
  deleteAdmin,
  updateUserStatus,
  banUser,
  updateUserRole,
  deleteUser,
  getMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  getIdeas,
  createIdea,
  updateIdea,
  deleteIdea,
  getUserAnalytics,
  getCalculationAnalytics,
  getRevenueAnalytics,
  getSystemStats,
  cleanupSystem,
  getMaterialIngredients,
  updateMaterialIngredients,
  previewIngredientsCalculation,
  changeAdminPassword,
  // Manual User Management (CRUD)
  createManualUser,
  getManualUsers,
  getManualUserById,
  updateManualUser,
  deleteManualUser,
  changeUserPassword
};
const Role = require('../models/Role');
const Admin = require('../models/Admin');
const roleService = require('../services/roleService');
const { PERMISSION_CATALOG, ALL_PERMISSIONS } = require('../config/permissions');

const fail = (res, status, message, code) => res.status(status).json({ success: false, message, ...(code ? { code } : {}) });

const toJSON = (role, adminCount = 0) => ({
  id: role._id,
  key: role.key,
  name: role.name,
  description: role.description || '',
  // Superadmin always has every permission (also ones added later)
  permissions: role.key === 'superadmin' ? ALL_PERMISSIONS : role.permissions.filter((p) => ALL_PERMISSIONS.includes(p)),
  isSystem: Boolean(role.isSystem),
  locked: Boolean(role.locked),
  adminCount,
  updatedAt: role.updatedAt
});

const cleanPermissions = (list) => {
  if (!Array.isArray(list)) return null;
  const set = new Set(list.filter((p) => ALL_PERMISSIONS.includes(p)));
  // An action on a page implies seeing the page
  for (const p of [...set]) set.add(`${p.split('.')[0]}.view`);
  return ALL_PERMISSIONS.filter((p) => set.has(p));
};

// A non-superadmin may not change the role they hold themselves (no self-escalation)
const guardOwnRole = (req, role) => req.user.role !== 'superadmin' && req.user.role === role.key;

// @desc    Permission catalog + roles (with how many admins use each)
// @route   GET /api/admin/roles
// @access  Admin (any dashboard account; used by role pickers too)
const listRoles = async (req, res) => {
  try {
    const [roles, counts] = await Promise.all([
      Role.find().sort({ isSystem: -1, createdAt: 1 }).lean(),
      Admin.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }])
    ]);
    const countByRole = Object.fromEntries(counts.map((c) => [c._id, c.count]));
    res.status(200).json({
      success: true,
      data: {
        catalog: PERMISSION_CATALOG,
        roles: roles.map((r) => toJSON(r, countByRole[r.key] || 0))
      }
    });
  } catch (error) {
    console.error('List roles error:', error);
    fail(res, 500, 'Failed to load roles');
  }
};

// @desc    Create a role
// @route   POST /api/admin/roles
// @access  roles.manage
const createRole = async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const key = String(req.body.key || name).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 30);
    if (!name) return fail(res, 400, 'Role name is required');
    if (!/^[a-z][a-z0-9_]{1,29}$/.test(key)) return fail(res, 400, 'Role key must start with a letter and use 2-30 lowercase letters, numbers or _');
    if (await Role.exists({ key })) return fail(res, 400, 'A role with this key already exists');

    const role = await Role.create({
      key,
      name,
      description: String(req.body.description || '').trim(),
      permissions: cleanPermissions(req.body.permissions) || ['dashboard.view'],
      updatedBy: req.user._id
    });
    roleService.invalidate();
    res.status(201).json({ success: true, message: 'Role created', data: { role: toJSON(role) } });
  } catch (error) {
    console.error('Create role error:', error);
    if (error.name === 'ValidationError') return fail(res, 400, error.message);
    fail(res, 500, 'Failed to create role');
  }
};

// @desc    Update a role (name, description, permissions)
// @route   PUT /api/admin/roles/:key
// @access  roles.manage
const updateRole = async (req, res) => {
  try {
    const role = await Role.findOne({ key: req.params.key });
    if (!role) return fail(res, 404, 'Role not found');
    if (role.locked) return fail(res, 400, 'The Superadmin role always has every permission and cannot be changed');
    if (guardOwnRole(req, role)) return fail(res, 403, "You can't change the permissions of your own role", 'PERMISSION_DENIED');

    const { name, description, permissions } = req.body;
    if (name !== undefined) {
      if (!String(name).trim()) return fail(res, 400, 'Role name is required');
      role.name = String(name).trim();
    }
    if (description !== undefined) role.description = String(description || '').trim();
    if (permissions !== undefined) {
      const cleaned = cleanPermissions(permissions);
      if (!cleaned) return fail(res, 400, 'Permissions must be a list');
      role.permissions = cleaned;
    }
    role.updatedBy = req.user._id;
    await role.save();
    roleService.invalidate();

    const adminCount = await Admin.countDocuments({ role: role.key });
    res.status(200).json({ success: true, message: 'Role updated', data: { role: toJSON(role, adminCount) } });
  } catch (error) {
    console.error('Update role error:', error);
    if (error.name === 'ValidationError') return fail(res, 400, error.message);
    fail(res, 500, 'Failed to update role');
  }
};

// @desc    Delete a custom role (only when no admin uses it)
// @route   DELETE /api/admin/roles/:key
// @access  roles.manage
const deleteRole = async (req, res) => {
  try {
    const role = await Role.findOne({ key: req.params.key });
    if (!role) return fail(res, 404, 'Role not found');
    if (role.isSystem) return fail(res, 400, 'Built-in roles cannot be deleted');
    const adminCount = await Admin.countDocuments({ role: role.key });
    if (adminCount > 0) return fail(res, 400, `This role is used by ${adminCount} admin(s). Move them to another role first.`, 'ROLE_IN_USE');

    await role.deleteOne();
    roleService.invalidate();
    res.status(200).json({ success: true, message: 'Role deleted' });
  } catch (error) {
    console.error('Delete role error:', error);
    fail(res, 500, 'Failed to delete role');
  }
};

module.exports = { listRoles, createRole, updateRole, deleteRole };

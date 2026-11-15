const Role = require('../models/Role');
const { ALL_PERMISSIONS, SYSTEM_ROLES } = require('../config/permissions');

// Role → permissions lookup used by every permission check (cached briefly).
const CACHE_MS = 30 * 1000;
let cache = { roles: null, at: 0 };

const invalidate = () => {
  cache = { roles: null, at: 0 };
};

// Creates the built-in roles on startup if they don't exist yet (edits are kept).
async function ensureSystemRoles() {
  for (const role of SYSTEM_ROLES) {
    const existing = await Role.findOne({ key: role.key });
    if (!existing) {
      await Role.create({ ...role, isSystem: true, locked: Boolean(role.locked) });
    } else if (!existing.isSystem || (role.locked && !existing.locked)) {
      existing.isSystem = true;
      existing.locked = Boolean(role.locked);
      await existing.save();
    }
  }
  invalidate();
}

async function loadRoles() {
  if (cache.roles && Date.now() - cache.at < CACHE_MS) return cache.roles;
  const docs = await Role.find().lean();
  const roles = new Map(docs.map((d) => [d.key, d]));
  cache = { roles, at: Date.now() };
  return roles;
}

async function roleExists(key) {
  if (!key) return false;
  return (await loadRoles()).has(key);
}

// Superadmin always has every permission, including ones added to the catalog later
async function getPermissions(roleKey) {
  if (roleKey === 'superadmin') return ALL_PERMISSIONS;
  const role = (await loadRoles()).get(roleKey);
  if (!role) return [];
  return role.permissions.filter((p) => ALL_PERMISSIONS.includes(p));
}

async function hasPermission(req, permission) {
  if (!req.user || req.accountType !== 'admin') return false;
  const perms = await getPermissions(req.user.role);
  return perms.includes(permission);
}

module.exports = { ensureSystemRoles, loadRoles, roleExists, getPermissions, hasPermission, invalidate };

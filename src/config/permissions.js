// Dashboard permissions: one entry per dashboard page, each with a "view" permission
// and the actions available on that page. A permission is "<page>.<action>",
// e.g. "users.view", "users.ban". Roles (Roles & Permission page) are lists of these.
// The dashboard reads this catalog from GET /api/admin/roles/catalog.

const PERMISSION_CATALOG = [
  { key: 'dashboard', label: 'Dashboard', path: '/dashboard', actions: [] },
  { key: 'chats', label: 'Chats', path: '/dashboard/chat', actions: [
    { key: 'reply', label: 'Reply to chats' },
    { key: 'status', label: 'Mark solved / unsolved' },
    { key: 'delete', label: 'Delete chats' }
  ] },
  { key: 'users', label: 'Users', path: '/dashboard/user-list', actions: [
    { key: 'create', label: 'Add users' },
    { key: 'edit', label: 'Edit user information' },
    { key: 'password', label: 'Change user PIN' },
    { key: 'status', label: 'Activate / deactivate' },
    { key: 'membership', label: 'Change membership' },
    { key: 'ban', label: 'Ban / unban' },
    { key: 'delete', label: 'Delete users' }
  ] },
  { key: 'deposits', label: 'Deposit', path: '/dashboard/deposit-list', actions: [
    { key: 'create', label: 'Create deposits' },
    { key: 'edit', label: 'Edit deposits' },
    { key: 'status', label: 'Change status' },
    { key: 'delete', label: 'Delete deposits' }
  ] },
  { key: 'purchases', label: 'Purchase', path: '/dashboard/purchase-list', actions: [
    { key: 'create', label: 'Create purchases' },
    { key: 'status', label: 'Change status' },
    { key: 'delete', label: 'Delete purchases' }
  ] },
  { key: 'purchased_ideas', label: 'Purchase Ideas', path: '/dashboard/purchased-ideas-list', actions: [] },
  { key: 'withdrawals', label: 'Withdraw', path: '/dashboard/withdraw-list', actions: [
    { key: 'create', label: 'Create withdrawals' },
    { key: 'edit', label: 'Edit withdrawals' },
    { key: 'status', label: 'Change status' },
    { key: 'delete', label: 'Delete withdrawals' }
  ] },
  { key: 'subscriptions', label: 'Subscription', path: '/dashboard/subscription-list', actions: [
    { key: 'create', label: 'Add subscriptions' },
    { key: 'edit', label: 'Edit subscriptions' },
    { key: 'toggle', label: 'Turn on / off' },
    { key: 'delete', label: 'Delete subscriptions' }
  ] },
  { key: 'sms_parser', label: 'SMS Parser', path: '/dashboard/sms-parser-list', actions: [
    { key: 'retry', label: 'Retry bank transactions' },
    { key: 'delete', label: 'Delete / clean up responses' }
  ] },
  { key: 'article_categories', label: 'Article Category', path: '/dashboard/articlecategory-list', actions: [
    { key: 'create', label: 'Add categories' },
    { key: 'edit', label: 'Edit categories' },
    { key: 'delete', label: 'Delete categories' }
  ] },
  { key: 'articles', label: 'Article', path: '/dashboard/article-list', actions: [
    { key: 'create', label: 'Add articles' },
    { key: 'edit', label: 'Edit articles' },
    { key: 'publish', label: 'Publish / feature' },
    { key: 'delete', label: 'Delete articles' }
  ] },
  { key: 'material_categories', label: 'Material Category', path: '/dashboard/materialcategory-list', actions: [
    { key: 'create', label: 'Add categories' },
    { key: 'edit', label: 'Edit categories and ingredients' },
    { key: 'delete', label: 'Delete categories' }
  ] },
  { key: 'materials', label: 'Material', path: '/dashboard/material-list', actions: [
    { key: 'create', label: 'Add materials' },
    { key: 'edit', label: 'Edit materials' },
    { key: 'delete', label: 'Delete materials' }
  ] },
  // Category (/dashboard/category) and Subcategory (/dashboard/calculations-list) pages
  { key: 'calculations', label: 'Category & Subcategory', path: '/dashboard/category', actions: [
    { key: 'create', label: 'Add types, shapes and options' },
    { key: 'edit', label: 'Edit types, shapes and options' },
    { key: 'delete', label: 'Delete types and options' }
  ] },
  { key: 'reports', label: 'Report', path: '/dashboard/report-list', actions: [] },
  { key: 'admins', label: 'Admin list', path: '/dashboard/admin-list', actions: [
    { key: 'create', label: 'Add admins' },
    { key: 'edit', label: "Edit other admins' information" },
    { key: 'password', label: "Change other admins' passwords" },
    { key: 'role', label: 'Change role / status' },
    { key: 'deactivate', label: 'Deactivate admins' }
  ] },
  { key: 'settings', label: 'Settings', path: '/dashboard/settings', actions: [
    { key: 'edit', label: 'Change app settings' }
  ] },
  { key: 'roles', label: 'Roles & Permission', path: '/dashboard/roles', actions: [
    { key: 'manage', label: 'Create, edit and delete roles' }
  ] }
];

const ALL_PERMISSIONS = PERMISSION_CATALOG.flatMap((page) => [
  `${page.key}.view`,
  ...page.actions.map((a) => `${page.key}.${a.key}`)
]);

const without = (list) => ALL_PERMISSIONS.filter((p) => !list.includes(p));

// Built-in roles. Defaults match how the dashboard worked before roles became editable:
// - superadmin: everything (locked)
// - admin: no banning, no managing other admins, settings or roles
// - operator: no deleting users, no managing other admins, settings or roles
const ADMIN_ONLY = ['admins.create', 'admins.edit', 'admins.password', 'admins.role', 'admins.deactivate',
  'settings.edit', 'roles.view', 'roles.manage'];
const SYSTEM_ROLES = [
  { key: 'superadmin', name: 'Superadmin', description: 'Full access, including managing admins and settings', permissions: ALL_PERMISSIONS, locked: true },
  { key: 'admin', name: 'Admin', description: 'Manages users, content and transactions; can delete users', permissions: without([...ADMIN_ONLY, 'users.ban']) },
  { key: 'operator', name: 'Operator', description: 'Day-to-day operations; the only role that can ban users', permissions: without([...ADMIN_ONLY, 'users.delete']) }
];

module.exports = { PERMISSION_CATALOG, ALL_PERMISSIONS, SYSTEM_ROLES };

/**
 * Move dashboard accounts out of `users` into the separate `admins` collection.
 *
 *   npm run migrate:admins              # move admins, remove them from users
 *   npm run migrate:admins -- --dry-run # only report what would happen
 *   npm run migrate:admins -- --keep-users  # copy, but leave the users records
 *
 * A user counts as an admin when role is superadmin/admin/operator, or isAdmin is true.
 * _id and the bcrypt password hash are kept, so existing passwords keep working.
 * Safe to run more than once.
 */
const mongoose = require('mongoose');
require('dotenv').config();

const ADMIN_ROLES = ['superadmin', 'admin', 'operator'];
const dryRun = process.argv.includes('--dry-run');
const keepUsers = process.argv.includes('--keep-users');

async function run() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dreamhouse';
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const users = db.collection('users');
  const admins = db.collection('admins');

  const candidates = await users.find({
    $or: [{ role: { $in: ADMIN_ROLES } }, { isAdmin: true }]
  }).toArray();

  console.log(`🔎 Found ${candidates.length} admin account(s) in users${dryRun ? ' (dry run)' : ''}`);

  let moved = 0;
  let skipped = 0;
  for (const u of candidates) {
    const role = ADMIN_ROLES.includes(u.role) ? u.role : 'admin';
    const existing = await admins.findOne({ $or: [{ _id: u._id }, { phone: u.phone }] });

    if (existing) {
      console.log(`  ↷ ${u.phone} (${u.username}) already in admins — skipping copy`);
      skipped++;
    } else {
      const doc = {
        _id: u._id,
        phone: u.phone,
        username: u.username,
        password: u.password, // already a bcrypt hash
        role,
        isActive: u.isActive !== false,
        profileImage: u.profileImage || null,
        lastLogin: u.lastLogin || null,
        createdBy: null,
        createdAt: u.createdAt || new Date(),
        updatedAt: new Date()
      };
      if (u.email) doc.email = u.email;

      console.log(`  → ${u.phone} (${u.username}) as ${role}`);
      if (!dryRun) await admins.insertOne(doc);
      moved++;
    }

    if (!keepUsers && !dryRun) {
      await users.deleteOne({ _id: u._id });
    }
  }

  console.log(`✅ Copied ${moved}, already present ${skipped}` +
    (keepUsers ? ', users records kept' : `, removed ${dryRun ? 0 : candidates.length} from users`));
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('❌ Admin migration failed:', err);
  await mongoose.disconnect();
  process.exit(1);
});

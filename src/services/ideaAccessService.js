// Premium ideas: the total cost and the materials list (addItem) are only for users who bought the idea.
// Applied to every /api/ideas response at send time, so all endpoints (list, featured, popular,
// search, detail, like) follow the same rule. Dashboard (admin) accounts see everything.
const User = require('../models/User');

const isIdeaObject = (v) => v && typeof v === 'object' && !Array.isArray(v) &&
  'isPremium' in v && ('totalCost' in v || 'addItem' in v) && (v._id || v.id);

// Walk the response body and lock unbought premium ideas
const lockIdeas = (value, purchased) => {
  if (Array.isArray(value)) return value.map((v) => lockIdeas(v, purchased));
  if (!value || typeof value !== 'object') return value;
  const out = {};
  for (const [k, v] of Object.entries(value)) out[k] = lockIdeas(v, purchased);
  if (isIdeaObject(value)) {
    const id = String(value._id || value.id);
    const bought = purchased.has(id);
    out.isPurchased = bought || value.isPurchased === true;
    if (value.isPremium && !out.isPurchased) {
      out.totalCost = null;
      out.addItem = [];
      out.isPremiumLocked = true;
    } else {
      out.isPremiumLocked = false;
    }
  }
  return out;
};

// Express middleware for the ideas router
const lockPremiumIdeas = (req, res, next) => {
  const json = res.json.bind(res);
  res.json = (body) => {
    if (req.accountType === 'admin') return json(body);
    (async () => {
      let purchased = new Set();
      if (req.user && req.user._id) {
        const user = await User.findById(req.user._id).select('purchasedIdeas').lean();
        purchased = new Set((user?.purchasedIdeas || []).map((p) => String(p.ideaId)));
      }
      return lockIdeas(JSON.parse(JSON.stringify(body)), purchased);
    })()
      .then((locked) => json(locked))
      .catch((err) => {
        console.error('lockPremiumIdeas error:', err);
        res.status(500);
        json({ success: false, message: 'Internal server error' });
      });
    return res;
  };
  next();
};

module.exports = { lockPremiumIdeas, lockIdeas };

// Material contact details (phone, address, Google Map) — Dashboard → Material create/edit.
// Shown to app users with an active membership only; hidden from everyone else by the API.

// Accepts the iframe code copied from Google Maps ("Share → Embed a map") or its src URL.
// Only the Google Maps embed URL is stored; apps build the <iframe> themselves (no HTML is stored).
const toMapEmbedUrl = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const srcMatch = raw.match(/src\s*=\s*["']([^"']+)["']/i);
  const url = (srcMatch ? srcMatch[1] : raw).replace(/&amp;/g, '&');
  let parsed;
  try {
    parsed = new URL(url);
  } catch (e) {
    parsed = null;
  }
  const isGoogleEmbed = parsed && parsed.protocol === 'https:' &&
    ((/^(www\.)?google\.[a-z.]+$/.test(parsed.hostname) && parsed.pathname.startsWith('/maps/embed')) ||
      (parsed.hostname === 'maps.google.com' && parsed.searchParams.get('output') === 'embed'));
  if (!isGoogleEmbed) {
    const err = new Error('Google Map must be the embed code from Google Maps (Share → Embed a map)');
    err.status = 400;
    throw err;
  }
  return parsed.toString();
};

// Clean the contact object sent by the dashboard (undefined = leave unchanged)
const normalizeContact = (input) => {
  if (input === undefined) return undefined;
  if (input === null) return { phone: '', address: '', mapEmbedUrl: '' };
  return {
    phone: String(input.phone || '').trim().slice(0, 50),
    address: String(input.address || '').trim().slice(0, 300),
    mapEmbedUrl: toMapEmbedUrl(input.mapEmbedUrl ?? input.map ?? '')
  };
};

// Dashboard accounts and app users with an active (paid, not expired) membership
const canSeeContact = (req) => {
  if (!req.user) return false;
  if (req.accountType === 'admin') return true;
  return typeof req.user.isPremiumMember === 'function' && req.user.isPremiumMember();
};

// Remove `contact` from every material in a response body
const stripContact = (value) => {
  if (Array.isArray(value)) return value.map(stripContact);
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    if (typeof value.toJSON === 'function' && value.constructor && value.constructor.name === 'model') {
      return stripContact(value.toJSON());
    }
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === 'contact') continue;
      out[k] = stripContact(v);
    }
    return out;
  }
  return value;
};

// Express middleware: hide contact details in material responses unless allowed
// Decided when the response is sent, so it also works before the route's auth middleware
const hideContactUnlessMember = (req, res, next) => {
  const json = res.json.bind(res);
  res.json = (body) => (canSeeContact(req) ? json(body) : json(stripContact(JSON.parse(JSON.stringify(body)))));
  next();
};

module.exports = { normalizeContact, toMapEmbedUrl, canSeeContact, hideContactUnlessMember };

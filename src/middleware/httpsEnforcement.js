/**
 * HTTPS Enforcement Middleware
 * 
 * Redirects all HTTP requests to HTTPS in production
 * Ensures secure connections for sensitive data
 */

const httpsEnforcement = (req, res, next) => {
  // Only enforce HTTPS in production
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  // Check if the request is coming through HTTPS
  // This works with reverse proxies (like Render.com, Heroku, etc.)
  const isSecure = 
    req.secure || // Express's built-in check
    req.headers['x-forwarded-proto'] === 'https' || // Proxy header
    req.connection.encrypted; // Direct HTTPS connection

  if (!isSecure) {
    console.warn('⚠️  HTTP request redirected to HTTPS:', req.originalUrl);
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }

  // Add HSTS header (HTTP Strict Transport Security)
  // This tells browsers to always use HTTPS for this domain
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  next();
};

module.exports = httpsEnforcement;


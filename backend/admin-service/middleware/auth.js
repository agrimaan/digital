// middleware/auth.js
// CommonJS exports returning proper Express middleware

// Example auth guard
const protect = (req, res, next) => {
  // attach user if valid, else 401
  // e.g., if (!req.user) return res.status(401).json({ message: 'Not authorized' });
  // For now assume user is set by previous layer or stub:
  if (!req.user) return res.status(401).json({ message: 'Not authorized' });
  next();
};

// Role-based authorizer factory
const authorize = (...roles) => {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role || !roles.includes(role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
};

// If you want fixed “admin or super-admin” middleware:
const authorizeAdmin = authorize('admin', 'super-admin');

// Optional request logger
const logAction = (req, _res, next) => {
  // console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
};

// If you prefer names like authenticate/authorizeAdmin:
const authenticate = protect;

module.exports = {
  protect,
  authorize,
  authorizeAdmin,
  authenticate,
  logAction,
};

// middleware/auth.js - JWT Authentication & RBAC
const jwt = require('jsonwebtoken');

const ROLE_HIERARCHY = { admin: 3, fleet_manager: 2, operations: 1 };

/**
 * Verify JWT token
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user      = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

/**
 * Role-based access control (Section 3.2 CRUD Matrix)
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied. You do not have permission for this action.',
      });
    }
    next();
  };
}

/**
 * Minimum role level check
 */
function minRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const reqLevel  = ROLE_HIERARCHY[role] || 0;
    if (userLevel < reqLevel) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied. You do not have permission for this action.',
      });
    }
    next();
  };
}

module.exports = { authenticate, authorize, minRole };
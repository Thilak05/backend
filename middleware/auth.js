const jwt = require('jsonwebtoken');
const { getDb } = require('../database/init');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Optional authentication middleware - doesn't fail if no token provided
const optionalAuthenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    // No token provided, continue without setting req.user
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      // Invalid token, continue without setting req.user
      return next();
    }
    req.user = user;
    next();
  });
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Middleware to check if user owns the resource or is admin
const requireOwnershipOrAdmin = (userIdParam = 'userId') => {
  return (req, res, next) => {
    const requestedUserId = parseInt(req.params[userIdParam]);
    const currentUserId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin && currentUserId !== requestedUserId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
};

// Middleware to validate user exists and attach to request
const validateUserExists = async (req, res, next) => {
  const db = getDb();
  
  try {
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, name, email, role, status, avatar, created_at FROM users WHERE id = ?',
        [req.user.id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({ error: 'Account is inactive. Please contact administrator.' });
    }

    req.userDetails = user;
    next();
  } catch (error) {
    console.error('Error validating user:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    db.close();
  }
};

module.exports = {
  authenticateToken,
  optionalAuthenticateToken,
  requireAdmin,
  requireOwnershipOrAdmin,
  validateUserExists
};

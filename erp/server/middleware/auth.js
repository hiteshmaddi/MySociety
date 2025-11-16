const jwt = require('jsonwebtoken');

// Simple in-memory user store (replace with DB in production)
const users = [
  {
    id: '1',
    username: 'admin',
    password: '$2a$10$rOzJqZqZqZqZqZqZqZqZqO', // 'admin123' hashed
    role: 'admin'
  },
  {
    id: '2',
    username: 'treasurer',
    password: '$2a$10$rOzJqZqZqZqZqZqZqZqZqO', // 'treasurer123' hashed
    role: 'treasurer'
  },
  {
    id: '3',
    username: 'resident',
    password: '$2a$10$rOzJqZqZqZqZqZqZqZqZqO', // 'resident123' hashed
    role: 'resident'
  }
];

// For demo purposes, we'll use simple password comparison
// In production, use bcrypt properly
const bcrypt = require('bcryptjs');

// Authenticate user
const authenticate = async (username, password) => {
  const user = users.find(u => u.username === username);
  if (!user) return null;
  
  // For demo: simple check (in production, use bcrypt.compare)
  // For now, accept: admin/admin123, treasurer/treasurer123, resident/resident123
  const validPasswords = {
    'admin': 'admin123',
    'treasurer': 'treasurer123',
    'resident': 'resident123'
  };
  
  if (validPasswords[username] === password) {
    return { id: user.id, username: user.username, role: user.role };
  }
  
  return null;
};

// Generate JWT token
const generateToken = (user, secret) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    secret,
    { expiresIn: '24h' }
  );
};

// Verify JWT token
const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

// Authentication middleware
const authMiddleware = (secret) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token, secret);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.user = decoded;
    next();
  };
};

// Authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
    
    next();
  };
};

module.exports = {
  authenticate,
  generateToken,
  verifyToken,
  authMiddleware,
  authorize
};


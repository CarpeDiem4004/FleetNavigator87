const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const JWT_SECRET = process.env.JWT_SECRET || 'murici-saas-secret-key';

// JWT Authentication Middleware
const authenticateJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Access token required',
        code: 'TOKEN_MISSING'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Verify user still exists and is active
    const userQuery = await pool.query(
      `SELECT 
        id, name, email, role, base_id, basename, is_active, 
        oficina_id, last_login
      FROM users 
      WHERE id = $1 AND is_active = true`,
      [decoded.userId]
    );

    if (userQuery.rows.length === 0) {
      return res.status(401).json({ 
        success: false,
        error: 'User not found or inactive',
        code: 'USER_INVALID'
      });
    }

    const user = userQuery.rows[0];

    // Check token expiration
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      return res.status(401).json({ 
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    // Add user to request
    req.user = user;
    req.token = { ...decoded, raw: token };

    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        success: false,
        error: 'Invalid token',
        code: 'TOKEN_INVALID'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    return res.status(500).json({ 
      success: false,
      error: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

// Role-based authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    const hasPermission = allowedRoles.some(role => userRoles.includes(role));
    
    if (!hasPermission) {
      return res.status(403).json({ 
        success: false,
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles,
        current: userRoles
      });
    }

    next();
  };
};

// Base access middleware - ensures user has access to specific base
const requireBaseAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  const requestedBaseId = parseInt(req.params.baseId);
  
  // Admin users have access to all bases
  if (req.user.role === 'admin') {
    return next();
  }

  // Check if user's base matches requested base
  if (req.user.base_id !== requestedBaseId) {
    return res.status(403).json({ 
      success: false,
      error: 'Access denied to this base',
      code: 'BASE_ACCESS_DENIED',
      userBaseId: req.user.base_id,
      requestedBaseId
    });
  }

  next();
};

// Rate limiting per user
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const userRequests = new Map();

  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user.id;
    const now = Date.now();
    
    if (!userRequests.has(userId)) {
      userRequests.set(userId, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const userLimit = userRequests.get(userId);
    
    if (now > userLimit.resetTime) {
      userRequests.set(userId, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (userLimit.count >= maxRequests) {
      return res.status(429).json({ 
        success: false,
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
      });
    }

    userLimit.count++;
    next();
  };
};

// Audit logging middleware
const auditLog = (action, table) => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json;
    
    // Override json method to capture response
    res.json = function(body) {
      // Log the action if successful
      if (req.user && body.success) {
        setImmediate(async () => {
          try {
            await pool.query(
              `INSERT INTO audit_logs 
               (table_name, action, user_id, base_id, record_id, request_details, response_details, ip_address, user_agent, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)`,
              [
                table || req.route?.path.split('/')[1],
                action || req.method,
                req.user.id,
                req.user.base_id,
                body.data?.id || null,
                JSON.stringify({
                  path: req.path,
                  params: req.params,
                  query: req.query,
                  body: req.method !== 'GET' ? req.body : null
                }),
                JSON.stringify({ status: res.statusCode, success: body.success }),
                req.ip || req.connection.remoteAddress,
                req.get('User-Agent'),
              ]
            );
          } catch (error) {
            console.error('Audit log error:', error);
          }
        });
      }
      
      // Call original json method
      return originalJson.call(this, body);
    };

    next();
  };
};

// Token refresh middleware
const refreshTokenIfNeeded = (req, res, next) => {
  if (!req.token) {
    return next();
  }

  const now = Math.floor(Date.now() / 1000);
  const expirationTime = req.token.exp;
  const refreshThreshold = 30 * 60; // 30 minutes

  // If token expires in less than 30 minutes, add refresh header
  if (expirationTime - now < refreshThreshold) {
    res.setHeader('X-Token-Refresh-Needed', 'true');
  }

  next();
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id,
      email: user.email,
      role: user.role,
      baseId: user.base_id,
      basename: user.basename
    },
    JWT_SECRET,
    { 
      expiresIn: '24h',
      issuer: 'murici-saas',
      audience: 'murici-external-links'
    }
  );
};

module.exports = {
  authenticateJWT,
  requireRole,
  requireBaseAccess,
  userRateLimit,
  auditLog,
  refreshTokenIfNeeded,
  generateToken
};
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// SaaS Configuration
const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'murici-saas-secret-key';

// Database Connection (External PostgreSQL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:"]
    }
  }
}));

// CORS Configuration for SaaS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'https://*.replit.dev', 'https://*.replit.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Compression and logging
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// JWT Authentication Middleware
const authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Verify user still exists and is active
    const userQuery = await pool.query(
      'SELECT id, name, email, role, base_id, basename, is_active FROM users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    );

    if (userQuery.rows.length === 0) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = userQuery.rows[0];
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'murici-saas-external-links',
    version: '1.0.0'
  });
});

// Authentication Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Get user from database
    const userQuery = await pool.query(
      'SELECT id, name, email, password, role, base_id, basename, is_active FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (userQuery.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userQuery.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role,
        baseId: user.base_id,
        basename: user.basename
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        baseId: user.base_id,
        basename: user.basename
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify Token Route
app.get('/api/auth/verify', authenticateJWT, (req, res) => {
  res.json({
    valid: true,
    user: req.user
  });
});

// Base Information Routes
app.get('/api/bases/:baseId', authenticateJWT, async (req, res) => {
  try {
    const { baseId } = req.params;
    
    const baseQuery = await pool.query(
      'SELECT id, name, basename, cidade, estado FROM bases WHERE id = $1',
      [baseId]
    );

    if (baseQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Base not found' });
    }

    res.json(baseQuery.rows[0]);
  } catch (error) {
    console.error('Base fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fuel Card Routes
app.get('/api/bases/:baseId/fuel-cards', authenticateJWT, async (req, res) => {
  try {
    const { baseId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const cardsQuery = await pool.query(
      `SELECT id, numero_cartao, provedor_cartao, created_at, updated_at 
       FROM fuel_card_requests 
       WHERE base_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [baseId, limit, offset]
    );

    const totalQuery = await pool.query(
      'SELECT COUNT(*) FROM fuel_card_requests WHERE base_id = $1',
      [baseId]
    );

    res.json({
      data: cardsQuery.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(totalQuery.rows[0].count),
        pages: Math.ceil(totalQuery.rows[0].count / limit)
      }
    });

  } catch (error) {
    console.error('Fuel cards fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/bases/:baseId/fuel-cards', authenticateJWT, async (req, res) => {
  try {
    const { baseId } = req.params;
    const { numero_cartao, provedor_cartao, valor_solicitado } = req.body;

    if (!numero_cartao || !provedor_cartao) {
      return res.status(400).json({ error: 'Card number and provider required' });
    }

    const insertQuery = await pool.query(
      `INSERT INTO fuel_card_requests (base_id, numero_cartao, provedor_cartao, valor_solicitado, user_id, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'pendente', CURRENT_TIMESTAMP)
       RETURNING *`,
      [baseId, numero_cartao, provedor_cartao, valor_solicitado || 0, req.user.id]
    );

    res.status(201).json({
      success: true,
      data: insertQuery.rows[0]
    });

  } catch (error) {
    console.error('Fuel card creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error Handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start Server (Binding to 0.0.0.0 for external access)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Murici SaaS External Links running on 0.0.0.0:${PORT}`);
  console.log(`📊 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`🔐 Authentication: http://0.0.0.0:${PORT}/api/auth/login`);
});

module.exports = app;
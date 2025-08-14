// Bridge between existing system and new SaaS architecture
// This file handles the integration without breaking existing functionality

const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

// Database connection (reusing existing connection)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

class SaaSBridge {
  constructor() {
    this.saasEnabled = process.env.SAAS_ENABLED === 'true' || false;
    this.saasPort = process.env.SAAS_PORT || 3001;
    this.saasBaseUrl = `http://localhost:${this.saasPort}`;
  }

  // Check if request should be handled by SaaS
  shouldUseSaaS(req) {
    // Check if it's an external base access
    const isExternalLink = req.path.includes('/external');
    const isBaseRoute = req.path.includes('/bases/');
    const hasSaaSHeader = req.headers['x-murici-saas'] === 'true';
    
    return this.saasEnabled && (isExternalLink || hasSaaSHeader) && isBaseRoute;
  }

  // Redirect to SaaS if enabled
  redirectToSaaS(req, res) {
    if (this.shouldUseSaaS(req)) {
      const saasUrl = `${this.saasBaseUrl}${req.path}${req.search || ''}`;
      console.log(`[SaaS Bridge] Redirecting to: ${saasUrl}`);
      
      // For API calls, return redirect info
      if (req.path.startsWith('/api/')) {
        return res.json({
          success: true,
          redirect: true,
          saasUrl,
          message: 'Please use SaaS endpoint'
        });
      }
      
      // For page requests, redirect
      return res.redirect(302, saasUrl);
    }
    return false;
  }

  // Create SaaS-compatible routes for existing external links
  setupSaaSRoutes(app) {
    if (!this.saasEnabled) return;

    console.log('[SaaS Bridge] Setting up SaaS integration routes');

    // External base routes that should redirect to SaaS
    const externalBaseRoutes = [
      '/bases/:baseId/external',
      '/bases/gp03/external',
      '/bases/gp02/external',
      '/bases/gp01/external',
      '/bases/sc_lajeado_srs10sdd/external'
    ];

    externalBaseRoutes.forEach(route => {
      app.get(route, (req, res, next) => {
        if (this.redirectToSaaS(req, res)) return;
        next();
      });
    });

    // API routes that should use SaaS
    const saasApiRoutes = [
      '/api/bases/:baseId/fuel-cards',
      '/api/fuel-cards/:id',
      '/api/bases/:baseId/external-stats'
    ];

    saasApiRoutes.forEach(route => {
      app.all(route, (req, res, next) => {
        if (this.redirectToSaaS(req, res)) return;
        next();
      });
    });
  }

  // Sync data between main system and SaaS
  async syncToSaaS() {
    if (!this.saasEnabled) return;

    try {
      console.log('[SaaS Bridge] Starting data sync to SaaS');

      // Get external base access statistics
      const externalStats = await pool.query(`
        SELECT 
          base_id,
          COUNT(*) as total_requests,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '24 hours' THEN 1 END) as daily_requests
        FROM fuel_card_requests 
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY base_id
      `);

      // Send stats to SaaS monitoring
      if (externalStats.rows.length > 0) {
        console.log(`[SaaS Bridge] Synced ${externalStats.rows.length} base statistics`);
      }

    } catch (error) {
      console.error('[SaaS Bridge] Sync error:', error);
    }
  }

  // Health check for SaaS integration
  async checkSaaSHealth() {
    if (!this.saasEnabled) return { status: 'disabled' };

    try {
      const response = await fetch(`${this.saasBaseUrl}/health`);
      const health = await response.json();
      
      return {
        status: 'healthy',
        saasStatus: health.status,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Create global bridge instance
const saaBridge = new SaaSBridge();

// Middleware to check SaaS routing
const saasMiddleware = (req, res, next) => {
  // Add SaaS info to request
  req.saas = {
    enabled: saaBridge.saasEnabled,
    shouldUseSaaS: saaBridge.shouldUseSaaS(req),
    baseUrl: saaBridge.saasBaseUrl
  };

  // Try SaaS redirect first
  if (saaBridge.redirectToSaaS(req, res)) {
    return; // Response already sent
  }

  next();
};

// Export for use in main application
module.exports = {
  SaaSBridge,
  saaBridge,
  saasMiddleware,
  
  // Setup function to be called from main server
  setupSaaSIntegration: (app) => {
    console.log('[SaaS Bridge] Initializing SaaS integration');
    
    // Add middleware early in the chain
    app.use(saasMiddleware);
    
    // Setup SaaS routes
    saaBridge.setupSaaSRoutes(app);
    
    // Health check route
    app.get('/api/saas/health', async (req, res) => {
      const health = await saaBridge.checkSaaSHealth();
      res.json(health);
    });

    // Manual sync route (admin only)
    app.post('/api/saas/sync', async (req, res) => {
      try {
        await saaBridge.syncToSaaS();
        res.json({ success: true, message: 'SaaS sync completed' });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    console.log('[SaaS Bridge] Integration setup complete');
  }
};
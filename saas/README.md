# Base External Links SaaS Architecture

## Overview
This directory contains the SaaS transformation of the external base links, maintaining all existing functionalities while implementing:

- **Stateless Architecture**: Each request is independent and contains all necessary information
- **Cloud-based Infrastructure**: Scalable and distributed deployment
- **RESTful APIs**: Standard API endpoints for all external operations
- **SPA/PWA Frontend**: Modern single-page application with offline capabilities
- **External Database Access**: Direct PostgreSQL connection for real-time data
- **JWT Authentication**: Secure token-based authentication
- **HTTPS Security**: All communications encrypted
- **Monitoring Ready**: Built-in logging and monitoring capabilities

## Structure
```
saas/
├── backend/
│   ├── api/
│   │   ├── auth/           # JWT authentication endpoints
│   │   ├── bases/          # Base-specific API routes
│   │   ├── fuel-cards/     # Fuel card management
│   │   ├── maintenance/    # Maintenance requests
│   │   └── monitoring/     # Health checks and metrics
│   ├── middleware/
│   │   ├── auth.js         # JWT middleware
│   │   ├── cors.js         # CORS configuration
│   │   └── security.js     # Security headers
│   ├── database/
│   │   └── connection.js   # External PostgreSQL connection
│   └── server.js           # Main SaaS server (0.0.0.0)
├── frontend/
│   ├── components/
│   │   ├── base-cards/     # Base-specific card components
│   │   ├── auth/           # Authentication components
│   │   └── common/         # Shared components
│   ├── pages/
│   │   ├── bases/          # Base-specific SPA pages
│   │   └── auth/           # Login/logout pages
│   ├── services/
│   │   ├── api.js          # API client with JWT
│   │   └── auth.js         # Authentication service
│   ├── utils/
│   │   ├── pwa.js          # PWA configuration
│   │   └── storage.js      # Local storage management
│   └── app.js              # Main SPA application
└── deployment/
    ├── manifest.json       # PWA manifest
    ├── service-worker.js   # Service worker for offline
    └── replit.toml        # Replit deployment config
```

## Key Features
1. **Stateless Design**: No server-side sessions, all state in JWT tokens
2. **API-First**: All functionality exposed via RESTful APIs
3. **Mobile-Optimized**: PWA capabilities for mobile access
4. **Real-time Data**: Direct database connections for live data
5. **Security-First**: JWT + HTTPS + CORS protection
6. **Monitoring**: Built-in health checks and performance metrics
7. **Scalable**: Designed for horizontal scaling on Replit

## Original Functionality Preserved
- All existing external base links functionality
- Fuel card request systems
- Maintenance request workflows
- Base-specific authentication
- Mobile optimization
- Brazilian timezone support
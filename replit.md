# Fleet Management System

## Overview
This is a comprehensive fleet management system designed to manage vehicle maintenance, fuel records, towing services, and fuel cards. It integrates with external fuel stations, provides complete fleet tracking, and streamlines operational workflows. The system aims for significant market potential in fleet management solutions by offering mobile-optimized interfaces and a complete suite of tools for fleet operation and analysis, including financial tracking and detailed reporting capabilities.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
The system is built with a React/TypeScript frontend and a Node.js/Express backend, utilizing Supabase as the primary database.

### Recent Fixes (August 14, 2025)
- **Admin Authentication Fixed**: Resolved admin@muricionfleet.com login issues by updating password hash and correcting endpoint permissions
- **Universal Admin Access**: Modified `/api/auth/login-base` endpoint to accept both 'operador' and 'admin' roles, allowing admins to use any base login
- **Password Reset**: Updated admin credentials with new bcrypt hash for password "admin123" to enable system access
- **Base Access Corrected**: Admins now have universal access to all bases through any login endpoint, maintaining the "golden rule" security
- **Admin Permission Fix**: Added admin@muricionfleet.com to the allowed admin emails list in use-base-permission.tsx to resolve "Acesso Negado" error for admin users

### Previous Fixes (August 13, 2025)
- **SC Lajeado Login Fixed**: Resolved authentication issue for fernanda.silva@muricionfleet.com by correcting AuthContext to use `/api/auth/login-base` endpoint instead of `/api/login`
- **Password Configuration**: Updated password hash for Fernanda Silva with "j!8H#eNvVo" and proper base assignment (SC_LAJEADO_SRS10SDD, base_id: 102)
- **Direct Menu Access**: Modified LoginLajeado.tsx to redirect directly to `/bases/sc_lajeado_srs10sdd` (dashboard/menu) after successful authentication, bypassing external page
- **External Page Enhanced**: Added prominent "ACESSAR MENU PRINCIPAL" button to BaseScLajeadoExternal for direct navigation to main dashboard
- **Authentication Endpoint Corrected**: Fixed AuthContext login function to send `email` parameter to correct endpoint, resolving "Missing credentials" error

### Previous Fixes (August 12, 2025)
- **GP02 Login Issue Resolved**: Fixed password hash for renato.miyata@muricionfleet.com to enable login with "j!8H#eNvVo"
- **GP03 Login Issue Resolved**: Fixed password hash for bruno.machado@muricionfleet.com to enable login with "j!8H#eNvVo"
- **Fuel Card Integration Fixed**: Corrected API filtering in fuelCardSolicitationsApi.ts to properly display fuel card requests from external forms in GP03 base panel
- **External Link Redirection Fixed**: SC Lajeado users (fernanda.silva@muricionfleet.com) now automatically redirect from external link to main dashboard
- **BaseGP02External Created**: New external page component for GP02 base at /bases/gp02/external route
- **AuthContext Enhanced**: Added baseId fallback mapping (base_id → baseId) to ensure consistent user object properties

### Frontend Architecture
- **Framework**: React with TypeScript
- **UI Components**: Shadcn/ui for a modern, responsive interface, optimized for mobile with specific mobile components.
- **Routing**: React Router for navigation.
- **State Management**: React hooks and context.
- **Build Tool**: Vite.
- **UI/UX Decisions**: Modern design using Shadcn/ui and Tailwind CSS, consistent color schemes and Lucide React icons, sidebar navigation, conditional field displays, and responsive layouts.

### Backend Architecture
- **Runtime**: Node.js with Express.
- **Database**: Supabase (PostgreSQL) with key tables for `vehicles`, `maintenance`, `towing_services`, `fuel_cards`, `projects`, `bases`, external fuel stations (e.g., `abc_v2`, `osasco_v2`), audit logging, junction tables (`project_bases`), and route conference tables.
- **Authentication**: Supabase Auth with session management, role-based access (admin, operator, partner), and token-based partner access.
- **API Structure**: RESTful APIs, including specialized endpoints for mobile access and secure access verification (`/api/bases/:baseId/check-access`).
- **Middleware**: Custom validation and authentication, including an interceptor middleware for handling API routes.
- **Data Processing**: Multi-layer validation, automatic Brazil timezone (UTC-3) conversion, comprehensive audit logging, and real-time automatic fuel tank level updates using PostgreSQL triggers.

### Key Features
- **Vehicle Management**: Tracking, maintenance scheduling, and real-time status.
- **Fuel Management**: Integration with external fuel stations, mobile-optimized recording, project/base assignment, receipt management, and an automatic tank level management system.
- **Towing Services**: Partner management, service request workflows, financial tracking, and external access tokens.
- **Maintenance System**: Service scheduling, workshop management, parts inventory integration, cost tracking, and a comprehensive workshop budget system with approval workflows and PDF generation.
- **Mobile External Links System**: Public access forms for fuel stations with mobile optimization, automatic project/base loading, and timezone-aware data entry.
- **Route and Fuel Conference System**: Upload and analyze daily vehicle route reports, compare with fuel records, and generate comprehensive reports with visual indicators and export capabilities (Excel/PDF), optimized for MercadoLivre report format.
- **Line Haul Dashboard**: Dedicated page for Line Haul management including route management, vehicle tracking, maintenance workflow, and driver interface access.
- **Universal Base Dashboard System**: Standardized operational dashboards for all bases with consistent navigation and security controls.
- **Universal Fuel Card System**: Standardized fuel card access configuration and functionality across all bases.
- **Security Implementation**: Comprehensive "golden rule" security system with COMPLETE PRIVATE ACCESS enforcement. ALL base and posto routes now require authentication - NO public access allowed. BaseSecurityGuard and BaseAccessController components ensure each base is accessible only through specific login credentials.
- **Base Independence System**: Complete implementation of base independence with removal of all "Voltar ao Sistema Principal" buttons from 65+ login components and 3 base dashboard components. Each base operates independently without any connection to the main system, ensuring pure base-specific authentication and navigation.
- **Google Maps Integration**: Enhanced integration for route registration, automatically activating a Google Maps button for distance verification.

### Data Flow
- **Fuel Station Access**: PRIVATE authenticated access only, mobile device detection, dynamic project loading, data validation, and real-time synchronization. All external links now require valid user login.
- **Authentication**: Express sessions with Supabase JWT tokens. Complete base independence with no system principal access links.
- **Deployment Strategy**: Local development with Replit, production on Replit autoscale with Supabase cloud hosting.

## External Dependencies

### Primary Services
- **Supabase**: Database, authentication, real-time subscriptions.
- **React Ecosystem**: Core UI framework and related libraries.
- **Node.js/Express**: Backend runtime and web framework.

### UI Dependencies
- **Shadcn/ui**: Component library.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide React**: Icon library.

### Development Tools
- **Vite**: Build tool and development server.
- **TypeScript**: For type safety.
- **ESLint/Prettier**: For code quality and formatting.
- **jsPDF**: For PDF generation.
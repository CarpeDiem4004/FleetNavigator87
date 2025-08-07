# Fleet Management System

## Overview
This is a comprehensive fleet management system for managing vehicle maintenance, fuel records, towing services, and fuel cards. It features mobile-optimized interfaces and integrations with external fuel stations, providing complete fleet tracking and streamlining operational workflows. The system aims for significant market potential in fleet management solutions.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
The system is built with a React/TypeScript frontend and a Node.js/Express backend, utilizing Supabase as the primary database.

### Frontend Architecture
- **Framework**: React with TypeScript
- **UI Components**: Shadcn/ui for a modern interface
- **Routing**: React Router for navigation
- **State Management**: React hooks and context
- **Build Tool**: Vite
- **Mobile Optimization**: Responsive design with specific mobile components.

### Backend Architecture
- **Runtime**: Node.js with Express
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with session management
- **API Structure**: RESTful APIs, including specialized endpoints for mobile access.
- **Middleware**: Custom validation and authentication.

### Database Schema
Key tables include `vehicles`, `maintenance`, `towing_services`, `fuel_cards`, `projects`, and `bases`. It also includes specific tables for external fuel stations (e.g., `abc_v2`, `osasco_v2`), audit logging, junction tables like `project_bases`, and route conference tables for daily vehicle operation analysis.

### Key Features
- **Vehicle Management**: Tracking, maintenance scheduling, and real-time status.
- **Fuel Management**: Integration with external fuel stations, mobile-optimized recording, project/base assignment, and receipt management.
- **Towing Services**: Partner management, service request workflows, financial tracking, and external access tokens.
- **Maintenance System**: Service scheduling, workshop management, parts inventory integration, and cost tracking.
- **Mobile External Links System**: Public access forms for fuel stations with mobile optimization, automatic project/base loading, and timezone-aware data entry.
- **Route and Fuel Conference System**: Upload and analyze daily vehicle route reports, compare with fuel records, generate comprehensive reports with visual indicators and export capabilities (Excel/PDF). Specifically optimized for MercadoLivre report format.
- **Line Haul Dashboard**: Dedicated page for Line Haul management including route management, vehicle tracking, maintenance workflow, and driver interface access.
- **Workshop Budget System**: Complete workshop budget management with car reception, service number generation, budget creation, approval workflow, and external API integration for partner workshops.

### Data Flow
- **Fuel Station External Access**: Public URLs, mobile device detection, dynamic project loading, data validation, and real-time synchronization.
- **Authentication**: Public access for external forms, Express sessions with Supabase JWT tokens, role-based access (admin, operator, partner), and token-based partner access.
- **Data Processing**: Multi-layer validation, automatic Brazil timezone (UTC-3) conversion, comprehensive audit logging, and performance optimizations.

### UI/UX Decisions
- Modern design using Shadcn/ui and Tailwind CSS.
- Consistent color schemes and icons (Lucide React) for visual clarity.
- Sidebar navigation for better organization, especially for base-specific interfaces.
- Conditional field displays and responsive layouts to enhance user experience.

### Deployment Strategy
- **Environments**: Local development with Replit, production on Replit autoscale.
- **Database**: Supabase cloud hosting.
- **Build Process**: Vite for frontend, Express server for backend, automated schema updates.
- **Deployment**: Replit autoscale with port 5000 mapping and health checks.

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

## Recent Updates (August 7, 2025)
✅ **Workshop Budget System - Complete Implementation**
- Full workshop external dashboard with car reception and budget management
- Automatic service number generation (CNPJ-YYYYMMDD-NNN format)
- Workshop budget creation, editing, and management capabilities
- Fleet management approval/rejection workflow for budgets
- External API integration with secure token authentication
- Database schema optimization with proper indexing
- Resolved SQL function ambiguity issues for production stability
- Tested and verified: Car reception ID #18 with budget ID #1 successfully created

✅ **Date Filtering System for Workshop Budgets**
- Implemented start and end date filters in fleet management panel
- Enhanced API endpoint with query parameters for date range filtering
- Added intuitive date picker interface with apply/clear functionality
- Maintained complete approver tracking with user information display
- Verified functionality through API testing: filters working correctly
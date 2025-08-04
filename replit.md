# Sistema de Gestão de Frotas - Fleet Management System

## Overview
This is a comprehensive fleet management system for managing vehicle maintenance, fuel records, towing services, and fuel cards. It features mobile-optimized interfaces and integrations with external fuel stations. The system is designed to provide complete fleet tracking and streamline operational workflows, aiming for significant market potential in fleet management solutions.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent System Analysis and Corrections (08/08/2025)
### Major Database Updates Completed
- **User Roles**: Added missing roles (gestor_equipamentos, posto, line_hall) to enum
- **Table Corrections**: Fixed missing columns in car_receptions, manutencao, and oficinas tables
- **New Tables**: Created base_requests and base_request_updates for request management
- **Performance**: Added optimized indexes for better query performance
- **Route Conference System**: Fixed date format handling to analyze selected dates (not current date)
  - Automatic conversion between ISO (yyyy-mm-dd) and Brazilian (dd/mm/yyyy) formats
  - System now correctly processes any selected date for route vs fuel analysis
- **CRITICAL FIX: Complete Fuel Source Integration** (08/08/2025 16:40)
  - Fixed system to query ALL 3 fuel data sources instead of only 2
  - Added missing `solicitacoes_fuel_card` table integration (35 records on 01/08/2025)
  - Corrected column mapping: `motorista` and `base as projeto`
  - Result: System now properly identifies vehicles that drove AND refueled (54 vs 0 previously)
  - Enhanced logging to show records found from each fuel source
- **Status**: System fully functional with complete fuel cross-referencing operational
- **FINAL CORRECTION: Route Conference Date Search Fix** (08/08/2025 18:30)
  - Fixed critical date format inconsistency in route data search
  - System now searches both current ISO format (2025-08-01) and legacy format (2025-01-08)  
  - Result: Route conference now correctly shows 81 vehicles in compliance (previously 0)
  - Complete vehicle cross-referencing now operational: 81 compliant, 7290 drove only, 8 fueled only
  - Excel export with 4 worksheets fully functional
- **DATE DISPLAY CORRECTION: Route Conference UI Fix** (08/08/2025 20:00)
  - Fixed date display offset issue where selecting 01/08/2025 showed 31/07/2025
  - Corrected Excel date serial conversion with UTC adjustment to prevent timezone offset
  - Fixed frontend date display to avoid timezone interpretation errors
  - System now correctly shows selected date in card headers and processing logs

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
Key tables include `vehicles`, `maintenance`, `towing_services`, `fuel_cards`, `projects`, and `bases`. It also includes specific tables for external fuel stations (e.g., `abc_v2`, `osasco_v2`), comprehensive audit logging, junction tables like `project_bases`, and route conference tables (`conferencia_rotas_uploads`, `conferencia_rotas_dados`) for daily vehicle operation analysis.

### Key Features
- **Vehicle Management**: Tracking, maintenance scheduling, and real-time status.
- **Fuel Management**: Integration with 13 external fuel stations, mobile-optimized recording, project/base assignment, and receipt management.
- **Towing Services**: Partner management, service request workflows, financial tracking, and external access tokens.
- **Maintenance System**: Service scheduling, workshop management, parts inventory integration, and cost tracking.
- **Mobile External Links System**: Public access forms for fuel stations with mobile optimization, automatic project/base loading, and timezone-aware data entry.
- **Route and Fuel Conference System**: Upload and analyze daily vehicle route reports (.xlsx format), compare with fuel records, generate comprehensive reports with visual indicators and export capabilities (Excel/PDF). Specifically optimized for MercadoLivre report format with automatic Excel date conversion.

### Data Flow
- **Fuel Station External Access**: Public URLs, mobile device detection, dynamic project loading, data validation, and real-time synchronization.
- **Authentication**: Public access for external forms, Express sessions with Supabase JWT tokens, role-based access (admin, operator, partner), and token-based partner access.
- **Data Processing**: Multi-layer validation, automatic Brazil timezone (UTC-3) conversion, comprehensive audit logging, and performance optimizations.

### UI/UX Decisions
- Modern design using Shadcn/ui and Tailwind CSS.
- Consistent color schemes and icons (Lucide React) for visual clarity.
- Sidebar navigation for better organization, especially for base-specific interfaces (e.g., GP03).
- Conditional field displays and responsive layouts to enhance user experience.
- Subtle footer branding for developer attribution.

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
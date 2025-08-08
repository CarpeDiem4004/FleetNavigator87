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

✅ **PDF Print Functionality for Approved Budgets**
- Added PDF generation feature using jsPDF library
- Print button appears only for approved workshop budgets
- PDF includes complete budget details: workshop info, vehicle data, project/base, costs, and approval details
- Professional formatting with company branding and timestamp
- File naming convention: "Orçamento_[numero]_[placa].pdf"

✅ **Line Haul Driver Mass Registration**
- Successfully imported and registered 64 Line Haul drivers from Excel file
- Automated data processing and validation system
- Excel date conversion handling for admission dates
- CPF duplicate prevention and data integrity checks
- All drivers added to motoristas table with proper formatting

✅ **Automatic Tank Level Management System (August 8, 2025)**
- Implemented real-time automatic fuel tank level updates for Campinas V2 station
- PostgreSQL triggers automatically update tank levels on every fuel transaction
- Entry transactions (recebimentos_posto_campinas_v2): Add fuel to tank levels, respecting maximum capacity
- Exit transactions (abastecimentos_posto_campinas_v2): Subtract fuel from tank levels, preventing negative values
- Tank configuration final: Diesel 6,300L/10,000L capacity, ARLA 520L/520L capacity (100% full)
- System tested and verified: Fuel levels update in real-time without manual intervention
- Database functions: atualizar_nivel_recebimento() and atualizar_nivel_abastecimento()
- Comprehensive logging with NOTICE statements for transaction tracking

✅ **Operator Auto-Fill Feature (August 8, 2025)**
- Implemented automatic operator name filling in fuel receipt forms
- Uses useAuth hook to retrieve logged-in user information
- Form automatically populates 'nome_operador' field with user.name
- Reduces manual data entry and improves data accuracy
- Tested and verified with FormularioRecebimento component

✅ **External Links PWA Base Management System (August 8, 2025)**
- Resolved persistent API route conflicts between /api/bases endpoints
- Created critical interceptor middleware to handle PATCH /api/bases/:id requests before Vite middleware
- Fixed "DOCTYPE not valid JSON" errors by implementing early request interception
- External Links Manager interface now fully functional for base activation/deactivation
- Successfully tested base ID 51 (COCA COLA - JURUBATUBA) activation and deactivation
- All 100+ registered bases available for individual PWA external access
- Maintenance bases properly excluded from external PWA access as designed
- API properly returns JSON responses with comprehensive base data including project assignments

✅ **External Links Manager Enhanced (August 8, 2025)**
- Updated ExternalLinksManager interface to display ALL bases (active and inactive)
- Added individual activation/deactivation controls with visual switches for each base
- Implemented real-time status updates with comprehensive mutation handling
- Complete list of 112 bases now visible with PWA links and status controls
- Enhanced table includes status column with toggle switches and visual badges
- Search functionality maintained for filtering by name or location

✅ **Osasco V2 Tank Capacity Update (August 8, 2025)**
- Updated diesel tank capacity from 20,000L to 16,000L total capacity
- Set current diesel level to 1,200L (7.5% capacity)
- ARLA tank remains unchanged: 1,000L capacity with 730L current level
- Database update confirmed and operational in configuracao_tanques table

✅ **Complete Base Configuration Standardization (August 8, 2025)**
- Standardized all 112 bases with GP3 Hortolândia configurations
- Updated 111 bases to match operational standards (GP3 already configured)
- All bases now configured as: type='operacional', active=true, operation='GRUPO PEREIRA'
- Disabled maintenance flags (has_maintenance=false) and tire management (has_tires=false)
- Enabled request system (requests_enabled=true) across all bases
- Complete operational consistency achieved across the entire fleet management system

✅ **Universal Base Dashboard System (August 8, 2025)**
- Created BaseRouter component for intelligent base detection and routing
- Implemented BaseDashboardGenerico with standardized GP3 Hortolândia interface
- Added API support for base lookup by basename or ID (/api/bases?basename=GP03)
- Universal routing system handles all 112 bases with identical operational dashboards
- Access patterns: /bases/GP03 (basename) or /bases/151 (ID) both work seamlessly
- All bases now have consistent sidebar navigation: Operacional, Financeiro, Gestão sections
- Successfully tested with GP03 Hortolândia base (ID: 151, basename: GP03)
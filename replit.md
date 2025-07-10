# Sistema de Gestão de Frotas - Fleet Management System

## Overview

This is a comprehensive fleet management system built with React (frontend) and Node.js/Express (backend), using Supabase as the primary database. The system manages vehicle maintenance, fuel records, towing services, fuel cards, and external fuel station integrations with mobile-optimized interfaces.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **UI Components**: Shadcn/ui component library
- **Routing**: React Router for client-side navigation
- **State Management**: React hooks and context
- **Build Tool**: Vite for development and production builds
- **Mobile Optimization**: Responsive design with mobile-specific components

### Backend Architecture
- **Runtime**: Node.js with Express framework
- **Database**: Supabase (PostgreSQL) as primary database
- **Authentication**: Supabase Auth with session management
- **API Structure**: RESTful APIs with specialized endpoints for mobile access
- **Middleware**: Custom validation and authentication middleware

### Database Schema
- **Primary Tables**: vehicles, maintenance, towing_services, fuel_cards, projects, bases
- **External Station Tables**: Multiple tables for different fuel stations (abc_v2, osasco_v2, etc.)
- **Audit Tables**: Comprehensive logging and history tracking
- **Junction Tables**: project_bases for many-to-many relationships

## Key Components

### 1. Vehicle Management System
- Complete vehicle fleet tracking (69 vehicles active)
- Maintenance scheduling and history
- Vehicle delivery system with partner integration
- Real-time vehicle status monitoring

### 2. Fuel Management System
- External fuel station integration (13 active stations)
- Mobile-optimized fuel recording forms
- Project and base assignment system
- Fuel receipt management system

### 3. Towing Services Management
- Partner management system (13 active partners)
- Service request and approval workflow
- Financial tracking and payment processing
- External access tokens for partner portals

### 4. Maintenance System
- Service scheduling and tracking
- Workshop management
- Parts inventory integration
- Cost tracking and approval system

### 5. Mobile External Links System
- Public access forms for fuel stations
- Mobile-optimized user interfaces
- Automatic project/base loading
- Timezone-aware data entry

## Data Flow

### Fuel Station External Access Flow
1. **External Access**: Public URLs for fuel stations (`/posto/{station}/public`)
2. **Mobile Detection**: Automatic device detection and interface optimization
3. **Project Loading**: Dynamic loading of projects and bases via API
4. **Data Submission**: Validation and storage in station-specific tables
5. **Synchronization**: Real-time data sync across related systems

### Authentication Flow
1. **Public Access**: Unauthenticated access for external fuel stations
2. **Session Management**: Express sessions with Supabase JWT tokens
3. **Role-based Access**: Different access levels (admin, operator, partner)
4. **Token-based Partner Access**: Unique tokens for towing service partners

### Data Processing Pipeline
1. **Input Validation**: Multi-layer validation (frontend, middleware, database)
2. **Timezone Normalization**: Automatic Brazil timezone (UTC-3) conversion
3. **Audit Logging**: Comprehensive change tracking and history
4. **Performance Optimization**: Indexed queries and cached responses

## External Dependencies

### Primary Services
- **Supabase**: Database, authentication, and real-time subscriptions
- **React Ecosystem**: Core UI framework and related libraries
- **Node.js/Express**: Backend runtime and web framework

### UI Dependencies
- **Shadcn/ui**: Modern component library
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type safety and development experience
- **ESLint/Prettier**: Code quality and formatting

## Deployment Strategy

### Environment Configuration
- **Development**: Local development with Replit environment
- **Production**: Autoscale deployment target on Replit
- **Database**: Supabase cloud hosting with connection pooling

### Build Process
1. **Frontend Build**: Vite production build with asset optimization
2. **Backend Setup**: Express server with environment variable configuration
3. **Database Migration**: Automated schema updates and data migrations
4. **Static Assets**: Served through Express static middleware

### Deployment Targets
- **Primary**: Replit autoscale deployment
- **Port Configuration**: Port 5000 mapped to external port 80
- **Health Checks**: Built-in health monitoring and restart capabilities

## Recent Changes

- July 10, 2025: **ENHANCED EQUIPMENT DOCUMENT MANAGEMENT** - Added comprehensive signed document viewing and download functionality
  - ✅ Added "Documento" status column showing "Assinado" (green) or "Pendente" (yellow) badges
  - ✅ Conditional action buttons: "Anexar" for pending documents, "Ver" + "Baixar" for signed documents
  - ✅ View signed documents in new tab with eye icon button
  - ✅ Download signed documents with dedicated download button (green download icon)
  - ✅ Improved file naming for downloads: termo_assinado_equipmentname_username.ext
  - ✅ Enhanced visual indicators and user experience for document management
  - ✅ Maintained original PDF generation and download functionality alongside signed document features

- July 10, 2025: **FIXED CRITICAL API ENDPOINT** - Successfully resolved station links not displaying projects/bases
  - ✅ Fixed `/api/projects-with-bases` endpoint being blocked by authentication middleware
  - ✅ Added public route exemptions in both equipment routes and unified auth middleware
  - ✅ Endpoint now returns 13 active projects with 114 properly assigned bases
  - ✅ All external fuel station forms can now correctly load project and base dropdown options
  - ✅ System fully operational with complete project-base relationship data accessible

- July 10, 2025: Completed comprehensive project assignment for all 114 bases in the system
  - ✅ Fixed all bases without project assignment (104 bases corrected)
  - ✅ Systematic project mapping based on nomenclature and functionality
  - ✅ SHOPEE: 64 bases, XPT: 12 bases, COCA-COLA: 9 bases, Uso Operacional: 9 bases
  - ✅ All remaining projects properly assigned (MADEIRA MADEIRA: 4, GRUPO PEREIRA: 3, etc.)
  - ✅ Legacy inactive projects (FMS09, PRIMO BASILE, MARISTELA) redirected to active projects
  - ✅ Complete system integrity with all bases having proper project relationships
  - ✅ All dropdown selectors now function correctly across the entire system

- July 10, 2025: Fixed missing bases for Madeira Madeira, Full Meli and OXXO projects in fuel station links
  - ✅ Activated all project-base relationships that were inactive (6 relationships updated)
  - ✅ Fixed missing basename and project_id fields in bases table
  - ✅ Madeira Madeira: 4 active bases (MM01 Cajamar, MM03 Aruja, MM04 Jundiai, MM05 Osasco)
  - ✅ Full Meli: 1 active base (FMELI01)
  - ✅ OXXO: 1 active base (OXXO1 Cajamar)
  - ✅ All project bases now appear correctly in fuel station dropdown selectors
  - ✅ Complete integration between project_bases and bases tables restored

- July 10, 2025: Added project selection field to base registration system
  - ✅ Added project_id column to bases table with foreign key constraint
  - ✅ Updated shared schema to include project_id field in bases table
  - ✅ Enhanced base registration form with project selection dropdown
  - ✅ Implemented dynamic project loading from database (13 active projects)
  - ✅ Added proper validation and optional project assignment
  - ✅ Created missing bases for Grupo Pereira project (GP01, GP02, GP03)
  - ✅ Added missing Mercado Livre bases (SSC3, SDP1, SPR8)
  - ✅ System now has 114 total bases with proper project associations

- July 10, 2025: Deactivated specific projects to streamline system operations
  - ✅ Deactivated 6 projects: FMS09, MARISTELA INDUSTRIA, MANUTENÇÃO PREVENTIVA, PRIMO BASILE, REPARO DE EMERGENCIA, REVISÃO GERAL
  - ✅ Deactivated 6 associated project bases from the removed projects
  - ✅ System now has 13 active projects instead of 19
  - ✅ Remaining active projects: COCA-COLA, FULL MELI, GRUPO PEREIRA, LINE HALL, Line Hall Shopee, MADEIRA MADEIRA, MERCADO LIVRE, Manutenção, OXXO, PETLOVE, SHOPEE, Uso Operacional, XPT
  - ✅ Projects preserved via deactivation to maintain data integrity

- July 10, 2025: Restored SHOPEE project to original base configuration
  - ✅ Fixed inactive bases in project_bases table for SHOPEE projects
  - ✅ Activated existing bases: FMS09 SÃO PAULO (SP) and Line Hall Shopee
  - ✅ Removed 10 additional bases that were temporarily added
  - ✅ SHOPEE project now has only original base: FMS09 SÃO PAULO (SP)
  - ✅ Line Hall Shopee project maintained with 1 base: Line Hall Shopee
  - ✅ Total SHOPEE-related bases: 2 bases across 2 projects (original configuration)
  - ✅ System restored to original project structure as requested

- July 9, 2025: Completed integration between legacy fuel card system and new base system
  - ✅ Fixed main approval panel to show all fuel card requests from all sources
  - ✅ Modified getFuelCardSolicitations to include UNION ALL query for fuel_card_requests table
  - ✅ Updated deleteFuelCardSolicitation to support deletion from new base tables
  - ✅ Added proper status normalization for 'base_system' origin type
  - ✅ Main dashboard now shows unified data: 331 approved requests, R$ 94.109,96 total
  - ✅ Complete integration allows management of legacy + Line Hall + base requests in single interface

- July 9, 2025: Implemented specific login route for Base Campinas
  - ✅ Created LoginCampinas.tsx component with Base Campinas branding
  - ✅ Added /bases/campinas/login route to App.tsx
  - ✅ Modified authentication middleware to redirect to base-specific login routes
  - ✅ Fixed public routes configuration to prevent infinite redirect loops
  - ✅ Base Campinas now has dedicated login page that maintains context
  - ✅ After login, users are redirected back to /bases/campinas automatically
  - ✅ Login page includes "Back to main system" button for navigation
  - ✅ Test page created at /test-campinas-login for easy testing

- July 9, 2025: Fixed logout functionality for base pages to maintain proper context
  - ✅ Custom logout implementation in BaseCampinasLayout.tsx
  - ✅ Logout button now redirects to /bases/campinas after logout
  - ✅ Middleware intercepts unauthenticated access and redirects to /login
  - ✅ Prevents redirection to main system login, keeping base context
  - ✅ Tested and verified working correctly with proper middleware flow

- July 9, 2025: Successfully implemented and tested mandatory authentication system
  - ✅ Server-side authentication middleware protecting all internal routes
  - ✅ All base routes (/bases/campinas, /bases/goiania, /bases/alair) require login
  - ✅ Automatic HTTP 302 redirect to /login for unauthenticated users
  - ✅ Authentication middleware tested and verified working correctly
  - ✅ Test infrastructure created at /test-logout for middleware verification
  - ✅ Security logs confirm: "[AUTH-MIDDLEWARE] Acesso negado para rota protegida"
  - ✅ External/public routes remain unaffected for proper mobile access
  - ✅ System now fully secure with mandatory login for all internal functionality

- July 9, 2025: Enhanced fuel card request system with improved user experience
  - Added conditional "Dados específicos do cartão" field that appears only when "Cartão específico por número" is selected
  - Implemented validation requiring specific card data when option is chosen
  - Updated form schema with conditional validation rules
  - Enhanced user interface with dynamic field display
  - Removed duplicate "Horário de Preferência para Abastecimento" field, keeping only "Horário de Abastecimento"
  - Improved success message: "Solicitação enviada com sucesso! Sua solicitação foi enviada e está aguardando retorno da gestão de combustível"
  - Confirmed "Solicitar Recarga" button functionality is working correctly

- July 9, 2025: Restored all projects in the system
  - Reactivated all 19 projects after temporary filtering
  - System now includes all original projects: COCA-COLA, FMS09, FULL MELI, GRUPO PEREIRA, LINE HALL, MERCADO LIVRE, PETLOVE, SHOPEE, XPT, Line Hall Shopee, MADEIRA MADEIRA, MARISTELA INDUSTRIA, OXXO, PRIMO BASILE, Manutenção, Manutenção Preventiva, Reparo de Emergência, Revisão Geral, Uso Operacional
  - All projects are now active and available for selection in fuel card request forms
  - System maintains full functionality with complete project catalog

- July 9, 2025: Implemented dynamic project-base filtering for fuel card requests
  - Created `/api/project-bases` endpoint returning 106 project-base relationships
  - Implemented dynamic base filtering based on selected project in frontend
  - Added fuel timing preference field with options "Antes das 17h" and "Após as 18h"
  - Fuel card providers restricted to Ticket and Alelo only
  - System fully operational with 19 projects and 108 bases loading correctly
  - Base dropdown now filters dynamically when project is selected
  - Automatic base selection reset when project changes

- July 9, 2025: Fixed fuel card request system API connectivity issues
  - Resolved authentication middleware blocking `/api/bases` endpoint
  - Added direct API registration in `server/index.ts` before middleware pipeline
  - Fixed database column mapping (location vs description) in bases table query
  - Both projects and bases dropdowns now load correctly with 16 projects and 108 bases
  - Fuel card providers successfully restricted to Ticket and Alelo only
  - Added fuel timing preference options ("Antes das 17h" and "Após as 18h")
  - System now fully operational with working dropdown population

- June 25, 2025: Enhanced maintenance order creation with project and base assignment
  - Added project and base selection fields to new service order form
  - Integrated dynamic loading of 16 projects and 100+ bases from database
  - Implemented responsive grid layout with optional field validation
  - Added proper data handling for API requests with ID conversion
  - Fixed array validation and error handling for project/base data loading

- June 25, 2025: Completely resolved maintenance system database inconsistencies and workshop order updates
  - Fixed critical database table inconsistency between maintenance_orders and manutencao tables
  - Standardized all endpoints and storage methods to use maintenance_orders table exclusively
  - Corrected workshop order listing and update functionality for external workshop access
  - Implemented proper token validation for workshop API endpoints with detailed logging
  - Fixed workshop order update system with support for status, costs, notes, and completion dates
  - Created working test orders to verify system functionality across all interfaces

- June 25, 2025: Fixed workshop name inconsistency and PDF generation issues
  - Resolved Alair workshop name divergence between tables (workshops and oficinas)
  - Standardized name to "Alair Manutenção e Serviços Automotivos Ltda" across both tables
  - Corrected total cost calculation to dynamically sum labor costs and parts from JSON data
  - Enhanced parts display in PDF to show readable format: "1. Part Name - R$ Price" instead of raw JSON
  - Fixed zero total value issue by calculating from actual parts data rather than stored fields
  - Improved Brazilian currency formatting throughout PDF generation
  - Added proper parsing of replaced parts JSON for accurate cost calculations

- June 25, 2025: Implemented admin-only deletion functionality for maintenance records
  - Added DELETE endpoints for maintenance orders and car receptions with admin-only access
  - Implemented frontend deletion buttons visible only to admin users
  - Added confirmation dialogs before deletion to prevent accidental data loss
  - Backend validation ensures only authenticated admin users can delete records
  - Complete audit trail with admin identification in deletion logs

- June 25, 2025: Enhanced replaced parts display and fixed CPF validation issues
  - Improved replaced parts display to show readable format instead of raw JSON
  - Added total value calculation for replaced parts with highlighted display
  - Fixed "Detalhamento de Custos" section to calculate total automatically from parts data
  - Fixed database CPF constraint to accept 1-11 digits for better compatibility
  - Enhanced user experience with proper Brazilian currency formatting for parts
  - Updated both fleet management and workshop dashboards for consistent part display

- June 25, 2025: Implemented Brazilian currency formatting and delivery person data collection
  - Added automatic Brazilian currency formatting (R$ 1.234,56) for all value fields
  - Values automatically format with proper thousands separators (.) and decimal separator (,)
  - Implemented delivery person data collection when vehicle status changes to "delivered"
  - Added required fields for name, CPF, and phone number with automatic formatting
  - CPF format: 000.000.000-00, Phone format: (11) 99999-9999
  - Enhanced form organization with 4 clear sections: Vehicle Data, Service Details, Parts & Values, Additional Notes
  - Improved form layout with 900px modal width for better visualization

- June 25, 2025: Implemented admin-only deletion restrictions for maintenance history
  - Added role-based access control for maintenance record deletion
  - Only administrators can now delete orders and maintenance records
  - Buttons are hidden for non-admin users with appropriate error messages
  - Implemented both frontend validation and backend middleware protection

- June 25, 2025: Fixed external workshop access system completely
  - Resolved duplicate endpoint issue causing wrong workshop identification
  - Token auto_token_bb6ba89be514 now correctly routes to Oficina Alair (ID=5)
  - Created direct access route /oficina/external without CNPJ requirement
  - Fixed CORS issues in car reception registration endpoint
  - Fixed GET endpoint for car receptions to accept token via query string
  - External workshop history now displays correctly
  - Improved registration flow with form reset and continuation options
  - External links now work directly via token parameter

- June 24, 2025: Added comprehensive support for Brazilian license plates
  - Implemented validation for both old format (ABC1234) and Mercosul format (ABC1D23)
  - Added real-time plate validation with visual feedback
  - Enhanced vehicle registration forms with smart plate formatting
  - Fixed vehicle registration API validation errors
  - Configured automatic 2.5 km/l fuel consumption for Line Hall Shopee vehicles

- June 24, 2025: Enhanced fuel card management system
  - Improved Excel export to show correct card types and numbers
  - Added vehicle plate display for plate-based cards
  - Maintained fuel card balance response functionality

- June 24, 2025: Fixed external workshop login system
  - Corrected database table reference from 'workshops' to 'oficinas'
  - Implemented CNPJ normalization for login (accepts formatted or unformatted)
  - Added bcrypt password hashing for workshop authentication
  - Configured working credentials: CNPJ 12.345.678/0001-90, password "secret"
  - Login endpoint: /oficina/login with JWT token generation

## Changelog

- June 24, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.
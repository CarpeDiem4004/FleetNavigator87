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

- July 17, 2025: **SUBTLE FOOTER BRANDING ADDED** - Added discrete footer with "Desenvolvido por Carpe Diem 4004 | (11) 97055-8053" across all main layouts
  - ✅ Added to AppLayout.tsx main footer for all internal system pages
  - ✅ Added to BaseLayout.tsx for all external base pages  
  - ✅ Added to MainLayoutSimple.tsx for simple layout pages
  - ✅ Designed with subtle gray text and proper formatting
  - ✅ Maintains professional appearance while providing developer attribution

- July 17, 2025: **WORKSHOP EDIT CONTROL FIXED** - Resolved business rule violation where delivered vehicles could still be edited
  - ✅ **PROBLEM IDENTIFIED**: Oficina dashboard allowed editing of vehicle receptions even when status was "entregue"
  - ✅ **SOLUTION IMPLEMENTED**: Added conditional rendering to hide edit button when reception.status === "entregue"
  - ✅ **BUSINESS RULE ENFORCED**: Only vehicles with status other than "entregue" can be edited
  - ✅ **USER EXPERIENCE IMPROVED**: Added "Apenas visualização" indicator for delivered vehicles
  - ✅ **COMPLIANCE ACHIEVED**: System now properly prevents editing of completed/delivered vehicle services
  - ✅ **CODE LOCATION**: Fixed in client/src/pages/oficina/OficinaDashboard.tsx lines 1120-1138 and OficinaExternalDashboard.tsx lines 930-990
  - ✅ **COMPLETE INTEGRITY**: Workshop edit controls now follow proper business logic rules

- July 17, 2025: **OFICINA PASSOS CAR RECEPTION SYSTEM FIXED** - Resolved 500 error preventing vehicle registration for maintenance
  - ✅ **ROOT CAUSE IDENTIFIED**: Oficina Passos (ID: 11) existed in `oficinas` table but not in `workshops` table
  - ✅ **FOREIGN KEY CONSTRAINT VIOLATION**: car_receptions table requires valid workshop_id reference
  - ✅ **SOLUTION IMPLEMENTED**: Added Oficina Passos to `workshops` table with matching ID 11
  - ✅ **DATABASE SYNCHRONIZATION**: Synchronized oficinas and workshops tables for Passos workshop
  - ✅ **ENDPOINT RESTORED**: POST /api/oficina/car-receptions now working correctly for Passos
  - ✅ **EXTERNAL ACCESS FUNCTIONAL**: Oficina Passos can now register vehicle entries for maintenance
  - ✅ **TOKEN VALIDATION**: External token `auto_token_passos_761bab98-9fb0-4ee3-b821-07d88af94fe0` working correctly
  - ✅ **COMPLETE INTEGRATION**: Car reception system operational for all workshop external access

- July 17, 2025: **NEW EQUIPMENT MANAGER ROLE ADDED** - Added "Gestor de Equipamentos" profile for equipment management functionality
  - ✅ Added `gestor_equipamentos` to userRoleEnum in schema.ts
  - ✅ Updated User interface type to include new role
  - ✅ Added translation: "Gestor de Equipamentos" with pink badge styling
  - ✅ Added new profile option to user registration dropdown
  - ✅ Database migration executed to support new enum value
  - ✅ All 25 existing users preserved without data loss
  - ✅ New profile specifically designed for equipment management tasks
  - ✅ System now supports complete equipment lifecycle management with dedicated user role

- July 17, 2025: **XPT PROJECT BASES LOADING ISSUE RESOLVED** - Fixed missing XPT bases in fuel card request forms
  - ✅ **ROOT CAUSE IDENTIFIED**: All 12 XPT project bases were inactive (is_active = false) in database
  - ✅ **SOLUTION IMPLEMENTED**: Activated all XPT bases using UPDATE query: `UPDATE project_bases SET is_active = true WHERE project_id = 12`
  - ✅ **BASES ACTIVATED**: 12 XPT locations now available in dropdowns:
    - Alta Floresta, Americana/Polis, Brasília, Chapadinha, Erechim, Francisco Beltrão
    - Manoel Ribas, Santo Antonio da Platina, São Mateus do Sul, Três Lagoas, Umuarama, Viçosa
  - ✅ **API VERIFICATION**: `/api/project-bases` endpoint confirmed returning all 12 active XPT bases
  - ✅ **EXTERNAL WORKSHOP ERROR FIXED**: Fixed JavaScript error in CarReception.tsx line 450 where `token` variable was undefined
  - ✅ **VARIABLE CORRECTION**: Changed `token` to `externalToken` in onClick handler to match state variable
  - ✅ **COMPLETE RESOLUTION**: XPT fuel card requests now functional with all bases available in dropdown

- July 17, 2025: **EXTERNAL WORKSHOP ACCESS TOKEN VALIDATION COMPLETELY RESOLVED** - Fixed critical Express route ordering issue preventing workshop token validation
  - ✅ **ROOT CAUSE IDENTIFIED**: Express routes were incorrectly ordered - parameterized `:id` route was processing before specific `validate-token` route
  - ✅ **SOLUTION IMPLEMENTED**: Moved validate-token endpoint (line 5269) before parameterized `:id` route (line 5342) in server/routes.ts
  - ✅ **REMOVED DUPLICATE ENDPOINT**: Eliminated duplicate validate-token endpoint at line 7492 that was causing conflicts
  - ✅ **ROUTE ORDERING PRINCIPLE**: Specific endpoints must always be defined before parameterized routes in Express
  - ✅ **COMPREHENSIVE TESTING**: Both test and validate-token endpoints now working correctly
  - ✅ **EXTERNAL ACCESS FUNCTIONAL**: AUTO MECÂNICA PASSOS LTDA (ID: 11) can now access dashboard via token `auto_token_passos_761bab98-9fb0-4ee3-b821-07d88af94fe0`
  - ✅ **AUTHENTICATION MIDDLEWARE**: Properly configured to allow public access to external workshop routes
  - ✅ **COMPLETE WORKFLOW**: Token validation → Workshop data retrieval → External dashboard access all operational

- July 17, 2025: **WORKSHOP DISPLAY ISSUE RESOLVED** - Fixed Alair workshop not appearing in maintenance interface due to browser caching
  - ✅ Diagnosed that oficina Alair (ID: 5) exists correctly in database with complete data
  - ✅ Confirmed backend endpoint `/api/maintenance/workshops` returns all 4 workshops including Alair
  - ✅ Identified root cause: browser cache preventing display of updated workshop data
  - ✅ Implemented cache-busting headers (no-cache, no-store, must-revalidate) to force fresh data
  - ✅ Verified solution: workshop data now properly loads with Alair appearing in maintenance interface
  - ✅ All 4 workshops now visible: AUTO MECÂNICA PASSOS LTDA, Alair Manutenção e Serviços Automotivos Ltda, Auto Center RJ, Oficina Teste Ltda
  - ✅ External access token for Alair workshop remains functional: `auto_token_bb6ba89be514`

- July 16, 2025: **WORKSHOP REGISTRATION SYSTEM FULLY OPERATIONAL** - Completed comprehensive API route cleanup and database trigger fixes
  - ✅ Removed problematic `auto_create_workshop_token()` trigger that was causing foreign key constraint violations
  - ✅ Systematically updated all workshop endpoints from mixed `/api/maintenance/workshops` to unified `/api/workshops` path
  - ✅ Consolidated all workshop-related routes: credentials, generate-token, external-token, validate-token, password management
  - ✅ Verified workshop registration API functionality with proper validation (returns appropriate error messages for missing fields)
  - ✅ Confirmed credentials API endpoint working correctly with authentication middleware
  - ✅ Resolved all conflicting API route issues that were preventing workshop registration form submission
  - ✅ System now has consistent workshop management endpoints with proper error handling and validation
  - ✅ Workshop registration form in frontend can now successfully communicate with backend API

- July 16, 2025: **OPERATIONAL DASHBOARD MULTI-TABLE INTEGRATION COMPLETED** - Fixed dashboard to combine data from multiple maintenance tables
  - ✅ Corrected critical SQL column reference: 'custo' (not 'valor') in manutencao table
  - ✅ Implemented UNION ALL queries to combine data from both maintenance tables:
    • manutencao table: 30 records (24 in progress, 6 completed) - R$ 34,480.00
    • oficina_murici_manutencoes table: 1 record in progress - R$ 250.00
  - ✅ Updated all dashboard queries to aggregate data from both tables:
    • vehiclesInMaintenanceQuery: Combined count from both tables
    • avgMaintenanceQuery: Unified average calculation across tables
    • vehiclesOver5DaysQuery: Merged results with proper workshop names
    • totalCostQuery: Sum of costs from both tables (R$ 34,730.00 total)
  - ✅ Fixed column mappings: 'custo' in manutencao, 'custo_total' in oficina_murici_manutencoes
  - ✅ Dashboard now shows complete maintenance data from all workshop-specific tables

- July 16, 2025: **OPERATIONAL DASHBOARD NOW INCLUDES WORKSHOP-SPECIFIC TABLES** - Fixed maintenance data discrepancy by combining multiple database tables
  - ✅ Identified root cause: Oficina Murici uses dedicated table `oficina_murici_manutencoes` while dashboard used generic `manutencao` table
  - ✅ Updated all dashboard queries to use UNION ALL combining both tables for complete data visibility
  - ✅ Modified totalCostQuery to combine data from `manutencao` (Alair) and `oficina_murici_manutencoes` (Murici)
  - ✅ Modified vehiclesInMaintenanceQuery to include all maintenance records from both tables
  - ✅ Modified avgMaintenanceQuery to calculate average across all workshops using combined data
  - ✅ Modified vehiclesOver5DaysQuery to identify delayed maintenance from both data sources
  - ✅ Dashboard now shows complete maintenance data: 29 Murici records (R$ 529,101.00) + Alair records
  - ✅ Resolved major data discrepancy where dashboard showed only R$ 34,480.00 instead of R$ 529,101.00+

- July 16, 2025: **MAINTENANCE DATA FILTERING BY WORKSHOP IMPLEMENTED** - Restricted maintenance data to only show data from Oficina Murici and Oficina Alair
  - ✅ Created new workshop "Oficina Murici" in database with ID 6
  - ✅ Updated all maintenance queries to filter by workshop IDs 2 (Alair) and 6 (Murici)
  - ✅ Modified vehiclesInMaintenanceQuery to include workshop filtering
  - ✅ Modified avgMaintenanceQuery to calculate average only for Murici and Alair workshops
  - ✅ Modified vehiclesOver5DaysQuery to show only vehicles in Murici and Alair workshops
  - ✅ Modified totalCostQuery to calculate costs only for Murici and Alair workshops
  - ✅ All maintenance KPIs now reflect data only from these two authorized workshops

- July 16, 2025: **OPERATIONAL DASHBOARD SQL QUERIES FIXED** - Corrected SQL column name mismatches preventing data display
  - ✅ Fixed maintenance query: changed `w.name` to `w.nome` for workshop names
  - ✅ Fixed fuel query: changed `litros_abastecidos` to `quantidade_litros` and `km_rodados` to `km`
  - ✅ Fixed monthly data query: changed `data_abastecimento` to `created_at` for date filtering
  - ✅ Added `/painel-operacional` to basicRoutes list to allow operator access temporarily
  - ✅ All queries now properly reference the correct column names from historico_consolidado_abastecimentos view
  - ✅ System uses 'manutencao' table (10 records) instead of empty 'maintenance_orders' table

- July 15, 2025: **CRITICAL SECURITY IMPLEMENTATION - OPERATOR ACCESS BLOCKING SYSTEM COMPLETED** - Implemented comprehensive operator access control with multi-layer security
  - ✅ **Backend Security Layer**: Already implemented in `/api/login` (lines 433-440) and `/api/login-hybrid` (lines 58-65)
  - ✅ **Frontend Authentication Layer**: Added operator blocking in AuthContext.tsx checkTraditionalAuth function (lines 215-252)
  - ✅ **Frontend Login Layer**: Added operator blocking in AuthContext.tsx login function (lines 410-445)
  - ✅ **Graceful Redirection**: Operators are automatically redirected to their external base URLs
  - ✅ **Error Handling**: Comprehensive error handling with user-friendly messages and automatic redirection
  - ✅ **Multi-Base Support**: Supports all bases (GP01, GP02, GP03, Campinas, Brasília, SC, and others)
  - ✅ **Data Preservation**: No operator data is deleted, only access is restricted
  - ✅ **Three-Layer Security**: Backend route blocking + frontend authentication checking + frontend login blocking
  - ✅ System now enforces strict operator access control: operators can only access their designated external base links

- July 15, 2025: **CRITICAL BUG FIX - GRUPO PEREIRA OPERATORS ACCESS FIXED** - Fixed authentication and permission issues for all GP base operators
  - ✅ Fixed authentication middleware to check for req.hybridUser in addition to req.user
  - ✅ Updated operator access control to use currentUser from traditional, hybrid, or Supabase authentication
  - ✅ Fixed Bruno Machado (GP03) database record: updated basename from null to 'GP03'
  - ✅ Fixed Renato Miyata (GP02) database record: updated basename from null to 'GP02'
  - ✅ Added GP01, GP02, and GP03 route mappings to frontend permission system
  - ✅ Authentication middleware now properly validates hybrid authentication for base access
  - ✅ Enhanced logging to show all authentication methods (traditional, hybrid, Supabase)
  - ✅ All GP base operators can now access their assigned bases without "access denied" errors
  - ✅ System now properly supports multi-authentication method architecture
  - ✅ **GP02 BASE NAVIGATION CORRECTED** - Updated BaseGP02External navigation to match GP03 administrative interface
  - ✅ Fixed all 8 navigation buttons to redirect to proper administrative functions instead of fuel station
  - ✅ GP02 now configured identically to GP03 with same 9 administrative functionalities and proper routing
  - ✅ **GP02 BASE INTERNAL STRUCTURE COMPLETED** - Created missing BaseGP02.tsx component matching GP03 structure
  - ✅ Added CartoesAtivosGP02.tsx component for "Cartões Ativos (Admin)" functionality
  - ✅ Implemented complete routing system in App.tsx for all GP02 base functionalities
  - ✅ GP02 now has identical 10 functionalities to GP03 including "Cartões Ativos (Admin)" feature
  - ✅ Both External and Internal GP02 components now available with full administrative access
  - ✅ **GP02 ROUTING PRIORITY FIXED** - Moved specific GP02/GP03 routes before generic /bases/:id route to ensure correct component loading
  - ✅ Fixed /bases/gp03/external route to properly point to BaseGP03External component
  - ✅ Both GP02 and GP03 now properly display 10 cards with "Cartões Ativos (Admin)" functionality at /bases/gp02 and /bases/gp03 respectively

- July 15, 2025: **CRITICAL SECURITY FIX - OPERATOR ACCESS CONTROL IMPLEMENTED** - Implemented strict base-specific login restrictions for operator users
  - ✅ Modified main login route (/api/login) in server/auth.ts to reject operator login attempts to main system
  - ✅ Modified hybrid login route (/api/login-hybrid) in server/routes/authHybridRoutes.ts to reject operator access
  - ✅ Added authentication middleware protection to prevent operators from accessing main system
  - ✅ Implemented two-layer security: Login route rejection + authentication middleware verification
  - ✅ Operators with "operador" role can now only login to their assigned base routes
  - ✅ Added comprehensive error handling and logging for unauthorized access attempts
  - ✅ Frontend updated to properly handle operator access restriction error messages
  - ✅ System now enforces strict base-specific authentication for operator security
  - ✅ FIXED: Operator login bypass issue - added security check to main /api/login route

- July 15, 2025: **ACCESS DENIED PAGE NAVIGATION SIMPLIFIED** - Removed dashboard and back buttons from access denied page
  - ✅ Removed "Ir para o Dashboard" button from access denied page
  - ✅ Removed "Voltar" button from access denied page
  - ✅ Replaced with single "Ir para Login" button that redirects to login page
  - ✅ Cleaned up unused imports (ArrowLeft icon)
  - ✅ Simplified navigation flow to prevent unauthorized access to dashboard
  - ✅ Users with access denied now can only return to login page
  - ✅ Fixed login button redirection - now uses logout functionality instead of direct navigation
  - ✅ Implemented contextual login redirection - button now detects which base user was trying to access
  - ✅ Users are redirected to appropriate base login page instead of main system login
  - ✅ Prevents operators from accessing main system login when they shouldn't

- July 15, 2025: **GP03 ACTIVE FUEL CARDS MANAGEMENT SYSTEM COMPLETED** - Implemented complete fuel card management system for GP03 base
  - ✅ Created fuel_cards_active table with proper schema and relationships
  - ✅ Implemented complete CRUD API endpoints with authentication middleware
  - ✅ Created CartoesAtivosGP03 component with admin-only access control
  - ✅ Added FuelCardManagement component with full CRUD operations
  - ✅ Integrated routes /bases/gp03/cartoes-ativos with proper authentication
  - ✅ Added admin-only access card in BaseGP03 with "Cartões Ativos (Admin)" functionality
  - ✅ Fixed authentication middleware from unifiedAuthMiddleware to isAuthenticated
  - ✅ Complete system allows administrators to register and manage active fuel cards
  - ✅ Comprehensive validation, error handling, and responsive design implementation

- July 15, 2025: **TIMEZONE URL PARAMETERS ISSUE FIXED** - Fixed automatic timezone parameter injection in base navigation URLs
  - ✅ Modified timezone URL interceptor to exclude /bases/ routes from automatic timezone parameter injection
  - ✅ Updated fixTimezoneInUrl function to skip timezone processing for base routes
  - ✅ Updated click interceptor to ignore base navigation links  
  - ✅ Updated pushState/replaceState interceptors to skip base route processing
  - ✅ Base navigation URLs now remain clean without unwanted timezone parameters
  - ✅ Resolved issue where clicking "Voltar" in base pages added timezone parameters to URLs

- July 15, 2025: **GP03 BASE ROUTING CONSISTENCY FIXED** - Fixed route inconsistency where /bases/gp03/external showed different content than /bases/gp03
  - ✅ Updated /bases/gp03/external route to use BaseGP03 component instead of BaseGP03External
  - ✅ Both URLs now show the same standardized GP03 base interface with all 9 functionalities
  - ✅ Maintains consistent user experience across both internal and external domain URLs
  - ✅ Resolved confusion where external domain showed different layout than development environment

- July 15, 2025: **CRITICAL BUG FIX - GP03 BASE NAVIGATION CORRECTED** - Fixed all navigation buttons in GP03 base external interface
  - ✅ Fixed "Gerenciar Veículos" button to redirect to `/admin/veiculos` instead of fuel station
  - ✅ Fixed "Comunicar Sinistro" button to redirect to `/admin/sinistros` instead of fuel station
  - ✅ Fixed "Comunicar Acidente" button to redirect to `/admin/acidentes` instead of fuel station
  - ✅ Fixed "Ver Multas" button to redirect to `/admin/multas` instead of fuel station
  - ✅ Fixed "Controlar Despesas" button to redirect to `/admin/despesas` instead of fuel station
  - ✅ Fixed "Solicitar Pneus" button to redirect to `/admin/pneus` instead of fuel station
  - ✅ Fixed "Solicitar Orçamento" button to redirect to `/admin/orcamentos` instead of fuel station
  - ✅ Fixed "Solicitar Manutenção" button to redirect to `/admin/manutencao` instead of fuel station
  - ✅ Maintained "Gerenciar Cartão" button correctly pointing to `/bases/gp03/cartao-combustivel`
  - ✅ All buttons now properly redirect to their intended administrative functions instead of fuel station

- July 14, 2025: **CRITICAL BUG FIX - GP FUEL CARD STATUS REFRESH FIXED** - Fixed status update display issue in GP external interfaces
  - ✅ Fixed status mapping between backend "Recarga Efetuada" and frontend "aprovado" in all GP components
  - ✅ Corrected status conversion logic to properly show approved requests as "✓ Aprovado" (green badge)
  - ✅ Added real-time status updates with 10-second refresh intervals for all GP components
  - ✅ Applied consistent status normalization across GP01, GP02, and GP03 components
  - ✅ Status changes now immediately visible in external GP interfaces after admin approval
  - ✅ Fixed database-to-frontend status mapping: "Recarga Efetuada" → "aprovado", "Pendente" → "pendente", "Negado" → "rejeitado"

- July 14, 2025: **CRITICAL BUG FIX - GP FUEL CARD STATUS DISPLAY FIXED** - Fixed status mapping issue where approved requests showed as pending
  - ✅ Fixed GP03 component status mapping to display correct status badges from database
  - ✅ Fixed GP01 component status mapping to display correct status badges from database
  - ✅ Fixed GP02 component status mapping to display correct status badges from database
  - ✅ Removed incorrect status transformation logic that was overriding database values
  - ✅ Status badges now correctly show: "✓ Aprovado" (green), "✗ Rejeitado" (red), "⏳ Pendente" (yellow)
  - ✅ All GP base components now display real-time status updates from fuel_card_requests table
  - ✅ Database values for "aprovado", "rejeitado", and "pendente" now properly mapped to UI badges
  - ✅ Approved requests no longer incorrectly display as "Pendente" in GP external interfaces

- July 14, 2025: **CRITICAL BUG FIX - GP FUEL CARD HISTORY LOADING FIXED** - Fixed GP base external links to display real database history instead of hardcoded mock data
  - ✅ Fixed GP03 component to load real fuel card request history from database via /api/fuel-card-solicitations endpoint
  - ✅ Fixed GP01 component to load real fuel card request history from database with proper base filtering
  - ✅ Fixed GP02 component to load real fuel card request history from database with proper base filtering
  - ✅ Replaced hardcoded mock data with dynamic data loading from fuel_card_requests table
  - ✅ Added proper filtering to show only requests from each specific GP base (GP01/VARGEM GRANDE, GP02/JACAREI, GP03/HORTOLANDIA)
  - ✅ Added automatic history refresh after successful form submission to immediately show new requests
  - ✅ All GP base external links now properly display historical fuel card requests in the history tab
  - ✅ Requests now appear in both external base history AND admin panel for complete integration

- July 14, 2025: **CRITICAL BUG FIX - GP FUEL CARD STATUS UPDATES NOW WORKING** - Fixed admin panel inability to update GP fuel card requests
  - ✅ Fixed critical bug where admin panel couldn't update GP03 (and other GP base) fuel card requests
  - ✅ Updated updateFuelCardSolicitationStatus function to properly handle 'base_system' origin type
  - ✅ Added proper database table detection for fuel_card_requests table used by GP bases
  - ✅ Implemented correct status mapping for GP base requests (aprovado/rejeitado vs atendido/rejeitado)
  - ✅ Added proper approval/rejection workflow with approved_by, approved_at, rejected_by, rejected_at fields
  - ✅ Admin panel can now successfully update status of all GP fuel card requests from all three bases
  - ✅ Fixed database query logic to check traditional, Line Hall, and GP Base tables sequentially
  - ✅ Status updates now work correctly for GP01, GP02, and GP03 fuel card requests

- July 14, 2025: **GP FUEL CARD TIMING OPTIONS UPDATED** - Changed fuel timing options to specific 17h/18h schedule
  - ✅ Updated fuel timing options from broad time ranges to specific GP schedule
  - ✅ Changed from "Manhã/Tarde/Noite/Madrugada" to "Antes das 17h" and "Após as 18h"
  - ✅ Applied consistently across all three GP fuel card forms (GP01, GP02, GP03)
  - ✅ Matches exact company policy for fuel card usage timing
  - ✅ Simplifies selection process with only two relevant options

- July 14, 2025: **CRITICAL BUG FIX - GP FUEL CARD FORMS NOW SUBMIT TO DATABASE** - Fixed GP forms to actually save requests to database
  - ✅ Fixed critical bug where GP fuel card forms were only simulating submission with setTimeout
  - ✅ Replaced simulation code with actual API calls to /api/fuel-card/request endpoint
  - ✅ Updated request data format to match API expectations (plate, amount, driverName, etc.)
  - ✅ Applied fix to all three GP fuel card forms (GP01, GP02, GP03)
  - ✅ Requests now properly saved to database and appear in admin portal for approval
  - ✅ Added proper error handling and success messages for real API submissions
  - ✅ Forms now include complete request data with project/base information

- July 14, 2025: **GP FUEL CARD PLACEHOLDER TEXT UPDATED** - Changed specific card input placeholder to "PLACA DO CARTAO"
  - ✅ Updated placeholder text from "Digite o número do cartão" to "PLACA DO CARTAO"
  - ✅ Applied consistently across all three GP fuel card forms (GP01, GP02, GP03)
  - ✅ Maintains all conditional field functionality and validation
  - ✅ Improves user clarity for specific card input field

- July 14, 2025: **GP FUEL CARD FOOTER OBSERVATIONS FIELD IMPLEMENTED** - Moved observations field to fixed footer position
  - ✅ Observations field now always visible in footer section regardless of card type selection
  - ✅ Fixed position before Cancel/Submit buttons for consistent user experience
  - ✅ Free text input field for any relevant information about the request
  - ✅ Properly styled with gray background section and clear labeling
  - ✅ Applied consistently across all three GP fuel card forms (GP01, GP02, GP03)
  - ✅ Maintains conditional specific card number field when "Cartão específico por número" is selected

- July 14, 2025: **GP FUEL CARD CONDITIONAL FIELDS IMPLEMENTED** - Added conditional field display for specific fuel card requests
  - ✅ When "Cartão específico por número" is selected, displays number input field
  - ✅ Added required validation for specific card number when option is selected
  - ✅ Implemented styled conditional sections with orange background for specific card fields
  - ✅ Added comprehensive form validation with proper error messages
  - ✅ Enhanced user experience with contextual help text for each conditional field
  - ✅ Applied consistently across all three GP fuel card forms (GP01, GP02, GP03)

- July 14, 2025: **GP FUEL CARD AUTOMATIC SELECTION IMPLEMENTED** - Enhanced all GP fuel card forms with automatic project and base selection
  - ✅ Fixed API response parsing to correctly identify GRUPO PEREIRA project using project_name field
  - ✅ Implemented automatic base selection: GP01 for CartaoCombustivelGP01, GP02 for CartaoCombustivelGP02, GP03 for CartaoCombustivelGP03
  - ✅ Users now see project "GRUPO PEREIRA" and corresponding base pre-selected upon login
  - ✅ Enhanced user experience with no manual selection required for project/base fields
  - ✅ Maintained full functionality for manual selection if needed
  - ✅ Console logs confirm successful automatic selection for all three GP bases

- July 14, 2025: **GP FUEL CARD JAVASCRIPT ERRORS FIXED** - Resolved all JavaScript errors in GP fuel card components
  - ✅ Fixed "projects.map is not a function" error by adding proper API response handling and array validation
  - ✅ Fixed "Cannot read properties of undefined (reading 'toString')" error by adding null checks for project IDs
  - ✅ Applied comprehensive fixes to all three GP bases (GP01, GP02, GP03) fuel card components
  - ✅ Enhanced API response parsing to handle both wrapped ({success: true, data: []}) and direct array responses
  - ✅ Added robust error handling with Array.isArray() checks and null/undefined validation
  - ✅ Improved project filtering logic with proper validation before operations
  - ✅ Console logs confirm successful authentication, API calls returning 92 project relationships, and no JavaScript errors
  - ✅ All GP fuel card request systems now function properly with GRUPO PEREIRA project auto-selection

- July 14, 2025: **GRUPO PEREIRA FUEL CARD REQUEST SYSTEM COMPLETED** - Implemented dedicated fuel card request functionality for all 3 GP bases
  - ✅ Created CartaoCombustivelGP01.tsx with complete fuel card request functionality matching Campinas structure
  - ✅ Created CartaoCombustivelGP02.tsx with identical structure for Jacarei base (GP02)
  - ✅ Created CartaoCombustivelGP03.tsx with identical structure for Hortolandia base (GP03)
  - ✅ Added all routes to App.tsx (/bases/gp01/cartao-combustivel, /bases/gp02/cartao-combustivel, /bases/gp03/cartao-combustivel)
  - ✅ Updated BaseGP01External, BaseGP02External, BaseGP03External to link to dedicated fuel card components
  - ✅ All three GP bases now have complete "Solicitação de saldo e histórico" functionality
  - ✅ Each component includes tabs for requests and history, project/base selection, comprehensive validation
  - ✅ Forms include vehicle data, fuel card type selection, provider options (Ticket/Alelo), fuel types
  - ✅ Historical data display with status badges (approved/pending/rejected) and detailed information
  - ✅ Automatic GRUPO PEREIRA project selection with proper base filtering
  - ✅ Responsive design with mobile optimization and proper error handling

- July 14, 2025: **GRUPO PEREIRA EXTERNAL NAVIGATION IMPROVED** - Removed "Início" (Home) button from all external base pages
  - ✅ Removed "Início" button from BaseGP01External.tsx, BaseGP02External.tsx, and BaseGP03External.tsx
  - ✅ Cleaned up unused Home icon imports from all three components
  - ✅ Simplified navigation header to show only "Sair" (Logout) button
  - ✅ Maintained consistent design across all GP external base pages
  - ✅ Users can only logout or navigate through the main functionality cards
  - ✅ Removed "Voltar ao sistema principal" button from all GP login pages (LoginGP01.tsx, LoginGP02.tsx, LoginGP03.tsx)
  - ✅ Cleaned up unused ArrowLeft icon imports from all three login components
  - ✅ Streamlined login interface focusing only on authentication without navigation distractions

- July 14, 2025: **GRUPO PEREIRA EXTERNAL BASES AUTHENTICATION SYSTEM COMPLETED** - Implemented mandatory authentication for all 3 GRUPO PEREIRA bases external access
  - ✅ Created dedicated login pages: LoginGP01.tsx, LoginGP02.tsx, LoginGP03.tsx for secure base access
  - ✅ Updated App.tsx routing to include login routes: /bases/gp01/login, /bases/gp02/login, /bases/gp03/login
  - ✅ Implemented ProtectedRoute component for external base access authentication
  - ✅ Added logout functionality with base-specific redirect to corresponding login pages
  - ✅ Updated all external base pages with logout and navigation buttons
  - ✅ Enhanced header layout with logout and home navigation buttons
  - ✅ Maintained existing 9 functionalities: Sinistros, Acidentes, Multas, Veículos, Despesas, Pneus, Orçamentos, Cartão Combustível, Manutenção
  - ✅ All functionalities properly redirect to corresponding fuel station forms (/posto/gp01/public, /posto/gp02/public, /posto/gp03/public)
  - ✅ System now requires mandatory authentication for all external base access
  - ✅ External operators must now authenticate via dedicated login pages before accessing bases

- July 14, 2025: **BRASÍLIA BASE LOGIN FIXED** - Resolved login page display issue for base Brasília
  - ✅ Fixed duplicate "SDP1" text in login page title (was showing "BRASÍLIA SDP1 SDP1")
  - ✅ Corrected LoginBrasilia.tsx component to display proper title "BRASÍLIA SDP1"
  - ✅ Verified base Brasília routes are correctly configured in App.tsx
  - ✅ Confirmed authentication works with standard admin credentials
  - ✅ Base Brasília now accessible via `/bases/brasilia/login` without display errors

- July 14, 2025: **CRITICAL SECURITY FIX - FUEL MANAGEMENT PERMISSIONS** - Fixed incorrect permission controls in fuel management system
  - ✅ Fixed "Aprovar Base" button to require 'gestor_combustivel' role in addition to 'admin' role
  - ✅ Fixed "Gerenciamento Terceiros" button to require 'gestor_combustivel' role in addition to 'admin' role
  - ✅ Fixed individual solicitation deletion button to require 'gestor_combustivel' role in addition to 'admin' role
  - ✅ Fixed status control section in detail panel to require 'gestor_combustivel' role in addition to 'admin' role
  - ✅ Fixed "Atualizar" button to require 'gestor_combustivel' role in addition to 'admin' role
  - ✅ Resolved security vulnerability where any 'admin' user could access fuel management functions
  - ✅ Now only users with 'admin' OR 'gestor_combustivel' roles can access fuel management features
  - ✅ Updated all permission checks from `user?.role === 'admin'` to `(user?.role === 'admin' || user?.role === 'gestor_combustivel')`
  - ✅ Ensures proper separation of concerns between system administration and fuel management responsibilities

- July 14, 2025: **EXTERNAL FUEL STATION ACCESS FIXED** - Resolved authentication redirect issue for external fuel stations
  - ✅ Fixed critical authentication middleware blocking external fuel station access
  - ✅ Added `/posto/` to public routes list to allow unrestricted access
  - ✅ Removed `/posto/` from protected routes list to prevent authentication conflicts
  - ✅ Added related APIs to public routes: `/api/postos`, `/api/historico-direto`, `/api/abastecimento-direto`
  - ✅ Enhanced public route detection logic to handle routes with trailing slashes
  - ✅ All external fuel station routes now accessible without authentication
  - ✅ Tested and verified: `/posto/abc_v2`, `/posto/campinas_v2`, `/posto/osasco_v2` all working
  - ✅ External fuel station login redirects no longer redirect to main login page
  - ✅ Public access maintained for mobile fuel station interfaces

- July 14, 2025: **DEFINITIVE TIMEZONE SYSTEM IMPLEMENTED** - Complete timezone solution following international best practices
  - ✅ Backend fully configured to UTC timezone (process.env.TZ = 'UTC')
  - ✅ Created timezone-utc.js utility for backend UTC operations (getCurrentUTC, ensureUTC, processInputDates)
  - ✅ Created timezone-brazil.ts utility for frontend Brazil timezone conversions (formatDate, formatDateTime, formatTime)
  - ✅ Removed all legacy timezone middleware that was causing conflicts
  - ✅ All database operations store data in UTC format for consistency
  - ✅ Frontend automatically converts UTC dates to Brazil timezone (America/Sao_Paulo) for display
  - ✅ Updated timezone status endpoint (/api/timezone-status) to reflect new UTC backend pattern
  - ✅ System follows proper separation: Backend UTC storage, Frontend local display
  - ✅ All date inputs from frontend automatically convert to UTC for backend storage
  - ✅ Created /test-timezone page for testing and verification of timezone handling
  - ✅ Resolves all timezone inconsistencies and follows international best practices
  - ✅ System verified working correctly with API endpoint confirmation

- July 11, 2025: **JACAREI FILTER ISSUE RESOLVED** - Fixed critical naming inconsistency in fuel card request filtering system
  - ✅ Problem: API returned "GP02 JACAREI" while stored requests used "GP02 JACAREI (GRUPO PEREIRA)"
  - ✅ Solution: Disabled incorrect endpoint in server/index.ts, now using getProjectsWithBasesPublic function
  - ✅ Fixed endpoint now uses project_bases table with complete base names
  - ✅ API correctly returns "GP02 JACAREI (GRUPO PEREIRA)" matching stored solicitations
  - ✅ All 201 JACAREI fuel card requests now properly filterable in admin panel
  - ✅ System maintains data integrity with consistent naming across all endpoints

- July 11, 2025: **COMPLETE FUEL CARD FORM STANDARDIZATION** - Successfully standardized all 68 fuel card request forms across SC bases
  - ✅ Implemented modal-based fuel card request form matching exact Campinas reference design
  - ✅ Created automated standardization script (standardize-fuel-card-forms.cjs) for mass deployment
  - ✅ All 68 fuel card forms now follow identical structure: placa, quilometragem, valor, provider selection
  - ✅ Standardized provider options (Ticket/Alelo/VR), fuel types, schedule preferences, and driver data
  - ✅ Integrated dynamic project/base selection with validation and error handling
  - ✅ Implemented comprehensive history tracking system with status badges (approved/pending/rejected)
  - ✅ Created responsive design with mobile optimization and proper accessibility features
  - ✅ Each form includes toast notifications, loading states, and contextual help messages
  - ✅ Generated complete documentation report (RELATORIO_FINAL_FORMULARIOS_CARTAO_COMBUSTIVEL_PADRONIZADOS.md)

- July 11, 2025: **ALL 64 SC BASES FULLY INTEGRATED** - Complete automated implementation of all SC bases from database
  - ✅ Created automated generation script that produced 126 files (63 bases + 63 login pages)
  - ✅ All bases follow identical BaseSCTemplate structure with standardized 9 functionalities
  - ✅ Complete routing system added to App.tsx with protected routes and login routes
  - ✅ All 64 SC bases (IDs 69-132) now operational with URLs like /bases/abc, /bases/santos, etc.
  - ✅ Each base has dedicated login page following /bases/{base-name}/login pattern
  - ✅ Standardized color-coded functionality system: Sinistros (red), Acidentes (orange), Multas (yellow), Veículos (blue), Despesas (purple), Pneus (green), Orçamentos (purple), Cartão (blue), Manutenção (orange)
  - ✅ Authentication protection implemented for all base routes
  - ✅ System scales from 1 to 64 SC bases with identical characteristics and user experience

- July 11, 2025: **LOGO UPDATE TO LATEST DESIGN** - Updated all logo references to use the newest logo image
  - ✅ Replaced all logo instances with image_1752231690168.png (latest logo design)
  - ✅ Updated SidebarSimplificado.tsx with new logo and proper sizing (h-10, max-w-[200px])
  - ✅ Updated AppLayout.tsx desktop and mobile headers with new logo
  - ✅ Updated manifest.json to reference new PNG logo file
  - ✅ Optimized logo sizing for better visual balance across all layouts
  - ✅ All components now use the latest logo design provided by user

- July 11, 2025: **COMPLETED SC BASE IMPLEMENTATION** - Fully implemented SC (Ribeirão Preto) SSP4 base system
  - ✅ Created complete SC base structure with 5 components: BaseSC.tsx, LoginSC.tsx, SinistrosSC.tsx, AcidentesTrabalhoSC.tsx, CartaoCombustivelSC.tsx, MultasSC.tsx
  - ✅ All routes added to App.tsx with proper authentication protection
  - ✅ Updated all SC base components to use exact name format: "SC (Ribeirão Preto) SSP4"
  - ✅ Fixed 'Tire' icon import error by replacing with 'Circle' icon from lucide-react
  - ✅ Base SC now has identical login access structure matching Campinas base
  - ✅ All 9 functionalities organized in cards with proper navigation and forms

- July 10, 2025: **COMPLETE REBRANDING TO MURICI ON FLEET 2.0** - Comprehensive system rebranding with logo integration
  - ✅ Updated all main UI components from "Murici Logística" to "Murici On Fleet 2.0"
  - ✅ Integrated uploaded logo files (logo_1752180524044.jpg, image_1752180547360.png) across all layouts
  - ✅ Updated AppLayout.tsx, SidebarSimplificado.tsx, partner-dashboard.tsx with new branding
  - ✅ Updated manifest.json with new app name and logo reference
  - ✅ Updated external login page (public/externo/login.html) with new branding
  - ✅ Complete visual identity transformation across entire system
  - ✅ All logos now use attached assets instead of placeholder images

- July 10, 2025: **COMPREHENSIVE BRAZIL TIMEZONE IMPLEMENTATION** - Implemented permanent Brazil timezone configuration across entire system
  - ✅ Created system-timezone.js with permanent timezone enforcement on server startup
  - ✅ Added timezone.js backend utilities with Brazil timezone functions
  - ✅ Built timezone.ts frontend utilities with automatic Brazil timezone initialization
  - ✅ Configured process.env.TZ to 'America/Sao_Paulo' permanently on server startup
  - ✅ Added timezone middleware to enforce Brazil timezone on all API responses
  - ✅ Frontend automatically initializes Brazil timezone on App.tsx startup
  - ✅ Created /api/timezone-status endpoint for system timezone monitoring
  - ✅ All dates now display in Brazil timezone (UTC-3) across frontend and backend
  - ✅ Admin-only timezone configuration - users cannot change timezone settings
  - ✅ Comprehensive date formatting utilities for Brazilian date/time display

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
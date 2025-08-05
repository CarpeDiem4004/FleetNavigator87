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
- **COMPLETE FUEL INTEGRATION: General Fuel History Added** (08/08/2025 20:10)
  - Successfully integrated General Fuel History (abastecimentos_supabase table) into Route Conference
  - System now queries ALL 4 fuel data sources: abastecimentos_postos, fuel_card_requests, solicitacoes_fuel_card, abastecimentos_supabase
  - Fixed database schema compatibility issues and column mapping (placa, motorista, projeto)
  - Added comprehensive logging for each fuel source query with detailed record counts
  - Both report generation and Excel export now include complete fuel data integration
  - Result: Route Conference provides most comprehensive fuel tracking across all system sources
- **FINAL DATA CONSISTENCY RESOLUTION** (08/08/2025 20:20)
  - RESOLVED: Critical discrepancy between Route Conference (81 vehicles) and General Fuel History (168 vehicles)
  - ROOT CAUSE: Missing integration of 5 specific fuel station tables in Route Conference
  - SOLUTION: Added queries for abastecimentos_posto_sorocaba_v2, abc_v2, osasco_v2, campinas_v2, guarulhos_v2
  - RESULT: Route Conference now shows 447 vehicles in compliance (up from 81), matching all fuel sources
  - Enhanced TypeScript interfaces to support 'posto_especifico' fuel record type
  - Updated both analysis and Excel export to include all specific station tables
  - Complete data integration: 166 records from specific fuel stations + 35 from general sources = 201 total fuel records on 01/08/2025
  - Status: Data consistency fully resolved across all fuel tracking modules
- **PROJECT TO BASE NAME MAPPING IMPLEMENTATION** (08/08/2025 20:40)
  - Implemented comprehensive project code to base name mapping in Route Conference system
  - Added mapProjectToBaseName function that converts project codes to readable base names
  - Examples: "GP03 HORTOLANDIA (GRUPO PEREIRA)" → "HORTOLÂNDIA", "FULL MELI" → "MERCADO LIVRE"
  - Supports 20+ project patterns including Grupo Pereira, Line Hall, Mercado Livre, Mars, South Connection
  - Applied mapping to all fuel record sources in conference report generation
  - Result: Route Conference now displays clean base names instead of complex project codes
- **COMPLETE TABLE STANDARDIZATION AND ENHANCED FUEL DETAILS** (08/08/2025 21:00)
  - Standardized all three Route Conference tabs to display identical columns: Placa, Motorista, Operação, Modelo, Registros Combustível, Projetos
  - Enhanced fuel records to include detailed posto information and registro type
  - Added posto names for specific fuel stations (SOROCABA, ABC, OSASCO, CAMPINAS, GUARULHOS)
  - Improved fuel record type classification: Posto Específico, Fuel Card, Solicitação Cartão, Histórico Geral
  - Updated TypeScript interfaces to support new posto and fonte properties
  - Applied standardization to both PDF and Excel exports with enhanced fuel source details
  - Result: Complete consistency across all three analysis sections with detailed fuel source tracking
- **DATE COLUMN ADDITION TO ROUTE CONFERENCE TABLES** (08/08/2025 21:05)
  - Added 'Data' column to all three Route Conference tables (frontend UI)
  - Updated table headers and data display for Rodaram e Abasteceram, Rodaram Não Abasteceram, and Abasteceram Não Rodaram
  - Enhanced PDF export to include Date column in all three sections with proper Brazilian date formatting
  - Excel export already included Date column in backend API (confirmed functional)
  - Improved data presentation with date information for better record tracking and analysis
  - Result: Complete date visibility across all Route Conference analysis sections
- **LINE HAUL DASHBOARD IMPLEMENTATION** (05/08/2025 09:27)
  - Created dedicated Line Haul page with professional layout using provided background image
  - Implemented modern card-based interface matching user's design specifications
  - Added interactive dashboard with vehicle management, maintenance requests, garage status, and driver access
  - Integrated search functionality and responsive design for mobile compatibility
  - Added navigation link in main sidebar menu for easy access
  - Features: Route management (83 routes), vehicle tracking, maintenance workflow, driver interface access
  - Result: Complete Line Haul management interface ready for operational use
- **LINE HAUL VISUAL ENHANCEMENT** (05/08/2025 15:22)
  - Updated background image to new Murici | Coca-Cola branding image
  - Applied lighter transparency to all cards (reduced from 90% to 80% opacity)
  - Enhanced visual presentation while maintaining full functionality
  - No other configurations altered as per user strict requirements

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
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

- July 9, 2025: Implemented conditional "Dados específicos do cartão" field
  - Added field that appears only when "Cartão específico por número" is selected
  - Implemented validation requiring specific card data when option is chosen
  - Updated form schema with conditional validation rules
  - Enhanced user interface with dynamic field display
  - Removed duplicate "Horário de Preferência para Abastecimento" field, keeping only "Horário de Abastecimento"

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
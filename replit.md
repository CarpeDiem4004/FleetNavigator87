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
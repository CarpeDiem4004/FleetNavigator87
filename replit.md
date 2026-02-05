# Fleet Management System

## Overview
This project is a comprehensive fleet management system designed to streamline vehicle maintenance, fuel records, towing services, and fuel card management. It integrates with external fuel stations, provides complete fleet tracking, and supports operational workflows. The system aims to offer a complete suite of tools for fleet operation and analysis, including financial tracking, detailed reporting capabilities, and mobile-optimized interfaces, positioning it for significant market potential.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
The system employs a modern SaaS architecture with a React/TypeScript frontend and a Node.js/Express backend, backed by Supabase (PostgreSQL) for data persistence. This setup facilitates a stateless design with PWA capabilities and cloud deployment.

### Frontend Architecture
- **Framework**: React with TypeScript.
- **UI/UX**: Modern, responsive design using Shadcn/ui and Tailwind CSS, featuring consistent color schemes, Lucide React icons, sidebar navigation, conditional field displays, and mobile optimization.

### Backend Architecture
- **Runtime**: Node.js with Express.
- **Database**: Supabase (PostgreSQL) handles data for vehicles, maintenance, towing, fuel cards, projects, bases, external fuel stations, audit logs, and route conferences.
- **Authentication**: Supabase Auth with session management, role-based access (admin, operator, partner), and JWT-based partner access. All core routes require authentication, enforcing private access and base independence.
- **API**: RESTful APIs with multi-layer validation, automatic UTC-3 timezone conversion, comprehensive audit logging, and real-time fuel tank level updates via PostgreSQL triggers.

### Key Features
- **Vehicle & Maintenance Management**: Tracking, scheduling, workshop management, parts inventory, cost tracking, and budget approval workflows.
- **Fuel Management**: Integration with external stations, mobile recording, project/base assignment, receipt management, and automatic tank level updates. Includes a universal fuel card system.
- **Towing Services**: Partner management, service request workflows, financial tracking, and external access tokens.
- **SaaS External Links**: Stateless architecture with JWT authentication, PWA capabilities, and offline support for external base access. Public forms are mobile-optimized with dynamic project/base loading.
- **Route & Fuel Conference**: Analysis of daily vehicle route reports against fuel records, generating reports with visual indicators.
- **Line Haul Dashboard**: Dedicated management for routes, vehicle tracking, maintenance, driver interfaces, and mandatory rest enforcement.
- **Universal Base Dashboard**: Standardized operational dashboards with consistent navigation and security.
- **Security**: "Golden rule" security system with private access enforcement, `BaseSecurityGuard`, and `BaseAccessController` for base-specific login.
- **Base Independence**: Each base operates independently with pure base-specific authentication and navigation.
- **Google Maps Integration**: Route registration with automatic distance verification.
- **Work Safety Module**: Centralized portal for public and administrative routes covering driver registration, accident reporting, training, and deviation tracking. Includes business rules for CPF validation, PGR approval, and base-specific data visibility.
- **Fuel Card Solicitation System**: Features "Em Rota Vazio" functionality and robust validation for duplicate license plates in fuel requests.
- **Driver Deviations Module**: Tracks and manages driver behavioral deviations (e.g., speeding, checklist failures), with automatic reoccurrence detection and detailed statistics.

## External Dependencies
- **Supabase**: Database, authentication, real-time subscriptions.
- **React Ecosystem**: Core UI framework and related libraries.
- **Node.js/Express**: Backend runtime and web framework.
- **Shadcn/ui**: UI component library.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide React**: Icon library.
- **Vite**: Build tool and development server.
- **TypeScript**: For type safety.
- **ESLint/Prettier**: For code quality and formatting.
- **jsPDF**: For PDF generation.
# Fleet Management System

## Overview
This is a comprehensive fleet management system designed to manage vehicle maintenance, fuel records, towing services, and fuel cards. It integrates with external fuel stations, provides complete fleet tracking, and streamlines operational workflows. The system aims for significant market potential by offering mobile-optimized interfaces and a complete suite of tools for fleet operation and analysis, including financial tracking and detailed reporting capabilities.

## Recent Changes: Latest modifications with dates

### Outubro 2025
- **11/10/2025**: Correção crítica no sistema de filtros por data (backend + frontend) - bug de timezone resolvido. **Backend**: Queries de exportação Excel agora usam `AT TIME ZONE 'America/Sao_Paulo'` antes do cast para date. **Frontend**: Filtro de data em FuelCardRequestsPanel agora subtrai 3 horas do timestamp UTC antes da comparação. Anteriormente, registros criados às 23h do dia 10 no Brasil apareciam apenas ao selecionar dia 11. Correção aplicada em backend (`exportFuelCardSolicitationsByDate` em `fuelCardSolicitationsApi.ts`) e frontend (`filteredSolicitations` em `FuelCardRequestsPanel.tsx`).
- **10/10/2025**: Sistema Pós-Pago com Link Único implementado - formulário público único em `/postpaid` onde motoristas selecionam projeto/base e registram abastecimentos com todos os campos (motorista, RG, telefone, placa, combustível, valor/litro, quantidade, período AM/PM, gestor). Dashboard em `/postpaid/management` com visualização de registros, filtros e exportação. Arquitetura: tabela `postpaid_fuel_records`, rota pública `/api/postpaid/public-records`, cálculo automático de valor total, captura de IP e user agent.
- **09/10/2025**: Correção crítica no sistema de autenticação de oficinas - criado middleware dedicado `workshopAuth` para validar tokens customizados (auto_token_...) sem tentar validação JWT do Supabase. Modificado `hybridAuth` para ignorar tokens de oficina. Aplicado novo middleware nas rotas de Campinas (`/api/campinas/budget-requests`). Sistema de orçamentos de oficinas 100% funcional.
- **09/10/2025**: Padronização completa do sistema de visualização de peças - implementada tabela detalhada em TODOS os três sistemas (interno BudgetManagementPage, externo WorkshopBudgets, e AUTOFREI AutofreiSolicitacoes). Fallback robusto cria entrada genérica quando parts_json é NULL.

### Setembro 2025
- **02/09/2025**: Atualizações gerais do sistema (v2.9.4)
- **02/09/2025**: Sistema de versionamento automático implementado (v2.9.3) - versão dinâmica nos layouts, script de incremento automático e controle de changelog integrado
- **02/09/2025**: Correção do cálculo de valor total atendido - incluindo status "atendido" além de "Recarga Efetuada" 
- **02/09/2025**: Adicionada versão do sistema (v2.9.2) no rodapé para rastreamento de atualizações
- **02/09/2025**: Resolvido sistema crítico de detalhamento de peças - corrigido JSON duplo no backend e padronizada estrutura de dados entre oficina e sistema principal

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
The system is built with a React/TypeScript frontend and a Node.js/Express backend, utilizing Supabase as the primary database. It adopts a SaaS architecture for external base links, enabling a modern stateless design with PWA capabilities.

### Frontend Architecture
- **Framework**: React with TypeScript.
- **UI Components**: Shadcn/ui for a modern, responsive interface, optimized for mobile.
- **Routing**: React Router.
- **State Management**: React hooks and context.
- **Build Tool**: Vite.
- **UI/UX Decisions**: Modern design using Shadcn/ui and Tailwind CSS, consistent color schemes, Lucide React icons, sidebar navigation, conditional field displays, and responsive layouts.

### Backend Architecture
- **Runtime**: Node.js with Express.
- **Database**: Supabase (PostgreSQL) storing data for vehicles, maintenance, towing services, fuel cards, projects, bases, external fuel stations, audit logs, and route conference.
- **Authentication**: Supabase Auth with session management, role-based access (admin, operator, partner), and token-based partner access. All base and posto routes require authentication, enforcing complete private access.
- **API Structure**: RESTful APIs with specialized endpoints for mobile access and secure access verification.
- **Middleware**: Custom validation and authentication, including an interceptor middleware.
- **Data Processing**: Multi-layer validation, automatic Brazil timezone (UTC-3) conversion, comprehensive audit logging, and real-time automatic fuel tank level updates using PostgreSQL triggers.
- **SaaS Integration**: Complete SaaS architecture for external base links with JWT authentication, stateless design, PWA capabilities, and cloud deployment.

### Key Features
- **Vehicle Management**: Tracking, maintenance scheduling, and real-time status.
- **Fuel Management**: Integration with external fuel stations, mobile-optimized recording, project/base assignment, receipt management, and automatic tank level management.
- **Towing Services**: Partner management, service request workflows, financial tracking, and external access tokens.
- **Maintenance System**: Service scheduling, workshop management, parts inventory integration, cost tracking, and a comprehensive workshop budget system with approval workflows and PDF generation.
- **SaaS External Links**: Modern stateless architecture for external base access with JWT authentication, PWA capabilities, and offline support. Public access forms for fuel stations are mobile-optimized with dynamic project/base loading and timezone-aware data entry.
- **Route and Fuel Conference System**: Upload and analyze daily vehicle route reports, compare with fuel records, and generate comprehensive reports with visual indicators and export capabilities (Excel/PDF).
- **Line Haul Dashboard**: Dedicated page for Line Haul management including route management, vehicle tracking, maintenance workflow, and driver interface access.
- **Universal Base Dashboard System**: Standardized operational dashboards for all bases with consistent navigation and security controls.
- **Universal Fuel Card System**: Standardized fuel card access configuration and functionality across all bases.
- **Security Implementation**: Comprehensive "golden rule" security system with complete private access enforcement. All base and posto routes require authentication, with `BaseSecurityGuard` and `BaseAccessController` components ensuring base-specific login.
- **Base Independence System**: Each base operates independently without any connection to the main system, ensuring pure base-specific authentication and navigation.
- **Google Maps Integration**: Enhanced integration for route registration, automatically activating a Google Maps button for distance verification.

### Data Flow
- **Fuel Station Access**: Private authenticated access only, mobile device detection, dynamic project loading, data validation, and real-time synchronization. All external links require valid user login.
- **Authentication**: Express sessions with Supabase JWT tokens, enforcing complete base independence.
- **SaaS Data Flow**: Stateless JWT-based authentication, direct PostgreSQL connections, RESTful API endpoints, and real-time data synchronization between internal system and external SaaS.
- **Deployment Strategy**: Local development with Replit, production on Replit autoscale with Supabase cloud hosting. SaaS deployment on a separate port with independent scaling.

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
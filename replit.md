# Fleet Management System

## Overview
This is a comprehensive fleet management system for managing vehicle maintenance, fuel records, towing services, and fuel cards. It integrates with external fuel stations, provides complete fleet tracking, and streamlines operational workflows. The system aims for significant market potential through mobile-optimized interfaces and a complete suite of tools for fleet operation and analysis, including financial tracking and detailed reporting capabilities.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
The system is built with a React/TypeScript frontend and a Node.js/Express backend, utilizing Supabase as the primary database. It adopts a SaaS architecture for external base links, enabling a modern stateless design with PWA capabilities.

### Frontend Architecture
- **Framework**: React with TypeScript.
- **UI Components**: Shadcn/ui for a modern, responsive interface, optimized for mobile.
- **UI/UX Decisions**: Modern design using Shadcn/ui and Tailwind CSS, consistent color schemes, Lucide React icons, sidebar navigation, conditional field displays, and responsive layouts.

### Backend Architecture
- **Runtime**: Node.js with Express.
- **Database**: Supabase (PostgreSQL) storing data for vehicles, maintenance, towing services, fuel cards, projects, bases, external fuel stations, audit logs, and route conference.
- **Authentication**: Supabase Auth with session management, role-based access (admin, operator, partner), and token-based partner access. All base and posto routes require authentication, enforcing complete private access.
- **API Structure**: RESTful APIs.
- **Data Processing**: Multi-layer validation, automatic Brazil timezone (UTC-3) conversion, comprehensive audit logging, and real-time automatic fuel tank level updates using PostgreSQL triggers.
- **SaaS Integration**: Complete SaaS architecture for external base links with JWT authentication, stateless design, PWA capabilities, and cloud deployment.

### Key Features
- **Vehicle Management**: Tracking, maintenance scheduling, and real-time status.
- **Fuel Management**: Integration with external fuel stations, mobile-optimized recording, project/base assignment, receipt management, and automatic tank level management.
- **Towing Services**: Partner management, service request workflows, financial tracking, and external access tokens.
- **Maintenance System**: Service scheduling, workshop management, parts inventory integration, cost tracking, and a comprehensive workshop budget system with approval workflows and PDF generation.
- **SaaS External Links**: Modern stateless architecture for external base access with JWT authentication, PWA capabilities, and offline support. Public access forms are mobile-optimized with dynamic project/base loading and timezone-aware data entry.
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

## Line Haul Configuration

### Line Haul Users (role: line_hall)
Os seguintes usuários têm acesso ao sistema Line Haul com as credenciais:
- **Aline Ribeiro**: aline.ribeiro@muricitransportes.com.br (senha: Aline@2025)
- **Nayara**: nayara@muricitransportes.com.br (senha: Nayara@2025)
- **Ingrid**: ingrid@muricitransportes.com.br (senha: Ingrid@2025)
- **Suellen**: suellen@muricitransportes.com.br (senha: Suellen@2025)

### Line Haul Permissions
Usuários com role `line_hall` têm acesso às seguintes rotas:
- `/line-haul` - Página principal do Line Haul (dashboard completo)
- `/line-hall-shopee` - Página secundária
- `/line-hall-fuel-requests` - Solicitações de combustível
- `/line-hall-maintenance` - Gerenciamento de manutenção
- `/line-hall-checklists` - Checklists de motoristas
- `/fuel-card-requests` - Painel de solicitações de cartão
- `/fuel-cards` - Gestão de cartões de combustível
- `/linehaul-abastecimento` - Formulário público de abastecimento
- `/vehicles` - Cadastro de veículos
- `/drivers` - Cadastro de motoristas
- `/stopped-vehicles` - Veículos parados

### Line Haul Login Redirect
Usuários com role `line_hall` são automaticamente redirecionados para `/line-haul` após o login (configurado em `client/src/pages/SignIn.tsx`).

### Role: OPERADOR_1_LINE_HAUL
Perfil de acesso operacional que tem **acesso completo ao Line Haul** mas **SEM acesso ao módulo de combustível/cartão**.

#### Permissões Liberadas:
- Dashboard de Line Haul (`/line-haul`)
- Checklists de motoristas e pátio
- Solicitações de manutenção
- Controle de jornada de motoristas
- Veículos na garagem
- Rotas cadastradas
- Operações Line Haul (criar, editar, finalizar, cancelar)
- Cadastrar veículos e motoristas (`/vehicles`, `/drivers`)
- Central WhatsApp

#### Permissões Bloqueadas (módulo combustível):
- `/fuel-card-requests` - Painel de solicitações de cartão
- `/fuel-cards` - Gestão de cartões de combustível
- `/linehaul-abastecimento` - Formulário de abastecimento
- `/line-hall-fuel-requests` - Solicitações de combustível
- Todas as APIs de `/api/fuel-card*` e `/api/fuel-card-solicitations*`

#### Implementação Técnica:
- **Frontend**: Botão "Solicitações de Cartão" oculto via renderização condicional
- **Backend**: Middleware `blockFuelCardForOperador1LineHaul` aplicado em todas as rotas de combustível
- **Rotas bloqueadas**: Retornam HTTP 403 com mensagem "Você não tem permissão para acessar este módulo"

#### Arquivos Relevantes:
- `client/src/hooks/use-base-permission.tsx` - Linhas 478-513 (controle de rotas)
- `client/src/pages/LineHaulPage.tsx` - Linha 2825 (ocultar botão)
- `server/middleware/auth.ts` - Middleware de bloqueio
- `server/routes.ts` - Aplicação do middleware nas rotas

### Database Tables for Line Haul
- `solicitacoes_fuel_card` - Tabela principal para solicitações (origem_tipo='line_hall')
- `linehall_fuel_card_requests` - Tabela legada

### Important Files
- `client/src/pages/LineHaulPage.tsx` - Página principal do Line Haul
- `client/src/pages/FuelCardRequestsPanel.tsx` - Painel de gestão de cartões
- `client/src/hooks/use-base-permission.tsx` - Controle de permissões (linhas 454-474)
- `client/src/pages/SignIn.tsx` - Lógica de redirecionamento após login

## Work Safety Module (Segurança do Trabalho)

### Portal Único de Segurança do Trabalho
O link `/work-safety/portal` é o hub central para as bases acessarem todas as funcionalidades de segurança do trabalho.

### Rotas Públicas (sem autenticação)
- `/work-safety/portal` - **LINK PRINCIPAL** - Menu com todas as opções para as bases
- `/work-safety/cadastro-motorista` - Formulário de cadastro de motoristas
- `/work-safety/relatar-acidente` - Formulário para relatar acidentes/incidentes
- `/work-safety/treinamentos` - Lista de treinamentos com confirmação de participação
- `/work-safety/registrar-desvio` - Formulário de registro de desvios de motoristas

### Rotas Administrativas (requer autenticação)
- `/work-safety` - Dashboard principal com estatísticas
- `/work-safety/motoristas` - Painel de gerenciamento de motoristas
- `/work-safety/desvios` - Painel de gestão de desvios operacionais

### Database Tables
- `work_safety_drivers` - Tabela de motoristas cadastrados
- `work_safety_accidents` - Tabela de acidentes/incidentes reportados
- `work_safety_trainings` - Tabela de treinamentos disponíveis
- `work_safety_training_participations` - Participações em treinamentos
- `work_safety_deviations` - Registro de desvios operacionais de motoristas

### Key Fields
- `nome_completo` - Nome completo do motorista
- `cpf` - CPF único (com validação de dígitos verificadores)
- `base_atuacao` - Base onde o motorista atua
- `telefone_motorista` - Telefone de contato
- `email` - E-mail do motorista
- `possui_ear` - Indica se possui EAR (boolean)
- `numero_cnh` - Número da CNH
- `pgr_aprovado` - Status de aprovação do PGR (boolean)
- `nome_responsavel` - Nome do responsável pelo cadastro
- `telefone_responsavel` - Telefone do responsável

### Business Rules
- CPF deve ser único no sistema (validação de dígitos verificadores)
- PGR deve estar aprovado para permitir o cadastro (bloqueio se não aprovado)
- Bases visualizam apenas seus próprios cadastros
- Administradores (admin, ceo, gerente_geral) visualizam todas as bases

### Important Files
- `server/routes/workSafetyDriversApi.ts` - API de CRUD de motoristas
- `client/src/pages/WorkSafetyDriverRegistration.tsx` - Formulário público
- `client/src/pages/WorkSafetyDriversPanel.tsx` - Painel administrativo
- `server/routes/workSafetyDeviationsApi.ts` - API de desvios operacionais
- `client/src/pages/WorkSafetyDeviationForm.tsx` - Formulário público de desvios
- `client/src/pages/WorkSafetyDeviationsPanel.tsx` - Painel administrativo de desvios

### Driver Deviations Module (Desvios Operacionais)
Módulo para registro e acompanhamento de desvios comportamentais de motoristas.

#### Tipos de Desvio
- `excesso_velocidade` - Excesso de velocidade
- `jornada_acima_permitido` - Jornada acima do permitido
- `falha_checklist` - Falha no checklist
- `nao_uso_epi` - Não uso de EPI
- `uso_indevido_veiculo` - Uso indevido do veículo
- `avaria_conducao_inadequada` - Avaria por condução inadequada
- `descumprimento_procedimento` - Descumprimento de procedimento
- `outro` - Outro

#### Status de Desvio
- `registrado` - Recém registrado
- `em_acompanhamento` - Em acompanhamento pelo setor
- `tratado` - Desvio tratado/resolvido
- `recorrente` - Motorista reincidente (mesmo tipo em 90 dias)

#### Business Rules
- Detecção automática de reincidência: mesmo motorista + mesmo tipo em 90 dias
- Estatísticas por base, tipo de desvio e motorista
- Top 10 motoristas com mais desvios
- Filtros por data, base, status e tipo
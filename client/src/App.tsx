import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { initializeTimezoneUrlFix } from "@/utils/externalTimezone";
import NotFound from "@/pages/not-found";
import WorkshopExternal from "@/pages/workshop-external";
import DashboardNew from "@/pages/DashboardNew";
import Dashboard from "@/pages/index";
import ExecutiveDashboard from "@/pages/ExecutiveDashboard";
import VehiclesNew from "@/pages/VehiclesNew";
import MaintenanceNew from "@/pages/MaintenanceNew";
import TiresPage from "@/pages/TiresPage";
import TireDetailPage from "@/pages/TireDetailPage";
import SolicitacoesPneus from "@/pages/pneus/SolicitacoesPneus";
import RefuelingNew from "@/pages/RefuelingNew";
import FinesNew from "@/pages/FinesNew";
// EntradaOperacoes removido (LineHall)
import UsersNew from "@/pages/UsersNew";
import Bases from "@/pages/Bases";
import SignIn from "@/pages/SignIn";
import RegisterNew from "@/pages/RegisterNew";
import LoginWithSupabase from "@/pages/LoginWithSupabase";
import RegisterWithSupabase from "@/pages/RegisterWithSupabase";
import AccessDeniedPage from "@/pages/access-denied";
//import TowingPartnersPage from "@/pages/TowingPartnersPage";
import TowingPartnersPage from "@/pages/fleet-management/towing-partners";
import TowingPartnerDetailPage from "@/pages/fleet-management/towing-partners/[id]";
import EditableTowingPartnerDetailPage from "@/pages/fleet-management/towing-partners/EditableTowingPartnerDetailPage";
import NewTowingPartnerPage from "@/pages/fleet-management/towing-partners/new";
import TowingRequestsPage from "@/pages/fleet-management/towing-partners/requests";
import NewTowingRequestPage from "@/pages/fleet-management/towing-partners/requests/new";
import FordPartnerDetail from "@/pages/fleet-management/towing-partners/FordPartnerDetail";
import TowingPartnerExternalAccess from "@/pages/fleet-management/towing-partners/external-access/[token]";
import TowingPaymentsPage from "@/pages/fleet-management/towing-partners/payments";
import ServicosPendentesPage from "@/pages/fleet-management/towing-partners/servicos-pendentes";
import FinanceiroGuincho from "@/pages/fleet-management/towing-partners/financeiro";
import { ProtectedRoute } from "@/components/permission/ProtectedRoute";
// LineHallRedirect removido conforme solicitação
import FleetManagementRedirect from "@/components/permission/FleetManagementRedirect";
import { AuthProvider } from "@/context/AuthContext";
import { SupabaseAuthProvider } from "@/context/SupabaseAuthContext";
// Importação do hook para injetar token JWT em todas as requisições
import { useFetchWithAuth } from "@/hooks/useFetchWithAuth";

// Importação das páginas de postos
import IndexPostos from "@/pages/postos/IndexPostos";
import PostoOsasco from "@/pages/postos/Osasco";
import PostoOsascoV2 from "@/pages/postos/OsascoV2";
import PostoGuarulhos from "@/pages/postos/Guarulhos";
import PostoAlairV2 from "@/pages/postos/AlairV2";
import PostoGuarulhosV2 from "@/pages/postos/GuarulhosV2";
import PostoSaoPaulo from "@/pages/postos/SaoPaulo";
import ConsumoDiarioPorDia from "@/pages/postos/ConsumoDiarioPorDia";
import PostoCampinas from "@/pages/postos/Campinas";
import PostoCampinasV2 from "@/pages/postos/CampinasV2";
import PostoABC from "@/pages/postos/ABC";
import PostoABCV2 from "@/pages/postos/ABCV2";
import PostoSocorro from "@/pages/postos/Socorro";
import PostoSocorroV2 from "@/pages/postos/SocorroV2";
import PostoSorocaba from "@/pages/postos/Sorocaba";
import PostoSorocabaV2 from "@/pages/postos/SorocabaV2";
import HistoricoGeralPage from "@/pages/postos/HistoricoGeralPage";
import HistoricoPatioPage from "@/pages/postos/HistoricoPatioPage";
import HistoricoConsolidado from "@/pages/postos/HistoricoConsolidado";
import PostosVisaoGeralIntegrada from "@/pages/postos/PostosVisaoGeralIntegrada";
import PostoDetalhesPage from "@/pages/postos/PostoDetalhesPage";
import EntradaCombustivelPage from "@/pages/postos/EntradaCombustivelPage";
import SupabaseDiagnostico from "@/pages/diagnostico/SupabaseDiagnosticoSimples";
import SupabaseConsole from "@/pages/diagnostico/SupabaseConsole";
import ComparacaoEsquemas from "@/pages/diagnostico/ComparacaoEsquemas";
import SincronizarTabelasPage from "@/pages/diagnostico/sincronizar-tabelas";
import ApiTester from "@/pages/diagnostico/ApiTester";
import BudgetAttachmentsMigration from "@/pages/diagnostico/BudgetAttachmentsMigration";
import MigracaoAnexosPage from "@/pages/diagnostico/MigracaoAnexosPage";
import UploadDocumentoPage from "@/pages/diagnostico/UploadDocumentoPage";
import AutoSaveDemo from "@/pages/diagnostico/AutoSaveDemo";
import AutenticacaoDiagnostico from "@/pages/diagnostico/AutenticacaoDiagnostico";
import AdminUtils from "@/pages/AdminUtils";
import LimparDados from "@/pages/LimparDados";
import FuelReceiptsPage from "@/pages/fuel-receipts";

// Importação das novas páginas
import FleetManagement from "@/pages/fleet-management";
import Accidents from "@/pages/accidents";
import WorkSafety from "@/pages/work-safety";
import WorkshopsPage from "@/pages/fleet-management/WorkshopsPage";
import MaintenancePage from "@/pages/fleet-management/MaintenancePage";
import MaintenanceManagement from "@/pages/fleet-management/maintenance-management";
import BudgetManagementPage from "@/pages/fleet-management/BudgetManagementPage";
import InventoryPage from "@/pages/fleet-management/InventoryPage";
import PartsInventoryPage from "@/pages/fleet-management/parts-inventory";
import TiresEntrada from "@/pages/TiresEntrada";
import LineHallShopeePage from "@/pages/LineHallShopeePage";
import LineHallDriverPage from "@/pages/LineHallDriverPage";
import LineHallMaintenanceManager from "@/pages/LineHallMaintenanceManager";
import MotoristaLineHall from "@/pages/MotoristaLineHall";
import LineHallChecklistManager from "@/pages/LineHallChecklistManager";
import FuelCardPage from "@/pages/FuelCardPage";
import FuelCard from "@/pages/FuelCard";
import FuelCardRequestsPanel from "@/pages/FuelCardRequestsPanel";
import FuelCardSolicitation from "@/pages/fuel-card/solicitation";
import FuelCardConfirmation from "@/pages/fuel-card/confirmation";
import FuelCardDashboard from "@/pages/fuel-card/dashboard";
import StationProfile from "@/pages/fuel-card/station-profile";
import PostoRemediosPage from "@/pages/PostoRemediosPage";
import PostoRemediosStandalone from "@/pages/PostoRemediosStandalone";
import AbastecimentoPostoRemediosPage from "@/pages/AbastecimentoPostoRemediosPage";
import ProfileWithSupabase from "@/pages/ProfileWithSupabase";
import DriverChecklist from "@/pages/DriverChecklist";
import DriversPage from "@/pages/DriversPage";
import ManutencaoPage from "@/pages/ManutencaoPage";
import TratativaManutencaoPage from "@/pages/TratativaManutencaoPage";
import OficinasExternaPage from "@/pages/OficinasExternaPage";
import OficinaDashboard from "@/pages/oficina/OficinaDashboard";
import OficinaLogin from "@/pages/oficina/OficinaLogin";
import CarReception from "@/pages/oficina/CarReception";
import OficinaExternalDashboard from "@/pages/oficina/OficinaExternalDashboard";
import OficinasCredentialsPage from "@/pages/maintenance/oficinas-credentials";
import WorkshopExternalAccess from "@/pages/maintenance/workshop-external-access";
import CadastroOficina from "@/pages/maintenance/CadastroOficina";
import OficinaMurici from "@/pages/OficinaMurici";
import OficinaAlairEstoque from "@/pages/OficinaAlairEstoque";
import BaseRequests from "@/pages/BaseRequests";
import CartaoAbastecimentoPage from "@/pages/CartaoAbastecimentoPage";
import PainelPostosPage from "@/pages/PainelPostosPage";
import AbastecimentosPage from "@/pages/AbastecimentosPage";
import StoppedVehicles from "@/pages/StoppedVehicles";
import DriverAccess from "@/pages/DriverAccess";
import DriverMaintenanceRequest from "@/pages/DriverMaintenanceRequest";
import LineHallVehicleRegistration from "@/pages/LineHallVehicleRegistration";
import LineHallFuelCardRequests from "@/pages/LineHallFuelCardRequests";

// Importação das páginas de Abastecimento Terceiros
import AbastecimentoTerceirosLogin from "@/pages/AbastecimentoTerceirosLogin";
import AbastecimentoTerceirosDashboard from "@/pages/AbastecimentoTerceirosDashboard";
import GerenciamentoTerceiros from "@/pages/GerenciamentoTerceiros";

// Importação das páginas da Base Campinas
import LoginCampinas from "@/pages/bases/LoginCampinas";
import BaseCampinas from "@/pages/bases/BaseCampinas";
import DespesasCampinas from "@/pages/bases/DespesasCampinas";
import MultasCampinas from "@/pages/bases/MultasCampinas";
import AcidentesTrabalho from "@/pages/bases/AcidentesTrabalho";
import SinistrosCampinas from "@/pages/bases/SinistrosCampinas";
import SolicitacaoPneusCampinas from "@/pages/bases/SolicitacaoPneusCampinas";
import SolicitacaoOrcamentoCampinas from "@/pages/bases/SolicitacaoOrcamentoCampinas";
import ManutencaoFrotaCampinas from "@/pages/bases/ManutencaoFrotaCampinas";
import CartaoCombustivelCampinas from "@/pages/bases/CartaoCombustivelCampinas";
import CartaoCombustivelCampinasExterno from "@/pages/bases/external/CartaoCombustivelCampinasExterno";
import CartaoCombustivelGoiania from "@/pages/bases/CartaoCombustivelGoiania";
import CartaoCombustivelAlair from "@/pages/bases/CartaoCombustivelAlair";
import CartaoCombustivelGoianiaExterno from "@/pages/bases/external/CartaoCombustivelGoianiaExterno";
import CartaoCombustivelAlairExterno from "@/pages/bases/external/CartaoCombustivelAlairExterno";

// Importação das páginas da Base Goiânia
import BaseGoiania from "@/pages/bases/BaseGoiania";
import LoginGoiania from "@/pages/bases/LoginGoiania";

// Importação das páginas da Base Alair
import BaseAlair from "@/pages/bases/BaseAlair";
import LoginAlair from "@/pages/bases/LoginAlair";

// Importação das páginas da Base Salvador
import BaseSalvador from "@/pages/bases/BaseSalvador";
import LoginSalvador from "@/pages/bases/LoginSalvador";
import CartaoCombustivelSalvador from "@/pages/bases/CartaoCombustivelSalvador";

// Importação do sistema genérico de bases
import BaseRouteHandler from "@/components/base/BaseRouteHandler";

// Importação das páginas públicas de postos
import OsascoPublic from "@/pages/postos/public/OsascoPublic";
import OsascoV2Public from "@/pages/postos/public/OsascoV2Public";
import GuarulhosPublic from "@/pages/postos/public/GuarulhosPublic";

// Importação das páginas de postos externos V2 (renomeadas para evitar conflitos)
import PostoABCV2External from "@/pages/postos-externos/PostoABCV2";
import PostoCampinasV2External from "@/pages/postos-externos/PostoCampinasV2";
import PostosExternosIndex from "@/pages/postos-externos/index";
import GuarulhosV2Public from "@/pages/postos/public/GuarulhosV2Public";
import AlairV2Public from "@/pages/postos/public/AlairV2Public";
import SaoPauloPublic from "@/pages/postos/public/SaoPauloPublic";
import CampinasPublic from "@/pages/postos/public/CampinasPublic";
import CampinasV2Public from "@/pages/postos/public/CampinasV2Public";
import ABCPublic from "@/pages/postos/public/ABCPublic";
import ABCV2Public from "@/pages/postos/public/ABCV2Public";
import SocorroPublic from "@/pages/postos/public/SocorroPublic";
import SocorroV2Public from "@/pages/postos/public/SocorroV2Public";
import SorocabaPublic from "@/pages/postos/public/SorocabaPublic";
import SorocabaV2Public from "@/pages/postos/public/SorocabaV2Public";
import RegisterPostoUser from "@/pages/postos/RegisterPostoUser";
import RedirectToPosto from "@/pages/RedirectToPosto";
import PostoAcessoDireto from "@/pages/PostoAcessoDireto";
import LinksExternosPostos from "@/pages/postos/LinksExternosPostos";
import LinksExternosBases from "@/pages/bases/LinksExternosBases";
import BasePublic from "@/pages/bases/BasePublic";
import PartnerLogin from "@/pages/partner-login";
import PartnerDashboard from "@/pages/partner-dashboard";
import FuelCardRedirect from "@/components/FuelCardRedirect";
import MaintenanceSystem from "@/pages/maintenance";
import TestLogout from "@/pages/TestLogout";
import TestCampinasLogin from "@/pages/TestCampinasLogin";

function App() {
  // Ativar o hook de injeção automática de token JWT em todas as requisições fetch
  useFetchWithAuth();
  
  // Inicializar correção automática de timezone em URLs
  useEffect(() => {
    initializeTimezoneUrlFix();
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseAuthProvider>
        <AuthProvider>
          <Switch>
            <Route path="/login">
              <SignIn />
            </Route>
            <Route path="/login-supabase">
              <LoginWithSupabase />
            </Route>
            
            {/* Rotas específicas de login para cada base */}
            <Route path="/bases/campinas/login">
              <LoginCampinas />
            </Route>
            <Route path="/register">
              <RegisterNew />
            </Route>
            <Route path="/register-supabase">
              <RegisterWithSupabase />
            </Route>
            <Route path="/acesso-negado">
              <AccessDeniedPage />
            </Route>
            <Route path="/test-logout">
              <TestLogout />
            </Route>
            <Route path="/test-campinas-login">
              <TestCampinasLogin />
            </Route>
            
            {/* Componentes de redirecionamento para usuários específicos */}
            {/* Rota removida - antigas páginas LineHall */}
            <Route path="/old-dashboard">
              <Dashboard />
            </Route>
            
            <Route path="/fleet-redirect">
              <FleetManagementRedirect />
            </Route>
          
          {/* Novo Dashboard com KPIs */}
          <ProtectedRoute path="/" component={Dashboard} />
          <ProtectedRoute path="/executive-dashboard" component={ExecutiveDashboard} />
          
          {/* Rotas protegidas com verificação de permissão de base */}
          <ProtectedRoute path="/vehicles" component={VehiclesNew} />
          <ProtectedRoute path="/linehall-register" component={LineHallVehicleRegistration} />
          <ProtectedRoute path="/stopped-vehicles" component={StoppedVehicles} />
          {/* <ProtectedRoute path="/maintenance" component={MaintenanceNew} /> */}
          <ProtectedRoute path="/tires" component={TiresPage} />
          <ProtectedRoute path="/tires/entrada" component={TiresEntrada} />
          <ProtectedRoute path="/tires/solicitacoes" component={SolicitacoesPneus} />
          <ProtectedRoute path="/tires/:id" component={TireDetailPage} />
          <ProtectedRoute path="/refueling" component={RefuelingNew} />
          <ProtectedRoute path="/fines" component={FinesNew} />
          {/* Line Hall removido conforme solicitação */}
          <ProtectedRoute path="/fleet-management" component={FleetManagement} />
          <ProtectedRoute path="/fleet-management/inventory" component={InventoryPage} />
          <ProtectedRoute path="/fleet-management/parts-inventory" component={PartsInventoryPage} />
          <ProtectedRoute path="/fleet-management/workshops" component={WorkshopsPage} />
          <ProtectedRoute path="/fleet-management/maintenance" component={MaintenanceManagement} />
          <ProtectedRoute path="/fleet-management/maintenance-management" component={MaintenanceManagement} />
          <ProtectedRoute path="/fleet-management/budgets" component={BudgetManagementPage} />
          <ProtectedRoute path="/fleet-management/towing-partners" component={TowingPartnersPage} />
          <ProtectedRoute path="/fleet-management/towing-partners/new" component={NewTowingPartnerPage} />
          <ProtectedRoute path="/fleet-management/towing-partners/requests" component={TowingRequestsPage} />
          <ProtectedRoute path="/fleet-management/towing-partners/requests/new" component={NewTowingRequestPage} />
          <ProtectedRoute path="/fleet-management/towing-partners/servicos-pendentes" component={ServicosPendentesPage} />
          <ProtectedRoute path="/fleet-management/towing-partners/financeiro" component={FinanceiroGuincho} />
          <ProtectedRoute path="/fleet-management/towing-partners-payments" component={TowingPaymentsPage} />
          <Route path="/fleet-management/towing-partners/external-access/:token" component={TowingPartnerExternalAccess} />
          <ProtectedRoute path="/fleet-management/towing-partners/6" component={FordPartnerDetail} />
          <ProtectedRoute path="/fleet-management/towing-partners/:id" component={EditableTowingPartnerDetailPage} />
          <ProtectedRoute path="/accidents" component={Accidents} />
          <ProtectedRoute path="/fuel-receipts" component={FuelReceiptsPage} />
          <ProtectedRoute path="/work-safety" component={WorkSafety} />
          <ProtectedRoute path="/users" component={UsersNew} />
          <ProtectedRoute path="/bases" component={Bases} />
          <ProtectedRoute path="/bases/links-externos" component={LinksExternosBases} />
          <ProtectedRoute path="/bases/campinas" component={BaseCampinas} />
          <ProtectedRoute path="/bases/campinas/despesas" component={DespesasCampinas} />
          <ProtectedRoute path="/bases/campinas/multas" component={MultasCampinas} />
          <ProtectedRoute path="/bases/campinas/acidentes-trabalho" component={AcidentesTrabalho} />
          <ProtectedRoute path="/bases/campinas/sinistros" component={SinistrosCampinas} />
          <ProtectedRoute path="/bases/campinas/solicitacao-pneus" component={SolicitacaoPneusCampinas} />
          <ProtectedRoute path="/bases/campinas/solicitacao-orcamento" component={SolicitacaoOrcamentoCampinas} />
          <ProtectedRoute path="/bases/campinas/manutencao-frota" component={ManutencaoFrotaCampinas} />
          <ProtectedRoute path="/bases/campinas/cartao-combustivel" component={CartaoCombustivelCampinas} />
          
          {/* Rotas externas públicas - Base Campinas */}
          <Route path="/bases/campinas/external/cartao-combustivel" component={CartaoCombustivelCampinasExterno} />
          <Route path="/posto/campinas/externo" component={CartaoCombustivelCampinasExterno} />
          
          {/* Rotas externas públicas - Base Goiânia */}
          <Route path="/bases/goiania/external/cartao-combustivel" component={CartaoCombustivelGoianiaExterno} />
          <Route path="/posto/goiania/externo" component={CartaoCombustivelGoianiaExterno} />
          
          {/* Rotas externas públicas - Base Alair */}
          <Route path="/bases/alair/external/cartao-combustivel" component={CartaoCombustivelAlairExterno} />
          <Route path="/posto/alair/externo" component={CartaoCombustivelAlairExterno} />
          
          {/* Rotas públicas para bases - acesso externo */}
          <Route path="/base/:id/:slug/public" component={BasePublic} />
          <Route path="/base/:id/public" component={BasePublic} />
          
          {/* Rotas para a Base Goiânia */}
          <ProtectedRoute path="/bases/goiania" component={BaseGoiania} />
          <ProtectedRoute path="/bases/57" component={BaseGoiania} />
          <ProtectedRoute path="/bases/goiania/cartao-combustivel" component={CartaoCombustivelGoiania} />
          <ProtectedRoute path="/bases/57/cartao-combustivel" component={CartaoCombustivelGoiania} />
          <Route path="/bases/goiania/login" component={LoginGoiania} />
          <Route path="/bases/57/login" component={LoginGoiania} />
          
          {/* Rotas para a Base Alair */}
          <ProtectedRoute path="/bases/alair" component={BaseAlair} />
          <ProtectedRoute path="/bases/76" component={BaseAlair} />
          <ProtectedRoute path="/bases/alair/cartao-combustivel" component={CartaoCombustivelAlair} />
          <ProtectedRoute path="/bases/76/cartao-combustivel" component={CartaoCombustivelAlair} />
          <Route path="/bases/alair/login" component={LoginAlair} />
          <Route path="/bases/76/login" component={LoginAlair} />
          
          {/* Rotas para a Base Salvador */}
          <ProtectedRoute path="/bases/salvador" component={BaseSalvador} />
          <ProtectedRoute path="/bases/58" component={BaseSalvador} />
          <ProtectedRoute path="/bases/salvador/cartao-combustivel" component={CartaoCombustivelSalvador} />
          <ProtectedRoute path="/bases/58/cartao-combustivel" component={CartaoCombustivelSalvador} />
          <Route path="/bases/salvador/login" component={LoginSalvador} />
          <Route path="/bases/58/login" component={LoginSalvador} />
          
          {/* Rotas genéricas para todas as bases por ID */}
          <ProtectedRoute path="/bases/:id" component={() => <BaseRouteHandler mode="home" />} />
          <ProtectedRoute path="/bases/:id/cartao-combustivel" component={() => <BaseRouteHandler mode="fuel-card" />} />
          <Route path="/bases/:id/login" component={() => <BaseRouteHandler mode="login" />} />
          
          <ProtectedRoute path="/solicitacoes" component={BaseRequests} />
          
          {/* Rotas para os postos de abastecimento - protegidas */}
          <ProtectedRoute path="/postos" component={IndexPostos} />
          <ProtectedRoute path="/postos/links-externos" component={LinksExternosPostos} />
          <ProtectedRoute path="/posto/osasco" component={PostoOsasco} />
          <ProtectedRoute path="/posto/osasco_v2" component={PostoOsascoV2} />
          <ProtectedRoute path="/posto/guarulhos" component={PostoGuarulhos} />
          <ProtectedRoute path="/posto/guarulhos_v2" component={PostoGuarulhosV2} />
          <ProtectedRoute path="/posto/alair_v2" component={PostoAlairV2} />
          <ProtectedRoute path="/posto/saopaulo" component={PostoSaoPaulo} />
          <ProtectedRoute path="/posto/campinas" component={PostoCampinas} />
          <ProtectedRoute path="/posto/campinas_v2" component={PostoCampinasV2} />
          <ProtectedRoute path="/posto/abc" component={PostoABC} />
          <ProtectedRoute path="/posto/abc_v2" component={PostoABCV2} />
          <ProtectedRoute path="/posto/socorro" component={PostoSocorro} />
          <ProtectedRoute path="/posto/socorro_v2" component={PostoSocorroV2} />
          <ProtectedRoute path="/posto/sorocaba" component={PostoSorocaba} />
          <ProtectedRoute path="/posto/sorocaba_v2" component={PostoSorocabaV2} />
          <ProtectedRoute path="/postos/historico-geral" component={HistoricoGeralPage} />
          <ProtectedRoute path="/postos/historico-patio" component={HistoricoPatioPage} />
          <ProtectedRoute path="/postos/historico-consolidado" component={HistoricoConsolidado} />
          <ProtectedRoute path="/postos/consumo-diario" component={ConsumoDiarioPorDia} />
          <ProtectedRoute path="/postos/visao-geral" component={PostosVisaoGeralIntegrada} />
          <ProtectedRoute path="/postos/entradas-combustivel" component={EntradaCombustivelPage} />
          <ProtectedRoute path="/postos/:id" component={PostoDetalhesPage} />
          <ProtectedRoute path="/diagnostico/supabase" component={SupabaseDiagnostico} />
          <ProtectedRoute path="/diagnostico/supabase-console" component={SupabaseConsole} />
          <ProtectedRoute path="/diagnostico/comparacao-esquemas" component={ComparacaoEsquemas} />
          <ProtectedRoute path="/diagnostico/sincronizar-tabelas" component={SincronizarTabelasPage} />
          <ProtectedRoute path="/diagnostico/api-tester" component={ApiTester} />
          <ProtectedRoute path="/diagnostico/autenticacao" component={AutenticacaoDiagnostico} />
          <ProtectedRoute path="/diagnostico/budget-attachments-migration" component={BudgetAttachmentsMigration} />

          <ProtectedRoute path="/diagnostico/auto-save-demo" component={AutoSaveDemo} />
          <ProtectedRoute path="/admin/utils" component={AdminUtils} />
          <ProtectedRoute path="/limpar-dados" component={LimparDados} />
          <ProtectedRoute path="/line-hall-shopee" component={LineHallShopeePage} />
          {/* Página dedicada para solicitações de cartão combustível do Line Hall */}
          <ProtectedRoute path="/line-hall-fuel-requests" component={LineHallFuelCardRequests} />
          
          {/* Página para gerenciamento de terceiros no sistema principal */}
          <ProtectedRoute path="/terceiros/gerenciamento" component={GerenciamentoTerceiros} />
          <ProtectedRoute path="/fuel-card-old" component={FuelCardPage} />
          {/* Página principal de solicitações de cartão combustível */}
          <ProtectedRoute path="/fuel-card-requests" component={FuelCardRequestsPanel} />
          <ProtectedRoute path="/fuel-card-dashboard" component={FuelCard} />
          {/* Página otimizada para solicitação mobile */}
          <Route path="/fuel-card/solicitation" component={FuelCardSolicitation} />
          <ProtectedRoute path="/posto-remedios" component={PostoRemediosPage} />
          <ProtectedRoute path="/cartao-abastecimento" component={CartaoAbastecimentoPage} />
          <ProtectedRoute path="/abastecimento" component={PainelPostosPage} />
          <ProtectedRoute path="/abastecimentos" component={AbastecimentosPage} />
          <ProtectedRoute path="/drivers" component={DriversPage} />
          <ProtectedRoute path="/manutencao" component={ManutencaoPage} />
          <ProtectedRoute path="/tratativa-manutencao" component={TratativaManutencaoPage} />
          <ProtectedRoute path="/maintenance/oficinas-credentials" component={OficinasCredentialsPage} />
          <ProtectedRoute path="/maintenance/workshop-external-access" component={WorkshopExternalAccess} />
          <ProtectedRoute path="/tires" component={TiresPage} />
          
          {/* Rota pública para checklist do motorista */}
          <Route path="/checklist/:id">
            <DriverChecklist />
          </Route>
          
          {/* Rota para verificação de motorista por CPF */}
          <Route path="/driver-checklist">
            <DriverChecklist />
          </Route>
          
          {/* Rota pública para acesso do motorista Line Hall */}
          <Route path="/line-hall-driver">
            <MotoristaLineHall />
          </Route>
          
          {/* Rota para o perfil do usuário Supabase */}
          <Route path="/profile-supabase">
            <ProfileWithSupabase />
          </Route>
          
          {/* Rota para registro de usuários de postos */}
          <Route path="/register-supabase">
            <RegisterPostoUser />
          </Route>
          
          {/* Rota pública para acesso externo das oficinas */}
          <Route path="/workshop/:workshopId">
            <WorkshopExternal />
          </Route>
          
          {/* Dashboard externo da oficina com token */}
          <Route path="/oficina/external" component={OficinaExternalDashboard} />
          
          {/* Rota para acesso de motoristas do Line Hall */}
          <Route path="/line-hall-driver">
            <LineHallDriverPage />
          </Route>
          
          {/* Rotas para acesso do motorista Line Hall Shopee */}
          <Route path="/driver-access">
            <DriverAccess />
          </Route>
          
          <Route path="/driver-checklist/:id">
            <DriverChecklist />
          </Route>
          
          <Route path="/driver-maintenance-request/:id">
            <DriverMaintenanceRequest />
          </Route>
          
          {/* Rota para gerenciamento de manutenções do Line Hall */}
          <ProtectedRoute path="/line-hall-maintenance" component={LineHallMaintenanceManager} />
          <ProtectedRoute path="/line-hall-checklists" component={LineHallChecklistManager} />
          
          {/* Rota para redirecionamento rápido para postos - sem autenticação */}
          <Route path="/redirect-posto/:posto">
            <RedirectToPosto />
          </Route>
          
          {/* Rota de acesso direto a todos os postos */}
          <Route path="/acesso-posto">
            <PostoAcessoDireto />
          </Route>
          
          {/* Rotas para parceiros de guincho */}
          <Route path="/partner/login">
            <PartnerLogin />
          </Route>
          <Route path="/partner/dashboard">
            <PartnerDashboard />
          </Route>
          
          {/* Rota pública para cadastro de oficinas */}
          <Route path="/oficinas/cadastro">
            <OficinasExternaPage />
          </Route>
          
          {/* Rota de acesso para oficinas - login específico */}
          <Route path="/oficina">
            <SignIn oficina={true} />
          </Route>
          <Route path="/oficina-supabase">
            <LoginWithSupabase oficina={true} />
          </Route>
          
          {/* Rotas protegidas para oficinas */}
          <ProtectedRoute path="/oficina/dashboard" component={OficinaDashboard} />
          <ProtectedRoute path="/oficinas/dashboard" component={OficinaDashboard} /> {/* Rota alternativa para compatibilidade */}
          <ProtectedRoute path="/oficina/murici" component={OficinaMurici} />
          <ProtectedRoute path="/oficinas/murici" component={OficinaMurici} /> {/* Rota alternativa para compatibilidade */}
          <ProtectedRoute path="/oficina-alair-estoque" component={OficinaAlairEstoque} />
          
          {/* Rotas públicas para os postos de abastecimento - sem proteção e sem status de tanques */}
          <Route path="/posto/osasco/public">
            <OsascoPublic />
          </Route>
          <Route path="/posto/osasco_v2/public">
            <OsascoV2Public />
          </Route>
          <Route path="/posto-externo/osasco_v2">
            <OsascoV2Public />
          </Route>
          <Route path="/posto/guarulhos/public">
            <GuarulhosPublic />
          </Route>
          <Route path="/posto/guarulhos_v2/public">
            <GuarulhosV2Public />
          </Route>
          <Route path="/posto/alair_v2/public">
            <AlairV2Public />
          </Route>
          <Route path="/posto/saopaulo/public">
            <SaoPauloPublic />
          </Route>
          <Route path="/posto/campinas/public">
            <CampinasPublic />
          </Route>
          <Route path="/posto/campinas_v2/public">
            <CampinasV2Public />
          </Route>
          <Route path="/posto/abc/public">
            <ABCPublic />
          </Route>
          <Route path="/posto/abc_v2/public">
            <ABCV2Public />
          </Route>
          <Route path="/posto/socorro/public">
            <SocorroPublic />
          </Route>
          <Route path="/posto/socorro_v2/public">
            <SocorroV2Public />
          </Route>
          <Route path="/posto/sorocaba_v2/public">
            <SorocabaV2Public />
          </Route>
          
          {/* Rotas externas para postos V2 - Registro de recebimentos de combustível */}
          <Route path="/postos-externos">
            <PostosExternosIndex />
          </Route>
          <Route path="/posto-externo/abc-v2">
            <PostoABCV2External />
          </Route>
          <Route path="/posto-externo/campinas-v2">
            <PostoCampinasV2External />
          </Route>
          
          {/* Rotas públicas para o Posto Remédios */}
          <Route path="/posto-remedios-standalone">
            <PostoRemediosStandalone />
          </Route>
          
          {/* Acesso externo para o Posto Remédios */}
          <Route path="/posto-remedios-externo">
            <PostoRemediosStandalone />
          </Route>
          
          {/* Sistema de Manutenção Veicular - Acesso público para oficinas */}
          <Route path="/maintenance">
            <MaintenanceSystem />
          </Route>
          
          {/* Login da Oficina */}
          <Route path="/maintenance/login-oficina">
            <OficinaLogin />
          </Route>
          
          {/* Dashboard da Oficina */}
          <Route path="/maintenance/dashboard-oficina">
            <OficinaDashboard />
          </Route>
          
          {/* Acesso Externo da Oficina via Token - SEM CNPJ */}
          <Route path="/oficina/external">
            <OficinaExternalDashboard />
          </Route>
          
          {/* Sistema de Recebimento de Carros */}
          <Route path="/maintenance/car-reception">
            <CarReception />
          </Route>
          
          {/* URL que o usuário estava tentando acessar */}
          <Route path="/postos/remedios/externo">
            <PostoRemediosStandalone />
          </Route>
          
          {/* Formulário simplificado para Abastecimento do Posto Remédios */}
          <Route path="/abastecimento-posto-remedios">
            <AbastecimentoPostoRemediosPage />
          </Route>
          
          {/* Redirecionamento da rota antiga para a definitiva */}
          <Route path="/fuel-card">
            <FuelCardRedirect />
          </Route>
          
          {/* Rota pública para solicitação de cartão combustível - acessível sem login */}
          <Route path="/fuel-card/solicitation">
            <div className="mt-16 pl-4 pr-4 md:pl-16">
              <FuelCardSolicitation />
            </div>
          </Route>
          
          {/* Rota pública para confirmação de solicitação de cartão combustível */}
          <Route path="/fuel-card/confirmation">
            <div className="mt-16 pl-4 pr-4 md:pl-16">
              <FuelCardConfirmation />
            </div>
          </Route>
          
          <ProtectedRoute path="/fuel-card/station-profile" component={() => (
            <div className="mt-16 pl-4 pr-4 md:pl-64">
              <StationProfile />
            </div>
          )} />
          
          {/* Rotas do Sistema de Abastecimento Terceiros - acesso externo sem proteção */}
          <Route path="/terceiros/login">
            <AbastecimentoTerceirosLogin />
          </Route>
          <Route path="/terceiros/dashboard">
            <AbastecimentoTerceirosDashboard />
          </Route>

          {/* Sistema de Manutenção - Acesso exclusivo para oficinas */}
          <Route path="/maintenance*">
            <MaintenanceSystem />
          </Route>
          
          <Route>
            <NotFound />
          </Route>
        </Switch>
        <Toaster />
        </AuthProvider>
      </SupabaseAuthProvider>
    </QueryClientProvider>
  );
}

export default App;

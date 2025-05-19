import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
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
import NewTowingPartnerPage from "@/pages/fleet-management/towing-partners/new";
import TowingRequestsPage from "@/pages/fleet-management/towing-partners/requests";
import NewTowingRequestPage from "@/pages/fleet-management/towing-partners/requests/new";
import FordPartnerDetail from "@/pages/fleet-management/towing-partners/FordPartnerDetail";
import TowingPartnerExternalAccess from "@/pages/fleet-management/towing-partners/external-access/[token]";
import TowingPaymentsPage from "@/pages/fleet-management/towing-partners/payments";
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
import PostosVisaoGeralPage from "@/pages/postos/PostosVisaoGeralPage";
import PostoDetalhesPage from "@/pages/postos/PostoDetalhesPage";
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

// Importação das novas páginas
import FleetManagement from "@/pages/fleet-management";
import Accidents from "@/pages/accidents";
import WorkSafety from "@/pages/work-safety";
import WorkshopsPage from "@/pages/fleet-management/WorkshopsPage";
import MaintenancePage from "@/pages/fleet-management/MaintenancePage";
import BudgetManagementPage from "@/pages/fleet-management/BudgetManagementPage";
import InventoryPage from "@/pages/fleet-management/InventoryPage";
import PartsInventoryPage from "@/pages/fleet-management/parts-inventory";
import TiresEntrada from "@/pages/TiresEntrada";
import LineHallShopeePage from "@/pages/LineHallShopeePage";
import LineHallDriverPage from "@/pages/LineHallDriverPage";
import FuelCardPage from "@/pages/FuelCardPage";
import FuelCard from "@/pages/FuelCard";
import FuelCardRequestsPanel from "@/pages/FuelCardRequestsPanel";
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
import OficinaMurici from "@/pages/OficinaMurici";
import BaseRequests from "@/pages/BaseRequests";
import CartaoAbastecimentoPage from "@/pages/CartaoAbastecimentoPage";
import PainelPostosPage from "@/pages/PainelPostosPage";
import AbastecimentosPage from "@/pages/AbastecimentosPage";

// Importação das páginas da Base Campinas
import BaseCampinas from "@/pages/bases/BaseCampinas";
import DespesasCampinas from "@/pages/bases/DespesasCampinas";
import MultasCampinas from "@/pages/bases/MultasCampinas";
import AcidentesTrabalho from "@/pages/bases/AcidentesTrabalho";
import SinistrosCampinas from "@/pages/bases/SinistrosCampinas";
import SolicitacaoPneusCampinas from "@/pages/bases/SolicitacaoPneusCampinas";
import SolicitacaoOrcamentoCampinas from "@/pages/bases/SolicitacaoOrcamentoCampinas";
import ManutencaoFrotaCampinas from "@/pages/bases/ManutencaoFrotaCampinas";

// Importação das páginas da Base Goiânia
import BaseGoiania from "@/pages/bases/BaseGoiania";

// Importação das páginas públicas de postos
import OsascoPublic from "@/pages/postos/public/OsascoPublic";
import OsascoV2Public from "@/pages/postos/public/OsascoV2Public";
import GuarulhosPublic from "@/pages/postos/public/GuarulhosPublic";
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

function App() {
  // Ativar o hook de injeção automática de token JWT em todas as requisições fetch
  useFetchWithAuth();
  
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
            <Route path="/register">
              <RegisterNew />
            </Route>
            <Route path="/register-supabase">
              <RegisterWithSupabase />
            </Route>
            <Route path="/acesso-negado">
              <AccessDeniedPage />
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
          <ProtectedRoute path="/fleet-management/maintenance" component={MaintenancePage} />
          <ProtectedRoute path="/fleet-management/budgets" component={BudgetManagementPage} />
          <ProtectedRoute path="/fleet-management/towing-partners" component={TowingPartnersPage} />
          <ProtectedRoute path="/fleet-management/towing-partners/new" component={NewTowingPartnerPage} />
          <ProtectedRoute path="/fleet-management/towing-partners/requests" component={TowingRequestsPage} />
          <ProtectedRoute path="/fleet-management/towing-partners/requests/new" component={NewTowingRequestPage} />
          <ProtectedRoute path="/fleet-management/towing-partners/6" component={FordPartnerDetail} />
          <ProtectedRoute path="/fleet-management/towing-partners/:id" component={TowingPartnerDetailPage} />
          <Route path="/fleet-management/towing-partners/external-access/:token" component={TowingPartnerExternalAccess} />
          <ProtectedRoute path="/accidents" component={Accidents} />
          <ProtectedRoute path="/work-safety" component={WorkSafety} />
          <ProtectedRoute path="/users" component={UsersNew} />
          <ProtectedRoute path="/bases" component={Bases} />
          <ProtectedRoute path="/bases/campinas" component={BaseCampinas} />
          <ProtectedRoute path="/bases/campinas/despesas" component={DespesasCampinas} />
          <ProtectedRoute path="/bases/campinas/multas" component={MultasCampinas} />
          <ProtectedRoute path="/bases/campinas/acidentes-trabalho" component={AcidentesTrabalho} />
          <ProtectedRoute path="/bases/campinas/sinistros" component={SinistrosCampinas} />
          <ProtectedRoute path="/bases/campinas/solicitacao-pneus" component={SolicitacaoPneusCampinas} />
          <ProtectedRoute path="/bases/campinas/solicitacao-orcamento" component={SolicitacaoOrcamentoCampinas} />
          <ProtectedRoute path="/bases/campinas/manutencao-frota" component={ManutencaoFrotaCampinas} />
          
          {/* Rotas para a Base Goiânia */}
          <ProtectedRoute path="/bases/goiania" component={BaseGoiania} />
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
          <ProtectedRoute path="/postos/visao-geral" component={PostosVisaoGeralPage} />
          <ProtectedRoute path="/postos/:id" component={PostoDetalhesPage} />
          <ProtectedRoute path="/diagnostico/supabase" component={SupabaseDiagnostico} />
          <ProtectedRoute path="/diagnostico/supabase-console" component={SupabaseConsole} />
          <ProtectedRoute path="/diagnostico/comparacao-esquemas" component={ComparacaoEsquemas} />
          <ProtectedRoute path="/diagnostico/sincronizar-tabelas" component={SincronizarTabelasPage} />
          <ProtectedRoute path="/diagnostico/api-tester" component={ApiTester} />
          <ProtectedRoute path="/diagnostico/autenticacao" component={AutenticacaoDiagnostico} />
          <ProtectedRoute path="/diagnostico/budget-attachments-migration" component={BudgetAttachmentsMigration} />
          <ProtectedRoute path="/diagnostico/migracao-anexos" component={MigracaoAnexosPage} />
          <ProtectedRoute path="/diagnostico/upload-documento" component={UploadDocumentoPage} />
          <ProtectedRoute path="/diagnostico/auto-save-demo" component={AutoSaveDemo} />
          <ProtectedRoute path="/admin/utils" component={AdminUtils} />
          <ProtectedRoute path="/limpar-dados" component={LimparDados} />
          <ProtectedRoute path="/line-hall-shopee" component={LineHallShopeePage} />
          <ProtectedRoute path="/fuel-card-old" component={FuelCardPage} />
          <ProtectedRoute path="/fuel-card" component={FuelCard} />
          <ProtectedRoute path="/fuel-card-requests" component={FuelCardRequestsPanel} />
          <ProtectedRoute path="/posto-remedios" component={PostoRemediosPage} />
          <ProtectedRoute path="/cartao-abastecimento" component={CartaoAbastecimentoPage} />
          <ProtectedRoute path="/abastecimento" component={PainelPostosPage} />
          <ProtectedRoute path="/abastecimentos" component={AbastecimentosPage} />
          <ProtectedRoute path="/drivers" component={DriversPage} />
          <ProtectedRoute path="/manutencao" component={ManutencaoPage} />
          <ProtectedRoute path="/tratativa-manutencao" component={TratativaManutencaoPage} />
          <ProtectedRoute path="/tires" component={TiresPage} />
          
          {/* Rota pública para checklist do motorista */}
          <Route path="/checklist/:id">
            <DriverChecklist />
          </Route>
          
          {/* Rota para verificação de motorista por CPF */}
          <Route path="/driver-checklist">
            <DriverChecklist />
          </Route>
          
          {/* Rota para o perfil do usuário Supabase */}
          <Route path="/profile-supabase">
            <ProfileWithSupabase />
          </Route>
          
          {/* Rota para registro de usuários de postos */}
          <Route path="/register-supabase">
            <RegisterPostoUser />
          </Route>
          
          {/* Rota para acesso de motoristas do Line Hall */}
          <Route path="/line-hall-driver">
            <LineHallDriverPage />
          </Route>
          
          {/* Rota para redirecionamento rápido para postos - sem autenticação */}
          <Route path="/redirect-posto/:posto">
            <RedirectToPosto />
          </Route>
          
          {/* Rota de acesso direto a todos os postos */}
          <Route path="/acesso-posto">
            <PostoAcessoDireto />
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
          
          {/* Rotas públicas para os postos de abastecimento - sem proteção e sem status de tanques */}
          <Route path="/posto/osasco/public">
            <OsascoPublic />
          </Route>
          <Route path="/posto/osasco_v2/public">
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
          
          {/* Rotas públicas para o Posto Remédios */}
          <Route path="/posto-remedios-standalone">
            <PostoRemediosStandalone />
          </Route>
          
          {/* Formulário simplificado para Abastecimento do Posto Remédios */}
          <Route path="/abastecimento-posto-remedios">
            <AbastecimentoPostoRemediosPage />
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

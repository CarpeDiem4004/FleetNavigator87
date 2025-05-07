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
import { ProtectedRoute } from "@/components/permission/ProtectedRoute";
// LineHallRedirect removido conforme solicitação
import FleetManagementRedirect from "@/components/permission/FleetManagementRedirect";
import { AuthProvider } from "@/context/AuthContext";
import { SupabaseAuthProvider } from "@/context/SupabaseAuthContext";

// Importação das páginas de postos
import IndexPostos from "@/pages/postos/IndexPostos";
// Páginas de redirecionamento dos postos removidos - Maio/2025
import PostoOsasco from "@/pages/postos/Osasco";
import PostoOsascoV2 from "@/pages/postos/Osasco_v2V2";
import PostoGuarulhos from "@/pages/postos/Guarulhos";
import PostoAlairV2 from "@/pages/postos/Alair_v2V2";
import PostoGuarulhosV2 from "@/pages/postos/Guarulhos_v2V2";
import PostoSaoPaulo from "@/pages/postos/Saopaulo";
import PostoCampinas from "@/pages/postos/Campinas";
import PostoCampinasV2 from "@/pages/postos/Campinas_v2V2";
import PostoABC from "@/pages/postos/Abc";
import PostoABCV2 from "@/pages/postos/Abc_v2V2";
import PostoSocorro from "@/pages/postos/Socorro";
import PostoSocorroV2 from "@/pages/postos/Socorro_v2V2";
import PostoSorocaba from "@/pages/postos/Sorocaba";
import PostoSorocabaV2 from "@/pages/postos/Sorocaba_v2V2";
import HistoricoGeralPage from "@/pages/postos/HistoricoGeralPage";
import HistoricoPatioPage from "@/pages/postos/HistoricoPatioPage";
import PostosVisaoGeralPage from "@/pages/postos/PostosVisaoGeralPage";
import PostoDetalhesPage from "@/pages/postos/PostoDetalhesPage";
import SupabaseDiagnostico from "@/pages/diagnostico/SupabaseDiagnostico";
import SupabaseConsole from "@/pages/diagnostico/SupabaseConsole";
import ComparacaoEsquemas from "@/pages/diagnostico/ComparacaoEsquemas";
import SincronizarTabelasPage from "@/pages/diagnostico/sincronizar-tabelas";
import ApiTester from "@/pages/diagnostico/ApiTester";
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
// Importação do Posto Campinas
import PostoCampinasIndex from "@/pages/posto-campinas";
import PostoCampinasOperador from "@/pages/posto-campinas/PostoCampinasOperador";
import PostoCampinasAdmin from "@/pages/posto-campinas/PostoCampinasAdmin";

// Importação do Posto Murici
import PostoMuriciIndex from "@/pages/posto-murici";
import PostoMuriciOperador from "@/pages/posto-murici/PostoMuriciOperador";
import PostoMuriciPublico from "@/pages/posto-murici/PostoMuriciPublico";
import PostoMuriciLinksPage from "@/components/posto-murici-links";
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

// Importação das páginas públicas de postos - redirecionamento para Remédios (Maio/2025)
import OsascoPublic from "@/pages/postos/public/OsascoPublic";
import OsascoV2Public from "@/pages/postos/public/Osasco_v2V2Public";
import GuarulhosPublic from "@/pages/postos/public/GuarulhosPublic";
import GuarulhosV2Public from "@/pages/postos/public/Guarulhos_v2V2Public";
import AlairV2Public from "@/pages/postos/public/Alair_v2V2Public";
import SaoPauloPublic from "@/pages/postos/public/SaopauloPublic";
import CampinasPublic from "@/pages/postos/public/CampinasPublic";
import CampinasV2Public from "@/pages/postos/public/Campinas_v2V2Public";
import ABCPublic from "@/pages/postos/public/AbcPublic";
import ABCV2Public from "@/pages/postos/public/Abc_v2V2Public";
import SocorroPublic from "@/pages/postos/public/SocorroPublic";
import SocorroV2Public from "@/pages/postos/public/Socorro_v2V2Public";
import SorocabaPublic from "@/pages/postos/public/SorocabaPublic";
import SorocabaV2Public from "@/pages/postos/public/Sorocaba_v2V2Public";
import RegisterPostoUser from "@/pages/postos/RegisterPostoUser";
import RedirectToPosto from "@/pages/RedirectToPosto";
import PostoAcessoDireto from "@/pages/PostoAcessoDireto";

function App() {
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
          <ProtectedRoute path="/accidents" component={Accidents} />
          <ProtectedRoute path="/work-safety" component={WorkSafety} />
          <ProtectedRoute path="/users" component={UsersNew} />
          <ProtectedRoute path="/bases" component={Bases} />
          <ProtectedRoute path="/solicitacoes" component={BaseRequests} />
          
          {/* Rotas para os postos de abastecimento - protegidas */}
          <ProtectedRoute path="/postos" component={IndexPostos} />
          <ProtectedRoute path="/posto/osasco" component={PostoOsasco} />
          <ProtectedRoute path="/posto/osasco_v2" component={PostoOsascoV2} />
          <ProtectedRoute path="/posto/guarulhos" component={PostoGuarulhos} />
          <ProtectedRoute path="/posto/alair_v2" component={PostoAlairV2} />
          <ProtectedRoute path="/posto/guarulhos_v2" component={PostoGuarulhosV2} />
          <ProtectedRoute path="/posto/saopaulo" component={PostoSaoPaulo} />
          <ProtectedRoute path="/posto/campinas" component={PostoCampinas} />
          <ProtectedRoute path="/posto/campinas_v2" component={PostoCampinasV2} />
          <ProtectedRoute path="/posto/abc" component={PostoABC} />
          {/* ABC_V2 removido - Maio/2025 */}
          <ProtectedRoute path="/posto/socorro" component={PostoSocorro} />
          <ProtectedRoute path="/posto/socorro_v2" component={PostoSocorroV2} />
          <ProtectedRoute path="/posto/sorocaba" component={PostoSorocaba} />
          <ProtectedRoute path="/posto/sorocaba_v2" component={PostoSorocabaV2} />
          <ProtectedRoute path="/postos/historico-geral" component={HistoricoGeralPage} />
          <ProtectedRoute path="/postos/historico-patio" component={HistoricoPatioPage} />
          <ProtectedRoute path="/postos/visao-geral" component={PostosVisaoGeralPage} />
          <ProtectedRoute path="/postos/:id" component={PostoDetalhesPage} />
          <ProtectedRoute path="/diagnostico/supabase" component={SupabaseDiagnostico} />
          <ProtectedRoute path="/diagnostico/supabase-console" component={SupabaseConsole} />
          <ProtectedRoute path="/diagnostico/comparacao-esquemas" component={ComparacaoEsquemas} />
          <ProtectedRoute path="/diagnostico/sincronizar-tabelas" component={SincronizarTabelasPage} />
          <ProtectedRoute path="/diagnostico/api-tester" component={ApiTester} />
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
          
          {/* Rotas para o Posto Campinas */}
          <ProtectedRoute path="/posto-campinas" component={PostoCampinasIndex} />
          <ProtectedRoute path="/posto-campinas/operador" component={PostoCampinasOperador} />
          <ProtectedRoute path="/posto-campinas/admin" component={PostoCampinasAdmin} />
          
          {/* Rotas para o Posto Murici */}
          <ProtectedRoute path="/posto-murici" component={PostoMuriciIndex} />
          <ProtectedRoute path="/posto-murici/operador" component={PostoMuriciOperador} />
          <ProtectedRoute path="/posto-murici/links" component={PostoMuriciLinksPage} />
          
          {/* Rota pública para o Posto Murici */}
          <Route path="/posto-murici/public">
            <PostoMuriciPublico />
          </Route>
          
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
          {/* ABC_V2 removido - Maio/2025 */}
          <Route path="/posto/socorro/public">
            <SocorroPublic />
          </Route>
          <Route path="/posto/socorro_v2/public">
            <SocorroV2Public />
          </Route>
          <Route path="/posto/sorocaba/public">
            <SorocabaPublic />
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
          
          {/* Rota pública para o Posto Campinas */}
          <Route path="/posto-campinas/public">
            <PostoCampinasOperador />
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

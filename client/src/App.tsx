import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import DashboardNew from "@/pages/DashboardNew";
import Dashboard from "@/pages/index";
import VehiclesNew from "@/pages/VehiclesNew";
import MaintenanceNew from "@/pages/MaintenanceNew";
import TiresNew from "@/pages/TiresNew";
import RefuelingNew from "@/pages/RefuelingNew";
import FinesNew from "@/pages/FinesNew";
import LineHallNew from "@/pages/LineHallNew";
import UsersNew from "@/pages/UsersNew";
import Bases from "@/pages/Bases";
import SignIn from "@/pages/SignIn";
import RegisterNew from "@/pages/RegisterNew";
import AccessDeniedPage from "@/pages/access-denied";
import { ProtectedRoute } from "@/components/permission/ProtectedRoute";
import LineHallRedirect from "@/components/permission/LineHallRedirect";
import FleetManagementRedirect from "@/components/permission/FleetManagementRedirect";
import { AuthProvider } from "@/context/AuthContext";

// Importação das páginas de postos
import IndexPostos from "@/pages/postos/IndexPostos";
import PostoOsasco from "@/pages/postos/Osasco";
import PostoGuarulhos from "@/pages/postos/Guarulhos";
import PostoSaoPaulo from "@/pages/postos/SaoPaulo";
import PostoCampinas from "@/pages/postos/Campinas";
import PostoABC from "@/pages/postos/ABC";
import PostoSocorro from "@/pages/postos/Socorro";
import PostoSorocaba from "@/pages/postos/Sorocaba";
import HistoricoGeralPage from "@/pages/postos/HistoricoGeralPage";
import HistoricoPatioPage from "@/pages/postos/HistoricoPatioPage";
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
import EntradaPneusForm from "@/pages/EntradaPneus";

// Importação das páginas públicas de postos
import OsascoPublic from "@/pages/postos/public/OsascoPublic";
import GuarulhosPublic from "@/pages/postos/public/GuarulhosPublic";
import SaoPauloPublic from "@/pages/postos/public/SaoPauloPublic";
import CampinasPublic from "@/pages/postos/public/CampinasPublic";
import ABCPublic from "@/pages/postos/public/ABCPublic";
import SocorroPublic from "@/pages/postos/public/SocorroPublic";
import SorocabaPublic from "@/pages/postos/public/SorocabaPublic";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Switch>
          <Route path="/login">
            <SignIn />
          </Route>
          <Route path="/register">
            <RegisterNew />
          </Route>
          <Route path="/acesso-negado">
            <AccessDeniedPage />
          </Route>
          
          {/* Componentes de redirecionamento para usuários específicos */}
          <Route path="/old-dashboard">
            <LineHallRedirect />
          </Route>
          
          <Route path="/fleet-redirect">
            <FleetManagementRedirect />
          </Route>
          
          {/* Novo Dashboard com KPIs */}
          <ProtectedRoute path="/" component={Dashboard} />
          
          {/* Rotas protegidas com verificação de permissão de base */}
          <ProtectedRoute path="/vehicles" component={VehiclesNew} />
          <ProtectedRoute path="/maintenance" component={MaintenanceNew} />
          <ProtectedRoute path="/tires" component={TiresNew} />
          <ProtectedRoute path="/tires/entrada" component={EntradaPneusForm} />
          <ProtectedRoute path="/refueling" component={RefuelingNew} />
          <ProtectedRoute path="/fines" component={FinesNew} />
          <ProtectedRoute path="/line-hall" component={LineHallNew} />
          <ProtectedRoute path="/fleet-management" component={FleetManagement} />
          <ProtectedRoute path="/fleet-management/workshops" component={WorkshopsPage} />
          <ProtectedRoute path="/fleet-management/maintenance" component={MaintenancePage} />
          <ProtectedRoute path="/accidents" component={Accidents} />
          <ProtectedRoute path="/work-safety" component={WorkSafety} />
          <ProtectedRoute path="/users" component={UsersNew} />
          <ProtectedRoute path="/bases" component={Bases} />
          
          {/* Rotas para os postos de abastecimento - protegidas */}
          <ProtectedRoute path="/postos" component={IndexPostos} />
          <ProtectedRoute path="/posto/osasco" component={PostoOsasco} />
          <ProtectedRoute path="/posto/guarulhos" component={PostoGuarulhos} />
          <ProtectedRoute path="/posto/saopaulo" component={PostoSaoPaulo} />
          <ProtectedRoute path="/posto/campinas" component={PostoCampinas} />
          <ProtectedRoute path="/posto/abc" component={PostoABC} />
          <ProtectedRoute path="/posto/socorro" component={PostoSocorro} />
          <ProtectedRoute path="/posto/sorocaba" component={PostoSorocaba} />
          <ProtectedRoute path="/postos/historico-geral" component={HistoricoGeralPage} />
          <ProtectedRoute path="/postos/historico-patio" component={HistoricoPatioPage} />
          <ProtectedRoute path="/diagnostico/supabase" component={SupabaseDiagnostico} />
          <ProtectedRoute path="/diagnostico/supabase-console" component={SupabaseConsole} />
          <ProtectedRoute path="/diagnostico/comparacao-esquemas" component={ComparacaoEsquemas} />
          <ProtectedRoute path="/diagnostico/sincronizar-tabelas" component={SincronizarTabelasPage} />
          <ProtectedRoute path="/diagnostico/api-tester" component={ApiTester} />
          <ProtectedRoute path="/admin/utils" component={AdminUtils} />
          <ProtectedRoute path="/limpar-dados" component={LimparDados} />
          
          {/* Rotas públicas para os postos de abastecimento - sem proteção e sem status de tanques */}
          <Route path="/posto/osasco/public">
            <OsascoPublic />
          </Route>
          <Route path="/posto/guarulhos/public">
            <GuarulhosPublic />
          </Route>
          <Route path="/posto/saopaulo/public">
            <SaoPauloPublic />
          </Route>
          <Route path="/posto/campinas/public">
            <CampinasPublic />
          </Route>
          <Route path="/posto/abc/public">
            <ABCPublic />
          </Route>
          <Route path="/posto/socorro/public">
            <SocorroPublic />
          </Route>
          <Route path="/posto/sorocaba/public">
            <SorocabaPublic />
          </Route>
          
          <Route>
            <NotFound />
          </Route>
        </Switch>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

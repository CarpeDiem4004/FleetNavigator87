import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import DashboardNew from "@/pages/DashboardNew";
import VehiclesNew from "@/pages/VehiclesNew";
import MaintenanceNew from "@/pages/MaintenanceNew";
import TiresNew from "@/pages/TiresNew";
import RefuelingNew from "@/pages/RefuelingNew";
import FinesNew from "@/pages/FinesNew";
import LineHallNew from "@/pages/LineHallNew";
import UsersNew from "@/pages/UsersNew";
import FleetManagementNew from "@/pages/FleetManagementNew";
import SignIn from "@/pages/SignIn";
import RegisterNew from "@/pages/RegisterNew";
import AccessDeniedPage from "@/pages/access-denied";
import { ProtectedRoute } from "@/components/permission/ProtectedRoute";
import LineHallRedirect from "@/components/permission/LineHallRedirect";
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
import PostoLoginPage from "@/pages/postos/PostoLoginPage";
import PostoDashboard from "@/pages/postos/PostoDashboard";

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
          
          {/* Componente que redirecionará usuários Line Hall para a página correta */}
          <Route path="/">
            <LineHallRedirect />
          </Route>
          
          {/* Rotas protegidas com verificação de permissão de base */}
          <ProtectedRoute path="/vehicles" component={VehiclesNew} />
          <ProtectedRoute path="/maintenance" component={MaintenanceNew} />
          <ProtectedRoute path="/tires" component={TiresNew} />
          <ProtectedRoute path="/refueling" component={RefuelingNew} />
          <ProtectedRoute path="/fines" component={FinesNew} />
          <ProtectedRoute path="/line-hall" component={LineHallNew} />
          <ProtectedRoute path="/fleet-management" component={FleetManagementNew} />
          <ProtectedRoute path="/users" component={UsersNew} />
          
          {/* Rotas para os postos de abastecimento - protegidas */}
          <ProtectedRoute path="/postos" component={IndexPostos} />
          <ProtectedRoute path="/posto/osasco" component={PostoOsasco} />
          <ProtectedRoute path="/posto/guarulhos" component={PostoGuarulhos} />
          <ProtectedRoute path="/posto/saopaulo" component={PostoSaoPaulo} />
          <ProtectedRoute path="/posto/campinas" component={PostoCampinas} />
          <ProtectedRoute path="/posto/abc" component={PostoABC} />
          <ProtectedRoute path="/posto/socorro" component={PostoSocorro} />
          <ProtectedRoute path="/posto/sorocaba" component={PostoSorocaba} />
          
          {/* Rotas para login e dashboard dos postos - DEVE VIR ANTES DAS ROTAS PROTEGIDAS */}
          <Route path="/posto/:postoCode">
            <PostoLoginPage />
          </Route>
          <ProtectedRoute path="/posto/:postoCode/dashboard" component={PostoDashboard} />
          
          {/* Rotas públicas para os postos com redirecionamento via componente */}
          <Route path="/public/posto/osasco">
            {() => {
              window.location.href = "/posto/osasco";
              return null;
            }}
          </Route>
          <Route path="/public/posto/guarulhos">
            {() => {
              window.location.href = "/posto/guarulhos";
              return null;
            }}
          </Route>
          <Route path="/public/posto/saopaulo">
            {() => {
              window.location.href = "/posto/saopaulo";
              return null;
            }}
          </Route>
          <Route path="/public/posto/campinas">
            {() => {
              window.location.href = "/posto/campinas";
              return null;
            }}
          </Route>
          <Route path="/public/posto/abc">
            {() => {
              window.location.href = "/posto/abc";
              return null;
            }}
          </Route>
          <Route path="/public/posto/socorro">
            {() => {
              window.location.href = "/posto/socorro";
              return null;
            }}
          </Route>
          <Route path="/public/posto/sorocaba">
            {() => {
              window.location.href = "/posto/sorocaba";
              return null;
            }}
          </Route>
          
          {/* Rotas para interfaces simplificadas dos postos (quando já autenticados) */}
          <ProtectedRoute path="/posto/:postoCode/public" component={PostoDashboard} />
          
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

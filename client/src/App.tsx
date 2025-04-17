import { Switch, Route } from "wouter";
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

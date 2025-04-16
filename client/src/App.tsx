import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Vehicles from "@/pages/Vehicles";
import Maintenance from "@/pages/Maintenance";
import Tires from "@/pages/Tires";
import Refueling from "@/pages/Refueling";
import Fines from "@/pages/Fines";
import LineHall from "@/pages/LineHall";
import Bases from "@/pages/Bases";
import Users from "@/pages/Users";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import MainLayout from "@/components/layout/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

// Protected route component that redirects to login if user is not authenticated
function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType<any>, path: string }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null; // Will be handled by the Router component
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Component {...rest} />;
}

function Router() {
  const { user, isLoading } = useAuth();
  
  console.log("Router - estado de autenticação:", { isLoading, user });

  // Mostra tela de carregamento enquanto verifica autenticação
  if (isLoading) {
    console.log("Mostrando tela de carregamento...");
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-semibold">Carregando...</h2>
        <p className="text-gray-500 mt-2">Verificando sua autenticação</p>
      </div>
    );
  }

  // Usuário autenticado
  if (user) {
    const path = window.location.pathname;
    // Redireciona para o dashboard se tentar acessar login/registro
    if (path === "/login" || path === "/register") {
      return <Redirect to="/" />;
    }
    
    // Rotas protegidas com layout para usuários autenticados
    return (
      <MainLayout>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/vehicles" component={Vehicles} />
          <Route path="/maintenance" component={Maintenance} />
          <Route path="/tires" component={Tires} />
          <Route path="/refueling" component={Refueling} />
          <Route path="/fines" component={Fines} />
          <Route path="/line-hall" component={LineHall} />
          <Route path="/bases" component={Bases} />
          <Route path="/users" component={Users} />
          <Route component={NotFound} />
        </Switch>
      </MainLayout>
    );
  }
  
  // Usuário não autenticado - mostra apenas login e registro
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="*">
        <Redirect to="/login" />
      </Route>
    </Switch>
  );
}

function App() {
  console.log("App rendering");
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;

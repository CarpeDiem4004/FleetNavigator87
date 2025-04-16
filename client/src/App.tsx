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
  // Versão simplificada do router para resolver problemas de login
  return (
    <Switch>
      <Route path="/login">
        <Login />
      </Route>
      <Route path="/register">
        <Register />
      </Route>
      <Route path="*">
        <AuthCheck />
      </Route>
    </Switch>
  );
}

// Componente separado para lidar com verificação de autenticação
function AuthCheck() {
  const { user, isLoading } = useAuth();
  
  console.log("AuthCheck - estado:", { isLoading, user });

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

  // Se não estiver autenticado, redireciona para login
  if (!user) {
    console.log("Usuário não autenticado, redirecionando para login");
    return <Redirect to="/login" />;
  }
  
  // Se estiver autenticado, mostra as rotas protegidas
  console.log("Usuário autenticado, mostrando rotas protegidas");
  return (
    <MainLayout>
      <Switch>
        <Route path="/">
          <Dashboard />
        </Route>
        <Route path="/vehicles">
          <Vehicles />
        </Route>
        <Route path="/maintenance">
          <Maintenance />
        </Route>
        <Route path="/tires">
          <Tires />
        </Route>
        <Route path="/refueling">
          <Refueling />
        </Route>
        <Route path="/fines">
          <Fines />
        </Route>
        <Route path="/line-hall">
          <LineHall />
        </Route>
        <Route path="/bases">
          <Bases />
        </Route>
        <Route path="/users">
          <Users />
        </Route>
        <Route>
          <NotFound />
        </Route>
      </Switch>
    </MainLayout>
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

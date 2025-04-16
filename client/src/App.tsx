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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">Carregando...</span>
      </div>
    );
  }

  // If user is logged in and tries to access login or register page, redirect to dashboard
  if (user && (window.location.pathname === "/login" || window.location.pathname === "/register")) {
    return <Redirect to="/" />;
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Protected routes */}
      {!user ? (
        <Route path="*">
          <Redirect to="/login" />
        </Route>
      ) : (
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
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;

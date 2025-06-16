import { Switch, Route, useLocation } from "wouter";
import { MaintenanceAuthProvider } from "@/hooks/use-maintenance-auth";
import MaintenanceLogin from "./login";
import DashboardOficina from "./dashboard-oficina";

function MaintenanceRouter() {
  const [location] = useLocation();
  
  return (
    <Switch>
      <Route path="/maintenance/dashboard-oficina">
        <DashboardOficina />
      </Route>
      <Route path="/maintenance/login">
        <MaintenanceLogin />
      </Route>
      <Route path="/maintenance">
        <MaintenanceLogin />
      </Route>
      <Route>
        <MaintenanceLogin />
      </Route>
    </Switch>
  );
}

export default function MaintenanceSystem() {
  return (
    <MaintenanceAuthProvider>
      <MaintenanceRouter />
    </MaintenanceAuthProvider>
  );
}
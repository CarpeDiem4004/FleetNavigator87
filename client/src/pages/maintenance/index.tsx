import { Switch, Route } from "wouter";
import { MaintenanceAuthProvider } from "@/hooks/use-maintenance-auth";
import MaintenanceLogin from "./login";
import DashboardOficina from "./dashboard-oficina";

function MaintenanceRouter() {
  return (
    <Switch>
      <Route path="/maintenance/dashboard-oficina" component={DashboardOficina} />
      <Route path="/maintenance" component={MaintenanceLogin} />
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
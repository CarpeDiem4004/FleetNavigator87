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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        <Route path="/login">
          <SignIn />
        </Route>
        <Route path="/register">
          <RegisterNew />
        </Route>
        <Route path="/">
          <DashboardNew />
        </Route>
        <Route path="/vehicles">
          <VehiclesNew />
        </Route>
        <Route path="/maintenance">
          <MaintenanceNew />
        </Route>
        <Route path="/tires">
          <TiresNew />
        </Route>
        <Route path="/refueling">
          <RefuelingNew />
        </Route>
        <Route path="/fines">
          <FinesNew />
        </Route>
        <Route path="/line-hall">
          <LineHallNew />
        </Route>
        <Route path="/fleet-management">
          <FleetManagementNew />
        </Route>
        <Route path="/users">
          <UsersNew />
        </Route>
        <Route>
          <NotFound />
        </Route>
      </Switch>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;

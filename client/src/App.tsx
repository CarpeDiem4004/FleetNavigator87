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
        <Route>
          <NotFound />
        </Route>
      </Switch>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;

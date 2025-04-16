import { Switch, Route } from "wouter";
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
import MainLayout from "@/components/layout/MainLayout";
import { useAuth } from "@/context/AuthContext";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return (
      <Switch>
        <Route path="*">
          <div className="flex items-center justify-center h-screen">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
              <h1 className="text-2xl font-bold text-center">Fleet Management System</h1>
              <form className="mt-8 space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                  <input id="email" name="email" type="email" required className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                  <input id="password" name="password" type="password" required className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
                </div>
                <div>
                  <button type="submit" className="w-full px-4 py-2 text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                    Sign in
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Route>
      </Switch>
    );
  }

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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;

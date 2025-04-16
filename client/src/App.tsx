import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import DashboardNew from "@/pages/DashboardNew";
import SignIn from "@/pages/SignIn";
import Register from "@/pages/Register";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        <Route path="/login">
          <SignIn />
        </Route>
        <Route path="/register">
          <Register />
        </Route>
        <Route path="/">
          <DashboardNew />
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

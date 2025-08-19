// Disable Fast Refresh temporarily to fix $RefreshSig$ error
if (typeof window !== 'undefined' && window.$RefreshSig$) {
  // @ts-ignore
  window.$RefreshSig$ = () => () => {};
}

import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route, Redirect } from "wouter";

import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/AuthContext";

import NotFound from "@/pages/not-found";
import LoginWithSupabase from "@/pages/LoginWithSupabase";
import RegisterWithSupabase from "@/pages/RegisterWithSupabase";
import Dashboard from "@/pages/index";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-background">
          <Switch>
            {/* Páginas Públicas */}
            <Route path="/login">
              <LoginWithSupabase />
            </Route>
            <Route path="/register">
              <RegisterWithSupabase />
            </Route>
            <Route path="/not-found" component={NotFound} />
            
            {/* Dashboard Principal */}
            <Route path="/dashboard" component={Dashboard} />
            
            {/* Redirecionar a rota raiz para login se não autenticado */}
            <Route path="/">
              <Redirect to="/login" />
            </Route>
            
            {/* Catch-all para 404 */}
            <Route component={NotFound} />
          </Switch>
          <Toaster />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}


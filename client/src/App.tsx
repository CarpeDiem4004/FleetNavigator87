import React, { useEffect } from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/AuthContext";

import NotFound from "@/pages/not-found";
import LoginWithSupabase from "@/pages/LoginWithSupabase";
import RegisterWithSupabase from "@/pages/RegisterWithSupabase";
import Dashboard from "@/pages/index";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-background">
          <Switch>
            {/* Páginas Públicas */}
            <Route path="/login" component={LoginWithSupabase} />
            <Route path="/register" component={RegisterWithSupabase} />
            <Route path="/not-found" component={NotFound} />
            
            {/* Dashboard Principal */}
            <Route path="/dashboard" component={Dashboard} />
            
            {/* Redirecionar a rota raiz para dashboard */}
            <Route path="/">
              <Redirect to="/dashboard" />
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

export default App;
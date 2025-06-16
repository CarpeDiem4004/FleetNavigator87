import { MaintenanceAuthProvider, useMaintenanceAuth } from "@/hooks/use-maintenance-auth";
import MaintenanceLogin from "./login";
import DashboardOficina from "./dashboard-oficina";
import DashboardInterno from "./dashboard-interno";
import { Loader2 } from "lucide-react";

function MaintenanceRouter() {
  const { user, isLoading } = useMaintenanceAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <MaintenanceLogin />;
  }

  // Renderizar dashboard baseado no tipo de usuário
  if (user.role === 'oficina') {
    return <DashboardOficina />;
  }

  // Para admin e gestor_frota
  return <DashboardInterno />;
}

export default function MaintenanceSystem() {
  return (
    <MaintenanceAuthProvider>
      <MaintenanceRouter />
    </MaintenanceAuthProvider>
  );
}
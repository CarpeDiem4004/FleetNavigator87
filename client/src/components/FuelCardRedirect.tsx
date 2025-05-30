import { useEffect } from "react";
import { useLocation } from "wouter";

export default function FuelCardRedirect() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    setLocation("/fuel-card-requests");
  }, [setLocation]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p>Redirecionando para Solicitações de Cartão Combustível...</p>
      </div>
    </div>
  );
}
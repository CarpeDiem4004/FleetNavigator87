import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";

export default function FuelCardRedirect() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
      // Redirect Line Hall users to their dedicated page
      if (user.role === 'line_hall') {
        setLocation("/line-hall-fuel-requests");
      } else {
        // All other users go to the general fuel card requests page
        setLocation("/fuel-card-requests");
      }
    }
  }, [setLocation, user]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p>Redirecionando para Solicitações de Cartão Combustível...</p>
      </div>
    </div>
  );
}
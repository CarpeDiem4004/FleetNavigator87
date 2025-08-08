import { useEffect } from "react";
import { useLocation } from "wouter";

interface DirectFuelCardAccessProps {
  baseId?: string | number;
}

export default function DirectFuelCardAccess({ baseId }: DirectFuelCardAccessProps) {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // REGRA DE OURO: Sempre vai para a tela de login da base específica
    if (baseId) {
      // Redireciona para o login da base com parâmetro para ir direto ao cartão após login
      setLocation(`/bases/${baseId}/login?redirect=cartao-combustivel`);
    } else {
      // Caso padrão: página geral de solicitações
      setLocation("/fuel-card-requests");
    }
  }, [setLocation, baseId]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecionando para Login da Base...</p>
      </div>
    </div>
  );
}
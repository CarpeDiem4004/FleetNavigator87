import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, LogOut, Clock } from 'lucide-react';

interface GreetingHeaderProps {
  baseName: string;
  baseLocation: string;
  onLogout?: () => void;
}

export function GreetingHeader({ baseName, baseLocation, onLogout }: GreetingHeaderProps) {
  const { user } = useAuth();
  
  // Função para determinar a saudação baseada no horário
  const getGreeting = () => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      return 'Bom dia';
    } else if (hour >= 12 && hour < 18) {
      return 'Boa tarde';
    } else {
      return 'Boa noite';
    }
  };

  // Função para extrair o primeiro nome
  const getFirstName = (fullName: string) => {
    if (!fullName) return 'Usuário';
    return fullName.split(' ')[0];
  };

  const greeting = getGreeting();
  const firstName = getFirstName(user?.name || '');
  const currentTime = new Date().toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className="flex justify-between items-center mb-8">
      <div className="text-center flex-1">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {baseName}
        </h1>
        <p className="text-lg text-gray-600 mb-2">
          Gerenciamento completo da {baseName}
        </p>
        <div className="flex flex-col items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {baseLocation}
          </Badge>
          
          {/* Saudação personalizada */}
          <div className="flex items-center gap-4 mt-2">
            <Badge variant="default" className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700">
              <Clock className="w-4 h-4" />
              {currentTime}
            </Badge>
            <div className="text-lg font-semibold text-blue-700">
              {greeting}, {firstName}! 👋
            </div>
          </div>

          {/* Informações do usuário logado */}
          {user && (
            <div className="text-sm text-gray-500 mt-1">
              Logado como: <span className="font-medium">{user.email}</span>
              {user.role && (
                <span className="ml-2 px-2 py-1 bg-gray-100 rounded-full text-xs font-medium">
                  {user.role === 'operador' ? 'Operador' : 
                   user.role === 'posto' ? 'Posto' : 
                   user.role === 'admin' ? 'Administrador' : user.role}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      
      {onLogout && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onLogout}
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>
      )}
    </div>
  );
}

export default GreetingHeader;
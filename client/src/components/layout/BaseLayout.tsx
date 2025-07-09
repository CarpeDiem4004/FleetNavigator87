/**
 * Layout genérico para bases
 * Pode ser usado por qualquer base com customização de nome e cor
 */

import React, { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  LogOut, 
  Home, 
  Fuel, 
  Wrench, 
  Shield, 
  MapPin,
  Clock,
  User
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface BaseLayoutProps {
  children: ReactNode;
  baseId: number;
  baseName?: string;
  primaryColor?: string;
  showHeader?: boolean;
  showNavigation?: boolean;
}

interface Base {
  id: number;
  name: string;
  location: string;
  operation: string;
  type: string;
  active: boolean;
  hasMaintenance?: boolean;
  hasTires?: boolean;
}

export default function BaseLayout({ 
  children, 
  baseId, 
  baseName, 
  primaryColor = '#2563eb',
  showHeader = true,
  showNavigation = true 
}: BaseLayoutProps) {
  const [, setLocation] = useLocation();
  
  // Buscar dados da base se não foi fornecido o nome
  const { data: base } = useQuery<Base>({
    queryKey: ['/api/bases', baseId],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/bases/${baseId}`);
      const data = await res.json();
      return data.data;
    },
    enabled: !baseName,
  });

  const finalBaseName = baseName || base?.name || 'Base';
  const baseLocation = base?.location || '';
  const baseOperation = base?.operation || '';

  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');
      localStorage.removeItem('token');
      setLocation(`/bases/${baseId}/login`);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      setLocation(`/bases/${baseId}/login`);
    }
  };

  const getCurrentTime = () => {
    return new Date().toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      {showHeader && (
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8" style={{ color: primaryColor }} />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {finalBaseName}
                  </h1>
                  {baseLocation && (
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <MapPin className="h-3 w-3" />
                      <span>{baseLocation}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {baseOperation && (
                  <Badge variant="outline" className="text-xs">
                    {baseOperation}
                  </Badge>
                )}
                
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>{getCurrentTime()}</span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </Button>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Navigation */}
      {showNavigation && (
        <nav className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              <Button
                variant="ghost"
                onClick={() => setLocation(`/bases/${baseId}`)}
                className="gap-2 py-4 px-0"
              >
                <Home className="h-4 w-4" />
                Início
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => setLocation(`/bases/${baseId}/cartao-combustivel`)}
                className="gap-2 py-4 px-0"
              >
                <Fuel className="h-4 w-4" />
                Cartão Combustível
              </Button>
              
              {base?.hasMaintenance && (
                <Button
                  variant="ghost"
                  onClick={() => setLocation(`/bases/${baseId}/manutencao`)}
                  className="gap-2 py-4 px-0"
                >
                  <Wrench className="h-4 w-4" />
                  Manutenção
                </Button>
              )}
              
              {base?.hasTires && (
                <Button
                  variant="ghost"
                  onClick={() => setLocation(`/bases/${baseId}/pneus`)}
                  className="gap-2 py-4 px-0"
                >
                  <Shield className="h-4 w-4" />
                  Pneus
                </Button>
              )}
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            <p>© 2025 Muricion Fleet Management - {finalBaseName}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
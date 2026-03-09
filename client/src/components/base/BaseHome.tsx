/**
 * Componente genérico de página inicial para bases
 * Mostra informações e links rápidos para serviços disponíveis
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Fuel, 
  Wrench, 
  Shield, 
  MapPin, 
  Clock, 
  ArrowRight,
  Users,
  Activity,
  TrendingUp
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface BaseHomeProps {
  baseId: number;
  baseName?: string;
  primaryColor?: string;
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

export default function BaseHome({ baseId, baseName, primaryColor = '#2563eb' }: BaseHomeProps) {
  const [, setLocation] = useLocation();

  // Buscar dados da base
  const { data: base, isLoading } = useQuery<Base>({
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
  const baseType = base?.type || '';

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando informações da base...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header de Boas-vindas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8" style={{ color: primaryColor }} />
              <div>
                <CardTitle className="text-2xl">
                  Bem-vindo à {finalBaseName}
                </CardTitle>
                <div className="flex items-center gap-4 mt-2">
                  {baseLocation && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{baseLocation}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{getCurrentTime()}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {baseOperation && (
                <Badge variant="outline">{baseOperation}</Badge>
              )}
              {baseType && (
                <Badge variant="secondary" className="text-xs">{baseType}</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Acesse os serviços disponíveis para sua base através dos botões abaixo. 
            Todos os serviços estão integrados com o sistema central de gestão.
          </p>
        </CardContent>
      </Card>

      {/* Serviços Disponíveis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Serviços Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Cartão Combustível - Sempre disponível */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Fuel className="h-5 w-5 text-green-600" />
                    <div>
                      <CardTitle className="text-lg">Cartão Combustível</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Solicite recarga de cartão
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs bg-green-50">
                    Disponível
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button
                  onClick={() => setLocation(`/bases/${baseId}/cartao-combustivel`)}
                  className="w-full gap-2"
                  style={{ backgroundColor: primaryColor }}
                >
                  Acessar Serviço
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Manutenção - Condicional */}
            {base?.hasMaintenance && (
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-5 w-5 text-blue-600" />
                      <div>
                        <CardTitle className="text-lg">Manutenção</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Solicitações de manutenção
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs bg-blue-50">
                      Disponível
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    onClick={() => setLocation(`/bases/${baseId}/manutencao`)}
                    className="w-full gap-2"
                    variant="outline"
                  >
                    Acessar Serviço
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Pneus - Condicional */}
            {base?.hasTires && (
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-purple-600" />
                      <div>
                        <CardTitle className="text-lg">Pneus</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Solicitações de pneus
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs bg-purple-50">
                      Disponível
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    onClick={() => setLocation(`/bases/${baseId}/pneus`)}
                    className="w-full gap-2"
                    variant="outline"
                  >
                    Acessar Serviço
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Informações da Base */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Informações da Base
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Building2 className="h-8 w-8 mx-auto mb-2 text-gray-600" />
              <div className="text-sm font-medium">Tipo de Base</div>
              <div className="text-lg font-bold">{baseType || 'Não especificado'}</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-600" />
              <div className="text-sm font-medium">Localização</div>
              <div className="text-lg font-bold">{baseLocation || 'Não especificado'}</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Users className="h-8 w-8 mx-auto mb-2 text-gray-600" />
              <div className="text-sm font-medium">Operação</div>
              <div className="text-lg font-bold">{baseOperation || 'Não especificado'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ajuda e Suporte */}
      <Card>
        <CardHeader>
          <CardTitle>Precisa de Ajuda?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Se você tiver dúvidas sobre como usar os serviços ou encontrar algum problema, 
            entre em contato com o suporte técnico.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              📞 Suporte: (11) 99999-9999
            </Badge>
            <Badge variant="outline" className="text-xs">
              📧 Email: suporte@muricion.com
            </Badge>
            <Badge variant="outline" className="text-xs">
              ⏰ Horário: 08:00 - 18:00
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
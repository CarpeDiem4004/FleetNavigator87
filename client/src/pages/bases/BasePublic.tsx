/**
 * Componente genérico para página pública de bases
 * Este componente pode ser usado para todas as bases, recebendo o ID da base como parâmetro
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  MapPin, 
  ExternalLink, 
  Fuel, 
  Wrench, 
  Shield, 
  Clock,
  Phone,
  Mail,
  Info
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface Base {
  id: number;
  name: string;
  location: string;
  operation: string;
  type: string;
  active: boolean;
  hasMaintenance?: boolean;
  hasTires?: boolean;
  hasFuelCard?: boolean;
}

interface BasePublicProps {
  baseId?: number;
}

const BasePublic: React.FC<BasePublicProps> = ({ baseId }) => {
  const params = useParams();
  const finalBaseId = baseId || (params.id ? parseInt(params.id, 10) : null);
  
  const [currentTime, setCurrentTime] = useState(new Date());

  // Atualizar o horário a cada segundo
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Buscar dados da base
  const { data: base, isLoading, error } = useQuery<Base>({
    queryKey: ['/api/bases', finalBaseId],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/bases/${finalBaseId}`);
      const data = await res.json();
      return data.data;
    },
    enabled: !!finalBaseId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Carregando...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground">
              Buscando informações da base...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !base) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">
              <Shield className="h-6 w-6 mx-auto mb-2" />
              Base não encontrada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground">
              A base solicitada não existe ou não está disponível para acesso público.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!base.active) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-amber-600">
              <Info className="h-6 w-6 mx-auto mb-2" />
              Base inativa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground">
              Esta base está temporariamente inativa e não disponível para acesso público.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'America/Sao_Paulo'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Building2 className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {base.name}
          </h1>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <MapPin className="h-5 w-5" />
            <span className="text-lg">{base.location}</span>
          </div>
          {base.operation && (
            <Badge variant="outline" className="mt-2">
              {base.operation}
            </Badge>
          )}
        </div>

        {/* Informações da Base */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Horário Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-1">
                {formatDateTime(currentTime)}
              </div>
              <div className="text-xs text-muted-foreground">
                Fuso horário: América/São Paulo (UTC-3)
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-green-600" />
                Detalhes da Base
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tipo:</span>
                  <span>{base.type || 'Padrão'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="outline" className="text-xs">
                    {base.active ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                Serviços Disponíveis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {base.hasMaintenance && (
                  <div className="flex items-center gap-2 text-sm">
                    <Wrench className="h-4 w-4 text-blue-600" />
                    <span>Manutenção</span>
                  </div>
                )}
                {base.hasTires && (
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span>Pneus</span>
                  </div>
                )}
                {base.hasFuelCard && (
                  <div className="flex items-center gap-2 text-sm">
                    <Fuel className="h-4 w-4 text-amber-600" />
                    <span>Cartão Combustível</span>
                  </div>
                )}
                {!base.hasMaintenance && !base.hasTires && !base.hasFuelCard && (
                  <div className="text-sm text-muted-foreground">
                    Nenhum serviço específico configurado
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Seção de Acesso Rápido */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">Acesso Rápido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {base.hasFuelCard && (
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => window.open(`/bases/${base.id}/external/cartao-combustivel`, '_blank')}
                >
                  <Fuel className="h-6 w-6 text-amber-600" />
                  <span className="font-semibold">Cartão Combustível</span>
                  <span className="text-xs text-muted-foreground">
                    Solicitar recarga de cartão
                  </span>
                </Button>
              )}
              
              {base.hasMaintenance && (
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => window.open(`/bases/${base.id}/external/manutencao`, '_blank')}
                >
                  <Wrench className="h-6 w-6 text-blue-600" />
                  <span className="font-semibold">Manutenção</span>
                  <span className="text-xs text-muted-foreground">
                    Solicitar serviço de manutenção
                  </span>
                </Button>
              )}
              
              {base.hasTires && (
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => window.open(`/bases/${base.id}/external/pneus`, '_blank')}
                >
                  <Shield className="h-6 w-6 text-green-600" />
                  <span className="font-semibold">Pneus</span>
                  <span className="text-xs text-muted-foreground">
                    Solicitar pneus
                  </span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informações de Contato */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Informações de Contato</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Telefone:</span>
                  <span>+55 (11) 99999-9999</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Email:</span>
                  <span>contato@muricionfleet.com</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Horário de Atendimento:</span>
                  <div className="text-muted-foreground">
                    Segunda a Sexta: 08:00 - 18:00<br />
                    Sábado: 08:00 - 12:00
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 pt-6 border-t">
          <p className="text-sm text-muted-foreground">
            © 2025 Muricion Fleet Management - Sistema de Gestão de Frotas
          </p>
        </div>
      </div>
    </div>
  );
};

export default BasePublic;
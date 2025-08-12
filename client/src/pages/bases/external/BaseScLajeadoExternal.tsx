/**
 * Link Externo para Base SC Lajeado - Cartão Combustível
 * Acesso público para solicitações de cartão combustível da base Lajeado
 */

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from 'wouter';
import BaseCartaoCombustivel from '@/components/base/BaseCartaoCombustivel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Fuel, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BaseScLajeadoExternal() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirecionar usuários autenticados da base SC Lajeado para o menu principal
  useEffect(() => {
    console.log('[BaseScLajeadoExternal] Estado atual:', { 
      user: user ? { id: user.id, name: user.name, baseId: user.baseId, base_id: user.base_id, basename: user.basename } : null, 
      isLoading 
    });
    
    if (!isLoading && user) {
      const userBaseId = user.baseId || user.base_id;
      console.log('[BaseScLajeadoExternal] Verificando base do usuário:', { userBaseId, basename: user.basename });
      
      if (userBaseId === 102 && user.basename === 'SC_LAJEADO_SRS10SDD') {
        console.log('[BaseScLajeadoExternal] REDIRECIONANDO para menu principal...');
        setTimeout(() => {
          setLocation('/bases/sc_lajeado_srs10sdd');
        }, 1000);
        return;
      }
    }
  }, [user, isLoading, setLocation]);

  // Se está carregando, mostrar loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Botão para ir ao menu principal se usuário autenticado */}
          {user && (user.baseId === 102 || user.base_id === 102) && (
            <Card className="mb-6 border-green-200 bg-gradient-to-r from-green-50 to-green-100">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">Olá, {user.name}!</p>
                      <p className="text-sm text-green-700">Você está logado na base SC (LAJEADO) SRS10-SDD</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setLocation('/bases/sc_lajeado_srs10sdd')}
                    variant="outline"
                    className="border-green-600 text-green-700 hover:bg-green-600 hover:text-white"
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    Ir para Menu Principal
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Header da página */}
          <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-white/20 rounded-full">
                  <Building2 className="h-8 w-8" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">
                SC (LAJEADO) SRS10-SDD
              </CardTitle>
              <p className="text-blue-100 mt-2">
                Lajeado, RS • Sistema de Gestão de Frota
              </p>
              <div className="flex justify-center items-center gap-2 mt-4">
                <Fuel className="h-5 w-5" />
                <span className="text-sm font-medium">MERCADO LIVRE</span>
              </div>
            </CardHeader>
          </Card>

          {/* Componente de cartão combustível otimizado para SC Lajeado */}
          <BaseCartaoCombustivel 
            baseId={102}
            baseName="SC (LAJEADO) SRS10-SDD"
            primaryColor="#2563eb"
          />
          
          {/* Mensagem informativa específica para a base */}
          <Card className="mt-6 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <Fuel className="h-5 w-5 text-blue-600" />
                <div className="text-sm text-blue-800">
                  <strong>Base SC (LAJEADO) SRS10-SDD:</strong> Sistema específico para solicitações de cartão combustível da operação Mercado Livre em Lajeado, RS.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
/**
 * Link Externo para Base GP02 - Cartão Combustível
 * Acesso público para solicitações de cartão combustível da base GP02 Jacarei
 */

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from 'wouter';
import BaseCartaoCombustivel from '@/components/base/BaseCartaoCombustivel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Fuel, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BaseGP02External() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirecionar usuários autenticados da base GP02 para o menu principal
  useEffect(() => {
    console.log('[BaseGP02External] Estado atual:', { 
      user: user ? { id: user.id, name: user.name, baseId: user.baseId, base_id: user.base_id, basename: user.basename } : null, 
      isLoading 
    });
    
    if (!isLoading && user) {
      const userBaseId = user.baseId || user.base_id;
      console.log('[BaseGP02External] Verificando base do usuário:', { userBaseId, basename: user.basename });
      
      if (userBaseId === 150 && user.basename === 'GP02') {
        console.log('[BaseGP02External] REDIRECIONANDO para menu principal...');
        setTimeout(() => {
          setLocation('/bases/gp02');
        }, 1000);
        return;
      }
    }
  }, [user, isLoading, setLocation]);

  // Se está carregando, mostrar loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-green-600 font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Botão para ir ao menu principal se usuário autenticado */}
          {user && (user.baseId === 150 || user.base_id === 150) && (
            <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">Olá, {user.name}!</p>
                      <p className="text-sm text-blue-700">Você está logado na base GP02 (JACAREI)</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setLocation('/bases/gp02')}
                    variant="outline"
                    className="border-blue-600 text-blue-700 hover:bg-blue-600 hover:text-white"
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    Ir para Menu Principal
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cabeçalho da Base */}
          <Card className="mb-8 border-green-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
              <div className="text-center">
                <Building2 className="h-12 w-12 mx-auto mb-4" />
                <CardTitle className="text-2xl font-bold">GP02 (JACAREI)</CardTitle>
                <p className="text-green-100 mt-2">Jacarei, SP • Sistema de Gestão de Frota</p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <Fuel className="h-4 w-4" />
                  <span className="text-sm font-medium">MERCADO LIVRE</span>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Formulário de Cartão Combustível */}
          <Card className="shadow-lg border-green-200">
            <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200">
              <div className="flex items-center gap-3">
                <Fuel className="h-6 w-6 text-green-600" />
                <div>
                  <CardTitle className="text-green-800">Cartão Combustível - GP02 (JACAREI)</CardTitle>
                  <p className="text-green-600 text-sm mt-1">
                    Solicite recargas de cartão combustível e acompanhe o histórico das suas solicitações.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <BaseCartaoCombustivel 
                baseId={150}
                baseName="GP02"
                baseDisplayName="GP02 (JACAREI)"
                project="MERCADO LIVRE"
                showUserSelect={true}
                externalAccess={true}
              />
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="mt-8 text-center text-gray-500 text-sm">
            <p>© 2025 Murici On Fleet 2.0 - Sistema de Gestão de Frota</p>
            <p className="mt-1">Base GP02 (JACAREI) • Mercado Livre</p>
          </div>
        </div>
      </div>
    </div>
  );
}
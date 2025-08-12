/**
 * Link Externo para Base SC Lajeado - Cartão Combustível
 * Acesso público para solicitações de cartão combustível da base Lajeado
 */

import React from 'react';
import BaseCartaoCombustivel from '@/components/base/BaseCartaoCombustivel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Fuel } from 'lucide-react';

export default function BaseScLajeadoExternal() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
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

          {/* Componente de cartão combustível */}
          <BaseCartaoCombustivel 
            baseId={102}
            baseName="SC (LAJEADO) SRS10-SDD"
            primaryColor="#2563eb"
          />
        </div>
      </div>
    </div>
  );
}
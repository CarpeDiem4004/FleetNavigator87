import React from 'react';
import FormularioAbastecimentoStandalone from '@/components/posto-remedios/FormularioAbastecimentoStandalone';
import { Toaster } from '@/components/ui/toaster';

export default function AbastecimentoPostoRemediosPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col py-6">
      <div className="container mx-auto px-4">
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-blue-800">Sistema de Abastecimento - Posto Remédios</h1>
          <p className="text-gray-600 mt-2">Registro de abastecimentos e lavagens para a frota</p>
        </header>
        
        <FormularioAbastecimentoStandalone />
        
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Murici Fleet - Sistema de Gestão de Frotas</p>
        </footer>
      </div>
      <Toaster />
    </div>
  );
}
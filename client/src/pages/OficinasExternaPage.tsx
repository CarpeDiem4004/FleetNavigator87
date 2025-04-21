import React from 'react';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import CadastroOficina from '@/components/workshop/CadastroOficina';

export default function OficinasExternaPage() {
  return (
    <MainLayoutSimple>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Cadastro de Oficina Parceira</h1>
            <p className="text-gray-500">
              Formulário para oficinas parceiras enviarem orçamentos e dados bancários
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <CadastroOficina />
        </div>
      </div>
    </MainLayoutSimple>
  );
}
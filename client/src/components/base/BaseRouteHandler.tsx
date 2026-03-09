/**
 * Componente para gerenciar rotas genéricas de bases
 * Permite que qualquer base funcione automaticamente com o mesmo sistema
 */

import React from 'react';
import { useParams } from 'wouter';
import GenericBasePage from './GenericBasePage';

interface BaseRouteHandlerProps {
  mode?: 'home' | 'login' | 'fuel-card';
}

export default function BaseRouteHandler({ mode = 'home' }: BaseRouteHandlerProps) {
  const params = useParams<{ id: string }>();
  
  // Converter ID para número
  const baseId = parseInt(params.id || '1', 10);
  
  // Validar se é um ID válido
  if (isNaN(baseId) || baseId <= 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Base Inválida</h1>
          <p className="text-gray-600">ID da base não é válido: {params.id}</p>
        </div>
      </div>
    );
  }

  return (
    <GenericBasePage 
      baseId={baseId} 
      mode={mode}
    />
  );
}
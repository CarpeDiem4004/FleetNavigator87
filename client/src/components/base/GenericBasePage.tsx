/**
 * Componente genérico para páginas de bases
 * Permite criar páginas para qualquer base usando apenas o ID
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import BaseLayout from '@/components/layout/BaseLayout';
import BaseHome from '@/components/base/BaseHome';
import BaseLogin from '@/components/auth/BaseLogin';
import BaseCartaoCombustivel from '@/components/base/BaseCartaoCombustivel';

interface GenericBasePageProps {
  baseId: number;
  mode?: 'home' | 'login' | 'fuel-card';
}

// Cores por base para consistência visual
const BASE_COLORS: { [key: number]: string } = {
  1: '#2563eb',    // Base 1 - Azul
  57: '#16a34a',   // Base Goiânia - Verde
  58: '#f59e0b',   // Base Salvador - Amarelo
  76: '#dc2626',   // Base Alair - Vermelho
  104: '#7c3aed',  // Base Campinas - Roxo
  // Adicione mais cores conforme necessário
};

// Nomes das bases para referência
const BASE_NAMES: { [key: number]: string } = {
  1: 'Base 1',
  57: 'Base Goiânia',
  58: 'Base Salvador',
  76: 'Base Alair',
  104: 'Base Campinas',
  // Adicione mais nomes conforme necessário
};

export default function GenericBasePage({ baseId, mode = 'home' }: GenericBasePageProps) {
  const [, setLocation] = useLocation();
  const [baseName, setBaseName] = useState(`Base ${baseId}`);
  const [baseColor, setBaseColor] = useState('#2563eb');

  useEffect(() => {
    // Definir nome e cor da base
    const name = BASE_NAMES[baseId] || `Base ${baseId}`;
    const color = BASE_COLORS[baseId] || '#2563eb';
    
    setBaseName(name);
    setBaseColor(color);
  }, [baseId]);

  const handleLoginSuccess = () => {
    setLocation(`/bases/${baseId}`);
  };

  // Modo Login
  if (mode === 'login') {
    return (
      <BaseLogin
        baseId={baseId}
        baseName={baseName}
        primaryColor={baseColor}
        onSuccess={handleLoginSuccess}
      />
    );
  }

  // Modo Cartão Combustível
  if (mode === 'fuel-card') {
    return (
      <BaseLayout 
        baseId={baseId} 
        baseName={baseName}
        primaryColor={baseColor}
      >
        <BaseCartaoCombustivel 
          baseId={baseId} 
          baseName={baseName}
          primaryColor={baseColor}
        />
      </BaseLayout>
    );
  }

  // Modo Home (padrão)
  return (
    <BaseLayout 
      baseId={baseId} 
      baseName={baseName}
      primaryColor={baseColor}
    >
      <BaseHome 
        baseId={baseId} 
        baseName={baseName}
        primaryColor={baseColor}
      />
    </BaseLayout>
  );
}
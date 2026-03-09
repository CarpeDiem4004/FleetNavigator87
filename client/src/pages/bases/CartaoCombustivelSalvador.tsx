/**
 * Página de Cartão Combustível - Base Salvador
 */

import React from 'react';
import BaseLayout from '@/components/layout/BaseLayout';
import BaseCartaoCombustivel from '@/components/base/BaseCartaoCombustivel';

export default function CartaoCombustivelSalvador() {
  return (
    <BaseLayout 
      baseId={58} 
      baseName="Base Salvador"
      primaryColor="#f59e0b"
    >
      <BaseCartaoCombustivel 
        baseId={58} 
        baseName="Base Salvador"
        primaryColor="#f59e0b"
      />
    </BaseLayout>
  );
}
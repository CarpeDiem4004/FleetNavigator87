/**
 * Página de Cartão Combustível - Base Goiânia
 */

import React from 'react';
import BaseLayout from '@/components/layout/BaseLayout';
import BaseCartaoCombustivel from '@/components/base/BaseCartaoCombustivel';

export default function CartaoCombustivelGoiania() {
  return (
    <BaseLayout 
      baseId={57} 
      baseName="Base Goiânia"
      primaryColor="#16a34a"
    >
      <BaseCartaoCombustivel 
        baseId={57} 
        baseName="Base Goiânia"
        primaryColor="#16a34a"
      />
    </BaseLayout>
  );
}
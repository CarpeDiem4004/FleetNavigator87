/**
 * Página de Cartão Combustível - Base Alair
 */

import React from 'react';
import BaseLayout from '@/components/layout/BaseLayout';
import BaseCartaoCombustivel from '@/components/base/BaseCartaoCombustivel';
import { cleanBaseName } from '@/lib/base-utils';

export default function CartaoCombustivelAlair() {
  return (
    <BaseLayout 
      baseId={76} 
      baseName="Base Alair"
      primaryColor="#dc2626"
    >
      <BaseCartaoCombustivel 
        baseId={76} 
        baseName="Base Alair"
        primaryColor="#dc2626"
      />
    </BaseLayout>
  );
}
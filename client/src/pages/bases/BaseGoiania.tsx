/**
 * Página da Base Goiânia - ID 57
 * Usa componentes genéricos com customização específica
 */

import React from 'react';
import BaseLayout from '@/components/layout/BaseLayout';
import BaseHome from '@/components/base/BaseHome';

export default function BaseGoiania() {
  return (
    <BaseLayout 
      baseId={57} 
      baseName="Base Goiânia"
      primaryColor="#16a34a"
    >
      <BaseHome 
        baseId={57} 
        baseName="Base Goiânia"
        primaryColor="#16a34a"
      />
    </BaseLayout>
  );
}
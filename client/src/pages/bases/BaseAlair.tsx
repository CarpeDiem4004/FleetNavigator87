/**
 * Página da Base Alair - ID 76
 */

import React from 'react';
import BaseLayout from '@/components/layout/BaseLayout';
import BaseHome from '@/components/base/BaseHome';

export default function BaseAlair() {
  return (
    <BaseLayout 
      baseId={76} 
      baseName="Base Alair"
      primaryColor="#dc2626"
    >
      <BaseHome 
        baseId={76} 
        baseName="Base Alair"
        primaryColor="#dc2626"
      />
    </BaseLayout>
  );
}
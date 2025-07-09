/**
 * Página da Base Salvador - ID 58
 */

import React from 'react';
import BaseLayout from '@/components/layout/BaseLayout';
import BaseHome from '@/components/base/BaseHome';

export default function BaseSalvador() {
  return (
    <BaseLayout 
      baseId={58} 
      baseName="Base Salvador"
      primaryColor="#f59e0b"
    >
      <BaseHome 
        baseId={58} 
        baseName="Base Salvador"
        primaryColor="#f59e0b"
      />
    </BaseLayout>
  );
}
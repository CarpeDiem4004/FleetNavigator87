import React from 'react';
import BaseGP3Template from '@/components/bases/BaseGP3Template';

const BaseCuritiba: React.FC = () => {
  return (
    <BaseGP3Template 
      baseName="CURITIBA SPR1"
      baseCode="SPR1"
      baseLocation="Curitiba, PR"
      baseSlug="curitiba"
      primaryColor="#1e40af"
      portalTrabalho="Portal Curitiba"
      workspaceId="WS_CURITIBA_SPR1"
    />
  );
};

export default BaseCuritiba;
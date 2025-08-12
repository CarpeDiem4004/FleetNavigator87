import React from 'react';
import BaseGP3Template from '@/components/bases/BaseGP3Template';

const BaseSC: React.FC = () => {
  return (
    <BaseGP3Template 
      baseName="SC (Ribeirão Preto)"
      baseCode="SSP4"
      baseLocation="Ribeirão Preto, SP"
      baseSlug="sc"
      primaryColor="#1e40af"
      portalTrabalho="Portal Ribeirão Preto"
      workspaceId="WS_SC_SSP4"
    />
  );
};

export default BaseSC;
import React from 'react';
import BaseGP3Template from '@/components/bases/BaseGP3Template';

const BaseSantos: React.FC = () => {
  return (
    <BaseGP3Template 
      baseName="SANTOS SSP15-SDD"
      baseCode="SSP15-SDD"
      baseLocation="Santos, SP"
      baseSlug="santos"
      primaryColor="#1e40af"
      portalTrabalho="Portal Santos"
      workspaceId="WS_SANTOS_SSP15"
    />
  );
};

export default BaseSantos;
import React from 'react';
import BaseGP3Template from '@/components/bases/BaseGP3Template';

const BaseBrasilia: React.FC = () => {
  return (
    <BaseGP3Template 
      baseName="BRASÍLIA SDP1"
      baseCode="SDP1"
      baseLocation="Brasília, DF"
      baseSlug="brasilia"
      primaryColor="#1e40af"
      portalTrabalho="Portal Brasília"
      workspaceId="WS_BRASILIA_SDP1"
    />
  );
};

export default BaseBrasilia;
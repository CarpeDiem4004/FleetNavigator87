import React from 'react';
import BaseGP3Template from '@/components/bases/BaseGP3Template';

const BaseRecife: React.FC = () => {
  return (
    <BaseGP3Template 
      baseName="RECIFE SPE1"
      baseCode="SPE1"
      baseLocation="Recife, PE"
      baseSlug="recife"
      primaryColor="#1e40af"
      portalTrabalho="Portal Recife"
      workspaceId="WS_RECIFE_SPE1"
    />
  );
};

export default BaseRecife;
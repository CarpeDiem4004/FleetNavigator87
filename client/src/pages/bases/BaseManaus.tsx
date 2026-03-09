import React from 'react';
import BaseGP3Template from '@/components/bases/BaseGP3Template';

const BaseManaus: React.FC = () => {
  return (
    <BaseGP3Template 
      baseName="MANAUS SAM1"
      baseCode="SAM1"
      baseLocation="Manaus, AM"
      baseSlug="manaus"
      primaryColor="#1e40af"
      portalTrabalho="Portal Manaus"
      workspaceId="WS_MANAUS_SAM1"
    />
  );
};

export default BaseManaus;
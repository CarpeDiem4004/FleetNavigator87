import React from 'react';
import BaseGP3Template from '@/components/bases/BaseGP3Template';

const BaseBlumenau: React.FC = () => {
  return (
    <BaseGP3Template 
      baseName="BLUMENAU SSC3"
      baseCode="SSC3"
      baseLocation="Blumenau, SC"
      baseSlug="blumenau"
      primaryColor="#1e40af"
      portalTrabalho="Portal Blumenau"
      workspaceId="WS_BLUMENAU_SSC3"
    />
  );
};

export default BaseBlumenau;
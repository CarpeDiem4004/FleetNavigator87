import React from 'react';
import BaseGP3Template from '@/components/bases/BaseGP3Template';

const BaseChapeco: React.FC = () => {
  return (
    <BaseGP3Template 
      baseName="CHAPECÓ SSC4"
      baseCode="SSC4"
      baseLocation="Chapecó, SC"
      baseSlug="chapeco"
      primaryColor="#1e40af"
      portalTrabalho="Portal Chapecó"
      workspaceId="WS_CHAPECO_SSC4"
    />
  );
};

export default BaseChapeco;
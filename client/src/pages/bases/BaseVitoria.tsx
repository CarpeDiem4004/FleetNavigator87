import React from 'react';
import BaseGP3Template from '@/components/bases/BaseGP3Template';

const BaseVitoria: React.FC = () => {
  return (
    <BaseGP3Template 
      baseName="VITÓRIA SES1-SDD"
      baseCode="SES1-SDD"
      baseLocation="Vitória, ES"
      baseSlug="vitoria"
      primaryColor="#1e40af"
      portalTrabalho="Portal Vitória"
      workspaceId="WS_VITORIA_SES1"
    />
  );
};

export default BaseVitoria;
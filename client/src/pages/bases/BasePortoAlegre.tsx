import React from 'react';
import BaseGP3Template from '@/components/bases/BaseGP3Template';

const BasePortoAlegre: React.FC = () => {
  return (
    <BaseGP3Template 
      baseName="PORTO ALEGRE SRS1"
      baseCode="SRS1"
      baseLocation="Porto Alegre, RS"
      baseSlug="porto-alegre"
      primaryColor="#1e40af"
      portalTrabalho="Portal Porto Alegre"
      workspaceId="WS_PORTOALEGRE_SRS1"
    />
  );
};

export default BasePortoAlegre;
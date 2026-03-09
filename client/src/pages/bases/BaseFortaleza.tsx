import React from 'react';
import BaseGP3Template from '@/components/bases/BaseGP3Template';

const BaseFortaleza: React.FC = () => {
  return (
    <BaseGP3Template 
      baseName="FORTALEZA SCE1"
      baseCode="SCE1"
      baseLocation="Fortaleza, CE"
      baseSlug="fortaleza"
      primaryColor="#1e40af"
      portalTrabalho="Portal Fortaleza"
      workspaceId="WS_FORTALEZA_SCE1"
    />
  );
};

export default BaseFortaleza;
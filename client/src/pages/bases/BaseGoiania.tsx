import React from 'react';
import BaseGP3Template from '@/components/bases/BaseGP3Template';

const BaseGoiania: React.FC = () => {
  return (
    <BaseGP3Template 
      baseName="GOIÂNIA SGO1"
      baseCode="SGO1"
      baseLocation="Goiânia, GO"
      baseSlug="goiania"
      primaryColor="#1e40af"
      portalTrabalho="Portal Goiânia"
      workspaceId="WS_GOIANIA_SGO1"
    />
  );
};

export default BaseGoiania;
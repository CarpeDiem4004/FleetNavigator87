import React from 'react';
import BaseGP3Template from '@/components/bases/BaseGP3Template';

const BaseLajeado: React.FC = () => {
  return (
    <BaseGP3Template 
      baseName="SC (LAJEADO) SRS10-SDD"
      baseCode="SRS10-SDD"
      baseLocation="Lajeado, RS"
      baseSlug="102"
      baseId={102}
      primaryColor="#1e40af"
      portalTrabalho="Portal Lajeado"
      workspaceId="WS_LAJEADO_102"
    />
  );
};

export default BaseLajeado;
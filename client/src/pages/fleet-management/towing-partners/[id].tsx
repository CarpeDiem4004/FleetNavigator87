import React from 'react';
import { useParams } from 'wouter';
import TowingPartnerDetail from './TowingPartnerDetail';

const TowingPartnerDetailPage: React.FC = () => {
  const { id } = useParams();
  
  if (!id) {
    return <div>Parceiro não encontrado</div>;
  }
  
  return <TowingPartnerDetail partnerId={id} />;
};

export default TowingPartnerDetailPage;
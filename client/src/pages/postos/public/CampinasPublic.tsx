import React from 'react';
import PublicPostoPage from '../PublicPostoPage';
import { POSTO_CAMPINAS, NOME_POSTO_CAMPINAS } from '@/constants/postos';

const CampinasPublic: React.FC = () => {
  return <PublicPostoPage id={POSTO_CAMPINAS} nomePosto={NOME_POSTO_CAMPINAS} />;
};

export default CampinasPublic;
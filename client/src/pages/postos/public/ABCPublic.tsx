import React from 'react';
import PublicPostoPage from '../PublicPostoPage';
import { POSTO_ABC, NOME_POSTO_ABC } from '@/constants/postos';

const ABCPublic: React.FC = () => {
  return <PublicPostoPage id={POSTO_ABC} nomePosto={NOME_POSTO_ABC} />;
};

export default ABCPublic;
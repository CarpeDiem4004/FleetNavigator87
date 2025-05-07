import React from 'react';
import PublicPostoPage from '../PublicPostoPage';
import { POSTO_SOROCABA, NOME_POSTO_SOROCABA } from '@/constants/postos';

const SorocabaPublic: React.FC = () => {
  return <PublicPostoPage id={POSTO_SOROCABA} nomePosto={NOME_POSTO_SOROCABA} />;
};

export default SorocabaPublic;
import React from 'react';
import PublicPostoPage from '../PublicPostoPage';
import { POSTO_GUARULHOS_V2, NOME_POSTO_GUARULHOS_V2 } from '@/constants/postos';

const GuarulhosV2Public: React.FC = () => {
  return <PublicPostoPage id={POSTO_GUARULHOS_V2} nomePosto={NOME_POSTO_GUARULHOS_V2} />;
};

export default GuarulhosV2Public;
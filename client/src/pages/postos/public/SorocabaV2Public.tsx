import React from 'react';
import PublicPostoPage from '../PublicPostoPage';
import { POSTO_SOROCABA_V2, NOME_POSTO_SOROCABA_V2 } from '@/constants/postos';

const SorocabaV2Public: React.FC = () => {
  return <PublicPostoPage id={POSTO_SOROCABA_V2} nomePosto={NOME_POSTO_SOROCABA_V2} />;
};

export default SorocabaV2Public;
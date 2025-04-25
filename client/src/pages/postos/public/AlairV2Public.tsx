import React from 'react';
import PublicPostoPage from '../PublicPostoPage';
import { POSTO_ALAIR_V2, NOME_POSTO_ALAIR_V2 } from '@/constants/postos';

const AlairV2Public: React.FC = () => {
  return <PublicPostoPage id={POSTO_ALAIR_V2} nomePosto={NOME_POSTO_ALAIR_V2} />;
};

export default AlairV2Public;
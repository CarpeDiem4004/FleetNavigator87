import React from 'react';
import PublicPostoPage from '../PublicPostoPage';
import { POSTO_ABC_V2, NOME_POSTO_ABC_V2 } from '@/constants/postos';

const ABCV2Public: React.FC = () => {
  return <PublicPostoPage id={POSTO_ABC_V2} nomePosto={NOME_POSTO_ABC_V2} />;
};

export default ABCV2Public;
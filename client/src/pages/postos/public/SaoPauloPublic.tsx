import React from 'react';
import PublicPostoPage from '../PublicPostoPage';
import { POSTO_SAOPAULO, NOME_POSTO_SAOPAULO } from '@/constants/postos';

const SaoPauloPublic: React.FC = () => {
  return <PublicPostoPage id={POSTO_SAOPAULO} nomePosto={NOME_POSTO_SAOPAULO} />;
};

export default SaoPauloPublic;
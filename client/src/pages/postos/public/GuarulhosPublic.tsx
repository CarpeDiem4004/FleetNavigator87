import React from 'react';
import PublicPostoPage from '../PublicPostoPage';
import { POSTO_GUARULHOS, NOME_POSTO_GUARULHOS } from '@/constants/postos';

const GuarulhosPublic: React.FC = () => {
  return <PublicPostoPage id={POSTO_GUARULHOS} nomePosto={NOME_POSTO_GUARULHOS} />;
};

export default GuarulhosPublic;
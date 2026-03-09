import React from 'react';
import PublicPostoPage from '../PublicPostoPage';
import { POSTO_GUARULHOS, NOME_POSTO_GUARULHOS } from '@/constants/postos';

// Este componente mantém o nome "GuarulhosPublic" para manter compatibilidade de rotas,
// mas internamente usa o nome "Alair" definido na constante NOME_POSTO_GUARULHOS
const GuarulhosPublic: React.FC = () => {
  return <PublicPostoPage id={POSTO_GUARULHOS} nomePosto={NOME_POSTO_GUARULHOS} />;
};

export default GuarulhosPublic;
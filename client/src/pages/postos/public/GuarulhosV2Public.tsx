import React from 'react';
import PublicPostoPage from '../PublicPostoPage';
import { POSTO_ALAIR_V2, NOME_POSTO_ALAIR_V2 } from '@/constants/postos';

/**
 * Este componente é o mesmo que AlairV2Public, mas com o nome GuarulhosV2Public
 * para manter compatibilidade de rotas.
 * Internamente, ele usa o posto Alair_v2 e seu nome correto.
 */
const GuarulhosV2Public: React.FC = () => {
  return <PublicPostoPage id={POSTO_ALAIR_V2} nomePosto={NOME_POSTO_ALAIR_V2} />;
};

export default GuarulhosV2Public;
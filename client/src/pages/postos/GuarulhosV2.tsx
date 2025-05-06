import React from 'react';
import PostoPage from './PostoPage';
import { POSTO_ALAIR_V2, NOME_POSTO_ALAIR_V2 } from '@/constants/postos';

/**
 * Este componente é o mesmo que AlairV2, mas com o nome GuarulhosV2
 * para manter compatibilidade de rotas.
 * Internamente, ele usa o posto Alair_v2 e seu nome correto.
 */
const PostoGuarulhosV2: React.FC = () => {
  return <PostoPage id={POSTO_ALAIR_V2} nomePosto={NOME_POSTO_ALAIR_V2} />;
};

export default PostoGuarulhosV2;
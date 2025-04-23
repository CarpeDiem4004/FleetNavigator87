import React from 'react';
import PostoPage from './PostoPage';
import { POSTO_GUARULHOS, NOME_POSTO_GUARULHOS } from '@/constants/postos';

// Este componente mantém o nome "PostoGuarulhos" para manter compatibilidade de rotas,
// mas internamente usa o nome "Alair" definido na constante NOME_POSTO_GUARULHOS
const PostoGuarulhos: React.FC = () => {
  return <PostoPage id={POSTO_GUARULHOS} nomePosto={NOME_POSTO_GUARULHOS} />;
};

export default PostoGuarulhos;
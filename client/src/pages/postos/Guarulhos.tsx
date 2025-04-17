import React from 'react';
import PostoPage from './PostoPage';
import { POSTO_GUARULHOS, NOME_POSTO_GUARULHOS } from '@/constants/postos';

const PostoGuarulhos: React.FC = () => {
  return <PostoPage id={POSTO_GUARULHOS} nomePosto={NOME_POSTO_GUARULHOS} />;
};

export default PostoGuarulhos;
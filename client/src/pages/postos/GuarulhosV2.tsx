import React from 'react';
import PostoPage from './PostoPage';
import { POSTO_GUARULHOS_V2, NOME_POSTO_GUARULHOS_V2 } from '@/constants/postos';

const PostoGuarulhosV2: React.FC = () => {
  return <PostoPage id={POSTO_GUARULHOS_V2} nomePosto={NOME_POSTO_GUARULHOS_V2} />;
};

export default PostoGuarulhosV2;
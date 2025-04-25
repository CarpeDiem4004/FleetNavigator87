import React from 'react';
import PostoPage from './PostoPage';
import { POSTO_CAMPINAS_V2, NOME_POSTO_CAMPINAS_V2 } from '@/constants/postos';

const PostoCampinasV2: React.FC = () => {
  return <PostoPage id={POSTO_CAMPINAS_V2} nomePosto={NOME_POSTO_CAMPINAS_V2} />;
};

export default PostoCampinasV2;
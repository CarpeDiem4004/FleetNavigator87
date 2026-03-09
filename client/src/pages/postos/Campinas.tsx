import React from 'react';
import PostoPage from './PostoPage';
import { POSTO_CAMPINAS, NOME_POSTO_CAMPINAS } from '@/constants/postos';

const PostoCampinas: React.FC = () => {
  return <PostoPage id={POSTO_CAMPINAS} nomePosto={NOME_POSTO_CAMPINAS} />;
};

export default PostoCampinas;
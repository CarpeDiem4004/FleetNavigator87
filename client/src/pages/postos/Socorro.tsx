import React from 'react';
import PostoPage from './PostoPage';
import { POSTO_SOCORRO, NOME_POSTO_SOCORRO } from '@/constants/postos';

const PostoSocorro: React.FC = () => {
  return <PostoPage id={POSTO_SOCORRO} nomePosto={NOME_POSTO_SOCORRO} />;
};

export default PostoSocorro;
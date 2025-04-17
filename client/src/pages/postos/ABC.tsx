import React from 'react';
import PostoPage from './PostoPage';
import { POSTO_ABC, NOME_POSTO_ABC } from '@/constants/postos';

const PostoABC: React.FC = () => {
  return <PostoPage id={POSTO_ABC} nomePosto={NOME_POSTO_ABC} />;
};

export default PostoABC;
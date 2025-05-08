import React from 'react';
import PostoPage from './PostoPage';
import { POSTO_ABC_V2, NOME_POSTO_ABC_V2 } from '@/constants/postos';

const PostoABCV2: React.FC = () => {
  return <PostoPage id={POSTO_ABC_V2} nomePosto={NOME_POSTO_ABC_V2} />;
};

export default PostoABCV2;
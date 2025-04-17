import React from 'react';
import PostoPage from './PostoPage';
import { POSTO_SOROCABA, NOME_POSTO_SOROCABA } from '@/constants/postos';

const PostoSorocaba: React.FC = () => {
  return <PostoPage id={POSTO_SOROCABA} nomePosto={NOME_POSTO_SOROCABA} />;
};

export default PostoSorocaba;
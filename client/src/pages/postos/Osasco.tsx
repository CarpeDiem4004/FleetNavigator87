import React from 'react';
import PostoPage from './PostoPage';
import { POSTO_OSASCO, NOME_POSTO_OSASCO } from '@/constants/postos';

const PostoOsasco: React.FC = () => {
  return <PostoPage id={POSTO_OSASCO} nomePosto={NOME_POSTO_OSASCO} />;
};

export default PostoOsasco;
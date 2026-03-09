import React from 'react';
import PostoPage from './PostoPage';
import { POSTO_ALAIR_V2, NOME_POSTO_ALAIR_V2 } from '@/constants/postos';

const PostoAlairV2: React.FC = () => {
  return <PostoPage id={POSTO_ALAIR_V2} nomePosto={NOME_POSTO_ALAIR_V2} />;
};

export default PostoAlairV2;
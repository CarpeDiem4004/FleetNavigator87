import React from 'react';
import PostoPage from './PostoPage';
import { POSTO_OSASCO_V2, NOME_POSTO_OSASCO_V2 } from '@/constants/postos';

const PostoOsascoV2: React.FC = () => {
  return <PostoPage id={POSTO_OSASCO_V2} nomePosto={NOME_POSTO_OSASCO_V2} />;
};

export default PostoOsascoV2;
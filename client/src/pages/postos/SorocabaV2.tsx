import React from 'react';
import PostoPage from './PostoPage';
import { POSTO_SOROCABA_V2, NOME_POSTO_SOROCABA_V2 } from '@/constants/postos';

const PostoSorocabaV2: React.FC = () => {
  return <PostoPage id={POSTO_SOROCABA_V2} nomePosto={NOME_POSTO_SOROCABA_V2} />;
};

export default PostoSorocabaV2;
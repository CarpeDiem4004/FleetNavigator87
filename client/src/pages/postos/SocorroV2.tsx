import React from 'react';
import PostoPage from './PostoPage';
import { POSTO_SOCORRO_V2, NOME_POSTO_SOCORRO_V2 } from '@/constants/postos';

const PostoSocorroV2: React.FC = () => {
  return <PostoPage id={POSTO_SOCORRO_V2} nomePosto={NOME_POSTO_SOCORRO_V2} />;
};

export default PostoSocorroV2;
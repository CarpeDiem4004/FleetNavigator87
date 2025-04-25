import React from 'react';
import PostoPublicPage from './PostoPublicPage';
import { POSTO_CAMPINAS_V2, NOME_POSTO_CAMPINAS_V2 } from '@/constants/postos';

const CampinasV2Public: React.FC = () => {
  return <PostoPublicPage id={POSTO_CAMPINAS_V2} nomePosto={NOME_POSTO_CAMPINAS_V2} />;
};

export default CampinasV2Public;
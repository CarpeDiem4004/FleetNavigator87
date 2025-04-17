import React from 'react';
import PostoPage from './PostoPage';
import { POSTO_SAOPAULO, NOME_POSTO_SAOPAULO } from '@/constants/postos';

const PostoSaoPaulo: React.FC = () => {
  return <PostoPage id={POSTO_SAOPAULO} nomePosto={NOME_POSTO_SAOPAULO} />;
};

export default PostoSaoPaulo;
import React from 'react';
import PostoLayout from './PostoLayout';
import FormularioAbastecimento from './components/FormularioAbastecimento';
import FormularioRecebimento from './components/FormularioRecebimento';
import FormularioControlePatio from './components/FormularioControlePatio';

interface PostoPageProps {
  id: string;
  nomePosto: string;
}

const PostoPage: React.FC<PostoPageProps> = ({ id, nomePosto }) => {
  return (
    <PostoLayout nomePosto={nomePosto}>
      <FormularioAbastecimento postId={id} />
      <FormularioRecebimento postId={id} />
      <FormularioControlePatio postId={id} />
    </PostoLayout>
  );
};

export default PostoPage;
import React from 'react';
import PostoLayout from './PostoLayout';

interface PostoPageProps {
  id: string;
  nomePosto: string;
}

const PostoPage: React.FC<PostoPageProps> = ({ id, nomePosto }) => {
  return <PostoLayout id={id} nomePosto={nomePosto} />;
};

export default PostoPage;
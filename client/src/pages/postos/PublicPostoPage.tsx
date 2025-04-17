import React from 'react';
import PublicPostoLayout from './PublicPostoLayout';

interface PublicPostoPageProps {
  id: string;
  nomePosto: string;
}

const PublicPostoPage: React.FC<PublicPostoPageProps> = ({ id, nomePosto }) => {
  return <PublicPostoLayout id={id} nomePosto={nomePosto} />;
};

export default PublicPostoPage;
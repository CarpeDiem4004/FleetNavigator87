import React from 'react';
import PublicPostoLayout from './PublicPostoLayout';
import PublicPostoAuth from '@/components/auth/PublicPostoAuth';

interface PublicPostoPageProps {
  id: string;
  nomePosto: string;
}

const PublicPostoPage: React.FC<PublicPostoPageProps> = ({ id, nomePosto }) => {
  return (
    <PublicPostoAuth postoId={id} postoName={nomePosto}>
      <PublicPostoLayout id={id} nomePosto={nomePosto} />
    </PublicPostoAuth>
  );
};

export default PublicPostoPage;
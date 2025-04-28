import React from 'react';
import PublicPostoLayout from './PublicPostoLayout';
import PublicPostoAuth from '@/components/auth/PublicPostoAuth';

interface PublicPostoPageProps {
  id: string;
  nomePosto: string;
}

const PublicPostoPage: React.FC<PublicPostoPageProps> = ({ id, nomePosto }) => {
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <PublicPostoAuth postoId={id} postoName={nomePosto}>
      <button onClick={handleLogout} className="fixed top-4 right-4 bg-red-600 text-white px-3 py-2 rounded">
        Logout
      </button>
      <PublicPostoLayout id={id} nomePosto={nomePosto} />
    </PublicPostoAuth>
  );
};

export default PublicPostoPage;
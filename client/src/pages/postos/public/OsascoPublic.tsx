import React from 'react';
import PublicPostoPage from '../PublicPostoPage';
import { POSTO_OSASCO, NOME_POSTO_OSASCO } from '@/constants/postos';

const OsascoPublic: React.FC = () => {
  return <PublicPostoPage id={POSTO_OSASCO} nomePosto={NOME_POSTO_OSASCO} />;
};

export default OsascoPublic;
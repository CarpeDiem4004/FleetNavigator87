import React from 'react';
import PublicPostoPage from '../PublicPostoPage';
import { POSTO_OSASCO_V2, NOME_POSTO_OSASCO_V2 } from '@/constants/postos';

const OsascoV2Public: React.FC = () => {
  return <PublicPostoPage id={POSTO_OSASCO_V2} nomePosto={NOME_POSTO_OSASCO_V2} />;
};

export default OsascoV2Public;
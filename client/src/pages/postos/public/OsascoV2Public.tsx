import React from 'react';
import PublicPostoPage from '../PublicPostoPage';
import { POSTO_OSASCO_V2, NOME_POSTO_OSASCO_V2 } from '@/constants/postos';

/**
 * Versão padronizada do posto Osasco V2, usando o mesmo componente PublicPostoPage
 * que os outros postos para garantir consistência na autenticação e interface
 */
const OsascoV2Public: React.FC = () => {
  return <PublicPostoPage id={POSTO_OSASCO_V2} nomePosto={NOME_POSTO_OSASCO_V2} />;
};

export default OsascoV2Public;
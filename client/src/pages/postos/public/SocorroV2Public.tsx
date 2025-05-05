import React from 'react';
import PublicPostoPage from '../PublicPostoPage';
import { POSTO_SOCORRO_V2, NOME_POSTO_SOCORRO_V2 } from '@/constants/postos';

const SocorroV2Public: React.FC = () => {
  return <PublicPostoPage id={POSTO_SOCORRO_V2} nomePosto={NOME_POSTO_SOCORRO_V2} />;
};

export default SocorroV2Public;
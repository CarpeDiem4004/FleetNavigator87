import React from 'react';
import PublicPostoPage from '../PublicPostoPage';
import { POSTO_SOCORRO, NOME_POSTO_SOCORRO } from '@/constants/postos';

const SocorroPublic: React.FC = () => {
  return <PublicPostoPage id={POSTO_SOCORRO} nomePosto={NOME_POSTO_SOCORRO} />;
};

export default SocorroPublic;
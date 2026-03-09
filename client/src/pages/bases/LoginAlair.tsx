/**
 * Página de Login - Base Alair
 */

import React from 'react';
import { useLocation } from 'wouter';
import BaseLogin from '@/components/auth/BaseLogin';

export default function LoginAlair() {
  const [, setLocation] = useLocation();

  const handleSuccess = () => {
    setLocation('/bases/76');
  };

  return (
    <BaseLogin
      baseId={76}
      baseName="Base Alair"
      primaryColor="#dc2626"
      onSuccess={handleSuccess}
    />
  );
}
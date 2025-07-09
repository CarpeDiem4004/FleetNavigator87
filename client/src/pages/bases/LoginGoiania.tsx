/**
 * Página de Login - Base Goiânia
 */

import React from 'react';
import { useLocation } from 'wouter';
import BaseLogin from '@/components/auth/BaseLogin';

export default function LoginGoiania() {
  const [, setLocation] = useLocation();

  const handleSuccess = () => {
    setLocation('/bases/57');
  };

  return (
    <BaseLogin
      baseId={57}
      baseName="Base Goiânia"
      primaryColor="#16a34a"
      onSuccess={handleSuccess}
    />
  );
}
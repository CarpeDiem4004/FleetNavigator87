/**
 * Página de Login - Base Salvador
 */

import React from 'react';
import { useLocation } from 'wouter';
import BaseLogin from '@/components/auth/BaseLogin';

export default function LoginSalvador() {
  const [, setLocation] = useLocation();

  const handleSuccess = () => {
    setLocation('/bases/58');
  };

  return (
    <BaseLogin
      baseId={58}
      baseName="Base Salvador"
      primaryColor="#f59e0b"
      onSuccess={handleSuccess}
    />
  );
}
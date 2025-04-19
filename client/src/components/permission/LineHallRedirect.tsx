import React from 'react';
import { Redirect } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';
import DashboardNew from '@/pages/DashboardNew';

// Componente que verifica se o usuário é da base Line Hall e redireciona conforme necessário
const LineHallRedirect: React.FC = () => {
  const { user } = useAuth();
  
  // Se for usuário da base Line Hall, redireciona para Line Hall
  if (user?.baseId === 11 || user?.basename === "Line Hall") {
    console.log("Redirecionando usuário Line Hall para /line-hall:", user.email);
    return <Redirect to="/line-hall" />;
  }
  
  // Para outros usuários, exibe o dashboard normalmente
  return <ProtectedRoute path="/" component={DashboardNew} />;
};

export default LineHallRedirect;
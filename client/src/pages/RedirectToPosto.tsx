/**
 * Página de redirecionamento para postos
 * Esta página é acessada diretamente pelo domínio personalizado sem precisar de autenticação
 * Exemplo de URL: gestaoonfleet.com.br/redirect-posto/campinas_v2
 */

import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react';

const RedirectToPosto: React.FC = () => {
  const { posto } = useParams();
  const [, navigate] = useLocation();
  const { user, isLoading } = useAuth();
  const [status, setStatus] = useState<'loading' | 'redirecting' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const checkAndRedirect = async () => {
      try {
        if (isLoading) {
          return; // Aguardar carregamento da autenticação
        }

        setStatus('loading');
        
        // Verificar se a autenticação foi concluída
        if (user) {
          // Usuário está autenticado, redireciona diretamente
          console.log(`Redirecionando para posto: ${posto}`);
          setStatus('redirecting');
          setTimeout(() => {
            navigate(`/posto/${posto}`);
          }, 1000);
        } else {
          // Usuário não está autenticado, tenta fazer login primeiro
          setErrorMessage('Você precisa estar autenticado para acessar este posto.');
          setStatus('error');
          // Espera 2 segundos antes de redirecionar para o login
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        }
      } catch (error) {
        console.error('Erro ao redirecionar para posto:', error);
        setErrorMessage('Erro ao redirecionar para o posto. Tente fazer login manualmente.');
        setStatus('error');
      }
    };

    checkAndRedirect();
  }, [isLoading, user, posto, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md space-y-4">
        <div className="flex justify-center">
          {status === 'loading' && (
            <Loader2 className="h-16 w-16 text-primary animate-spin" />
          )}
          {status === 'redirecting' && (
            <CheckCircle className="h-16 w-16 text-green-500" />
          )}
          {status === 'error' && (
            <AlertCircle className="h-16 w-16 text-red-500" />
          )}
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-900">
          {status === 'loading' && 'Verificando acesso...'}
          {status === 'redirecting' && 'Redirecionando para o posto...'}
          {status === 'error' && 'Erro de Acesso'}
        </h1>

        <p className="text-center text-gray-600">
          {status === 'loading' && 'Aguarde enquanto verificamos seu acesso.'}
          {status === 'redirecting' && `Você será redirecionado para o posto ${posto} em instantes.`}
          {status === 'error' && errorMessage}
        </p>

        {status === 'error' && (
          <div className="text-center mt-4">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
            >
              Ir para Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RedirectToPosto;
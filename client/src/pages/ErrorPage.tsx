import React from 'react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

interface ErrorPageProps {
  title?: string;
  message?: string;
  code?: string;
}

const ErrorPage: React.FC<ErrorPageProps> = ({
  title = "Erro de Conexão",
  message = "Ocorreu um erro ao conectar ao servidor.",
  code = "ERR_CONNECTION_REFUSED"
}) => {
  const [_, navigate] = useLocation();

  // Instruções específicas com base no código de erro
  const getErrorInstructions = () => {
    if (code === 'ERR_CONNECTION_REFUSED') {
      return (
        <div className="space-y-2 text-left mt-4">
          <h3 className="font-medium text-gray-800">O que pode estar acontecendo:</h3>
          <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
            <li>O servidor da aplicação pode estar fora do ar</li>
            <li>Pode haver um problema com sua conexão de internet</li>
            <li>Um firewall pode estar bloqueando a comunicação</li>
            <li>O navegador está tentando acessar uma porta bloqueada</li>
          </ul>
          
          <h3 className="font-medium text-gray-800 mt-4">Sugestões:</h3>
          <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
            <li>Verifique se o servidor está em execução</li>
            <li>Tente acessar pelo IP direto ao invés de 'localhost'</li>
            <li>Teste usando outro navegador</li>
            <li>Verifique se a API está no ar tentando acessar diretamente a URL da API</li>
          </ul>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-8 w-8 text-red-500" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>
          
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          
          <p className="text-gray-600">
            {message}
          </p>
          
          <div className="bg-gray-100 p-3 rounded-md w-full">
            <code className="text-sm font-mono text-gray-700">
              {code}
            </code>
          </div>
          
          {getErrorInstructions()}
          
          <div className="flex space-x-4 w-full">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => navigate('/')}
            >
              Página Inicial
            </Button>
            
            <Button 
              className="flex-1"
              onClick={() => window.location.reload()}
            >
              Tentar Novamente
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
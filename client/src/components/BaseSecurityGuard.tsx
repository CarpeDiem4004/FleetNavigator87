import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Redirect } from 'wouter';

interface BaseSecurityGuardProps {
  children: React.ReactNode;
  baseId: string | number;
  baseName?: string;
  loginPath?: string;
}

export const BaseSecurityGuard: React.FC<BaseSecurityGuardProps> = ({
  children,
  baseId,
  baseName,
  loginPath
}) => {
  const { user, isLoading } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [baseInfo, setBaseInfo] = useState<any>(null);

  useEffect(() => {
    const checkBaseAccess = async () => {
      if (!user) {
        setHasAccess(false);
        return;
      }

      try {
        // Buscar informações da base
        const response = await fetch(`/api/bases/${baseId}`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          setHasAccess(false);
          return;
        }

        const { data: base } = await response.json();
        setBaseInfo(base);

        // REGRA DE OURO: Verificar acesso específico à base
        const hasBaseAccess = checkUserBaseAccess(user, base);
        setHasAccess(hasBaseAccess);

      } catch (error) {
        console.error('Erro ao verificar acesso à base:', error);
        setHasAccess(false);
      }
    };

    checkBaseAccess();
  }, [user, baseId]);

  const checkUserBaseAccess = (user: any, base: any): boolean => {
    // 1. Admin sempre tem acesso (exceto se explicitamente negado)
    if (user.role === 'admin') {
      return true;
    }

    // 2. Usuário deve ter a base específica atribuída
    if (user.base_id && user.base_id.toString() === base.id.toString()) {
      return true;
    }

    // 3. Verificar por basename se disponível
    if (user.basename && base.basename && user.basename === base.basename) {
      return true;
    }

    // 4. Usuários de oficina podem acessar bases associadas à sua oficina
    if (user.role === 'oficina' && user.oficina_id) {
      // Verificar se a oficina atende esta base
      return checkOficinaBaseAccess(user.oficina_id, base.id);
    }

    // 5. Parceiros de guincho com token válido
    if (user.role === 'parceiro' && user.partner_token) {
      return true;
    }

    return false;
  };

  const checkOficinaBaseAccess = (oficinaId: number, baseId: number): boolean => {
    // Implementar lógica específica de oficinas se necessário
    // Por enquanto, oficinas têm acesso limitado
    return false;
  };

  const getLoginRedirectPath = (): string => {
    if (loginPath) return loginPath;
    
    // Mapear basenames específicos para rotas conhecidas
    if (baseInfo?.basename) {
      const baseNameRouteMap: { [key: string]: string } = {
        'GRUPO_PEREIRA': 'gp03',
        'GP03_HORTOLANDIA': 'gp03',
        'SC_LAJEADO_SRS10SDD': 'lajeado',
        'GP02_JACAREI': 'gp02',
        'GP01_VARGEM_GRANDE': 'gp01'
      };
      
      const routeName = baseNameRouteMap[baseInfo.basename] || baseInfo.basename.toLowerCase().replace(/_/g, '-');
      return `/bases/${routeName}/login`;
    }
    
    // Padrão de login por ID
    return `/bases/${baseId}/login`;
  };

  if (isLoading || hasAccess === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando acesso à base...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to={getLoginRedirectPath()} />;
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 mb-4">
            Você não tem permissão para acessar a base "{baseInfo?.name || baseId}".
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Usuário: {user.name} ({user.email})<br/>
            Role: {user.role}<br/>
            {user.basename && `Base autorizada: ${user.basename}`}
          </p>
          <div className="space-y-2">
            <button
              onClick={() => window.location.href = getLoginRedirectPath()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              Ir para Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default BaseSecurityGuard;
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Redirect } from 'wouter';

interface BaseAccessControllerProps {
  children: React.ReactNode;
  baseId: string | number;
  requiredRole?: 'admin' | 'operador' | 'oficina' | 'parceiro';
  allowedRoles?: string[];
}

export const BaseAccessController: React.FC<BaseAccessControllerProps> = ({
  children,
  baseId,
  requiredRole,
  allowedRoles = ['admin', 'operador']
}) => {
  const { user, isLoading } = useAuth();
  const [accessGranted, setAccessGranted] = useState<boolean | null>(null);
  const [baseData, setBaseData] = useState<any>(null);
  const [redirectPath, setRedirectPath] = useState<string>('/login');

  useEffect(() => {
    const validateAccess = async () => {
      if (!user) {
        setAccessGranted(false);
        return;
      }

      try {
        // Buscar dados da base
        const baseResponse = await fetch(`/api/bases/${baseId}`, {
          credentials: 'include'
        });

        if (!baseResponse.ok) {
          throw new Error('Base não encontrada');
        }

        const { data: base } = await baseResponse.json();
        setBaseData(base);

        // Definir caminho de redirecionamento específico da base
        // Converter basename para o formato correto da rota
        let loginPath = `/bases/${baseId}/login`;
        
        if (base.basename) {
          // Mapear basenames específicos para rotas conhecidas
          const baseNameRouteMap: { [key: string]: string } = {
            'SC_LAJEADO_SRS10SDD': 'lajeado',
            'GP02_JACAREI': 'gp02',
            'GP03_HORTOLANDIA': 'gp03',
            'GP01_VARGEM_GRANDE': 'gp01'
          };
          
          const routeName = baseNameRouteMap[base.basename] || base.basename.toLowerCase().replace(/_/g, '-');
          loginPath = `/bases/${routeName}/login`;
        }
        
        console.log('[BaseAccessController] Redirecionando para:', loginPath);
        setRedirectPath(loginPath);

        // APLICAR REGRA DE OURO: Verificação rigorosa de acesso
        const hasAccess = await validateBaseAccess(user, base);
        setAccessGranted(hasAccess);

      } catch (error) {
        console.error('Erro na validação de acesso:', error);
        setAccessGranted(false);
      }
    };

    validateAccess();
  }, [user, baseId, requiredRole, allowedRoles]);

  const validateBaseAccess = async (user: any, base: any): Promise<boolean> => {
    // 1. Verificar se o usuário tem role permitida
    if (!allowedRoles.includes(user.role)) {
      return false;
    }

    // 2. Admin tem acesso universal (EXCETO se a base tiver restrições específicas)
    if (user.role === 'admin') {
      return true;
    }

    // 3. REGRA DE OURO: Operador só acessa SUA base específica
    if (user.role === 'operador') {
      // Verificar por ID da base
      if (user.base_id && user.base_id.toString() === base.id.toString()) {
        return true;
      }
      
      // Verificar por basename
      if (user.basename && base.basename && user.basename === base.basename) {
        return true;
      }
      
      return false; // Operador sem base correspondente = ACESSO NEGADO
    }

    // 4. Oficina: apenas bases associadas
    if (user.role === 'oficina' && user.oficina_id) {
      return await checkOficinaBaseAssociation(user.oficina_id, base.id);
    }

    // 5. Parceiro: apenas com token válido e serviços ativos
    if (user.role === 'parceiro' && user.partner_token) {
      return await validatePartnerAccess(user.partner_token, base.id);
    }

    return false;
  };

  const checkOficinaBaseAssociation = async (oficinaId: number, baseId: number): Promise<boolean> => {
    try {
      const response = await fetch(`/api/oficinas/${oficinaId}/bases`, {
        credentials: 'include'
      });
      
      if (!response.ok) return false;
      
      const { data: associatedBases } = await response.json();
      return associatedBases.some((b: any) => b.id === baseId);
    } catch {
      return false;
    }
  };

  const validatePartnerAccess = async (token: string, baseId: number): Promise<boolean> => {
    try {
      const response = await fetch(`/api/partners/validate-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, baseId }),
        credentials: 'include'
      });
      
      return response.ok;
    } catch {
      return false;
    }
  };

  if (isLoading || accessGranted === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Verificando Acesso</h3>
          <p className="text-gray-600">Validando permissões para a base...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to={redirectPath} />;
  }

  if (!accessGranted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-pink-100">
        <div className="max-w-lg w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="text-red-500 mb-6">
            <svg className="w-20 h-20 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acesso Restrito</h2>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-medium mb-2">
              Regra de Segurança Ativada
            </p>
            <p className="text-red-700 text-sm">
              Você não possui autorização para acessar a base "{baseData?.name || baseId}".
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h4 className="font-semibold text-gray-800 mb-2">Detalhes do Usuário:</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p><strong>Nome:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Função:</strong> {user.role}</p>
              {user.basename && <p><strong>Base Autorizada:</strong> {user.basename}</p>}
              {user.base_id && <p><strong>Base ID:</strong> {user.base_id}</p>}
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => window.location.href = redirectPath}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Fazer Login na Base Correta
            </button>
            
            <button
              onClick={() => window.location.href = '/login'}
              className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Login Principal do Sistema
            </button>
            
            <button
              onClick={() => window.location.href = '/bases'}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Ver Bases Disponíveis
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Sistema de Segurança • Murici On Fleet 2.0<br/>
              Entre em contato com o administrador se precisar de acesso adicional.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default BaseAccessController;
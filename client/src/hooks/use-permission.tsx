import { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export function usePermission() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = () => {
      try {
        // Verifica se existe um token de autenticação no localStorage
        const token = localStorage.getItem('authToken');
        if (!token) {
          setUser(null);
          setLoading(false);
          return;
        }

        // Decodifica o token JWT para obter as informações do usuário
        // O token JWT geralmente tem 3 partes separadas por ponto
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          setUser(null);
          setLoading(false);
          return;
        }

        // A segunda parte do token contém os dados do usuário em formato Base64
        const payload = tokenParts[1];
        const decodedPayload = atob(payload);
        const userData = JSON.parse(decodedPayload);

        // Verifica se o token está expirado
        if (userData.exp && userData.exp * 1000 < Date.now()) {
          // Token expirado
          localStorage.removeItem('authToken');
          setUser(null);
          setLoading(false);
          return;
        }

        // Preenche os dados do usuário
        setUser({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role
        });
      } catch (error) {
        console.error('Erro ao obter permissões do usuário:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  /**
   * Verifica se o usuário tem algum dos papéis permitidos
   * @param allowedRoles Array de papéis (roles) permitidos
   * @returns true se o usuário tem pelo menos um dos papéis, false caso contrário
   */
  const hasPermission = (allowedRoles: string[]): boolean => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  /**
   * Verifica se o usuário é administrador
   * @returns true se o usuário tem papel de admin, false caso contrário
   */
  const isAdmin = (): boolean => {
    if (!user) return false;
    return user.role === 'admin';
  };

  /**
   * Verifica se o usuário está autenticado
   * @returns true se o usuário está autenticado, false caso contrário
   */
  const isAuthenticated = (): boolean => {
    return !!user;
  };

  /**
   * Obtém o papel (role) do usuário atual
   * @returns o papel do usuário ou null se não estiver autenticado
   */
  const getUserRole = (): string | null => {
    return user ? user.role : null;
  };

  return {
    user,
    loading,
    hasPermission,
    isAdmin,
    isAuthenticated,
    getUserRole
  };
}
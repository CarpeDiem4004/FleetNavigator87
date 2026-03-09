import { useState, useEffect, useCallback } from 'react';

interface BaseUser {
  id: number;
  name: string;
  email: string;
  role: string;
  baseRole: string;
}

interface UseBaseAuthReturn {
  user: BaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasAccess: boolean;
  error: string | null;
  checkBaseAccess: (baseId: number) => Promise<boolean>;
  logout: () => void;
}

export function useBaseAuth(baseId?: number): UseBaseAuthReturn {
  const [user, setUser] = useState<BaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkBaseAccess = useCallback(async (targetBaseId: number): Promise<boolean> => {
    const token = localStorage.getItem('base_auth_token');
    const storedBaseId = localStorage.getItem('base_id');
    const storedUser = localStorage.getItem('base_user');

    if (!token || !storedUser) {
      setHasAccess(false);
      setUser(null);
      return false;
    }

    if (storedBaseId !== targetBaseId.toString()) {
      setHasAccess(false);
      setError('Você não tem permissão para acessar esta base');
      return false;
    }

    try {
      const response = await fetch('/api/base-auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ baseId: targetBaseId }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setUser(JSON.parse(storedUser));
        setHasAccess(true);
        setError(null);
        return true;
      } else {
        setHasAccess(false);
        setUser(null);
        setError(data.message || 'Acesso negado');
        localStorage.removeItem('base_auth_token');
        localStorage.removeItem('base_user');
        localStorage.removeItem('base_id');
        return false;
      }
    } catch (err) {
      console.error('Erro ao verificar acesso:', err);
      setHasAccess(false);
      setError('Erro ao verificar permissões');
      return false;
    }
  }, []);

  useEffect(() => {
    const verifyAuth = async () => {
      setIsLoading(true);
      
      if (!baseId) {
        setIsLoading(false);
        return;
      }

      const token = localStorage.getItem('base_auth_token');
      const storedUser = localStorage.getItem('base_user');
      const storedBaseId = localStorage.getItem('base_id');

      if (!token || !storedUser) {
        setIsLoading(false);
        setHasAccess(false);
        return;
      }

      if (storedBaseId !== baseId.toString()) {
        setIsLoading(false);
        setHasAccess(false);
        setError('Você não tem permissão para acessar esta base');
        return;
      }

      await checkBaseAccess(baseId);
      setIsLoading(false);
    };

    verifyAuth();
  }, [baseId, checkBaseAccess]);

  const logout = useCallback(() => {
    localStorage.removeItem('base_auth_token');
    localStorage.removeItem('base_user');
    localStorage.removeItem('base_id');
    setUser(null);
    setHasAccess(false);
    setError(null);
  }, []);

  return {
    user,
    isAuthenticated: !!user && hasAccess,
    isLoading,
    hasAccess,
    error,
    checkBaseAccess,
    logout,
  };
}

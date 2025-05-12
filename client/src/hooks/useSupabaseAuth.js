import { useState, useEffect, useCallback } from 'react';
import { supabase, withRetry } from '@/lib/supabaseClient';

export function useSupabaseAuth() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Inicializa a sessão ao carregar o componente
  useEffect(() => {
    // Recupera a sessão atual
    const getSession = async () => {
      try {
        setLoading(true);
        
        // Recuperar sessão armazenada
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Verifica se o token está próximo de expirar e renova se necessário
          const expiresAt = new Date(currentSession.expires_at * 1000);
          const now = new Date();
          const timeUntilExpiry = expiresAt - now;
          
          // Se o token expira em menos de 60 minutos, tenta renovar
          if (timeUntilExpiry < 1000 * 60 * 60) {
            const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshedSession) {
              setSession(refreshedSession);
              setUser(refreshedSession.user);
            } else if (refreshError) {
              console.error('Erro ao renovar sessão:', refreshError);
            }
          }
        }
      } catch (err) {
        console.error('Erro ao recuperar sessão:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Configurar listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user || null);
      setLoading(false);
    });

    // Limpar subscrição quando o componente for desmontado
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Função de login
  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Iniciando autenticação tradicional...");
      
      // Primeiro tentar login na API tradicional para estabelecer cookies
      let traditionalLoginSuccess = false;
      let userData = null;
      
      try {
        // Chamada à API tradicional
        const apiResponse = await fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-Method': 'traditional',
          },
          body: JSON.stringify({ email, password }),
          credentials: 'include'
        });
        
        if (apiResponse.ok) {
          userData = await apiResponse.json();
          traditionalLoginSuccess = true;
          console.log("Login tradicional bem-sucedido:", userData);
          
          // Verificar se a sessão foi estabelecida
          const sessionVerification = await fetch('/api/user', {
            method: 'GET',
            credentials: 'include',
            headers: {
              'X-Auth-Verification': 'true',
            }
          }).catch(e => {
            console.warn("Verificação de sessão falhou após login bem-sucedido. Tentando recuperar...");
            return null;
          });
          
          // Sincronizar com Supabase mesmo se a sessão não foi estabelecida
          console.log("Registro Supabase realizado após login tradicional");
        } else {
          console.warn('Login na API tradicional falhou, tentando via Supabase');
        }
      } catch (apiError) {
        console.warn('Erro ao fazer login na API tradicional:', apiError);
      }
      
      // Depois tenta login no Supabase (mesmo se o login tradicional foi bem-sucedido)
      let supabaseSession = null;
      
      try {
        // Tenta fazer login no Supabase
        const { data, error } = await withRetry(() => 
          supabase.auth.signInWithPassword({
            email,
            password
          })
        );
        
        if (error) {
          // Se login tradicional falhou e o Supabase também falhou, retornar erro
          if (!traditionalLoginSuccess) {
            setError(error);
            return { success: false, error };
          }
          // Caso contrário, apenas registrar o erro mas continuar
          console.warn('Login no Supabase falhou, mas login tradicional foi bem-sucedido:', error);
        } else {
          // Login Supabase bem-sucedido
          supabaseSession = data.session;
          setSession(data.session);
          setUser(data.user);
          
          // Se o login tradicional falhou mas o Supabase foi bem-sucedido, tentar novamente a API tradicional
          if (!traditionalLoginSuccess) {
            try {
              const token = data.session.access_token;
              localStorage.setItem('authToken', token);
              
              // Sincronizar o login com a API tradicional usando o token
              const syncResponse = await fetch('/api/login/sync', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                credentials: 'include'
              });
              
              if (syncResponse.ok) {
                userData = await syncResponse.json();
                console.log('Sincronização com API tradicional bem-sucedida');
              }
            } catch (syncError) {
              console.warn('Erro ao sincronizar com API tradicional:', syncError);
            }
          }
        }
      } catch (supabaseError) {
        console.warn('Erro ao fazer login no Supabase:', supabaseError);
        // Se login tradicional também falhou, retornar erro
        if (!traditionalLoginSuccess) {
          setError(supabaseError);
          return { success: false, error: supabaseError };
        }
      }
      
      // Se o login foi bem-sucedido em algum dos métodos
      if (traditionalLoginSuccess || supabaseSession) {
        console.log("Autenticação bem-sucedida. Método:", traditionalLoginSuccess ? 
          (supabaseSession ? "Tradicional -> Supabase -> JWT" : "Tradicional -> JWT") :
          "Supabase -> JWT");
        
        return { 
          success: true, 
          session: supabaseSession, 
          user: userData || (supabaseSession ? supabaseSession.user : null) 
        };
      }
      
      // Se chegou aqui, falhou em ambos os métodos
      throw new Error("Falha em ambos os métodos de autenticação");
      
    } catch (err) {
      console.error('Erro inesperado durante login:', err);
      setError(err);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  // Função de logout
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      
      // Logout do Supabase
      await supabase.auth.signOut();
      
      // Também fazer logout da API tradicional
      try {
        await fetch('/api/logout', {
          method: 'POST',
          credentials: 'include'
        });
      } catch (apiError) {
        console.warn('Erro ao fazer logout da API tradicional:', apiError);
      }
      
      // Limpar o estado local
      setUser(null);
      setSession(null);
      
      return { success: true };
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
      setError(err);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  // Função de registro
  const register = useCallback(async (email, password, userData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Registrar no Supabase
      const { data, error } = await withRetry(() => 
        supabase.auth.signUp({
          email,
          password,
          options: {
            data: userData // Metadados do usuário
          }
        })
      );
      
      if (error) {
        setError(error);
        return { success: false, error };
      }
      
      // Também registrar na API tradicional
      try {
        const apiResponse = await fetch('/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            email, 
            password, 
            name: userData.name, 
            role: userData.role,
            base_id: userData.base_id,
            basename: userData.basename
          }),
          credentials: 'include'
        });
        
        if (!apiResponse.ok) {
          console.warn('Registro na API tradicional falhou, mas registro no Supabase foi bem-sucedido');
        }
      } catch (apiError) {
        console.warn('Erro ao registrar na API tradicional:', apiError);
      }
      
      return { success: true, session: data.session, user: data.user };
    } catch (err) {
      console.error('Erro inesperado durante registro:', err);
      setError(err);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  // Função para atualizar o perfil do usuário
  const updateProfile = useCallback(async (userData) => {
    try {
      setLoading(true);
      
      // Atualizar no Supabase
      const { data, error } = await withRetry(() => 
        supabase.auth.updateUser({
          data: userData
        })
      );
      
      if (error) {
        setError(error);
        return { success: false, error };
      }
      
      setUser(data.user);
      
      return { success: true, user: data.user };
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      setError(err);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    session,
    loading,
    error,
    login,
    logout,
    register,
    updateProfile,
    isAuthenticated: !!user
  };
}
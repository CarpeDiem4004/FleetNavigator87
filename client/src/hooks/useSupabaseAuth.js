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
      
      console.log("Iniciando autenticação híbrida...");
      
      // Estratégia de login aprimorada:
      // 1. Tentar login Supabase primeiro para obter um token JWT válido
      // 2. Em seguida, usar esse token para autenticar na API tradicional
      // 3. Verificar se a sessão foi estabelecida corretamente
      // 4. Caso contrário, fazer login diretamente na API tradicional
      let userData = null;
      let supabaseSession = null;
      
      // PASSO 1: Tentar login no Supabase
      try {
        // Limpar qualquer token anterior para evitar conflitos
        localStorage.removeItem('authToken');
        
        console.log("Tentando login via Supabase...");
        const { data, error } = await withRetry(() => 
          supabase.auth.signInWithPassword({
            email,
            password
          })
        );
        
        if (error) {
          console.warn('Login no Supabase falhou:', error);
        } else {
          // Login Supabase bem-sucedido
          supabaseSession = data.session;
          setSession(data.session);
          setUser(data.user);
          console.log("Login Supabase bem-sucedido, sessão estabelecida");
          
          // Armazenar token em cookies (além do armazenamento interno do Supabase)
          // para redundância e maior persistência
          if (data.session) {
            const token = data.session.access_token;
            
            // Armazenar token em localStorage (para compatibilidade com código legado)
            localStorage.setItem('authToken', token);
            
            // Também armazenar em cookie para maior robustez contra limpeza de localStorage
            document.cookie = `authToken=${token}; path=/; max-age=86400; SameSite=Lax`;
          }
        }
      } catch (supabaseError) {
        console.warn('Erro ao fazer login no Supabase:', supabaseError);
      }
      
      // PASSO 2: Tentar autenticação na API tradicional com o token do Supabase
      let traditionalLoginSuccess = false;
      
      if (supabaseSession) {
        try {
          // Se temos sessão Supabase, tentamos sincronizar com a API tradicional
          console.log("Sincronizando com API tradicional usando token JWT...");
          const token = supabaseSession.access_token;
          
          const syncResponse = await fetch('/api/login/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'X-Auth-Source': 'supabase'
            },
            credentials: 'include',
            body: JSON.stringify({ 
              email, 
              supabaseUser: supabaseSession.user 
            })
          });
          
          if (syncResponse.ok) {
            userData = await syncResponse.json();
            traditionalLoginSuccess = true;
            console.log('Sincronização com API tradicional bem-sucedida');
            
            // Tentar criar nova rota de sincronização avançada
            try {
              await fetch('/api/resync-session-jwt', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                  'X-Force-Sync': 'true'
                },
                credentials: 'include',
                body: JSON.stringify({ 
                  user: userData || supabaseSession.user,
                  token: token
                })
              });
              console.log("Sincronização avançada de sessão realizada");
            } catch (resyncError) {
              console.warn("Erro na sincronização avançada:", resyncError);
              // Não é um erro crítico, podemos continuar
            }
          } else {
            console.warn('Sincronização com API tradicional falhou, tentando login direto na API');
          }
        } catch (syncError) {
          console.warn('Erro ao sincronizar com API tradicional:', syncError);
        }
      }
      
      // PASSO 3: Se a sincronização falhou, tentamos login direto na API tradicional
      if (!traditionalLoginSuccess) {
        try {
          console.log("Tentando login diretamente na API tradicional...");
          // Chamada à API tradicional
          const apiResponse = await fetch('/api/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Auth-Method': 'traditional',
              'X-Auth-Fallback': 'true'
            },
            body: JSON.stringify({ email, password }),
            credentials: 'include'
          });
          
          if (apiResponse.ok) {
            userData = await apiResponse.json();
            traditionalLoginSuccess = true;
            console.log("Login tradicional bem-sucedido:", userData);
            
            // Se o login tradicional foi bem-sucedido mas o Supabase falhou, tentar login novamente
            if (!supabaseSession) {
              try {
                console.log("Tentando login Supabase novamente após login tradicional bem-sucedido");
                const { data } = await supabase.auth.signInWithPassword({
                  email,
                  password
                });
                
                if (data?.session) {
                  supabaseSession = data.session;
                  setSession(data.session);
                  setUser(data.user);
                  
                  // Armazenar token
                  const token = data.session.access_token;
                  localStorage.setItem('authToken', token);
                  document.cookie = `authToken=${token}; path=/; max-age=86400; SameSite=Lax`;
                  console.log("Login Supabase realizado com sucesso após login tradicional");
                }
              } catch (retryError) {
                console.warn("Retry de login Supabase falhou, mas continuando com login tradicional");
              }
            }
          } else {
            console.error('Login na API tradicional falhou');
          }
        } catch (apiError) {
          console.error('Erro ao fazer login na API tradicional:', apiError);
        }
      }
      
      // PASSO 4: Verificar se a sessão foi estabelecida corretamente
      if (traditionalLoginSuccess || supabaseSession) {
        // Tentar verificar a sessão
        try {
          console.log("Verificando se a sessão foi estabelecida corretamente...");
          const sessionCheck = await fetch('/api/user', {
            method: 'GET',
            credentials: 'include',
            headers: {
              'X-Auth-Verification': 'true',
              'Cache-Control': 'no-cache, no-store',
              'Pragma': 'no-cache'
            }
          });
          
          if (sessionCheck.ok) {
            console.log("Sessão verificada com sucesso!", await sessionCheck.json());
          } else {
            console.warn("Verificação de sessão falhou, status:", sessionCheck.status);
            
            // Se a verificação de sessão falhou, tentamos um último recurso - forçar login direto
            if (traditionalLoginSuccess && userData) {
              try {
                console.log("Tentando sincronização de emergência...");
                await fetch('/api/force-session', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  credentials: 'include',
                  body: JSON.stringify({ 
                    user: userData || (supabaseSession ? supabaseSession.user : {}),
                    email
                  })
                });
              } catch (forceError) {
                console.error("Sincronização de emergência falhou:", forceError);
              }
            }
          }
        } catch (verifyError) {
          console.warn("Erro ao verificar sessão:", verifyError);
        }
        
        // PASSO 5: Retornar resultados para o chamador
        console.log("Autenticação bem-sucedida. Método:", traditionalLoginSuccess ? 
          (supabaseSession ? "Híbrido completo (JWT + Sessão)" : "Tradicional (Sessão)") :
          "Supabase (JWT)");
        
        // Consolidar os dados do usuário
        const consolidatedUser = {
          ...(userData || {}),
          ...(supabaseSession?.user || {}),
          email,
        };
        
        return consolidatedUser;
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
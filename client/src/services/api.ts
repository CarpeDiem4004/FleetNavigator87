import axios from 'axios';

// Cria uma instância do axios com configurações padrões
export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Função para obter o token de acesso atual do Supabase
const getSupabaseToken = async () => {
  try {
    // Importação dinâmica para evitar dependência circular
    const { supabase } = await import('../lib/supabaseClient');
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || null;
  } catch (error) {
    console.error('Erro ao obter token do Supabase:', error);
    return null;
  }
};

// Interceptor para adicionar o token de autenticação em todas as requisições
api.interceptors.request.use(
  async (config) => {
    // Primeiro, tentar obter o token do localStorage
    let token = localStorage.getItem('authToken');
    
    // Se não tiver no localStorage, tenta obter diretamente do Supabase
    if (!token) {
      token = await getSupabaseToken();
      
      // Se conseguiu o token do Supabase, salva no localStorage para futuras requisições
      if (token) {
        localStorage.setItem('authToken', token);
        console.log('[API Interceptor] Token obtido do Supabase e armazenado no localStorage');
      }
    }
    
    // Se tiver token, adiciona ao cabeçalho Authorization
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API Interceptor] Token JWT adicionado à requisição');
    } else {
      console.log('[API Interceptor] Sem token JWT para autenticação');
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Função para tentar recuperar a sessão em caso de erro 401
const trySessionRecovery = async () => {
  try {
    // Importação dinâmica para evitar dependência circular
    const { supabase } = await import('../lib/supabaseClient');
    
    // Verificar se temos uma sessão válida
    const { data } = await supabase.auth.getSession();
    
    if (data?.session) {
      // Tentar ressincronizar a sessão com o backend tradicional
      const token = data.session.access_token;
      localStorage.setItem('authToken', token);
      
      // Chamar endpoint de ressincronização
      await fetch('/api/resync-session-jwt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      
      console.log('[API Recovery] Sessão ressincronizada após erro 401');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('[API Recovery] Erro ao tentar recuperar sessão:', error);
    return false;
  }
};

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Tratamento de erros específicos
    if (error.response) {
      // O servidor respondeu com um status diferente de 2xx
      console.error('Erro na API:', error.response.data);
      
      // Tratamento específico para 401 - Não autenticado
      if (error.response.status === 401) {
        console.log('[API] Erro 401 detectado, tentando recuperar sessão...');
        
        // Tentar recuperar a sessão
        const recovered = await trySessionRecovery();
        
        if (recovered) {
          // Repetir a requisição que falhou
          const originalRequest = error.config;
          
          // Adicionar cabeçalho para evitar loop infinito
          originalRequest._retry = true;
          
          // Atualizar o token
          const token = localStorage.getItem('authToken');
          if (token) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          
          console.log('[API] Sessão recuperada, repetindo requisição original');
          return api(originalRequest);
        } else {
          console.log('[API] Não foi possível recuperar a sessão, redirecionando para login');
          // Redirecionar para login apenas se não estiver já na página de login
          if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/auth')) {
            window.location.href = '/login';
          }
        }
      }
    } else if (error.request) {
      // A requisição foi feita mas não recebeu resposta
      console.error('Erro na requisição:', error.request);
    } else {
      // Algo aconteceu na configuração da requisição que gerou o erro
      console.error('Erro:', error.message);
    }
    
    // Propaga o erro para o tratamento no componente
    return Promise.reject(error);
  }
);
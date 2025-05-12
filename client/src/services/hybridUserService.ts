/**
 * Serviço para gerenciamento de usuários usando a API híbrida
 * Este serviço é independente da autenticação do Supabase e utiliza JWT
 */
import axios from 'axios';

// Criar uma instância do axios configurada
const api = axios.create({
  baseURL: '/api/hybrid'
});

// Interceptor para adicionar o token JWT em todas as requisições
api.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Fazer login e obter token JWT
 */
export const login = async (email: string, password: string) => {
  try {
    console.log('Tentando login híbrido para:', email);
    // Tentar primeiro o endpoint da api híbrida
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success && response.data.token) {
        // Armazenar o token JWT no localStorage
        localStorage.setItem('authToken', response.data.token);
        // Armazenar dados básicos do usuário
        localStorage.setItem('userData', JSON.stringify(response.data.user));
        
        console.log('Login híbrido bem-sucedido para:', email);
        return { success: true, user: response.data.user };
      }
    } catch (hybridError) {
      console.warn('Autenticação híbrida falhou, tentando API tradicional:', hybridError);
    }
    
    // Se falhar, tenta o endpoint tradicional
    try {
      const traditionalResponse = await axios.post('/api/login', { email, password });
      if (traditionalResponse.data && traditionalResponse.data.id) {
        // Armazenar dados básicos do usuário
        localStorage.setItem('userData', JSON.stringify(traditionalResponse.data));
        console.log('Login tradicional bem-sucedido para:', email);
        return { success: true, user: traditionalResponse.data };
      }
    } catch (traditionalError) {
      console.error('Ambos os métodos de autenticação falharam:', traditionalError);
    }
    
    return { success: false, message: 'Falha na autenticação' };
  } catch (error: any) {
    console.error('Erro ao fazer login:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Erro ao processar login'
    };
  }
};

/**
 * Verificar se o token JWT é válido
 */
export const verifyToken = async () => {
  try {
    const response = await api.get('/auth/verify');
    return response.data.success;
  } catch (error) {
    console.error('Token inválido:', error);
    return false;
  }
};

/**
 * Fazer logout
 */
export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');
  
  // Redirecionar para a página de login
  window.location.href = '/login';
};

/**
 * Obter o usuário atual baseado no JWT
 */
export const getCurrentUser = () => {
  const userDataStr = localStorage.getItem('userData');
  if (!userDataStr) {
    return null;
  }
  
  try {
    return JSON.parse(userDataStr);
  } catch (error) {
    console.error('Erro ao obter dados do usuário:', error);
    return null;
  }
};

/**
 * Obter todos os usuários
 */
export const getAllUsers = async () => {
  try {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      return { success: false, message: 'Não autenticado' };
    }
    
    const response = await api.get('/users', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error: any) {
    console.error('Erro ao obter usuários:', error);
    return { 
      success: false, 
      users: [],
      message: error.response?.data?.message || 'Erro ao obter lista de usuários'
    };
  }
};

/**
 * Obter um usuário pelo ID
 */
export const getUserById = async (id: number) => {
  try {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      return { success: false, message: 'Não autenticado' };
    }
    
    const response = await api.get(`/users/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao obter usuário ${id}:`, error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Erro ao obter usuário'
    };
  }
};

/**
 * Criar um novo usuário
 */
export const createUser = async (userData: {
  name: string;
  email: string;
  role: string;
  password?: string;
  baseId?: number | null;
  isActive?: boolean;
}) => {
  try {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      return { success: false, message: 'Não autenticado' };
    }
    
    const response = await api.post('/users', userData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error: any) {
    console.error('Erro ao criar usuário:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Erro ao criar usuário'
    };
  }
};

/**
 * Atualizar um usuário existente
 */
export const updateUser = async (
  id: number, 
  userData: {
    name: string;
    email: string;
    role: string;
    baseId?: number | null;
    isActive?: boolean;
  }
) => {
  try {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      return { success: false, message: 'Não autenticado' };
    }
    
    const response = await api.put(`/api/hybrid/users/${id}`, userData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao atualizar usuário ${id}:`, error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Erro ao atualizar usuário'
    };
  }
};

/**
 * Excluir um usuário (desativação lógica)
 */
export const deleteUser = async (id: number) => {
  try {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      return { success: false, message: 'Não autenticado' };
    }
    
    const response = await api.delete(`/api/hybrid/users/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao excluir usuário ${id}:`, error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Erro ao excluir usuário'
    };
  }
};

/**
 * Alternar o status de um usuário (ativo/inativo)
 */
export const toggleUserStatus = async (id: number, isActive: boolean) => {
  try {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      return { success: false, message: 'Não autenticado' };
    }
    
    const response = await api.patch(`/api/hybrid/users/${id}/status`, { isActive }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao alterar status do usuário ${id}:`, error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Erro ao alterar status do usuário'
    };
  }
};

/**
 * Redefinir a senha de um usuário
 */
export const resetUserPassword = async (id: number, password?: string) => {
  try {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      return { success: false, message: 'Não autenticado' };
    }
    
    const response = await api.post(`/api/hybrid/users/${id}/reset-password`, { password }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao redefinir senha do usuário ${id}:`, error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Erro ao redefinir senha'
    };
  }
};
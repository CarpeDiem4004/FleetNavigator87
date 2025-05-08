import axios from 'axios';

// Cria uma instância do axios com configurações padrões
export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar o token de autenticação em todas as requisições
api.interceptors.request.use(
  (config) => {
    // Obter o token JWT do localStorage
    const token = localStorage.getItem('authToken');
    
    // Se tiver token, adiciona ao cabeçalho Authorization
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Tratamento de erros específicos
    if (error.response) {
      // O servidor respondeu com um status diferente de 2xx
      console.error('Erro na API:', error.response.data);
      
      // Tratamento específico para 401 - Não autenticado
      if (error.response.status === 401) {
        // Opcionalmente, pode redirecionar para a página de login
        // window.location.href = '/auth';
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
# Guia de Integração Rápida - API Externa do Sistema de Gestão de Frotas

Este guia fornece as informações essenciais para integrar seu sistema com a API externa do Sistema de Gestão de Frotas Muricion.

## 1. Pré-requisitos

- Credenciais de acesso (usuário e senha)
- URL base da API (fornecida pela equipe de TI)
- Cliente HTTP para fazer requisições (como Axios, Fetch, etc.)

## 2. Fluxo de Autenticação

### 2.1. Obter Token JWT

```javascript
// Exemplo usando Fetch em JavaScript
const credentials = {
  email: 'seu-usuario@exemplo.com',
  password: 'sua-senha'
};

async function login() {
  const response = await fetch('https://api.muricionfleet.com/api/hybrid/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(credentials)
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Armazenar o token para uso futuro
    localStorage.setItem('jwt_token', data.token);
    return data.token;
  } else {
    throw new Error('Falha na autenticação: ' + data.message);
  }
}
```

### 2.2. Usar o Token em Requisições

```javascript
// Exemplo de função para fazer requisições autenticadas
async function apiRequest(endpoint, method = 'GET', body = null) {
  const token = localStorage.getItem('jwt_token');
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  
  const config = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  };
  
  const response = await fetch(`https://api.muricionfleet.com${endpoint}`, config);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Erro na API: ${errorData.message}`);
  }
  
  return await response.json();
}
```

## 3. Endpoints Principais

### 3.1. Teste de Conectividade

```javascript
// Verificar se a API está online
const ping = await fetch('https://api.muricionfleet.com/api/hybrid/ping');
const pingData = await ping.json();
console.log('API status:', pingData.message);
```

### 3.2. Verificar Token

```javascript
// Verificar se o token JWT ainda é válido
try {
  const verifyResult = await apiRequest('/api/hybrid/auth/verify');
  console.log('Token válido até:', verifyResult.expiresAt);
} catch (error) {
  console.error('Token inválido ou expirado');
  // Redirecionar para login
}
```

### 3.3. Gerenciamento de Usuários

```javascript
// Obter lista de usuários
const users = await apiRequest('/api/hybrid/users');
console.log(`Total de usuários: ${users.count}`);

// Obter usuário específico
const user = await apiRequest(`/api/hybrid/users/123`);
console.log(`Dados do usuário: ${user.user.name}`);

// Criar novo usuário
const newUser = await apiRequest('/api/hybrid/users', 'POST', {
  name: 'Novo Usuário',
  email: 'novo@exemplo.com',
  password: 'senha123',
  role: 'operador',
  baseId: 5
});

// Atualizar usuário
const updatedUser = await apiRequest(`/api/hybrid/users/123`, 'PUT', {
  name: 'Nome Atualizado',
  role: 'gestor'
});

// Redefinir senha
const resetResult = await apiRequest(`/api/hybrid/users/123/reset-password`, 'POST');
// Se gerada automaticamente, a senha estará em resetResult.generatedPassword
```

### 3.4. Gestão de Pneus

```javascript
// Listar pneus
const tires = await apiRequest('/api/hybrid/pneus');

// Obter pneu específico
const tire = await apiRequest(`/api/hybrid/pneus/456`);

// Registrar movimentação
const movementResult = await apiRequest(`/api/hybrid/pneus/456/movimentacao`, 'POST', {
  tipo: 'montagem',
  veiculo: 'ABC1234',
  posicao: 'dianteira-esquerda',
  km: 15000,
  observacao: 'Montagem preventiva'
});
```

## 4. Tratamento de Erros

A API retorna sempre um formato padronizado para erros:

```json
{
  "success": false,
  "message": "Descrição do erro",
  "error": "Detalhes técnicos (quando disponível)"
}
```

Exemplo de tratamento de erros:

```javascript
try {
  const result = await apiRequest('/api/hybrid/users');
  // Processar resultado
} catch (error) {
  if (error.message.includes('401')) {
    // Erro de autenticação
    console.error('Sessão expirada, faça login novamente');
    // Redirecionar para login
  } else if (error.message.includes('403')) {
    // Erro de permissão
    console.error('Sem permissão para acessar este recurso');
  } else {
    // Outros erros
    console.error('Erro ao acessar API:', error.message);
  }
}
```

## 5. Boas Práticas

1. **Armazenamento seguro do token**: Armazene o token JWT em local seguro, como localStorage em aplicações web ou keychain em aplicações móveis.

2. **Renovação automática**: Implemente uma lógica para renovar o token antes que expire, fazendo uma nova requisição de login.

3. **Timeout e retry**: Configure timeouts adequados para as requisições e implemente retentativas para lidar com problemas temporários de conectividade.

4. **Verificação periódica**: Verifique periodicamente se o token ainda é válido usando o endpoint `/api/hybrid/auth/verify`.

5. **Tratamento de concorrência**: Em aplicações com múltiplos usuários, gerencie os tokens de forma isolada para cada sessão.

## 6. Exemplo Completo

```javascript
class MuricionFleetAPI {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('jwt_token');
  }
  
  async login(email, password) {
    const response = await fetch(`${this.baseUrl}/api/hybrid/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      this.token = data.token;
      localStorage.setItem('jwt_token', this.token);
      return data.user;
    } else {
      throw new Error(`Falha no login: ${data.message}`);
    }
  }
  
  async request(endpoint, method = 'GET', body = null) {
    if (!this.token) {
      throw new Error('Não autenticado');
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };
    
    const config = {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    };
    
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, config);
      
      if (response.status === 401) {
        // Token expirado ou inválido
        this.token = null;
        localStorage.removeItem('jwt_token');
        throw new Error('Sessão expirada');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message);
      }
      
      return data;
    } catch (error) {
      console.error('Erro na requisição API:', error);
      throw error;
    }
  }
  
  // Métodos específicos
  async getUsers() {
    return this.request('/api/hybrid/users');
  }
  
  async getUserById(id) {
    return this.request(`/api/hybrid/users/${id}`);
  }
  
  async createUser(userData) {
    return this.request('/api/hybrid/users', 'POST', userData);
  }
  
  async getPneus(filters = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      queryParams.append(key, value);
    });
    
    return this.request(`/api/hybrid/pneus?${queryParams.toString()}`);
  }
  
  async isTokenValid() {
    try {
      const result = await this.request('/api/hybrid/auth/verify');
      return {
        valid: true,
        expiresAt: result.expiresAt
      };
    } catch (error) {
      return { valid: false };
    }
  }
}

// Uso da classe
const api = new MuricionFleetAPI('https://api.muricionfleet.com');

async function exemplo() {
  try {
    // Login
    await api.login('usuario@exemplo.com', 'senha123');
    
    // Verificar token
    const tokenStatus = await api.isTokenValid();
    console.log('Token válido:', tokenStatus.valid);
    
    // Obter usuários
    const users = await api.getUsers();
    console.log('Usuários:', users.count);
    
    // Criar usuário
    const newUser = await api.createUser({
      name: 'Novo Usuário',
      email: 'novo@exemplo.com',
      password: 'senha123',
      role: 'operador'
    });
    console.log('Usuário criado:', newUser.user.id);
    
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

exemplo();
```

## 7. Suporte

Para obter suporte adicional, entre em contato com nossa equipe técnica:

- E-mail: suporte@muricionfleet.com
- Documentação completa: [Link para documentação]
- Repositório de exemplos: [Link para repositório]

---

*Última atualização: 26 de abril de 2025*
# Guia de Integração com API Externa via JWT

Este guia descreve como integrar aplicações externas com a API do sistema Murici On Fleet usando autenticação JWT. Siga os passos abaixo para implementar a autenticação e começar a usar as APIs protegidas.

## Pré-requisitos

- Acesso à URL base do sistema
- Credenciais válidas (email e senha) com permissões adequadas
- Capacidade de fazer solicitações HTTP e processar respostas JSON

## Passo 1: Obter um Token JWT

O primeiro passo é autenticar-se e obter um token JWT que será usado em todas as requisições subsequentes.

### Requisição

```
POST /api/hybrid/auth/login
Content-Type: application/json

{
  "email": "seu_email@exemplo.com",
  "password": "sua_senha"
}
```

### Resposta (sucesso)

```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "user": {
    "id": 123,
    "name": "Nome do Usuário",
    "email": "seu_email@exemplo.com",
    "role": "admin",
    "baseId": null,
    "basename": null,
    "oficinaId": null,
    "isActive": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Resposta (falha)

```json
{
  "success": false,
  "message": "Credenciais inválidas"
}
```

## Passo 2: Usar o Token JWT nas Requisições

Para acessar APIs protegidas, inclua o token JWT no cabeçalho `Authorization` de todas as requisições:

```
GET /api/hybrid/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Passo 3: Verificar a Validade do Token

Para verificar se um token ainda é válido:

### Requisição

```
GET /api/hybrid/auth/verify
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Resposta (token válido)

```json
{
  "success": true,
  "message": "Token válido",
  "user": {
    "id": 123,
    "name": "Nome do Usuário",
    "email": "seu_email@exemplo.com",
    "role": "admin",
    "baseId": null,
    "basename": null,
    "oficinaId": null,
    "isActive": true
  }
}
```

### Resposta (token inválido)

```json
{
  "success": false,
  "message": "Token inválido ou expirado"
}
```

## Passo 4: Gerenciamento do Token

- Os tokens têm duração de 24 horas por padrão
- Armazene o token de forma segura no cliente
- Implemente lógica para obter um novo token quando o atual expirar
- Não compartilhe tokens entre usuários ou aplicações

## APIs Disponíveis

Todas as APIs abaixo requerem autenticação JWT:

### Usuários

- `GET /api/hybrid/users` - Listar todos os usuários
- `GET /api/hybrid/users/:id` - Obter usuário específico
- `POST /api/hybrid/users` - Criar novo usuário
- `PUT /api/hybrid/users/:id` - Atualizar usuário
- `DELETE /api/hybrid/users/:id` - Excluir usuário
- `POST /api/hybrid/users/:id/reset-password` - Redefinir senha

### Pneus

- `GET /api/hybrid/pneus` - Listar todos os pneus
- `GET /api/hybrid/pneus/:id` - Obter pneu específico
- `POST /api/hybrid/pneus` - Criar novo pneu
- `PUT /api/hybrid/pneus/:id` - Atualizar pneu
- `POST /api/hybrid/pneus/:id/movimentacao` - Registrar movimentação
- `GET /api/hybrid/pneus/:id/historico` - Obter histórico de movimentações
- `POST /api/hybrid/pneus/solicitacoes` - Criar solicitação
- `GET /api/hybrid/pneus/solicitacoes` - Listar solicitações

## Tratamento de Erros

### Erros comuns

- **401 Unauthorized**: Token ausente, inválido ou expirado
- **403 Forbidden**: Usuário sem permissão para o recurso
- **404 Not Found**: Recurso não encontrado
- **400 Bad Request**: Dados de entrada inválidos
- **500 Internal Server Error**: Erro interno do servidor

### Exemplo de tratamento

```javascript
async function apiRequest(url, options = {}) {
  const token = localStorage.getItem('authToken');
  
  const requestOptions = {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  
  try {
    const response = await fetch(url, requestOptions);
    
    if (response.status === 401) {
      // Token expirado ou inválido
      // Redirecionar para login ou obter novo token
      return handleAuthError();
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}
```

## Implementação em Diferentes Linguagens

### JavaScript

```javascript
async function login(email, password) {
  const response = await fetch('/api/hybrid/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  if (data.success) {
    localStorage.setItem('authToken', data.token);
    return data.user;
  } else {
    throw new Error(data.message);
  }
}

async function fetchUsers() {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch('/api/hybrid/users', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return await response.json();
}
```

### Python

```python
import requests

def login(email, password):
    response = requests.post(
        'https://seu-dominio.com/api/hybrid/auth/login',
        json={'email': email, 'password': password}
    )
    
    data = response.json()
    
    if data['success']:
        return data['token'], data['user']
    else:
        raise Exception(data['message'])

def fetch_users(token):
    response = requests.get(
        'https://seu-dominio.com/api/hybrid/users',
        headers={'Authorization': f'Bearer {token}'}
    )
    
    return response.json()
```

## Considerações de Segurança

1. Sempre use HTTPS para transmitir tokens JWT
2. Armazene tokens de forma segura no cliente (evite localStorage se possível)
3. Implemente timeout de sessão e renovação de token
4. Use cookies HttpOnly e Secure para aplicações web
5. Não inclua informações sensíveis no payload do JWT

## Depuração

Para diagnosticar problemas com autenticação:

1. Verifique se o token está sendo enviado corretamente no cabeçalho `Authorization`
2. Confirme que o formato do token é `Bearer [token]` (com espaço após "Bearer")
3. Verifique se o token não expirou
4. Use a rota `/api/hybrid/auth/verify` para validar o token
5. Examine as mensagens de erro retornadas pelo servidor

## Suporte

Para questões sobre a API ou problemas de autenticação, entre em contato com o suporte técnico:
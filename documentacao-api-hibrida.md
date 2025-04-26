# Documentação da API Híbrida do Sistema de Gestão de Frotas

Esta documentação descreve a API híbrida do sistema de gestão de frotas, que permite a integração com sistemas externos. A API funciona tanto no ambiente Replit quanto externamente, fornecendo um único ponto de integração para todas as funcionalidades do sistema.

## Visão Geral

A API híbrida é um conjunto de endpoints RESTful que fornecem acesso às principais funcionalidades do sistema, incluindo:

- Autenticação e gerenciamento de usuários
- Gerenciamento de veículos
- Gestão de pneus
- Operações de postos de abastecimento
- Manutenções e checklists

Todos os endpoints da API híbrida utilizam o prefixo `/api/hybrid/` para diferenciar das APIs internas do sistema.

## Autenticação

A API utiliza autenticação baseada em tokens JWT (JSON Web Tokens). Para acessar endpoints protegidos, é necessário:

1. Obter um token de acesso através do endpoint de login
2. Incluir o token em todas as requisições subsequentes no cabeçalho de autorização

### Obtenção do Token (Login)

**Endpoint**: `POST /api/hybrid/auth/login`

**Corpo da Requisição**:
```json
{
  "email": "usuario@exemplo.com",
  "password": "senha"
}
```

**Resposta de Sucesso** (Status 200):
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "user": {
    "id": 123,
    "name": "Nome do Usuário",
    "email": "usuario@exemplo.com",
    "role": "admin"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Verificação do Token

**Endpoint**: `GET /api/hybrid/auth/verify`

**Cabeçalho da Requisição**:
```
Authorization: Bearer <token>
```

**Resposta de Sucesso** (Status 200):
```json
{
  "success": true,
  "message": "Token válido",
  "user": {
    "id": 123,
    "name": "Nome do Usuário",
    "email": "usuario@exemplo.com",
    "role": "admin"
  },
  "verifiedAt": "2025-04-26T12:34:56.789Z",
  "expiresAt": "2025-04-27T12:34:56.789Z"
}
```

### Teste de Conectividade

**Endpoint**: `GET /api/hybrid/ping`

Este endpoint não requer autenticação e pode ser usado para verificar se a API está disponível.

**Resposta de Sucesso** (Status 200):
```json
{
  "success": true,
  "message": "API híbrida está operacional",
  "timestamp": "2025-04-26T12:34:56.789Z",
  "version": "1.0.1"
}
```

## Gerenciamento de Usuários

### Listar Usuários

**Endpoint**: `GET /api/hybrid/users`

**Cabeçalho da Requisição**:
```
Authorization: Bearer <token>
```

**Parâmetros de Query Opcionais**:
- `role`: Filtrar por função (admin, gestor, operador, oficina, pneus, posto)
- `baseId`: Filtrar por ID da base
- `active`: Filtrar por status ativo (true/false)

**Resposta de Sucesso** (Status 200):
```json
{
  "success": true,
  "count": 2,
  "users": [
    {
      "id": 123,
      "name": "Nome do Usuário",
      "email": "usuario@exemplo.com",
      "role": "admin"
    },
    {
      "id": 124,
      "name": "Outro Usuário",
      "email": "outro@exemplo.com",
      "role": "gestor"
    }
  ]
}
```

### Obter Usuário por ID

**Endpoint**: `GET /api/hybrid/users/:id`

**Cabeçalho da Requisição**:
```
Authorization: Bearer <token>
```

**Resposta de Sucesso** (Status 200):
```json
{
  "success": true,
  "user": {
    "id": 123,
    "name": "Nome do Usuário",
    "email": "usuario@exemplo.com",
    "role": "admin"
  }
}
```

### Obter Usuário por Email

**Endpoint**: `GET /api/hybrid/users/email/:email`

**Cabeçalho da Requisição**:
```
Authorization: Bearer <token>
```

**Resposta de Sucesso** (Status 200):
```json
{
  "success": true,
  "user": {
    "id": 123,
    "name": "Nome do Usuário",
    "email": "usuario@exemplo.com",
    "role": "admin"
  }
}
```

### Criar Usuário

**Endpoint**: `POST /api/hybrid/users`

**Cabeçalho da Requisição**:
```
Authorization: Bearer <token>
```

**Corpo da Requisição**:
```json
{
  "name": "Novo Usuário",
  "email": "novo@exemplo.com",
  "password": "senha123",
  "role": "operador",
  "baseId": 5,
  "isActive": true
}
```

**Resposta de Sucesso** (Status 201):
```json
{
  "success": true,
  "message": "Usuário criado com sucesso",
  "user": {
    "id": 125,
    "name": "Novo Usuário",
    "email": "novo@exemplo.com",
    "role": "operador",
    "baseId": 5,
    "isActive": true
  }
}
```

### Atualizar Usuário

**Endpoint**: `PUT /api/hybrid/users/:id`

**Cabeçalho da Requisição**:
```
Authorization: Bearer <token>
```

**Corpo da Requisição**:
```json
{
  "name": "Nome Atualizado",
  "email": "atualizado@exemplo.com",
  "role": "gestor",
  "baseId": 7,
  "isActive": true
}
```

**Resposta de Sucesso** (Status 200):
```json
{
  "success": true,
  "message": "Usuário atualizado com sucesso",
  "user": {
    "id": 123,
    "name": "Nome Atualizado",
    "email": "atualizado@exemplo.com",
    "role": "gestor",
    "baseId": 7,
    "isActive": true
  }
}
```

### Redefinir Senha de Usuário

**Endpoint**: `POST /api/hybrid/users/:id/reset-password`

**Cabeçalho da Requisição**:
```
Authorization: Bearer <token>
```

**Corpo da Requisição** (opcional - se não fornecido, gera uma senha aleatória):
```json
{
  "password": "novaSenha123"
}
```

**Resposta de Sucesso** (Status 200):
```json
{
  "success": true,
  "message": "Senha redefinida com sucesso",
  "generatedPassword": "JkL8!pQr2$"  // Apenas se a senha foi gerada automaticamente
}
```

### Excluir Usuário

**Endpoint**: `DELETE /api/hybrid/users/:id`

**Cabeçalho da Requisição**:
```
Authorization: Bearer <token>
```

**Resposta de Sucesso** (Status 200):
```json
{
  "success": true,
  "message": "Usuário excluído com sucesso"
}
```

## Gestão de Pneus

### Listar Pneus

**Endpoint**: `GET /api/hybrid/pneus`

**Cabeçalho da Requisição**:
```
Authorization: Bearer <token>
```

**Parâmetros de Query Opcionais**:
- `status`: Filtrar por status do pneu
- `marca`: Filtrar por marca
- `baseId`: Filtrar por ID da base

### Obter Pneu por ID

**Endpoint**: `GET /api/hybrid/pneus/:id`

**Cabeçalho da Requisição**:
```
Authorization: Bearer <token>
```

### Criar Novo Pneu

**Endpoint**: `POST /api/hybrid/pneus`

**Cabeçalho da Requisição**:
```
Authorization: Bearer <token>
```

### Atualizar Pneu

**Endpoint**: `PUT /api/hybrid/pneus/:id`

**Cabeçalho da Requisição**:
```
Authorization: Bearer <token>
```

### Registrar Movimentação de Pneu

**Endpoint**: `POST /api/hybrid/pneus/:id/movimentacao`

**Cabeçalho da Requisição**:
```
Authorization: Bearer <token>
```

### Obter Histórico de Movimentações

**Endpoint**: `GET /api/hybrid/pneus/:id/historico`

**Cabeçalho da Requisição**:
```
Authorization: Bearer <token>
```

## Códigos de Status

A API utiliza os seguintes códigos de status HTTP:

- `200 OK`: Requisição bem-sucedida
- `201 Created`: Recurso criado com sucesso
- `400 Bad Request`: Erro na requisição (dados inválidos)
- `401 Unauthorized`: Autenticação necessária ou token inválido
- `403 Forbidden`: Permissões insuficientes para acessar o recurso
- `404 Not Found`: Recurso não encontrado
- `500 Internal Server Error`: Erro interno do servidor

## Testando a API

Incluímos um script de teste para verificar a conectividade e funcionamento da API híbrida. Para executar o teste:

```bash
node test-hybrid-auth-api.js [URL_DA_API]
```

O script realizará os seguintes testes:
1. Teste de ping para verificar conectividade
2. Teste de login para obter um token JWT
3. Teste de verificação do token
4. Teste de acesso a rotas protegidas usando o token

Se todos os testes passarem, sua conexão com a API está funcionando corretamente.

## Observações Importantes

1. Os tokens JWT expiram após 24 horas. É necessário obter um novo token após esse período.
2. Todas as requisições para endpoints protegidos devem incluir o token no cabeçalho de autorização.
3. As respostas da API incluem um campo `success` (boolean) que indica se a operação foi bem-sucedida.
4. Em caso de erro, o campo `message` contém uma descrição do problema.

---

Para suporte ou dúvidas adicionais, entre em contato com a equipe de desenvolvimento.
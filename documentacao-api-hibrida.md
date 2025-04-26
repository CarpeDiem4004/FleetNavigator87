# Documentação da API Híbrida de Usuários

Esta API permite o gerenciamento de usuários e funciona tanto no ambiente Replit quanto em ambientes externos, conectando-se automaticamente ao PostgreSQL ou Supabase conforme necessário.

## Arquitetura

A API híbrida foi projetada em três camadas:

1. **Camada de API** (`hybrid-user-api.js`): Fornece endpoints RESTful para operações de usuário
2. **Camada de Serviço** (`hybrid-user-service.js`): Abstrai a lógica de acesso aos dados, detectando automaticamente o ambiente
3. **Camada de Dados**: Utiliza PostgreSQL direto (no Replit) ou Supabase (em ambientes externos)

## Endpoints Disponíveis

### Criar Usuário
- **URL**: `/api/hybrid/users`
- **Método**: `POST`
- **Corpo da Requisição**:
  ```json
  {
    "name": "Nome do Usuário",
    "email": "usuario@exemplo.com",
    "role": "gestor",
    "baseId": 1,
    "isActive": true,
    "password": "senha123"
  }
  ```
  > Nota: Se `password` não for fornecido, uma senha aleatória será gerada
  
- **Resposta de Sucesso**:
  ```json
  {
    "success": true,
    "message": "Usuário criado com sucesso",
    "user": {
      "id": 1,
      "name": "Nome do Usuário",
      "email": "usuario@exemplo.com",
      "role": "gestor",
      "baseId": 1,
      "isActive": true
    },
    "generatedPassword": "senha-gerada"
  }
  ```

### Obter Usuário por ID
- **URL**: `/api/hybrid/users/:id`
- **Método**: `GET`
- **Resposta de Sucesso**:
  ```json
  {
    "success": true,
    "user": {
      "id": 1,
      "name": "Nome do Usuário",
      "email": "usuario@exemplo.com",
      "role": "gestor",
      "baseId": 1,
      "isActive": true
    }
  }
  ```

### Obter Usuário por Email
- **URL**: `/api/hybrid/users/email/:email`
- **Método**: `GET`
- **Resposta de Sucesso**:
  ```json
  {
    "success": true,
    "user": {
      "id": 1,
      "name": "Nome do Usuário",
      "email": "usuario@exemplo.com",
      "role": "gestor",
      "baseId": 1,
      "isActive": true
    }
  }
  ```

### Listar Usuários
- **URL**: `/api/hybrid/users`
- **Método**: `GET`
- **Parâmetros de Query (opcionais)**:
  - `role`: Filtrar por papel (admin, gestor, operador, etc.)
  - `baseId`: Filtrar por ID da base
  - `active`: Filtrar por status ativo (true/false)
- **Resposta de Sucesso**:
  ```json
  {
    "success": true,
    "count": 2,
    "users": [
      {
        "id": 1,
        "name": "Nome do Usuário 1",
        "email": "usuario1@exemplo.com",
        "role": "gestor",
        "baseId": 1,
        "isActive": true
      },
      {
        "id": 2,
        "name": "Nome do Usuário 2",
        "email": "usuario2@exemplo.com",
        "role": "operador",
        "baseId": 1,
        "isActive": true
      }
    ]
  }
  ```

### Atualizar Usuário
- **URL**: `/api/hybrid/users/:id`
- **Método**: `PUT`
- **Corpo da Requisição**:
  ```json
  {
    "name": "Nome Atualizado",
    "email": "novo-email@exemplo.com",
    "role": "gestor",
    "baseId": 2,
    "isActive": true
  }
  ```
- **Resposta de Sucesso**:
  ```json
  {
    "success": true,
    "message": "Usuário atualizado com sucesso",
    "user": {
      "id": 1,
      "name": "Nome Atualizado",
      "email": "novo-email@exemplo.com",
      "role": "gestor",
      "baseId": 2,
      "isActive": true
    }
  }
  ```

### Redefinir Senha de Usuário
- **URL**: `/api/hybrid/users/:id/reset-password`
- **Método**: `POST`
- **Corpo da Requisição**:
  ```json
  {
    "password": "nova-senha-123"
  }
  ```
  > Nota: Se `password` não for fornecido, uma senha aleatória será gerada
- **Resposta de Sucesso**:
  ```json
  {
    "success": true,
    "message": "Senha redefinida com sucesso",
    "generatedPassword": "senha-aleatoria-gerada"
  }
  ```

### Excluir Usuário
- **URL**: `/api/hybrid/users/:id`
- **Método**: `DELETE`
- **Resposta de Sucesso**:
  ```json
  {
    "success": true,
    "message": "Usuário excluído com sucesso"
  }
  ```

### Autenticação (Login)
- **URL**: `/api/hybrid/auth/login`
- **Método**: `POST`
- **Corpo da Requisição**:
  ```json
  {
    "email": "usuario@exemplo.com",
    "password": "senha123"
  }
  ```
- **Resposta de Sucesso**:
  ```json
  {
    "success": true,
    "message": "Login realizado com sucesso",
    "user": {
      "id": 1,
      "name": "Nome do Usuário",
      "email": "usuario@exemplo.com",
      "role": "gestor",
      "baseId": 1,
      "isActive": true
    },
    "token": "Bearer eyJhbGciOiJIUzI1..."
  }
  ```

## Valores Válidos para o Campo 'role'

O campo `role` aceita apenas os seguintes valores:
- `admin`: Administrador do sistema
- `gestor`: Gestor de frota ou setor
- `operador`: Operador básico do sistema
- `oficina`: Usuário de oficina parceira
- `pneus`: Gestor de pneus
- `posto`: Operador de posto de combustível

## Códigos de Erro

- **400 Bad Request**: Requisição inválida ou campos obrigatórios ausentes
- **401 Unauthorized**: Credenciais inválidas (autenticação)
- **404 Not Found**: Recurso não encontrado (usuário não existe)
- **500 Internal Server Error**: Erro interno do servidor

## Integração em Aplicações

### No ambiente Replit

A API funciona automaticamente com o PostgreSQL local via `DATABASE_URL`.

### Em ambientes externos

Para usar a API em ambientes externos, configure as seguintes variáveis de ambiente:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
VITE_SUPABASE_SERVICE_KEY=sua-chave-de-servico
```

## Exemplo de Uso em JavaScript

```javascript
// Exemplo de cadastro de usuário
async function cadastrarUsuario() {
  const response = await fetch('http://seuservidor.com/api/hybrid/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Novo Usuário',
      email: 'novo@exemplo.com',
      role: 'operador'
    })
  });
  
  const resultado = await response.json();
  console.log('Usuário cadastrado:', resultado);
  
  // Guardar a senha gerada para o primeiro acesso
  if (resultado.generatedPassword) {
    console.log('Senha inicial:', resultado.generatedPassword);
  }
}
```
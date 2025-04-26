# Documentação de Autenticação Híbrida JWT/Session

Este documento descreve o sistema de autenticação híbrido implementado na plataforma, que suporta tanto autenticação por sessão (para uso dentro do ambiente Replit) quanto autenticação JWT (para acesso a APIs de fora do ambiente Replit).

## Visão Geral

O sistema de autenticação híbrido foi projetado com os seguintes objetivos:

1. Permitir que os usuários se autentiquem na interface web através de sessão convencional
2. Permitir que sistemas externos consumam as APIs através de autenticação JWT
3. Manter a compatibilidade entre os ambientes Replit e Supabase
4. Garantir segurança contra ataques comuns (timing attacks, etc.)

## Autenticação JWT

### Fluxo de Autenticação JWT

1. O cliente faz uma requisição POST para `/api/hybrid/auth/login` com:
   ```json
   {
     "email": "usuario@exemplo.com",
     "password": "senha_do_usuario"
   }
   ```

2. O servidor valida as credenciais e, se corretas, retorna:
   ```json
   {
     "success": true,
     "message": "Login realizado com sucesso",
     "user": {
       "id": 123,
       "name": "Nome do Usuário",
       "email": "usuario@exemplo.com",
       "role": "admin",
       "baseId": null,
       "basename": null,
       "oficinaId": null,
       "isActive": true
     },
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   }
   ```

3. O cliente deve armazenar o token JWT e incluí-lo no cabeçalho de todas as requisições subsequentes:
   ```
   Authorization: Bearer [token]
   ```

4. O token tem validade de 24 horas por padrão, após o qual o cliente precisa obter um novo token.

### Verificação de Token

Para verificar se um token JWT é válido:

- Requisição GET para `/api/hybrid/auth/verify` incluindo o token no cabeçalho
- Resposta:
  ```json
  {
    "success": true,
    "message": "Token válido",
    "user": {
      "id": 123,
      "name": "Nome do Usuário",
      "email": "usuario@exemplo.com",
      "role": "admin",
      "baseId": null,
      "basename": null,
      "oficinaId": null,
      "isActive": true
    }
  }
  ```

### Segurança

O sistema implementa as seguintes medidas de segurança:

1. Hash seguro de senhas usando scrypt com salt único para cada usuário
2. Proteção contra timing attacks usando a função timingSafeEqual para comparação de senhas
3. Tokens JWT assinados com chave secreta
4. Validação do usuário no banco de dados a cada requisição, além da validação do token
5. Tempo de expiração configurável para os tokens

### Exemplo de Uso (JavaScript)

```javascript
// Autenticação
async function login(email, password) {
  const response = await fetch('/api/hybrid/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Armazenar token para uso em requisições futuras
    localStorage.setItem('authToken', data.token);
    return data.user;
  } else {
    throw new Error(data.message);
  }
}

// Requisição autenticada a uma API
async function fetchProtectedResource(url) {
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    throw new Error('Não autenticado');
  }
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
}
```

## Autenticação por Sessão

A autenticação por sessão continua funcionando normalmente para o acesso via navegador dentro do ambiente Replit. Esta autenticação utiliza cookies de sessão e é gerenciada pelo Express Session com armazenamento PostgreSQL.

## Compatibilidade entre Ambientes

O serviço híbrido de usuário (`HybridUserService`) é projetado para funcionar tanto no ambiente Replit quanto externamente usando o Supabase. As credenciais são validadas da mesma forma em ambos os ambientes, garantindo consistência independentemente de onde o sistema é acessado.

## Considerações Técnicas

- O tempo de expiração do token JWT pode ser configurado através da variável de ambiente `JWT_EXPIRES_IN`
- A chave de assinatura para os tokens JWT pode ser definida na variável de ambiente `JWT_SECRET`
- A autenticação por sessão utiliza a sessão Express configurada no ambiente Replit
- O sistema de autenticação híbrido é implementado nos arquivos:
  - `hybrid-user-service.js` - Serviço principal
  - `hybrid-user-api.js` - Rotas de API com autenticação JWT

## Restrições e Boas Práticas

1. Não armazene o token JWT em cookies sem proteções adicionais
2. Tokens JWT devem ser transmitidos apenas sobre HTTPS
3. Implemente renovação de token antes da expiração para evitar interrupções
4. Atualize regularmente a chave secreta (JWT_SECRET) para melhorar a segurança
5. Considere implementar uma lista de tokens revogados se necessário (não implementado atualmente)
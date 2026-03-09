# Documentação do Sistema de Autenticação Híbrida

Esta documentação técnica descreve o sistema de autenticação híbrida implementado no Sistema de Gestão de Frotas. O sistema é chamado "híbrido" porque oferece duas formas de autenticação que funcionam em conjunto: autenticação baseada em sessão para o ambiente Replit e autenticação baseada em JWT para acesso via API externa.

## Visão Geral da Arquitetura

O sistema de autenticação híbrida consiste nos seguintes componentes:

1. **Serviço de Usuário Híbrido**: Gerencia operações de usuário independente do ambiente (Replit ou externo)
2. **Middleware de Autenticação JWT**: Verifica tokens JWT para rotas protegidas da API
3. **Contexto de Autenticação no Frontend**: Gerencia o estado de autenticação no frontend
4. **Cliente de Consulta**: Adiciona tokens JWT para chamadas de API quando disponíveis

## Fluxos de Autenticação

### 1. Autenticação Baseada em Sessão (Ambiente Replit)

- **Login**: 
  - Usuário envia credenciais para `/api/login`
  - Passport.js verifica as credenciais e cria uma sessão
  - As informações do usuário são serializadas na sessão
  - Um cookie de sessão é enviado ao cliente

- **Requisições Autenticadas**:
  - O cliente envia o cookie de sessão automaticamente
  - Express-session e Passport.js desserializam o usuário
  - `req.user` contém os dados do usuário autenticado
  - `req.isAuthenticated()` retorna `true`

- **Logout**:
  - Usuário acessa `/api/logout`
  - Passport.js destrói a sessão
  - Usuário é redirecionado para a página inicial

### 2. Autenticação JWT (API Externa)

- **Login**:
  - Cliente envia credenciais para `/api/hybrid/auth/login`
  - Sistema verifica as credenciais e gera um token JWT
  - O token é retornado ao cliente junto com dados do usuário

- **Requisições Autenticadas**:
  - Cliente inclui o token no cabeçalho de autorização: `Authorization: Bearer <token>`
  - Middleware `verifyJwtAuth` verifica o token
  - Se válido, `req.user` é populado com dados do usuário

- **Verificação do Token**:
  - Cliente pode verificar o token via `/api/hybrid/auth/verify`
  - Endpoint retorna dados do usuário e informações sobre o token

## Implementação Detalhada

### Serviço de Usuário Híbrido (HybridUserService)

A classe `HybridUserService` fornece uma API unificada para operações de usuário, independente do ambiente:

```javascript
class HybridUserService {
  // Inicializa conexões com PostgreSQL e Supabase
  initConnections() { /* ... */ }
  
  // Operações de usuário
  async getUserByEmail(email) { /* ... */ }
  async getUserById(id) { /* ... */ }
  async createUser(userData) { /* ... */ }
  async updateUser(id, userData) { /* ... */ }
  async deleteUser(id) { /* ... */ }
  async resetPassword(id, newPassword) { /* ... */ }
  async listUsers(filters) { /* ... */ }
  
  // Operações de hash de senha
  async hashPassword(password) { /* ... */ }
  async comparePasswords(supplied, stored) { /* ... */ }
  
  // Operações de autenticação JWT
  async authenticateUser(email, password) { /* ... */ }
  generateToken(user) { /* ... */ }
  async verifyToken(token, includeTokenInfo) { /* ... */ }
}
```

### Middleware de Autenticação JWT

O middleware `verifyJwtAuth` verifica tokens JWT para rotas protegidas:

```javascript
const verifyJwtAuth = async (req, res, next) => {
  try {
    // Extrair token do cabeçalho de autorização
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Token não fornecido' });
    
    // Verificar formato do token
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ message: 'Formato de token inválido' });
    }
    
    const token = parts[1];
    
    // Verificar token com o serviço de usuário
    const verificationResult = await userService.verifyToken(token, true);
    if (!verificationResult) {
      return res.status(401).json({ message: 'Token inválido ou expirado' });
    }
    
    // Adicionar usuário ao objeto de requisição
    req.user = verificationResult.user;
    if (verificationResult.tokenInfo) {
      req.tokenExpiration = new Date(verificationResult.tokenInfo.exp * 1000).toISOString();
    }
    
    next();
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    return res.status(401).json({ message: 'Erro ao verificar autenticação' });
  }
};
```

### Contexto de Autenticação no Frontend

O contexto de autenticação (`AuthContext`) gerencia o estado de autenticação no frontend:

```typescript
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, name: string) => Promise<User>;
  logout: () => Promise<void>;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Verificar autenticação ao iniciar
  useEffect(() => {
    async function checkAuth() {
      try {
        // Verificar sessão tradicional
        const sessionRes = await fetch('/api/user');
        
        if (sessionRes.ok) {
          const userData = await sessionRes.json();
          setUser(userData);
          return;
        }
        
        // Verificar token JWT armazenado
        const token = localStorage.getItem('jwt_token');
        if (token) {
          try {
            const verifyRes = await fetch('/api/hybrid/auth/verify', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (verifyRes.ok) {
              const { user: tokenUser } = await verifyRes.json();
              setUser(tokenUser);
              return;
            } else {
              // Token inválido, limpar
              localStorage.removeItem('jwt_token');
            }
          } catch (error) {
            console.error('Erro ao verificar token JWT:', error);
          }
        }
        
        setUser(null);
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkAuth();
  }, []);
  
  // Função de login
  const login = async (email: string, password: string) => {
    // Primeiro tenta login tradicional
    try {
      const sessionRes = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (sessionRes.ok) {
        const userData = await sessionRes.json();
        setUser(userData);
        return userData;
      }
    } catch (error) {
      console.error('Erro no login tradicional:', error);
    }
    
    // Fallback para login JWT
    const jwtRes = await fetch('/api/hybrid/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!jwtRes.ok) {
      throw new Error('Credenciais inválidas');
    }
    
    const authData = await jwtRes.json();
    localStorage.setItem('jwt_token', authData.token);
    setUser(authData.user);
    return authData.user;
  };
  
  // Função de logout
  const logout = async () => {
    try {
      // Primeiro tenta logout tradicional
      await fetch('/api/logout');
    } catch (error) {
      console.error('Erro no logout tradicional:', error);
    }
    
    // Limpar token JWT
    localStorage.removeItem('jwt_token');
    setUser(null);
  };
  
  // Demais funções do contexto...
  
  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Cliente de Consulta

O cliente de consulta (`queryClient`) adiciona o token JWT nos cabeçalhos das requisições:

```typescript
export async function apiRequest(
  method: string,
  endpoint: string,
  body?: object,
) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Adicionar token JWT se disponível
  const token = localStorage.getItem('jwt_token');
  if (token) {
    console.log(`[apiRequest] Usando token JWT: ${token.substring(0, 10)}...`);
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    console.log(`[apiRequest] Sem token JWT disponível para a requisição: ${endpoint}`);
  }
  
  const requestConfig: RequestInit = {
    method,
    headers,
    credentials: 'include', // Para cookies de sessão
    body: body ? JSON.stringify(body) : undefined,
  };
  
  // Fazer requisição
  const response = await fetch(endpoint, requestConfig);
  await throwIfResNotOk(response);
  return response;
}
```

## Geração e Verificação de Token JWT

### Geração de Token

Tokens JWT são gerados com as seguintes características:

```javascript
generateToken(user) {
  const payload = {
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN // Padrão: '24h'
  });
}
```

### Verificação de Token

A verificação do token inclui:

1. Decodificação do token JWT
2. Busca do usuário no banco de dados
3. Verificação se o usuário está ativo
4. Retorno dos dados do usuário (sem a senha)

```javascript
async verifyToken(token, includeTokenInfo = false) {
  try {
    // Verificar e decodificar o token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Buscar usuário no banco
    const userId = decoded.sub;
    const user = await this.getUserById(userId);
    
    if (!user) return null;
    
    // Verificar se está ativo (suporta is_active ou isActive)
    const isActive = user.isActive === undefined ? user.is_active : user.isActive;
    if (isActive === false) return null;
    
    // Retornar dados do usuário
    const { password: _, ...userWithoutPassword } = user;
    
    if (includeTokenInfo) {
      return {
        user: userWithoutPassword,
        tokenInfo: {
          sub: decoded.sub,
          iat: decoded.iat,
          exp: decoded.exp,
        }
      };
    }
    
    return userWithoutPassword;
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    return null;
  }
}
```

## Configuração do Sistema

O sistema utiliza as seguintes variáveis de ambiente:

- `JWT_SECRET`: Chave secreta para assinar tokens JWT (requisito de segurança crítico)
- `JWT_EXPIRES_IN`: Tempo de expiração dos tokens (padrão: '24h')
- `SESSION_SECRET`: Chave secreta para assinar cookies de sessão

## Observações e Resolução de Problemas

### Campos com Nomenclatura Diferente

O sistema está preparado para lidar com diferenças de nomenclatura entre ambientes:

- O campo de status ativo pode ser chamado `isActive` ou `is_active`
- O sistema verifica ambas as formas durante a verificação do token

### Detecção de Ambiente

O sistema detecta automaticamente o ambiente e utiliza as conexões apropriadas:

```javascript
initConnections() {
  // Inicializar conexão PostgreSQL
  this.pgClient = new Pool({ 
    connectionString: process.env.DATABASE_URL 
  });
  
  // Inicializar conexão Supabase
  if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_SERVICE_KEY) {
    this.supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_SERVICE_KEY,
      {
        auth: { persistSession: false }
      }
    );
  }
}
```

### Estratégia de Fallback

O sistema tenta prioritariamente usar a conexão direta com PostgreSQL, e caso falhe, utiliza o Supabase como fallback:

```javascript
async getUserById(id) {
  try {
    // Primeiro tentar PostgreSQL direto
    const query = 'SELECT * FROM users WHERE id = $1';
    const { rows } = await this.pgClient.query(query, [id]);
    if (rows.length) return this.mapDbUserToObject(rows[0]);
    
    // Fallback para Supabase se disponível
    if (this.supabase) {
      const { data } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      if (data) return this.mapDbUserToObject(data);
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao buscar usuário por ID:', error);
    
    // Se falhou com PostgreSQL, tentar Supabase como fallback
    if (this.supabase) {
      try {
        const { data } = await this.supabase
          .from('users')
          .select('*')
          .eq('id', id)
          .single();
        if (data) return this.mapDbUserToObject(data);
      } catch (supabaseError) {
        console.error('Erro no fallback Supabase:', supabaseError);
      }
    }
    
    throw error;
  }
}
```

## Teste da Autenticação Híbrida

Para testar a autenticação híbrida, use o script `test-hybrid-auth-api.js` incluído no sistema:

```bash
node test-hybrid-auth-api.js [URL_DA_API]
```

Este script testa:
1. Conectividade com a API
2. Login e obtenção de token JWT
3. Verificação do token
4. Acesso a rotas protegidas

---

## Resolução de Problemas Comuns

### Token não é aceito

Se o token JWT não estiver sendo aceito:

1. Verifique se o token está sendo enviado corretamente no formato `Bearer <token>`
2. Verifique se o token não expirou (tempo padrão: 24 horas)
3. Verifique se o usuário existe e está ativo no banco de dados
4. Verifique logs do servidor para mensagens específicas

### Erros de CORS

Se estiver recebendo erros de CORS ao acessar a API externamente:

1. Verifique se o servidor tem o middleware CORS configurado corretamente
2. Certifique-se de que a origem da requisição está na lista de origens permitidas

### Erro "Token inválido ou expirado"

Este erro pode ocorrer por vários motivos:

1. O token realmente expirou (verifique a data de expiração)
2. A assinatura do token é inválida (chave JWT_SECRET diferente)
3. O usuário foi desativado após a emissão do token
4. O usuário foi excluído após a emissão do token

Para diagnóstico detalhado, habilite o modo de depuração no sistema que fornecerá informações adicionais sobre a falha na verificação do token.

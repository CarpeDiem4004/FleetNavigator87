# Documentação de Autenticação Híbrida

**Atualizado: 24/04/2025** - Adicionadas funções utilitárias para melhorar a manutenibilidade do código

## Visão Geral

O sistema implementa uma estratégia de autenticação híbrida que suporta dois métodos de autenticação:

1. **Autenticação por Sessão (Express Session)**: Usada principalmente dentro do ambiente Replit, onde o mesmo servidor gerencia tanto o frontend quanto o backend.
2. **Autenticação por Token JWT (Supabase)**: Usada principalmente para acesso à API de fora do ambiente Replit, como em aplicativos móveis ou quando o frontend é hospedado em outro servidor.

Esta abordagem híbrida resolve problemas de autenticação em diferentes ambientes e proporciona maior flexibilidade.

## Estrutura de Middleware

### Middleware Principal de Autenticação

O middleware `isAuthenticated` em `server/middleware/auth.ts` verifica:

1. Primeiro se o usuário está autenticado via sessão Express (`req.isAuthenticated()`)
2. Se não estiver, verifica se há um token JWT válido no cabeçalho `Authorization`
3. Se algum dos métodos for válido, permite acesso; caso contrário, retorna erro 401

```typescript
export const isAuthenticated = async (req, res, next) => {
  // Verifica sessão Express
  if (req.isAuthenticated()) {
    return next();
  }
  
  // Verifica token JWT
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Não autenticado" });
  }
  
  // Validação de token via Supabase
  try {
    // Código de validação de token JWT...
    // Se válido, anexa usuário a req.supabaseUser
    (req as any).supabaseUser = user;
    return next();
  } catch (error) {
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};
```

### Middlewares de Autorização

Todos os middlewares de autorização (isAdmin, hasMaintenanceAccess, etc.) foram atualizados para verificar tanto `req.user` (sessão) quanto `req.supabaseUser` (JWT):

```typescript
export const isAdmin = (req, res, next) => {
  // Verificar autenticação primeiro
  if (!req.isAuthenticated() && !(req as any).supabaseUser) {
    return res.status(401).json({ message: "Usuário não autenticado" });
  }
  
  const user = req.user || (req as any).supabaseUser;
  if (user && isUserAdmin(user)) {
    return next();
  }
  
  // Acesso negado...
};
```

## Como Funciona

1. **Usuário acessa via navegador no Replit**: Usa autenticação por sessão naturalmente
2. **Usuário acessa via aplicativo externo**: Envia token JWT no cabeçalho Authorization
3. **Middleware verifica ambos**: Tenta sessão primeiro, depois JWT se necessário
4. **Autorização uniforme**: Todos os middlewares usam o objeto `user` de qualquer origem

## Vantagens

1. **Compatibilidade**: Mantém compatibilidade com código existente que usa `req.user`
2. **Flexibilidade**: Suporta vários cenários de autenticação
3. **Segurança**: Verifica corretamente credenciais em ambos os métodos
4. **Experiência do usuário**: Permite acesso fluido ao sistema, independentemente da origem

## Logs e Monitoramento

O sistema registra tentativas de acesso não autenticadas com detalhes úteis para debugging:

```
Tentativa de acesso não autenticado a /api/user {
  hasSession: true,
  sessionID: '9zEeoiuuGIJPYfKwxNIkxsS2Zbt1y55A',
  cookies: undefined,
  origin: undefined,
  referer: undefined,
  userAgent: 'node-fetch'
}
```

## Alterações em Tipo de Veículo

Além da autenticação híbrida, também foram realizadas mudanças para refinar a terminologia dos tipos de veículo:

- "Frota Própria" agora é chamado simplesmente de "Frota"
- "Terceirizado" agora é chamado de "Agregado"

Estas alterações foram implementadas tanto no frontend quanto no backend para consistência.
# Documentação da Autenticação Unificada

## Visão Geral

Este documento descreve a implementação do sistema de autenticação unificada do Sistema de Gestão de Frotas Murici Onfleet. O objetivo foi padronizar os mecanismos de autenticação entre os diferentes módulos do sistema, permitindo uma experiência de autenticação consistente entre o sistema principal no Replit e o acesso externo via domínio personalizado.

## Estratégias de Autenticação

O middleware de autenticação unificada implementa 4 estratégias de autenticação, verificadas na seguinte ordem:

1. **Sessão Express tradicional**: Verifica se o usuário já está autenticado via `req.isAuthenticated()`
2. **Tokens JWT**: Obtidos de diferentes fontes:
   - Header `Authorization` com formato Bearer
   - Cookie `authToken`
   - Cookie `supabase-auth-token`
3. **Sessão alternativa**: Verifica se há dados de usuário armazenados em `req.session.user`
4. **Validação Supabase**: Verifica o token diretamente com a API do Supabase

## Middleware Disponíveis

Foram implementados 4 middleware principais:

1. **unifiedAuthMiddleware**: Implementa a verificação de autenticação usando as estratégias acima
2. **adminRoleMiddleware**: Verifica se o usuário autenticado tem role `admin`
3. **pneusAccessMiddleware**: Verifica se o usuário tem acesso ao módulo de pneus
4. **requireRoles(roles)**: Middleware factory que cria um middleware verificando se o usuário tem uma das roles especificadas

## Como Usar

### Autenticação Básica

```javascript
router.get('/rota-protegida', unifiedAuthMiddleware, (req, res) => {
  // O req.user estará disponível se a autenticação foi bem-sucedida
  res.json({ user: req.user });
});
```

### Verificação de Role Admin

```javascript
router.post('/rota-admin', unifiedAuthMiddleware, adminRoleMiddleware, (req, res) => {
  // Esta rota só será acessível para administradores
  res.json({ success: true });
});
```

### Verificação de Múltiplas Roles

```javascript
router.get('/rota-gestor', unifiedAuthMiddleware, requireRoles(['admin', 'gestor']), (req, res) => {
  // Esta rota só será acessível para usuários com role admin ou gestor
  res.json({ success: true });
});
```

## Integração com Acesso Externo

Para rotas que precisam ser acessíveis externamente (como pelo domínio `gestaoonfleet.com.br`):

```javascript
router.get('/', async (req, res) => {
  // Tenta autenticar, mas não impede acesso se falhar
  try {
    await unifiedAuthMiddleware(req, res, () => {});
  } catch (error) {
    console.log('Acesso não autenticado permitido');
  }
  
  // Lógica da rota continua normalmente
  res.json({ message: 'Acesso público' });
});
```

## Progresso da Implementação

A seguir está o status de implementação do middleware unificado nos diferentes módulos:

### Módulos Completamente Migrados

- ✅ **Módulo de Usuários** (hybrid-user-api.js): 8/8 rotas
- ✅ **Módulo de Pneus** (hybrid-pneus-api.js): 8/8 rotas
- ✅ **Módulo de Postos** (postoSupabaseRoutes.js): 5/5 rotas
- ✅ **Módulo de Pátio** (patioRoutes.ts): 2/2 rotas
- ✅ **Módulo de Histórico Consolidado** (historicoConsolidadoRoutes.ts): 2/2 rotas
- ✅ **Módulo de Acesso Externo** (postosExternalRoutes.ts): 2/2 rotas
- ✅ **Módulo de Bases** (hybrid-bases-api.js): 2/2 rotas

### Próximos Módulos Para Migração

- ⬜ Módulo de Mapeamento de Postos (postosMapeamentoRoutes.ts)
- ⬜ Módulo de Preços de Combustível (precosCombustivelRoutes.ts)
- ⬜ Módulo de Recebimentos e Movimentações (recebimentosMovimentacoesRoutes.ts)
- ⬜ Módulo de Diagnósticos (diagnosticoRoutes.ts)
- ⬜ Módulo de Usuários Supabase (usuariosSupabaseRoutes.ts)

## Geração de Tokens JWT

Para gerar tokens JWT para autenticação externa, utilize a função:

```javascript
import { generateToken } from './server/utils/auth-utils.js';

const token = generateToken({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  baseId: user.base_id,
  oficinaId: user.oficina_id
});
```

## Considerações de Segurança

- O tempo de expiração dos tokens JWT está configurado para 24 horas
- A chave secreta para JWT está definida como variável de ambiente `JWT_SECRET`
- Se a variável não estiver presente, um valor padrão é usado apenas para ambiente de desenvolvimento
- Para ambiente de produção, sempre definir a variável `JWT_SECRET` com um valor forte e único
# Murici SaaS External Links - Guia de Instalação

## Visão Geral
Este guia mostra como implementar a arquitetura SaaS para os links externos das bases do sistema Murici Fleet Management, mantendo o sistema interno inalterado.

## Pré-requisitos
- Node.js 18+ 
- PostgreSQL (acesso ao banco existente)
- Replit account para deploy
- Certificados SSL/TLS

## Passo 1: Preparação do Ambiente

### 1.1 Instalar Dependências
```bash
cd saas
npm install
```

### 1.2 Configurar Variáveis de Ambiente
Crie um arquivo `.env` na pasta `saas/`:

```env
# Configurações do SaaS
NODE_ENV=production
PORT=3001
JWT_SECRET=seu-jwt-secret-super-seguro

# Banco de Dados (mesmo do sistema principal)
DATABASE_URL=postgresql://usuario:senha@host:5432/murici_fleet

# CORS - Domínios permitidos
ALLOWED_ORIGINS=https://murici-saas.replit.app,https://external.muricifleet.com

# Monitoramento
ENABLE_MONITORING=true
LOG_LEVEL=info
```

## Passo 2: Deploy no Replit

### 2.1 Configurar Secrets no Replit
No painel do Replit, adicione os seguintes secrets:

- `JWT_SECRET`: Chave secreta para JWT
- `DATABASE_URL`: String de conexão PostgreSQL
- `ALLOWED_ORIGINS`: Domínios permitidos para CORS

### 2.2 Deploy Automático
```bash
# No diretório raiz
replit deploy
```

O deploy usará automaticamente as configurações do `replit.toml`.

## Passo 3: Integração com Sistema Existente

### 3.1 Ativar Bridge de Integração
No sistema principal, adicione ao `server/index.js`:

```javascript
const { setupSaaSIntegration } = require('../saas-integration/bridge');

// Após a configuração do Express app
setupSaaSIntegration(app);
```

### 3.2 Configurar Variáveis do Sistema Principal
Adicione ao `.env` principal:

```env
SAAS_ENABLED=true
SAAS_PORT=3001
SAAS_BASE_URL=https://murici-saas.replit.app
```

## Passo 4: Configuração de Domínio (Opcional)

### 4.1 DNS Setup
Configure um subdomínio para o SaaS:
```
external.muricifleet.com -> murici-saas.replit.app
```

### 4.2 SSL/TLS
O Replit fornece SSL automático, mas para domínio customizado:
- Configure certificado SSL
- Atualize `ALLOWED_ORIGINS`

## Passo 5: Verificação de Funcionamento

### 5.1 Health Check
Acesse: `https://murici-saas.replit.app/health`

Resposta esperada:
```json
{
  "status": "healthy",
  "timestamp": "2025-08-14T15:00:00.000Z",
  "service": "murici-saas-external-links",
  "version": "1.0.0"
}
```

### 5.2 Teste de Login
1. Acesse: `https://murici-saas.replit.app/login`
2. Use credenciais existentes (ex: guilherme.protazio@muricionfleet.com)
3. Verifique redirecionamento para base externa

### 5.3 Teste de API
```bash
# Login para obter token
curl -X POST https://murici-saas.replit.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"senha"}'

# Usar token para acessar API
curl -H "Authorization: Bearer <token>" \
  https://murici-saas.replit.app/api/bases/151/fuel-cards
```

## Passo 6: Monitoramento e Manutenção

### 6.1 Logs do Sistema
Os logs são automaticamente coletados pelo Replit. Para logs customizados:

```javascript
// No código, usar:
console.log('[SAAS]', 'mensagem');
console.error('[SAAS ERROR]', 'erro');
```

### 6.2 Performance Monitoring
- Replit fornece métricas automáticas
- Use `/api/monitoring/performance` para métricas customizadas

### 6.3 Backup de Dados
O SaaS usa o mesmo banco do sistema principal, então os backups já existentes cobrem os dados.

## Passo 7: Migração Gradual

### 7.1 Teste A/B
Use a flag `SAAS_ENABLED` para ativar gradualmente:

```javascript
// Bridge detecta automaticamente rotas externas
if (req.path.includes('/external') && process.env.SAAS_ENABLED === 'true') {
  // Redirect to SaaS
}
```

### 7.2 Rollback Plan
Para reverter ao sistema anterior:
1. Definir `SAAS_ENABLED=false`
2. Restart do sistema principal
3. SaaS continua funcionando independentemente

## Troubleshooting

### Problema: CORS Errors
**Solução:** Verificar `ALLOWED_ORIGINS` nas variáveis de ambiente

### Problema: Database Connection
**Solução:** Verificar `DATABASE_URL` e firewall do PostgreSQL

### Problema: JWT Invalid
**Solução:** Verificar `JWT_SECRET` e sincronização de relógio

### Problema: 504 Gateway Timeout
**Solução:** Verificar recursos do Replit e queries do banco

## Recursos Adicionais

### Documentação da API
- Swagger/OpenAPI: `https://murici-saas.replit.app/api/docs`
- Health Check: `https://murici-saas.replit.app/health`

### Suporte
- GitHub Issues: [repositório do projeto]
- Email: suporte@muricifleet.com
- Documentation: [link para docs completas]

## Próximos Passos

1. **Implementar notificações push** para solicitações
2. **Adicionar analytics** de uso das bases externas  
3. **Criar dashboard administrativo** para gestão SaaS
4. **Implementar cache distribuído** para melhor performance
5. **Adicionar testes automatizados** E2E

---

**Importante:** Este sistema SaaS é uma extensão do sistema principal e não substitui funcionalidades internas. Ele fornece uma interface moderna e escalável especificamente para acesso externo às bases.
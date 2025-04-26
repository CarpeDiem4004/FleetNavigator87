# Documentação do Módulo de Pneus - Sincronização Híbrida

## Visão Geral

Este documento fornece instruções para implementar e usar o sistema de sincronização híbrida para o módulo de pneus, garantindo que os dados sejam consistentes entre o ambiente Replit (PostgreSQL local) e o ambiente externo (Supabase).

## Estrutura das Tabelas

O módulo de pneus utiliza as seguintes tabelas:

1. **pneus_completo**: Tabela principal que armazena informações sobre os pneus.
2. **movimentacao_pneu**: Registra movimentações (montagem, desmontagem, transferência) de pneus.
3. **solicitacoes_pneus**: Gerencia solicitações de novos pneus.
4. **montagem_pneus**: Rastreia montagens específicas de pneus em veículos.
5. **pneus_atividades**: Registra atividades como inspeções e manutenções em pneus.
6. **modelos_pneu**: Catálogo de modelos de pneus com especificações.

## Configuração Inicial

### 1. Criação das Tabelas no Supabase

Para criar as tabelas necessárias no Supabase, siga estes passos:

1. Execute o script SQL diretamente no console SQL do Supabase:
   ```
   // No painel do Supabase: SQL Editor > New Query > Cole o conteúdo de scripts/criar-tabelas-pneus-supabase.sql
   ```

   **OU**

2. Execute o script de implementação via Node.js:
   ```bash
   node scripts/implementar-tabelas-pneus-supabase.js
   ```

### 2. Verificação das Tabelas

Para verificar se as tabelas foram criadas corretamente e comparar a estrutura com as tabelas locais:

```bash
node scripts/verificar-tabelas-pneus-supabase.js
```

Este script irá:
- Verificar se todas as tabelas de pneus existem no Supabase
- Comparar a estrutura das tabelas entre o PostgreSQL local e o Supabase
- Identificar colunas que possam estar faltando

## Sincronização dos Dados

### Registrando Alterações para Sincronização

Sempre que um registro de pneus for criado, atualizado ou excluído, o sistema deve registrar essa alteração na tabela `sync_control` para sincronização posterior. Isso acontece automaticamente quando:

1. **O serviço de sincronização está ativo**: Executa periodicamente o script `scripts/sincronizar-pneus.js`
2. **O hook de captura de alterações está implementado**: Triggers no banco de dados registram automaticamente as alterações

Para sincronização manual:

```bash
node scripts/sincronizar-pneus.js
```

### Configurações de Sincronização

Você pode ajustar as configurações de sincronização na tabela `sync_config` para as entidades relacionadas a pneus:

| Entity Type   | Intervalo (min) | Prioridade | Máx. Tentativas |
|--------------|-----------------|------------|-----------------|
| pneu         | 60              | 7          | 3               |
| movimentacao | 30              | 7          | 5               |
| solicitacao  | 60              | 6          | 3               |
| montagem     | 60              | 6          | 3               |

## Implementação no Código

### 1. API de Pneus

A API de pneus (em `server/pneusApi.ts`) deve ser modificada para registrar alterações para sincronização. Isso pode ser feito adicionando chamadas para o serviço de sincronização após cada operação CRUD:

```javascript
// Exemplo para o endpoint de cadastro de pneus
app.post('/api/pneus', async (req, res) => {
  try {
    // Código existente para cadastrar o pneu
    // ...
    
    // Após o cadastro bem-sucedido, registrar para sincronização
    if (result.rows[0]) {
      await registrarAlteracaoParaSincronizacao(
        'pneu',
        result.rows[0].id.toString(),
        'replit_para_externo'
      );
    }
    
    return res.status(201).json({
      success: true,
      message: 'Pneu cadastrado com sucesso',
      data: result.rows[0]
    });
  } catch (error) {
    // Tratamento de erros existente
    // ...
  }
});
```

### 2. Função de Registro de Alterações

A função de registro de alterações deve ser importada em cada arquivo que manipula dados de pneus:

```javascript
import { registrarAlteracaoParaSincronizacao } from '../services/syncService';
```

### 3. Serviço de Sincronização Agendado

Para manter os dados consistentes, configure uma tarefa agendada para executar o script de sincronização periodicamente:

```javascript
// Em server/index.ts ou similar
import cron from 'node-cron';
import { spawn } from 'child_process';

// Executar a sincronização a cada 15 minutos
cron.schedule('*/15 * * * *', () => {
  console.log('Executando sincronização de pneus...');
  const syncProcess = spawn('node', ['scripts/sincronizar-pneus.js']);
  
  syncProcess.stdout.on('data', (data) => {
    console.log(`Sincronização: ${data}`);
  });
  
  syncProcess.stderr.on('data', (data) => {
    console.error(`Erro de sincronização: ${data}`);
  });
  
  syncProcess.on('close', (code) => {
    console.log(`Processo de sincronização encerrado com código ${code}`);
  });
});
```

## Monitoramento

### 1. Visualizando o Status de Sincronização

Use a view `sync_status_view` para monitorar o status da sincronização:

```sql
SELECT * FROM sync_status_view 
WHERE entity_type IN ('pneu', 'movimentacao', 'solicitacao', 'montagem')
ORDER BY next_sync_attempt;
```

### 2. Visualizando o Log de Sincronização

Para ver o histórico de eventos de sincronização:

```sql
SELECT * FROM sync_log
WHERE entity_type IN ('pneu', 'movimentacao', 'solicitacao', 'montagem')
ORDER BY created_at DESC
LIMIT 50;
```

### 3. Verificando Registros com Erros

Para identificar registros que falharam na sincronização:

```sql
SELECT * FROM sync_control
WHERE entity_type IN ('pneu', 'movimentacao', 'solicitacao', 'montagem')
AND status = 'erro'
ORDER BY retry_count DESC;
```

## Resolução de Problemas

### 1. Sincronização Falhou Repetidamente

Se um registro falhar repetidamente na sincronização:

1. Verifique o campo `error_message` na tabela `sync_control`
2. Corrija o problema no registro
3. Redefina o status manualmente:
   ```sql
   UPDATE sync_control
   SET status = 'pendente', retry_count = 0, next_sync_attempt = NOW()
   WHERE id = [ID do registro com problema];
   ```

### 2. Inconsistências entre Ambientes

Se houver inconsistências entre os ambientes:

1. Execute o script de verificação:
   ```bash
   node scripts/verificar-tabelas-pneus-supabase.js
   ```

2. Se necessário, atualize a estrutura das tabelas com:
   ```bash
   node scripts/implementar-tabelas-pneus-supabase.js
   ```

### 3. Sincronização Forçada

Para forçar a sincronização de todos os registros de pneus:

```sql
INSERT INTO sync_control (entity_type, entity_id, status, direction, next_sync_attempt)
SELECT 'pneu', id::text, 'pendente', 'replit_para_externo', NOW()
FROM pneus_completo
ON CONFLICT (entity_type, entity_id) DO UPDATE
SET status = 'pendente', retry_count = 0, next_sync_attempt = NOW();
```

## Conclusão

Este sistema de sincronização garantirá que os dados do módulo de pneus estejam disponíveis e atualizados tanto no ambiente Replit quanto no Supabase externo, proporcionando uma experiência consistente e confiável para os usuários, independentemente do ambiente em que acessem o sistema.
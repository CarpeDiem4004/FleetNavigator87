# Documentação de Sincronização Híbrida

## Visão Geral

Este sistema de sincronização híbrida foi projetado para garantir a consistência dos dados entre o ambiente Replit (PostgreSQL local) e o ambiente externo (Supabase). Ele permite que o sistema funcione em ambos os ambientes, sincronizando dados de forma bidirecional, garantindo a integridade e consistência das informações.

## Estrutura de Tabelas

### 1. Tabela `sync_control`

A tabela principal que gerencia o processo de sincronização.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | SERIAL | Identificador único da sincronização |
| entity_type | entity_type (enum) | Tipo de entidade (usuário, veículo, etc.) |
| entity_id | VARCHAR(50) | Identificador da entidade |
| status | sync_status (enum) | Status da sincronização (pendente, sincronizado, erro, ignorado) |
| direction | sync_direction (enum) | Direção da sincronização (replit_para_externo, externo_para_replit, bidirecional) |
| replit_last_update | TIMESTAMP | Última atualização no ambiente Replit |
| external_last_update | TIMESTAMP | Última atualização no ambiente externo |
| last_sync_attempt | TIMESTAMP | Última tentativa de sincronização |
| next_sync_attempt | TIMESTAMP | Próxima tentativa de sincronização |
| retry_count | INTEGER | Número de tentativas de sincronização |
| error_message | TEXT | Mensagem de erro, se houver |
| payload | JSONB | Dados adicionais para a sincronização |
| created_at | TIMESTAMP | Data de criação do registro |
| updated_at | TIMESTAMP | Data de atualização do registro |

### 2. Tabela `sync_config`

Configurações para o processo de sincronização de cada tipo de entidade.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | SERIAL | Identificador único da configuração |
| entity_type | entity_type (enum) | Tipo de entidade (único) |
| is_enabled | BOOLEAN | Se a sincronização está ativada |
| sync_interval_minutes | INTEGER | Intervalo de sincronização em minutos |
| max_retries | INTEGER | Número máximo de tentativas |
| priority | INTEGER | Prioridade da sincronização (maior = mais prioritário) |
| created_at | TIMESTAMP | Data de criação do registro |
| updated_at | TIMESTAMP | Data de atualização do registro |

### 3. Tabela `sync_log`

Registro de eventos de sincronização para auditoria.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | SERIAL | Identificador único do log |
| sync_id | INTEGER | Referência ao registro na tabela sync_control |
| entity_type | entity_type (enum) | Tipo de entidade |
| entity_id | VARCHAR(50) | Identificador da entidade |
| status | sync_status (enum) | Status da sincronização |
| direction | sync_direction (enum) | Direção da sincronização |
| error_message | TEXT | Mensagem de erro, se houver |
| sync_details | JSONB | Detalhes adicionais da sincronização |
| created_at | TIMESTAMP | Data do evento |

### 4. View `sync_status_view`

Uma visão que facilita a consulta dos dados de sincronização com informações adicionais das configurações.

## Enums Utilizados

### 1. `sync_status`
- **pendente**: Aguardando sincronização
- **sincronizado**: Sincronização realizada com sucesso
- **erro**: Erro durante a sincronização
- **ignorado**: Sincronização ignorada

### 2. `entity_type`
- **usuario**: Usuários do sistema
- **veiculo**: Veículos da frota
- **base**: Bases operacionais
- **abastecimento**: Registros de abastecimento
- **manutencao**: Registros de manutenção
- **pneu**: Controle de pneus
- **movimentacao**: Movimentações de veículos
- **posto**: Postos de combustível
- **tanque**: Tanques de combustível
- **configuracao**: Configurações do sistema

### 3. `sync_direction`
- **replit_para_externo**: Dados do Replit para o ambiente externo
- **externo_para_replit**: Dados do ambiente externo para o Replit
- **bidirecional**: Sincronização em ambas as direções

## Fluxo de Sincronização

1. **Registro de Alterações**: Sempre que uma entidade é criada, atualizada ou excluída, um registro é criado ou atualizado na tabela `sync_control` com status "pendente".

2. **Processo de Sincronização**: Um processo programado verifica periodicamente a tabela `sync_control` para identificar registros pendentes de sincronização.

3. **Priorização**: As entidades são sincronizadas de acordo com sua prioridade definida na tabela `sync_config`.

4. **Tentativas**: Se ocorrer um erro durante a sincronização, o sistema fará novas tentativas até atingir o número máximo definido.

5. **Logging**: Todas as tentativas de sincronização são registradas na tabela `sync_log` para fins de auditoria.

## Implementação no Código

### 1. Registro de Alterações

```javascript
// Exemplo de como registrar uma alteração para sincronização
async function registrarAlteracaoParaSincronizacao(entityType, entityId, direction = 'bidirecional', payload = null) {
  try {
    // Verificar se já existe um registro para esta entidade
    const { data: existingSync } = await supabase
      .from('sync_control')
      .select('id')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .single();
    
    const now = new Date();
    const syncData = {
      status: 'pendente',
      direction,
      payload,
      next_sync_attempt: now,
      retry_count: 0
    };
    
    // Se estamos no ambiente Replit
    if (isReplitEnvironment()) {
      syncData.replit_last_update = now;
    } else {
      syncData.external_last_update = now;
    }
    
    if (existingSync) {
      // Atualizar registro existente
      await supabase
        .from('sync_control')
        .update(syncData)
        .eq('id', existingSync.id);
    } else {
      // Criar novo registro
      await supabase
        .from('sync_control')
        .insert([{
          entity_type: entityType,
          entity_id: entityId,
          ...syncData
        }]);
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao registrar alteração para sincronização:', error);
    return false;
  }
}
```

### 2. Processamento da Sincronização

```javascript
// Exemplo de como processar a sincronização
async function processarSincronizacao() {
  try {
    // Buscar registros pendentes de sincronização
    const { data: pendingSyncs } = await supabase
      .from('sync_status_view')
      .select('*')
      .eq('ready_for_sync', true)
      .order('priority', { ascending: false })
      .order('next_sync_attempt', { ascending: true })
      .limit(10);
    
    if (!pendingSyncs || pendingSyncs.length === 0) {
      console.log('Não há registros pendentes de sincronização.');
      return;
    }
    
    console.log(`Processando ${pendingSyncs.length} registros de sincronização...`);
    
    for (const sync of pendingSyncs) {
      await processarRegistroSincronizacao(sync);
    }
  } catch (error) {
    console.error('Erro ao processar sincronização:', error);
  }
}
```

## Usando o Sistema Híbrido

1. **Preparação**: Execute o script `scripts/implementar-tabelas-supabase.js` para criar as tabelas no Supabase.

2. **Adaptação do Código**: Modifique suas funções de criação, atualização e exclusão para registrar as alterações para sincronização.

3. **Sincronização**: Configure um cron job ou processo programado para executar a sincronização periodicamente.

4. **Monitoramento**: Use a view `sync_status_view` para monitorar o processo de sincronização.

5. **Resolução de Conflitos**: Implemente regras de resolução de conflitos conforme necessário para cada tipo de entidade.

## Considerações

- O sistema é flexível e pode ser adaptado para diferentes tipos de entidades.
- As configurações de sincronização podem ser ajustadas para cada tipo de entidade conforme necessário.
- É importante implementar tratamento adequado de erros e notificações para problemas de sincronização.
- Considere adicionar um mecanismo de sincronização manual para casos específicos.

## Conclusão

Este sistema de sincronização híbrida permite que sua aplicação funcione perfeitamente tanto no ambiente Replit quanto externamente, garantindo a consistência dos dados entre os ambientes.
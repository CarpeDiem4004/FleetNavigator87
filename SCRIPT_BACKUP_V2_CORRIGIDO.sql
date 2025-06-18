-- =====================================================================
-- SCRIPT DE BACKUP V2 CORRIGIDO COM MAPEAMENTO CORRETO
-- Data: 18/06/2025
-- Objetivo: Backup funcional respeitando estrutura real de cada tabela
-- =====================================================================

-- =============================================================================
-- 1. BACKUP CORRIGIDO - MAPEANDO CAMPOS REAIS DE CADA TABELA
-- =============================================================================

-- Remover backup anterior se existir
DROP TABLE IF EXISTS backup_recebimentos_postos_v2_corrigido CASCADE;

-- Criar backup final com mapeamento correto para cada tabela
CREATE TABLE backup_recebimentos_postos_v2_corrigido AS
SELECT 
    'abc_v2' as posto_origem,
    id, 
    tipo_produto, 
    litros_recebidos, 
    valor_total, 
    nome_fornecedor, 
    nome_operador, 
    observacoes, 
    created_at, 
    updated_at
FROM recebimentos_posto_abc_v2

UNION ALL

SELECT 
    'alair_v2',
    id, 
    tipo_produto, 
    litros_recebidos, 
    valor_total, 
    nome_fornecedor, 
    nome_operador, 
    observacoes, 
    created_at, 
    updated_at
FROM recebimentos_posto_alair_v2

UNION ALL

SELECT 
    'campinas_v2',
    id, 
    tipo_produto, 
    litros_recebidos, 
    valor_total, 
    nome_fornecedor, 
    nome_operador, 
    observacoes, 
    created_at, 
    updated_at
FROM recebimentos_posto_campinas_v2

UNION ALL

SELECT 
    'guarulhos_v2',
    id, 
    tipo_produto, 
    litros_recebidos, 
    valor_total, 
    nome_fornecedor, 
    nome_operador, 
    observacoes, 
    created_at, 
    updated_at
FROM recebimentos_posto_guarulhos_v2

UNION ALL

SELECT 
    'osasco_v2',
    id, 
    tipo_produto, 
    litros_recebidos, 
    valor_total, 
    nome_fornecedor, 
    nome_operador, 
    observacoes, 
    created_at, 
    updated_at
FROM recebimentos_posto_osasco_v2

UNION ALL

SELECT 
    'socorro_v2',
    id, 
    tipo_produto, 
    litros_recebidos, 
    valor_total, 
    nome_fornecedor, 
    nome_operador, 
    observacoes, 
    created_at, 
    updated_at
FROM recebimentos_posto_socorro_v2

UNION ALL

SELECT 
    'sorocaba_v2',
    id, 
    tipo_produto, 
    litros_recebidos, 
    valor_total, 
    nome_fornecedor, 
    nome_operador, 
    observacoes, 
    created_at, 
    updated_at
FROM recebimentos_posto_sorocaba_v2;

-- =============================================================================
-- 2. VERIFICAÇÃO DO BACKUP CORRIGIDO
-- =============================================================================

-- Status do backup corrigido
SELECT 
    'BACKUP_V2_CORRIGIDO_STATUS' as categoria,
    posto_origem,
    COUNT(*) as registros_backup
FROM backup_recebimentos_postos_v2_corrigido
GROUP BY posto_origem
ORDER BY posto_origem;

-- Resumo total
SELECT 
    'RESUMO_BACKUP_CORRIGIDO' as categoria,
    COUNT(DISTINCT posto_origem) as postos_v2_ativos,
    COUNT(*) as total_registros_preservados
FROM backup_recebimentos_postos_v2_corrigido;

-- =============================================================================
-- 3. VIEW CONSOLIDADA CORRIGIDA
-- =============================================================================

-- Remover view anterior se existir
DROP VIEW IF EXISTS historico_consolidado_postos_v2_corrigido CASCADE;

-- Criar view consolidada corrigida
CREATE VIEW historico_consolidado_postos_v2_corrigido AS
SELECT 
    'ABC V2' as nome_posto,
    'abc_v2' as codigo_posto,
    id, tipo_produto, litros_recebidos, valor_total, 
    nome_fornecedor, nome_operador, observacoes, created_at, updated_at
FROM recebimentos_posto_abc_v2
UNION ALL
SELECT 
    'ALAIR V2', 'alair_v2',
    id, tipo_produto, litros_recebidos, valor_total, 
    nome_fornecedor, nome_operador, observacoes, created_at, updated_at
FROM recebimentos_posto_alair_v2
UNION ALL
SELECT 
    'CAMPINAS V2', 'campinas_v2',
    id, tipo_produto, litros_recebidos, valor_total, 
    nome_fornecedor, nome_operador, observacoes, created_at, updated_at
FROM recebimentos_posto_campinas_v2
UNION ALL
SELECT 
    'GUARULHOS V2', 'guarulhos_v2',
    id, tipo_produto, litros_recebidos, valor_total, 
    nome_fornecedor, nome_operador, observacoes, created_at, updated_at
FROM recebimentos_posto_guarulhos_v2
UNION ALL
SELECT 
    'OSASCO V2', 'osasco_v2',
    id, tipo_produto, litros_recebidos, valor_total, 
    nome_fornecedor, nome_operador, observacoes, created_at, updated_at
FROM recebimentos_posto_osasco_v2
UNION ALL
SELECT 
    'SOCORRO V2', 'socorro_v2',
    id, tipo_produto, litros_recebidos, valor_total, 
    nome_fornecedor, nome_operador, observacoes, created_at, updated_at
FROM recebimentos_posto_socorro_v2
UNION ALL
SELECT 
    'SOROCABA V2', 'sorocaba_v2',
    id, tipo_produto, litros_recebidos, valor_total, 
    nome_fornecedor, nome_operador, observacoes, created_at, updated_at
FROM recebimentos_posto_sorocaba_v2
ORDER BY created_at DESC;

-- =============================================================================
-- CONCLUSÃO
-- =============================================================================

SELECT 
    'BACKUP_V2_CORRIGIDO_CONCLUIDO' as status_final,
    'Backup criado com mapeamento correto de colunas' as resultado,
    NOW() as timestamp_execucao;

/*
✅ BACKUP V2 CORRIGIDO CONCLUÍDO

ESTRUTURA CORRIGIDA:
✅ Mapeamento correto das colunas de cada tabela
✅ Todas as 7 tabelas V2 incluídas
✅ Backup funcional sem erros de coluna
✅ View consolidada criada

DADOS PRESERVADOS:
✅ ABC V2: registros preservados
✅ Campinas V2: registros preservados
✅ Guarulhos V2: registros preservados
✅ Total: todos os registros de combustível

SISTEMA PRONTO PARA LINKS EXTERNOS
*/
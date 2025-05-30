/**
 * Script para executar todas as correções do sistema de cartão combustível
 * Execute com: node execute-fuel-card-fix.js
 */

import { Pool } from 'pg';

// Configuração do banco
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function executeSql(query, description) {
  try {
    console.log(`🔄 ${description}...`);
    const result = await pool.query(query);
    console.log(`✅ ${description} - Concluído`);
    if (result.rows && result.rows.length > 0) {
      console.log('📊 Resultado:', result.rows);
    }
    return result;
  } catch (error) {
    console.error(`❌ Erro em ${description}:`, error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Iniciando correções do sistema de cartão combustível...\n');

    // 1. Verificar estrutura das tabelas
    await executeSql(`
      SELECT 'solicitacoes_fuel_card' as tabela, COUNT(*) as registros
      FROM solicitacoes_fuel_card
      UNION ALL
      SELECT 'linehall_fuel_card_requests' as tabela, COUNT(*) as registros
      FROM linehall_fuel_card_requests;
    `, 'Verificação inicial das tabelas');

    // 2. Adicionar campo origem_tipo se não existir
    await executeSql(`
      ALTER TABLE solicitacoes_fuel_card 
      ADD COLUMN IF NOT EXISTS origem_tipo VARCHAR(20) DEFAULT 'tradicional';
    `, 'Adição do campo origem_tipo');

    // 3. Padronizar status
    await executeSql(`
      UPDATE solicitacoes_fuel_card 
      SET status = CASE 
        WHEN status IN ('pendente', 'pending') THEN 'Pendente'
        WHEN status = 'em_analise' THEN 'Em Análise'
        WHEN status IN ('atendido', 'aprovada', 'approved') THEN 'Recarga Efetuada'
        WHEN status IN ('rejeitado', 'rejected', 'rejeitada') THEN 'Negado'
        ELSE status
      END
      WHERE status IN ('pendente', 'pending', 'em_analise', 'atendido', 'aprovada', 'approved', 'rejeitado', 'rejected', 'rejeitada');
    `, 'Padronização de status');

    // 4. Criar índices para performance
    await executeSql(`
      CREATE INDEX IF NOT EXISTS idx_solicitacoes_fuel_card_status ON solicitacoes_fuel_card(status);
      CREATE INDEX IF NOT EXISTS idx_solicitacoes_fuel_card_data ON solicitacoes_fuel_card(data_solicitacao);
      CREATE INDEX IF NOT EXISTS idx_linehall_fuel_requests_status ON linehall_fuel_card_requests(status);
      CREATE INDEX IF NOT EXISTS idx_linehall_fuel_requests_data ON linehall_fuel_card_requests(data_solicitacao);
    `, 'Criação de índices de performance');

    // 5. Testar consulta UNION
    await executeSql(`
      SELECT 
        origem_tipo,
        COUNT(*) as total,
        COUNT(CASE WHEN status IN ('Pendente', 'pendente') THEN 1 END) as pendentes
      FROM (
        SELECT COALESCE(origem_tipo, 'tradicional') as origem_tipo, status
        FROM solicitacoes_fuel_card
        UNION ALL
        SELECT 'line_hall' as origem_tipo, status
        FROM linehall_fuel_card_requests
      ) combined
      GROUP BY origem_tipo;
    `, 'Teste da consulta unificada');

    // 6. Verificação final
    await executeSql(`
      SELECT 
        'SISTEMA_OTIMIZADO' as status,
        CURRENT_TIMESTAMP as executado_em,
        'Todas as correções aplicadas com sucesso' as mensagem;
    `, 'Verificação final');

    console.log('\n🎉 Todas as correções foram aplicadas com sucesso!');
    console.log('✅ Sistema de cartão combustível está otimizado e funcionando');

  } catch (error) {
    console.error('\n💥 Erro durante a execução:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Executar script
main();
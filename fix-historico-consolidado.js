/**
 * Script para corrigir a view de histórico consolidado
 * Garante que todos os postos sejam incluídos no histórico geral
 */

import { pool } from './server/database.js';

async function fixHistoricoConsolidado() {
  try {
    console.log('🔧 Corrigindo view de histórico consolidado...');
    
    const sql = `
      DROP VIEW IF EXISTS historico_consolidado_abastecimentos;

      CREATE VIEW historico_consolidado_abastecimentos AS

      -- Posto Osasco V2
      SELECT 
          id,
          placa,
          km_atual AS km,
          km_atual AS hodometro_atual,
          tipo_combustivel,
          litros AS quantidade_litros,
          motorista AS nome_motorista,
          motorista_rg AS rg_motorista,
          operador AS nome_operador,
          valor_litro,
          valor_total,
          tipo_veiculo,
          observacoes,
          lavagem,
          tipo_lavagem,
          COALESCE(projeto, 'Não definido') AS project,
          to_char(created_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') AS data_hora,
          created_at,
          'Osasco_v2' AS nome_posto
      FROM abastecimentos_posto_osasco_v2

      UNION ALL

      -- Posto ABC V2
      SELECT 
          id,
          placa,
          km_atual AS km,
          km_atual AS hodometro_atual,
          tipo_combustivel,
          litros AS quantidade_litros,
          motorista AS nome_motorista,
          motorista_rg AS rg_motorista,
          operador AS nome_operador,
          valor_litro,
          valor_total,
          tipo_veiculo,
          observacoes,
          lavagem,
          tipo_lavagem,
          COALESCE(projeto, 'Não definido') AS project,
          to_char(created_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') AS data_hora,
          created_at,
          'ABC_v2' AS nome_posto
      FROM abastecimentos_posto_abc_v2

      UNION ALL

      -- Posto Socorro V2
      SELECT 
          id,
          placa,
          km_atual AS km,
          km_atual AS hodometro_atual,
          tipo_combustivel,
          litros AS quantidade_litros,
          motorista AS nome_motorista,
          motorista_rg AS rg_motorista,
          operador AS nome_operador,
          valor_litro,
          valor_total,
          tipo_veiculo,
          observacoes,
          lavagem,
          tipo_lavagem,
          COALESCE(projeto, 'Não definido') AS project,
          to_char(created_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') AS data_hora,
          created_at,
          'Socorro_v2' AS nome_posto
      FROM abastecimentos_posto_socorro_v2

      UNION ALL

      -- Posto Sorocaba V2
      SELECT 
          id,
          placa,
          km_atual AS km,
          km_atual AS hodometro_atual,
          tipo_combustivel,
          litros AS quantidade_litros,
          motorista AS nome_motorista,
          motorista_rg AS rg_motorista,
          operador AS nome_operador,
          valor_litro,
          valor_total,
          tipo_veiculo,
          observacoes,
          lavagem,
          tipo_lavagem,
          COALESCE(projeto, 'Não definido') AS project,
          to_char(created_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') AS data_hora,
          created_at,
          'Sorocaba_v2' AS nome_posto
      FROM abastecimentos_posto_sorocaba_v2

      UNION ALL

      -- Posto Campinas V2
      SELECT 
          id,
          placa,
          km_atual AS km,
          km_atual AS hodometro_atual,
          tipo_combustivel,
          litros AS quantidade_litros,
          motorista AS nome_motorista,
          motorista_rg AS rg_motorista,
          operador AS nome_operador,
          valor_litro,
          valor_total,
          tipo_veiculo,
          observacoes,
          lavagem,
          tipo_lavagem,
          COALESCE(projeto, 'Não definido') AS project,
          to_char(created_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') AS data_hora,
          created_at,
          'Campinas_v2' AS nome_posto
      FROM abastecimentos_posto_campinas_v2

      UNION ALL

      -- Posto Alair V2
      SELECT 
          id,
          placa,
          km_atual AS km,
          km_atual AS hodometro_atual,
          tipo_combustivel,
          litros AS quantidade_litros,
          motorista AS nome_motorista,
          motorista_rg AS rg_motorista,
          operador AS nome_operador,
          valor_litro,
          valor_total,
          tipo_veiculo,
          observacoes,
          lavagem,
          tipo_lavagem,
          COALESCE(projeto, 'Não definido') AS project,
          to_char(created_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') AS data_hora,
          created_at,
          'Alair_v2' AS nome_posto
      FROM abastecimentos_posto_alair_v2

      ORDER BY created_at DESC;
    `;

    await pool.query(sql);
    console.log('✅ View de histórico consolidado corrigida com sucesso!');
    
    // Verificar se a view foi criada corretamente
    const testQuery = `
      SELECT nome_posto, COUNT(*) as total 
      FROM historico_consolidado_abastecimentos 
      GROUP BY nome_posto 
      ORDER BY total DESC;
    `;
    
    const result = await pool.query(testQuery);
    
    console.log('\n📊 Contagem de registros por posto:');
    result.rows.forEach(row => {
      console.log(`- ${row.nome_posto}: ${row.total} registros`);
    });
    
    // Verificar especificamente o Osasco V2
    const osascoCheck = await pool.query(`
      SELECT COUNT(*) as total 
      FROM historico_consolidado_abastecimentos 
      WHERE nome_posto = 'Osasco_v2'
    `);
    
    console.log(`\n🎯 Registros do Osasco V2 no histórico consolidado: ${osascoCheck.rows[0].total}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao corrigir histórico consolidado:', error.message);
    process.exit(1);
  }
}

fixHistoricoConsolidado();
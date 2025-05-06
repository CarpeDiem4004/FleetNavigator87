/**
 * Script para testar as views das tabelas de postos v2
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

async function testPostoViews() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    // Postos V2 para testar
    const postosV2 = ['abc_v2', 'socorro_v2', 'sorocaba_v2'];
    
    for (const posto of postosV2) {
      console.log(`\n=== Testando views para ${posto} ===`);
      
      // View de últimos abastecimentos
      const viewUltimos = `abastecimentos_posto_${posto}_ultimos`;
      console.log(`\nTestando view ${viewUltimos}...`);
      
      const resultUltimos = await pool.query(`SELECT * FROM "${viewUltimos}"`);
      
      if (resultUltimos.rows.length > 0) {
        console.log(`✅ View ${viewUltimos} funcionando corretamente`);
        console.log(`Encontrados ${resultUltimos.rows.length} registros`);
        console.log('Exemplo de registro:', resultUltimos.rows[0]);
      } else {
        console.log(`⚠️ View ${viewUltimos} não retornou registros`);
      }
      
      // View de estatísticas mensais
      const viewEstatisticas = `abastecimentos_posto_${posto}_estatisticas_mensais`;
      console.log(`\nTestando view ${viewEstatisticas}...`);
      
      const resultEstatisticas = await pool.query(`SELECT * FROM "${viewEstatisticas}"`);
      
      if (resultEstatisticas.rows.length > 0) {
        console.log(`✅ View ${viewEstatisticas} funcionando corretamente`);
        console.log(`Encontrados ${resultEstatisticas.rows.length} registros`);
        console.log('Exemplo de registro:', resultEstatisticas.rows[0]);
      } else {
        console.log(`⚠️ View ${viewEstatisticas} não retornou registros`);
      }
      
      // View de consumo por veículo
      const viewConsumoVeiculo = `abastecimentos_posto_${posto}_consumo_por_veiculo`;
      console.log(`\nTestando view ${viewConsumoVeiculo}...`);
      
      const resultConsumoVeiculo = await pool.query(`SELECT * FROM "${viewConsumoVeiculo}"`);
      
      if (resultConsumoVeiculo.rows.length > 0) {
        console.log(`✅ View ${viewConsumoVeiculo} funcionando corretamente`);
        console.log(`Encontrados ${resultConsumoVeiculo.rows.length} registros`);
        console.log('Exemplo de registro:', resultConsumoVeiculo.rows[0]);
      } else {
        console.log(`⚠️ View ${viewConsumoVeiculo} não retornou registros`);
      }
      
      // View de comparativo de combustíveis
      const viewComparativo = `abastecimentos_posto_${posto}_comparativo_combustiveis`;
      console.log(`\nTestando view ${viewComparativo}...`);
      
      const resultComparativo = await pool.query(`SELECT * FROM "${viewComparativo}"`);
      
      if (resultComparativo.rows.length > 0) {
        console.log(`✅ View ${viewComparativo} funcionando corretamente`);
        console.log(`Encontrados ${resultComparativo.rows.length} registros`);
        console.log('Exemplo de registro:', resultComparativo.rows[0]);
      } else {
        console.log(`⚠️ View ${viewComparativo} não retornou registros`);
      }
    }
    
  } catch (error) {
    console.error('Erro ao testar views:', error);
  } finally {
    await pool.end();
  }
}

testPostoViews().catch(console.error);
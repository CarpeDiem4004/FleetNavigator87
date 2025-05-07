/**
 * Script para executar a criação das tabelas e views do Posto ABC V2
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração da conexão com o banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function executarScript() {
  console.log('Iniciando execução do script para o Posto ABC V2...');
  
  try {
    // Lê o conteúdo do arquivo SQL
    const scriptPath = path.join(__dirname, 'criar-tabela-abc-v2.sql');
    const scriptSQL = fs.readFileSync(scriptPath, 'utf8');
    
    // Conecta ao banco de dados
    const client = await pool.connect();
    
    try {
      // Executa o script SQL
      console.log('Executando script SQL...');
      await client.query(scriptSQL);
      console.log('Script SQL executado com sucesso!');
      
      // Verificação adicional das tabelas criadas
      console.log('\nVerificando tabelas criadas:');
      
      // Verificar tabela de abastecimentos
      const abastecimentosResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'abastecimentos_posto_abc_v2'
        );
      `);
      console.log(`- Tabela 'abastecimentos_posto_abc_v2': ${abastecimentosResult.rows[0].exists ? 'Criada' : 'Não encontrada'}`);
      
      // Verificar tabela de configuração de tanques
      const tanquesResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'configuracao_tanques_abc_v2'
        );
      `);
      console.log(`- Tabela 'configuracao_tanques_abc_v2': ${tanquesResult.rows[0].exists ? 'Criada' : 'Não encontrada'}`);
      
      // Verificar views criadas
      console.log('\nVerificando views criadas:');
      const viewsToCheck = [
        'abastecimentos_posto_abc_v2_consumo_por_veiculo',
        'abastecimentos_posto_abc_v2_estatisticas_mensais',
        'abastecimentos_posto_abc_v2_comparativo_combustiveis',
        'abastecimentos_posto_abc_v2_ultimos'
      ];
      
      for (const view of viewsToCheck) {
        const viewResult = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.views 
            WHERE table_schema = 'public' 
            AND table_name = $1
          );
        `, [view]);
        console.log(`- View '${view}': ${viewResult.rows[0].exists ? 'Criada' : 'Não encontrada'}`);
      }
      
      // Verificar dados dos tanques
      console.log('\nVerificando configuração dos tanques:');
      const tanquesData = await client.query(`
        SELECT tanque, capacidade_maxima, nivel_atual, tipo_combustivel 
        FROM configuracao_tanques_abc_v2
        ORDER BY tanque;
      `);
      
      if (tanquesData.rows.length > 0) {
        tanquesData.rows.forEach(row => {
          console.log(`- ${row.tanque} (${row.tipo_combustivel}): Capacidade = ${row.capacidade_maxima}L, Nível Atual = ${row.nivel_atual}L`);
        });
      } else {
        console.log('- Nenhum registro encontrado na tabela de configuração de tanques');
      }
      
      console.log('\nSetup completo para o Posto ABC V2!');
      
    } finally {
      // Libera o cliente de volta para o pool
      client.release();
    }
  } catch (err) {
    console.error('Erro ao executar o script:', err);
    process.exit(1);
  } finally {
    // Encerra o pool de conexões
    await pool.end();
  }
}

// Executa a função principal
executarScript().catch(console.error);
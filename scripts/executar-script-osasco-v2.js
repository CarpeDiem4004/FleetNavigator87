/**
 * Script para executar as consultas SQL para criação da estrutura do Posto Osasco V2
 * Este script executa o arquivo criar-tabela-osasco-v2.sql de maneira segura e controlada
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Conexão com o PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function executarScript() {
  try {
    console.log('Iniciando execução do script para Posto Osasco V2...');
    
    // Lê o arquivo SQL
    const caminhoScript = path.join(__dirname, 'criar-tabela-osasco-v2.sql');
    const scriptSql = fs.readFileSync(caminhoScript, 'utf8');
    
    console.log('Script SQL carregado com sucesso.');
    console.log('Conectando ao banco de dados...');
    
    // Conecta ao banco de dados
    const client = await pool.connect();
    
    try {
      console.log('Conexão estabelecida. Executando script...');
      
      // Executa o script em uma transação
      await client.query('BEGIN');
      await client.query(scriptSql);
      await client.query('COMMIT');
      
      console.log('Script executado com sucesso!');
      console.log('Tabelas e views para o Posto Osasco V2 foram criadas/atualizadas.');
      
      // Verifica se as tabelas foram criadas corretamente
      const verificarTabela = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'posto_murici_osasco_v2'
        ) as "exists";
      `);
      
      const verificarConfiguracaoTanques = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'configuracao_tanques_osasco_v2'
        ) as "exists";
      `);
      
      console.log('Verificação de tabelas:');
      console.log(`- Tabela posto_murici_osasco_v2: ${verificarTabela.rows[0].exists ? 'Criada' : 'Erro'}`);
      console.log(`- Tabela configuracao_tanques_osasco_v2: ${verificarConfiguracaoTanques.rows[0].exists ? 'Criada' : 'Erro'}`);
      
      // Verifica as views
      const views = [
        'posto_murici_osasco_v2_consumo_por_veiculo',
        'posto_murici_osasco_v2_estatisticas_mensais',
        'posto_murici_osasco_v2_comparativo_combustiveis',
        'posto_murici_osasco_v2_ultimos'
      ];
      
      console.log('\nVerificação de views:');
      
      for (const view of views) {
        const verificarView = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          ) as "exists";
        `, [view]);
        
        console.log(`- View ${view}: ${verificarView.rows[0].exists ? 'Criada' : 'Erro'}`);
      }
      
      console.log('\nConfigurações de tanques:');
      const tanques = await client.query('SELECT * FROM configuracao_tanques_osasco_v2');
      
      tanques.rows.forEach(tanque => {
        console.log(`- ${tanque.tanque} (${tanque.tipo_combustivel}): Capacidade ${tanque.capacidade_maxima}L, Nível Atual ${tanque.nivel_atual}L`);
      });
    } catch (err) {
      // Em caso de erro, reverte a transação
      await client.query('ROLLBACK');
      console.error('Erro ao executar script:', err);
      throw err;
    } finally {
      // Libera o cliente de volta para o pool
      client.release();
    }
  } catch (err) {
    console.error('Erro no processo:', err);
  } finally {
    // Encerra o pool ao final
    pool.end();
  }
}

executarScript();
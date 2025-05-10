/**
 * Script para verificar se a view historico_consolidado_abastecimentos existe
 * e exibir alguns registros de amostra
 */

const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

// Verificar se a conexão com o banco está disponível
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('Erro: Variável de ambiente DATABASE_URL não encontrada');
  process.exit(1);
}

// Conexão com o banco de dados
const pool = new Pool({
  connectionString: dbUrl
});

async function main() {
  try {
    console.log('Verificando view historico_consolidado_abastecimentos...');

    // Verificar se a view existe
    const viewCheckResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_name = 'historico_consolidado_abastecimentos'
    `);

    if (viewCheckResult.rows.length === 0) {
      console.log('⚠️ A view historico_consolidado_abastecimentos não existe!');
      
      // Se não existir, perguntar se deseja criar
      console.log('Deseja criar a view? Executando criação...');
      
      // Ler o SQL do arquivo
      const sqlContent = fs.readFileSync('./create-historico-consolidado-view.sql', 'utf8');
      
      // Executar o SQL para criar a view
      await pool.query(sqlContent);
      console.log('✅ View criada com sucesso!');
    } else {
      console.log('✅ A view historico_consolidado_abastecimentos existe');
    }

    // Contar registros
    const countResult = await pool.query('SELECT COUNT(*) FROM historico_consolidado_abastecimentos');
    const count = parseInt(countResult.rows[0].count);
    console.log(`✅ A view contém ${count} registros`);

    // Mostrar alguns registros de exemplo
    if (count > 0) {
      const sampleResult = await pool.query('SELECT * FROM historico_consolidado_abastecimentos LIMIT 5');
      console.log('\nExemplo de registros:');
      sampleResult.rows.forEach(row => {
        console.log(`- Placa: ${row.placa}, Posto: ${row.nome_posto}, Data: ${row.data_hora}, Combustível: ${row.tipo_combustivel}, Litros: ${row.quantidade_litros}`);
      });
    }

    console.log('\nView historico_consolidado_abastecimentos pronta para uso!');
  } catch (err) {
    console.error('Erro ao verificar/criar a view:', err);
    process.exit(1);
  } finally {
    // Fechar a conexão com o banco
    pool.end();
  }
}

// Executar o script
main();
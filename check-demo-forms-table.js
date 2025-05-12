/**
 * Script para verificar a estrutura da tabela demo_forms
 * Isso ajuda no diagnóstico de problemas com a funcionalidade de salvamento automático
 */

import pg from 'pg';
const { Pool } = pg;

async function main() {
  try {
    // Conectar ao banco de dados
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    console.log('Verificando estrutura da tabela demo_forms...');
    
    // Verificar se a tabela existe
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'demo_forms'
      );
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    
    if (!tableExists) {
      console.log('A tabela demo_forms não existe. Criando...');
      
      await pool.query(`
        CREATE TABLE IF NOT EXISTS demo_forms (
          id SERIAL PRIMARY KEY,
          form_title TEXT,
          form_data JSONB,
          status TEXT DEFAULT 'rascunho',
          created_by TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        COMMENT ON TABLE demo_forms IS 'Tabela de demonstração para teste de sincronização e salvamento automático';
        
        CREATE INDEX IF NOT EXISTS demo_forms_created_at_idx ON demo_forms (created_at DESC);
      `);
      
      console.log('Tabela demo_forms criada com sucesso!');
    } else {
      console.log('A tabela demo_forms existe, verificando estrutura...');
      
      // Verificar colunas
      const columnsCheck = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'demo_forms';
      `);
      
      console.log('Estrutura atual da tabela demo_forms:');
      columnsCheck.rows.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type}`);
      });
      
      // Verificar índices
      const indexCheck = await pool.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'demo_forms';
      `);
      
      console.log('\nÍndices na tabela demo_forms:');
      if (indexCheck.rows.length === 0) {
        console.log('Nenhum índice encontrado. Criando índice para melhorar performance...');
        await pool.query(`
          CREATE INDEX IF NOT EXISTS demo_forms_created_at_idx ON demo_forms (created_at DESC);
        `);
        console.log('Índice demo_forms_created_at_idx criado com sucesso!');
      } else {
        indexCheck.rows.forEach(idx => {
          console.log(`- ${idx.indexname}: ${idx.indexdef}`);
        });
      }
      
      // Verificar quantidade de registros
      const countCheck = await pool.query(`
        SELECT COUNT(*) as count FROM demo_forms;
      `);
      
      console.log(`\nTotal de registros na tabela demo_forms: ${countCheck.rows[0].count}`);
      
      // Exibir alguns registros de exemplo, se existirem
      if (parseInt(countCheck.rows[0].count) > 0) {
        const sampleData = await pool.query(`
          SELECT * FROM demo_forms ORDER BY created_at DESC LIMIT 3;
        `);
        
        console.log('\nAmostras de registros (3 mais recentes):');
        sampleData.rows.forEach((record, index) => {
          console.log(`\nRegistro #${index + 1} (ID: ${record.id}):`);
          console.log(`- Título: ${record.form_title}`);
          console.log(`- Status: ${record.status}`);
          console.log(`- Criado por: ${record.created_by}`);
          console.log(`- Data de criação: ${record.created_at}`);
          if (record.form_data) {
            try {
              const formData = record.form_data;
              console.log('- Dados do formulário:');
              console.log(`  - Título: ${formData.title || 'N/A'}`);
              console.log(`  - Descrição: ${formData.description || 'N/A'}`);
              console.log(`  - Prioridade: ${formData.priority || 'N/A'}`);
            } catch (parseError) {
              console.log(`- Dados do formulário: Erro ao analisar JSON (${parseError.message})`);
            }
          } else {
            console.log('- Dados do formulário: Nenhum');
          }
        });
      }
    }
    
    // Fechar a conexão do pool
    await pool.end();
    console.log('\nVerificação concluída.');
    
  } catch (error) {
    console.error('Erro ao verificar estrutura da tabela demo_forms:', error);
  }
}

// Auto-executar função principal
main();
/**
 * Script para executar a criação dos campos do ciclo de vida de multas no Supabase
 * Este script executa o SQL que adiciona campos necessários para implementar
 * o fluxo completo de ciclo de vida de multas de trânsito
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração do cliente Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Erro: Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_SERVICE_KEY são necessárias.');
  process.exit(1);
}

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSql(query, params = []) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { query });
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao executar SQL:', error);
    throw error;
  }
}

async function executeFromFile(filename) {
  try {
    // Ler o arquivo SQL
    const sqlFilePath = path.join(__dirname, filename);
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log(`Executando script SQL do arquivo: ${filename}`);
    
    // Execute o SQL
    await executeSql(sqlContent);
    
    console.log('Script SQL executado com sucesso!');
    
    // Verificar se os campos foram adicionados
    const { data, error } = await supabase
      .from('traffic_fines')
      .select('id, lifecycle')
      .limit(1);
    
    if (error) {
      console.warn('Alerta: Não foi possível verificar a tabela traffic_fines.', error);
    } else {
      console.log('Verificação da tabela: ', data ? 'Tabela existe' : 'Tabela vazia ou não existe');
    }
    
    // Verificar informações sobre a estrutura da tabela
    const columnsQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'traffic_fines'
      ORDER BY ordinal_position;
    `;
    
    const { data: columns, error: columnsError } = await supabase.rpc('exec_sql', { query: columnsQuery });
    
    if (columnsError) {
      console.warn('Alerta: Não foi possível verificar as colunas da tabela.', columnsError);
    } else {
      console.log('Colunas na tabela traffic_fines:');
      console.table(columns.map(row => ({ 
        column_name: row[0],
        data_type: row[1]
      })));
    }
    
  } catch (error) {
    console.error('Erro ao executar script SQL:', error);
    process.exit(1);
  }
}

// Executar o script principal
async function main() {
  try {
    await executeFromFile('create-ciclo-vida-multas-tables.sql');
    console.log('Processo concluído com sucesso!');
  } catch (error) {
    console.error('Erro no processo principal:', error);
  }
}

// Executar o script
main();
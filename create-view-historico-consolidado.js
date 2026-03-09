/**
 * Script para criar a view historico_consolidado_abastecimentos no Supabase
 * Esta view é necessária para a página de histórico consolidado funcionar
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Verificar variáveis necessárias
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Erro: Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_SERVICE_KEY são necessárias');
  process.exit(1);
}

// Inicializar cliente Supabase com service key (permissões elevadas)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const main = async () => {
  try {
    console.log('Iniciando criação da view historico_consolidado_abastecimentos...');
    
    // Ler o SQL do arquivo
    const sql = fs.readFileSync('./create-historico-consolidado-view.sql', 'utf8');
    
    // Executar o SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Erro ao executar SQL:', error);
      
      // Tentar executar com função alternativa se a primeira falhar
      console.log('Tentando método alternativo...');
      const { error: altError } = await supabase.from('_exec_sql').select('*').filter('query', 'eq', sql);
      
      if (altError) {
        console.error('Erro no método alternativo:', altError);
        process.exit(1);
      } else {
        console.log('View criada com sucesso pelo método alternativo!');
      }
    } else {
      console.log('View criada com sucesso!');
    }
    
    // Verificar se a view foi criada
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.views')
      .select('table_name')
      .eq('table_name', 'historico_consolidado_abastecimentos');
      
    if (tablesError) {
      console.error('Erro ao verificar se a view foi criada:', tablesError);
    } else {
      if (tables && tables.length > 0) {
        console.log('✅ View historico_consolidado_abastecimentos existe no banco de dados');
        
        // Verificar quantidade de registros
        const { count, error: countError } = await supabase
          .from('historico_consolidado_abastecimentos')
          .select('*', { count: 'exact', head: true });
          
        if (countError) {
          console.error('Erro ao contar registros:', countError);
        } else {
          console.log(`✅ A view contém ${count} registros`);
        }
      } else {
        console.log('⚠️ A view não foi encontrada no banco de dados');
      }
    }
  } catch (err) {
    console.error('Erro inesperado:', err);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Erro na execução:', err);
  process.exit(1);
});
/**
 * Script para verificar quais tabelas do Posto Murici existem no Supabase
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Verificar variáveis de ambiente
if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_SERVICE_KEY) {
  console.error('Erro: Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_SERVICE_KEY são obrigatórias');
  process.exit(1);
}

// Inicializar cliente Supabase com a chave de serviço
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_KEY
);

// Lista de tabelas do Posto Murici que precisamos verificar
const tabelasPostoMurici = [
  'posto_murici_postos',
  'posto_murici_tanques',
  'posto_murici_abastecimentos',
  'posto_murici_abastecimentos_tanque',
  'posto_murici_configuracoes',
  'posto_murici_movimentacoes_patio'
];

/**
 * Função para verificar se uma tabela existe
 * @param {string} tableName - Nome da tabela a ser verificada
 * @returns {Promise<boolean>} - Retorna true se a tabela existir, false caso contrário
 */
async function tableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', tableName);

    if (error) throw error;
    return data && data.length > 0;
  } catch (error) {
    console.error(`Erro ao verificar tabela ${tableName}:`, error);
    return false;
  }
}

/**
 * Função principal para verificar todas as tabelas
 */
async function verificarTabelas() {
  try {
    console.log('Verificando tabelas do Posto Murici no Supabase...');
    console.log('---------------------------------------------');
    
    const tabelasExistentes = [];
    const tabelasFaltantes = [];
    
    // Verificar cada tabela
    for (const tabela of tabelasPostoMurici) {
      const existe = await tableExists(tabela);
      
      if (existe) {
        tabelasExistentes.push(tabela);
        console.log(`✅ Tabela ${tabela} já existe`);
      } else {
        tabelasFaltantes.push(tabela);
        console.log(`❌ Tabela ${tabela} não existe`);
      }
    }
    
    console.log('---------------------------------------------');
    console.log('Resumo:');
    console.log(`- Total de tabelas verificadas: ${tabelasPostoMurici.length}`);
    console.log(`- Tabelas existentes: ${tabelasExistentes.length}`);
    console.log(`- Tabelas faltantes: ${tabelasFaltantes.length}`);
    
    if (tabelasFaltantes.length > 0) {
      console.log('\nTabelas que precisam ser criadas:');
      tabelasFaltantes.forEach(tabela => console.log(`- ${tabela}`));
    } else {
      console.log('\nTodas as tabelas do Posto Murici já existem no Supabase!');
    }
    
  } catch (error) {
    console.error('Erro ao verificar tabelas:', error);
    process.exit(1);
  }
}

// Executar o script
verificarTabelas();
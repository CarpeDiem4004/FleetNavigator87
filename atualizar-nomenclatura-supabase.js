/**
 * Script para atualizar a nomenclatura das tabelas no Supabase
 * de "abastecimentos_posto_" para "posto_murici_"
 */

import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hvsmxxqkuyjhpsiojupb.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

// Cliente do Supabase com permissões de serviço
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Função para executar SQL diretamente no Supabase
async function executarSQL(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao executar SQL:', error);
    throw error;
  }
}

// Função para obter todas as tabelas e views com o prefixo antigo
async function obterTabelasComPrefixoAntigo() {
  try {
    const sql = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE 'abastecimentos_posto_%'
      ORDER BY table_name;
    `;
    
    return await executarSQL(sql);
  } catch (error) {
    console.error('Erro ao obter tabelas:', error);
    throw error;
  }
}

// Função para renomear uma tabela ou view
async function renomearTabela(nomeAntigo, nomeNovo) {
  try {
    const sql = `ALTER TABLE IF EXISTS "${nomeAntigo}" RENAME TO "${nomeNovo}";`;
    console.log(`Renomeando: ${nomeAntigo} -> ${nomeNovo}`);
    return await executarSQL(sql);
  } catch (error) {
    console.error(`Erro ao renomear tabela ${nomeAntigo}:`, error);
    // Continuar mesmo com erro
    return null;
  }
}

// Função para verificar se a tabela ou view existe
async function verificarTabela(nome) {
  try {
    const sql = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '${nome}'
      );
    `;
    const resultado = await executarSQL(sql);
    return resultado && resultado.length > 0 && resultado[0].exists;
  } catch (error) {
    console.error(`Erro ao verificar existência da tabela ${nome}:`, error);
    return false;
  }
}

// Função principal para renomear todas as tabelas
async function atualizarNomenclatura() {
  try {
    console.log('Iniciando atualização de nomenclatura no Supabase...');
    
    // Obter todas as tabelas e views com o prefixo antigo
    const tabelas = await obterTabelasComPrefixoAntigo();
    
    if (!tabelas || tabelas.length === 0) {
      console.log('Nenhuma tabela encontrada com o prefixo antigo.');
      return;
    }
    
    console.log(`Encontradas ${tabelas.length} tabelas para renomear.`);
    
    // Processar cada tabela
    for (const { table_name } of tabelas) {
      // Novo nome substituindo o prefixo
      const nomeNovo = table_name.replace('abastecimentos_posto_', 'posto_murici_');
      
      // Verificar se a tabela com novo nome já existe
      const jaExiste = await verificarTabela(nomeNovo);
      
      if (jaExiste) {
        console.log(`A tabela "${nomeNovo}" já existe. Ignorando.`);
        continue;
      }
      
      // Renomear a tabela
      await renomearTabela(table_name, nomeNovo);
    }
    
    console.log('Atualização de nomenclatura concluída com sucesso!');
  } catch (error) {
    console.error('Erro na atualização de nomenclatura:', error);
  }
}

// Executar o script
atualizarNomenclatura().catch(console.error);
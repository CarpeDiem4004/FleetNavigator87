/**
 * Script para criar views de manutenção no Supabase
 * Essas views consolidam dados de múltiplas tabelas para o painel operacional
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERRO: Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_SERVICE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSql(sql, description) {
  try {
    console.log(`\n📋 ${description}...`);
    
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      // Tentar executar diretamente via API admin
      const { error } = await supabase.rpc('exec_sql', { query: sql });
      if (error) {
        console.error(`❌ Erro ao executar ${description}:`, error.message);
        return false;
      }
    }
    
    console.log(`✅ ${description} executado com sucesso!`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao executar ${description}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Criando views de manutenção no Supabase...\n');

  // Ler o arquivo SQL
  const sqlContent = fs.readFileSync('./create-maintenance-dashboard-view.sql', 'utf8');
  
  // Dividir o conteúdo em comandos individuais
  const sqlCommands = sqlContent
    .split(/;[\s]*$/m)
    .filter(cmd => cmd.trim().length > 0)
    .map(cmd => cmd.trim() + ';');

  // Executar cada comando
  for (let i = 0; i < sqlCommands.length; i++) {
    const command = sqlCommands[i];
    
    // Extrair o nome da view do comando
    const viewNameMatch = command.match(/CREATE OR REPLACE VIEW\s+(\w+)/i);
    const viewName = viewNameMatch ? viewNameMatch[1] : `Comando ${i + 1}`;
    
    await executeSql(command, `Criando view ${viewName}`);
  }

  console.log('\n✅ Processo concluído!');
  
  // Testar as views criadas
  console.log('\n🔍 Testando as views criadas...\n');
  
  const viewsToTest = [
    'painel_manutencao_resumo',
    'painel_manutencao_detalhes',
    'painel_manutencao_kpis',
    'painel_manutencao_por_oficina'
  ];

  for (const viewName of viewsToTest) {
    try {
      const { data, error } = await supabase
        .from(viewName)
        .select('*')
        .limit(1);
        
      if (error) {
        console.error(`❌ Erro ao testar view ${viewName}:`, error.message);
      } else {
        console.log(`✅ View ${viewName} está funcionando corretamente!`);
      }
    } catch (error) {
      console.error(`❌ Erro ao testar view ${viewName}:`, error.message);
    }
  }
}

main().catch(console.error);
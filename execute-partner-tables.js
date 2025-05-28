/**
 * Script para criar as tabelas necessárias para as funcionalidades dos parceiros
 * Execute com: node execute-partner-tables.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_SERVICE_KEY são necessárias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSql(sql, description) {
  try {
    console.log(`🔄 Executando: ${description}`);
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error(`❌ Erro em ${description}:`, error.message);
      return false;
    }
    
    console.log(`✅ Concluído: ${description}`);
    return true;
  } catch (error) {
    console.error(`❌ Erro inesperado em ${description}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando criação das tabelas de funcionalidades dos parceiros...\n');

  // Ler o arquivo SQL
  const sqlFile = path.join(__dirname, 'create-partner-auth-tables.sql');
  
  if (!fs.existsSync(sqlFile)) {
    console.error('❌ Arquivo create-partner-auth-tables.sql não encontrado');
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(sqlFile, 'utf8');
  
  // Dividir em comandos individuais
  const commands = sqlContent
    .split(';')
    .map(cmd => cmd.trim())
    .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < commands.length; i++) {
    const command = commands[i];
    
    // Extrair descrição do comando
    let description = `Comando ${i + 1}`;
    if (command.includes('CREATE TABLE')) {
      const match = command.match(/CREATE TABLE.*?(\w+)/);
      if (match) description = `Criando tabela ${match[1]}`;
    } else if (command.includes('CREATE INDEX')) {
      const match = command.match(/CREATE INDEX.*?(\w+)/);
      if (match) description = `Criando índice ${match[1]}`;
    } else if (command.includes('CREATE OR REPLACE FUNCTION')) {
      const match = command.match(/CREATE OR REPLACE FUNCTION\s+(\w+)/);
      if (match) description = `Criando função ${match[1]}`;
    } else if (command.includes('CREATE TRIGGER')) {
      const match = command.match(/CREATE TRIGGER\s+(\w+)/);
      if (match) description = `Criando trigger ${match[1]}`;
    } else if (command.includes('CREATE OR REPLACE VIEW')) {
      const match = command.match(/CREATE OR REPLACE VIEW\s+(\w+)/);
      if (match) description = `Criando view ${match[1]}`;
    }

    const success = await executeSql(command, description);
    if (success) {
      successCount++;
    } else {
      errorCount++;
    }
    
    // Pequena pausa entre comandos
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n📊 Resumo da execução:');
  console.log(`✅ Sucessos: ${successCount}`);
  console.log(`❌ Erros: ${errorCount}`);
  console.log(`📝 Total de comandos: ${commands.length}`);

  if (errorCount === 0) {
    console.log('\n🎉 Todas as tabelas foram criadas com sucesso!');
    console.log('\n📋 Tabelas criadas:');
    console.log('• partner_sessions - Controle de sessões dos parceiros');
    console.log('• partner_access_logs - Logs de acesso dos parceiros');
    console.log('• partner_notifications - Notificações para parceiros');
    console.log('• partner_documents - Documentos dos parceiros');
    console.log('• partner_service_ratings - Avaliações de serviços');
    console.log('• partner_settings - Configurações dos parceiros');
    console.log('• partner_status_history - Histórico de status');
    console.log('• partner_messages - Sistema de mensagens');
    console.log('• partner_statistics (view) - Estatísticas dos parceiros');
  } else {
    console.log('\n⚠️  Algumas tabelas podem não ter sido criadas corretamente.');
    console.log('Verifique os erros acima e execute novamente se necessário.');
  }
}

// Executar script
main().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
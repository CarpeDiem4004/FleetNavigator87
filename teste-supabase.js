// Teste de conexão com o Supabase
import { createClient } from '@supabase/supabase-js';

// URL do Supabase
const supabaseUrl = 'https://hvsmxxqkuyjhpsiojupb.supabase.co';

// Chave anônima para autenticação e operações permitidas pelo RLS
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MTU3MTIsImV4cCI6MjA2MDM5MTcxMn0.WzPEqHiPiS66yySX8X3H1gq1U8tedXpRSnyk-KzAFTA';

// Chave de serviço para operações administrativas (contorna RLS)
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDkwMzQ2MiwiZXhwIjoyMDYwMjc5NDYyfQ.M5Yf9Y-YRsF1hRfpZcnJHWdDR3x8T0yzIKbXZTXZQOY';

// Cliente Supabase padrão com chave anônima
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente Supabase com chave de serviço
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testarConexaoAnon() {
  try {
    console.log('Testando conexão com chave anônima...');
    const { data, error } = await supabase
      .from('controle_tanques')
      .select()
      .limit(1);
    
    if (error) {
      console.error('Erro ao conectar com chave anônima:', error);
    } else {
      console.log('Conexão com chave anônima bem-sucedida!');
      console.log('Dados recuperados:', data);
    }
  } catch (e) {
    console.error('Exceção ao testar conexão anônima:', e);
  }
}

async function testarConexaoService() {
  try {
    console.log('Testando conexão com chave de serviço...');
    const { data, error } = await supabaseAdmin
      .from('controle_tanques')
      .select()
      .limit(1);
    
    if (error) {
      console.error('Erro ao conectar com chave de serviço:', error);
    } else {
      console.log('Conexão com chave de serviço bem-sucedida!');
      console.log('Dados recuperados:', data);
    }
  } catch (e) {
    console.error('Exceção ao testar conexão de serviço:', e);
  }
}

async function testarConexoes() {
  await testarConexaoAnon();
  console.log('-----------------------');
  await testarConexaoService();
}

testarConexoes();
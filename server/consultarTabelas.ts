import { createClient } from '@supabase/supabase-js';

// Credenciais do Supabase (usando as mesmas do arquivo principal)
const supabaseUrl = process.env.SUPABASE_URL || 'https://hvsmxxqkuyjhpsiojupb.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MTU3MTIsImV4cCI6MjA2MDM5MTcxMn0.WzPEqHiPiS66yySX8X3H1gq1U8tedXpRSnyk-KzAFTA';

// Inicializa cliente do Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function listarTabelas() {
  console.log('Conectando ao Supabase para listar tabelas...');
  
  try {
    // Consulta para listar as tabelas no schema 'public'
    const { data, error } = await supabase.rpc('list_tables');

    if (error) {
      console.error('Erro ao tentar listar tabelas:', error);
      
      // Tentar uma abordagem alternativa se o RPC não estiver disponível
      console.log('Tentando consultar tabela de informações do sistema...');
      
      // Tentativa alternativa consultando as tabelas que sabemos existir
      const tables = [
        'users',
        'vehicles',
        'bases',
        'workshops',
        'posts',
        'movimentacao_pneu',
        'pneus'
      ];
      
      console.log('Verificando tabelas conhecidas:');
      for (const table of tables) {
        const { data: countData, error: countError } = await supabase
          .from(table)
          .select('count', { count: 'exact', head: true });
          
        if (countError) {
          console.log(`- ${table}: ERRO (${countError.message})`);
        } else {
          console.log(`- ${table}: OK (${countData?.count || 'N/A'} registros)`);
        }
      }
      
      return;
    }
    
    console.log('Tabelas encontradas:');
    console.log(data);
    
    // Verificar tabela users especificamente
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
      
    if (usersError) {
      console.error('Erro ao consultar tabela users:', usersError);
    } else {
      console.log(`Tabela 'users' contém ${usersData.length} registros (primeiros 5):`);
      console.log(JSON.stringify(usersData, null, 2));
    }
    
  } catch (error) {
    console.error('Erro não tratado:', error);
  }
}

// Executa a função
listarTabelas().then(() => {
  console.log('Consulta finalizada.');
});
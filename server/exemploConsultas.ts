import { createClient } from '@supabase/supabase-js';

// Credenciais do Supabase (usando as mesmas do arquivo principal)
const supabaseUrl = process.env.SUPABASE_URL || 'https://hvsmxxqkuyjhpsiojupb.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MTU3MTIsImV4cCI6MjA2MDM5MTcxMn0.WzPEqHiPiS66yySX8X3H1gq1U8tedXpRSnyk-KzAFTA';

// Inicializa cliente do Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function consultarDados() {
  console.log('=== EXEMPLO DE CONSULTAS AO SUPABASE ===');
  
  // 1. Consultar usuários (tabela 'users', não 'usuarios')
  console.log('\n1. Consultando tabela users:');
  const { data: users, error: usersError } = await supabase.from('users').select('*');
  
  if (usersError) {
    console.error('Erro ao consultar usuários:', usersError);
  } else {
    console.log(`Encontrados ${users?.length || 0} usuários:`);
    console.log(JSON.stringify(users, null, 2));
  }
  
  // 2. Consultar veículos
  console.log('\n2. Consultando tabela vehicles:');
  const { data: vehicles, error: vehiclesError } = await supabase.from('vehicles').select('*');
  
  if (vehiclesError) {
    console.error('Erro ao consultar veículos:', vehiclesError);
  } else {
    console.log(`Encontrados ${vehicles?.length || 0} veículos:`);
    console.log(JSON.stringify(vehicles, null, 2));
  }
  
  // 3. Consultar bases
  console.log('\n3. Consultando tabela bases:');
  const { data: bases, error: basesError } = await supabase.from('bases').select('*');
  
  if (basesError) {
    console.error('Erro ao consultar bases:', basesError);
  } else {
    console.log(`Encontrados ${bases?.length || 0} bases:`);
    console.log(JSON.stringify(bases, null, 2));
  }
  
  // 4. Consultar pneus
  console.log('\n4. Consultando tabela pneus:');
  const { data: pneus, error: pneusError } = await supabase.from('pneus').select('*').limit(5);
  
  if (pneusError) {
    console.error('Erro ao consultar pneus:', pneusError);
  } else {
    console.log(`Encontrados ${pneus?.length || 0} pneus (limitado a 5):`);
    console.log(JSON.stringify(pneus, null, 2));
  }
  
  // 5. Exemplo de consulta filtrada - apenas usuários administradores
  console.log('\n5. Consultando apenas usuários administradores:');
  const { data: admins, error: adminsError } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'admin');
  
  if (adminsError) {
    console.error('Erro ao consultar administradores:', adminsError);
  } else {
    console.log(`Encontrados ${admins?.length || 0} administradores:`);
    console.log(JSON.stringify(admins, null, 2));
  }
}

// Executa a função
consultarDados().then(() => {
  console.log('\nConsultas finalizadas.');
});
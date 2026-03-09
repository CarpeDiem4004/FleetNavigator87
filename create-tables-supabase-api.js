import { createClient } from '@supabase/supabase-js';

// Credenciais do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Credenciais do Supabase não foram encontradas nas variáveis de ambiente');
  process.exit(1);
}

console.log('🔑 Usando Supabase URL:', supabaseUrl.substring(0, 10) + '...');
console.log('🔑 Usando Supabase Service Key:', supabaseServiceKey.substring(0, 5) + '...' + supabaseServiceKey.substring(supabaseServiceKey.length - 5));

// Criar cliente Supabase com chave de serviço
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function verificarTabela(nomeTabela) {
  console.log(`🔍 Verificando se a tabela ${nomeTabela} existe...`);
  const { data, error } = await supabase
    .from(nomeTabela)
    .select('*')
    .limit(1);
  
  if (error) {
    if (error.code === '42P01') { // relação não existe
      console.log(`❌ Tabela ${nomeTabela} não existe`);
      return false;
    } else {
      console.error(`❌ Erro ao verificar tabela ${nomeTabela}:`, error.message);
      return null; // erro desconhecido
    }
  }
  
  console.log(`✅ Tabela ${nomeTabela} já existe`);
  return true;
}

async function criarTabelaUsers() {
  console.log('🔹 Tentando criar tabela users...');
  
  const existe = await verificarTabela('users');
  if (existe === true) return true;
  if (existe === null) return false;
  
  // Primeira tentativa: criar tabela users
  try {
    const { error } = await supabase.from('users').insert([
      { 
        name: 'Primeiro Usuário',
        email: 'primeiro@exemplo.com',
        password: 'senha_temporaria',
        role: 'admin',
        is_active: true
      }
    ]).select();
    
    if (!error) {
      console.log('✅ Tabela users criada com sucesso (método 1)');
      return true;
    }
  } catch (err) {
    console.log('⚠️ Erro ao criar tabela users (método 1):', err.message);
  }
  
  return false;
}

async function criarTabelaOficinas() {
  console.log('🔹 Tentando criar tabela oficinas...');
  
  const existe = await verificarTabela('oficinas');
  if (existe === true) return true;
  if (existe === null) return false;
  
  // Primeira tentativa: criar tabela oficinas
  try {
    const { error } = await supabase.from('oficinas').insert([
      { 
        nome: 'Oficina Teste',
        endereco: 'Endereço Teste',
        telefone: '1234567890',
        contato: 'Contato Teste',
        especializada: false,
        ativa: true
      }
    ]).select();
    
    if (!error) {
      console.log('✅ Tabela oficinas criada com sucesso (método 1)');
      return true;
    }
  } catch (err) {
    console.log('⚠️ Erro ao criar tabela oficinas (método 1):', err.message);
  }
  
  return false;
}

async function criarTabelaPostoRemediosAbastecimentos() {
  console.log('🔹 Tentando criar tabela posto_remedios_abastecimentos...');
  
  const existe = await verificarTabela('posto_remedios_abastecimentos');
  if (existe === true) return true;
  if (existe === null) return false;
  
  // Primeira tentativa: criar tabela posto_remedios_abastecimentos
  try {
    const { error } = await supabase.from('posto_remedios_abastecimentos').insert([
      { 
        placa: 'ABC1234',
        km: 10000,
        projeto: 'Projeto Teste',
        motorista_nome: 'Motorista Teste',
        motorista_rg: '1234567',
        tipo_combustivel: 'diesel',
        quantidade_litros: 50,
        valor_total: 250.00,
        lavagem: false,
        valor_litro: 5.00,
        tipo_veiculo: 'frota'
      }
    ]).select();
    
    if (!error) {
      console.log('✅ Tabela posto_remedios_abastecimentos criada com sucesso (método 1)');
      return true;
    }
  } catch (err) {
    console.log('⚠️ Erro ao criar tabela posto_remedios_abastecimentos (método 1):', err.message);
  }
  
  return false;
}

async function criarTabelaWorkshops() {
  console.log('🔹 Tentando criar tabela workshops...');
  
  const existe = await verificarTabela('workshops');
  if (existe === true) return true;
  if (existe === null) return false;
  
  // Primeira tentativa: criar tabela workshops
  try {
    const { error } = await supabase.from('workshops').insert([
      { 
        name: 'Workshop Teste',
        address: 'Endereço Teste',
        phone: '1234567890',
        contact_person: 'Contato Teste',
        is_specialized: false,
        is_active: true
      }
    ]).select();
    
    if (!error) {
      console.log('✅ Tabela workshops criada com sucesso (método 1)');
      return true;
    }
  } catch (err) {
    console.log('⚠️ Erro ao criar tabela workshops (método 1):', err.message);
  }
  
  return false;
}

async function main() {
  console.log('🔄 Iniciando verificação e criação de tabelas no Supabase...');
  
  // Verificar e criar tabelas em ordem de dependência
  await criarTabelaWorkshops();
  await criarTabelaUsers();
  await criarTabelaOficinas();
  await criarTabelaPostoRemediosAbastecimentos();
  
  // Verificar novamente se as tabelas foram criadas
  console.log('\n🔍 Verificando se as tabelas foram criadas:');
  
  const tabelas = [
    'users',
    'workshops',
    'oficinas',
    'posto_remedios_abastecimentos'
  ];
  
  let todasCriadas = true;
  
  for (const tabela of tabelas) {
    const existe = await verificarTabela(tabela);
    if (!existe) {
      todasCriadas = false;
    }
  }
  
  if (todasCriadas) {
    console.log('✅ Todas as tabelas foram criadas com sucesso!');
  } else {
    console.log('⚠️ Algumas tabelas não puderam ser criadas. É necessário usar SQL direto no banco.');
  }
  
  console.log('✅ Processo concluído!');
}

main();
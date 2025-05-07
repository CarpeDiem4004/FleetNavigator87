/**
 * Script para criar as tabelas do Posto Murici no Supabase
 * Este script deve ser executado para criar todas as tabelas necessárias
 * para o funcionamento do Posto Murici no Supabase
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

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
 * Função para executar SQL diretamente no Supabase
 * @param {string} sql - Comando SQL a ser executado
 * @returns {Promise<void>}
 */
async function executeSQL(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    if (error) throw error;
    console.log('SQL executado com sucesso:', data);
    return data;
  } catch (error) {
    console.error('Erro ao executar SQL:', error);
    throw error;
  }
}

/**
 * Cria a tabela posto_murici_postos
 */
async function createPostoMuriciPostosTable() {
  if (await tableExists('posto_murici_postos')) {
    console.log('Tabela posto_murici_postos já existe.');
    return;
  }
  
  const sql = `
    CREATE TABLE posto_murici_postos (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      codigo TEXT NOT NULL UNIQUE,
      endereco TEXT,
      cidade TEXT NOT NULL,
      uf TEXT NOT NULL,
      telefone TEXT,
      responsavel TEXT,
      email_responsavel TEXT,
      esta_ativo BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  
  await executeSQL(sql);
  console.log('Tabela posto_murici_postos criada com sucesso!');
}

/**
 * Cria a tabela posto_murici_tanques
 */
async function createPostoMuriciTanquesTable() {
  if (await tableExists('posto_murici_tanques')) {
    console.log('Tabela posto_murici_tanques já existe.');
    return;
  }
  
  const sql = `
    CREATE TABLE posto_murici_tanques (
      id SERIAL PRIMARY KEY,
      posto_id INTEGER NOT NULL REFERENCES posto_murici_postos(id) ON DELETE CASCADE,
      tipo TEXT NOT NULL,
      capacidade_total NUMERIC(10, 2) NOT NULL,
      nivel_atual NUMERIC(10, 2) NOT NULL,
      valor_litro_frota NUMERIC(10, 2) NOT NULL,
      valor_litro_agregado NUMERIC(10, 2) NOT NULL,
      ultima_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  
  await executeSQL(sql);
  console.log('Tabela posto_murici_tanques criada com sucesso!');
}

/**
 * Cria a tabela posto_murici_abastecimentos
 */
async function createPostoMuriciAbastecimentosTable() {
  if (await tableExists('posto_murici_abastecimentos')) {
    console.log('Tabela posto_murici_abastecimentos já existe.');
    return;
  }
  
  const sql = `
    CREATE TABLE posto_murici_abastecimentos (
      id SERIAL PRIMARY KEY,
      posto_id INTEGER NOT NULL REFERENCES posto_murici_postos(id) ON DELETE CASCADE,
      tanque_id INTEGER NOT NULL REFERENCES posto_murici_tanques(id) ON DELETE CASCADE,
      placa TEXT NOT NULL,
      km INTEGER NOT NULL,
      tipo_veiculo TEXT NOT NULL,
      tipo_combustivel TEXT NOT NULL,
      quantidade_litros NUMERIC(10, 2) NOT NULL,
      valor_litro NUMERIC(10, 2) NOT NULL,
      valor_total NUMERIC(10, 2) NOT NULL,
      motorista TEXT NOT NULL,
      rg_motorista TEXT,
      usuario_id INTEGER,
      observacoes TEXT,
      data_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  
  await executeSQL(sql);
  console.log('Tabela posto_murici_abastecimentos criada com sucesso!');
}

/**
 * Cria a tabela posto_murici_abastecimentos_tanque
 */
async function createPostoMuriciAbastecimentosTanqueTable() {
  if (await tableExists('posto_murici_abastecimentos_tanque')) {
    console.log('Tabela posto_murici_abastecimentos_tanque já existe.');
    return;
  }
  
  const sql = `
    CREATE TABLE posto_murici_abastecimentos_tanque (
      id SERIAL PRIMARY KEY,
      posto_id INTEGER NOT NULL REFERENCES posto_murici_postos(id) ON DELETE CASCADE,
      tanque_id INTEGER NOT NULL REFERENCES posto_murici_tanques(id) ON DELETE CASCADE,
      quantidade_litros NUMERIC(10, 2) NOT NULL,
      valor_litro NUMERIC(10, 2) NOT NULL,
      valor_total NUMERIC(10, 2) NOT NULL,
      nota_fiscal TEXT,
      fornecedor TEXT,
      usuario_id INTEGER,
      data_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  
  await executeSQL(sql);
  console.log('Tabela posto_murici_abastecimentos_tanque criada com sucesso!');
}

/**
 * Cria a tabela posto_murici_configuracoes
 */
async function createPostoMuriciConfiguracoesTable() {
  if (await tableExists('posto_murici_configuracoes')) {
    console.log('Tabela posto_murici_configuracoes já existe.');
    return;
  }
  
  const sql = `
    CREATE TABLE posto_murici_configuracoes (
      id SERIAL PRIMARY KEY,
      posto_id INTEGER NOT NULL REFERENCES posto_murici_postos(id) ON DELETE CASCADE,
      nome_configuracao TEXT NOT NULL,
      valor TEXT,
      tipo TEXT NOT NULL,
      descricao TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  
  await executeSQL(sql);
  console.log('Tabela posto_murici_configuracoes criada com sucesso!');
}

/**
 * Cria a tabela posto_murici_movimentacoes_patio
 */
async function createPostoMuriciMovimentacoesPatioTable() {
  if (await tableExists('posto_murici_movimentacoes_patio')) {
    console.log('Tabela posto_murici_movimentacoes_patio já existe.');
    return;
  }
  
  const sql = `
    CREATE TABLE posto_murici_movimentacoes_patio (
      id SERIAL PRIMARY KEY,
      posto_id INTEGER NOT NULL REFERENCES posto_murici_postos(id) ON DELETE CASCADE,
      placa TEXT NOT NULL,
      motorista TEXT NOT NULL,
      rg_motorista TEXT,
      tipo_operacao TEXT NOT NULL,
      base_destino TEXT,
      observacoes TEXT,
      usuario_id INTEGER,
      data_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  
  await executeSQL(sql);
  console.log('Tabela posto_murici_movimentacoes_patio criada com sucesso!');
}

/**
 * Insere um registro de posto inicial
 */
async function insertInitialPosto() {
  try {
    // Verifica se já existe algum posto
    const { data: postos, error } = await supabase
      .from('posto_murici_postos')
      .select('id')
      .limit(1);
    
    if (error) throw error;
    
    if (postos && postos.length > 0) {
      console.log('Já existem postos cadastrados. Pulando inserção inicial.');
      return;
    }
    
    // Insere o posto inicial
    const { data, error: insertError } = await supabase
      .from('posto_murici_postos')
      .insert([
        {
          nome: 'Posto Murici Osasco',
          codigo: 'MRC-OSC',
          endereco: 'Rua Murici, 123',
          cidade: 'Osasco',
          uf: 'SP',
          telefone: '(11) 1234-5678',
          responsavel: 'Administrador',
          email_responsavel: 'admin@muricionfleet.com',
          esta_ativo: true
        }
      ])
      .select();
    
    if (insertError) throw insertError;
    
    console.log('Posto inicial criado com sucesso:', data);
    return data[0];
  } catch (error) {
    console.error('Erro ao inserir posto inicial:', error);
    throw error;
  }
}

/**
 * Insere configurações de tanques para o posto inicial
 */
async function setupInitialTanks(postoId) {
  try {
    // Verifica se já existem tanques para o posto
    const { data: tanques, error } = await supabase
      .from('posto_murici_tanques')
      .select('id')
      .eq('posto_id', postoId)
      .limit(1);
    
    if (error) throw error;
    
    if (tanques && tanques.length > 0) {
      console.log('Já existem tanques cadastrados para o posto. Pulando inserção inicial.');
      return;
    }
    
    // Insere os tanques iniciais
    const { data, error: insertError } = await supabase
      .from('posto_murici_tanques')
      .insert([
        {
          posto_id: postoId,
          tipo: 'diesel',
          capacidade_total: 10000,
          nivel_atual: 5000,
          valor_litro_frota: 5.10,
          valor_litro_agregado: 5.65
        },
        {
          posto_id: postoId,
          tipo: 'arla',
          capacidade_total: 2000,
          nivel_atual: 1000,
          valor_litro_frota: 3.20,
          valor_litro_agregado: 3.80
        }
      ])
      .select();
    
    if (insertError) throw insertError;
    
    console.log('Tanques iniciais criados com sucesso:', data);
  } catch (error) {
    console.error('Erro ao inserir tanques iniciais:', error);
    throw error;
  }
}

/**
 * Função principal para criar todas as tabelas
 */
async function main() {
  try {
    console.log('Iniciando criação das tabelas do Posto Murici no Supabase...');
    
    // Criar tabelas na ordem correta (respeitando as dependências)
    await createPostoMuriciPostosTable();
    await createPostoMuriciTanquesTable();
    await createPostoMuriciAbastecimentosTable();
    await createPostoMuriciAbastecimentosTanqueTable();
    await createPostoMuriciConfiguracoesTable();
    await createPostoMuriciMovimentacoesPatioTable();
    
    // Inserir dados iniciais
    const posto = await insertInitialPosto();
    if (posto && posto.id) {
      await setupInitialTanks(posto.id);
    }
    
    console.log('Criação das tabelas do Posto Murici concluída com sucesso!');
  } catch (error) {
    console.error('Erro ao criar tabelas:', error);
    process.exit(1);
  }
}

// Executar o script
main();
/**
 * Script para verificar as tabelas de postos no Supabase
 * Este script verifica quais tabelas existem e quais precisam ser criadas
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY;

// Validando configurações
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente VITE_SUPABASE_URL ou VITE_SUPABASE_SERVICE_KEY não definidas');
  process.exit(1);
}

// Inicializando o cliente Supabase
console.log(`🔄 Conectando ao Supabase: ${supabaseUrl.substring(0, 15)}...`);
const supabase = createClient(supabaseUrl, supabaseKey);

// Lista de tabelas a verificar
const tabelasPostos = [
  // Tabelas genéricas do sistema
  'abastecimentos_postos',
  'configuracao_tanques',
  'movimentacoes_patio',
  
  // Tabelas específicas para ABC_v2
  'abastecimentos_posto_abc_v2',
  'configuracao_tanques_abc_v2',
  'movimentacoes_patio_abc_v2',
  'recebimentos_posto_abc_v2',
  
  // Tabelas específicas para Socorro_v2
  'abastecimentos_posto_socorro_v2',
  'configuracao_tanques_socorro_v2',
  'movimentacoes_patio_socorro_v2',
  'recebimentos_posto_socorro_v2',
  
  // Views
  'historico_consolidado_abc_v2',
  'historico_consolidado_socorro_v2',
  'status_tanques_abc_v2',
  'status_tanques_socorro_v2'
];

// Função para verificar se uma tabela existe
async function verificarTabela(nome) {
  try {
    const { data, error } = await supabase
      .from(nome)
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.code === 'PGRST116') {
        return { existe: false, erro: null };
      }
      return { existe: false, erro: error };
    }
    
    return { existe: true, erro: null };
  } catch (error) {
    return { existe: false, erro: error };
  }
}

// Função para verificar todas as tabelas
async function verificarTodasTabelas() {
  console.log('🔎 Verificando tabelas no Supabase...\n');
  
  const tabelasExistentes = [];
  const tabelasFaltantes = [];
  const erros = [];
  
  for (const tabela of tabelasPostos) {
    const { existe, erro } = await verificarTabela(tabela);
    
    if (existe) {
      tabelasExistentes.push(tabela);
      console.log(`✅ Tabela ${tabela} - EXISTE`);
    } else if (erro) {
      erros.push({ tabela, erro });
      console.log(`❌ Tabela ${tabela} - ERRO AO VERIFICAR: ${erro.message}`);
    } else {
      tabelasFaltantes.push(tabela);
      console.log(`❌ Tabela ${tabela} - NÃO EXISTE`);
    }
  }
  
  console.log('\n📊 Resumo da verificação:');
  console.log(`✅ ${tabelasExistentes.length} tabelas existentes`);
  console.log(`❌ ${tabelasFaltantes.length} tabelas faltantes`);
  console.log(`⚠️ ${erros.length} erros de verificação`);
  
  if (tabelasFaltantes.length > 0) {
    console.log('\n📝 Lista de tabelas faltantes:');
    tabelasFaltantes.forEach(tabela => {
      console.log(`  - ${tabela}`);
    });
    
    console.log('\n🔧 SQL para criar as tabelas faltantes:');
    gerarSQL(tabelasFaltantes);
  }
}

// Função para gerar o SQL para criar as tabelas faltantes
function gerarSQL(tabelasFaltantes) {
  let sqlScript = '';
  
  // Função para determinar o tipo de tabela
  const getTipoTabela = (nome) => {
    if (nome.startsWith('abastecimentos_posto_')) return 'abastecimento';
    if (nome.startsWith('configuracao_tanques_')) return 'configuracao';
    if (nome.startsWith('movimentacoes_patio_')) return 'movimentacao';
    if (nome.startsWith('recebimentos_posto_')) return 'recebimento';
    if (nome.startsWith('status_tanques_')) return 'view_status';
    if (nome.startsWith('historico_consolidado_')) return 'view_historico';
    return 'generico';
  };
  
  for (const tabela of tabelasFaltantes) {
    const tipo = getTipoTabela(tabela);
    
    switch (tipo) {
      case 'abastecimento':
        sqlScript += `
-- Criação da tabela ${tabela}
CREATE TABLE IF NOT EXISTS ${tabela} (
  id SERIAL PRIMARY KEY,
  placa VARCHAR(10) NOT NULL,
  km_atual INTEGER,
  hodometro_atual INTEGER,
  tipo_combustivel VARCHAR(20) NOT NULL,
  litros NUMERIC(10, 2) NOT NULL,
  motorista VARCHAR(100),
  motorista_rg VARCHAR(20),
  operador VARCHAR(100),
  valor_litro NUMERIC(10, 2),
  valor_total NUMERIC(10, 2),
  tipo_veiculo VARCHAR(50),
  observacoes TEXT,
  lavagem BOOLEAN DEFAULT FALSE,
  tipo_lavagem VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

`;
        break;
        
      case 'configuracao':
        sqlScript += `
-- Criação da tabela ${tabela}
CREATE TABLE IF NOT EXISTS ${tabela} (
  id SERIAL PRIMARY KEY,
  tipo_combustivel VARCHAR(20) NOT NULL,
  capacidade_total NUMERIC(10, 2) NOT NULL,
  nivel_atual NUMERIC(10, 2) NOT NULL,
  valor_litro NUMERIC(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inserir configuração inicial de tanques (caso necessário)
INSERT INTO ${tabela} (tipo_combustivel, capacidade_total, nivel_atual, valor_litro)
VALUES
  ('Diesel', 10000, 5000, 4.59),
  ('Gasolina', 5000, 2500, 5.79)
ON CONFLICT DO NOTHING;

`;
        break;
        
      case 'movimentacao':
        sqlScript += `
-- Criação da tabela ${tabela}
CREATE TABLE IF NOT EXISTS ${tabela} (
  id SERIAL PRIMARY KEY,
  placa VARCHAR(10) NOT NULL,
  data_entrada TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  data_saida TIMESTAMP WITH TIME ZONE,
  nome_motorista VARCHAR(100),
  rg_motorista VARCHAR(20),
  nome_operador VARCHAR(100),
  tipo_movimento VARCHAR(50),
  motivo TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

`;
        break;
        
      case 'recebimento':
        sqlScript += `
-- Criação da tabela ${tabela}
CREATE TABLE IF NOT EXISTS ${tabela} (
  id SERIAL PRIMARY KEY,
  tipo_combustivel VARCHAR(20) NOT NULL,
  quantidade_litros NUMERIC(10, 2) NOT NULL,
  valor_litro NUMERIC(10, 2),
  valor_total NUMERIC(10, 2),
  fornecedor VARCHAR(100),
  nota_fiscal VARCHAR(50),
  data_recebimento TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  operador VARCHAR(100),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

`;
        break;
        
      case 'view_status':
        // Extrair o nome do posto da view
        const postoNome = tabela.replace('status_tanques_', '');
        sqlScript += `
-- Criação da view ${tabela}
CREATE OR REPLACE VIEW ${tabela} AS
SELECT
  ct.id,
  ct.tipo_combustivel,
  ct.capacidade_total,
  ct.nivel_atual,
  ct.valor_litro,
  ROUND((ct.nivel_atual / ct.capacidade_total) * 100) AS percentual,
  (
    SELECT COALESCE(SUM(litros), 0)
    FROM abastecimentos_posto_${postoNome}
    WHERE tipo_combustivel = ct.tipo_combustivel
    AND created_at > (CURRENT_DATE - INTERVAL '30 days')
  ) AS consumo_mensal
FROM configuracao_tanques_${postoNome} ct;

`;
        break;
        
      case 'view_historico':
        // Extrair o nome do posto da view
        const postoViewNome = tabela.replace('historico_consolidado_', '');
        sqlScript += `
-- Criação da view ${tabela}
CREATE OR REPLACE VIEW ${tabela} AS
SELECT
  'abastecimento' AS tipo_operacao,
  a.id,
  a.created_at AS data_operacao,
  a.placa,
  a.tipo_combustivel,
  a.litros AS quantidade,
  a.valor_litro,
  a.valor_total,
  a.motorista AS responsavel,
  NULL AS nota_fiscal,
  NULL AS fornecedor,
  a.observacoes
FROM abastecimentos_posto_${postoViewNome} a
UNION ALL
SELECT
  'recebimento' AS tipo_operacao,
  r.id,
  r.created_at AS data_operacao,
  NULL AS placa,
  r.tipo_combustivel,
  r.quantidade_litros AS quantidade,
  r.valor_litro,
  r.valor_total,
  r.operador AS responsavel,
  r.nota_fiscal,
  r.fornecedor,
  r.observacoes
FROM recebimentos_posto_${postoViewNome} r
ORDER BY data_operacao DESC;

`;
        break;
        
      default:
        sqlScript += `
-- Não foi possível gerar script automático para a tabela ${tabela}
-- Esta tabela precisa ser criada manualmente.

`;
    }
  }
  
  // Imprimir o script SQL
  console.log(sqlScript);
  
  // Sugerir nome de arquivo para salvar o script
  const nomeArquivo = `create-missing-tables-${new Date().toISOString().split('T')[0]}.sql`;
  console.log(`\n💾 Sugestão: Salve o script SQL acima em um arquivo chamado ${nomeArquivo}`);
  console.log(`   Em seguida, execute o SQL no Editor SQL do Supabase ou usando o script create-js-tool-for-postgres.js`);
}

// Executar a verificação
async function main() {
  try {
    await verificarTodasTabelas();
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

main();
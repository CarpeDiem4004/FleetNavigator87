/**
 * Script para criar tabelas separadas para cada posto no Supabase
 * Executar com: node scripts/criar-tabelas-postos-supabase.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuração do cliente Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: As variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_SERVICE_KEY precisam estar configuradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Lista de postos para criar tabelas (conforme tabela postos_mapeamento)
const postos = [
  'Campinas',
  'Osasco',
  'ABC',
  'Socorro',
  'Sorocaba',
  'SaoPaulo',
  'Ipatinga',
  'BotaFogo',
  'Remedios',
  'VargemGrande',
  'Guarulhos' // Adicionado manualmente pois existe nos dados
];

// Função para criar a tabela de um posto específico
async function criarTabelaPosto(posto) {
  // Nome da tabela com formato padronizado: abastecimentos_posto_[nome]
  const nomeTabela = `abastecimentos_posto_${posto.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  
  console.log(`Criando tabela ${nomeTabela} para o posto ${posto}...`);
  
  // Query SQL para criar a tabela com a estrutura expandida para todas as colunas possíveis
  const query = `
    -- Tabela principal de abastecimentos do posto
    CREATE TABLE IF NOT EXISTS "${nomeTabela}" (
      id SERIAL PRIMARY KEY,
      placa TEXT NOT NULL,
      km_atual NUMERIC,
      hodometro_atual NUMERIC,
      hodometro_anterior NUMERIC,
      tipo_combustivel TEXT,
      litros NUMERIC,
      quantity_litros NUMERIC,
      quantidade_litros NUMERIC,
      nome_motorista TEXT,
      motorista TEXT,
      motorista_nome TEXT,
      operador TEXT,
      nome_operador TEXT,
      posto TEXT,
      project TEXT,
      projeto TEXT,
      preco_litro NUMERIC,
      valor_litro NUMERIC,
      valor_total NUMERIC,
      rg_motorista TEXT,
      motorista_rg TEXT,
      tipo_veiculo TEXT,
      observacoes TEXT,
      lavagem BOOLEAN DEFAULT false,
      tipo_lavagem TEXT,
      sincronizado BOOLEAN DEFAULT true,
      sincronizado_supabase BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      data_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Tabela de histórico para armazenar todas as alterações nos abastecimentos
    CREATE TABLE IF NOT EXISTS "${nomeTabela}_historico" (
      id SERIAL PRIMARY KEY,
      abastecimento_id INTEGER NOT NULL,
      acao TEXT NOT NULL,
      dados JSONB NOT NULL,
      usuario TEXT,
      ip_address TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- View para facilitar a consulta de histórico recente por posto
    CREATE OR REPLACE VIEW "${nomeTabela}_recentes" AS
    SELECT * FROM "${nomeTabela}"
    ORDER BY created_at DESC
    LIMIT 100;
    
    -- View para estatísticas de consumo mensal
    CREATE OR REPLACE VIEW "${nomeTabela}_estatisticas_mensais" AS
    SELECT 
      date_trunc('month', created_at) AS mes,
      tipo_combustivel,
      COUNT(*) AS total_abastecimentos,
      SUM(COALESCE(litros, quantidade_litros, quantity_litros)) AS total_litros,
      SUM(valor_total) AS valor_total,
      AVG(COALESCE(preco_litro, valor_litro)) AS preco_medio_litro
    FROM "${nomeTabela}"
    GROUP BY date_trunc('month', created_at), tipo_combustivel
    ORDER BY mes DESC, tipo_combustivel;
    
    -- Função para atualizar o histórico automaticamente
    CREATE OR REPLACE FUNCTION log_${nomeTabela}_changes()
    RETURNS TRIGGER AS $$
    BEGIN
      IF (TG_OP = 'INSERT') THEN
        INSERT INTO "${nomeTabela}_historico" (abastecimento_id, acao, dados)
        VALUES (NEW.id, 'INSERT', row_to_json(NEW));
      ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO "${nomeTabela}_historico" (abastecimento_id, acao, dados)
        VALUES (NEW.id, 'UPDATE', row_to_json(NEW));
      ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO "${nomeTabela}_historico" (abastecimento_id, acao, dados)
        VALUES (OLD.id, 'DELETE', row_to_json(OLD));
      END IF;
      RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;
    
    -- Trigger para registrar alterações no histórico
    DROP TRIGGER IF EXISTS log_${nomeTabela}_changes_trigger ON "${nomeTabela}";
    CREATE TRIGGER log_${nomeTabela}_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "${nomeTabela}"
    FOR EACH ROW EXECUTE FUNCTION log_${nomeTabela}_changes();
    
    -- Índices para melhorar performance
    CREATE INDEX IF NOT EXISTS idx_${nomeTabela}_placa ON "${nomeTabela}" (placa);
    CREATE INDEX IF NOT EXISTS idx_${nomeTabela}_created_at ON "${nomeTabela}" (created_at);
    
    -- Trigger para manter o updated_at atualizado
    CREATE OR REPLACE FUNCTION update_timestamp_${nomeTabela}()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    DROP TRIGGER IF EXISTS ${nomeTabela}_update_timestamp ON "${nomeTabela}";
    CREATE TRIGGER ${nomeTabela}_update_timestamp
    BEFORE UPDATE ON "${nomeTabela}"
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_${nomeTabela}();
  `;
  
  try {
    // Executar a query SQL
    const { data, error } = await supabase.rpc('exec_sql', { query });
    
    if (error) {
      console.error(`Erro ao criar tabela para ${posto}:`, error);
      return false;
    }
    
    console.log(`Tabela para ${posto} criada com sucesso!`);
    return true;
  } catch (err) {
    console.error(`Exceção ao criar tabela para ${posto}:`, err);
    return false;
  }
}

// Função principal para criar todas as tabelas
async function criarTabelasParaTodosPosto() {
  console.log('Iniciando criação de tabelas para postos no Supabase...');
  
  const resultados = [];
  
  for (const posto of postos) {
    try {
      const resultado = await criarTabelaPosto(posto);
      resultados.push({ posto, sucesso: resultado });
    } catch (error) {
      resultados.push({ posto, sucesso: false, erro: error.message });
    }
  }
  
  console.log('\nResumo:');
  resultados.forEach(res => {
    console.log(`${res.posto}: ${res.sucesso ? 'SUCESSO' : 'FALHA'} ${res.erro ? '- ' + res.erro : ''}`);
  });
  
  const sucessos = resultados.filter(r => r.sucesso).length;
  console.log(`\nTotal: ${sucessos} de ${postos.length} tabelas criadas com sucesso.`);
}

// Executar a função principal
criarTabelasParaTodosPosto().catch(err => {
  console.error('Erro não tratado:', err);
  process.exit(1);
});
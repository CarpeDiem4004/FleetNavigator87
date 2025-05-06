/**
 * Script para criar tabelas de abastecimentos específicas para cada posto no Supabase
 * Esta solução organiza os dados por posto, facilitando consultas e evitando problemas de compatibilidade de campos
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Lista de postos para criar tabelas
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
  'Guarulhos'
];

// Função para normalizar o nome do posto para o formato da tabela
function formatarNomePosto(nome) {
  return nome.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Função para formatar o nome da tabela de um posto específico
function obterNomeTabela(posto) {
  return `posto_murici_${formatarNomePosto(posto)}`;
}

// Função para criar tabela de abastecimentos para um posto específico
async function criarTabelaPosto(posto) {
  const nomeTabela = obterNomeTabela(posto);
  const nomeExibicao = `Posto ${posto}`;
  
  try {
    // Verificar se a tabela já existe
    const checkQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = $1
      );
    `;
    
    const checkResult = await pool.query(checkQuery, [nomeTabela]);
    
    if (checkResult.rows[0].exists) {
      console.log(`Tabela ${nomeTabela} já existe, pulando criação.`);
      return false;
    }
    
    // Criar a tabela com uma estrutura expandida para suportar todos os campos possíveis
    const createTableQuery = `
      CREATE TABLE "${nomeTabela}" (
        id SERIAL PRIMARY KEY,
        placa TEXT NOT NULL,
        hodometro_atual INTEGER,
        km_atual INTEGER,
        tipo_combustivel TEXT,
        litros NUMERIC(10,2),
        quantidade_litros NUMERIC(10,2),
        quantity_litros NUMERIC(10,2),
        motorista TEXT,
        nome_motorista TEXT,
        motorista_nome TEXT,
        motorista_rg TEXT,
        rg_motorista TEXT,
        operador TEXT,
        nome_operador TEXT,
        valor_litro NUMERIC(10,2),
        preco_litro NUMERIC(10,2),
        valor_total NUMERIC(10,2),
        posto TEXT DEFAULT '${nomeExibicao}',
        tipo_veiculo TEXT,
        observacoes TEXT,
        lavagem BOOLEAN DEFAULT FALSE,
        tipo_lavagem TEXT,
        project TEXT,
        data_registro TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      -- Adicionar comentário à tabela
      COMMENT ON TABLE "${nomeTabela}" IS 'Tabela de abastecimentos específica para ${nomeExibicao}';
      
      -- Criar índices para melhorar performance de consultas comuns
      CREATE INDEX "${nomeTabela}_placa_idx" ON "${nomeTabela}" (placa);
      CREATE INDEX "${nomeTabela}_data_idx" ON "${nomeTabela}" (created_at);
      CREATE INDEX "${nomeTabela}_tipo_combustivel_idx" ON "${nomeTabela}" (tipo_combustivel);
    `;
    
    await pool.query(createTableQuery);
    console.log(`Tabela ${nomeTabela} criada com sucesso!`);
    
    // Criar tabela de histórico de alterações para rastreabilidade
    const createHistoryTableQuery = `
      CREATE TABLE "${nomeTabela}_historico" (
        id SERIAL PRIMARY KEY,
        abastecimento_id INTEGER NOT NULL,
        acao TEXT NOT NULL,
        usuario TEXT,
        dados JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      -- Adicionar comentário à tabela de histórico
      COMMENT ON TABLE "${nomeTabela}_historico" IS 'Histórico de alterações para abastecimentos de ${nomeExibicao}';
      
      -- Criar índice para consultas de histórico
      CREATE INDEX "${nomeTabela}_historico_abastecimento_idx" ON "${nomeTabela}_historico" (abastecimento_id);
    `;
    
    await pool.query(createHistoryTableQuery);
    console.log(`Tabela de histórico ${nomeTabela}_historico criada com sucesso!`);
    
    // Criar trigger para manter o histórico de alterações
    const createTriggerQuery = `
      -- Função para registrar alterações
      CREATE OR REPLACE FUNCTION ${nomeTabela}_audit_trigger_func()
      RETURNS TRIGGER AS $$
      BEGIN
        IF (TG_OP = 'UPDATE') THEN
          INSERT INTO "${nomeTabela}_historico" (abastecimento_id, acao, usuario, dados)
          VALUES (OLD.id, 'UPDATE', current_user, row_to_json(OLD));
          RETURN NEW;
        ELSIF (TG_OP = 'DELETE') THEN
          INSERT INTO "${nomeTabela}_historico" (abastecimento_id, acao, usuario, dados)
          VALUES (OLD.id, 'DELETE', current_user, row_to_json(OLD));
          RETURN OLD;
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
      
      -- Trigger para alterações
      CREATE TRIGGER ${nomeTabela}_audit_trigger
      AFTER UPDATE OR DELETE ON "${nomeTabela}"
      FOR EACH ROW EXECUTE FUNCTION ${nomeTabela}_audit_trigger_func();
    `;
    
    await pool.query(createTriggerQuery);
    console.log(`Trigger de auditoria para ${nomeTabela} criado com sucesso!`);
    
    // Criar view para estatísticas mensais
    const createStatisticsViewQuery = `
      CREATE OR REPLACE VIEW "${nomeTabela}_estatisticas_mensais" AS
      SELECT 
        date_trunc('month', created_at) AS mes,
        COALESCE(tipo_combustivel, 'Não especificado') AS tipo_combustivel,
        COUNT(*) AS total_abastecimentos,
        ROUND(SUM(COALESCE(litros, quantidade_litros, quantity_litros))::numeric, 2) AS total_litros,
        ROUND(SUM(valor_total)::numeric, 2) AS valor_total,
        ROUND(AVG(COALESCE(valor_litro, preco_litro))::numeric, 2) AS preco_medio_litro
      FROM "${nomeTabela}"
      GROUP BY date_trunc('month', created_at), tipo_combustivel
      ORDER BY date_trunc('month', created_at) DESC, tipo_combustivel;
      
      -- Adicionar comentário à view
      COMMENT ON VIEW "${nomeTabela}_estatisticas_mensais" IS 'Estatísticas mensais de abastecimentos para ${nomeExibicao}';
    `;
    
    await pool.query(createStatisticsViewQuery);
    console.log(`View de estatísticas para ${nomeTabela} criada com sucesso!`);
    
    // Criar view para últimos abastecimentos
    const createRecentViewQuery = `
      CREATE OR REPLACE VIEW "${nomeTabela}_ultimos_abastecimentos" AS
      SELECT 
        id,
        placa,
        COALESCE(hodometro_atual, km_atual) AS km,
        COALESCE(tipo_combustivel, 'Não especificado') AS tipo_combustivel,
        COALESCE(litros, quantidade_litros, quantity_litros) AS quantidade_litros,
        COALESCE(motorista, nome_motorista, motorista_nome) AS nome_motorista,
        COALESCE(valor_litro, preco_litro) AS valor_litro,
        valor_total,
        created_at
      FROM "${nomeTabela}"
      ORDER BY created_at DESC
      LIMIT 50;
      
      -- Adicionar comentário à view
      COMMENT ON VIEW "${nomeTabela}_ultimos_abastecimentos" IS 'Últimos abastecimentos para ${nomeExibicao}';
    `;
    
    await pool.query(createRecentViewQuery);
    console.log(`View de últimos abastecimentos para ${nomeTabela} criada com sucesso!`);
    
    return true;
  } catch (error) {
    console.error(`Erro ao criar tabelas para ${posto}:`, error);
    return false;
  }
}

// Função principal para criar todas as tabelas
async function criarTodasTabelas() {
  try {
    let total = 0;
    let criadas = 0;
    
    console.log(`Iniciando criação de tabelas para ${postos.length} postos...`);
    
    for (const posto of postos) {
      total++;
      const resultado = await criarTabelaPosto(posto);
      if (resultado) criadas++;
    }
    
    console.log(`\nProcesso concluído!`);
    console.log(`Total de postos processados: ${total}`);
    console.log(`Novas tabelas criadas: ${criadas}`);
    console.log(`Tabelas já existentes: ${total - criadas}`);
    
  } catch (error) {
    console.error('Erro ao processar tabelas:', error);
  } finally {
    // Fechar conexão com o banco
    await pool.end();
  }
}

// Executar o script
criarTodasTabelas().catch(console.error);
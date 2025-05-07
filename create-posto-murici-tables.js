/**
 * Script para criar as tabelas do sistema Posto Murici no Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

// Configuração do cliente Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTables() {
  try {
    console.log('Iniciando criação das tabelas para o Sistema Posto Murici...');

    // Criar tabela posto_murici_postos
    await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS "posto_murici_postos" (
          "id" SERIAL PRIMARY KEY,
          "nome" TEXT NOT NULL,
          "codigo" TEXT NOT NULL UNIQUE,
          "endereco" TEXT,
          "cidade" TEXT NOT NULL,
          "uf" TEXT NOT NULL,
          "telefone" TEXT,
          "responsavel" TEXT,
          "email_responsavel" TEXT,
          "esta_ativo" BOOLEAN DEFAULT TRUE,
          "created_at" TIMESTAMPTZ DEFAULT NOW(),
          "updated_at" TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });
    console.log('Tabela posto_murici_postos criada com sucesso');

    // Criar tabela posto_murici_tanques
    await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS "posto_murici_tanques" (
          "id" SERIAL PRIMARY KEY,
          "posto_id" INTEGER NOT NULL REFERENCES "posto_murici_postos"("id") ON DELETE CASCADE,
          "tipo" TEXT NOT NULL CHECK (tipo IN ('diesel', 'arla', 'gasolina', 'etanol')),
          "capacidade_total" NUMERIC(10, 2) NOT NULL,
          "nivel_atual" NUMERIC(10, 2) NOT NULL,
          "valor_litro_frota" NUMERIC(10, 2) NOT NULL,
          "valor_litro_agregado" NUMERIC(10, 2) NOT NULL,
          "ultima_atualizacao" TIMESTAMPTZ DEFAULT NOW(),
          "created_at" TIMESTAMPTZ DEFAULT NOW(),
          "updated_at" TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });
    console.log('Tabela posto_murici_tanques criada com sucesso');

    // Criar tabela posto_murici_abastecimentos
    await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS "posto_murici_abastecimentos" (
          "id" SERIAL PRIMARY KEY,
          "posto_id" INTEGER NOT NULL REFERENCES "posto_murici_postos"("id") ON DELETE CASCADE,
          "tanque_id" INTEGER NOT NULL REFERENCES "posto_murici_tanques"("id") ON DELETE CASCADE,
          "placa" TEXT NOT NULL,
          "km" INTEGER NOT NULL,
          "tipo_veiculo" TEXT NOT NULL CHECK (tipo_veiculo IN ('frota', 'agregado')),
          "tipo_combustivel" TEXT NOT NULL CHECK (tipo_combustivel IN ('diesel', 'arla', 'gasolina', 'etanol')),
          "quantidade_litros" NUMERIC(10, 2) NOT NULL,
          "valor_litro" NUMERIC(10, 2) NOT NULL,
          "valor_total" NUMERIC(10, 2) NOT NULL,
          "motorista" TEXT NOT NULL,
          "rg_motorista" TEXT,
          "usuario_id" INTEGER,
          "observacoes" TEXT,
          "data_registro" TIMESTAMPTZ DEFAULT NOW(),
          "created_at" TIMESTAMPTZ DEFAULT NOW(),
          "updated_at" TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });
    console.log('Tabela posto_murici_abastecimentos criada com sucesso');

    // Criar tabela posto_murici_abastecimentos_tanque
    await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS "posto_murici_abastecimentos_tanque" (
          "id" SERIAL PRIMARY KEY,
          "posto_id" INTEGER NOT NULL REFERENCES "posto_murici_postos"("id") ON DELETE CASCADE,
          "tanque_id" INTEGER NOT NULL REFERENCES "posto_murici_tanques"("id") ON DELETE CASCADE,
          "quantidade_litros" NUMERIC(10, 2) NOT NULL,
          "valor_litro" NUMERIC(10, 2) NOT NULL,
          "valor_total" NUMERIC(10, 2) NOT NULL,
          "nota_fiscal" TEXT,
          "fornecedor" TEXT,
          "usuario_id" INTEGER,
          "data_registro" TIMESTAMPTZ DEFAULT NOW(),
          "created_at" TIMESTAMPTZ DEFAULT NOW(),
          "updated_at" TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });
    console.log('Tabela posto_murici_abastecimentos_tanque criada com sucesso');

    // Criar tabela posto_murici_configuracoes
    await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS "posto_murici_configuracoes" (
          "id" SERIAL PRIMARY KEY,
          "posto_id" INTEGER NOT NULL REFERENCES "posto_murici_postos"("id") ON DELETE CASCADE,
          "nome_configuracao" TEXT NOT NULL,
          "valor" TEXT,
          "tipo" TEXT NOT NULL CHECK (tipo IN ('texto', 'numero', 'booleano', 'data')),
          "descricao" TEXT,
          "created_at" TIMESTAMPTZ DEFAULT NOW(),
          "updated_at" TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE("posto_id", "nome_configuracao")
        );
      `
    });
    console.log('Tabela posto_murici_configuracoes criada com sucesso');

    // Criar tabela posto_murici_movimentacoes_patio
    await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS "posto_murici_movimentacoes_patio" (
          "id" SERIAL PRIMARY KEY,
          "posto_id" INTEGER NOT NULL REFERENCES "posto_murici_postos"("id") ON DELETE CASCADE,
          "placa" TEXT NOT NULL,
          "motorista" TEXT NOT NULL,
          "rg_motorista" TEXT,
          "tipo_operacao" TEXT NOT NULL CHECK (
            tipo_operacao IN (
              'entrada_pernoite', 
              'saida_rota', 
              'saida_manutencao', 
              'descontinuacao', 
              'remanejamento_base',
              'entrada_carregamento',
              'saida_carregamento'
            )
          ),
          "base_destino" TEXT,
          "observacoes" TEXT,
          "usuario_id" INTEGER,
          "data_registro" TIMESTAMPTZ DEFAULT NOW(),
          "created_at" TIMESTAMPTZ DEFAULT NOW(),
          "updated_at" TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });
    console.log('Tabela posto_murici_movimentacoes_patio criada com sucesso');

    // Criação de índices
    await supabase.rpc('exec_sql', {
      query: `
        CREATE INDEX IF NOT EXISTS idx_posto_murici_abast_posto_id ON "posto_murici_abastecimentos"("posto_id");
        CREATE INDEX IF NOT EXISTS idx_posto_murici_abast_tanque_id ON "posto_murici_abastecimentos"("tanque_id");
        CREATE INDEX IF NOT EXISTS idx_posto_murici_abast_placa ON "posto_murici_abastecimentos"("placa");
        CREATE INDEX IF NOT EXISTS idx_posto_murici_abast_data ON "posto_murici_abastecimentos"("data_registro");
        CREATE INDEX IF NOT EXISTS idx_posto_murici_tanques_posto_id ON "posto_murici_tanques"("posto_id");
        CREATE INDEX IF NOT EXISTS idx_posto_murici_movimentacoes_posto_id ON "posto_murici_movimentacoes_patio"("posto_id");
        CREATE INDEX IF NOT EXISTS idx_posto_murici_movimentacoes_placa ON "posto_murici_movimentacoes_patio"("placa");
        CREATE INDEX IF NOT EXISTS idx_posto_murici_movimentacoes_data ON "posto_murici_movimentacoes_patio"("data_registro");
      `
    });
    console.log('Índices criados com sucesso');

    // Função para atualizar o timestamp automaticamente
    await supabase.rpc('exec_sql', {
      query: `
        CREATE OR REPLACE FUNCTION update_modified_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW(); 
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `
    });
    console.log('Função update_modified_column criada com sucesso');

    // Triggers para atualizar o timestamp automaticamente
    await supabase.rpc('exec_sql', {
      query: `
        DROP TRIGGER IF EXISTS update_posto_murici_postos_modtime ON "posto_murici_postos";
        CREATE TRIGGER update_posto_murici_postos_modtime
        BEFORE UPDATE ON "posto_murici_postos"
        FOR EACH ROW EXECUTE FUNCTION update_modified_column();

        DROP TRIGGER IF EXISTS update_posto_murici_tanques_modtime ON "posto_murici_tanques";
        CREATE TRIGGER update_posto_murici_tanques_modtime
        BEFORE UPDATE ON "posto_murici_tanques"
        FOR EACH ROW EXECUTE FUNCTION update_modified_column();

        DROP TRIGGER IF EXISTS update_posto_murici_abastecimentos_modtime ON "posto_murici_abastecimentos";
        CREATE TRIGGER update_posto_murici_abastecimentos_modtime
        BEFORE UPDATE ON "posto_murici_abastecimentos"
        FOR EACH ROW EXECUTE FUNCTION update_modified_column();

        DROP TRIGGER IF EXISTS update_posto_murici_abastecimentos_tanque_modtime ON "posto_murici_abastecimentos_tanque";
        CREATE TRIGGER update_posto_murici_abastecimentos_tanque_modtime
        BEFORE UPDATE ON "posto_murici_abastecimentos_tanque"
        FOR EACH ROW EXECUTE FUNCTION update_modified_column();

        DROP TRIGGER IF EXISTS update_posto_murici_configuracoes_modtime ON "posto_murici_configuracoes";
        CREATE TRIGGER update_posto_murici_configuracoes_modtime
        BEFORE UPDATE ON "posto_murici_configuracoes"
        FOR EACH ROW EXECUTE FUNCTION update_modified_column();

        DROP TRIGGER IF EXISTS update_posto_murici_movimentacoes_patio_modtime ON "posto_murici_movimentacoes_patio";
        CREATE TRIGGER update_posto_murici_movimentacoes_patio_modtime
        BEFORE UPDATE ON "posto_murici_movimentacoes_patio"
        FOR EACH ROW EXECUTE FUNCTION update_modified_column();
      `
    });
    console.log('Triggers para atualização de timestamps criados com sucesso');

    // Função e triggers para atualizar o nível do tanque após abastecimento
    await supabase.rpc('exec_sql', {
      query: `
        CREATE OR REPLACE FUNCTION atualizar_nivel_tanque()
        RETURNS TRIGGER AS $$
        BEGIN
          -- Depois de um abastecimento de veículo, diminui o nível do tanque
          IF TG_TABLE_NAME = 'posto_murici_abastecimentos' THEN
            UPDATE posto_murici_tanques
            SET nivel_atual = nivel_atual - NEW.quantidade_litros,
                ultima_atualizacao = NOW()
            WHERE id = NEW.tanque_id;
          
          -- Depois de um abastecimento do tanque, aumenta o nível do tanque
          ELSIF TG_TABLE_NAME = 'posto_murici_abastecimentos_tanque' THEN
            UPDATE posto_murici_tanques
            SET nivel_atual = nivel_atual + NEW.quantidade_litros,
                ultima_atualizacao = NOW()
            WHERE id = NEW.tanque_id;
          END IF;
          
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        DROP TRIGGER IF EXISTS trg_atualizar_nivel_tanque_abastecimento ON posto_murici_abastecimentos;
        CREATE TRIGGER trg_atualizar_nivel_tanque_abastecimento
        AFTER INSERT ON posto_murici_abastecimentos
        FOR EACH ROW EXECUTE FUNCTION atualizar_nivel_tanque();

        DROP TRIGGER IF EXISTS trg_atualizar_nivel_tanque_recebimento ON posto_murici_abastecimentos_tanque;
        CREATE TRIGGER trg_atualizar_nivel_tanque_recebimento
        AFTER INSERT ON posto_murici_abastecimentos_tanque
        FOR EACH ROW EXECUTE FUNCTION atualizar_nivel_tanque();
      `
    });
    console.log('Função e triggers para atualização de níveis de tanque criados com sucesso');

    // View para estatísticas de consumo por posto
    await supabase.rpc('exec_sql', {
      query: `
        CREATE OR REPLACE VIEW posto_murici_estatisticas_consumo AS
        SELECT 
          p.id AS posto_id,
          p.nome AS posto_nome,
          p.codigo AS posto_codigo,
          COUNT(a.id) AS total_abastecimentos,
          SUM(a.quantidade_litros) AS total_litros,
          SUM(a.valor_total) AS total_valor,
          AVG(a.valor_litro) AS media_valor_litro,
          COUNT(DISTINCT a.placa) AS total_veiculos_distintos,
          MAX(a.data_registro) AS ultimo_abastecimento,
          SUM(CASE WHEN a.tipo_combustivel = 'diesel' THEN a.quantidade_litros ELSE 0 END) AS total_diesel,
          SUM(CASE WHEN a.tipo_combustivel = 'arla' THEN a.quantidade_litros ELSE 0 END) AS total_arla,
          SUM(CASE WHEN a.tipo_combustivel = 'gasolina' THEN a.quantidade_litros ELSE 0 END) AS total_gasolina,
          SUM(CASE WHEN a.tipo_combustivel = 'etanol' THEN a.quantidade_litros ELSE 0 END) AS total_etanol,
          SUM(CASE WHEN a.tipo_veiculo = 'frota' THEN a.quantidade_litros ELSE 0 END) AS total_frota,
          SUM(CASE WHEN a.tipo_veiculo = 'agregado' THEN a.quantidade_litros ELSE 0 END) AS total_agregado
        FROM 
          posto_murici_postos p
        LEFT JOIN 
          posto_murici_abastecimentos a ON p.id = a.posto_id
        GROUP BY 
          p.id, p.nome, p.codigo;
      `
    });
    console.log('View posto_murici_estatisticas_consumo criada com sucesso');

    // Inserção dos postos iniciais
    await supabase.rpc('exec_sql', {
      query: `
        INSERT INTO "posto_murici_postos" ("nome", "codigo", "cidade", "uf") 
        VALUES
        ('Posto Murici Osasco', 'OSASCO', 'Osasco', 'SP'),
        ('Posto Murici Alair', 'ALAIR', 'Guarulhos', 'SP'),
        ('Posto Murici Campinas', 'CAMPINAS', 'Campinas', 'SP'),
        ('Posto Murici ABC', 'ABC', 'Santo André', 'SP'),
        ('Posto Murici Socorro', 'SOCORRO', 'Socorro', 'SP'),
        ('Posto Murici Sorocaba', 'SOROCABA', 'Sorocaba', 'SP')
        ON CONFLICT (codigo) DO NOTHING;
      `
    });
    console.log('Postos iniciais inseridos com sucesso');

    console.log('Criação das tabelas do Sistema Posto Murici concluída com sucesso!');
  } catch (error) {
    console.error('Erro ao criar tabelas:', error);
  }
}

// Executar a função principal
createTables();
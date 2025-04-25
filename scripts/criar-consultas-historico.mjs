/**
 * Script para criar views e funções SQL que facilitam consultas de histórico de abastecimentos
 * Este script cria visualizações avançadas para análise e relatórios
 */

import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Lista de postos para criar visualizações
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
  return `abastecimentos_posto_${formatarNomePosto(posto)}`;
}

// Função para verificar se uma tabela existe
async function verificarTabelaExiste(nomeTabela) {
  try {
    const query = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = $1
      );
    `;
    
    const result = await pool.query(query, [nomeTabela]);
    return result.rows[0].exists;
  } catch (error) {
    console.error(`Erro ao verificar existência da tabela ${nomeTabela}:`, error);
    return false;
  }
}

// Função para criar view de consumo por veículo
async function criarViewConsumoPorVeiculo(posto) {
  const nomeTabela = obterNomeTabela(posto);
  const nomeView = `${nomeTabela}_consumo_por_veiculo`;
  
  try {
    // Verificar se a tabela principal existe
    const tabelaExiste = await verificarTabelaExiste(nomeTabela);
    if (!tabelaExiste) {
      console.log(`Tabela ${nomeTabela} não existe, pulando criação da view de consumo por veículo.`);
      return false;
    }
    
    // Criar ou atualizar a view
    const createViewQuery = `
      CREATE OR REPLACE VIEW "${nomeView}" AS
      SELECT 
        placa,
        COUNT(*) AS total_abastecimentos,
        SUM(COALESCE(litros, quantidade_litros, quantity_litros)) AS total_litros,
        SUM(valor_total) AS valor_total,
        MAX(COALESCE(hodometro_atual, km_atual)) AS ultimo_km,
        MIN(COALESCE(hodometro_atual, km_atual)) AS primeiro_km,
        MAX(COALESCE(hodometro_atual, km_atual)) - MIN(COALESCE(hodometro_atual, km_atual)) AS km_percorridos,
        CASE 
          WHEN MAX(COALESCE(hodometro_atual, km_atual)) - MIN(COALESCE(hodometro_atual, km_atual)) > 0 
          THEN ROUND((SUM(COALESCE(litros, quantidade_litros, quantity_litros)) / 
                    (MAX(COALESCE(hodometro_atual, km_atual)) - MIN(COALESCE(hodometro_atual, km_atual))) * 100)::numeric, 2)
          ELSE NULL
        END AS consumo_medio_100km,
        MIN(created_at) AS primeiro_abastecimento,
        MAX(created_at) AS ultimo_abastecimento
      FROM "${nomeTabela}"
      GROUP BY placa
      ORDER BY placa;
      
      COMMENT ON VIEW "${nomeView}" IS 'Análise de consumo por veículo para ${posto}';
    `;
    
    await pool.query(createViewQuery);
    console.log(`View de consumo por veículo para ${posto} criada com sucesso!`);
    return true;
  } catch (error) {
    console.error(`Erro ao criar view de consumo por veículo para ${posto}:`, error);
    return false;
  }
}

// Função para criar view de consumo mensal
async function criarViewConsumoMensal(posto) {
  const nomeTabela = obterNomeTabela(posto);
  const nomeView = `${nomeTabela}_consumo_mensal`;
  
  try {
    // Verificar se a tabela principal existe
    const tabelaExiste = await verificarTabelaExiste(nomeTabela);
    if (!tabelaExiste) {
      console.log(`Tabela ${nomeTabela} não existe, pulando criação da view de consumo mensal.`);
      return false;
    }
    
    // Criar ou atualizar a view
    const createViewQuery = `
      CREATE OR REPLACE VIEW "${nomeView}" AS
      SELECT 
        date_trunc('month', created_at) AS mes,
        to_char(date_trunc('month', created_at), 'MM/YYYY') AS mes_ano,
        COUNT(*) AS total_abastecimentos,
        COUNT(DISTINCT placa) AS total_veiculos,
        SUM(COALESCE(litros, quantidade_litros, quantity_litros)) AS total_litros,
        ROUND(AVG(COALESCE(litros, quantidade_litros, quantity_litros))::numeric, 2) AS media_litros_por_abastecimento,
        SUM(valor_total) AS valor_total,
        ROUND(AVG(COALESCE(valor_litro, preco_litro))::numeric, 2) AS preco_medio_litro
      FROM "${nomeTabela}"
      GROUP BY date_trunc('month', created_at)
      ORDER BY date_trunc('month', created_at) DESC;
      
      COMMENT ON VIEW "${nomeView}" IS 'Análise de consumo mensal para ${posto}';
    `;
    
    await pool.query(createViewQuery);
    console.log(`View de consumo mensal para ${posto} criada com sucesso!`);
    return true;
  } catch (error) {
    console.error(`Erro ao criar view de consumo mensal para ${posto}:`, error);
    return false;
  }
}

// Função para criar view de comparativo de combustíveis
async function criarViewComparativoCombustiveis(posto) {
  const nomeTabela = obterNomeTabela(posto);
  const nomeView = `${nomeTabela}_comparativo_combustiveis`;
  
  try {
    // Verificar se a tabela principal existe
    const tabelaExiste = await verificarTabelaExiste(nomeTabela);
    if (!tabelaExiste) {
      console.log(`Tabela ${nomeTabela} não existe, pulando criação da view de comparativo de combustíveis.`);
      return false;
    }
    
    // Criar ou atualizar a view
    const createViewQuery = `
      CREATE OR REPLACE VIEW "${nomeView}" AS
      SELECT 
        COALESCE(tipo_combustivel, 'Não especificado') AS tipo_combustivel,
        COUNT(*) AS total_abastecimentos,
        COUNT(DISTINCT placa) AS total_veiculos,
        SUM(COALESCE(litros, quantidade_litros, quantity_litros)) AS total_litros,
        ROUND(AVG(COALESCE(litros, quantidade_litros, quantity_litros))::numeric, 2) AS media_litros_por_abastecimento,
        SUM(valor_total) AS valor_total,
        ROUND(AVG(COALESCE(valor_litro, preco_litro))::numeric, 2) AS preco_medio_litro
      FROM "${nomeTabela}"
      GROUP BY tipo_combustivel
      ORDER BY total_abastecimentos DESC;
      
      COMMENT ON VIEW "${nomeView}" IS 'Comparativo de combustíveis para ${posto}';
    `;
    
    await pool.query(createViewQuery);
    console.log(`View de comparativo de combustíveis para ${posto} criada com sucesso!`);
    return true;
  } catch (error) {
    console.error(`Erro ao criar view de comparativo de combustíveis para ${posto}:`, error);
    return false;
  }
}

// Função para criar visão consolidada do posto
async function criarViewConsolidada(posto) {
  const nomeTabela = obterNomeTabela(posto);
  const nomeView = `${nomeTabela}_consolidado`;
  
  try {
    // Verificar se a tabela principal existe
    const tabelaExiste = await verificarTabelaExiste(nomeTabela);
    if (!tabelaExiste) {
      console.log(`Tabela ${nomeTabela} não existe, pulando criação da view consolidada.`);
      return false;
    }
    
    // Criar ou atualizar a view
    const createViewQuery = `
      CREATE OR REPLACE VIEW "${nomeView}" AS
      SELECT 
        id,
        placa,
        COALESCE(hodometro_atual, km_atual) AS km,
        COALESCE(tipo_combustivel, 'Não especificado') AS tipo_combustivel,
        COALESCE(litros, quantidade_litros, quantity_litros) AS quantidade_litros,
        COALESCE(motorista, nome_motorista, motorista_nome) AS nome_motorista,
        COALESCE(motorista_rg, rg_motorista) AS rg_motorista,
        COALESCE(operador, nome_operador) AS nome_operador,
        COALESCE(valor_litro, preco_litro) AS valor_litro,
        valor_total,
        tipo_veiculo,
        observacoes,
        lavagem,
        tipo_lavagem,
        to_char(created_at, 'DD/MM/YYYY HH24:MI') AS data_hora,
        created_at
      FROM "${nomeTabela}"
      ORDER BY created_at DESC;
      
      COMMENT ON VIEW "${nomeView}" IS 'Visão consolidada de abastecimentos para ${posto}';
    `;
    
    await pool.query(createViewQuery);
    console.log(`View consolidada para ${posto} criada com sucesso!`);
    return true;
  } catch (error) {
    console.error(`Erro ao criar view consolidada para ${posto}:`, error);
    return false;
  }
}

// Função para criar visão agregada para relatórios
async function criarViewAgregadaParaRelatorios(posto) {
  const nomeTabela = obterNomeTabela(posto);
  const nomeView = `${nomeTabela}_agregado_relatorios`;
  
  try {
    // Verificar se a tabela principal existe
    const tabelaExiste = await verificarTabelaExiste(nomeTabela);
    if (!tabelaExiste) {
      console.log(`Tabela ${nomeTabela} não existe, pulando criação da view agregada para relatórios.`);
      return false;
    }
    
    // Criar ou atualizar a view
    const createViewQuery = `
      CREATE OR REPLACE VIEW "${nomeView}" AS
      WITH dados_basicos AS (
        SELECT 
          date_trunc('day', created_at) AS dia,
          COALESCE(tipo_combustivel, 'Não especificado') AS tipo_combustivel,
          COUNT(*) AS total_abastecimentos,
          SUM(COALESCE(litros, quantidade_litros, quantity_litros)) AS total_litros,
          SUM(valor_total) AS valor_total
        FROM "${nomeTabela}"
        GROUP BY date_trunc('day', created_at), tipo_combustivel
      ),
      dados_semanais AS (
        SELECT 
          date_trunc('week', dia) AS semana,
          tipo_combustivel,
          SUM(total_abastecimentos) AS total_abastecimentos_semana,
          SUM(total_litros) AS total_litros_semana,
          SUM(valor_total) AS valor_total_semana
        FROM dados_basicos
        GROUP BY date_trunc('week', dia), tipo_combustivel
      ),
      dados_mensais AS (
        SELECT 
          date_trunc('month', dia) AS mes,
          tipo_combustivel,
          SUM(total_abastecimentos) AS total_abastecimentos_mes,
          SUM(total_litros) AS total_litros_mes,
          SUM(valor_total) AS valor_total_mes
        FROM dados_basicos
        GROUP BY date_trunc('month', dia), tipo_combustivel
      )
      SELECT 
        to_char(db.dia, 'DD/MM/YYYY') AS data,
        to_char(ds.semana, 'DD/MM/YYYY') AS inicio_semana,
        to_char(dm.mes, 'MM/YYYY') AS mes_ano,
        db.tipo_combustivel,
        db.total_abastecimentos,
        ROUND(db.total_litros::numeric, 2) AS total_litros,
        ROUND(db.valor_total::numeric, 2) AS valor_total,
        ROUND(ds.total_litros_semana::numeric, 2) AS total_litros_semana,
        ROUND(ds.valor_total_semana::numeric, 2) AS valor_total_semana,
        ROUND(dm.total_litros_mes::numeric, 2) AS total_litros_mes,
        ROUND(dm.valor_total_mes::numeric, 2) AS valor_total_mes
      FROM dados_basicos db
      JOIN dados_semanais ds ON date_trunc('week', db.dia) = ds.semana AND db.tipo_combustivel = ds.tipo_combustivel
      JOIN dados_mensais dm ON date_trunc('month', db.dia) = dm.mes AND db.tipo_combustivel = dm.tipo_combustivel
      ORDER BY db.dia DESC, db.tipo_combustivel;
      
      COMMENT ON VIEW "${nomeView}" IS 'Dados agregados para relatórios de ${posto}';
    `;
    
    await pool.query(createViewQuery);
    console.log(`View agregada para relatórios de ${posto} criada com sucesso!`);
    return true;
  } catch (error) {
    console.error(`Erro ao criar view agregada para relatórios de ${posto}:`, error);
    return false;
  }
}

// Função principal para criar todas as visualizações
async function criarTodasViews() {
  try {
    let totalPostos = 0;
    let viewsConsumoPorVeiculo = 0;
    let viewsConsumoMensal = 0;
    let viewsComparativoCombustiveis = 0;
    let viewsConsolidadas = 0;
    let viewsAgregadasRelatorios = 0;
    
    console.log(`Iniciando criação de visualizações para ${postos.length} postos...`);
    
    for (const posto of postos) {
      totalPostos++;
      console.log(`\nProcessando posto: ${posto}`);
      
      if (await criarViewConsumoPorVeiculo(posto)) viewsConsumoPorVeiculo++;
      if (await criarViewConsumoMensal(posto)) viewsConsumoMensal++;
      if (await criarViewComparativoCombustiveis(posto)) viewsComparativoCombustiveis++;
      if (await criarViewConsolidada(posto)) viewsConsolidadas++;
      if (await criarViewAgregadaParaRelatorios(posto)) viewsAgregadasRelatorios++;
    }
    
    console.log(`\nProcesso concluído!`);
    console.log(`Total de postos processados: ${totalPostos}`);
    console.log(`Views de consumo por veículo criadas: ${viewsConsumoPorVeiculo}`);
    console.log(`Views de consumo mensal criadas: ${viewsConsumoMensal}`);
    console.log(`Views de comparativo de combustíveis criadas: ${viewsComparativoCombustiveis}`);
    console.log(`Views consolidadas criadas: ${viewsConsolidadas}`);
    console.log(`Views agregadas para relatórios criadas: ${viewsAgregadasRelatorios}`);
    
  } catch (error) {
    console.error('Erro ao processar visualizações:', error);
  } finally {
    // Fechar conexão com o banco
    await pool.end();
  }
}

// Executar o script
criarTodasViews().catch(console.error);
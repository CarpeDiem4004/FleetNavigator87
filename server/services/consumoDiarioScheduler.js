/**
 * Serviço de coleta automática de dados de consumo diário
 * Executa à meia-noite para registrar o consumo de cada posto
 */

const cron = require('node-cron');
const { Pool } = require('pg');

// Configuração do banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Lista dos postos a serem monitorados
const POSTOS_ATIVOS = [
  'Abc_v2',
  'Alair_v2', 
  'Campinas_v2',
  'Osasco_v2',
  'Socorro_v2',
  'Sorocaba_v2'
];

/**
 * Coleta dados de consumo de um posto específico
 */
async function coletarDadosPosto(posto) {
  try {
    const client = await pool.connect();
    
    // Buscar dados do tanque
    const tanqueQuery = `
      SELECT capacidade_maxima, nivel_atual 
      FROM configuracao_tanques 
      WHERE posto = $1
    `;
    const tanqueResult = await client.query(tanqueQuery, [posto]);
    
    const capacidadeMaxima = tanqueResult.rows[0]?.capacidade_maxima || 0;
    const nivelAtual = tanqueResult.rows[0]?.nivel_atual || 0;
    const percentualDisponivel = capacidadeMaxima > 0 ? (nivelAtual / capacidadeMaxima * 100) : 0;

    // Buscar dados de abastecimentos do dia anterior
    const dataOntem = new Date();
    dataOntem.setDate(dataOntem.getDate() - 1);
    const dataOntemStr = dataOntem.toISOString().split('T')[0];

    // Determinar a tabela de abastecimentos baseada no posto
    const tabelaAbastecimento = `abastecimentos_posto_${posto.toLowerCase()}`;
    
    // Buscar consumo do dia anterior
    let abastecimentosQuery;
    let abastecimentosParams;
    
    // Adaptar query baseada na estrutura de cada posto
    if (posto === 'Osasco_v2') {
      abastecimentosQuery = `
        SELECT 
          COUNT(*) as numero_abastecimentos,
          COALESCE(SUM(litros), 0) as litros_consumidos,
          COALESCE(SUM(valor_total), 0) as valor_total
        FROM ${tabelaAbastecimento}
        WHERE DATE(data_abastecimento) = $1
      `;
    } else {
      abastecimentosQuery = `
        SELECT 
          COUNT(*) as numero_abastecimentos,
          COALESCE(SUM(COALESCE(litros, quantidade_litros, quantity_litros)), 0) as litros_consumidos,
          COALESCE(SUM(valor_total), 0) as valor_total
        FROM ${tabelaAbastecimento}
        WHERE DATE(data_abastecimento) = $1
      `;
    }
    
    abastecimentosParams = [dataOntemStr];
    
    const abastecimentosResult = await client.query(abastecimentosQuery, abastecimentosParams);
    
    const dadosConsumo = {
      posto,
      dataColeta: dataOntemStr,
      litrosConsumidos: parseFloat(abastecimentosResult.rows[0]?.litros_consumidos || 0),
      numeroAbastecimentos: parseInt(abastecimentosResult.rows[0]?.numero_abastecimentos || 0),
      valorTotal: parseFloat(abastecimentosResult.rows[0]?.valor_total || 0),
      nivelTanqueAtual: parseFloat(nivelAtual),
      capacidadeMaxima: parseFloat(capacidadeMaxima),
      percentualDisponivel: parseFloat(percentualDisponivel.toFixed(2))
    };

    client.release();
    return dadosConsumo;
    
  } catch (error) {
    console.error(`Erro ao coletar dados do posto ${posto}:`, error);
    return null;
  }
}

/**
 * Salva os dados coletados na tabela de histórico
 */
async function salvarDadosHistorico(dadosConsumo) {
  try {
    const client = await pool.connect();
    
    const insertQuery = `
      INSERT INTO consumo_diario_historico 
      (data_coleta, posto, litros_consumidos, numero_abastecimentos, valor_total, 
       nivel_tanque_atual, capacidade_maxima, percentual_disponivel)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (data_coleta, posto) 
      DO UPDATE SET
        litros_consumidos = EXCLUDED.litros_consumidos,
        numero_abastecimentos = EXCLUDED.numero_abastecimentos,
        valor_total = EXCLUDED.valor_total,
        nivel_tanque_atual = EXCLUDED.nivel_tanque_atual,
        capacidade_maxima = EXCLUDED.capacidade_maxima,
        percentual_disponivel = EXCLUDED.percentual_disponivel,
        created_at = CURRENT_TIMESTAMP
    `;
    
    await client.query(insertQuery, [
      dadosConsumo.dataColeta,
      dadosConsumo.posto,
      dadosConsumo.litrosConsumidos,
      dadosConsumo.numeroAbastecimentos,
      dadosConsumo.valorTotal,
      dadosConsumo.nivelTanqueAtual,
      dadosConsumo.capacidadeMaxima,
      dadosConsumo.percentualDisponivel
    ]);
    
    client.release();
    console.log(`✅ Dados salvos para ${dadosConsumo.posto} em ${dadosConsumo.dataColeta}`);
    
  } catch (error) {
    console.error(`Erro ao salvar dados do posto ${dadosConsumo.posto}:`, error);
  }
}

/**
 * Executa a coleta de dados de todos os postos
 */
async function executarColetaDiaria() {
  console.log(`🕛 Iniciando coleta diária de consumo - ${new Date().toISOString()}`);
  
  for (const posto of POSTOS_ATIVOS) {
    try {
      const dadosConsumo = await coletarDadosPosto(posto);
      
      if (dadosConsumo) {
        await salvarDadosHistorico(dadosConsumo);
      } else {
        console.warn(`⚠️ Não foi possível coletar dados do posto ${posto}`);
      }
    } catch (error) {
      console.error(`❌ Erro na coleta do posto ${posto}:`, error);
    }
  }
  
  console.log(`✅ Coleta diária finalizada - ${new Date().toISOString()}`);
}

/**
 * Função para coleta manual (para testes)
 */
async function executarColetaManual() {
  console.log('🔧 Executando coleta manual...');
  await executarColetaDiaria();
}

/**
 * Inicializa o scheduler
 */
function iniciarScheduler() {
  // Executa todos os dias à meia-noite (00:00)
  cron.schedule('0 0 * * *', () => {
    executarColetaDiaria();
  }, {
    scheduled: true,
    timezone: "America/Sao_Paulo"
  });
  
  console.log('📅 Scheduler de coleta diária iniciado - Execução à meia-noite');
}

module.exports = {
  iniciarScheduler,
  executarColetaManual,
  executarColetaDiaria
};
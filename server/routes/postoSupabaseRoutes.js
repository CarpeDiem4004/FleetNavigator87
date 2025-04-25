/**
 * Rotas para acesso às tabelas e visualizações específicas de posto no Supabase
 */

const express = require('express');
const router = express.Router();
const postoUtils = require('../utils/posto-utils');
const { pool } = require('../db');

// Configurando router para responder apenas como API JSON
router.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

/**
 * Rota de diagnóstico para listar todas as tabelas relacionadas a postos
 * @route GET /api/debug/list-posto-tables
 */
router.get('/debug/list-posto-tables', async (req, res) => {
  try {
    const query = `
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_schema = 'public'
        AND (table_name LIKE 'abastecimentos_posto_%' OR table_name LIKE 'abastecimentos_postos%')
      ORDER BY table_name;
    `;
    
    const result = await pool.query(query);
    const tables = result.rows.map(row => row.table_name);
    
    return res.json({
      success: true,
      count: tables.length,
      tables
    });
  } catch (error) {
    console.error('Erro ao listar tabelas de postos:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar tabelas de postos',
      error: error.message
    });
  }
});

/**
 * Obter todos os abastecimentos de uma tabela específica de posto
 * @route GET /api/posto/:posto/abastecimentos
 */
router.get('/posto/:posto/abastecimentos', async (req, res) => {
  try {
    const { posto } = req.params;
    
    if (!postoUtils.isPostoValido(posto)) {
      return res.status(400).json({
        success: false,
        message: `Posto inválido: ${posto}`
      });
    }
    
    const nomeTabela = postoUtils.formatarNomeTabela(posto);
    
    // Verificar se a tabela existe
    const tabelaExiste = await verificarTabelaExiste(nomeTabela);
    if (!tabelaExiste) {
      return res.status(404).json({
        success: false,
        message: `Tabela para o posto ${posto} não encontrada`
      });
    }
    
    // Usar a visualização consolidada que já tem os campos normalizados
    const nomeView = postoUtils.obterNomeViewConsolidada(posto);
    
    const query = `SELECT * FROM "${nomeView}" ORDER BY created_at DESC`;
    const result = await pool.query(query);
    
    return res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
      posto: postoUtils.obterNomeExibicaoPosto(posto)
    });
  } catch (error) {
    console.error(`Erro ao obter abastecimentos para posto ${req.params.posto}:`, error);
    return res.status(500).json({
      success: false,
      message: `Erro ao obter abastecimentos para posto ${req.params.posto}`,
      error: error.message
    });
  }
});

/**
 * Obter estatísticas mensais para um posto específico
 * @route GET /api/posto/:posto/estatisticas-mensais
 */
router.get('/posto/:posto/estatisticas-mensais', async (req, res) => {
  try {
    const { posto } = req.params;
    
    if (!postoUtils.isPostoValido(posto)) {
      return res.status(400).json({
        success: false,
        message: `Posto inválido: ${posto}`
      });
    }
    
    const nomeTabela = postoUtils.formatarNomeTabela(posto);
    
    // Verificar se a tabela existe
    const tabelaExiste = await verificarTabelaExiste(nomeTabela);
    if (!tabelaExiste) {
      return res.status(404).json({
        success: false,
        message: `Tabela para o posto ${posto} não encontrada`
      });
    }
    
    // Usar a visualização de estatísticas mensais
    const nomeView = postoUtils.obterNomeViewEstatisticasMensais(posto);
    
    const query = `SELECT * FROM "${nomeView}"`;
    const result = await pool.query(query);
    
    return res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
      posto: postoUtils.obterNomeExibicaoPosto(posto)
    });
  } catch (error) {
    console.error(`Erro ao obter estatísticas mensais para posto ${req.params.posto}:`, error);
    return res.status(500).json({
      success: false,
      message: `Erro ao obter estatísticas mensais para posto ${req.params.posto}`,
      error: error.message
    });
  }
});

/**
 * Obter consumo por veículo para um posto específico
 * @route GET /api/posto/:posto/consumo-por-veiculo
 */
router.get('/posto/:posto/consumo-por-veiculo', async (req, res) => {
  try {
    const { posto } = req.params;
    
    if (!postoUtils.isPostoValido(posto)) {
      return res.status(400).json({
        success: false,
        message: `Posto inválido: ${posto}`
      });
    }
    
    const nomeTabela = postoUtils.formatarNomeTabela(posto);
    
    // Verificar se a tabela existe
    const tabelaExiste = await verificarTabelaExiste(nomeTabela);
    if (!tabelaExiste) {
      return res.status(404).json({
        success: false,
        message: `Tabela para o posto ${posto} não encontrada`
      });
    }
    
    // Usar a visualização de consumo por veículo
    const nomeView = postoUtils.obterNomeViewConsumoPorVeiculo(posto);
    
    const query = `SELECT * FROM "${nomeView}"`;
    const result = await pool.query(query);
    
    return res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
      posto: postoUtils.obterNomeExibicaoPosto(posto)
    });
  } catch (error) {
    console.error(`Erro ao obter consumo por veículo para posto ${req.params.posto}:`, error);
    return res.status(500).json({
      success: false,
      message: `Erro ao obter consumo por veículo para posto ${req.params.posto}`,
      error: error.message
    });
  }
});

/**
 * Obter consumo mensal para um posto específico
 * @route GET /api/posto/:posto/consumo-mensal
 */
router.get('/posto/:posto/consumo-mensal', async (req, res) => {
  try {
    const { posto } = req.params;
    
    if (!postoUtils.isPostoValido(posto)) {
      return res.status(400).json({
        success: false,
        message: `Posto inválido: ${posto}`
      });
    }
    
    const nomeTabela = postoUtils.formatarNomeTabela(posto);
    
    // Verificar se a tabela existe
    const tabelaExiste = await verificarTabelaExiste(nomeTabela);
    if (!tabelaExiste) {
      return res.status(404).json({
        success: false,
        message: `Tabela para o posto ${posto} não encontrada`
      });
    }
    
    // Usar a visualização de consumo mensal
    const nomeView = postoUtils.obterNomeViewConsumoMensal(posto);
    
    const query = `SELECT * FROM "${nomeView}"`;
    const result = await pool.query(query);
    
    return res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
      posto: postoUtils.obterNomeExibicaoPosto(posto)
    });
  } catch (error) {
    console.error(`Erro ao obter consumo mensal para posto ${req.params.posto}:`, error);
    return res.status(500).json({
      success: false,
      message: `Erro ao obter consumo mensal para posto ${req.params.posto}`,
      error: error.message
    });
  }
});

/**
 * Obter comparativo de combustíveis para um posto específico
 * @route GET /api/posto/:posto/comparativo-combustiveis
 */
router.get('/posto/:posto/comparativo-combustiveis', async (req, res) => {
  try {
    const { posto } = req.params;
    
    if (!postoUtils.isPostoValido(posto)) {
      return res.status(400).json({
        success: false,
        message: `Posto inválido: ${posto}`
      });
    }
    
    const nomeTabela = postoUtils.formatarNomeTabela(posto);
    
    // Verificar se a tabela existe
    const tabelaExiste = await verificarTabelaExiste(nomeTabela);
    if (!tabelaExiste) {
      return res.status(404).json({
        success: false,
        message: `Tabela para o posto ${posto} não encontrada`
      });
    }
    
    // Usar a visualização de comparativo de combustíveis
    const nomeView = postoUtils.obterNomeViewComparativoCombustiveis(posto);
    
    const query = `SELECT * FROM "${nomeView}"`;
    const result = await pool.query(query);
    
    return res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
      posto: postoUtils.obterNomeExibicaoPosto(posto)
    });
  } catch (error) {
    console.error(`Erro ao obter comparativo de combustíveis para posto ${req.params.posto}:`, error);
    return res.status(500).json({
      success: false,
      message: `Erro ao obter comparativo de combustíveis para posto ${req.params.posto}`,
      error: error.message
    });
  }
});

/**
 * Obter dados agregados para relatórios para um posto específico
 * @route GET /api/posto/:posto/relatorios
 */
router.get('/posto/:posto/relatorios', async (req, res) => {
  try {
    const { posto } = req.params;
    
    if (!postoUtils.isPostoValido(posto)) {
      return res.status(400).json({
        success: false,
        message: `Posto inválido: ${posto}`
      });
    }
    
    const nomeTabela = postoUtils.formatarNomeTabela(posto);
    
    // Verificar se a tabela existe
    const tabelaExiste = await verificarTabelaExiste(nomeTabela);
    if (!tabelaExiste) {
      return res.status(404).json({
        success: false,
        message: `Tabela para o posto ${posto} não encontrada`
      });
    }
    
    // Usar a visualização agregada para relatórios
    const nomeView = postoUtils.obterNomeViewAgregadaRelatorios(posto);
    
    const query = `SELECT * FROM "${nomeView}"`;
    const result = await pool.query(query);
    
    return res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
      posto: postoUtils.obterNomeExibicaoPosto(posto)
    });
  } catch (error) {
    console.error(`Erro ao obter dados para relatórios para posto ${req.params.posto}:`, error);
    return res.status(500).json({
      success: false,
      message: `Erro ao obter dados para relatórios para posto ${req.params.posto}`,
      error: error.message
    });
  }
});

/**
 * Obter últimos abastecimentos para um posto específico
 * @route GET /api/posto/:posto/ultimos-abastecimentos
 */
router.get('/posto/:posto/ultimos-abastecimentos', async (req, res) => {
  try {
    const { posto } = req.params;
    
    if (!postoUtils.isPostoValido(posto)) {
      return res.status(400).json({
        success: false,
        message: `Posto inválido: ${posto}`
      });
    }
    
    const nomeTabela = postoUtils.formatarNomeTabela(posto);
    
    // Verificar se a tabela existe
    const tabelaExiste = await verificarTabelaExiste(nomeTabela);
    if (!tabelaExiste) {
      return res.status(404).json({
        success: false,
        message: `Tabela para o posto ${posto} não encontrada`
      });
    }
    
    // Usar a visualização de últimos abastecimentos
    const nomeView = postoUtils.obterNomeViewUltimosAbastecimentos(posto);
    
    const query = `SELECT * FROM "${nomeView}"`;
    const result = await pool.query(query);
    
    return res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
      posto: postoUtils.obterNomeExibicaoPosto(posto)
    });
  } catch (error) {
    console.error(`Erro ao obter últimos abastecimentos para posto ${req.params.posto}:`, error);
    return res.status(500).json({
      success: false,
      message: `Erro ao obter últimos abastecimentos para posto ${req.params.posto}`,
      error: error.message
    });
  }
});

/**
 * Registrar um novo abastecimento para um posto específico
 * @route POST /api/posto/:posto/abastecimento
 */
router.post('/posto/:posto/abastecimento', async (req, res) => {
  try {
    const { posto } = req.params;
    const dados = req.body;
    
    if (!postoUtils.isPostoValido(posto)) {
      return res.status(400).json({
        success: false,
        message: `Posto inválido: ${posto}`
      });
    }
    
    const nomeTabela = postoUtils.formatarNomeTabela(posto);
    
    // Verificar se a tabela existe
    const tabelaExiste = await verificarTabelaExiste(nomeTabela);
    if (!tabelaExiste) {
      return res.status(404).json({
        success: false,
        message: `Tabela para o posto ${posto} não encontrada`
      });
    }
    
    // Campos obrigatórios
    if (!dados.placa) {
      return res.status(400).json({
        success: false,
        message: "O campo 'placa' é obrigatório"
      });
    }
    
    // Garantir que o posto está correto nos dados
    dados.posto = postoUtils.obterNomeExibicaoPosto(posto);
    
    // Campos adicionais
    if (!dados.created_at) {
      dados.created_at = new Date();
    }
    dados.updated_at = new Date();
    
    // Montar a query dinâmica baseada nos campos enviados
    const campos = Object.keys(dados);
    const valores = campos.map((campo, index) => `$${index + 1}`);
    const valoresArray = campos.map(campo => dados[campo]);
    
    const query = `
      INSERT INTO "${nomeTabela}" (${campos.join(', ')})
      VALUES (${valores.join(', ')})
      RETURNING *;
    `;
    
    const result = await pool.query(query, valoresArray);
    
    return res.status(201).json({
      success: true,
      message: `Abastecimento registrado com sucesso para ${dados.posto}`,
      data: result.rows[0]
    });
  } catch (error) {
    console.error(`Erro ao inserir abastecimento para posto ${req.params.posto}:`, error);
    return res.status(500).json({
      success: false,
      message: `Erro ao inserir abastecimento para posto ${req.params.posto}`,
      error: error.message
    });
  }
});

/**
 * Verificar se a tabela para um posto específico existe
 * @route GET /api/posto/:posto/verificar-tabela
 */
router.get('/posto/:posto/verificar-tabela', async (req, res) => {
  try {
    const { posto } = req.params;
    
    if (!postoUtils.isPostoValido(posto)) {
      return res.status(400).json({
        success: false,
        message: `Posto inválido: ${posto}`,
        exists: false
      });
    }
    
    const nomeTabela = postoUtils.formatarNomeTabela(posto);
    const existeTabela = await verificarTabelaExiste(nomeTabela);
    
    // Adicionalmente verificar se existe a view consolidada
    const nomeView = postoUtils.obterNomeViewConsolidada(posto);
    const existeView = await verificarTabelaExiste(nomeView);
    
    return res.json({
      success: true,
      exists: existeTabela && existeView,
      posto: postoUtils.obterNomeExibicaoPosto(posto),
      tabela: existeTabela,
      view: existeView
    });
  } catch (error) {
    console.error(`Erro ao verificar existência de tabela para posto ${req.params.posto}:`, error);
    return res.status(500).json({
      success: false,
      message: `Erro ao verificar existência de tabela para posto ${req.params.posto}`,
      error: error.message,
      exists: false
    });
  }
});

/**
 * Acesso genérico a qualquer visualização para um posto específico
 * @route GET /api/posto/:posto/view
 */
router.get('/posto/:posto/view', async (req, res) => {
  try {
    const { posto } = req.params;
    const { view } = req.query;
    
    if (!postoUtils.isPostoValido(posto)) {
      return res.status(400).json({
        success: false,
        message: `Posto inválido: ${posto}`
      });
    }
    
    if (!view) {
      return res.status(400).json({
        success: false,
        message: 'Parâmetro "view" é obrigatório'
      });
    }
    
    // Verificar se a view existe
    const viewExiste = await verificarTabelaExiste(view);
    if (!viewExiste) {
      return res.status(404).json({
        success: false,
        message: `Visualização ${view} não encontrada para o posto ${posto}`
      });
    }
    
    // Adicionar cabeçalhos de cache-control para evitar caching
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const query = `SELECT * FROM "${view}" ORDER BY created_at DESC`;
    const result = await pool.query(query);
    
    return res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
      posto: postoUtils.obterNomeExibicaoPosto(posto),
      view
    });
  } catch (error) {
    console.error(`Erro ao acessar visualização para posto ${req.params.posto}:`, error);
    return res.status(500).json({
      success: false,
      message: `Erro ao acessar visualização para posto ${req.params.posto}`,
      error: error.message
    });
  }
});

/**
 * Verificar se uma tabela existe no banco de dados
 * @param {string} nomeTabela 
 * @returns {Promise<boolean>}
 */
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

module.exports = router;
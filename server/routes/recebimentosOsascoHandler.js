/**
 * Manipulador especializado para recebimentos do posto Osasco V2
 * Esta implementação considera a estrutura específica da tabela recebimentos_posto_osasco_v2
 */

const express = require('express');
const { pool } = require('../db');

const router = express.Router();

// Função de mapeamento para formatar dados para a interface
const mapRecebimentoOsascoV2 = (row) => {
  return {
    id: row.id,
    fornecedor: row.nome_fornecedor,
    tipo_combustivel: row.tipo_produto,
    quantidade_litros: row.litros_recebidos,
    valor_litro: row.valor_litro,
    valor_total: row.valor_total,
    numero_nota: row.numero_nota,
    data_entrega: row.data_entrega,
    nome_operador: row.nome_operador,
    operador: row.nome_operador, // Duplicado para compatibilidade
    observacoes: row.observacoes,
    data_formatada: new Date(row.created_at).toLocaleDateString('pt-BR') + ' ' + new Date(row.created_at).toLocaleTimeString('pt-BR'),
    created_at: row.created_at
  };
};

// Rota para obter todos os recebimentos do posto Osasco V2
router.get('/api/recebimentos/osasco_v2', async (req, res) => {
  try {
    console.log("Buscando recebimentos para o posto Osasco V2");
    
    // Verificar se a tabela existe
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'recebimentos_posto_osasco_v2'
      );
    `;
    
    const tableExistsResult = await pool.query(checkTableQuery);
    
    if (!tableExistsResult.rows[0].exists) {
      return res.json({
        success: true,
        message: "Tabela de recebimentos para Osasco V2 não existe",
        data: [],
        count: 0
      });
    }
    
    // Buscar recebimentos com mapeamento de colunas específico
    const query = `
      SELECT *
      FROM recebimentos_posto_osasco_v2
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query);
    
    // Mapear os resultados para o formato esperado pela interface
    const mappedData = result.rows.map(mapRecebimentoOsascoV2);
    
    return res.json({
      success: true,
      count: result.rowCount,
      data: mappedData
    });
  } catch (error) {
    console.error("Erro ao buscar recebimentos do posto Osasco V2:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar recebimentos: " + error.message
    });
  }
});

// Rota para adicionar um recebimento no posto Osasco V2
router.post('/api/recebimentos/osasco_v2', async (req, res) => {
  try {
    const {
      fornecedor,
      tipo_combustivel,
      quantidade_litros,
      valor_litro,
      valor_total,
      numero_nota,
      data_entrega,
      nome_operador,
      observacoes
    } = req.body;
    
    // Verificar campos obrigatórios
    if (!fornecedor || !tipo_combustivel || !quantidade_litros || !valor_litro || !numero_nota || !data_entrega || !nome_operador) {
      return res.status(400).json({
        success: false,
        message: "Todos os campos são obrigatórios, exceto observações"
      });
    }
    
    // Mapeamento de campos para o formato da tabela Osasco V2
    const query = `
      INSERT INTO recebimentos_posto_osasco_v2 (
        nome_fornecedor,
        tipo_produto,
        litros_recebidos,
        valor_litro,
        valor_total,
        numero_nota,
        data_entrega,
        nome_operador,
        observacoes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const values = [
      fornecedor,
      tipo_combustivel,
      quantidade_litros,
      valor_litro,
      valor_total,
      numero_nota,
      data_entrega,
      nome_operador,
      observacoes || null
    ];
    
    const result = await pool.query(query, values);
    
    // Mapear o resultado para o formato esperado pela interface
    const mappedData = mapRecebimentoOsascoV2(result.rows[0]);
    
    res.status(201).json({
      success: true,
      message: "Recebimento registrado com sucesso",
      data: mappedData
    });
  } catch (error) {
    console.error("Erro ao registrar recebimento para Osasco V2:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao registrar recebimento: " + error.message
    });
  }
});

// Exportar funções específicas para uso em outros módulos
router.getRecebimentosOsascoV2 = async (limit = 50) => {
  try {
    // Verificar se a tabela existe
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'recebimentos_posto_osasco_v2'
      );
    `;
    
    const tableExistsResult = await pool.query(checkTableQuery);
    
    if (!tableExistsResult.rows[0].exists) {
      return {
        success: true,
        message: "Tabela de recebimentos para Osasco V2 não existe",
        data: [],
        count: 0
      };
    }
    
    // Buscar recebimentos 
    const query = `
      SELECT *
      FROM recebimentos_posto_osasco_v2
      ORDER BY created_at DESC
      LIMIT $1
    `;
    
    const result = await pool.query(query, [limit]);
    
    // Mapear os resultados para o formato esperado pela interface
    const mappedData = result.rows.map(mapRecebimentoOsascoV2);
    
    return {
      success: true,
      count: result.rowCount,
      data: mappedData
    };
  } catch (error) {
    console.error("Erro ao buscar recebimentos do posto Osasco V2:", error);
    return {
      success: false,
      message: "Erro ao buscar recebimentos: " + error.message,
      data: [],
      count: 0
    };
  }
};

// Função para registrar recebimento do posto Osasco V2
router.registrarRecebimentoOsascoV2 = async (dados) => {
  try {
    const {
      fornecedor,
      tipo_combustivel,
      quantidade_litros,
      valor_litro,
      valor_total,
      numero_nota,
      data_entrega,
      operador, // Nome diferente no frontend
      observacoes
    } = dados;
    
    // Verificar campos obrigatórios
    if (!fornecedor || !tipo_combustivel || !quantidade_litros || !valor_litro) {
      return {
        success: false,
        message: "Campos obrigatórios faltando"
      };
    }
    
    // Mapeamento de campos para o formato da tabela Osasco V2
    const query = `
      INSERT INTO recebimentos_posto_osasco_v2 (
        nome_fornecedor,
        tipo_produto,
        litros_recebidos,
        valor_litro,
        valor_total,
        numero_nota,
        data_entrega,
        nome_operador,
        observacoes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const values = [
      fornecedor,
      tipo_combustivel,
      quantidade_litros,
      valor_litro,
      valor_total,
      numero_nota || '',
      data_entrega || new Date(),
      operador || 'Sistema',
      observacoes || null
    ];
    
    const result = await pool.query(query, values);
    
    // Mapear o resultado para o formato esperado pela interface
    const mappedData = mapRecebimentoOsascoV2(result.rows[0]);
    
    return {
      success: true,
      message: "Recebimento registrado com sucesso",
      data: mappedData
    };
  } catch (error) {
    console.error("Erro ao registrar recebimento para Osasco V2:", error);
    return {
      success: false,
      message: "Erro ao registrar recebimento: " + error.message
    };
  }
};

module.exports = router;
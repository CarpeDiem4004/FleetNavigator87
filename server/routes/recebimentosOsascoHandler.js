/**
 * Manipulador especializado para recebimentos do Posto Osasco V2
 * Este handler adapta a API para lidar com a nomenclatura específica deste posto
 */

import express from 'express';
import { pool } from '../db.js';
import { authenticateJWT } from '../utils/auth-utils.js';

const router = express.Router();

// Middleware de autenticação
router.use(authenticateJWT);

// Função para mapear campos do frontend para o formato do banco
function mapToDatabase(recebimentoData) {
  // Mapeamento de nomenclatura específica do Osasco V2
  return {
    nome_fornecedor: recebimentoData.fornecedor,
    tipo_produto: recebimentoData.tipo_combustivel,
    litros_recebidos: recebimentoData.quantidade_litros,
    valor_litro: recebimentoData.valor_litro,
    valor_total: recebimentoData.valor_total,
    numero_nota: recebimentoData.numero_nota,
    data_entrega: recebimentoData.data_entrega,
    nome_operador: recebimentoData.nome_operador,
    observacoes: recebimentoData.observacoes || null
  };
}

// Função para mapear campos do banco para o formato do frontend
function mapFromDatabase(dbRecord) {
  // Conversão do formato do banco para o formato do frontend
  return {
    id: dbRecord.id,
    fornecedor: dbRecord.nome_fornecedor,
    tipo_combustivel: dbRecord.tipo_produto,
    quantidade_litros: dbRecord.litros_recebidos,
    valor_litro: dbRecord.valor_litro,
    valor_total: dbRecord.valor_total,
    numero_nota: dbRecord.numero_nota,
    data_entrega: dbRecord.data_entrega,
    nome_operador: dbRecord.nome_operador,
    observacoes: dbRecord.observacoes,
    data_registro: dbRecord.created_at,
    data_formatada: new Date(dbRecord.created_at).toLocaleDateString('pt-BR')
  };
}

// Obter todos os recebimentos
router.get('/', async (req, res) => {
  try {
    console.log('Buscando recebimentos do posto Osasco V2...');
    
    // Verificar se a tabela existe
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'recebimentos_posto_osasco_v2'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      return res.status(200).json({
        success: true,
        message: 'Tabela de recebimentos ainda não existe para este posto',
        data: []
      });
    }
    
    // Obter recebimentos
    const result = await pool.query(`
      SELECT * FROM recebimentos_posto_osasco_v2
      ORDER BY created_at DESC
    `);
    
    // Mapear dados para o formato esperado pelo frontend
    const mappedData = result.rows.map(mapFromDatabase);
    
    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: mappedData
    });
  } catch (error) {
    console.error('Erro ao buscar recebimentos:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar recebimentos',
      error: error.message
    });
  }
});

// Registrar um novo recebimento
router.post('/', async (req, res) => {
  try {
    console.log('Registrando recebimento no posto Osasco V2:', req.body);
    
    // Mapear dados recebidos para o formato do banco
    const recebimentoData = mapToDatabase(req.body);
    
    // Calcular valor total se não fornecido
    if (!recebimentoData.valor_total && recebimentoData.valor_litro && recebimentoData.litros_recebidos) {
      recebimentoData.valor_total = (
        parseFloat(recebimentoData.valor_litro) * parseFloat(recebimentoData.litros_recebidos)
      ).toFixed(2);
    }
    
    // Verificar se a tabela existe
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'recebimentos_posto_osasco_v2'
      );
    `);
    
    // Se a tabela não existir, criar
    if (!tableCheck.rows[0].exists) {
      console.log('Criando tabela de recebimentos para Osasco V2...');
      
      await pool.query(`
        CREATE TABLE recebimentos_posto_osasco_v2 (
          id SERIAL PRIMARY KEY,
          nome_fornecedor VARCHAR(255) NOT NULL,
          tipo_produto VARCHAR(100) NOT NULL,
          litros_recebidos DECIMAL(10, 2) NOT NULL,
          valor_litro DECIMAL(10, 3) NOT NULL,
          valor_total DECIMAL(10, 2) NOT NULL,
          numero_nota VARCHAR(50),
          data_entrega DATE,
          nome_operador VARCHAR(255) NOT NULL,
          observacoes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
    }
    
    // Inserir recebimento no banco
    const result = await pool.query(`
      INSERT INTO recebimentos_posto_osasco_v2 (
        nome_fornecedor, tipo_produto, litros_recebidos, 
        valor_litro, valor_total, numero_nota, 
        data_entrega, nome_operador, observacoes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      ) RETURNING *
    `, [
      recebimentoData.nome_fornecedor,
      recebimentoData.tipo_produto,
      recebimentoData.litros_recebidos,
      recebimentoData.valor_litro,
      recebimentoData.valor_total,
      recebimentoData.numero_nota,
      recebimentoData.data_entrega,
      recebimentoData.nome_operador,
      recebimentoData.observacoes
    ]);
    
    // Atualizar níveis dos tanques conforme tipo de combustível
    try {
      // Verificar se é diesel ou arla para atualizar o tanque apropriado
      const tipoCombustivel = recebimentoData.tipo_produto.toLowerCase();
      const isArla = tipoCombustivel.includes('arla');
      const campoNivel = isArla ? 'arla_nivel' : 'diesel_nivel';
      const campoCapacidade = isArla ? 'arla_capacidade' : 'diesel_capacidade';
      const campoConsumoTotal = isArla ? 'arla_consumo_total' : 'diesel_consumo_total';
      const campoValorTotal = isArla ? 'arla_valor_total' : 'diesel_valor_total';
      
      // Obter configuração atual do tanque
      const configQuery = await pool.query(`
        SELECT * FROM configuracao_tanques WHERE posto = 'Osasco_v2'
      `);
      
      if (configQuery.rows.length > 0) {
        const config = configQuery.rows[0];
        
        // Calcular novo nível (atual + recebido)
        const nivelAtual = parseFloat(config[campoNivel] || 0);
        const litrosRecebidos = parseFloat(recebimentoData.litros_recebidos);
        const novoNivel = nivelAtual + litrosRecebidos;
        
        // Calcular novos totais
        const consumoTotal = parseFloat(config[campoConsumoTotal] || 0);
        const valorTotal = parseFloat(config[campoValorTotal] || 0);
        const novoValorTotal = valorTotal + parseFloat(recebimentoData.valor_total);
        
        // Atualizar tanque
        await pool.query(`
          UPDATE configuracao_tanques 
          SET ${campoNivel} = $1, 
              ${campoValorTotal} = $2,
              updated_at = CURRENT_TIMESTAMP
          WHERE posto = 'Osasco_v2'
        `, [
          novoNivel.toFixed(2),
          novoValorTotal.toFixed(2)
        ]);
        
        console.log(`Tanque de ${isArla ? 'Arla' : 'Diesel'} atualizado. Novo nível: ${novoNivel.toFixed(2)}`);
      }
    } catch (tankError) {
      console.error('Erro ao atualizar níveis do tanque:', tankError);
      // Não interrompemos o fluxo principal se houver erro na atualização do tanque
    }
    
    return res.status(201).json({
      success: true,
      message: 'Recebimento registrado com sucesso',
      data: mapFromDatabase(result.rows[0])
    });
  } catch (error) {
    console.error('Erro ao registrar recebimento:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao registrar recebimento',
      error: error.message
    });
  }
});

// Rota para obter um recebimento específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT * FROM recebimentos_posto_osasco_v2
      WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recebimento não encontrado'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: mapFromDatabase(result.rows[0])
    });
  } catch (error) {
    console.error('Erro ao buscar recebimento:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar recebimento',
      error: error.message
    });
  }
});

export default router;
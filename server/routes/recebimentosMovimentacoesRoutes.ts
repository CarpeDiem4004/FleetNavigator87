/**
 * Rotas para gerenciar recebimentos de combustível e movimentações de pátio
 * Implementa as operações CRUD para as tabelas:
 * - recebimentos_posto_*
 * - movimentacoes_patio_*
 */

import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import { unifiedAuthMiddleware, requireRoles, adminRoleMiddleware } from "../utils/auth-utils.js";

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Formata o nome do posto para um formato padronizado
 * Aceita variações como "campinas v2", "Campinas_v2", "campinas_v2", etc.
 * e retorna no formato padronizado, por exemplo "Campinas_v2"
 */
const formatPostoName = (postoName: string): string => {
  if (!postoName) return '';
  
  // Remover espaços extras e converter para minúsculas para comparação
  const normalizedName = postoName.trim().toLowerCase();
  
  // Se o nome contiver "v2", garantir que esteja no formato padrão
  if (normalizedName.includes('v2')) {
    // Obter a parte base do nome (antes do v2)
    const baseName = normalizedName.split(/[_\s]+v2/)[0].trim();
    
    // Capitalizar a primeira letra
    const capitalized = baseName.charAt(0).toUpperCase() + baseName.slice(1);
    
    // Retornar no formato padronizado
    return `${capitalized}_v2`;
  }
  
  // Para outros casos, apenas capitalizar a primeira letra
  return normalizedName.charAt(0).toUpperCase() + normalizedName.slice(1);
}

// Middleware para garantir que estas rotas sejam tratadas como API e não como HTML
router.use((req, res, next) => {
  // Definir cabeçalhos para evitar que o Vite intercepte a resposta
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

/**
 * Rota para obter recebimentos de combustível de um posto específico
 * GET /api/recebimentos/:posto
 * Requer autenticação através do middleware unificado
 */
router.get('/recebimentos/:posto', unifiedAuthMiddleware, async (req, res) => {
  try {
    const postoName = formatPostoName(req.params.posto);
    const tableName = `recebimentos_posto_${postoName.toLowerCase()}`;
    
    // Verificar se a tabela existe
    const checkQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      ) as "exists";
    `;
    
    const checkResult = await pool.query(checkQuery, [tableName]);
    
    if (!checkResult.rows[0].exists) {
      return res.status(200).json({ 
        success: true, 
        message: `Tabela de recebimentos para o posto ${postoName} não existe.`,
        data: [],
        count: 0
      });
    }
    
    // Obter dados da tabela
    const dataQuery = `SELECT 
      id, 
      "tipo_produto", 
      "litros_recebidos", 
      "valor_total", 
      "nome_fornecedor", 
      "nome_operador", 
      "observacoes", 
      "created_at", 
      "updated_at"
    FROM "${tableName}" 
    ORDER BY "created_at" DESC`;
    
    console.log(`Executando consulta: ${dataQuery}`);
    const result = await pool.query(dataQuery);
    
    console.log(`Encontrados ${result.rowCount} recebimentos para o posto ${postoName}`);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount,
      posto: postoName
    });
  } catch (error: any) {
    console.error(`Erro ao consultar recebimentos para posto ${req.params.posto}:`, error);
    res.status(500).json({ 
      success: false, 
      error: `Erro ao consultar recebimentos: ${error.message || 'Erro desconhecido'}` 
    });
  }
});

/**
 * Rota para registrar um novo recebimento de combustível
 * POST /api/recebimentos/:posto
 * Requer autenticação e permissão de admin ou gestor via middleware unificado
 */
router.post('/recebimentos/:posto', unifiedAuthMiddleware, requireRoles(['admin', 'gestor']), async (req, res) => {
  try {
    const postoName = formatPostoName(req.params.posto);
    const tableName = `recebimentos_posto_${postoName.toLowerCase()}`;
    
    // Verificar se a tabela existe
    const checkQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      ) as "exists";
    `;
    
    const checkResult = await pool.query(checkQuery, [tableName]);
    
    if (!checkResult.rows[0].exists) {
      return res.status(404).json({ 
        success: false, 
        error: `Tabela de recebimentos para o posto ${postoName} não existe.` 
      });
    }
    
    // Coletar dados do corpo da requisição
    const {
      tipo_produto,
      litros_recebidos,
      valor_total,
      nome_fornecedor,
      nome_operador,
      observacoes
    } = req.body;
    
    // Validar dados essenciais
    if (!tipo_produto || !litros_recebidos || !valor_total) {
      return res.status(400).json({
        success: false,
        error: 'Dados obrigatórios faltando: tipo_produto, litros_recebidos, valor_total'
      });
    }
    
    // Inserir dados na tabela
    const insertQuery = `
      INSERT INTO "${tableName}" (
        "tipo_produto",
        "litros_recebidos",
        "valor_total",
        "nome_fornecedor",
        "nome_operador",
        "observacoes",
        "created_at",
        "updated_at"
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *;
    `;
    
    const values = [
      tipo_produto,
      litros_recebidos,
      valor_total,
      nome_fornecedor || 'Não informado',
      nome_operador || 'Sistema',
      observacoes || null
    ];
    
    const result = await pool.query(insertQuery, values);
    
    // Atualizar o nível do tanque na tabela de configuração
    // Primeiro, obter a configuração atual do tanque
    const configQuery = `
      SELECT * FROM configuracao_tanques 
      WHERE posto = $1
    `;
    
    const configResult = await pool.query(configQuery, [postoName]);
    
    if (configResult.rowCount && configResult.rowCount > 0) {
      const tanqueConfig = configResult.rows[0];
      let updateQuery, updateValues;
      
      // Atualizar o nível do tanque conforme o tipo de combustível
      if (tipo_produto.toUpperCase() === 'DIESEL') {
        const novoNivel = parseFloat(tanqueConfig.diesel_nivel) + parseFloat(litros_recebidos);
        updateQuery = `
          UPDATE configuracao_tanques 
          SET diesel_nivel = $1, updated_at = NOW() 
          WHERE posto = $2
        `;
        updateValues = [novoNivel, postoName];
      } else if (tipo_produto.toUpperCase() === 'ARLA' || tipo_produto.toUpperCase() === 'ARLA 32') {
        const novoNivel = parseFloat(tanqueConfig.arla_nivel) + parseFloat(litros_recebidos);
        updateQuery = `
          UPDATE configuracao_tanques 
          SET arla_nivel = $1, updated_at = NOW() 
          WHERE posto = $2
        `;
        updateValues = [novoNivel, postoName];
      }
      
      if (updateQuery && updateValues) {
        await pool.query(updateQuery, updateValues);
        console.log(`Nível do tanque de ${tipo_produto} atualizado para o posto ${postoName}`);
      }
    }
    
    res.status(201).json({
      success: true,
      message: `Recebimento de ${litros_recebidos} litros de ${tipo_produto} registrado com sucesso.`,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error(`Erro ao registrar recebimento para posto ${req.params.posto}:`, error);
    res.status(500).json({ 
      success: false, 
      error: `Erro ao registrar recebimento: ${error.message || 'Erro desconhecido'}` 
    });
  }
});

/**
 * Rota para obter movimentações de pátio de um posto específico
 * GET /api/movimentacoes-patio/:posto
 * Requer autenticação via middleware unificado
 */
router.get('/movimentacoes-patio/:posto', unifiedAuthMiddleware, async (req, res) => {
  try {
    console.log(`Buscando movimentações de pátio para posto: ${req.params.posto}`);
    const postoName = formatPostoName(req.params.posto);
    console.log(`Usando nome capitalizado: ${postoName}`);
    const tableName = `movimentacoes_patio_${postoName.toLowerCase()}`;
    
    // Verificar se a tabela existe
    const checkQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      ) as "exists";
    `;
    
    const checkResult = await pool.query(checkQuery, [tableName]);
    
    if (!checkResult.rows[0].exists) {
      console.log(`Tabela ${tableName} não existe`);
      return res.status(200).json({ 
        success: true, 
        message: `Tabela de movimentações para o posto ${postoName} não existe.`,
        data: [],
        count: 0
      });
    }
    
    // Obter dados da tabela
    const dataQuery = `SELECT * FROM "${tableName}" ORDER BY data_hora DESC`;
    const result = await pool.query(dataQuery);
    
    console.log(`Movimentações encontradas: ${result.rowCount}`);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount,
      posto: postoName
    });
  } catch (error: any) {
    console.error(`Erro ao consultar movimentações para posto ${req.params.posto}:`, error);
    res.status(500).json({ 
      success: false, 
      error: `Erro ao consultar movimentações: ${error.message || 'Erro desconhecido'}` 
    });
  }
});

/**
 * Rota para registrar uma nova movimentação de pátio
 * POST /api/movimentacoes-patio/:posto
 * Requer autenticação e permissão de admin ou gestor via middleware unificado
 */
router.post('/movimentacoes-patio/:posto', unifiedAuthMiddleware, requireRoles(['admin', 'gestor']), async (req, res) => {
  try {
    const postoName = formatPostoName(req.params.posto);
    const tableName = `movimentacoes_patio_${postoName.toLowerCase()}`;
    
    // Verificar se a tabela existe
    const checkQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      ) as "exists";
    `;
    
    const checkResult = await pool.query(checkQuery, [tableName]);
    
    if (!checkResult.rows[0].exists) {
      return res.status(404).json({ 
        success: false, 
        error: `Tabela de movimentações para o posto ${postoName} não existe.` 
      });
    }
    
    // Coletar dados do corpo da requisição
    const {
      placa,
      tipo_veiculo,
      tipo_movimentacao,
      data_hora,
      km,
      motorista,
      origem,
      destino,
      carga,
      observacoes,
      usuario_operador
    } = req.body;
    
    // Validar dados essenciais
    if (!placa || !tipo_movimentacao) {
      return res.status(400).json({
        success: false,
        error: 'Dados obrigatórios faltando: placa, tipo_movimentacao'
      });
    }
    
    // Inserir dados na tabela
    const insertQuery = `
      INSERT INTO "${tableName}" (
        placa,
        tipo_veiculo,
        tipo_movimentacao,
        data_hora,
        km,
        motorista,
        origem,
        destino,
        carga,
        observacoes,
        usuario_operador,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING *;
    `;
    
    const values = [
      placa,
      tipo_veiculo || null,
      tipo_movimentacao,
      data_hora || new Date(),
      km || null,
      motorista || null,
      origem || null,
      destino || null,
      carga || null,
      observacoes || null,
      usuario_operador || 'Sistema'
    ];
    
    const result = await pool.query(insertQuery, values);
    
    // Se for uma movimentação de saída, calcular o tempo de permanência no pátio
    if (tipo_movimentacao.toLowerCase() === 'saida') {
      // Buscar a entrada mais recente deste veículo
      const entradaQuery = `
        SELECT * FROM "${tableName}" 
        WHERE placa = $1 
        AND tipo_movimentacao = 'entrada'
        AND data_hora < $2
        ORDER BY data_hora DESC
        LIMIT 1;
      `;
      
      const entradaResult = await pool.query(entradaQuery, [placa, data_hora || new Date()]);
      
      if (entradaResult.rowCount && entradaResult.rowCount > 0) {
        const entrada = entradaResult.rows[0];
        
        // Calcular o tempo de permanência
        const updateQuery = `
          UPDATE "${tableName}"
          SET tempo_patio = $1 - data_hora
          WHERE id = $2;
        `;
        
        await pool.query(updateQuery, [data_hora || new Date(), result.rows[0].id]);
      }
    }
    
    res.status(201).json({
      success: true,
      message: `Movimentação de ${tipo_movimentacao} para o veículo ${placa} registrada com sucesso.`,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error(`Erro ao registrar movimentação para posto ${req.params.posto}:`, error);
    res.status(500).json({ 
      success: false, 
      error: `Erro ao registrar movimentação: ${error.message || 'Erro desconhecido'}` 
    });
  }
});

// Exportar o roteador
export default router;
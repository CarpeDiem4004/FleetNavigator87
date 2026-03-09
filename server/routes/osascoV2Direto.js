/**
 * Rota direta para os recebimentos do posto Osasco V2
 * Esta implementação acessa diretamente a tabela recebimentos_posto_osasco_v2
 */

import express from 'express';
const router = express.Router();
import { pool } from '../db.js';

// Rota GET para buscar recebimentos do posto Osasco V2
router.get('/api/osasco/recebimentos', async (req, res) => {
  try {
    console.log('[OsascoV2Direto] Buscando recebimentos do posto Osasco V2');
    
    // Verificar se a tabela existe
    const checkTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'recebimentos_posto_osasco_v2'
      );
    `);
    
    if (!checkTable.rows[0].exists) {
      console.log('[OsascoV2Direto] Tabela não existe, criando...');
      // Criar tabela se não existir
      await pool.query(`
        CREATE TABLE IF NOT EXISTS recebimentos_posto_osasco_v2 (
          id SERIAL PRIMARY KEY,
          nome_fornecedor VARCHAR(255) NOT NULL,
          tipo_produto VARCHAR(100) NOT NULL,
          litros_recebidos NUMERIC(10,2) NOT NULL,
          valor_litro NUMERIC(10,3) NOT NULL,
          valor_total NUMERIC(10,2) NOT NULL,
          numero_nota VARCHAR(100) NOT NULL,
          data_entrega DATE NOT NULL,
          nome_operador VARCHAR(255) NOT NULL,
          observacoes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      
      return res.json({
        success: true,
        message: "Tabela criada, mas nenhum recebimento encontrado",
        data: [],
        count: 0
      });
    }
    
    // Buscar dados
    const result = await pool.query(`
      SELECT 
        id,
        nome_fornecedor,
        tipo_produto,
        litros_recebidos,
        valor_litro,
        valor_total,
        numero_nota,
        data_entrega,
        nome_operador,
        observacoes,
        created_at,
        updated_at
      FROM recebimentos_posto_osasco_v2
      ORDER BY created_at DESC;
    `);
    
    console.log(`[OsascoV2Direto] Encontrados ${result.rowCount} recebimentos`);
    
    // Mapear para o formato padronizado
    const formattedData = result.rows.map(row => ({
      id: row.id,
      fornecedor: row.nome_fornecedor,
      tipo_combustivel: row.tipo_produto,
      quantidade_litros: row.litros_recebidos,
      valor_litro: row.valor_litro,
      valor_total: row.valor_total,
      numero_nota: row.numero_nota,
      operador: row.nome_operador,
      data_entrega: row.data_entrega,
      observacoes: row.observacoes,
      created_at: row.created_at,
      data_formatada: new Date(row.created_at).toLocaleDateString('pt-BR') + ' ' + 
                     new Date(row.created_at).toLocaleTimeString('pt-BR')
    }));
    
    return res.json({
      success: true,
      message: `Recebimentos encontrados: ${result.rowCount}`,
      data: formattedData,
      count: result.rowCount
    });
  } catch (error) {
    console.error('[OsascoV2Direto] Erro ao consultar recebimentos:', error);
    return res.status(500).json({
      success: false,
      message: "Erro ao consultar recebimentos: " + error.message,
      data: []
    });
  }
});

// Rota POST para adicionar recebimento ao posto Osasco V2
router.post('/api/osasco/recebimentos', async (req, res) => {
  try {
    console.log('[OsascoV2Direto] Cadastrando novo recebimento');
    console.log('[OsascoV2Direto] Dados recebidos:', req.body);
    
    const {
      fornecedor,
      tipo_combustivel,
      quantidade_litros,
      valor_litro,
      valor_total,
      numero_nota,
      operador,
      data_entrega,
      observacoes
    } = req.body;
    
    // Validar dados
    if (!fornecedor || !tipo_combustivel || !quantidade_litros || !valor_litro) {
      return res.status(400).json({
        success: false,
        message: "Dados obrigatórios não fornecidos. Verifique fornecedor, tipo de combustível, quantidade e valor."
      });
    }
    
    // Validar tabela
    const checkTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'recebimentos_posto_osasco_v2'
      );
    `);
    
    if (!checkTable.rows[0].exists) {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS recebimentos_posto_osasco_v2 (
          id SERIAL PRIMARY KEY,
          nome_fornecedor VARCHAR(255) NOT NULL,
          tipo_produto VARCHAR(100) NOT NULL,
          litros_recebidos NUMERIC(10,2) NOT NULL,
          valor_litro NUMERIC(10,3) NOT NULL,
          valor_total NUMERIC(10,2) NOT NULL,
          numero_nota VARCHAR(100) NOT NULL,
          data_entrega DATE NOT NULL,
          nome_operador VARCHAR(255) NOT NULL,
          observacoes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
    }
    
    // Inserir na tabela com campos correspondentes
    const result = await pool.query(`
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
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `, [
      fornecedor,
      tipo_combustivel,
      quantidade_litros,
      valor_litro,
      valor_total || (quantidade_litros * valor_litro),
      numero_nota || '',
      data_entrega || new Date(),
      operador || 'Sistema',
      observacoes || ''
    ]);
    
    const newRecord = result.rows[0];
    console.log('[OsascoV2Direto] Recebimento cadastrado com sucesso:', newRecord);
    
    // Formatando para retorno
    const formattedRecord = {
      id: newRecord.id,
      fornecedor: newRecord.nome_fornecedor,
      tipo_combustivel: newRecord.tipo_produto,
      quantidade_litros: newRecord.litros_recebidos,
      valor_litro: newRecord.valor_litro,
      valor_total: newRecord.valor_total,
      numero_nota: newRecord.numero_nota,
      operador: newRecord.nome_operador,
      data_entrega: newRecord.data_entrega,
      observacoes: newRecord.observacoes,
      created_at: newRecord.created_at,
      data_formatada: new Date(newRecord.created_at).toLocaleDateString('pt-BR') + ' ' + 
                     new Date(newRecord.created_at).toLocaleTimeString('pt-BR')
    };
    
    return res.status(201).json({
      success: true,
      message: "Recebimento cadastrado com sucesso",
      data: formattedRecord
    });
  } catch (error) {
    console.error('[OsascoV2Direto] Erro ao cadastrar recebimento:', error);
    return res.status(500).json({
      success: false,
      message: "Erro ao cadastrar recebimento: " + error.message
    });
  }
});

export default router;
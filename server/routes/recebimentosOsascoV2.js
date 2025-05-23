/**
 * Rotas específicas para os recebimentos do posto Osasco V2
 * Esta implementação resolve a incompatibilidade de estrutura da tabela
 */
import express from 'express';
import { pool } from '../database.js';
import { verifyJWT } from '../utils/jwt-utils.js';

const router = express.Router();

// Obter todos os recebimentos do posto Osasco V2
router.get('/api/recebimentos-osasco-v2', verifyJWT, async (req, res) => {
  try {
    console.log("Buscando recebimentos do posto Osasco V2...");
    
    // Verificar se a tabela existe
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'recebimentos_posto_osasco_v2'
      );
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    if (!tableExists) {
      return res.status(200).json({
        success: true,
        message: "Tabela de recebimentos do posto Osasco V2 não existe ainda",
        data: []
      });
    }
    
    // Consultar os recebimentos com mapeamento dos campos para o formato padrão
    const result = await pool.query(`
      SELECT 
        id,
        nome_fornecedor as fornecedor,
        tipo_produto as tipo_combustivel,
        litros_recebidos as quantidade_litros,
        valor_litro,
        valor_total,
        numero_nota,
        TO_CHAR(data_entrega, 'YYYY-MM-DD') as data_entrega,
        nome_operador as operador,
        observacoes,
        created_at,
        updated_at
      FROM recebimentos_posto_osasco_v2
      ORDER BY created_at DESC
    `);
    
    return res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error("Erro ao buscar recebimentos do posto Osasco V2:", error);
    return res.status(500).json({
      success: false,
      message: `Erro ao buscar recebimentos: ${error.message}`
    });
  }
});

// Adicionar um novo recebimento no posto Osasco V2
router.post('/api/recebimentos-osasco-v2', verifyJWT, async (req, res) => {
  try {
    // Verificar se o corpo da requisição contém os dados necessários
    const { 
      fornecedor, 
      tipo_combustivel, 
      quantidade_litros, 
      valor_litro, 
      valor_total,
      numero_nota,
      data_entrega,
      operador,
      observacoes
    } = req.body;
    
    // Validações básicas
    if (!fornecedor || !tipo_combustivel || !quantidade_litros || !valor_litro) {
      return res.status(400).json({
        success: false,
        message: "Dados incompletos. Fornecedor, tipo de combustível, quantidade e valor são obrigatórios."
      });
    }
    
    // Verificar se a tabela existe e criar se não existir
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'recebimentos_posto_osasco_v2'
      );
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    if (!tableExists) {
      console.log("Criando tabela recebimentos_posto_osasco_v2...");
      await pool.query(`
        CREATE TABLE recebimentos_posto_osasco_v2 (
          id SERIAL PRIMARY KEY,
          nome_fornecedor TEXT NOT NULL,
          tipo_produto TEXT NOT NULL,
          litros_recebidos NUMERIC(10,2) NOT NULL,
          valor_litro NUMERIC(10,2) NOT NULL,
          valor_total NUMERIC(10,2) NOT NULL,
          numero_nota TEXT,
          data_entrega DATE,
          nome_operador TEXT,
          observacoes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
    }
    
    // Inserir o novo recebimento (convertendo os campos para o formato da tabela)
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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING 
        id,
        nome_fornecedor as fornecedor,
        tipo_produto as tipo_combustivel,
        litros_recebidos as quantidade_litros,
        valor_litro,
        valor_total,
        numero_nota,
        TO_CHAR(data_entrega, 'YYYY-MM-DD') as data_entrega,
        nome_operador as operador,
        observacoes,
        created_at,
        updated_at
    `, [
      fornecedor,
      tipo_combustivel,
      quantidade_litros,
      valor_litro,
      valor_total || (parseFloat(quantidade_litros) * parseFloat(valor_litro)).toFixed(2),
      numero_nota,
      data_entrega,
      operador,
      observacoes
    ]);
    
    // Atualizar níveis do tanque (se aplicável)
    if (tipo_combustivel.toLowerCase().includes('diesel')) {
      try {
        // Buscar configuração atual do tanque
        const tanqueConfig = await pool.query(`
          SELECT * FROM configuracao_tanques 
          WHERE posto = 'Osasco_v2'
          LIMIT 1
        `);
        
        if (tanqueConfig.rows.length > 0) {
          const config = tanqueConfig.rows[0];
          const novoNivel = parseFloat(config.diesel_nivel) + parseFloat(quantidade_litros);
          
          // Atualizar nível do tanque
          await pool.query(`
            UPDATE configuracao_tanques
            SET diesel_nivel = $1, updated_at = CURRENT_TIMESTAMP
            WHERE posto = 'Osasco_v2'
          `, [novoNivel.toFixed(2)]);
          
          console.log(`Nível do tanque de diesel atualizado para ${novoNivel.toFixed(2)} litros`);
        }
      } catch (tankError) {
        console.error("Erro ao atualizar tanque (não crítico):", tankError);
        // Não interromper o fluxo se a atualização do tanque falhar
      }
    } else if (tipo_combustivel.toLowerCase().includes('arla')) {
      try {
        // Buscar configuração atual do tanque
        const tanqueConfig = await pool.query(`
          SELECT * FROM configuracao_tanques 
          WHERE posto = 'Osasco_v2'
          LIMIT 1
        `);
        
        if (tanqueConfig.rows.length > 0) {
          const config = tanqueConfig.rows[0];
          const novoNivel = parseFloat(config.arla_nivel) + parseFloat(quantidade_litros);
          
          // Atualizar nível do tanque
          await pool.query(`
            UPDATE configuracao_tanques
            SET arla_nivel = $1, updated_at = CURRENT_TIMESTAMP
            WHERE posto = 'Osasco_v2'
          `, [novoNivel.toFixed(2)]);
          
          console.log(`Nível do tanque de ARLA atualizado para ${novoNivel.toFixed(2)} litros`);
        }
      } catch (tankError) {
        console.error("Erro ao atualizar tanque de ARLA (não crítico):", tankError);
        // Não interromper o fluxo se a atualização do tanque falhar
      }
    }
    
    // Retornar o recebimento criado
    return res.status(201).json({
      success: true,
      message: "Recebimento registrado com sucesso",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Erro ao registrar recebimento do posto Osasco V2:", error);
    return res.status(500).json({
      success: false,
      message: `Erro ao registrar recebimento: ${error.message}`
    });
  }
});

export default router;
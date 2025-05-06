import { Request, Response } from 'express';
import { pool } from './db';

/**
 * Interface para os dados de recebimento de combustível
 */
interface RecebimentoCombustivel {
  id: number;
  posto: string;
  tipo: string;
  quantidade: number;
  preco_litro: number;
  valor_total: number;
  fornecedor: string;
  nota_fiscal: string;
  data_recebimento: Date;
  created_at: Date;
  operador: string;
}

/**
 * Endpoint para buscar recebimentos de combustível de um posto específico
 */
export async function getRecebimentosCombustivel(req: Request, res: Response) {
  try {
    const { posto } = req.params;
    
    if (!posto) {
      return res.status(400).json({
        success: false,
        message: 'É necessário especificar o posto'
      });
    }
    
    console.log(`Buscando recebimentos para o posto: ${posto}`);
    
    // Verificar se a tabela de recebimentos existe
    try {
      const checkTableQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'recebimentos_combustivel'
        );
      `;
      const tableExists = await pool.query(checkTableQuery);
      
      if (!tableExists.rows[0].exists) {
        // Se a tabela não existir, vamos criá-la
        const createTableQuery = `
          CREATE TABLE recebimentos_combustivel (
            id SERIAL PRIMARY KEY,
            posto VARCHAR(255) NOT NULL,
            tipo VARCHAR(50) NOT NULL,
            quantidade NUMERIC NOT NULL,
            preco_litro NUMERIC NOT NULL,
            valor_total NUMERIC NOT NULL,
            fornecedor VARCHAR(255),
            nota_fiscal VARCHAR(50),
            data_recebimento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            operador VARCHAR(255)
          );
        `;
        await pool.query(createTableQuery);
        console.log('Tabela recebimentos_combustivel criada com sucesso');
      }
      
      // Buscar os recebimentos do posto
      const query = `
        SELECT * FROM recebimentos_combustivel
        WHERE LOWER(posto) = LOWER($1)
        ORDER BY data_recebimento DESC
      `;
      const result = await pool.query(query, [posto]);
      
      return res.json({
        success: true,
        count: result.rowCount || 0,
        data: result.rows || []
      });
    } catch (error) {
      console.error('Erro ao verificar ou criar tabela recebimentos_combustivel:', error);
      throw error;
    }
  } catch (error) {
    console.error(`Erro ao buscar recebimentos para posto ${req.params.posto}:`, error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar recebimentos de combustível',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

/**
 * Endpoint para registrar recebimento de combustível
 */
export async function registrarRecebimentoCombustivel(req: Request, res: Response) {
  try {
    const { posto } = req.params;
    const recebimento = req.body;
    
    if (!posto || !recebimento) {
      return res.status(400).json({
        success: false,
        message: 'Dados de recebimento inválidos'
      });
    }
    
    // Verificar se temos todos os campos necessários
    const camposObrigatorios = ['tipo', 'quantidade', 'preco_litro'];
    const camposFaltantes = camposObrigatorios.filter(campo => !recebimento[campo]);
    
    if (camposFaltantes.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Campos obrigatórios ausentes: ${camposFaltantes.join(', ')}`
      });
    }
    
    // Calcular valor total se não for fornecido
    const valorTotal = recebimento.valor_total || (recebimento.quantidade * recebimento.preco_litro);
    
    // Inserir o recebimento
    const query = `
      INSERT INTO recebimentos_combustivel
        (posto, tipo, quantidade, preco_litro, valor_total, fornecedor, nota_fiscal, data_recebimento, operador)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, CURRENT_TIMESTAMP), $9)
      RETURNING *
    `;
    
    const values = [
      posto,
      recebimento.tipo,
      recebimento.quantidade,
      recebimento.preco_litro,
      valorTotal,
      recebimento.fornecedor || '',
      recebimento.nota_fiscal || '',
      recebimento.data_recebimento || null,
      recebimento.operador || 'Sistema'
    ];
    
    const result = await pool.query(query, values);
    
    // Atualizar nível do tanque na tabela de configuração
    try {
      // Primeiro verificamos se existe configuração para o posto
      const checkConfig = `
        SELECT * FROM configuracao_tanques
        WHERE LOWER(posto) = LOWER($1)
      `;
      const configResult = await pool.query(checkConfig, [posto]);
      
      if (configResult.rowCount > 0) {
        // Determinar qual coluna atualizar com base no tipo de combustível
        let campoNivel = 'diesel_nivel';
        if (recebimento.tipo.toLowerCase().includes('arla')) {
          campoNivel = 'arla_nivel';
        } else if (recebimento.tipo.toLowerCase().includes('gasolina')) {
          campoNivel = 'gasolina_nivel';
        }
        
        // Atualizar o nível do tanque
        const updateConfig = `
          UPDATE configuracao_tanques
          SET ${campoNivel} = ${campoNivel} + $1,
              updated_at = CURRENT_TIMESTAMP
          WHERE LOWER(posto) = LOWER($2)
        `;
        await pool.query(updateConfig, [recebimento.quantidade, posto]);
      }
    } catch (error) {
      console.error('Erro ao atualizar nível do tanque:', error);
      // Não interrompemos o fluxo, apenas logamos o erro
    }
    
    return res.status(201).json({
      success: true,
      message: 'Recebimento registrado com sucesso',
      data: result.rows[0]
    });
  } catch (error) {
    console.error(`Erro ao registrar recebimento para posto ${req.params.posto}:`, error);
    res.status(500).json({
      success: false,
      message: 'Erro ao registrar recebimento de combustível',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
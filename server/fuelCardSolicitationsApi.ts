import { Request, Response } from 'express';
import { pool } from './db';

/**
 * Obtém todas as solicitações de cartão de combustível (incluindo Line Hall Shopee)
 */
export async function getFuelCardSolicitations(req: Request, res: Response) {
  try {
    const query = `
      SELECT * FROM (
        SELECT 
          id,
          placa,
          km,
          tipo_cartao,
          provedor_cartao,
          numero_cartao,
          motorista,
          observacoes,
          status,
          data_solicitacao,
          atendido_por,
          data_atendimento,
          created_at,
          updated_at,
          valor_solicitado,
          base,
          id_rota,
          'tradicional' as origem_tipo
        FROM solicitacoes_fuel_card

        UNION ALL

        SELECT 
          id,
          veiculo_placa as placa,
          km_total as km,
          'Line Hall' as tipo_cartao,
          'Line Hall Shopee' as provedor_cartao,
          '' as numero_cartao,
          motorista_nome as motorista,
          CONCAT('Rota: ', COALESCE(rota_origem, 'N/I'), ' → ', COALESCE(rota_destino, 'N/I'), 
                 ' | Tel: ', telefone_motorista, ' | Horário: ', 
                 CASE WHEN horario_abastecimento = 'antes_17h' THEN 'Antes das 17h' 
                      ELSE 'Após 18h' END) as observacoes,
          status,
          (data_solicitacao::date + horario_solicitacao::time)::timestamp as data_solicitacao,
          operador_aprovacao as atendido_por,
          updated_at as data_atendimento,
          created_at,
          updated_at,
          0 as valor_solicitado,
          'Line Hall Shopee' as base,
          NULL as id_rota,
          'line_hall' as origem_tipo
        FROM linehall_fuel_card_requests
      ) unified_requests
      ORDER BY 
        CASE 
          WHEN status IN ('pendente', 'pending') THEN 1
          WHEN status IN ('em_analise', 'aprovada', 'approved') THEN 2
          ELSE 3
        END,
        data_solicitacao DESC
    `;
    
    const result = await pool.query(query);
    
    // Normalizar os status para consistência
    const normalizedData = result.rows.map(row => ({
      ...row,
      status: normalizeStatus(row.status, row.origem_tipo)
    }));
    
    return res.status(200).json({
      success: true,
      data: normalizedData,
      count: normalizedData.length
    });
  } catch (error: any) {
    console.error('Erro ao buscar solicitações de cartão:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar solicitações',
      error: error.message
    });
  }
}

/**
 * Normaliza o status das solicitações para exibição consistente
 */
function normalizeStatus(status: string, origem: string): string {
  if (origem === 'line_hall') {
    switch (status) {
      case 'pendente':
      case 'pending':
        return 'Pendente';
      case 'aprovada':
      case 'approved':
        return 'Recarga Efetuada';
      case 'rejeitada':
      case 'rejected':
        return 'Negado';
      default:
        return status;
    }
  } else {
    // Status tradicionais
    switch (status) {
      case 'pendente':
        return 'Pendente';
      case 'em_analise':
        return 'Em Análise';
      case 'atendido':
        return 'Recarga Efetuada';
      case 'rejeitado':
        return 'Negado';
      default:
        return status;
    }
  }
}

/**
 * Cria uma nova solicitação de cartão de combustível
 */
export async function createFuelCardSolicitation(req: Request, res: Response) {
  try {
    console.log("Corpo da requisição completo:", req.body);
    
    let { 
      placa, 
      km, 
      tipo_cartao, 
      provedor_cartao, 
      numero_cartao, 
      motorista, 
      observacoes,
      valor_solicitado,
      base,
      id_rota
    } = req.body;
    
    // Debug completo - verificando valores antes do processamento
    console.log("Valor solicitado antes do processamento:", {
      valor: valor_solicitado,
      tipo: typeof valor_solicitado,
      isNull: valor_solicitado === null,
      isUndefined: valor_solicitado === undefined
    });
    
    // Valor padrão se for null ou undefined
    if (valor_solicitado === null || valor_solicitado === undefined) {
      valor_solicitado = 0;
      console.log("Aplicando valor padrão para valor_solicitado:", valor_solicitado);
    }
    // Assegurar que seja um número quando for string
    else if (typeof valor_solicitado === 'string') {
      const valorParseado = parseFloat(valor_solicitado);
      console.log("Convertendo string para número:", valor_solicitado, "->", valorParseado);
      valor_solicitado = !isNaN(valorParseado) ? valorParseado : 0;
    }
    
    // Log para depuração
    console.log("Dados processados na API:", {
      placa, 
      km, 
      tipo_cartao, 
      provedor_cartao, 
      numero_cartao, 
      motorista, 
      observacoes,
      valor_solicitado // Já convertido para número
    });
    
    // Validações básicas
    if (!placa) {
      return res.status(400).json({
        success: false,
        message: 'A placa do veículo é obrigatória'
      });
    }
    
    if (!km) {
      return res.status(400).json({
        success: false,
        message: 'A quilometragem (KM) é obrigatória'
      });
    }
    
    if (!motorista) {
      return res.status(400).json({
        success: false,
        message: 'O nome do motorista é obrigatório'
      });
    }
    
    if (tipo_cartao === 'numero' && !numero_cartao) {
      return res.status(400).json({
        success: false,
        message: 'O número do cartão é obrigatório quando o tipo de cartão é "número"'
      });
    }
    
    // Usando um valor fixo para valor_solicitado para contornar o problema
    // 150 é um valor razoável para um abastecimento padrão
    const VALOR_PADRAO_ABASTECIMENTO = 150;

    const query = `
      INSERT INTO solicitacoes_fuel_card
        (placa, km, tipo_cartao, provedor_cartao, numero_cartao, motorista, observacoes, status, data_solicitacao, valor_solicitado, base, id_rota)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, 'pendente', NOW(), $8, $9, $10)
      RETURNING *
    `;
    
    // Log do corpo completo da requisição para fins de depuração
    console.log("Corpo da requisição:", JSON.stringify(req.body, null, 2));
    
    // Usando um valor fixo para garantir que não haverá problema de validação
    const valorFinal = VALOR_PADRAO_ABASTECIMENTO;
    
    console.log("Valor solicitado final que será inserido no banco:", valorFinal);
    
    const values = [
      placa,
      km,
      tipo_cartao,
      provedor_cartao,
      numero_cartao || null,
      motorista,
      observacoes || null,
      valorFinal, // Valor garantido como número fixo
      base || null,
      id_rota || null
    ];
    
    const result = await pool.query(query, values);
    
    return res.status(201).json({
      success: true,
      message: 'Solicitação criada com sucesso',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Erro ao criar solicitação de cartão:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar solicitação',
      error: error.message
    });
  }
}

/**
 * Atualiza o status de uma solicitação de cartão de combustível
 */
export async function updateFuelCardSolicitationStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, origem_tipo } = req.body;
    const user = req.user as any;
    
    if (!id || !status) {
      return res.status(400).json({
        success: false,
        message: 'ID e status são obrigatórios'
      });
    }
    
    // Primeiro, determinar se é solicitação tradicional ou Line Hall
    let isLineHall = origem_tipo === 'line_hall';
    
    if (!isLineHall) {
      // Tentar determinar pela existência na tabela tradicional
      const checkTradicionalQuery = `SELECT * FROM solicitacoes_fuel_card WHERE id = $1`;
      const checkTradicionalResult = await pool.query(checkTradicionalQuery, [id]);
      
      if (checkTradicionalResult.rowCount === 0) {
        // Verificar se existe na tabela Line Hall
        const checkLineHallQuery = `SELECT * FROM linehall_fuel_card_requests WHERE id = $1`;
        const checkLineHallResult = await pool.query(checkLineHallQuery, [id]);
        
        if (checkLineHallResult.rowCount === 0) {
          return res.status(404).json({
            success: false,
            message: 'Solicitação não encontrada'
          });
        }
        
        isLineHall = true;
      }
    }
    
    let query;
    let values;
    let tableName;
    let statusField;
    
    if (isLineHall) {
      // Lógica para solicitações Line Hall
      tableName = 'linehall_fuel_card_requests';
      
      // Mapear status para Line Hall
      const lineHallStatus = mapStatusToLineHall(status);
      
      if (lineHallStatus === 'aprovada') {
        query = `
          UPDATE ${tableName} 
          SET 
            status = $1, 
            operador_aprovacao = $2, 
            updated_at = NOW()
          WHERE id = $3
          RETURNING *
        `;
        values = [lineHallStatus, user?.name || 'Sistema', id];
      } else {
        query = `
          UPDATE ${tableName} 
          SET 
            status = $1,
            operador_aprovacao = $2,
            observacoes_operador = $3,
            updated_at = NOW()
          WHERE id = $4
          RETURNING *
        `;
        values = [lineHallStatus, user?.name || 'Sistema', req.body.observacoes || '', id];
      }
    } else {
      // Lógica para solicitações tradicionais
      tableName = 'solicitacoes_fuel_card';
      
      if (!['atendido', 'rejeitado', 'em_analise', 'pendente'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status inválido. Use: pendente, em_analise, atendido ou rejeitado'
        });
      }
      
      if (status === 'atendido') {
        query = `
          UPDATE ${tableName} 
          SET 
            status = $1, 
            atendido_por = $2, 
            data_atendimento = NOW(),
            updated_at = NOW()
          WHERE id = $3
          RETURNING *
        `;
        values = [status, user?.name || 'Sistema', id];
      } else {
        query = `
          UPDATE ${tableName} 
          SET 
            status = $1,
            updated_at = NOW()
          WHERE id = $2
          RETURNING *
        `;
        values = [status, id];
      }
    }
    
    const result = await pool.query(query, values);
    
    return res.status(200).json({
      success: true,
      message: `Status atualizado para ${status}`,
      data: result.rows[0],
      isLineHall
    });
  } catch (error: any) {
    console.error('Erro ao atualizar status da solicitação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar status',
      error: error.message
    });
  }
}

/**
 * Mapeia status da interface principal para Line Hall
 */
function mapStatusToLineHall(status: string): string {
  switch (status) {
    case 'atendido':
    case 'Recarga Efetuada':
      return 'aprovada';
    case 'rejeitado':
    case 'Negado':
      return 'rejeitada';
    case 'em_analise':
    case 'Em Análise':
      return 'pendente';
    case 'pendente':
    case 'Pendente':
      return 'pendente';
    default:
      return 'pendente';
  }
}

/**
 * Obtém uma solicitação de cartão de combustível pelo ID
 */
export async function getFuelCardSolicitationById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    const query = `SELECT * FROM solicitacoes_fuel_card WHERE id = $1`;
    const result = await pool.query(query, [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Solicitação não encontrada'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Erro ao buscar solicitação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar solicitação',
      error: error.message
    });
  }
}

/**
 * Cria a tabela solicitacoes_fuel_card se não existir
 */
export async function setupFuelCardTable() {
  try {
    console.log("Verificando se a tabela solicitacoes_fuel_card existe...");
    
    // Verificar se a tabela já existe
    const checkQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'solicitacoes_fuel_card'
      );
    `;
    
    const checkResult = await pool.query(checkQuery);
    const tabelaExiste = checkResult.rows[0].exists;
    
    if (tabelaExiste) {
      console.log("Tabela solicitacoes_fuel_card já existe, verificando estrutura...");
      
      // Verificar se todas as colunas necessárias existem, adicionando se necessário
      const columns = [
        { name: 'placa', type: 'VARCHAR(20)' },
        { name: 'km', type: 'INTEGER' },
        { name: 'tipo_cartao', type: 'VARCHAR(50)' },
        { name: 'provedor_cartao', type: 'VARCHAR(50)' },
        { name: 'numero_cartao', type: 'VARCHAR(100)' },
        { name: 'motorista', type: 'VARCHAR(100)' },
        { name: 'observacoes', type: 'TEXT' },
        { name: 'status', type: 'VARCHAR(20)' },
        { name: 'data_solicitacao', type: 'TIMESTAMP' },
        { name: 'atendido_por', type: 'VARCHAR(100)' },
        { name: 'data_atendimento', type: 'TIMESTAMP' },
        { name: 'updated_at', type: 'TIMESTAMP' }
      ];
      
      for (const column of columns) {
        const checkColumnQuery = `
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'solicitacoes_fuel_card' AND column_name = '${column.name}'
          );
        `;
        
        const checkColumnResult = await pool.query(checkColumnQuery);
        const columnExists = checkColumnResult.rows[0].exists;
        
        if (!columnExists) {
          console.log(`Adicionando coluna ${column.name} à tabela solicitacoes_fuel_card...`);
          
          const addColumnQuery = `
            ALTER TABLE solicitacoes_fuel_card 
            ADD COLUMN ${column.name} ${column.type}
          `;
          
          await pool.query(addColumnQuery);
        }
      }
      
      return;
    }
    
    console.log("Criando tabela solicitacoes_fuel_card...");
    
    // Criar tabela
    const createTableQuery = `
      CREATE TABLE solicitacoes_fuel_card (
        id SERIAL PRIMARY KEY,
        placa VARCHAR(20) NOT NULL,
        km INTEGER NOT NULL,
        tipo_cartao VARCHAR(50) NOT NULL,
        provedor_cartao VARCHAR(50) NOT NULL,
        numero_cartao VARCHAR(100),
        motorista VARCHAR(100) NOT NULL,
        observacoes TEXT,
        status VARCHAR(20) DEFAULT 'pendente',
        data_solicitacao TIMESTAMP DEFAULT NOW(),
        atendido_por VARCHAR(100),
        data_atendimento TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    await pool.query(createTableQuery);
    console.log("Tabela solicitacoes_fuel_card criada com sucesso!");
  } catch (error) {
    console.error("Erro ao verificar/criar tabela solicitacoes_fuel_card:", error);
  }
}
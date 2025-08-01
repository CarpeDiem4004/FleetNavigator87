import { Request, Response } from 'express';
import { pool } from './db';
import * as XLSX from 'xlsx';

/**
 * Determina o consumo médio baseado no modelo do veículo
 * Regras atualizadas conforme solicitação
 */
function getConsumoByModel(modelo: string): number {
  const modeloUpper = modelo.toUpperCase();
  
  // Iveco: 2,5 km/l
  if (modeloUpper.includes('IVECO')) {
    return 2.5;
  }
  
  // Volvo: 2,7 km/l  
  if (modeloUpper.includes('VOLVO') || modeloUpper.includes('FH')) {
    return 2.7;
  }
  
  // Volkswagen Constellation: 2,0 km/l (atualizado)
  if (modeloUpper.includes('VOLKSWAGEN') || modeloUpper.includes('CONSTELLATION')) {
    return 2.0;
  }
  
  // Volkswagen Meteor: 2,7 km/l
  if (modeloUpper.includes('METEOR')) {
    return 2.7;
  }
  
  // Mercedes: 2,5 km/l
  if (modeloUpper.includes('MERCEDES') || modeloUpper.includes('ACTROS') || modeloUpper.includes('M.BENZ')) {
    return 2.5;
  }
  
  // Man: 2,6 km/l
  if (modeloUpper.includes('MAN')) {
    return 2.6;
  }
  
  // Scania: 2,7 km/l
  if (modeloUpper.includes('SCANIA')) {
    return 2.7;
  }
  
  // Daf: 2,7 km/l
  if (modeloUpper.includes('DAF')) {
    return 2.7;
  }
  
  // Padrão para cavalos mecânicos: 2,5 km/l
  if (modeloUpper.includes('CAVALO') || modeloUpper.includes('MECÂNICO') || modeloUpper.includes('MECANICO')) {
    return 2.5;
  }
  
  // Padrão geral: 2,5 km/l
  return 2.5;
}

/**
 * Obtém todas as solicitações de cartão de combustível (incluindo Line Hall Shopee)
 */
export async function getFuelCardSolicitations(req: Request, res: Response) {
  try {
    const query = `
      SELECT * FROM (
        SELECT 
          s.id::text as id,
          COALESCE(s.placa, s.veiculo_placa, 'SEM-PLACA') as placa,
          COALESCE(s.km, 0) as km,
          COALESCE(s.tipo_cartao, 'Padrão') as tipo_cartao,
          COALESCE(s.provedor_cartao, 'Padrão') as provedor_cartao,
          COALESCE(s.numero_cartao, '') as numero_cartao,
          COALESCE(s.motorista, 'Motorista não informado') as motorista,
          COALESCE(s.solicitante, 'Nome não informado') as solicitante,
          COALESCE(s.telefone_celular, '') as telefone_celular,
          COALESCE(s.observacoes, 'Sem observações') as observacoes,
          s.status,
          s.data_solicitacao,
          s.atendido_por,
          s.data_atendimento,
          s.created_at,
          s.updated_at,
          COALESCE(s.valor_solicitado, 0) as valor_solicitado,
          COALESCE(s.base, 'Base Principal') as base,
          COALESCE(s.id_rota, '') as id_rota,
          COALESCE(s.origem_tipo, 'tradicional') as origem_tipo,
          s.tipo_combustivel,
          s.litros_solicitados,
          -- Campos específicos do Line Hall (NULL para solicitações tradicionais)
          NULL::varchar as veiculo_modelo,
          NULL::varchar as rota_origem,
          NULL::varchar as rota_destino,
          s.km as km_total,
          NULL::varchar as telefone_motorista,
          NULL::varchar as horario_abastecimento,
          COALESCE(s.valor_solicitado, 0) as valor_calculado,
          NULL::json as calculo_detalhes,
          -- Incluir cartão combustível do veículo
          COALESCE(v.cartao_abastecimento, s.numero_cartao, '') as cartao_combustivel
        FROM solicitacoes_fuel_card s
        LEFT JOIN veiculos v ON s.placa = v.placa

        UNION ALL

        SELECT 
          lh.id::text as id,
          COALESCE(lh.veiculo_placa, 'LH-' || lh.id) as placa,
          COALESCE(lh.km_total, 0) as km,
          'Line Hall' as tipo_cartao,
          'Line Hall Shopee' as provedor_cartao,
          COALESCE(lhv.cartao_combustivel, v.cartao_abastecimento, lh.numero_cartao, '') as numero_cartao,
          COALESCE(lh.motorista, lh.motorista_nome, 'Motorista não informado') as motorista,
          'Line Hall Solicitante' as solicitante,
          COALESCE(lh.telefone_motorista, '') as telefone_celular,
          CONCAT('Rota: ', COALESCE(lh.rota_origem, 'N/I'), ' → ', COALESCE(lh.rota_destino, 'N/I'), 
                 ' | Tel: ', COALESCE(lh.telefone_motorista, 'N/I'), ' | Horário: ', 
                 CASE WHEN lh.horario_abastecimento = 'antes_17h' THEN 'Antes das 17h' 
                      ELSE 'Após 18h' END) as observacoes,
          lh.status,
          COALESCE((lh.data_solicitacao + lh.horario_solicitacao)::timestamp, lh.created_at) as data_solicitacao,
          COALESCE(lh.operador_aprovacao, 'Sistema') as atendido_por,
          lh.updated_at as data_atendimento,
          lh.created_at,
          lh.updated_at,
          COALESCE(lh.valor_calculado, 0) as valor_solicitado,
          'Line Hall Shopee' as base,
          '' as id_rota,
          'line_hall' as origem_tipo,
          NULL as tipo_combustivel,
          NULL as litros_solicitados,
          -- Campos específicos do Line Hall
          lh.veiculo_modelo,
          lh.rota_origem,
          lh.rota_destino,
          lh.km_total,
          lh.telefone_motorista,
          lh.horario_abastecimento,
          COALESCE(lh.valor_calculado, 0) as valor_calculado,
          CASE 
            WHEN lh.valor_calculado IS NOT NULL AND lh.valor_calculado > 0 THEN
              JSON_BUILD_OBJECT(
                'km_rota', COALESCE(lh.km_total, 0),
                'km_acrescimo', 30,
                'km_total', COALESCE(lh.km_total, 0) + 30,
                'consumo_medio', 8,
                'litros_necessarios', ROUND((COALESCE(lh.km_total, 0) + 30) / 8.0, 2),
                'valor_por_litro', 6.50,
                'valor_total', lh.valor_calculado
              )
            ELSE NULL
          END as calculo_detalhes,
          -- Incluir cartão combustível do veículo para Line Hall também
          COALESCE(lhv.cartao_combustivel, v.cartao_abastecimento, lh.numero_cartao, '') as cartao_combustivel
        FROM linehall_fuel_card_requests lh
        LEFT JOIN linehall_vehicles lhv ON lh.veiculo_placa = lhv.placa
        LEFT JOIN veiculos v ON lh.veiculo_placa = v.placa

        UNION ALL

        -- Adicionar solicitações das bases (nova tabela fuel_card_requests)
        SELECT 
          fcr.id::text as id,
          COALESCE(fcr.plate, 'SEM-PLACA') as placa,
          COALESCE(fcr.odometer, 0) as km,
          COALESCE(fcr.card_type, 'Padrão') as tipo_cartao,
          COALESCE(fcr.provider, 'Padrão') as provedor_cartao,
          COALESCE(fcr.card_number, '') as numero_cartao,
          COALESCE(fcr.driver_name, 'Motorista não informado') as motorista,
          COALESCE(fcr.requested_by, 'Nome não informado') as solicitante,
          COALESCE(fcr.driver_phone, '') as telefone_celular,
          COALESCE(fcr.reason, 'Sem observações') as observacoes,
          fcr.status,
          fcr.requested_at as data_solicitacao,
          fcr.approved_by as atendido_por,
          fcr.approved_at as data_atendimento,
          fcr.created_at,
          fcr.updated_at,
          COALESCE(fcr.amount::numeric, 0) as valor_solicitado,
          COALESCE(b.name, 'Base Principal') as base,
          '' as id_rota,
          'base_system' as origem_tipo,
          fcr.fuel_type as tipo_combustivel,
          NULL as litros_solicitados,
          -- Campos específicos do Line Hall (NULL para solicitações das bases)
          NULL::varchar as veiculo_modelo,
          NULL::varchar as rota_origem,
          NULL::varchar as rota_destino,
          COALESCE(fcr.odometer, 0) as km_total,
          fcr.driver_phone as telefone_motorista,
          fcr.fuel_time as horario_abastecimento,
          COALESCE(fcr.amount::numeric, 0) as valor_calculado,
          NULL::json as calculo_detalhes,
          -- Incluir cartão combustível do veículo
          COALESCE(v.cartao_abastecimento, fcr.card_number, '') as cartao_combustivel
        FROM fuel_card_requests fcr
        LEFT JOIN bases b ON fcr.base_id = b.id
        LEFT JOIN veiculos v ON fcr.plate = v.placa
      ) unified_requests
      ORDER BY 
        CASE 
          WHEN status IN ('pendente', 'pending') THEN 1
          WHEN status IN ('em_analise', 'aprovada', 'approved') THEN 2
          ELSE 3
        END,
        data_solicitacao DESC NULLS LAST
    `;
    
    const result = await pool.query(query);
    
    // Normalizar os status para consistência
    const normalizedData = result.rows.map(row => ({
      ...row,
      status: normalizeStatus(row.status, row.origem_tipo)
    }));
    
    // Debug: verificar se dados estão sendo retornados
    console.log(`Total de solicitações retornadas: ${normalizedData.length}`);
    
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
  } else if (origem === 'base_system') {
    // Status das bases (nova tabela fuel_card_requests)
    switch (status) {
      case 'pendente':
        return 'Pendente';
      case 'aprovado':
      case 'approved':
        return 'Recarga Efetuada';
      case 'rejeitado':
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
      tipo_combustivel,
      litros_solicitados,
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
    
    if (!valor_solicitado || valor_solicitado <= 0) {
      return res.status(400).json({
        success: false,
        message: 'O valor solicitado deve ser maior que zero'
      });
    }
    
    const query = `
      INSERT INTO solicitacoes_fuel_card
        (placa, km, tipo_cartao, provedor_cartao, numero_cartao, motorista, solicitante, telefone_celular, observacoes, status, data_solicitacao, valor_solicitado, tipo_combustivel, base, id_rota)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pendente', NOW(), $10, $11, $12, $13)
      RETURNING *
    `;
    
    // Log do corpo completo da requisição para fins de depuração
    console.log("Corpo da requisição:", JSON.stringify(req.body, null, 2));
    
    // Usar o nome do usuário logado quando não há solicitante informado
    const user = req.user as any;
    const solicitanteName = req.body.solicitante || req.body.nomeSolicitante || req.body.requesterName || 
                           (user?.name ? user.name.trim() : 'Nome não informado');
    
    console.log("Nome do solicitante identificado:", solicitanteName);
    
    // Usando o valor real enviado pelo usuário
    const valorFinal = valor_solicitado;
    
    console.log("Valor solicitado final que será inserido no banco:", valorFinal);
    
    const values = [
      placa,
      km,
      tipo_cartao,
      provedor_cartao,
      numero_cartao || null,
      motorista,
      solicitanteName,
      req.body.telefone_celular || null,
      observacoes || null,
      valorFinal, // Valor garantido como número fixo
      tipo_combustivel || 'diesel',
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
    
    // Primeiro, determinar se é solicitação tradicional, Line Hall ou GP Base
    let isLineHall = origem_tipo === 'line_hall';
    let isGPBase = origem_tipo === 'base_system';
    
    if (!isLineHall && !isGPBase) {
      // Tentar determinar pela existência na tabela tradicional
      const checkTradicionalQuery = `SELECT * FROM solicitacoes_fuel_card WHERE id = $1`;
      const checkTradicionalResult = await pool.query(checkTradicionalQuery, [id]);
      
      if (checkTradicionalResult.rowCount === 0) {
        // Verificar se existe na tabela Line Hall
        const checkLineHallQuery = `SELECT * FROM linehall_fuel_card_requests WHERE id = $1`;
        const checkLineHallResult = await pool.query(checkLineHallQuery, [id]);
        
        if (checkLineHallResult.rowCount === 0) {
          // Verificar se existe na tabela GP Base (fuel_card_requests)
          const checkGPBaseQuery = `SELECT * FROM fuel_card_requests WHERE id = $1`;
          const checkGPBaseResult = await pool.query(checkGPBaseQuery, [id]);
          
          if (checkGPBaseResult.rowCount === 0) {
            return res.status(404).json({
              success: false,
              message: 'Solicitação não encontrada'
            });
          }
          
          isGPBase = true;
        } else {
          isLineHall = true;
        }
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
    } else if (isGPBase) {
      // Lógica para solicitações GP Base (fuel_card_requests)
      tableName = 'fuel_card_requests';
      
      // Mapear status da interface para o banco GP Base
      let dbStatus;
      switch (status) {
        case 'Recarga Efetuada':
          dbStatus = 'aprovado';
          break;
        case 'Negado':
          dbStatus = 'rejeitado';
          break;
        case 'Em Análise':
          dbStatus = 'em_analise';
          break;
        case 'Pendente':
          dbStatus = 'pendente';
          break;
        default:
          dbStatus = status; // Para compatibilidade com status já no formato do banco
          break;
      }
      
      if (dbStatus === 'aprovado') {
        query = `
          UPDATE ${tableName} 
          SET 
            status = $1, 
            approved_by = $2, 
            approved_at = NOW(),
            updated_at = NOW()
          WHERE id = $3
          RETURNING *
        `;
        values = [dbStatus, user?.name || 'Sistema', id];
      } else if (dbStatus === 'rejeitado') {
        query = `
          UPDATE ${tableName} 
          SET 
            status = $1,
            rejected_by = $2,
            rejected_at = NOW(),
            rejection_reason = $3,
            updated_at = NOW()
          WHERE id = $4
          RETURNING *
        `;
        values = [dbStatus, user?.name || 'Sistema', req.body.observacoes || 'Rejeitado pela gestão', id];
      } else {
        query = `
          UPDATE ${tableName} 
          SET 
            status = $1,
            updated_at = NOW()
          WHERE id = $2
          RETURNING *
        `;
        values = [dbStatus, id];
      }
    } else {
      // Lógica para solicitações tradicionais
      tableName = 'solicitacoes_fuel_card';
      
      // Mapear status da interface para o banco
      let dbStatus;
      switch (status) {
        case 'Recarga Efetuada':
          dbStatus = 'atendido';
          break;
        case 'Negado':
          dbStatus = 'rejeitado';
          break;
        case 'Em Análise':
          dbStatus = 'em_analise';
          break;
        case 'Pendente':
          dbStatus = 'pendente';
          break;
        default:
          dbStatus = status; // Para compatibilidade com status já no formato do banco
          break;
      }
      
      if (dbStatus === 'atendido') {
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
        values = [dbStatus, user?.name || 'Sistema', id];
      } else {
        query = `
          UPDATE ${tableName} 
          SET 
            status = $1,
            atendido_por = $2,
            updated_at = NOW()
          WHERE id = $3
          RETURNING *
        `;
        values = [dbStatus, user?.name || 'Sistema', id];
      }
    }
    
    const result = await pool.query(query, values);
    
    return res.status(200).json({
      success: true,
      message: `Status atualizado para ${status}`,
      data: result.rows[0],
      isLineHall,
      isGPBase
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

/**
 * Cria uma solicitação específica do Line Hall Shopee com cálculo automático
 */
export async function createLineHallFuelCardRequest(req: Request, res: Response) {
  try {
    const {
      motorista_id,
      motorista_nome,
      motorista_cpf,
      veiculo_placa,
      veiculo_modelo,
      rota_origem,
      rota_destino,
      data_solicitacao,
      horario_solicitacao,
      km_total,
      horario_abastecimento,
      telefone_motorista
    } = req.body;

    if (!motorista_nome || !veiculo_placa || !km_total) {
      return res.status(400).json({
        success: false,
        message: 'Motorista, placa e KM total são obrigatórios'
      });
    }

    // Buscar consumo médio do veículo nas diferentes tabelas
    let consumoMedio = 2.5; // Valor padrão para cavalos mecânicos
    
    // Primeiro tenta na tabela veiculos
    const vehicleQuery1 = `
      SELECT media_consumo_combustivel, modelo 
      FROM veiculos 
      WHERE placa = $1
    `;
    const vehicleResult1 = await pool.query(vehicleQuery1, [veiculo_placa]);
    
    if (vehicleResult1.rows.length > 0) {
      if (vehicleResult1.rows[0].media_consumo_combustivel) {
        consumoMedio = parseFloat(vehicleResult1.rows[0].media_consumo_combustivel);
      } else {
        // Determinar consumo por modelo se não estiver definido
        const modelo = vehicleResult1.rows[0].modelo?.toUpperCase() || '';
        consumoMedio = getConsumoByModel(modelo);
      }
    } else {
      // Tenta na tabela vehicles
      const vehicleQuery2 = `
        SELECT consumo_medio_km_l, model 
        FROM vehicles 
        WHERE plate = $1
      `;
      const vehicleResult2 = await pool.query(vehicleQuery2, [veiculo_placa]);
      
      if (vehicleResult2.rows.length > 0 && vehicleResult2.rows[0].consumo_medio_km_l) {
        consumoMedio = parseFloat(vehicleResult2.rows[0].consumo_medio_km_l);
      } else if (vehicleResult2.rows.length > 0) {
        const modelo = vehicleResult2.rows[0].model?.toUpperCase() || '';
        consumoMedio = getConsumoByModel(modelo);
      } else {
        // Por último, usa o modelo informado na solicitação
        const modelo = veiculo_modelo?.toUpperCase() || '';
        consumoMedio = getConsumoByModel(modelo);
      }
    }

    // Gerar ID único para o motorista se não fornecido
    const motoristaIdGerado = motorista_id || Math.floor(Math.random() * 1000000);
    const dataAtual = data_solicitacao || new Date().toISOString().split('T')[0];
    const horarioAtual = horario_solicitacao || new Date().toTimeString().split(' ')[0];

    // Calcular valor segundo a regra:
    // (KM da rota + 30km) ÷ Consumo médio × R$ 6,50
    const kmComAcrescimo = parseInt(km_total) + 30;
    const litrosNecessarios = kmComAcrescimo / consumoMedio;
    const valorCalculado = litrosNecessarios * 6.50;

    // Inserir na tabela Line Hall (usando valores padrão para data/hora)
    const query = `
      INSERT INTO linehall_fuel_card_requests (
        motorista_nome, motorista_cpf, veiculo_placa, veiculo_modelo,
        rota_origem, rota_destino, km_total, horario_abastecimento, 
        telefone_motorista, valor_calculado, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pendente')
      RETURNING *
    `;

    const values = [
      motorista_nome, motorista_cpf, veiculo_placa, veiculo_modelo,
      rota_origem, rota_destino, km_total, horario_abastecimento, 
      telefone_motorista, parseFloat(valorCalculado.toFixed(2))
    ];

    const result = await pool.query(query, values);

    return res.status(201).json({
      success: true,
      message: 'Solicitação Line Hall criada com sucesso',
      data: {
        ...result.rows[0],
        calculo_detalhes: {
          km_rota: km_total,
          km_acrescimo: 30,
          km_total: kmComAcrescimo,
          consumo_medio: consumoMedio,
          litros_necessarios: litrosNecessarios.toFixed(2),
          valor_por_litro: 6.50,
          valor_total: valorCalculado.toFixed(2)
        }
      }
    });
  } catch (error: any) {
    console.error('Erro ao criar solicitação Line Hall:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar solicitação Line Hall',
      error: error.message
    });
  }
}

/**
 * Exporta solicitações de cartão de combustível para Excel
 */
export async function exportFuelCardSolicitationsToExcel(req: Request, res: Response) {
  try {
    console.log('[EXPORT-EXCEL] Iniciando exportação com separação de solicitante e motorista');
    // Buscar dados de cada tabela separadamente e depois unir
    const allSolicitations = [];
    
    // 1. Tabela tradicional (solicitacoes_fuel_card)
    try {
      const traditionalQuery = `
        SELECT 
          id::text as id,
          placa,
          motorista as nome_motorista,
          COALESCE(solicitante, '') as nome_solicitante,
          COALESCE(telefone_celular, '') as telefone_solicitante,
          COALESCE(valor_solicitado::text, '0') as valor_solicitado,
          COALESCE(km, 0) as km,
          tipo_cartao,
          numero_cartao,
          provedor_cartao,
          status,
          data_solicitacao,
          atendido_por,
          data_atendimento,
          observacoes,
          'sistema_principal' as origem_tipo,
          '' as veiculo_modelo,
          '' as rota_origem,
          '' as rota_destino,
          '' as telefone_motorista,
          '' as horario_abastecimento,
          COALESCE(base, 'Base Principal') as base
        FROM solicitacoes_fuel_card
        ORDER BY data_solicitacao DESC
      `;
      
      const traditionalResult = await pool.query(traditionalQuery);
      allSolicitations.push(...traditionalResult.rows);
    } catch (err) {
      console.log('Tabela tradicional não encontrada ou erro:', err);
    }
    
    // 2. Tabela Line Hall (linehall_fuel_card_requests)
    try {
      const lineHallQuery = `
        SELECT 
          id::text as id,
          veiculo_placa as placa,
          COALESCE(motorista_nome, '') as nome_motorista,
          COALESCE(motorista_nome, '') as nome_solicitante,
          COALESCE(valor_calculado::text, '0') as valor_solicitado,
          COALESCE(km_total, 0) as km,
          'vinculado' as tipo_cartao,
          veiculo_placa as numero_cartao,
          'Alelo' as provedor_cartao,
          status,
          created_at as data_solicitacao,
          '' as atendido_por,
          updated_at as data_atendimento,
          '' as observacoes,
          'line_hall' as origem_tipo,
          COALESCE(veiculo_modelo, '') as veiculo_modelo,
          COALESCE(rota_origem, '') as rota_origem,
          COALESCE(rota_destino, '') as rota_destino,
          COALESCE(telefone_motorista, '') as telefone_motorista,
          COALESCE(horario_abastecimento, '') as horario_abastecimento,
          'Line Hall Shopee' as base
        FROM linehall_fuel_card_requests
        ORDER BY created_at DESC
      `;
      
      const lineHallResult = await pool.query(lineHallQuery);
      allSolicitations.push(...lineHallResult.rows);
    } catch (err) {
      console.log('Tabela Line Hall não encontrada ou erro:', err);
    }
    
    // 3. Tabela base system (fuel_card_requests) - incluindo informações da base
    try {
      const baseSystemQuery = `
        SELECT 
          fcr.id::text as id,
          fcr.plate as placa,
          COALESCE(fcr.driver_name, '') as nome_motorista,
          COALESCE(fcr.requested_by, '') as nome_solicitante,
          COALESCE(fcr.amount::text, '0') as valor_solicitado,
          COALESCE(fcr.odometer, 0) as km,
          fcr.card_type as tipo_cartao,
          fcr.card_number as numero_cartao,
          fcr.provider as provedor_cartao,
          fcr.status,
          fcr.requested_at as data_solicitacao,
          fcr.approved_by as atendido_por,
          fcr.approved_at as data_atendimento,
          fcr.reason as observacoes,
          'base_system' as origem_tipo,
          '' as veiculo_modelo,
          '' as rota_origem,
          '' as rota_destino,
          COALESCE(fcr.driver_phone, '') as telefone_motorista,
          COALESCE(fcr.fuel_time, '') as horario_abastecimento,
          COALESCE(b.location, fcr.base_name, 'Base Principal') as base
        FROM fuel_card_requests fcr
        LEFT JOIN bases b ON fcr.base_id = b.id
        ORDER BY fcr.requested_at DESC
      `;
      
      const baseSystemResult = await pool.query(baseSystemQuery);
      allSolicitations.push(...baseSystemResult.rows);
    } catch (err) {
      console.log('Tabela base system não encontrada ou erro:', err);
    }
    
    // Ordenar por data
    const solicitations = allSolicitations.sort((a, b) => {
      const dateA = new Date(a.data_solicitacao);
      const dateB = new Date(b.data_solicitacao);
      return dateB.getTime() - dateA.getTime();
    });

    // Preparar dados para Excel com formatação mais robusta
    const excelData = solicitations.map((sol: any) => {
      const valorFormatado = parseFloat(sol.valor_solicitado) || 0;
      const dataFormatada = sol.data_solicitacao ? new Date(sol.data_solicitacao).toLocaleDateString('pt-BR') : '';
      const dataAtendimentoFormatada = sol.data_atendimento ? new Date(sol.data_atendimento).toLocaleDateString('pt-BR') : '';
      
      return {
        'ID': String(sol.id || ''),
        'Placa': String(sol.placa || ''),
        'Nome do Solicitante': String(sol.nome_solicitante || ''),
        'Telefone do Solicitante': String(sol.telefone_solicitante || ''),
        'Motorista do Veiculo': String(sol.nome_motorista || ''),
        'Valor Solicitado': valorFormatado,
        'KM': parseInt(sol.km || '0') || 0,
        'Tipo Cartao': sol.tipo_cartao === 'numero' ? 'Cartão Numerado' : 
                       sol.tipo_cartao === 'placa' ? 'Cartão por Placa' : 
                       String(sol.tipo_cartao || 'Padrão'),
        'Numero Cartao': String(sol.tipo_cartao === 'placa' ? sol.placa : sol.numero_cartao || ''),
        'Provedor': String(sol.provedor_cartao || 'Padrão'),
        'Status': String(sol.status || ''),
        'Data Solicitacao': dataFormatada,
        'Atendido Por': String(sol.atendido_por || ''),
        'Data Atendimento': dataAtendimentoFormatada,
        'Base': String(sol.base || ''),
        'Observacoes': String(sol.observacoes || ''),
        'Origem': sol.origem_tipo === 'line_hall' ? 'Line Hall Shopee' : 
                  sol.origem_tipo === 'base_system' ? 'Base System' : 'Sistema Principal',
        'Modelo Veiculo': String(sol.veiculo_modelo || ''),
        'Rota Origem': String(sol.rota_origem || ''),
        'Rota Destino': String(sol.rota_destino || ''),
        'Telefone Motorista': String(sol.telefone_motorista || ''),
        'Horario Abastecimento': String(sol.horario_abastecimento || '')
      };
    });

    console.log('[EXPORT-EXCEL] Dados formatados para Excel, total:', excelData.length);

    // Criar workbook e worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Configurar largura das colunas
    const columnWidths = [
      { wch: 8 },   // ID
      { wch: 12 },  // Placa
      { wch: 20 },  // Nome do Solicitante
      { wch: 20 },  // Motorista
      { wch: 15 },  // Valor Solicitado
      { wch: 8 },   // KM
      { wch: 15 },  // Tipo Cartao
      { wch: 20 },  // Numero Cartao
      { wch: 15 },  // Provedor
      { wch: 15 },  // Status
      { wch: 15 },  // Data Solicitacao
      { wch: 15 },  // Atendido Por
      { wch: 15 },  // Data Atendimento
      { wch: 15 },  // Base
      { wch: 30 },  // Observacoes
      { wch: 15 },  // Origem
      { wch: 15 },  // Modelo Veiculo
      { wch: 20 },  // Rota Origem
      { wch: 20 },  // Rota Destino
      { wch: 15 },  // Telefone Motorista
      { wch: 15 },  // Horario Abastecimento
    ];
    worksheet['!cols'] = columnWidths;

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Solicitacoes');

    // Gerar buffer do Excel com configurações mais robustas
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      bookSST: false,
      compression: true
    });

    // Configurar headers para download com nome de arquivo mais simples
    const fileName = `solicitacoes-cartao-combustivel-${new Date().toISOString().split('T')[0]}.xlsx`;
    
    console.log('[EXPORT-EXCEL] Enviando arquivo:', fileName, 'Tamanho:', excelBuffer.length, 'bytes');
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', excelBuffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Enviar arquivo
    res.end(excelBuffer);

  } catch (error: any) {
    console.error('Erro ao exportar Excel:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao gerar arquivo Excel',
      error: error.message
    });
  }
}

/**
 * Exclui uma solicitação de cartão de combustível (tradicional ou Line Hall)
 */
export async function deleteFuelCardSolicitation(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const user = req.user || (req as any).supabaseUser || (req as any).hybridUser;

    console.log(`[DELETE-FUEL-CARD] Tentativa de exclusão da solicitação ID: ${id} por usuário:`, user?.email);

    // Verificar se o usuário é administrador
    if (!user || user.role !== 'admin') {
      console.log('[DELETE-FUEL-CARD] Acesso negado - usuário não é administrador');
      return res.status(403).json({
        success: false,
        message: 'Apenas administradores podem excluir solicitações'
      });
    }

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID da solicitação inválido'
      });
    }

    // Primeiro, verificar se a solicitação existe em qualquer uma das tabelas
    let tableName = '';
    let solicitationData = null;

    // Verificar na tabela tradicional
    try {
      const traditionalCheck = await pool.query(
        'SELECT * FROM solicitacoes_fuel_card WHERE id = $1',
        [id]
      );
      if (traditionalCheck.rows.length > 0) {
        tableName = 'solicitacoes_fuel_card';
        solicitationData = traditionalCheck.rows[0];
      }
    } catch (err) {
      console.log('[DELETE-FUEL-CARD] Tabela tradicional não encontrada ou erro:', err);
    }

    // Se não encontrou na tradicional, verificar na Line Hall
    if (!solicitationData) {
      try {
        const lineHallCheck = await pool.query(
          'SELECT * FROM linehall_fuel_card_requests WHERE id = $1',
          [id]
        );
        if (lineHallCheck.rows.length > 0) {
          tableName = 'linehall_fuel_card_requests';
          solicitationData = lineHallCheck.rows[0];
        }
      } catch (err) {
        console.log('[DELETE-FUEL-CARD] Tabela Line Hall não encontrada ou erro:', err);
      }
    }

    // Se não encontrou na Line Hall, verificar na tabela das bases
    if (!solicitationData) {
      try {
        const baseCheck = await pool.query(
          'SELECT * FROM fuel_card_requests WHERE id = $1',
          [id]
        );
        if (baseCheck.rows.length > 0) {
          tableName = 'fuel_card_requests';
          solicitationData = baseCheck.rows[0];
        }
      } catch (err) {
        console.log('[DELETE-FUEL-CARD] Tabela bases não encontrada ou erro:', err);
      }
    }

    if (!solicitationData) {
      return res.status(404).json({
        success: false,
        message: 'Solicitação não encontrada'
      });
    }

    console.log(`[DELETE-FUEL-CARD] Solicitação encontrada na tabela: ${tableName}`);

    // Executar a exclusão
    const deleteQuery = `DELETE FROM ${tableName} WHERE id = $1`;
    const deleteResult = await pool.query(deleteQuery, [id]);

    if (deleteResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Solicitação não encontrada para exclusão'
      });
    }

    console.log(`[DELETE-FUEL-CARD] Solicitação ${id} excluída com sucesso da tabela ${tableName} pelo usuário ${user.email}`);

    return res.status(200).json({
      success: true,
      message: 'Solicitação excluída com sucesso',
      deletedFrom: tableName,
      deletedId: id
    });

  } catch (error: any) {
    console.error('[DELETE-FUEL-CARD] Erro ao excluir solicitação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao excluir solicitação',
      error: error.message
    });
  }
}

/**
 * Criar uma nova solicitação de cartão de combustível na tabela fuel_card_requests
 */
export async function createFuelCardRequest(req: Request, res: Response) {
  try {
    console.log('[CREATE-FUEL-CARD-REQUEST] Criando nova solicitação:', req.body);
    
    const {
      plate,
      odometer,
      amount,
      card_type,
      provider,
      card_number,
      driver_name,
      driver_phone,
      fuel_type,
      fuel_time,
      reason,
      project_id,
      base_id,
      status = 'pendente'
    } = req.body;

    // Validações básicas
    if (!plate || !driver_name || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Placa, motorista e valor são obrigatórios'
      });
    }

    if (!project_id || !base_id) {
      return res.status(400).json({
        success: false,
        message: 'Projeto e base são obrigatórios'
      });
    }

    // Verificar se a base existe
    const baseCheckQuery = `SELECT name FROM bases WHERE id = $1`;
    const baseResult = await pool.query(baseCheckQuery, [base_id]);
    
    let base_name = null;
    if (baseResult.rows.length > 0) {
      base_name = baseResult.rows[0].name;
    }

    // Inserir nova solicitação
    const insertQuery = `
      INSERT INTO fuel_card_requests (
        plate, odometer, amount, card_type, provider, card_number,
        driver_name, driver_phone, fuel_type, fuel_time, reason,
        project_id, base_id, base_name, status, requested_by, requested_at, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW(), NOW()
      ) RETURNING *
    `;

    const values = [
      plate,
      odometer || 0,
      amount,
      card_type || 'vinculado',
      provider || 'Ticket',
      card_number || '',
      driver_name,
      driver_phone || '',
      fuel_type || 'Diesel',
      fuel_time || '',
      reason || 'Solicitação de recarga',
      project_id,
      base_id,
      base_name,
      status,
      driver_name || 'Sistema SC'
    ];

    const result = await pool.query(insertQuery, values);
    const newRequest = result.rows[0];

    console.log('[CREATE-FUEL-CARD-REQUEST] Solicitação criada com sucesso:', newRequest.id);

    return res.status(201).json({
      success: true,
      message: 'Solicitação criada com sucesso',
      data: newRequest
    });

  } catch (error: any) {
    console.error('[CREATE-FUEL-CARD-REQUEST] Erro ao criar solicitação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar solicitação',
      error: error.message
    });
  }
}

/**
 * Exporta solicitações de cartão de combustível filtradas por período para Excel
 */
export async function exportFuelCardSolicitationsByDate(req: Request, res: Response) {
  try {
    const { startDate, endDate, status, projectId, base } = req.query;

    console.log('[EXPORT-BY-DATE] Parâmetros recebidos:', { startDate, endDate, status, projectId, base });

    // Validação dos parâmetros obrigatórios
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Datas de início e fim são obrigatórias'
      });
    }

    // Validar formato das datas
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Formato de data inválido'
      });
    }

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'Data de início deve ser anterior à data de fim'
      });
    }

    // Buscar dados de cada tabela separadamente com filtros de data
    const allSolicitations = [];
    
    // Construir filtros adicionais
    let statusFilter = '';
    let baseFilter = '';

    if (status && status !== 'all') {
      statusFilter = ` AND status = '${status}'`;
    }

    if (base && base !== 'all') {
      baseFilter = ` AND base = '${base}'`;
    }

    // 1. Tabela tradicional (solicitacoes_fuel_card)
    try {
      const traditionalQuery = `
        SELECT 
          id::text as id,
          placa,
          motorista,
          COALESCE(motorista, '') as nome_solicitante,
          COALESCE(valor_solicitado::text, '0') as valor_solicitado,
          COALESCE(km, 0) as km,
          tipo_cartao,
          numero_cartao,
          provedor_cartao,
          status,
          data_solicitacao,
          atendido_por,
          data_atendimento,
          observacoes,
          'sistema_principal' as origem_tipo,
          '' as veiculo_modelo,
          '' as rota_origem,
          '' as rota_destino,
          '' as telefone_motorista,
          '' as horario_abastecimento,
          COALESCE(base, 'Base Principal') as base
        FROM solicitacoes_fuel_card
        WHERE data_solicitacao::date >= $1::date 
          AND data_solicitacao::date <= $2::date
          ${statusFilter}
          ${baseFilter}
        ORDER BY data_solicitacao DESC
      `;
      
      const traditionalResult = await pool.query(traditionalQuery, [startDate, endDate]);
      allSolicitations.push(...traditionalResult.rows);
    } catch (err) {
      console.log('Tabela tradicional não encontrada ou erro:', err);
    }
    
    // 2. Tabela Line Hall (linehall_fuel_card_requests)
    try {
      const lineHallQuery = `
        SELECT 
          id::text as id,
          veiculo_placa as placa,
          motorista_nome as motorista,
          COALESCE(motorista_nome, '') as nome_solicitante,
          COALESCE(valor_calculado::text, '0') as valor_solicitado,
          COALESCE(km_total, 0) as km,
          'vinculado' as tipo_cartao,
          veiculo_placa as numero_cartao,
          'Alelo' as provedor_cartao,
          status,
          created_at as data_solicitacao,
          '' as atendido_por,
          updated_at as data_atendimento,
          '' as observacoes,
          'line_hall' as origem_tipo,
          COALESCE(veiculo_modelo, '') as veiculo_modelo,
          COALESCE(rota_origem, '') as rota_origem,
          COALESCE(rota_destino, '') as rota_destino,
          COALESCE(telefone_motorista, '') as telefone_motorista,
          COALESCE(horario_abastecimento, '') as horario_abastecimento,
          'Line Hall Shopee' as base
        FROM linehall_fuel_card_requests
        WHERE created_at::date >= $1::date 
          AND created_at::date <= $2::date
          ${statusFilter}
        ORDER BY created_at DESC
      `;
      
      const lineHallResult = await pool.query(lineHallQuery, [startDate, endDate]);
      allSolicitations.push(...lineHallResult.rows);
    } catch (err) {
      console.log('Tabela Line Hall não encontrada ou erro:', err);
    }
    
    // 3. Tabela base system (fuel_card_requests)
    try {
      let baseSystemQuery = `
        SELECT 
          fcr.id::text as id,
          fcr.plate as placa,
          fcr.driver_name as motorista,
          COALESCE(fcr.requested_by, fcr.driver_name, '') as nome_solicitante,
          COALESCE(fcr.amount::text, '0') as valor_solicitado,
          COALESCE(fcr.odometer, 0) as km,
          fcr.card_type as tipo_cartao,
          fcr.card_number as numero_cartao,
          fcr.provider as provedor_cartao,
          fcr.status,
          fcr.requested_at as data_solicitacao,
          fcr.approved_by as atendido_por,
          fcr.approved_at as data_atendimento,
          fcr.reason as observacoes,
          'base_system' as origem_tipo,
          '' as veiculo_modelo,
          '' as rota_origem,
          '' as rota_destino,
          COALESCE(fcr.driver_phone, '') as telefone_motorista,
          COALESCE(fcr.fuel_time, '') as horario_abastecimento,
          COALESCE(b.location, fcr.base_name, 'Base Principal') as base
        FROM fuel_card_requests fcr
        LEFT JOIN bases b ON fcr.base_id = b.id
        WHERE fcr.requested_at::date >= $1::date 
          AND fcr.requested_at::date <= $2::date
      `;

      // Adicionar filtro de projeto se especificado
      if (projectId && projectId !== 'all') {
        baseSystemQuery += ` AND fcr.project_id = ${projectId}`;
      }

      // Adicionar filtro de base se especificado
      if (base && base !== 'all') {
        baseSystemQuery += ` AND (b.location = '${base}' OR fcr.base_name = '${base}')`;
      }

      // Adicionar filtro de status se especificado
      if (status && status !== 'all') {
        baseSystemQuery += ` AND fcr.status = '${status}'`;
      }

      baseSystemQuery += ` ORDER BY fcr.requested_at DESC`;
      
      const baseSystemResult = await pool.query(baseSystemQuery, [startDate, endDate]);
      allSolicitations.push(...baseSystemResult.rows);
    } catch (err) {
      console.log('Tabela base system não encontrada ou erro:', err);
    }
    
    // Ordenar por data
    const solicitations = allSolicitations.sort((a, b) => {
      const dateA = new Date(a.data_solicitacao);
      const dateB = new Date(b.data_solicitacao);
      return dateB.getTime() - dateA.getTime();
    });

    console.log(`[EXPORT-BY-DATE] Total de registros encontrados no período: ${solicitations.length}`);

    if (solicitations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nenhuma solicitação encontrada no período especificado'
      });
    }

    // Preparar dados para Excel
    const excelData = solicitations.map((sol: any) => {
      const valorFormatado = parseFloat(sol.valor_solicitado) || 0;
      const dataFormatada = sol.data_solicitacao ? new Date(sol.data_solicitacao).toLocaleDateString('pt-BR') : '';
      const dataAtendimentoFormatada = sol.data_atendimento ? new Date(sol.data_atendimento).toLocaleDateString('pt-BR') : '';
      
      return {
        'ID': String(sol.id || ''),
        'Placa': String(sol.placa || ''),
        'Nome do Solicitante': String(sol.nome_solicitante || ''),
        'Motorista': String(sol.motorista || ''),
        'Valor Solicitado': valorFormatado,
        'KM': parseInt(sol.km || '0') || 0,
        'Tipo Cartao': sol.tipo_cartao === 'numero' ? 'Cartão Numerado' : 
                       sol.tipo_cartao === 'placa' ? 'Cartão por Placa' : 
                       String(sol.tipo_cartao || 'Padrão'),
        'Numero Cartao': String(sol.tipo_cartao === 'placa' ? sol.placa : sol.numero_cartao || ''),
        'Provedor': String(sol.provedor_cartao || 'Padrão'),
        'Status': String(sol.status || ''),
        'Data Solicitacao': dataFormatada,
        'Atendido Por': String(sol.atendido_por || ''),
        'Data Atendimento': dataAtendimentoFormatada,
        'Base': String(sol.base || ''),
        'Observacoes': String(sol.observacoes || ''),
        'Origem': sol.origem_tipo === 'line_hall' ? 'Line Hall Shopee' : 
                  sol.origem_tipo === 'base_system' ? 'Sistema de Bases' : 'Sistema Principal',
        'Modelo Veiculo': String(sol.veiculo_modelo || ''),
        'Rota Origem': String(sol.rota_origem || ''),
        'Rota Destino': String(sol.rota_destino || ''),
        'Telefone Motorista': String(sol.telefone_motorista || ''),
        'Horario Abastecimento': String(sol.horario_abastecimento || '')
      };
    });

    // Criar workbook e worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Configurar largura das colunas
    const columnWidths = [
      { wch: 8 },   // ID
      { wch: 12 },  // Placa
      { wch: 20 },  // Nome do Solicitante
      { wch: 20 },  // Motorista
      { wch: 15 },  // Valor Solicitado
      { wch: 8 },   // KM
      { wch: 15 },  // Tipo Cartao
      { wch: 20 },  // Numero Cartao
      { wch: 15 },  // Provedor
      { wch: 15 },  // Status
      { wch: 15 },  // Data Solicitacao
      { wch: 15 },  // Atendido Por
      { wch: 15 },  // Data Atendimento
      { wch: 15 },  // Base
      { wch: 30 },  // Observacoes
      { wch: 15 },  // Origem
      { wch: 15 },  // Modelo Veiculo
      { wch: 20 },  // Rota Origem
      { wch: 20 },  // Rota Destino
      { wch: 15 },  // Telefone Motorista
      { wch: 15 },  // Horario Abastecimento
    ];
    worksheet['!cols'] = columnWidths;

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Solicitacoes_Periodo');

    // Gerar buffer do Excel
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      bookSST: false,
      compression: true
    });

    // Configurar headers para download
    const fileName = `relatorio-cartao-combustivel-${startDate}-${endDate}.xlsx`;
    
    console.log('[EXPORT-BY-DATE] Enviando arquivo:', fileName, 'Tamanho:', excelBuffer.length, 'bytes');
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', excelBuffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Enviar arquivo
    res.end(excelBuffer);

  } catch (error: any) {
    console.error('[EXPORT-BY-DATE] Erro ao exportar por data:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao gerar relatório por período',
      error: error.message
    });
  }
}
import { Router } from 'express';
import { Pool } from 'pg';
import jsonwebtoken from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';

// Configurar conexão PostgreSQL direta
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

console.log('[LINE-HALL] Usando conexão PostgreSQL direta para acesso aos dados locais');

// Configurar multer para upload de fotos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/fuel-photos/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Use apenas imagens.'));
    }
  }
});

const router = Router();

console.log('[LINE-HALL] Iniciando configuração das rotas do Line Hall');

// Rota de teste
router.get('/teste', (req, res) => {
  console.log('[LINE-HALL] Rota de teste acessada');
  res.json({ success: true, message: 'Line Hall API funcionando!' });
});

// Login do motorista Line Hall
router.post('/motorista/login', async (req, res) => {
  console.log('[LINE-HALL] Tentativa de login recebida:', req.body);
  try {
    const { cpf } = req.body;

    if (!cpf) {
      return res.status(400).json({ 
        success: false, 
        message: 'CPF é obrigatório' 
      });
    }

    // Buscar motorista pelo CPF na tabela motoristas (tentando diferentes formatos)
    console.log('[LINE-HALL] Buscando motorista com CPF:', cpf);
    
    // Remover máscara do CPF fornecido
    const cpfLimpo = cpf.replace(/\D/g, '');
    console.log('[LINE-HALL] CPF sem máscara:', cpfLimpo);
    
    // Formatar CPF com máscara
    const cpfComMascara = cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    console.log('[LINE-HALL] CPF com máscara:', cpfComMascara);
    
    console.log('[LINE-HALL] Testando formatos - Original:', cpf, 'Limpo:', cpfLimpo, 'Com máscara:', cpfComMascara);

    // Buscar motorista diretamente no PostgreSQL
    console.log('[LINE-HALL] Buscando motorista no PostgreSQL local');
    
    const query = `
      SELECT id, nome, cpf, base_id, created_at
      FROM motoristas 
      WHERE cpf = $1 OR cpf = $2 OR cpf = $3
      LIMIT 1
    `;
    
    const result = await pool.query(query, [cpf, cpfLimpo, cpfComMascara]);
    const motorista = result.rows;

    console.log('[LINE-HALL] Resultado da busca PostgreSQL:', { 
      totalEncontrados: motorista.length,
      motorista: motorista.length > 0 ? motorista[0] : null 
    });

    if (motorista.length === 0) {
      console.log('[LINE-HALL] Motorista não encontrado para CPF:', cpf);
      return res.status(404).json({ 
        success: false, 
        message: 'Motorista não encontrado. Verifique o CPF informado.' 
      });
    }

    const motoristaData = motorista[0];

    // Atualizar último login no PostgreSQL
    const updateQuery = 'UPDATE motoristas SET updated_at = NOW() WHERE id = $1';
    await pool.query(updateQuery, [motoristaData.id]);

    console.log('[LINE-HALL] Login realizado com sucesso para motorista:', motoristaData.nome);

    // Gerar token JWT para o motorista
    const token = jsonwebtoken.sign(
      {
        motoristaId: motoristaData.id,
        cpf: motoristaData.cpf,
        nome: motoristaData.nome,
        type: 'line-hall-driver'
      },
      process.env.JWT_SECRET || 'murici_line_hall_secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      message: 'Login realizado com sucesso',
      motorista: {
        id: motoristaData.id,
        nome: motoristaData.nome,
        cpf: motoristaData.cpf,
        telefone: motoristaData.telefone,
        base_id: motoristaData.base_id
      }
    });

  } catch (error) {
    console.error('Erro no login do motorista:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Obter viagens do motorista
router.get('/motorista/:id/viagens', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = 'SELECT * FROM line_hall_shopee WHERE motorista_id = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [id]);
    const viagens = result.rows;

    res.json({
      success: true,
      viagens
    });

  } catch (error) {
    console.error('Erro ao buscar viagens:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Criar nova viagem
router.post('/viagem', async (req, res) => {
  try {
    const {
      placa_cavalo,
      placa_carreta_1,
      placa_carreta_2,
      motorista_id,
      motorista_nome,
      horario_carregamento,
      status_viagem,
      observacoes
    } = req.body;

    const insertQuery = `
      INSERT INTO line_hall_shopee (
        placa_cavalo, placa_carreta_1, placa_carreta_2,
        motorista_id, motorista_nome,
        horario_carregamento,
        status_viagem, observacoes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const result = await pool.query(insertQuery, [
      placa_cavalo, placa_carreta_1, placa_carreta_2,
      motorista_id, motorista_nome,
      horario_carregamento,
      status_viagem, observacoes
    ]);
    
    const viagem = result.rows[0];

    res.json({
      success: true,
      viagem
    });

  } catch (error) {
    console.error('Erro ao criar viagem:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Obter operações do motorista (ou todas se admin)
router.get('/operations', async (req, res) => {
  try {
    const { motorista_id } = req.query;
    
    console.log('[LINE-HALL] Buscando operações. motorista_id:', motorista_id || 'TODAS');

    let query: string;
    let params: any[] = [];

    if (motorista_id) {
      // Buscar operações de um motorista específico
      query = `
        SELECT 
          lho.*,
          lhr.nome_ponto_a as origem,
          lhr.nome_ponto_b as destino,
          lhr.km_total as distancia_km
        FROM line_hall_operations lho
        LEFT JOIN line_hall_routes lhr ON lho.rota_id = lhr.id
        WHERE lho.motorista_id = $1
        ORDER BY lho.data_criacao DESC
      `;
      params = [parseInt(motorista_id as string)];
    } else {
      // Buscar TODAS as operações (para admin)
      query = `
        SELECT 
          lho.*,
          lhr.nome_ponto_a as origem,
          lhr.nome_ponto_b as destino,
          lhr.km_total as distancia_km
        FROM line_hall_operations lho
        LEFT JOIN line_hall_routes lhr ON lho.rota_id = lhr.id
        ORDER BY lho.data_criacao DESC
      `;
    }
    
    const result = await pool.query(query, params);
    
    console.log('[LINE-HALL] Operações encontradas:', result.rows.length);
    
    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('[LINE-HALL] Erro ao buscar operações:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor',
      error: String(error)
    });
  }
});

// POST - Criar solicitação de fuel card do Line Hall
router.post('/fuel-card-request', upload.fields([
  { name: 'foto_painel', maxCount: 1 },
  { name: 'foto_cartao', maxCount: 1 }
]), async (req, res) => {
  console.log('[LINE-HALL-FUEL-REQUEST] Criando solicitação de fuel card:', req.body);
  console.log('[LINE-HALL-FUEL-REQUEST] Arquivos recebidos:', req.files);
  
  try {
    const {
      motorista_id,
      motorista_nome,
      motorista_cpf,
      veiculo_placa,
      veiculo_modelo,
      numero_cartao,
      bandeira_cartao,
      operacao_id,
      rota_origem,
      rota_destino,
      data_solicitacao,
      horario_solicitacao,
      km_total,
      horario_abastecimento,
      telefone_motorista,
      status = 'pendente'
    } = req.body;

    // Validação
    if (!motorista_id || !motorista_nome || !veiculo_placa || !rota_origem || !rota_destino) {
      return res.status(400).json({
        success: false,
        message: 'Dados obrigatórios ausentes: motorista_id, motorista_nome, veiculo_placa, rota_origem, rota_destino'
      });
    }

    // CORREÇÃO DE TIMEZONE: Converter data para formato brasileiro
    let data_viagem_corrigida = null;
    if (data_solicitacao) {
      // Se a data vier como string YYYY-MM-DD, garantir que seja interpretada no timezone do Brasil
      const dataStr = data_solicitacao.includes('T') ? data_solicitacao.split('T')[0] : data_solicitacao;
      data_viagem_corrigida = dataStr; // Salvar apenas a data, sem hora
      console.log('[LINE-HALL-FUEL-REQUEST] Data original:', data_solicitacao, '→ Data corrigida:', data_viagem_corrigida);
    }

    // Pegar caminhos das fotos, se existirem
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const fotoPainelPath = files?.foto_painel?.[0]?.path || null;
    const fotoCartaoPath = files?.foto_cartao?.[0]?.path || null;

    // CÁLCULO AUTOMÁTICO DO VALOR
    let valor_calculado = 0;
    
    if (km_total && veiculo_modelo) {
      const km = parseFloat(km_total);
      const modelo = veiculo_modelo.toLowerCase();
      
      // Consumo médio por tipo de veículo
      let consumo_km_por_litro = 4; // Padrão: truck
      if (modelo.includes('carreta') || modelo.includes('carretao')) {
        consumo_km_por_litro = 2.5;
      }
      
      // Calcular litros necessários
      const litros_necessarios = km / consumo_km_por_litro;
      
      // Preço médio do diesel (pode vir de configuração futura)
      const preco_diesel = 6.50;
      
      // Valor total
      valor_calculado = litros_necessarios * preco_diesel;
      
      console.log('[LINE-HALL-FUEL-REQUEST] Cálculo automático:', {
        km_total: km,
        modelo: veiculo_modelo,
        consumo_km_por_litro,
        litros_necessarios: litros_necessarios.toFixed(2),
        preco_diesel,
        valor_calculado: valor_calculado.toFixed(2)
      });
    }

    // Verificar se já existe solicitação para esta operação
    if (operacao_id) {
      const existingCheck = await pool.query(
        'SELECT id FROM linehall_fuel_card_requests WHERE operacao_id = $1',
        [operacao_id]
      );
      
      if (existingCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Já existe uma solicitação de recarga para esta operação/rota.'
        });
      }
    }

    // Inserir na tabela linehall_fuel_card_requests
    const query = `
      INSERT INTO linehall_fuel_card_requests (
        motorista_id,
        motorista_nome,
        motorista_cpf,
        veiculo_placa,
        veiculo_modelo,
        numero_cartao,
        bandeira_cartao,
        operacao_id,
        rota_origem,
        rota_destino,
        data_viagem,
        telefone_motorista,
        km_total,
        horario_abastecimento,
        foto_painel_path,
        foto_cartao_path,
        origem_tipo,
        valor_calculado,
        status,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      motorista_id,
      motorista_nome,
      motorista_cpf || null,
      veiculo_placa,
      veiculo_modelo || null,
      numero_cartao || null,
      bandeira_cartao || 'ticket',
      operacao_id || null,
      rota_origem,
      rota_destino,
      data_viagem_corrigida,
      telefone_motorista || null,
      km_total || null,
      horario_abastecimento || null,
      fotoPainelPath,
      fotoCartaoPath,
      'line_hall',
      valor_calculado.toFixed(2),
      status
    ];

    const result = await pool.query(query, values);

    console.log('[LINE-HALL-FUEL-REQUEST] Solicitação criada com sucesso:', result.rows[0]);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Solicitação de fuel card criada com sucesso'
    });

  } catch (error) {
    console.error('[LINE-HALL-FUEL-REQUEST] Erro ao criar solicitação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar solicitação de fuel card',
      error: String(error)
    });
  }
});

// =============================================
// IMPORTAÇÃO EM MASSA DE OPERAÇÕES LINE HAUL
// =============================================

// Função para converter data serial do Excel para string de data/hora
function excelSerialToDateTime(serial: number): string {
  // Excel usa 1/1/1900 como base (serial 1)
  // JavaScript usa 1/1/1970 como base
  const excelEpoch = new Date(1899, 11, 30); // Excel considera 0 = 30/12/1899
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const date = new Date(excelEpoch.getTime() + serial * millisecondsPerDay);
  
  // Formatar como DD/MM/YYYY HH:MM
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// Função para processar data de diferentes formatos
function parseExcelDate(value: any): string | null {
  if (!value || value === '' || value === null || value === undefined) {
    return null;
  }
  
  // Se for número (serial do Excel)
  if (typeof value === 'number') {
    return excelSerialToDateTime(value);
  }
  
  // Se já for uma data JavaScript
  if (value instanceof Date) {
    const day = String(value.getDate()).padStart(2, '0');
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const year = value.getFullYear();
    const hours = String(value.getHours()).padStart(2, '0');
    const minutes = String(value.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }
  
  // Se for string, tentar parsear
  if (typeof value === 'string') {
    const str = value.trim();
    if (!str) return null;
    
    // Formato DD/MM/YYYY HH:MM ou DD/MM/YYYY
    const brMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2}))?$/);
    if (brMatch) {
      const day = brMatch[1].padStart(2, '0');
      const month = brMatch[2].padStart(2, '0');
      const year = brMatch[3];
      const hours = (brMatch[4] || '00').padStart(2, '0');
      const minutes = (brMatch[5] || '00').padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    }
    
    // Formato YYYY-MM-DD ou ISO
    const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:T(\d{1,2}):(\d{1,2}))?/);
    if (isoMatch) {
      const day = isoMatch[3].padStart(2, '0');
      const month = isoMatch[2].padStart(2, '0');
      const year = isoMatch[1];
      const hours = (isoMatch[4] || '00').padStart(2, '0');
      const minutes = (isoMatch[5] || '00').padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    }
    
    // Retorna como estava se não conseguir parsear
    return str;
  }
  
  return null;
}

// Função para extrair código entre colchetes
function extractCode(text: string): { code: string; name: string } | null {
  if (!text) return null;
  const match = text.match(/\[([^\]]+)\](.*)/);
  if (match) {
    return {
      code: match[1].trim(),
      name: match[2].trim()
    };
  }
  return null;
}

// Rota para importação em massa de operações
router.post('/operations/import', async (req, res) => {
  console.log('[LINE-HALL-IMPORT] Iniciando importação em massa');
  
  try {
    const { operations } = req.body;
    
    if (!operations || !Array.isArray(operations) || operations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhuma operação para importar'
      });
    }

    console.log(`[LINE-HALL-IMPORT] Processando ${operations.length} operações`);
    
    const results = {
      success: [] as any[],
      errors: [] as any[],
      driversNotFound: [] as string[],
      routesNotFound: [] as string[],
      driversCreated: [] as any[],
      routesCreated: [] as any[]
    };

    for (let i = 0; i < operations.length; i++) {
      const op = operations[i];
      console.log(`[LINE-HALL-IMPORT] Processando operação ${i + 1}:`, op);
      
      try {
        // Extrair dados do motorista
        const driverInfo = extractCode(op.driverId);
        if (!driverInfo) {
          results.errors.push({
            row: i + 1,
            data: op,
            error: 'Formato inválido do motorista. Use [CODIGO]NOME'
          });
          continue;
        }

        // Extrair dados da origem
        const originInfo = extractCode(op.station);
        if (!originInfo) {
          results.errors.push({
            row: i + 1,
            data: op,
            error: 'Formato inválido da origem. Use [CODIGO]NOME'
          });
          continue;
        }

        // Extrair dados do destino
        const destInfo = extractCode(op.destino);
        if (!destInfo) {
          results.errors.push({
            row: i + 1,
            data: op,
            error: 'Formato inválido do destino. Use [CODIGO]NOME'
          });
          continue;
        }

        // Buscar motorista pelo código
        let motoristaQuery = await pool.query(
          'SELECT id, nome, cpf FROM motoristas WHERE codigo = $1',
          [driverInfo.code]
        );

        let motorista = motoristaQuery.rows[0];
        
        // Se não encontrou pelo código, criar novo motorista
        if (!motorista) {
          console.log(`[LINE-HALL-IMPORT] Motorista não encontrado com código ${driverInfo.code}, criando novo...`);
          
          // Criar motorista com código (base Line Haul = 46)
          const createMotoristaResult = await pool.query(`
            INSERT INTO motoristas (nome, cpf, base_id, codigo, created_at)
            VALUES ($1, $2, 46, $3, NOW())
            RETURNING id, nome, cpf, codigo
          `, [driverInfo.name, `IMPORT-${driverInfo.code}`, driverInfo.code]);
          
          motorista = createMotoristaResult.rows[0];
          results.driversCreated.push({
            codigo: driverInfo.code,
            nome: driverInfo.name,
            id: motorista.id
          });
          console.log(`[LINE-HALL-IMPORT] Motorista criado: ${motorista.nome} (ID: ${motorista.id})`);
        }

        // Buscar rota pelos códigos de origem e destino
        let rotaQuery = await pool.query(
          'SELECT id, nome_ponto_a, nome_ponto_b, km_total FROM line_hall_routes WHERE codigo_origem = $1 AND codigo_destino = $2',
          [originInfo.code, destInfo.code]
        );

        let rota = rotaQuery.rows[0];
        
        // Se não encontrou a rota, criar nova
        if (!rota) {
          console.log(`[LINE-HALL-IMPORT] Rota não encontrada, criando nova: ${originInfo.name} -> ${destInfo.name}`);
          
          const createRotaResult = await pool.query(`
            INSERT INTO line_hall_routes (nome_ponto_a, nome_ponto_b, codigo_origem, codigo_destino, km_total, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
            RETURNING id, nome_ponto_a, nome_ponto_b, km_total
          `, [originInfo.name, destInfo.name, originInfo.code, destInfo.code, 0]);
          
          rota = createRotaResult.rows[0];
          results.routesCreated.push({
            codigo_origem: originInfo.code,
            codigo_destino: destInfo.code,
            nome: `${originInfo.name} -> ${destInfo.name}`,
            id: rota.id
          });
          console.log(`[LINE-HALL-IMPORT] Rota criada: ${rota.nome_ponto_a} -> ${rota.nome_ponto_b} (ID: ${rota.id})`);
        }

        // Processar placas (pode ter duas separadas por vírgula)
        let placaCavalo = null;
        let placaCarreta = null;
        let placaTruck = null;
        
        if (op.plate) {
          const placas = op.plate.split(',').map((p: string) => p.trim());
          if (op.vehicleType?.toUpperCase() === 'CARRETA') {
            placaCavalo = placas[0] || null;
            placaCarreta = placas[1] || null;
          } else {
            placaTruck = placas[0] || null;
          }
        }

        // Converter datas do Excel usando nova função robusta
        const dataInicio = parseExcelDate(op.sta);
        const dataFim = parseExcelDate(op.ata);
        
        // Determinar status:
        // - Se não tem ATA: em_andamento
        // - Se tem ATA mas é data futura: em_andamento (viagem programada)
        // - Se tem ATA e é data passada ou hoje: finalizada
        let operationStatus = 'em_andamento';
        
        if (dataFim) {
          // Parsear a data de fim para verificar se já passou
          const now = new Date();
          let endDate: Date | null = null;
          
          // Tentar parsear formato brasileiro (DD/MM/YYYY HH:MM)
          const brMatch = dataFim.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2})$/);
          if (brMatch) {
            endDate = new Date(
              parseInt(brMatch[3]), // ano
              parseInt(brMatch[2]) - 1, // mês (0-indexado)
              parseInt(brMatch[1]), // dia
              parseInt(brMatch[4]), // hora
              parseInt(brMatch[5])  // minuto
            );
          }
          
          // Se conseguiu parsear e a data já passou, marcar como finalizada
          if (endDate && endDate <= now) {
            operationStatus = 'finalizada';
          }
        }
        
        console.log(`[LINE-HALL-IMPORT] Datas: STA=${op.sta} -> ${dataInicio}, ATA=${op.ata} -> ${dataFim}, Status=${operationStatus}`);

        // Criar a operação
        const insertResult = await pool.query(`
          INSERT INTO line_hall_operations (
            motorista_id, motorista_nome, tipo_veiculo,
            placa_truck, placa_cavalo, placa_carreta_1,
            rota_id, rota_nome, data_inicio, data_fim,
            status, data_criacao, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), $12)
          RETURNING *
        `, [
          motorista.id,
          motorista.nome,
          op.vehicleType || 'TRUCK',
          placaTruck,
          placaCavalo,
          placaCarreta,
          rota.id,
          `${rota.nome_ponto_a} → ${rota.nome_ponto_b}`,
          dataInicio,
          dataFim,
          operationStatus,
          'IMPORT_EXCEL'
        ]);

        results.success.push({
          row: i + 1,
          operationId: insertResult.rows[0].id,
          motorista: motorista.nome,
          rota: `${rota.nome_ponto_a} → ${rota.nome_ponto_b}`,
          dataInicio,
          dataFim
        });

        console.log(`[LINE-HALL-IMPORT] Operação ${i + 1} criada com sucesso`);

      } catch (opError: any) {
        console.error(`[LINE-HALL-IMPORT] Erro na operação ${i + 1}:`, opError);
        results.errors.push({
          row: i + 1,
          data: op,
          error: opError.message || 'Erro desconhecido'
        });
      }
    }

    console.log('[LINE-HALL-IMPORT] Importação concluída:', {
      successCount: results.success.length,
      errorCount: results.errors.length,
      driversCreated: results.driversCreated.length,
      routesCreated: results.routesCreated.length
    });

    res.json({
      success: true,
      message: `Importação concluída: ${results.success.length} operações importadas, ${results.errors.length} erros`,
      results
    });

  } catch (error: any) {
    console.error('[LINE-HALL-IMPORT] Erro geral na importação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao importar operações',
      error: error.message
    });
  }
});

export default router;
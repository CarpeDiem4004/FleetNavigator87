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

export default router;
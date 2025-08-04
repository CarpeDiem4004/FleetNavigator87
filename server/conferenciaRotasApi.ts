import { Request, Response } from 'express';
import { pool } from './db';

interface VehicleRouteData {
  data: string;
  placa: string;
  motorista: string;
  operacao?: string;
  modelo?: string;
}

interface FuelRecord {
  data: string;
  placa: string;
  motorista: string;
  projeto?: string;
  tipo: 'abastecimento' | 'solicitacao';
}

interface ConferenceReport {
  rodaram_e_abasteceram: (VehicleRouteData & { fuel_records: FuelRecord[] })[];
  rodaram_nao_abasteceram: VehicleRouteData[];
  abasteceram_nao_rodaram: FuelRecord[];
}

// Upload e processar planilha de rotas
export const uploadRouteData = async (req: Request, res: Response) => {
  try {
    const { data: routeData, upload_date } = req.body;
    const userId = req.user?.id || 1;

    if (!routeData || !Array.isArray(routeData)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Dados da planilha são obrigatórios' 
      });
    }

    if (!upload_date) {
      return res.status(400).json({ 
        success: false, 
        message: 'Data de upload é obrigatória' 
      });
    }

    // Verificar se já existe upload para esta data
    const existingUploadQuery = await pool.query(
      'SELECT id FROM conferencia_rotas_uploads WHERE upload_date = $1',
      [upload_date]
    );

    let uploadId: number;

    if (existingUploadQuery.rows.length > 0) {
      // Atualizar upload existente
      uploadId = existingUploadQuery.rows[0].id;
      
      await pool.query(
        `UPDATE conferencia_rotas_uploads 
         SET filename = $1, total_records = $2, processed_at = CURRENT_TIMESTAMP, user_id = $3
         WHERE id = $4`,
        [req.file?.originalname || 'planilha.xlsx', routeData.length, userId, uploadId]
      );

      // Remover dados antigos
      await pool.query('DELETE FROM conferencia_rotas_dados WHERE upload_id = $1', [uploadId]);

    } else {
      // Criar novo upload
      const newUploadQuery = await pool.query(
        `INSERT INTO conferencia_rotas_uploads (filename, upload_date, total_records, user_id)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [req.file?.originalname || 'planilha.xlsx', upload_date, routeData.length, userId]
      );

      uploadId = newUploadQuery.rows[0].id;
    }

    // Inserir dados da planilha
    for (const item of routeData) {
      await pool.query(
        `INSERT INTO conferencia_rotas_dados (upload_id, data, placa, motorista, operacao, modelo)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [uploadId, item.data, item.placa.toUpperCase(), item.motorista, item.operacao || null, item.modelo || null]
      );
    }

    res.json({
      success: true,
      message: 'Planilha processada com sucesso',
      upload_id: uploadId,
      total_records: routeData.length
    });

  } catch (error) {
    console.error('Erro no upload de rotas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: (error as Error).message
    });
  }
};

// Gerar relatório de conferência
export const generateReport = async (req: Request, res: Response) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ 
        success: false, 
        message: 'Data é obrigatória' 
      });
    }

    // Buscar dados das rotas para a data
    const routeQuery = await pool.query(
      'SELECT data, placa, motorista, operacao, modelo FROM conferencia_rotas_dados WHERE data = $1',
      [date]
    );
    const routeData = routeQuery.rows;

    // Buscar abastecimentos para a data
    const fuelQuery = await pool.query(
      'SELECT data, placa, motorista, projeto FROM abastecimentos WHERE data = $1',
      [date]
    );
    const fuelData = fuelQuery.rows;

    // Buscar solicitações de cartão para a data
    const requestQuery = await pool.query(
      'SELECT data, placa, motorista, projeto FROM solicitacoes_cartao WHERE data = $1',
      [date]
    );
    const requestData = requestQuery.rows;

    // Combinar registros de combustível
    const allFuelRecords: FuelRecord[] = [
      ...fuelData.map((item: any) => ({
        data: item.data,
        placa: item.placa.toUpperCase(),
        motorista: item.motorista,
        projeto: item.projeto,
        tipo: 'abastecimento' as const
      })),
      ...requestData.map((item: any) => ({
        data: item.data,
        placa: item.placa.toUpperCase(),
        motorista: item.motorista,
        projeto: item.projeto,
        tipo: 'solicitacao' as const
      }))
    ];

    // Normalizar dados das rotas
    const normalizedRoutes = routeData.map((item: any) => ({
      ...item,
      placa: item.placa.toUpperCase()
    }));

    // Análise comparativa
    const report: ConferenceReport = {
      rodaram_e_abasteceram: [],
      rodaram_nao_abasteceram: [],
      abasteceram_nao_rodaram: []
    };

    // Criar mapa de placas que abasteceram
    const fuelByPlate = new Map<string, FuelRecord[]>();
    allFuelRecords.forEach(fuel => {
      const key = fuel.placa;
      if (!fuelByPlate.has(key)) {
        fuelByPlate.set(key, []);
      }
      fuelByPlate.get(key)!.push(fuel);
    });

    // Criar mapa de placas que rodaram
    const routeByPlate = new Map<string, VehicleRouteData>();
    normalizedRoutes.forEach(route => {
      routeByPlate.set(route.placa, route);
    });

    // Análise: Veículos que rodaram
    normalizedRoutes.forEach((route: any) => {
      const fuelRecords = fuelByPlate.get(route.placa) || [];
      
      if (fuelRecords.length > 0) {
        // Rodaram e abasteceram
        report.rodaram_e_abasteceram.push({
          ...route,
          fuel_records: fuelRecords
        });
      } else {
        // Rodaram mas não abasteceram
        report.rodaram_nao_abasteceram.push(route);
      }
    });

    // Análise: Registros de combustível sem rota correspondente
    allFuelRecords.forEach(fuel => {
      if (!routeByPlate.has(fuel.placa)) {
        report.abasteceram_nao_rodaram.push(fuel);
      }
    });

    res.json(report);

  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: (error as Error).message
    });
  }
};

// Listar uploads de rotas
export const listUploads = async (req: Request, res: Response) => {
  try {
    const query = await pool.query(`
      SELECT id, filename, upload_date, processed_at, total_records, user_id
      FROM conferencia_rotas_uploads
      ORDER BY upload_date DESC
      LIMIT 50
    `);

    res.json({
      success: true,
      data: query.rows
    });

  } catch (error) {
    console.error('Erro ao listar uploads:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: (error as Error).message
    });
  }
};

// Obter dados de um upload específico
export const getUploadData = async (req: Request, res: Response) => {
  try {
    const { uploadId } = req.params;

    const query = await pool.query(`
      SELECT id, data, placa, motorista, operacao, modelo, created_at
      FROM conferencia_rotas_dados
      WHERE upload_id = $1
      ORDER BY placa
    `, [uploadId]);

    res.json({
      success: true,
      data: query.rows
    });

  } catch (error) {
    console.error('Erro ao obter dados do upload:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: (error as Error).message
    });
  }
};

// Deletar upload e seus dados
export const deleteUpload = async (req: Request, res: Response) => {
  try {
    const { uploadId } = req.params;

    // Deletar upload (cascade deve deletar os dados associados automaticamente)
    await pool.query('DELETE FROM conferencia_rotas_uploads WHERE id = $1', [uploadId]);

    res.json({
      success: true,
      message: 'Upload deletado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar upload:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: (error as Error).message
    });
  }
};
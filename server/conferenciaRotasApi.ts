import { Request, Response } from 'express';
import { pool } from './db';
import * as XLSX from 'xlsx';

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

// Upload e processar planilha de rotas - VERSÃO CORRIGIDA
export const uploadRouteData = async (req: Request, res: Response) => {
  console.log('[CONFERENCIA] Upload iniciado - NOVA VERSÃO:', {
    hasFile: !!req.file,
    bodyKeys: Object.keys(req.body),
    fileName: req.file?.originalname,
    fileSize: req.file?.size
  });

  try {
    const { upload_date } = req.body;
    const userId = 1; // Fixo por enquanto

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Arquivo Excel é obrigatório' 
      });
    }

    if (!upload_date) {
      return res.status(400).json({ 
        success: false, 
        message: 'Data de upload é obrigatória' 
      });
    }

    // Processar arquivo Excel
    console.log('[CONFERENCIA] Processando arquivo Excel:', req.file.originalname);
    
    const workbook = XLSX.read(req.file.buffer);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet);

    console.log('[CONFERENCIA] Dados brutos extraídos:', rawData.length, 'registros');

    // Processar dados do MercadoLivre
    const routeData = rawData.map((row: any) => {
      // Converter data do Excel para formato brasileiro
      let dataFormatada = '';
      const dataExcel = row['DATA DO FRETE/ABASTECIMENTO'];
      
      if (typeof dataExcel === 'number') {
        // Data serial do Excel
        const date = new Date((dataExcel - 25569) * 86400 * 1000);
        dataFormatada = date.toLocaleDateString('pt-BR');
      } else if (typeof dataExcel === 'string') {
        // Data já em string
        dataFormatada = dataExcel;
      }

      return {
        data: dataFormatada,
        operacao: row['OPERAÇÃO'] || '',
        motorista: row['MOTORISTA'] || '',
        placa: row['PLACA'] || '',
        modelo: row['MODELO'] || ''
      };
    }).filter(item => item.data && item.placa); // Filtrar registros válidos

    console.log('[CONFERENCIA] Dados processados:', routeData.length, 'registros válidos');

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

    // Inserir dados da planilha em lote (otimizado para grandes volumes)
    console.log('[CONFERENCIA] Iniciando inserção em lote de', routeData.length, 'registros');
    
    const batchSize = 50; // Reduzindo para lotes menores
    for (let i = 0; i < routeData.length; i += batchSize) {
      const batch = routeData.slice(i, i + batchSize);
      
      try {
        // Usar prepared statements seguros
        const placeholders = batch.map((_, index) => {
          const base = index * 6;
          return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`;
        }).join(', ');
        
        const values = batch.flatMap(item => [
          uploadId,
          item.data,
          item.placa.toUpperCase(),
          item.motorista,
          item.operacao || null,
          item.modelo || null
        ]);
        
        const insertQuery = `
          INSERT INTO conferencia_rotas_dados (upload_id, data, placa, motorista, operacao, modelo)
          VALUES ${placeholders}
        `;
        
        await pool.query(insertQuery, values);
        console.log(`[CONFERENCIA] Lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(routeData.length/batchSize)} inserido (${batch.length} registros)`);
        
      } catch (error) {
        console.error(`[CONFERENCIA] Erro no lote ${Math.floor(i/batchSize) + 1}:`, error);
        // Em caso de erro, inserir um por um neste lote
        for (const item of batch) {
          try {
            await pool.query(
              `INSERT INTO conferencia_rotas_dados (upload_id, data, placa, motorista, operacao, modelo)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [uploadId, item.data, item.placa.toUpperCase(), item.motorista, item.operacao || null, item.modelo || null]
            );
          } catch (itemError) {
            console.error('[CONFERENCIA] Erro ao inserir item:', item, itemError);
          }
        }
      }
    }
    
    console.log('[CONFERENCIA] Inserção completa:', routeData.length, 'registros processados');

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

// Exportar relatório para Excel
export const exportReportToExcel = async (req: Request, res: Response) => {
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

    // Criar planilha Excel
    const workbook = XLSX.utils.book_new();

    // Planilha 1: Rodaram e Abasteceram
    const sheet1Data = report.rodaram_e_abasteceram.map(item => ({
      'Data': item.data,
      'Placa': item.placa,
      'Motorista': item.motorista,
      'Operação': item.operacao || '',
      'Modelo': item.modelo || '',
      'Registros de Combustível': item.fuel_records.length,
      'Projetos': item.fuel_records.map(f => f.projeto).filter(Boolean).join(', '),
      'Tipos de Registro': item.fuel_records.map(f => f.tipo === 'abastecimento' ? 'Abastecimento' : 'Solicitação').join(', ')
    }));
    const worksheet1 = XLSX.utils.json_to_sheet(sheet1Data);
    XLSX.utils.book_append_sheet(workbook, worksheet1, 'Rodaram e Abasteceram');

    // Planilha 2: Rodaram mas Não Abasteceram
    const sheet2Data = report.rodaram_nao_abasteceram.map(item => ({
      'Data': item.data,
      'Placa': item.placa,
      'Motorista': item.motorista,
      'Operação': item.operacao || '',
      'Modelo': item.modelo || '',
      'Status': 'Sem registro de combustível'
    }));
    const worksheet2 = XLSX.utils.json_to_sheet(sheet2Data);
    XLSX.utils.book_append_sheet(workbook, worksheet2, 'Rodaram Não Abasteceram');

    // Planilha 3: Abasteceram mas Não Rodaram
    const sheet3Data = report.abasteceram_nao_rodaram.map(item => ({
      'Data': item.data,
      'Placa': item.placa,
      'Motorista': item.motorista,
      'Projeto': item.projeto || '',
      'Tipo': item.tipo === 'abastecimento' ? 'Abastecimento' : 'Solicitação',
      'Status': 'Sem registro de rota'
    }));
    const worksheet3 = XLSX.utils.json_to_sheet(sheet3Data);
    XLSX.utils.book_append_sheet(workbook, worksheet3, 'Abasteceram Não Rodaram');

    // Planilha 4: Resumo Estatístico
    const totalRoutes = report.rodaram_e_abasteceram.length + report.rodaram_nao_abasteceram.length;
    const totalFuelRecords = report.rodaram_e_abasteceram.length + report.abasteceram_nao_rodaram.length;
    const sheet4Data = [
      { 'Métrica': 'Total de Veículos que Rodaram', 'Valor': totalRoutes },
      { 'Métrica': 'Total de Registros de Combustível', 'Valor': totalFuelRecords },
      { 'Métrica': 'Veículos que Rodaram e Abasteceram', 'Valor': report.rodaram_e_abasteceram.length },
      { 'Métrica': 'Veículos que Rodaram mas Não Abasteceram', 'Valor': report.rodaram_nao_abasteceram.length },
      { 'Métrica': 'Registros de Combustível sem Rota', 'Valor': report.abasteceram_nao_rodaram.length },
      { 'Métrica': 'Taxa de Conformidade (%)', 'Valor': totalRoutes > 0 ? ((report.rodaram_e_abasteceram.length / totalRoutes) * 100).toFixed(2) : '0.00' }
    ];
    const worksheet4 = XLSX.utils.json_to_sheet(sheet4Data);
    XLSX.utils.book_append_sheet(workbook, worksheet4, 'Resumo Estatístico');

    // Gerar buffer do Excel
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Definir headers de resposta
    const filename = `Relatorio_Conferencia_${String(date).replace(/\//g, '-')}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Length', buffer.length);

    // Enviar arquivo
    res.send(buffer);

  } catch (error) {
    console.error('Erro ao exportar relatório:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: (error as Error).message
    });
  }
};
import { Request, Response } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { pool } from './db';

// Configurar multer para upload de arquivos
const storage = multer.memoryStorage();
export const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (file.originalname.match(/\.(xlsx|xls)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos Excel (.xlsx, .xls) são permitidos'));
    }
  }
});

interface VehicleRouteData {
  data: string;
  placa: string;
  motorista: string;
  operacao: string;
  modelo: string;
}

interface FuelRecord {
  data: Date;
  placa: string;
  motorista: string;
  projeto: string;
  tipo: 'abastecimento' | 'solicitacao_cartao' | 'solicitacao_fuel_card' | 'historico_geral';
}

interface VehicleReportData extends VehicleRouteData {
  fuel_records?: FuelRecord[];
}

interface ConferenceReport {
  rodaram_e_abasteceram: VehicleReportData[];
  rodaram_nao_abasteceram: VehicleRouteData[];
  abasteceram_nao_rodaram: FuelRecord[];
}

// Upload e processamento de planilha de rotas
export const uploadRouteData = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo enviado'
      });
    }

    const { upload_date } = req.body;
    const userId = (req.user as any)?.id || 1;

    if (!upload_date) {
      return res.status(400).json({
        success: false,
        message: 'Data do upload é obrigatória'
      });
    }

    console.log('[CONFERENCIA] Upload iniciado - NOVA VERSÃO:', {
      hasFile: !!req.file,
      bodyKeys: Object.keys(req.body),
      fileName: req.file.originalname,
      fileSize: req.file.size
    });

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
        // Data serial do Excel - corrigir offset de fuso horário
        const date = new Date((dataExcel - 25569) * 86400 * 1000);
        // Ajustar para timezone UTC para evitar problemas de fuso horário
        const utcDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
        dataFormatada = utcDate.toLocaleDateString('pt-BR');
        
        console.log(`[CONFERENCIA] Conversão de data Excel: ${dataExcel} -> ${date.toISOString()} -> ${dataFormatada}`);
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
    
    const batchSize = 50;
    for (let i = 0; i < routeData.length; i += batchSize) {
      const batch = routeData.slice(i, i + batchSize);
      
      try {
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
        
        const batchQuery = `
          INSERT INTO conferencia_rotas_dados (upload_id, data, placa, motorista, operacao, modelo)
          VALUES ${placeholders}
        `;
        
        await pool.query(batchQuery, values);
        console.log(`[CONFERENCIA] Lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(routeData.length / batchSize)} inserido (${batch.length} registros)`);
        
      } catch (batchError) {
        console.error('Erro no lote:', batchError);
        throw batchError;
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

    // Normalizar formato da data para busca - CORRIGIR PROBLEMA DE FUSO HORÁRIO
    let searchDate = date as string;
    
    // Converter data ISO (yyyy-mm-dd) para formato brasileiro (dd/mm/yyyy) se necessário
    if (searchDate.includes('-') && searchDate.length === 10) {
      const [year, month, day] = searchDate.split('-');
      searchDate = `${day}/${month}/${year}`;
    }

    // Converter data brasileira para ISO para buscar tanto rotas quanto abastecimentos
    let isoDate = searchDate;
    if (searchDate.includes('/')) {
      const [day, month, year] = searchDate.split('/');
      isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    console.log('[CONFERENCIA] Buscando dados para data:', searchDate, '-> ISO:', isoDate);
    console.log('[CONFERENCIA] DEBUG - Data original recebida:', date, 'Tipo:', typeof date);

    // Para lidar com o problema de conversão de datas, vamos buscar nas duas possibilidades
    let alternativeIsoDate = isoDate;
    if (searchDate === '01/08/2025') {
      // Se a data for 01/08/2025, também buscar por 2025-01-08 (formato incorreto anterior)
      alternativeIsoDate = '2025-01-08';
    }

    // Buscar dados das rotas para a data (usando formato ISO principal e alternativo)
    const routeQuery = await pool.query(
      'SELECT data, placa, motorista, operacao, modelo FROM conferencia_rotas_dados WHERE data IN ($1, $2)',
      [isoDate, alternativeIsoDate]
    );
    const routeData = routeQuery.rows;

    console.log('[CONFERENCIA] Registros de rotas encontrados:', {
      data_principal: isoDate,
      data_alternativa: alternativeIsoDate,
      total_rotas: routeData.length
    });

    // Debug: mostrar algumas placas de rotas se encontradas
    if (routeData.length > 0) {
      console.log('[CONFERENCIA] Primeiras placas das rotas:', routeData.slice(0, 5).map((r: any) => r.placa));
    } else {
      console.log('[CONFERENCIA] NENHUMA rota encontrada! Verificando datas disponíveis...');
      const availableDatesQuery = await pool.query('SELECT DISTINCT data FROM conferencia_rotas_dados ORDER BY data DESC LIMIT 5');
      console.log('[CONFERENCIA] Datas disponíveis na tabela:', availableDatesQuery.rows.map((r: any) => r.data));
    }

    console.log('[CONFERENCIA] Buscando abastecimentos para data ISO:', isoDate);

    // Buscar abastecimentos para a data (abastecimentos_postos)
    console.log('[CONFERENCIA] Executando consulta 1: abastecimentos_postos');
    const fuelQuery = await pool.query(
      'SELECT created_at as data, placa, nome_motorista as motorista, projeto FROM abastecimentos_postos WHERE DATE(created_at) = $1',
      [isoDate]
    );
    const fuelData = fuelQuery.rows;
    console.log('[CONFERENCIA] Consulta 1 concluída:', fuelData.length, 'registros');

    // Buscar solicitações de cartão para a data (fuel_card_requests)
    console.log('[CONFERENCIA] Executando consulta 2: fuel_card_requests');
    const requestQuery = await pool.query(
      'SELECT created_at as data, plate as placa, driver_name as motorista, project_name as projeto FROM fuel_card_requests WHERE DATE(created_at) = $1',
      [isoDate]
    );
    const requestData = requestQuery.rows;
    console.log('[CONFERENCIA] Consulta 2 concluída:', requestData.length, 'registros');

    // Buscar solicitações de cartão para a data (solicitacoes_fuel_card)
    console.log('[CONFERENCIA] Executando consulta 3: solicitacoes_fuel_card');
    const fuelCardQuery = await pool.query(
      'SELECT data_solicitacao as data, placa, motorista, base as projeto FROM solicitacoes_fuel_card WHERE DATE(data_solicitacao) = $1',
      [isoDate]
    );
    const fuelCardData = fuelCardQuery.rows;
    console.log('[CONFERENCIA] Consulta 3 concluída:', fuelCardData.length, 'registros');

    // NOVA FONTE: Buscar dados do Histórico Geral de Abastecimentos (tabela abastecimentos_supabase)
    console.log('[CONFERENCIA] Executando consulta 4: abastecimentos_supabase');
    const historicoGeralQuery = await pool.query(
      'SELECT created_at as data, placa, motorista, projeto FROM abastecimentos_supabase WHERE DATE(created_at) = $1',
      [isoDate]
    );
    const historicoGeralData = historicoGeralQuery.rows;
    console.log('[CONFERENCIA] Consulta 4 concluída:', historicoGeralData.length, 'registros');

    console.log('[CONFERENCIA] Registros encontrados:', {
      abastecimentos_postos: fuelData.length,
      fuel_card_requests: requestData.length,
      solicitacoes_fuel_card: fuelCardData.length,
      historico_geral_abastecimentos: historicoGeralData.length
    });

    // Debug: mostrar algumas placas de combustível se encontradas
    if (fuelCardData.length > 0) {
      console.log('[CONFERENCIA] Primeiras placas de combustível:', fuelCardData.slice(0, 5).map((f: any) => f.placa));
    }

    // Combinar registros de combustível de TODAS as fontes (incluindo Histórico Geral)
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
        tipo: 'solicitacao_cartao' as const
      })),
      ...fuelCardData.map((item: any) => ({
        data: item.data,
        placa: item.placa.toUpperCase(),
        motorista: item.motorista,
        projeto: item.projeto,
        tipo: 'solicitacao_fuel_card' as const
      })),
      ...historicoGeralData.map((item: any) => ({
        data: item.data,
        placa: item.placa.toUpperCase(),
        motorista: item.motorista,
        projeto: item.projeto,
        tipo: 'historico_geral' as const
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

    // Análise: Veículos que abasteceram mas não rodaram
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

// Buscar uploads disponíveis
export const getUploads = async (req: Request, res: Response) => {
  try {
    const query = await pool.query(`
      SELECT 
        id,
        filename,
        upload_date,
        total_records,
        processed_at,
        user_id
      FROM conferencia_rotas_uploads 
      ORDER BY upload_date DESC
    `);

    res.json({
      success: true,
      uploads: query.rows
    });

  } catch (error) {
    console.error('Erro ao buscar uploads:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Deletar upload e dados relacionados
export const deleteUpload = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID do upload é obrigatório'
      });
    }

    // Deletar dados relacionados
    await pool.query('DELETE FROM conferencia_rotas_dados WHERE upload_id = $1', [id]);
    
    // Deletar upload
    const result = await pool.query('DELETE FROM conferencia_rotas_uploads WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Upload não encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Upload deletado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar upload:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Listar uploads (alias para compatibilidade)
export const listUploads = getUploads;

// Buscar dados de um upload específico
export const getUploadData = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID do upload é obrigatório'
      });
    }

    const uploadQuery = await pool.query(
      'SELECT * FROM conferencia_rotas_uploads WHERE id = $1',
      [id]
    );

    if (uploadQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Upload não encontrado'
      });
    }

    const dataQuery = await pool.query(
      'SELECT * FROM conferencia_rotas_dados WHERE upload_id = $1 ORDER BY placa',
      [id]
    );

    res.json({
      success: true,
      upload: uploadQuery.rows[0],
      data: dataQuery.rows
    });

  } catch (error) {
    console.error('Erro ao buscar dados do upload:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
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

    // Normalizar formato da data para busca
    let searchDate = date as string;
    
    // Converter data ISO (yyyy-mm-dd) para formato brasileiro (dd/mm/yyyy) se necessário
    if (searchDate.includes('-') && searchDate.length === 10) {
      const [year, month, day] = searchDate.split('-');
      searchDate = `${day}/${month}/${year}`;
    }

    // Converter data brasileira para ISO para buscar tanto rotas quanto abastecimentos
    let isoDate = searchDate;
    if (searchDate.includes('/')) {
      const [day, month, year] = searchDate.split('/');
      isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    console.log('[EXPORT] Exportando dados para data:', searchDate, '-> ISO:', isoDate);

    // Buscar dados das rotas para a data (usando formato ISO)
    const routeQuery = await pool.query(
      'SELECT data, placa, motorista, operacao, modelo FROM conferencia_rotas_dados WHERE data = $1',
      [isoDate]
    );
    const routeData = routeQuery.rows;

    // Buscar abastecimentos para a data (abastecimentos_postos)
    const fuelQuery = await pool.query(
      'SELECT created_at as data, placa, nome_motorista as motorista, projeto FROM abastecimentos_postos WHERE DATE(created_at) = $1',
      [isoDate]
    );
    const fuelData = fuelQuery.rows;

    // Buscar solicitações de cartão para a data (fuel_card_requests)
    const requestQuery = await pool.query(
      'SELECT created_at as data, plate as placa, driver_name as motorista, project_name as projeto FROM fuel_card_requests WHERE DATE(created_at) = $1',
      [isoDate]
    );
    const requestData = requestQuery.rows;

    // Buscar solicitações de cartão para a data (solicitacoes_fuel_card)
    const fuelCardQuery = await pool.query(
      'SELECT data_solicitacao as data, placa, motorista, base as projeto FROM solicitacoes_fuel_card WHERE DATE(data_solicitacao) = $1',
      [isoDate]
    );
    const fuelCardData = fuelCardQuery.rows;

    // NOVA FONTE: Buscar dados do Histórico Geral de Abastecimentos (tabela abastecimentos_supabase)
    const historicoGeralExportQuery = await pool.query(
      'SELECT created_at as data, placa, motorista, projeto FROM abastecimentos_supabase WHERE DATE(created_at) = $1',
      [isoDate]
    );
    const historicoGeralExportData = historicoGeralExportQuery.rows;

    console.log('[EXPORT] Registros encontrados:', {
      rotas: routeData.length,
      abastecimentos_postos: fuelData.length,
      fuel_card_requests: requestData.length,
      solicitacoes_fuel_card: fuelCardData.length,
      historico_geral_abastecimentos: historicoGeralExportData.length
    });

    // Combinar registros de combustível (incluindo Histórico Geral)
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
        tipo: 'solicitacao_cartao' as const
      })),
      ...fuelCardData.map((item: any) => ({
        data: item.data,
        placa: item.placa.toUpperCase(),
        motorista: item.motorista,
        projeto: item.projeto,
        tipo: 'solicitacao_fuel_card' as const
      })),
      ...historicoGeralExportData.map((item: any) => ({
        data: item.data,
        placa: item.placa.toUpperCase(),
        motorista: item.motorista,
        projeto: item.projeto,
        tipo: 'historico_geral' as const
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

    // Análise: Veículos que abasteceram mas não rodaram
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
      'Operação': item.operacao,
      'Modelo': item.modelo,
      'Registros de Combustível': item.fuel_records?.map(f => f.tipo).join(', ') || '',
      'Projetos Combustível': item.fuel_records?.map(f => f.projeto).join(', ') || ''
    }));

    const worksheet1 = XLSX.utils.json_to_sheet(sheet1Data);
    XLSX.utils.book_append_sheet(workbook, worksheet1, 'Rodaram e Abasteceram');

    // Planilha 2: Rodaram mas Não Abasteceram
    const sheet2Data = report.rodaram_nao_abasteceram.map(item => ({
      'Data': item.data,
      'Placa': item.placa,
      'Motorista': item.motorista,
      'Operação': item.operacao,
      'Modelo': item.modelo
    }));

    const worksheet2 = XLSX.utils.json_to_sheet(sheet2Data);
    XLSX.utils.book_append_sheet(workbook, worksheet2, 'Rodaram Não Abasteceram');

    // Planilha 3: Abasteceram mas Não Rodaram
    const sheet3Data = report.abasteceram_nao_rodaram.map(item => ({
      'Data': item.data,
      'Placa': item.placa,
      'Motorista': item.motorista,
      'Projeto': item.projeto,
      'Tipo': item.tipo
    }));

    const worksheet3 = XLSX.utils.json_to_sheet(sheet3Data);
    XLSX.utils.book_append_sheet(workbook, worksheet3, 'Abasteceram Não Rodaram');

    // Planilha 4: Resumo
    const resumoData = [
      {
        'Categoria': 'Rodaram e Abasteceram',
        'Quantidade': report.rodaram_e_abasteceram.length,
        'Percentual': ((report.rodaram_e_abasteceram.length / (normalizedRoutes.length || 1)) * 100).toFixed(2) + '%'
      },
      {
        'Categoria': 'Rodaram mas Não Abasteceram',
        'Quantidade': report.rodaram_nao_abasteceram.length,
        'Percentual': ((report.rodaram_nao_abasteceram.length / (normalizedRoutes.length || 1)) * 100).toFixed(2) + '%'
      },
      {
        'Categoria': 'Abasteceram mas Não Rodaram',
        'Quantidade': report.abasteceram_nao_rodaram.length,
        'Percentual': ((report.abasteceram_nao_rodaram.length / (allFuelRecords.length || 1)) * 100).toFixed(2) + '%'
      }
    ];

    const worksheetResumo = XLSX.utils.json_to_sheet(resumoData);
    XLSX.utils.book_append_sheet(workbook, worksheetResumo, 'Resumo');

    // Converter workbook para buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Definir headers para download
    const fileName = `Relatorio_Conferencia_${searchDate.replace(/\//g, '-')}.xlsx`;
    
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Length', buffer.length);

    // Enviar arquivo
    res.send(buffer);

    console.log('[EXPORT] Arquivo Excel gerado com sucesso:', fileName);

  } catch (error) {
    console.error('Erro ao exportar relatório:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: (error as Error).message
    });
  }
};
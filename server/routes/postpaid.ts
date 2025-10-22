// Rotas do sistema de abastecimento pós-pago
import { type Express } from 'express';
import { pool } from '../db';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';

// Middleware de autenticação (se necessário)
const authMiddleware = (req: any, res: any, next: any) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ success: false, message: 'Não autenticado' });
};

export function setupPostPaidRoutes(app: Express) {
  console.log('🟢 [POST-PAID] Registrando rotas de abastecimento pós-pago');

  // Configurar multer para upload de fotos
  const postpaidStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = './attached_assets/postpaid_receipts';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1E9)}`;
      const ext = path.extname(file.originalname);
      cb(null, `receipt_${uniqueSuffix}${ext}`);
    }
  });

  const uploadPostpaidReceipt = multer({
    storage: postpaidStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Apenas imagens são permitidas'));
      }
    }
  });

  console.log('🟢 [POST-PAID] Registrando rota POST /api/postpaid/public-records');

  // Criar registro de abastecimento público (sem token) com upload de foto
  app.post('/api/postpaid/public-records',
    (req, res, next) => {
      console.log('[PostPaid] 🔵 ROTA CHAMADA - Iniciando processamento');
      console.log('[PostPaid] Headers:', req.headers);
      console.log('[PostPaid] Content-Type:', req.headers['content-type']);
      
      uploadPostpaidReceipt.single('receipt_photo')(req, res, (err: any) => {
        console.log('[PostPaid] 🟡 Multer processado - Erro?', !!err);
        if (err) {
          res.setHeader('Content-Type', 'application/json');
          
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              message: 'Arquivo muito grande. Tamanho máximo: 5MB'
            });
          }
          if (err.message === 'Apenas imagens são permitidas') {
            return res.status(400).json({
              success: false,
              message: 'Apenas imagens são permitidas'
            });
          }
          return res.status(400).json({
            success: false,
            message: err.message || 'Erro no upload do arquivo'
          });
        }
        next();
      });
    },
    async (req: any, res) => {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      
      try {
        const {
          project_id,
          base_id,
          driver_name,
          driver_phone,
          vehicle_plate,
          odometer_km,
          fuel_type,
          liters,
          total_amount,
          manager_name,
        } = req.body;

        console.log('[PostPaid] 📝 Dados recebidos:', { project_id, base_id, driver_name, vehicle_plate });

        if (!project_id || !base_id) {
          return res.status(400).json({
            success: false,
            message: 'Projeto e base são obrigatórios'
          });
        }

        // Buscar base e validar relacionamento com projeto
        const baseQuery = await pool.query(
          'SELECT id, basename, project_id FROM bases WHERE id = $1',
          [base_id]
        );

        if (!baseQuery.rows[0]) {
          return res.status(404).json({
            success: false,
            message: 'Base não encontrada'
          });
        }

        const base = baseQuery.rows[0];

        // Validar que a base pertence ao projeto selecionado
        if (base.project_id !== parseInt(project_id)) {
          console.log('[PostPaid] ❌ ERRO: Base não pertence ao projeto selecionado');
          return res.status(400).json({
            success: false,
            message: 'A base selecionada não pertence ao projeto especificado'
          });
        }

        // Buscar nome do projeto
        const projectQuery = await pool.query('SELECT name FROM projects WHERE id = $1', [project_id]);

        if (!projectQuery.rows[0]) {
          return res.status(404).json({
            success: false,
            message: 'Projeto não encontrado'
          });
        }

        const project_name = projectQuery.rows[0].name;
        const base_name = base.basename;

        // Capturar IP e user agent
        const ip_address = req.ip || req.connection.remoteAddress;
        const user_agent = req.headers['user-agent'];

        // URL da foto (se enviada)
        const receipt_photo_url = req.file ? `/attached_assets/postpaid_receipts/${req.file.filename}` : null;

        // Inserir registro no banco
        const result = await pool.query(
          `INSERT INTO postpaid_fuel_records 
          (project_id, base_id, project_name, base_name, driver_name, driver_phone, 
           vehicle_plate, odometer_km, fuel_type, liters, total_amount, manager_name, 
           receipt_photo_url, ip_address, user_agent, status, created_at) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'pending', NOW()) 
          RETURNING *`,
          [
            project_id,
            base_id,
            project_name,
            base_name,
            driver_name,
            driver_phone,
            vehicle_plate,
            odometer_km,
            fuel_type,
            parseFloat(liters),
            parseFloat(total_amount),
            manager_name,
            receipt_photo_url,
            ip_address,
            user_agent,
          ]
        );

        const responseData = {
          success: true,
          data: result.rows[0]
        };
        console.log('[PostPaid] ✅ Enviando resposta JSON:', JSON.stringify(responseData));
        return res.status(200).json(responseData);
      } catch (error) {
        console.error('[PostPaid] Erro ao criar registro público:', error);
        return res.status(500).json({
          success: false,
          message: 'Erro ao criar registro'
        });
      }
    }
  );

  // Listar registros de abastecimento (protegido)
  app.get('/api/postpaid/records', authMiddleware, async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT * FROM postpaid_fuel_records 
        ORDER BY created_at DESC 
        LIMIT 100`
      );

      res.json({ 
        success: true, 
        data: result.rows 
      });
    } catch (error) {
      console.error('[PostPaid] Erro ao listar registros:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao listar registros' 
      });
    }
  });

  // Exportar relatório em XLSX (protegido)
  app.get('/api/postpaid/export', authMiddleware, async (req, res) => {
    try {
      console.log('[PostPaid] 📊 Exportando relatório XLSX...');
      
      const result = await pool.query(
        `SELECT 
          id,
          driver_name as "Nome do Motorista",
          driver_phone as "Telefone",
          vehicle_plate as "Placa",
          odometer_km as "KM",
          fuel_type as "Combustível",
          liters as "Litros",
          total_amount as "Valor Total",
          manager_name as "Gestor",
          project_name as "Projeto",
          base_name as "Base",
          status as "Status",
          TO_CHAR(created_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') as "Data/Hora"
        FROM postpaid_fuel_records 
        ORDER BY created_at DESC`
      );

      // Criar workbook e worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(result.rows);

      // Definir larguras de colunas
      worksheet['!cols'] = [
        { wch: 8 },  // ID
        { wch: 25 }, // Nome do Motorista
        { wch: 15 }, // Telefone
        { wch: 10 }, // Placa
        { wch: 10 }, // KM
        { wch: 12 }, // Combustível
        { wch: 10 }, // Litros
        { wch: 12 }, // Valor Total
        { wch: 20 }, // Gestor
        { wch: 15 }, // Projeto
        { wch: 15 }, // Base
        { wch: 12 }, // Status
        { wch: 16 }, // Data/Hora
      ];

      // Adicionar worksheet ao workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Abastecimentos');

      // Gerar buffer do arquivo
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      // Enviar arquivo
      const filename = `relatorio-pospago-${new Date().toISOString().split('T')[0]}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);

      console.log('[PostPaid] ✅ Relatório XLSX exportado com sucesso');
    } catch (error) {
      console.error('[PostPaid] Erro ao exportar:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao exportar relatório' 
      });
    }
  });

  console.log('✅ [POST-PAID] Rotas registradas com sucesso');
}

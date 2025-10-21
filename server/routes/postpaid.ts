// Rotas do sistema de abastecimento pós-pago
import { type Express } from 'express';
import { pool } from '../db';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

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

        // Buscar nomes do projeto e base
        const projectQuery = await pool.query('SELECT name FROM projects WHERE id = $1', [project_id]);
        const baseQuery = await pool.query('SELECT basename FROM bases WHERE id = $1', [base_id]);

        if (!projectQuery.rows[0] || !baseQuery.rows[0]) {
          return res.status(404).json({
            success: false,
            message: 'Projeto ou base não encontrados'
          });
        }

        const project_name = projectQuery.rows[0].name;
        const base_name = baseQuery.rows[0].basename;

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

  console.log('✅ [POST-PAID] Rotas registradas com sucesso');
}

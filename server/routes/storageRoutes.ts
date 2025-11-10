import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { isAuthenticated } from '../middleware/auth';
import { getSupabaseAdmin } from '../services/supabaseAdmin';

const router = Router();

// Usar singleton do Supabase Admin
const supabaseAdmin = getSupabaseAdmin();

// Whitelist de buckets permitidos
const ALLOWED_BUCKETS = [
  'documentos',
  'notas-fiscais',
  'orcamentos',
  'anexos',
  'budget-attachments'
];

// Tipos de arquivo permitidos
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp'
];

// Configurar multer com validações
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}. Permitidos: ${ALLOWED_MIME_TYPES.join(', ')}`));
    }
  }
});

/**
 * Valida e sanitiza nome de arquivo
 */
function sanitizeFilename(filename: string): string {
  // Remover path traversal attempts
  return path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * POST /api/storage/buckets
 * Garante que um bucket existe (idempotente)
 */
router.post('/buckets', isAuthenticated, async (req, res) => {
  try {
    const { bucketName } = req.body;

    if (!bucketName) {
      return res.status(400).json({ 
        success: false, 
        error: 'bucketName é obrigatório' 
      });
    }

    // Validar bucket na whitelist
    if (!ALLOWED_BUCKETS.includes(bucketName)) {
      return res.status(403).json({ 
        success: false, 
        error: `Bucket '${bucketName}' não autorizado. Buckets permitidos: ${ALLOWED_BUCKETS.join(', ')}` 
      });
    }

    console.log(`[StorageRoutes] Verificando bucket '${bucketName}'...`);

    // Listar buckets existentes
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();

    if (listError) {
      console.error('[StorageRoutes] Erro ao listar buckets:', listError);
      return res.status(500).json({ 
        success: false, 
        error: `Erro ao listar buckets: ${listError.message}` 
      });
    }

    // Verificar se o bucket já existe
    const bucketExists = buckets?.some(b => b.name === bucketName);

    if (bucketExists) {
      console.log(`[StorageRoutes] Bucket '${bucketName}' já existe`);
      return res.json({ 
        success: true, 
        exists: true, 
        message: 'Bucket já existe' 
      });
    }

    // Criar bucket se não existir
    console.log(`[StorageRoutes] Criando bucket '${bucketName}'...`);
    const { error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 20971520, // 20MB
    });

    if (createError) {
      console.error('[StorageRoutes] Erro ao criar bucket:', createError);
      return res.status(500).json({ 
        success: false, 
        error: `Erro ao criar bucket: ${createError.message}` 
      });
    }

    console.log(`[StorageRoutes] Bucket '${bucketName}' criado com sucesso`);
    res.json({ 
      success: true, 
      exists: false, 
      created: true, 
      message: 'Bucket criado com sucesso' 
    });

  } catch (error: any) {
    console.error('[StorageRoutes] Erro ao processar bucket:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Erro desconhecido' 
    });
  }
});

/**
 * POST /api/storage/upload
 * Faz upload de um arquivo para o Supabase Storage
 */
router.post('/upload', isAuthenticated, upload.single('file'), async (req, res) => {
  try {
    const { bucketName, filePath: rawFilePath } = req.body;
    const file = req.file;

    if (!file || !bucketName || !rawFilePath) {
      return res.status(400).json({ 
        success: false, 
        error: 'file, bucketName e filePath são obrigatórios' 
      });
    }

    // Validar bucket na whitelist
    if (!ALLOWED_BUCKETS.includes(bucketName)) {
      return res.status(403).json({ 
        success: false, 
        error: `Bucket '${bucketName}' não autorizado` 
      });
    }

    // Sanitizar filePath para prevenir path traversal
    const sanitizedFilename = sanitizeFilename(file.originalname);
    const fileExtension = path.extname(sanitizedFilename);
    const timestamp = Date.now();
    const safePath = `${rawFilePath}/${timestamp}_${sanitizedFilename}`;

    console.log(`[StorageRoutes] Fazendo upload de '${safePath}' para bucket '${bucketName}'...`);

    // Fazer upload do arquivo
    const { data, error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(safePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      console.error('[StorageRoutes] Erro ao fazer upload:', uploadError);
      return res.status(500).json({ 
        success: false, 
        error: `Erro ao fazer upload: ${uploadError.message}` 
      });
    }

    // Obter URL pública do arquivo
    const { data: publicUrlData } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(safePath);

    console.log(`[StorageRoutes] Upload concluído com sucesso: ${publicUrlData.publicUrl}`);

    res.json({ 
      success: true, 
      data,
      publicUrl: publicUrlData.publicUrl,
      message: 'Upload realizado com sucesso' 
    });

  } catch (error: any) {
    console.error('[StorageRoutes] Erro ao fazer upload:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Erro desconhecido' 
    });
  }
});

export default router;

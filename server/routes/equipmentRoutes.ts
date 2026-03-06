import { Router } from "express";
import { db } from "../db";
import { 
  equipments, 
  equipmentResponsibilityTerms, 
  equipmentMaintenance, 
  equipmentMovements,
  users,
  insertEquipmentSchema,
  insertEquipmentResponsibilityTermSchema,
  insertEquipmentMaintenanceSchema,
  insertEquipmentMovementSchema,
  type Equipment,
  type EquipmentResponsibilityTerm,
  type EquipmentMaintenance,
  type EquipmentMovement
} from "@shared/schema";
import { eq, desc, and, isNull, count, sql } from "drizzle-orm";
import { unifiedAuthMiddleware } from "../utils/auth-utils";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar multer para upload de arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'server', 'uploads', 'equipment-documents');
    
    // Criar diretório se não existir
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const equipId = req.params.id || req.body?.equipment_id || 'eq';
    cb(null, `term-${equipId}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: function (req, file, cb) {
    // Verificar tipos de arquivo permitidos
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF, JPG, JPEG e PNG são permitidos!'));
    }
  }
});

const router = Router();

// Não aplicar middleware global - aplicar individualmente nas rotas que precisam

// GET /api/equipment - Listar todos os equipamentos
router.get('/', async (req, res) => {
  try {
    // Adicionar headers anti-cache
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });
    
    const equipmentList = await db
      .select()
      .from(equipments)
      .orderBy(desc(equipments.created_at));

    res.json({ success: true, data: equipmentList });
  } catch (error) {
    console.error('Erro ao buscar equipamentos:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// GET /api/equipment/dashboard - Dashboard de equipamentos
router.get('/dashboard', async (req, res) => {
  try {
    // Adicionar headers anti-cache
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });
    
    const equipmentList = await db
      .select()
      .from(equipments)
      .orderBy(desc(equipments.created_at));

    // Contar por status
    const statusCounts = equipmentList.reduce((acc, equipment) => {
      acc[equipment.status] = (acc[equipment.status] || 0) + 1;
      return acc;
    }, {});

    const dashboard = {
      total: equipmentList.length,
      disponivel: statusCounts.disponivel || 0,
      em_uso: statusCounts.em_uso || 0,
      manutencao: statusCounts.manutencao || 0,
      descartado: statusCounts.descartado || 0,
      perdido: statusCounts.perdido || 0,
      roubado: statusCounts.roubado || 0,
      by_type: equipmentList.reduce((acc, equipment) => {
        acc[equipment.type] = (acc[equipment.type] || 0) + 1;
        return acc;
      }, {}),
      by_condition: equipmentList.reduce((acc, equipment) => {
        acc[equipment.condition] = (acc[equipment.condition] || 0) + 1;
        return acc;
      }, {}),
      recent_activity: equipmentList.slice(0, 5)
    };

    res.json({ success: true, data: dashboard });
  } catch (error) {
    console.error('Erro ao buscar dashboard de equipamentos:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// GET /api/equipment-responsibility-terms - Lista todos os termos
router.get('/equipment-responsibility-terms', unifiedAuthMiddleware, async (req, res) => {
  try {
    console.log('🔍 [DEBUG TERMS] ROTA EXECUTADA EM:', new Date().toISOString());
    
    // Query SQL simples e direta
    const query = `
      SELECT 
          ert.*,
          e.name as equipment_name,
          e.type as equipment_type,
          e.brand as equipment_brand,
          e.model as equipment_model,
          e.serial_number as equipment_serial,
          e.patrimony_number as equipment_patrimony
      FROM equipment_responsibility_terms ert
      LEFT JOIN equipments e ON ert.equipment_id = e.id
      ORDER BY ert.created_at DESC
    `;
    
    console.log('🔍 [DEBUG TERMS] Query:', query);
    const result = await db.execute(query);
    const terms = result.rows || [];
    
    console.log('🔍 [DEBUG TERMS] Termos encontrados:', terms.length);
    console.log('🔍 [DEBUG TERMS] Primeiro termo:', terms[0] || 'Nenhum');
    
    // Estruturar dados para compatibilidade com frontend
    const formattedTerms = terms.map((term: any) => ({
      id: term.id,
      equipment_id: term.equipment_id,
      user_id: term.user_id,
      full_name: term.full_name,
      cpf: term.cpf,
      phone: term.phone,
      department: term.department,
      address: term.address,
      position: null,
      assigned_at: term.assigned_at,
      returned_at: term.returned_at,
      assigned_by: term.assigned_by,
      returned_by: term.returned_by,
      term_content: term.term_content,
      condition_at_assignment: term.condition_at_assignment,
      condition_at_return: term.condition_at_return,
      notes: term.notes,
      is_active: term.is_active,
      created_at: term.created_at,
      updated_at: term.updated_at,
      signed_document_url: term.signed_document_url,
      equipment_name: term.equipment_name,
      equipment_type: term.equipment_type,
      equipment_brand: term.equipment_brand,
      equipment_model: term.equipment_model,
      equipment_serial: term.equipment_serial,
      equipment_patrimony: term.equipment_patrimony,
      equipment: {
        id: term.equipment_id,
        name: term.equipment_name || 'Equipamento não encontrado',
        type: term.equipment_type || 'unknown',
        brand: term.equipment_brand || '',
        model: term.equipment_model || '',
        serial_number: term.equipment_serial || '',
        patrimony_number: term.equipment_patrimony || ''
      }
    }));

    console.log('[TERMS] Dados formatados para o frontend:', formattedTerms.length);
    res.json({ success: true, data: formattedTerms });
    
  } catch (error) {
    console.error('[TERMS] Erro detalhado ao buscar termos de responsabilidade:', error);
    console.error('[TERMS] Stack trace:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor', 
      details: error.message 
    });
  }
});

// GET /api/equipment-responsibility-terms/equipment/:equipmentId/active - Buscar termo ativo de um equipamento
router.get('/equipment-responsibility-terms/equipment/:equipmentId/active', unifiedAuthMiddleware, async (req, res) => {
  try {
    const equipmentId = parseInt(req.params.equipmentId);
    
    const term = await db.execute(`
      SELECT
        ert.id,
        ert.equipment_id,
        ert.full_name,
        ert.cpf,
        ert.phone,
        ert.department,
        ert.address,
        ert.assigned_at,
        ert.returned_at,
        ert.condition_at_assignment,
        ert.condition_at_return,
        ert.notes,
        ert.is_active,
        ert.signed_document_url,
        ert.created_at,
        e.name as equipment_name,
        e.type as equipment_type,
        e.brand as equipment_brand,
        e.model as equipment_model,
        e.serial_number as equipment_serial,
        e.patrimony_number as equipment_patrimony
      FROM equipment_responsibility_terms ert
      LEFT JOIN equipments e ON ert.equipment_id = e.id
      WHERE ert.equipment_id = ${equipmentId}
        AND ert.is_active = true
        AND ert.returned_at IS NULL
      LIMIT 1
    `);

    if (!term.rows || term.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Nenhum termo ativo encontrado para este equipamento' });
    }

    const termData = term.rows[0];
    res.json({ 
      success: true, 
      data: {
        id: termData.id,
        equipment_id: termData.equipment_id,
        equipment_name: termData.equipment_name,
        equipment_type: termData.equipment_type,
        equipment_brand: termData.equipment_brand,
        equipment_model: termData.equipment_model,
        equipment_serial: termData.equipment_serial,
        equipment_patrimony: termData.equipment_patrimony,
        full_name: termData.full_name,
        cpf: termData.cpf,
        phone: termData.phone,
        department: termData.department,
        address: termData.address,
        assigned_at: termData.assigned_at,
        returned_at: termData.returned_at,
        condition_at_assignment: termData.condition_at_assignment,
        condition_at_return: termData.condition_at_return,
        notes: termData.notes,
        is_active: termData.is_active,
        signed_document_url: termData.signed_document_url,
        created_at: termData.created_at,
      }
    });
  } catch (error) {
    console.error('Erro ao buscar termo ativo:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// Rota para buscar colaboradores com equipamentos
router.get('/collaborators', async (req, res) => {
  try {
    // Adicionar headers anti-cache
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });

    // Buscar todos os termos de responsabilidade com informações dos equipamentos usando SQL simples
    const result = await db.execute(sql`
      SELECT 
        ert.id,
        ert.full_name as "fullName",
        ert.cpf,
        ert.phone,
        ert.department,
        e.name as "equipmentName",
        e.type as "equipmentType",
        ert.assigned_at as "assignedAt"
      FROM equipment_responsibility_terms ert
      LEFT JOIN equipments e ON ert.equipment_id = e.id
      WHERE ert.returned_at IS NULL
      ORDER BY ert.assigned_at DESC
    `);
    
    const responsibilityTerms = result.rows || [];

    // Agrupar por colaborador (CPF) e unificar os dados
    const collaboratorsMap = new Map();

    responsibilityTerms.forEach(term => {
      if (!term || !term.cpf) return; // Skip invalid records
      
      const key = term.cpf;
      
      if (collaboratorsMap.has(key)) {
        // Adicionar equipamento à lista existente
        const existing = collaboratorsMap.get(key);
        if (existing && existing.equipments) {
          existing.equipments.push({
            name: term.equipmentName || 'N/A',
            type: term.equipmentType || 'N/A',
            assignedAt: term.assignedAt
          });
        }
      } else {
        // Criar novo registro do colaborador
        collaboratorsMap.set(key, {
          fullName: term.fullName || 'N/A',
          cpf: term.cpf,
          phone: term.phone || 'N/A',
          department: term.department || 'N/A',
          project: 'N/A', // Campo solicitado pelo usuário
          base: 'N/A',    // Campo solicitado pelo usuário
          equipments: [{
            name: term.equipmentName || 'N/A',
            type: term.equipmentType || 'N/A',
            assignedAt: term.assignedAt
          }]
        });
      }
    });

    // Converter Map para array
    const collaborators = Array.from(collaboratorsMap.values()).map(collaborator => {
      if (!collaborator || !collaborator.equipments) {
        return null;
      }
      return {
        ...collaborator,
        equipmentCount: collaborator.equipments.length,
        equipmentTypes: [...new Set(collaborator.equipments.map(eq => eq.type || 'N/A'))].join(', ')
      };
    }).filter(c => c !== null);

    res.json({
      success: true,
      data: collaborators,
      total: collaborators.length
    });

  } catch (error) {
    console.error('Erro ao buscar colaboradores com equipamentos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// GET /api/equipment/:id - Buscar equipamento por ID
router.get('/:id', async (req, res) => {
  try {
    console.log('[EQUIPMENT-ID] Rota /:id capturou:', req.params.id);
    const equipmentId = parseInt(req.params.id);
    
    // Validar se o ID é um número válido
    if (isNaN(equipmentId)) {
      console.log('[EQUIPMENT-ID] ID inválido detectado:', req.params.id);
      return res.status(400).json({ success: false, error: 'ID do equipamento inválido' });
    }
    
    const equipment = await db
      .select()
      .from(equipments)
      .where(eq(equipments.id, equipmentId))
      .limit(1);

    if (equipment.length === 0) {
      return res.status(404).json({ success: false, error: 'Equipamento não encontrado' });
    }

    res.json({ success: true, data: equipment[0] });
  } catch (error) {
    console.error('Erro ao buscar equipamento:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// POST /api/equipment - Criar novo equipamento
router.post('/', async (req, res) => {
  try {
    console.log('Dados recebidos para criação do equipamento:', req.body);
    
    // Converter strings vazias em null para campos únicos e opcionais
    const dataToValidate = {
      ...req.body,
      serial_number: req.body.serial_number?.trim() === '' ? null : req.body.serial_number?.trim(),
      patrimony_number: req.body.patrimony_number?.trim() === '' ? null : req.body.patrimony_number?.trim(),
      model: req.body.model?.trim() === '' ? null : req.body.model?.trim(),
      brand: req.body.brand?.trim() === '' ? null : req.body.brand?.trim(),
      supplier: req.body.supplier?.trim() === '' ? null : req.body.supplier?.trim(),
      location: req.body.location?.trim() === '' ? null : req.body.location?.trim(),
      notes: req.body.notes?.trim() === '' ? null : req.body.notes?.trim()
    };
    
    const validatedData = insertEquipmentSchema.parse(dataToValidate);
    console.log('Dados validados:', validatedData);
    
    const newEquipment = await db
      .insert(equipments)
      .values(validatedData)
      .returning();

    console.log('Equipamento criado com sucesso:', newEquipment[0]);
    res.status(201).json({ success: true, data: newEquipment[0] });
  } catch (error) {
    console.error('Erro detalhado ao criar equipamento:', error);
    console.error('Stack trace:', error.stack);
    
    // Tratar erro de duplicata específico
    if (error.code === '23505') { // PostgreSQL unique violation
      let errorMessage = 'Erro: Já existe um equipamento com esses dados.';
      
      if (error.detail?.includes('serial_number')) {
        errorMessage = 'Erro: Já existe um equipamento com este número de série.';
      } else if (error.detail?.includes('patrimony_number')) {
        errorMessage = 'Erro: Já existe um equipamento com este número de patrimônio.';
      }
      
      return res.status(400).json({ 
        success: false, 
        error: errorMessage,
        field: error.detail?.includes('serial_number') ? 'serial_number' : 
               error.detail?.includes('patrimony_number') ? 'patrimony_number' : 'unknown'
      });
    }
    
    if (error.name === 'ZodError') {
      console.error('Erros de validação Zod:', error.errors);
      return res.status(400).json({ 
        success: false, 
        error: 'Dados inválidos', 
        details: error.errors 
      });
    }
    res.status(500).json({ success: false, error: 'Erro interno do servidor', details: error.message });
  }
});

// PUT /api/equipment/:id - Atualizar equipamento
router.put('/:id', async (req, res) => {
  try {
    const equipmentId = parseInt(req.params.id);
    
    console.log('🔄 [EQUIPMENT-UPDATE] Recebendo atualização de equipamento');
    console.log('📋 [EQUIPMENT-UPDATE] Equipment ID:', equipmentId);
    console.log('📋 [EQUIPMENT-UPDATE] Dados recebidos:', req.body);
    
    // Buscar equipamento anterior para comparar status
    const previousEquipment = await db
      .select()
      .from(equipments)
      .where(eq(equipments.id, equipmentId))
      .limit(1);
    
    if (previousEquipment.length === 0) {
      console.error('❌ [EQUIPMENT-UPDATE] Equipamento não encontrado');
      return res.status(404).json({ success: false, error: 'Equipamento não encontrado' });
    }
    
    console.log('📊 [EQUIPMENT-UPDATE] Status anterior:', previousEquipment[0].status);
    console.log('📊 [EQUIPMENT-UPDATE] Novo status:', req.body.status);
    
    // Preparar dados para atualização parcial (não requer todos os campos)
    const updateData: any = {};
    
    // Campos obrigatórios
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.type !== undefined) updateData.type = req.body.type;
    if (req.body.ownership_type !== undefined) updateData.ownership_type = req.body.ownership_type;
    if (req.body.status !== undefined) updateData.status = req.body.status;
    if (req.body.condition !== undefined) updateData.condition = req.body.condition;
    
    // Campos opcionais - converter strings vazias em null
    if (req.body.brand !== undefined) updateData.brand = req.body.brand?.trim() || null;
    if (req.body.model !== undefined) updateData.model = req.body.model?.trim() || null;
    if (req.body.serial_number !== undefined) updateData.serial_number = req.body.serial_number?.trim() || null;
    if (req.body.patrimony_number !== undefined) updateData.patrimony_number = req.body.patrimony_number?.trim() || null;
    if (req.body.purchase_date !== undefined) updateData.purchase_date = req.body.purchase_date || null;
    if (req.body.purchase_value !== undefined) updateData.purchase_value = req.body.purchase_value || null;
    if (req.body.supplier !== undefined) updateData.supplier = req.body.supplier?.trim() || null;
    if (req.body.warranty_expires !== undefined) updateData.warranty_expires = req.body.warranty_expires || null;
    if (req.body.location !== undefined) updateData.location = req.body.location?.trim() || null;
    if (req.body.notes !== undefined) updateData.notes = req.body.notes?.trim() || null;
    
    console.log('⏳ [EQUIPMENT-UPDATE] Executando UPDATE no banco...');
    console.log('📋 [EQUIPMENT-UPDATE] Dados a serem atualizados:', updateData);
    
    const updatedEquipment = await db
      .update(equipments)
      .set({ ...updateData, updated_at: new Date() })
      .where(eq(equipments.id, equipmentId))
      .returning();
    
    console.log('✅ [EQUIPMENT-UPDATE] UPDATE executado. Resultado:', updatedEquipment[0]);
    console.log('📊 [EQUIPMENT-UPDATE] Status final no banco:', updatedEquipment[0]?.status);

    if (updatedEquipment.length === 0) {
      return res.status(404).json({ success: false, error: 'Equipamento não encontrado' });
    }

    // Se o status mudou para 'disponivel', registrar histórico de devolução
    if (previousEquipment[0].status !== 'disponivel' && updateData.status === 'disponivel') {
      const userId = (req.user as any)?.id || 1; // Pegar usuário autenticado ou usar admin como fallback
      
      await db.insert(equipmentMovements).values({
        equipment_id: equipmentId,
        from_user_id: null, // Não sabemos quem estava usando sem termo
        to_user_id: null,
        from_location: previousEquipment[0].location || 'Em uso',
        to_location: updateData.location || updatedEquipment[0].location || 'Disponível',
        movement_type: 'devolucao',
        moved_by: userId,
        moved_at: new Date(),
        notes: `Equipamento devolvido. Status anterior: ${previousEquipment[0].status}. Condição: ${updateData.condition || updatedEquipment[0].condition || 'não especificada'}`
      });
      
      console.log(`[EQUIPMENT] Histórico de devolução registrado para equipamento ${equipmentId}`);
    }

    res.json({ success: true, data: updatedEquipment[0] });
  } catch (error) {
    console.error('Erro ao atualizar equipamento:', error);
    
    // Tratar erro de duplicata específico na atualização
    if (error.code === '23505') { // PostgreSQL unique violation
      let errorMessage = 'Erro: Já existe um equipamento com esses dados.';
      
      if (error.detail?.includes('serial_number')) {
        errorMessage = 'Erro: Já existe um equipamento com este número de série.';
      } else if (error.detail?.includes('patrimony_number')) {
        errorMessage = 'Erro: Já existe um equipamento com este número de patrimônio.';
      }
      
      return res.status(400).json({ 
        success: false, 
        error: errorMessage,
        field: error.detail?.includes('serial_number') ? 'serial_number' : 
               error.detail?.includes('patrimony_number') ? 'patrimony_number' : 'unknown'
      });
    }
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        success: false, 
        error: 'Dados inválidos', 
        details: error.errors 
      });
    }
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// DELETE /api/equipment/:id - Deletar equipamento
router.delete('/:id', async (req, res) => {
  try {
    const equipmentId = parseInt(req.params.id);
    
    const deletedEquipment = await db
      .delete(equipments)
      .where(eq(equipments.id, equipmentId))
      .returning();

    if (deletedEquipment.length === 0) {
      return res.status(404).json({ success: false, error: 'Equipamento não encontrado' });
    }

    res.json({ success: true, message: 'Equipamento deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar equipamento:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// POST /api/equipment-responsibility-terms/create-with-pdf - Criar termo de responsabilidade COM PDF automático
router.post('/equipment-responsibility-terms/create-with-pdf', (req, res, next) => {
  unifiedAuthMiddleware(req, res, (err) => {
    if (err) {
      console.error('❌ [CREATE-PDF] Auth error:', err);
      return res.status(401).json({ success: false, error: 'Não autorizado' });
    }
    next();
  });
}, upload.single('signed_document'), async (req, res) => {
  try {
    console.log('🔄 [CREATE-PDF] Iniciando criação de termo com PDF');
    console.log('📋 [CREATE-PDF] Body completo:', JSON.stringify(req.body, null, 2));
    console.log('📎 [CREATE-PDF] Arquivo:', req.file ? {
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    } : 'Nenhum arquivo');
    console.log('👤 [CREATE-PDF] Usuário:', req.user?.id, req.user?.name);

    // Validar dados recebidos
    const equipmentId = parseInt(req.body.equipment_id);
    console.log('📊 [CREATE-PDF] Equipment ID parseado:', equipmentId);
    
    if (isNaN(equipmentId)) {
      console.error('❌ [CREATE-PDF] Equipment ID inválido:', req.body.equipment_id);
      if (req.file) fs.unlinkSync(req.file.path); // Limpar arquivo se houver erro
      return res.status(400).json({ success: false, error: 'ID do equipamento inválido' });
    }

    // Preparar dados para validação
    const dataToValidate = {
      equipment_id: equipmentId,
      full_name: req.body.full_name,
      cpf: req.body.cpf,
      phone: req.body.phone,
      department: req.body.department,
      address: req.body.address,
      condition_at_assignment: req.body.condition_at_assignment,
      notes: req.body.notes || '',
      term_content: req.body.term_content || `Termo de Responsabilidade`
    };

    console.log('📋 [CREATE-PDF] Dados para validação:', JSON.stringify(dataToValidate, null, 2));
    
    const validatedData = insertEquipmentResponsibilityTermSchema.parse(dataToValidate);
    console.log('✅ [CREATE-PDF] Dados validados com sucesso!');
    
    // Verificar se o equipamento existe e está disponível
    const equipment = await db
      .select()
      .from(equipments)
      .where(eq(equipments.id, validatedData.equipment_id))
      .limit(1);

    if (equipment.length === 0) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, error: 'Equipamento não encontrado' });
    }

    if (equipment[0].status !== 'disponivel' && equipment[0].status !== 'em_uso') {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        success: false, 
        error: `Não é possível criar termo para equipamento com status: ${equipment[0].status}` 
      });
    }

    // Verificar se já existe um termo ativo
    const existingTerm = await db
      .select()
      .from(equipmentResponsibilityTerms)
      .where(
        and(
          eq(equipmentResponsibilityTerms.equipment_id, validatedData.equipment_id),
          eq(equipmentResponsibilityTerms.is_active, true),
          isNull(equipmentResponsibilityTerms.returned_at)
        )
      )
      .limit(1);

    if (existingTerm.length > 0) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        success: false, 
        error: 'Equipamento já possui um termo de responsabilidade ativo' 
      });
    }

    // Preparar URL do arquivo (se foi enviado)
    const fileUrl = req.file ? `/uploads/equipment-documents/${req.file.filename}` : null;

    // Criar termo com PDF já salvo
    const termData = {
      ...validatedData,
      is_active: true,
      assigned_at: new Date(),
      returned_at: null,
      signed_document_url: fileUrl
    };

    const newTerm = await db
      .insert(equipmentResponsibilityTerms)
      .values(termData)
      .returning();

    console.log('[CREATE-WITH-PDF] Termo criado com sucesso! ID:', newTerm[0]?.id);
    console.log('[CREATE-WITH-PDF] PDF salvo em:', fileUrl);

    // Atualizar status para em_uso (se ainda não estiver)
    if (equipment[0].status !== 'em_uso') {
      await db
        .update(equipments)
        .set({ status: 'em_uso', updated_at: new Date() })
        .where(eq(equipments.id, validatedData.equipment_id));
    }

    // Registrar movimentação no histórico
    await db
      .insert(equipmentMovements)
      .values({
        equipment_id: validatedData.equipment_id,
        to_user_id: req.user?.id || null,
        to_location: validatedData.department || null,
        movement_type: 'assignment',
        moved_by: req.user?.id || 1,
        moved_at: new Date(),
        notes: `Termo criado automaticamente com PDF para ${validatedData.full_name}`
      });

    res.status(201).json({ 
      success: true, 
      data: newTerm[0],
      message: 'Termo criado e PDF salvo com sucesso!'
    });

  } catch (error: any) {
    // Limpar arquivo em caso de erro
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('❌ [CREATE-PDF] Erro ao deletar arquivo:', unlinkError);
      }
    }

    console.error('❌ [CREATE-PDF] ERRO CRÍTICO ao criar termo:');
    console.error('📋 [CREATE-PDF] Tipo do erro:', error.name);
    console.error('📋 [CREATE-PDF] Mensagem:', error.message);
    console.error('📋 [CREATE-PDF] Stack completo:', error.stack);
    
    if (error.name === 'ZodError') {
      console.error('❌ [CREATE-PDF] Erros de validação Zod:', error.errors);
      return res.status(400).json({ 
        success: false, 
        error: 'Dados inválidos', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ success: false, error: 'Erro interno do servidor', message: error.message });
  }
});

// POST /api/equipment-responsibility-terms - Criar novo termo de responsabilidade
router.post('/equipment-responsibility-terms', unifiedAuthMiddleware, async (req, res) => {
  try {
    console.log('🔄 [CREATE-TERM] Criando termo de responsabilidade');
    console.log('📋 [CREATE-TERM] Dados recebidos:', JSON.stringify(req.body, null, 2));
    console.log('👤 [CREATE-TERM] Usuário:', req.user?.id, req.user?.name);
    
    const validatedData = insertEquipmentResponsibilityTermSchema.parse(req.body);
    
    console.log('✅ [CREATE-TERM] Dados validados com sucesso');
    console.log('📋 [CREATE-TERM] Equipment ID:', validatedData.equipment_id);
    
    // Verificar se o equipamento existe e está disponível
    const equipment = await db
      .select()
      .from(equipments)
      .where(eq(equipments.id, validatedData.equipment_id))
      .limit(1);

    if (equipment.length === 0) {
      console.error('❌ [CREATE-TERM] Equipamento não encontrado:', validatedData.equipment_id);
      return res.status(404).json({ success: false, error: 'Equipamento não encontrado' });
    }

    console.log('📊 [CREATE-TERM] Equipamento encontrado:', equipment[0].name, 'Status:', equipment[0].status);

    // Verificar se o status permite criação de termo (disponivel ou em_uso)
    if (equipment[0].status !== 'disponivel' && equipment[0].status !== 'em_uso') {
      console.error('❌ [CREATE-TERM] Status não permite termo:', equipment[0].status);
      return res.status(400).json({ 
        success: false, 
        error: `Não é possível criar termo para equipamento com status: ${equipment[0].status}.` 
      });
    }

    // Verificar se já existe um termo ativo para este equipamento
    const existingTerm = await db
      .select()
      .from(equipmentResponsibilityTerms)
      .where(
        and(
          eq(equipmentResponsibilityTerms.equipment_id, validatedData.equipment_id),
          eq(equipmentResponsibilityTerms.is_active, true),
          isNull(equipmentResponsibilityTerms.returned_at)
        )
      )
      .limit(1);

    if (existingTerm.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Equipamento já possui um termo de responsabilidade ativo' 
      });
    }

    // Criar termo com is_active=true e assigned_at=now
    const termData = {
      ...validatedData,
      is_active: true,
      assigned_at: new Date(),
      returned_at: null
    };

    const newTerm = await db
      .insert(equipmentResponsibilityTerms)
      .values(termData)
      .returning();

    console.log('[TERMO CRIADO] ID:', newTerm[0]?.id, 'Equipment ID:', validatedData.equipment_id);

    // Atualizar status para em_uso (somente se ainda não estiver)
    if (equipment[0].status !== 'em_uso') {
      await db
        .update(equipments)
        .set({ status: 'em_uso', updated_at: new Date() })
        .where(eq(equipments.id, validatedData.equipment_id));
    }
    console.log('[EQUIPAMENTO] Status confirmado como em_uso, Equipment ID:', validatedData.equipment_id);

    // Registrar movimentação no histórico automaticamente
    await db
      .insert(equipmentMovements)
      .values({
        equipment_id: validatedData.equipment_id,
        to_user_id: req.user?.id || null,
        to_location: validatedData.department || null,
        movement_type: 'assignment',
        moved_by: req.user?.id || 1, // ID do usuário logado ou admin padrão
        moved_at: new Date(),
        notes: `Termo de responsabilidade criado para ${validatedData.full_name} - ${validatedData.department}`
      });

    console.log('✅ [CREATE-TERM] Termo criado com sucesso! ID:', newTerm[0].id);
    
    res.status(201).json({ success: true, data: newTerm[0] });
  } catch (error: any) {
    console.error('❌ [CREATE-TERM] ERRO ao criar termo de responsabilidade:');
    console.error('📋 [CREATE-TERM] Tipo do erro:', error.name);
    console.error('📋 [CREATE-TERM] Mensagem:', error.message);
    console.error('📋 [CREATE-TERM] Stack:', error.stack);
    
    if (error.name === 'ZodError') {
      console.error('📋 [CREATE-TERM] Erros de validação Zod:', error.errors);
      return res.status(400).json({ 
        success: false, 
        error: 'Dados inválidos', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// PUT /api/equipment-responsibility-terms/:id/return - Registrar devolução de equipamento
router.put('/equipment-responsibility-terms/:id/return', unifiedAuthMiddleware, async (req, res) => {
  try {
    const termId = parseInt(req.params.id);
    const { condition_at_return, notes, returned_by } = req.body;
    
    const updatedTerm = await db
      .update(equipmentResponsibilityTerms)
      .set({
        returned_at: new Date(),
        condition_at_return,
        notes,
        returned_by: returned_by || req.user?.id,
        is_active: false,
        updated_at: new Date()
      })
      .where(eq(equipmentResponsibilityTerms.id, termId))
      .returning();

    if (updatedTerm.length === 0) {
      return res.status(404).json({ success: false, error: 'Termo de responsabilidade não encontrado' });
    }

    console.log('🔄 [EQUIPMENT-RETURN] Processando devolução...');
    console.log('📋 [EQUIPMENT-RETURN] Termo ID:', termId);
    console.log('📋 [EQUIPMENT-RETURN] Equipment ID:', updatedTerm[0].equipment_id);
    console.log('📋 [EQUIPMENT-RETURN] Condição:', condition_at_return);
    console.log('📋 [EQUIPMENT-RETURN] Termo atualizado:', updatedTerm[0]);

    // Atualizar status do equipamento para "disponivel"
    console.log('⏳ [EQUIPMENT-RETURN] Atualizando status do equipamento para DISPONIVEL...');
    const equipmentUpdate = await db
      .update(equipments)
      .set({ status: 'disponivel', condition: condition_at_return, updated_at: new Date() })
      .where(eq(equipments.id, updatedTerm[0].equipment_id))
      .returning();

    console.log('✅ [EQUIPMENT-RETURN] Equipamento atualizado:', equipmentUpdate[0]);
    console.log('📊 [EQUIPMENT-RETURN] Novo status:', equipmentUpdate[0]?.status);

    // Registrar histórico de devolução
    const userId = (req.user as any)?.id || 1;
    await db.insert(equipmentMovements).values({
      equipment_id: updatedTerm[0].equipment_id,
      from_user_id: null,
      to_user_id: null,
      from_location: updatedTerm[0].department || 'Em uso',
      to_location: 'Disponível',
      movement_type: 'devolucao',
      moved_by: userId,
      moved_at: new Date(),
      notes: `Equipamento devolvido. Usuário: ${updatedTerm[0].full_name}. Condição: ${condition_at_return || 'não especificada'}. ${notes || ''}`
    });

    console.log(`[EQUIPMENT] Devolução registrada - Termo ID: ${termId}, Equipment ID: ${updatedTerm[0].equipment_id}`);

    res.json({ success: true, data: updatedTerm[0] });
  } catch (error) {
    console.error('Erro ao registrar devolução:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// POST /api/equipment-responsibility-terms/:id/upload - Upload de documento assinado
router.post('/equipment-responsibility-terms/:id/upload', (req, res, next) => {
  // Custom auth middleware for file uploads
  unifiedAuthMiddleware(req, res, (err) => {
    if (err) {
      console.error('Auth error in upload:', err);
      return res.status(401).json({ success: false, error: 'Não autorizado' });
    }
    next();
  });
}, upload.single('signed_document'), async (req, res) => {
  try {
    const termId = parseInt(req.params.id);
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Nenhum arquivo foi enviado' });
    }
    
    // Verificar se o termo existe
    const term = await db
      .select()
      .from(equipmentResponsibilityTerms)
      .where(eq(equipmentResponsibilityTerms.id, termId))
      .limit(1);

    if (term.length === 0) {
      // Remover arquivo se o termo não existe
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, error: 'Termo de responsabilidade não encontrado' });
    }
    
    // Gerar URL relativa do arquivo
    const fileUrl = `/uploads/equipment-documents/${req.file.filename}`;
    
    // Atualizar termo com URL do documento
    const updatedTerm = await db
      .update(equipmentResponsibilityTerms)
      .set({
        signed_document_url: fileUrl,
        updated_at: new Date()
      })
      .where(eq(equipmentResponsibilityTerms.id, termId))
      .returning();

    res.json({ 
      success: true, 
      data: updatedTerm[0],
      message: 'Documento anexado com sucesso!',
      file_url: fileUrl
    });
  } catch (error) {
    console.error('Erro ao fazer upload do documento:', error);
    
    // Remover arquivo em caso de erro
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// GET /api/equipment-maintenance - Listar manutenções
router.get('/equipment-maintenance', unifiedAuthMiddleware, async (req, res) => {
  try {
    const maintenanceList = await db
      .select({
        id: equipmentMaintenance.id,
        equipment_id: equipmentMaintenance.equipment_id,
        maintenance_type: equipmentMaintenance.maintenance_type,
        description: equipmentMaintenance.description,
        performed_by: equipmentMaintenance.performed_by,
        performed_at: equipmentMaintenance.performed_at,
        cost: equipmentMaintenance.cost,
        supplier: equipmentMaintenance.supplier,
        notes: equipmentMaintenance.notes,
        created_at: equipmentMaintenance.created_at,
        equipment_name: equipments.name,
        equipment_type: equipments.type,
        equipment_serial: equipments.serial_number
      })
      .from(equipmentMaintenance)
      .leftJoin(equipments, eq(equipmentMaintenance.equipment_id, equipments.id))
      .orderBy(desc(equipmentMaintenance.performed_at));

    res.json({ success: true, data: maintenanceList });
  } catch (error) {
    console.error('Erro ao buscar manutenções:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// POST /api/equipment-maintenance - Criar nova manutenção
router.post('/equipment-maintenance', unifiedAuthMiddleware, async (req, res) => {
  try {
    const validatedData = insertEquipmentMaintenanceSchema.parse(req.body);
    
    const newMaintenance = await db
      .insert(equipmentMaintenance)
      .values(validatedData)
      .returning();

    res.status(201).json({ success: true, data: newMaintenance[0] });
  } catch (error) {
    console.error('Erro ao criar manutenção:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// GET /api/equipment-movements - Listar movimentações
router.get('/equipment-movements', unifiedAuthMiddleware, async (req, res) => {
  try {
    const movementsList = await db
      .select({
        id: equipmentMovements.id,
        equipment_id: equipmentMovements.equipment_id,
        from_user_id: equipmentMovements.from_user_id,
        to_user_id: equipmentMovements.to_user_id,
        from_location: equipmentMovements.from_location,
        to_location: equipmentMovements.to_location,
        movement_type: equipmentMovements.movement_type,
        moved_by: equipmentMovements.moved_by,
        moved_at: equipmentMovements.moved_at,
        notes: equipmentMovements.notes,
        created_at: equipmentMovements.created_at,
        equipment_name: equipments.name,
        equipment_type: equipments.type,
        equipment_serial: equipments.serial_number
      })
      .from(equipmentMovements)
      .leftJoin(equipments, eq(equipmentMovements.equipment_id, equipments.id))
      .orderBy(desc(equipmentMovements.moved_at));

    res.json({ success: true, data: movementsList });
  } catch (error) {
    console.error('Erro ao buscar movimentações:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// POST /api/equipment-movements - Criar nova movimentação
router.post('/equipment-movements', unifiedAuthMiddleware, async (req, res) => {
  try {
    const validatedData = insertEquipmentMovementSchema.parse(req.body);
    
    const newMovement = await db
      .insert(equipmentMovements)
      .values({
        ...validatedData,
        moved_by: req.user?.id || validatedData.moved_by
      })
      .returning();

    res.status(201).json({ success: true, data: newMovement[0] });
  } catch (error) {
    console.error('Erro ao criar movimentação:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// GET /api/equipment-dashboard - Dashboard de equipamentos
router.get('/equipment-dashboard', unifiedAuthMiddleware, async (req, res) => {
  try {
    // Estatísticas gerais usando count()
    const [totalResult] = await db
      .select({ count: count() })
      .from(equipments);

    const [availableResult] = await db
      .select({ count: count() })
      .from(equipments)
      .where(eq(equipments.status, 'disponivel'));

    const [inUseResult] = await db
      .select({ count: count() })
      .from(equipments)
      .where(eq(equipments.status, 'em_uso'));

    const [maintenanceResult] = await db
      .select({ count: count() })
      .from(equipments)
      .where(eq(equipments.status, 'manutencao'));

    // Equipamentos por tipo
    const equipmentsByType = await db
      .select({ 
        type: equipments.type,
        count: count()
      })
      .from(equipments)
      .groupBy(equipments.type);

    // Termos ativos
    const [activeTermsResult] = await db
      .select({ count: count() })
      .from(equipmentResponsibilityTerms)
      .where(
        and(
          eq(equipmentResponsibilityTerms.is_active, true),
          isNull(equipmentResponsibilityTerms.returned_at)
        )
      );

    const dashboard = {
      totalEquipments: Number(totalResult?.count || 0),
      availableEquipments: Number(availableResult?.count || 0),
      inUseEquipments: Number(inUseResult?.count || 0),
      maintenanceEquipments: Number(maintenanceResult?.count || 0),
      equipmentsByType,
      activeTerms: Number(activeTermsResult?.count || 0)
    };

    res.json({ success: true, data: dashboard });
  } catch (error) {
    console.error('Erro ao buscar dashboard:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// Rota para buscar histórico de movimentação de equipamento
router.get('/equipment-movements/:equipmentId', async (req, res) => {
  try {
    const equipmentId = parseInt(req.params.equipmentId);
    
    // Buscar movimentações do equipamento usando Drizzle ORM
    const movements = await db
      .select()
      .from(equipmentMovements)
      .where(eq(equipmentMovements.equipment_id, equipmentId))
      .orderBy(desc(equipmentMovements.created_at));

    res.json({ success: true, data: movements || [] });
  } catch (error) {
    console.error('Erro ao buscar movimentações:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// Rota para buscar histórico de manutenção de equipamento
router.get('/equipment-maintenance/:equipmentId', async (req, res) => {
  try {
    const equipmentId = parseInt(req.params.equipmentId);
    
    // Buscar manutenções do equipamento usando Drizzle ORM
    const maintenance = await db
      .select()
      .from(equipmentMaintenance)
      .where(eq(equipmentMaintenance.equipment_id, equipmentId))
      .orderBy(desc(equipmentMaintenance.created_at));

    res.json({ success: true, data: maintenance || [] });
  } catch (error) {
    console.error('Erro ao buscar manutenção:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});


export default router;
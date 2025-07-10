import { Router } from "express";
import { db } from "../db.js";
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
import { eq, desc, and, isNull, count } from "drizzle-orm";
import { unifiedAuthMiddleware } from "../utils/auth-utils.js";

const router = Router();

// Middleware de autenticação para todas as rotas
router.use(unifiedAuthMiddleware);

// GET /api/equipment - Listar todos os equipamentos
router.get('/equipment', async (req, res) => {
  try {
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

// GET /api/equipment/:id - Buscar equipamento por ID
router.get('/equipment/:id', async (req, res) => {
  try {
    const equipmentId = parseInt(req.params.id);
    
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
router.post('/equipment', async (req, res) => {
  try {
    const validatedData = insertEquipmentSchema.parse(req.body);
    
    const newEquipment = await db
      .insert(equipments)
      .values(validatedData)
      .returning();

    res.status(201).json({ success: true, data: newEquipment[0] });
  } catch (error) {
    console.error('Erro ao criar equipamento:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// PUT /api/equipment/:id - Atualizar equipamento
router.put('/equipment/:id', async (req, res) => {
  try {
    const equipmentId = parseInt(req.params.id);
    const validatedData = insertEquipmentSchema.parse(req.body);
    
    const updatedEquipment = await db
      .update(equipments)
      .set({ ...validatedData, updated_at: new Date() })
      .where(eq(equipments.id, equipmentId))
      .returning();

    if (updatedEquipment.length === 0) {
      return res.status(404).json({ success: false, error: 'Equipamento não encontrado' });
    }

    res.json({ success: true, data: updatedEquipment[0] });
  } catch (error) {
    console.error('Erro ao atualizar equipamento:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// DELETE /api/equipment/:id - Deletar equipamento
router.delete('/equipment/:id', async (req, res) => {
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

// GET /api/equipment-responsibility-terms - Listar todos os termos de responsabilidade
router.get('/equipment-responsibility-terms', async (req, res) => {
  try {
    const terms = await db
      .select({
        id: equipmentResponsibilityTerms.id,
        equipment_id: equipmentResponsibilityTerms.equipment_id,
        user_id: equipmentResponsibilityTerms.user_id,
        assigned_at: equipmentResponsibilityTerms.assigned_at,
        returned_at: equipmentResponsibilityTerms.returned_at,
        assigned_by: equipmentResponsibilityTerms.assigned_by,
        returned_by: equipmentResponsibilityTerms.returned_by,
        term_content: equipmentResponsibilityTerms.term_content,
        condition_at_assignment: equipmentResponsibilityTerms.condition_at_assignment,
        condition_at_return: equipmentResponsibilityTerms.condition_at_return,
        notes: equipmentResponsibilityTerms.notes,
        is_active: equipmentResponsibilityTerms.is_active,
        created_at: equipmentResponsibilityTerms.created_at,
        updated_at: equipmentResponsibilityTerms.updated_at,
        equipment_name: equipments.name,
        equipment_type: equipments.type,
        equipment_serial: equipments.serial_number,
        user_name: users.name,
        user_email: users.email
      })
      .from(equipmentResponsibilityTerms)
      .leftJoin(equipments, eq(equipmentResponsibilityTerms.equipment_id, equipments.id))
      .leftJoin(users, eq(equipmentResponsibilityTerms.user_id, users.id))
      .orderBy(desc(equipmentResponsibilityTerms.created_at));

    res.json({ success: true, data: terms });
  } catch (error) {
    console.error('Erro ao buscar termos de responsabilidade:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// POST /api/equipment-responsibility-terms - Criar novo termo de responsabilidade
router.post('/equipment-responsibility-terms', async (req, res) => {
  try {
    const validatedData = insertEquipmentResponsibilityTermSchema.parse(req.body);
    
    // Verificar se o equipamento está disponível
    const equipment = await db
      .select()
      .from(equipments)
      .where(eq(equipments.id, validatedData.equipment_id))
      .limit(1);

    if (equipment.length === 0) {
      return res.status(404).json({ success: false, error: 'Equipamento não encontrado' });
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

    const newTerm = await db
      .insert(equipmentResponsibilityTerms)
      .values(validatedData)
      .returning();

    // Atualizar status do equipamento para "em_uso"
    await db
      .update(equipments)
      .set({ status: 'em_uso', updated_at: new Date() })
      .where(eq(equipments.id, validatedData.equipment_id));

    res.status(201).json({ success: true, data: newTerm[0] });
  } catch (error) {
    console.error('Erro ao criar termo de responsabilidade:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// PUT /api/equipment-responsibility-terms/:id/return - Registrar devolução de equipamento
router.put('/equipment-responsibility-terms/:id/return', async (req, res) => {
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

    // Atualizar status do equipamento para "disponivel"
    await db
      .update(equipments)
      .set({ status: 'disponivel', updated_at: new Date() })
      .where(eq(equipments.id, updatedTerm[0].equipment_id));

    res.json({ success: true, data: updatedTerm[0] });
  } catch (error) {
    console.error('Erro ao registrar devolução:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// GET /api/equipment-maintenance - Listar manutenções
router.get('/equipment-maintenance', async (req, res) => {
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
router.post('/equipment-maintenance', async (req, res) => {
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
router.get('/equipment-movements', async (req, res) => {
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
router.post('/equipment-movements', async (req, res) => {
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
router.get('/equipment-dashboard', async (req, res) => {
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

export default router;
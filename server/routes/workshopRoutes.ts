/**
 * Rotas de API para o sistema de oficinas
 * Funciona com as tabelas criadas para o módulo de oficinas
 */

import express, { Request, Response, NextFunction } from 'express';
import { pool } from '../db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Interface para usuário autenticado
interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
  role: string;
  oficina_id: number | null;
}

// Interface para Request com usuário
interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

// Middleware para verificar autenticação JWT
const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Token não fornecido. Autenticação necessária.' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'muriciLogisticaSecret2025') as { userId: number };
    const client = await pool.connect();
    
    try {
      const result = await client.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
      
      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Usuário não encontrado' });
      }
      
      const user = result.rows[0];
      
      // Verifica se o usuário está ativo
      if (!user.is_active) {
        return res.status(403).json({ message: 'Usuário desativado. Contate o administrador.' });
      }
      
      // Armazena o usuário no objeto de requisição para uso nas rotas
      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        oficina_id: user.oficina_id
      };
      
      next();
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro na autenticação JWT:', error);
    return res.status(401).json({ message: 'Token inválido ou expirado' });
  }
};

// Middleware para verificar se o usuário é uma oficina ou admin
const workshopAuthMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Usuário não autenticado' });
  }
  
  if (req.user.role !== 'oficina' && req.user.role !== 'admin' && req.user.role !== 'gestor_frota') {
    return res.status(403).json({ message: 'Acesso negado. Permissão insuficiente.' });
  }
  
  // Se for usuário da oficina, deve ter um oficina_id associado
  if (req.user.role === 'oficina' && !req.user.oficina_id) {
    return res.status(403).json({ message: 'Usuário não está vinculado a uma oficina.' });
  }
  
  next();
};

// Rota para cadastrar uma nova oficina
router.post('/cadastro', async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const {
      nome,
      email,
      telefone,
      endereco,
      cidade,
      estado,
      cep,
      responsavel,
      cnpj,
      especialidades,
      senha
    } = req.body;
    
    // Valida campos obrigatórios
    if (!nome || !email || !telefone || !endereco || !responsavel || !cnpj || !senha) {
      return res.status(400).json({ message: 'Todos os campos obrigatórios devem ser preenchidos' });
    }
    
    // Verifica se o email já está cadastrado
    const userCheck = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Este email já está cadastrado' });
    }
    
    // Verifica se o CNPJ já está cadastrado
    const cnpjCheck = await client.query(
      'SELECT w.* FROM workshops w JOIN workshop_profiles wp ON w.id = wp.workshop_id WHERE wp.cnpj = $1',
      [cnpj]
    );
    if (cnpjCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Este CNPJ já está cadastrado' });
    }
    
    // Cria a oficina na tabela workshops
    const workshopResult = await client.query(
      'INSERT INTO workshops (name, address, phone, contact_person, is_specialized, specialties, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [nome, endereco, telefone, responsavel, especialidades ? true : false, especialidades, true]
    );
    
    const workshopId = workshopResult.rows[0].id;
    
    // Cria o perfil adicional da oficina
    await client.query(
      'INSERT INTO workshop_profiles (workshop_id, cnpj, email, city, state, zip_code) VALUES ($1, $2, $3, $4, $5, $6)',
      [workshopId, cnpj, email, cidade, estado, cep]
    );
    
    // Cria o usuário com o papel de 'oficina'
    const hashedPassword = await bcrypt.hash(senha, 10);
    const userResult = await client.query(
      'INSERT INTO users (name, email, password, role, oficina_id, is_active) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [responsavel, email, hashedPassword, 'oficina', workshopId, true]
    );
    
    // Gera um token de autenticação para o usuário
    const token = jwt.sign(
      { userId: userResult.rows[0].id },
      process.env.JWT_SECRET || 'muriciLogisticaSecret2025',
      { expiresIn: '30d' }
    );
    
    await client.query('COMMIT');
    
    res.status(201).json({
      message: 'Oficina cadastrada com sucesso',
      workshopId,
      userId: userResult.rows[0].id,
      token
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao cadastrar oficina:', error);
    res.status(500).json({
      message: 'Erro ao processar o cadastro. Tente novamente mais tarde.',
      error: (error as Error).message
    });
  } finally {
    client.release();
  }
});

// Rotas protegidas (requerem autenticação)
// ==========================================

// Listar detalhes da oficina do usuário logado
router.get('/perfil', authMiddleware, workshopAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const workshopId = req.user?.role === 'oficina' 
      ? req.user.oficina_id 
      : (req.query.id ? parseInt(req.query.id as string) : undefined);
    
    if (!workshopId) {
      return res.status(400).json({ message: 'ID da oficina não fornecido' });
    }
    
    const client = await pool.connect();
    try {
      // Busca informações da oficina juntando as tabelas workshops e workshop_profiles
      const result = await client.query(`
        SELECT w.*, wp.cnpj, wp.email, wp.website, wp.opening_hours, wp.city, wp.state, 
               wp.zip_code, wp.rating, wp.banking_info, wp.payment_terms, wp.warranty_terms, 
               wp.logo_url, wp.service_area
        FROM workshops w
        LEFT JOIN workshop_profiles wp ON w.id = wp.workshop_id
        WHERE w.id = $1
      `, [workshopId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Oficina não encontrada' });
      }
      
      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao buscar perfil da oficina:', error);
    res.status(500).json({ message: 'Erro ao buscar perfil da oficina', error: (error as Error).message });
  }
});

// Atualizar perfil da oficina
router.put('/perfil', authMiddleware, workshopAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Se for usuário oficina, só pode atualizar a própria oficina
    const workshopId = req.user?.oficina_id;
    
    if (req.user?.role === 'oficina' && (!workshopId || parseInt(req.body.id) !== workshopId)) {
      return res.status(403).json({ message: 'Você só pode atualizar sua própria oficina' });
    }
    
    const {
      nome,
      endereco,
      telefone,
      responsavel,
      especialidades,
      email,
      website,
      horario_funcionamento,
      cidade,
      estado,
      cep,
      dados_bancarios,
      termos_pagamento,
      termos_garantia,
      area_atendimento
    } = req.body;
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Atualiza a tabela workshops
      await client.query(`
        UPDATE workshops 
        SET name = $1, address = $2, phone = $3, contact_person = $4, 
            is_specialized = $5, specialties = $6
        WHERE id = $7
      `, [
        nome, 
        endereco, 
        telefone, 
        responsavel, 
        especialidades ? true : false, 
        especialidades,
        workshopId
      ]);
      
      // Verifica se o perfil existe
      const profileCheck = await client.query(
        'SELECT * FROM workshop_profiles WHERE workshop_id = $1',
        [workshopId]
      );
      
      if (profileCheck.rows.length === 0) {
        // Cria um novo perfil se não existir
        await client.query(`
          INSERT INTO workshop_profiles 
          (workshop_id, email, website, opening_hours, city, state, zip_code, 
           banking_info, payment_terms, warranty_terms, service_area)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          workshopId, 
          email, 
          website, 
          horario_funcionamento, 
          cidade, 
          estado, 
          cep, 
          dados_bancarios, 
          termos_pagamento, 
          termos_garantia, 
          area_atendimento
        ]);
      } else {
        // Atualiza o perfil existente
        await client.query(`
          UPDATE workshop_profiles 
          SET email = $1, website = $2, opening_hours = $3, city = $4, state = $5, 
              zip_code = $6, banking_info = $7, payment_terms = $8, warranty_terms = $9, 
              service_area = $10, updated_at = CURRENT_TIMESTAMP
          WHERE workshop_id = $11
        `, [
          email, 
          website, 
          horario_funcionamento, 
          cidade, 
          estado, 
          cep, 
          dados_bancarios, 
          termos_pagamento, 
          termos_garantia, 
          area_atendimento,
          workshopId
        ]);
      }
      
      await client.query('COMMIT');
      
      res.json({ 
        message: 'Perfil da oficina atualizado com sucesso',
        workshopId 
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao atualizar perfil da oficina:', error);
    res.status(500).json({ message: 'Erro ao atualizar perfil da oficina', error: (error as Error).message });
  }
});

// Criar orçamento
router.post('/orcamentos', authMiddleware, workshopAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const {
        vehicle_plate,
        maintenance_type,
        description,
        total_value,
        parts_value,
        labor_value,
        estimated_time,
        priority,
        parts,
        services
      } = req.body;
      
      // Valida campos obrigatórios
      if (!vehicle_plate || !maintenance_type || !description || !total_value) {
        return res.status(400).json({ message: 'Campos obrigatórios não preenchidos' });
      }
      
      // Define o ID da oficina (se for admin, usa o ID fornecido)
      const workshopId = req.user?.role === 'oficina' 
        ? req.user.oficina_id 
        : (req.body.workshop_id || req.user?.oficina_id);
      
      if (!workshopId) {
        return res.status(400).json({ message: 'ID da oficina não fornecido' });
      }
      
      // Cria o orçamento
      const budgetResult = await client.query(`
        INSERT INTO workshop_budgets 
        (workshop_id, vehicle_plate, maintenance_type, description, total_value, 
         parts_value, labor_value, estimated_time, status, priority)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `, [
        workshopId,
        vehicle_plate,
        maintenance_type,
        description,
        total_value,
        parts_value || 0,
        labor_value || 0,
        estimated_time || null,
        'pendente',
        priority || 'media'
      ]);
      
      const budgetId = budgetResult.rows[0].id;
      
      // Adiciona as peças ao orçamento, se fornecidas
      if (parts && Array.isArray(parts) && parts.length > 0) {
        for (const part of parts) {
          await client.query(`
            INSERT INTO workshop_budget_parts
            (budget_id, part_name, part_number, quantity, unit_price, total_price, is_original)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [
            budgetId,
            part.name,
            part.number || null,
            part.quantity,
            part.unit_price,
            part.total_price || (part.quantity * part.unit_price),
            part.is_original !== undefined ? part.is_original : true
          ]);
        }
      }
      
      // Adiciona os serviços ao orçamento, se fornecidos
      if (services && Array.isArray(services) && services.length > 0) {
        for (const service of services) {
          await client.query(`
            INSERT INTO workshop_budget_services
            (budget_id, service_name, service_description, hours_estimated, hour_price, total_price)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [
            budgetId,
            service.name,
            service.description || null,
            service.hours,
            service.hour_price,
            service.total_price || (service.hours * service.hour_price)
          ]);
        }
      }
      
      // Adiciona entrada no histórico
      await client.query(`
        INSERT INTO workshop_budget_history
        (budget_id, previous_status, new_status, user_id, observations)
        VALUES ($1, NULL, 'pendente', $2, 'Orçamento criado')
      `, [budgetId, req.user?.id]);
      
      // Registra o veículo em manutenção, se ainda não estiver registrado
      const vehicleCheck = await client.query(`
        SELECT * FROM workshop_vehicles_in_maintenance
        WHERE workshop_id = $1 AND vehicle_plate = $2 AND actual_exit_date IS NULL
      `, [workshopId, vehicle_plate]);
      
      if (vehicleCheck.rows.length === 0) {
        // Adiciona o veículo como em manutenção
        await client.query(`
          INSERT INTO workshop_vehicles_in_maintenance
          (workshop_id, vehicle_plate, vehicle_model, current_status, budget_id, initial_diagnosis)
          VALUES ($1, $2, $3, 'aguardando_aprovacao', $4, $5)
        `, [
          workshopId,
          vehicle_plate,
          req.body.vehicle_model || null,
          budgetId,
          description
        ]);
      } else {
        // Atualiza o veículo existente para vincular ao novo orçamento
        await client.query(`
          UPDATE workshop_vehicles_in_maintenance
          SET budget_id = $1, current_status = 'aguardando_aprovacao', updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [budgetId, vehicleCheck.rows[0].id]);
      }
      
      await client.query('COMMIT');
      
      res.status(201).json({
        message: 'Orçamento criado com sucesso',
        budgetId
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao criar orçamento:', error);
    res.status(500).json({ message: 'Erro ao criar orçamento', error: (error as Error).message });
  }
});

// Listar orçamentos da oficina
router.get('/orcamentos', authMiddleware, workshopAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Define o ID da oficina (se for admin ou gestor_frota, pode ver todos ou filtrar por ID)
    let workshopId = null;
    let whereClause = '';
    let queryParams: any[] = [];
    
    if (req.user?.role === 'oficina') {
      // Usuário de oficina só vê seus próprios orçamentos
      workshopId = req.user.oficina_id;
      whereClause = 'WHERE b.workshop_id = $1';
      queryParams.push(workshopId);
    } else if (req.query.workshop_id) {
      // Admin ou gestor filtrando por oficina específica
      workshopId = parseInt(req.query.workshop_id as string);
      whereClause = 'WHERE b.workshop_id = $1';
      queryParams.push(workshopId);
    }
    
    // Filtra por status, se fornecido
    if (req.query.status) {
      if (whereClause === '') {
        whereClause = 'WHERE b.status = $1';
        queryParams.push(req.query.status);
      } else {
        whereClause += ' AND b.status = $' + (queryParams.length + 1);
        queryParams.push(req.query.status);
      }
    }
    
    // Filtra por placa, se fornecida
    if (req.query.plate) {
      if (whereClause === '') {
        whereClause = 'WHERE b.vehicle_plate ILIKE $1';
        queryParams.push(`%${req.query.plate}%`);
      } else {
        whereClause += ' AND b.vehicle_plate ILIKE $' + (queryParams.length + 1);
        queryParams.push(`%${req.query.plate}%`);
      }
    }
    
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT b.*, w.name AS workshop_name, 
        (SELECT COUNT(*) FROM workshop_budget_parts WHERE budget_id = b.id) AS parts_count,
        (SELECT COUNT(*) FROM workshop_budget_services WHERE budget_id = b.id) AS services_count
        FROM workshop_budgets b
        JOIN workshops w ON b.workshop_id = w.id
        ${whereClause}
        ORDER BY b.created_at DESC
      `, queryParams);
      
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao listar orçamentos:', error);
    res.status(500).json({ message: 'Erro ao listar orçamentos', error: (error as Error).message });
  }
});

// Obter detalhes de um orçamento específico
router.get('/orcamentos/:id', authMiddleware, workshopAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const budgetId = parseInt(req.params.id);
    
    const client = await pool.connect();
    try {
      // Busca o orçamento
      const budgetResult = await client.query(`
        SELECT b.*, w.name AS workshop_name
        FROM workshop_budgets b
        JOIN workshops w ON b.workshop_id = w.id
        WHERE b.id = $1
      `, [budgetId]);
      
      if (budgetResult.rows.length === 0) {
        return res.status(404).json({ message: 'Orçamento não encontrado' });
      }
      
      const budget = budgetResult.rows[0];
      
      // Verifica se o usuário tem permissão para acessar este orçamento
      if (req.user?.role === 'oficina' && budget.workshop_id !== req.user.oficina_id) {
        return res.status(403).json({ message: 'Você não tem permissão para acessar este orçamento' });
      }
      
      // Busca as peças do orçamento
      const partsResult = await client.query(
        'SELECT * FROM workshop_budget_parts WHERE budget_id = $1',
        [budgetId]
      );
      
      // Busca os serviços do orçamento
      const servicesResult = await client.query(
        'SELECT * FROM workshop_budget_services WHERE budget_id = $1',
        [budgetId]
      );
      
      // Busca o histórico do orçamento
      const historyResult = await client.query(`
        SELECT h.*, u.name AS user_name
        FROM workshop_budget_history h
        JOIN users u ON h.user_id = u.id
        WHERE h.budget_id = $1
        ORDER BY h.changed_at ASC
      `, [budgetId]);
      
      // Combina tudo em um único objeto de resposta
      const response = {
        ...budget,
        parts: partsResult.rows,
        services: servicesResult.rows,
        history: historyResult.rows
      };
      
      res.json(response);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao buscar detalhes do orçamento:', error);
    res.status(500).json({ message: 'Erro ao buscar detalhes do orçamento', error: (error as Error).message });
  }
});

// Aprovar ou rejeitar um orçamento (apenas admin ou gestor_frota)
router.put('/orcamentos/:id/status', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Apenas admin ou gestor_frota pode aprovar/rejeitar orçamentos
    if (req.user?.role !== 'admin' && req.user?.role !== 'gestor_frota') {
      return res.status(403).json({ message: 'Você não tem permissão para esta ação' });
    }
    
    const budgetId = parseInt(req.params.id);
    const { status, observations } = req.body;
    
    if (!status || !['aprovado', 'rejeitado'].includes(status)) {
      return res.status(400).json({ message: 'Status inválido. Use "aprovado" ou "rejeitado".' });
    }
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Busca o orçamento atual para validação
      const budgetCheck = await client.query(
        'SELECT * FROM workshop_budgets WHERE id = $1',
        [budgetId]
      );
      
      if (budgetCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Orçamento não encontrado' });
      }
      
      const currentBudget = budgetCheck.rows[0];
      
      // Só pode mudar o status se estiver pendente
      if (currentBudget.status !== 'pendente') {
        return res.status(400).json({ 
          message: `Não é possível alterar o status. O orçamento já está ${currentBudget.status}.`
        });
      }
      
      // Atualiza o status do orçamento
      await client.query(`
        UPDATE workshop_budgets
        SET status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [status, req.user?.id, budgetId]);
      
      // Registra no histórico
      await client.query(`
        INSERT INTO workshop_budget_history
        (budget_id, previous_status, new_status, user_id, observations)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        budgetId, 
        currentBudget.status, 
        status, 
        req.user?.id, 
        observations || `Orçamento ${status === 'aprovado' ? 'aprovado' : 'rejeitado'} pelo gestor`
      ]);
      
      // Atualiza o status do veículo em manutenção
      await client.query(`
        UPDATE workshop_vehicles_in_maintenance
        SET current_status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE budget_id = $2
      `, [
        status === 'aprovado' ? 'em_manutencao' : 'aguardando_diagnostico',
        budgetId
      ]);
      
      await client.query('COMMIT');
      
      res.json({
        message: `Orçamento ${status === 'aprovado' ? 'aprovado' : 'rejeitado'} com sucesso`,
        budgetId
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao atualizar status do orçamento:', error);
    res.status(500).json({ message: 'Erro ao atualizar status do orçamento', error: (error as Error).message });
  }
});

// Rota para upload de documentos da oficina
router.post('/documentos', authMiddleware, workshopAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { document_type, document_name, file_path, file_type, file_size } = req.body;
    
    // Valida campos obrigatórios
    if (!document_type || !document_name || !file_path) {
      return res.status(400).json({ message: 'Campos obrigatórios não fornecidos' });
    }
    
    // Define o ID da oficina
    const workshopId = req.user?.role === 'oficina' 
      ? req.user.oficina_id 
      : (req.body.workshop_id || req.user?.oficina_id);
    
    if (!workshopId) {
      return res.status(400).json({ message: 'ID da oficina não fornecido' });
    }
    
    const client = await pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO workshop_documents
        (workshop_id, document_type, document_name, file_path, file_type, file_size)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [
        workshopId,
        document_type,
        document_name,
        file_path,
        file_type || null,
        file_size || null
      ]);
      
      res.status(201).json({
        message: 'Documento enviado com sucesso',
        documentId: result.rows[0].id
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao enviar documento:', error);
    res.status(500).json({ message: 'Erro ao enviar documento', error: (error as Error).message });
  }
});

// Listar documentos da oficina
router.get('/documentos', authMiddleware, workshopAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Define o ID da oficina
    let workshopId: number | null | undefined = null;
    
    if (req.user?.role === 'oficina') {
      workshopId = req.user.oficina_id;
    } else if (req.query.workshop_id) {
      workshopId = parseInt(req.query.workshop_id as string);
    }
    
    if (!workshopId) {
      return res.status(400).json({ message: 'ID da oficina não fornecido' });
    }
    
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT * FROM workshop_documents
        WHERE workshop_id = $1
        ORDER BY uploaded_at DESC
      `, [workshopId]);
      
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao listar documentos:', error);
    res.status(500).json({ message: 'Erro ao listar documentos', error: (error as Error).message });
  }
});

// Rota para listar veículos em manutenção
router.get('/veiculos-em-manutencao', authMiddleware, workshopAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Define o ID da oficina (se for admin, pode ver todos)
    let whereClause = '';
    let queryParams: any[] = [];
    
    if (req.user?.role === 'oficina') {
      whereClause = 'WHERE workshop_id = $1';
      queryParams.push(req.user.oficina_id);
    } else if (req.query.workshop_id) {
      whereClause = 'WHERE workshop_id = $1';
      queryParams.push(parseInt(req.query.workshop_id as string));
    }
    
    // Filtro adicional por status, se fornecido
    if (req.query.status) {
      if (whereClause === '') {
        whereClause = 'WHERE current_status = $1';
        queryParams.push(req.query.status);
      } else {
        whereClause += ' AND current_status = $' + (queryParams.length + 1);
        queryParams.push(req.query.status);
      }
    }
    
    // Filtro por placa de veículo, se fornecido
    if (req.query.plate) {
      if (whereClause === '') {
        whereClause = 'WHERE vehicle_plate ILIKE $1';
        queryParams.push(`%${req.query.plate}%`);
      } else {
        whereClause += ' AND vehicle_plate ILIKE $' + (queryParams.length + 1);
        queryParams.push(`%${req.query.plate}%`);
      }
    }
    
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT * FROM vw_vehicles_in_maintenance
        ${whereClause}
        ORDER BY entry_date DESC
      `, queryParams);
      
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao listar veículos em manutenção:', error);
    res.status(500).json({ message: 'Erro ao listar veículos em manutenção', error: (error as Error).message });
  }
});

// Atualizar status de um veículo em manutenção
router.put('/veiculos-em-manutencao/:id/status', authMiddleware, workshopAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const vehicleId = parseInt(req.params.id);
    const { status, observations, expected_exit_date } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status não fornecido' });
    }
    
    const validStatus = [
      'aguardando_diagnostico', 
      'em_manutencao', 
      'aguardando_pecas', 
      'aguardando_aprovacao', 
      'finalizado', 
      'entregue'
    ];
    
    if (!validStatus.includes(status)) {
      return res.status(400).json({ message: 'Status inválido' });
    }
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Verifica se o veículo existe e pertence à oficina correta
      const vehicleCheck = await client.query(`
        SELECT * FROM workshop_vehicles_in_maintenance WHERE id = $1
      `, [vehicleId]);
      
      if (vehicleCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Veículo em manutenção não encontrado' });
      }
      
      // Se for usuário de oficina, verifica se tem permissão
      if (req.user?.role === 'oficina' && vehicleCheck.rows[0].workshop_id !== req.user.oficina_id) {
        return res.status(403).json({ message: 'Você não tem permissão para modificar este veículo' });
      }
      
      // Prepara os campos para atualização
      const updateFields = ['current_status = $1'];
      const updateValues = [status];
      let paramCount = 2;
      
      // Adiciona a data de saída esperada, se fornecida
      if (expected_exit_date) {
        updateFields.push(`expected_exit_date = $${paramCount}`);
        updateValues.push(expected_exit_date);
        paramCount++;
      }
      
      // Se status for 'finalizado' ou 'entregue', adiciona a data de saída real
      if (status === 'finalizado' || status === 'entregue') {
        updateFields.push(`actual_exit_date = CURRENT_TIMESTAMP`);
      }
      
      // Adiciona as observações, se fornecidas
      if (observations) {
        updateFields.push(`observations = $${paramCount}`);
        updateValues.push(observations);
        paramCount++;
      }
      
      // Sempre atualiza o timestamp
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      
      // Executa a atualização
      await client.query(`
        UPDATE workshop_vehicles_in_maintenance
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
      `, [...updateValues, vehicleId]);
      
      // Se houver um orçamento associado e o status for 'finalizado', atualiza o orçamento também
      if (vehicleCheck.rows[0].budget_id && status === 'finalizado') {
        await client.query(`
          UPDATE workshop_budgets
          SET status = 'finalizado', updated_at = CURRENT_TIMESTAMP
          WHERE id = $1 AND status = 'aprovado'
        `, [vehicleCheck.rows[0].budget_id]);
      }
      
      await client.query('COMMIT');
      
      res.json({
        message: 'Status do veículo atualizado com sucesso',
        vehicleId,
        status
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao atualizar status do veículo:', error);
    res.status(500).json({ message: 'Erro ao atualizar status do veículo', error: (error as Error).message });
  }
});

// Dashboard para oficinas
router.get('/dashboard', authMiddleware, workshopAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Define o ID da oficina (se for admin, pode ver todos)
    let workshopId = null;
    
    if (req.user?.role === 'oficina') {
      workshopId = req.user.oficina_id;
    } else if (req.query.workshop_id) {
      workshopId = parseInt(req.query.workshop_id as string);
    }
    
    if (!workshopId) {
      return res.status(400).json({ message: 'ID da oficina não fornecido' });
    }
    
    const client = await pool.connect();
    try {
      // Estatísticas de orçamentos
      const budgetStats = await client.query(`
        SELECT 
          COUNT(*) FILTER (WHERE status = 'pendente') AS pending_count,
          COUNT(*) FILTER (WHERE status = 'aprovado') AS approved_count,
          COUNT(*) FILTER (WHERE status = 'rejeitado') AS rejected_count,
          COUNT(*) FILTER (WHERE status = 'finalizado') AS finished_count,
          COUNT(*) AS total_count,
          SUM(total_value) FILTER (WHERE status = 'aprovado' OR status = 'finalizado') AS total_approved_value,
          AVG(total_value) AS average_value
        FROM workshop_budgets
        WHERE workshop_id = $1
      `, [workshopId]);
      
      // Estatísticas de veículos em manutenção
      const vehicleStats = await client.query(`
        SELECT 
          COUNT(*) FILTER (WHERE current_status = 'aguardando_diagnostico') AS waiting_diagnosis_count,
          COUNT(*) FILTER (WHERE current_status = 'em_manutencao') AS in_maintenance_count,
          COUNT(*) FILTER (WHERE current_status = 'aguardando_pecas') AS waiting_parts_count,
          COUNT(*) FILTER (WHERE current_status = 'aguardando_aprovacao') AS waiting_approval_count,
          COUNT(*) FILTER (WHERE current_status = 'finalizado') AS finished_count,
          COUNT(*) FILTER (WHERE current_status = 'entregue') AS delivered_count,
          COUNT(*) FILTER (WHERE actual_exit_date IS NULL) AS active_count,
          COUNT(*) AS total_count
        FROM workshop_vehicles_in_maintenance
        WHERE workshop_id = $1
      `, [workshopId]);
      
      // Últimos orçamentos (5 mais recentes)
      const recentBudgets = await client.query(`
        SELECT id, vehicle_plate, maintenance_type, total_value, status, created_at
        FROM workshop_budgets
        WHERE workshop_id = $1
        ORDER BY created_at DESC
        LIMIT 5
      `, [workshopId]);
      
      // Veículos com manutenção atrasada
      const delayedVehicles = await client.query(`
        SELECT id, vehicle_plate, vehicle_model, current_status, entry_date, expected_exit_date
        FROM workshop_vehicles_in_maintenance
        WHERE workshop_id = $1
          AND expected_exit_date < CURRENT_DATE
          AND actual_exit_date IS NULL
        ORDER BY expected_exit_date ASC
      `, [workshopId]);
      
      // Construir resposta
      const dashboard = {
        budget_stats: budgetStats.rows[0],
        vehicle_stats: vehicleStats.rows[0],
        recent_budgets: recentBudgets.rows,
        delayed_vehicles: delayedVehicles.rows
      };
      
      res.json(dashboard);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error);
    res.status(500).json({ message: 'Erro ao buscar dados do dashboard', error: (error as Error).message });
  }
});

// Rota para obter oficinas pendentes de aprovação (para o dashboard)
router.get('/pending', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Apenas admin ou gestor_frota pode ver as oficinas pendentes
    if (req.user?.role !== 'admin' && req.user?.role !== 'gestor_frota') {
      return res.status(403).json({ message: 'Você não tem permissão para esta ação' });
    }
    
    const client = await pool.connect();
    try {
      // Busca as oficinas pendentes de aprovação
      const result = await client.query(`
        SELECT w.*, 
               COALESCE(wd.approval_status, 'pendente') as approval_status
        FROM workshops w
        LEFT JOIN workshop_details wd ON w.id = wd.workshop_id
        WHERE wd.approval_status = 'pendente' OR wd.approval_status IS NULL
        ORDER BY w.created_at DESC
      `);
      
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao buscar oficinas pendentes:', error);
    res.status(500).json({ message: 'Erro ao buscar oficinas pendentes', error: (error as Error).message });
  }
});

// Exporta as rotas
export default router;
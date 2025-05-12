/**
 * Rotas para o fluxo de aprovação de oficinas
 * Este módulo adiciona as rotas para listagem, aprovação e rejeição de oficinas
 */

import express, { Request, Response } from 'express';
import { pool } from '../db';
import { isAuthenticated, isFleetManager } from '../middleware/roleCheck';
import { sendEmail } from '../utils/email';
import { hash } from 'bcrypt';

const router = express.Router();

/**
 * GET /api/workshops/pending
 * Lista todas as oficinas pendentes de aprovação
 */
router.get('/pending', isAuthenticated, isFleetManager, async (req: Request, res: Response) => {
  try {
    // Busca todas as oficinas junto com seus detalhes
    const result = await pool.query(`
      SELECT w.id, w.name as nome, w.phone as telefone, w.email, w.address as endereco, w.service_type as ramoAtuacao, 
             w.created_at as dataCadastro, 
             wd.approval_status as status, wd.notes as observacoes,
             wd.bank_name as banco, wd.bank_agency as agencia, 
             wd.bank_account as conta, wd.account_type as tipoConta
      FROM workshops w
      LEFT JOIN workshop_details wd ON w.id = wd.workshop_id
      ORDER BY w.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar oficinas pendentes:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar oficinas pendentes',
      error: (error as Error).message
    });
  }
});

/**
 * GET /api/workshops/:id
 * Obtém detalhes de uma oficina específica pelo ID
 */
router.get('/:id', isAuthenticated, isFleetManager, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT w.id, w.name as nome, w.phone as telefone, w.email, w.address as endereco, w.service_type as ramoAtuacao, 
             w.created_at as dataCadastro, 
             wd.approval_status as status, wd.notes as observacoes,
             wd.bank_name as banco, wd.bank_agency as agencia, 
             wd.bank_account as conta, wd.account_type as tipoConta,
             wd.legal_representative, wd.legal_document,
             wd.insurance_details, wd.payment_terms, wd.service_warranty
      FROM workshops w
      LEFT JOIN workshop_details wd ON w.id = wd.workshop_id
      WHERE w.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Oficina não encontrada'
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter detalhes da oficina:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter detalhes da oficina',
      error: (error as Error).message
    });
  }
});

/**
 * POST /api/workshops/:id/approve
 * Aprova uma oficina
 */
router.post('/:id/approve', isAuthenticated, isFleetManager, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Verifica se a oficina existe
    const workshopResult = await pool.query(`
      SELECT w.id, w.name, w.email
      FROM workshops w
      WHERE w.id = $1
    `, [id]);

    if (workshopResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Oficina não encontrada'
      });
    }

    const workshop = workshopResult.rows[0];

    // Verificar se já existe um registro na tabela workshop_details
    const detailsCheck = await pool.query(`
      SELECT id FROM workshop_details WHERE workshop_id = $1
    `, [id]);

    if (detailsCheck.rows.length === 0) {
      // Se não existir, criar um novo registro
      await pool.query(`
        INSERT INTO workshop_details (workshop_id, approval_status, approved_by, approval_date)
        VALUES ($1, 'aprovado', $2, NOW())
      `, [id, req.user?.id]);
    } else {
      // Se existir, apenas atualizar o status
      await pool.query(`
        UPDATE workshop_details
        SET approval_status = 'aprovado', 
            approved_by = $2, 
            approval_date = NOW(),
            updated_at = NOW()
        WHERE workshop_id = $1
      `, [id, req.user?.id]);
    }

    // Cria um usuário para a oficina
    // A senha será gerada aleatoriamente e enviada por e-mail
    const randomPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await hash(randomPassword, 10);

    const userResult = await pool.query(`
      INSERT INTO users (name, email, password, role, oficina_id, is_active, last_login)
      VALUES ($1, $2, $3, 'oficina', $4, true, NULL)
      RETURNING id
    `, [workshop.name, workshop.email, hashedPassword, id]);

    // Enviar e-mail de aprovação
    const emailSubject = 'Cadastro Aprovado - Sistema de Gestão Murici Logística';
    const emailBody = `
      <h2>Parabéns! Seu cadastro foi aprovado</h2>
      <p>Sua oficina foi aprovada no sistema de gestão da Murici Logística.</p>
      <p>Você já pode acessar o sistema com as seguintes credenciais:</p>
      <p><strong>E-mail:</strong> ${workshop.email}</p>
      <p><strong>Senha:</strong> ${randomPassword}</p>
      <p>Recomendamos que altere sua senha no primeiro acesso.</p>
      <p>Acesse o sistema em: <a href="https://gestaoonfleet.com.br">https://gestaoonfleet.com.br</a></p>
      <p>Atenciosamente,<br>Equipe Murici Logística</p>
    `;

    try {
      const emailResult = await sendEmail(workshop.email, emailSubject, emailBody);
      console.log('E-mail de aprovação enviado:', emailResult);
    } catch (emailError) {
      console.error('Erro ao enviar e-mail de aprovação:', emailError);
      // Não interrompe o fluxo se o e-mail falhar
    }

    res.json({
      success: true,
      message: 'Oficina aprovada com sucesso',
      workshop_id: id
    });
  } catch (error) {
    console.error('Erro ao aprovar oficina:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao aprovar oficina',
      error: (error as Error).message
    });
  }
});

/**
 * POST /api/workshops/:id/reject
 * Rejeita uma oficina
 */
router.post('/:id/reject', isAuthenticated, isFleetManager, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    if (!motivo || motivo.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Motivo da rejeição é obrigatório'
      });
    }
    
    // Verifica se a oficina existe
    const workshopResult = await pool.query(`
      SELECT w.id, w.name, w.email
      FROM workshops w
      WHERE w.id = $1
    `, [id]);

    if (workshopResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Oficina não encontrada'
      });
    }

    const workshop = workshopResult.rows[0];

    // Verificar se já existe um registro na tabela workshop_details
    const detailsCheck = await pool.query(`
      SELECT id FROM workshop_details WHERE workshop_id = $1
    `, [id]);

    if (detailsCheck.rows.length === 0) {
      // Se não existir, criar um novo registro
      await pool.query(`
        INSERT INTO workshop_details (
          workshop_id, 
          approval_status, 
          rejection_reason, 
          approved_by, 
          approval_date
        )
        VALUES ($1, 'rejeitado', $2, $3, NOW())
      `, [id, motivo, req.user?.id]);
    } else {
      // Se existir, apenas atualizar o status
      await pool.query(`
        UPDATE workshop_details
        SET approval_status = 'rejeitado', 
            rejection_reason = $2,
            approved_by = $3, 
            approval_date = NOW(),
            updated_at = NOW()
        WHERE workshop_id = $1
      `, [id, motivo, req.user?.id]);
    }

    // Enviar e-mail de rejeição
    const emailSubject = 'Cadastro Não Aprovado - Sistema de Gestão Murici Logística';
    const emailBody = `
      <h2>Seu cadastro não foi aprovado</h2>
      <p>Infelizmente, seu cadastro no sistema de gestão da Murici Logística não foi aprovado.</p>
      <p><strong>Motivo:</strong></p>
      <p>${motivo}</p>
      <p>Se desejar, você pode entrar em contato com nossa equipe para mais informações ou para realizar um novo cadastro corrigindo as pendências indicadas.</p>
      <p>Atenciosamente,<br>Equipe Murici Logística</p>
    `;

    try {
      const emailResult = await sendEmail(workshop.email, emailSubject, emailBody);
      console.log('E-mail de rejeição enviado:', emailResult);
    } catch (emailError) {
      console.error('Erro ao enviar e-mail de rejeição:', emailError);
      // Não interrompe o fluxo se o e-mail falhar
    }

    res.json({
      success: true,
      message: 'Oficina rejeitada com sucesso',
      workshop_id: id
    });
  } catch (error) {
    console.error('Erro ao rejeitar oficina:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao rejeitar oficina',
      error: (error as Error).message
    });
  }
});

export default router;
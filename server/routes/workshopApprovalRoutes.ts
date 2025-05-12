/**
 * Rotas para o fluxo de aprovação de oficinas
 * Este módulo adiciona as rotas para listagem, aprovação e rejeição de oficinas
 */

import express, { Request, Response, NextFunction } from 'express';
import { pool } from '../db';
import { authenticateJWT } from '../middleware/auth';
import { hasRole } from '../middleware/roleCheck';
import { sendEmail } from '../utils/email';

const router = express.Router();

// Middleware para verificar permissão de gestor de frota
const isFleetManager = hasRole(['admin', 'gestor_frota']);

// Interface para representar uma oficina pendente
interface Workshop {
  id: number;
  nome: string;
  cnpj: string;
  telefone: string;
  email: string;
  endereco: string;
  ramoAtuacao: string;
  dataCadastro: Date;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  observacoes?: string;
  banco?: string;
  agencia?: string;
  conta?: string;
  tipoConta?: string;
}

/**
 * GET /api/workshops/pending
 * Lista todas as oficinas pendentes de aprovação
 */
router.get('/pending', authenticateJWT, isFleetManager, async (req: Request, res: Response) => {
  try {
    // Busca todas as oficinas no banco de dados
    const result = await pool.query(`
      SELECT 
        w.id,
        w.name as nome,
        w.phone as telefone,
        w.address as endereco,
        w.created_at as dataCadastro,
        w.contact_person as responsavel,
        w.specialties as ramoAtuacao,
        w.observations as observacoes,
        w.status,
        wd.cnpj,
        wd.email,
        wd.banco,
        wd.agencia,
        wd.conta,
        wd.tipo_conta as tipoConta
      FROM 
        workshops w
      LEFT JOIN 
        workshop_details wd ON w.id = wd.workshop_id
      ORDER BY 
        w.created_at DESC
    `);

    // Verifica se a tabela workshop_details existe
    if (result.rows.length > 0 && !result.rows[0].cnpj) {
      // Se a tabela não existe, usa apenas os dados básicos das oficinas
      const workshops = result.rows.map(row => ({
        id: row.id,
        nome: row.nome,
        cnpj: 'Não informado',
        telefone: row.telefone || 'Não informado',
        email: 'Não informado',
        endereco: row.endereco || 'Não informado',
        ramoAtuacao: row.ramoAtuacao || 'Não informado',
        dataCadastro: row.dataCadastro,
        status: row.status || 'pendente',
        observacoes: row.observacoes
      }));
      
      return res.json(workshops);
    }

    // Formata os dados para o padrão esperado pelo frontend
    const workshops = result.rows.map(row => ({
      id: row.id,
      nome: row.nome,
      cnpj: row.cnpj || 'Não informado',
      telefone: row.telefone || 'Não informado',
      email: row.email || 'Não informado',
      endereco: row.endereco || 'Não informado',
      ramoAtuacao: row.ramoAtuacao || 'Não informado',
      dataCadastro: row.dataCadastro,
      status: row.status || 'pendente',
      observacoes: row.observacoes,
      banco: row.banco,
      agencia: row.agencia,
      conta: row.conta,
      tipoConta: row.tipoConta
    }));
    
    res.json(workshops);
  } catch (error) {
    console.error('Erro ao buscar oficinas pendentes:', error);
    res.status(500).json({ message: 'Erro ao buscar oficinas pendentes' });
  }
});

/**
 * POST /api/workshops/:id/approve
 * Aprova uma oficina
 */
router.post('/:id/approve', authenticateJWT, isFleetManager, async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    // Transação para atualizar o status da oficina e criar um usuário para ela
    await pool.query('BEGIN');
    
    // 1. Atualiza o status da oficina para "aprovado"
    const result = await pool.query(`
      UPDATE workshops 
      SET status = 'aprovado', 
          is_active = true 
      WHERE id = $1 
      RETURNING id, name, contact_person, specialties
    `, [id]);
    
    if (result.rowCount === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ message: 'Oficina não encontrada' });
    }
    
    const oficina = result.rows[0];
    
    // 2. Busca o email da oficina
    const emailResult = await pool.query(`
      SELECT email FROM workshop_details WHERE workshop_id = $1
    `, [id]);
    
    let email = '';
    
    if (emailResult.rowCount > 0) {
      email = emailResult.rows[0].email;
    } else {
      // Tabela de detalhes não existe, cria um email padrão baseado no nome da oficina
      email = `oficina.${oficina.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@exemplo.com`;
    }
    
    // 3. Busca o último ID de usuário
    const lastUserResult = await pool.query(`
      SELECT MAX(id) as last_id FROM users
    `);
    
    const lastId = lastUserResult.rows[0].last_id || 0;
    const newUserId = lastId + 1;
    
    // 4. Gera uma senha aleatória
    const password = Math.random().toString(36).slice(-8);
    const passwordHash = await generatePasswordHash(password);
    
    // 5. Cria um novo usuário para a oficina
    await pool.query(`
      INSERT INTO users (
        id, name, email, password, role, oficina_id, is_active
      ) VALUES (
        $1, $2, $3, $4, 'oficina', $5, true
      )
    `, [
      newUserId,
      oficina.name,
      email,
      passwordHash,
      oficina.id
    ]);
    
    // 6. Envia email de notificação (simulado no desenvolvimento)
    const emailContent = `
      Olá ${oficina.name},
      
      Sua oficina foi aprovada no sistema de gestão de frotas.
      
      Você já pode acessar o sistema com as seguintes credenciais:
      
      Email: ${email}
      Senha: ${password}
      
      Recomendamos que você altere sua senha após o primeiro acesso.
      
      Atenciosamente,
      Equipe de Gestão de Frotas
    `;
    
    console.log('Email de aprovação enviado para:', email);
    console.log('Conteúdo do email:');
    console.log(emailContent);
    
    try {
      // Tenta enviar o email (se configurado)
      await sendEmail({
        to: email,
        subject: 'Oficina Aprovada - Acesso ao Sistema',
        text: emailContent
      });
    } catch (emailError) {
      console.error('Erro ao enviar email, mas o processo continuará:', emailError);
    }
    
    await pool.query('COMMIT');
    
    res.json({ 
      message: 'Oficina aprovada com sucesso',
      oficina: {
        id: oficina.id,
        nome: oficina.name,
        email,
        senha: password, // Apenas para desenvolvimento
        usuarioId: newUserId
      }
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Erro ao aprovar oficina:', error);
    res.status(500).json({ message: 'Erro ao aprovar oficina' });
  }
});

/**
 * POST /api/workshops/:id/reject
 * Rejeita uma oficina
 */
router.post('/:id/reject', authenticateJWT, isFleetManager, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { motivo } = req.body;
  
  if (!motivo) {
    return res.status(400).json({ message: 'O motivo da rejeição é obrigatório' });
  }
  
  try {
    // Atualiza o status da oficina para "rejeitado"
    const result = await pool.query(`
      UPDATE workshops 
      SET status = 'rejeitado', 
          observations = $1,
          is_active = false
      WHERE id = $2 
      RETURNING id, name, contact_person
    `, [motivo, id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Oficina não encontrada' });
    }
    
    const oficina = result.rows[0];
    
    // Busca o email da oficina
    const emailResult = await pool.query(`
      SELECT email FROM workshop_details WHERE workshop_id = $1
    `, [id]);
    
    if (emailResult.rowCount > 0) {
      const email = emailResult.rows[0].email;
      
      // Envia email de notificação (simulado no desenvolvimento)
      const emailContent = `
        Olá ${oficina.name},
        
        Lamentamos informar que sua solicitação de cadastro como oficina parceira foi rejeitada.
        
        Motivo: ${motivo}
        
        Caso tenha dúvidas ou queira tentar novamente, entre em contato conosco.
        
        Atenciosamente,
        Equipe de Gestão de Frotas
      `;
      
      console.log('Email de rejeição enviado para:', email);
      console.log('Conteúdo do email:');
      console.log(emailContent);
      
      try {
        // Tenta enviar o email (se configurado)
        await sendEmail({
          to: email,
          subject: 'Solicitação de Cadastro de Oficina - Não Aprovada',
          text: emailContent
        });
      } catch (emailError) {
        console.error('Erro ao enviar email, mas o processo continuará:', emailError);
      }
    }
    
    res.json({ 
      message: 'Oficina rejeitada com sucesso',
      oficina: {
        id: oficina.id,
        nome: oficina.name
      }
    });
  } catch (error) {
    console.error('Erro ao rejeitar oficina:', error);
    res.status(500).json({ message: 'Erro ao rejeitar oficina' });
  }
});

/**
 * Função auxiliar para gerar hash de senha
 */
async function generatePasswordHash(password: string): Promise<string> {
  try {
    // Importa bcrypt apenas quando necessário
    const bcrypt = require('bcrypt');
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  } catch (error) {
    console.error('Erro ao gerar hash de senha:', error);
    // Fallback para uma senha hash simulada para ambiente de desenvolvimento
    return `${password}.${Date.now()}`;
  }
}

export default router;
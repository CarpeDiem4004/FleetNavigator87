/**
 * Rotas para o registro de oficinas
 * Este módulo adiciona as rotas para registro público de oficinas
 */

import express, { Request, Response } from 'express';
import { pool } from '../db';
import { createWorkshopDetailsTable } from '../db/workshopDetailsTable';

const router = express.Router();

// Interface para os dados de cadastro da oficina
interface OficinaFormData {
  nome: string;
  cnpj: string;
  telefone: string;
  email: string;
  endereco: string;
  ramoAtuacao: string;
  banco: string;
  agencia: string;
  conta: string;
  tipoConta: string;
}

/**
 * POST /api/workshops/register
 * Registra uma nova oficina a partir do formulário público
 */
router.post('/register', async (req: Request, res: Response) => {
  const { 
    nome, cnpj, telefone, email, endereco, ramoAtuacao,
    banco, agencia, conta, tipoConta
  } = req.body as OficinaFormData;
  
  // Validação básica dos dados
  if (!nome || !cnpj || !email || !telefone || !endereco) {
    return res.status(400).json({ 
      success: false,
      message: 'Dados incompletos. Preencha todos os campos obrigatórios.'
    });
  }
  
  try {
    // Verifica se já existe uma oficina com este CNPJ
    const checkCnpj = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM workshops WHERE cnpj = $1
      )
    `, [cnpj]);
    
    if (checkCnpj.rows[0].exists) {
      return res.status(409).json({
        success: false,
        message: 'CNPJ já existente no sistema. Por favor, verifique se sua oficina já está cadastrada ou entre em contato com o suporte.'
      });
    }
    
    // Certifica que a tabela workshop_details existe
    await createWorkshopDetailsTable();
    
    // Transação para criar o registro da oficina
    await pool.query('BEGIN');
    
    // 1. Insere o registro básico na tabela workshops
    const result = await pool.query(`
      INSERT INTO workshops (
        name, 
        phone, 
        address, 
        specialties, 
        observations,
        is_active,
        cnpj,
        email,
        service_type
      ) VALUES (
        $1, $2, $3, $4, $5, false, $6, $7, $8
      ) RETURNING id
    `, [
      nome,
      telefone,
      endereco, 
      'Serviços gerais',
      'Cadastro via formulário público.', // Observações iniciais
      cnpj,
      email,
      ramoAtuacao
    ]);
    
    const workshopId = result.rows[0].id;
    
    // 2. Insere os detalhes na tabela workshop_details
    await pool.query(`
      INSERT INTO workshop_details (
        workshop_id,
        approval_status,
        bank_name,
        bank_agency,
        bank_account,
        account_type
      ) VALUES (
        $1, 'pendente', $2, $3, $4, $5
      )
    `, [
      workshopId,
      banco || null,
      agencia || null,
      conta || null,
      tipoConta || null
    ]);
    
    await pool.query('COMMIT');
    
    // Notifica os administradores (implementação futura)
    // await notifyAdmins(workshopId);
    
    res.status(201).json({
      success: true,
      message: 'Oficina cadastrada com sucesso!',
      workshopId
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Erro ao cadastrar oficina:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao cadastrar oficina. Tente novamente mais tarde.'
    });
  }
});

export default router;
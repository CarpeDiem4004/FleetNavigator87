import express from 'express';
import bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Inicializar cliente do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const router = express.Router();

// Middleware para verificar JWT
const verifyToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretpadrao');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};

// Verificar se uma oficina já existe (por CNPJ ou email)
const verificarOficinaExistente = async (cnpj: string, email: string) => {
  const { data, error } = await supabase
    .from('workshops')
    .select('*')
    .or(`cnpj.eq.${cnpj},email.eq.${email}`)
    .limit(1);

  if (error) {
    console.error('Erro ao verificar oficina:', error);
    return { erro: error };
  }

  if (data && data.length > 0) {
    if (data[0].cnpj === cnpj) {
      return { existente: true, mensagem: 'CNPJ já cadastrado no sistema' };
    } else {
      return { existente: true, mensagem: 'Email já cadastrado no sistema' };
    }
  }

  return { existente: false };
};

// Cadastrar uma nova oficina
router.post('/cadastro', async (req, res) => {
  try {
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

    // Validar dados obrigatórios
    if (!nome || !email || !telefone || !cnpj || !senha) {
      return res.status(400).json({
        success: false,
        message: 'Dados obrigatórios não fornecidos'
      });
    }

    // Verificar se a oficina já existe
    const verificacao = await verificarOficinaExistente(cnpj, email);
    if (verificacao.erro) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao verificar oficina'
      });
    }

    if (verificacao.existente) {
      return res.status(400).json({
        success: false,
        message: verificacao.mensagem
      });
    }

    // Gerar hash da senha
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    // Gerar ID único para a oficina
    const oficinaId = uuidv4();

    // Inserir oficina na tabela workshops
    const { data: dadosOficina, error: erroOficina } = await supabase
      .from('workshops')
      .insert([
        {
          id: oficinaId,
          name: nome,
          email: email,
          phone: telefone,
          address: endereco,
          city: cidade,
          state: estado,
          postal_code: cep,
          cnpj: cnpj,
          contact_name: responsavel,
          specialties: especialidades || 'Não especificado',
          is_active: true,
          created_at: new Date(),
          status: 'pendente_validacao'
        }
      ])
      .select('*')
      .single();

    if (erroOficina) {
      console.error('Erro ao cadastrar oficina:', erroOficina);
      return res.status(500).json({
        success: false,
        message: 'Erro ao cadastrar oficina no sistema',
        error: erroOficina
      });
    }

    // Inserir usuário na tabela users
    const { data: dadosUsuario, error: erroUsuario } = await supabase
      .from('users')
      .insert([
        {
          name: nome,
          email: email,
          password: senhaHash,
          role: 'oficina',
          oficina_id: oficinaId,
          is_active: true
        }
      ])
      .select('*')
      .single();

    if (erroUsuario) {
      console.error('Erro ao cadastrar usuário da oficina:', erroUsuario);
      
      // Tentar remover a oficina inserida para não deixar dados inconsistentes
      await supabase
        .from('workshops')
        .delete()
        .eq('id', oficinaId);
      
      return res.status(500).json({
        success: false,
        message: 'Erro ao cadastrar usuário da oficina',
        error: erroUsuario
      });
    }

    // Gerar token JWT de acesso
    const token = jwt.sign(
      {
        id: dadosUsuario.id,
        email: dadosUsuario.email,
        role: dadosUsuario.role,
        oficinaId: oficinaId
      },
      process.env.JWT_SECRET || 'secretpadrao',
      { expiresIn: '30d' }
    );

    // Retornar sucesso e token
    return res.status(201).json({
      success: true,
      message: 'Oficina cadastrada com sucesso',
      token,
      oficina: {
        id: dadosOficina.id,
        nome: dadosOficina.name,
        email: dadosOficina.email
      }
    });
  } catch (error) {
    console.error('Erro no cadastro de oficina:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno no servidor',
      error: error
    });
  }
});

// Rota para upload de documentos da oficina
router.post('/documentos/:oficinaId', verifyToken, async (req, res) => {
  try {
    const { oficinaId } = req.params;
    
    // Verificar se o usuário tem permissão (é a própria oficina ou um admin)
    if (req.user.role !== 'admin' && 
       (req.user.role !== 'oficina' || req.user.oficinaId !== oficinaId)) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para adicionar documentos a esta oficina'
      });
    }
    
    // Aqui implementaríamos o upload de arquivos (usando o supabase.storage)
    // Para esta versão inicial, apenas simulamos o sucesso
    
    return res.status(200).json({
      success: true,
      message: 'Documento enviado com sucesso'
    });
  } catch (error) {
    console.error('Erro no upload de documento:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno no servidor',
      error: error
    });
  }
});

// Rota para listar manutenções relacionadas a uma oficina
router.get('/manutencoes', verifyToken, async (req, res) => {
  try {
    // Verificar se o usuário é uma oficina
    if (req.user.role !== 'oficina') {
      return res.status(403).json({
        success: false,
        message: 'Acesso permitido apenas para oficinas'
      });
    }
    
    const oficinaId = req.user.oficinaId;
    
    // Buscar manutenções da oficina
    const { data, error } = await supabase
      .from('maintenance_requests')
      .select('*')
      .eq('workshop_id', oficinaId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar manutenções:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar manutenções',
        error: error
      });
    }
    
    return res.status(200).json({
      success: true,
      items: data || []
    });
  } catch (error) {
    console.error('Erro ao listar manutenções:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno no servidor',
      error: error
    });
  }
});

// Rota para atualizar status de uma manutenção
router.patch('/manutencoes/:id/status', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Verificar se o usuário é uma oficina
    if (req.user.role !== 'oficina') {
      return res.status(403).json({
        success: false,
        message: 'Acesso permitido apenas para oficinas'
      });
    }

    // Verificar se a manutenção pertence a esta oficina
    const { data: manutencao, error: erroConsulta } = await supabase
      .from('maintenance_requests')
      .select('*')
      .eq('id', id)
      .single();
    
    if (erroConsulta || !manutencao) {
      return res.status(404).json({
        success: false,
        message: 'Manutenção não encontrada'
      });
    }
    
    if (manutencao.workshop_id !== req.user.oficinaId) {
      return res.status(403).json({
        success: false,
        message: 'Esta manutenção não pertence à sua oficina'
      });
    }
    
    // Atualizar o status
    const { data, error } = await supabase
      .from('maintenance_requests')
      .update({ status: status, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar status:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar status da manutenção',
        error: error
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Status atualizado com sucesso',
      item: data
    });
  } catch (error) {
    console.error('Erro ao atualizar status de manutenção:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno no servidor',
      error: error
    });
  }
});

// Rota para criar chat de orçamento
router.post('/orcamento', verifyToken, async (req, res) => {
  try {
    const {
      maintenanceId,
      vehiclePlate,
      initialBudget,
      kmAtual,
      prazoEstimado,
      descricaoServico
    } = req.body;
    
    // Verificar se o usuário é uma oficina
    if (req.user.role !== 'oficina') {
      return res.status(403).json({
        success: false,
        message: 'Acesso permitido apenas para oficinas'
      });
    }
    
    // Gerar ID único para o orçamento
    const orcamentoId = uuidv4();
    
    // Inserir orçamento
    const { data, error } = await supabase
      .from('maintenance_budgets')
      .insert([
        {
          id: orcamentoId,
          maintenance_id: maintenanceId,
          workshop_id: req.user.oficinaId,
          value: initialBudget,
          current_km: kmAtual,
          estimated_completion: prazoEstimado,
          description: descricaoServico,
          vehicle_plate: vehiclePlate,
          status: 'pendente',
          created_at: new Date(),
          created_by: req.user.id
        }
      ])
      .select('*')
      .single();
    
    if (error) {
      console.error('Erro ao criar orçamento:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar orçamento',
        error: error
      });
    }
    
    // Atualizar o status da manutenção para "em negociação"
    await supabase
      .from('maintenance_requests')
      .update({ 
        status: 'em_negociacao',
        updated_at: new Date()
      })
      .eq('id', maintenanceId);
    
    return res.status(201).json({
      success: true,
      message: 'Orçamento criado com sucesso',
      id: orcamentoId,
      item: data
    });
  } catch (error) {
    console.error('Erro ao criar orçamento:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno no servidor',
      error: error
    });
  }
});

export default router;
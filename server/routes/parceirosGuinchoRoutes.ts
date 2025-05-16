/**
 * Rotas da API para gerenciamento de parceiros de guincho e seus serviços
 */
import express from 'express';
import { db } from '../db';
import { eq } from 'drizzle-orm';

const router = express.Router();

// Rota para listar todos os parceiros de guincho
router.get('/parceiros-guincho', async (req, res) => {
  try {
    const parceiros = await db.query.parceiros_guincho.findMany({
      orderBy: (parceiros, { desc }) => [desc(parceiros.data_cadastro)]
    });
    res.json(parceiros);
  } catch (error: any) {
    console.error('Erro ao buscar parceiros de guincho:', error);
    res.status(500).json({
      error: 'Erro ao buscar parceiros de guincho',
      message: error.message
    });
  }
});

// Rota para buscar um parceiro específico
router.get('/parceiros-guincho/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [parceiro] = await db.query.parceiros_guincho.findMany({
      where: (parceiros, { eq }) => eq(parceiros.id, id)
    });

    if (!parceiro) {
      return res.status(404).json({ error: 'Parceiro de guincho não encontrado' });
    }

    res.json(parceiro);
  } catch (error: any) {
    console.error('Erro ao buscar parceiro de guincho:', error);
    res.status(500).json({
      error: 'Erro ao buscar parceiro de guincho',
      message: error.message
    });
  }
});

// Rota para cadastrar um novo parceiro
router.post('/parceiros-guincho', async (req, res) => {
  try {
    const {
      nome,
      cnpj,
      telefone,
      email,
      endereco,
      cidade,
      estado,
      cep,
      contato_nome,
      contato_telefone,
      ativo = true
    } = req.body;

    if (!nome || !telefone || !email) {
      return res.status(400).json({ error: 'Nome, telefone e email são obrigatórios' });
    }

    const parceiro = await db.insert('parceiros_guincho').values({
      nome,
      cnpj,
      telefone,
      email,
      endereco,
      cidade,
      estado,
      cep,
      contato_nome,
      contato_telefone,
      ativo,
      data_cadastro: new Date()
    }).returning();

    res.status(201).json(parceiro[0]);
  } catch (error: any) {
    console.error('Erro ao cadastrar parceiro de guincho:', error);
    res.status(500).json({
      error: 'Erro ao cadastrar parceiro de guincho',
      message: error.message
    });
  }
});

// Rota para atualizar um parceiro
router.put('/parceiros-guincho/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const {
      nome,
      cnpj,
      telefone,
      email,
      endereco,
      cidade,
      estado,
      cep,
      contato_nome,
      contato_telefone,
      ativo
    } = req.body;

    const [parceiro] = await db.select().from('parceiros_guincho').where(eq('parceiros_guincho.id', id));

    if (!parceiro) {
      return res.status(404).json({ error: 'Parceiro de guincho não encontrado' });
    }

    const parceiroAtualizado = await db.update('parceiros_guincho')
      .set({
        nome,
        cnpj,
        telefone,
        email,
        endereco,
        cidade,
        estado,
        cep,
        contato_nome,
        contato_telefone,
        ativo
      })
      .where(eq('parceiros_guincho.id', id))
      .returning();

    res.json(parceiroAtualizado[0]);
  } catch (error: any) {
    console.error('Erro ao atualizar parceiro de guincho:', error);
    res.status(500).json({
      error: 'Erro ao atualizar parceiro de guincho',
      message: error.message
    });
  }
});

// Rota para listar todos os serviços de guincho
router.get('/servicos-guincho', async (req, res) => {
  try {
    const servicos = await db.query.servicos_guincho.findMany({
      orderBy: (servicos, { desc }) => [desc(servicos.data_lancamento)]
    });
    res.json(servicos);
  } catch (error: any) {
    console.error('Erro ao buscar serviços de guincho:', error);
    res.status(500).json({
      error: 'Erro ao buscar serviços de guincho',
      message: error.message
    });
  }
});

// Rota para cadastrar um novo serviço
router.post('/servicos-guincho', async (req, res) => {
  try {
    const {
      parceiro_id,
      placa_veiculo,
      modelo_veiculo,
      endereco_origem,
      endereco_destino,
      quilometragem,
      valor,
      data_servico,
      observacoes
    } = req.body;

    if (!parceiro_id || !placa_veiculo || !endereco_origem || !endereco_destino || !valor) {
      return res.status(400).json({ 
        error: 'Parceiro, placa do veículo, endereços de origem e destino, e valor são obrigatórios' 
      });
    }

    // Verificar se o parceiro existe
    const [parceiro] = await db.select().from('parceiros_guincho').where(eq('parceiros_guincho.id', parceiro_id));

    if (!parceiro) {
      return res.status(404).json({ error: 'Parceiro de guincho não encontrado' });
    }

    const servico = await db.insert('servicos_guincho').values({
      parceiro_id,
      placa_veiculo,
      modelo_veiculo,
      endereco_origem,
      endereco_destino,
      quilometragem,
      valor,
      data_servico: new Date(data_servico),
      data_lancamento: new Date(),
      status: 'pendente',
      observacoes
    }).returning();

    res.status(201).json(servico[0]);
  } catch (error: any) {
    console.error('Erro ao cadastrar serviço de guincho:', error);
    res.status(500).json({
      error: 'Erro ao cadastrar serviço de guincho',
      message: error.message
    });
  }
});

// Rota para atualizar o status de um serviço
router.patch('/servicos-guincho/:id/status', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, motivo_negacao } = req.body;

    if (!['aprovado', 'em_analise', 'negado'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const [servico] = await db.select().from('servicos_guincho').where(eq('servicos_guincho.id', id));

    if (!servico) {
      return res.status(404).json({ error: 'Serviço de guincho não encontrado' });
    }

    // Se o status for "negado", o motivo da negação é obrigatório
    if (status === 'negado' && !motivo_negacao) {
      return res.status(400).json({ error: 'Motivo da negação é obrigatório para status "negado"' });
    }

    const servicoAtualizado = await db.update('servicos_guincho')
      .set({
        status,
        motivo_negacao: status === 'negado' ? motivo_negacao : null,
        data_aprovacao: new Date(),
        usuario_aprovacao: req.user?.id // Obter o ID do usuário logado
      })
      .where(eq('servicos_guincho.id', id))
      .returning();

    res.json(servicoAtualizado[0]);
  } catch (error: any) {
    console.error('Erro ao atualizar status do serviço de guincho:', error);
    res.status(500).json({
      error: 'Erro ao atualizar status do serviço de guincho',
      message: error.message
    });
  }
});

export default router;
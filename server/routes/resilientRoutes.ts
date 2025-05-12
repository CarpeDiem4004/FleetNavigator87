/**
 * Rotas resilientes universais para todos os módulos do sistema
 * Garante a persistência dos dados no Supabase mesmo durante falhas
 */

import { Router, Request, Response } from 'express';
import { universalPersistenceService } from '../api/universalPersistenceService';
import { isAuthenticated as isAuth } from '../middleware/auth';
import multasService from '../services/multasService';
import manutencaoService from '../services/manutencaoService';
import pneusService from '../services/pneusService';

const router = Router();

// Middleware de autenticação para todas as rotas
router.use(isAuth);

/**
 * Rota para verificar status do sistema de persistência
 * GET /api/resilient/status
 */
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const isConnected = await universalPersistenceService.checkConnection();
    const pendingOperations = universalPersistenceService.countPendingOperations();
    
    return res.json({
      success: true,
      connected: isConnected,
      pendingOperations,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[API Resiliente] Erro ao verificar status:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao verificar status do sistema',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para forçar processamento de operações pendentes
 * POST /api/resilient/process
 */
router.post('/process', async (_req: Request, res: Response) => {
  try {
    const result = await universalPersistenceService.forceProcessPendingOperations();
    
    return res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[API Resiliente] Erro ao processar operações pendentes:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao processar operações pendentes',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// =============================================================================
// ROTAS PARA MULTAS
// =============================================================================

/**
 * Rota para listar multas
 * GET /api/resilient/multas
 */
router.get('/multas', async (req: Request, res: Response) => {
  try {
    const baseId = req.query.baseId ? Number(req.query.baseId) : undefined;
    const status = req.query.status as string | undefined;
    const placa = req.query.placa as string | undefined;
    
    let multas: any[] = [];
    
    if (baseId) {
      multas = await multasService.getMultasPorBase(baseId);
    } else if (status) {
      multas = await multasService.getMultasPorStatusCiclo(status);
    } else if (placa) {
      multas = await multasService.getMultasPorVeiculo(placa);
    } else {
      // Filtros compostos
      const filtros: Record<string, any> = {};
      if (req.query.baseId) filtros.base_id = Number(req.query.baseId);
      if (req.query.status) filtros.lifecycle = req.query.status;
      if (req.query.placa) filtros.veiculo_placa = req.query.placa;
      
      multas = await multasService.getMultas(filtros);
    }
    
    return res.json({
      success: true,
      data: multas,
      count: multas.length
    });
  } catch (error) {
    console.error('[API Resiliente] Erro ao listar multas:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar multas',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para obter uma multa pelo ID
 * GET /api/resilient/multas/:id
 */
router.get('/multas/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    
    const [multa] = await multasService.getMultas({ id });
    
    if (!multa) {
      return res.status(404).json({
        success: false,
        message: `Multa com ID ${id} não encontrada`
      });
    }
    
    // Carregar histórico do ciclo de vida
    const historico = await multasService.getHistoricoCicloVida(id);
    
    return res.json({
      success: true,
      data: { ...multa, historico }
    });
  } catch (error) {
    console.error('[API Resiliente] Erro ao obter multa:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao obter multa',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para registrar uma nova multa
 * POST /api/resilient/multas
 */
router.post('/multas', async (req: Request, res: Response) => {
  try {
    const dados = req.body;
    
    const multa = await multasService.registrarMulta(dados);
    
    return res.status(201).json({
      success: true,
      message: 'Multa registrada com sucesso',
      data: multa
    });
  } catch (error) {
    console.error('[API Resiliente] Erro ao registrar multa:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao registrar multa',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para atualizar uma multa
 * PUT /api/resilient/multas/:id
 */
router.put('/multas/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const dados = req.body;
    
    const multa = await multasService.atualizarMulta(id, dados);
    
    return res.json({
      success: true,
      message: 'Multa atualizada com sucesso',
      data: multa
    });
  } catch (error) {
    console.error('[API Resiliente] Erro ao atualizar multa:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar multa',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para atualizar o status do ciclo de vida de uma multa
 * PUT /api/resilient/multas/:id/status
 */
router.put('/multas/:id/status', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { status, observacao } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status é obrigatório'
      });
    }
    
    const multa = await multasService.atualizarStatus(id, status, observacao);
    
    return res.json({
      success: true,
      message: `Status da multa atualizado para ${status}`,
      data: multa
    });
  } catch (error) {
    console.error('[API Resiliente] Erro ao atualizar status da multa:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar status da multa',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para adicionar documento à multa
 * POST /api/resilient/multas/:id/documentos
 */
router.post('/multas/:id/documentos', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { tipo, url, observacao } = req.body;
    
    if (!tipo || !url) {
      return res.status(400).json({
        success: false,
        message: 'Tipo e URL do documento são obrigatórios'
      });
    }
    
    const documento = await multasService.adicionarDocumento(id, tipo, url, observacao);
    
    return res.status(201).json({
      success: true,
      message: 'Documento adicionado com sucesso',
      data: documento
    });
  } catch (error) {
    console.error('[API Resiliente] Erro ao adicionar documento à multa:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao adicionar documento à multa',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para registrar assinatura do motorista
 * POST /api/resilient/multas/:id/assinatura
 */
router.post('/multas/:id/assinatura', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { assinaturaUrl, motoristaNome } = req.body;
    
    if (!assinaturaUrl || !motoristaNome) {
      return res.status(400).json({
        success: false,
        message: 'URL da assinatura e nome do motorista são obrigatórios'
      });
    }
    
    const assinatura = await multasService.registrarAssinatura(
      id, 
      assinaturaUrl, 
      motoristaNome
    );
    
    return res.status(201).json({
      success: true,
      message: 'Assinatura registrada com sucesso',
      data: assinatura
    });
  } catch (error) {
    console.error('[API Resiliente] Erro ao registrar assinatura:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao registrar assinatura',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// =============================================================================
// ROTAS PARA MANUTENÇÕES
// =============================================================================

/**
 * Rota para listar manutenções
 * GET /api/resilient/manutencoes
 */
router.get('/manutencoes', async (req: Request, res: Response) => {
  try {
    const baseId = req.query.baseId ? Number(req.query.baseId) : undefined;
    const status = req.query.status as string | undefined;
    const placa = req.query.placa as string | undefined;
    
    let manutencoes: any[] = [];
    
    if (baseId) {
      manutencoes = await manutencaoService.getManutencoesPorBase(baseId);
    } else if (status) {
      manutencoes = await manutencaoService.getManutencoesPorStatus(status);
    } else if (placa) {
      manutencoes = await manutencaoService.getManutencoesVeiculo(placa);
    } else {
      // Filtros compostos
      const filtros: Record<string, any> = {};
      if (req.query.baseId) filtros.base_id = Number(req.query.baseId);
      if (req.query.status) filtros.status = req.query.status;
      if (req.query.placa) filtros.placa = req.query.placa;
      
      manutencoes = await manutencaoService.getManutencoes(filtros);
    }
    
    return res.json({
      success: true,
      data: manutencoes,
      count: manutencoes.length
    });
  } catch (error) {
    console.error('[API Resiliente] Erro ao listar manutenções:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar manutenções',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para obter uma manutenção pelo ID
 * GET /api/resilient/manutencoes/:id
 */
router.get('/manutencoes/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    
    const [manutencao] = await manutencaoService.getManutencoes({ id });
    
    if (!manutencao) {
      return res.status(404).json({
        success: false,
        message: `Manutenção com ID ${id} não encontrada`
      });
    }
    
    // Carregar histórico
    const historico = await manutencaoService.getHistorico(id);
    
    return res.json({
      success: true,
      data: { ...manutencao, historico }
    });
  } catch (error) {
    console.error('[API Resiliente] Erro ao obter manutenção:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao obter manutenção',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para registrar uma nova manutenção
 * POST /api/resilient/manutencoes
 */
router.post('/manutencoes', async (req: Request, res: Response) => {
  try {
    const dados = req.body;
    
    const manutencao = await manutencaoService.registrarManutencao(dados);
    
    return res.status(201).json({
      success: true,
      message: 'Manutenção registrada com sucesso',
      data: manutencao
    });
  } catch (error) {
    console.error('[API Resiliente] Erro ao registrar manutenção:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao registrar manutenção',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para atualizar uma manutenção
 * PUT /api/resilient/manutencoes/:id
 */
router.put('/manutencoes/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const dados = req.body;
    
    const manutencao = await manutencaoService.atualizarManutencao(id, dados);
    
    return res.json({
      success: true,
      message: 'Manutenção atualizada com sucesso',
      data: manutencao
    });
  } catch (error) {
    console.error('[API Resiliente] Erro ao atualizar manutenção:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar manutenção',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para atualizar o status de uma manutenção
 * PUT /api/resilient/manutencoes/:id/status
 */
router.put('/manutencoes/:id/status', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { status, observacao } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status é obrigatório'
      });
    }
    
    const manutencao = await manutencaoService.atualizarStatus(id, status, observacao);
    
    return res.json({
      success: true,
      message: `Status da manutenção atualizado para ${status}`,
      data: manutencao
    });
  } catch (error) {
    console.error('[API Resiliente] Erro ao atualizar status da manutenção:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar status da manutenção',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para adicionar um item à manutenção
 * POST /api/resilient/manutencoes/:id/itens
 */
router.post('/manutencoes/:id/itens', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { nome, quantidade, valorUnitario, observacao } = req.body;
    
    if (!nome || !quantidade || !valorUnitario) {
      return res.status(400).json({
        success: false,
        message: 'Nome, quantidade e valor unitário são obrigatórios'
      });
    }
    
    const item = await manutencaoService.adicionarItem(
      id, 
      nome, 
      Number(quantidade), 
      Number(valorUnitario), 
      observacao
    );
    
    return res.status(201).json({
      success: true,
      message: 'Item adicionado com sucesso',
      data: item
    });
  } catch (error) {
    console.error('[API Resiliente] Erro ao adicionar item à manutenção:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao adicionar item à manutenção',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para adicionar um anexo à manutenção
 * POST /api/resilient/manutencoes/:id/anexos
 */
router.post('/manutencoes/:id/anexos', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { tipo, url, descricao } = req.body;
    
    if (!tipo || !url) {
      return res.status(400).json({
        success: false,
        message: 'Tipo e URL do anexo são obrigatórios'
      });
    }
    
    const anexo = await manutencaoService.adicionarAnexo(id, tipo, url, descricao);
    
    return res.status(201).json({
      success: true,
      message: 'Anexo adicionado com sucesso',
      data: anexo
    });
  } catch (error) {
    console.error('[API Resiliente] Erro ao adicionar anexo à manutenção:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao adicionar anexo à manutenção',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para solicitar uma manutenção
 * POST /api/resilient/manutencoes/solicitacoes
 */
router.post('/manutencoes/solicitacoes', async (req: Request, res: Response) => {
  try {
    const dados = req.body;
    
    const solicitacao = await manutencaoService.registrarSolicitacao(dados);
    
    return res.status(201).json({
      success: true,
      message: 'Solicitação de manutenção registrada com sucesso',
      data: solicitacao
    });
  } catch (error) {
    console.error('[API Resiliente] Erro ao registrar solicitação de manutenção:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao registrar solicitação de manutenção',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para listar solicitações de manutenção
 * GET /api/resilient/manutencoes/solicitacoes
 */
router.get('/manutencoes/solicitacoes', async (req: Request, res: Response) => {
  try {
    const filtros: Record<string, any> = {};
    
    if (req.query.status) filtros.status = req.query.status;
    if (req.query.baseId) filtros.base_id = Number(req.query.baseId);
    
    const solicitacoes = await manutencaoService.getSolicitacoes(filtros);
    
    return res.json({
      success: true,
      data: solicitacoes,
      count: solicitacoes.length
    });
  } catch (error) {
    console.error('[API Resiliente] Erro ao listar solicitações de manutenção:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar solicitações de manutenção',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// =============================================================================
// ROTAS PARA PNEUS
// =============================================================================

/**
 * Rota para listar pneus
 * GET /api/resilient/pneus
 */
router.get('/pneus', async (req: Request, res: Response) => {
  try {
    const baseId = req.query.baseId ? Number(req.query.baseId) : undefined;
    const status = req.query.status as string | undefined;
    const placa = req.query.placa as string | undefined;
    
    let pneus: any[] = [];
    
    if (baseId) {
      pneus = await pneusService.getPneusPorBase(baseId);
    } else if (status) {
      pneus = await pneusService.getPneusPorStatus(status);
    } else if (placa) {
      pneus = await pneusService.getPneusPorVeiculo(placa);
    } else {
      // Filtros compostos
      const filtros: Record<string, any> = {};
      if (req.query.baseId) filtros.base_id = Number(req.query.baseId);
      if (req.query.status) filtros.status = req.query.status;
      if (req.query.placa) filtros.veiculo_placa = req.query.placa;
      if (req.query.codigo) filtros.codigo = req.query.codigo;
      
      pneus = await pneusService.getPneus(filtros);
    }
    
    return res.json({
      success: true,
      data: pneus,
      count: pneus.length
    });
  } catch (error) {
    console.error('[API Resiliente] Erro ao listar pneus:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar pneus',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para obter um pneu pelo ID
 * GET /api/resilient/pneus/:id
 */
router.get('/pneus/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    
    const [pneu] = await pneusService.getPneus({ id });
    
    if (!pneu) {
      return res.status(404).json({
        success: false,
        message: `Pneu com ID ${id} não encontrado`
      });
    }
    
    // Carregar histórico e medições
    const historico = await pneusService.getHistorico(id);
    const medicoes = await pneusService.getMedicoes(id);
    
    return res.json({
      success: true,
      data: { ...pneu, historico, medicoes }
    });
  } catch (error) {
    console.error('[API Resiliente] Erro ao obter pneu:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao obter pneu',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para registrar um novo pneu
 * POST /api/resilient/pneus
 */
router.post('/pneus', async (req: Request, res: Response) => {
  try {
    const dados = req.body;
    
    const pneu = await pneusService.registrarPneu(dados);
    
    return res.status(201).json({
      success: true,
      message: 'Pneu registrado com sucesso',
      data: pneu
    });
  } catch (error) {
    console.error('[API Resiliente] Erro ao registrar pneu:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao registrar pneu',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para atualizar um pneu
 * PUT /api/resilient/pneus/:id
 */
router.put('/pneus/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const dados = req.body;
    
    const pneu = await pneusService.atualizarPneu(id, dados);
    
    return res.json({
      success: true,
      message: 'Pneu atualizado com sucesso',
      data: pneu
    });
  } catch (error) {
    console.error('[API Resiliente] Erro ao atualizar pneu:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar pneu',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para atualizar o status de um pneu
 * PUT /api/resilient/pneus/:id/status
 */
router.put('/pneus/:id/status', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { status, observacao } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status é obrigatório'
      });
    }
    
    const pneu = await pneusService.atualizarStatus(id, status, observacao);
    
    return res.json({
      success: true,
      message: `Status do pneu atualizado para ${status}`,
      data: pneu
    });
  } catch (error) {
    console.error('[API Resiliente] Erro ao atualizar status do pneu:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar status do pneu',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para associar pneu a um veículo
 * PUT /api/resilient/pneus/:id/associar-veiculo
 */
router.put('/pneus/:id/associar-veiculo', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { veiculoPlaca, posicao, observacao } = req.body;
    
    if (!veiculoPlaca || !posicao) {
      return res.status(400).json({
        success: false,
        message: 'Placa do veículo e posição são obrigatórios'
      });
    }
    
    const pneu = await pneusService.associarVeiculo(
      id, 
      veiculoPlaca, 
      posicao, 
      observacao
    );
    
    return res.json({
      success: true,
      message: `Pneu associado ao veículo ${veiculoPlaca}`,
      data: pneu
    });
  } catch (error) {
    console.error('[API Resiliente] Erro ao associar pneu a veículo:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao associar pneu a veículo',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para desassociar pneu de um veículo
 * PUT /api/resilient/pneus/:id/desassociar-veiculo
 */
router.put('/pneus/:id/desassociar-veiculo', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { motivo, observacao } = req.body;
    
    if (!motivo) {
      return res.status(400).json({
        success: false,
        message: 'Motivo da desassociação é obrigatório'
      });
    }
    
    const pneu = await pneusService.desassociarVeiculo(id, motivo, observacao);
    
    return res.json({
      success: true,
      message: 'Pneu desassociado do veículo',
      data: pneu
    });
  } catch (error) {
    console.error('[API Resiliente] Erro ao desassociar pneu de veículo:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao desassociar pneu de veículo',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para transferir pneu para outra base
 * PUT /api/resilient/pneus/:id/transferir-base
 */
router.put('/pneus/:id/transferir-base', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { baseIdDestino, baseNomeDestino, observacao } = req.body;
    
    if (!baseIdDestino || !baseNomeDestino) {
      return res.status(400).json({
        success: false,
        message: 'ID e nome da base de destino são obrigatórios'
      });
    }
    
    const pneu = await pneusService.transferirBase(
      id, 
      Number(baseIdDestino), 
      baseNomeDestino, 
      observacao
    );
    
    return res.json({
      success: true,
      message: `Pneu transferido para a base ${baseNomeDestino}`,
      data: pneu
    });
  } catch (error) {
    console.error('[API Resiliente] Erro ao transferir pneu para outra base:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao transferir pneu para outra base',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para registrar medição de pneu
 * POST /api/resilient/pneus/:id/medicoes
 */
router.post('/pneus/:id/medicoes', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { profundidadeSulco, pressao, observacao } = req.body;
    
    if (profundidadeSulco === undefined || pressao === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Profundidade do sulco e pressão são obrigatórios'
      });
    }
    
    const medicao = await pneusService.registrarMedicao(
      id, 
      Number(profundidadeSulco),
      Number(pressao),
      observacao
    );
    
    return res.status(201).json({
      success: true,
      message: 'Medição registrada com sucesso',
      data: medicao
    });
  } catch (error) {
    console.error('[API Resiliente] Erro ao registrar medição de pneu:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao registrar medição de pneu',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para registrar solicitação de pneus
 * POST /api/resilient/pneus/solicitacoes
 */
router.post('/pneus/solicitacoes', async (req: Request, res: Response) => {
  try {
    const dados = req.body;
    
    const solicitacao = await pneusService.registrarSolicitacao(dados);
    
    return res.status(201).json({
      success: true,
      message: 'Solicitação de pneus registrada com sucesso',
      data: solicitacao
    });
  } catch (error) {
    console.error('[API Resiliente] Erro ao registrar solicitação de pneus:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao registrar solicitação de pneus',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para listar solicitações de pneus
 * GET /api/resilient/pneus/solicitacoes
 */
router.get('/pneus/solicitacoes', async (req: Request, res: Response) => {
  try {
    const filtros: Record<string, any> = {};
    
    if (req.query.status) filtros.status = req.query.status;
    if (req.query.baseId) filtros.base_id = Number(req.query.baseId);
    
    const solicitacoes = await pneusService.getSolicitacoes(filtros);
    
    return res.json({
      success: true,
      data: solicitacoes,
      count: solicitacoes.length
    });
  } catch (error) {
    console.error('[API Resiliente] Erro ao listar solicitações de pneus:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar solicitações de pneus',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para obter itens de uma solicitação de pneus
 * GET /api/resilient/pneus/solicitacoes/:id/itens
 */
router.get('/pneus/solicitacoes/:id/itens', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    
    const itens = await pneusService.getItensSolicitacao(id);
    
    return res.json({
      success: true,
      data: itens,
      count: itens.length
    });
  } catch (error) {
    console.error('[API Resiliente] Erro ao obter itens da solicitação de pneus:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao obter itens da solicitação de pneus',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para atualizar status de uma solicitação de pneus
 * PUT /api/resilient/pneus/solicitacoes/:id/status
 */
router.put('/pneus/solicitacoes/:id/status', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { status, observacao } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status é obrigatório'
      });
    }
    
    const solicitacao = await pneusService.atualizarStatusSolicitacao(id, status, observacao);
    
    return res.json({
      success: true,
      message: `Status da solicitação atualizado para ${status}`,
      data: solicitacao
    });
  } catch (error) {
    console.error('[API Resiliente] Erro ao atualizar status da solicitação de pneus:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar status da solicitação de pneus',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
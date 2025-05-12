/**
 * Rotas resilientes para postos com persistência confiável
 * Implementa endpoints que garantem que os dados sejam salvos mesmo com problemas
 */

import { Router, Request, Response } from 'express';
import { postoService } from '../services/postoService';

const router = Router();

/**
 * Rota para obter configuração de tanques
 * GET /api/resilient/posto/:nome/configuracao-tanques
 */
router.get('/posto/:nome/configuracao-tanques', async (req: Request, res: Response) => {
  try {
    const nomePosto = req.params.nome;
    const configuracao = await postoService.getConfiguracaoTanques(nomePosto);
    
    if (!configuracao) {
      return res.status(404).json({
        success: false,
        message: `Configuração de tanques não encontrada para posto ${nomePosto}`
      });
    }
    
    return res.json({
      success: true,
      data: configuracao
    });
  } catch (error) {
    console.error('Erro ao buscar configuração de tanques:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar configuração de tanques',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para atualizar configuração de tanques
 * POST /api/resilient/posto/:nome/configuracao-tanques
 */
router.post('/posto/:nome/configuracao-tanques', async (req: Request, res: Response) => {
  try {
    const nomePosto = req.params.nome;
    const configuracao = req.body;
    
    // Garantir que o nome do posto no corpo da requisição corresponde ao parâmetro da URL
    configuracao.posto = nomePosto;
    
    const result = await postoService.salvarConfiguracaoTanques(configuracao);
    
    if (!result) {
      return res.status(500).json({
        success: false,
        message: 'Falha ao salvar configuração de tanques'
      });
    }
    
    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erro ao salvar configuração de tanques:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao salvar configuração de tanques',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para registrar abastecimento
 * POST /api/resilient/posto/:nome/abastecimento
 */
router.post('/posto/:nome/abastecimento', async (req: Request, res: Response) => {
  try {
    const nomePosto = req.params.nome;
    const abastecimento = req.body;
    
    const result = await postoService.registrarAbastecimento(abastecimento, nomePosto);
    
    if (!result) {
      return res.status(500).json({
        success: false,
        message: 'Falha ao registrar abastecimento'
      });
    }
    
    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erro ao registrar abastecimento:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao registrar abastecimento',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para registrar recebimento de combustível
 * POST /api/resilient/posto/:nome/recebimento
 */
router.post('/posto/:nome/recebimento', async (req: Request, res: Response) => {
  try {
    const nomePosto = req.params.nome;
    const recebimento = req.body;
    
    const result = await postoService.registrarRecebimentoCombustivel(recebimento, nomePosto);
    
    if (!result) {
      return res.status(500).json({
        success: false,
        message: 'Falha ao registrar recebimento de combustível'
      });
    }
    
    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erro ao registrar recebimento de combustível:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao registrar recebimento de combustível',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para registrar movimentação de pátio
 * POST /api/resilient/posto/:nome/movimentacao-patio
 */
router.post('/posto/:nome/movimentacao-patio', async (req: Request, res: Response) => {
  try {
    const nomePosto = req.params.nome;
    const movimentacao = req.body;
    
    const result = await postoService.registrarMovimentacaoPatio(movimentacao, nomePosto);
    
    if (!result) {
      return res.status(500).json({
        success: false,
        message: 'Falha ao registrar movimentação de pátio'
      });
    }
    
    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erro ao registrar movimentação de pátio:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao registrar movimentação de pátio',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para obter abastecimentos
 * GET /api/resilient/posto/:nome/abastecimentos
 */
router.get('/posto/:nome/abastecimentos', async (req: Request, res: Response) => {
  try {
    const nomePosto = req.params.nome;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    
    const abastecimentos = await postoService.getAbastecimentos(nomePosto, limit);
    
    return res.json({
      success: true,
      count: abastecimentos.length,
      data: abastecimentos
    });
  } catch (error) {
    console.error('Erro ao buscar abastecimentos:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar abastecimentos',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para obter recebimentos de combustível
 * GET /api/resilient/posto/:nome/recebimentos
 */
router.get('/posto/:nome/recebimentos', async (req: Request, res: Response) => {
  try {
    const nomePosto = req.params.nome;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    
    const recebimentos = await postoService.getRecebimentos(nomePosto, limit);
    
    return res.json({
      success: true,
      count: recebimentos.length,
      data: recebimentos
    });
  } catch (error) {
    console.error('Erro ao buscar recebimentos:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar recebimentos',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para obter movimentações de pátio
 * GET /api/resilient/posto/:nome/movimentacoes-patio
 */
router.get('/posto/:nome/movimentacoes-patio', async (req: Request, res: Response) => {
  try {
    const nomePosto = req.params.nome;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    
    const movimentacoes = await postoService.getMovimentacoesPatio(nomePosto, limit);
    
    return res.json({
      success: true,
      count: movimentacoes.length,
      data: movimentacoes
    });
  } catch (error) {
    console.error('Erro ao buscar movimentações de pátio:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar movimentações de pátio',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para verificar status da conexão
 * GET /api/resilient/status
 */
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const isConnected = await postoService['dataService'].checkConnection();
    
    return res.json({
      success: true,
      connected: isConnected,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao verificar status da conexão:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao verificar status da conexão',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota especial para compatibilidade com o frontend
 * POST /api/resilient/abastecimento-direto/:posto
 */
router.post('/abastecimento-direto/:posto', async (req: Request, res: Response) => {
  try {
    const nomePosto = req.params.posto;
    const abastecimento = req.body;
    
    console.log(`[API Resiliente] Recebendo abastecimento via rota compatível para posto: ${nomePosto}`);
    
    const result = await postoService.registrarAbastecimento(abastecimento, nomePosto);
    
    if (!result) {
      return res.status(500).json({
        success: false,
        message: 'Falha ao registrar abastecimento'
      });
    }
    
    return res.json({
      success: true,
      message: 'Abastecimento registrado com sucesso',
      data: result
    });
  } catch (error) {
    console.error('Erro ao registrar abastecimento via rota compatível:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao registrar abastecimento',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Rota para obter histórico direto
 * GET /api/resilient/historico-direto/:posto
 */
router.get('/historico-direto/:posto', async (req: Request, res: Response) => {
  try {
    const nomePosto = req.params.posto.replace('posto ', ''); // Remove "posto " do início
    console.log(`[API Resiliente] Buscando histórico direto para posto: ${nomePosto}`);
    
    // Padronização do nome do posto (para formatos como "posto campinas_v2" ou só "campinas_v2")
    const postoNormalizado = nomePosto
      .replace(/\s+/g, '_') // Substituir espaços por underscore
      .replace(/^(posto_|posto\s+)/i, '') // Remover prefixo "posto_" ou "posto "
      .toLowerCase(); // Normalizar para minúsculas
      
    // Capitalizar a primeira letra de cada palavra separada por underscore
    const postoParts = postoNormalizado.split('_');
    const postoCapitalizado = postoParts
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('_');
    
    console.log(`[API Resiliente] Buscando histórico para posto normalizado: ${postoCapitalizado}`);
    
    const abastecimentos = await postoService.getAbastecimentos(postoCapitalizado);
    
    return res.json({
      success: true,
      data: abastecimentos || [],
      count: abastecimentos?.length || 0
    });
  } catch (error) {
    console.error(`[API Resiliente] Erro ao buscar histórico direto:`, error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar histórico direto',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
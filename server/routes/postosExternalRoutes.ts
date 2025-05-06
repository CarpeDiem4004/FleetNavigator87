/**
 * Rotas específicas para acesso externo de postos pelo domínio personalizado
 * Estas rotas facilitam o acesso direto através de links como gestaoonfleet.com.br/postos
 */

import { Router } from 'express';
import { pool } from '../db';

const router = Router();

// Middleware para verificar se a requisição vem do domínio personalizado
const verificarDominioPersonalizado = (req, res, next) => {
  const isExternalDomain = req.hostname.includes('gestaoonfleet.com.br');
  
  if (isExternalDomain) {
    console.log(`[PostosExternalRoutes] Acesso pelo domínio personalizado: ${req.hostname}${req.path}`);
    return next();
  }
  
  // Se não for o domínio personalizado, retorna erro
  return res.status(403).json({ 
    success: false, 
    message: "Esta rota só pode ser acessada através do domínio gestaoonfleet.com.br"
  });
};

// Aplicar o middleware de verificação de domínio a todas as rotas
router.use(verificarDominioPersonalizado);

// Rota para página inicial dos postos através do domínio personalizado
router.get('/', async (req, res) => {
  try {
    // Buscar lista de postos disponíveis
    const query = `
      SELECT * 
      FROM postos_mapeamento 
      WHERE ativo = true 
      ORDER BY nome_para_exibicao
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      message: "Lista de postos disponíveis para acesso externo",
      data: result.rows
    });
  } catch (error) {
    console.error("[PostosExternalRoutes] Erro ao buscar postos do mapeamento:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar postos do mapeamento",
      error: String(error)
    });
  }
});

// Rota para acesso a um posto específico através do domínio personalizado
router.get('/:posto', async (req, res) => {
  try {
    const nomePosto = req.params.posto;
    
    // Buscar informações do posto
    const query = {
      text: `
        SELECT * 
        FROM postos_mapeamento 
        WHERE LOWER(nome) = LOWER($1) 
        OR LOWER(nome_para_exibicao) = LOWER($1) 
        OR LOWER(nome_link) = LOWER($1)
        LIMIT 1
      `,
      values: [nomePosto]
    };
    
    const result = await pool.query(query);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Posto '${nomePosto}' não encontrado`
      });
    }
    
    // Se encontrou o posto, retorna suas informações
    const posto = result.rows[0];
    
    res.json({
      success: true,
      message: `Informações do posto ${posto.nome_para_exibicao}`,
      data: posto,
      access: {
        url: `/posto/${posto.nome_link || posto.nome.toLowerCase()}`,
        publicUrl: `/posto/${posto.nome_link || posto.nome.toLowerCase()}/public`
      }
    });
  } catch (error) {
    console.error(`[PostosExternalRoutes] Erro ao buscar informações do posto ${req.params.posto}:`, error);
    res.status(500).json({
      success: false,
      message: `Erro ao buscar informações do posto ${req.params.posto}`,
      error: String(error)
    });
  }
});

export default router;
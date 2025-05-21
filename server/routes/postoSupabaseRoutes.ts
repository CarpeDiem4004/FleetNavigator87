import { Router } from 'express';
import { pool } from '../db';
import { formatarNomePosto, formatarNomeTabela } from '../utils/posto-utils';

const router = Router();

/**
 * Normaliza o nome do posto para o formato usado nas tabelas
 * @param posto Nome do posto
 * @returns Nome normalizado para uso em nome de tabela
 */
function normalizarNomePosto(posto: string): string {
  return formatarNomePosto(posto).toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Obtém o nome da tabela para um posto específico
 * @param posto Nome do posto
 * @returns Nome da tabela formatado
 */
function obterNomeTabela(posto: string): string {
  return formatarNomeTabela(posto);
}

/**
 * Verifica se a tabela do posto existe no banco de dados
 * @param nomePosto Nome do posto
 * @returns Promise<boolean> que indica se a tabela existe
 */
async function verificarTabelaExiste(nomePosto: string): Promise<boolean> {
  try {
    const nomeTabela = formatarNomeTabela(nomePosto);
    const query = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = $1
      );
    `;
    
    const result = await pool.query(query, [nomeTabela]);
    return result.rows[0].exists;
  } catch (error) {
    console.error('Erro ao verificar existência da tabela:', error);
    return false;
  }
}

/**
 * Rota para buscar o histórico de abastecimentos do posto específico
 */
router.get('/historico-abastecimentos-supabase/:posto', async (req, res) => {
  try {
    const { posto } = req.params;
    const { limit } = req.query;
    
    // Verificar se a tabela existe
    const tabelaExiste = await verificarTabelaExiste(posto);
    if (!tabelaExiste) {
      return res.status(404).json({ 
        success: false, 
        error: `Tabela para o posto ${posto} não encontrada` 
      });
    }
    
    // Construir a consulta SQL
    const nomeTabela = formatarNomeTabela(posto);
    let query = `
      SELECT 
        id,
        placa,
        COALESCE(hodometro_atual, km_atual) AS km,
        COALESCE(tipo_combustivel, 'Não especificado') AS tipo_combustivel,
        COALESCE(litros, quantidade_litros, quantity_litros) AS quantidade_litros,
        COALESCE(motorista, nome_motorista, motorista_nome) AS nome_motorista,
        COALESCE(valor_litro, preco_litro) AS valor_litro,
        valor_total,
        COALESCE(motorista_rg, rg_motorista) AS rg_motorista,
        tipo_veiculo,
        observacoes,
        lavagem,
        tipo_lavagem,
        COALESCE(projeto, project, '') AS projeto,
        created_at,
        data_registro
      FROM "${nomeTabela}"
      ORDER BY created_at DESC
    `;
    
    // Adicionar limite se fornecido
    if (limit && !isNaN(Number(limit))) {
      query += ` LIMIT ${Number(limit)}`;
    }
    
    console.log(`Executando consulta para histórico do posto ${posto}`);
    const result = await pool.query(query);
    
    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Erro ao buscar histórico de abastecimentos:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar histórico de abastecimentos'
    });
  }
});

/**
 * Rota para buscar estatísticas mensais do posto específico
 */
router.get('/estatisticas-mensais-supabase/:posto', async (req, res) => {
  try {
    const { posto } = req.params;
    
    // Verificar se a tabela existe
    const tabelaExiste = await verificarTabelaExiste(posto);
    if (!tabelaExiste) {
      return res.status(404).json({ 
        success: false, 
        error: `Tabela para o posto ${posto} não encontrada` 
      });
    }
    
    // Usar a view de estatísticas se existir, ou criar a consulta
    const nomeTabela = formatarNomeTabela(posto);
    const query = `
      SELECT 
        to_char(date_trunc('month', created_at), 'MM/YYYY') AS mes,
        COALESCE(tipo_combustivel, 'Não especificado') AS tipo_combustivel,
        COUNT(*) AS total_abastecimentos,
        ROUND(SUM(COALESCE(litros, quantidade_litros, quantity_litros))::numeric, 2) AS total_litros,
        ROUND(SUM(valor_total)::numeric, 2) AS valor_total,
        ROUND(AVG(COALESCE(valor_litro, preco_litro))::numeric, 2) AS preco_medio_litro
      FROM "${nomeTabela}"
      GROUP BY date_trunc('month', created_at), tipo_combustivel
      ORDER BY date_trunc('month', created_at) DESC, tipo_combustivel
      LIMIT 12
    `;
    
    console.log(`Executando consulta para estatísticas mensais do posto ${posto}`);
    const result = await pool.query(query);
    
    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas mensais:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar estatísticas mensais'
    });
  }
});

/**
 * Rota para buscar histórico de alterações de um abastecimento específico
 */
router.get('/historico-alteracoes-supabase/:posto/:id', async (req, res) => {
  try {
    const { posto, id } = req.params;
    
    // Verificar se a tabela existe
    const tabelaExiste = await verificarTabelaExiste(posto);
    if (!tabelaExiste) {
      return res.status(404).json({ 
        success: false, 
        error: `Tabela para o posto ${posto} não encontrada` 
      });
    }
    
    // Buscar na tabela de histórico
    const nomeTabela = formatarNomeTabela(posto);
    const query = `
      SELECT 
        h.id,
        h.abastecimento_id,
        h.acao,
        h.usuario,
        h.created_at,
        h.dados->>'placa' AS placa,
        h.dados->>'tipo_combustivel' AS tipo_combustivel,
        (h.dados->>'quantidade_litros')::numeric AS quantidade_litros,
        (h.dados->>'valor_total')::numeric AS valor_total
      FROM "${nomeTabela}_historico" h
      WHERE h.abastecimento_id = $1
      ORDER BY h.created_at DESC
    `;
    
    console.log(`Executando consulta para histórico de alterações do abastecimento ${id} no posto ${posto}`);
    const result = await pool.query(query, [id]);
    
    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Erro ao buscar histórico de alterações:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar histórico de alterações'
    });
  }
});

/**
 * Rota para buscar resumo de todos os postos
 */
router.get('/resumo-todos-postos-supabase', async (req, res) => {
  try {
    const { dias = '30' } = req.query;
    const diasNum = parseInt(dias as string) || 30;
    
    // Lista de postos conhecidos
    const postos = [
      'Campinas',
      'Osasco',
      'ABC',
      'Socorro',
      'Sorocaba',
      'SaoPaulo',
      'Ipatinga',
      'BotaFogo',
      'Remedios',
      'VargemGrande',
      'Guarulhos'
    ];
    
    // Preparar as consultas para cada posto
    const resultados: any[] = [];
    
    for (const posto of postos) {
      try {
        // Verificar se a tabela existe
        const tabelaExiste = await verificarTabelaExiste(posto);
        if (!tabelaExiste) {
          console.warn(`Tabela para o posto ${posto} não encontrada, pulando...`);
          continue;
        }
        
        // Buscar dados do posto
        const nomeTabela = formatarNomeTabela(posto);
        const query = `
          SELECT 
            '${posto}' AS nome_posto,
            COALESCE(tipo_combustivel, 'Não especificado') AS tipo_combustivel,
            COUNT(*) AS total_abastecimentos,
            ROUND(SUM(COALESCE(litros, quantidade_litros, quantity_litros))::numeric, 2) AS total_litros,
            ROUND(SUM(valor_total)::numeric, 2) AS valor_total,
            ROUND(AVG(COALESCE(valor_litro, preco_litro))::numeric, 2) AS preco_medio_litro
          FROM "${nomeTabela}"
          WHERE created_at >= (NOW() AT TIME ZONE 'America/Sao_Paulo') - INTERVAL '${diasNum} days'
          GROUP BY tipo_combustivel
        `;
        
        const result = await pool.query(query);
        resultados.push(...result.rows);
      } catch (error) {
        console.error(`Erro ao buscar dados do posto ${posto}:`, error);
        // Continuar com o próximo posto mesmo com erro
      }
    }
    
    return res.status(200).json({
      success: true,
      count: resultados.length,
      data: resultados
    });
  } catch (error) {
    console.error('Erro ao buscar resumo de todos os postos:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar resumo de todos os postos'
    });
  }
});

/**
 * Rota para excluir um abastecimento específico
 */
router.delete('/abastecimento/:posto/:id', async (req, res) => {
  try {
    const { posto, id } = req.params;
    
    // Verificar se a tabela existe
    const tabelaExiste = await verificarTabelaExiste(posto);
    if (!tabelaExiste) {
      return res.status(404).json({ 
        success: false, 
        error: `Tabela para o posto ${posto} não encontrada` 
      });
    }
    
    // Construir a query de exclusão
    const nomeTabela = formatarNomeTabela(posto);
    const query = `
      DELETE FROM "${nomeTabela}"
      WHERE id = $1
      RETURNING id
    `;
    
    console.log(`Excluindo abastecimento ${id} do posto ${posto}`);
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Abastecimento com ID ${id} não encontrado`
      });
    }
    
    return res.status(200).json({
      success: true,
      message: `Abastecimento ${id} do posto ${posto} excluído com sucesso`
    });
  } catch (error) {
    console.error('Erro ao excluir abastecimento:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao excluir abastecimento'
    });
  }
});

router.post('/registrar-abastecimento-supabase/:posto', async (req, res) => {
  try {
    const { posto } = req.params;
    const dadosAbastecimento = req.body;
    
    // Verificar se a tabela existe
    const tabelaExiste = await verificarTabelaExiste(posto);
    if (!tabelaExiste) {
      return res.status(404).json({ 
        success: false, 
        error: `Tabela para o posto ${posto} não encontrada` 
      });
    }
    
    // Validar campos mínimos obrigatórios
    if (!dadosAbastecimento.placa) {
      return res.status(400).json({
        success: false,
        error: 'Campo placa é obrigatório'
      });
    }
    
    // Normalizar campos para garantir compatibilidade
    const dadosNormalizados = normalizarCamposAbastecimento(dadosAbastecimento, posto);
    
    // Construir a query de inserção
    const nomeTabela = formatarNomeTabela(posto);
    
    // Extrair campos e valores do objeto normalizado
    const campos = Object.keys(dadosNormalizados);
    const valores = Object.values(dadosNormalizados);
    const placeholders = campos.map((_, index) => `$${index + 1}`).join(', ');
    
    const query = `
      INSERT INTO "${nomeTabela}" (${campos.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    console.log(`Registrando abastecimento para o posto ${posto}`);
    const result = await pool.query(query, valores);
    
    if (result.rows.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'Falha ao inserir abastecimento'
      });
    }
    
    return res.status(201).json({
      success: true,
      message: 'Abastecimento registrado com sucesso',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao registrar abastecimento:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao registrar abastecimento'
    });
  }
});

/**
 * Normaliza os campos do abastecimento para compatibilidade com diferentes formatos
 * @param dados Dados originais do abastecimento
 * @param posto Nome do posto para contextualização
 * @returns Dados normalizados
 */
function normalizarCamposAbastecimento(dados: any, posto: string): any {
  // Clonar o objeto para não modificar o original
  const normalizado: any = { ...dados };
  
  // Garantir que o campo posto esteja preenchido
  normalizado.posto = normalizado.posto || posto;
  
  // Normalização de campos de quantidade
  if (normalizado.quantidade && !normalizado.litros && !normalizado.quantidade_litros && !normalizado.quantity_litros) {
    normalizado.quantidade_litros = normalizado.quantidade;
    delete normalizado.quantidade; // Remover campo não usado na tabela
  }
  
  // Normalização de campos de hodômetro
  if (normalizado.km && !normalizado.km_atual && !normalizado.hodometro_atual) {
    normalizado.km_atual = normalizado.km;
    delete normalizado.km; // Remover campo não usado na tabela
  }
  
  // Normalização de campos de motorista
  if (normalizado.motorista && !normalizado.nome_motorista && !normalizado.motorista_nome) {
    normalizado.motorista_nome = normalizado.motorista;
    // Manter o campo motorista pois ele existe na tabela
  }
  
  // Normalização de RG
  if (normalizado.rg && !normalizado.rg_motorista && !normalizado.motorista_rg) {
    normalizado.rg_motorista = normalizado.rg;
    delete normalizado.rg; // Remover campo não usado na tabela
  }
  
  // Normalização de campos de preço
  if (normalizado.preco && !normalizado.preco_litro && !normalizado.valor_litro) {
    normalizado.valor_litro = normalizado.preco;
    delete normalizado.preco; // Remover campo não usado na tabela
  }
  
  // Normalização de campos de projeto
  // Para Guarulhos_V2 e outros postos que usam 'project' em vez de 'projeto'
  if (posto.toLowerCase() === 'guarulhos_v2' || posto.toLowerCase().includes('guarulhos v2')) {
    // Garantir que o campo project seja salvo, independente de como chegou
    if (normalizado.projeto || normalizado.project) {
      // Usar o valor que existir, dando preferência para projeto se ambos existirem
      normalizado.project = normalizado.projeto || normalizado.project;
      
      // Remover campo projeto para evitar duplicação
      if (normalizado.projeto) {
        delete normalizado.projeto;
      }
      
      // Log para depuração
      console.log(`Normalizando campo projeto para Guarulhos_V2. Valor salvo em project: ${normalizado.project}`);
    }
  } else {
    // Para outros postos que usam 'projeto'
    // Garantir que o campo projeto seja salvo, independente de como chegou
    if (normalizado.projeto || normalizado.project) {
      // Usar o valor que existir, dando preferência para project se ambos existirem
      normalizado.projeto = normalizado.project || normalizado.projeto;
      
      // Remover campo project para evitar duplicação
      if (normalizado.project) {
        delete normalizado.project;
      }
      
      // Log para depuração
      console.log(`Normalizando campo projeto para ${posto}. Valor salvo em projeto: ${normalizado.projeto}`);
    }
  }
  
  // Data de registro padrão
  if (!normalizado.data_registro) {
    normalizado.data_registro = new Date();
  }
  
  // Adicionar timestamp de criação
  if (!normalizado.created_at) {
    normalizado.created_at = new Date();
  }
  
  return normalizado;
}

export default router;
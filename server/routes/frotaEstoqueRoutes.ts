import { Router } from 'express';
import { pool } from '../db';
import { isAuthenticated } from '../middleware/auth';
import { verifyAuth, sessionAuth } from '../middleware/hybridAuth';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const router = Router();

// Configuração do Multer para upload temporário
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Rota de diagnóstico para verificar autenticação
router.get('/diagnostico', (req, res) => {
  const isAuth = req.isAuthenticated();
  const cookieInfo = req.headers.cookie ? 
    req.headers.cookie.split(';').map(c => c.trim()) : [];
  
  const sessionInfo = req.session 
    ? {
        id: req.sessionID,
        cookie: req.session.cookie ? {
          domain: req.session.cookie.domain,
          path: req.session.cookie.path,
          secure: req.session.cookie.secure,
          expires: req.session.cookie.expires,
          maxAge: req.session.cookie.maxAge
        } : undefined
      }
    : undefined;
  
  // Verificar token de autenticação do Supabase
  let supabaseToken = null;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    supabaseToken = 'Presente (Bearer)';
  }
  
  // Verificar outras fontes
  const hasSupabaseCookie = cookieInfo.some(c => c.startsWith('supabase-auth'));
  
  // Verificar usuário do Supabase
  const hasSupabaseUser = !!req.supabaseUser;
  
  return res.json({
    isAuthenticated: isAuth,
    user: isAuth ? { 
      id: req.user.id, 
      email: req.user.email,
      role: req.user.role
    } : null,
    supabaseUser: hasSupabaseUser ? {
      id: req.supabaseUser?.id,
      email: req.supabaseUser?.email,
      role: req.supabaseUser?.role
    } : null,
    authMethods: {
      session: isAuth,
      jwt: !!supabaseToken || hasSupabaseCookie,
      supabaseUser: hasSupabaseUser
    },
    host: req.hostname,
    path: req.path,
    method: req.method,
    session: sessionInfo,
    cookies: {
      count: cookieInfo.length,
      hasSupabaseCookie: hasSupabaseCookie
    },
    headers: {
      cookieParsed: cookieInfo,
      authorization: req.headers.authorization ? 'Presente' : 'Ausente',
      cookie: req.headers.cookie ? 'Presente' : 'Ausente',
      origin: req.headers.origin || 'Não informado',
      referer: req.headers.referer || 'Não informado',
      'user-agent': req.headers['user-agent']
    }
  });
});

// Middleware de autenticação para todas as rotas EXCETO diagnóstico
// Usando nosso middleware de autenticação híbrida para garantir maior compatibilidade
import { hybridAuth } from '../middleware/hybridAuth';
router.use(hybridAuth);

// GET - Listar todas as peças em estoque
router.get('/estoque-pecas', verifyAuth, sessionAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        codigo,
        nome,
        descricao,
        categoria,
        fabricante,
        aplicacao,
        quantidade,
        valor_unitario,
        valor_total,
        estoque_minimo,
        estoque_maximo,
        localizacao,
        unidade_medida,
        CASE 
          WHEN quantidade <= 0 THEN 'indisponível'
          WHEN quantidade < estoque_minimo THEN 'baixo'
          ELSE 'disponível'
        END AS status_disponibilidade
      FROM frota_estoque_pecas
      ORDER BY codigo
    `);

    res.json(result.rows);
  } catch (error: any) {
    console.error('Erro ao listar peças:', error);
    res.status(500).json({ message: `Erro ao listar peças: ${error.message}` });
  }
});

// GET - Listar peças com estoque baixo
router.get('/estoque-pecas/baixo', verifyAuth, sessionAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        codigo,
        nome,
        descricao,
        categoria,
        fabricante,
        aplicacao,
        quantidade,
        valor_unitario,
        valor_total,
        estoque_minimo,
        estoque_maximo,
        localizacao,
        unidade_medida,
        'baixo' AS status_disponibilidade
      FROM frota_estoque_pecas
      WHERE quantidade > 0 AND quantidade < estoque_minimo
      ORDER BY (quantidade::float / estoque_minimo) ASC, codigo
    `);

    res.json(result.rows);
  } catch (error: any) {
    console.error('Erro ao listar peças com estoque baixo:', error);
    res.status(500).json({ message: `Erro ao listar peças com estoque baixo: ${error.message}` });
  }
});

// GET - Listar peças com estoque zerado
router.get('/estoque-pecas/zerado', verifyAuth, sessionAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        codigo,
        nome,
        descricao,
        categoria,
        fabricante,
        aplicacao,
        quantidade,
        valor_unitario,
        valor_total,
        estoque_minimo,
        estoque_maximo,
        localizacao,
        unidade_medida,
        'indisponível' AS status_disponibilidade
      FROM frota_estoque_pecas
      WHERE quantidade <= 0
      ORDER BY codigo
    `);

    res.json(result.rows);
  } catch (error: any) {
    console.error('Erro ao listar peças com estoque zerado:', error);
    res.status(500).json({ message: `Erro ao listar peças com estoque zerado: ${error.message}` });
  }
});

// GET - Obter resumo do estoque
router.get('/estoque-resumo', verifyAuth, sessionAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) AS total_itens,
        SUM(quantidade) AS total_quantidade,
        SUM(valor_total) AS valor_total_estoque,
        COUNT(*) FILTER (WHERE quantidade <= estoque_minimo AND quantidade > 0) AS itens_abaixo_minimo,
        COUNT(*) FILTER (WHERE quantidade <= 0) AS itens_zerados,
        MAX(ultima_atualizacao) AS ultima_atualizacao
      FROM frota_estoque_pecas
    `);

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Erro ao obter resumo do estoque:', error);
    res.status(500).json({ message: `Erro ao obter resumo do estoque: ${error.message}` });
  }
});

// POST - Adicionar nova peça - Adiciona depuração para debug de problemas de autenticação
router.post('/estoque-pecas', verifyAuth, sessionAuth, async (req, res) => {
  // Verificar autenticação manualmente aqui antes de prosseguir
  console.log('[EstoqueRoute] Requisição recebida para criação de peça:', {
    cookies: !!req.headers.cookie,
    hasSession: !!req.session,
    isAuth: req.isAuthenticated(),
    hasSupabaseUser: !!req.supabaseUser,
    hasAuthHeader: !!req.headers.authorization,
    contentType: req.headers['content-type'],
    origem: req.headers.origin || 'não especificado',
    userData: req.user || req.supabaseUser || null
  });
  const {
    nome,
    descricao,
    categoria,
    fabricante,
    aplicacao,
    quantidade,
    valor_unitario,
    estoque_minimo,
    estoque_maximo,
    localizacao,
    unidade_medida
  } = req.body;

  try {
    // Validar campos obrigatórios
    if (!nome || valor_unitario === undefined) {
      return res.status(400).json({ message: 'Nome e valor unitário são obrigatórios' });
    }

    // Inserir nova peça
    const result = await pool.query(`
      INSERT INTO frota_estoque_pecas (
        nome,
        descricao,
        categoria,
        fabricante,
        aplicacao,
        quantidade,
        valor_unitario,
        estoque_minimo,
        estoque_maximo,
        localizacao,
        unidade_medida
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, codigo, nome, valor_unitario, quantidade
    `, [
      nome,
      descricao || null,
      categoria || null,
      fabricante || null,
      aplicacao || null,
      quantidade || 0,
      valor_unitario,
      estoque_minimo || 5,
      estoque_maximo || null,
      localizacao || null,
      unidade_medida || 'unidade'
    ]);

    // Se quantidade inicial for maior que zero, registrar movimentação de entrada
    if (quantidade && quantidade > 0) {
      await pool.query(`
        INSERT INTO frota_movimentacao_estoque (
          peca_id,
          tipo_movimento,
          quantidade,
          valor_unitario,
          motivo,
          responsavel,
          responsavel_id,
          observacoes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        result.rows[0].id,
        'entrada',
        quantidade,
        valor_unitario,
        'Cadastro inicial',
        req.user?.name || req.supabaseUser?.email || 'Sistema',
        req.user?.id || req.supabaseUser?.id || null,
        'Estoque inicial no cadastro da peça'
      ]);
    }

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Erro ao adicionar peça:', error);
    res.status(500).json({ message: `Erro ao adicionar peça: ${error.message}` });
  }
});

// PUT - Atualizar dados completos de uma peça
router.put('/estoque-pecas/:id', verifyAuth, sessionAuth, async (req, res) => {
  const { id } = req.params;
  const {
    nome,
    descricao,
    categoria,
    fabricante,
    aplicacao,
    valor_unitario,
    estoque_minimo,
    estoque_maximo,
    localizacao,
    unidade_medida
  } = req.body;

  try {
    // Validar ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'ID da peça é obrigatório e deve ser um número válido' });
    }

    // Validar campos obrigatórios
    if (!nome || valor_unitario === undefined) {
      return res.status(400).json({ message: 'Nome e valor unitário são obrigatórios' });
    }

    // Verificar se a peça existe
    const pecaResult = await pool.query(
      'SELECT id, codigo, nome, quantidade FROM frota_estoque_pecas WHERE id = $1',
      [id]
    );

    if (pecaResult.rowCount === 0) {
      return res.status(404).json({ message: 'Peça não encontrada' });
    }

    // Atualizar os dados da peça (exceto quantidade que tem rota específica)
    const updateResult = await pool.query(
      `UPDATE frota_estoque_pecas 
       SET nome = $1, 
           descricao = $2, 
           categoria = $3, 
           fabricante = $4, 
           aplicacao = $5, 
           valor_unitario = $6, 
           estoque_minimo = $7, 
           estoque_maximo = $8, 
           localizacao = $9, 
           unidade_medida = $10,
           ultima_atualizacao = NOW()
       WHERE id = $11 
       RETURNING id, codigo, nome, valor_unitario, estoque_minimo`,
      [
        nome,
        descricao || null,
        categoria || null,
        fabricante || null,
        aplicacao || null,
        valor_unitario,
        estoque_minimo || 5,
        estoque_maximo || null,
        localizacao || null,
        unidade_medida || 'unidade',
        id
      ]
    );

    res.json({
      success: true,
      message: 'Peça atualizada com sucesso',
      peca: updateResult.rows[0]
    });
  } catch (error: any) {
    console.error('Erro ao atualizar peça:', error);
    res.status(500).json({ message: `Erro ao atualizar peça: ${error.message}` });
  }
});

// PUT - Atualizar apenas quantidade de uma peça específica (para uso interno do sistema)
router.put('/estoque-pecas/:id/quantidade', verifyAuth, sessionAuth, async (req, res) => {
  const { id } = req.params;
  const { quantidade } = req.body;

  try {
    // Validar campos obrigatórios
    if (quantidade === undefined || quantidade < 0) {
      return res.status(400).json({ message: 'Quantidade deve ser um número válido maior ou igual a zero' });
    }

    // Verificar se a peça existe
    const pecaResult = await pool.query(
      'SELECT id, codigo, nome, quantidade FROM frota_estoque_pecas WHERE id = $1', 
      [id]
    );

    if (pecaResult.rowCount === 0) {
      return res.status(404).json({ message: 'Peça não encontrada' });
    }

    const peca = pecaResult.rows[0];
    const quantidadeAnterior = peca.quantidade;

    // Atualizar a quantidade da peça
    const updateResult = await pool.query(
      `UPDATE frota_estoque_pecas 
       SET quantidade = $1, ultima_atualizacao = NOW() 
       WHERE id = $2 
       RETURNING id, codigo, nome, quantidade`,
      [quantidade, id]
    );

    // Registrar movimentação de saída (automática pelo sistema)
    if (quantidadeAnterior !== quantidade) {
      const tipoMovimento = quantidade < quantidadeAnterior ? 'saida' : 'entrada';
      const quantidadeMovimento = Math.abs(quantidade - quantidadeAnterior);
      
      await pool.query(`
        INSERT INTO frota_movimentacao_estoque (
          peca_id,
          tipo_movimento,
          quantidade,
          quantidade_anterior,
          quantidade_atual,
          valor_unitario,
          motivo,
          responsavel,
          responsavel_id,
          observacoes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        id,
        tipoMovimento,
        quantidadeMovimento,
        quantidadeAnterior,
        quantidade,
        0, // valor_unitario zerado para movimentações automáticas
        'Atualização automática do sistema',
        req.user?.name || req.supabaseUser?.email || 'Sistema',
        req.user?.id || req.supabaseUser?.id || null,
        'Peça selecionada para manutenção'
      ]);
    }

    res.json({
      success: true,
      peca: updateResult.rows[0],
      quantidadeAnterior,
      quantidadeAtual: quantidade
    });
  } catch (error: any) {
    console.error('Erro ao atualizar quantidade da peça:', error);
    res.status(500).json({ message: `Erro ao atualizar quantidade da peça: ${error.message}` });
  }
});

// DELETE - Excluir peça do estoque
router.delete('/estoque-pecas/:id', verifyAuth, sessionAuth, async (req, res) => {
  const { id } = req.params;

  try {
    // Validar ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'ID da peça é obrigatório e deve ser um número válido' });
    }

    // Usar transação para garantir consistência
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Verificar se a peça existe
      const pecaResult = await client.query(
        'SELECT id, codigo, nome, quantidade FROM frota_estoque_pecas WHERE id = $1',
        [id]
      );

      if (pecaResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Peça não encontrada' });
      }

      const peca = pecaResult.rows[0];

      // Primeiro, excluir TODOS os registros de movimentação relacionados
      const deleteMovementResult = await client.query(
        'DELETE FROM frota_movimentacao_estoque WHERE peca_id = $1',
        [id]
      );

      console.log(`Excluídos ${deleteMovementResult.rowCount} registros de movimentação para a peça ${peca.codigo}`);

      // Agora excluir a peça
      const deleteResult = await client.query(
        'DELETE FROM frota_estoque_pecas WHERE id = $1 RETURNING id, codigo, nome',
        [id]
      );

      if (deleteResult.rowCount > 0) {
        await client.query('COMMIT');
        const pecaExcluida = deleteResult.rows[0];
        console.log(`Peça excluída: ID ${pecaExcluida.id} - ${pecaExcluida.codigo} - ${pecaExcluida.nome}`);

        res.json({
          message: 'Peça excluída com sucesso',
          peca: pecaExcluida
        });
      } else {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Erro ao excluir a peça' });
      }
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('Erro ao excluir peça:', error);
    res.status(500).json({
      message: 'Erro interno do servidor ao excluir peça',
      error: error.message
    });
  }
});

// POST - Registrar movimentação de estoque
router.post('/movimentacao-estoque', verifyAuth, sessionAuth, async (req, res) => {
  const {
    peca_id,
    tipo_movimento,
    quantidade,
    valor_unitario,
    motivo,
    nota_fiscal,
    veiculo_placa,
    observacoes
  } = req.body;

  try {
    // Validar campos obrigatórios
    if (!peca_id || !tipo_movimento || !quantidade || valor_unitario === undefined || !motivo) {
      return res.status(400).json({ 
        message: 'ID da peça, tipo de movimento, quantidade, valor unitário e motivo são obrigatórios' 
      });
    }

    // Verificar se tipo de movimento é válido
    if (!['entrada', 'saida', 'ajuste'].includes(tipo_movimento)) {
      return res.status(400).json({ 
        message: 'Tipo de movimento deve ser "entrada", "saida" ou "ajuste"' 
      });
    }

    // Verificar se a peça existe
    const pecaResult = await pool.query(
      'SELECT id, codigo, nome, quantidade, valor_unitario FROM frota_estoque_pecas WHERE id = $1', 
      [peca_id]
    );

    if (pecaResult.rowCount === 0) {
      return res.status(404).json({ message: 'Peça não encontrada' });
    }

    const peca = pecaResult.rows[0];

    // Verificar estoque para saídas
    if (tipo_movimento === 'saida' && peca.quantidade < quantidade) {
      return res.status(400).json({ 
        message: `Estoque insuficiente. Disponível: ${peca.quantidade}, Solicitado: ${quantidade}` 
      });
    }

    // Inserir registro de movimentação
    const result = await pool.query(`
      INSERT INTO frota_movimentacao_estoque (
        peca_id,
        tipo_movimento,
        quantidade,
        quantidade_anterior,
        valor_unitario,
        motivo,
        nota_fiscal,
        veiculo_placa,
        responsavel,
        responsavel_id,
        observacoes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `, [
      peca_id,
      tipo_movimento,
      quantidade,
      peca.quantidade,
      valor_unitario,
      motivo,
      nota_fiscal || null,
      veiculo_placa || null,
      req.user?.name || req.supabaseUser?.email || 'Sistema',
      req.user?.id || req.supabaseUser?.id || null,
      observacoes || null
    ]);

    // Atualizar estoque da peça
    let novaQuantidade = peca.quantidade;
    
    if (tipo_movimento === 'entrada') {
      novaQuantidade += quantidade;
    } else if (tipo_movimento === 'saida') {
      novaQuantidade -= quantidade;
    } else if (tipo_movimento === 'ajuste') {
      novaQuantidade = quantidade;
    }

    await pool.query(
      'UPDATE frota_estoque_pecas SET quantidade = $1, ultima_atualizacao = NOW() WHERE id = $2',
      [novaQuantidade, peca_id]
    );

    // Atualizar quantidade atual no registro de movimentação
    await pool.query(
      'UPDATE frota_movimentacao_estoque SET quantidade_atual = $1 WHERE id = $2',
      [novaQuantidade, result.rows[0].id]
    );

    res.status(201).json({ 
      id: result.rows[0].id,
      peca_codigo: peca.codigo,
      peca_nome: peca.nome,
      tipo_movimento: tipo_movimento,
      quantidade: quantidade,
      estoque_anterior: peca.quantidade,
      estoque_atual: novaQuantidade
    });
  } catch (error: any) {
    console.error('Erro ao registrar movimentação:', error);
    res.status(500).json({ message: `Erro ao registrar movimentação: ${error.message}` });
  }
});

// GET - Obter histórico de movimentações de uma peça
router.get('/movimentacao-estoque/:pecaId', async (req, res) => {
  const { pecaId } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        m.id,
        m.peca_id,
        p.codigo AS peca_codigo,
        p.nome AS peca_nome,
        m.tipo_movimento,
        m.quantidade,
        m.quantidade_anterior,
        m.quantidade_atual,
        m.valor_unitario,
        m.valor_total,
        m.motivo,
        m.nota_fiscal,
        m.veiculo_placa,
        m.responsavel,
        m.responsavel_id,
        m.observacoes,
        m.data_movimento
      FROM frota_movimentacao_estoque m
      JOIN frota_estoque_pecas p ON m.peca_id = p.id
      WHERE m.peca_id = $1
      ORDER BY m.data_movimento DESC
    `, [pecaId]);

    res.json(result.rows);
  } catch (error: any) {
    console.error('Erro ao obter histórico de movimentações:', error);
    res.status(500).json({ message: `Erro ao obter histórico de movimentações: ${error.message}` });
  }
});

// GET - Exportar estoque para Excel
router.get('/estoque-exportar', verifyAuth, sessionAuth, async (req, res) => {
  try {
    // Registrar operação de exportação
    const userInfo = {
      id: req.user?.id || (req.supabaseUser?.id ? Number(req.supabaseUser.id) : null),
      name: req.user?.name || req.supabaseUser?.email || 'Sistema'
    };

    const exportId = await registrarExportacao(userInfo.name, userInfo.id);

    // Buscar dados do estoque
    const result = await pool.query(`
      SELECT
        e.codigo,
        e.nome,
        e.descricao,
        e.categoria,
        e.fabricante,
        e.aplicacao,
        e.quantidade,
        e.valor_unitario,
        e.valor_total,
        e.estoque_minimo,
        e.estoque_maximo,
        e.localizacao,
        e.unidade_medida,
        f.nome AS fornecedor,
        CASE 
          WHEN e.quantidade <= 0 THEN 'Zerado'
          WHEN e.quantidade < e.estoque_minimo THEN 'Baixo'
          ELSE 'Normal'
        END AS status_estoque,
        e.data_ultima_compra,
        e.ultima_atualizacao
      FROM
        frota_estoque_pecas e
      LEFT JOIN
        frota_peca_fornecedor pf ON e.id = pf.peca_id AND pf.fornecedor_principal = TRUE
      LEFT JOIN
        frota_fornecedores_pecas f ON pf.fornecedor_id = f.id
      ORDER BY
        e.codigo
    `);

    // Criar arquivo Excel
    const worksheet = XLSX.utils.json_to_sheet(result.rows);
    
    // Ajustar largura das colunas
    const columnWidths = [
      { wch: 10 }, // Código
      { wch: 30 }, // Nome
      { wch: 40 }, // Descrição
      { wch: 15 }, // Categoria
      { wch: 15 }, // Fabricante
      { wch: 30 }, // Aplicação
      { wch: 10 }, // Quantidade
      { wch: 15 }, // Valor Unitário
      { wch: 15 }, // Valor Total
      { wch: 10 }, // Estoque Mínimo
      { wch: 10 }, // Estoque Máximo
      { wch: 15 }, // Localização
      { wch: 10 }, // Unidade Medida
      { wch: 20 }, // Fornecedor
      { wch: 10 }, // Status
      { wch: 20 }, // Data Última Compra
      { wch: 20 }  // Última Atualização
    ];
    
    worksheet['!cols'] = columnWidths;
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Estoque');
    
    // Gerar buffer do Excel
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // Finalizar operação de exportação
    await finalizarExportacao(exportId, result.rows.length);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=estoque-pecas-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    res.send(excelBuffer);
  } catch (error: any) {
    console.error('Erro ao exportar estoque:', error);
    res.status(500).json({ message: `Erro ao exportar estoque: ${error.message}` });
  }
});

// GET - Obter template para importação
router.get('/estoque-template', verifyAuth, sessionAuth, async (req, res) => {
  try {
    // Gerar template diretamente sem depender de função do banco
    const template = [];
    
    // Transformar em formato adequado para o Excel
    const excelData = [
      // Cabeçalho
      ['codigo', 'nome', 'descricao', 'categoria', 'fabricante', 'aplicacao', 
       'quantidade', 'valor_unitario', 'estoque_minimo', 'estoque_maximo', 
       'localizacao', 'unidade_medida', 'fornecedor'],
      // Linha de exemplo
      ['', 'Filtro de Óleo Motor Scania', 'Filtro para caminhões Scania P e G', 'Filtros', 
       'Tecfil', 'Caminhões Scania P310, P340, G380', '15', '89.9', '5', '30', 
       'Prateleira A3', 'unidade', 'Auto Peças Brasil']
    ];
    
    // Adicionar informações sobre cada coluna
    const info = template.map(t => {
      return [
        t.coluna,
        t.descricao,
        t.obrigatorio ? 'Sim' : 'Não',
        t.exemplo
      ];
    });
    
    // Criar planilhas
    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    const infoSheet = XLSX.utils.aoa_to_sheet([
      ['Campo', 'Descrição', 'Obrigatório', 'Exemplo'],
      ...info
    ]);
    
    // Ajustar largura das colunas
    worksheet['!cols'] = [
      { wch: 10 }, // codigo
      { wch: 30 }, // nome
      { wch: 40 }, // descricao
      { wch: 15 }, // categoria
      { wch: 15 }, // fabricante
      { wch: 30 }, // aplicacao
      { wch: 10 }, // quantidade
      { wch: 15 }, // valor_unitario
      { wch: 15 }, // estoque_minimo
      { wch: 15 }, // estoque_maximo
      { wch: 15 }, // localizacao
      { wch: 15 }, // unidade_medida
      { wch: 20 }  // fornecedor
    ];
    
    infoSheet['!cols'] = [
      { wch: 15 }, // Campo
      { wch: 60 }, // Descrição
      { wch: 12 }, // Obrigatório
      { wch: 30 }  // Exemplo
    ];
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Importação');
    XLSX.utils.book_append_sheet(workbook, infoSheet, 'Instruções');
    
    // Gerar buffer do Excel
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=template-importacao-estoque.xlsx');
    res.send(excelBuffer);
  } catch (error: any) {
    console.error('Erro ao gerar template:', error);
    res.status(500).json({ message: `Erro ao gerar template: ${error.message}` });
  }
});

// POST - Importar estoque do Excel
router.post('/estoque-importar', verifyAuth, sessionAuth, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Nenhum arquivo enviado' });
  }

  try {
    // Registrar operação de importação
    const userInfo = {
      id: req.user?.id || (req.supabaseUser?.id ? Number(req.supabaseUser.id) : null),
      name: req.user?.name || req.supabaseUser?.email || 'Sistema'
    };

    const importId = await registrarImportacao(req.file.originalname, userInfo.name, userInfo.id);
    
    // Ler arquivo Excel
    const workbook = XLSX.read(req.file.buffer);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    if (data.length === 0) {
      await finalizarImportacao(importId, 0, 0, 'Arquivo vazio');
      return res.status(400).json({ message: 'Arquivo vazio ou sem dados válidos' });
    }
    
    // Inserir dados na tabela temporária
    let registrosInseridos = 0;
    let erros = 0;
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any;
      
      try {
        await pool.query(`
          INSERT INTO frota_excel_importacao_temp (
            importacao_id,
            codigo,
            nome,
            descricao,
            categoria,
            fabricante,
            aplicacao,
            quantidade,
            valor_unitario,
            estoque_minimo,
            estoque_maximo,
            localizacao,
            unidade_medida,
            fornecedor,
            linha_excel
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        `, [
          importId,
          row.codigo || '',
          row.nome || '',
          row.descricao || null,
          row.categoria || null,
          row.fabricante || null,
          row.aplicacao || null,
          row.quantidade || 0,
          row.valor_unitario || 0,
          row.estoque_minimo || 5,
          row.estoque_maximo || null,
          row.localizacao || null,
          row.unidade_medida || 'unidade',
          row.fornecedor || null,
          i + 2 // +2 porque a linha 1 é o cabeçalho
        ]);
        
        registrosInseridos++;
      } catch (error: any) {
        console.error(`Erro ao inserir linha ${i + 2}:`, error);
        erros++;
        
        // Registrar erro de importação
        await pool.query(`
          INSERT INTO frota_excel_importacao_erros (
            importacao_id,
            linha_excel,
            valor_original,
            mensagem_erro
          ) VALUES ($1, $2, $3, $4)
        `, [
          importId,
          i + 2,
          JSON.stringify(row),
          error.message
        ]);
      }
    }
    
    // Processar registros importados
    await pool.query('SELECT processar_importacao_excel($1)', [importId]);
    
    // Obter resultado do processamento
    const resultStats = await pool.query(`
      SELECT 
        registros_processados,
        registros_com_erro
      FROM frota_excel_importacao_historico
      WHERE id = $1
    `, [importId]);
    
    const stats = resultStats.rows[0];
    
    res.status(200).json({
      message: 'Importação realizada com sucesso',
      total: registrosInseridos,
      processados: stats.registros_processados,
      erros: stats.registros_com_erro
    });
  } catch (error: any) {
    console.error('Erro ao processar importação:', error);
    res.status(500).json({ message: `Erro ao processar importação: ${error.message}` });
  }
});

// Funções auxiliares
async function registrarImportacao(nomeArquivo: string, usuario: string, usuarioId: number | string | null): Promise<number> {
  const result = await pool.query(`
    SELECT iniciar_operacao_excel('importacao', $1, $2, $3) AS id
  `, [nomeArquivo, usuario, usuarioId]);
  
  return result.rows[0].id;
}

async function finalizarImportacao(importId: number, processados: number, erros: number, mensagem?: string): Promise<void> {
  await pool.query(`
    SELECT finalizar_operacao_excel($1, $2, $3)
  `, [importId, erros > 0 ? 'erro' : 'concluido', mensagem]);
}

async function registrarExportacao(usuario: string, usuarioId: number | string | null): Promise<number> {
  const nomeArquivo = `estoque-pecas-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  
  const result = await pool.query(`
    SELECT iniciar_operacao_excel('exportacao', $1, $2, $3) AS id
  `, [nomeArquivo, usuario, usuarioId]);
  
  return result.rows[0].id;
}

async function finalizarExportacao(exportId: number, totalRegistros: number): Promise<void> {
  await pool.query(`
    UPDATE frota_excel_importacao_historico
    SET 
      status = 'concluido',
      data_conclusao = NOW(),
      total_registros = $2,
      registros_processados = $2
    WHERE id = $1
  `, [exportId, totalRegistros]);
}

export default router;
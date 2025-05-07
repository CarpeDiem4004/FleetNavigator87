import express from 'express';
import { db } from '../db';
import { sql, eq, and, desc, gte, lte, like } from 'drizzle-orm';
import { isAuthenticated, isAdmin } from '../middleware/auth';
import { postoMuriciPostos, postoMuriciTanques, postoMuriciAbastecimentos, postoMuriciMovimentacoesPatio, postoMuriciAbastecimentosTanque } from '../../shared/posto-murici-schema';

const router = express.Router();

// ======= ROTAS PROTEGIDAS (REQUER AUTENTICAÇÃO) =======

// Obter todos os postos
router.get('/postos', isAuthenticated, async (req, res) => {
  try {
    const postos = await db.select().from(postoMuriciPostos).orderBy(postoMuriciPostos.nome);
    res.json(postos);
  } catch (error: any) {
    console.error('Erro ao buscar postos:', error);
    res.status(500).json({ message: error.message || 'Erro ao buscar postos' });
  }
});

// Obter posto por ID
router.get('/postos/:id', isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const [posto] = await db.select().from(postoMuriciPostos).where(eq(postoMuriciPostos.id, id));
    
    if (!posto) {
      return res.status(404).json({ message: 'Posto não encontrado' });
    }
    
    res.json(posto);
  } catch (error: any) {
    console.error('Erro ao buscar posto:', error);
    res.status(500).json({ message: error.message || 'Erro ao buscar posto' });
  }
});

// Obter posto por código
router.get('/postos/codigo/:codigo', isAuthenticated, async (req, res) => {
  try {
    const codigo = req.params.codigo.toUpperCase();
    const [posto] = await db.select().from(postoMuriciPostos).where(eq(postoMuriciPostos.codigo, codigo));
    
    if (!posto) {
      return res.status(404).json({ message: 'Posto não encontrado' });
    }
    
    res.json(posto);
  } catch (error: any) {
    console.error('Erro ao buscar posto por código:', error);
    res.status(500).json({ message: error.message || 'Erro ao buscar posto por código' });
  }
});

// Obter tanques de um posto
router.get('/tanques/posto/:postoId', isAuthenticated, async (req, res) => {
  try {
    const postoId = parseInt(req.params.postoId);
    if (isNaN(postoId)) {
      return res.status(400).json({ message: 'ID do posto inválido' });
    }

    const tanques = await db.select().from(postoMuriciTanques).where(eq(postoMuriciTanques.postoId, postoId));
    res.json(tanques);
  } catch (error: any) {
    console.error('Erro ao buscar tanques do posto:', error);
    res.status(500).json({ message: error.message || 'Erro ao buscar tanques do posto' });
  }
});

// Obter tanque específico
router.get('/tanques/:id', isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const [tanque] = await db.select().from(postoMuriciTanques).where(eq(postoMuriciTanques.id, id));
    
    if (!tanque) {
      return res.status(404).json({ message: 'Tanque não encontrado' });
    }
    
    res.json(tanque);
  } catch (error: any) {
    console.error('Erro ao buscar tanque:', error);
    res.status(500).json({ message: error.message || 'Erro ao buscar tanque' });
  }
});

// Abastecimentos de um posto com paginação e filtros
router.get('/abastecimentos', isAuthenticated, async (req, res) => {
  try {
    const postoId = req.query.postoId ? parseInt(req.query.postoId as string) : undefined;
    const placa = req.query.placa as string | undefined;
    const tipoCombustivel = req.query.tipoCombustivel as string | undefined;
    const tipoVeiculo = req.query.tipoVeiculo as string | undefined;
    const dataInicio = req.query.dataInicio as string | undefined;
    const dataFim = req.query.dataFim as string | undefined;
    
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    
    // Construir a query com os filtros
    let query = db.select().from(postoMuriciAbastecimentos);
    let conditions = [];
    
    // Aplicar filtros
    if (postoId) {
      conditions.push(eq(postoMuriciAbastecimentos.postoId, postoId));
    }
    
    if (placa) {
      conditions.push(like(postoMuriciAbastecimentos.placa, `%${placa.toUpperCase()}%`));
    }
    
    if (tipoCombustivel) {
      conditions.push(eq(postoMuriciAbastecimentos.tipoCombustivel, tipoCombustivel));
    }
    
    if (tipoVeiculo) {
      conditions.push(eq(postoMuriciAbastecimentos.tipoVeiculo, tipoVeiculo));
    }
    
    if (dataInicio) {
      conditions.push(gte(postoMuriciAbastecimentos.dataRegistro, new Date(dataInicio)));
    }
    
    if (dataFim) {
      conditions.push(lte(postoMuriciAbastecimentos.dataRegistro, new Date(dataFim)));
    }
    
    // Aplicar filtros à query
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Contar o total de registros para paginação
    const countResult = await db.select({ count: sql`count(*)` }).from(postoMuriciAbastecimentos);
    const total = Number(countResult[0].count) || 0;
    
    // Aplicar ordenação e paginação
    const abastecimentos = await query
      .orderBy(desc(postoMuriciAbastecimentos.dataRegistro))
      .limit(limit)
      .offset(offset);
    
    res.json({
      data: abastecimentos,
      pagination: {
        total,
        page: Math.floor(offset / limit),
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar abastecimentos:', error);
    res.status(500).json({ message: error.message || 'Erro ao buscar abastecimentos' });
  }
});

// Estatísticas de abastecimento para um posto
router.get('/estatisticas', isAuthenticated, async (req, res) => {
  try {
    const postoId = req.query.postoId ? parseInt(req.query.postoId as string) : undefined;
    const dataInicio = req.query.dataInicio ? new Date(req.query.dataInicio as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const dataFim = req.query.dataFim ? new Date(req.query.dataFim as string) : new Date();
    
    // Condições para as queries
    const dateConditions = [
      gte(postoMuriciAbastecimentos.dataRegistro, dataInicio),
      lte(postoMuriciAbastecimentos.dataRegistro, dataFim)
    ];
    
    let conditions = [...dateConditions];
    if (postoId) {
      conditions.push(eq(postoMuriciAbastecimentos.postoId, postoId));
    }
    
    // Resumo geral
    const resumoQuery = await db.select({
      totalAbastecimentos: sql`count(*)`,
      totalLitros: sql`sum(${postoMuriciAbastecimentos.quantidadeLitros})`,
      totalValor: sql`sum(${postoMuriciAbastecimentos.valorTotal})`,
    }).from(postoMuriciAbastecimentos)
    .where(and(...conditions));
    
    // Resumo por tipo de combustível
    const resumoPorCombustivelQuery = await db.select({
      tipoCombustivel: postoMuriciAbastecimentos.tipoCombustivel,
      litros: sql`sum(${postoMuriciAbastecimentos.quantidadeLitros})`,
      valor: sql`sum(${postoMuriciAbastecimentos.valorTotal})`,
      contagem: sql`count(*)`
    }).from(postoMuriciAbastecimentos)
    .where(and(...conditions))
    .groupBy(postoMuriciAbastecimentos.tipoCombustivel);
    
    // Resumo por tipo de veículo
    const resumoPorVeiculoQuery = await db.select({
      tipoVeiculo: postoMuriciAbastecimentos.tipoVeiculo,
      litros: sql`sum(${postoMuriciAbastecimentos.quantidadeLitros})`,
      valor: sql`sum(${postoMuriciAbastecimentos.valorTotal})`,
      contagem: sql`count(*)`
    }).from(postoMuriciAbastecimentos)
    .where(and(...conditions))
    .groupBy(postoMuriciAbastecimentos.tipoVeiculo);
    
    // Top 10 veículos com maior consumo
    const top10VeiculosQuery = await db.select({
      placa: postoMuriciAbastecimentos.placa,
      totalLitros: sql`sum(${postoMuriciAbastecimentos.quantidadeLitros})`,
      totalValor: sql`sum(${postoMuriciAbastecimentos.valorTotal})`,
      totalAbastecimentos: sql`count(*)`
    }).from(postoMuriciAbastecimentos)
    .where(and(...conditions))
    .groupBy(postoMuriciAbastecimentos.placa)
    .orderBy(sql`sum(${postoMuriciAbastecimentos.quantidadeLitros}) desc`)
    .limit(10);
    
    // Estatísticas diárias
    const estatisticasDiariasQuery = await db.select({
      data: sql`date_trunc('day', ${postoMuriciAbastecimentos.dataRegistro})`,
      totalLitros: sql`sum(${postoMuriciAbastecimentos.quantidadeLitros})`,
      totalValor: sql`sum(${postoMuriciAbastecimentos.valorTotal})`,
      totalAbastecimentos: sql`count(*)`
    }).from(postoMuriciAbastecimentos)
    .where(and(...conditions))
    .groupBy(sql`date_trunc('day', ${postoMuriciAbastecimentos.dataRegistro})`)
    .orderBy(sql`date_trunc('day', ${postoMuriciAbastecimentos.dataRegistro})`);
    
    // Organizar os dados por tipo de combustível
    const resumoPorCombustivel: Record<string, any> = {};
    resumoPorCombustivelQuery.forEach(item => {
      resumoPorCombustivel[item.tipoCombustivel] = {
        litros: item.litros || 0,
        valor: item.valor || 0,
        contagem: item.contagem || 0
      };
    });
    
    // Garantir que temos valores para diesel e arla, mesmo que sejam zero
    if (!resumoPorCombustivel.diesel) {
      resumoPorCombustivel.diesel = { litros: 0, valor: 0, contagem: 0 };
    }
    if (!resumoPorCombustivel.arla) {
      resumoPorCombustivel.arla = { litros: 0, valor: 0, contagem: 0 };
    }
    
    // Organizar os dados por tipo de veículo
    const resumoPorVeiculo: Record<string, any> = {};
    resumoPorVeiculoQuery.forEach(item => {
      resumoPorVeiculo[item.tipoVeiculo] = {
        litros: item.litros || 0,
        valor: item.valor || 0,
        contagem: item.contagem || 0
      };
    });
    
    // Garantir que temos valores para frota e agregado, mesmo que sejam zero
    if (!resumoPorVeiculo.frota) {
      resumoPorVeiculo.frota = { litros: 0, valor: 0, contagem: 0 };
    }
    if (!resumoPorVeiculo.agregado) {
      resumoPorVeiculo.agregado = { litros: 0, valor: 0, contagem: 0 };
    }
    
    res.json({
      periodo: {
        dataInicio,
        dataFim
      },
      resumo: {
        totalAbastecimentos: resumoQuery[0]?.totalAbastecimentos || 0,
        totalLitros: resumoQuery[0]?.totalLitros || 0,
        totalValor: resumoQuery[0]?.totalValor || 0,
        diesel: resumoPorCombustivel.diesel,
        arla: resumoPorCombustivel.arla,
        frota: resumoPorVeiculo.frota,
        agregado: resumoPorVeiculo.agregado
      },
      top10Veiculos: top10VeiculosQuery,
      estatisticasDiarias: estatisticasDiariasQuery
    });
  } catch (error: any) {
    console.error('Erro ao gerar estatísticas:', error);
    res.status(500).json({ message: error.message || 'Erro ao gerar estatísticas' });
  }
});

// Registrar abastecimento
router.post('/abastecimentos', isAuthenticated, async (req, res) => {
  try {
    const { postoId, tanqueId, placa, km, tipoVeiculo, tipoCombustivel, quantidadeLitros, motorista, rgMotorista, observacoes } = req.body;
    
    // Verificar se o posto existe
    const [posto] = await db.select().from(postoMuriciPostos).where(eq(postoMuriciPostos.id, postoId));
    if (!posto) {
      return res.status(404).json({ message: 'Posto não encontrado' });
    }
    
    // Buscar o tanque para verificar o nível e obter o valor do litro
    const [tanque] = await db.select().from(postoMuriciTanques)
      .where(and(
        eq(postoMuriciTanques.postoId, postoId),
        eq(postoMuriciTanques.tipo, tipoCombustivel)
      ));
    
    if (!tanque) {
      return res.status(404).json({ message: `Tanque de ${tipoCombustivel} não encontrado` });
    }
    
    // Verificar se há combustível suficiente
    if (parseFloat(tanque.nivelAtual) < parseFloat(quantidadeLitros)) {
      return res.status(400).json({ message: 'Nível de combustível insuficiente no tanque' });
    }
    
    // Determinar o valor do litro baseado no tipo de veículo
    const valorLitro = tipoVeiculo === 'frota' ? tanque.valorLitroFrota : tanque.valorLitroAgregado;
    
    // Calcular o valor total
    const valorTotal = parseFloat(valorLitro) * parseFloat(quantidadeLitros);
    
    // Registrar o abastecimento
    const [abastecimento] = await db.insert(postoMuriciAbastecimentos)
      .values({
        postoId,
        tanqueId: tanque.id,
        placa: placa.toUpperCase(),
        km,
        tipoVeiculo,
        tipoCombustivel,
        quantidadeLitros,
        valorLitro,
        valorTotal,
        motorista,
        rgMotorista,
        observacoes,
        usuarioId: req.user?.id,
        dataRegistro: new Date()
      })
      .returning();
    
    res.status(201).json(abastecimento);
  } catch (error: any) {
    console.error('Erro ao registrar abastecimento:', error);
    res.status(500).json({ message: error.message || 'Erro ao registrar abastecimento' });
  }
});

// Registrar movimentação de pátio
router.post('/movimentacoes', isAuthenticated, async (req, res) => {
  try {
    const { postoId, placa, motorista, rgMotorista, tipoOperacao, baseDestino, observacoes } = req.body;
    
    // Verificar se o posto existe
    const [posto] = await db.select().from(postoMuriciPostos).where(eq(postoMuriciPostos.id, postoId));
    if (!posto) {
      return res.status(404).json({ message: 'Posto não encontrado' });
    }
    
    // Registrar a movimentação
    const [movimentacao] = await db.insert(postoMuriciMovimentacoesPatio)
      .values({
        postoId,
        placa: placa.toUpperCase(),
        motorista,
        rgMotorista,
        tipoOperacao,
        baseDestino,
        observacoes,
        usuarioId: req.user?.id,
        dataRegistro: new Date()
      })
      .returning();
    
    res.status(201).json(movimentacao);
  } catch (error: any) {
    console.error('Erro ao registrar movimentação:', error);
    res.status(500).json({ message: error.message || 'Erro ao registrar movimentação' });
  }
});

// ======= ROTAS ADMINISTRATIVAS (REQUER PRIVILÉGIOS DE ADMIN) =======

// Criar um novo tanque
router.post('/tanques', isAdmin, async (req, res) => {
  try {
    const { postoId, tipo, capacidadeTotal, nivelAtual, valorLitroFrota, valorLitroAgregado } = req.body;
    
    // Verificar se o posto existe
    const [posto] = await db.select().from(postoMuriciPostos).where(eq(postoMuriciPostos.id, postoId));
    if (!posto) {
      return res.status(404).json({ message: 'Posto não encontrado' });
    }
    
    // Verificar se já existe um tanque do mesmo tipo para o posto
    const [tanqueExistente] = await db.select()
      .from(postoMuriciTanques)
      .where(and(
        eq(postoMuriciTanques.postoId, postoId),
        eq(postoMuriciTanques.tipo, tipo)
      ));
    
    if (tanqueExistente) {
      return res.status(400).json({ message: `O posto já possui um tanque de ${tipo}` });
    }
    
    // Criar o tanque
    const [tanque] = await db.insert(postoMuriciTanques)
      .values({
        postoId,
        tipo,
        capacidadeTotal,
        nivelAtual,
        valorLitroFrota,
        valorLitroAgregado,
        ultimaAtualizacao: new Date()
      })
      .returning();
    
    res.status(201).json(tanque);
  } catch (error: any) {
    console.error('Erro ao criar tanque:', error);
    res.status(500).json({ message: error.message || 'Erro ao criar tanque' });
  }
});

// Abastecer tanque
router.post('/tanques/:id/abastecer', isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID do tanque inválido' });
    }
    
    const { quantidadeLitros, valorLitro, notaFiscal, fornecedor } = req.body;
    
    // Verificar se o tanque existe
    const [tanque] = await db.select().from(postoMuriciTanques).where(eq(postoMuriciTanques.id, id));
    if (!tanque) {
      return res.status(404).json({ message: 'Tanque não encontrado' });
    }
    
    // Verificar se a quantidade não excede a capacidade
    const novoNivel = parseFloat(tanque.nivelAtual) + parseFloat(quantidadeLitros);
    if (novoNivel > parseFloat(tanque.capacidadeTotal)) {
      return res.status(400).json({ message: 'Quantidade excede a capacidade do tanque' });
    }
    
    // Calcular o valor total
    const valorTotal = parseFloat(valorLitro) * parseFloat(quantidadeLitros);
    
    // Registrar o abastecimento do tanque
    const [abastecimento] = await db.insert(postoMuriciAbastecimentosTanque)
      .values({
        postoId: tanque.postoId,
        tanqueId: id,
        quantidadeLitros,
        valorLitro,
        valorTotal,
        notaFiscal,
        fornecedor,
        usuarioId: req.user?.id,
        dataRegistro: new Date()
      })
      .returning();
    
    res.status(201).json(abastecimento);
  } catch (error: any) {
    console.error('Erro ao abastecer tanque:', error);
    res.status(500).json({ message: error.message || 'Erro ao abastecer tanque' });
  }
});

// Atualizar valores do litro
router.put('/tanques/:id/valores', isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID do tanque inválido' });
    }
    
    const { valorLitroFrota, valorLitroAgregado } = req.body;
    
    // Verificar se o tanque existe
    const [tanque] = await db.select().from(postoMuriciTanques).where(eq(postoMuriciTanques.id, id));
    if (!tanque) {
      return res.status(404).json({ message: 'Tanque não encontrado' });
    }
    
    // Atualizar os valores
    const [tanqueAtualizado] = await db.update(postoMuriciTanques)
      .set({
        valorLitroFrota,
        valorLitroAgregado,
        ultimaAtualizacao: new Date()
      })
      .where(eq(postoMuriciTanques.id, id))
      .returning();
    
    res.json(tanqueAtualizado);
  } catch (error: any) {
    console.error('Erro ao atualizar valores do litro:', error);
    res.status(500).json({ message: error.message || 'Erro ao atualizar valores do litro' });
  }
});

// ======= ROTAS PÚBLICAS (SEM AUTENTICAÇÃO) =======

// Obter posto por código (público)
router.get('/public/postos/codigo/:codigo', async (req, res) => {
  try {
    const codigo = req.params.codigo.toUpperCase();
    const [posto] = await db.select().from(postoMuriciPostos).where(eq(postoMuriciPostos.codigo, codigo));
    
    if (!posto) {
      return res.status(404).json({ message: 'Posto não encontrado' });
    }
    
    res.json(posto);
  } catch (error: any) {
    console.error('Erro ao buscar posto por código (público):', error);
    res.status(500).json({ message: error.message || 'Erro ao buscar posto por código' });
  }
});

// Obter tanques de um posto (público)
router.get('/public/tanques/posto/:postoId', async (req, res) => {
  try {
    const postoId = parseInt(req.params.postoId);
    if (isNaN(postoId)) {
      return res.status(400).json({ message: 'ID do posto inválido' });
    }

    const tanques = await db.select().from(postoMuriciTanques).where(eq(postoMuriciTanques.postoId, postoId));
    res.json(tanques);
  } catch (error: any) {
    console.error('Erro ao buscar tanques do posto (público):', error);
    res.status(500).json({ message: error.message || 'Erro ao buscar tanques do posto' });
  }
});

// Registrar abastecimento (público)
router.post('/public/abastecimentos', async (req, res) => {
  try {
    const { postoId, placa, km, tipoVeiculo, tipoCombustivel, quantidadeLitros, motorista, rgMotorista, observacoes } = req.body;
    
    // Verificar se o posto existe
    const [posto] = await db.select().from(postoMuriciPostos).where(eq(postoMuriciPostos.id, postoId));
    if (!posto) {
      return res.status(404).json({ message: 'Posto não encontrado' });
    }
    
    // Buscar o tanque para verificar o nível e obter o valor do litro
    const [tanque] = await db.select().from(postoMuriciTanques)
      .where(and(
        eq(postoMuriciTanques.postoId, postoId),
        eq(postoMuriciTanques.tipo, tipoCombustivel)
      ));
    
    if (!tanque) {
      return res.status(404).json({ message: `Tanque de ${tipoCombustivel} não encontrado` });
    }
    
    // Verificar se há combustível suficiente
    if (parseFloat(tanque.nivelAtual) < parseFloat(quantidadeLitros)) {
      return res.status(400).json({ message: 'Nível de combustível insuficiente no tanque' });
    }
    
    // Determinar o valor do litro baseado no tipo de veículo
    const valorLitro = tipoVeiculo === 'frota' ? tanque.valorLitroFrota : tanque.valorLitroAgregado;
    
    // Calcular o valor total
    const valorTotal = parseFloat(valorLitro) * parseFloat(quantidadeLitros);
    
    // Registrar o abastecimento
    const [abastecimento] = await db.insert(postoMuriciAbastecimentos)
      .values({
        postoId,
        tanqueId: tanque.id,
        placa: placa.toUpperCase(),
        km,
        tipoVeiculo,
        tipoCombustivel,
        quantidadeLitros,
        valorLitro,
        valorTotal,
        motorista,
        rgMotorista,
        observacoes,
        dataRegistro: new Date()
      })
      .returning();
    
    res.status(201).json(abastecimento);
  } catch (error: any) {
    console.error('Erro ao registrar abastecimento (público):', error);
    res.status(500).json({ message: error.message || 'Erro ao registrar abastecimento' });
  }
});

// Registrar movimentação de pátio (público)
router.post('/public/movimentacoes', async (req, res) => {
  try {
    const { postoId, placa, motorista, rgMotorista, tipoOperacao, baseDestino, observacoes } = req.body;
    
    // Verificar se o posto existe
    const [posto] = await db.select().from(postoMuriciPostos).where(eq(postoMuriciPostos.id, postoId));
    if (!posto) {
      return res.status(404).json({ message: 'Posto não encontrado' });
    }
    
    // Registrar a movimentação
    const [movimentacao] = await db.insert(postoMuriciMovimentacoesPatio)
      .values({
        postoId,
        placa: placa.toUpperCase(),
        motorista,
        rgMotorista,
        tipoOperacao,
        baseDestino,
        observacoes,
        dataRegistro: new Date()
      })
      .returning();
    
    res.status(201).json(movimentacao);
  } catch (error: any) {
    console.error('Erro ao registrar movimentação (público):', error);
    res.status(500).json({ message: error.message || 'Erro ao registrar movimentação' });
  }
});

export default router;
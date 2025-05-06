/**
 * Rotas para o sistema de Posto Campinas
 */
import { Request, Response, Router } from 'express';
import { db } from '../db';
import { eq, desc, and, gte, lte, sql, like } from 'drizzle-orm';
import { users } from '@shared/schema';
import { 
  postoCampinasAbastecimentos, 
  postoCampinasTanques, 
  postoCampinasAbastecimentosTanque,
  postoCampinasConfiguracoes,
  insertAbastecimentoSchema,
  insertTanqueSchema,
  insertAbastecimentoTanqueSchema,
  updateTanqueValoresSchema
} from '@shared/posto-campinas-schema';
import { createClient } from '@supabase/supabase-js';

// Cliente Supabase para autenticação
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Erro: Variáveis de ambiente do Supabase não estão definidas corretamente");
  console.log("SUPABASE_URL disponível:", !!supabaseUrl);
  console.log("SUPABASE_SERVICE_KEY disponível:", !!supabaseKey);
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

// Middleware de autenticação
const authMiddleware = async (req: Request, res: Response, next: Function) => {
  try {
    // Verificar se está autenticado via session do Express
    if (req.isAuthenticated() && req.user) {
      // Definir o ID do usuário autenticado
      req.body.operadorId = req.user.id;
      return next();
    }

    // Verificar token JWT do Supabase
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Não autenticado' });
    }

    const token = authHeader.split(' ')[1];
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    // Buscar o ID do usuário no banco de dados usando o email do Supabase
    const users = await db.query.users.findMany({
      where: eq(sql`LOWER(users.email)`, data.user.email!.toLowerCase())
    });

    if (!users || users.length === 0) {
      return res.status(403).json({ message: 'Usuário não encontrado' });
    }

    // Definir o ID do usuário autenticado
    req.body.operadorId = users[0].id;
    next();
  } catch (error) {
    console.error('Erro de autenticação:', error);
    return res.status(500).json({ message: 'Erro interno de autenticação' });
  }
};

// Middleware para verificar permissão de administrador
const adminMiddleware = async (req: Request, res: Response, next: Function) => {
  try {
    // Verificar se está autenticado via session do Express
    if (req.isAuthenticated() && req.user && req.user.role === 'admin') {
      return next();
    }

    // Verificar token JWT do Supabase
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Não autenticado' });
    }

    const token = authHeader.split(' ')[1];
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    // Buscar o usuário no banco de dados usando o email do Supabase
    const users = await db.query.users.findMany({
      where: eq(sql`LOWER(users.email)`, data.user.email!.toLowerCase())
    });

    if (!users || users.length === 0 || users[0].role !== 'admin') {
      return res.status(403).json({ message: 'Acesso negado. Permissão de administrador necessária.' });
    }

    // Definir o ID do usuário autenticado
    req.body.operadorId = users[0].id;
    next();
  } catch (error) {
    console.error('Erro de autenticação admin:', error);
    return res.status(500).json({ message: 'Erro interno de autenticação' });
  }
};

const router = Router();

// === Rotas para Abastecimentos ===

// Registrar um abastecimento
router.post('/abastecimentos', authMiddleware, async (req: Request, res: Response) => {
  try {
    const validatedData = insertAbastecimentoSchema.parse(req.body);
    
    // Buscar o valor do litro no tanque correspondente
    const tanque = await db.query.postoCampinasTanques.findFirst({
      where: eq(postoCampinasTanques.tipo, validatedData.tipoCombustivel)
    });
    
    if (!tanque) {
      return res.status(404).json({ message: `Tanque de ${validatedData.tipoCombustivel} não encontrado` });
    }
    
    // Determinar o valor do litro com base no tipo de veículo
    const valorLitro = validatedData.tipoVeiculo === 'frota' 
      ? Number(tanque.valorLitroFrota) 
      : Number(tanque.valorLitroAgregado);
    
    // Calcular o valor total
    const valorTotal = valorLitro * Number(validatedData.quantidadeLitros);
    
    // Verificar se há combustível suficiente no tanque
    if (Number(tanque.nivelAtual) < Number(validatedData.quantidadeLitros)) {
      return res.status(400).json({ 
        message: `Combustível insuficiente. Disponível: ${tanque.nivelAtual} litros` 
      });
    }
    
    // Iniciar transação
    const abastecimento = await db.transaction(async (tx) => {
      // Registrar o abastecimento
      const [novoAbastecimento] = await tx
        .insert(postoCampinasAbastecimentos)
        .values({
          ...validatedData,
          valorLitro,
          valorTotal,
          dataRegistro: new Date(),
          operadorId: req.body.operadorId,
        })
        .returning();
      
      // Atualizar o nível do tanque
      await tx
        .update(postoCampinasTanques)
        .set({ 
          nivelAtual: sql`${postoCampinasTanques.nivelAtual} - ${validatedData.quantidadeLitros}`,
          ultimaAtualizacao: new Date(),
        })
        .where(eq(postoCampinasTanques.id, tanque.id));
      
      return novoAbastecimento;
    });
    
    res.status(201).json(abastecimento);
  } catch (error: any) {
    console.error('Erro ao registrar abastecimento:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
    }
    res.status(500).json({ message: 'Erro ao registrar abastecimento' });
  }
});

// Listar abastecimentos com filtros
router.get('/abastecimentos', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { 
      dataInicio, 
      dataFim, 
      placa, 
      tipoCombustivel, 
      tipoVeiculo,
      limit = '100',
      offset = '0'
    } = req.query;
    
    // Construir condições de filtro
    let conditions: any[] = [];
    
    if (dataInicio) {
      conditions.push(gte(postoCampinasAbastecimentos.dataRegistro, new Date(dataInicio as string)));
    }
    
    if (dataFim) {
      conditions.push(lte(postoCampinasAbastecimentos.dataRegistro, new Date(dataFim as string)));
    }
    
    if (placa) {
      conditions.push(like(postoCampinasAbastecimentos.placa, `%${placa}%`));
    }
    
    if (tipoCombustivel) {
      conditions.push(eq(postoCampinasAbastecimentos.tipoCombustivel, tipoCombustivel as string));
    }
    
    if (tipoVeiculo) {
      conditions.push(eq(postoCampinasAbastecimentos.tipoVeiculo, tipoVeiculo as string));
    }
    
    // Construir a query com os filtros
    const query = conditions.length > 0
      ? db.select()
        .from(postoCampinasAbastecimentos)
        .where(and(...conditions))
        .orderBy(desc(postoCampinasAbastecimentos.dataRegistro))
        .limit(Number(limit))
        .offset(Number(offset))
      : db.select()
        .from(postoCampinasAbastecimentos)
        .orderBy(desc(postoCampinasAbastecimentos.dataRegistro))
        .limit(Number(limit))
        .offset(Number(offset));
    
    const abastecimentos = await query;
    
    // Contar o total de registros para paginação
    const countQuery = conditions.length > 0
      ? db.select({ count: sql<number>`count(*)` })
        .from(postoCampinasAbastecimentos)
        .where(and(...conditions))
      : db.select({ count: sql<number>`count(*)` })
        .from(postoCampinasAbastecimentos);
    
    const [countResult] = await countQuery;
    
    res.json({
      data: abastecimentos,
      pagination: {
        total: countResult?.count || 0,
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  } catch (error) {
    console.error('Erro ao listar abastecimentos:', error);
    res.status(500).json({ message: 'Erro ao listar abastecimentos' });
  }
});

// Obter detalhes de um abastecimento
router.get('/abastecimentos/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const abastecimento = await db.query.postoCampinasAbastecimentos.findFirst({
      where: eq(postoCampinasAbastecimentos.id, Number(req.params.id))
    });
    
    if (!abastecimento) {
      return res.status(404).json({ message: 'Abastecimento não encontrado' });
    }
    
    res.json(abastecimento);
  } catch (error) {
    console.error('Erro ao buscar abastecimento:', error);
    res.status(500).json({ message: 'Erro ao buscar abastecimento' });
  }
});

// === Rotas para Tanques ===

// Listar todos os tanques
router.get('/tanques', authMiddleware, async (_req: Request, res: Response) => {
  try {
    const tanques = await db.select().from(postoCampinasTanques);
    res.json(tanques);
  } catch (error) {
    console.error('Erro ao listar tanques:', error);
    res.status(500).json({ message: 'Erro ao listar tanques' });
  }
});

// Obter detalhes de um tanque
router.get('/tanques/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const tanque = await db.query.postoCampinasTanques.findFirst({
      where: eq(postoCampinasTanques.id, Number(req.params.id))
    });
    
    if (!tanque) {
      return res.status(404).json({ message: 'Tanque não encontrado' });
    }
    
    res.json(tanque);
  } catch (error) {
    console.error('Erro ao buscar tanque:', error);
    res.status(500).json({ message: 'Erro ao buscar tanque' });
  }
});

// Criar um novo tanque (apenas admin)
router.post('/tanques', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const validatedData = insertTanqueSchema.parse(req.body);
    
    // Verificar se já existe um tanque do mesmo tipo
    const tanqueExistente = await db.query.postoCampinasTanques.findFirst({
      where: eq(postoCampinasTanques.tipo, validatedData.tipo)
    });
    
    if (tanqueExistente) {
      return res.status(400).json({ 
        message: `Já existe um tanque do tipo ${validatedData.tipo}` 
      });
    }
    
    const [novoTanque] = await db
      .insert(postoCampinasTanques)
      .values({
        ...validatedData,
        ultimaAtualizacao: new Date(),
      })
      .returning();
    
    res.status(201).json(novoTanque);
  } catch (error: any) {
    console.error('Erro ao criar tanque:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
    }
    res.status(500).json({ message: 'Erro ao criar tanque' });
  }
});

// Atualizar os valores do litro de um tanque (apenas admin)
router.put('/tanques/:id/valores', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const validatedData = updateTanqueValoresSchema.parse({
      ...req.body,
      tanqueId: Number(req.params.id)
    });
    
    // Verificar se o tanque existe
    const tanque = await db.query.postoCampinasTanques.findFirst({
      where: eq(postoCampinasTanques.id, validatedData.tanqueId)
    });
    
    if (!tanque) {
      return res.status(404).json({ message: 'Tanque não encontrado' });
    }
    
    // Atualizar os valores
    const [tanqueAtualizado] = await db
      .update(postoCampinasTanques)
      .set({ 
        valorLitroFrota: validatedData.valorLitroFrota,
        valorLitroAgregado: validatedData.valorLitroAgregado,
        updatedAt: new Date()
      })
      .where(eq(postoCampinasTanques.id, validatedData.tanqueId))
      .returning();
    
    res.json(tanqueAtualizado);
  } catch (error: any) {
    console.error('Erro ao atualizar valores do tanque:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
    }
    res.status(500).json({ message: 'Erro ao atualizar valores do tanque' });
  }
});

// Registrar abastecimento de tanque (apenas admin)
router.post('/tanques/:id/abastecer', adminMiddleware, async (req: Request, res: Response) => {
  try {
    const tanqueId = Number(req.params.id);
    
    // Validar os dados
    const validatedData = insertAbastecimentoTanqueSchema.parse({
      ...req.body,
      tanqueId
    });
    
    // Verificar se o tanque existe
    const tanque = await db.query.postoCampinasTanques.findFirst({
      where: eq(postoCampinasTanques.id, tanqueId)
    });
    
    if (!tanque) {
      return res.status(404).json({ message: 'Tanque não encontrado' });
    }
    
    // Iniciar transação
    const result = await db.transaction(async (tx) => {
      // Registrar o abastecimento do tanque
      const [abastecimentoTanque] = await tx
        .insert(postoCampinasAbastecimentosTanque)
        .values({
          ...validatedData,
          dataRegistro: new Date(),
          operadorId: req.body.operadorId,
        })
        .returning();
      
      // Atualizar o nível do tanque
      const [tanqueAtualizado] = await tx
        .update(postoCampinasTanques)
        .set({ 
          nivelAtual: sql`${postoCampinasTanques.nivelAtual} + ${validatedData.quantidadeLitros}`,
          ultimaAtualizacao: new Date(),
        })
        .where(eq(postoCampinasTanques.id, tanqueId))
        .returning();
      
      return { abastecimentoTanque, tanqueAtualizado };
    });
    
    res.status(201).json(result);
  } catch (error: any) {
    console.error('Erro ao abastecer tanque:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
    }
    res.status(500).json({ message: 'Erro ao abastecer tanque' });
  }
});

// === Rotas para Dashboard e Estatísticas ===

// Obter estatísticas gerais
router.get('/estatisticas', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { dataInicio, dataFim } = req.query;
    
    // Definir período para filtro
    const inicio = dataInicio 
      ? new Date(dataInicio as string) 
      : new Date(new Date().setDate(new Date().getDate() - 30)); // Últimos 30 dias por padrão
    
    const fim = dataFim 
      ? new Date(dataFim as string) 
      : new Date();
    
    // Estatísticas de abastecimentos
    const [totalAbastecimentos] = await db
      .select({
        count: sql<number>`count(*)`,
        totalLitros: sql<number>`sum(${postoCampinasAbastecimentos.quantidadeLitros})`,
        totalValor: sql<number>`sum(${postoCampinasAbastecimentos.valorTotal})`,
        totalDiesel: sql<number>`sum(case when ${postoCampinasAbastecimentos.tipoCombustivel} = 'diesel' then ${postoCampinasAbastecimentos.quantidadeLitros} else 0 end)`,
        totalArla: sql<number>`sum(case when ${postoCampinasAbastecimentos.tipoCombustivel} = 'arla' then ${postoCampinasAbastecimentos.quantidadeLitros} else 0 end)`,
        totalFrota: sql<number>`sum(case when ${postoCampinasAbastecimentos.tipoVeiculo} = 'frota' then ${postoCampinasAbastecimentos.quantidadeLitros} else 0 end)`,
        totalAgregado: sql<number>`sum(case when ${postoCampinasAbastecimentos.tipoVeiculo} = 'agregado' then ${postoCampinasAbastecimentos.quantidadeLitros} else 0 end)`,
      })
      .from(postoCampinasAbastecimentos)
      .where(and(
        gte(postoCampinasAbastecimentos.dataRegistro, inicio),
        lte(postoCampinasAbastecimentos.dataRegistro, fim)
      ));
    
    // Estatísticas por dia (para gráficos)
    const estatisticasDiarias = await db
      .select({
        data: sql<string>`to_char(${postoCampinasAbastecimentos.dataRegistro}, 'YYYY-MM-DD')`,
        totalLitros: sql<number>`sum(${postoCampinasAbastecimentos.quantidadeLitros})`,
        totalValor: sql<number>`sum(${postoCampinasAbastecimentos.valorTotal})`,
        totalDiesel: sql<number>`sum(case when ${postoCampinasAbastecimentos.tipoCombustivel} = 'diesel' then ${postoCampinasAbastecimentos.quantidadeLitros} else 0 end)`,
        totalArla: sql<number>`sum(case when ${postoCampinasAbastecimentos.tipoCombustivel} = 'arla' then ${postoCampinasAbastecimentos.quantidadeLitros} else 0 end)`,
      })
      .from(postoCampinasAbastecimentos)
      .where(and(
        gte(postoCampinasAbastecimentos.dataRegistro, inicio),
        lte(postoCampinasAbastecimentos.dataRegistro, fim)
      ))
      .groupBy(sql`to_char(${postoCampinasAbastecimentos.dataRegistro}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${postoCampinasAbastecimentos.dataRegistro}, 'YYYY-MM-DD')`);
    
    // Estatísticas por veículo
    const top10Veiculos = await db
      .select({
        placa: postoCampinasAbastecimentos.placa,
        totalLitros: sql<number>`sum(${postoCampinasAbastecimentos.quantidadeLitros})`,
        totalAbastecimentos: sql<number>`count(*)`,
        totalValor: sql<number>`sum(${postoCampinasAbastecimentos.valorTotal})`,
      })
      .from(postoCampinasAbastecimentos)
      .where(and(
        gte(postoCampinasAbastecimentos.dataRegistro, inicio),
        lte(postoCampinasAbastecimentos.dataRegistro, fim)
      ))
      .groupBy(postoCampinasAbastecimentos.placa)
      .orderBy(sql<number>`sum(${postoCampinasAbastecimentos.quantidadeLitros})`, 'desc')
      .limit(10);
    
    // Níveis atuais dos tanques
    const tanques = await db.select().from(postoCampinasTanques);
    
    // Montar resposta consolidada
    const resultado = {
      periodo: {
        inicio: inicio.toISOString(),
        fim: fim.toISOString()
      },
      resumo: {
        totalAbastecimentos: totalAbastecimentos?.count || 0,
        totalLitros: totalAbastecimentos?.totalLitros || 0,
        totalValor: totalAbastecimentos?.totalValor || 0,
        diesel: {
          litros: totalAbastecimentos?.totalDiesel || 0,
        },
        arla: {
          litros: totalAbastecimentos?.totalArla || 0,
        },
        frota: {
          litros: totalAbastecimentos?.totalFrota || 0,
        },
        agregado: {
          litros: totalAbastecimentos?.totalAgregado || 0,
        }
      },
      estatisticasDiarias,
      top10Veiculos,
      tanques
    };
    
    res.json(resultado);
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ message: 'Erro ao obter estatísticas' });
  }
});

export default router;
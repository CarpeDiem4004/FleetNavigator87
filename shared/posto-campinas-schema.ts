import { pgTable, serial, text, numeric, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * Tabela de abastecimentos do Posto Campinas
 */
export const postoCampinasAbastecimentos = pgTable('posto_campinas_abastecimentos', {
  id: serial('id').primaryKey(),
  placa: text('placa').notNull(),
  km: integer('km').notNull(),
  tipoVeiculo: text('tipo_veiculo').notNull(), // 'frota' ou 'agregado'
  tipoCombustivel: text('tipo_combustivel').notNull(), // 'diesel' ou 'arla'
  quantidadeLitros: numeric('quantidade_litros', { precision: 10, scale: 2 }).notNull(),
  valorLitro: numeric('valor_litro', { precision: 10, scale: 2 }).notNull(),
  valorTotal: numeric('valor_total', { precision: 10, scale: 2 }).notNull(),
  motorista: text('motorista').notNull(),
  observacoes: text('observacoes'),
  dataRegistro: timestamp('data_registro').defaultNow(),
  operadorId: integer('operador_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

/**
 * Tabela de configuração de tanques do Posto Campinas
 */
export const postoCampinasTanques = pgTable('posto_campinas_tanques', {
  id: serial('id').primaryKey(),
  tipo: text('tipo').notNull(), // 'diesel' ou 'arla'
  capacidadeTotal: numeric('capacidade_total', { precision: 10, scale: 2 }).notNull(),
  nivelAtual: numeric('nivel_atual', { precision: 10, scale: 2 }).notNull(),
  valorLitroFrota: numeric('valor_litro_frota', { precision: 10, scale: 2 }).notNull(),
  valorLitroAgregado: numeric('valor_litro_agregado', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  ultimaAtualizacao: timestamp('ultima_atualizacao').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

/**
 * Tabela de abastecimentos do tanque principal
 */
export const postoCampinasAbastecimentosTanque = pgTable('posto_campinas_abastecimentos_tanque', {
  id: serial('id').primaryKey(),
  tanqueId: integer('tanque_id').notNull().references(() => postoCampinasTanques.id),
  quantidadeLitros: numeric('quantidade_litros', { precision: 10, scale: 2 }).notNull(),
  valorLitro: numeric('valor_litro', { precision: 10, scale: 2 }).notNull(),
  valorTotal: numeric('valor_total', { precision: 10, scale: 2 }).notNull(),
  notaFiscal: text('nota_fiscal'),
  fornecedor: text('fornecedor'),
  dataRegistro: timestamp('data_registro').defaultNow(),
  operadorId: integer('operador_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

/**
 * Tabela de configurações de preços do posto
 */
export const postoCampinasConfiguracoes = pgTable('posto_campinas_configuracoes', {
  id: serial('id').primaryKey(),
  chave: text('chave').notNull().unique(),
  valor: text('valor').notNull(),
  descricao: text('descricao'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

/**
 * Schemas Zod para validação
 */
export const insertAbastecimentoSchema = createInsertSchema(postoCampinasAbastecimentos)
  .omit({ id: true, valorLitro: true, valorTotal: true, dataRegistro: true, createdAt: true, updatedAt: true })
  .extend({
    placa: z.string().min(7).max(10),
    km: z.number().int().positive(),
    tipoVeiculo: z.enum(['frota', 'agregado']),
    tipoCombustivel: z.enum(['diesel', 'arla']),
    quantidadeLitros: z.number().positive().lt(10000),
    motorista: z.string().min(3).max(100)
  });

export const insertTanqueSchema = createInsertSchema(postoCampinasTanques)
  .omit({ id: true, createdAt: true, ultimaAtualizacao: true, updatedAt: true })
  .extend({
    tipo: z.enum(['diesel', 'arla']),
    capacidadeTotal: z.number().positive(),
    nivelAtual: z.number().min(0),
    valorLitroFrota: z.number().positive(),
    valorLitroAgregado: z.number().positive()
  });

export const insertAbastecimentoTanqueSchema = createInsertSchema(postoCampinasAbastecimentosTanque)
  .omit({ id: true, valorTotal: true, dataRegistro: true, createdAt: true, updatedAt: true })
  .extend({
    tanqueId: z.number().int().positive(),
    quantidadeLitros: z.number().positive(),
    valorLitro: z.number().positive(),
    notaFiscal: z.string().optional(),
    fornecedor: z.string().optional()
  });

export const updateTanqueValoresSchema = z.object({
  tanqueId: z.number().int().positive(),
  valorLitroFrota: z.number().positive(),
  valorLitroAgregado: z.number().positive()
});

export type InsertAbastecimento = z.infer<typeof insertAbastecimentoSchema>;
export type InsertTanque = z.infer<typeof insertTanqueSchema>;
export type InsertAbastecimentoTanque = z.infer<typeof insertAbastecimentoTanqueSchema>;
export type UpdateTanqueValores = z.infer<typeof updateTanqueValoresSchema>;

export type Abastecimento = typeof postoCampinasAbastecimentos.$inferSelect;
export type Tanque = typeof postoCampinasTanques.$inferSelect;
export type AbastecimentoTanque = typeof postoCampinasAbastecimentosTanque.$inferSelect;
export type Configuracao = typeof postoCampinasConfiguracoes.$inferSelect;
// Schema para o Posto Campinas
import { integer, numeric, pgTable, serial, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

/**
 * Tabela de abastecimentos do Posto Campinas
 */
export const postoCampinasAbastecimentos = pgTable('posto_campinas_abastecimentos', {
  id: serial('id').primaryKey(),
  placa: text('placa').notNull(),
  km: integer('km').notNull(),
  tipoVeiculo: text('tipo_veiculo').notNull(), // 'frota' ou 'agregado'
  motoristaNome: text('motorista_nome').notNull(),
  motoristaRg: text('motorista_rg').notNull(),
  tipoCombustivel: text('tipo_combustivel').notNull(), // 'diesel' ou 'arla'
  quantidadeLitros: numeric('quantidade_litros').notNull(),
  valorLitro: numeric('valor_litro').notNull(),
  valorTotal: numeric('valor_total').notNull(),
  observacoes: text('observacoes'),
  dataRegistro: timestamp('data_registro').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  operadorId: integer('operador_id').notNull(), // ID do usuário que registrou
});

/**
 * Tabela de configuração de tanques do Posto Campinas
 */
export const postoCampinasTanques = pgTable('posto_campinas_tanques', {
  id: serial('id').primaryKey(),
  tipo: text('tipo').notNull(), // 'diesel' ou 'arla'
  capacidadeTotal: numeric('capacidade_total').notNull(),
  nivelAtual: numeric('nivel_atual').notNull(),
  ultimaAtualizacao: timestamp('ultima_atualizacao').defaultNow().notNull(),
  valorLitroFrota: numeric('valor_litro_frota').notNull(),
  valorLitroAgregado: numeric('valor_litro_agregado').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Tabela de abastecimentos do tanque principal
 */
export const postoCampinasAbastecimentosTanque = pgTable('posto_campinas_abastecimentos_tanque', {
  id: serial('id').primaryKey(),
  tanqueId: integer('tanque_id').notNull(),
  quantidadeLitros: numeric('quantidade_litros').notNull(),
  valorLitro: numeric('valor_litro').notNull(),
  valorTotal: numeric('valor_total').notNull(),
  notaFiscal: text('nota_fiscal'),
  fornecedor: text('fornecedor'),
  observacoes: text('observacoes'),
  dataRegistro: timestamp('data_registro').defaultNow().notNull(),
  operadorId: integer('operador_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Tabela de configurações de preços do posto
 */
export const postoCampinasConfiguracoes = pgTable('posto_campinas_configuracoes', {
  id: serial('id').primaryKey(),
  chaveCofiguracao: text('chave_configuracao').notNull().unique(),
  valorConfiguracao: text('valor_configuracao').notNull(),
  descricao: text('descricao'),
  dataAtualizacao: timestamp('data_atualizacao').defaultNow().notNull(),
  atualizadoPor: integer('atualizado_por').notNull(),
});

/**
 * Schemas Zod para validação
 */
export const insertAbastecimentoSchema = createInsertSchema(postoCampinasAbastecimentos)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    placa: z.string().min(1, "Placa é obrigatória").toUpperCase(),
    km: z.number().int().positive("Quilometragem deve ser um número positivo"),
    tipoVeiculo: z.enum(["frota", "agregado"], { 
      required_error: "Tipo de veículo é obrigatório",
      invalid_type_error: "Tipo de veículo deve ser 'frota' ou 'agregado'"
    }),
    motoristaNome: z.string().min(3, "Nome do motorista deve ter pelo menos 3 caracteres"),
    motoristaRg: z.string().min(1, "RG do motorista é obrigatório"),
    tipoCombustivel: z.enum(["diesel", "arla"], {
      required_error: "Tipo de combustível é obrigatório",
      invalid_type_error: "Tipo de combustível deve ser 'diesel' ou 'arla'"
    }),
    quantidadeLitros: z.number().positive("Quantidade deve ser maior que zero"),
  });

export const insertTanqueSchema = createInsertSchema(postoCampinasTanques)
  .omit({ id: true, createdAt: true, updatedAt: true, ultimaAtualizacao: true })
  .extend({
    tipo: z.enum(["diesel", "arla"], {
      required_error: "Tipo de combustível é obrigatório",
      invalid_type_error: "Tipo de combustível deve ser 'diesel' ou 'arla'"
    }),
    capacidadeTotal: z.number().positive("Capacidade deve ser maior que zero"),
    nivelAtual: z.number().min(0, "Nível não pode ser negativo"),
    valorLitroFrota: z.number().positive("Valor deve ser maior que zero"),
    valorLitroAgregado: z.number().positive("Valor deve ser maior que zero"),
  });

export const insertAbastecimentoTanqueSchema = createInsertSchema(postoCampinasAbastecimentosTanque)
  .omit({ id: true, createdAt: true, updatedAt: true, dataRegistro: true })
  .extend({
    quantidadeLitros: z.number().positive("Quantidade deve ser maior que zero"),
    valorLitro: z.number().positive("Valor deve ser maior que zero"),
    valorTotal: z.number().positive("Valor total deve ser maior que zero"),
  });

export const updateTanqueValoresSchema = z.object({
  tanqueId: z.number().int().positive(),
  valorLitroFrota: z.number().positive("Valor deve ser maior que zero"),
  valorLitroAgregado: z.number().positive("Valor deve ser maior que zero"),
});

// Tipos derivados dos schemas
export type InsertAbastecimento = z.infer<typeof insertAbastecimentoSchema>;
export type InsertTanque = z.infer<typeof insertTanqueSchema>;
export type InsertAbastecimentoTanque = z.infer<typeof insertAbastecimentoTanqueSchema>;
export type UpdateTanqueValores = z.infer<typeof updateTanqueValoresSchema>;

// Tipos das tabelas inferidos a partir do Drizzle
export type Abastecimento = typeof postoCampinasAbastecimentos.$inferSelect;
export type Tanque = typeof postoCampinasTanques.$inferSelect;
export type AbastecimentoTanque = typeof postoCampinasAbastecimentosTanque.$inferSelect;
export type Configuracao = typeof postoCampinasConfiguracoes.$inferSelect;
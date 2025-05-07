// Schema para as tabelas do Posto Murici
import { pgTable, serial, text, boolean, timestamp, integer, numeric } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Tabela de postos
export const postoMuriciPostos = pgTable('posto_murici_postos', {
  id: serial('id').primaryKey(),
  nome: text('nome').notNull(),
  codigo: text('codigo').notNull().unique(),
  endereco: text('endereco'),
  cidade: text('cidade').notNull(),
  uf: text('uf').notNull(),
  telefone: text('telefone'),
  responsavel: text('responsavel'),
  emailResponsavel: text('email_responsavel'),
  estaAtivo: boolean('esta_ativo').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Tabela de tanques
export const postoMuriciTanques = pgTable('posto_murici_tanques', {
  id: serial('id').primaryKey(),
  postoId: integer('posto_id').notNull().references(() => postoMuriciPostos.id, { onDelete: 'cascade' }),
  tipo: text('tipo').notNull(),  // diesel, arla, gasolina, etanol
  capacidadeTotal: numeric('capacidade_total', { precision: 10, scale: 2 }).notNull(),
  nivelAtual: numeric('nivel_atual', { precision: 10, scale: 2 }).notNull(),
  valorLitroFrota: numeric('valor_litro_frota', { precision: 10, scale: 2 }).notNull(),
  valorLitroAgregado: numeric('valor_litro_agregado', { precision: 10, scale: 2 }).notNull(),
  ultimaAtualizacao: timestamp('ultima_atualizacao').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Tabela de abastecimentos
export const postoMuriciAbastecimentos = pgTable('posto_murici_abastecimentos', {
  id: serial('id').primaryKey(),
  postoId: integer('posto_id').notNull().references(() => postoMuriciPostos.id, { onDelete: 'cascade' }),
  tanqueId: integer('tanque_id').notNull().references(() => postoMuriciTanques.id, { onDelete: 'cascade' }),
  placa: text('placa').notNull(),
  km: integer('km').notNull(),
  tipoVeiculo: text('tipo_veiculo').notNull(),  // frota, agregado
  tipoCombustivel: text('tipo_combustivel').notNull(),  // diesel, arla, gasolina, etanol
  quantidadeLitros: numeric('quantidade_litros', { precision: 10, scale: 2 }).notNull(),
  valorLitro: numeric('valor_litro', { precision: 10, scale: 2 }).notNull(),
  valorTotal: numeric('valor_total', { precision: 10, scale: 2 }).notNull(),
  motorista: text('motorista').notNull(),
  rgMotorista: text('rg_motorista'),
  usuarioId: integer('usuario_id'),
  observacoes: text('observacoes'),
  dataRegistro: timestamp('data_registro').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Tabela de abastecimentos dos tanques
export const postoMuriciAbastecimentosTanque = pgTable('posto_murici_abastecimentos_tanque', {
  id: serial('id').primaryKey(),
  postoId: integer('posto_id').notNull().references(() => postoMuriciPostos.id, { onDelete: 'cascade' }),
  tanqueId: integer('tanque_id').notNull().references(() => postoMuriciTanques.id, { onDelete: 'cascade' }),
  quantidadeLitros: numeric('quantidade_litros', { precision: 10, scale: 2 }).notNull(),
  valorLitro: numeric('valor_litro', { precision: 10, scale: 2 }).notNull(),
  valorTotal: numeric('valor_total', { precision: 10, scale: 2 }).notNull(),
  notaFiscal: text('nota_fiscal'),
  fornecedor: text('fornecedor'),
  usuarioId: integer('usuario_id'),
  dataRegistro: timestamp('data_registro').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Tabela de configurações
export const postoMuriciConfiguracoes = pgTable('posto_murici_configuracoes', {
  id: serial('id').primaryKey(),
  postoId: integer('posto_id').notNull().references(() => postoMuriciPostos.id, { onDelete: 'cascade' }),
  nomeConfiguracao: text('nome_configuracao').notNull(),
  valor: text('valor'),
  tipo: text('tipo').notNull(),  // texto, numero, booleano, data
  descricao: text('descricao'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Tabela de movimentações do pátio
export const postoMuriciMovimentacoesPatio = pgTable('posto_murici_movimentacoes_patio', {
  id: serial('id').primaryKey(),
  postoId: integer('posto_id').notNull().references(() => postoMuriciPostos.id, { onDelete: 'cascade' }),
  placa: text('placa').notNull(),
  motorista: text('motorista').notNull(),
  rgMotorista: text('rg_motorista'),
  tipoOperacao: text('tipo_operacao').notNull(),  // entrada_pernoite, saida_rota, saida_manutencao, descontinuacao, remanejamento_base, entrada_carregamento, saida_carregamento
  baseDestino: text('base_destino'),
  observacoes: text('observacoes'),
  usuarioId: integer('usuario_id'),
  dataRegistro: timestamp('data_registro').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Esquemas Zod para validação
export const insertPostoMuriciPostoSchema = createInsertSchema(postoMuriciPostos, {
  nome: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  codigo: z.string().min(2, 'O código deve ter pelo menos 2 caracteres').toUpperCase(),
  cidade: z.string().min(2, 'A cidade deve ter pelo menos 2 caracteres'),
  uf: z.string().length(2, 'UF deve ter 2 caracteres').toUpperCase()
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertPostoMuriciTanqueSchema = createInsertSchema(postoMuriciTanques, {
  tipo: z.enum(['diesel', 'arla', 'gasolina', 'etanol'], {
    required_error: 'Tipo de combustível é obrigatório',
    invalid_type_error: 'Tipo de combustível inválido'
  }),
  capacidadeTotal: z.number().positive('Capacidade deve ser maior que zero'),
  nivelAtual: z.number().min(0, 'Nível não pode ser negativo'),
  valorLitroFrota: z.number().positive('Valor do litro deve ser maior que zero'),
  valorLitroAgregado: z.number().positive('Valor do litro deve ser maior que zero')
}).omit({ id: true, ultimaAtualizacao: true, createdAt: true, updatedAt: true });

export const insertPostoMuriciAbastecimentoSchema = createInsertSchema(postoMuriciAbastecimentos, {
  placa: z.string().min(7, 'Placa inválida').max(10, 'Placa muito longa'),
  km: z.number().int('Quilometragem deve ser um número inteiro').positive('Quilometragem deve ser maior que zero'),
  tipoVeiculo: z.enum(['frota', 'agregado'], {
    required_error: 'Tipo de veículo é obrigatório',
    invalid_type_error: 'Tipo de veículo inválido'
  }),
  tipoCombustivel: z.enum(['diesel', 'arla', 'gasolina', 'etanol'], {
    required_error: 'Tipo de combustível é obrigatório',
    invalid_type_error: 'Tipo de combustível inválido'
  }),
  quantidadeLitros: z.number().positive('Quantidade deve ser maior que zero'),
  motorista: z.string().min(3, 'Nome do motorista obrigatório')
}).omit({ id: true, valorLitro: true, valorTotal: true, dataRegistro: true, createdAt: true, updatedAt: true });

export const insertPostoMuriciAbastecimentoTanqueSchema = createInsertSchema(postoMuriciAbastecimentosTanque, {
  quantidadeLitros: z.number().positive('Quantidade deve ser maior que zero'),
  valorLitro: z.number().positive('Valor do litro deve ser maior que zero')
}).omit({ id: true, valorTotal: true, dataRegistro: true, createdAt: true, updatedAt: true });

export const insertPostoMuriciMovimentacaoPatioSchema = createInsertSchema(postoMuriciMovimentacoesPatio, {
  placa: z.string().min(7, 'Placa inválida').max(10, 'Placa muito longa'),
  motorista: z.string().min(3, 'Nome do motorista obrigatório'),
  tipoOperacao: z.enum([
    'entrada_pernoite', 
    'saida_rota', 
    'saida_manutencao', 
    'descontinuacao', 
    'remanejamento_base',
    'entrada_carregamento',
    'saida_carregamento'
  ], {
    required_error: 'Tipo de operação é obrigatório',
    invalid_type_error: 'Tipo de operação inválido'
  })
}).omit({ id: true, dataRegistro: true, createdAt: true, updatedAt: true });

// Tipos de inserção
export type InsertPostoMuriciPosto = z.infer<typeof insertPostoMuriciPostoSchema>;
export type InsertPostoMuriciTanque = z.infer<typeof insertPostoMuriciTanqueSchema>;
export type InsertPostoMuriciAbastecimento = z.infer<typeof insertPostoMuriciAbastecimentoSchema>;
export type InsertPostoMuriciAbastecimentoTanque = z.infer<typeof insertPostoMuriciAbastecimentoTanqueSchema>;
export type InsertPostoMuriciMovimentacaoPatio = z.infer<typeof insertPostoMuriciMovimentacaoPatioSchema>;

// Tipos de seleção
export type PostoMuriciPosto = typeof postoMuriciPostos.$inferSelect;
export type PostoMuriciTanque = typeof postoMuriciTanques.$inferSelect;
export type PostoMuriciAbastecimento = typeof postoMuriciAbastecimentos.$inferSelect;
export type PostoMuriciAbastecimentoTanque = typeof postoMuriciAbastecimentosTanque.$inferSelect;
export type PostoMuriciConfiguracao = typeof postoMuriciConfiguracoes.$inferSelect;
export type PostoMuriciMovimentacaoPatio = typeof postoMuriciMovimentacoesPatio.$inferSelect;
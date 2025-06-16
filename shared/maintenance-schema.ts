import { pgTable, serial, varchar, text, timestamp, integer, decimal, boolean, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const statusOrdemEnum = pgEnum('status_ordem', [
  'pendente',
  'recebido', 
  'em_execucao',
  'aguardando_peca',
  'finalizado',
  'cancelado'
]);

export const tipoManutencaoEnum = pgEnum('tipo_manutencao', [
  'preventiva',
  'corretiva',
  'preditiva',
  'emergencial'
]);

export const userRoleEnum = pgEnum('user_role_maintenance', [
  'admin',
  'gestor_frota',
  'oficina'
]);

// Tabela de oficinas credenciadas
export const oficinas = pgTable('oficinas_credenciadas', {
  id: serial('id').primaryKey(),
  cnpj: varchar('cnpj', { length: 18 }).notNull().unique(),
  razao_social: varchar('razao_social', { length: 255 }).notNull(),
  nome_fantasia: varchar('nome_fantasia', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull(),
  telefone: varchar('telefone', { length: 20 }),
  endereco: text('endereco'),
  cidade: varchar('cidade', { length: 100 }),
  estado: varchar('estado', { length: 2 }),
  cep: varchar('cep', { length: 10 }),
  especialidades: text('especialidades'), // JSON string com especialidades
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

// Tabela de veículos
export const veiculos = pgTable('veiculos_manutencao', {
  id: serial('id').primaryKey(),
  placa: varchar('placa', { length: 8 }).notNull().unique(),
  marca: varchar('marca', { length: 50 }),
  modelo: varchar('modelo', { length: 100 }),
  ano: integer('ano'),
  km_atual: integer('km_atual'),
  tipo_veiculo: varchar('tipo_veiculo', { length: 50 }),
  base_id: integer('base_id'),
  base_name: varchar('base_name', { length: 100 }),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

// Tabela de usuários do sistema de manutenção
export const usuarios = pgTable('usuarios_manutencao', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull(),
  oficina_id: integer('oficina_id').references(() => oficinas.id),
  is_active: boolean('is_active').default(true),
  last_login: timestamp('last_login'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

// Tabela de ordens de serviço
export const ordensServico = pgTable('ordens_servico', {
  id: serial('id').primaryKey(),
  numero_os: varchar('numero_os', { length: 20 }).notNull().unique(),
  veiculo_id: integer('veiculo_id').notNull().references(() => veiculos.id),
  oficina_id: integer('oficina_id').notNull().references(() => oficinas.id),
  tipo_manutencao: tipoManutencaoEnum('tipo_manutencao').notNull(),
  descricao_problema: text('descricao_problema').notNull(),
  status: statusOrdemEnum('status').default('pendente'),
  km_veiculo: integer('km_veiculo'),
  data_agendamento: timestamp('data_agendamento'),
  data_inicio: timestamp('data_inicio'),
  data_previsao_entrega: timestamp('data_previsao_entrega'),
  data_finalizacao: timestamp('data_finalizacao'),
  valor_mao_obra: decimal('valor_mao_obra', { precision: 10, scale: 2 }).default('0'),
  valor_total_pecas: decimal('valor_total_pecas', { precision: 10, scale: 2 }).default('0'),
  valor_total: decimal('valor_total', { precision: 10, scale: 2 }).default('0'),
  observacoes_oficina: text('observacoes_oficina'),
  observacoes_internas: text('observacoes_internas'),
  created_by: integer('created_by').references(() => usuarios.id),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

// Tabela de peças utilizadas na OS
export const pecasOS = pgTable('pecas_os', {
  id: serial('id').primaryKey(),
  ordem_servico_id: integer('ordem_servico_id').notNull().references(() => ordensServico.id),
  nome_peca: varchar('nome_peca', { length: 255 }).notNull(),
  codigo_peca: varchar('codigo_peca', { length: 100 }),
  quantidade: integer('quantidade').notNull(),
  valor_unitario: decimal('valor_unitario', { precision: 10, scale: 2 }).notNull(),
  valor_total: decimal('valor_total', { precision: 10, scale: 2 }).notNull(),
  fornecedor: varchar('fornecedor', { length: 255 }),
  created_at: timestamp('created_at').defaultNow()
});

// Tabela de anexos (notas fiscais, fotos, etc.)
export const anexosOS = pgTable('anexos_os', {
  id: serial('id').primaryKey(),
  ordem_servico_id: integer('ordem_servico_id').notNull().references(() => ordensServico.id),
  nome_arquivo: varchar('nome_arquivo', { length: 255 }).notNull(),
  tipo_arquivo: varchar('tipo_arquivo', { length: 50 }),
  tamanho_arquivo: integer('tamanho_arquivo'),
  url_arquivo: text('url_arquivo').notNull(),
  uploaded_by: integer('uploaded_by').references(() => usuarios.id),
  created_at: timestamp('created_at').defaultNow()
});

// Relations
export const oficinasRelations = relations(oficinas, ({ many, one }) => ({
  ordensServico: many(ordensServico),
  usuarios: many(usuarios)
}));

export const veiculosRelations = relations(veiculos, ({ many }) => ({
  ordensServico: many(ordensServico)
}));

export const usuariosRelations = relations(usuarios, ({ one, many }) => ({
  oficina: one(oficinas, {
    fields: [usuarios.oficina_id],
    references: [oficinas.id]
  }),
  ordensServicoCriadas: many(ordensServico)
}));

export const ordensServicoRelations = relations(ordensServico, ({ one, many }) => ({
  veiculo: one(veiculos, {
    fields: [ordensServico.veiculo_id],
    references: [veiculos.id]
  }),
  oficina: one(oficinas, {
    fields: [ordensServico.oficina_id],
    references: [oficinas.id]
  }),
  createdBy: one(usuarios, {
    fields: [ordensServico.created_by],
    references: [usuarios.id]
  }),
  pecas: many(pecasOS),
  anexos: many(anexosOS)
}));

export const pecasOSRelations = relations(pecasOS, ({ one }) => ({
  ordemServico: one(ordensServico, {
    fields: [pecasOS.ordem_servico_id],
    references: [ordensServico.id]
  })
}));

export const anexosOSRelations = relations(anexosOS, ({ one }) => ({
  ordemServico: one(ordensServico, {
    fields: [anexosOS.ordem_servico_id],
    references: [ordensServico.id]
  }),
  uploadedBy: one(usuarios, {
    fields: [anexosOS.uploaded_by],
    references: [usuarios.id]
  })
}));

// Zod schemas
export const insertOficinaSchema = createInsertSchema(oficinas).omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const insertVeiculoSchema = createInsertSchema(veiculos).omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const insertUsuarioSchema = createInsertSchema(usuarios).omit({
  id: true,
  created_at: true,
  updated_at: true,
  last_login: true
});

export const insertOrdemServicoSchema = createInsertSchema(ordensServico).omit({
  id: true,
  created_at: true,
  updated_at: true,
  numero_os: true,
  valor_total_pecas: true,
  valor_total: true
});

export const insertPecaOSSchema = createInsertSchema(pecasOS).omit({
  id: true,
  created_at: true
});

export const insertAnexoOSSchema = createInsertSchema(anexosOS).omit({
  id: true,
  created_at: true
});

// Types
export type Oficina = typeof oficinas.$inferSelect;
export type InsertOficina = z.infer<typeof insertOficinaSchema>;

export type Veiculo = typeof veiculos.$inferSelect;
export type InsertVeiculo = z.infer<typeof insertVeiculoSchema>;

export type Usuario = typeof usuarios.$inferSelect;
export type InsertUsuario = z.infer<typeof insertUsuarioSchema>;

export type OrdemServico = typeof ordensServico.$inferSelect;
export type InsertOrdemServico = z.infer<typeof insertOrdemServicoSchema>;

export type PecaOS = typeof pecasOS.$inferSelect;
export type InsertPecaOS = z.infer<typeof insertPecaOSSchema>;

export type AnexoOS = typeof anexosOS.$inferSelect;
export type InsertAnexoOS = z.infer<typeof insertAnexoOSSchema>;
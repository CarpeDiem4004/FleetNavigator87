import { pgTable, text, serial, integer, boolean, timestamp, decimal, date, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Create enums for database
export const vehicleTypeEnum = pgEnum('vehicle_type', ['fiorino', 'van', 'vuc', 'toco', 'truck', 'cavalo_mecanico', 'carreta']);
export const vehicleStatusEnum = pgEnum('vehicle_status', ['em_operacao', 'em_manutencao', 'parado']);
export const maintenanceTypeEnum = pgEnum('maintenance_type', ['preventiva', 'corretiva']);
export const maintenanceStatusEnum = pgEnum('maintenance_status', ['concluida', 'em_andamento', 'aguardando_pecas', 'pendente', 'aguardando_orcamento', 'orcamento_aprovado', 'em_negociacao', 'cancelada']);
export const tireStatusEnum = pgEnum('tire_status', ['em_uso', 'estoque', 'descartado']);
export const fuelTypeEnum = pgEnum('fuel_type', ['arla', 'diesel']);
export const fineStatusEnum = pgEnum('fine_status', ['pendente', 'paga', 'contestada']);
export const tripStatusEnum = pgEnum('trip_status', ['programada', 'carregando', 'aguardando_carga', 'em_transito', 'finalizada']);
export const userRoleEnum = pgEnum('user_role', ['admin', 'gestor', 'operador', 'oficina', 'pneus', 'gestor_frota', 'posto']);
export const operationTypeEnum = pgEnum('operation_type', ['carregamento', 'descarga', 'transferencia', 'inventario', 'manutencao']);
export const operationStatusEnum = pgEnum('operation_status', ['pendente', 'em_andamento', 'concluida', 'cancelada']);
export const checklistStatusEnum = pgEnum('checklist_status', ['pendente', 'iniciado', 'concluido']);
export const maintenanceRequestStatusEnum = pgEnum('maintenance_request_status', ['pendente', 'aprovada', 'rejeitada', 'concluida']);
export const refuelingCardStatusEnum = pgEnum('refueling_card_status', ['pendente', 'aprovada', 'rejeitada']);
export const messageAuthorEnum = pgEnum('message_author', ['oficina', 'frota']);
export const vehicleOwnershipEnum = pgEnum('vehicle_ownership', ['murici', 'locado']);
export const paymentStatusEnum = pgEnum('payment_status', ['pendente', 'pago', 'em_processamento', 'cancelado']);

// Enums para sistema de estoque
export const inventoryMovementTypeEnum = pgEnum('inventory_movement_type', [
  'entrada',         // Entrada no estoque
  'saida',           // Saída do estoque
  'transferencia',   // Transferência entre bases/oficinas
  'ajuste',          // Ajuste de inventário
  'descarte'         // Descarte de material
]);

export const inventoryItemCategoryEnum = pgEnum('inventory_item_category', [
  'motor',            // Peças de motor
  'freios',           // Sistema de freios
  'suspensao',        // Suspensão
  'transmissao',      // Transmissão
  'eletrica',         // Parte elétrica
  'carroceria',       // Carroceria
  'pneus',            // Pneus e rodas
  'lubrificantes',    // Óleos e lubrificantes
  'filtros',          // Filtros diversos
  'acessorios',       // Acessórios
  'ferramentas',      // Ferramentas
  'outros'            // Outros itens
]);

// Enum para os tipos de solicitação que uma base pode fazer
export const requestTypeEnum = pgEnum('request_type', [
  'manutencao', // Manutenção
  'pneus',      // Solicitação de pneus
  'roubo',      // Registro de roubo
  'sinistro',   // Registro de sinistro
  'acidente',   // Registro de acidente
  'seguranca'   // Segurança do trabalho
]);

// Enum para o status de solicitações
export const requestStatusEnum = pgEnum('request_status', [
  'pendente',             // Aguardando análise inicial
  'em_analise',           // Em análise pela equipe responsável
  'em_andamento',         // Em processamento/resolução
  'aguardando_informacao',// Aguardando informações adicionais
  'concluido',            // Solicitação atendida/concluída
  'cancelado'             // Solicitação cancelada
]);

// Create the bases table
export const bases = pgTable("bases", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location"),
  basename: text("basename"),
  type: text("type"),
  active: boolean("active").default(true),
  operation: text("operation"),
  hasMaintenance: boolean("has_maintenance").default(false),
  hasTires: boolean("has_tires").default(false),
  requestsEnabled: boolean("requests_enabled").default(true), // Permite que a base faça solicitações
  created_at: timestamp("created_at").defaultNow(),
});

// Tabela para armazenar solicitações de bases
export const baseRequests = pgTable("base_requests", {
  id: serial("id").primaryKey(),
  baseId: integer("base_id").notNull().references(() => bases.id),
  requestType: requestTypeEnum("request_type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: requestStatusEnum("request_status").notNull().default('pendente'),
  priority: text("priority").default('normal'), // alta, normal, baixa
  requesterUserId: integer("requester_user_id").notNull().references(() => users.id),
  assignedUserId: integer("assigned_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  vehiclePlate: text("vehicle_plate").references(() => vehicles.plate), // Se for relacionado a veículo
});

// Tabela para armazenar as atualizações/tratativas de solicitações
export const baseRequestUpdates = pgTable("base_request_updates", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => baseRequests.id),
  userId: integer("user_id").notNull().references(() => users.id),
  userName: text("user_name").notNull(),
  userRole: text("user_role").notNull(),
  message: text("message").notNull(),
  newStatus: requestStatusEnum("new_status"),
  createdAt: timestamp("created_at").defaultNow(),
  attachmentUrl: text("attachment_url"), // URL para anexo (se houver)
});

// Create the vehicles table (veiculos)
export const vehicles = pgTable("veiculos", {
  id: serial("id").primaryKey(),
  plate: text("plate").notNull().unique(),
  model: text("model").notNull(),
  vehicleType: vehicleTypeEnum("vehicle_type").notNull(),
  status: vehicleStatusEnum("status").notNull(),
  baseId: integer("base_id").notNull().references(() => bases.id),
  ownership: vehicleOwnershipEnum("ownership").notNull().default('murici'),
  rentalCompany: text("rental_company"), // Empresa de locação, quando aplicável
  crlvUrl: text("crlv_url"), // URL para o documento CRLV (Certificado de Registro e Licenciamento de Veículo)
  anttUrl: text("antt_url"), // URL para o documento ANTT (Agência Nacional de Transportes Terrestres)
});

// Create the workshops table (oficinas)
export const workshops = pgTable("oficinas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
  isActive: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
});

// Create the users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull(),
  baseId: integer("base_id").references(() => bases.id),
  basename: text("basename"),
  oficina_id: integer("oficina_id").references(() => workshops.id),
  lastLogin: timestamp("last_login", { mode: "date" }),
  isActive: boolean("is_active").default(true),
});

// Create the maintenance table (manutencao)
export const maintenance = pgTable("manutencao", {
  id: serial("id").primaryKey(),
  vehiclePlate: text("vehicle_plate").notNull().references(() => vehicles.plate),
  description: text("description").notNull(),
  status: text("status").notNull(),
  priority: text("priority"),
  maintenanceType: text("maintenance_type").notNull(),
  workshopId: integer("workshop_id"),
  requestBaseId: integer("request_base_id"),
  estimatedCompletion: date("estimated_completion"), // equivalente ao expectedExitDate
  entryDate: date("entry_date").notNull(),
  completionDate: date("completion_date"), // equivalente ao actualExitDate
  cost: decimal("cost", { precision: 10, scale: 2 }),
  responsiblePerson: text("responsible_person"),
  initialBudget: decimal("initial_budget", { precision: 10, scale: 2 }),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Tabela de chats para negociação de orçamentos
export const maintenanceChat = pgTable("maintenance_chat", {
  id: serial("id").primaryKey(),
  maintenanceId: integer("maintenance_id").notNull().references(() => maintenance.id),
  initialBudget: decimal("initial_budget", { precision: 10, scale: 2 }),
  finalBudget: decimal("final_budget", { precision: 10, scale: 2 }),
  kmAtual: text("km_atual"), // Quilometragem atual do veículo
  prazoEstimado: text("prazo_estimado"), // Prazo estimado em dias
  descricaoServico: text("descricao_servico"), // Descrição detalhada do serviço
  vehiclePlate: text("vehicle_plate"), // Placa do veículo informada pela oficina
  isFinalized: boolean("is_finalized").default(false),
  finalizedBy: text("finalized_by"),
  finalizedAt: timestamp("finalized_at"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Tabela para mensagens do chat
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull().references(() => maintenanceChat.id),
  author: messageAuthorEnum("author").notNull(),
  authorId: integer("author_id").notNull().references(() => users.id),
  authorName: text("author_name").notNull(),
  message: text("message").notNull(),
  proposedBudget: decimal("proposed_budget", { precision: 10, scale: 2 }),
  sent_at: timestamp("sent_at").defaultNow(),
});

// Create the tires table (pneus)
export const tires = pgTable("pneus", {
  id: serial("id").primaryKey(),
  tireNumber: text("tire_number").notNull().unique(),
  changeDate: date("change_date").notNull(),
  changeKm: integer("change_km").notNull(),
  status: tireStatusEnum("status").notNull(),
});

// Create the refueling table (abastecimentos)
export const refueling = pgTable("abastecimentos", {
  id: serial("id").primaryKey(),
  vehiclePlate: text("vehicle_plate").notNull().references(() => vehicles.plate),
  fuelType: fuelTypeEnum("fuel_type").notNull(),
  liters: decimal("liters", { precision: 10, scale: 2 }).notNull(),
  km: integer("km").notNull(),
  baseId: integer("base_id").notNull().references(() => bases.id),
  driverName: text("driver_name").notNull(),
});

// Create the fines table (multas)
export const fines = pgTable("multas", {
  id: serial("id").primaryKey(),
  vehiclePlate: text("vehicle_plate").notNull().references(() => vehicles.plate),
  infraction: text("infraction").notNull(),
  driver: text("driver").notNull(),
  date: date("date").notNull(),
  status: fineStatusEnum("status").notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
});

// Definição da tabela lineHall (linha_corredor) removida conforme solicitação

// Create the operations table (operacoes)
export const operations = pgTable("operacoes", {
  id: serial("id").primaryKey(),
  tipo: operationTypeEnum("tipo").notNull(),
  data: date("data").notNull(),
  baseId: integer("base_id").notNull().references(() => bases.id),
  operador: text("operador").notNull(),
  turno: text("turno").notNull(),
  status: operationStatusEnum("status").notNull().default('pendente'),
  observacoes: text("observacoes"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Criar a tabela painel_principal para exibir KPIs e métricas gerais
// Tabela para rastrear o ciclo de vida da manutenção (já que a tabela manutencao é uma view)
export const maintenanceLifecycle = pgTable("maintenance_lifecycle", {
  id: serial("id").primaryKey(),
  maintenanceId: integer("maintenance_id").notNull().unique(), // Referência à manutencao
  // Datas de ciclo de vida
  entryDate: date("entry_date").notNull(), // Data de entrada do veículo
  maintenanceStartDate: date("maintenance_start_date"), // Data de início efetivo da manutenção
  expectedExitDate: date("expected_exit_date"), // Data prevista de saída
  actualExitDate: date("actual_exit_date"), // Data real de saída
  // Informações de retirada do veículo
  vehiclePickupDate: timestamp("vehicle_pickup_date"), // Data e hora da retirada do veículo
  pickupPersonName: text("pickup_person_name"), // Nome da pessoa que retirou o veículo
  pickupPersonCPF: text("pickup_person_cpf"), // CPF da pessoa que retirou o veículo
  pickupComments: text("pickup_comments"), // Observações sobre a retirada
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Relações para o ciclo de vida não podem ser definidas diretamente
// já que manutencao é uma view, não uma tabela.
// As relações serão tratadas via código

export const painelPrincipal = pgTable("painel_principal", {
  id: serial("id").primaryKey(),
  data_referencia: date("data_referencia").notNull(),
  manutencoes_pendentes: integer("manutencoes_pendentes").notNull().default(0),
  tempo_medio_manutencao: text("tempo_medio_manutencao"),
  veiculos_parados: integer("veiculos_parados").notNull().default(0),
  dias_parados_total: integer("dias_parados_total").notNull().default(0),
  linehall_parados: integer("linehall_parados").notNull().default(0),
  viagens_concluidas: integer("viagens_concluidas").notNull().default(0),
  viagens_no_show: integer("viagens_no_show").notNull().default(0),
  viagens_canceladas_cliente: integer("viagens_canceladas_cliente").notNull().default(0),
  litros_diesel_total: decimal("litros_diesel_total", { precision: 10, scale: 2 }).notNull().default('0'),
  gasto_total_combustivel: decimal("gasto_total_combustivel", { precision: 10, scale: 2 }).notNull().default('0'),
  qtd_sinistros: integer("qtd_sinistros").notNull().default(0),
  qtd_roubos: integer("qtd_roubos").notNull().default(0),
  incidentes_seguranca_trabalho: integer("incidentes_seguranca_trabalho").notNull().default(0),
  movimentacoes_pneus: integer("movimentacoes_pneus").notNull().default(0),
  pneus_substituidos: integer("pneus_substituidos").notNull().default(0),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Tabela para checklist de veículos
export const vehicleChecklist = pgTable("vehicle_checklist", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull(), // referência ao lineHall removida conforme solicitação
  driverName: text("driver_name").notNull(),
  checkDate: timestamp("check_date").notNull().defaultNow(),
  initialKm: integer("initial_km"),
  finalKm: integer("final_km"),
  tireCondition: text("tire_condition"), // bom, regular, ruim
  lightsCondition: text("lights_condition"), // bom, regular, ruim
  brakesCondition: text("brakes_condition"), // bom, regular, ruim
  windshieldCondition: text("windshield_condition"), // bom, regular, ruim
  oilLevel: text("oil_level"), // bom, regular, ruim
  waterLevel: text("water_level"), // bom, regular, ruim
  observations: text("observations"),
  status: checklistStatusEnum("status").notNull().default('pendente'),
  isInitialCheck: boolean("is_initial_check").notNull(), // true para checklist inicial, false para final
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Tabela para solicitações de manutenção pelo motorista
export const driverMaintenanceRequest = pgTable("driver_maintenance_request", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id"), // referência ao lineHall removida conforme solicitação
  vehiclePlate: text("vehicle_plate").notNull().references(() => vehicles.plate),
  driverName: text("driver_name").notNull(),
  requestDate: timestamp("request_date").notNull().defaultNow(),
  description: text("description").notNull(),
  urgency: text("urgency").notNull().default('normal'), // baixa, normal, alta, emergencial
  status: maintenanceRequestStatusEnum("status").notNull().default('pendente'),
  approvedBy: text("approved_by"),
  approvalDate: timestamp("approval_date"),
  maintenanceId: integer("maintenance_id").references(() => maintenance.id), // Referência à manutenção gerada, se aprovada
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Tabela para solicitações de recarga de cartão de abastecimento
export const refuelingCardRequest = pgTable("refueling_card_request", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id"), // referência ao lineHall removida conforme solicitação
  vehiclePlate: text("vehicle_plate").notNull().references(() => vehicles.plate),
  driverName: text("driver_name").notNull(),
  requestDate: timestamp("request_date").notNull().defaultNow(),
  cardNumber: text("card_number"),
  requestedAmount: decimal("requested_amount", { precision: 10, scale: 2 }).notNull(),
  justification: text("justification").notNull(),
  status: refuelingCardStatusEnum("status").notNull().default('pendente'),
  approvedBy: text("approved_by"),
  approvalDate: timestamp("approval_date"),
  approvedAmount: decimal("approved_amount", { precision: 10, scale: 2 }),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Relations
export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  base: one(bases, {
    fields: [vehicles.baseId],
    references: [bases.id],
  }),
  maintenance: many(maintenance),
  refueling: many(refueling),
  fines: many(fines),
}));

export const basesRelations = relations(bases, ({ many }) => ({
  vehicles: many(vehicles),
  refueling: many(refueling),
  users: many(users),
  maintenance: many(maintenance, { relationName: "requestedMaintenance" }),
  operations: many(operations),
}));

export const maintenanceRelations = relations(maintenance, ({ one, many }) => ({
  vehicle: one(vehicles, {
    fields: [maintenance.vehiclePlate],
    references: [vehicles.plate],
  }),
  workshop: one(workshops, {
    fields: [maintenance.workshopId],
    references: [workshops.id],
  }),
  requestBase: one(bases, {
    fields: [maintenance.requestBaseId],
    references: [bases.id],
    relationName: "requestedMaintenance"
  }),
  chat: many(maintenanceChat),
}));

export const maintenanceChatRelations = relations(maintenanceChat, ({ one, many }) => ({
  maintenance: one(maintenance, {
    fields: [maintenanceChat.maintenanceId],
    references: [maintenance.id],
  }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  chat: one(maintenanceChat, {
    fields: [chatMessages.chatId],
    references: [maintenanceChat.id],
  }),
  author: one(users, {
    fields: [chatMessages.authorId],
    references: [users.id],
  }),
}));

export const workshopsRelations = relations(workshops, ({ many }) => ({
  maintenance: many(maintenance),
}));

export const operationsRelations = relations(operations, ({ one }) => ({
  base: one(bases, {
    fields: [operations.baseId],
    references: [bases.id],
  }),
}));

// Relação lineHallRelations removida conforme solicitação

export const vehicleChecklistRelations = relations(vehicleChecklist, ({ }) => ({
  // referência trip ao lineHall removida conforme solicitação
}));

export const driverMaintenanceRequestRelations = relations(driverMaintenanceRequest, ({ one }) => ({
  // referência trip ao lineHall removida conforme solicitação
  vehicle: one(vehicles, {
    fields: [driverMaintenanceRequest.vehiclePlate],
    references: [vehicles.plate],
  }),
  maintenance: one(maintenance, {
    fields: [driverMaintenanceRequest.maintenanceId],
    references: [maintenance.id],
  }),
}));

export const refuelingCardRequestRelations = relations(refuelingCardRequest, ({ one }) => ({
  // referência trip ao lineHall removida conforme solicitação
  vehicle: one(vehicles, {
    fields: [refuelingCardRequest.vehiclePlate],
    references: [vehicles.plate],
  }),
}));

// Insert schemas
export const insertBaseSchema = createInsertSchema(bases);
export const insertVehicleSchema = createInsertSchema(vehicles);
export const insertWorkshopSchema = createInsertSchema(workshops);
export const insertMaintenanceSchema = createInsertSchema(maintenance);
export const insertTireSchema = createInsertSchema(tires);
export const insertRefuelingSchema = createInsertSchema(refueling);
export const insertFineSchema = createInsertSchema(fines);
// insertLineHallSchema removido conforme solicitação
export const insertOperationSchema = createInsertSchema(operations);
export const insertVehicleChecklistSchema = createInsertSchema(vehicleChecklist);
export const insertDriverMaintenanceRequestSchema = createInsertSchema(driverMaintenanceRequest);
export const insertRefuelingCardRequestSchema = createInsertSchema(refuelingCardRequest);
export const insertPainelPrincipalSchema = createInsertSchema(painelPrincipal);
export const insertMaintenanceChatSchema = createInsertSchema(maintenanceChat);
export const insertChatMessageSchema = createInsertSchema(chatMessages);
export const insertMaintenanceLifecycleSchema = createInsertSchema(maintenanceLifecycle);
export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  email: true,
  password: true,
  role: true,
  baseId: true,
  basename: true,
  oficina_id: true,
  isActive: true,
});

// Types
export type Base = typeof bases.$inferSelect;
export type InsertBase = z.infer<typeof insertBaseSchema>;

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;

export type Workshop = typeof workshops.$inferSelect;
export type InsertWorkshop = z.infer<typeof insertWorkshopSchema>;

export type Maintenance = typeof maintenance.$inferSelect;
export type InsertMaintenance = z.infer<typeof insertMaintenanceSchema>;

export type Tire = typeof tires.$inferSelect;
export type InsertTire = z.infer<typeof insertTireSchema>;

export type Refueling = typeof refueling.$inferSelect;
export type InsertRefueling = z.infer<typeof insertRefuelingSchema>;

export type Fine = typeof fines.$inferSelect;
export type InsertFine = z.infer<typeof insertFineSchema>;

// Tipos LineHall removidos conforme solicitação

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Operation = typeof operations.$inferSelect;
export type InsertOperation = z.infer<typeof insertOperationSchema>;

export type VehicleChecklist = typeof vehicleChecklist.$inferSelect;
export type InsertVehicleChecklist = z.infer<typeof insertVehicleChecklistSchema>;

export type DriverMaintenanceRequest = typeof driverMaintenanceRequest.$inferSelect;
export type InsertDriverMaintenanceRequest = z.infer<typeof insertDriverMaintenanceRequestSchema>;

export type RefuelingCardRequest = typeof refuelingCardRequest.$inferSelect;
export type InsertRefuelingCardRequest = z.infer<typeof insertRefuelingCardRequestSchema>;

export type PainelPrincipal = typeof painelPrincipal.$inferSelect;
export type InsertPainelPrincipal = z.infer<typeof insertPainelPrincipalSchema>;

export type MaintenanceChat = typeof maintenanceChat.$inferSelect;
export type InsertMaintenanceChat = z.infer<typeof insertMaintenanceChatSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type MaintenanceLifecycle = typeof maintenanceLifecycle.$inferSelect;
export type InsertMaintenanceLifecycle = z.infer<typeof insertMaintenanceLifecycleSchema>;

// Esquemas de inserção para as novas tabelas de solicitações da base
export const insertBaseRequestSchema = createInsertSchema(baseRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
});

export const insertBaseRequestUpdateSchema = createInsertSchema(baseRequestUpdates).omit({
  id: true,
  createdAt: true,
});

// Tabela de itens de estoque
export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),                                            // Nome da peça/item
  code: text("code").notNull().unique(),                                   // Código/SKU do item
  category: inventoryItemCategoryEnum("category").notNull(),               // Categoria do item
  unit: text("unit").notNull().default('un'),                              // Unidade de medida (un, kg, l, etc)
  minimumStock: integer("minimum_stock").notNull().default(0),             // Estoque mínimo
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).notNull(),   // Custo unitário
  description: text("description"),                                        // Descrição detalhada
  imageUrl: text("image_url"),                                             // URL da imagem do item (se houver)
  isActive: boolean("is_active").default(true),                            // Se o item está ativo no catálogo
  notes: text("notes"),                                                    // Observações gerais
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Tabela de estoque por local (bases e oficinas)
export const inventoryStock = pgTable("inventory_stock", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").notNull().references(() => inventoryItems.id),        // Referência ao item
  baseId: integer("base_id").references(() => bases.id),                           // Referência à base (se estoque em base)
  workshopId: integer("workshop_id").references(() => workshops.id),               // Referência à oficina (se estoque em oficina)
  quantity: integer("quantity").notNull().default(0),                              // Quantidade disponível
  location: text("location"),                                                      // Localização física dentro do estoque (prateleira, armário, etc)
  lastUpdated: timestamp("last_updated").defaultNow(),                             // Última atualização do estoque
  notes: text("notes"),                                                            // Observações específicas deste estoque
});

// Tabela de movimentações de estoque
export const inventoryMovements = pgTable("inventory_movements", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").notNull().references(() => inventoryItems.id),        // Item movimentado
  sourceBaseId: integer("source_base_id").references(() => bases.id),              // Base de origem (se aplicável)
  sourceWorkshopId: integer("source_workshop_id").references(() => workshops.id),  // Oficina de origem (se aplicável)
  destinationBaseId: integer("destination_base_id").references(() => bases.id),    // Base de destino (se aplicável)
  destinationWorkshopId: integer("destination_workshop_id").references(() => workshops.id), // Oficina de destino (se aplicável)
  vehiclePlate: text("vehicle_plate").references(() => vehicles.plate),            // Veículo relacionado (se aplicável)
  maintenanceId: integer("maintenance_id").references(() => maintenance.id),       // Manutenção relacionada (se aplicável)
  quantity: integer("quantity").notNull(),                                         // Quantidade movimentada
  movementType: inventoryMovementTypeEnum("movement_type").notNull(),              // Tipo de movimentação
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).notNull(),           // Custo unitário no momento da movimentação
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),         // Custo total da movimentação
  requestedBy: integer("requested_by").notNull().references(() => users.id),       // Usuário que solicitou
  approvedBy: integer("approved_by").references(() => users.id),                   // Usuário que aprovou (se aplicável)
  documentNumber: text("document_number"),                                         // Número do documento relacionado (NF, ordem de serviço, etc)
  reasonForMovement: text("reason_for_movement").notNull(),                        // Motivo da movimentação
  notes: text("notes"),                                                            // Observações
  createdAt: timestamp("created_at").defaultNow(),                                 // Data de criação do registro
});

// Relações para o sistema de estoque
export const inventoryItemsRelations = relations(inventoryItems, ({ many }) => ({
  stocks: many(inventoryStock),
  movements: many(inventoryMovements)
}));

export const inventoryStockRelations = relations(inventoryStock, ({ one }) => ({
  item: one(inventoryItems, {
    fields: [inventoryStock.itemId],
    references: [inventoryItems.id]
  }),
  base: one(bases, {
    fields: [inventoryStock.baseId],
    references: [bases.id]
  }),
  workshop: one(workshops, {
    fields: [inventoryStock.workshopId],
    references: [workshops.id]
  })
}));

export const inventoryMovementsRelations = relations(inventoryMovements, ({ one }) => ({
  item: one(inventoryItems, {
    fields: [inventoryMovements.itemId],
    references: [inventoryItems.id]
  }),
  sourceBase: one(bases, {
    fields: [inventoryMovements.sourceBaseId],
    references: [bases.id]
  }),
  sourceWorkshop: one(workshops, {
    fields: [inventoryMovements.sourceWorkshopId],
    references: [workshops.id]
  }),
  destinationBase: one(bases, {
    fields: [inventoryMovements.destinationBaseId],
    references: [bases.id]
  }),
  destinationWorkshop: one(workshops, {
    fields: [inventoryMovements.destinationWorkshopId],
    references: [workshops.id]
  }),
  vehicle: one(vehicles, {
    fields: [inventoryMovements.vehiclePlate],
    references: [vehicles.plate]
  }),
  maintenance: one(maintenance, {
    fields: [inventoryMovements.maintenanceId],
    references: [maintenance.id]
  }),
  requestedByUser: one(users, {
    fields: [inventoryMovements.requestedBy],
    references: [users.id]
  }),
  approvedByUser: one(users, {
    fields: [inventoryMovements.approvedBy],
    references: [users.id]
  })
}));

// Schemas de inserção para o sistema de estoque
export const insertInventoryItemSchema = createInsertSchema(inventoryItems);
export const insertInventoryStockSchema = createInsertSchema(inventoryStock);
export const insertInventoryMovementSchema = createInsertSchema(inventoryMovements);

// Tipos para as novas tabelas
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InventoryStock = typeof inventoryStock.$inferSelect;
export type InventoryMovement = typeof inventoryMovements.$inferSelect;
export type BaseRequest = typeof baseRequests.$inferSelect;
export type BaseRequestUpdate = typeof baseRequestUpdates.$inferSelect;

// Tabela para controle financeiro dos serviços de guincho
export const towingServicePayments = pgTable("towing_service_payments", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id").notNull(),
  partnerId: integer("partner_id").notNull(),
  vehiclePlate: text("vehicle_plate").notNull(),
  serviceValue: decimal("service_value", { precision: 10, scale: 2 }).notNull(),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default('pendente'),
  paymentDate: timestamp("payment_date"),
  paymentMethod: text("payment_method"), // PIX, transferência, etc.
  paymentReference: text("payment_reference"), // referência do pagamento
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Relações para pagamentos (será definida após criar towingPartners)
export const towingServicePaymentsRelations = relations(towingServicePayments, ({ one }) => ({
  // Relação será adicionada quando towingPartners estiver definido
}));

// Schemas de inserção para pagamentos
export const insertTowingServicePaymentSchema = createInsertSchema(towingServicePayments);

// Tipos para inserção
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InsertInventoryStock = z.infer<typeof insertInventoryStockSchema>;
export type InsertInventoryMovement = z.infer<typeof insertInventoryMovementSchema>;
export type InsertBaseRequest = z.infer<typeof insertBaseRequestSchema>;
export type InsertBaseRequestUpdate = z.infer<typeof insertBaseRequestUpdateSchema>;
export type TowingServicePayment = typeof towingServicePayments.$inferSelect;
export type InsertTowingServicePayment = z.infer<typeof insertTowingServicePaymentSchema>;
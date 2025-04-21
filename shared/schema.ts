import { pgTable, text, serial, integer, boolean, timestamp, decimal, date, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Create enums for database
export const vehicleTypeEnum = pgEnum('vehicle_type', ['fiorino', 'van', 'vuc', 'toco', 'truck', 'cavalo_mecanico', 'carreta']);
export const vehicleStatusEnum = pgEnum('vehicle_status', ['em_operacao', 'em_manutencao', 'parado']);
export const maintenanceTypeEnum = pgEnum('maintenance_type', ['preventiva', 'corretiva']);
export const maintenanceStatusEnum = pgEnum('maintenance_status', ['concluida', 'em_andamento', 'aguardando_pecas', 'pendente', 'aguardando_orcamento', 'cancelada']);
export const tireStatusEnum = pgEnum('tire_status', ['em_uso', 'estoque', 'descartado']);
export const fuelTypeEnum = pgEnum('fuel_type', ['arla', 'diesel']);
export const fineStatusEnum = pgEnum('fine_status', ['pendente', 'paga', 'contestada']);
export const tripStatusEnum = pgEnum('trip_status', ['programada', 'carregando', 'aguardando_carga', 'em_transito', 'finalizada']);
export const userRoleEnum = pgEnum('user_role', ['admin', 'gestor', 'operador', 'oficina']);
export const operationTypeEnum = pgEnum('operation_type', ['carregamento', 'descarga', 'transferencia', 'inventario', 'manutencao']);
export const operationStatusEnum = pgEnum('operation_status', ['pendente', 'em_andamento', 'concluida', 'cancelada']);

// Create the bases table
export const bases = pgTable("bases", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location"),
  operation: text("operation"),
  active: boolean("active").default(true),
  hasMaintenance: boolean("has_maintenance").default(false),
  hasTires: boolean("has_tires").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

// Define enum para propriedade do veículo
export const vehicleOwnershipEnum = pgEnum('vehicle_ownership', ['murici', 'locado']);

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

// Create the maintenance table (manutencao)
export const maintenance = pgTable("manutencao", {
  id: serial("id").primaryKey(),
  vehiclePlate: text("vehicle_plate").notNull().references(() => vehicles.plate),
  workshopId: integer("workshop_id").notNull().references(() => workshops.id),
  requestBaseId: integer("request_base_id").notNull().references(() => bases.id),
  entryDate: date("entry_date").notNull(),
  expectedExitDate: date("expected_exit_date"),
  actualExitDate: date("actual_exit_date"),
  status: maintenanceStatusEnum("status").notNull(),
  maintenanceType: maintenanceTypeEnum("maintenance_type").notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  description: text("description").notNull(),
  responsiblePerson: text("responsible_person"),  // Campo para quem está cuidando da manutenção
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
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

// Create the lineHall table (linha_corredor)
export const checklistStatusEnum = pgEnum('checklist_status', ['pendente', 'iniciado', 'concluido']);
export const maintenanceRequestStatusEnum = pgEnum('maintenance_request_status', ['pendente', 'aprovada', 'rejeitada', 'concluida']);
export const refuelingCardStatusEnum = pgEnum('refueling_card_status', ['pendente', 'aprovada', 'rejeitada']);

export const lineHall = pgTable("linha_corredor", {
  id: serial("id").primaryKey(),
  truckPlate: text("truck_plate").notNull().references(() => vehicles.plate),
  trailer1Plate: text("trailer1_plate").notNull().references(() => vehicles.plate),
  trailer2Plate: text("trailer2_plate").references(() => vehicles.plate),
  driverName: text("driver_name").notNull(),
  driverPhone: text("driver_phone"),
  loadingLocation: text("loading_location").notNull(), // CD de carregamento
  loadingTime: timestamp("loading_time").notNull(),
  unloadingLocation: text("unloading_location").notNull(), // CD de descarregamento
  estimatedUnloadingTime: timestamp("estimated_unloading_time"),
  actualUnloadingTime: timestamp("actual_unloading_time"),
  initialKm: integer("initial_km"),
  finalKm: integer("final_km"),
  checklistStatus: checklistStatusEnum("checklist_status").default('pendente'),
  tripNotes: text("trip_notes"),
  tripStatus: tripStatusEnum("trip_status").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
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
});

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

export const maintenanceRelations = relations(maintenance, ({ one }) => ({
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
}));

// Tabela para checklist de veículos
export const vehicleChecklist = pgTable("vehicle_checklist", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => lineHall.id),
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
  tripId: integer("trip_id").references(() => lineHall.id),
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
  tripId: integer("trip_id").references(() => lineHall.id),
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

export const workshopsRelations = relations(workshops, ({ many }) => ({
  maintenance: many(maintenance),
}));

export const operationsRelations = relations(operations, ({ one }) => ({
  base: one(bases, {
    fields: [operations.baseId],
    references: [bases.id],
  }),
}));

export const lineHallRelations = relations(lineHall, ({ many }) => ({
  checklists: many(vehicleChecklist),
  maintenanceRequests: many(driverMaintenanceRequest),
  cardRequests: many(refuelingCardRequest),
}));

export const vehicleChecklistRelations = relations(vehicleChecklist, ({ one }) => ({
  trip: one(lineHall, {
    fields: [vehicleChecklist.tripId],
    references: [lineHall.id],
  }),
}));

export const driverMaintenanceRequestRelations = relations(driverMaintenanceRequest, ({ one }) => ({
  trip: one(lineHall, {
    fields: [driverMaintenanceRequest.tripId],
    references: [lineHall.id],
  }),
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
  trip: one(lineHall, {
    fields: [refuelingCardRequest.tripId],
    references: [lineHall.id],
  }),
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
export const insertLineHallSchema = createInsertSchema(lineHall);
export const insertOperationSchema = createInsertSchema(operations);
export const insertVehicleChecklistSchema = createInsertSchema(vehicleChecklist);
export const insertDriverMaintenanceRequestSchema = createInsertSchema(driverMaintenanceRequest);
export const insertRefuelingCardRequestSchema = createInsertSchema(refuelingCardRequest);
export const insertPainelPrincipalSchema = createInsertSchema(painelPrincipal);
export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  email: true,
  password: true,
  role: true,
  baseId: true,
  basename: true,
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

export type LineHall = typeof lineHall.$inferSelect;
export type InsertLineHall = z.infer<typeof insertLineHallSchema>;

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

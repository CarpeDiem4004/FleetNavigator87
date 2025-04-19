import { pgTable, text, serial, integer, boolean, timestamp, decimal, date, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Create enums for database
export const vehicleTypeEnum = pgEnum('vehicle_type', ['cavalo_mecanico', 'carreta', 'van', 'utilitario']);
export const vehicleStatusEnum = pgEnum('vehicle_status', ['em_operacao', 'em_manutencao', 'parado']);
export const maintenanceTypeEnum = pgEnum('maintenance_type', ['preventiva', 'corretiva']);
export const maintenanceStatusEnum = pgEnum('maintenance_status', ['concluida', 'em_andamento', 'aguardando_pecas', 'pendente', 'aguardando_orcamento', 'cancelada']);
export const tireStatusEnum = pgEnum('tire_status', ['em_uso', 'estoque', 'descartado']);
export const fuelTypeEnum = pgEnum('fuel_type', ['arla', 'diesel']);
export const fineStatusEnum = pgEnum('fine_status', ['pendente', 'paga', 'contestada']);
export const linehallStatusEnum = pgEnum('linehall_status', ['agendado', 'carregando', 'em_transito', 'descarregando', 'finalizado', 'cancelado']);
export const userRoleEnum = pgEnum('user_role', ['admin', 'gestor', 'operador']);

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

// Create the vehicles table (veiculos)
export const vehicles = pgTable("veiculos", {
  id: serial("id").primaryKey(),
  plate: text("plate").notNull().unique(),
  model: text("model").notNull(),
  vehicleType: vehicleTypeEnum("vehicle_type").notNull(),
  status: vehicleStatusEnum("status").notNull(),
  baseId: integer("base_id").notNull().references(() => bases.id),
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

// Criar a tabela para LINE HALL SHOPEE
export const linehallShopee = pgTable("linehall_shopee", {
  id: serial("id").primaryKey(),
  dataViagem: date("data_viagem").notNull(),
  cavaloPlaca: text("cavalo_placa").notNull().references(() => vehicles.plate),
  carreta1Placa: text("carreta1_placa").notNull(),
  carreta2Placa: text("carreta2_placa"),
  motoristaId: integer("motorista_id").notNull().references(() => users.id),
  baseOrigemId: integer("base_origem_id").notNull().references(() => bases.id),
  baseDestinoId: integer("base_destino_id").notNull().references(() => bases.id),
  horarioCarregamento: text("horario_carregamento").notNull(),
  status: linehallStatusEnum("status").default('agendado'),
  observacoes: text("observacoes"),
  createdBy: integer("created_by").references(() => users.id),
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
  linehallShopee: many(linehallShopee),
}));

export const basesRelations = relations(bases, ({ many }) => ({
  vehicles: many(vehicles),
  refueling: many(refueling),
  users: many(users),
  maintenance: many(maintenance, { relationName: "requestedMaintenance" }),
  linehallShopeeOrigem: many(linehallShopee, { relationName: "baseOrigem" }),
  linehallShopeeDestino: many(linehallShopee, { relationName: "baseDestino" }),
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

export const workshopsRelations = relations(workshops, ({ many }) => ({
  maintenance: many(maintenance),
}));

// Relações para LinehallShopee
export const linehallShopeeRelations = relations(linehallShopee, ({ one }) => ({
  veiculo: one(vehicles, {
    fields: [linehallShopee.cavaloPlaca],
    references: [vehicles.plate]
  }),
  motorista: one(users, {
    fields: [linehallShopee.motoristaId],
    references: [users.id]
  }),
  baseOrigem: one(bases, {
    fields: [linehallShopee.baseOrigemId],
    references: [bases.id],
    relationName: "baseOrigem"
  }),
  baseDestino: one(bases, {
    fields: [linehallShopee.baseDestinoId],
    references: [bases.id],
    relationName: "baseDestino"
  }),
  criador: one(users, {
    fields: [linehallShopee.createdBy],
    references: [users.id],
    relationName: "criador"
  })
}));

// Insert schemas
export const insertBaseSchema = createInsertSchema(bases);
export const insertVehicleSchema = createInsertSchema(vehicles);
export const insertWorkshopSchema = createInsertSchema(workshops);
export const insertMaintenanceSchema = createInsertSchema(maintenance);
export const insertTireSchema = createInsertSchema(tires);
export const insertRefuelingSchema = createInsertSchema(refueling);
export const insertFineSchema = createInsertSchema(fines);
export const insertLinehallShopeeSchema = createInsertSchema(linehallShopee).omit({
  id: true,
  status: true,
  created_at: true,
  updated_at: true
});
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

export type LinehallShopee = typeof linehallShopee.$inferSelect;
export type InsertLinehallShopee = z.infer<typeof insertLinehallShopeeSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

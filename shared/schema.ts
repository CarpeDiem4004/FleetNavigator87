import { pgTable, text, serial, integer, boolean, timestamp, decimal, date, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Create enums for database
export const vehicleTypeEnum = pgEnum('vehicle_type', ['cavalo_mecanico', 'carreta', 'van', 'utilitario']);
export const vehicleStatusEnum = pgEnum('vehicle_status', ['em_operacao', 'em_manutencao', 'parado']);
export const maintenanceTypeEnum = pgEnum('maintenance_type', ['preventiva', 'corretiva']);
export const maintenanceStatusEnum = pgEnum('maintenance_status', ['concluida', 'em_andamento', 'aguardando_pecas']);
export const tireStatusEnum = pgEnum('tire_status', ['em_uso', 'estoque', 'descartado']);
export const fuelTypeEnum = pgEnum('fuel_type', ['arla', 'diesel']);
export const fineStatusEnum = pgEnum('fine_status', ['pendente', 'paga', 'contestada']);
export const tripStatusEnum = pgEnum('trip_status', ['programada', 'carregando', 'aguardando_carga', 'em_transito', 'finalizada']);
export const userRoleEnum = pgEnum('user_role', ['admin', 'gestor', 'operador']);

// Create the bases table
export const bases = pgTable("bases", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
});

// Create the vehicles table
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  plate: text("plate").notNull().unique(),
  model: text("model").notNull(),
  vehicleType: vehicleTypeEnum("vehicle_type").notNull(),
  status: vehicleStatusEnum("status").notNull(),
  baseId: integer("base_id").notNull().references(() => bases.id),
});

// Create the maintenance table
export const maintenance = pgTable("maintenance", {
  id: serial("id").primaryKey(),
  vehiclePlate: text("vehicle_plate").notNull().references(() => vehicles.plate),
  date: date("date").notNull(),
  maintenanceType: maintenanceTypeEnum("maintenance_type").notNull(),
  status: maintenanceStatusEnum("status").notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull(),
});

// Create the tires table
export const tires = pgTable("tires", {
  id: serial("id").primaryKey(),
  tireNumber: text("tire_number").notNull().unique(),
  changeDate: date("change_date").notNull(),
  changeKm: integer("change_km").notNull(),
  status: tireStatusEnum("status").notNull(),
});

// Create the refueling table
export const refueling = pgTable("refueling", {
  id: serial("id").primaryKey(),
  vehiclePlate: text("vehicle_plate").notNull().references(() => vehicles.plate),
  fuelType: fuelTypeEnum("fuel_type").notNull(),
  liters: decimal("liters", { precision: 10, scale: 2 }).notNull(),
  km: integer("km").notNull(),
  baseId: integer("base_id").notNull().references(() => bases.id),
  driverName: text("driver_name").notNull(),
});

// Create the fines table
export const fines = pgTable("fines", {
  id: serial("id").primaryKey(),
  vehiclePlate: text("vehicle_plate").notNull().references(() => vehicles.plate),
  infraction: text("infraction").notNull(),
  driver: text("driver").notNull(),
  date: date("date").notNull(),
  status: fineStatusEnum("status").notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
});

// Create the lineHall table
export const lineHall = pgTable("line_hall", {
  id: serial("id").primaryKey(),
  truckPlate: text("truck_plate").notNull().references(() => vehicles.plate),
  trailer1Plate: text("trailer1_plate").notNull().references(() => vehicles.plate),
  trailer2Plate: text("trailer2_plate").references(() => vehicles.plate),
  loadingTime: timestamp("loading_time").notNull(),
  destination: text("destination").notNull(),
  tripStatus: tripStatusEnum("trip_status").notNull(),
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
}));

export const basesRelations = relations(bases, ({ many }) => ({
  vehicles: many(vehicles),
  refueling: many(refueling),
  users: many(users),
}));

// Insert schemas
export const insertBaseSchema = createInsertSchema(bases);
export const insertVehicleSchema = createInsertSchema(vehicles);
export const insertMaintenanceSchema = createInsertSchema(maintenance);
export const insertTireSchema = createInsertSchema(tires);
export const insertRefuelingSchema = createInsertSchema(refueling);
export const insertFineSchema = createInsertSchema(fines);
export const insertLineHallSchema = createInsertSchema(lineHall);
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

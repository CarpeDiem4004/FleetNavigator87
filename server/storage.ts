import { 
  users, vehicles, maintenance, tires, refueling, fines, lineHall, bases,
  type User, type InsertUser, type Vehicle, type InsertVehicle,
  type Maintenance, type InsertMaintenance, type Tire, type InsertTire,
  type Refueling, type InsertRefueling, type Fine, type InsertFine,
  type LineHall, type InsertLineHall, type Base, type InsertBase
} from "@shared/schema";
import { db } from "./db";
import { eq, and, like, desc } from "drizzle-orm";

// Define the storage interface with CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Base operations
  getBase(id: number): Promise<Base | undefined>;
  getAllBases(): Promise<Base[]>;
  createBase(base: InsertBase): Promise<Base>;
  updateBase(id: number, base: Partial<InsertBase>): Promise<Base | undefined>;
  deleteBase(id: number): Promise<boolean>;
  
  // Vehicle operations
  getVehicle(id: number): Promise<Vehicle | undefined>;
  getVehicleByPlate(plate: string): Promise<Vehicle | undefined>;
  getVehiclesByBase(baseId: number): Promise<Vehicle[]>;
  getAllVehicles(): Promise<Vehicle[]>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: number, vehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: number): Promise<boolean>;
  
  // Maintenance operations
  getMaintenance(id: number): Promise<Maintenance | undefined>;
  getMaintenanceByVehicle(vehiclePlate: string): Promise<Maintenance[]>;
  getAllMaintenance(): Promise<Maintenance[]>;
  createMaintenance(maintenance: InsertMaintenance): Promise<Maintenance>;
  updateMaintenance(id: number, maintenance: Partial<InsertMaintenance>): Promise<Maintenance | undefined>;
  deleteMaintenance(id: number): Promise<boolean>;
  
  // Tire operations
  getTire(id: number): Promise<Tire | undefined>;
  getAllTires(): Promise<Tire[]>;
  createTire(tire: InsertTire): Promise<Tire>;
  updateTire(id: number, tire: Partial<InsertTire>): Promise<Tire | undefined>;
  deleteTire(id: number): Promise<boolean>;
  
  // Refueling operations
  getRefueling(id: number): Promise<Refueling | undefined>;
  getRefuelingByVehicle(vehiclePlate: string): Promise<Refueling[]>;
  getAllRefueling(): Promise<Refueling[]>;
  createRefueling(refueling: InsertRefueling): Promise<Refueling>;
  updateRefueling(id: number, refueling: Partial<InsertRefueling>): Promise<Refueling | undefined>;
  deleteRefueling(id: number): Promise<boolean>;
  
  // Fine operations
  getFine(id: number): Promise<Fine | undefined>;
  getFinesByVehicle(vehiclePlate: string): Promise<Fine[]>;
  getAllFines(): Promise<Fine[]>;
  createFine(fine: InsertFine): Promise<Fine>;
  updateFine(id: number, fine: Partial<InsertFine>): Promise<Fine | undefined>;
  deleteFine(id: number): Promise<boolean>;
  
  // LineHall operations
  getLineHall(id: number): Promise<LineHall | undefined>;
  getAllLineHall(): Promise<LineHall[]>;
  createLineHall(lineHall: InsertLineHall): Promise<LineHall>;
  updateLineHall(id: number, lineHall: Partial<InsertLineHall>): Promise<LineHall | undefined>;
  deleteLineHall(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    console.log("Criando usuário com os seguintes dados:", { 
      ...user, 
      password: "***********"  // Oculta a senha por segurança
    });
    
    // Certificar-se de que todos os campos esperados estão presentes
    const userData: any = {
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role
    };
    
    // Adicionar campos opcionais se presentes
    if (user.baseId !== undefined && user.baseId !== null) {
      userData.baseId = user.baseId;
    }
    
    if (user.basename) {
      userData.basename = user.basename;
    }
    
    const [newUser] = await db.insert(users).values(userData).returning();
    console.log("Usuário criado com sucesso:", { id: newUser.id, email: newUser.email });
    return newUser;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning();
    return !!deleted;
  }
  
  // Base operations
  async getBase(id: number): Promise<Base | undefined> {
    const [base] = await db.select().from(bases).where(eq(bases.id, id));
    return base || undefined;
  }

  async getAllBases(): Promise<Base[]> {
    return await db.select().from(bases);
  }

  async createBase(base: InsertBase): Promise<Base> {
    const [newBase] = await db.insert(bases).values(base).returning();
    return newBase;
  }

  async updateBase(id: number, base: Partial<InsertBase>): Promise<Base | undefined> {
    const [updated] = await db
      .update(bases)
      .set(base)
      .where(eq(bases.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteBase(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(bases)
      .where(eq(bases.id, id))
      .returning();
    return !!deleted;
  }
  
  // Vehicle operations
  async getVehicle(id: number): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle || undefined;
  }

  async getVehicleByPlate(plate: string): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.plate, plate));
    return vehicle || undefined;
  }

  async getVehiclesByBase(baseId: number): Promise<Vehicle[]> {
    return await db.select().from(vehicles).where(eq(vehicles.baseId, baseId));
  }

  async getAllVehicles(): Promise<Vehicle[]> {
    return await db.select().from(vehicles);
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const [newVehicle] = await db.insert(vehicles).values(vehicle).returning();
    return newVehicle;
  }

  async updateVehicle(id: number, vehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const [updated] = await db
      .update(vehicles)
      .set(vehicle)
      .where(eq(vehicles.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteVehicle(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(vehicles)
      .where(eq(vehicles.id, id))
      .returning();
    return !!deleted;
  }
  
  // Maintenance operations
  async getMaintenance(id: number): Promise<Maintenance | undefined> {
    const [maintenance] = await db.select().from(maintenance).where(eq(maintenance.id, id));
    return maintenance || undefined;
  }

  async getMaintenanceByVehicle(vehiclePlate: string): Promise<Maintenance[]> {
    return await db.select().from(maintenance).where(eq(maintenance.vehiclePlate, vehiclePlate));
  }

  async getAllMaintenance(): Promise<Maintenance[]> {
    return await db.select().from(maintenance).orderBy(desc(maintenance.date));
  }

  async createMaintenance(maintenanceData: InsertMaintenance): Promise<Maintenance> {
    const [newMaintenance] = await db.insert(maintenance).values(maintenanceData).returning();
    return newMaintenance;
  }

  async updateMaintenance(id: number, maintenanceData: Partial<InsertMaintenance>): Promise<Maintenance | undefined> {
    const [updated] = await db
      .update(maintenance)
      .set(maintenanceData)
      .where(eq(maintenance.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteMaintenance(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(maintenance)
      .where(eq(maintenance.id, id))
      .returning();
    return !!deleted;
  }
  
  // Tire operations
  async getTire(id: number): Promise<Tire | undefined> {
    const [tire] = await db.select().from(tires).where(eq(tires.id, id));
    return tire || undefined;
  }

  async getAllTires(): Promise<Tire[]> {
    return await db.select().from(tires);
  }

  async createTire(tire: InsertTire): Promise<Tire> {
    const [newTire] = await db.insert(tires).values(tire).returning();
    return newTire;
  }

  async updateTire(id: number, tire: Partial<InsertTire>): Promise<Tire | undefined> {
    const [updated] = await db
      .update(tires)
      .set(tire)
      .where(eq(tires.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteTire(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(tires)
      .where(eq(tires.id, id))
      .returning();
    return !!deleted;
  }
  
  // Refueling operations
  async getRefueling(id: number): Promise<Refueling | undefined> {
    const [refueling] = await db.select().from(refueling).where(eq(refueling.id, id));
    return refueling || undefined;
  }

  async getRefuelingByVehicle(vehiclePlate: string): Promise<Refueling[]> {
    return await db.select().from(refueling).where(eq(refueling.vehiclePlate, vehiclePlate));
  }

  async getAllRefueling(): Promise<Refueling[]> {
    return await db.select().from(refueling);
  }

  async createRefueling(refuelingData: InsertRefueling): Promise<Refueling> {
    const [newRefueling] = await db.insert(refueling).values(refuelingData).returning();
    return newRefueling;
  }

  async updateRefueling(id: number, refuelingData: Partial<InsertRefueling>): Promise<Refueling | undefined> {
    const [updated] = await db
      .update(refueling)
      .set(refuelingData)
      .where(eq(refueling.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteRefueling(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(refueling)
      .where(eq(refueling.id, id))
      .returning();
    return !!deleted;
  }
  
  // Fine operations
  async getFine(id: number): Promise<Fine | undefined> {
    const [fine] = await db.select().from(fines).where(eq(fines.id, id));
    return fine || undefined;
  }

  async getFinesByVehicle(vehiclePlate: string): Promise<Fine[]> {
    return await db.select().from(fines).where(eq(fines.vehiclePlate, vehiclePlate));
  }

  async getAllFines(): Promise<Fine[]> {
    return await db.select().from(fines);
  }

  async createFine(fine: InsertFine): Promise<Fine> {
    const [newFine] = await db.insert(fines).values(fine).returning();
    return newFine;
  }

  async updateFine(id: number, fine: Partial<InsertFine>): Promise<Fine | undefined> {
    const [updated] = await db
      .update(fines)
      .set(fine)
      .where(eq(fines.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteFine(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(fines)
      .where(eq(fines.id, id))
      .returning();
    return !!deleted;
  }
  
  // LineHall operations
  async getLineHall(id: number): Promise<LineHall | undefined> {
    const [lineHall] = await db.select().from(lineHall).where(eq(lineHall.id, id));
    return lineHall || undefined;
  }

  async getAllLineHall(): Promise<LineHall[]> {
    return await db.select().from(lineHall);
  }

  async createLineHall(lineHallData: InsertLineHall): Promise<LineHall> {
    const [newLineHall] = await db.insert(lineHall).values(lineHallData).returning();
    return newLineHall;
  }

  async updateLineHall(id: number, lineHallData: Partial<InsertLineHall>): Promise<LineHall | undefined> {
    const [updated] = await db
      .update(lineHall)
      .set(lineHallData)
      .where(eq(lineHall.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteLineHall(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(lineHall)
      .where(eq(lineHall.id, id))
      .returning();
    return !!deleted;
  }
}

export const storage = new DatabaseStorage();

import { 
  users, vehicles, maintenance, tires, refueling, fines, lineHall, bases, workshops, painelPrincipal, operations,
  maintenanceChat, chatMessages,
  type User, type InsertUser, type Vehicle, type InsertVehicle,
  type Maintenance, type InsertMaintenance, type Tire, type InsertTire,
  type Refueling, type InsertRefueling, type Fine, type InsertFine,
  type LineHall, type InsertLineHall, type Base, type InsertBase,
  type Workshop, type InsertWorkshop, type Operation, type InsertOperation,
  type PainelPrincipal, type InsertPainelPrincipal, type MaintenanceChat, type InsertMaintenanceChat,
  type ChatMessage, type InsertChatMessage
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, like, desc, sql } from "drizzle-orm";

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
  
  // Workshop operations
  getWorkshop(id: number): Promise<Workshop | undefined>;
  getAllWorkshops(): Promise<Workshop[]>;
  getActiveWorkshops(): Promise<Workshop[]>;
  createWorkshop(workshop: InsertWorkshop): Promise<Workshop>;
  updateWorkshop(id: number, workshop: Partial<InsertWorkshop>): Promise<Workshop | undefined>;
  deleteWorkshop(id: number): Promise<boolean>;
  
  // Maintenance operations
  getMaintenance(id: number): Promise<Maintenance | undefined>;
  getMaintenanceByVehicle(vehiclePlate: string): Promise<Maintenance[]>;
  getMaintenanceByBaseAndStatus(baseId: number, status: string): Promise<Maintenance[]>;
  getAllMaintenance(): Promise<Maintenance[]>;
  createMaintenance(maintenance: InsertMaintenance): Promise<Maintenance>;
  updateMaintenanceStatus(id: number, status: string): Promise<Maintenance | undefined>;
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
  
  // Maintenance Chat operations
  getMaintenanceChat(id: number): Promise<MaintenanceChat | undefined>;
  getMaintenanceChatByMaintenanceId(maintenanceId: number): Promise<MaintenanceChat | undefined>;
  getMaintenanceChatWithMessages(chatId: number): Promise<{chat: MaintenanceChat, messages: ChatMessage[]}>;
  createMaintenanceChat(chat: InsertMaintenanceChat): Promise<MaintenanceChat>;
  updateMaintenanceChat(id: number, chat: Partial<InsertMaintenanceChat>): Promise<MaintenanceChat | undefined>;
  finalizeMaintenanceChat(id: number, finalBudget: number, finalizedBy: string): Promise<MaintenanceChat | undefined>;
  getAllMaintenanceChats(): Promise<MaintenanceChat[]>;
  getMaintenanceEntriesWithChats(): Promise<any[]>;
  
  // Chat Message operations
  getChatMessage(id: number): Promise<ChatMessage | undefined>;
  getChatMessagesByChatId(chatId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    try {
      // Usar SQL direto para evitar problemas com o campo oficina_id
      const query = `
        SELECT id, name, email, password, role, base_id, basename, oficina_id
        FROM users 
        WHERE id = $1
      `;
      
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      // Converter o resultado para o formato esperado com log para depuração
      console.log("Dados do usuário por ID:", JSON.stringify(result.rows[0], null, 2));
      
      const user: User = {
        id: result.rows[0].id,
        name: result.rows[0].name,
        email: result.rows[0].email,
        password: result.rows[0].password,
        role: result.rows[0].role,
        baseId: result.rows[0].base_id, // Corrigido para usar base_id, nome da coluna no banco
        basename: result.rows[0].basename,
        oficina_id: result.rows[0].oficina_id || null
      };
      
      return user;
    } catch (error) {
      console.error("Erro ao buscar usuário por ID:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      // Usar SQL direto para evitar problemas com o campo oficina_id
      const query = `
        SELECT id, name, email, password, role, base_id, basename, oficina_id
        FROM users 
        WHERE email = $1
      `;
      
      const result = await pool.query(query, [email]);
      
      if (result.rows.length === 0) {
        console.log(`Usuário não encontrado: ${email}`);
        return undefined;
      }
      
      // Converter o resultado para o formato esperado com log para depuração
      console.log("Dados do usuário:", JSON.stringify(result.rows[0], null, 2));
      
      const user: User = {
        id: result.rows[0].id,
        name: result.rows[0].name,
        email: result.rows[0].email,
        password: result.rows[0].password,
        role: result.rows[0].role,
        baseId: result.rows[0].base_id, // Corrigido para usar base_id, nome da coluna no banco
        basename: result.rows[0].basename,
        oficina_id: result.rows[0].oficina_id || null
      };
      
      return user;
    } catch (error) {
      console.error("Erro ao buscar usuário por email:", error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    console.log("Criando usuário com os seguintes dados:", { 
      ...user, 
      password: "***********"  // Oculta a senha por segurança
    });
    
    try {
      // Usar SQL direto para evitar problemas com o campo oficina_id
      let query = `
        INSERT INTO users (name, email, password, role
      `;
      
      const params = [user.name, user.email, user.password, user.role];
      let valueIndexes = `$1, $2, $3, $4`;
      let paramIndex = 5;
      
      // Adicionar campos opcionais se presentes
      if (user.baseId !== undefined && user.baseId !== null) {
        query += `, base_id`;
        valueIndexes += `, $${paramIndex}`;
        params.push(user.baseId);
        paramIndex++;
      }
      
      if (user.basename) {
        query += `, basename`;
        valueIndexes += `, $${paramIndex}`;
        params.push(user.basename);
        paramIndex++;
      }
      
      if (user.oficina_id !== undefined && user.oficina_id !== null) {
        query += `, oficina_id`;
        valueIndexes += `, $${paramIndex}`;
        params.push(user.oficina_id);
        paramIndex++;
      }
      
      query += `) VALUES (${valueIndexes}) RETURNING *`;
      
      const result = await pool.query(query, params);
      
      if (result.rows.length === 0) {
        throw new Error("Falha ao criar usuário");
      }
      
      const newUser: User = {
        id: result.rows[0].id,
        name: result.rows[0].name,
        email: result.rows[0].email,
        password: result.rows[0].password,
        role: result.rows[0].role,
        baseId: result.rows[0].base_id,
        basename: result.rows[0].basename,
        oficina_id: result.rows[0].oficina_id || null
      };
      
      console.log("Usuário criado com sucesso:", { id: newUser.id, email: newUser.email });
      return newUser;
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      throw error;
    }
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
    try {
      // Usar SQL bruto para evitar problemas com mapeamento de campos
      const result = await db.execute(sql`
        SELECT id, plate, model, vehicle_type as "vehicleType", 
               status, base_id as "baseId", ownership,
               rental_company as "rentalCompany"
        FROM vehicles
        WHERE id = ${id}
      `);
      return result.rows[0] as Vehicle || undefined;
    } catch (error) {
      console.error("Erro ao buscar veículo por ID:", error);
      return undefined;
    }
  }

  async getVehicleByPlate(plate: string): Promise<Vehicle | undefined> {
    try {
      // Usar SQL bruto para evitar problemas com mapeamento de campos
      const result = await db.execute(sql`
        SELECT id, plate, model, vehicle_type as "vehicleType", 
               status, base_id as "baseId", ownership,
               rental_company as "rentalCompany"
        FROM vehicles
        WHERE plate = ${plate}
      `);
      return result.rows[0] as Vehicle || undefined;
    } catch (error) {
      console.error("Erro ao buscar veículo pela placa:", error);
      return undefined;
    }
  }

  async getVehiclesByBase(baseId: number): Promise<Vehicle[]> {
    try {
      // Usar SQL bruto para evitar problemas com mapeamento de campos
      const result = await db.execute(sql`
        SELECT id, plate, model, vehicle_type as "vehicleType", 
               status, base_id as "baseId", ownership,
               rental_company as "rentalCompany"
        FROM vehicles
        WHERE base_id = ${baseId}
      `);
      return result.rows as Vehicle[];
    } catch (error) {
      console.error("Erro ao buscar veículos da base:", error);
      return [];
    }
  }

  async getAllVehicles(): Promise<Vehicle[]> {
    try {
      // Usar SQL bruto para evitar problemas com mapeamento de campos
      const result = await db.execute(sql`
        SELECT id, plate, model, vehicle_type as "vehicleType", 
               status, base_id as "baseId", ownership,
               rental_company as "rentalCompany"
        FROM vehicles
      `);
      return result.rows as Vehicle[];
    } catch (error) {
      console.error("Erro ao buscar veículos:", error);
      return [];
    }
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    console.log("storage.createVehicle - Iniciando inserção no banco de dados");
    console.log("Dados do veículo para inserção:", JSON.stringify(vehicle, null, 2));
    
    try {
      // Verificar primeiro se a placa já existe
      const existingVehicle = await this.getVehicleByPlate(vehicle.plate);
      if (existingVehicle) {
        // Lançar um erro personalizado para placas duplicadas
        const duplicateError = new Error(`Veículo com placa ${vehicle.plate} já existe no sistema`);
        duplicateError.name = "DuplicatePlateError";
        throw duplicateError;
      }
      
      // Usar SQL bruto para evitar problemas com mapeamento de campos
      // Transformar os nomes de campo do modelo para os nomes usados no banco de dados
      const result = await db.execute(sql`
        INSERT INTO vehicles 
        (plate, model, vehicle_type, status, base_id, ownership, rental_company)
        VALUES 
        (${vehicle.plate}, ${vehicle.model}, ${vehicle.vehicleType}, ${vehicle.status}, 
         ${vehicle.baseId}, ${vehicle.ownership || 'murici'}, 
         ${vehicle.ownership === 'locado' ? vehicle.rentalCompany : null})
        RETURNING id, plate, model, vehicle_type as "vehicleType", 
                 status, base_id as "baseId", ownership, rental_company as "rentalCompany"
      `);
      
      console.log("Veículo inserido com sucesso:", JSON.stringify(result.rows[0], null, 2));
      return result.rows[0] as Vehicle;
    } catch (error) {
      console.error("Erro ao inserir veículo no banco de dados:", error);
      
      // Verificar se é um erro de violação de constraint unique
      if ((error as any)?.code === '23505' && (error as any)?.constraint === 'vehicles_plate_unique') {
        const duplicateError = new Error(`Veículo com placa ${vehicle.plate} já existe no sistema`);
        duplicateError.name = "DuplicatePlateError";
        throw duplicateError;
      }
      
      throw error;
    }
  }

  async updateVehicle(id: number, vehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    try {
      // Preparar os campos para update, com seus nomes corretos no banco de dados
      const updateData: Record<string, any> = {};
      
      if (vehicle.plate !== undefined) updateData.plate = vehicle.plate;
      if (vehicle.model !== undefined) updateData.model = vehicle.model;
      if (vehicle.vehicleType !== undefined) updateData['vehicle_type'] = vehicle.vehicleType;
      if (vehicle.status !== undefined) updateData.status = vehicle.status;
      if (vehicle.baseId !== undefined) updateData['base_id'] = vehicle.baseId;
      if (vehicle.ownership !== undefined) updateData.ownership = vehicle.ownership;
      if (vehicle.rentalCompany !== undefined) updateData['rental_company'] = vehicle.rentalCompany;
      
      // Usar SQL bruto para evitar problemas com mapeamento de campos
      const result = await db.execute(sql`
        UPDATE vehicles
        SET ${sql.join(
          Object.entries(updateData).map(
            ([key, value]) => sql`${sql.identifier(key)} = ${value}`
          ),
          sql`, `
        )}
        WHERE id = ${id}
        RETURNING id, plate, model, vehicle_type as "vehicleType", 
                 status, base_id as "baseId", ownership,
                 rental_company as "rentalCompany"
      `);
      
      return result.rows[0] as Vehicle || undefined;
    } catch (error) {
      console.error("Erro ao atualizar veículo:", error);
      return undefined;
    }
  }

  async deleteVehicle(id: number): Promise<boolean> {
    try {
      // Usar SQL bruto para evitar problemas com mapeamento de campos
      const result = await db.execute(sql`
        DELETE FROM vehicles
        WHERE id = ${id}
        RETURNING id
      `);
      
      return result.rows.length > 0;
    } catch (error) {
      console.error("Erro ao excluir veículo:", error);
      return false;
    }
  }
  
  // Workshop operations
  async getWorkshop(id: number): Promise<Workshop | undefined> {
    const [workshop] = await db.select().from(workshops).where(eq(workshops.id, id));
    return workshop || undefined;
  }

  async getAllWorkshops(): Promise<Workshop[]> {
    return await db.select().from(workshops);
  }

  async getActiveWorkshops(): Promise<Workshop[]> {
    return await db.select().from(workshops).where(eq(workshops.isActive, true));
  }

  async createWorkshop(workshop: InsertWorkshop): Promise<Workshop> {
    const [newWorkshop] = await db.insert(workshops).values(workshop).returning();
    return newWorkshop;
  }

  async updateWorkshop(id: number, workshop: Partial<InsertWorkshop>): Promise<Workshop | undefined> {
    const [updated] = await db
      .update(workshops)
      .set(workshop)
      .where(eq(workshops.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteWorkshop(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(workshops)
      .where(eq(workshops.id, id))
      .returning();
    return !!deleted;
  }

  // Maintenance operations
  async getMaintenance(id: number): Promise<Maintenance | undefined> {
    const [maintenanceRecord] = await db.select().from(maintenance).where(eq(maintenance.id, id));
    return maintenanceRecord || undefined;
  }

  async getMaintenanceByVehicle(vehiclePlate: string): Promise<Maintenance[]> {
    return await db.select().from(maintenance).where(eq(maintenance.vehiclePlate, vehiclePlate))
      .orderBy(desc(maintenance.entryDate));
  }

  async getMaintenanceByBaseAndStatus(baseId: number, status: string): Promise<Maintenance[]> {
    return await db.select().from(maintenance)
      .where(
        and(
          eq(maintenance.requestBaseId, baseId),
          sql`${maintenance.status}::text = ${status}`
        )
      )
      .orderBy(desc(maintenance.entryDate));
  }
  
  async getMaintenanceByWorkshop(workshopId: number): Promise<Maintenance[]> {
    try {
      // Usar SQL direto para buscar dados de manutenção e juntar informações do veículo
      const query = `
        SELECT m.*, v.model as "vehicleModel"
        FROM manutencao m
        LEFT JOIN vehicles v ON m.vehicle_plate = v.plate
        WHERE m.workshop_id = $1
        ORDER BY m.entry_date DESC
      `;
      
      const result = await pool.query(query, [workshopId]);
      
      // Mapear os resultados para o formato correto do objeto Maintenance
      return result.rows.map(row => ({
        id: row.id,
        vehiclePlate: row.vehicle_plate,
        vehicleModel: row.vehicleModel || "",
        description: row.description,
        status: row.status,
        priority: row.priority,
        maintenanceType: row.maintenance_type,
        entryDate: row.entry_date,
        estimatedExitDate: row.estimated_exit_date,
        actualExitDate: row.actual_exit_date,
        workshopId: row.workshop_id,
        requestBaseId: row.request_base_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      console.error("Erro ao buscar manutenções da oficina:", error);
      return [];
    }
  }

  async getAllMaintenance(): Promise<Maintenance[]> {
    // Usar SQL direto para evitar problemas de colunas que podem não existir no banco
    try {
      const query = `
        SELECT * FROM manutencao
        ORDER BY entry_date DESC
      `;
      
      const result = await pool.query(query);
      
      return result.rows.map(row => ({
        id: row.id,
        vehiclePlate: row.vehicle_plate,
        description: row.description,
        status: row.status,
        workshopId: row.workshop_id,
        requestBaseId: row.request_base_id, 
        entryDate: row.entry_date,
        expectedExitDate: row.expected_exit_date,
        actualExitDate: row.actual_exit_date,
        maintenanceType: row.maintenance_type,
        initialCost: row.initial_cost,
        finalCost: row.final_cost,
        created_at: row.created_at,
        updated_at: row.updated_at,
        responsiblePerson: row.responsible_person
      }));
    } catch (error) {
      console.error("Erro ao buscar todas as manutenções:", error);
      return [];
    }
  }

  async createMaintenance(maintenanceData: InsertMaintenance): Promise<Maintenance> {
    const [newMaintenance] = await db.insert(maintenance).values(maintenanceData).returning();
    
    // Atualizar o status do veículo para em_manutencao
    await db.update(vehicles)
      .set({ status: 'em_manutencao' })
      .where(eq(vehicles.plate, maintenanceData.vehiclePlate));
      
    return newMaintenance;
  }

  async updateMaintenanceStatus(id: number, status: string): Promise<Maintenance | undefined> {
    // Pegar a manutenção atual primeiro
    const [currentMaintenance] = await db.select().from(maintenance).where(eq(maintenance.id, id));
    
    if (!currentMaintenance) {
      return undefined;
    }
    
    // Preparar dados para atualização
    const updateData: Partial<InsertMaintenance> = { 
      status: status as any
    };
    
    // Timestamp será adicionado diretamente na consulta
    
    // Se status for "concluida", adicionar data de saída real
    if (status === 'concluida' && !currentMaintenance.actualExitDate) {
      // Converter para string no formato ISO para evitar problemas de tipo
      updateData.actualExitDate = new Date().toISOString().split('T')[0];
      
      // Atualizar o status do veículo para em_operacao
      await db.update(vehicles)
        .set({ status: 'em_operacao' })
        .where(eq(vehicles.plate, currentMaintenance.vehiclePlate));
    }
    
    // Se status for "cancelada", também deve atualizar veículo
    if (status === 'cancelada') {
      await db.update(vehicles)
        .set({ status: 'em_operacao' })
        .where(eq(vehicles.plate, currentMaintenance.vehiclePlate));
    }
    
    const updatedAt = new Date();
    
    const [updated] = await db
      .update(maintenance)
      .set({
        ...updateData,
        updated_at: updatedAt
      })
      .where(eq(maintenance.id, id))
      .returning();
      
    return updated || undefined;
  }

  async updateMaintenance(id: number, maintenanceData: Partial<InsertMaintenance>): Promise<Maintenance | undefined> {
    // Criar uma cópia dos dados de atualização e remover o campo updated_at
    const dataToUpdate = { ...maintenanceData };
    delete dataToUpdate.updated_at;
    
    // Adicionar a atualização de timestamp diretamente na consulta SQL
    const updatedAt = new Date();
    
    const [updated] = await db
      .update(maintenance)
      .set({
        ...dataToUpdate,
        updated_at: updatedAt
      })
      .where(eq(maintenance.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteMaintenance(id: number): Promise<boolean> {
    // Primeiro, obter a manutenção para saber qual veículo atualizar
    const [maintenanceRecord] = await db.select().from(maintenance).where(eq(maintenance.id, id));
    
    if (maintenanceRecord) {
      // Se o veículo estiver em manutenção, retornar para operação
      await db.update(vehicles)
        .set({ status: 'em_operacao' })
        .where(eq(vehicles.plate, maintenanceRecord.vehiclePlate));
    }
    
    const [deleted] = await db
      .delete(maintenance)
      .where(eq(maintenance.id, id))
      .returning();
    return !!deleted;
  }
  
  // Tire operations (pneus)
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
    const [refuelingRecord] = await db.select().from(refueling).where(eq(refueling.id, id));
    return refuelingRecord || undefined;
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
    const [result] = await db.select().from(lineHall).where(eq(lineHall.id, id));
    return result || undefined;
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

  // Maintenance Chat operations
  async getMaintenanceChat(id: number): Promise<MaintenanceChat | undefined> {
    try {
      const [chat] = await db.select().from(maintenanceChat).where(eq(maintenanceChat.id, id));
      return chat;
    } catch (error) {
      console.error("Erro ao buscar chat de manutenção:", error);
      return undefined;
    }
  }

  async getMaintenanceChatByMaintenanceId(maintenanceId: number): Promise<MaintenanceChat | undefined> {
    try {
      const [chat] = await db
        .select()
        .from(maintenanceChat)
        .where(eq(maintenanceChat.maintenanceId, maintenanceId));
      return chat;
    } catch (error) {
      console.error("Erro ao buscar chat por ID de manutenção:", error);
      return undefined;
    }
  }

  async getMaintenanceChatWithMessages(chatId: number): Promise<{ chat: MaintenanceChat, messages: ChatMessage[] }> {
    try {
      const [chat] = await db
        .select()
        .from(maintenanceChat)
        .where(eq(maintenanceChat.id, chatId));

      if (!chat) {
        throw new Error("Chat não encontrado");
      }

      const messages = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.chatId, chatId))
        .orderBy(chatMessages.sent_at);

      return { chat, messages };
    } catch (error) {
      console.error("Erro ao buscar chat com mensagens:", error);
      throw error;
    }
  }

  async createMaintenanceChat(chat: InsertMaintenanceChat): Promise<MaintenanceChat> {
    try {
      // Verificar se já existe um chat para esta manutenção
      const existingChat = await this.getMaintenanceChatByMaintenanceId(chat.maintenanceId);
      if (existingChat) {
        return existingChat;
      }

      const [newChat] = await db
        .insert(maintenanceChat)
        .values(chat)
        .returning();
      return newChat;
    } catch (error) {
      console.error("Erro ao criar chat de manutenção:", error);
      throw error;
    }
  }

  async updateMaintenanceChat(id: number, chat: Partial<InsertMaintenanceChat>): Promise<MaintenanceChat | undefined> {
    try {
      const [updated] = await db
        .update(maintenanceChat)
        .set(chat)
        .where(eq(maintenanceChat.id, id))
        .returning();
      return updated || undefined;
    } catch (error) {
      console.error("Erro ao atualizar chat de manutenção:", error);
      return undefined;
    }
  }

  async finalizeMaintenanceChat(id: number, finalBudget: number, finalizedBy: string): Promise<MaintenanceChat | undefined> {
    try {
      const [updated] = await db
        .update(maintenanceChat)
        .set({
          finalBudget,
          isFinalized: true,
          finalizedBy,
          finalizedAt: new Date()
        })
        .where(eq(maintenanceChat.id, id))
        .returning();
      
      if (updated) {
        // Atualizar o custo final na manutenção
        const maintenance = await this.getMaintenance(updated.maintenanceId);
        if (maintenance) {
          await this.updateMaintenance(maintenance.id, {
            finalCost: finalBudget,
            costApprovedBy: finalizedBy,
            costApprovalDate: new Date()
          });
        }
      }
      
      return updated || undefined;
    } catch (error) {
      console.error("Erro ao finalizar chat de manutenção:", error);
      return undefined;
    }
  }

  async getAllMaintenanceChats(): Promise<MaintenanceChat[]> {
    try {
      return await db.select().from(maintenanceChat);
    } catch (error) {
      console.error("Erro ao obter todos os chats de manutenção:", error);
      return [];
    }
  }
  
  async getMaintenanceEntriesWithChats(): Promise<any[]> {
    try {
      // Usar SQL bruto para fazer o JOIN entre manutenções e chats
      const query = `
        SELECT m.id, m.vehicle_plate, m.vehicle_model, m.description, m.status, 
               m.priority, m.workshop_id, w.name as workshop_name, 
               m.request_base_id, b.name as base_name, m.responsavel_nome,
               mc.id as maintenance_chat_id, mc.initial_budget, mc.final_budget, 
               mc.is_finalized, mc.created_at as chat_created_at
        FROM maintenance m
        INNER JOIN maintenance_chat mc ON m.id = mc.maintenance_id
        LEFT JOIN workshops w ON m.workshop_id = w.id
        LEFT JOIN bases b ON m.request_base_id = b.id
        ORDER BY mc.created_at DESC
      `;
      
      const result = await pool.query(query);
      
      return result.rows.map(row => ({
        id: row.id,
        vehiclePlate: row.vehicle_plate,
        vehicleModel: row.vehicle_model,
        description: row.description,
        status: row.status,
        priority: row.priority,
        workshopId: row.workshop_id,
        workshopName: row.workshop_name,
        baseId: row.request_base_id,
        baseName: row.base_name, 
        responsavelNome: row.responsavel_nome,
        maintenanceChatId: row.maintenance_chat_id,
        initialBudget: row.initial_budget,
        finalBudget: row.final_budget,
        isFinalized: row.is_finalized,
        chatCreatedAt: row.chat_created_at
      }));
    } catch (error) {
      console.error("Erro ao obter manutenções com chats:", error);
      return [];
    }
  }

  // Chat Message operations
  async getChatMessage(id: number): Promise<ChatMessage | undefined> {
    try {
      const [message] = await db.select().from(chatMessages).where(eq(chatMessages.id, id));
      return message;
    } catch (error) {
      console.error("Erro ao buscar mensagem:", error);
      return undefined;
    }
  }

  async getChatMessagesByChatId(chatId: number): Promise<ChatMessage[]> {
    try {
      const messages = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.chatId, chatId))
        .orderBy(chatMessages.sent_at);
      return messages;
    } catch (error) {
      console.error("Erro ao buscar mensagens por ID de chat:", error);
      return [];
    }
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    try {
      const [newMessage] = await db
        .insert(chatMessages)
        .values(message)
        .returning();
      return newMessage;
    } catch (error) {
      console.error("Erro ao criar mensagem de chat:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();

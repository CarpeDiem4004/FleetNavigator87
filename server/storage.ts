import { 
  users, vehicles as veiculos, maintenance, tires, refueling, fines, bases, workshops, painelPrincipal, operations,
  maintenanceChat, chatMessages, baseRequests, baseRequestUpdates, carReceptions, workshopBudgets,
  type User, type InsertUser, type Vehicle, type InsertVehicle,
  type Maintenance, type InsertMaintenance, type Tire, type InsertTire,
  type Refueling, type InsertRefueling, type Fine, type InsertFine,
  type Base, type InsertBase,
  type Workshop, type InsertWorkshop, type Operation, type InsertOperation,
  type PainelPrincipal, type InsertPainelPrincipal, type MaintenanceChat, type InsertMaintenanceChat,
  type ChatMessage, type InsertChatMessage, type BaseRequest, type InsertBaseRequest,
  type BaseRequestUpdate, type InsertBaseRequestUpdate, type CarReception, type InsertCarReception,
  type WorkshopBudget, type InsertWorkshopBudget
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, like, desc, sql } from "drizzle-orm";

// Define the storage interface with CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Base operations
  getBase(id: number): Promise<Base | undefined>;
  getBaseByBasename(basename: string): Promise<Base | undefined>;
  getAllBases(): Promise<Base[]>;
  createBase(base: InsertBase): Promise<Base>;
  updateBase(id: number, base: Partial<InsertBase>): Promise<Base | undefined>;
  deleteBase(id: number): Promise<boolean>;
  
  // Base Requests (Solicitações das bases)
  createBaseRequest(request: InsertBaseRequest): Promise<BaseRequest>;
  getBaseRequest(id: number): Promise<BaseRequest | undefined>;
  getBaseRequestsByBase(baseId: number): Promise<BaseRequest[]>;
  getBaseRequestsByType(requestType: string): Promise<BaseRequest[]>;
  getBaseRequestsByStatus(status: string): Promise<BaseRequest[]>;
  updateBaseRequestStatus(id: number, status: string, assignedUserId?: number): Promise<BaseRequest | undefined>;
  deleteBaseRequest(id: number): Promise<boolean>;
  
  // Base Request Updates (Tratativas)
  createBaseRequestUpdate(update: InsertBaseRequestUpdate): Promise<BaseRequestUpdate>;
  getBaseRequestUpdates(requestId: number): Promise<BaseRequestUpdate[]>;
  deleteBaseRequestUpdate(id: number): Promise<boolean>;
  
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
  getWorkshopByCnpj(cnpj: string): Promise<Workshop | undefined>;
  getAllWorkshops(): Promise<Workshop[]>;
  getActiveWorkshops(): Promise<Workshop[]>;
  createWorkshop(workshop: InsertWorkshop): Promise<Workshop>;
  updateWorkshop(id: number, workshop: Partial<InsertWorkshop>): Promise<Workshop | undefined>;
  deleteWorkshop(id: number): Promise<boolean>;
  
  // Maintenance operations
  getMaintenance(id: number): Promise<Maintenance | undefined>;
  getMaintenanceByVehicle(vehiclePlate: string): Promise<Maintenance[]>;
  getMaintenanceByBaseAndStatus(baseId: number, status: string): Promise<Maintenance[]>;
  getMaintenanceByWorkshop(workshopId: number): Promise<Maintenance[]>;
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
  
  // LineHall operations removidas conforme solicitação
  
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
  
  // Car Reception operations
  getCarReception(id: number): Promise<CarReception | undefined>;
  getCarReceptionsByWorkshop(workshopId: number): Promise<CarReception[]>;
  createCarReception(reception: InsertCarReception): Promise<CarReception>;
  updateCarReception(id: number, reception: Partial<InsertCarReception>): Promise<CarReception | undefined>;
  deleteCarReception(id: number): Promise<boolean>;
  
  // Workshop Budget operations
  getWorkshopBudget(id: number): Promise<WorkshopBudget | undefined>;
  getWorkshopBudgetsByWorkshop(workshopId: number): Promise<WorkshopBudget[]>;
  createWorkshopBudget(budget: InsertWorkshopBudget): Promise<WorkshopBudget>;
  updateWorkshopBudget(id: number, budget: Partial<InsertWorkshopBudget>): Promise<WorkshopBudget | undefined>;
  deleteWorkshopBudget(id: number): Promise<boolean>;
  approveWorkshopBudget(id: number, approvedBy: number): Promise<WorkshopBudget | undefined>;
  rejectWorkshopBudget(id: number, rejectedBy: number, reason: string): Promise<WorkshopBudget | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    try {
      // Usar SQL direto para evitar problemas com o campo oficina_id
      const query = `
        SELECT id, name, email, password, role, base_id, basename, oficina_id, is_active
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
        oficina_id: result.rows[0].oficina_id || null,
        isActive: result.rows[0].is_active !== false, // Se não for explicitamente false, consideramos true
        lastLogin: null // Campo não utilizado no login
      };
      
      return user;
    } catch (error) {
      console.error("Erro ao buscar usuário por ID:", error);
      return undefined;
    }
  }
  
  async getAllUsers(): Promise<User[]> {
    try {
      // Usar SQL direto para buscar todos os usuários
      const query = `
        SELECT u.id, u.name, u.email, u.role, u.base_id, b.name as basename, 
               u.oficina_id, u.is_active
        FROM users u
        LEFT JOIN bases b ON u.base_id = b.id
        ORDER BY u.id
      `;
      
      const result = await pool.query(query);
      
      console.log(`Encontrados ${result.rows.length} usuários no sistema`);
      
      // Mapear resultados para o formato User
      const users = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        email: row.email,
        password: '', // Não retornamos a senha
        role: row.role,
        baseId: row.base_id,
        basename: row.basename,
        oficina_id: row.oficina_id || null,
        isActive: row.is_active !== false, // Se não for explicitamente false, consideramos true
        lastLogin: null // Campo não utilizado na listagem
      }));
      
      return users;
    } catch (error) {
      console.error("Erro ao buscar todos os usuários:", error);
      return [];
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      // Usar SQL direto para evitar problemas com o campo oficina_id
      const query = `
        SELECT id, name, email, password, role, base_id, basename, oficina_id, is_active
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
        oficina_id: result.rows[0].oficina_id || null,
        isActive: result.rows[0].is_active !== false, // Se não for explicitamente false, consideramos true
        lastLogin: null // Campo não utilizado no login
      };
      
      return user;
    } catch (error) {
      console.error("Erro ao buscar usuário por email:", error);
      return undefined;
    }
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    console.log("Atualizando usuário ID:", id, "com os seguintes dados:", {
      ...userData,
      password: userData.password ? "***********" : undefined
    });
    
    try {
      // Verificar se o usuário existe
      const existingUser = await this.getUser(id);
      if (!existingUser) {
        console.error("Usuário não encontrado para atualizar:", id);
        return undefined;
      }
      
      // Construir a query de atualização dinamicamente
      let query = "UPDATE users SET";
      const updates: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;
      
      // Adicionar campos para atualização, se fornecidos
      if (userData.name !== undefined) {
        updates.push(` name = $${paramIndex++}`);
        params.push(userData.name);
      }
      
      if (userData.email !== undefined) {
        updates.push(` email = $${paramIndex++}`);
        params.push(userData.email);
      }
      
      if (userData.password !== undefined) {
        updates.push(` password = $${paramIndex++}`);
        params.push(userData.password);
      }
      
      if (userData.role !== undefined) {
        updates.push(` role = $${paramIndex++}`);
        params.push(userData.role);
      }
      
      if (userData.baseId !== undefined) {
        updates.push(` base_id = $${paramIndex++}`);
        params.push(userData.baseId);
      }
      
      if (userData.basename !== undefined) {
        updates.push(` basename = $${paramIndex++}`);
        params.push(userData.basename);
      }
      
      // Tratar o campo isActive para is_active no banco de dados
      if (userData.isActive !== undefined) {
        updates.push(` is_active = $${paramIndex++}`);
        params.push(userData.isActive);
        console.log(`Campo is_active será atualizado para: ${userData.isActive}`);
      }
      
      if (userData.oficina_id !== undefined) {
        updates.push(` oficina_id = $${paramIndex++}`);
        params.push(userData.oficina_id);
      }
      
      // Se não há campos para atualizar, retornar o usuário existente
      if (updates.length === 0) {
        console.log("Nenhum campo para atualizar, retornando usuário existente");
        return existingUser;
      }
      
      query += updates.join(",");
      query += ` WHERE id = $${paramIndex} RETURNING *`;
      params.push(id);
      
      const result = await pool.query(query, params);
      
      if (result.rows.length === 0) {
        console.error("Falha ao atualizar usuário, nenhuma linha retornada");
        return undefined;
      }
      
      const updatedUser: User = {
        id: result.rows[0].id,
        name: result.rows[0].name,
        email: result.rows[0].email,
        password: result.rows[0].password,
        role: result.rows[0].role,
        baseId: result.rows[0].base_id,
        basename: result.rows[0].basename,
        oficina_id: result.rows[0].oficina_id || null,
        isActive: result.rows[0].is_active !== false, // Se não for explicitamente false, consideramos true
        lastLogin: null
      };
      
      console.log("Usuário atualizado com sucesso:", { id: updatedUser.id, email: updatedUser.email });
      return updatedUser;
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
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
        INSERT INTO users (name, email, password, role, is_active
      `;
      
      const params = [user.name, user.email, user.password, user.role, true]; // Define is_active como true por padrão
      let valueIndexes = `$1, $2, $3, $4, $5`;
      let paramIndex = 6;
      
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
        oficina_id: result.rows[0].oficina_id || null,
        isActive: result.rows[0].is_active !== false, // Se não for explicitamente false, consideramos true
        lastLogin: null
      };
      
      console.log("Usuário criado com sucesso:", { id: newUser.id, email: newUser.email });
      return newUser;
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      throw error;
    }
  }

  // Método updateUser já implementado anteriormente

  async deleteUser(id: number): Promise<boolean> {
    try {
      console.log(`Excluindo usuário ID ${id} usando SQL direto...`);
      
      // Usar SQL direto para evitar problemas com possíveis diferenças entre o esquema e a tabela física
      const query = `DELETE FROM users WHERE id = $1 RETURNING id`;
      const result = await pool.query(query, [id]);
      
      // Verificar se alguma linha foi afetada
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error(`Erro ao excluir usuário ID ${id}:`, error);
      return false;
    }
  }
  
  // Base operations
  async getBase(id: number): Promise<Base | undefined> {
    const [base] = await db.select().from(bases).where(eq(bases.id, id));
    return base || undefined;
  }

  async getBaseByBasename(basename: string): Promise<Base | undefined> {
    console.log(`[STORAGE] Buscando base por basename: ${basename}`);
    
    // Busca flexível: por basename exato, contendo o termo, ou por nome
    const basenameLower = basename.toLowerCase();
    const allBases = await db.select().from(bases);
    
    const base = allBases.find(b => {
      if (!b.basename && !b.name) return false;
      
      // Busca exata por basename
      if (b.basename?.toLowerCase() === basenameLower) return true;
      
      // Busca contendo o termo no basename
      if (b.basename?.toLowerCase().includes(basenameLower)) return true;
      
      // Busca contendo o termo no nome
      if (b.name?.toLowerCase().includes(basenameLower)) return true;
      
      return false;
    });
    
    if (base) {
      console.log(`[STORAGE] Base encontrada: ${base.name} (ID: ${base.id}) - Basename: ${base.basename}`);
    } else {
      console.log(`[STORAGE] Base não encontrada para termo: ${basename}`);
      console.log(`[STORAGE] Bases disponíveis: ${allBases.map(b => `${b.name} (${b.basename})`).join(', ')}`);
    }
    return base || undefined;
  }

  async getAllBases(): Promise<Base[]> {
    console.log(`[STORAGE] getAllBases() CHAMADO - Iniciando filtro...`);
    
    // Filtrar bases para acesso externo (sem manutenção)
    const allBases = await db.select().from(bases);
    console.log(`[STORAGE] Total bases no banco: ${allBases.length}`);
    
    const externalBases = allBases.filter(base => {
      const shouldInclude = base.active && base.name && !base.name.toLowerCase().includes('manutenção');
      if (!shouldInclude && base.name?.toLowerCase().includes('manutenção')) {
        console.log(`[STORAGE] Removendo base de manutenção: ${base.name}`);
      }
      return shouldInclude;
    });
    
    console.log(`[STORAGE] Bases após filtro: ${externalBases.length}`);
    return externalBases;
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
        SELECT id, placa as "plate", modelo as "model", tipo as "vehicleType", 
               status, base_id as "baseId", fuel_type as "fuelType", ano as "year",
               km_atual as "mileage", cartao_abastecimento as "cartaoAbastecimento",
               'murici' as ownership, null as "rentalCompany"
        FROM veiculos
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
        SELECT id, plate, model, vehicletype as "vehicleType", 
               status, baseid as "baseId", fueltype,
               year, mileage, color
        FROM veiculos
        WHERE plate = ${plate}
      `);
      
      if (!result.rows[0]) return undefined;
      
      // Map the result to match the Vehicle interface
      return {
        id: result.rows[0].id,
        plate: result.rows[0].plate,
        model: result.rows[0].model,
        vehicleType: result.rows[0].vehicleType,
        status: result.rows[0].status,
        baseId: result.rows[0].baseId,
        fuelType: result.rows[0].fueltype,
        year: result.rows[0].year,
        mileage: result.rows[0].mileage,
        color: result.rows[0].color,
        // Add default/null values for any fields expected by Vehicle interface but not in DB
        ownership: 'murici',
        rentalCompany: null
      };
    } catch (error) {
      console.error("Erro ao buscar veículo pela placa:", error);
      return undefined;
    }
  }

  async getVehiclesByBase(baseId: number): Promise<Vehicle[]> {
    try {
      // Usar SQL bruto para evitar problemas com mapeamento de campos
      const result = await db.execute(sql`
        SELECT id, plate, model, vehicletype as "vehicleType", 
               status, baseid as "baseId", fueltype,
               year, mileage, color, cartao_abastecimento as "cartaoAbastecimento"
        FROM veiculos
        WHERE baseid = ${baseId}
      `);
      
      // Map the result to match the Vehicle interface
      return result.rows.map(row => ({
        id: row.id,
        plate: row.plate,
        model: row.model,
        vehicleType: row.vehicleType,
        status: row.status,
        baseId: row.baseId,
        fuelType: row.fueltype,
        year: row.year,
        mileage: row.mileage,
        color: row.color,
        cartaoAbastecimento: row.cartaoAbastecimento,
        // Add default/null values for any fields expected by Vehicle interface but not in DB
        ownership: 'murici',
        rentalCompany: null
      }));
    } catch (error) {
      console.error("Erro ao buscar veículos da base:", error);
      return [];
    }
  }

  async getAllVehicles(): Promise<Vehicle[]> {
    try {
      // Use the correct vehicles table with proper column names
      const result = await db.execute(sql`
        SELECT id, plate, 
               COALESCE(model, '') as model,
               COALESCE(make, '') as make,
               vehicle_type as "vehicleType", 
               status, base_id as "baseId",
               COALESCE(fuel_type, 'diesel') as "fuelType",
               year, 
               COALESCE(consumo_medio_km_l, 0) as "mediaConsumoCombutivel"
        FROM vehicles
      `);
      
      // Map the result to match the Vehicle interface
      return result.rows.map(row => ({
        id: row.id,
        plate: row.plate,
        model: row.model,
        make: row.make,
        vehicleType: row.vehicleType,
        status: row.status,
        baseId: row.baseId,
        fuelType: row.fuelType,
        year: row.year,
        mediaConsumoCombutivel: row.mediaConsumoCombutivel
      }));
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
      
      // Usar SQL bruto com os nomes corretos das colunas (sem make)
      const result = await db.execute(sql`
        INSERT INTO veiculos 
        (placa, modelo, marca, tipo, status, base_id, fuel_type, year, media_consumo_combustivel)
        VALUES 
        (${vehicle.plate}, ${vehicle.model || ''}, ${vehicle.make || 'Mercedes'}, 
         ${vehicle.vehicleType}, ${vehicle.status}, ${vehicle.baseId}, 
         ${vehicle.fuelType || 'Diesel'}, ${vehicle.year || null}, 
         ${vehicle.mediaConsumoCombutivel || null})
        RETURNING id, placa as plate, modelo as model, marca as make, tipo as "vehicleType", 
                 status, base_id as "baseId", fuel_type as "fuelType", 
                 year, media_consumo_combustivel as "mediaConsumoCombutivel"
      `);
      
      console.log("Veículo inserido com sucesso:", JSON.stringify(result.rows[0], null, 2));
      return result.rows[0] as Vehicle;
    } catch (error) {
      console.error("Erro ao inserir veículo no banco de dados:", error);
      
      // Verificar se é um erro de violação de constraint unique
      if ((error as any)?.code === '23505' && (error as any)?.constraint === 'veiculos_plate_unique') {
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
      
      if (vehicle.plate !== undefined) updateData.placa = vehicle.plate;
      if (vehicle.model !== undefined) updateData.modelo = vehicle.model;
      if (vehicle.vehicleType !== undefined) updateData.tipo = vehicle.vehicleType;
      if (vehicle.status !== undefined) updateData.status = vehicle.status;
      if (vehicle.baseId !== undefined) updateData.base_id = vehicle.baseId;
      if (vehicle.fuelType !== undefined) updateData.fuel_type = vehicle.fuelType;
      if (vehicle.year !== undefined) updateData.ano = vehicle.year;
      if (vehicle.mileage !== undefined) updateData.km_atual = vehicle.mileage;
      if (vehicle.color !== undefined) updateData.color = vehicle.color;
      if (vehicle.cartaoAbastecimento !== undefined) updateData.cartao_abastecimento = vehicle.cartaoAbastecimento;
      
      // Usar SQL bruto para evitar problemas com mapeamento de campos
      const result = await db.execute(sql`
        UPDATE veiculos
        SET ${sql.join(
          Object.entries(updateData).map(
            ([key, value]) => sql`${sql.identifier(key)} = ${value}`
          ),
          sql`, `
        )}
        WHERE id = ${id}
        RETURNING id, placa as "plate", modelo as "model", tipo as "vehicleType", 
                 status, base_id as "baseId", fuel_type as "fuelType", ano as "year", 
                 km_atual as "mileage", cartao_abastecimento as "cartaoAbastecimento"
      `);
      
      if (!result.rows[0]) return undefined;
      
      // Map the result to match the Vehicle interface
      return {
        id: result.rows[0].id,
        plate: result.rows[0].plate,
        model: result.rows[0].model,
        vehicleType: result.rows[0].vehicleType,
        status: result.rows[0].status,
        baseId: result.rows[0].baseId,
        fuelType: result.rows[0].fuelType,
        year: result.rows[0].year,
        mileage: result.rows[0].mileage,
        cartaoAbastecimento: result.rows[0].cartaoAbastecimento,
        // Add default values for fields expected by Vehicle interface but not in DB
        ownership: 'murici',
        rentalCompany: null
      };
    } catch (error) {
      console.error("Erro ao atualizar veículo:", error);
      return undefined;
    }
  }

  async deleteVehicle(id: number): Promise<boolean> {
    try {
      // Usar SQL bruto para evitar problemas com mapeamento de campos
      const result = await db.execute(sql`
        DELETE FROM veiculos
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

  async getWorkshopByCnpj(cnpj: string): Promise<Workshop | undefined> {
    try {
      const query = `SELECT * FROM oficinas WHERE cnpj = $1`;
      const result = await pool.query(query, [cnpj]);
      
      if (result.rows.length === 0) {
        return undefined;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        razao_social: row.razao_social,
        cnpj: row.cnpj,
        endereco: row.endereco,
        telefone: row.telefone,
        email: row.email,
        responsavel: row.responsavel,
        tipo: row.tipo,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        nome_fantasia: row.nome_fantasia
      };
    } catch (error) {
      console.error("Erro ao buscar oficina por CNPJ:", error);
      return undefined;
    }
  }

  async getAllWorkshops(): Promise<Workshop[]> {
    try {
      const query = `SELECT * FROM oficinas ORDER BY created_at DESC`;
      const result = await pool.query(query);
      
      return result.rows.map(row => ({
        id: row.id,
        name: row.razao_social || row.nome_fantasia,
        cnpj: row.cnpj,
        address: row.endereco,
        phone: row.telefone,
        email: row.email,
        contactPerson: row.responsavel,
        workshopType: row.tipo,
        isActive: row.status === 'ativo',
        created_at: row.created_at,
        updated_at: row.updated_at
      }));
    } catch (error) {
      console.error("Erro ao buscar oficinas:", error);
      return [];
    }
  }

  async getActiveWorkshops(): Promise<Workshop[]> {
    try {
      const query = `SELECT * FROM oficinas WHERE status = 'ativo' ORDER BY created_at DESC`;
      const result = await pool.query(query);
      
      return result.rows.map(row => ({
        id: row.id,
        name: row.razao_social,
        cnpj: row.cnpj,
        address: row.endereco,
        phone: row.telefone,
        email: row.email,
        contactPerson: row.responsavel,
        workshopType: row.tipo,
        isActive: true,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));
    } catch (error) {
      console.error("Erro ao buscar oficinas ativas:", error);
      return [];
    }
  }

  async createWorkshop(workshop: InsertWorkshop): Promise<Workshop> {
    try {
      console.log("Criando oficina com dados:", JSON.stringify(workshop, null, 2));
      
      // Usar SQL direto para garantir compatibilidade com a estrutura da tabela oficinas
      const query = `
        INSERT INTO oficinas (
          cnpj, razao_social, nome_fantasia, endereco, 
          telefone, email, responsavel, status, tipo
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9
        ) RETURNING *
      `;
      
      const values = [
        workshop.cnpj,
        workshop.razao_social,
        workshop.nome_fantasia || workshop.razao_social,
        workshop.endereco,
        workshop.telefone,
        workshop.email,
        workshop.responsavel || 'Responsável',
        workshop.status || 'ativo',
        workshop.tipo || 'parceira'
      ];
      
      const result = await pool.query(query, values);
      const newWorkshop = result.rows[0];
      
      console.log("Oficina criada com sucesso:", newWorkshop);
      
      // Converter para o formato esperado
      return {
        id: newWorkshop.id,
        name: newWorkshop.razao_social,
        cnpj: newWorkshop.cnpj,
        address: newWorkshop.endereco,
        phone: newWorkshop.telefone,
        email: newWorkshop.email,
        contactPerson: newWorkshop.responsavel,
        workshopType: newWorkshop.tipo,
        isActive: newWorkshop.status === 'ativa',
        created_at: newWorkshop.created_at,
        updated_at: newWorkshop.updated_at
      };
    } catch (error) {
      console.error("Erro ao criar oficina:", error);
      throw error;
    }
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
    try {
      // Usar SQL direto em vez de Drizzle ORM para evitar problemas com colunas que podem não existir
      const query = `
        SELECT id, vehicle_plate as "vehiclePlate", descricao as description, status, 
               oficina_id as "workshopId", request_base_id as "requestBaseId"
        FROM manutencao
        WHERE id = $1
      `;
      
      const result = await pool.query(query, [id]);
      if (result.rows.length === 0) return undefined;
      
      return result.rows[0] as Maintenance;
    } catch (error) {
      console.error("Erro ao buscar manutenção:", error);
      return undefined;
    }
  }

  async getMaintenanceByVehicle(vehiclePlate: string): Promise<Maintenance[]> {
    return await db.select().from(maintenance).where(eq(maintenance.vehiclePlate, vehiclePlate))
      .orderBy(desc(maintenance.entryDate));
  }

  async getMaintenanceByBaseAndStatus(baseId: number, status: string): Promise<Maintenance[]> {
    try {
      console.log(`Buscando manutenções com baseId=${baseId} e status=${status}`);
      
      // Usar SQL direto para evitar problemas com os campos
      const query = `
        SELECT * FROM manutencao
        WHERE request_base_id = $1 
        AND status = $2
        ORDER BY entry_date DESC
      `;
      
      const result = await pool.query(query, [baseId, status]);
      console.log(`Encontradas ${result.rows.length} manutenções com baseId=${baseId} e status=${status}`);
      
      // Mapear os resultados para o formato esperado pelo frontend
      return result.rows.map(row => ({
        id: row.id,
        vehiclePlate: row.vehicle_plate || row.placa,
        description: row.descricao,
        status: row.status,
        priority: row.priority || "média",
        maintenanceType: row.tipo,
        workshopId: row.oficina_id,
        requestBaseId: row.request_base_id || row.base_id,
        entryDate: row.entry_date || row.data_solicitacao,
        estimatedCompletion: row.data_agendada,
        completionDate: row.data_conclusao,
        responsiblePerson: row.responsible_person,
        cost: row.custo,
        initialBudget: row.initial_budget,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));
    } catch (error) {
      console.error("Erro ao buscar manutenções por base e status:", error);
      return [];
    }
  }

  async getMaintenanceByWorkshop(workshopId: number): Promise<Maintenance[]> {
    try {
      console.log(`Buscando manutenções para oficina ID: ${workshopId}`);
      
      const query = `
        SELECT * FROM maintenance_orders
        WHERE workshop_id = $1
        ORDER BY start_date DESC
      `;
      
      const result = await pool.query(query, [workshopId]);
      console.log(`Encontradas ${result.rows.length} manutenções para oficina ${workshopId}`);
      
      return result.rows.map(row => ({
        id: row.id,
        vehiclePlate: row.vehicle_plate,
        description: row.description,
        status: row.status,
        priority: row.priority || "média",
        maintenanceType: row.service_type,
        workshopId: row.workshop_id,
        requestBaseId: null,
        entryDate: row.start_date,
        estimatedCompletion: row.estimated_completion,
        completionDate: row.completion_date,
        responsiblePerson: row.notes || 'Sistema',
        cost: row.estimated_cost,
        initialBudget: row.estimated_cost,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));
    } catch (error) {
      console.error("Erro ao buscar manutenções por oficina:", error);
      return [];
    }
  }
  


  async getAllMaintenance(): Promise<Maintenance[]> {
    try {
      const query = `
        SELECT 
          mo.id,
          mo.vehicle_plate as placa,
          mo.description as descricao,
          mo.status,
          mo.priority as prioridade,
          mo.service_type as tipo,
          mo.workshop_id as oficina_id,
          mo.start_date as data_solicitacao,
          mo.estimated_completion as data_agendada,
          mo.completion_date as data_conclusao,
          mo.estimated_cost as custo,
          mo.actual_cost,
          mo.labor_cost,
          mo.parts_cost,
          mo.notes as observacoes,
          mo.created_at,
          mo.updated_at,
          v.modelo as veiculo_modelo,
          v.marca as veiculo_marca,
          o.razao_social as oficina_nome,
          b.name as base_nome
        FROM maintenance_orders mo
        LEFT JOIN veiculos v ON mo.vehicle_plate = v.placa
        LEFT JOIN oficinas o ON mo.workshop_id = o.id
        LEFT JOIN bases b ON mo.vehicle_id = b.id
        ORDER BY mo.created_at DESC
      `;
      
      const result = await pool.query(query);
      console.log(`Encontradas ${result.rows.length} manutenções no total`);
      
      return result.rows.map(row => ({
        id: row.id,
        vehiclePlate: row.placa,
        description: row.descricao,
        status: row.status || 'pendente',
        priority: row.prioridade || 'media',
        maintenanceType: row.tipo || 'preventiva',
        workshopId: row.oficina_id,
        requestBaseId: null,
        entryDate: row.data_solicitacao,
        estimatedCompletion: row.data_agendada,
        completionDate: row.data_conclusao,
        responsiblePerson: 'Sistema',
        cost: row.custo || '0.00',
        initialBudget: row.custo || '0.00',
        created_at: row.created_at,
        updated_at: row.updated_at,
        vehicleModel: row.veiculo_modelo,
        vehicleBrand: row.veiculo_marca,
        workshopName: row.oficina_nome,
        baseName: row.base_nome,
        currentKm: null,
        deliveryPersonName: null,
        deliveryPersonCpf: null,
        deliveryPersonPhone: null,
        deliveredDate: null
      }));
    } catch (error) {
      console.error("Erro ao buscar todas as manutenções:", error);
      return [];
    }
  }

  async createMaintenance(maintenanceData: InsertMaintenance): Promise<Maintenance> {
    try {
      console.log("🔧 [SYNC] Criando manutenção com dados:", JSON.stringify(maintenanceData, null, 2));
      
      // 1️⃣ CRIAR REGISTRO NA TABELA PRINCIPAL (maintenance_orders)
      const query = `
        INSERT INTO maintenance_orders (
          vehicle_plate, description, status, service_type, 
          workshop_id, priority, estimated_cost,
          start_date, estimated_completion, notes
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
        ) RETURNING *
      `;
      
      const values = [
        maintenanceData.vehiclePlate,
        maintenanceData.description,
        maintenanceData.status || 'pendente',
        maintenanceData.maintenanceType || 'preventiva',
        maintenanceData.workshopId,
        maintenanceData.priority || 'media',
        maintenanceData.cost || 0,
        maintenanceData.entryDate || new Date(),
        maintenanceData.estimatedCompletion,
        maintenanceData.responsiblePerson || 'Sistema'
      ];
      
      const result = await pool.query(query, values);
      const newMaintenance = result.rows[0];
      
      console.log("✅ [SYNC] Manutenção criada na tabela principal:", newMaintenance);

      // 2️⃣ SINCRONIZAR COM TABELA DE OFICINAS (manutencao)
      try {
        const syncQuery = `
          INSERT INTO manutencao (
            placa, descricao, data_solicitacao, data_agendada, 
            status, oficina_id, prioridade, tipo, custo, responsavel, 
            observacoes, base_id, request_base_id
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
          ) RETURNING *
        `;
        
        const syncValues = [
          maintenanceData.vehiclePlate || maintenanceData.placa,
          maintenanceData.description || maintenanceData.descricao,
          maintenanceData.entryDate || maintenanceData.data_solicitacao || new Date(),
          maintenanceData.estimatedCompletion || maintenanceData.data_agendada,
          maintenanceData.status || 'pendente',
          maintenanceData.workshopId || maintenanceData.oficina_id,
          maintenanceData.priority || maintenanceData.prioridade || 'media',
          maintenanceData.maintenanceType || maintenanceData.tipo || 'corretiva',
          maintenanceData.cost || maintenanceData.custo || 0,
          maintenanceData.responsiblePerson || maintenanceData.responsavel || 'Sistema',
          maintenanceData.notes || maintenanceData.observacoes || '',
          maintenanceData.requestBaseId || maintenanceData.base_id || null,
          maintenanceData.requestBaseId || null
        ];
        
        const syncResult = await pool.query(syncQuery, syncValues);
        console.log("✅ [SYNC] Registro sincronizado na tabela de oficinas:", syncResult.rows[0]);
      } catch (syncError) {
        console.error("⚠️ [SYNC] Erro ao sincronizar com tabela de oficinas (não crítico):", syncError);
        // Não falhar a operação principal se houver erro na sincronização
      }
      
      // 3️⃣ ATUALIZAR STATUS DO VEÍCULO
      try {
        const updateVehicleQuery = `
          UPDATE veiculos 
          SET status = 'em_manutencao' 
          WHERE placa = $1
        `;
        await pool.query(updateVehicleQuery, [maintenanceData.vehiclePlate || maintenanceData.placa]);
        console.log(`✅ [SYNC] Status do veículo ${maintenanceData.vehiclePlate || maintenanceData.placa} atualizado para em_manutencao`);
      } catch (vehicleError) {
        console.error("⚠️ [SYNC] Erro ao atualizar status do veículo (não crítico):", vehicleError);
      }
      
      // Converter o objeto retornado pelo banco para o formato esperado
      return {
        id: newMaintenance.id,
        vehiclePlate: newMaintenance.vehicle_plate,
        description: newMaintenance.description,
        status: newMaintenance.status,
        priority: newMaintenance.priority || 'media',
        maintenanceType: newMaintenance.service_type,
        workshopId: newMaintenance.workshop_id,
        requestBaseId: null,
        entryDate: newMaintenance.start_date,
        estimatedCompletion: newMaintenance.estimated_completion,
        completionDate: newMaintenance.completion_date,
        responsiblePerson: newMaintenance.notes || 'Sistema',
        cost: newMaintenance.estimated_cost,
        initialBudget: newMaintenance.estimated_cost,
        created_at: newMaintenance.created_at,
        updated_at: newMaintenance.updated_at
      };
    } catch (error) {
      console.error("❌ [SYNC] Erro ao criar manutenção:", error);
      throw error;
    }
  }

  async updateMaintenanceStatus(id: number, status: string): Promise<Maintenance | undefined> {
    try {
      // Usar SQL direto para buscar manutenção e evitar erro com colunas que podem não existir
      const getQuery = `
        SELECT id, placa as "vehiclePlate", status, data_conclusao as "actualExitDate"
        FROM manutencao
        WHERE id = $1
      `;
      
      const result = await pool.query(getQuery, [id]);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const currentMaintenance = result.rows[0];
      
      // Preparar o SQL de atualização
      let updateSQL = `
        UPDATE manutencao
        SET status = $1, updated_at = $2
      `;
      
      let params = [status, new Date()];
      
      // Se status for "concluida", adicionar data de saída real
      if (status === 'concluida' && !currentMaintenance.actualExitDate) {
        // Adicionar parâmetro de data de saída
        updateSQL += `, data_conclusao = $3`;
        params.push(new Date().toISOString().split('T')[0]);
        
        // Atualizar o status do veículo para em_operacao
        await pool.query(
          `UPDATE veiculos SET status = 'em_operacao' WHERE placa = $1`,
          [currentMaintenance.vehiclePlate]
        );
      }
      
      // Se status for "cancelada", também deve atualizar veículo
      if (status === 'cancelada') {
        await pool.query(
          `UPDATE veiculos SET status = 'em_operacao' WHERE placa = $1`,
          [currentMaintenance.vehiclePlate]
        );
      }
      
      // Concluir a query de atualização
      updateSQL += ` WHERE id = $${params.length + 1} RETURNING *`;
      params.push(id);
      
      // Executar a atualização
      const updateResult = await pool.query(updateSQL, params);
      
      if (updateResult.rows.length === 0) {
        return undefined;
      }
      
      // Converter nomes de coluna snake_case para camelCase
      const updated = {
        id: updateResult.rows[0].id,
        vehiclePlate: updateResult.rows[0].vehicle_plate,
        description: updateResult.rows[0].description,
        status: updateResult.rows[0].status,
        workshopId: updateResult.rows[0].workshop_id,
        requestBaseId: updateResult.rows[0].request_base_id,
        entryDate: updateResult.rows[0].entry_date,
        expectedExitDate: updateResult.rows[0].expected_exit_date,
        actualExitDate: updateResult.rows[0].actual_exit_date,
        maintenanceType: updateResult.rows[0].maintenance_type,
        initialCost: updateResult.rows[0].initial_cost,
        finalCost: updateResult.rows[0].final_cost,
        created_at: updateResult.rows[0].created_at,
        updated_at: updateResult.rows[0].updated_at
      };
      
      return updated;
    } catch (error) {
      console.error("Erro ao atualizar status da manutenção:", error);
      return undefined;
    }
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
    try {
      // Usar SQL direto para consultar a tabela correta (manutencao)
      const maintenanceQuery = await pool.query('SELECT * FROM manutencao WHERE id = $1', [id]);
      
      if (maintenanceQuery.rows.length === 0) {
        console.log(`Manutenção com ID ${id} não encontrada na tabela manutencao`);
        return false;
      }
      
      const maintenanceRecord = maintenanceQuery.rows[0];
      
      // Se o veículo estiver em manutenção, retornar para operação
      if (maintenanceRecord.placa) {
        await pool.query(
          'UPDATE veiculos SET status = $1 WHERE plate = $2',
          ['em_operacao', maintenanceRecord.placa]
        );
      }
      
      // Excluir da tabela manutencao
      const deleteResult = await pool.query('DELETE FROM manutencao WHERE id = $1', [id]);
      
      console.log(`Manutenção ID ${id} (placa: ${maintenanceRecord.placa}) excluída com sucesso`);
      return deleteResult.rowCount > 0;
      
    } catch (error) {
      console.error(`Erro ao excluir manutenção ID ${id}:`, error);
      return false;
    }
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
  
  // LineHall operations removidas conforme solicitação

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
      // Eliminamos campos que não existem no banco (vehicle_model, priority, responsavel_nome)
      const query = `
        SELECT m.id, m.vehicle_plate, m.description, m.status, 
               m.workshop_id, w.name as workshop_name, 
               m.request_base_id, b.name as base_name, m.responsible_person,
               mc.id as maintenance_chat_id, mc.initial_budget, mc.final_budget, 
               mc.is_finalized, mc.created_at as chat_created_at
        FROM manutencao m
        INNER JOIN maintenance_chat mc ON m.id = mc.maintenance_id
        LEFT JOIN workshops w ON m.workshop_id = w.id
        LEFT JOIN bases b ON m.request_base_id = b.id
        ORDER BY mc.created_at DESC
      `;
      
      const result = await pool.query(query);
      
      return result.rows.map(row => ({
        id: row.id,
        vehiclePlate: row.vehicle_plate,
        // Removemos vehicleModel
        description: row.description,
        status: row.status,
        // Removemos priority 
        workshopId: row.workshop_id,
        workshopName: row.workshop_name,
        baseId: row.request_base_id,
        baseName: row.base_name, 
        responsavelNome: row.responsible_person, // Alteramos para o nome correto da coluna
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

  // Implementação das operações de solicitações das bases
  async createBaseRequest(request: InsertBaseRequest): Promise<BaseRequest> {
    try {
      const query = `
        INSERT INTO base_requests (
          base_id, request_type, title, description, status, priority,
          requester_user_id, vehicle_plate
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8
        ) RETURNING *
      `;
      
      const params = [
        request.baseId,
        request.requestType,
        request.title,
        request.description,
        request.status || 'pendente',
        request.priority || 'normal',
        request.requesterUserId,
        request.vehiclePlate || null
      ];
      
      const result = await pool.query(query, params);
      
      if (result.rows.length === 0) {
        throw new Error("Falha ao criar solicitação da base");
      }
      
      // Converter campos conforme necessário
      const newRequest: BaseRequest = {
        id: result.rows[0].id,
        baseId: result.rows[0].base_id,
        requestType: result.rows[0].request_type,
        title: result.rows[0].title,
        description: result.rows[0].description,
        status: result.rows[0].status,
        priority: result.rows[0].priority,
        requesterUserId: result.rows[0].requester_user_id,
        assignedUserId: result.rows[0].assigned_user_id,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at,
        resolvedAt: result.rows[0].resolved_at,
        vehiclePlate: result.rows[0].vehicle_plate
      };
      
      return newRequest;
    } catch (error) {
      console.error("Erro ao criar solicitação da base:", error);
      throw error;
    }
  }

  async getBaseRequest(id: number): Promise<BaseRequest | undefined> {
    try {
      const query = `
        SELECT br.*, b.name as base_name, u1.name as requester_name, u2.name as assigned_name
        FROM base_requests br
        JOIN bases b ON br.base_id = b.id
        JOIN users u1 ON br.requester_user_id = u1.id
        LEFT JOIN users u2 ON br.assigned_user_id = u2.id
        WHERE br.id = $1
      `;
      
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      // Converter o resultado
      const request: BaseRequest = {
        id: result.rows[0].id,
        baseId: result.rows[0].base_id,
        requestType: result.rows[0].request_type,
        title: result.rows[0].title,
        description: result.rows[0].description,
        status: result.rows[0].status,
        priority: result.rows[0].priority,
        requesterUserId: result.rows[0].requester_user_id,
        assignedUserId: result.rows[0].assigned_user_id,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at,
        resolvedAt: result.rows[0].resolved_at,
        vehiclePlate: result.rows[0].vehicle_plate
      };
      
      return request;
    } catch (error) {
      console.error("Erro ao buscar solicitação da base:", error);
      return undefined;
    }
  }

  async getBaseRequestsByBase(baseId: number): Promise<BaseRequest[]> {
    try {
      const query = `
        SELECT br.*, b.name as base_name, u1.name as requester_name, u2.name as assigned_name
        FROM base_requests br
        JOIN bases b ON br.base_id = b.id
        JOIN users u1 ON br.requester_user_id = u1.id
        LEFT JOIN users u2 ON br.assigned_user_id = u2.id
        WHERE br.base_id = $1
        ORDER BY 
          CASE 
            WHEN br.status = 'pendente' THEN 1
            WHEN br.status = 'em_analise' THEN 2
            WHEN br.status = 'em_andamento' THEN 3
            WHEN br.status = 'aguardando_informacao' THEN 4
            WHEN br.status = 'concluido' THEN 5
            WHEN br.status = 'cancelado' THEN 6
            ELSE 7
          END,
          CASE 
            WHEN br.priority = 'alta' THEN 1
            WHEN br.priority = 'normal' THEN 2
            WHEN br.priority = 'baixa' THEN 3
            ELSE 4
          END,
          br.created_at DESC
      `;
      
      const result = await pool.query(query, [baseId]);
      
      // Mapear os resultados
      return result.rows.map(row => ({
        id: row.id,
        baseId: row.base_id,
        requestType: row.request_type,
        title: row.title,
        description: row.description,
        status: row.status,
        priority: row.priority,
        requesterUserId: row.requester_user_id,
        assignedUserId: row.assigned_user_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        resolvedAt: row.resolved_at,
        vehiclePlate: row.vehicle_plate
      }));
    } catch (error) {
      console.error("Erro ao buscar solicitações por base:", error);
      return [];
    }
  }

  async getBaseRequestsByType(requestType: string): Promise<BaseRequest[]> {
    try {
      const query = `
        SELECT br.*, b.name as base_name, u1.name as requester_name, u2.name as assigned_name
        FROM base_requests br
        JOIN bases b ON br.base_id = b.id
        JOIN users u1 ON br.requester_user_id = u1.id
        LEFT JOIN users u2 ON br.assigned_user_id = u2.id
        WHERE br.request_type = $1
        ORDER BY 
          CASE 
            WHEN br.status = 'pendente' THEN 1
            WHEN br.status = 'em_analise' THEN 2
            WHEN br.status = 'em_andamento' THEN 3
            WHEN br.status = 'aguardando_informacao' THEN 4
            WHEN br.status = 'concluido' THEN 5
            WHEN br.status = 'cancelado' THEN 6
            ELSE 7
          END,
          CASE 
            WHEN br.priority = 'alta' THEN 1
            WHEN br.priority = 'normal' THEN 2
            WHEN br.priority = 'baixa' THEN 3
            ELSE 4
          END,
          br.created_at DESC
      `;
      
      const result = await pool.query(query, [requestType]);
      
      // Mapear os resultados
      return result.rows.map(row => ({
        id: row.id,
        baseId: row.base_id,
        requestType: row.request_type,
        title: row.title,
        description: row.description,
        status: row.status,
        priority: row.priority,
        requesterUserId: row.requester_user_id,
        assignedUserId: row.assigned_user_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        resolvedAt: row.resolved_at,
        vehiclePlate: row.vehicle_plate
      }));
    } catch (error) {
      console.error("Erro ao buscar solicitações por tipo:", error);
      return [];
    }
  }

  async getBaseRequestsByStatus(status: string): Promise<BaseRequest[]> {
    try {
      const query = `
        SELECT br.*, b.name as base_name, u1.name as requester_name, u2.name as assigned_name
        FROM base_requests br
        JOIN bases b ON br.base_id = b.id
        JOIN users u1 ON br.requester_user_id = u1.id
        LEFT JOIN users u2 ON br.assigned_user_id = u2.id
        WHERE br.status = $1
        ORDER BY 
          CASE 
            WHEN br.priority = 'alta' THEN 1
            WHEN br.priority = 'normal' THEN 2
            WHEN br.priority = 'baixa' THEN 3
            ELSE 4
          END,
          br.created_at DESC
      `;
      
      const result = await pool.query(query, [status]);
      
      // Mapear os resultados
      return result.rows.map(row => ({
        id: row.id,
        baseId: row.base_id,
        requestType: row.request_type,
        title: row.title,
        description: row.description,
        status: row.status,
        priority: row.priority,
        requesterUserId: row.requester_user_id,
        assignedUserId: row.assigned_user_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        resolvedAt: row.resolved_at,
        vehiclePlate: row.vehicle_plate
      }));
    } catch (error) {
      console.error("Erro ao buscar solicitações por status:", error);
      return [];
    }
  }

  async updateBaseRequestStatus(id: number, status: string, assignedUserId?: number): Promise<BaseRequest | undefined> {
    try {
      let query = `
        UPDATE base_requests
        SET status = $1, updated_at = NOW()
      `;
      
      const params: any[] = [status];
      
      // Se o status for 'concluido', incluir resolvedAt
      if (status === 'concluido') {
        query += `, resolved_at = NOW()`;
      }
      
      // Se houver um usuário atribuído, atualizar também
      if (assignedUserId) {
        query += `, assigned_user_id = $${params.length + 1}`;
        params.push(assignedUserId);
      }
      
      query += ` WHERE id = $${params.length + 1} RETURNING *`;
      params.push(id);
      
      const result = await pool.query(query, params);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      // Converter o resultado
      const updatedRequest: BaseRequest = {
        id: result.rows[0].id,
        baseId: result.rows[0].base_id,
        requestType: result.rows[0].request_type,
        title: result.rows[0].title,
        description: result.rows[0].description,
        status: result.rows[0].status,
        priority: result.rows[0].priority,
        requesterUserId: result.rows[0].requester_user_id,
        assignedUserId: result.rows[0].assigned_user_id,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at,
        resolvedAt: result.rows[0].resolved_at,
        vehiclePlate: result.rows[0].vehicle_plate
      };
      
      return updatedRequest;
    } catch (error) {
      console.error("Erro ao atualizar status da solicitação:", error);
      return undefined;
    }
  }

  async deleteBaseRequest(id: number): Promise<boolean> {
    try {
      // Excluir primeiro todas as atualizações relacionadas a esta solicitação
      await pool.query(`DELETE FROM base_request_updates WHERE request_id = $1`, [id]);
      
      // Agora excluir a solicitação
      const result = await pool.query(`DELETE FROM base_requests WHERE id = $1`, [id]);
      
      return result.rowCount > 0;
    } catch (error) {
      console.error("Erro ao excluir solicitação:", error);
      return false;
    }
  }

  // Implementação das operações de atualizações/tratativas
  async createBaseRequestUpdate(update: InsertBaseRequestUpdate): Promise<BaseRequestUpdate> {
    try {
      const query = `
        INSERT INTO base_request_updates (
          request_id, user_id, user_name, user_role, message, new_status, attachment_url
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7
        ) RETURNING *
      `;
      
      const params = [
        update.requestId,
        update.userId,
        update.userName,
        update.userRole,
        update.message,
        update.newStatus || null,
        update.attachmentUrl || null
      ];
      
      const result = await pool.query(query, params);
      
      if (result.rows.length === 0) {
        throw new Error("Falha ao criar atualização da solicitação");
      }
      
      // Atualizar o status da solicitação, se houver novo status
      if (update.newStatus) {
        await this.updateBaseRequestStatus(update.requestId, update.newStatus);
      }
      
      // Converter campos conforme necessário
      const newUpdate: BaseRequestUpdate = {
        id: result.rows[0].id,
        requestId: result.rows[0].request_id,
        userId: result.rows[0].user_id,
        userName: result.rows[0].user_name,
        userRole: result.rows[0].user_role,
        message: result.rows[0].message,
        newStatus: result.rows[0].new_status,
        createdAt: result.rows[0].created_at,
        attachmentUrl: result.rows[0].attachment_url
      };
      
      return newUpdate;
    } catch (error) {
      console.error("Erro ao criar atualização da solicitação:", error);
      throw error;
    }
  }

  async getBaseRequestUpdates(requestId: number): Promise<BaseRequestUpdate[]> {
    try {
      const query = `
        SELECT * FROM base_request_updates
        WHERE request_id = $1
        ORDER BY created_at ASC
      `;
      
      const result = await pool.query(query, [requestId]);
      
      // Mapear os resultados
      return result.rows.map(row => ({
        id: row.id,
        requestId: row.request_id,
        userId: row.user_id,
        userName: row.user_name,
        userRole: row.user_role,
        message: row.message,
        newStatus: row.new_status,
        createdAt: row.created_at,
        attachmentUrl: row.attachment_url
      }));
    } catch (error) {
      console.error("Erro ao buscar atualizações da solicitação:", error);
      return [];
    }
  }

  async deleteBaseRequestUpdate(id: number): Promise<boolean> {
    try {
      const result = await pool.query(`DELETE FROM base_request_updates WHERE id = $1`, [id]);
      return result.rowCount > 0;
    } catch (error) {
      console.error("Erro ao excluir atualização da solicitação:", error);
      return false;
    }
  }

  // Car Reception operations
  async getCarReception(id: number): Promise<CarReception | undefined> {
    try {
      const [reception] = await db.select().from(carReceptions).where(eq(carReceptions.id, id));
      return reception || undefined;
    } catch (error) {
      console.error("Erro ao buscar recebimento:", error);
      return undefined;
    }
  }

  async getCarReceptionsByWorkshop(workshopId: number): Promise<CarReception[]> {
    try {
      const receptions = await db.select().from(carReceptions)
        .where(eq(carReceptions.workshopId, workshopId))
        .orderBy(desc(carReceptions.created_at));
      return receptions;
    } catch (error) {
      console.error("Erro ao buscar recebimentos da oficina:", error);
      return [];
    }
  }

  async createCarReception(reception: InsertCarReception): Promise<CarReception> {
    try {
      const [newReception] = await db.insert(carReceptions).values(reception).returning();
      return newReception;
    } catch (error) {
      console.error("Erro ao criar recebimento:", error);
      throw error;
    }
  }

  async updateCarReception(id: number, reception: Partial<InsertCarReception>): Promise<CarReception | undefined> {
    try {
      console.log('[STORAGE] Atualizando recepção de veículo:', { id, reception });
      
      // Primeiro verificar se o registro existe
      const existing = await db
        .select()
        .from(carReceptions)
        .where(eq(carReceptions.id, id))
        .limit(1);
      
      if (existing.length === 0) {
        console.log('[STORAGE] Recepção não encontrada para ID:', id);
        return undefined;
      }
      
      console.log('[STORAGE] Recepção encontrada, procedendo com atualização');
      
      const [updatedReception] = await db.update(carReceptions)
        .set({
          ...reception,
          updated_at: new Date()
        })
        .where(eq(carReceptions.id, id))
        .returning();
      
      console.log('[STORAGE] Recepção atualizada com sucesso:', updatedReception);
      return updatedReception || undefined;
    } catch (error) {
      console.error('[STORAGE] Erro ao atualizar recebimento:', error);
      throw error;
    }
  }

  async deleteCarReception(id: number): Promise<boolean> {
    try {
      const result = await db.delete(carReceptions).where(eq(carReceptions.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Erro ao excluir recebimento:", error);
      return false;
    }
  }

  // Workshop Budget operations
  async getWorkshopBudget(id: number): Promise<WorkshopBudget | undefined> {
    try {
      const [budget] = await db.select().from(workshopBudgets)
        .where(eq(workshopBudgets.id, id))
        .limit(1);
      return budget;
    } catch (error) {
      console.error("Erro ao buscar orçamento:", error);
      return undefined;
    }
  }

  async getWorkshopBudgetsByWorkshop(workshopId: number): Promise<WorkshopBudget[]> {
    try {
      const budgets = await db.select().from(workshopBudgets)
        .where(eq(workshopBudgets.workshopId, workshopId))
        .orderBy(desc(workshopBudgets.created_at));
      return budgets;
    } catch (error) {
      console.error("Erro ao buscar orçamentos da oficina:", error);
      return [];
    }
  }

  async createWorkshopBudget(budget: InsertWorkshopBudget): Promise<WorkshopBudget> {
    try {
      const [newBudget] = await db.insert(workshopBudgets).values(budget).returning();
      return newBudget;
    } catch (error) {
      console.error("Erro ao criar orçamento:", error);
      throw error;
    }
  }

  async updateWorkshopBudget(id: number, budget: Partial<InsertWorkshopBudget>): Promise<WorkshopBudget | undefined> {
    try {
      const [updatedBudget] = await db.update(workshopBudgets)
        .set({
          ...budget,
          updated_at: new Date()
        })
        .where(eq(workshopBudgets.id, id))
        .returning();
      return updatedBudget || undefined;
    } catch (error) {
      console.error("Erro ao atualizar orçamento:", error);
      throw error;
    }
  }

  async deleteWorkshopBudget(id: number): Promise<boolean> {
    try {
      const result = await db.delete(workshopBudgets).where(eq(workshopBudgets.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Erro ao excluir orçamento:", error);
      return false;
    }
  }

  async approveWorkshopBudget(id: number, approvedBy: number): Promise<WorkshopBudget | undefined> {
    try {
      const [approvedBudget] = await db.update(workshopBudgets)
        .set({
          status: 'aprovado',
          approvedBy: approvedBy,
          approvedDate: new Date(),
          updated_at: new Date()
        })
        .where(eq(workshopBudgets.id, id))
        .returning();
      return approvedBudget || undefined;
    } catch (error) {
      console.error("Erro ao aprovar orçamento:", error);
      throw error;
    }
  }

  async rejectWorkshopBudget(id: number, rejectedBy: number, reason: string): Promise<WorkshopBudget | undefined> {
    try {
      const [rejectedBudget] = await db.update(workshopBudgets)
        .set({
          status: 'rejeitado',
          approvedBy: rejectedBy,
          rejectionReason: reason,
          updated_at: new Date()
        })
        .where(eq(workshopBudgets.id, id))
        .returning();
      return rejectedBudget || undefined;
    } catch (error) {
      console.error("Erro ao rejeitar orçamento:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();

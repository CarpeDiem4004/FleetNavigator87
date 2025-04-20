import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertBaseSchema, insertVehicleSchema, insertMaintenanceSchema,
  insertWorkshopSchema, insertTireSchema, insertRefuelingSchema, 
  insertFineSchema, insertLineHallSchema, insertUserSchema
} from "@shared/schema";
import { setupAuth } from "./auth";
import { getDashboardKPIs, getPainelPrincipal } from "./dashboardApi";
import { runSupabaseDiagnostic } from "./supabaseDiagnostic";
import { compareSchemas } from "./compareSchemas";
import { synchronizeSupabaseTables } from "./supabaseSchemaSync";
import { db } from "./db";

// Middleware para verificar autenticação em rotas protegidas
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Não autenticado" });
};

// Middleware para verificar se o usuário é admin
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: "Acesso negado. Permissão de administrador necessária." });
};

// Middleware para verificar se o usuário tem acesso à base especificada
const hasBaseAccess = (req: Request, res: Response, next: NextFunction) => {
  // Se o usuário for admin, permite acesso a todas as bases
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  
  // Verificar se o usuário tem uma base associada e se corresponde à base solicitada
  const requestedBaseId = req.params.baseId || req.query.baseId;
  
  if (requestedBaseId && req.user && req.user.baseId !== undefined) {
    // Se estiver solicitando uma base específica, verificar se corresponde à do usuário
    if (parseInt(requestedBaseId as string) === req.user.baseId) {
      return next();
    }
  } else if (req.user && req.user.baseId !== undefined) {
    // Se não estiver solicitando uma base específica, continuar mas será filtrado depois
    return next();
  }
  
  res.status(403).json({ message: "Acesso negado. Você só pode acessar dados da sua própria base." });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Configuração do passport para autenticação
  setupAuth(app);
  
  // Endpoint para diagnóstico do Supabase
  app.get("/api/diagnostico/supabase", isAdmin, async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    
    try {
      console.log("Iniciando diagnóstico do Supabase via API...");
      
      // Executar diagnóstico
      const diagnosticResults = await runSupabaseDiagnostic();
      
      console.log("Diagnóstico do Supabase concluído com sucesso");
      
      return res.status(200).json({
        success: true,
        message: "Diagnóstico Supabase concluído",
        timestamp: new Date().toISOString(),
        results: diagnosticResults
      });
    } catch (error: any) {
      console.error("Erro no diagnóstico do Supabase:", error);
      
      // Mesmo em caso de erro, retornamos uma resposta JSON válida
      return res.status(500).json({
        success: false,
        message: "Erro ao executar diagnóstico do Supabase",
        error: error.message,
        errorType: error.constructor.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });
  
  // Endpoint para comparação de esquemas entre Replit e Supabase
  app.get("/api/diagnostico/compare-schemas", isAdmin, async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    
    try {
      console.log("Iniciando comparação de esquemas entre Replit e Supabase...");
      
      // Executar comparação
      const comparison = await compareSchemas();
      
      console.log("Comparação de esquemas concluída com sucesso");
      
      return res.status(200).json({
        success: true,
        message: "Comparação de esquemas concluída",
        timestamp: new Date().toISOString(),
        results: comparison
      });
    } catch (error: any) {
      console.error("Erro na comparação de esquemas:", error);
      
      // Mesmo em caso de erro, retornamos uma resposta JSON válida
      return res.status(500).json({
        success: false,
        message: "Erro ao comparar esquemas",
        error: error.message,
        errorType: error.constructor.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });
  
  // Endpoint para sincronizar tabelas entre Replit e Supabase
  app.post("/api/diagnostico/sync-schema", isAdmin, async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    
    try {
      console.log("Iniciando sincronização de esquemas com o Supabase...");
      
      // Executar sincronização
      const result = await synchronizeSupabaseTables();
      
      return res.status(200).json({
        success: result.success,
        message: "Sincronização de esquemas concluída",
        timestamp: new Date().toISOString(),
        tablesCreated: result.tablesCreated,
        errors: result.errors
      });
    } catch (error: any) {
      console.error("Erro na sincronização de esquemas:", error);
      
      // Mesmo em caso de erro, retornamos uma resposta JSON válida
      return res.status(500).json({
        success: false,
        message: "Erro ao sincronizar esquemas",
        error: error.message,
        errorType: error.constructor.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });
  
  // Base routes
  // Temporariamente sem autenticação para testes
  app.get("/api/bases", async (req, res) => {
    try {
      const bases = await storage.getAllBases();
      return res.status(200).json(bases);
    } catch (error) {
      console.error("Error fetching bases:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/bases/:id", isAuthenticated, async (req, res) => {
    try {
      const base = await storage.getBase(parseInt(req.params.id));
      if (!base) {
        return res.status(404).json({ message: "Base not found" });
      }
      return res.status(200).json(base);
    } catch (error) {
      console.error("Error fetching base:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/bases", isAdmin, async (req, res) => {
    try {
      const result = insertBaseSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid base data", errors: result.error.format() });
      }
      
      const newBase = await storage.createBase(result.data);
      return res.status(201).json(newBase);
    } catch (error) {
      console.error("Error creating base:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.put("/api/bases/:id", isAdmin, async (req, res) => {
    try {
      const result = insertBaseSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid base data", errors: result.error.format() });
      }
      
      const updatedBase = await storage.updateBase(parseInt(req.params.id), result.data);
      if (!updatedBase) {
        return res.status(404).json({ message: "Base not found" });
      }
      
      return res.status(200).json(updatedBase);
    } catch (error) {
      console.error("Error updating base:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.delete("/api/bases/:id", isAdmin, async (req, res) => {
    try {
      const success = await storage.deleteBase(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Base not found" });
      }
      
      return res.status(200).json({ message: "Base deleted successfully" });
    } catch (error) {
      console.error("Error deleting base:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Vehicle routes
  app.get("/api/vehicles", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const baseId = req.user.baseId;
      const role = req.user.role;
      
      // Se o usuário é admin OU está na base "Gestão de Frotas" (baseId: 12), 
      // ele pode ver todos os veículos para gerenciar manutenções da frota completa
      const isFleetManagement = baseId === 12;
      
      // If user is admin or Fleet Management, they can see all vehicles
      // Otherwise, filter by base
      const vehicles = (role === 'admin' || isFleetManagement) 
        ? await storage.getAllVehicles() 
        : (baseId ? await storage.getVehiclesByBase(baseId) : []);
        
      return res.status(200).json(vehicles);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/vehicles/:id", isAuthenticated, async (req, res) => {
    try {
      const vehicle = await storage.getVehicle(parseInt(req.params.id));
      
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Se o usuário é admin OU está na base "Gestão de Frotas" (baseId: 12), 
      // ele pode ver todos os veículos para gerenciar manutenções da frota completa
      const isFleetManagement = req.user.baseId === 12;
      
      // Check if user has access to this vehicle
      if (req.user.role !== 'admin' && !isFleetManagement && vehicle.baseId !== req.user.baseId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      return res.status(200).json(vehicle);
    } catch (error) {
      console.error("Error fetching vehicle:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/vehicles", isAuthenticated, async (req, res) => {
    try {
      console.log("POST /api/vehicles - Iniciando criação de veículo");
      console.log("Dados recebidos:", JSON.stringify(req.body, null, 2));
      
      if (!req.user) {
        console.log("Usuário não autenticado");
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      console.log("Usuário autenticado:", req.user.id, req.user.name, req.user.email, req.user.baseId);
      
      // Ajustar os dados para o esquema da tabela se necessário
      const vehicleData = {
        plate: req.body.plate,
        model: req.body.model,
        vehicleType: req.body.vehicleType,
        status: req.body.status,
        baseId: req.body.baseId || req.user.baseId // Usar a baseId do usuário como fallback
      };
      
      console.log("Dados ajustados:", JSON.stringify(vehicleData, null, 2));
      
      try {
        // Validar os dados
        const result = insertVehicleSchema.safeParse(vehicleData);
        if (!result.success) {
          console.log("Dados inválidos:", JSON.stringify(result.error.format(), null, 2));
          return res.status(400).json({ message: "Invalid vehicle data", errors: result.error.format() });
        }
        
        // Check if user can create vehicle for this base
        if (req.user.role !== 'admin' && result.data.baseId !== req.user.baseId) {
          // Para usuários "Gestão de Frotas" (baseId 12), permitir criar para qualquer base
          if (req.user.baseId !== 12) {
            console.log("Permissão negada: baseId do veículo não corresponde ao baseId do usuário");
            return res.status(403).json({ message: "Cannot create vehicle for different base" });
          }
        }
        
        // Criar o veículo
        const newVehicle = await storage.createVehicle(result.data);
        console.log("Veículo criado com sucesso:", JSON.stringify(newVehicle, null, 2));
        
        return res.status(201).json(newVehicle);
      } catch (parseError) {
        console.error("Erro ao processar dados do veículo:", parseError);
        return res.status(400).json({ message: "Error parsing vehicle data", error: String(parseError) });
      }
    } catch (error) {
      console.error("Error creating vehicle:", error);
      return res.status(500).json({ message: "Server error", error: String(error) });
    }
  });
  
  app.put("/api/vehicles/:id", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const vehicleId = parseInt(req.params.id);
      const vehicle = await storage.getVehicle(vehicleId);
      
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      
      // Se o usuário é admin OU está na base "Gestão de Frotas" (baseId: 12), 
      // ele pode editar qualquer veículo
      const isFleetManagement = req.user.baseId === 12;
      
      // Check if user has access to edit this vehicle
      if (req.user.role !== 'admin' && !isFleetManagement && vehicle.baseId !== req.user.baseId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const result = insertVehicleSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid vehicle data", errors: result.error.format() });
      }
      
      const updatedVehicle = await storage.updateVehicle(vehicleId, result.data);
      return res.status(200).json(updatedVehicle);
    } catch (error) {
      console.error("Error updating vehicle:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.delete("/api/vehicles/:id", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const vehicleId = parseInt(req.params.id);
      const vehicle = await storage.getVehicle(vehicleId);
      
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      
      // Check if user has access to delete this vehicle
      if (req.user.role !== 'admin' && vehicle.baseId !== req.user.baseId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const success = await storage.deleteVehicle(vehicleId);
      return res.status(200).json({ message: "Vehicle deleted successfully" });
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Workshop routes
  app.get("/api/workshops", isAuthenticated, async (req, res) => {
    try {
      const activeOnly = req.query.active === 'true';
      const workshops = activeOnly 
        ? await storage.getActiveWorkshops()
        : await storage.getAllWorkshops();
      
      return res.status(200).json(workshops);
    } catch (error) {
      console.error("Error fetching workshops:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/workshops/:id", isAuthenticated, async (req, res) => {
    try {
      const workshop = await storage.getWorkshop(parseInt(req.params.id));
      
      if (!workshop) {
        return res.status(404).json({ message: "Workshop not found" });
      }
      
      return res.status(200).json(workshop);
    } catch (error) {
      console.error("Error fetching workshop:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/workshops", isAuthenticated, async (req, res) => {
    try {
      const result = insertWorkshopSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid workshop data", errors: result.error.format() });
      }
      
      const newWorkshop = await storage.createWorkshop(result.data);
      return res.status(201).json(newWorkshop);
    } catch (error) {
      console.error("Error creating workshop:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.put("/api/workshops/:id", isAuthenticated, async (req, res) => {
    try {
      const workshopId = parseInt(req.params.id);
      const workshop = await storage.getWorkshop(workshopId);
      
      if (!workshop) {
        return res.status(404).json({ message: "Workshop not found" });
      }
      
      const result = insertWorkshopSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid workshop data", errors: result.error.format() });
      }
      
      const updatedWorkshop = await storage.updateWorkshop(workshopId, result.data);
      return res.status(200).json(updatedWorkshop);
    } catch (error) {
      console.error("Error updating workshop:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.delete("/api/workshops/:id", isAdmin, async (req, res) => {
    try {
      const workshopId = parseInt(req.params.id);
      const success = await storage.deleteWorkshop(workshopId);
      
      if (!success) {
        return res.status(404).json({ message: "Workshop not found" });
      }
      
      return res.status(200).json({ message: "Workshop deleted successfully" });
    } catch (error) {
      console.error("Error deleting workshop:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Maintenance routes
  app.get("/api/maintenance", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Check if filtering by base and status
      const baseId = req.query.baseId ? parseInt(req.query.baseId as string) : null;
      const status = req.query.status as string | null;
      
      // Para usuários não-admin, forçar filtragem pela base do próprio usuário
      if (req.user.role !== 'admin' && req.user.baseId) {
        console.log(`Usuário não-admin id=${req.user.id}. Forçando filtro por baseId=${req.user.baseId}`);
        
        // Se pediu filtragem por base, verificar se coincide com a do usuário
        if (baseId && baseId !== req.user.baseId) {
          return res.status(403).json({ 
            message: "Acesso negado. Você só pode ver manutenções da sua própria base." 
          });
        }
        
        // Buscar manutenções com filtro por status (se existir) e pela base do usuário
        let maintenanceRecords;
        if (status) {
          maintenanceRecords = await storage.getMaintenanceByBaseAndStatus(req.user.baseId, status);
        } else {
          // Buscar todas e filtrar manualmente para a base do usuário
          const allRecords = await storage.getAllMaintenance();
          maintenanceRecords = allRecords.filter(m => m.requestBaseId === req.user!.baseId);
        }
        
        return res.status(200).json(maintenanceRecords);
      }
      
      // Administradores podem filtrar como quiserem
      if (req.user.role === 'admin') {
        // Se baseId e status fornecidos, filtrar por ambos
        if (baseId && status) {
          const maintenance = await storage.getMaintenanceByBaseAndStatus(baseId, status);
          return res.status(200).json(maintenance);
        } 
        // Se só baseId fornecido
        else if (baseId) {
          const allRecords = await storage.getAllMaintenance();
          const filtered = allRecords.filter(m => m.requestBaseId === baseId);
          return res.status(200).json(filtered);
        }
        // Se só status fornecido
        else if (status) {
          const allRecords = await storage.getAllMaintenance();
          const filtered = allRecords.filter(m => m.status === status);
          return res.status(200).json(filtered);
        }
        // Sem filtros, retornar todos
        else {
          const maintenance = await storage.getAllMaintenance();
          return res.status(200).json(maintenance);
        }
      }
      
      // Se chegou até aqui, é um usuário sem baseId definida - retornar lista vazia
      console.log(`Usuário ${req.user.id} sem baseId definida - retornando lista vazia`);
      return res.status(200).json([]);
    } catch (error) {
      console.error("Error fetching maintenance:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/maintenance/vehicle/:plate", isAuthenticated, async (req, res) => {
    try {
      const vehiclePlate = req.params.plate;
      
      // Verify vehicle exists
      const vehicle = await storage.getVehicleByPlate(vehiclePlate);
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      
      // Get maintenance history
      const maintenanceHistory = await storage.getMaintenanceByVehicle(vehiclePlate);
      return res.status(200).json(maintenanceHistory);
    } catch (error) {
      console.error("Error fetching maintenance history:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/maintenance/:id", isAuthenticated, async (req, res) => {
    try {
      const maintenanceId = parseInt(req.params.id);
      const maintenanceRecord = await storage.getMaintenance(maintenanceId);
      
      if (!maintenanceRecord) {
        return res.status(404).json({ message: "Maintenance record not found" });
      }
      
      return res.status(200).json(maintenanceRecord);
    } catch (error) {
      console.error("Error fetching maintenance record:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/maintenance", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const result = insertMaintenanceSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid maintenance data", errors: result.error.format() });
      }
      
      // Check if vehicle exists
      const vehicle = await storage.getVehicleByPlate(result.data.vehiclePlate);
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      
      // Check if workshop exists
      const workshop = await storage.getWorkshop(result.data.workshopId);
      if (!workshop) {
        return res.status(404).json({ message: "Workshop not found" });
      }
      
      // Check if requesting base exists (if different from user's base)
      if (result.data.requestBaseId !== req.user.baseId) {
        const requestBase = await storage.getBase(result.data.requestBaseId);
        if (!requestBase) {
          return res.status(404).json({ message: "Requesting base not found" });
        }
      }
      
      // Create maintenance record
      const newMaintenance = await storage.createMaintenance(result.data);
      return res.status(201).json(newMaintenance);
    } catch (error) {
      console.error("Error creating maintenance:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.patch("/api/maintenance/:id/status", isAuthenticated, async (req, res) => {
    try {
      const maintenanceId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      // Validate status value
      const validStatuses = ['pendente', 'aguardando_orcamento', 'em_andamento', 'concluida', 'cancelada'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          message: "Invalid status value", 
          validValues: validStatuses 
        });
      }
      
      // Update status
      const updatedMaintenance = await storage.updateMaintenanceStatus(maintenanceId, status);
      
      if (!updatedMaintenance) {
        return res.status(404).json({ message: "Maintenance record not found" });
      }
      
      return res.status(200).json(updatedMaintenance);
    } catch (error) {
      console.error("Error updating maintenance status:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.put("/api/maintenance/:id", isAuthenticated, async (req, res) => {
    try {
      const maintenanceId = parseInt(req.params.id);
      
      // Check if maintenance record exists
      const existingMaintenance = await storage.getMaintenance(maintenanceId);
      if (!existingMaintenance) {
        return res.status(404).json({ message: "Maintenance record not found" });
      }
      
      const result = insertMaintenanceSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid maintenance data", errors: result.error.format() });
      }
      
      // Update maintenance record
      const updatedMaintenance = await storage.updateMaintenance(maintenanceId, result.data);
      return res.status(200).json(updatedMaintenance);
    } catch (error) {
      console.error("Error updating maintenance:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.delete("/api/maintenance/:id", isAdmin, async (req, res) => {
    try {
      const maintenanceId = parseInt(req.params.id);
      const success = await storage.deleteMaintenance(maintenanceId);
      
      if (!success) {
        return res.status(404).json({ message: "Maintenance record not found" });
      }
      
      return res.status(200).json({ message: "Maintenance record deleted successfully" });
    } catch (error) {
      console.error("Error deleting maintenance:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Tires routes
  app.get("/api/tires", isAuthenticated, async (req, res) => {
    try {
      const tires = await storage.getAllTires();
      return res.status(200).json(tires);
    } catch (error) {
      console.error("Error fetching tires:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Refueling routes
  app.get("/api/refueling", isAuthenticated, async (req, res) => {
    try {
      const refueling = await storage.getAllRefueling();
      return res.status(200).json(refueling);
    } catch (error) {
      console.error("Error fetching refueling:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Fines routes
  app.get("/api/fines", isAuthenticated, async (req, res) => {
    try {
      const fines = await storage.getAllFines();
      return res.status(200).json(fines);
    } catch (error) {
      console.error("Error fetching fines:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // LineHall routes
  app.get("/api/line-hall", isAuthenticated, async (req, res) => {
    try {
      const lineHall = await storage.getAllLineHall();
      return res.status(200).json(lineHall);
    } catch (error) {
      console.error("Error fetching line hall:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Rota para adicionar uma nova viagem 
  app.post("/api/line-hall", isAuthenticated, async (req, res) => {
    try {
      console.log("Recebido request para criar viagem:", req.body);
      
      // Validar os dados de entrada
      if (!req.body.truckPlate || !req.body.trailer1Plate || !req.body.loadingTime || !req.body.destination || !req.body.tripStatus) {
        return res.status(400).json({ 
          message: "Dados incompletos. Certifique-se de incluir truckPlate, trailer1Plate, loadingTime, destination e tripStatus" 
        });
      }
      
      // Criar a viagem
      const newTrip = await storage.createLineHall(req.body);
      
      console.log("Viagem criada com sucesso:", newTrip);
      return res.status(201).json(newTrip);
    } catch (error) {
      console.error("Erro ao criar viagem:", error);
      return res.status(500).json({ message: "Erro no servidor" });
    }
  });
  
  // Rota para excluir viagem do LineHall
  app.delete("/api/line-hall/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      console.log(`Tentando excluir viagem com ID ${id}...`);
      const deleted = await storage.deleteLineHall(id);
      
      if (!deleted) {
        console.log(`Viagem com ID ${id} não encontrada`);
        return res.status(404).json({ message: "Viagem não encontrada" });
      }
      
      console.log(`Viagem com ID ${id} excluída com sucesso`);
      return res.status(200).json({ message: "Viagem excluída com sucesso" });
    } catch (error) {
      console.error("Erro ao excluir viagem:", error);
      return res.status(500).json({ message: "Erro no servidor" });
    }
  });
  
  // Users routes (admin only)
  app.get("/api/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllBases(); // Isso é um placeholder, precisamos implementar getAllUsers
      return res.status(200).json([{
        id: 1,
        name: "Administrador",
        email: "admin@muricionfleet.com",
        role: "admin"
      }]);
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Dashboard API
  app.get("/api/dashboard/kpis", isAuthenticated, getDashboardKPIs);

  // Admin utility routes
  // Rota específica para limpar os dados do Supabase
  // GET para documentação (sem autenticação)
  app.get('/api/admin/clear-supabase-data', (req, res) => {
    return res.status(200).json({
      message: "Esta API requer uma requisição POST com parâmetro 'confirm' igual a 'LIMPAR'",
      usage: {
        method: "POST",
        contentType: "application/json",
        body: {
          confirm: "LIMPAR", 
          tables: ["lista_opcional_de_tabelas"]
        }
      },
      description: "Esta rota permite limpar dados específicos no Supabase quando a limpeza normal não funciona corretamente"
    });
  });
  
  // Rota específica para limpar apenas a tabela de pneus
  app.post('/api/admin/clear-tires-data', isAdmin, async (req, res) => {
    try {
      console.log("Iniciando limpeza de dados da tabela de pneus...");
      
      // Verificar se temos a confirmação correta
      const { confirm } = req.body;
      if (confirm !== 'LIMPAR') {
        return res.status(400).json({
          message: "Confirmação inválida. Por favor, forneça a confirmação correta para esta operação.",
          success: false
        });
      }
      
      // Resultados das operações
      const resultados = {
        replit: { success: false, message: '', count: 0 },
        supabase: { success: false, message: '', count: 0 }
      };
      
      // 1. Limpar dados no PostgreSQL do Replit (tabela "pneus")
      try {
        console.log("Limpando dados de pneus no PostgreSQL do Replit (tabela 'pneus')...");
        // Buscar todos os pneus utilizando a função getAllTires() que agora trabalha com a tabela "pneus"
        const tires = await storage.getAllTires();
        console.log(`Encontrados ${tires.length} pneus no PostgreSQL do Replit para exclusão`);
        
        let deletedCount = 0;
        for (const tire of tires) {
          await storage.deleteTire(tire.id);
          deletedCount++;
        }
        
        resultados.replit = {
          success: true,
          message: `${deletedCount} pneus excluídos com sucesso do PostgreSQL do Replit`,
          count: deletedCount
        };
        
        console.log(resultados.replit.message);
      } catch (dbError) {
        console.error("Erro ao limpar pneus do PostgreSQL do Replit:", dbError);
        resultados.replit = {
          success: false,
          message: `Erro ao limpar tabela 'pneus': ${dbError}`,
          count: 0
        };
      }
      
      // 2. Limpar dados no Supabase (tabela "pneus")
      try {
        const fetch = await import("node-fetch");
        
        // Garantir que as variáveis de ambiente estão definidas
        const supabaseUrl = process.env.SUPABASE_URL || 'https://hvsmxxqkuyjhpsiojupb.supabase.co';
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MTU3MTIsImV4cCI6MjA2MDM5MTcxMn0.WzPEqHiPiS66yySX8X3H1gq1U8tedXpRSnyk-KzAFTA';
        
        // Verificar e limpar registros na tabela "pneus" 
        console.log("Iniciando limpeza de dados da tabela 'pneus' no Supabase...");
        
        // Primeiro verifica se a tabela existe
        const checkResponse = await fetch.default(
          `${supabaseUrl}/rest/v1/pneus?select=id&limit=1`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            }
          }
        );
        
        if (!checkResponse.ok) {
          console.log("Tabela 'pneus' não encontrada no Supabase, tentando 'tires'...");
          // Verificar se existe tabela "tires" em inglês
          const checkTiresResponse = await fetch.default(
            `${supabaseUrl}/rest/v1/tires?select=id&limit=1`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
              }
            }
          );
          
          if (!checkTiresResponse.ok) {
            throw new Error("Nenhuma tabela de pneus encontrada no Supabase (nem 'pneus' nem 'tires')");
          }
          
          // Se existe "tires", limpar essa tabela
          const tiresResponse = await fetch.default(
            `${supabaseUrl}/rest/v1/tires?select=id`,
            {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Prefer': 'return=minimal'
              }
            }
          );
          
          if (tiresResponse.ok) {
            resultados.supabase = {
              success: true,
              message: "Tabela 'tires' limpa com sucesso no Supabase",
              count: -1 // Não temos como saber quantos foram removidos
            };
            console.log(resultados.supabase.message);
          } else {
            throw new Error(`Falha ao limpar tabela 'tires' no Supabase: ${await tiresResponse.text()}`);
          }
        } else {
          // Limpar a tabela "pneus"
          const response = await fetch.default(
            `${supabaseUrl}/rest/v1/pneus?select=id`,
            {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Prefer': 'return=minimal'
              }
            }
          );
          
          if (response.ok) {
            resultados.supabase = {
              success: true,
              message: "Tabela 'pneus' limpa com sucesso no Supabase (REST API)",
              count: -1 // Não temos como saber quantos foram removidos
            };
            console.log(resultados.supabase.message);
          } else {
            const errorText = await response.text();
            console.error(`Erro ao limpar tabela 'pneus' no Supabase via REST: ${errorText}`);
            
            // Método 2: Limpar registro por registro
            console.log("Tentando abordagem alternativa para tabela 'pneus'...");
            
            // Primeiro busca todos os registros
            const getResponse = await fetch.default(
              `${supabaseUrl}/rest/v1/pneus?select=id`,
              {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`
                }
              }
            );
            
            if (getResponse.ok) {
              // Conversão segura do JSON para o tipo esperado
              const rawData: unknown = await getResponse.json();
              const records: Array<{id: number}> = Array.isArray(rawData) 
                ? rawData.filter((r: any) => r && typeof r.id !== 'undefined').map((r: any) => ({id: r.id}))
                : [];
              console.log(`Encontrados ${records.length} registros na tabela 'pneus' do Supabase`);
              
              // Deleta cada registro individualmente
              let deletedCount = 0;
              if (records.length > 0) {
                for (const record of records) {
                  if (!record || typeof record.id === 'undefined') continue;
                  const deleteResponse = await fetch.default(
                    `${supabaseUrl}/rest/v1/pneus?id=eq.${record.id}`,
                    {
                      method: 'DELETE',
                      headers: {
                        'Content-Type': 'application/json',
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${supabaseKey}`,
                        'Prefer': 'return=minimal'
                      }
                    }
                  );
                  
                  if (deleteResponse.ok) {
                    deletedCount++;
                  } else {
                    console.error(`Erro ao excluir registro id=${record.id} da tabela 'pneus'`);
                  }
                }
                resultados.supabase = {
                  success: true,
                  message: `${deletedCount} registros excluídos com sucesso da tabela 'pneus'`,
                  count: deletedCount
                };
                console.log(resultados.supabase.message);
              } else {
                resultados.supabase = {
                  success: true,
                  message: "Nenhum registro encontrado na tabela 'pneus' para exclusão",
                  count: 0
                };
                console.log(resultados.supabase.message);
              }
            } else {
              throw new Error("Não foi possível buscar registros da tabela 'pneus' no Supabase");
            }
          }
        }
      } catch (supaError) {
        console.error("Erro ao limpar dados de pneus do Supabase:", supaError);
        resultados.supabase = {
          success: false,
          message: `Erro ao limpar tabela de pneus no Supabase: ${supaError}`,
          count: 0
        };
      }
      
      // Combinar resultados para mensagem de retorno
      let mensagem = "";
      if (resultados.replit.success && resultados.supabase.success) {
        mensagem = "Todos os dados de pneus foram limpos com sucesso nos dois bancos de dados";
      } else if (resultados.replit.success) {
        mensagem = "Dados limpos com sucesso no Replit, mas ocorreram problemas no Supabase: " + resultados.supabase.message;
      } else if (resultados.supabase.success) {
        mensagem = "Dados limpos com sucesso no Supabase, mas ocorreram problemas no Replit: " + resultados.replit.message;
      } else {
        mensagem = "Ocorreram problemas ao limpar os dados de pneus em ambos os bancos de dados";
      }
      
      return res.status(200).json({ 
        message: mensagem,
        success: resultados.replit.success || resultados.supabase.success,
        resultados
      });
    } catch (error) {
      console.error("Erro ao limpar dados de pneus:", error);
      return res.status(500).json({ 
        message: "Erro ao limpar dados de pneus", 
        error: String(error),
        success: false
      });
    }
  });

  // POST para executar a limpeza
  app.post('/api/admin/clear-supabase-data', isAdmin, async (req, res) => {
    try {
      const { confirm, tables } = req.body;
      
      if (confirm !== 'LIMPAR') {
        return res.status(400).json({ 
          message: "Confirmação inválida. Para limpar todos os dados, envie { 'confirm': 'LIMPAR' }" 
        });
      }
      
      // Se não foram especificadas tabelas, usar a lista padrão
      const supabaseTables = tables || [
        'abastecimentos_postos',
        'movimentacoes_patio',
        'entradas_combustivel', 
        'status_tanques',
        'controle_tanques',
        'veiculos'
      ];
      
      // Limpar os dados do Supabase
      try {
        const fetch = await import("node-fetch");
        
        // Garantir que as variáveis de ambiente estão definidas
        const supabaseUrl = process.env.SUPABASE_URL || 'https://hvsmxxqkuyjhpsiojupb.supabase.co';
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MTU3MTIsImV4cCI6MjA2MDM5MTcxMn0.WzPEqHiPiS66yySX8X3H1gq1U8tedXpRSnyk-KzAFTA';
        
        console.log("Iniciando limpeza específica de dados do Supabase via backend...");
        console.log(`URL Supabase: ${supabaseUrl}`);
        console.log(`Chave disponível: ${supabaseKey ? 'Sim' : 'Não'}`);
        console.log(`Tabelas para limpar: ${JSON.stringify(supabaseTables)}`);
        
        const resultados: Record<string, any> = {};
        
        // Limpa cada tabela usando REST API
        for (const table of supabaseTables) {
          try {
            console.log(`Limpando dados da tabela Supabase via backend: ${table}`);
            
            // Método 1: Limpar tudo de uma vez
            const response = await fetch.default(
              `${supabaseUrl}/rest/v1/${table}?select=id`,
              {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`,
                  'Prefer': 'return=minimal'
                }
              }
            );
            
            if (response.ok) {
              console.log(`Tabela ${table} limpa com sucesso via backend`);
              resultados[table] = { success: true };
            } else {
              const errorText = await response.text();
              console.error(`Erro ao limpar tabela ${table} via backend: ${errorText}`);
              resultados[table] = { success: false, error: errorText };
              
              // Método 2: Se falhar o bulk delete, tenta registro a registro
              const getResponse = await fetch.default(
                `${supabaseUrl}/rest/v1/${table}?select=id`,
                {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`
                  }
                }
              );
              
              if (getResponse.ok) {
                // Conversão segura do JSON para o tipo esperado
                const rawData: unknown = await getResponse.json();
                const records: Array<{id: number}> = Array.isArray(rawData) 
                  ? rawData.filter((r: any) => r && typeof r.id !== 'undefined').map((r: any) => ({id: r.id}))
                  : [];
                if (records.length > 0) {
                  console.log(`Encontrados ${records.length} registros na tabela ${table} para exclusão individual`);
                  
                  const deleteResults = [];
                  for (const record of records) {
                    if (record && typeof record.id !== 'undefined') {
                      const deleteResponse = await fetch.default(
                        `${supabaseUrl}/rest/v1/${table}?id=eq.${record.id}`,
                        {
                          method: 'DELETE',
                          headers: {
                            'Content-Type': 'application/json',
                            'apikey': supabaseKey,
                            'Authorization': `Bearer ${supabaseKey}`,
                            'Prefer': 'return=minimal'
                          }
                        }
                      );
                      
                      deleteResults.push({
                        id: record.id,
                        success: deleteResponse.ok
                      });
                    }
                  }
                  
                  resultados[table] = { 
                    individualDeletion: true, 
                    results: deleteResults 
                  };
                }
              }
            }
          } catch (err) {
            console.error(`Erro ao processar tabela ${table} via backend: ${err}`);
            resultados[table] = { success: false, error: String(err) };
          }
        }
        
        return res.status(200).json({
          message: "Operação de limpeza do Supabase concluída",
          success: true,
          resultados
        });
      } catch (supaError) {
        console.error("Erro ao limpar dados do Supabase:", supaError);
        return res.status(500).json({
          message: "Erro ao limpar dados do Supabase",
          error: String(supaError),
          success: false
        });
      }
    } catch (error) {
      console.error("Erro na rota de limpeza do Supabase:", error);
      return res.status(500).json({ 
        message: "Erro ao processar solicitação de limpeza", 
        error: String(error),
        success: false
      });
    }
  });
  
  // Rota principal para limpar todos os dados (somente admin)
  app.post("/api/admin/clear-all-data", isAdmin, async (req, res) => {
    try {
      console.log("Iniciando limpeza completa dos dados do sistema");
      
      // Verificar se temos a confirmação correta
      const { confirm } = req.body;
      if (confirm !== 'LIMPAR') {
        return res.status(400).json({
          message: "Confirmação inválida. Por favor, forneça a confirmação correta para esta operação sensível.",
          success: false
        });
      }
      
      // Tabelas em ordem de limpeza (para evitar problemas de chave estrangeira)
      // As tabelas dependentes precisam ser apagadas antes das tabelas que elas referenciam
      // Todas as tabelas agora em português para consistência
      const tables = [
        'manutencao', 'abastecimentos', 'multas', 'pneus', 'linha_corredor', 'veiculos', 'oficinas'
      ];
      
      // Não vamos limpar as bases para evitar problemas com chaves estrangeiras
      // já que usuários têm referências para bases
      
      // Limpar cada tabela em sequência
      for (const table of tables) {
        console.log(`Limpando dados da tabela: ${table}`);
        
        switch (table) {
          case 'manutencao':
            // Buscar todos os registros e excluir um por um
            const maintenances = await storage.getAllMaintenance();
            for (const m of maintenances) {
              await storage.deleteMaintenance(m.id);
            }
            break;
            
          case 'abastecimentos':
            // Buscar todos os registros e excluir um por um
            const refuelings = await storage.getAllRefueling();
            for (const r of refuelings) {
              await storage.deleteRefueling(r.id);
            }
            break;
            
          case 'multas':
            // Buscar todos os registros e excluir um por um
            const fines = await storage.getAllFines();
            for (const f of fines) {
              await storage.deleteFine(f.id);
            }
            break;
            
          case 'pneus':
            // Buscar todos os registros e excluir um por um
            const tires = await storage.getAllTires();
            for (const t of tires) {
              await storage.deleteTire(t.id);
            }
            break;
            
          case 'linha_corredor':
            // Buscar todos os registros e excluir um por um
            const lineHalls = await storage.getAllLineHall();
            for (const lh of lineHalls) {
              await storage.deleteLineHall(lh.id);
            }
            break;
            
          case 'veiculos':
            // Buscar todos os registros e excluir um por um
            const vehicles = await storage.getAllVehicles();
            for (const v of vehicles) {
              await storage.deleteVehicle(v.id);
            }
            break;
            
          case 'oficinas':
            // Buscar todos os registros e excluir um por um
            const workshops = await storage.getAllWorkshops();
            for (const w of workshops) {
              await storage.deleteWorkshop(w.id);
            }
            break;
            
          case 'bases':
            // Não excluir as bases padrão, apenas outras que possam ter sido adicionadas
            const bases = await storage.getAllBases();
            
            for (const b of bases) {
              // Preservar as bases padrão (não excluir)
              if (![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].includes(b.id)) {
                await storage.deleteBase(b.id);
              }
            }
            break;
        }
      }
      
      // Limpar os dados do Supabase também (se disponível)
      try {
        const fetch = await import("node-fetch");
        
        // Garantir que as variáveis de ambiente estão definidas
        const supabaseUrl = process.env.SUPABASE_URL || 'https://hvsmxxqkuyjhpsiojupb.supabase.co';
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c214eHFrdXlqaHBzaW9qdXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MTU3MTIsImV4cCI6MjA2MDM5MTcxMn0.WzPEqHiPiS66yySX8X3H1gq1U8tedXpRSnyk-KzAFTA';
        
        // Lista de tabelas Supabase para limpar
        const supabaseTables = [
          // Tabelas específicas do Supabase
          'abastecimentos_postos',
          'movimentacoes_patio',
          'entradas_combustivel',
          'status_tanques',
          'controle_tanques',
          // Tabelas compartilhadas com o Replit (nomes em português)
          'veiculos',
          'pneus',
          'multas',
          'abastecimentos',
          'manutencao',
          'oficinas',
          'linha_corredor',
          // Possibilidade de tabelas com nomes antigos em inglês
          'vehicles',
          'tires',
          'maintenance',
          'workshops',
          'fines',
          'refueling',
          'line_hall'
        ];
        
        console.log("Iniciando limpeza de dados do Supabase via API REST...");
        console.log(`URL Supabase: ${supabaseUrl}`);
        console.log(`Chave disponível: ${supabaseKey ? 'Sim' : 'Não'}`);
        
        // Duas abordagens para limpar os dados - first try direct REST API
        for (const table of supabaseTables) {
          try {
            console.log(`Tentando limpar dados da tabela Supabase: ${table} via REST API`);
            
            // Método 1: Usar API REST para limpar dados (DELETE sem WHERE = limpar tudo)
            const response = await fetch.default(
              `${supabaseUrl}/rest/v1/${table}?select=id`,
              {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`,
                  'Prefer': 'return=minimal' // Não retorna os registros apagados
                }
              }
            );
            
            if (response.ok) {
              console.log(`✅ Tabela ${table} limpa com sucesso no Supabase (REST API)`);
            } else {
              const errorText = await response.text();
              console.error(`⚠️ Erro ao limpar tabela ${table} no Supabase via REST: ${errorText}`);
              
              // Método 2: Se falhar o primeiro método, tenta limpar registro por registro
              console.log(`Tentando abordagem alternativa para tabela ${table}...`);
              
              // Primeiro busca todos os registros
              const getResponse = await fetch.default(
                `${supabaseUrl}/rest/v1/${table}?select=id`,
                {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`
                  }
                }
              );
              
              if (getResponse.ok) {
                // Conversão segura do JSON para o tipo esperado
                const rawData: unknown = await getResponse.json();
                const records: Array<{id: number}> = Array.isArray(rawData) 
                  ? rawData.filter((r: any) => r && typeof r.id !== 'undefined').map((r: any) => ({id: r.id}))
                  : [];
                console.log(`Encontrados ${records.length} registros na tabela ${table}`);
                
                // Deleta cada registro individualmente
                if (records.length > 0) {
                  for (const record of records) {
                    if (!record || typeof record.id === 'undefined') continue;
                    const deleteResponse = await fetch.default(
                      `${supabaseUrl}/rest/v1/${table}?id=eq.${record.id}`,
                      {
                        method: 'DELETE',
                        headers: {
                          'Content-Type': 'application/json',
                          'apikey': supabaseKey,
                          'Authorization': `Bearer ${supabaseKey}`,
                          'Prefer': 'return=minimal'
                        }
                      }
                    );
                    
                    if (deleteResponse.ok) {
                      console.log(`Registro id=${record.id} excluído com sucesso da tabela ${table}`);
                    } else {
                      console.error(`Erro ao excluir registro id=${record.id} da tabela ${table}`);
                    }
                  }
                }
              } else {
                console.error(`⚠️ Não foi possível buscar registros da tabela ${table}`);
              }
            }
          } catch (err) {
            console.error(`⚠️ Erro ao processar tabela ${table} no Supabase: ${err}`);
          }
        }
      } catch (supaError) {
        console.error("Erro ao limpar dados do Supabase:", supaError);
      }
      
      console.log("Limpeza completa de dados concluída com sucesso");
      return res.status(200).json({ 
        message: "Todos os dados foram limpos com sucesso",
        success: true
      });
    } catch (error) {
      console.error("Erro ao limpar dados:", error);
      return res.status(500).json({ 
        message: "Erro ao limpar dados do sistema", 
        error: String(error),
        success: false
      });
    }
  });

  // Endpoint para obter dados do painel principal
  // Temporariamente sem autenticação para testes
  app.get("/api/painel-principal", getPainelPrincipal);
  
  // Endpoint legado para KPIs do dashboard - manter por compatibilidade
  app.get("/api/dashboard/kpis", isAuthenticated, getDashboardKPIs);

  const httpServer = createServer(app);
  return httpServer;
}
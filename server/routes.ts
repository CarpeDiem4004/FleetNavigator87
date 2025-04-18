import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertBaseSchema, insertVehicleSchema, insertMaintenanceSchema,
  insertWorkshopSchema, insertTireSchema, insertRefuelingSchema, 
  insertFineSchema, insertLineHallSchema, insertUserSchema
} from "@shared/schema";
import { setupAuth } from "./auth";
import { getDashboardKPIs } from "./dashboardApi";

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

export async function registerRoutes(app: Express): Promise<Server> {
  // Configuração do passport para autenticação
  setupAuth(app);
  
  // Base routes
  app.get("/api/bases", isAuthenticated, async (req, res) => {
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
      
      // If user is admin, they can see all vehicles
      // Otherwise, filter by base
      const vehicles = role === 'admin' 
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
      
      // Check if user has access to this vehicle
      if (req.user.role !== 'admin' && vehicle.baseId !== req.user.baseId) {
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
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const result = insertVehicleSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid vehicle data", errors: result.error.format() });
      }
      
      // Check if user can create vehicle for this base
      if (req.user.role !== 'admin' && result.data.baseId !== req.user.baseId) {
        return res.status(403).json({ message: "Cannot create vehicle for different base" });
      }
      
      const newVehicle = await storage.createVehicle(result.data);
      return res.status(201).json(newVehicle);
    } catch (error) {
      console.error("Error creating vehicle:", error);
      return res.status(500).json({ message: "Server error" });
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
      
      // Check if user has access to edit this vehicle
      if (req.user.role !== 'admin' && vehicle.baseId !== req.user.baseId) {
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
      
      // If both baseId and status provided, filter by both
      if (baseId && status) {
        const maintenance = await storage.getMaintenanceByBaseAndStatus(baseId, status);
        return res.status(200).json(maintenance);
      }
      
      // Otherwise get all maintenance records (with role-based filtering)
      const maintenance = await storage.getAllMaintenance();
      
      // Filter by base if not admin and no specific filter provided
      if (req.user.role !== 'admin' && !baseId && req.user.baseId) {
        // For non-admin users, filter to only their base's maintenance records
        const filteredMaintenance = maintenance.filter(m => m.requestBaseId === req.user!.baseId);
        return res.status(200).json(filteredMaintenance);
      }
      
      return res.status(200).json(maintenance);
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

  const httpServer = createServer(app);
  return httpServer;
}
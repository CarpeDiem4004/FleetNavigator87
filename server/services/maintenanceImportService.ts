import XLSX from 'xlsx';
import { storage } from '../storage';

// Classe de erro para autorização
export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

// Função para validar e normalizar placa brasileira
function validateAndNormalizePlate(plate: string | undefined): string | null {
  if (!plate || typeof plate !== 'string') return null;
  
  const cleanPlate = plate.replace(/[-\s]/g, '').toUpperCase().trim();
  
  // Formato antigo: ABC1234 (3 letras + 4 números)
  const oldFormat = /^[A-Z]{3}[0-9]{4}$/;
  
  // Formato Mercosul: ABC1D23 (3 letras + 1 número + 1 letra + 2 números)
  const mercosulFormat = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
  
  if (oldFormat.test(cleanPlate) || mercosulFormat.test(cleanPlate)) {
    return cleanPlate;
  }
  
  return null;
}

interface ImportResult {
  success: boolean;
  updated: number; // Total de atualizações realizadas
  alreadyInMaintenance: number; // Já estavam em manutenção
  notFound: number; // Placas não encontradas
  invalid: number; // Placas inválidas
  total: number; // Total de placas na planilha
  enteredMaintenance: number; // Veículos que entraram em manutenção
  exitedMaintenance: number; // Veículos que saíram de manutenção
  finalStats: {
    totalVehicles: number; // Total de veículos no escopo
    inMaintenance: number; // Veículos em manutenção após importação
    available: number; // Veículos disponíveis (em_operacao) após importação
    stopped: number; // Veículos parados
  };
  errors: Array<{plate: string; reason: string}>;
}

export async function processMaintenanceImport(
  fileBuffer: Buffer,
  filename: string,
  importedBy: string,
  userBaseId?: number | null, // null = admin global (pode acessar todos)
  isAdmin: boolean = false
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    updated: 0,
    alreadyInMaintenance: 0,
    notFound: 0,
    invalid: 0,
    total: 0,
    enteredMaintenance: 0,
    exitedMaintenance: 0,
    finalStats: {
      totalVehicles: 0,
      inMaintenance: 0,
      available: 0,
      stopped: 0
    },
    errors: []
  };

  try {
    // Parse Excel file
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Primeiro, tentar ler COM cabeçalho
    let data = XLSX.utils.sheet_to_json(sheet);
    
    // Verificar se a primeira linha parece ser um cabeçalho válido ou dados
    let hasValidHeader = false;
    let platesInSpreadsheet = new Set<string>();
    
    if (data.length > 0) {
      const firstRow = data[0] as any;
      const columns = Object.keys(firstRow);
      console.log(`[MAINTENANCE-IMPORT] Colunas encontradas na planilha:`, columns);
      
      // Verificar se alguma coluna tem nome relacionado a placa
      const plateColumnNames = ['Placa', 'placa', 'PLACA', 'Placas', 'placas', 'PLACAS', 
                                'plate', 'Plate', 'PLATE', 'Vehicle', 'vehicle', 'VEHICLE', 
                                'Veículo', 'veículo', 'VEICULO'];
      hasValidHeader = columns.some(col => plateColumnNames.includes(col));
      
      if (hasValidHeader) {
        console.log(`[MAINTENANCE-IMPORT] Planilha COM cabeçalho detectada`);
      } else {
        console.log(`[MAINTENANCE-IMPORT] Planilha SEM cabeçalho detectada - processando primeira coluna como placas`);
      }
    }
    
    // Se não tem cabeçalho válido, reprocessar SEM cabeçalho
    if (!hasValidHeader && data.length > 0) {
      data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[];
      console.log(`[MAINTENANCE-IMPORT] Reprocessando ${data.length} linhas sem cabeçalho`);
      
      // Processar primeira coluna como placas
      for (const row of data as any[]) {
        if (Array.isArray(row) && row.length > 0) {
          const rawPlate = row[0]; // Primeira coluna
          const normalizedPlate = validateAndNormalizePlate(rawPlate);
          
          if (normalizedPlate) {
            platesInSpreadsheet.add(normalizedPlate);
          } else if (rawPlate) {
            result.invalid++;
            result.errors.push({
              plate: String(rawPlate),
              reason: 'Formato de placa inválido'
            });
          }
        }
      }
    } else {
      // Processar COM cabeçalho (comportamento original)
      for (const row of data as any[]) {
        const rawPlate = row.Placa || row.placa || row.PLACA || row.Placas || row.placas || 
                         row.PLACAS || row.plate || row.Plate || row.PLATE || row.Vehicle || 
                         row.vehicle || row.VEHICLE || row.Veículo || row.veículo || row.VEICULO;
        
        const normalizedPlate = validateAndNormalizePlate(rawPlate);
        
        if (normalizedPlate) {
          platesInSpreadsheet.add(normalizedPlate);
        } else if (rawPlate) {
          result.invalid++;
          result.errors.push({
            plate: rawPlate,
            reason: 'Formato de placa inválido'
          });
        }
      }
    }

    result.total = platesInSpreadsheet.size;

    console.log(`[MAINTENANCE-IMPORT] Total de placas na planilha: ${platesInSpreadsheet.size}`);
    console.log(`[MAINTENANCE-IMPORT] Escopo - isAdmin: ${isAdmin}, userBaseId: ${userBaseId ?? 'NULL'}`);

    // VALIDAÇÃO DE SEGURANÇA: usuários não-admin DEVEM ter base_id definida
    if (!isAdmin && (userBaseId === null || userBaseId === undefined)) {
      const errorMsg = 'Acesso negado: usuário não possui permissão para importar manutenção sem base definida';
      console.error(`[MAINTENANCE-IMPORT] ERRO DE AUTORIZAÇÃO: ${errorMsg}`);
      throw new AuthorizationError(errorMsg);
    }

    // SINCRONIZAÇÃO BIDIRECIONAL
    // A planilha é a fonte da verdade: veículos NA planilha devem estar em manutenção,
    // veículos FORA da planilha (mas que estão em manutenção) devem voltar para operação.

    // Buscar veículos respeitando o escopo de base do usuário
    let allVehicles;
    if (isAdmin) {
      // Admin global: pode afetar todos os veículos
      allVehicles = await storage.getAllVehicles();
      console.log(`[MAINTENANCE-IMPORT] Admin Global - Total de veículos: ${allVehicles.length}`);
    } else {
      // Usuário de base específica: só pode afetar veículos da sua base
      allVehicles = (await storage.getAllVehicles()).filter(v => v.baseId === userBaseId);
      console.log(`[MAINTENANCE-IMPORT] Base ${userBaseId} - Total de veículos: ${allVehicles.length}`);
    }

    // Separar veículos em categorias
    const vehiclesInSpreadsheet: typeof allVehicles = [];
    const vehiclesInMaintenanceNotInSpreadsheet: typeof allVehicles = [];

    for (const vehicle of allVehicles) {
      const isInSpreadsheet = platesInSpreadsheet.has(vehicle.plate);
      
      if (isInSpreadsheet) {
        vehiclesInSpreadsheet.push(vehicle);
      } else if (vehicle.status === 'em_manutencao') {
        // Veículo em manutenção MAS não está na planilha → deve voltar para operação
        vehiclesInMaintenanceNotInSpreadsheet.push(vehicle);
      }
    }

    console.log(`[MAINTENANCE-IMPORT] Veículos na planilha: ${vehiclesInSpreadsheet.length}`);
    console.log(`[MAINTENANCE-IMPORT] Veículos em manutenção não na planilha: ${vehiclesInMaintenanceNotInSpreadsheet.length}`);

    // 1. ENTRAR EM MANUTENÇÃO: Veículos na planilha que NÃO estão em manutenção
    for (const vehicle of vehiclesInSpreadsheet) {
      try {
        if (vehicle.status === 'em_manutencao') {
          result.alreadyInMaintenance++;
          console.log(`[MAINTENANCE-IMPORT] ${vehicle.plate} já está em manutenção`);
        } else {
          // Mudar para manutenção
          await storage.updateVehicleStatus(vehicle.id, 'em_manutencao');
          result.enteredMaintenance++;
          result.updated++;
          console.log(`[MAINTENANCE-IMPORT] ${vehicle.plate} entrou em manutenção (${vehicle.status} → em_manutencao)`);
        }
      } catch (error) {
        console.error(`[MAINTENANCE-IMPORT] Erro ao processar placa ${vehicle.plate}:`, error);
        result.errors.push({
          plate: vehicle.plate,
          reason: error instanceof Error ? error.message : 'Erro ao atualizar status'
        });
      }
    }

    // 2. SAIR DE MANUTENÇÃO: Veículos em manutenção que NÃO estão na planilha
    for (const vehicle of vehiclesInMaintenanceNotInSpreadsheet) {
      try {
        // Voltar para operação
        await storage.updateVehicleStatus(vehicle.id, 'em_operacao');
        result.exitedMaintenance++;
        result.updated++;
        console.log(`[MAINTENANCE-IMPORT] ${vehicle.plate} saiu de manutenção (em_manutencao → em_operacao)`);
      } catch (error) {
        console.error(`[MAINTENANCE-IMPORT] Erro ao processar placa ${vehicle.plate}:`, error);
        result.errors.push({
          plate: vehicle.plate,
          reason: error instanceof Error ? error.message : 'Erro ao atualizar status'
        });
      }
    }

    // 3. VERIFICAR PLACAS NA PLANILHA QUE NÃO EXISTEM NO SISTEMA
    const vehiclePlatesInSystem = new Set(allVehicles.map(v => v.plate));
    for (const plate of Array.from(platesInSpreadsheet)) {
      if (!vehiclePlatesInSystem.has(plate)) {
        result.notFound++;
        result.errors.push({
          plate,
          reason: 'Veículo não encontrado no sistema'
        });
      }
    }

    // Registrar auditoria
    await storage.createMaintenanceImport({
      importedBy,
      filename,
      affectedVehiclesCount: result.updated,
      importedAt: new Date(),
      createdAt: new Date()
    });

    // Buscar estatísticas finais dos veículos no escopo
    const finalVehicles = await storage.getAllVehicles();
    const scopedFinalVehicles = isAdmin 
      ? finalVehicles 
      : finalVehicles.filter(v => v.baseId === userBaseId);
    
    result.finalStats = {
      totalVehicles: scopedFinalVehicles.length,
      inMaintenance: scopedFinalVehicles.filter(v => v.status === 'em_manutencao').length,
      available: scopedFinalVehicles.filter(v => v.status === 'em_operacao').length,
      stopped: scopedFinalVehicles.filter(v => v.status === 'parado').length
    };

    console.log(`[MAINTENANCE-IMPORT] Resumo final:`, {
      total: result.total,
      enteredMaintenance: result.enteredMaintenance,
      exitedMaintenance: result.exitedMaintenance,
      alreadyInMaintenance: result.alreadyInMaintenance,
      notFound: result.notFound,
      invalid: result.invalid,
      updated: result.updated,
      finalStats: result.finalStats
    });

    result.success = true;
    return result;
  } catch (error) {
    console.error('[MAINTENANCE-IMPORT] Erro ao processar importação:', error);
    throw error;
  }
}

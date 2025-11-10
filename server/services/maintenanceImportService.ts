import XLSX from 'xlsx';
import { storage } from '../storage';

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
  updated: number;
  alreadyInMaintenance: number;
  notFound: number;
  invalid: number;
  total: number;
  errors: Array<{plate: string; reason: string}>;
}

export async function processMaintenanceImport(
  fileBuffer: Buffer,
  filename: string,
  importedBy: string
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    updated: 0,
    alreadyInMaintenance: 0,
    notFound: 0,
    invalid: 0,
    total: 0,
    errors: []
  };

  try {
    // Parse Excel file
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    // Extrair e validar placas
    const plates = new Set<string>();
    
    for (const row of data as any[]) {
      const rawPlate = row.Placa || row.placa || row.PLACA;
      const normalizedPlate = validateAndNormalizePlate(rawPlate);
      
      if (normalizedPlate) {
        plates.add(normalizedPlate);
      } else if (rawPlate) {
        result.invalid++;
        result.errors.push({
          plate: rawPlate,
          reason: 'Formato de placa inválido'
        });
      }
    }

    result.total = plates.size;

    // Processar cada placa
    for (const plate of Array.from(plates)) {
      try {
        // Buscar veículo no banco
        const vehicle = await storage.getVehicleByPlate(plate);
        
        if (!vehicle) {
          result.notFound++;
          result.errors.push({
            plate,
            reason: 'Veículo não encontrado no sistema'
          });
          continue;
        }

        // Verificar se já está em manutenção
        if (vehicle.status === 'em_manutencao') {
          result.alreadyInMaintenance++;
          continue;
        }

        // Atualizar status para em_manutencao
        await storage.updateVehicleStatus(vehicle.id, 'em_manutencao');
        result.updated++;
      } catch (error) {
        console.error(`Erro ao processar placa ${plate}:`, error);
        result.errors.push({
          plate,
          reason: error instanceof Error ? error.message : 'Erro desconhecido'
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

    result.success = true;
    return result;
  } catch (error) {
    console.error('Erro ao processar importação:', error);
    throw error;
  }
}

import { Base } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface BasesConfig {
  [key: string]: {
    hasMaintenance?: boolean;
    hasTires?: boolean;
  };
}

export function parseBasesData(data: string): Partial<Base>[] {
  // Implementação para analisar dados de bases em formato de texto
  const lines = data.trim().split('\n');
  const bases: Partial<Base>[] = [];
  
  // Configuração personalizada para bases específicas
  const basesConfig: BasesConfig = {
    "FMS09 SÃO PAULO": { hasMaintenance: true, hasTires: true },
    "GP01 VARGEM GRANDE": { hasMaintenance: true, hasTires: true },
    "GP02 JACAREI": { hasMaintenance: true, hasTires: true },
    "GP03 HORTOLANDIA": { hasMaintenance: true, hasTires: true },
    "LHM08": { hasMaintenance: true, hasTires: true },
    "LHM09": { hasMaintenance: true, hasTires: true },
    "LHM11": { hasMaintenance: true, hasTires: true },
    "LHM13": { hasMaintenance: true, hasTires: true },
    "LHS2": { hasMaintenance: true, hasTires: true },
    "MM01": { hasMaintenance: true, hasTires: true },
    "MM03": { hasMaintenance: true, hasTires: true },
    "MM04": { hasMaintenance: true, hasTires: true },
    "NAT02": { hasMaintenance: true, hasTires: true },
    "OXXO1": { hasMaintenance: true, hasTires: true },
    "PTL01 BELEM": { hasMaintenance: true, hasTires: true },
    "PTL02 JUNDIA": { hasMaintenance: true, hasTires: true },
  };
  
  // Todas as bases com SC são configuradas automaticamente com manutenção e pneus
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine) {
      // Possíveis formatos:
      // 1. Nome da Base
      // 2. Nome da Base (Local)
      // 3. Nome da Base - Operação
      // 4. Nome da Base (Local) - Operação
      
      let name = trimmedLine;
      let location = '';
      let operation = '';
      
      // Verificar se há informação de local entre parênteses
      const locationMatch = trimmedLine.match(/^(.*?)\s*\((.*?)\)(.*)$/);
      if (locationMatch) {
        name = locationMatch[1].trim();
        location = locationMatch[2].trim();
        
        // Se houver algo após o parêntese, pode ser a operação
        if (locationMatch[3]) {
          const opMatch = locationMatch[3].match(/^\s*-\s*(.*)$/);
          if (opMatch) {
            operation = opMatch[1].trim();
          }
        }
      } else {
        // Verificar se há informação de operação após hífen
        const opMatch = trimmedLine.match(/^(.*?)\s*-\s*(.*)$/);
        if (opMatch) {
          name = opMatch[1].trim();
          operation = opMatch[2].trim();
        }
      }
      
      // Adicionar base apenas se houver um nome válido
      if (name) {
        // Determinar se a base tem solicitação de manutenção e pneus habilitada
        let hasMaintenance = false;
        let hasTires = false;
        
        // Verificar configuração específica da base
        const baseConfig = Object.entries(basesConfig).find(([key]) => name.includes(key));
        if (baseConfig) {
          hasMaintenance = baseConfig[1].hasMaintenance || false;
          hasTires = baseConfig[1].hasTires || false;
        } else if (name.includes("SC")) {
          // Todas as bases SC têm manutenção e pneus habilitados
          hasMaintenance = true;
          hasTires = true;
        }
        
        bases.push({
          name,
          location: location || undefined,
          operation: operation || undefined,
          active: true,
          hasMaintenance,
          hasTires
        });
      }
    }
  }
  
  return bases;
}

export async function importBasesToSystem(bases: Partial<Base>[]): Promise<number> {
  let importedCount = 0;
  
  for (const base of bases) {
    try {
      await apiRequest('POST', '/api/bases', base);
      importedCount++;
    } catch (error) {
      console.error(`Erro ao importar base ${base.name}:`, error);
    }
  }
  
  return importedCount;
}
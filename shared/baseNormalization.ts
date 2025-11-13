/**
 * Funções de normalização de nomes de bases
 * Compartilhadas entre frontend e backend para garantir consistência
 */

/**
 * Normaliza um nome de base para o formato canônico (KEY_FORMAT)
 * Remove acentos, parênteses, converte para uppercase e usa underscores
 * Exemplos:
 * - "PTL02 JUNDIAÍ (PETLOVE)" -> "PTL02_JUNDIA_PETLOVE"
 * - "SC (CHAPECÓ) SSC4" -> "SC_CHAPECO_SSC4"
 * - "GP02 JACAREI (GRUPO PEREIRA)" -> "GP02_JACAREI"
 */
export function normalizeBaseName(rawName: string | null | undefined): string {
  if (!rawName) return '';
  
  let normalized = rawName;
  
  normalized = normalized
    .toUpperCase()
    .replace(/[()]/g, '')
    .replace(/Á/g, 'A').replace(/À/g, 'A').replace(/Ã/g, 'A').replace(/Â/g, 'A')
    .replace(/É/g, 'E').replace(/È/g, 'E').replace(/Ê/g, 'E')
    .replace(/Í/g, 'I').replace(/Ì/g, 'I').replace(/Î/g, 'I')
    .replace(/Ó/g, 'O').replace(/Ò/g, 'O').replace(/Õ/g, 'O').replace(/Ô/g, 'O')
    .replace(/Ú/g, 'U').replace(/Ù/g, 'U').replace(/Û/g, 'U')
    .replace(/Ç/g, 'C')
    .replace(/\s+/g, '_')
    .replace(/[-/]/g, '_')
    .replace(/_+/g, '_')
    .trim()
    .replace(/^_|_$/g, '');
  
  const knownAliases: Record<string, string> = {
    'PTL02_JUNDIA_PETLOVE': 'PTL02_JUNDIA_PETLOVE',
    'PTL02_JUNDIA': 'PTL02_JUNDIA_PETLOVE',
    'PTL01_BELEM_PETLOVE': 'PTL01_BELEM_PETLOVE',
    'PTL01_BELEM': 'PTL01_BELEM_PETLOVE',
    'GP02_JACAREI_GRUPO_PEREIRA': 'GP02_JACAREI',
    'GP02_JACAREI': 'GP02_JACAREI',
    'GP03_HORTOLANDIA_GRUPO_PEREIRA': 'GP03_HORTOLANDIA',
    'GP03_HORTOLANDIA': 'GP03_HORTOLANDIA',
    'GP01_VARGEM_GRANDE_GRUPO_PEREIRA': 'GP01_VARGEM_GRANDE',
    'GP01_VARGEM_GRANDE': 'GP01_VARGEM_GRANDE',
    'SC_CHAPECO_SSC4': 'SC_CHAPECO_SSC4',
    'SC_ARACATUBA_SSP10': 'SC_ARACATUBA_SSP10',
    'SC_ATIBAIA_SSP25': 'SC_ATIBAIA_SSP25',
    'SC_AVARE_SSP24': 'SC_AVARE_SSP24',
    'SC_BAHIA_SALVADOR_SBA1': 'SC_BAHIA_SALVADOR_SBA1',
    'SC_BAURU_SSP14': 'SC_BAURU_SSP14',
    'SC_BLUMENAU_SSC3': 'SC_BLUMENAU_SSC3',
    'SC_CONTAGEM_SMG1': 'SC_CONTAGEM_SMG1',
    'SC_CURITIBA_SPR1': 'SC_CURITIBA_SPR1',
    'SC_DIVINOPOLIS_SMG10': 'SC_DIVINOPOLIS_SMG10',
    'SC_FORTALEZA_SCE1': 'SC_FORTALEZA_SCE1',
    'SC_ITUPEVA_SSP38_SDD': 'SC_ITUPEVA_SSP38_SDD',
    'SC_ITUPEVA_SSP38SDD': 'SC_ITUPEVA_SSP38_SDD',
    'SC_CRICIUMA_SSC5_SDD': 'SC_CRICIUMA_SSC5_SDD',
    'SC_CRICIUMA_SSC5SDD': 'SC_CRICIUMA_SSC5_SDD',
    'SC_LAJEADO_SRS10_SDD': 'SC_LAJEADO_SRS10_SDD',
    'SC_LAJEADO_SRS10SDD': 'SC_LAJEADO_SRS10_SDD',
    'SC_PONTA_GROSSA_SPR7': 'SC_PONTA_GROSSA_SPR7',
    'SC_POCOS_DE_CALDAS_SMG5': 'SC_POCOS_DE_CALDAS_SMG5',
    'XPT_CHAPADINHA_EMN3_SMN1': 'XPT_CHAPADINHA_EMN3_SMN1',
    'XPT_CHAPADINHA_EMN3SMN1': 'XPT_CHAPADINHA_EMN3_SMN1',
    'XPT_SAO_MATEUS_DO_SUL_ERP6_SPR7': 'XPT_SAO_MATEUS_DO_SUL_ERP6_SPR7',
    'XPT_SAO_MATEUS_DO_SUL_ERP6SPR7': 'XPT_SAO_MATEUS_DO_SUL_ERP6_SPR7',
    'XPT_3_LAGOAS_SSP10_EMS4': 'XPT_3_LAGOAS_SSP10_EMS4',
    'XPT_3_LAGOAS_SSP10EMS4': 'XPT_3_LAGOAS_SSP10_EMS4',
    'XPT_AMERICANOPOLIS_ESP12_SSP17': 'XPT_AMERICANOPOLIS_ESP12_SSP17',
    'XPT_AMERICANOPOLIS_ESP12SSP17': 'XPT_AMERICANOPOLIS_ESP12_SSP17',
    'XPT_ANAPOLIS_SGO1_EGO4': 'XPT_ANAPOLIS_SGO1_EGO4',
    'XPT_ANAPOLIS_SGO1EGO4': 'XPT_ANAPOLIS_SGO1_EGO4',
    'XPT_BOM_JESUS_DA_LAPA_SBA7_EBA18': 'XPT_BOM_JESUS_DA_LAPA_SBA7_EBA18',
    'XPT_BOM_JESUS_DA_LAPA_SBA7EBA18': 'XPT_BOM_JESUS_DA_LAPA_SBA7_EBA18',
    'XPT_FRANCISCO_BELTRAO_EPR9_SPR4': 'XPT_FRANCISCO_BELTRAO_EPR9_SPR4',
    'XPT_FRANCISCO_BELTRAO_EPR9SPR4': 'XPT_FRANCISCO_BELTRAO_EPR9_SPR4',
    'XPT_FRANCISCO_BELTRAO_ERP9_SPR4': 'XPT_FRANCISCO_BELTRAO_EPR9_SPR4',
    'XPT_FRANCISCO_BELTRAO_ERP9SPR4': 'XPT_FRANCISCO_BELTRAO_EPR9_SPR4',
    'XPT_TRES_LAGOAS_EM54_SSP10': 'XPT_3_LAGOAS_SSP10_EMS4',
    'XPT_TRES_LAGOAS_EM54SSP10': 'XPT_3_LAGOAS_SSP10_EMS4',
    'XPT_AMERICANA_POLIS_ESP12_SSP17': 'XPT_AMERICANOPOLIS_ESP12_SSP17',
    'XPT_AMERICANA_POLIS_ESP12SSP17': 'XPT_AMERICANOPOLIS_ESP12_SSP17',
    'OXXO1_CAJAMAR': 'OXXO_CAJAMAR',
  };
  
  return knownAliases[normalized] || normalized;
}

/**
 * Obtém o nome de exibição amigável para uma base
 * Converte o formato canônico de volta para visualização
 * Exemplo: "PTL02_JUNDIA_PETLOVE" -> "PTL02 Jundiaí (Petlove)"
 */
export function getBaseDisplayName(baseKey: string | null | undefined): string {
  if (!baseKey) return '';
  
  // Se não tiver underscore, retorna como está (já é nome original)
  if (!baseKey.includes('_')) {
    return baseKey;
  }
  
  // Dicionário com acentuação correta para nomes comuns
  const accentMap: Record<string, string> = {
    'JUNDIA': 'Jundiaí',
    'BELEM': 'Belém',
    'JACAREI': 'Jacareí',
    'HORTOLANDIA': 'Hortolândia',
    'CHAPECO': 'Chapecó',
    'ARACATUBA': 'Araçatuba',
    'AVARE': 'Avaré',
    'DIVINOPOLIS': 'Divinópolis',
    'GOIANIA': 'Goiânia',
    'MARILIA': 'Marília',
    'MARINGA': 'Maringá',
    'RIBEIRAO': 'Ribeirão',
    'SAO': 'São',
    'JOSE': 'José',
    'CARLOS': 'Carlos',
    'POCOS': 'Poços',
    'CUIABA': 'Cuiabá',
    'FLORIANOPOLIS': 'Florianópolis',
    'CRICIUMA': 'Criciúma',
    'VITORIA': 'Vitória',
    'ANAPOLIS': 'Anápolis',
    'BRASILIA': 'Brasília',
    'NITEROI': 'Niterói',
    'PETROPOLIS': 'Petrópolis',
    'IJUI': 'Ijuí',
    'TRES': 'Três',
    'VICOSA': 'Viçosa'
  };
  
  // Separar em partes
  const parts = baseKey.split('_');
  
  // Lista de códigos de base conhecidos (apenas letras)
  const knownLetterCodes = new Set([
    'SDD', 'SSP', 'SPR', 'SSC', 'SMG', 'SMS', 'SBA', 'SCE', 'SAM', 'SPE', 'SES',
    'SRS', 'SDF', 'SDP', 'SRJ', 'SMN', 'SMR', 'ERP', 'EPR', 'EMN', 'EMR', 'EMS',
    'ESP', 'EGO', 'EBA', 'ERS', 'EMG', 'SPSP5', 'FULL'
  ]);
  
  // Função para identificar tipo de cada parte
  const getPartType = (part: string): 'code_with_number' | 'prefix' | 'city' | 'word' => {
    // Códigos com números e possível sufixo de letras (SSP10, SPR1, SSP38SDD, etc) - vão para parênteses
    if (/^[A-Z]{2,4}\d+[A-Z]*$/.test(part)) return 'code_with_number';
    
    // Códigos conhecidos apenas com letras (SDD, SPR, etc) - vão para parênteses
    if (knownLetterCodes.has(part)) return 'code_with_number';
    
    // Prefixos conhecidos (XPT, SC, GP, PTL, MM, etc) - mantém maiúsculo
    if (/^(XPT|SC|GP|PTL|MM|FMS|PB|MI|LH|OXXO|CC)0?\d*$/.test(part)) return 'prefix';
    
    // Cidades no mapa de acentos
    if (accentMap[part]) return 'city';
    
    // Outras palavras
    return 'word';
  };
  
  // Formatar cada parte
  const formatted = parts.map(part => {
    const type = getPartType(part);
    
    if (type === 'code_with_number') {
      return { text: part, type: 'code_with_number' };
    } else if (type === 'prefix') {
      return { text: part, type: 'prefix' };
    } else if (type === 'city') {
      return { text: accentMap[part], type: 'city' };
    } else {
      // Capitalizar: primeira letra maiúscula, resto minúscula
      const capitalized = part.charAt(0) + part.slice(1).toLowerCase();
      return { text: capitalized, type: 'word' };
    }
  });
  
  // Encontrar códigos consecutivos no final (apenas code_with_number)
  let codeStartIndex = formatted.length;
  for (let i = formatted.length - 1; i >= 0; i--) {
    if (formatted[i].type === 'code_with_number') {
      codeStartIndex = i;
    } else {
      break;
    }
  }
  
  // Separar nome e códigos
  const nameParts = formatted.slice(0, codeStartIndex).map(f => f.text);
  const codeParts = formatted.slice(codeStartIndex).map(f => f.text);
  
  // Montar resultado
  if (codeParts.length > 0) {
    return nameParts.join(' ') + ' (' + codeParts.join('/') + ')';
  } else {
    return formatted.map(f => f.text).join(' ');
  }
}

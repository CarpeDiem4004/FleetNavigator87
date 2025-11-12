/**
 * Remove aspas e parênteses dos nomes de bases (mantém o conteúdo)
 * Exemplos:
 * - "SC (ARACATUBA) SSP10" -> SC ARACATUBA SSP10
 * - 'Base (CODE) Name' -> Base CODE Name
 * - Base Normal -> Base Normal
 */
export function cleanBaseName(name: string | null | undefined): string {
  if (!name) return '';
  return name
    .replace(/^["']|["']$/g, '')
    .replace(/[()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Limpa uma lista de nomes de bases
 */
export function cleanBaseNames(names: string[]): string[] {
  return names.map(cleanBaseName).filter(name => name !== '');
}

/**
 * Limpa objetos com propriedade base_name
 */
export function cleanBaseObjects<T extends { base_name?: string }>(objects: T[]): T[] {
  return objects.map(obj => ({
    ...obj,
    base_name: obj.base_name ? cleanBaseName(obj.base_name) : obj.base_name
  }));
}

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
    'SC_ITUPEVA_SSP38_SDD': 'SC_ITUPEVA_SSP38SDD',
    'SC_PONTA_GROSSA_SPR7': 'SC_PONTA_GROSSA_SPR7',
    'SC_POCOS_DE_CALDAS_SMG5': 'SC_POCOS_DE_CALDAS_SMG5',
    'XPT_CHAPADINHA_EMN3_SMN1': 'XPT_CHAPADINHA_EMN3_SMN1',
    'XPT_SAO_MATEUS_DO_SUL_ERP6_SPR7': 'XPT_SAO_MATEUS_DO_SUL_ERP6_SPR7',
    'XPT_3_LAGOAS_SSP10_EMS4': 'XPT_3_LAGOAS_SSP10_EMS4',
    'XPT_ANAPOLIS_SGO1_EGO4': 'XPT_ANAPOLIS_SGO1_EGO4',
  };
  
  return knownAliases[normalized] || normalized;
}

/**
 * Obtém o nome de exibição amigável para uma base
 * Converte o formato canônico de volta para visualização
 * Exemplo: "PTL02_JUNDIA_PETLOVE" -> "PTL02 JUNDIAÍ (PETLOVE)"
 */
export function getBaseDisplayName(baseKey: string | null | undefined): string {
  if (!baseKey) return '';
  
  const displayNames: Record<string, string> = {
    'PTL02_JUNDIA_PETLOVE': 'PTL02 JUNDIAÍ (PETLOVE)',
    'PTL01_BELEM_PETLOVE': 'PTL01 BELÉM (PETLOVE)',
    'GP02_JACAREI': 'GP02 JACAREÍ',
    'GP03_HORTOLANDIA': 'GP03 HORTOLÂNDIA',
    'GP01_VARGEM_GRANDE': 'GP01 VARGEM GRANDE',
    'SC_CHAPECO_SSC4': 'SC CHAPECÓ (SSC4)',
    'SC_ARACATUBA_SSP10': 'SC ARAÇATUBA (SSP10)',
    'SC_ATIBAIA_SSP25': 'SC ATIBAIA (SSP25)',
    'SC_AVARE_SSP24': 'SC AVARÉ (SSP24)',
    'SC_BAHIA_SALVADOR_SBA1': 'SC BAHIA SALVADOR (SBA1)',
    'SC_BAURU_SSP14': 'SC BAURU (SSP14)',
    'SC_BLUMENAU_SSC3': 'SC BLUMENAU (SSC3)',
    'SC_CONTAGEM_SMG1': 'SC CONTAGEM (SMG1)',
    'SC_CURITIBA_SPR1': 'SC CURITIBA (SPR1)',
    'SC_DIVINOPOLIS_SMG10': 'SC DIVINÓPOLIS (SMG10)',
    'SC_FORTALEZA_SCE1': 'SC FORTALEZA (SCE1)',
    'SC_ITUPEVA_SSP38SDD': 'SC ITUPEVA (SSP38-SDD)',
    'SC_PONTA_GROSSA_SPR7': 'SC PONTA GROSSA (SPR7)',
    'SC_POCOS_DE_CALDAS_SMG5': 'SC POÇOS DE CALDAS (SMG5)',
    'XPT_CHAPADINHA_EMN3_SMN1': 'XPT CHAPADINHA (EMN3/SMN1)',
    'XPT_SAO_MATEUS_DO_SUL_ERP6_SPR7': 'XPT SÃO MATEUS DO SUL (ERP6/SPR7)',
    'XPT_3_LAGOAS_SSP10_EMS4': 'XPT 3 LAGOAS (SSP10/EMS4)',
    'XPT_ANAPOLIS_SGO1_EGO4': 'XPT ANÁPOLIS (SGO1/EGO4)',
  };
  
  return displayNames[baseKey] || baseKey.replace(/_/g, ' ');
}

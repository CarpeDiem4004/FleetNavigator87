/**
 * Remove aspas e parênteses dos nomes de bases
 * Exemplos:
 * - "SC (ARACATUBA) SSP10" -> SC SSP10
 * - 'Base (CODE) Name' -> Base Name
 * - Base Normal -> Base Normal
 */
export function cleanBaseName(name: string | null | undefined): string {
  if (!name) return '';
  // Remove aspas do início e fim, depois remove parênteses e seu conteúdo
  return name
    .replace(/^["']|["']$/g, '')  // Remove aspas
    .replace(/\s*\([^)]*\)\s*/g, ' ')  // Remove parênteses e conteúdo
    .replace(/\s+/g, ' ')  // Normaliza espaços múltiplos
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

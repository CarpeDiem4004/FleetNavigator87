/**
 * Remove aspas do início e fim de nomes de bases
 * Exemplos:
 * - "SC (ARACATUBA) SSP10" -> SC (ARACATUBA) SSP10
 * - 'Base Name' -> Base Name
 * - Base Normal -> Base Normal
 */
export function cleanBaseName(name: string | null | undefined): string {
  if (!name) return '';
  return name.replace(/^["']|["']$/g, '').trim();
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

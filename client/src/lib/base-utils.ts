import { normalizeBaseName, getBaseDisplayName } from '@shared/baseNormalization';

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

export { normalizeBaseName, getBaseDisplayName };

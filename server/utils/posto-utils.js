/**
 * Utilitários para manipulação de nomes de postos
 */

/**
 * Formata o nome do posto para um formato padronizado
 * Aceita variações como "campinas v2", "Campinas_v2", "campinas_v2", etc.
 * e retorna no formato padronizado, por exemplo "Campinas_v2"
 * 
 * @param {string} postoName - O nome do posto a ser formatado
 * @returns {string} - O nome do posto formatado
 */
export function formatPostoName(postoName) {
  if (!postoName) return '';
  
  // Remover espaços extras e converter para minúsculas para comparação
  const normalizedName = postoName.trim().toLowerCase();
  
  // Se o nome contiver "v2", garantir que esteja no formato padrão
  if (normalizedName.includes('v2')) {
    // Obter a parte base do nome (antes do v2)
    const baseName = normalizedName.split(/[_\s]+v2/)[0].trim();
    
    // Capitalizar a primeira letra
    const capitalized = baseName.charAt(0).toUpperCase() + baseName.slice(1);
    
    // Retornar no formato padronizado
    return `${capitalized}_v2`;
  }
  
  // Para outros casos, apenas capitalizar a primeira letra
  return normalizedName.charAt(0).toUpperCase() + normalizedName.slice(1);
}
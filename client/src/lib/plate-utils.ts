// Utilitários para validação e formatação de placas de veículos
// Suporte para placas antigas (ABC1234) e Mercosul (ABC1D23)

export interface PlateValidationResult {
  isValid: boolean;
  type: 'antiga' | 'mercosul' | 'invalid';
  formatted: string;
  original: string;
}

/**
 * Valida se uma placa está no formato antigo (ABC1234)
 */
export function isOldFormatPlate(plate: string): boolean {
  const oldFormatRegex = /^[A-Z]{3}[0-9]{4}$/;
  return oldFormatRegex.test(plate.replace(/[-\s]/g, ''));
}

/**
 * Valida se uma placa está no formato Mercosul (ABC1D23)
 */
export function isMercosulPlate(plate: string): boolean {
  const mercosulRegex = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
  return mercosulRegex.test(plate.replace(/[-\s]/g, ''));
}

/**
 * Formata uma placa adicionando o hífen no local correto
 */
export function formatPlate(plate: string): string {
  const cleanPlate = plate.replace(/[-\s]/g, '').toUpperCase();
  
  if (isOldFormatPlate(cleanPlate)) {
    // Formato antigo: ABC-1234
    return `${cleanPlate.slice(0, 3)}-${cleanPlate.slice(3)}`;
  } else if (isMercosulPlate(cleanPlate)) {
    // Formato Mercosul: ABC1D23
    return cleanPlate;
  }
  
  return cleanPlate;
}

/**
 * Valida e formata uma placa de veículo
 */
export function validateAndFormatPlate(input: string): PlateValidationResult {
  const cleanInput = input.replace(/[-\s]/g, '').toUpperCase();
  
  if (isOldFormatPlate(cleanInput)) {
    return {
      isValid: true,
      type: 'antiga',
      formatted: `${cleanInput.slice(0, 3)}-${cleanInput.slice(3)}`,
      original: input
    };
  }
  
  if (isMercosulPlate(cleanInput)) {
    return {
      isValid: true,
      type: 'mercosul',
      formatted: cleanInput,
      original: input
    };
  }
  
  return {
    isValid: false,
    type: 'invalid',
    formatted: cleanInput,
    original: input
  };
}

/**
 * Máscara de input para placa que suporta ambos os formatos
 */
export function applyPlateMask(value: string): string {
  const cleanValue = value.replace(/[-\s]/g, '').toUpperCase();
  
  if (cleanValue.length === 0) {
    return '';
  }
  
  // Limitação de caracteres
  if (cleanValue.length > 7) {
    return cleanValue.slice(0, 7);
  }
  
  // Se tem 7 caracteres, tenta identificar o formato
  if (cleanValue.length === 7) {
    const validation = validateAndFormatPlate(cleanValue);
    return validation.formatted;
  }
  
  // Durante a digitação, aplica formatação parcial para formato antigo
  if (cleanValue.length > 3 && cleanValue.length <= 7) {
    const letters = cleanValue.slice(0, 3);
    const numbers = cleanValue.slice(3);
    
    // Verifica se está seguindo o padrão antigo (3 letras + números)
    if (/^[A-Z]{3}$/.test(letters) && /^[0-9]+$/.test(numbers)) {
      return `${letters}-${numbers}`;
    }
  }
  
  return cleanValue;
}

/**
 * Obtém dicas de formato para o usuário
 */
export function getPlateFormatHint(input: string): string {
  const cleanInput = input.replace(/[-\s]/g, '').toUpperCase();
  
  if (cleanInput.length === 0) {
    return 'Digite 3 letras seguidas de 4 números (ABC1234) ou formato Mercosul (ABC1D23)';
  }
  
  if (cleanInput.length <= 3) {
    return 'Continue digitando as letras...';
  }
  
  if (cleanInput.length === 4) {
    const letters = cleanInput.slice(0, 3);
    const fourthChar = cleanInput.slice(3, 4);
    
    if (/^[A-Z]{3}$/.test(letters)) {
      if (/^[0-9]$/.test(fourthChar)) {
        return 'Continue: pode ser formato antigo (mais 3 números) ou Mercosul (1 letra + 2 números)';
      } else if (/^[A-Z]$/.test(fourthChar)) {
        return 'Formato Mercosul detectado - digite 2 números para finalizar';
      }
    }
  }
  
  const validation = validateAndFormatPlate(cleanInput);
  if (validation.isValid) {
    return `Placa válida - Formato ${validation.type}`;
  }
  
  return 'Formato inválido. Use ABC1234 (antigo) ou ABC1D23 (Mercosul)';
}
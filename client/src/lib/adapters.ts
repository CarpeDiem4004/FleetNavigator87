/**
 * Funções utilitárias para converter entre formatos camelCase e snake_case
 * Isso é útil para a comunicação entre frontend e backend
 */

// Converter de snake_case para camelCase
export function snakeToCamel(str: string): string {
  return str.replace(/([-_][a-z])/g, (group) =>
    group.toUpperCase().replace('-', '').replace('_', '')
  );
}

// Converter de camelCase para snake_case
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

// Converter objeto com keys em snake_case para camelCase
export function snakeToCamelObject<T = any>(obj: Record<string, any>): T {
  if (typeof obj !== 'object' || obj === null) {
    return obj as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(snakeToCamelObject) as unknown as T;
  }

  return Object.keys(obj).reduce((result, key) => {
    const camelKey = snakeToCamel(key);
    const value = obj[key];
    
    result[camelKey] = typeof value === 'object' && value !== null 
      ? snakeToCamelObject(value)
      : value;
    
    return result;
  }, {} as Record<string, any>) as T;
}

// Converter objeto com keys em camelCase para snake_case
export function camelToSnakeObject<T = any>(obj: Record<string, any>): T {
  if (typeof obj !== 'object' || obj === null) {
    return obj as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(camelToSnakeObject) as unknown as T;
  }

  return Object.keys(obj).reduce((result, key) => {
    const snakeKey = camelToSnake(key);
    const value = obj[key];
    
    result[snakeKey] = typeof value === 'object' && value !== null 
      ? camelToSnakeObject(value)
      : value;
    
    return result;
  }, {} as Record<string, any>) as T;
}
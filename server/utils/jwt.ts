/**
 * Utilitários para verificação de tokens JWT
 */

import jwt from 'jsonwebtoken';

/**
 * Verifica um token JWT
 * @param token Token JWT a ser verificado
 * @param secret Chave secreta para verificação
 * @returns Payload decodificado do token ou null se inválido
 */
export function verifyToken(token: string, secret: string): any {
  try {
    const decoded = jwt.verify(token, secret);
    return decoded;
  } catch (error) {
    console.error('Erro ao verificar token JWT:', error);
    return null;
  }
}

/**
 * Gera um novo token JWT
 * @param payload Dados a serem codificados no token
 * @param secret Chave secreta para assinatura
 * @param options Opções adicionais (expiração, etc.)
 * @returns Token JWT assinado
 */
export function generateToken(payload: any, secret: string, options: jwt.SignOptions = {}): string {
  return jwt.sign(payload, secret, options);
}

/**
 * Decodifica um token JWT sem verificar a assinatura
 * @param token Token JWT a ser decodificado
 * @returns Payload decodificado do token ou null se inválido
 */
export function decodeToken(token: string): any {
  try {
    const decoded = jwt.decode(token);
    return decoded;
  } catch (error) {
    console.error('Erro ao decodificar token JWT:', error);
    return null;
  }
}
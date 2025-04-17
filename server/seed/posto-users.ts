import { storage } from '../storage';
import { userRoleEnum } from '@shared/schema';
import { criarBasesIniciais } from './base-seed';

const SENHA_PADRAO = 'murici@2025';

// Função para criar usuários padrão para postos
export async function criarUsuariosPosto() {
  console.log('Iniciando criação de usuários para postos...');
  
  // Primeiro vamos criar ou verificar as bases
  const baseIds = await criarBasesIniciais();
  console.log('IDs das bases:', baseIds);
  
  const postos = [
    { nome: 'osasco', displayName: 'Osasco' },
    { nome: 'guarulhos', displayName: 'Guarulhos' },
    { nome: 'saopaulo', displayName: 'São Paulo' },
    { nome: 'campinas', displayName: 'Campinas' },
    { nome: 'abc', displayName: 'ABC' },
    { nome: 'socorro', displayName: 'Socorro' },
    { nome: 'sorocaba', displayName: 'Sorocaba' },
  ];
  
  for (const posto of postos) {
    // Verifica se o usuário já existe
    const email = `${posto.nome}@muricionfleet.com`;
    const userExistente = await storage.getUserByEmail(email);
    
    if (!userExistente) {
      const baseId = baseIds[posto.nome];
      
      if (!baseId) {
        console.error(`Base com basename ${posto.nome} não encontrada. Não é possível criar usuário.`);
        continue;
      }
      
      console.log(`Criando usuário para posto ${posto.displayName} associado à base ID ${baseId}...`);
      
      try {
        await storage.createUser({
          name: posto.displayName,
          email: email,
          password: SENHA_PADRAO,
          role: userRoleEnum.enumValues[1], // gestor
          baseId: baseId,
          basename: posto.nome
        });
        console.log(`Usuário para posto ${posto.displayName} criado com sucesso!`);
      } catch (error) {
        console.error(`Erro ao criar usuário para posto ${posto.displayName}:`, error);
      }
    } else {
      console.log(`Usuário para posto ${posto.displayName} já existe.`);
    }
  }
  
  console.log('Criação de usuários para postos concluída!');
}
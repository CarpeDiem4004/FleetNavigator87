import { storage } from '../storage';
import { userRoleEnum } from '@shared/schema';

const SENHA_PADRAO = 'murici@2025';

// Função para criar usuários padrão para postos
export async function criarUsuariosPosto() {
  console.log('Iniciando criação de usuários para postos...');
  
  const postos = [
    { id: 1, nome: 'osasco', displayName: 'Osasco' },
    { id: 2, nome: 'guarulhos', displayName: 'Guarulhos' },
    { id: 3, nome: 'saopaulo', displayName: 'São Paulo' },
    { id: 4, nome: 'campinas', displayName: 'Campinas' },
    { id: 5, nome: 'abc', displayName: 'ABC' },
    { id: 6, nome: 'socorro', displayName: 'Socorro' },
    { id: 7, nome: 'sorocaba', displayName: 'Sorocaba' },
  ];
  
  for (const posto of postos) {
    // Verifica se o usuário já existe
    const email = `${posto.nome}@muricionfleet.com`;
    const userExistente = await storage.getUserByEmail(email);
    
    if (!userExistente) {
      console.log(`Criando usuário para posto ${posto.displayName}...`);
      await storage.createUser({
        name: posto.displayName,
        email: email,
        password: SENHA_PADRAO,
        role: userRoleEnum.enumValues[1], // gestor
        baseId: posto.id,
        basename: posto.nome
      });
      console.log(`Usuário para posto ${posto.displayName} criado com sucesso!`);
    } else {
      console.log(`Usuário para posto ${posto.displayName} já existe.`);
    }
  }
  
  console.log('Criação de usuários para postos concluída!');
}
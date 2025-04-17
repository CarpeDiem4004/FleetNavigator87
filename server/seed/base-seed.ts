import { storage } from '../storage';

// Função para criar bases padrão
export async function criarBasesIniciais() {
  console.log('Iniciando criação de bases iniciais...');
  
  const bases = [
    { nome: 'Osasco', basename: 'osasco', tipo: 'posto' },
    { nome: 'Guarulhos', basename: 'guarulhos', tipo: 'posto' },
    { nome: 'São Paulo', basename: 'saopaulo', tipo: 'posto' },
    { nome: 'Campinas', basename: 'campinas', tipo: 'posto' },
    { nome: 'ABC', basename: 'abc', tipo: 'posto' },
    { nome: 'Socorro', basename: 'socorro', tipo: 'posto' },
    { nome: 'Sorocaba', basename: 'sorocaba', tipo: 'posto' },
    { nome: 'Multas', basename: 'multas', tipo: 'operacional' },
    { nome: 'Pneus', basename: 'pneus', tipo: 'operacional' },
    { nome: 'Gestão de Frotas', basename: 'frotas', tipo: 'administrativo' },
    { nome: 'Line Hall', basename: 'linehall', tipo: 'operacional' }
  ];
  
  const baseIds: Record<string, number> = {};
  
  for (const base of bases) {
    try {
      // Verifica se a base já existe pelo basename
      const baseExistente = await storage.getBaseByName(base.basename);
      
      if (!baseExistente) {
        console.log(`Criando base ${base.nome}...`);
        const novaBASE = await storage.createBase({
          name: base.nome,
          basename: base.basename,
          type: base.tipo,
          active: true
        });
        
        baseIds[base.basename] = novaBASE.id;
        console.log(`Base ${base.nome} criada com ID ${novaBASE.id}`);
      } else {
        console.log(`Base ${base.nome} já existe com ID ${baseExistente.id}`);
        baseIds[base.basename] = baseExistente.id;
      }
    } catch (error) {
      console.error(`Erro ao criar base ${base.nome}:`, error);
    }
  }
  
  console.log('Criação de bases concluída!');
  return baseIds;
}
// Lista padronizada de projetos conforme definição atualizada do sistema
export const PROJECTS_LIST = [
  'SHOPEE',
  'MERCADO LIVRE',
  'COCA COLA',
  'GRUPO PEREIRA',
  'MADEIRA MADEIRA',
  'OXXO',
  'MANUTENÇÃO',
  'MAGALU',
  'NATURA',
  'LINE HAUL MURICI',
  'FULL MELI',
  'PETLOVE',
  'USO OPERACIONAL'
] as const;

export type ProjectType = typeof PROJECTS_LIST[number];
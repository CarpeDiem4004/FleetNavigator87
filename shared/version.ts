// Sistema de Versionamento Automático - Muricion Fleet
// Atualizado automaticamente a cada release

export const APP_VERSION = {
  major: 2,
  minor: 9,
  patch: 4,
  build: "292201",
  
  // Versão completa formatada
  get full(): string {
    return `v${this.major}.${this.minor}.${this.patch}`;
  },
  
  // Versão com build para debug
  get fullWithBuild(): string {
    return `v${this.major}.${this.minor}.${this.patch}.${this.build}`;
  },
  
  // Data da última atualização
  lastUpdate: "02/09/2025",
  
  // Changelog da versão atual
  changelog: [
    "Atualizações gerais do sistema",
    "Sistema de versionamento automático implementado",
    "Versão dinâmica nos layouts",
    "Controle de changelog integrado"
  ]
};

// Função para incrementar versão automaticamente
export const incrementVersion = (type: 'major' | 'minor' | 'patch' = 'patch') => {
  switch (type) {
    case 'major':
      APP_VERSION.major += 1;
      APP_VERSION.minor = 0;
      APP_VERSION.patch = 0;
      break;
    case 'minor':
      APP_VERSION.minor += 1;
      APP_VERSION.patch = 0;
      break;
    case 'patch':
      APP_VERSION.patch += 1;
      break;
  }
  
  APP_VERSION.lastUpdate = new Date().toLocaleDateString('pt-BR');
  APP_VERSION.build = Date.now().toString().slice(-6);
  
  return APP_VERSION.full;
};

// Hook para desenvolvimento - logs de versão
if (typeof window !== 'undefined') {
  console.log(`🚀 Muricion Fleet ${APP_VERSION.full} - ${APP_VERSION.lastUpdate}`);
  console.log('📋 Últimas atualizações:', APP_VERSION.changelog);
}
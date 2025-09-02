#!/usr/bin/env node

// Script para incrementar versão automaticamente - Muricion Fleet
// Uso: node scripts/update-version.js [patch|minor|major] [changelog_message]

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const versionType = args[0] || 'patch';
const changelogMessage = args[1] || 'Atualizações gerais do sistema';

console.log('🔄 Atualizando versão do sistema...');

// Ler arquivo de versão atual
const versionPath = path.join(__dirname, '..', 'shared', 'version.ts');
let versionContent = fs.readFileSync(versionPath, 'utf8');

// Extrair versão atual
const majorMatch = versionContent.match(/major:\s*(\d+)/);
const minorMatch = versionContent.match(/minor:\s*(\d+)/);
const patchMatch = versionContent.match(/patch:\s*(\d+)/);

if (!majorMatch || !minorMatch || !patchMatch) {
  console.error('❌ Erro: Não foi possível extrair versão atual');
  process.exit(1);
}

let major = parseInt(majorMatch[1]);
let minor = parseInt(minorMatch[1]);
let patch = parseInt(patchMatch[1]);

const oldVersion = `v${major}.${minor}.${patch}`;

// Incrementar versão
switch (versionType) {
  case 'major':
    major += 1;
    minor = 0;
    patch = 0;
    break;
  case 'minor':
    minor += 1;
    patch = 0;
    break;
  case 'patch':
  default:
    patch += 1;
    break;
}

const newVersion = `v${major}.${minor}.${patch}`;
const currentDate = new Date().toLocaleDateString('pt-BR');
const buildNumber = Date.now().toString().slice(-6);

console.log(`📊 ${oldVersion} → ${newVersion}`);

// Atualizar arquivo de versão
const newVersionContent = `// Sistema de Versionamento Automático - Muricion Fleet
// Atualizado automaticamente a cada release

export const APP_VERSION = {
  major: ${major},
  minor: ${minor},
  patch: ${patch},
  build: "${buildNumber}",
  
  // Versão completa formatada
  get full(): string {
    return \`v\${this.major}.\${this.minor}.\${this.patch}\`;
  },
  
  // Versão com build para debug
  get fullWithBuild(): string {
    return \`v\${this.major}.\${this.minor}.\${this.patch}.\${this.build}\`;
  },
  
  // Data da última atualização
  lastUpdate: "${currentDate}",
  
  // Changelog da versão atual
  changelog: [
    "${changelogMessage}",
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
  console.log(\`🚀 Muricion Fleet \${APP_VERSION.full} - \${APP_VERSION.lastUpdate}\`);
  console.log('📋 Últimas atualizações:', APP_VERSION.changelog);
}`;

fs.writeFileSync(versionPath, newVersionContent);

// Atualizar replit.md
const replitMdPath = path.join(__dirname, '..', 'replit.md');
let replitContent = fs.readFileSync(replitMdPath, 'utf8');

// Atualizar seção de Recent Changes
const todayDate = new Date().toLocaleDateString('pt-BR', { 
  day: '2-digit', 
  month: '2-digit', 
  year: 'numeric' 
});

const newChangeEntry = `- **${todayDate}**: ${changelogMessage} (${newVersion})`;

// Inserir nova mudança no início da seção Recent Changes
replitContent = replitContent.replace(
  /(## Recent Changes: Latest modifications with dates\n\n### Setembro 2025\n)/,
  `$1${newChangeEntry}\n`
);

fs.writeFileSync(replitMdPath, replitContent);

console.log('✅ Versão atualizada com sucesso!');
console.log(`📝 Changelog: ${changelogMessage}`);
console.log(`📅 Data: ${currentDate}`);
console.log(`🔨 Build: ${buildNumber}`);
console.log('📄 replit.md atualizado');

// Exibir comandos úteis
console.log('\n🛠️  Comandos disponíveis:');
console.log('   node scripts/update-version.js patch "Correção de bugs"');
console.log('   node scripts/update-version.js minor "Nova funcionalidade"');
console.log('   node scripts/update-version.js major "Mudança breaking"');
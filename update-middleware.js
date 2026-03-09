import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Obtém o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lê o arquivo routes.ts
const filePath = path.join(__dirname, 'server/routes.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Define os mapeamentos de middleware - usando os mesmos nomes
// Só precisamos garantir que cada ocorrência de middleware seja usada corretamente
const middlewareMappings = {
  'authMiddleware': 'isAuthenticated',
  'adminMiddleware': 'isAdmin',
  'maintenanceAccessMiddleware': 'hasMaintenanceAccess',
  'tiresAccessMiddleware': 'hasTiresAccess',
  'workshopMiddleware': 'isWorkshop',
  'baseAccessMiddleware': 'hasBaseAccess'
};

// Substitui todas as ocorrências
Object.entries(middlewareMappings).forEach(([oldMiddleware, newMiddleware]) => {
  // Substitui o middleware na definição de rotas (diferentes formatos de rota)
  const pattern1 = new RegExp(`app\\.(get|post|put|delete|patch)\\([^,]+,\\s*${oldMiddleware}`, 'g');
  content = content.replace(pattern1, (match) => {
    return match.replace(oldMiddleware, newMiddleware);
  });
  
  // Substitui ocorrências em rotas com múltiplos middlewares
  const pattern2 = new RegExp(`(app\\.(get|post|put|delete|patch)\\([^,]+,[^,]+),\\s*${oldMiddleware}`, 'g');
  content = content.replace(pattern2, (match, p1) => {
    return `${p1}, ${newMiddleware}`;
  });
  
  // Substitui ocorrências independentes (não como parte de uma definição de rota)
  const pattern3 = new RegExp(`([^a-zA-Z0-9_])${oldMiddleware}([^a-zA-Z0-9_])`, 'g');
  content = content.replace(pattern3, (match, p1, p2) => {
    return `${p1}${newMiddleware}${p2}`;
  });
});

// Escreve o conteúdo atualizado de volta no arquivo
fs.writeFileSync(filePath, content, 'utf8');

console.log('Middlewares substituídos com sucesso!');
/**
 * Script para atualizar as referências de "abastecimentos_posto_" para "posto_murici_"
 * em todos os arquivos relevantes do projeto
 */

import { promises as fs } from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Diretórios a serem verificados
const DIRETORIOS = [
  './server',
  './scripts'
];

// Extensões de arquivos a serem verificados
const EXTENSOES = ['.js', '.ts', '.tsx'];

// Padrão para substituição
const PADRAO_ANTIGO = 'abastecimentos_posto_';
const PADRAO_NOVO = 'posto_murici_';

// Função para encontrar todos os arquivos em um diretório (recursivamente)
async function encontrarArquivos(dir, extensoes) {
  let arquivos = [];
  
  try {
    const items = await fs.readdir(dir, { withFileTypes: true });
    
    for (const item of items) {
      const res = path.resolve(dir, item.name);
      
      if (item.isDirectory()) {
        // Ignorar node_modules e .git
        if (item.name !== 'node_modules' && item.name !== '.git') {
          const subArquivos = await encontrarArquivos(res, extensoes);
          arquivos = [...arquivos, ...subArquivos];
        }
      } else {
        const ext = path.extname(res).toLowerCase();
        if (extensoes.includes(ext)) {
          arquivos.push(res);
        }
      }
    }
  } catch (error) {
    console.error(`Erro ao ler diretório ${dir}:`, error);
  }
  
  return arquivos;
}

// Função para atualizar as referências em um arquivo
async function atualizarReferencias(arquivo) {
  try {
    // Ler o conteúdo do arquivo
    let conteudo = await fs.readFile(arquivo, 'utf8');
    
    // Verificar se o arquivo contém o padrão antigo
    if (!conteudo.includes(PADRAO_ANTIGO)) {
      return false; // Nenhuma alteração necessária
    }
    
    // Substituir todas as ocorrências
    const conteudoAtualizado = conteudo.split(PADRAO_ANTIGO).join(PADRAO_NOVO);
    
    // Escrever o conteúdo atualizado de volta no arquivo
    await fs.writeFile(arquivo, conteudoAtualizado, 'utf8');
    
    return true; // Arquivo atualizado
  } catch (error) {
    console.error(`Erro ao atualizar arquivo ${arquivo}:`, error);
    return false;
  }
}

// Função principal
async function atualizarTodasReferencias() {
  try {
    console.log('Iniciando atualização de referências no código...');
    let totalArquivos = 0;
    let totalAtualizados = 0;
    
    // Encontrar todos os arquivos nos diretórios especificados
    let todosArquivos = [];
    
    for (const dir of DIRETORIOS) {
      const arquivos = await encontrarArquivos(dir, EXTENSOES);
      todosArquivos = [...todosArquivos, ...arquivos];
    }
    
    totalArquivos = todosArquivos.length;
    console.log(`Encontrados ${totalArquivos} arquivos para verificar.`);
    
    // Atualizar referências em cada arquivo
    for (const arquivo of todosArquivos) {
      const atualizado = await atualizarReferencias(arquivo);
      
      if (atualizado) {
        console.log(`Atualizado: ${arquivo}`);
        totalAtualizados++;
      }
    }
    
    console.log(`\nAtualização concluída!`);
    console.log(`Total de arquivos verificados: ${totalArquivos}`);
    console.log(`Total de arquivos atualizados: ${totalAtualizados}`);
    
  } catch (error) {
    console.error('Erro durante a atualização de referências:', error);
  }
}

// Executar o script
atualizarTodasReferencias().catch(console.error);
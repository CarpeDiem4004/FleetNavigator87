/**
 * Script para criar as tabelas faltantes para postos v2
 * Cria as tabelas para: Alair_v2, Guarulhos_v2, Campinas_v2, Osasco_v2
 */

import pkg from 'pg';
const { Pool } = pkg;
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

// Configuração de conexão com o banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lista dos postos e seus respectivos arquivos SQL
const postos = [
  { nome: 'Alair_v2', arquivo: 'criar-tabela-alair-v2.sql' },
  { nome: 'Guarulhos_v2', arquivo: 'criar-tabela-guarulhos-v2.sql' },
  { nome: 'Campinas_v2', arquivo: 'criar-tabela-campinas-v2.sql' },
  { nome: 'Osasco_v2', arquivo: 'criar-tabela-osasco-v2.sql' }
];

// Verifica se a tabela já existe
async function verificarTabela(nomePosto) {
  const query = `
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'abastecimentos_posto_${nomePosto.toLowerCase()}'
    ) as "exists";
  `;
  
  try {
    const result = await pool.query(query);
    return result.rows[0].exists;
  } catch (error) {
    console.error(`Erro ao verificar tabela para ${nomePosto}:`, error);
    return false;
  }
}

// Executa o script SQL para criar a tabela
async function executarScript(nomePosto, nomeArquivo) {
  console.log(`\nProcessando posto: ${nomePosto}`);
  
  // Verifica se a tabela já existe
  const tabelaExiste = await verificarTabela(nomePosto.toLowerCase());
  
  if (tabelaExiste) {
    console.log(`✓ Tabela para ${nomePosto} já existe. Pulando...`);
    return false;
  }
  
  try {
    // Lê o conteúdo do arquivo SQL
    const caminhoArquivo = path.join(__dirname, nomeArquivo);
    const scriptSQL = fs.readFileSync(caminhoArquivo, 'utf8');
    
    console.log(`✓ Arquivo SQL para ${nomePosto} carregado com sucesso (${scriptSQL.length} bytes)`);
    console.log(`✓ Criando tabela para ${nomePosto}...`);
    
    // Executa o script SQL
    await pool.query(scriptSQL);
    
    console.log(`✅ Tabela para ${nomePosto} criada com sucesso!`);
    
    // Verifica novamente se a tabela foi criada
    const confirmacao = await verificarTabela(nomePosto.toLowerCase());
    if (confirmacao) {
      console.log(`✅ Confirmado: Tabela para ${nomePosto} está no banco de dados.`);
      return true;
    } else {
      console.error(`❌ Erro: Tabela para ${nomePosto} não foi encontrada após a criação.`);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Erro ao criar tabela para ${nomePosto}:`, error);
    return false;
  }
}

// Função principal
async function main() {
  console.log('Iniciando criação das tabelas faltantes...');
  
  try {
    let totalCriadas = 0;
    
    // Processa cada posto da lista
    for (const posto of postos) {
      const resultado = await executarScript(posto.nome, posto.arquivo);
      if (resultado) totalCriadas++;
    }
    
    console.log(`\n=============================================`);
    console.log(`Processo concluído!`);
    console.log(`Total de postos processados: ${postos.length}`);
    console.log(`Total de tabelas criadas: ${totalCriadas}`);
    console.log(`=============================================`);
    
  } catch (error) {
    console.error('Erro no processamento geral:', error);
  } finally {
    // Fecha a conexão com o banco
    await pool.end();
    console.log('Conexão com o banco de dados fechada.');
  }
}

// Executa o script
main();
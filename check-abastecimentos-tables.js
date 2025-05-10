/**
 * Script para verificar a estrutura das tabelas de abastecimentos
 * Isso nos ajudará a criar uma view de histórico consolidado correta
 */

import pg from 'pg';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const { Pool } = pg;

// Verificar se temos a variável DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('ERRO: Variável de ambiente DATABASE_URL não encontrada');
  console.error('Por favor, verifique se o banco de dados está configurado corretamente');
  process.exit(1);
}

// Configurar conexão com o banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function getTableColumns(tableName) {
  const query = `
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = $1
    ORDER BY ordinal_position;
  `;
  
  const result = await pool.query(query, [tableName]);
  return result.rows;
}

async function getTableSample(tableName) {
  try {
    const query = `
      SELECT * FROM ${tableName} 
      LIMIT 1;
    `;
    
    const result = await pool.query(query);
    return result.rows[0];
  } catch (error) {
    console.error(`Erro ao obter amostra da tabela ${tableName}:`, error);
    return null;
  }
}

async function main() {
  let client;

  try {
    console.log('Conectando ao banco de dados...');
    client = await pool.connect();
    
    // Lista de tabelas a verificar
    const tabelas = [
      'abastecimentos_posto_osasco_v2',
      'abastecimentos_posto_abc_v2',
      'abastecimentos_posto_socorro_v2',
      'abastecimentos_posto_sorocaba_v2',
      'abastecimentos_posto_campinas_v2',
      'posto_remedios_abastecimentos'
    ];
    
    // Verificar cada tabela
    for (const tabela of tabelas) {
      console.log(`\n========= TABELA: ${tabela} =========`);
      
      // Verificar se a tabela existe
      const checkQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `;
      
      const checkResult = await client.query(checkQuery, [tabela]);
      
      if (!checkResult.rows[0].exists) {
        console.log(`A tabela ${tabela} NÃO existe no banco de dados.`);
        continue;
      }
      
      // Obter colunas da tabela
      const colunas = await getTableColumns(tabela);
      
      console.log('Colunas da tabela:');
      colunas.forEach(col => {
        console.log(`- ${col.column_name} (${col.data_type})`);
      });
      
      // Obter amostra de dados
      const amostra = await getTableSample(tabela);
      
      if (amostra) {
        console.log('\nAmostra de dados:');
        
        // Formatando a saída de forma mais legível
        const amostraFormatada = Object.entries(amostra)
          .filter(([chave, valor]) => valor !== null) // Filtrar valores nulos
          .map(([chave, valor]) => {
            if (typeof valor === 'string' && valor.length > 50) {
              valor = valor.substring(0, 47) + '...';
            }
            return `  ${chave}: ${JSON.stringify(valor)}`;
          })
          .join('\n');
        
        console.log(amostraFormatada);
      } else {
        console.log('\nNão foi possível obter amostra de dados (tabela vazia ou erro).');
      }
    }
    
  } catch (error) {
    console.error('Erro ao executar o script:', error);
  } finally {
    if (client) {
      client.release();
    }
    
    // Encerrar o pool de conexões
    await pool.end();
    console.log('\nConexão encerrada.');
  }
}

main().catch(console.error);
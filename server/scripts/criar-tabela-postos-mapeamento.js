/**
 * Script para criar a tabela de mapeamento de postos no Supabase
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Necessário para módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega variáveis de ambiente
dotenv.config();

// Verifica se a URL do banco de dados está disponível
if (!process.env.DATABASE_URL) {
  console.error('Erro: DATABASE_URL não definida no ambiente');
  process.exit(1);
}

// Inicializa conexão com o banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  let client;
  
  try {
    client = await pool.connect();
    console.log('Conectado ao banco de dados');
    
    // Verifica se a tabela já existe
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'postos_mapeamento'
      );
    `;
    
    const tableExists = await client.query(checkTableQuery);
    
    if (tableExists.rows[0].exists) {
      console.log('Tabela postos_mapeamento já existe, verificando estrutura...');
      
      // Verifica a estrutura atual da tabela
      const columnsQuery = `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'postos_mapeamento'
      `;
      
      const columnsResult = await client.query(columnsQuery);
      console.log('Colunas existentes:', columnsResult.rows);
      
      // Verifica campos ausentes e adiciona-os
      const requiredColumns = [
        { name: 'id', type: 'uuid', default: 'uuid_generate_v4()' },
        { name: 'nome', type: 'text' },
        { name: 'nome_para_exibicao', type: 'text' },
        { name: 'tipo', type: 'text' },
        { name: 'campos_questionario', type: 'jsonb' },
        { name: 'ativo', type: 'boolean' },
        { name: 'created_at', type: 'timestamp with time zone', default: 'now()' },
        { name: 'updated_at', type: 'timestamp with time zone', default: 'now()' }
      ];
      
      const existingColumns = columnsResult.rows.map(row => row.column_name);
      
      for (const column of requiredColumns) {
        if (!existingColumns.includes(column.name)) {
          console.log(`Adicionando coluna ausente: ${column.name} (${column.type})`);
          
          let alterQuery = `
            ALTER TABLE postos_mapeamento 
            ADD COLUMN ${column.name} ${column.type}
          `;
          
          if (column.default) {
            alterQuery += ` DEFAULT ${column.default}`;
          }
          
          await client.query(alterQuery);
          console.log(`Coluna ${column.name} adicionada com sucesso`);
        }
      }
      
      console.log('Estrutura da tabela verificada e atualizada');
      
    } else {
      console.log('Tabela postos_mapeamento não existe, criando...');
      
      // Primeiro, garante que a extensão uuid-ossp esteja disponível
      await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
      
      // Cria a tabela
      const createTableQuery = `
        CREATE TABLE postos_mapeamento (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          nome TEXT NOT NULL,
          nome_para_exibicao TEXT,
          tipo TEXT,
          campos_questionario JSONB DEFAULT '{}',
          ativo BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Adiciona índices para otimização de consultas
        CREATE INDEX idx_postos_mapeamento_nome ON postos_mapeamento(nome);
        CREATE INDEX idx_postos_mapeamento_tipo ON postos_mapeamento(tipo);
        CREATE INDEX idx_postos_mapeamento_ativo ON postos_mapeamento(ativo);
      `;
      
      await client.query(createTableQuery);
      console.log('Tabela postos_mapeamento criada com sucesso');
      
      // Insere dados iniciais
      const initialData = [
        { nome: 'campinas', nome_para_exibicao: 'Campinas', tipo: 'posto', campos_questionario: JSON.stringify({
          campos_opcionais: ['observacoes', 'hodometro_atual', 'hodometro_anterior'],
          campos_obrigatorios: ['placa', 'motorista', 'quantidade', 'tipo_combustivel']
        })},
        { nome: 'osasco', nome_para_exibicao: 'Osasco', tipo: 'posto', campos_questionario: JSON.stringify({
          campos_opcionais: ['observacoes', 'hodometro_anterior'],
          campos_obrigatorios: ['placa', 'motorista', 'quantidade', 'tipo_combustivel', 'hodometro_atual']
        })},
        { nome: 'abc', nome_para_exibicao: 'ABC', tipo: 'posto', campos_questionario: JSON.stringify({
          campos_opcionais: ['observacoes'],
          campos_obrigatorios: ['placa', 'motorista', 'quantidade', 'tipo_combustivel', 'hodometro_atual', 'hodometro_anterior']
        })},
        { nome: 'socorro', nome_para_exibicao: 'Socorro', tipo: 'posto', campos_questionario: JSON.stringify({
          campos_opcionais: ['observacoes', 'hodometro_anterior'],
          campos_obrigatorios: ['placa', 'motorista', 'quantidade', 'tipo_combustivel', 'hodometro_atual']
        })},
        { nome: 'sorocaba', nome_para_exibicao: 'Sorocaba', tipo: 'posto', campos_questionario: JSON.stringify({
          campos_opcionais: ['observacoes', 'hodometro_anterior'],
          campos_obrigatorios: ['placa', 'motorista', 'quantidade', 'tipo_combustivel', 'hodometro_atual', 'rg_motorista']
        })},
        { nome: 'saopaulo', nome_para_exibicao: 'São Paulo', tipo: 'posto', campos_questionario: JSON.stringify({
          campos_opcionais: ['observacoes'],
          campos_obrigatorios: ['placa', 'motorista', 'quantidade', 'tipo_combustivel', 'hodometro_atual', 'rg_motorista']
        })},
        { nome: 'ipatinga', nome_para_exibicao: 'Ipatinga', tipo: 'posto', campos_questionario: JSON.stringify({
          campos_opcionais: ['observacoes', 'hodometro_anterior'],
          campos_obrigatorios: ['placa', 'motorista', 'quantidade', 'tipo_combustivel', 'hodometro_atual']
        })},
        { nome: 'botafogo', nome_para_exibicao: 'Bota Fogo', tipo: 'posto', campos_questionario: JSON.stringify({
          campos_opcionais: ['observacoes'],
          campos_obrigatorios: ['placa', 'motorista', 'quantidade', 'tipo_combustivel', 'hodometro_atual', 'hodometro_anterior']
        })},
        { nome: 'remedios', nome_para_exibicao: 'Remédios', tipo: 'posto_interno', campos_questionario: JSON.stringify({
          campos_opcionais: ['observacoes', 'hodometro_anterior'],
          campos_obrigatorios: ['placa', 'motorista', 'quantidade', 'tipo_combustivel', 'hodometro_atual', 'rg_motorista', 'projeto']
        })},
        { nome: 'vargemgrande', nome_para_exibicao: 'Vargem Grande', tipo: 'posto', campos_questionario: JSON.stringify({
          campos_opcionais: ['observacoes'],
          campos_obrigatorios: ['placa', 'motorista', 'quantidade', 'tipo_combustivel', 'hodometro_atual', 'rg_motorista']
        })}
      ];
      
      for (const posto of initialData) {
        const insertQuery = {
          text: `
            INSERT INTO postos_mapeamento (nome, nome_para_exibicao, tipo, campos_questionario)
            VALUES ($1, $2, $3, $4)
          `,
          values: [posto.nome, posto.nome_para_exibicao, posto.tipo, posto.campos_questionario]
        };
        
        await client.query(insertQuery);
        console.log(`Posto ${posto.nome_para_exibicao} inserido com sucesso`);
      }
      
      console.log('Dados iniciais inseridos com sucesso');
    }
    
    // Lista todos os registros na tabela para verificação
    const selectQuery = 'SELECT * FROM postos_mapeamento';
    const result = await client.query(selectQuery);
    
    console.log('Registros na tabela:');
    console.table(result.rows);
    
    console.log('Operação concluída com sucesso!');
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

main();
/**
 * Script para atualizar a tabela de projetos no banco de dados
 * com a nova lista padronizada de projetos
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const PROJETOS_ATUALIZADOS = [
  { id: 1, nome: 'SHOPEE', ativo: true, ordem: 1 },
  { id: 2, nome: 'MERCADO LIVRE', ativo: true, ordem: 2 },
  { id: 3, nome: 'COCA COLA', ativo: true, ordem: 3 },
  { id: 4, nome: 'GRUPO PEREIRA', ativo: true, ordem: 4 },
  { id: 5, nome: 'MADEIRA MADEIRA', ativo: true, ordem: 5 },
  { id: 6, nome: 'OXXO', ativo: true, ordem: 6 },
  { id: 7, nome: 'MANUTENÇÃO', ativo: true, ordem: 7 },
  { id: 8, nome: 'MAGALU', ativo: true, ordem: 8 },
  { id: 9, nome: 'NATURA', ativo: true, ordem: 9 },
  { id: 10, nome: 'LINE HALL SHOPEE', ativo: true, ordem: 10 },
  { id: 11, nome: 'FULL MELI', ativo: true, ordem: 11 },
  { id: 12, nome: 'PETLOVE', ativo: true, ordem: 12 },
  { id: 13, nome: 'USO OPERACIONAL', ativo: true, ordem: 13 }
];

async function atualizarProjetos() {
  try {
    console.log('Iniciando atualização da tabela de projetos...');
    
    // Verificar se a tabela existe
    const tabelaExiste = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'projetos'
      );
    `);
    
    if (!tabelaExiste.rows[0].exists) {
      console.log('Criando tabela projetos...');
      await pool.query(`
        CREATE TABLE projetos (
          id SERIAL PRIMARY KEY,
          nome VARCHAR(255) NOT NULL UNIQUE,
          ativo BOOLEAN DEFAULT true,
          ordem INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
    }
    
    // Limpar dados existentes
    await pool.query('DELETE FROM projetos');
    
    // Inserir novos projetos
    for (const projeto of PROJETOS_ATUALIZADOS) {
      await pool.query(`
        INSERT INTO projetos (id, nome, ativo, ordem, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          nome = $2,
          ativo = $3,
          ordem = $4,
          updated_at = NOW()
      `, [projeto.id, projeto.nome, projeto.ativo, projeto.ordem]);
    }
    
    // Resetar a sequência para o próximo ID
    await pool.query('SELECT setval(\'projetos_id_seq\', (SELECT MAX(id) FROM projetos))');
    
    console.log('Projetos atualizados com sucesso!');
    
    // Verificar os dados inseridos
    const resultado = await pool.query('SELECT * FROM projetos ORDER BY ordem');
    console.log('Projetos na base de dados:');
    resultado.rows.forEach(projeto => {
      console.log(`- ${projeto.ordem}: ${projeto.nome} (${projeto.ativo ? 'Ativo' : 'Inativo'})`);
    });
    
  } catch (error) {
    console.error('Erro ao atualizar projetos:', error);
  } finally {
    await pool.end();
  }
}

atualizarProjetos();
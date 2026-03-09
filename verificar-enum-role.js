/**
 * Script para verificar os valores do enum user_role
 */
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

async function main() {
  try {
    console.log('Iniciando verificação do enum user_role...');

    // Verificar se temos a variável DATABASE_URL
    if (!process.env.DATABASE_URL) {
      console.error('Erro: DATABASE_URL não encontrada nas variáveis de ambiente');
      return;
    }

    console.log('Conectando ao banco de dados...');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });

    // Consultar valores do enum user_role
    console.log('\nConsultando valores do enum user_role:');
    const enumQuery = `
      SELECT
        t.typname AS enum_name,
        e.enumlabel AS enum_value
      FROM
        pg_type t,
        pg_enum e
      WHERE
        t.typname = 'user_role'
        AND t.oid = e.enumtypid
      ORDER BY
        e.enumsortorder;
    `;
    
    const enumResult = await pool.query(enumQuery);
    
    if (enumResult.rows.length === 0) {
      console.log('Não foram encontrados valores para o enum user_role');
    } else {
      console.log('Valores do enum user_role:');
      enumResult.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. "${row.enum_value}"`);
      });
    }

    // Verificar outros tipos de enum no banco
    console.log('\nConsultando todos os tipos enum:');
    const allEnumsQuery = `
      SELECT
        t.typname AS enum_name,
        e.enumlabel AS enum_value
      FROM
        pg_type t,
        pg_enum e
      WHERE
        t.oid = e.enumtypid
      ORDER BY
        t.typname,
        e.enumsortorder;
    `;
    
    const allEnumsResult = await pool.query(allEnumsQuery);
    
    if (allEnumsResult.rows.length === 0) {
      console.log('Não foram encontrados tipos enum no banco');
    } else {
      const enumsByType = {};
      
      // Agrupar valores por tipo de enum
      allEnumsResult.rows.forEach(row => {
        if (!enumsByType[row.enum_name]) {
          enumsByType[row.enum_name] = [];
        }
        enumsByType[row.enum_name].push(row.enum_value);
      });
      
      // Mostrar todos os enums
      Object.keys(enumsByType).forEach(enumName => {
        console.log(`\nValores do enum "${enumName}":`);
        enumsByType[enumName].forEach((value, index) => {
          console.log(`  ${index + 1}. "${value}"`);
        });
      });
    }

    // Encerrar conexão
    await pool.end();
    console.log('\nVerificação concluída!');
  } catch (error) {
    console.error('Erro ao verificar enum user_role:', error);
  }
}

main();
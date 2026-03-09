/**
 * Script para criar a view historico_consolidado_abastecimentos no Supabase
 * Esta view é necessária para a página de histórico consolidado funcionar
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
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

async function main() {
  let client;

  try {
    console.log('Conectando ao banco de dados...');
    client = await pool.connect();
    
    // Verificar se a view já existe
    const checkViewQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND table_name = 'historico_consolidado_abastecimentos'
      );
    `;
    
    const checkResult = await client.query(checkViewQuery);
    
    if (checkResult.rows[0].exists) {
      console.log('A view historico_consolidado_abastecimentos já existe. Vamos removê-la e criar novamente...');
      await client.query('DROP VIEW historico_consolidado_abastecimentos;');
      console.log('View removida com sucesso.');
    }
    
    // Verificar se todas as tabelas necessárias existem
    console.log('Verificando a existência das tabelas...');
    
    const tabelasNecessarias = [
      'abastecimentos_posto_osasco_v2',
      'abastecimentos_posto_abc_v2',
      'abastecimentos_posto_socorro_v2',
      'abastecimentos_posto_sorocaba_v2',
      'abastecimentos_posto_campinas_v2',
      'posto_remedios_abastecimentos',
      'abastecimentos_posto_ipatinga_v2',
      'abastecimentos_posto_guarulhos',
      'abastecimentos_posto_vargemgrande'
    ];
    
    const tabelasExistentes = [];
    
    for (const tabela of tabelasNecessarias) {
      const query = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `;
      
      const result = await client.query(query, [tabela]);
      
      if (result.rows[0].exists) {
        tabelasExistentes.push(tabela);
      } else {
        console.log(`ALERTA: A tabela ${tabela} não existe e será removida da view.`);
      }
    }
    
    if (tabelasExistentes.length === 0) {
      console.error('ERRO: Nenhuma das tabelas necessárias existe no banco de dados.');
      console.error('Não é possível criar a view sem pelo menos uma tabela de abastecimentos.');
      process.exit(1);
    }
    
    // Construir a SQL da view com base nas tabelas existentes
    console.log('Construindo a query para a view...');
    
    let viewSql = `
CREATE OR REPLACE VIEW historico_consolidado_abastecimentos AS
SELECT 
    a.id,
    a.placa,
    COALESCE(a.hodometro_atual, a.km_atual, a.km) AS km,
    COALESCE(a.tipo_combustivel, 'Não especificado') AS tipo_combustivel,
    COALESCE(a.litros, a.quantidade_litros, a.quantity_litros) AS quantidade_litros,
    COALESCE(a.motorista, a.nome_motorista, a.motorista_nome) AS nome_motorista,
    COALESCE(a.rg_motorista, a.motorista_rg) AS rg_motorista,
    COALESCE(a.operador, a.nome_operador) AS nome_operador,
    COALESCE(a.valor_litro, a.preco_litro) AS valor_litro,
    a.valor_total,
    a.tipo_veiculo,
    a.observacoes,
    a.lavagem,
    a.tipo_lavagem,
    COALESCE(a.posto, a.nome_posto, 'Não especificado') AS nome_posto,
    COALESCE(a.data_hora, TO_CHAR(a.created_at, 'DD/MM/YYYY HH24:MI')) AS data_hora,
    a.created_at
FROM (`;
    
    // Adicionar cada tabela existente à view, selecionando apenas as colunas necessárias
    const partes = [];
    
    if (tabelasExistentes.includes('abastecimentos_posto_osasco_v2')) {
      partes.push(`
        SELECT 
          id, 
          placa, 
          COALESCE(hodometro_atual, km_atual, km) AS km,
          tipo_combustivel,
          COALESCE(litros, quantidade_litros) AS quantidade_litros,
          motorista AS nome_motorista,
          rg_motorista,
          operador AS nome_operador,
          valor_litro,
          valor_total,
          tipo_veiculo,
          observacoes,
          lavagem,
          tipo_lavagem,
          'Osasco_v2' AS nome_posto,
          data_hora,
          created_at
        FROM abastecimentos_posto_osasco_v2
      `);
    }
    
    if (tabelasExistentes.includes('abastecimentos_posto_abc_v2')) {
      partes.push(`
        SELECT 
          id, 
          placa, 
          COALESCE(hodometro_atual, km_atual, km) AS km,
          tipo_combustivel,
          COALESCE(litros, quantidade_litros) AS quantidade_litros,
          motorista AS nome_motorista,
          rg_motorista,
          operador AS nome_operador,
          valor_litro,
          valor_total,
          tipo_veiculo,
          observacoes,
          lavagem,
          tipo_lavagem,
          'ABC_v2' AS nome_posto,
          data_hora,
          created_at
        FROM abastecimentos_posto_abc_v2
      `);
    }
    
    if (tabelasExistentes.includes('abastecimentos_posto_socorro_v2')) {
      partes.push(`
        SELECT 
          id, 
          placa, 
          COALESCE(hodometro_atual, km_atual, km) AS km,
          tipo_combustivel,
          COALESCE(litros, quantidade_litros) AS quantidade_litros,
          motorista AS nome_motorista,
          rg_motorista,
          operador AS nome_operador,
          valor_litro,
          valor_total,
          tipo_veiculo,
          observacoes,
          lavagem,
          tipo_lavagem,
          'Socorro_v2' AS nome_posto,
          data_hora,
          created_at
        FROM abastecimentos_posto_socorro_v2
      `);
    }
    
    if (tabelasExistentes.includes('abastecimentos_posto_sorocaba_v2')) {
      partes.push(`
        SELECT 
          id, 
          placa, 
          COALESCE(hodometro_atual, km_atual, km) AS km,
          tipo_combustivel,
          COALESCE(litros, quantidade_litros) AS quantidade_litros,
          motorista AS nome_motorista,
          rg_motorista,
          operador AS nome_operador,
          valor_litro,
          valor_total,
          tipo_veiculo,
          observacoes,
          lavagem,
          tipo_lavagem,
          'Sorocaba_v2' AS nome_posto,
          data_hora,
          created_at
        FROM abastecimentos_posto_sorocaba_v2
      `);
    }
    
    if (tabelasExistentes.includes('abastecimentos_posto_campinas_v2')) {
      partes.push(`
        SELECT 
          id, 
          placa, 
          COALESCE(hodometro_atual, km_atual, km) AS km,
          tipo_combustivel,
          COALESCE(litros, quantidade_litros) AS quantidade_litros,
          motorista AS nome_motorista,
          rg_motorista,
          operador AS nome_operador,
          valor_litro,
          valor_total,
          tipo_veiculo,
          observacoes,
          lavagem,
          tipo_lavagem,
          'Campinas_v2' AS nome_posto,
          data_hora,
          created_at
        FROM abastecimentos_posto_campinas_v2
      `);
    }
    
    if (tabelasExistentes.includes('posto_remedios_abastecimentos')) {
      partes.push(`
        SELECT 
          id, 
          placa, 
          COALESCE(hodometro_atual, km_atual, km) AS km,
          tipo_combustivel,
          COALESCE(litros, quantidade_litros) AS quantidade_litros,
          motorista AS nome_motorista,
          rg_motorista,
          operador AS nome_operador,
          valor_litro,
          valor_total,
          tipo_veiculo,
          observacoes,
          lavagem,
          tipo_lavagem,
          'Remedios' AS nome_posto,
          data_hora,
          created_at
        FROM posto_remedios_abastecimentos
      `);
    }
    
    if (tabelasExistentes.includes('abastecimentos_posto_ipatinga_v2')) {
      partes.push(`
        SELECT 
          id, 
          placa, 
          COALESCE(hodometro_atual, km_atual, km) AS km,
          tipo_combustivel,
          COALESCE(litros, quantidade_litros) AS quantidade_litros,
          motorista AS nome_motorista,
          rg_motorista,
          operador AS nome_operador,
          valor_litro,
          valor_total,
          tipo_veiculo,
          observacoes,
          lavagem,
          tipo_lavagem,
          'Ipatinga_v2' AS nome_posto,
          data_hora,
          created_at
        FROM abastecimentos_posto_ipatinga_v2
      `);
    }
    
    if (tabelasExistentes.includes('abastecimentos_posto_guarulhos')) {
      partes.push(`
        SELECT 
          id, 
          placa, 
          COALESCE(hodometro_atual, km_atual, km) AS km,
          tipo_combustivel,
          COALESCE(litros, quantidade_litros) AS quantidade_litros,
          motorista AS nome_motorista,
          rg_motorista,
          operador AS nome_operador,
          valor_litro,
          valor_total,
          tipo_veiculo,
          observacoes,
          lavagem,
          tipo_lavagem,
          'Guarulhos' AS nome_posto,
          data_hora,
          created_at
        FROM abastecimentos_posto_guarulhos
      `);
    }
    
    if (tabelasExistentes.includes('abastecimentos_posto_vargemgrande')) {
      partes.push(`
        SELECT 
          id, 
          placa, 
          COALESCE(hodometro_atual, km_atual, km) AS km,
          tipo_combustivel,
          COALESCE(litros, quantidade_litros) AS quantidade_litros,
          motorista AS nome_motorista,
          rg_motorista,
          operador AS nome_operador,
          valor_litro,
          valor_total,
          tipo_veiculo,
          observacoes,
          lavagem,
          tipo_lavagem,
          'VargemGrande' AS nome_posto,
          data_hora,
          created_at
        FROM abastecimentos_posto_vargemgrande
      `);
    }
    
    viewSql += partes.join('\nUNION ALL\n');
    viewSql += '\n) a\nORDER BY a.created_at DESC;';
    
    // Criar a view
    console.log('Criando a view historico_consolidado_abastecimentos...');
    console.log('SQL da view:');
    console.log(viewSql);
    
    await client.query(viewSql);
    
    console.log('View historico_consolidado_abastecimentos criada com sucesso!');
    console.log(`Tabelas incluídas na view: ${tabelasExistentes.join(', ')}`);
    
  } catch (error) {
    console.error('Erro ao executar o script:', error);
  } finally {
    if (client) {
      client.release();
    }
    
    // Encerrar o pool de conexões
    await pool.end();
    console.log('Conexão encerrada.');
  }
}

main().catch(console.error);
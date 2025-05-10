/**
 * Script para criar a view historico_consolidado_abastecimentos no Supabase
 * Esta view é necessária para a página de histórico consolidado funcionar
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente
require('dotenv').config();

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
    
    // Adicionar cada tabela existente à view
    const partes = [];
    
    if (tabelasExistentes.includes('abastecimentos_posto_osasco_v2')) {
      partes.push("SELECT *, 'Osasco_v2' AS posto FROM abastecimentos_posto_osasco_v2");
    }
    
    if (tabelasExistentes.includes('abastecimentos_posto_abc_v2')) {
      partes.push("SELECT *, 'ABC_v2' AS posto FROM abastecimentos_posto_abc_v2");
    }
    
    if (tabelasExistentes.includes('abastecimentos_posto_socorro_v2')) {
      partes.push("SELECT *, 'Socorro_v2' AS posto FROM abastecimentos_posto_socorro_v2");
    }
    
    if (tabelasExistentes.includes('abastecimentos_posto_sorocaba_v2')) {
      partes.push("SELECT *, 'Sorocaba_v2' AS posto FROM abastecimentos_posto_sorocaba_v2");
    }
    
    if (tabelasExistentes.includes('abastecimentos_posto_campinas_v2')) {
      partes.push("SELECT *, 'Campinas_v2' AS posto FROM abastecimentos_posto_campinas_v2");
    }
    
    if (tabelasExistentes.includes('posto_remedios_abastecimentos')) {
      partes.push("SELECT *, 'Remedios' AS posto FROM posto_remedios_abastecimentos");
    }
    
    if (tabelasExistentes.includes('abastecimentos_posto_ipatinga_v2')) {
      partes.push("SELECT *, 'Ipatinga' AS posto FROM abastecimentos_posto_ipatinga_v2");
    }
    
    if (tabelasExistentes.includes('abastecimentos_posto_guarulhos')) {
      partes.push("SELECT *, 'Guarulhos' AS posto FROM abastecimentos_posto_guarulhos");
    }
    
    if (tabelasExistentes.includes('abastecimentos_posto_vargemgrande')) {
      partes.push("SELECT *, 'VargemGrande' AS posto FROM abastecimentos_posto_vargemgrande");
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
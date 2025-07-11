/**
 * Script para testar a API de solicitações de combustível
 * Verifica se os dados de Jacarei estão sendo retornados corretamente
 */

const { neon } = require('@neondatabase/serverless');

// Configuração do banco de dados
const sql = neon(process.env.DATABASE_URL);

async function testApiQuery() {
  console.log('=== TESTE DA API DE SOLICITAÇÕES ===\n');
  
  try {
    // Executar a mesma query que a API usa
    const query = `
      SELECT * FROM (
        SELECT 
          s.id::text as id,
          COALESCE(s.placa, s.veiculo_placa, 'SEM-PLACA') as placa,
          COALESCE(s.km, 0) as km,
          COALESCE(s.tipo_cartao, 'Padrão') as tipo_cartao,
          COALESCE(s.provedor_cartao, 'Padrão') as provedor_cartao,
          COALESCE(s.numero_cartao, '') as numero_cartao,
          COALESCE(s.motorista, 'Motorista não informado') as motorista,
          COALESCE(s.telefone_celular, '') as telefone_celular,
          COALESCE(s.observacoes, 'Sem observações') as observacoes,
          s.status,
          s.data_solicitacao,
          s.atendido_por,
          s.data_atendimento,
          s.created_at,
          s.updated_at,
          COALESCE(s.valor_solicitado, 0) as valor_solicitado,
          COALESCE(s.base, 'Base Principal') as base,
          COALESCE(s.id_rota, '') as id_rota,
          COALESCE(s.origem_tipo, 'tradicional') as origem_tipo,
          s.tipo_combustivel,
          s.litros_solicitados,
          NULL::varchar as veiculo_modelo,
          NULL::varchar as rota_origem,
          NULL::varchar as rota_destino,
          s.km as km_total,
          NULL::varchar as telefone_motorista,
          NULL::varchar as horario_abastecimento,
          COALESCE(s.valor_solicitado, 0) as valor_calculado,
          NULL::json as calculo_detalhes,
          COALESCE(v.cartao_abastecimento, s.numero_cartao, '') as cartao_combustivel
        FROM solicitacoes_fuel_card s
        LEFT JOIN veiculos v ON s.placa = v.placa
        WHERE s.base LIKE '%JACAREI%'
        
        UNION ALL
        
        SELECT 
          fcr.id::text as id,
          COALESCE(fcr.plate, 'SEM-PLACA') as placa,
          COALESCE(fcr.odometer, 0) as km,
          COALESCE(fcr.card_type, 'Padrão') as tipo_cartao,
          COALESCE(fcr.provider, 'Padrão') as provedor_cartao,
          COALESCE(fcr.card_number, '') as numero_cartao,
          COALESCE(fcr.driver_name, 'Motorista não informado') as motorista,
          COALESCE(fcr.driver_phone, '') as telefone_celular,
          COALESCE(fcr.reason, 'Sem observações') as observacoes,
          fcr.status,
          fcr.requested_at as data_solicitacao,
          fcr.approved_by as atendido_por,
          fcr.approved_at as data_atendimento,
          fcr.created_at,
          fcr.updated_at,
          COALESCE(fcr.amount::numeric, 0) as valor_solicitado,
          COALESCE(b.name, 'Base Principal') as base,
          '' as id_rota,
          'base_system' as origem_tipo,
          fcr.fuel_type as tipo_combustivel,
          NULL as litros_solicitados,
          NULL::varchar as veiculo_modelo,
          NULL::varchar as rota_origem,
          NULL::varchar as rota_destino,
          COALESCE(fcr.odometer, 0) as km_total,
          fcr.driver_phone as telefone_motorista,
          fcr.fuel_time as horario_abastecimento,
          COALESCE(fcr.amount::numeric, 0) as valor_calculado,
          NULL::json as calculo_detalhes,
          COALESCE(v.cartao_abastecimento, fcr.card_number, '') as cartao_combustivel
        FROM fuel_card_requests fcr
        LEFT JOIN bases b ON fcr.base_id = b.id
        LEFT JOIN veiculos v ON fcr.plate = v.placa
        WHERE b.name LIKE '%JACAREI%'
      ) unified_requests
      ORDER BY data_solicitacao DESC
    `;
    
    const results = await sql(query);
    
    console.log(`📊 Total de solicitações de Jacarei encontradas: ${results.length}`);
    console.log('\n=== DETALHES DAS SOLICITAÇÕES ===');
    
    results.forEach((row, index) => {
      console.log(`\n${index + 1}. ID: ${row.id}`);
      console.log(`   Placa: ${row.placa}`);
      console.log(`   Motorista: ${row.motorista}`);
      console.log(`   Valor: R$ ${row.valor_solicitado}`);
      console.log(`   Status: ${row.status}`);
      console.log(`   Base: ${row.base}`);
      console.log(`   Origem: ${row.origem_tipo}`);
      console.log(`   Data: ${row.data_solicitacao}`);
    });
    
    // Verificar se existem projetos e bases
    console.log('\n=== VERIFICANDO PROJETOS E BASES ===');
    
    const projectsQuery = `
      SELECT 
        p.id,
        p.name,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', b.id,
              'base_name', b.name,
              'base_code', b.code
            )
          ) FILTER (WHERE b.id IS NOT NULL), 
          '[]'::json
        ) as bases
      FROM projects p
      LEFT JOIN bases b ON b.project_id = p.id
      WHERE p.name LIKE '%GRUPO%' OR p.name LIKE '%PEREIRA%'
      GROUP BY p.id, p.name
      ORDER BY p.name
    `;
    
    const projectsResults = await sql(projectsQuery);
    
    console.log(`\n🎯 Projetos encontrados: ${projectsResults.length}`);
    projectsResults.forEach(project => {
      console.log(`\n📁 ${project.name} (ID: ${project.id})`);
      const bases = Array.isArray(project.bases) ? project.bases : [];
      console.log(`   Bases: ${bases.length}`);
      bases.forEach(base => {
        console.log(`   - ${base.base_name} (ID: ${base.id})`);
      });
    });
    
  } catch (error) {
    console.error('❌ Erro ao executar teste:', error);
  }
}

// Executar teste
testApiQuery();
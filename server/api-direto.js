/**
 * API direta que evita a interceptação do Vite
 * Este arquivo define rotas que são registradas antes do middleware do Vite
 */

import { Pool } from 'pg';
import { formatPostoName } from './utils/posto-utils.js';

// Conexão direta com o PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Função para obter histórico de um posto específico da view consolidada
export async function getHistoricoPosto(req, res) {
  try {
    // Forçar o Content-Type como application/json para evitar interceptação do Vite
    res.setHeader('Content-Type', 'application/json');
    
    // Verificação especial para Campinas V2, Osasco e Osasco V2
    let postoName = req.params.posto;
    
    console.log("getHistoricoPosto - Posto solicitado:", postoName);
    
    // Caso especial para Campinas V2
    if (postoName.toLowerCase() === 'campinas_v2' || 
        postoName.toLowerCase().includes('campinas_v2') || 
        postoName.toLowerCase().includes('campinas v2')) {
      postoName = 'campinas_v2';
      console.log("getHistoricoPosto - Identificado como Campinas V2");
    }
    // Caso especial para Osasco V2
    else if (postoName.toLowerCase() === 'osasco_v2' || 
        postoName.toLowerCase().includes('osasco_v2') || 
        postoName.toLowerCase().includes('osasco v2')) {
      postoName = 'osasco_v2';
      console.log("getHistoricoPosto - Identificado como Osasco V2");
    }
    // Caso especial para ABC V2
    else if (postoName.toLowerCase() === 'abc_v2' || 
        postoName.toLowerCase().includes('abc_v2') || 
        postoName.toLowerCase().includes('abc v2')) {
      postoName = 'abc_v2';
      console.log("getHistoricoPosto - Identificado como ABC V2");
    }
    // Caso especial para Alair V2
    else if (postoName.toLowerCase() === 'alair_v2' || 
        postoName.toLowerCase().includes('alair_v2') || 
        postoName.toLowerCase().includes('alair v2')) {
      postoName = 'alair_v2';
      console.log("getHistoricoPosto - Identificado como Alair V2");
    }
    // Caso especial para Guarulhos V2
    else if (postoName.toLowerCase() === 'guarulhos_v2' || 
        postoName.toLowerCase().includes('guarulhos_v2') || 
        postoName.toLowerCase().includes('guarulhos v2')) {
      postoName = 'guarulhos_v2';
      console.log("getHistoricoPosto - Identificado como Guarulhos V2");
    }
    // Caso especial para Socorro V2
    else if (postoName.toLowerCase() === 'socorro_v2' || 
        postoName.toLowerCase().includes('socorro_v2') || 
        postoName.toLowerCase().includes('socorro v2')) {
      postoName = 'socorro_v2';
      console.log("getHistoricoPosto - Identificado como Socorro V2");
    }
    // Caso especial para Sorocaba V2
    else if (postoName.toLowerCase() === 'sorocaba_v2' || 
        postoName.toLowerCase().includes('sorocaba_v2') || 
        postoName.toLowerCase().includes('sorocaba v2')) {
      postoName = 'sorocaba_v2';
      console.log("getHistoricoPosto - Identificado como Sorocaba V2");
    }
    // Caso especial para Osasco
    else if (postoName.toLowerCase() === 'osasco' || 
        postoName.toLowerCase().includes('osasco')) {
      postoName = 'osasco';
      console.log("getHistoricoPosto - Identificado como Osasco");
    } 
    else {
      postoName = formatPostoName(postoName);
      console.log("getHistoricoPosto - Formatado para:", postoName);
    }
    
    // Caso especial para postos V2 (Campinas, Osasco, ABC, Alair, Socorro, Sorocaba) e Osasco: usar tabela diretamente em vez de view
    let querySource;
    let dataQuery;
    
    if (postoName.toLowerCase() === 'campinas_v2' || 
        postoName.toLowerCase() === 'osasco' || 
        postoName.toLowerCase() === 'osasco_v2' || 
        postoName.toLowerCase() === 'abc_v2' || 
        postoName.toLowerCase() === 'alair_v2' ||
        postoName.toLowerCase() === 'guarulhos_v2' ||
        postoName.toLowerCase() === 'socorro_v2' ||
        postoName.toLowerCase() === 'sorocaba_v2') {
      console.log(`getHistoricoPosto - Usando tabela direta para ${postoName} em vez de view`);
      
      // Definir o nome da tabela com base no posto
      const tableName = `abastecimentos_posto_${postoName.toLowerCase()}`;
      
      // Verificar se a tabela existe
      const tableCheckQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        ) as "exists";
      `;
      
      const tableCheckResult = await pool.query(tableCheckQuery, [tableName]);
      
      if (!tableCheckResult.rows[0].exists) {
        return res.status(404).json({ 
          success: false, 
          error: `Tabela para posto ${postoName} não encontrada.` 
        });
      }
      
      querySource = tableName;
      
      // Verificar a estrutura da tabela para adaptar a consulta
      const columnsQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1
      `;
      
      console.log(`Verificando colunas da tabela ${tableName}`);
      const columnsResult = await pool.query(columnsQuery, [tableName]);
      const tableColumns = columnsResult.rows.map(row => row.column_name);
      
      console.log(`Colunas disponíveis em ${tableName}:`, tableColumns);
      
      // Criar uma consulta que se adapta às colunas disponíveis na tabela
      // Consulta SQL limpa e corrigida
      // Criar query completamente nova para resolver problemas de duplicação
      let columns = [
        `id`,
        `placa`,
        tableColumns.includes('km_atual') ? 'km_atual as km' : 'NULL as km',
        tableColumns.includes('hodometro_atual') ? 'hodometro_atual' : 'NULL as hodometro_atual',
        tableColumns.includes('tipo_combustivel') ? 'tipo_combustivel' : "'Desconhecido' as tipo_combustivel",
        tableColumns.includes('litros') ? 'litros as quantidade_litros' : 'NULL as quantidade_litros',
        tableColumns.includes('motorista') ? 'motorista as nome_motorista' : "'Não informado' as nome_motorista",
        tableColumns.includes('motorista_rg') ? 'motorista_rg as rg_motorista' : "NULL as rg_motorista",
        tableColumns.includes('operador') ? 'operador as nome_operador' : "'Sistema' as nome_operador",
        tableColumns.includes('valor_litro') ? 'valor_litro' : '0 as valor_litro',
        tableColumns.includes('valor_total') ? 'valor_total' : '0 as valor_total',
        tableColumns.includes('tipo_veiculo') ? 'tipo_veiculo' : "'Não especificado' as tipo_veiculo",
        tableColumns.includes('observacoes') ? 'observacoes' : "'' as observacoes",
        tableColumns.includes('lavagem') ? 'lavagem' : 'false as lavagem',
        tableColumns.includes('tipo_lavagem') ? 'tipo_lavagem' : "NULL as tipo_lavagem"
      ];
      
      // Adicionar campo de projeto sem duplicação
      if (tableColumns.includes('projeto')) {
        columns.push('projeto as projeto');
      } else if (tableColumns.includes('project')) {
        columns.push('project as projeto');
      } else {
        columns.push("NULL as projeto");
      }
      
      // Adicionar data_hora e created_at
      columns.push("to_char(created_at, 'DD/MM/YYYY HH24:MI') as data_hora");
      columns.push("created_at");
      
      // Montar a consulta
      dataQuery = `
        SELECT 
          ${columns.join(',\n          ')}
        FROM ${tableName}
        ORDER BY created_at DESC
        LIMIT ${req.query.limit || 50}
      `;
      
      // Verificar se a modificação está funcionando
      // Removido o log de consulta final para evitar logs muito longos;
      
      console.log(`Consulta adaptada para tabela ${tableName}:`, dataQuery);
    } else {
      // Fluxo normal usando view consolidada
      const viewName = `abastecimentos_posto_${postoName.toLowerCase()}_consolidado`;
      
      // Verificar se a view existe
      const checkQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        ) as "exists";
      `;
      
      const checkResult = await pool.query(checkQuery, [viewName]);
      
      if (!checkResult.rows[0].exists) {
        return res.status(404).json({ 
          success: false, 
          error: `View consolidada para posto ${postoName} não encontrada.` 
        });
      }
      
      querySource = viewName;
      dataQuery = `SELECT * FROM "${viewName}" ORDER BY data_hora DESC LIMIT ${req.query.limit || 50}`;
    }
    const result = await pool.query(dataQuery);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount,
      posto: postoName
    });
  } catch (error) {
    console.error(`Erro ao consultar histórico da view para posto ${req.params.posto}:`, error);
    res.status(500).json({ 
      success: false, 
      error: `Erro ao consultar histórico: ${error.message}` 
    });
  }
}

// Função para obter estatísticas mensais
export async function getEstatisticasMensaisPosto(req, res) {
  try {
    // Forçar o Content-Type como application/json para evitar interceptação do Vite
    res.setHeader('Content-Type', 'application/json');
    
    // Verificação especial para Campinas V2
    let postoName = req.params.posto;
    
    console.log("getEstatisticasMensaisPosto - Posto solicitado:", postoName);
    
    // Caso especial para Campinas V2
    if (postoName.toLowerCase() === 'campinas_v2' || 
        postoName.toLowerCase().includes('campinas_v2') || 
        postoName.toLowerCase().includes('campinas v2')) {
      postoName = 'campinas_v2';
      console.log("getEstatisticasMensaisPosto - Identificado como Campinas V2");
    }
    // Caso especial para Osasco V2
    else if (postoName.toLowerCase() === 'osasco_v2' || 
        postoName.toLowerCase().includes('osasco_v2') || 
        postoName.toLowerCase().includes('osasco v2')) {
      postoName = 'osasco_v2';
      console.log("getEstatisticasMensaisPosto - Identificado como Osasco V2");
    }
    // Caso especial para ABC V2
    else if (postoName.toLowerCase() === 'abc_v2' || 
        postoName.toLowerCase().includes('abc_v2') || 
        postoName.toLowerCase().includes('abc v2')) {
      postoName = 'abc_v2';
      console.log("getEstatisticasMensaisPosto - Identificado como ABC V2");
    }
    // Caso especial para Alair V2
    else if (postoName.toLowerCase() === 'alair_v2' || 
        postoName.toLowerCase().includes('alair_v2') || 
        postoName.toLowerCase().includes('alair v2')) {
      postoName = 'alair_v2';
      console.log("getEstatisticasMensaisPosto - Identificado como Alair V2");
    }
    // Caso especial para Guarulhos V2
    else if (postoName.toLowerCase() === 'guarulhos_v2' || 
        postoName.toLowerCase().includes('guarulhos_v2') || 
        postoName.toLowerCase().includes('guarulhos v2')) {
      postoName = 'guarulhos_v2';
      console.log("getEstatisticasMensaisPosto - Identificado como Guarulhos V2");
    }
    // Caso especial para Socorro V2
    else if (postoName.toLowerCase() === 'socorro_v2' || 
        postoName.toLowerCase().includes('socorro_v2') || 
        postoName.toLowerCase().includes('socorro v2')) {
      postoName = 'socorro_v2';
      console.log("getEstatisticasMensaisPosto - Identificado como Socorro V2");
    }
    // Caso especial para Sorocaba V2
    else if (postoName.toLowerCase() === 'sorocaba_v2' || 
        postoName.toLowerCase().includes('sorocaba_v2') || 
        postoName.toLowerCase().includes('sorocaba v2')) {
      postoName = 'sorocaba_v2';
      console.log("getEstatisticasMensaisPosto - Identificado como Sorocaba V2");
    }
    // Caso especial para Osasco
    else if (postoName.toLowerCase() === 'osasco' || 
        postoName.toLowerCase().includes('osasco')) {
      postoName = 'osasco';
      console.log("getEstatisticasMensaisPosto - Identificado como Osasco");
    } 
    else {
      postoName = formatPostoName(postoName);
      console.log("getEstatisticasMensaisPosto - Formatado para:", postoName);
    }
    
    const viewName = `abastecimentos_posto_${postoName.toLowerCase()}_estatisticas_mensais`;
    
    // Verificar se a view existe
    const checkQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      ) as "exists";
    `;
    
    const checkResult = await pool.query(checkQuery, [viewName]);
    
    if (!checkResult.rows[0].exists) {
      return res.status(404).json({ 
        success: false, 
        error: `View de estatísticas mensais para posto ${postoName} não encontrada.` 
      });
    }
    
    // Obter dados da view
    const dataQuery = `SELECT * FROM "${viewName}" ORDER BY ano DESC, mes DESC LIMIT 12`;
    const result = await pool.query(dataQuery);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount,
      posto: postoName
    });
  } catch (error) {
    console.error(`Erro ao consultar estatísticas mensais para posto ${req.params.posto}:`, error);
    res.status(500).json({ 
      success: false, 
      error: `Erro ao consultar estatísticas mensais: ${error.message}` 
    });
  }
}

// Função para obter consumo por veículo
export async function getConsumoPorVeiculoPosto(req, res) {
  try {
    // Forçar o Content-Type como application/json para evitar interceptação do Vite
    res.setHeader('Content-Type', 'application/json');
    
    // Verificação especial para Campinas V2
    let postoName = req.params.posto;
    
    console.log("getConsumoPorVeiculoPosto - Posto solicitado:", postoName);
    
    // Caso especial para Campinas V2
    if (postoName.toLowerCase() === 'campinas_v2' || 
        postoName.toLowerCase().includes('campinas_v2') || 
        postoName.toLowerCase().includes('campinas v2')) {
      postoName = 'campinas_v2';
      console.log("getConsumoPorVeiculoPosto - Identificado como Campinas V2");
    }
    // Caso especial para Osasco V2
    else if (postoName.toLowerCase() === 'osasco_v2' || 
        postoName.toLowerCase().includes('osasco_v2') || 
        postoName.toLowerCase().includes('osasco v2')) {
      postoName = 'osasco_v2';
      console.log("getConsumoPorVeiculoPosto - Identificado como Osasco V2");
    }
    // Caso especial para ABC V2
    else if (postoName.toLowerCase() === 'abc_v2' || 
        postoName.toLowerCase().includes('abc_v2') || 
        postoName.toLowerCase().includes('abc v2')) {
      postoName = 'abc_v2';
      console.log("getConsumoPorVeiculoPosto - Identificado como ABC V2");
    }
    // Caso especial para Alair V2
    else if (postoName.toLowerCase() === 'alair_v2' || 
        postoName.toLowerCase().includes('alair_v2') || 
        postoName.toLowerCase().includes('alair v2')) {
      postoName = 'alair_v2';
      console.log("getConsumoPorVeiculoPosto - Identificado como Alair V2");
    }
    // Caso especial para Guarulhos V2
    else if (postoName.toLowerCase() === 'guarulhos_v2' || 
        postoName.toLowerCase().includes('guarulhos_v2') || 
        postoName.toLowerCase().includes('guarulhos v2')) {
      postoName = 'guarulhos_v2';
      console.log("getConsumoPorVeiculoPosto - Identificado como Guarulhos V2");
    }
    // Caso especial para Socorro V2
    else if (postoName.toLowerCase() === 'socorro_v2' || 
        postoName.toLowerCase().includes('socorro_v2') || 
        postoName.toLowerCase().includes('socorro v2')) {
      postoName = 'socorro_v2';
      console.log("getConsumoPorVeiculoPosto - Identificado como Socorro V2");
    }
    // Caso especial para Sorocaba V2
    else if (postoName.toLowerCase() === 'sorocaba_v2' || 
        postoName.toLowerCase().includes('sorocaba_v2') || 
        postoName.toLowerCase().includes('sorocaba v2')) {
      postoName = 'sorocaba_v2';
      console.log("getConsumoPorVeiculoPosto - Identificado como Sorocaba V2");
    }
    // Caso especial para Osasco
    else if (postoName.toLowerCase() === 'osasco' || 
        postoName.toLowerCase().includes('osasco')) {
      postoName = 'osasco';
      console.log("getConsumoPorVeiculoPosto - Identificado como Osasco");
    } 
    else {
      postoName = formatPostoName(postoName);
      console.log("getConsumoPorVeiculoPosto - Formatado para:", postoName);
    }
    
    const viewName = `abastecimentos_posto_${postoName.toLowerCase()}_consumo_por_veiculo`;
    
    // Verificar se a view existe
    const checkQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      ) as "exists";
    `;
    
    const checkResult = await pool.query(checkQuery, [viewName]);
    
    if (!checkResult.rows[0].exists) {
      return res.status(404).json({ 
        success: false, 
        error: `View de consumo por veículo para posto ${postoName} não encontrada.` 
      });
    }
    
    // Obter dados da view
    const dataQuery = `SELECT * FROM "${viewName}" ORDER BY total_litros DESC LIMIT 20`;
    const result = await pool.query(dataQuery);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount,
      posto: postoName
    });
  } catch (error) {
    console.error(`Erro ao consultar consumo por veículo para posto ${req.params.posto}:`, error);
    res.status(500).json({ 
      success: false, 
      error: `Erro ao consultar consumo por veículo: ${error.message}` 
    });
  }
}

// Função para obter comparativo entre diesel e ARLA
export async function getComparativoCombustiveisPosto(req, res) {
  try {
    // Forçar o Content-Type como application/json para evitar interceptação do Vite
    res.setHeader('Content-Type', 'application/json');
    
    // Verificação especial para Campinas V2
    let postoName = req.params.posto;
    
    console.log("getComparativoCombustiveisPosto - Posto solicitado:", postoName);
    
    // Caso especial para Campinas V2
    if (postoName.toLowerCase() === 'campinas_v2' || 
        postoName.toLowerCase().includes('campinas_v2') || 
        postoName.toLowerCase().includes('campinas v2')) {
      postoName = 'campinas_v2';
      console.log("getComparativoCombustiveisPosto - Identificado como Campinas V2");
    }
    // Caso especial para Osasco V2
    else if (postoName.toLowerCase() === 'osasco_v2' || 
        postoName.toLowerCase().includes('osasco_v2') || 
        postoName.toLowerCase().includes('osasco v2')) {
      postoName = 'osasco_v2';
      console.log("getComparativoCombustiveisPosto - Identificado como Osasco V2");
    }
    // Caso especial para ABC V2
    else if (postoName.toLowerCase() === 'abc_v2' || 
        postoName.toLowerCase().includes('abc_v2') || 
        postoName.toLowerCase().includes('abc v2')) {
      postoName = 'abc_v2';
      console.log("getComparativoCombustiveisPosto - Identificado como ABC V2");
    }
    // Caso especial para Alair V2
    else if (postoName.toLowerCase() === 'alair_v2' || 
        postoName.toLowerCase().includes('alair_v2') || 
        postoName.toLowerCase().includes('alair v2')) {
      postoName = 'alair_v2';
      console.log("getComparativoCombustiveisPosto - Identificado como Alair V2");
    }
    // Caso especial para Guarulhos V2
    else if (postoName.toLowerCase() === 'guarulhos_v2' || 
        postoName.toLowerCase().includes('guarulhos_v2') || 
        postoName.toLowerCase().includes('guarulhos v2')) {
      postoName = 'guarulhos_v2';
      console.log("getComparativoCombustiveisPosto - Identificado como Guarulhos V2");
    }
    // Caso especial para Socorro V2
    else if (postoName.toLowerCase() === 'socorro_v2' || 
        postoName.toLowerCase().includes('socorro_v2') || 
        postoName.toLowerCase().includes('socorro v2')) {
      postoName = 'socorro_v2';
      console.log("getComparativoCombustiveisPosto - Identificado como Socorro V2");
    }
    // Caso especial para Sorocaba V2
    else if (postoName.toLowerCase() === 'sorocaba_v2' || 
        postoName.toLowerCase().includes('sorocaba_v2') || 
        postoName.toLowerCase().includes('sorocaba v2')) {
      postoName = 'sorocaba_v2';
      console.log("getComparativoCombustiveisPosto - Identificado como Sorocaba V2");
    }
    // Caso especial para Osasco
    else if (postoName.toLowerCase() === 'osasco' || 
        postoName.toLowerCase().includes('osasco')) {
      postoName = 'osasco';
      console.log("getComparativoCombustiveisPosto - Identificado como Osasco");
    } 
    else {
      postoName = formatPostoName(postoName);
      console.log("getComparativoCombustiveisPosto - Formatado para:", postoName);
    }
    
    const viewName = `abastecimentos_posto_${postoName.toLowerCase()}_comparativo_combustiveis`;
    
    // Verificar se a view existe
    const checkQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      ) as "exists";
    `;
    
    const checkResult = await pool.query(checkQuery, [viewName]);
    
    if (!checkResult.rows[0].exists) {
      return res.status(404).json({ 
        success: false, 
        error: `View de comparativo de combustíveis para posto ${postoName} não encontrada.` 
      });
    }
    
    // Obter dados da view
    const dataQuery = `SELECT * FROM "${viewName}"`;
    const result = await pool.query(dataQuery);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount,
      posto: postoName
    });
  } catch (error) {
    console.error(`Erro ao consultar comparativo de combustíveis para posto ${req.params.posto}:`, error);
    res.status(500).json({ 
      success: false, 
      error: `Erro ao consultar comparativo de combustíveis: ${error.message}` 
    });
  }
}

// Função para verificar se a tabela existe
export async function checkTabelaPosto(req, res) {
  try {
    // Forçar o Content-Type como application/json para evitar interceptação do Vite
    res.setHeader('Content-Type', 'application/json');
    
    // Verificação especial para Campinas V2
    let postoName = req.params.posto;
    
    console.log("checkTabelaPosto - Posto solicitado:", postoName);
    
    // Caso especial para Campinas V2
    if (postoName.toLowerCase() === 'campinas_v2' || 
        postoName.toLowerCase().includes('campinas_v2') || 
        postoName.toLowerCase().includes('campinas v2')) {
      postoName = 'campinas_v2';
      console.log("checkTabelaPosto - Identificado como Campinas V2");
    }
    // Caso especial para Osasco V2
    else if (postoName.toLowerCase() === 'osasco_v2' || 
        postoName.toLowerCase().includes('osasco_v2') || 
        postoName.toLowerCase().includes('osasco v2')) {
      postoName = 'osasco_v2';
      console.log("checkTabelaPosto - Identificado como Osasco V2");
    }
    // Caso especial para ABC V2
    else if (postoName.toLowerCase() === 'abc_v2' || 
        postoName.toLowerCase().includes('abc_v2') || 
        postoName.toLowerCase().includes('abc v2')) {
      postoName = 'abc_v2';
      console.log("checkTabelaPosto - Identificado como ABC V2");
    }
    // Caso especial para Alair V2
    else if (postoName.toLowerCase() === 'alair_v2' || 
        postoName.toLowerCase().includes('alair_v2') || 
        postoName.toLowerCase().includes('alair v2')) {
      postoName = 'alair_v2';
      console.log("checkTabelaPosto - Identificado como Alair V2");
    }
    // Caso especial para Guarulhos V2
    else if (postoName.toLowerCase() === 'guarulhos_v2' || 
        postoName.toLowerCase().includes('guarulhos_v2') || 
        postoName.toLowerCase().includes('guarulhos v2')) {
      postoName = 'guarulhos_v2';
      console.log("checkTabelaPosto - Identificado como Guarulhos V2");
    }
    // Caso especial para Socorro V2
    else if (postoName.toLowerCase() === 'socorro_v2' || 
        postoName.toLowerCase().includes('socorro_v2') || 
        postoName.toLowerCase().includes('socorro v2')) {
      postoName = 'socorro_v2';
      console.log("checkTabelaPosto - Identificado como Socorro V2");
    }
    // Caso especial para Sorocaba V2
    else if (postoName.toLowerCase() === 'sorocaba_v2' || 
        postoName.toLowerCase().includes('sorocaba_v2') || 
        postoName.toLowerCase().includes('sorocaba v2')) {
      postoName = 'sorocaba_v2';
      console.log("checkTabelaPosto - Identificado como Sorocaba V2");
    }
    // Caso especial para Osasco
    else if (postoName.toLowerCase() === 'osasco' || 
        postoName.toLowerCase().includes('osasco')) {
      postoName = 'osasco';
      console.log("checkTabelaPosto - Identificado como Osasco");
    } 
    else {
      postoName = formatPostoName(postoName);
      console.log("checkTabelaPosto - Formatado para:", postoName);
    }
    
    const tableName = `abastecimentos_posto_${postoName.toLowerCase()}`;
    
    // Verificar se a tabela existe
    const tableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      ) as "exists";
    `;
    
    const tableResult = await pool.query(tableQuery, [tableName]);
    
    // Verificar se a view consolidada existe
    const viewName = `abastecimentos_posto_${postoName.toLowerCase()}_consolidado`;
    const viewQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      ) as "exists";
    `;
    
    const viewResult = await pool.query(viewQuery, [viewName]);
    
    res.json({
      success: true,
      data: {
        table: tableResult.rows[0].exists,
        view: viewResult.rows[0].exists,
        tableName,
        viewName
      }
    });
  } catch (error) {
    console.error('Erro ao verificar tabela de posto:', error);
    res.status(500).json({ 
      success: false, 
      error: `Erro ao verificar tabela: ${error.message}` 
    });
  }
}

// Função para registrar abastecimento em um posto específico
export async function registrarAbastecimentoPosto(req, res) {
  try {
    // Forçar o Content-Type como application/json para evitar interceptação do Vite
    res.setHeader('Content-Type', 'application/json');
    
    // Preservar exatamente o nome do posto recebido para garantir que seja processado corretamente
    // Isso é crítico para distinguir entre campinas e campinas_v2
    let postoName = req.params.posto;
    
    console.log("Posto original recebido:", postoName);
    
    // Verificação explícita para Campinas V2
    if (postoName.toLowerCase() === 'campinas_v2' || 
        postoName.toLowerCase().includes('campinas_v2') || 
        postoName.toLowerCase().includes('campinas v2')) {
      postoName = 'campinas_v2';
      console.log("Posto identificado como Campinas V2");
    }
    // Verificação explícita para Osasco V2
    else if (postoName.toLowerCase() === 'osasco_v2' || 
        postoName.toLowerCase().includes('osasco_v2') || 
        postoName.toLowerCase().includes('osasco v2')) {
      postoName = 'osasco_v2';
      console.log("Posto identificado como Osasco V2");
    }
    // Verificação explícita para ABC V2
    else if (postoName.toLowerCase() === 'abc_v2' || 
        postoName.toLowerCase().includes('abc_v2') || 
        postoName.toLowerCase().includes('abc v2')) {
      postoName = 'abc_v2';
      console.log("Posto identificado como ABC V2");
    }
    // Verificação explícita para Alair V2
    else if (postoName.toLowerCase() === 'alair_v2' || 
        postoName.toLowerCase().includes('alair_v2') || 
        postoName.toLowerCase().includes('alair v2')) {
      postoName = 'alair_v2';
      console.log("Posto identificado como Alair V2");
    }
    // Verificação explícita para Guarulhos V2
    else if (postoName.toLowerCase() === 'guarulhos_v2' || 
        postoName.toLowerCase().includes('guarulhos_v2') || 
        postoName.toLowerCase().includes('guarulhos v2')) {
      postoName = 'guarulhos_v2';
      console.log("Posto identificado como Guarulhos V2");
    }
    // Verificação explícita para Socorro V2
    else if (postoName.toLowerCase() === 'socorro_v2' || 
        postoName.toLowerCase().includes('socorro_v2') || 
        postoName.toLowerCase().includes('socorro v2')) {
      postoName = 'socorro_v2';
      console.log("Posto identificado como Socorro V2");
    }
    // Verificação explícita para Sorocaba V2
    else if (postoName.toLowerCase() === 'sorocaba_v2' || 
        postoName.toLowerCase().includes('sorocaba_v2') || 
        postoName.toLowerCase().includes('sorocaba v2')) {
      postoName = 'sorocaba_v2';
      console.log("Posto identificado como Sorocaba V2");
    }
    // Verificação explícita para Osasco
    else if (postoName.toLowerCase() === 'osasco' || 
        postoName.toLowerCase().includes('osasco')) {
      postoName = 'osasco';
      console.log("Posto identificado como Osasco");
    } 
    else {
      postoName = formatPostoName(postoName);
      console.log("Posto formatado para:", postoName);
    }
    
    const tableName = `abastecimentos_posto_${postoName.toLowerCase()}`;
    
    console.log(`Tentando registrar abastecimento na tabela ${tableName}`);
    console.log('Dados recebidos:', req.body);
    
    // Verificar se a tabela existe
    const checkQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      ) as "exists";
    `;
    
    const checkResult = await pool.query(checkQuery, [tableName]);
    
    if (!checkResult.rows[0].exists) {
      return res.status(404).json({ 
        success: false, 
        error: `Tabela de abastecimentos para posto ${postoName} não encontrada.` 
      });
    }
    
    // Extrair os campos do corpo da requisição
    // Usando COALESCE para tratar diferentes nomes de campos
    const {
      placa, 
      km_atual,
      hodometro_atual = km_atual, // Fallback para km_atual se hodometro_atual não for fornecido
      tipo_combustivel = req.body.tipo || 'Diesel',
      litros = req.body.quantidade_litros || req.body.quantidade || req.body.quantity_litros,
      valor_litro = req.body.preco_litro,
      valor_total,
      motorista = req.body.nome_motorista || req.body.motorista_nome,
      motorista_rg = req.body.rg_motorista,
      operador = req.body.nome_operador,
      observacoes = req.body.observacao,
      tipo_veiculo = req.body.tipo_veiculo || 'frota',
      lavagem = req.body.lavagem || false,
      tipo_lavagem = req.body.tipo_lavagem
    } = req.body;
    
    // Validar campos obrigatórios
    if (!placa || !litros) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: placa e litros (ou quantidade_litros)'
      });
    }
    
    // Calcular valor total se não for fornecido
    const calculatedValorTotal = valor_total || (valor_litro && litros 
      ? parseFloat(valor_litro) * parseFloat(litros) 
      : 0);
    
    // Verificar se estamos lidando com postos V2
    const isV2Posto = ['osasco_v2', 'campinas_v2', 'abc_v2', 'socorro_v2', 'sorocaba_v2', 'alair_v2', 'guarulhos_v2'].includes(postoName.toLowerCase());
    
    // Adaptação para os postos V2 - diferentes campos na tabela
    if (isV2Posto) {
      // Verificar primeiro quais colunas existem na tabela para construir a query dinamicamente
      const columnsQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1
      `;
      
      console.log(`Verificando colunas existentes na tabela ${tableName} antes de inserir`);
      const columnsResult = await pool.query(columnsQuery, [tableName]);
      const tableColumns = columnsResult.rows.map(row => row.column_name);
      
      console.log(`Colunas disponíveis em ${tableName} para inserção:`, tableColumns);
      
      // Construir dinamicamente os campos e valores para inserção
      const insertFields = [];
      const insertValues = [];
      const placeholders = [];
      let paramIndex = 1;
      
      // Sempre incluir a placa
      insertFields.push('placa');
      insertValues.push(placa.toUpperCase());
      placeholders.push(`$${paramIndex++}`);
      
      // Verificar e adicionar km_atual se a coluna existir
      if (tableColumns.includes('km_atual')) {
        insertFields.push('km_atual');
        insertValues.push(km_atual ? parseInt(km_atual, 10) : null);
        placeholders.push(`$${paramIndex++}`);
      }
      
      // Verificar e adicionar hodometro_atual se a coluna existir
      if (tableColumns.includes('hodometro_atual')) {
        insertFields.push('hodometro_atual');
        insertValues.push(hodometro_atual ? parseInt(hodometro_atual, 10) : null);
        placeholders.push(`$${paramIndex++}`);
      }
      
      // Adicionar outros campos verificando se existem na tabela
      const fieldsToAdd = [
        { name: 'tipo_combustivel', value: tipo_combustivel },
        { name: 'litros', value: litros ? parseFloat(litros) : null },
        { name: 'motorista', value: motorista },
        { name: 'motorista_rg', value: motorista_rg },
        { name: 'operador', value: operador },
        { name: 'valor_litro', value: valor_litro ? parseFloat(valor_litro) : null },
        { name: 'valor_total', value: calculatedValorTotal },
        { name: 'tipo_veiculo', value: tipo_veiculo },
        { name: 'observacoes', value: observacoes },
        { name: 'lavagem', value: lavagem === true },
        { name: 'tipo_lavagem', value: tipo_lavagem }
      ];
      
      fieldsToAdd.forEach(field => {
        if (tableColumns.includes(field.name)) {
          insertFields.push(field.name);
          insertValues.push(field.value);
          placeholders.push(`$${paramIndex++}`);
        }
      });
      
      // Sempre adicionar created_at
      insertFields.push('created_at');
      placeholders.push('(NOW() AT TIME ZONE \'America/Sao_Paulo\')');
      
      const insertQueryV2 = `
        INSERT INTO "${tableName}" (
          ${insertFields.join(', ')}
        ) VALUES (
          ${placeholders.join(', ')}
        ) RETURNING *
      `;
      
      const valuesV2 = insertValues;
      
      console.log('Query SQL V2 a ser executada:', insertQueryV2);
      console.log('Valores V2:', valuesV2);
      
      const result = await pool.query(insertQueryV2, valuesV2);
      
      if (result.rows.length === 0) {
        throw new Error('Falha ao inserir registro de abastecimento');
      }
      
      // Continuar com a atualização do tanque...
      try {
        console.log(`Atualizando nível do tanque para ${postoName} após abastecimento de ${litros} litros`);
        
        // Verificar primeiramente se existe uma tabela de configuração específica para este posto
        const configTableName = `configuracao_tanques_${postoName.toLowerCase()}`;
        const checkConfigTable = `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          ) as "exists";
        `;
        
        const configTableResult = await pool.query(checkConfigTable, [configTableName]);
        const hasSpecificConfigTable = configTableResult.rows[0].exists;
        
        console.log(`Verificando existência de tabela específica ${configTableName}: ${hasSpecificConfigTable ? 'Existe' : 'Não existe'}`);
        
        if (hasSpecificConfigTable) {
          // Usar tabela específica de configuração para este posto
          if (tipo_combustivel.toLowerCase() === 'arla') {
            // Query específica para postos com configuração de tanque própria
            await pool.query(`
              UPDATE ${configTableName}
              SET nivel_atual = GREATEST(0, nivel_atual - $1)
              WHERE tipo_combustivel = 'ARLA'
            `, [parseFloat(litros)]);
            
            console.log(`Tanque de ARLA atualizado em ${configTableName}: -${litros} litros`);
          } else {
            // Query específica para postos com configuração de tanque própria (DIESEL ou outro)
            await pool.query(`
              UPDATE ${configTableName}
              SET nivel_atual = GREATEST(0, nivel_atual - $1)
              WHERE tipo_combustivel = 'DIESEL'
            `, [parseFloat(litros)]);
            
            console.log(`Tanque de ${tipo_combustivel} atualizado em ${configTableName}: -${litros} litros`);
          }
        } else {
          // Usar tabela genérica de configuração
          if (tipo_combustivel.toLowerCase() === 'arla') {
            // Se for ARLA, diminui o nível do tanque de ARLA e incrementa consumo total
            await pool.query(`
              UPDATE configuracao_tanques 
              SET arla_nivel = GREATEST(0, arla_nivel - $1),
                  arla_consumo_total = COALESCE(arla_consumo_total, 0) + $1,
                  arla_valor_total = COALESCE(arla_valor_total, 0) + $2,
                  updated_at = (NOW() AT TIME ZONE 'America/Sao_Paulo')
              WHERE posto = $3
            `, [parseFloat(litros), calculatedValorTotal, postoName]);
            
            console.log(`Tanque de ARLA atualizado na configuracao_tanques: -${litros} litros, +${calculatedValorTotal} valor total`);
          } else {
            // Se for Diesel ou outro combustível, diminui o nível do tanque de diesel e incrementa consumo total
            await pool.query(`
              UPDATE configuracao_tanques 
              SET diesel_nivel = GREATEST(0, diesel_nivel - $1),
                  diesel_consumo_total = COALESCE(diesel_consumo_total, 0) + $1,
                  diesel_valor_total = COALESCE(diesel_valor_total, 0) + $2,
                  updated_at = (NOW() AT TIME ZONE 'America/Sao_Paulo')
              WHERE posto = $3
            `, [parseFloat(litros), calculatedValorTotal, postoName]);
            
            console.log(`Tanque de Diesel atualizado na configuracao_tanques: -${litros} litros, +${calculatedValorTotal} valor total`);
          }
        }
        
        console.log('Atualização de tanque concluída!');
        
        return res.status(201).json({
          success: true,
          message: `Abastecimento registrado com sucesso para posto ${postoName}`,
          data: result.rows[0]
        });
      } catch (updateError) {
        console.error('Erro ao atualizar tanque:', updateError);
        // Mesmo se houver erro no tanque, o abastecimento foi registrado
        return res.status(201).json({
          success: true,
          warning: 'Abastecimento registrado mas houve erro ao atualizar o tanque',
          message: `Abastecimento registrado com sucesso para posto ${postoName}, mas falha ao atualizar o tanque`,
          data: result.rows[0]
        });
      }
    }
    
    // Versão original para postos não V2
    const insertQuery = `
      INSERT INTO "${tableName}" (
        placa,
        km_atual,
        hodometro_atual,
        tipo_combustivel,
        litros,
        quantidade_litros,
        quantity_litros,
        valor_litro,
        valor_total,
        motorista,
        motorista_nome,
        nome_motorista,
        motorista_rg,
        rg_motorista,
        operador,
        nome_operador,
        tipo_veiculo,
        observacoes,
        lavagem,
        tipo_lavagem,
        created_at,
        data_registro
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, (NOW() AT TIME ZONE 'America/Sao_Paulo'), (NOW() AT TIME ZONE 'America/Sao_Paulo')
      ) RETURNING *
    `;
    
    const values = [
      placa.toUpperCase(),
      km_atual ? parseInt(km_atual, 10) : null,
      hodometro_atual ? parseInt(hodometro_atual, 10) : null,
      tipo_combustivel,
      litros ? parseFloat(litros) : null,
      litros ? parseFloat(litros) : null, // quantidade_litros é o mesmo que litros
      litros ? parseFloat(litros) : null, // quantity_litros é o mesmo que litros
      valor_litro ? parseFloat(valor_litro) : null,
      calculatedValorTotal,
      motorista, // campo motorista
      motorista, // campo motorista_nome 
      motorista, // campo nome_motorista
      motorista_rg, // campo motorista_rg
      motorista_rg, // campo rg_motorista
      operador, // campo operador
      operador, // campo nome_operador
      tipo_veiculo,
      observacoes,
      lavagem,
      tipo_lavagem
    ];
    
    console.log('Query SQL a ser executada:', insertQuery);
    console.log('Valores:', values);
    
    const result = await pool.query(insertQuery, values);
    
    if (result.rows.length === 0) {
      throw new Error('Falha ao inserir registro de abastecimento');
    }
    
    // Atualizar níveis de tanque após abastecimento
    try {
      console.log(`Atualizando nível do tanque para ${postoName} após abastecimento de ${litros} litros`);
      
      if (tipo_combustivel.toLowerCase() === 'arla') {
        // Se for ARLA, diminui o nível do tanque de ARLA e incrementa consumo total
        await pool.query(`
          UPDATE configuracao_tanques 
          SET arla_nivel = GREATEST(0, arla_nivel - $1),
              arla_consumo_total = COALESCE(arla_consumo_total, 0) + $1,
              arla_valor_total = COALESCE(arla_valor_total, 0) + $2,
              updated_at = (NOW() AT TIME ZONE 'America/Sao_Paulo')
          WHERE posto = $3
        `, [parseFloat(litros), calculatedValorTotal, postoName]);
        
        console.log(`Tanque de ARLA atualizado: -${litros} litros, +${calculatedValorTotal} valor total`);
      } else {
        // Se for Diesel ou outro combustível, diminui o nível do tanque de diesel e incrementa consumo total
        await pool.query(`
          UPDATE configuracao_tanques 
          SET diesel_nivel = GREATEST(0, diesel_nivel - $1),
              diesel_consumo_total = COALESCE(diesel_consumo_total, 0) + $1,
              diesel_valor_total = COALESCE(diesel_valor_total, 0) + $2,
              updated_at = (NOW() AT TIME ZONE 'America/Sao_Paulo')
          WHERE posto = $3
        `, [parseFloat(litros), calculatedValorTotal, postoName]);
        
        console.log(`Tanque de Diesel atualizado: -${litros} litros, +${calculatedValorTotal} valor total`);
      }
      
      // Verificar se os campos de consumo e valor total existem, caso contrário, adicionar
      const checkColumnsQuery = `
        SELECT 
          column_name 
        FROM 
          information_schema.columns 
        WHERE 
          table_name = 'configuracao_tanques' AND 
          (column_name = 'diesel_consumo_total' OR 
           column_name = 'diesel_valor_total' OR 
           column_name = 'arla_consumo_total' OR 
           column_name = 'arla_valor_total')
      `;
      
      const columnResult = await pool.query(checkColumnsQuery);
      const existingColumns = columnResult.rows.map(row => row.column_name);
      
      if (!existingColumns.includes('diesel_consumo_total') || 
          !existingColumns.includes('diesel_valor_total') || 
          !existingColumns.includes('arla_consumo_total') || 
          !existingColumns.includes('arla_valor_total')) {
        
        console.log('Adicionando colunas de consumo total e valor total à tabela configuracao_tanques');
        
        // Criar as colunas que não existem
        const alterTableQuery = `
          ALTER TABLE configuracao_tanques
          ${!existingColumns.includes('diesel_consumo_total') ? 'ADD COLUMN IF NOT EXISTS diesel_consumo_total NUMERIC(12, 2) DEFAULT 0,' : ''}
          ${!existingColumns.includes('diesel_valor_total') ? 'ADD COLUMN IF NOT EXISTS diesel_valor_total NUMERIC(12, 2) DEFAULT 0,' : ''}
          ${!existingColumns.includes('arla_consumo_total') ? 'ADD COLUMN IF NOT EXISTS arla_consumo_total NUMERIC(12, 2) DEFAULT 0,' : ''}
          ${!existingColumns.includes('arla_valor_total') ? 'ADD COLUMN IF NOT EXISTS arla_valor_total NUMERIC(12, 2) DEFAULT 0' : ''}
        `.replace(/,\s*$/, ''); // Remove a última vírgula se houver
        
        await pool.query(alterTableQuery);
      }
    } catch (tankUpdateError) {
      console.error(`Erro ao atualizar nível do tanque: ${tankUpdateError.message}`);
      console.error(tankUpdateError.stack);
      // Não impede o fluxo principal se houver erro no update do tanque
    }
    
    res.status(201).json({
      success: true,
      message: `Abastecimento registrado com sucesso para ${postoName}`,
      data: result.rows[0]
    });
  } catch (error) {
    console.error(`Erro ao registrar abastecimento para posto ${req.params.posto}:`, error);
    res.status(500).json({ 
      success: false, 
      error: `Erro ao registrar abastecimento: ${error.message}` 
    });
  }
}
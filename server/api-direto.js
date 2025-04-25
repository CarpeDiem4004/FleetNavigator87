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
    
    // Caso especial para Campinas V2, Osasco, Osasco V2, ABC V2 e Alair V2: usar tabela diretamente em vez de view
    let querySource;
    let dataQuery;
    
    if (postoName.toLowerCase() === 'campinas_v2' || postoName.toLowerCase() === 'osasco' || postoName.toLowerCase() === 'osasco_v2' || postoName.toLowerCase() === 'abc_v2' || postoName.toLowerCase() === 'alair_v2') {
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
      dataQuery = `
        SELECT 
          id,
          placa,
          km_atual as km,
          tipo_combustivel,
          litros as quantidade_litros,
          motorista as nome_motorista,
          motorista_rg as rg_motorista,
          operador as nome_operador,
          valor_litro,
          valor_total,
          tipo_veiculo,
          observacoes,
          lavagem,
          tipo_lavagem,
          to_char(created_at, 'DD/MM/YYYY HH24:MI') as data_hora,
          created_at
        FROM ${tableName}
        ORDER BY created_at DESC
        LIMIT ${req.query.limit || 50}
      `;
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
    
    // Montar a query de inserção
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
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW(), NOW()
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
        // Se for ARLA, diminui o nível do tanque de ARLA
        await pool.query(`
          UPDATE configuracao_tanques 
          SET arla_nivel = GREATEST(0, arla_nivel - $1), 
              updated_at = NOW()
          WHERE posto = $2
        `, [parseFloat(litros), postoName]);
      } else {
        // Se for Diesel ou outro combustível, diminui o nível do tanque de diesel
        await pool.query(`
          UPDATE configuracao_tanques 
          SET diesel_nivel = GREATEST(0, diesel_nivel - $1), 
              updated_at = NOW()
          WHERE posto = $2
        `, [parseFloat(litros), postoName]);
      }
    } catch (tankUpdateError) {
      console.error(`Erro ao atualizar nível do tanque: ${tankUpdateError.message}`);
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
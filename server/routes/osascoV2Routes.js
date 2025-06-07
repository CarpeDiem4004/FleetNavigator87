/**
 * Rotas especializadas para o posto Osasco V2
 * 
 * Este arquivo contém rotas otimizadas para o posto Osasco V2 que
 * garantem o uso correto do campo "projeto".
 */

import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// Rota otimizada para histórico de Osasco V2
router.get('/historico', async (req, res) => {
  try {
    // Consulta SQL otimizada para Osasco V2 que garante o uso do campo projeto
    const query = `
      SELECT 
        id,
        placa,
        km_atual as km,
        hodometro_atual,
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
        COALESCE(projeto, 'Não definido') as projeto,
        to_char(created_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') as data_hora,
        created_at
      FROM abastecimentos_posto_osasco_v2
      ORDER BY created_at DESC
    `;
    
    console.log("[OsascoV2] Executando consulta especializada de histórico");
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    console.error("[OsascoV2] Erro ao consultar histórico especializado:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Erro ao consultar histórico especializado" 
    });
  }
});

// Rota para salvar abastecimento no posto Osasco V2
router.post('/abastecimento', async (req, res) => {
  try {
    const dados = req.body;
    
    // Preparar os dados necessários para a inserção
    const dadosInserir = {
      placa: dados.placa.toUpperCase(),
      km_atual: Number(dados.km_atual || dados.km || 0),
      hodometro_atual: Number(dados.hodometro_atual || 0),
      tipo_combustivel: dados.tipo_combustivel || dados.tipo || 'Diesel',
      litros: Number(dados.quantidade_litros || dados.litros || dados.quantidade || 0),
      valor_litro: Number(dados.valor_litro || dados.preco_litro || 0),
      valor_total: Number(dados.valor_total || 0),
      motorista: dados.motorista || dados.nome_motorista || 'Não informado',
      motorista_rg: dados.rg_motorista || dados.motorista_rg || 'Não informado',
      operador: dados.operador || dados.nome_operador || 'Sistema',
      // Garantir que o projeto seja salvo corretamente, incluindo valor padrão específico
      projeto: dados.projeto || dados.project || 'PROJETO NÃO INFORMADO',
      base_id: dados.base_id ? Number(dados.base_id) : null,
      base_name: dados.base_name || null,
      tipo_veiculo: dados.tipo_veiculo || 'frota',
      observacoes: dados.observacoes || null,
      lavagem: dados.lavagem === true,
      tipo_lavagem: dados.tipo_lavagem || null
    };
    
    // Verificar se o projeto está vazio e definir um valor explícito
    if (!dadosInserir.projeto || dadosInserir.projeto.trim() === '') {
      dadosInserir.projeto = 'PROJETO NÃO INFORMADO';
      console.log('[OsascoV2] Projeto vazio, definindo valor padrão:', dadosInserir.projeto);
    }
    
    console.log('[OsascoV2] Dados que serão inseridos:', dadosInserir);
    
    // Consulta SQL para inserção com os campos projeto, base_id e base_name
    const query = `
      INSERT INTO abastecimentos_posto_osasco_v2 (
        placa, km_atual, hodometro_atual, tipo_combustivel, litros,
        valor_litro, valor_total, motorista, motorista_rg,
        operador, projeto, base_id, base_name, tipo_veiculo, observacoes, lavagem, tipo_lavagem, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 
        NOW() at time zone 'America/Sao_Paulo'
      ) RETURNING *
    `;
    
    const values = [
      dadosInserir.placa,
      dadosInserir.km_atual,
      dadosInserir.hodometro_atual,
      dadosInserir.tipo_combustivel,
      dadosInserir.litros,
      dadosInserir.valor_litro,
      dadosInserir.valor_total,
      dadosInserir.motorista,
      dadosInserir.motorista_rg,
      dadosInserir.operador,
      dadosInserir.projeto,
      dadosInserir.base_id,
      dadosInserir.base_name,
      dadosInserir.tipo_veiculo,
      dadosInserir.observacoes,
      dadosInserir.lavagem,
      dadosInserir.tipo_lavagem
    ];
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('Falha ao inserir registro de abastecimento');
    }
    
    // Atualizar o nível do tanque (opcional)
    try {
      console.log(`[OsascoV2] Atualizando nível do tanque após abastecimento de ${dadosInserir.litros} litros`);
      
      const updateQuery = `
        UPDATE configuracao_tanques 
        SET diesel_nivel = GREATEST(0, diesel_nivel - $1),
            diesel_consumo_total = COALESCE(diesel_consumo_total, 0) + $1,
            diesel_valor_total = COALESCE(diesel_valor_total, 0) + $2,
            updated_at = (NOW() AT TIME ZONE 'America/Sao_Paulo')
        WHERE posto = 'Osasco_v2'
      `;
      
      await pool.query(updateQuery, [dadosInserir.litros, dadosInserir.valor_total]);
    } catch (tanqueError) {
      console.warn('[OsascoV2] Erro ao atualizar tanque, mas abastecimento foi registrado:', tanqueError);
    }
    
    res.json({
      success: true,
      message: 'Abastecimento registrado com sucesso para Osasco V2',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('[OsascoV2] Erro ao registrar abastecimento:', error);
    res.status(500).json({ 
      success: false, 
      error: `Erro ao registrar abastecimento: ${error.message}` 
    });
  }
});

// Rota para recebimentos do posto Osasco V2
router.get('/recebimentos', async (req, res) => {
  try {
    // Verificar se a tabela recebimentos_posto_osasco_v2 existe
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'recebimentos_posto_osasco_v2'
      );
    `;
    
    const tableCheck = await pool.query(checkTableQuery);
    const tableExists = tableCheck.rows[0].exists;
    
    if (!tableExists) {
      // Se a tabela não existir, retornar uma lista vazia com mensagem amigável
      return res.json({
        success: true,
        message: "Tabela de recebimentos ainda não configurada para este posto",
        data: [],
        count: 0
      });
    }
    
    // Consulta SQL para recebimentos do posto Osasco V2
    const query = `
      SELECT 
        id,
        placa,
        tipo_combustivel,
        quantidade_litros,
        valor_litro,
        valor_total,
        motorista,
        operador,
        observacoes,
        projeto,
        to_char(created_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') as data_hora,
        created_at
      FROM recebimentos_posto_osasco_v2
      ORDER BY created_at DESC
      LIMIT ${req.query.limit || 50}
    `;
    
    console.log("[OsascoV2] Executando consulta especializada de recebimentos");
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    console.error("[OsascoV2] Erro ao consultar recebimentos:", error);
    
    // Retornar uma resposta de sucesso com dados vazios para evitar quebra da interface
    res.json({ 
      success: true, 
      message: "Tabela de recebimentos não disponível ou erro na consulta",
      data: [],
      count: 0
    });
  }
});

// Exportar o router para ser usado em routes.ts
export default router;
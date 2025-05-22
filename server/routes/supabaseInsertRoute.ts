import { createClient } from "@supabase/supabase-js";
import { Request, Response } from "express";
import { pool } from "../db";

// Nova versão da função de inserção no Supabase
export async function supabaseInsertHandler(req: Request, res: Response) {
  try {
    const { table, data } = req.body;
    
    if (!table || !data) {
      return res.status(400).json({
        success: false,
        message: "Parâmetros 'table' e 'data' são obrigatórios"
      });
    }
    
    // Verifica se é uma solicitação relacionada a postos ou Posto Remédios
    const posto = req.body.posto;
    const isPostoRequest = table === 'abastecimentos' || 
                          table === 'abastecimentos_supabase' || 
                          posto === 'POSTO REMÉDIOS';
    
    if (isPostoRequest) {
      console.log(`Permitindo inserção relacionada a posto (${posto || table}) sem verificação de autenticação`);
      // Continua o processamento mesmo sem autenticação para postos
    } else {
      // Para outras tabelas, ainda exigimos autenticação
      if (!req.isAuthenticated()) {
        console.log(`Requisição não autenticada rejeitada para tabela ${table}`);
        return res.status(401).json({
          success: false,
          message: "Não autenticado"
        });
      }
    }
    
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({
        success: false,
        message: "Configuração do Supabase não encontrada no servidor"
      });
    }
    
    // Log para debug
    console.log("Inicializando cliente Supabase para inserção...");
    console.log("SUPABASE_URL disponível:", !!process.env.SUPABASE_URL);
    console.log("SUPABASE_SERVICE_ROLE_KEY disponível:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    // Inicializa o Supabase com a chave de serviço do servidor
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false
        }
      }
    );
  
    console.log(`Inserindo dados na tabela ${table} via servidor...`);
    
    // Se for o Posto Remédios, precisamos de uma lógica especial
    let insertedData;
    let error;
    
    if (posto === 'POSTO REMÉDIOS') {
      console.log("Detectado pedido do Posto Remédios, usando tabela posto_remedios_abastecimentos");
      try {
        // Para Posto Remédios, inserimos na tabela específica do PostgreSQL
        const query = `
          INSERT INTO posto_remedios_abastecimentos
          (placa, km, projeto, motorista_nome, motorista_rg, tipo_combustivel, quantidade_litros, valor_litro, valor_total, lavagem, tipo_lavagem, observacoes, tipo_veiculo)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING *
        `;
        
        const values = [
          data.placa,
          data.km,
          data.projeto,
          data.motorista_nome,
          data.motorista_rg,
          data.tipo_combustivel || null,
          data.quantidade_litros || null,
          data.valor_litro || null,
          data.valor_total || null,
          data.lavagem || false,
          data.tipo_lavagem || null,
          data.observacoes || null,
          data.tipo_veiculo || 'frota'
        ];
        
        const result = await pool.query(query, values);
        insertedData = result.rows;
        
        // Também inserimos no Supabase para sincronização
        console.log("Inserindo dados do Posto Remédios também no Supabase para sincronização");
        await supabase
          .from('abastecimentos_supabase')
          .insert([{
            placa: data.placa.toUpperCase(),
            km: data.km,
            tipo_combustivel: data.tipo_combustivel || 'diesel',
            quantidade_litros: data.quantidade_litros || 0,
            nome_motorista: data.motorista_nome,
            nome_operador: 'Sistema Posto Remédios',
            posto_id: 'POSTO REMÉDIOS',
            projeto: data.projeto,
            preco_litro: data.valor_litro || 0,
            valor_total: data.valor_total || 0,
            rg_motorista: data.motorista_rg || 'Não informado'
          }]);
          
      } catch (err: any) {
        console.error("Erro ao inserir dados do Posto Remédios:", err);
        error = { 
          message: err.message || "Erro desconhecido ao inserir dados do Posto Remédios"
        };
      }
    } else {
      // Para outras tabelas, usamos a inserção padrão do Supabase
      // Adicionar mais logs para diagnóstico detalhado
      console.log(`Tentando inserir dados na tabela ${table} do Supabase com os seguintes dados:`, data);
      
      try {
        const result = await supabase
          .from(table)
          .insert([data])
          .select();
        
        // Log do resultado da inserção
        console.log(`Resultado da inserção na tabela ${table}:`, result);
        
        // Se não tiver dados retornados, pode ser um erro
        if (!result.data || result.data.length === 0) {
          console.warn(`Nenhum dado retornado após inserção na tabela ${table}, possível erro.`);
        }
        
        insertedData = result.data;
        error = result.error;
      } catch (insertError) {
        console.error(`Erro ao inserir na tabela ${table}:`, insertError);
        error = {
          message: insertError instanceof Error ? insertError.message : 'Erro desconhecido na inserção',
          details: JSON.stringify(insertError)
        };
      }
    }
    
    if (error) {
      console.error(`Erro ao inserir dados no Supabase (tabela ${table}):`, error);
      // Melhoria na mensagem de erro para evitar "undefined"
      const errorMessage = error.message 
        ? `Erro ao inserir dados: ${error.message}` 
        : `Erro ao inserir dados no Supabase (detalhes: ${JSON.stringify(error)})`;
      
      return res.status(500).json({
        success: false,
        message: errorMessage,
        error
      });
    }
    
    console.log(`Dados inseridos com sucesso na tabela ${table}`);
    return res.status(200).json({
      success: true,
      data: insertedData,
      message: `Dados inseridos com sucesso na tabela ${table}`
    });
  } catch (error: any) {
    console.error("Erro ao processar requisição de inserção no Supabase:", error);
    return res.status(500).json({
      success: false,
      message: `Erro ao processar requisição: ${error.message}`,
      error: String(error)
    });
  }
}
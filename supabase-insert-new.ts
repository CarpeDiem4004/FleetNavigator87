import { createClient } from "@supabase/supabase-js";
import { Request, Response } from "express";

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
    
    // Verifica se é uma solicitação de abastecimento de posto
    // Se for uma inserção na tabela de abastecimentos (qualquer versão), permitimos sem autenticação
    if (table === 'abastecimentos_postos' || table === 'abastecimentos_supabase') {
      console.log(`Permitindo inserção de abastecimento na tabela ${table} sem verificação de autenticação`);
      // Continua o processamento mesmo sem autenticação para tabelas de abastecimento
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
    
    // Faz a inserção usando a chave de serviço
    const { data: insertedData, error } = await supabase
      .from(table)
      .insert([data])
      .select();
    
    if (error) {
      console.error(`Erro ao inserir dados no Supabase (tabela ${table}):`, error);
      return res.status(500).json({
        success: false,
        message: `Erro ao inserir dados: ${error.message}`,
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
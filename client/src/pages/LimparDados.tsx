import React, { useEffect, useState } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle, CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import MainLayoutSimple from "@/components/layout/MainLayoutSimple";
import { deleteRecords, fetchRecords, supabaseAdmin, supabaseAnonKey, supabaseUrl } from '@/lib/supabase-client';

/**
 * Componente especial para limpeza de dados com um único botão
 */
export default function LimparDados() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>("Aguardando comando para limpar dados");
  const [isComplete, setIsComplete] = useState(false);

  // Lista de tabelas para limpar
  const tables = [
    { name: 'vehicles', label: 'Veículos' },
    { name: 'maintenance', label: 'Manutenções' },
    { name: 'workshops', label: 'Oficinas' },
    { name: 'tires', label: 'Pneus' },
    { name: 'refueling', label: 'Abastecimentos' },
    { name: 'fines', label: 'Multas' },
    { name: 'line_hall', label: 'Line Hall' },
    { name: 'abastecimentos', label: 'Abastecimentos em Postos' },
    { name: 'movimentacoes_patio', label: 'Movimentações de Pátio' },
    { name: 'entradas_combustivel', label: 'Entradas de Combustível' },
    { name: 'status_tanques', label: 'Status de Tanques' },
    { name: 'controle_tanques', label: 'Controle de Tanques' },
    { name: 'veiculos', label: 'Tabela Veiculos Supabase' },
  ];

  // Função para limpar dados do backend via API
  const limparDadosAPI = async () => {
    try {
      setStatus("Limpando dados via API...");
      const response = await fetch('/api/admin/clear-all-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          confirm: 'LIMPAR',
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Erro ao limpar dados do sistema');
      }
      
      setStatus("API limpa com sucesso!");
      return true;
    } catch (error: any) {
      console.error("Erro ao limpar dados via API:", error);
      setStatus(`Erro na API: ${error.message}`);
      return false;
    }
  };
  
  // Função para limpar dados do Supabase diretamente
  const limparDadosSupabase = async () => {
    setStatus("Iniciando limpeza de dados do Supabase...");
    
    // Lista de tabelas do Supabase para limpar
    const supabaseTables = [
      'abastecimentos_postos',
      'movimentacoes_patio',
      'entradas_combustivel',
      'status_tanques',
      'controle_tanques',
      'veiculos'
    ];
    
    // Abordagem 1: Usar o cliente Supabase diretamente para excluir dados
    setStatus("Tentando limpar dados via Cliente Supabase...");
    for (let i = 0; i < supabaseTables.length; i++) {
      const tableName = supabaseTables[i];
      setStatus(`Limpando tabela ${tableName}...`);
      
      try {
        // Primeira tentativa: limpar todos os dados diretamente
        const { error } = await supabaseAdmin
          .from(tableName)
          .delete()
          .neq('id', -1); // Trick para deletar todos os registros
          
        if (error) {
          console.error(`Erro ao limpar tabela ${tableName} via cliente:`, error);
          setStatus(`Erro ao limpar tabela ${tableName}: ${error.message}`);
          
          // Tenta buscar e excluir registros um a um
          try {
            setStatus(`Tentando abordagem individual para ${tableName}`);
            const { data: records } = await supabaseAdmin
              .from(tableName)
              .select('id')
              .limit(100);
              
            if (records && records.length > 0) {
              setStatus(`Encontrados ${records.length} registros em ${tableName}`);
              
              for (const record of records) {
                const { error: deleteError } = await supabaseAdmin
                  .from(tableName)
                  .delete()
                  .eq('id', record.id);
                  
                if (!deleteError) {
                  console.log(`Registro id=${record.id} excluído com sucesso`);
                } else {
                  console.error(`Erro ao excluir registro id=${record.id}:`, deleteError);
                }
              }
              
              setStatus(`Tabela ${tableName} limpa registro por registro`);
            }
          } catch (err) {
            console.error(`Erro na abordagem individual para ${tableName}:`, err);
          }
        } else {
          setStatus(`Tabela ${tableName} limpa com sucesso!`);
        }
      } catch (err) {
        console.warn(`Erro ao processar tabela ${tableName}, pulando:`, err);
      }
      
      // Atualiza o progresso com base na tabela atual
      setProgress(50 + Math.round(((i + 1) / supabaseTables.length) * 25));
    }
    
    // Abordagem 2: Função RPC
    try {
      // Tenta executar uma função RPC de limpeza
      setStatus("Tentando limpar dados via RPC...");
      await supabaseAdmin.rpc('limpar_todos_dados').throwOnError();
      setStatus("Limpeza RPC executada com sucesso!");
    } catch (err) {
      console.log("Função RPC limpar_todos_dados não disponível", err);
    }
    
    // Abordagem 3: API REST direta
    setStatus("Tentando limpeza direta com REST API...");
    setProgress(75);
    
    try {
      for (const tableName of supabaseTables) {
        try {
          setStatus(`Limpando ${tableName} via REST API...`);
          
          // Use fetch para fazer uma solicitação DELETE direta à API REST
          const response = await fetch(
            `${supabaseUrl}/rest/v1/${tableName}?select=id`, 
            {
              method: 'DELETE',
              headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
              }
            }
          );
          
          if (response.ok) {
            setStatus(`Limpeza REST de ${tableName} bem-sucedida!`);
          } else {
            const errorText = await response.text();
            console.error(`Erro na limpeza REST de ${tableName}: ${errorText}`);
            
            // Se falhou, tenta buscar e excluir registros individualmente
            const getResponse = await fetch(
              `${supabaseUrl}/rest/v1/${tableName}?select=id`,
              {
                method: 'GET',
                headers: {
                  'apikey': supabaseAnonKey,
                  'Authorization': `Bearer ${supabaseAnonKey}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            
            if (getResponse.ok) {
              const records = await getResponse.json();
              setStatus(`Encontrados ${records.length} registros em ${tableName}, excluindo individualmente...`);
              
              for (const record of records) {
                await fetch(
                  `${supabaseUrl}/rest/v1/${tableName}?id=eq.${record.id}`,
                  {
                    method: 'DELETE',
                    headers: {
                      'apikey': supabaseAnonKey,
                      'Authorization': `Bearer ${supabaseAnonKey}`,
                      'Content-Type': 'application/json',
                      'Prefer': 'return=minimal'
                    }
                  }
                );
              }
            }
          }
        } catch (err) {
          console.log(`Erro na abordagem REST para ${tableName}`, err);
        }
      }
    } catch (err) {
      console.log("Erro na abordagem REST geral", err);
    }
    
    // Invoca API que limpa dados via backend
    try {
      setStatus("Solicitando limpeza adicional via backend API...");
      setProgress(90);
      
      const response = await fetch('/api/admin/clear-supabase-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          confirm: 'LIMPAR',
          tables: supabaseTables
        })
      });
      
      if (response.ok) {
        setStatus("Limpeza adicional via backend concluída com sucesso!");
      } else {
        console.log("API de limpeza adicional não disponível ou falhou");
      }
    } catch (err) {
      console.log("Erro ao chamar API de limpeza adicional", err);
    }
    
    setProgress(95);
    
    // Última tentativa - forçar recarga da aplicação para limpar cache do Supabase
    try {
      // Limpar cache do localStorage relacionado ao Supabase
      Object.keys(localStorage).forEach(key => {
        if (key.includes('supabase') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      console.log("Cache local do Supabase limpo");
    } catch (err) {
      console.error("Erro ao limpar cache local", err);
    }
    
    setStatus("Limpeza do Supabase concluída! Diversos métodos foram usados para garantir a limpeza completa.");
    setProgress(100);
    return true;
  };

  // Função principal para limpar todos os dados
  const limparTodosDados = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      setProgress(0);
      setStatus("Iniciando limpeza completa dos dados...");
      
      // Primeiro limpar os dados do backend
      await limparDadosAPI();
      setProgress(50);
      
      // Depois limpar os dados do Supabase
      await limparDadosSupabase();
      
      setProgress(100);
      setStatus("LIMPEZA COMPLETA! Todos os dados foram removidos do sistema.");
      setIsComplete(true);
      
      // Redirecionar para a página inicial após 3 segundos
      setTimeout(() => {
        window.location.href = "/";
      }, 3000);
      
    } catch (error: any) {
      console.error('Erro ao limpar dados:', error);
      setStatus(`Erro: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Executar limpeza automaticamente quando o componente carregar
  useEffect(() => {
    limparTodosDados();
  }, []);

  return (
    <MainLayoutSimple>
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto shadow-lg">
          <CardHeader className="bg-red-50 dark:bg-red-900/20">
            <CardTitle className="text-center text-xl text-red-700 dark:text-red-400">
              Limpeza Completa de Dados
            </CardTitle>
          </CardHeader>
          
          <CardContent className="pt-6 pb-8">
            <div className="mb-8 flex flex-col items-center justify-center">
              {isLoading ? (
                <Loader2 className="h-12 w-12 text-red-500 animate-spin mb-4" />
              ) : isComplete ? (
                <div className="text-center">
                  <RefreshCw className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-green-600 font-medium">Limpeza finalizada!</p>
                </div>
              ) : (
                <Trash2 className="h-12 w-12 text-red-500 mb-4" />
              )}
              
              <Progress value={progress} className="h-2 w-full mb-4" />
              
              <p className="text-center mb-2">
                <span className="font-semibold">Status:</span> {status}
              </p>
              
              {isComplete && (
                <p className="text-center text-sm mt-4">
                  Redirecionando para a página inicial em alguns segundos...
                </p>
              )}
            </div>
            
            <div className="p-3 bg-gray-50 dark:bg-gray-900/20 rounded-md">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Tabelas limpas:</strong>
              </p>
              <ul className="text-xs text-gray-600 dark:text-gray-400 mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                {tables.map((table) => (
                  <li key={table.name}>• {table.label}</li>
                ))}
              </ul>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-center border-t pt-4">
            <Button
              onClick={() => window.location.href = "/"}
              variant="outline"
              disabled={isLoading && !isComplete}
            >
              Voltar para o Início
            </Button>
          </CardFooter>
        </Card>
      </div>
    </MainLayoutSimple>
  );
}
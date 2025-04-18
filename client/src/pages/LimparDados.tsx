import React, { useEffect, useState } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle, CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import MainLayoutSimple from "@/components/layout/MainLayoutSimple";
import { deleteRecords, fetchRecords, supabaseAdmin } from '@/lib/supabase-client';

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
    { name: 'abastecimentos_postos', label: 'Abastecimentos em Postos' },
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
  
  // Função para limpar dados do Supabase
  const limparDadosSupabase = async () => {
    setStatus("Iniciando limpeza de dados do Supabase...");
    
    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];
      setStatus(`Buscando registros da tabela ${table.label}...`);
      
      try {
        const registros = await fetchRecords(table.name, {});
        
        if (registros.length > 0) {
          setStatus(`Apagando ${registros.length} registros de ${table.label}...`);
          const ids = registros.map(reg => reg.id);
          
          await deleteRecords(table.name, ids);
        } else {
          setStatus(`Nenhum registro encontrado em ${table.label}`);
        }
      } catch (err) {
        console.warn(`Erro ao processar tabela ${table.name}, pulando: ${err}`);
      }

      // Atualiza o progresso com base na tabela atual
      setProgress(Math.round(((i + 1) / tables.length) * 100));
    }
    
    setStatus("Supabase limpo com sucesso!");
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
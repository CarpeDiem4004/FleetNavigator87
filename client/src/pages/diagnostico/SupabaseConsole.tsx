import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { PlayIcon, XCircleIcon, CheckCircleIcon, RotateCw } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import { useAuth } from '@/hooks/use-auth';

interface QueryResult {
  data: any;
  error: any;
  executionTime: number;
}

export default function SupabaseConsole() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [query, setQuery] = useState<string>(`const { data, error } = await supabase.from('veiculos').select('*').limit(5);
return { data, error };`);
  
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  
  const executeQuery = async () => {
    try {
      setIsExecuting(true);
      
      // Criar uma função a partir da string do código
      const start = performance.now();
      
      // Envolver em try/catch para capturar erros de syntax
      try {
        // eslint-disable-next-line no-new-func
        const queryFunction = new Function('supabase', `
          return (async () => {
            try {
              ${query}
            } catch (error) {
              return { data: null, error };
            }
          })();
        `);
        
        // Executar a função com o cliente Supabase
        const queryResult = await queryFunction(supabase);
        const end = performance.now();
        
        setResult({
          data: queryResult.data,
          error: queryResult.error,
          executionTime: end - start
        });
      } catch (syntaxError: any) {
        setResult({
          data: null,
          error: { message: `Erro de sintaxe: ${syntaxError.message}` },
          executionTime: performance.now() - start
        });
      }
    } catch (error: any) {
      console.error("Erro ao executar query:", error);
    } finally {
      setIsExecuting(false);
    }
  };
  
  // Exemplos de consultas
  const queryExamples = [
    {
      name: "Listar veículos",
      query: `const { data, error } = await supabase.from('veiculos').select('*').limit(5);
return { data, error };`
    },
    {
      name: "Status de tanques",
      query: `const { data, error } = await supabase.from('status_tanques').select('*').limit(5);
return { data, error };`
    },
    {
      name: "Tabelas existentes",
      query: `const { data, error } = await supabase.rpc('get_tables');
return { data, error };`
    },
    {
      name: "Informações do sistema",
      query: `const { data, error } = await supabase.rpc('get_system_info');
return { data, error };`
    },
  ];
  
  if (!isAdmin) {
    return (
      <MainLayoutSimple>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Acesso Restrito</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Esta ferramenta é restrita a administradores do sistema.</p>
            </CardContent>
          </Card>
        </div>
      </MainLayoutSimple>
    );
  }
  
  return (
    <MainLayoutSimple>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Console Supabase</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Editor de Consulta</CardTitle>
                <CardDescription>
                  Escreva código JavaScript para consultar o Supabase diretamente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="font-mono h-60 mb-4"
                  placeholder="const { data, error } = await supabase.from('tabela').select('*');"
                />
                
                <div className="flex justify-end">
                  <Button 
                    onClick={executeQuery}
                    disabled={isExecuting}
                    className="gap-1"
                  >
                    {isExecuting ? (
                      <RotateCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <PlayIcon className="h-4 w-4" />
                    )}
                    Executar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Exemplos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {queryExamples.map((example, index) => (
                  <Button 
                    key={index}
                    variant="outline"
                    className="w-full text-left justify-start"
                    onClick={() => setQuery(example.query)}
                  >
                    {example.name}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
        
        {result && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Resultado da Consulta</CardTitle>
                <span className="text-sm text-muted-foreground">
                  Tempo de execução: {result.executionTime.toFixed(2)}ms
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {result.error ? (
                <Alert variant="destructive">
                  <XCircleIcon className="h-4 w-4" />
                  <AlertTitle>Erro na consulta</AlertTitle>
                  <AlertDescription>
                    {result.error.message || JSON.stringify(result.error)}
                  </AlertDescription>
                </Alert>
              ) : (
                <div>
                  <Alert variant="default" className="mb-4">
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    <AlertTitle>Consulta executada com sucesso</AlertTitle>
                  </Alert>
                  
                  <div className="bg-muted rounded-md p-4 overflow-auto max-h-96">
                    <pre className="text-xs">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayoutSimple>
  );
}
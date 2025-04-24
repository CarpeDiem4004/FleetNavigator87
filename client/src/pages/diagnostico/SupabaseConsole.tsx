import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { PlayIcon, XCircleIcon, CheckCircleIcon, RotateCw } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import { useAuth } from '@/context/AuthContext';

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
  
  // Verificando se o hook useAuth completou a carga
  if (user === undefined) {
    return (
      <MainLayoutSimple>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </MainLayoutSimple>
    );
  }
  
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
      name: "Listar todas as tabelas",
      query: `// Esta consulta lista todas as tabelas do esquema público
const { data, error } = await supabase
  .from('pg_tables')
  .select('tablename')
  .eq('schemaname', 'public');
return { data, error };`
    },
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
      name: "Abastecimentos",
      query: `const { data, error } = await supabase.from('abastecimentos').select('*').limit(5);
return { data, error };`
    },
    {
      name: "Controle de Pátio",
      query: `const { data, error } = await supabase.from('controle_patio').select('*').limit(5);
return { data, error };`
    },
    {
      name: "Usuários",
      query: `const { data, error } = await supabase.from('usuarios').select('*').limit(5);
return { data, error };`
    },
    {
      name: "Bases",
      query: `const { data, error } = await supabase.from('bases').select('*').limit(5);
return { data, error };`
    },
    {
      name: "Manutenções",
      query: `const { data, error } = await supabase.from('manutencoes').select('*').limit(5);
return { data, error };`
    },
    {
      name: "Oficinas",
      query: `const { data, error } = await supabase.from('oficinas').select('*').limit(5);
return { data, error };`
    },
    {
      name: "Pneus",
      query: `const { data, error } = await supabase.from('pneus').select('*').limit(5);
return { data, error };`
    },
    {
      name: "Multas",
      query: `const { data, error } = await supabase.from('multas').select('*').limit(5);
return { data, error };`
    },
    {
      name: "Line Hall",
      query: `const { data, error } = await supabase.from('line_hall').select('*').limit(5);
return { data, error };`
    },
    {
      name: "Estrutura das tabelas",
      query: `// Esta consulta lista todas as colunas e seus tipos para todas as tabelas
const { data, error } = await supabase
  .from('information_schema.columns')
  .select('table_name,column_name,data_type,is_nullable')
  .eq('table_schema', 'public')
  .order('table_name');
return { data, error };`
    },
    {
      name: "Tabelas e registros",
      query: `// Esta consulta mostra todas as tabelas e quantos registros cada uma tem
// Esta é uma consulta mais avançada usando SQL bruto
const { data, error } = await supabase.rpc('contar_registros_por_tabela');
return { data, error };`
    },
    {
      name: "Info da conexão",
      query: `// Esta consulta mostra informações sobre a conexão atual
const authInfo = supabase.auth.session();
const { data: connectionInfo, error: connectionError } = await supabase
  .rpc('get_connection_info');

return { 
  auth: authInfo, 
  connection: connectionInfo,
  error: connectionError 
};`
    }
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
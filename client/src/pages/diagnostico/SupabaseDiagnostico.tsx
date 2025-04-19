import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { RefreshCw, Server, Globe } from 'lucide-react';
import { checkAllConnections } from '@/lib/supabase-client';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// Tipo para os resultados do diagnóstico do cliente
type ClientDiagnosticResults = Record<string, boolean>;

// Tipo para os resultados do diagnóstico do servidor
interface ServerDiagnosticResults {
  baseConnection: boolean;
  readPermission: boolean;
  writePermission: boolean;
  tables: Record<string, { exists: boolean, error: string | null }>;
  baseConnectionError?: string;
  readPermissionError?: string;
  writePermissionError?: string;
  readSample?: any;
  writeSample?: any;
  fatalError?: string;
  errorStack?: string;
  schemaCheck?: {
    success: boolean;
    error?: string;
    schema?: any;
  };
}

export default function SupabaseDiagnostico() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [clientResultados, setClientResultados] = useState<ClientDiagnosticResults | null>(null);
  const [serverResultados, setServerResultados] = useState<ServerDiagnosticResults | null>(null);
  const [isClientLoading, setIsClientLoading] = useState(false);
  const [isServerLoading, setIsServerLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Executar testes no cliente
  const executarTestesCliente = async () => {
    try {
      setIsClientLoading(true);
      setError(null);
      console.log("Iniciando diagnóstico de conexão Supabase no cliente...");
      
      const results = await checkAllConnections();
      setClientResultados(results);
      
      console.log("Diagnóstico cliente completo:", results);
    } catch (error: any) {
      setError(error.message || "Erro desconhecido ao executar diagnóstico no cliente");
      console.error("Erro ao executar diagnóstico no cliente:", error);
    } finally {
      setIsClientLoading(false);
    }
  };
  
  // Executar testes no servidor
  const executarTestesServidor = async () => {
    try {
      setIsServerLoading(true);
      setError(null);
      console.log("Iniciando diagnóstico de conexão Supabase no servidor...");
      
      const response = await fetch('/api/diagnostico/supabase', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      let responseData;
      const contentType = response.headers.get('content-type');
      const isJsonResponse = contentType && contentType.includes('application/json');
      
      if (isJsonResponse) {
        responseData = await response.json();
      } else {
        const textResponse = await response.text();
        console.error("Resposta não-JSON recebida:", textResponse);
        throw new Error(`Resposta inesperada do servidor: não é JSON válido`);
      }
      
      if (!response.ok) {
        if (responseData && responseData.error) {
          throw new Error(`Erro ${response.status}: ${responseData.error}`);
        } else {
          throw new Error(`Erro HTTP ${response.status}`);
        }
      }
      
      if (!responseData.results) {
        console.error("Resposta sem campo 'results':", responseData);
        throw new Error("Formato de resposta inválido: campo 'results' ausente");
      }
      
      setServerResultados(responseData.results);
      console.log("Diagnóstico servidor completo:", responseData.results);
    } catch (error: any) {
      setError(error.message || "Erro desconhecido ao executar diagnóstico no servidor");
      console.error("Erro ao executar diagnóstico no servidor:", error);
      
      // Reseta o estado dos resultados em caso de erro para não exibir dados antigos
      setServerResultados(null);
    } finally {
      setIsServerLoading(false);
    }
  };
  
  // Executar ambos os testes
  const executarTodosTestes = async () => {
    await Promise.all([executarTestesCliente(), executarTestesServidor()]);
  };
  
  useEffect(() => {
    if (isAdmin) {
      executarTodosTestes();
    }
  }, [isAdmin]);
  
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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Diagnóstico de Conexão - Supabase</h1>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/diagnostico/comparacao-esquemas'}
            >
              Comparar Esquemas
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => window.location.href = '/diagnostico/sincronizar-tabelas'}
            >
              Sincronizar Tabelas
            </Button>
            <Button 
              variant="default" 
              onClick={() => window.location.href = '/diagnostico/supabase-console'}
            >
              Abrir Console Supabase
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="ambos" className="mb-6">
          <TabsList className="mb-4">
            <TabsTrigger value="ambos">Ambos</TabsTrigger>
            <TabsTrigger value="cliente"><Globe className="h-4 w-4 mr-2" />Cliente</TabsTrigger>
            <TabsTrigger value="servidor"><Server className="h-4 w-4 mr-2" />Servidor</TabsTrigger>
          </TabsList>
          
          <TabsContent value="ambos" className="space-y-4">
            <div className="flex justify-end mb-4">
              <Button
                variant="outline"
                onClick={executarTodosTestes}
                disabled={isClientLoading || isServerLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${(isClientLoading || isServerLoading) ? 'animate-spin' : ''}`} />
                Atualizar Todos
              </Button>
            </div>
            
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Diagnóstico no Cliente</CardTitle>
                    <CardDescription>Conexão direta do navegador</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={executarTestesCliente}
                    disabled={isClientLoading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isClientLoading ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {renderClientResults()}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Diagnóstico no Servidor</CardTitle>
                    <CardDescription>Conexão pelo backend Express</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={executarTestesServidor}
                    disabled={isServerLoading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isServerLoading ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {renderServerResults()}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="cliente">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Diagnóstico no Cliente</CardTitle>
                    <CardDescription>Conexão direta do navegador</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={executarTestesCliente}
                    disabled={isClientLoading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isClientLoading ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {renderClientResults()}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="servidor">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Diagnóstico no Servidor</CardTitle>
                    <CardDescription>Conexão pelo backend Express</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={executarTestesServidor}
                    disabled={isServerLoading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isServerLoading ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {renderServerResults()}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Erro ao testar conexão</AlertTitle>
            <p>{error}</p>
          </Alert>
        )}
      </div>
    </MainLayoutSimple>
  );
  
  // Renderizar resultados do cliente
  function renderClientResults() {
    if (isClientLoading) {
      return (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      );
    }
    
    if (!clientResultados) {
      return (
        <p className="text-center py-4">Não foi possível obter resultados de diagnóstico do cliente.</p>
      );
    }
    
    return (
      <div className="grid gap-4">
        <div>
          <h3 className="font-medium mb-2">Conexão Base: {clientResultados.baseConnection ? '✅ Conectado' : '❌ Falha'}</h3>
        </div>
        <div>
          <h3 className="font-medium mb-2">Permissão de Leitura: {clientResultados.readPermission ? '✅ Conectado' : '❌ Falha'}</h3>
        </div>
        <div>
          <h3 className="font-medium mb-2">Permissão de Escrita: {clientResultados.writePermission ? '✅ Conectado' : '❌ Falha'}</h3>
        </div>
        <div>
          <h3 className="font-medium mb-2">Sistema de Auth: {clientResultados.authSystem ? '✅ Funcionando' : '❌ Falha'}</h3>
        </div>
        <div>
          <h3 className="font-medium mb-2">Funções RPC: {clientResultados.rpcFunctions ? '✅ Disponível' : '❌ Falha'}</h3>
        </div>

        <h3 className="font-medium mt-4">Tabelas:</h3>
        <ul className="list-disc pl-5">
          {Object.entries(clientResultados)
            .filter(([key]) => key.startsWith('table_'))
            .map(([key, status]) => (
              <li key={key}>
                {key.replace('table_', '')}: {status ? '✅ Disponível' : '❌ Falha'}
              </li>
            ))}
        </ul>
      </div>
    );
  }
  
  // Renderizar resultados do servidor
  function renderServerResults() {
    if (isServerLoading) {
      return (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      );
    }
    
    if (!serverResultados) {
      return (
        <p className="text-center py-4">Não foi possível obter resultados de diagnóstico do servidor.</p>
      );
    }
    
    return (
      <div className="grid gap-4">
        <div>
          <h3 className="font-medium mb-2">
            Conexão Base: {serverResultados.baseConnection ? '✅ Conectado' : '❌ Falha'}
          </h3>
          {serverResultados.baseConnectionError && (
            <p className="text-red-500 text-sm">{serverResultados.baseConnectionError}</p>
          )}
        </div>
        
        <div>
          <h3 className="font-medium mb-2">
            Permissão de Leitura: {serverResultados.readPermission ? '✅ Conectado' : '❌ Falha'}
          </h3>
          {serverResultados.readPermissionError && (
            <p className="text-red-500 text-sm">{serverResultados.readPermissionError}</p>
          )}
        </div>
        
        <div>
          <h3 className="font-medium mb-2">
            Permissão de Escrita: {serverResultados.writePermission ? '✅ Conectado' : '❌ Falha'}
          </h3>
          {serverResultados.writePermissionError && (
            <p className="text-red-500 text-sm">{serverResultados.writePermissionError}</p>
          )}
        </div>
        
        <h3 className="font-medium mt-4">Tabelas:</h3>
        {serverResultados.tables && Object.keys(serverResultados.tables).length > 0 ? (
          <ul className="list-disc pl-5">
            {Object.entries(serverResultados.tables).map(([tableName, tableStatus]) => (
              <li key={tableName}>
                {tableName}: {tableStatus.exists ? '✅ Disponível' : '❌ Falha'}
                {tableStatus.error && (
                  <p className="text-red-500 text-sm ml-4">{tableStatus.error}</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-yellow-500">Nenhuma informação de tabela disponível</p>
        )}
        
        {(serverResultados.readSample || serverResultados.writeSample || serverResultados.schemaCheck) && (
          <Accordion type="single" collapsible className="mt-4">
            {serverResultados.schemaCheck && (
              <AccordionItem value="schema">
                <AccordionTrigger>
                  Detalhes do Schema
                </AccordionTrigger>
                <AccordionContent>
                  {serverResultados.schemaCheck.success ? (
                    <pre className="bg-gray-100 p-3 rounded overflow-auto text-xs">
                      {JSON.stringify(serverResultados.schemaCheck.schema, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-red-500">{serverResultados.schemaCheck.error}</p>
                  )}
                </AccordionContent>
              </AccordionItem>
            )}
            
            {serverResultados.readSample && (
              <AccordionItem value="read">
                <AccordionTrigger>
                  Amostra de Leitura
                </AccordionTrigger>
                <AccordionContent>
                  <pre className="bg-gray-100 p-3 rounded overflow-auto text-xs">
                    {JSON.stringify(serverResultados.readSample, null, 2)}
                  </pre>
                </AccordionContent>
              </AccordionItem>
            )}
            
            {serverResultados.writeSample && (
              <AccordionItem value="write">
                <AccordionTrigger>
                  Amostra de Escrita
                </AccordionTrigger>
                <AccordionContent>
                  <pre className="bg-gray-100 p-3 rounded overflow-auto text-xs">
                    {JSON.stringify(serverResultados.writeSample, null, 2)}
                  </pre>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        )}
        
        {serverResultados.fatalError && (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Erro Fatal</AlertTitle>
            <p>{serverResultados.fatalError}</p>
            {serverResultados.errorStack && (
              <pre className="bg-red-50 p-2 mt-2 rounded text-xs overflow-auto">
                {serverResultados.errorStack}
              </pre>
            )}
          </Alert>
        )}
      </div>
    );
  }
}
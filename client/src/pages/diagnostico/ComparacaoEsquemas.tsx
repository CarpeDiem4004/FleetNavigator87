import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, Server, Database, CheckCircle, XCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/queryClient';

interface ColumnComparisonResult {
  replitColumns: string[];
  supabaseColumns: string[];
  onlyInReplit: string[];
  onlyInSupabase: string[];
  inBoth: string[];
}

interface SchemaComparisonResults {
  tableComparison: {
    replitTables: string[];
    supabaseTables: string[];
    onlyInReplit: string[];
    onlyInSupabase: string[];
    inBoth: string[];
  };
  columnComparison: Record<string, ColumnComparisonResult>;
}

export default function ComparacaoEsquemas() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SchemaComparisonResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fetchComparison = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest('GET', '/api/diagnostico/compare-schemas');
      const data = await response.json();
      
      if (data.success) {
        setResults(data.results);
      } else {
        setError(data.message || 'Falha ao comparar esquemas');
      }
    } catch (error) {
      console.error("Erro ao carregar comparação de esquemas:", error);
      setError('Erro ao conectar com o servidor');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (isAdmin) {
      fetchComparison();
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
          <h1 className="text-2xl font-bold">Comparação de Esquemas</h1>
          <div className="flex space-x-2">
            <Button 
              variant="default" 
              onClick={() => window.location.href = '/diagnostico/supabase-console'}
            >
              <Database className="h-4 w-4 mr-2" />
              Console Supabase
            </Button>
            <Button
              variant="outline"
              onClick={fetchComparison}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : results ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Comparação de Tabelas</CardTitle>
                <CardDescription>
                  Identificação de diferenças entre tabelas no PostgreSQL do Replit e no Supabase
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="font-medium mb-2 flex items-center">
                      <Server className="h-4 w-4 mr-2 text-blue-500" />
                      Tabelas no Replit ({results.tableComparison.replitTables?.length || 0})
                    </h3>
                    <ul className="list-disc ml-5 space-y-1 text-sm">
                      {results.tableComparison.replitTables && results.tableComparison.replitTables.length > 0 ? (
                        results.tableComparison.replitTables.map(table => (
                          <li key={table} className="text-gray-700">
                            {table}
                          </li>
                        ))
                      ) : (
                        <li className="text-gray-500">Nenhuma tabela encontrada</li>
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2 flex items-center">
                      <Database className="h-4 w-4 mr-2 text-green-500" />
                      Tabelas no Supabase ({results.tableComparison.supabaseTables?.length || 0})
                    </h3>
                    <ul className="list-disc ml-5 space-y-1 text-sm">
                      {results.tableComparison.supabaseTables && results.tableComparison.supabaseTables.length > 0 ? (
                        results.tableComparison.supabaseTables.map(table => (
                          <li key={table} className="text-gray-700">
                            {table}
                          </li>
                        ))
                      ) : (
                        <li className="text-gray-500">Nenhuma tabela encontrada</li>
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                      Em ambos ({results.tableComparison.inBoth?.length || 0})
                    </h3>
                    <ul className="list-disc ml-5 space-y-1 text-sm">
                      {results.tableComparison.inBoth && results.tableComparison.inBoth.length > 0 ? (
                        results.tableComparison.inBoth.map(table => (
                          <li key={table} className="text-green-700">
                            {table}
                          </li>
                        ))
                      ) : (
                        <li className="text-gray-500">Nenhuma tabela em comum</li>
                      )}
                    </ul>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <h3 className="font-medium mb-2 flex items-center text-orange-600">
                      <XCircle className="h-4 w-4 mr-2" />
                      Apenas no Replit ({results.tableComparison.onlyInReplit?.length || 0})
                    </h3>
                    <ul className="list-disc ml-5 space-y-1 text-sm">
                      {results.tableComparison.onlyInReplit && results.tableComparison.onlyInReplit.length > 0 ? (
                        results.tableComparison.onlyInReplit.map(table => (
                          <li key={table} className="text-orange-700">
                            {table}
                          </li>
                        ))
                      ) : (
                        <li className="text-gray-500">Nenhuma tabela exclusiva</li>
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2 flex items-center text-red-600">
                      <XCircle className="h-4 w-4 mr-2" />
                      Apenas no Supabase ({results.tableComparison.onlyInSupabase?.length || 0})
                    </h3>
                    <ul className="list-disc ml-5 space-y-1 text-sm">
                      {results.tableComparison.onlyInSupabase && results.tableComparison.onlyInSupabase.length > 0 ? (
                        results.tableComparison.onlyInSupabase.map(table => (
                          <li key={table} className="text-red-700">
                            {table}
                          </li>
                        ))
                      ) : (
                        <li className="text-gray-500">Nenhuma tabela exclusiva</li>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Comparação de Colunas</CardTitle>
                <CardDescription>
                  Diferenças de estrutura em tabelas que existem nos dois bancos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue={results.tableComparison.inBoth && results.tableComparison.inBoth.length > 0 ? results.tableComparison.inBoth[0] : "sem-tabelas"}>
                  <TabsList className="mb-4 flex flex-wrap">
                    {results.tableComparison.inBoth && results.tableComparison.inBoth.length > 0 ? (
                      results.tableComparison.inBoth.map(table => (
                        <TabsTrigger key={table} value={table}>
                          {table}
                        </TabsTrigger>
                      ))
                    ) : (
                      <TabsTrigger value="sem-tabelas">Sem tabelas comuns</TabsTrigger>
                    )}
                  </TabsList>
                  
                  {results.tableComparison.inBoth && results.tableComparison.inBoth.length > 0 ? (
                    results.tableComparison.inBoth.map(table => (
                      <TabsContent key={table} value={table}>
                        {results.columnComparison && results.columnComparison[table] ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h3 className="font-medium mb-2">Colunas no Replit</h3>
                                <ul className="list-disc ml-5 space-y-1 text-sm">
                                  {results.columnComparison[table].replitColumns && results.columnComparison[table].replitColumns.length > 0 ? (
                                    results.columnComparison[table].replitColumns.map(col => (
                                      <li key={col} className={`${
                                        results.columnComparison[table].inBoth && results.columnComparison[table].inBoth.includes(col) 
                                          ? 'text-green-700' 
                                          : 'text-orange-700 font-medium'
                                      }`}>
                                        {col}
                                        {results.columnComparison[table].inBoth && !results.columnComparison[table].inBoth.includes(col) && ' (apenas Replit)'}
                                      </li>
                                    ))
                                  ) : (
                                    <li className="text-gray-500">Nenhuma coluna encontrada</li>
                                  )}
                                </ul>
                              </div>
                              
                              <div>
                                <h3 className="font-medium mb-2">Colunas no Supabase</h3>
                                <ul className="list-disc ml-5 space-y-1 text-sm">
                                  {results.columnComparison[table].supabaseColumns && results.columnComparison[table].supabaseColumns.length > 0 ? (
                                    results.columnComparison[table].supabaseColumns.map(col => (
                                      <li key={col} className={`${
                                        results.columnComparison[table].inBoth && results.columnComparison[table].inBoth.includes(col) 
                                          ? 'text-green-700' 
                                          : 'text-red-700 font-medium'
                                      }`}>
                                        {col}
                                        {results.columnComparison[table].inBoth && !results.columnComparison[table].inBoth.includes(col) && ' (apenas Supabase)'}
                                      </li>
                                    ))
                                  ) : (
                                    <li className="text-gray-500">Nenhuma coluna encontrada</li>
                                  )}
                                </ul>
                              </div>
                            </div>
                            
                            <div className="bg-muted p-4 rounded-md">
                              <h3 className="font-medium mb-2">Resumo das diferenças</h3>
                              <p>
                                <span className="font-medium">Colunas em comum:</span> {results.columnComparison[table].inBoth?.length || 0}
                              </p>
                              <p>
                                <span className="font-medium">Colunas apenas no Replit:</span> {results.columnComparison[table].onlyInReplit?.length || 0}
                                {results.columnComparison[table].onlyInReplit && results.columnComparison[table].onlyInReplit.length > 0 && (
                                  <span className="text-sm text-orange-700 ml-2">
                                    ({results.columnComparison[table].onlyInReplit.join(', ')})
                                  </span>
                                )}
                              </p>
                              <p>
                                <span className="font-medium">Colunas apenas no Supabase:</span> {results.columnComparison[table].onlyInSupabase?.length || 0}
                                {results.columnComparison[table].onlyInSupabase && results.columnComparison[table].onlyInSupabase.length > 0 && (
                                  <span className="text-sm text-red-700 ml-2">
                                    ({results.columnComparison[table].onlyInSupabase.join(', ')})
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-center text-gray-500">Não foi possível obter comparação de colunas para esta tabela</p>
                        )}
                      </TabsContent>
                    ))
                  ) : (
                    <TabsContent value="sem-tabelas">
                      <p className="text-center text-gray-500">Não há tabelas em comum entre os dois bancos de dados</p>
                    </TabsContent>
                  )}
                </Tabs>
              </CardContent>
            </Card>
            
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
              <h3 className="font-medium text-amber-800 mb-2">Correção de Incompatibilidades</h3>
              <p className="text-sm text-amber-700 mb-2">
                Para resolver problemas de incompatibilidade entre os bancos de dados, considere:
              </p>
              <ol className="list-decimal ml-5 text-sm text-amber-700 space-y-1">
                <li>Ajustar o nome das tabelas no código do Replit para corresponder ao Supabase</li>
                <li>Criar as colunas ausentes no Supabase via interface admin</li>
                <li>Verificar se as políticas de segurança do Supabase permitem acesso às tabelas</li>
              </ol>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="py-6">
              <p className="text-center text-gray-500">Nenhum resultado disponível</p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayoutSimple>
  );
}
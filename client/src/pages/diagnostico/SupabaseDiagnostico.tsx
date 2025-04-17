import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle, AlertCircle, Database } from 'lucide-react';
import { checkAllConnections } from '@/lib/supabase-client';

interface DiagnosticoResultados {
  [key: string]: boolean;
}

export default function SupabaseDiagnostico() {
  const [resultados, setResultados] = useState<DiagnosticoResultados | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const executarTestes = async () => {
    try {
      setIsLoading(true);
      console.log("Iniciando diagnóstico de conexão Supabase...");
      
      const results = await checkAllConnections();
      setResultados(results);
      setLastUpdated(new Date());
      
      console.log("Diagnóstico completo:", results);
    } catch (error) {
      console.error("Erro ao executar diagnóstico:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    executarTestes();
  }, []);
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Diagnóstico de Conexão - Supabase</h1>
      
      <Card className="mb-6">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-slate-50 border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              Testes de Conexão
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={executarTestes}
              disabled={isLoading}
              className="h-9 gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </Button>
          </div>
          <CardDescription>
            Teste de conectividade com as tabelas e recursos do Supabase
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="ml-4 text-lg">Executando testes de conexão...</p>
            </div>
          ) : resultados ? (
            <div>
              <Table>
                <TableCaption>
                  {lastUpdated && `Última atualização: ${lastUpdated.toLocaleString('pt-BR')}`}
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Recurso</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Recomendação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(resultados).map(([key, status]) => (
                    <TableRow key={key}>
                      <TableCell className="font-medium">
                        {key === 'anon_client' ? 'Cliente Anônimo' : 
                         key === 'rpc' ? 'Funções RPC' : 
                         `Tabela: ${key}`}
                      </TableCell>
                      <TableCell>
                        {status ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1 w-fit">
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Conectado</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1 w-fit">
                            <AlertCircle className="h-3.5 w-3.5" />
                            <span>Falha</span>
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {status ? 
                          'Nenhuma ação necessária' : 
                          'Verifique as permissões da tabela ou a conexão com o Supabase'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="mt-6 p-4 bg-muted/30 rounded-md">
                <h3 className="font-medium mb-2">Diagnóstico Geral</h3>
                <p>
                  {Object.values(resultados).every(v => v) ? 
                    "Todas as conexões estão funcionando corretamente." : 
                    "Foram detectados problemas em uma ou mais conexões. Tente atualizar as chaves de API ou verificar a disponibilidade do serviço."
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center p-6 text-muted-foreground">
              <p>Não foi possível obter resultados de diagnóstico.</p>
              <Button 
                variant="secondary" 
                onClick={executarTestes} 
                className="mt-4"
              >
                Tentar novamente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { RefreshCw } from 'lucide-react';
import { checkAllConnections } from '@/lib/supabase-client';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import { useAuth } from '@/hooks/use-auth';

export default function SupabaseDiagnostico() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [resultados, setResultados] = useState<Record<string, boolean> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const executarTestes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("Iniciando diagnóstico de conexão Supabase...");
      
      const results = await checkAllConnections();
      setResultados(results);
      
      console.log("Diagnóstico completo:", results);
    } catch (error: any) {
      setError(error.message || "Erro desconhecido ao executar diagnóstico");
      console.error("Erro ao executar diagnóstico:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    executarTestes();
  }, []);
  
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
        <h1 className="text-2xl font-bold mb-6">Diagnóstico de Conexão - Supabase</h1>
        
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Status da Conexão</CardTitle>
              <Button
                variant="outline"
                onClick={executarTestes}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            ) : resultados ? (
              <div className="grid gap-4">
                <div>
                  <h3 className="font-medium mb-2">Conexão Base: {resultados.baseConnection ? '✅ Conectado' : '❌ Falha'}</h3>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Permissão de Leitura: {resultados.readPermission ? '✅ Conectado' : '❌ Falha'}</h3>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Permissão de Escrita: {resultados.writePermission ? '✅ Conectado' : '❌ Falha'}</h3>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Sistema de Auth: {resultados.authSystem ? '✅ Funcionando' : '❌ Falha'}</h3>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Funções RPC: {resultados.rpcFunctions ? '✅ Disponível' : '❌ Falha'}</h3>
                </div>

                <h3 className="font-medium mt-4">Tabelas:</h3>
                <ul className="list-disc pl-5">
                  {Object.entries(resultados)
                    .filter(([key]) => key.startsWith('table_'))
                    .map(([key, status]) => (
                      <li key={key}>
                        {key.replace('table_', '')}: {status ? '✅ Disponível' : '❌ Falha'}
                      </li>
                    ))}
                </ul>
              </div>
            ) : (
              <p className="text-center py-4">Não foi possível obter resultados de diagnóstico.</p>
            )}
            
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertTitle>Erro ao testar conexão</AlertTitle>
                <p>{error}</p>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayoutSimple>
  );
}
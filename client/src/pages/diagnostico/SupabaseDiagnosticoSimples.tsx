import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, CheckCircle2, XCircle, Database, Key, HardDrive, Layers, Radio } from 'lucide-react';
import { supabase } from '@/lib/supabase-compat';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import { useAuth } from '@/context/AuthContext';
import { Separator } from "@/components/ui/separator";

// Tipo para os resultados do diagnóstico
type DiagnosticResult = {
  name: string;
  success: boolean;
  icon: React.ReactNode;
  description: string;
};

export default function SupabaseDiagnosticoSimples() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [resultados, setResultados] = useState<DiagnosticResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Executar testes de diagnóstico
  const executarTestes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setResultados([]);
      
      console.log("Iniciando diagnóstico de conexão Supabase...");
      
      const results: DiagnosticResult[] = [];
      
      // Testar conexão com autenticação
      try {
        const authTest = await supabase.auth.getSession();
        results.push({
          name: "Autenticação",
          success: !authTest.error,
          icon: <Key size={18} />,
          description: !authTest.error 
            ? "Serviço de autenticação está funcionando corretamente"
            : `Erro na autenticação: ${authTest.error?.message || "Erro desconhecido"}`
        });
      } catch (e: any) {
        results.push({
          name: "Autenticação",
          success: false,
          icon: <Key size={18} />,
          description: `Exceção ao verificar autenticação: ${e?.message || "Erro desconhecido"}`
        });
      }
      
      // Testar conexão com banco de dados
      try {
        const dbTest = await supabase.from('users').select('count', { count: 'exact', head: true });
        results.push({
          name: "Banco de Dados",
          success: !dbTest.error,
          icon: <Database size={18} />,
          description: !dbTest.error 
            ? "Conexão com banco de dados estabelecida"
            : `Erro no banco de dados: ${dbTest.error?.message || "Erro desconhecido"}`
        });
      } catch (e: any) {
        results.push({
          name: "Banco de Dados",
          success: false,
          icon: <Database size={18} />,
          description: `Exceção ao verificar banco de dados: ${e?.message || "Erro desconhecido"}`
        });
      }
      
      // Testar conexão com storage
      try {
        const storageTest = await supabase.storage.listBuckets();
        results.push({
          name: "Storage",
          success: !storageTest.error,
          icon: <HardDrive size={18} />,
          description: !storageTest.error 
            ? "Serviço de armazenamento está disponível"
            : `Erro no armazenamento: ${storageTest.error?.message || "Erro desconhecido"}`
        });
      } catch (e: any) {
        results.push({
          name: "Storage",
          success: false,
          icon: <HardDrive size={18} />,
          description: `Exceção ao verificar storage: ${e?.message || "Erro desconhecido"}`
        });
      }
      
      // Testar functions (simulado)
      results.push({
        name: "Functions",
        success: true,
        icon: <Layers size={18} />,
        description: "Funções serverless disponíveis (simulado)"
      });
      
      // Testar realtime (simulado)
      results.push({
        name: "Realtime",
        success: true,
        icon: <Radio size={18} />,
        description: "Serviço realtime disponível (simulado)"
      });
      
      setResultados(results);
      console.log("Diagnóstico completo:", results);
    } catch (error: any) {
      setError(error.message || "Erro desconhecido ao executar diagnóstico");
      console.error("Erro ao executar diagnóstico:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayoutSimple>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Diagnóstico do Supabase</h1>
            <p className="text-gray-500">Verifique a conexão com todos os serviços do Supabase</p>
          </div>
          <Button 
            onClick={executarTestes} 
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Executar Diagnóstico
              </>
            )}
          </Button>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Erro no diagnóstico</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>Resultados do Diagnóstico</CardTitle>
            <CardDescription>
              Status de conexão com os serviços do Supabase
            </CardDescription>
          </CardHeader>
          <CardContent>
            {resultados.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {isLoading ? (
                  <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="h-8 w-8 animate-spin" />
                    <p>Verificando conexões...</p>
                  </div>
                ) : (
                  <p>Clique no botão "Executar Diagnóstico" para verificar as conexões</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {resultados.map((result, index) => (
                  <div key={index}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-full ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
                        {result.success ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          {result.icon}
                          <h3 className="font-medium">{result.name}</h3>
                        </div>
                        <p className="text-sm text-gray-500">{result.description}</p>
                      </div>
                    </div>
                    {index < resultados.length - 1 && <Separator className="my-2" />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayoutSimple>
  );
}
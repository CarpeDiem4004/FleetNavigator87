import React, { useState } from 'react';
import MainLayoutSimple from '@/components/layout/MainLayoutSimple';
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

/**
 * Componente para testar APIs e funções específicas do sistema
 */
export default function ApiTester() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [apiPath, setApiPath] = useState('/api/admin/clear-supabase-data');
  const [confirmation, setConfirmation] = useState('');
  
  // Função para realizar a chamada à API
  const callApi = async (method: string) => {
    if (!isAdmin) {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores podem usar esta ferramenta.",
        variant: "destructive"
      });
      return;
    }
    
    if (method === 'POST' && apiPath.includes('clear') && confirmation !== 'LIMPAR') {
      toast({
        title: "Confirmação necessária",
        description: "Para operações de limpeza, digite 'LIMPAR' no campo de confirmação.",
        variant: "warning"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Preparar os parâmetros com base na API
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };
      
      // Adicionar body para POST, PUT
      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        let body: any = { confirm: confirmation };
        
        // Se for API de limpeza específica, adicionar tabelas sugeridas
        if (apiPath === '/api/admin/clear-supabase-data') {
          body.tables = [
            'abastecimentos_postos',
            'movimentacoes_patio',
            'entradas_combustivel', 
            'status_tanques',
            'controle_tanques',
            'veiculos'
          ];
        }
        
        options.body = JSON.stringify(body);
      }
      
      const response = await fetch(apiPath, options);
      
      // Tentar obter a resposta como JSON
      let jsonResult;
      try {
        jsonResult = await response.json();
      } catch (err) {
        jsonResult = { error: 'Não foi possível ler a resposta como JSON', text: await response.text() };
      }
      
      setResult({
        status: response.status,
        statusText: response.statusText,
        data: jsonResult,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (response.ok) {
        toast({
          title: "API chamada com sucesso",
          description: `Status: ${response.status}`,
          variant: "default"
        });
      } else {
        toast({
          title: "Erro ao chamar API",
          description: `Status: ${response.status} - ${response.statusText}`,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Erro ao chamar API:", error);
      setResult({ error: error.message });
      
      toast({
        title: "Erro na requisição",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função para formatar JSON para exibição
  const formatJson = (json: any) => {
    try {
      return JSON.stringify(json, null, 2);
    } catch (e) {
      return String(json);
    }
  };
  
  if (!isAdmin) {
    return (
      <MainLayoutSimple>
        <div className="container mx-auto px-4 py-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-red-600">Acesso Restrito</CardTitle>
              <CardDescription>
                Esta ferramenta é restrita a administradores do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Você não tem permissão para acessar esta ferramenta de teste.
                Entre em contato com um administrador se precisar testar APIs do sistema.
              </p>
            </CardContent>
          </Card>
        </div>
      </MainLayoutSimple>
    );
  }
  
  return (
    <MainLayoutSimple>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Testador de API</h1>
        
        <Card className="shadow-lg mb-6">
          <CardHeader className="bg-blue-50 dark:bg-blue-900/20">
            <CardTitle>Testar Limpeza Supabase</CardTitle>
            <CardDescription>
              Teste a nova rota de limpeza de dados do Supabase
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            <div className="grid gap-4">
              <div className="grid grid-cols-5 gap-4">
                <div className="col-span-4">
                  <Label htmlFor="api-path">Caminho da API</Label>
                  <Input
                    id="api-path"
                    placeholder="/api/endpoint"
                    value={apiPath}
                    onChange={(e) => setApiPath(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="confirmation">Confirmação</Label>
                  <Input
                    id="confirmation"
                    placeholder="LIMPAR"
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => callApi('GET')}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              GET
            </Button>
            
            <Button
              variant="default"
              onClick={() => callApi('POST')}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              POST
            </Button>
          </CardFooter>
        </Card>
        
        {result && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Resultado</CardTitle>
              <CardDescription>
                Status: {result.status} {result.statusText}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="border rounded-md p-4 bg-gray-50 dark:bg-gray-900/50 overflow-auto max-h-96">
                <pre className="text-xs whitespace-pre-wrap">
                  {formatJson(result.data)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayoutSimple>
  );
}
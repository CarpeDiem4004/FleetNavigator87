import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, DatabaseZap, Copy, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface SyncResult {
  success: boolean;
  message: string;
  timestamp: string;
  tablesCreated: number;
  errors: number;
  missingTables?: string[];
  sqlCommands?: string[];
  checkedTables?: string[];
}

const SincronizarTabelas: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedCommandIndex, setCopiedCommandIndex] = useState<number | null>(null);

  const sincronizarTabelas = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setCopiedCommandIndex(null);

    try {
      const response = await fetch('/api/diagnostico/sync-schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        toast({
          title: "Verificação concluída",
          description: data.missingTables?.length 
            ? `Verificação encontrou ${data.missingTables.length} tabelas faltantes.` 
            : "Todas as tabelas necessárias já existem!",
          variant: "default"
        });
      } else {
        setError(data.message || 'Erro desconhecido durante a sincronização');
        toast({
          title: "Erro na verificação",
          description: data.message || 'Erro desconhecido durante a verificação',
          variant: "destructive"
        });
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar com o servidor');
      toast({
        title: "Erro de conexão",
        description: err.message || 'Erro ao conectar com o servidor',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedCommandIndex(index);
    
    toast({
      title: "Comando SQL copiado",
      description: "O comando SQL foi copiado para a área de transferência.",
      variant: "default"
    });
    
    // Reset the copied state after 2 seconds
    setTimeout(() => {
      setCopiedCommandIndex(null);
    }, 2000);
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DatabaseZap className="h-5 w-5 text-indigo-500" />
          Verificar Tabelas Supabase
        </CardTitle>
        <CardDescription>
          Verifica tabelas faltantes no Supabase e gera comandos SQL para criação
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Esta ferramenta verifica o esquema do banco de dados Supabase comparando-o com as tabelas necessárias pelo sistema.
            Gera comandos SQL que podem ser executados manualmente para criar tabelas faltantes.
          </p>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"} className="mt-4">
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                )}
                <div className="w-full">
                  <AlertTitle>
                    {result.missingTables && result.missingTables.length > 0 
                      ? "Tabelas faltantes detectadas" 
                      : "Verificação concluída"}
                  </AlertTitle>
                  <AlertDescription className="mt-2">
                    <div className="space-y-2">
                      {result.missingTables && result.missingTables.length > 0 ? (
                        <div>
                          <p>Foram encontradas tabelas faltantes. Execute os comandos SQL abaixo no Console SQL do Supabase.</p>
                          <div className="flex gap-3 mt-2 flex-wrap">
                            <Badge variant="outline" className="bg-amber-50 border-amber-200">
                              {result.checkedTables?.length || 0} tabelas verificadas
                            </Badge>
                            <Badge variant="outline" className="bg-red-50 border-red-200">
                              {result.missingTables?.length || 0} tabelas faltantes
                            </Badge>
                          </div>
                          
                          <Accordion type="single" collapsible className="mt-4">
                            <AccordionItem value="commands">
                              <AccordionTrigger>Comandos SQL para criação de tabelas</AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-4">
                                  {result.sqlCommands?.map((command, index) => (
                                    <div key={index} className="relative">
                                      <pre className="bg-slate-950 text-slate-50 p-3 rounded text-xs overflow-auto whitespace-pre-wrap">
                                        {command}
                                      </pre>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="absolute top-2 right-2 h-8 w-8 p-0"
                                        onClick={() => copyToClipboard(command, index)}
                                      >
                                        {copiedCommandIndex === index ? (
                                          <CheckCircle className="h-4 w-4 text-green-500" />
                                        ) : (
                                          <Copy className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </div>
                      ) : (
                        <p>Todas as tabelas necessárias já existem no Supabase!</p>
                      )}
                      
                      <p className="text-xs text-muted-foreground mt-1">
                        Executado em: {new Date(result.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erro na verificação</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading && (
            <div className="space-y-2">
              <Progress value={30} className="h-2" />
              <p className="text-sm text-center text-muted-foreground">
                Verificando esquema do banco de dados...
              </p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={sincronizarTabelas}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              <DatabaseZap className="mr-2 h-4 w-4" />
              Verificar Tabelas
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SincronizarTabelas;
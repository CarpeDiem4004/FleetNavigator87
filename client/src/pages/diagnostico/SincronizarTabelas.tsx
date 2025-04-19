import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, DatabaseZap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

interface SyncResult {
  success: boolean;
  message: string;
  timestamp: string;
  tablesCreated: number;
  errors: number;
}

const SincronizarTabelas: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sincronizarTabelas = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

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
          title: "Sincronização concluída",
          description: `${data.tablesCreated} tabelas criadas com ${data.errors} erros.`,
          variant: data.success ? "default" : "destructive"
        });
      } else {
        setError(data.message || 'Erro desconhecido durante a sincronização');
        toast({
          title: "Erro de sincronização",
          description: data.message || 'Erro desconhecido durante a sincronização',
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

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DatabaseZap className="h-5 w-5 text-indigo-500" />
          Sincronizar Tabelas Supabase
        </CardTitle>
        <CardDescription>
          Cria tabelas faltantes no Supabase baseado na estrutura do Replit
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Esta ferramenta sincronizará o esquema do banco de dados do Supabase com o Replit,
            criando tabelas faltantes e adaptando as existentes. Use com cautela.
          </p>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"} className="mt-4">
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                )}
                <div>
                  <AlertTitle>
                    {result.success ? "Sincronização concluída" : "Sincronização com problemas"}
                  </AlertTitle>
                  <AlertDescription className="mt-2">
                    <div className="space-y-2">
                      <p>{result.message}</p>
                      <div className="flex gap-3 mt-2">
                        <Badge variant="outline" className="bg-green-50">
                          {result.tablesCreated} tabelas criadas
                        </Badge>
                        <Badge variant="outline" className={result.errors > 0 ? "bg-red-50" : "bg-gray-50"}>
                          {result.errors} erros
                        </Badge>
                      </div>
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
              <AlertTitle>Erro de sincronização</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading && (
            <div className="space-y-2">
              <Progress value={30} className="h-2" />
              <p className="text-sm text-center text-muted-foreground">
                Sincronizando esquema do banco de dados...
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
              Sincronizando...
            </>
          ) : (
            <>
              <DatabaseZap className="mr-2 h-4 w-4" />
              Sincronizar Tabelas
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SincronizarTabelas;
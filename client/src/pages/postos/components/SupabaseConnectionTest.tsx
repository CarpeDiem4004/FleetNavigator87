import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
// Usando o novo módulo auxiliar para garantir compatibilidade
import { checkConnection } from '../../../lib/supabase-helper';
import { useToast } from '@/hooks/use-toast';

export const SupabaseConnectionTest: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const testConnection = async () => {
    try {
      setIsLoading(true);
      const connected = await checkConnection();
      setIsConnected(connected);
      
      if (connected) {
        toast({
          title: 'Conexão ativa',
          description: 'A conexão com o Supabase está funcionando corretamente.',
          variant: 'default',
        });
      } else {
        toast({
          title: 'Falha na conexão',
          description: 'Não foi possível conectar ao Supabase. Verifique sua internet ou tente novamente mais tarde.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      setIsConnected(false);
      toast({
        title: 'Erro ao verificar conexão',
        description: 'Ocorreu um erro ao verificar a conexão.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {isConnected === true && <CheckCircle className="h-4 w-4 text-green-500" />}
          {isConnected === false && <XCircle className="h-4 w-4 text-red-500" />}
          {isConnected === null && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
          
          Status da Conexão
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            {isConnected === true && (
              <p className="text-sm text-green-600">Conectado ao Supabase</p>
            )}
            {isConnected === false && (
              <p className="text-sm text-red-600">Sem conexão com Supabase</p>
            )}
            {isConnected === null && (
              <p className="text-sm text-muted-foreground">Verificação pendente</p>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={testConnection}
            disabled={isLoading}
            className="gap-1"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Verificar</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SupabaseConnectionTest;
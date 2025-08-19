import React, { useState, useEffect, Fragment } from 'react';
import { useAuth } from '@/context/AuthContext';
import AuthManager from '@/lib/authManager';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Settings, RefreshCcw, Database, Key, Lock, Upload, ShieldCheck } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { supabase } from '@/lib/supabase-compat';
import { useToast } from '@/hooks/use-toast';

const StatusBadge = ({ success, label }: { success: boolean, label: string }) => (
  <Badge variant={success ? "success" : "destructive"} className="ml-2">
    {success ? (
      <CheckCircle className="h-3.5 w-3.5 mr-1" />
    ) : (
      <XCircle className="h-3.5 w-3.5 mr-1" />
    )}
    {label}
  </Badge>
);

// Definição das variantes de cores para o Badge
declare module '@/components/ui/badge' {
  interface BadgeVariants {
    variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'success';
  }
}

const AutenticacaoDiagnostico = () => {
  const { user, isLoading } = useAuth();
  const [diagnoseResult, setDiagnoseResult] = useState<any>(null);
  const [isRunningDiagnose, setIsRunningDiagnose] = useState(false);
  const [tokens, setTokens] = useState<Record<string, string | null>>({});
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();
  
  // Executar diagnóstico inicial
  useEffect(() => {
    runDiagnose();
    loadTokens();
  }, []);
  
  // Função para carregar informações sobre tokens armazenados
  const loadTokens = () => {
    const authToken = localStorage.getItem('authToken');
    const supabaseToken = localStorage.getItem('supabase.auth.token');
    const legacyToken = localStorage.getItem('token');
    
    setTokens({
      authToken: authToken ? `${authToken.substring(0, 10)}...` : null,
      supabaseToken: supabaseToken ? 'Presente (objeto JSON)' : null,
      legacyToken: legacyToken ? `${legacyToken.substring(0, 10)}...` : null,
    });
  };
  
  // Função para executar diagnóstico completo
  const runDiagnose = async () => {
    try {
      setIsRunningDiagnose(true);
      const result = await AuthManager.diagnoseAuthState();
      setDiagnoseResult(result);
      loadTokens(); // Recarregar informações de tokens após o diagnóstico
    } catch (error) {
      console.error('Erro ao executar diagnóstico:', error);
      toast({
        title: 'Erro no diagnóstico',
        description: String(error),
        variant: 'destructive',
      });
    } finally {
      setIsRunningDiagnose(false);
    }
  };
  
  // Função para tentar recuperação automática
  const attemptRecovery = async () => {
    try {
      toast({
        title: 'Recuperação iniciada',
        description: 'Tentando recuperar autenticação automaticamente...',
      });
      
      const success = await AuthManager.attemptAutoRecovery();
      
      if (success) {
        toast({
          title: 'Recuperação bem-sucedida',
          description: 'Sua sessão foi restaurada com sucesso.',
        });
      } else {
        toast({
          title: 'Recuperação falhou',
          description: 'Não foi possível recuperar sua sessão automaticamente.',
          variant: 'destructive',
        });
      }
      
      // Atualizar diagnóstico após tentativa
      await runDiagnose();
      
    } catch (error) {
      console.error('Erro na recuperação:', error);
      toast({
        title: 'Erro na recuperação',
        description: String(error),
        variant: 'destructive',
      });
    }
  };
  
  // Função para limpar todos os tokens
  const clearAllTokens = () => {
    if (window.confirm('Tem certeza que deseja limpar todos os tokens? Isso fará logout da aplicação.')) {
      AuthManager.clearAllAuth();
      toast({
        title: 'Tokens limpos',
        description: 'Todos os dados de autenticação foram removidos. Você será redirecionado para o login.',
      });
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    }
  };
  
  // Função para sincronizar tokens
  const syncTokens = () => {
    AuthManager.syncAllTokens();
    loadTokens();
    toast({
      title: 'Tokens sincronizados',
      description: 'Todos os tokens foram sincronizados com sucesso.',
    });
  };
  
  // Função para sincronizar sessão com o servidor
  const syncWithServer = async () => {
    try {
      toast({
        title: 'Sincronização iniciada',
        description: 'Tentando sincronizar com o servidor...',
      });
      
      const token = AuthManager.getLatestToken();
      
      if (!token) {
        throw new Error('Nenhum token disponível para sincronização');
      }
      
      const { data } = await supabase.auth.getUser(token);
      
      if (!data.user?.email) {
        throw new Error('Não foi possível obter email do usuário para ressincronização');
      }
      
      const email = data.user.email;
      
      const response = await fetch('/api/resync-session-jwt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email,
          user: { email }
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Falha ao ressincronizar sessão: ${response.status}`);
      }
      
      toast({
        title: 'Sincronização concluída',
        description: 'Sessão ressincronizada com o servidor com sucesso.',
      });
      
      // Atualizar diagnóstico após sincronização
      await runDiagnose();
      
    } catch (error) {
      console.error('Erro na sincronização:', error);
      toast({
        title: 'Erro na sincronização',
        description: String(error),
        variant: 'destructive',
      });
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Diagnóstico de Autenticação</h1>
            <p className="text-muted-foreground mt-1">
              Verifique e solucione problemas com seu estado de autenticação
            </p>
          </div>
          
          <Button 
            onClick={runDiagnose} 
            disabled={isRunningDiagnose}
            variant="outline"
            className="gap-2"
          >
            {isRunningDiagnose ? (
              <>
                <RefreshCcw className="h-4 w-4 animate-spin" />
                Executando...
              </>
            ) : (
              <>
                <RefreshCcw className="h-4 w-4" />
                Atualizar
              </>
            )}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">Estado do Usuário</CardTitle>
              <ShieldCheck className={`h-5 w-5 ${user ? 'text-green-500' : 'text-red-500'}`} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center text-muted-foreground">
                  <RefreshCcw className="h-4 w-4 animate-spin mr-2" />
                  Verificando autenticação...
                </div>
              ) : user ? (
                <div className="space-y-2">
                  <div className="font-medium text-lg">{user.name || user.email}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                  <div className="text-sm">
                    <span className="font-medium">Função:</span> {user.role}
                  </div>
                  {user.basename && (
                    <div className="text-sm">
                      <span className="font-medium">Base:</span> {user.basename}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-destructive flex items-center">
                  <XCircle className="h-4 w-4 mr-2" />
                  Não autenticado
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">Estado da Sessão</CardTitle>
              <Database className={`h-5 w-5 ${diagnoseResult?.hasServerSession ? 'text-green-500' : 'text-amber-500'}`} />
            </CardHeader>
            <CardContent>
              {isRunningDiagnose ? (
                <div className="flex items-center text-muted-foreground">
                  <RefreshCcw className="h-4 w-4 animate-spin mr-2" />
                  Verificando sessão...
                </div>
              ) : diagnoseResult ? (
                <div className="space-y-3">
                  <div className="flex items-center">
                    <span className="font-medium mr-2">Local:</span>
                    <StatusBadge 
                      success={diagnoseResult.hasLocalTokens} 
                      label={diagnoseResult.hasLocalTokens ? "Válido" : "Inválido"} 
                    />
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium mr-2">Supabase:</span>
                    <StatusBadge 
                      success={diagnoseResult.hasSupabaseSession} 
                      label={diagnoseResult.hasSupabaseSession ? "Válido" : "Inválido"} 
                    />
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium mr-2">Servidor:</span>
                    <StatusBadge 
                      success={diagnoseResult.hasServerSession} 
                      label={diagnoseResult.hasServerSession ? "Válido" : "Inválido"} 
                    />
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium mr-2">Token JWT:</span>
                    <StatusBadge 
                      success={diagnoseResult.tokenValid} 
                      label={diagnoseResult.tokenValid ? "Válido" : "Inválido"} 
                    />
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground">
                  Execute o diagnóstico para ver os detalhes
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">Ferramentas</CardTitle>
              <Settings className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button 
                  onClick={attemptRecovery} 
                  className="w-full gap-2 mb-2" 
                  variant="default"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Recuperação Automática
                </Button>
                
                <Button 
                  onClick={syncWithServer} 
                  className="w-full gap-2 mb-2" 
                  variant="outline"
                >
                  <Upload className="h-4 w-4" />
                  Ressincronizar com Servidor
                </Button>
                
                <Button 
                  onClick={syncTokens} 
                  className="w-full gap-2 mb-2" 
                  variant="outline"
                >
                  <Lock className="h-4 w-4" />
                  Sincronizar Tokens
                </Button>
                
                <Button 
                  onClick={clearAllTokens} 
                  className="w-full gap-2" 
                  variant="destructive"
                >
                  <Key className="h-4 w-4" />
                  Limpar Todos os Tokens
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Detalhes Técnicos</CardTitle>
            <CardDescription>
              Informações detalhadas sobre o estado de autenticação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="tokens">
                <AccordionTrigger>
                  <div className="flex items-center">
                    <Key className="h-4 w-4 mr-2" />
                    Tokens Armazenados
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="font-medium">authToken</div>
                        <div className="bg-muted p-2 rounded text-sm font-mono overflow-x-auto">
                          {tokens.authToken || 'Não encontrado'}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="font-medium">supabase.auth.token</div>
                        <div className="bg-muted p-2 rounded text-sm font-mono overflow-x-auto">
                          {tokens.supabaseToken || 'Não encontrado'}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="font-medium">token (legacy)</div>
                        <div className="bg-muted p-2 rounded text-sm font-mono overflow-x-auto">
                          {tokens.legacyToken || 'Não encontrado'}
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="diagnostic">
                <AccordionTrigger>
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Relatório de Diagnóstico
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {diagnoseResult?.detailedReport ? (
                    <pre className="bg-muted p-4 rounded text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                      {diagnoseResult.detailedReport.join('\n')}
                    </pre>
                  ) : (
                    <div className="text-muted-foreground">
                      Execute o diagnóstico para ver o relatório detalhado
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AutenticacaoDiagnostico;
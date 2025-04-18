import React, { useState } from 'react';
import { deleteRecords, fetchRecords, supabaseAdmin } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Trash2, RefreshCw, Database } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const AdminUtils: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [operationStatus, setOperationStatus] = useState<string | null>(null);

  // Verifica se o usuário é admin
  const isAdmin = user?.role === 'admin';

  const tables = [
    { name: 'abastecimentos_postos', label: 'Abastecimentos' },
    { name: 'recebimentos_combustivel', label: 'Recebimentos de Combustível' },
    { name: 'movimentacoes_patio', label: 'Movimentações de Pátio' },
    { name: 'controle_tanques', label: 'Controle de Tanques' },
    { name: 'status_tanques', label: 'Status de Tanques' },
    { name: 'entradas_combustivel', label: 'Entradas de Combustível' }
  ];

  const limparTodosDados = async () => {
    if (!isAdmin) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para realizar esta operação.",
        variant: "destructive"
      });
      return;
    }

    const confirmacao = window.confirm(
      'ATENÇÃO: Esta operação irá limpar TODOS os dados de todos os postos do sistema. ' +
      'Esta ação é irreversível e removerá todos os registros de abastecimentos, ' +
      'recebimentos, controle de pátio e outras informações. Deseja continuar?'
    );

    if (!confirmacao) return;

    // Segunda confirmação para ter certeza
    const segundaConfirmacao = window.confirm(
      'ÚLTIMA CHANCE: Tem certeza que deseja apagar permanentemente TODOS os dados? ' +
      'Digite "LIMPAR" na caixa de alerta para confirmar.'
    );

    if (!segundaConfirmacao) return;

    try {
      setIsLoading(true);
      setProgress(0);
      setOperationStatus("Iniciando limpeza dos dados...");

      // Processamento de cada tabela
      for (let i = 0; i < tables.length; i++) {
        const table = tables[i];
        setOperationStatus(`Buscando registros da tabela ${table.label}...`);
        
        // Busca todos os registros da tabela
        const registros = await fetchRecords(table.name, {});
        
        if (registros.length > 0) {
          setOperationStatus(`Apagando ${registros.length} registros de ${table.label}...`);
          const ids = registros.map(reg => reg.id);
          
          // Exclui todos os registros de uma vez
          await deleteRecords(table.name, ids);
        } else {
          setOperationStatus(`Nenhum registro encontrado em ${table.label}`);
        }

        // Atualiza o progresso
        setProgress(Math.round(((i + 1) / tables.length) * 100));
      }

      setOperationStatus("Limpeza de dados concluída com sucesso!");
      
      toast({
        title: "Dados limpos com sucesso",
        description: "Todos os dados foram removidos do sistema.",
        variant: "default"
      });
    } catch (error: any) {
      console.error('Erro ao limpar dados:', error);
      setOperationStatus(`Erro: ${error.message}`);
      
      toast({
        title: "Erro ao limpar dados",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetarStatusTanques = async () => {
    if (!isAdmin) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para realizar esta operação.",
        variant: "destructive"
      });
      return;
    }

    const confirmacao = window.confirm(
      'Deseja resetar os níveis de tanques de diesel e ARLA para os valores padrão? ' +
      'Esta ação irá definir capacidades padrão para todos os tanques e níveis iniciais.'
    );

    if (!confirmacao) return;

    try {
      setIsLoading(true);
      setOperationStatus("Resetando status dos tanques...");

      // Valor padrão para capacidade dos tanques
      const defaultDieselCapacidade = 20000; // 20.000 litros
      const defaultArlaCacacidade = 1000;    // 1.000 litros
      
      // Valor padrão para nível dos tanques (75% da capacidade)
      const defaultDieselNivel = Math.round(defaultDieselCapacidade * 0.75);
      const defaultArlaNivel = Math.round(defaultArlaCacacidade * 0.75);

      // Lista de postos
      const postos = ['Alfa', 'Beta', 'Gama', 'Delta', 'Epsilon'];
      
      for (const posto of postos) {
        setOperationStatus(`Configurando tanques para o posto ${posto}...`);
        
        // Verificar se já existe uma configuração para este posto
        const existingConfig = await fetchRecords('controle_tanques', {
          equals: { posto }
        });
        
        if (existingConfig.length > 0) {
          // Atualizar configuração existente
          const { data, error } = await supabaseAdmin
            .from('controle_tanques')
            .update({
              diesel_capacidade: defaultDieselCapacidade,
              diesel_nivel: defaultDieselNivel,
              arla_capacidade: defaultArlaCacacidade,
              arla_nivel: defaultArlaNivel,
              updated_at: new Date().toISOString()
            })
            .eq('posto', posto);
            
          if (error) throw new Error(`Erro ao atualizar tanques para posto ${posto}: ${error.message}`);
        } else {
          // Criar nova configuração
          const { data, error } = await supabaseAdmin
            .from('controle_tanques')
            .insert({
              posto,
              diesel_capacidade: defaultDieselCapacidade,
              diesel_nivel: defaultDieselNivel,
              arla_capacidade: defaultArlaCacacidade,
              arla_nivel: defaultArlaNivel,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
          if (error) throw new Error(`Erro ao criar tanques para posto ${posto}: ${error.message}`);
        }
      }

      setOperationStatus("Configuração dos tanques concluída!");
      
      toast({
        title: "Tanques configurados",
        description: "Todos os tanques foram configurados com valores padrão.",
        variant: "default"
      });
    } catch (error: any) {
      console.error('Erro ao configurar tanques:', error);
      setOperationStatus(`Erro: ${error.message}`);
      
      toast({
        title: "Erro ao configurar tanques",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-red-600">Acesso Restrito</CardTitle>
            <CardDescription>
              Esta página é restrita a administradores do sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              Você não tem permissão para acessar as ferramentas administrativas.
              Entre em contato com um administrador se precisar realizar operações de manutenção.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Ferramentas Administrativas</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Card de Limpeza de Dados */}
        <Card className="shadow-lg">
          <CardHeader className="bg-red-50 dark:bg-red-900/20">
            <CardTitle className="flex items-center text-red-700 dark:text-red-400">
              <Trash2 className="mr-2 h-5 w-5" />
              Limpeza de Dados
            </CardTitle>
            <CardDescription className="text-red-600/80 dark:text-red-400/80">
              Remover dados do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="mb-4 text-sm">
              Esta ferramenta permite limpar todos os dados operacionais do sistema, 
              incluindo registros de abastecimentos, movimentações de pátio e controle de tanques.
            </p>
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md mb-4">
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                <strong>ATENÇÃO:</strong> Esta ação é irreversível e apagará todos os dados.
                Use apenas quando for realmente necessário reiniciar o sistema.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={limparTodosDados}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Limpar Todos os Dados
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Card de Configuração de Tanques */}
        <Card className="shadow-lg">
          <CardHeader className="bg-blue-50 dark:bg-blue-900/20">
            <CardTitle className="flex items-center text-blue-700 dark:text-blue-400">
              <Database className="mr-2 h-5 w-5" />
              Configuração de Tanques
            </CardTitle>
            <CardDescription className="text-blue-600/80 dark:text-blue-400/80">
              Resetar níveis e capacidades
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="mb-4 text-sm">
              Esta ferramenta redefine as configurações de todos os tanques de combustível
              e ARLA para valores padrão, permitindo um reinício limpo do monitoramento.
            </p>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md mb-4">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                <strong>Configurações Padrão:</strong><br />
                - Tanque de Diesel: Capacidade 20.000L, Nível Inicial 15.000L<br />
                - Tanque de ARLA: Capacidade 1.000L, Nível Inicial 750L
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full border-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30"
              onClick={resetarStatusTanques}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Resetar Tanques
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Status da Operação */}
      {isLoading && (
        <Card className="mt-6 shadow-lg">
          <CardHeader>
            <CardTitle className="text-base font-medium">Status da Operação</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="h-2 mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {operationStatus || "Processando..."}
            </p>
          </CardContent>
        </Card>
      )}
      
      {!isLoading && operationStatus && (
        <Card className="mt-6 shadow-lg">
          <CardHeader>
            <CardTitle className="text-base font-medium">Resultado da Última Operação</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {operationStatus}
            </p>
          </CardContent>
        </Card>
      )}
      
      <div className="mt-8">
        <Separator className="my-6" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Estas ferramentas são destinadas apenas para administradores do sistema.
          O uso indevido pode resultar em perda permanente de dados.
        </p>
      </div>
    </div>
  );
};

export default AdminUtils;
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropletIcon, TruckIcon, AlertCircleIcon, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { supabaseAdmin } from '@/lib/supabase-compat';

interface RecebimentoItem {
  id: number;
  tipo_produto?: string;
  tipo_combustivel?: string; // Campo alternativo usado em alguns postos
  litros_recebidos?: number;
  quantidade_litros?: number; // Campo alternativo usado em alguns postos
  valor_total: number;
  nome_fornecedor?: string;
  fornecedor?: string; // Campo alternativo usado em alguns postos
  nome_operador?: string;
  operador?: string; // Campo alternativo usado em alguns postos
  usuario_operador?: string; // Campo alternativo usado em alguns postos
  observacoes?: string;
  created_at: string;
  data_hora?: string; // Campo formatado que pode estar presente
}

interface HistoricoRecebimentosProps {
  postId: string;
  className?: string;
}

export const HistoricoRecebimentos: React.FC<HistoricoRecebimentosProps> = ({ 
  postId,
  className = ''
}) => {
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [recebimentosList, setRecebimentosList] = useState<RecebimentoItem[]>([]);
  
  const queryClient = useQueryClient();
  
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/recebimentos/${postId.toLowerCase()}`],
    staleTime: 1000 * 60 * 5 // 5 minutos
  });

  // Função para iniciar o processo de exclusão
  const handleDeleteRecebimento = (id: number) => {
    setDeleteItemId(id);
    setIsDeleteDialogOpen(true);
  };

  // Função para confirmar e executar a exclusão de registro
  const handleConfirmDelete = async () => {
    if (!deleteItemId) return;
    
    setIsDeleting(true);
    
    try {
      console.log(`[DELETE SUPABASE] Excluindo registro ${deleteItemId} do posto ${postId} via Supabase`);
      
      // Mapear posto para nome da tabela de recebimentos
      const tableMap: { [key: string]: string } = {
        'osasco_v2': 'recebimentos_posto_osasco_v2',
        'abc_v2': 'recebimentos_posto_abc_v2',
        'alair_v2': 'recebimentos_posto_alair_v2',
        'campinas_v2': 'recebimentos_posto_campinas_v2',
        'socorro_v2': 'recebimentos_posto_socorro_v2',
        'sorocaba_v2': 'recebimentos_posto_sorocaba_v2',
        'guarulhos_v2': 'recebimentos_posto_guarulhos_v2'
      };
      
      const tableName = tableMap[postId.toLowerCase()];
      
      if (!tableName) {
        throw new Error(`Posto "${postId}" não encontrado no mapeamento de tabelas`);
      }
      
      // Excluir diretamente via Supabase
      const { data, error } = await supabaseAdmin
        .from(tableName)
        .delete()
        .eq('id', deleteItemId)
        .select();
      
      if (error) {
        console.error('[DELETE SUPABASE] Erro na exclusão:', error);
        throw new Error(error.message || 'Erro ao executar exclusão no banco');
      }
      
      // Verificar se algum registro foi afetado pela operação de DELETE
      console.log(`[DELETE SUPABASE] Operação executada. Registros afetados:`, data ? data.length : 0);
      
      // Sempre invalidar a query para recarregar os dados atualizados
      queryClient.invalidateQueries({ queryKey: [`/api/recebimentos/${postId.toLowerCase()}`] });
      setIsDeleteDialogOpen(false);
      setDeleteItemId(null);
      
      if (data && data.length > 0) {
        console.log(`[DELETE SUPABASE] Registro ${deleteItemId} excluído com sucesso`);
        alert('Registro excluído com sucesso!');
      } else {
        console.log(`[DELETE SUPABASE] Registro ${deleteItemId} não encontrado - pode ter sido removido por outra operação`);
        alert('Registro não encontrado. A lista foi atualizada.');
      }
    } catch (err: any) {
      console.error('❌ Erro ao excluir recebimento:', err);
      
      // Melhor tratamento de erro para mostrar detalhes
      let errorMessage = 'Erro desconhecido';
      
      if (err.response) {
        errorMessage = `${err.response.status} - ${err.response.data?.message || err.response.statusText}`;
      } else if (err.request) {
        errorMessage = 'Sem resposta do servidor';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      alert(`Erro ao excluir o registro: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Função para cancelar a exclusão
  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setDeleteItemId(null);
  };

  // Processar os dados da resposta da API
  const recebimentos = React.useMemo(() => {
    if (!data) return [];
    
    // Se a API retornar os dados em um formato diferente, adapte aqui
    const responseData = data as any;
    if (responseData?.data && Array.isArray(responseData.data)) {
      return responseData.data as RecebimentoItem[];
    }
    
    // Verificar se o data é um array diretamente (útil para testes e ambientes de desenvolvimento)
    if (Array.isArray(responseData)) {
      return responseData as RecebimentoItem[];
    }
    
    console.log("Dados recebidos na consulta:", responseData);
    return [];
  }, [data]);

  // Se estiver carregando, mostrar esqueletos
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TruckIcon className="h-5 w-5" /> 
            <Skeleton className="h-6 w-40" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-60" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Se ocorrer um erro, mostrar mensagem de erro
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircleIcon className="h-5 w-5" />
            Erro ao Carregar Recebimentos
          </CardTitle>
          <CardDescription>
            Não foi possível carregar o histórico de recebimentos. {error instanceof Error ? error.message : 'Tente novamente mais tarde.'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Se não houver dados, mostrar mensagem
  if (!recebimentos || recebimentos.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TruckIcon className="h-5 w-5" />
            Histórico de Entradas de Combustível
          </CardTitle>
          <CardDescription>
            Não há registros de recebimentos para este posto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <DropletIcon className="h-12 w-12 mb-4 opacity-40" />
            <p>Nenhum recebimento de combustível registrado ainda.</p>
            <p className="text-sm">Os recebimentos registrados aparecerão aqui.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Renderizar a tabela com os dados
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TruckIcon className="h-5 w-5" />
          Histórico de Entradas de Combustível
        </CardTitle>
        <CardDescription>
          Histórico de recebimentos de combustível para o posto {postId}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableCaption>Última atualização: {new Date().toLocaleString()}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Litros</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Operador</TableHead>
              <TableHead className="text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recebimentos.map((recebimento) => (
              <TableRow key={recebimento.id}>
                <TableCell className="font-medium">
                  {recebimento.data_hora ? recebimento.data_hora : new Date(recebimento.created_at).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <span 
                    className={
                      (recebimento.tipo_produto === 'Diesel' || recebimento.tipo_combustivel === 'Diesel') 
                      ? 'text-amber-600' 
                      : 'text-blue-600'
                    }
                  >
                    {recebimento.tipo_produto || recebimento.tipo_combustivel || 'N/D'}
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {recebimento.litros_recebidos
                    ? (typeof recebimento.litros_recebidos === 'number' 
                        ? recebimento.litros_recebidos.toLocaleString('pt-BR')
                        : Number(recebimento.litros_recebidos).toLocaleString('pt-BR'))
                    : recebimento.quantidade_litros
                      ? (typeof recebimento.quantidade_litros === 'number'
                          ? recebimento.quantidade_litros.toLocaleString('pt-BR')
                          : Number(recebimento.quantidade_litros).toLocaleString('pt-BR'))
                      : 'N/D'
                  }
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(recebimento.valor_total)}
                </TableCell>
                <TableCell className="max-w-[180px] truncate" 
                  title={recebimento.nome_fornecedor || recebimento.fornecedor || ''}>
                  {recebimento.nome_fornecedor || recebimento.fornecedor || 'N/D'}
                </TableCell>
                <TableCell className="max-w-[180px] truncate" 
                  title={recebimento.nome_operador || recebimento.operador || recebimento.usuario_operador || ''}>
                  {recebimento.nome_operador || recebimento.operador || recebimento.usuario_operador || 'N/D'}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRecebimento(recebimento.id)}
                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    title="Excluir registro"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      
      {/* Dialog de confirmação para exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este registro de recebimento? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default HistoricoRecebimentos;
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropletIcon, TruckIcon, AlertCircleIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';

interface RecebimentoItem {
  id: number;
  tipo_produto: string;
  litros_recebidos: number;
  valor_total: number;
  nome_fornecedor: string;
  nome_operador: string;
  observacoes?: string;
  created_at: string;
}

interface HistoricoRecebimentosProps {
  postId: string;
  className?: string;
}

export const HistoricoRecebimentos: React.FC<HistoricoRecebimentosProps> = ({ 
  postId,
  className = ''
}) => {
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/recebimentos/${postId.toLowerCase()}`],
    staleTime: 1000 * 60 * 5 // 5 minutos
  });

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
            </TableRow>
          </TableHeader>
          <TableBody>
            {recebimentos.map((recebimento) => (
              <TableRow key={recebimento.id}>
                <TableCell className="font-medium">
                  {new Date(recebimento.created_at).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <span className={recebimento.tipo_produto === 'Diesel' ? 'text-amber-600' : 'text-blue-600'}>
                    {recebimento.tipo_produto}
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {recebimento.litros_recebidos.toLocaleString('pt-BR')}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(recebimento.valor_total)}
                </TableCell>
                <TableCell className="max-w-[180px] truncate" title={recebimento.nome_fornecedor}>
                  {recebimento.nome_fornecedor}
                </TableCell>
                <TableCell className="max-w-[180px] truncate" title={recebimento.nome_operador}>
                  {recebimento.nome_operador}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default HistoricoRecebimentos;
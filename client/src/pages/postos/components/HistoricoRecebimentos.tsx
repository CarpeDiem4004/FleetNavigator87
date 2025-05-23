import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DownloadIcon, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import * as XLSX from 'xlsx';

interface RecebimentoItem {
  id: number;
  tipo_produto: string;
  litros_recebidos: number;
  valor_total: number;
  nome_fornecedor: string;
  nome_operador: string;
  data_hora?: string;
  created_at: string;
}

interface HistoricoRecebimentosProps {
  postId: string;
}

const HistoricoRecebimentos: React.FC<HistoricoRecebimentosProps> = ({ postId }) => {
  const [recebimentos, setRecebimentos] = useState<RecebimentoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecebimentos = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/recebimentos/${postId.toLowerCase().replace(/\s+/g, '_')}`);
      
      if (!response.ok) {
        throw new Error(`Erro ao carregar recebimentos: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setRecebimentos(data.data || []);
      } else {
        throw new Error(data.message || 'Erro desconhecido ao carregar recebimentos');
      }
    } catch (err: any) {
      console.error('Erro ao carregar recebimentos:', err);
      setError(err.message || 'Ocorreu um erro ao carregar os recebimentos. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecebimentos();
  }, [postId]);

  const handleExportExcel = () => {
    if (recebimentos.length === 0) return;

    // Prepara os dados para o Excel
    const worksheetData = recebimentos.map(item => ({
      'ID': item.id,
      'Tipo de Combustível': item.tipo_produto,
      'Quantidade (Litros)': item.litros_recebidos,
      'Valor Total (R$)': item.valor_total,
      'Fornecedor': item.nome_fornecedor,
      'Operador': item.nome_operador,
      'Data/Hora': item.data_hora || new Date(item.created_at).toLocaleString('pt-BR')
    }));

    // Cria a planilha
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Recebimentos');

    // Gera o arquivo e faz o download
    const fileName = `recebimentos_${postId.toLowerCase()}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl font-bold">Histórico de Entradas de Combustível</CardTitle>
          <CardDescription>
            Registro de todas as entradas de combustível do posto {postId}
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchRecebimentos}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportExcel}
            disabled={isLoading || recebimentos.length === 0}
          >
            <DownloadIcon className="h-4 w-4 mr-1" />
            Exportar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="rounded-md bg-destructive/15 p-4 mb-4">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}
        
        {isLoading ? (
          // Estado de carregamento
          <div className="space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : recebimentos.length === 0 ? (
          // Estado vazio
          <div className="text-center py-6">
            <p className="text-muted-foreground">
              Nenhum registro de entrada de combustível encontrado para este posto.
            </p>
          </div>
        ) : (
          // Tabela de recebimentos
          <div className="overflow-x-auto">
            <Table>
              <TableCaption>Histórico de entradas de combustível no posto {postId}</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Quantidade (L)</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Operador</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recebimentos.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.data_hora || new Date(item.created_at).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.tipo_produto === 'Diesel' ? 'default' : 'outline'}>
                        {item.tipo_produto}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.litros_recebidos.toLocaleString('pt-BR')}</TableCell>
                    <TableCell>{formatCurrency(item.valor_total)}</TableCell>
                    <TableCell>{item.nome_fornecedor}</TableCell>
                    <TableCell>{item.nome_operador}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HistoricoRecebimentos;
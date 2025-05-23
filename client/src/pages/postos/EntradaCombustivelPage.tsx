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
import { 
  Download, 
  RefreshCw, 
  Search, 
  TruckIcon, 
  Filter 
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';

interface RecebimentoItem {
  id: number;
  tipo_produto: string;
  litros_recebidos: number;
  valor_total: number;
  nome_fornecedor: string;
  nome_operador: string;
  data_hora?: string;
  created_at: string;
  posto?: string;
}

const POSTOS = [
  'osasco_v2',
  'guarulhos_v2', 
  'abc_v2',
  'socorro_v2',
  'alair_v2',
  'campinas_v2'
];

const EntradaCombustivelPage: React.FC = () => {
  const [recebimentos, setRecebimentos] = useState<RecebimentoItem[]>([]);
  const [filteredRecebimentos, setFilteredRecebimentos] = useState<RecebimentoItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPosto, setSelectedPosto] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState("");
  
  const { user } = useAuth();

  const fetchRecebimentosPosto = async (posto: string) => {
    try {
      const response = await fetch(`/api/recebimentos/${posto}`);
      
      if (!response.ok) {
        throw new Error(`Erro ao carregar recebimentos para ${posto}: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        return (data.data || []).map((item: any) => ({
          ...item,
          posto: posto
        }));
      }
      
      return [];
    } catch (err) {
      console.error(`Erro ao buscar recebimentos para ${posto}:`, err);
      return [];
    }
  };

  const fetchAllRecebimentos = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const allRecebimentosPromises = POSTOS.map(posto => fetchRecebimentosPosto(posto));
      const postoRecebimentos = await Promise.all(allRecebimentosPromises);
      
      // Combinar todos os recebimentos
      const allRecebimentos = postoRecebimentos.flat();
      
      // Ordenar por data (mais recente primeiro)
      const sortedRecebimentos = allRecebimentos.sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      setRecebimentos(sortedRecebimentos);
      setFilteredRecebimentos(sortedRecebimentos);
    } catch (err: any) {
      console.error('Erro ao carregar recebimentos:', err);
      setError(err.message || 'Ocorreu um erro ao carregar os recebimentos. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAllRecebimentos();
    }
  }, [user]);

  useEffect(() => {
    filterRecebimentos();
  }, [selectedPosto, searchTerm, recebimentos]);

  const filterRecebimentos = () => {
    let filtered = [...recebimentos];
    
    // Filtrar por posto
    if (selectedPosto !== "todos") {
      filtered = filtered.filter(item => item.posto === selectedPosto);
    }
    
    // Filtrar por termo de busca
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        (item.nome_fornecedor && item.nome_fornecedor.toLowerCase().includes(search)) ||
        (item.nome_operador && item.nome_operador.toLowerCase().includes(search)) ||
        (item.tipo_produto && item.tipo_produto.toLowerCase().includes(search))
      );
    }
    
    setFilteredRecebimentos(filtered);
  };

  const handleExportExcel = () => {
    if (filteredRecebimentos.length === 0) return;

    // Prepara os dados para o Excel
    const worksheetData = filteredRecebimentos.map(item => ({
      'Posto': formatPostoName(item.posto || ''),
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
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Entradas de Combustível');

    // Gera o arquivo e faz o download
    const date = format(new Date(), 'dd-MM-yyyy', {locale: ptBR});
    const fileName = `entradas_combustivel_${date}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Formatar nome do posto para exibição
  const formatPostoName = (name: string): string => {
    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <div className="container mx-auto py-6">
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <TruckIcon className="h-6 w-6" />
              Entradas de Combustível
            </CardTitle>
            <CardDescription>
              Histórico de todas as entradas de combustível registradas nos postos
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchAllRecebimentos}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportExcel}
              disabled={isLoading || filteredRecebimentos.length === 0}
            >
              <Download className="h-4 w-4 mr-1" />
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
          
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative w-full md:w-1/2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por fornecedor, operador ou tipo de combustível..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-1/2 flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedPosto} onValueChange={setSelectedPosto}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filtrar por posto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os postos</SelectItem>
                  {POSTOS.map((posto) => (
                    <SelectItem key={posto} value={posto}>
                      {formatPostoName(posto)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {isLoading ? (
            // Estado de carregamento
            <div className="space-y-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredRecebimentos.length === 0 ? (
            // Estado vazio
            <div className="text-center py-10">
              <p className="text-muted-foreground">
                Nenhum registro de entrada de combustível encontrado.
              </p>
            </div>
          ) : (
            // Tabela de recebimentos
            <div className="overflow-x-auto">
              <Table>
                <TableCaption>Total de {filteredRecebimentos.length} entradas de combustível encontradas</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Posto</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Quantidade (L)</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Operador</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecebimentos.map((item) => (
                    <TableRow key={`${item.posto}-${item.id}`}>
                      <TableCell className="font-medium">
                        {formatPostoName(item.posto || '')}
                      </TableCell>
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
    </div>
  );
};

export default EntradaCombustivelPage;
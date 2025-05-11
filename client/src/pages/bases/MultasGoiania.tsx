import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { FileWarning, Download, Filter, Search, Plus } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';

// Interface para as multas
interface Multa {
  id: number;
  numero: string;
  data_infracao: string;
  veiculo_placa: string;
  motorista_nome: string;
  valor: number;
  status: 'aguardando_base' | 'aguardando_assinatura' | 'assinado' | 'finalizado';
  local_infracao: string;
  data_vencimento: string;
  pontos?: number;
  tipo_infracao?: string;
  observacoes?: string;
  base_id?: number;
  base_nome?: string;
}

const MultasGoiania: React.FC = () => {
  const { toast } = useToast();
  const [filtro, setFiltro] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<string>('');
  const [dateRange, setDateRange] = useState<{start?: Date, end?: Date}>({});

  // Query para buscar multas
  const { data: multas, isLoading, refetch } = useQuery<Multa[]>({
    queryKey: ['/api/multas/base/goiania'],
    queryFn: () => apiRequest('GET', '/api/multas?base=goiania').then(res => res.json()),
  });

  // Filtrar multas com base nos critérios
  const multasFiltradas = React.useMemo(() => {
    if (!multas) return [];
    
    return multas.filter(multa => {
      // Filtro por texto (placa, motorista, número)
      const textoMatch = filtro === '' || 
        multa.veiculo_placa.toLowerCase().includes(filtro.toLowerCase()) ||
        (multa.motorista_nome && multa.motorista_nome.toLowerCase().includes(filtro.toLowerCase())) ||
        multa.numero.toLowerCase().includes(filtro.toLowerCase());
      
      // Filtro por status
      const statusMatch = statusFiltro === '' || multa.status === statusFiltro;
      
      // Filtro por intervalo de datas
      let dateMatch = true;
      if (dateRange.start) {
        const dataInfracao = new Date(multa.data_infracao);
        dateMatch = dateMatch && dataInfracao >= dateRange.start;
      }
      if (dateRange.end) {
        const dataInfracao = new Date(multa.data_infracao);
        dateMatch = dateMatch && dataInfracao <= dateRange.end;
      }
      
      return textoMatch && statusMatch && dateMatch;
    });
  }, [multas, filtro, statusFiltro, dateRange]);

  // Função para formatar o valor monetário
  const formatMoney = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });
  };
  
  // Função para formatar a data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };
  
  // Função para obter a classe de cor com base no status
  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'aguardando_base':
        return 'bg-yellow-100 text-yellow-800';
      case 'aguardando_assinatura':
        return 'bg-orange-100 text-orange-800';
      case 'assinado':
        return 'bg-blue-100 text-blue-800';
      case 'finalizado':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Função para obter o texto do status
  const getStatusText = (status: string) => {
    switch (status) {
      case 'aguardando_base':
        return 'Aguardando Base';
      case 'aguardando_assinatura':
        return 'Aguardando Assinatura';
      case 'assinado':
        return 'Assinado';
      case 'finalizado':
        return 'Finalizado';
      default:
        return status;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <FileWarning className="mr-2 h-8 w-8 text-indigo-600" />
            Multas da Base Goiânia
          </h1>
          <p className="text-slate-600 mt-2">
            Gerencie multas e infrações de trânsito da Base Goiânia
          </p>
        </div>
        <Button className="mt-4 md:mt-0" onClick={() => toast({
          title: "Funcionalidade em desenvolvimento",
          description: "O cadastro de novas multas estará disponível em breve."
        })}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Multa
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Utilize os filtros para encontrar multas específicas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-500" />
              <Input 
                placeholder="Buscar por placa, motorista..." 
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="flex-1"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select 
                value={statusFiltro} 
                onValueChange={setStatusFiltro}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os status</SelectItem>
                  <SelectItem value="aguardando_base">Aguardando Base</SelectItem>
                  <SelectItem value="aguardando_assinatura">Aguardando Assinatura</SelectItem>
                  <SelectItem value="assinado">Assinado</SelectItem>
                  <SelectItem value="finalizado">Finalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">De:</span>
              <DatePicker 
                date={dateRange.start} 
                setDate={(date) => setDateRange(prev => ({...prev, start: date || undefined}))} 
                className="flex-1"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Até:</span>
              <DatePicker 
                date={dateRange.end} 
                setDate={(date) => setDateRange(prev => ({...prev, end: date || undefined}))} 
                className="flex-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Multas Registradas</CardTitle>
          <CardDescription>
            {isLoading ? 'Carregando...' : `${multasFiltradas.length} multas encontradas`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-700"></div>
            </div>
          ) : multasFiltradas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {filtro || statusFiltro || dateRange.start || dateRange.end ? 
                'Nenhuma multa encontrada com os filtros aplicados' : 
                'Nenhuma multa registrada para a Base Goiânia'}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº da Infração</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Motorista</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {multasFiltradas.map((multa) => (
                    <TableRow key={multa.id}>
                      <TableCell className="font-medium">{multa.numero}</TableCell>
                      <TableCell>{multa.veiculo_placa}</TableCell>
                      <TableCell>{multa.motorista_nome || 'Não informado'}</TableCell>
                      <TableCell>{formatDate(multa.data_infracao)}</TableCell>
                      <TableCell>{formatMoney(multa.valor)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColorClass(multa.status)}`}>
                          {getStatusText(multa.status)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => toast({
                          title: "Funcionalidade em desenvolvimento",
                          description: "O acesso a detalhes da multa estará disponível em breve."
                        })}>
                          <Download className="h-4 w-4" />
                          <span className="sr-only">Download</span>
                        </Button>
                      </TableCell>
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

export default MultasGoiania;
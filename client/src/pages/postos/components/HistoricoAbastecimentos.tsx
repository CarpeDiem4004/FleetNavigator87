import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { 
  Fuel, 
  Droplet, 
  RefreshCw, 
  Download, 
  Search, 
  FileSpreadsheet,
  CalendarIcon
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ENDPOINTS, buscarDadosSupabase } from '@/constants/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HistoricoAbastecimentosProps {
  postId: string;
}

interface Abastecimento {
  id: number;
  placa: string;
  km_atual: number;
  tipo_combustivel: string;
  litros: number;
  preco_litro?: number;
  valor_total?: number;
  nome_motorista: string;
  nome_operador: string;
  project?: string;
  posto: string;
  created_at: string;
}

export const HistoricoAbastecimentos: React.FC<HistoricoAbastecimentosProps> = ({ postId }) => {
  const [abastecimentos, setAbastecimentos] = useState<Abastecimento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [dateStart, setDateStart] = useState<Date | undefined>(undefined);
  const [dateEnd, setDateEnd] = useState<Date | undefined>(undefined);
  
  const fetchAbastecimentos = async () => {
    try {
      setIsLoading(true);
      const queryParams = `posto=eq.${postId}&order=created_at.desc&limit=100`;
      const data = await buscarDadosSupabase(ENDPOINTS.ABASTECIMENTOS, queryParams);
      setAbastecimentos(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Erro ao buscar histórico de abastecimentos:', error);
      setAbastecimentos([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAbastecimentos();
    
    // Atualiza os dados a cada 2 minutos
    const interval = setInterval(() => {
      fetchAbastecimentos();
    }, 120000);
    
    return () => clearInterval(interval);
  }, [postId]);
  
  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return format(data, 'dd/MM/yyyy HH:mm', { locale: ptBR });
  };
  
  const formatarDataSimples = (dataString: string) => {
    const data = new Date(dataString);
    return format(data, 'dd/MM/yyyy', { locale: ptBR });
  };
  
  const formatarNumero = (valor: number) => {
    return new Intl.NumberFormat('pt-BR').format(Math.round(valor));
  };
  
  const formatarPreco = (valor?: number) => {
    if (!valor) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };
  
  const getTipoIcon = (tipo: string) => {
    if (tipo === 'Diesel') {
      return <Fuel className="h-4 w-4 text-amber-500" />;
    } else {
      return <Droplet className="h-4 w-4 text-blue-500" />;
    }
  };
  
  const getTipoBadge = (tipo: string) => {
    if (tipo === 'Diesel') {
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Diesel</Badge>;
    } else {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">ARLA</Badge>;
    }
  };
  
  const handleRefresh = () => {
    fetchAbastecimentos();
  };

  const exportToExcel = () => {
    // Filtrar dados de acordo com a data
    let dadosFiltrados = [...abastecimentos];
    
    if (dateStart) {
      const startDate = new Date(dateStart);
      startDate.setHours(0, 0, 0, 0);
      dadosFiltrados = dadosFiltrados.filter(item => new Date(item.created_at) >= startDate);
    }
    
    if (dateEnd) {
      const endDate = new Date(dateEnd);
      endDate.setHours(23, 59, 59, 999);
      dadosFiltrados = dadosFiltrados.filter(item => new Date(item.created_at) <= endDate);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      dadosFiltrados = dadosFiltrados.filter(item => 
        item.placa.toLowerCase().includes(term) ||
        item.nome_motorista.toLowerCase().includes(term) ||
        (item.project && item.project.toLowerCase().includes(term))
      );
    }
    
    // Preparar dados para CSV
    const headers = [
      'Data', 'Placa', 'KM', 'Tipo Combustível', 
      'Litros', 'Preço/L', 'Valor Total', 'Motorista', 
      'Operador', 'Projeto', 'Posto'
    ];
    
    const csvData = dadosFiltrados.map(item => [
      formatarData(item.created_at),
      item.placa,
      formatarNumero(item.km_atual),
      item.tipo_combustivel,
      formatarNumero(item.litros),
      item.preco_litro ? item.preco_litro.toFixed(2).replace('.', ',') : '-',
      item.valor_total ? item.valor_total.toFixed(2).replace('.', ',') : '-',
      item.nome_motorista,
      item.nome_operador,
      item.project || '-',
      item.posto
    ]);
    
    // Combinar headers e dados
    const csvContent = [
      headers.join(';'),
      ...csvData.map(row => row.join(';'))
    ].join('\n');
    
    // Criar e download do arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `abastecimentos_${postId}_${format(new Date(), 'dd-MM-yyyy')}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Filtragem de dados
  const filteredData = abastecimentos.filter(item => {
    let passesSearch = true;
    let passesDateFilter = true;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      passesSearch = Boolean(
        item.placa.toLowerCase().includes(term) ||
        item.nome_motorista.toLowerCase().includes(term) ||
        (item.project && item.project.toLowerCase().includes(term))
      );
    }
    
    if (dateStart) {
      const startDate = new Date(dateStart);
      startDate.setHours(0, 0, 0, 0);
      passesDateFilter = passesDateFilter && new Date(item.created_at) >= startDate;
    }
    
    if (dateEnd) {
      const endDate = new Date(dateEnd);
      endDate.setHours(23, 59, 59, 999);
      passesDateFilter = passesDateFilter && new Date(item.created_at) <= endDate;
    }
    
    return passesSearch && passesDateFilter;
  });
  
  return (
    <Card className="shadow-md">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-slate-50 border-b">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Fuel className="h-5 w-5" />
            Histórico de Abastecimentos
          </CardTitle>
          <div className="flex gap-2 items-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh} 
              disabled={isLoading}
              className="h-8 gap-1"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportToExcel}
              className="h-8 gap-1 bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
          </div>
        </div>
        <CardDescription>
          Registros recentes de abastecimentos realizados
        </CardDescription>
        
        {/* Filtros */}
        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar abastecimentos..."
              className="pl-8 pr-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <div className="grid gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={`w-[140px] justify-start text-left font-normal ${!dateStart ? "text-muted-foreground" : ""}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateStart ? format(dateStart, 'dd/MM/yyyy') : "Data inicial"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <DatePicker
                    mode="single"
                    selected={dateStart}
                    onSelect={setDateStart}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="grid gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={`w-[140px] justify-start text-left font-normal ${!dateEnd ? "text-muted-foreground" : ""}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateEnd ? format(dateEnd, 'dd/MM/yyyy') : "Data final"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <DatePicker
                    mode="single"
                    selected={dateEnd}
                    onSelect={setDateEnd}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
              <Fuel className="h-12 w-12 text-muted-foreground opacity-20" />
              <p>Nenhum abastecimento encontrado.</p>
              {searchTerm || dateStart || dateEnd ? (
                <p className="text-sm">Tente ajustar os filtros de busca.</p>
              ) : (
                <p className="text-sm">Os registros aparecerão aqui após o primeiro abastecimento.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableCaption>Total: {filteredData.length} abastecimentos</TableCaption>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Data</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Litros</TableHead>
                  <TableHead className="hidden md:table-cell">Preço/L</TableHead>
                  <TableHead className="hidden md:table-cell">Valor Total</TableHead>
                  <TableHead className="hidden md:table-cell">Posto</TableHead>
                  <TableHead className="hidden lg:table-cell">Motorista</TableHead>
                  <TableHead className="hidden lg:table-cell">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((abast) => (
                  <TableRow key={abast.id} className="hover:bg-muted/30">
                    <TableCell>{formatarDataSimples(abast.created_at)}</TableCell>
                    <TableCell className="font-medium">{abast.placa}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTipoIcon(abast.tipo_combustivel)}
                        <span className="hidden md:inline">{getTipoBadge(abast.tipo_combustivel)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">{formatarNumero(abast.litros)}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatarPreco(abast.preco_litro)}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatarPreco(abast.valor_total)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {abast.posto.charAt(0).toUpperCase() + abast.posto.slice(1)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{abast.nome_motorista}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12.1464 1.14645C12.3417 0.951184 12.6583 0.951184 12.8535 1.14645L14.8535 3.14645C15.0488 3.34171 15.0488 3.65829 14.8535 3.85355L10.9109 7.79618C10.8349 7.87218 10.7471 7.93543 10.651 7.9835L6.72359 9.94721C6.53109 10.0435 6.29861 10.0057 6.14643 9.85355C5.99425 9.70137 5.95652 9.46889 6.05277 9.27639L8.01648 5.34897C8.06455 5.25283 8.1278 5.16507 8.2038 5.08907L12.1464 1.14645ZM12.5 2.20711L8.91091 5.79618L7.87266 7.87267L8.12731 8.12732L10.2038 7.08907L13.7929 3.5L12.5 2.20711ZM9.99998 2L8.99998 3H4.9C4.47171 3 4.18056 3.00039 3.95552 3.01877C3.73631 3.03671 3.62421 3.06922 3.54601 3.10899C3.35785 3.20487 3.20487 3.35785 3.10899 3.54601C3.06922 3.62421 3.03671 3.73631 3.01877 3.95552C3.00039 4.18056 3 4.47171 3 4.9V11.1C3 11.5283 3.00039 11.8194 3.01877 12.0445C3.03671 12.2637 3.06922 12.3758 3.10899 12.454C3.20487 12.6422 3.35785 12.7951 3.54601 12.891C3.62421 12.9308 3.73631 12.9633 3.95552 12.9812C4.18056 12.9996 4.47171 13 4.9 13H11.1C11.5283 13 11.8194 12.9996 12.0445 12.9812C12.2637 12.9633 12.3758 12.9308 12.454 12.891C12.6422 12.7951 12.7951 12.6422 12.891 12.454C12.9308 12.3758 12.9633 12.2637 12.9812 12.0445C12.9996 11.8194 13 11.5283 13 11.1V6.99998L14 5.99998V11.1V11.1207C14 11.5231 14 11.8553 13.9779 12.1259C13.9549 12.407 13.9057 12.6653 13.782 12.908C13.5903 13.2843 13.2843 13.5903 12.908 13.782C12.6653 13.9057 12.407 13.9549 12.1259 13.9779C11.8553 14 11.5231 14 11.1207 14H11.1H4.9H4.87934C4.47686 14 4.14468 14 3.87409 13.9779C3.59304 13.9549 3.33469 13.9057 3.09202 13.782C2.7157 13.5903 2.40973 13.2843 2.21799 12.908C2.09434 12.6653 2.04506 12.407 2.0221 12.1259C1.99999 11.8553 1.99999 11.5231 2 11.1207V11.1206V11.1V4.9V4.87935V4.87932C1.99999 4.47685 1.99999 4.14468 2.0221 3.87409C2.04506 3.59304 2.09434 3.33469 2.21799 3.09202C2.40973 2.7157 2.7157 2.40973 3.09202 2.21799C3.33469 2.09434 3.59304 2.04506 3.87409 2.0221C4.14468 1.99999 4.47685 1.99999 4.87932 2H4.87935H4.9H9.99998Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                          </svg>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5.5 1C5.22386 1 5 1.22386 5 1.5C5 1.77614 5.22386 2 5.5 2H9.5C9.77614 2 10 1.77614 10 1.5C10 1.22386 9.77614 1 9.5 1H5.5ZM3 3.5C3 3.22386 3.22386 3 3.5 3H11.5C11.7761 3 12 3.22386 12 3.5C12 3.77614 11.7761 4 11.5 4H3.5C3.22386 4 3 3.77614 3 3.5ZM3.5 5C3.22386 5 3 5.22386 3 5.5C3 5.77614 3.22386 6 3.5 6H4V12C4 12.5523 4.44772 13 5 13H10C10.5523 13 11 12.5523 11 12V6H11.5C11.7761 6 12 5.77614 12 5.5C12 5.22386 11.7761 5 11.5 5H3.5ZM5 6H10V12H5V6Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                          </svg>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground py-3 border-t bg-muted/20">
        {!isLoading && (
          <div className="w-full flex justify-between items-center">
            <span>Total geral: {abastecimentos.length} abastecimentos</span>
            <span>Última atualização: {lastUpdated.toLocaleTimeString('pt-BR')}</span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default HistoricoAbastecimentos;
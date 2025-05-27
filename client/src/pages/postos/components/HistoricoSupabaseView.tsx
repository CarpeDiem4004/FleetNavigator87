import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { apiRequest } from '@/lib/queryClient';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  RefreshCw, 
  Download, 
  Info, 
  Search, 
  X, 
  Trash2, 
  AlertTriangle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';

interface HistoricoSupabaseViewProps {
  posto: string;
  showLimparButton?: boolean;
  refreshTrigger?: number;
}

interface HistoricoAbastecimento {
  id: number;
  placa: string;
  km: number;
  tipo_combustivel: string;
  quantidade_litros: number | string;  // Pode vir como string do banco
  nome_motorista: string;
  rg_motorista?: string;
  nome_operador: string;
  valor_litro: number | string;  // Pode vir como string do banco
  valor_total: number | string;  // Pode vir como string do banco
  tipo_veiculo?: string;
  observacoes?: string;
  lavagem: boolean;
  tipo_lavagem?: string;
  projeto?: string;  // Campo projeto do abastecimento
  data_hora: string;
  created_at: string;
}

const HistoricoSupabaseView: React.FC<HistoricoSupabaseViewProps> = ({ 
  posto, 
  showLimparButton = false,
  refreshTrigger = 0
}) => {
  const [historico, setHistorico] = useState<HistoricoAbastecimento[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  const [placaFiltro, setPlacaFiltro] = useState<string>('');
  const [historicoFiltrado, setHistoricoFiltrado] = useState<HistoricoAbastecimento[]>([]);
  
  // Estados para controle de exclusão
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const loadHistorico = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Prevenção de cache adicionando timestamp na URL
      const timestamp = new Date().getTime();
      
      // Usar a nova rota direta para evitar problemas com interceptação do Vite
      const response = await axios.get(`/api/historico-direto/${encodeURIComponent(posto)}?t=${timestamp}`, {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest' // Indicar que é uma solicitação AJAX
        }
      });
      
      console.log('Resposta do histórico:', response);
      
      if (response.data && response.data.success) {
        setHistorico(response.data.data || []);
        setLastRefreshTime(new Date());
      } else {
        setError(response.data?.error || 'Erro ao carregar o histórico');
        console.error('Erro na resposta:', response.data);
      }
    } catch (err: any) {
      console.error('Erro ao carregar histórico:', err);
      
      // Tentar a rota original como fallback
      try {
        console.log('Tentando rota alternativa...');
        const timestamp = new Date().getTime();
        const fallbackResponse = await axios.get(`/api/posto-supabase/historico/${posto.toLowerCase()}?t=${timestamp}`);
        
        if (fallbackResponse.data && fallbackResponse.data.success) {
          setHistorico(fallbackResponse.data.data || []);
          setLastRefreshTime(new Date());
        } else {
          setError(fallbackResponse.data?.error || 'Erro ao carregar o histórico');
        }
      } catch (fallbackErr: any) {
        setError(`Erro ao carregar histórico: ${err.message}. Fallback também falhou.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar dados quando o componente montar ou quando o refreshTrigger mudar
  useEffect(() => {
    console.log(`Carregando histórico do posto ${posto}, refreshTrigger: ${refreshTrigger}`);
    loadHistorico();

    // Configurar atualização automática a cada 45 segundos
    const intervalId = setInterval(() => {
      console.log(`Atualizando histórico automaticamente para ${posto}`);
      loadHistorico();
    }, 45000); // 45 segundos

    // Limpar o intervalo quando o componente for desmontado
    return () => clearInterval(intervalId);
  }, [posto, refreshTrigger]);
  
  // Aplicar filtros quando os parâmetros mudarem
  useEffect(() => {
    if (!historico.length) {
      setHistoricoFiltrado([]);
      return;
    }
    
    let resultados = [...historico];
    
    // Filtrar por data inicial
    if (dataInicio) {
      const dataInicioObj = new Date(dataInicio);
      dataInicioObj.setHours(0, 0, 0, 0);
      
      resultados = resultados.filter(item => {
        const itemDate = new Date(item.created_at);
        return itemDate >= dataInicioObj;
      });
    }
    
    // Filtrar por data final
    if (dataFim) {
      const dataFimObj = new Date(dataFim);
      dataFimObj.setHours(23, 59, 59, 999);
      
      resultados = resultados.filter(item => {
        const itemDate = new Date(item.created_at);
        return itemDate <= dataFimObj;
      });
    }
    
    // Filtrar por placa
    if (placaFiltro) {
      const placaLower = placaFiltro.toLowerCase();
      resultados = resultados.filter(item => 
        item.placa.toLowerCase().includes(placaLower)
      );
    }
    
    setHistoricoFiltrado(resultados);
  }, [historico, dataInicio, dataFim, placaFiltro]);

  // Função para formatar o valor do combustível
  const formatCurrency = (value: number | string): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
  };

  // Função para iniciar exclusão de registro
  const handleDeleteClick = (id: number) => {
    setDeleteItemId(id);
    setIsDeleteDialogOpen(true);
  };

  // Função para confirmar e executar a exclusão de registro
  const handleConfirmDelete = async () => {
    if (!deleteItemId) return;
    
    setIsDeleting(true);
    
    try {
      // Fazer a chamada para excluir o registro usando apiRequest com autenticação
      const response = await apiRequest('DELETE', `/api/abastecimento/${posto.toLowerCase()}/${deleteItemId}`);
      
      if (response && response.success) {
        // Atualizar a lista após exclusão bem-sucedida
        setHistorico(prev => prev.filter(item => item.id !== deleteItemId));
        setIsDeleteDialogOpen(false);
        setDeleteItemId(null);
        
        // Exibir mensagem de sucesso
        console.log(`Registro #${deleteItemId} excluído com sucesso`);
      } else {
        setError(response.data?.error || 'Erro ao excluir o registro');
      }
    } catch (err: any) {
      console.error('Erro ao excluir abastecimento:', err);
      setError(`Erro ao excluir: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Função para cancelar a exclusão
  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setDeleteItemId(null);
  };

  // Função para exportar histórico para Excel
  const exportToExcel = () => {
    if (historico.length === 0) return;

    // Formatar os dados para o Excel
    const workbookData = historico.map(item => ({
      'ID': item.id,
      'Data/Hora': item.data_hora,
      'Placa': item.placa,
      'KM': item.km,
      'Tipo de Combustível': item.tipo_combustivel,
      'Quantidade (L)': item.quantidade_litros,
      'Motorista': item.nome_motorista,
      'RG Motorista': item.rg_motorista || '-',
      'Operador': item.nome_operador,
      'Valor por Litro': item.valor_litro,
      'Valor Total': item.valor_total,
      'Tipo de Veículo': item.tipo_veiculo || '-',
      'Projeto': item.projeto || '-',
      'Lavagem': item.lavagem ? 'Sim' : 'Não',
      'Tipo de Lavagem': item.tipo_lavagem || '-',
      'Observações': item.observacoes || '-'
    }));

    // Criar planilha
    const worksheet = XLSX.utils.json_to_sheet(workbookData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Histórico");

    // Exportar para Excel
    const date = new Date();
    const formattedDate = format(date, 'dd-MM-yyyy_HH-mm', {locale: ptBR});
    const fileName = `historico_posto_${posto}_${formattedDate}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg">Histórico de Abastecimentos</CardTitle>
            <CardDescription>
              {isLoading ? 'Carregando dados...' : 
                `Últimos registros do posto ${posto.toUpperCase()}`}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadHistorico} 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Atualizar histórico</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={exportToExcel}
                    disabled={historico.length === 0 || isLoading}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Exportar para Excel</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      
      {/* Filtros de busca */}
      <div className="px-6 pb-2 pt-1">
        <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
          <div className="flex flex-col md:flex-row md:items-end gap-3">
            <div className="flex-1">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label htmlFor="dataInicio" className="text-xs mb-1 block">Data inicial</Label>
                  <Input 
                    id="dataInicio"
                    type="date" 
                    value={dataInicio} 
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="h-8"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="dataFim" className="text-xs mb-1 block">Data final</Label>
                  <Input 
                    id="dataFim"
                    type="date" 
                    value={dataFim} 
                    onChange={(e) => setDataFim(e.target.value)}
                    className="h-8"
                  />
                </div>
              </div>
            </div>
            <div className="flex-1">
              <Label htmlFor="placaFiltro" className="text-xs mb-1 block">Placa do veículo</Label>
              <div className="relative">
                <Input 
                  id="placaFiltro"
                  type="text" 
                  placeholder="Buscar por placa..." 
                  value={placaFiltro} 
                  onChange={(e) => setPlacaFiltro(e.target.value)}
                  className="h-8 pl-8"
                />
                <Search className="absolute left-2.5 top-1.5 h-4 w-4 text-slate-400" />
                {placaFiltro && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute right-0 top-0 h-8 w-8 p-0"
                    onClick={() => setPlacaFiltro('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setDataInicio('');
                  setDataFim('');
                  setPlacaFiltro('');
                }}
                disabled={!dataInicio && !dataFim && !placaFiltro}
                className="h-8"
              >
                Limpar filtros
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <CardContent>
        {error ? (
          <div className="flex items-center gap-2 text-destructive p-4 border border-destructive/20 rounded-md bg-destructive/10">
            <Info className="h-5 w-5" />
            <span>{error}</span>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-[100px]">Data/Hora</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead>Combustível</TableHead>
                  <TableHead>Projeto</TableHead>
                  <TableHead className="text-right">Litros</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-[50px] text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historico.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">
                      {isLoading ? (
                        <div className="flex justify-center items-center">
                          <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          <span>Carregando histórico...</span>
                        </div>
                      ) : (
                        "Nenhum registro de abastecimento encontrado"
                      )}
                    </TableCell>
                  </TableRow>
                ) : historicoFiltrado.length === 0 && (dataInicio || dataFim || placaFiltro) ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">
                      <div className="flex flex-col items-center justify-center text-slate-500">
                        <Search className="h-8 w-8 mb-2 text-slate-400" />
                        <p>Nenhum registro encontrado com os filtros aplicados</p>
                        <p className="text-sm mt-1">
                          {placaFiltro && <span>Placa: <Badge variant="outline">{placaFiltro}</Badge></span>}
                          {dataInicio && <span className="ml-2">De: <Badge variant="outline">{dataInicio}</Badge></span>}
                          {dataFim && <span className="ml-2">Até: <Badge variant="outline">{dataFim}</Badge></span>}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  // Mostrar dados filtrados ou todos os dados se não houver filtro
                  (dataInicio || dataFim || placaFiltro ? historicoFiltrado : historico).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">
                        {item.data_hora}
                      </TableCell>
                      <TableCell className="font-semibold">{item.placa}</TableCell>
                      <TableCell>
                        {item.tipo_combustivel}
                        {item.lavagem && (
                          <Badge variant="outline" className="ml-1 border-green-500 text-green-500">
                            Lavagem
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.projeto || item.project ? (
                          <Badge variant="outline" className="bg-blue-50">{item.projeto || item.project}</Badge>
                        ) : (
                          <span className="text-slate-400 text-xs">Não informado</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {typeof item.quantidade_litros === 'number' 
                          ? item.quantidade_litros.toFixed(2) 
                          : parseFloat(item.quantidade_litros).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(typeof item.valor_total === 'number' 
                          ? item.valor_total 
                          : parseFloat(item.valor_total))}
                      </TableCell>
                      <TableCell className="text-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteClick(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Excluir registro</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
      <CardFooter className="flex justify-between pt-0 text-xs text-muted-foreground">
        <span>
          {dataInicio || dataFim || placaFiltro ? (
            <>
              Mostrando {historicoFiltrado.length} de {historico.length} registros
              {(dataInicio || dataFim || placaFiltro) && " (filtrados)"}
            </>
          ) : (
            <>Mostrando {historico.length} registros</>
          )}
        </span>
        <span>
          Última atualização: {format(lastRefreshTime, 'dd/MM/yyyy HH:mm:ss')}
        </span>
      </CardFooter>

      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirmar exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este registro de abastecimento?
              <br /><br />
              <span className="font-semibold text-foreground">Esta ação não poderá ser desfeita.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Sim, excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default HistoricoSupabaseView;
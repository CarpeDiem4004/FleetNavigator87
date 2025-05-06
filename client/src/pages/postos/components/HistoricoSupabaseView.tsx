import React, { useEffect, useState } from 'react';
import axios from 'axios';
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
import { Loader2, RefreshCw, Download, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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

  const loadHistorico = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Prevenção de cache adicionando timestamp na URL
      const timestamp = new Date().getTime();
      
      // Adicionar token JWT ao cabeçalho, se disponível
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest' // Indicar que é uma solicitação AJAX
      };
      
      // Obter token do localStorage se existir
      const token = localStorage.getItem('authToken') || localStorage.getItem('access_token') || localStorage.getItem('jwt_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      console.log(`[FETCH] Buscando histórico para o posto: ${posto} com timestamp ${timestamp}`);
      
      // Usar a nova rota direta para evitar problemas com interceptação do Vite
      const response = await axios.get(`/api/historico-direto/${encodeURIComponent(posto)}?t=${timestamp}`, {
        headers,
        withCredentials: true // Incluir cookies para autenticação baseada em sessão
      });
      
      console.log(`[FETCH] Resposta da API de histórico:`, response.data);
      
      if (response.data && response.data.success) {
        console.log(`[FETCH] Histórico carregado com sucesso, ${response.data.data?.length || 0} registros encontrados`, response.data.data);
        
        // Verificar se os dados estão no formato esperado e adaptá-los se necessário
        if (Array.isArray(response.data.data)) {
          // Mapear os dados para garantir que estejam no formato correto
          const dadosFormatados = response.data.data.map((item: any) => {
            // Extrair todos os possíveis nomes de campos e mapeá-los para o formato padrão
            const processedItem = {
              id: item.id,
              placa: item.placa || item.veiculo || '',
              km: item.km || item.km_atual || item.hodometro || item.odometro || 0,
              tipo_combustivel: item.tipo_combustivel || item.tipo || 'Diesel',
              quantidade_litros: item.quantidade_litros || item.litros || item.quantidade || 0,
              nome_motorista: item.nome_motorista || item.motorista || item.motorista_nome || '',
              rg_motorista: item.rg_motorista || item.motorista_rg || '',
              nome_operador: item.nome_operador || item.operador || item.funcionario || '',
              valor_litro: item.valor_litro || item.preco_litro || item.valor_unitario || 0,
              valor_total: item.valor_total || 0,
              tipo_veiculo: item.tipo_veiculo || '',
              observacoes: item.observacoes || '',
              lavagem: item.lavagem || false,
              tipo_lavagem: item.tipo_lavagem || '',
              data_hora: item.data_hora || formatDate(item.created_at) || '',
              created_at: item.created_at
            };
            
            console.log('[FETCH] Item processado:', processedItem);
            return processedItem;
          });
          
          console.log('[FETCH] Dados formatados:', dadosFormatados);
          setHistorico(dadosFormatados);
          setLastRefreshTime(new Date());
        } else {
          console.error('[FETCH] Os dados não estão em formato de array:', response.data.data);
          setHistorico([]);
          setError('Formato de dados inesperado');
        }
      } else {
        console.error('[FETCH] Erro na resposta da API:', response.data);
        setError(response.data?.error || 'Erro ao carregar o histórico');
      }
    } catch (err: any) {
      console.error('[FETCH] Erro ao carregar histórico:', err);
      
      // Tentar a rota original como fallback
      try {
        console.log('[FETCH] Tentando rota alternativa...');
        const timestamp = new Date().getTime();
        const fallbackResponse = await axios.get(`/api/posto-supabase/historico/${posto.toLowerCase()}?t=${timestamp}`, {
          withCredentials: true // Incluir cookies para autenticação baseada em sessão
        });
        
        if (fallbackResponse.data && fallbackResponse.data.success) {
          console.log('[FETCH] Fallback bem-sucedido');
          setHistorico(fallbackResponse.data.data || []);
          setLastRefreshTime(new Date());
        } else {
          console.error('[FETCH] Erro na resposta do fallback:', fallbackResponse.data);
          setError(fallbackResponse.data?.error || 'Erro ao carregar o histórico');
        }
      } catch (fallbackErr: any) {
        console.error('[FETCH] Fallback também falhou:', fallbackErr);
        setError(`Erro ao carregar histórico: ${err.message}. Fallback também falhou.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar dados quando o componente montar ou quando o refreshTrigger mudar
  useEffect(() => {
    console.log(`[DEBUG] Carregando histórico do posto ${posto}, refreshTrigger: ${refreshTrigger}`);
    loadHistorico();

    // Verificações adicionais para garantir carregamento dos dados
    const timer1 = setTimeout(() => {
      console.log(`[DEBUG] Verificação adicional após 1s para posto ${posto}`);
      loadHistorico();
    }, 1000);

    const timer2 = setTimeout(() => {
      console.log(`[DEBUG] Verificação adicional após 2.5s para posto ${posto}`);
      loadHistorico();
    }, 2500);

    // Configurar atualização automática a cada 30 segundos
    const intervalId = setInterval(() => {
      console.log(`[DEBUG] Atualizando histórico automaticamente para ${posto}`);
      loadHistorico();
    }, 20000); // 20 segundos

    // Limpar os timers quando o componente for desmontado
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearInterval(intervalId);
    };
  }, [posto, refreshTrigger]);

  // Função para formatar uma data
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', {locale: ptBR});
    } catch (e) {
      console.error('[FORMAT] Erro ao formatar data:', e);
      return dateString;
    }
  };

  // Função para formatar o valor do combustível
  const formatCurrency = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(0);
    }
    
    let numValue: number;
    
    if (typeof value === 'string') {
      // Remover caracteres não numéricos, exceto pontos e vírgulas
      const cleanValue = value.replace(/[^\d.,]/g, '')
        // Substituir vírgula por ponto para parsing correto
        .replace(',', '.');
      
      numValue = cleanValue ? parseFloat(cleanValue) : 0;
    } else {
      numValue = value;
    }
    
    // Verificar se é um número válido
    if (isNaN(numValue)) {
      numValue = 0;
    }
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
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
                  <TableHead className="w-[140px]">Data/Hora</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead>Combustível</TableHead>
                  <TableHead className="text-right">Litros</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historico.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
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
                ) : (
                  historico.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">
                        {item.data_hora || format(new Date(item.created_at), 'dd/MM/yyyy HH:mm', {locale: ptBR})}
                      </TableCell>
                      <TableCell className="font-semibold">{item.placa}</TableCell>
                      <TableCell>
                        <Badge
                          variant={item.tipo_combustivel?.toUpperCase() === 'ARLA' ? "outline" : "default"}
                          className={
                            item.tipo_combustivel?.toUpperCase() === 'DIESEL' ? "bg-amber-500 hover:bg-amber-600" :
                            item.tipo_combustivel?.toUpperCase() === 'ARLA' ? "border-blue-500 text-blue-500" :
                            undefined
                          }
                        >
                          {item.tipo_combustivel}
                        </Badge>
                        {item.lavagem && (
                          <Badge variant="outline" className="ml-1 border-green-500 text-green-500">
                            Lavagem
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {typeof item.quantidade_litros === 'number' 
                          ? item.quantidade_litros.toFixed(2) 
                          : parseFloat(String(item.quantidade_litros || '0')).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(typeof item.valor_total === 'number' 
                          ? item.valor_total 
                          : parseFloat(String(item.valor_total || '0')))}
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
          Mostrando {historico.length} registros
        </span>
        <span>
          Última atualização: {format(lastRefreshTime, 'dd/MM/yyyy HH:mm:ss')}
        </span>
      </CardFooter>
    </Card>
  );
};

export default HistoricoSupabaseView;
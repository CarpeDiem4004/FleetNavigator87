import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck, ArrowUpRight, ArrowDownLeft, Settings, RefreshCw, Download } from 'lucide-react';

interface HistoricoMovimentacoesProps {
  postId: string;
  refreshTrigger?: number;
}

interface Movimentacao {
  id: number;
  placa: string;
  tipo_movimento: string | null;
  motorista: string | null;      // Coluna motorista para os postos que usam essa nomenclatura
  motorista_rg?: string | null;  // Coluna do posto ABC_v2
  nome_motorista?: string | null; // Compatibilidade com outras interfaces
  operador: string | null;       // Coluna operador dos postos ABC_v2
  nome_operador?: string | null; // Compatibilidade com outras interfaces
  posto?: string;                // Campo derivado (não presente na tabela)
  tipo_veiculo?: string | null;
  km_registrado?: number | null;
  destino?: string | null;
  origem?: string | null;
  observacoes?: string | null;
  data_movimento?: string;      // Campo específico da tabela de movimentações
  created_at: string;           // Timestamp padrão
  updated_at?: string;
  motivo?: string | null;       // Campos de compatibilidade
  data_entrada?: string | null;
  data_saida?: string | null;
}

export const HistoricoMovimentacoes: React.FC<HistoricoMovimentacoesProps> = ({ postId, refreshTrigger = 0 }) => {
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // Função para capitalizar a primeira letra
  const formatPosto = (posto: string) => {
    return posto.charAt(0).toUpperCase() + posto.slice(1);
  };
  
  const fetchMovimentacoes = async () => {
    try {
      setIsLoading(true);
      console.log("[FETCH] Buscando movimentações de pátio para o posto:", postId);
      console.log("[FETCH] Usando nome capitalizado:", formatPosto(postId));
      
      // Verifica se é o posto ABC_v2 para usar a API direta
      const isAbcV2 = postId.toLowerCase().includes('abc_v2') || postId.toLowerCase().includes('abc v2');
      
      // Determinar URL da API baseada no tipo de posto
      let apiUrl = isAbcV2 
        ? `/api/movimentacoes-patio-direto/${postId.toLowerCase().replace(' ', '_')}`
        : `/api/movimentacoes-patio/${postId}`;
        
      console.log("[FETCH] Usando API:", apiUrl);
      
      // Usando a API do servidor para buscar os dados
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        console.error('[FETCH] Erro ao buscar movimentações:', response.statusText);
        setMovimentacoes([]);
        return;
      }
      
      const result = await response.json();
      
      // Verificar se a operação foi bem-sucedida e extrair os dados
      if (result.success) {
        console.log("[FETCH] Movimentações recuperadas:", result.data?.length || 0);
        
        // Mapear e normalizar os dados
        const dadosNormalizados = result.data.map((item: any) => {
          return {
            ...item,
            // Normalizar nomes de campos para compatibilidade com a interface
            nome_motorista: item.nome_motorista || item.motorista || null,
            nome_operador: item.nome_operador || item.operador || null,
            posto: result.posto || postId,
            // Garantir que há uma data formatada
            data_formatted: item.data_movimento || item.created_at
          };
        });
        
        console.log("[FETCH] Dados normalizados:", dadosNormalizados.length);
        setMovimentacoes(dadosNormalizados || []);
      } else {
        console.error('[FETCH] Erro ao buscar movimentações:', result.message);
        setMovimentacoes([]);
      }
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Erro ao buscar histórico de movimentações:', error);
      setMovimentacoes([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Efeito para carregar dados iniciais e configurar atualização automática
  useEffect(() => {
    fetchMovimentacoes();
    
    // Atualiza os dados a cada 2 minutos
    const interval = setInterval(() => {
      fetchMovimentacoes();
    }, 120000);
    
    return () => clearInterval(interval);
  }, [postId]);
  
  // Efeito para reagir a mudanças no refreshTrigger (atualizações forçadas)
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log("[HISTORICO] Atualizando movimentações por causa do refreshTrigger:", refreshTrigger);
      fetchMovimentacoes();
    }
  }, [refreshTrigger]);
  
  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };
  
  const getTipoIcon = (tipo: string | null) => {
    if (!tipo) return <Settings className="h-4 w-4 text-orange-500" />;
    
    if (tipo.includes('Entrada')) {
      return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
    } else if (tipo.includes('Saída')) {
      return <ArrowUpRight className="h-4 w-4 text-blue-500" />;
    } else {
      return <Settings className="h-4 w-4 text-orange-500" />;
    }
  };
  
  const getTipoBadge = (tipo: string | null) => {
    if (!tipo) return <Badge variant="outline">Desconhecido</Badge>;
    
    if (tipo.includes('Entrada')) {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Entrada</Badge>;
    } else if (tipo.includes('Saída para rota')) {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Saída Rota</Badge>;
    } else if (tipo.includes('Saída para manutenção')) {
      return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Saída Manutenção</Badge>;
    } else {
      return <Badge variant="outline">{tipo}</Badge>;
    }
  };
  
  const handleRefresh = () => {
    fetchMovimentacoes();
  };
  
  const handleExportarExcel = async () => {
    if (movimentacoes.length === 0) return;
    
    try {
      // Importar a biblioteca xlsx dinamicamente
      const XLSX = await import('xlsx');
      
      // Preparar os dados para Excel
      const excelData = movimentacoes.map(item => ({
        'Placa': item.placa,
        'Tipo de Movimento': item.tipo_movimento || '-',
        'Motorista': item.nome_motorista || '-',
        'Operador': item.nome_operador || '-',
        'Posto': item.posto,
        'Data/Hora': formatarData(item.created_at),
        'Motivo': item.motivo || '-'
      }));
      
      // Criar uma nova planilha
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Criar um novo livro
      const workbook = XLSX.utils.book_new();
      
      // Adicionar a planilha ao livro
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Movimentações');
      
      // Gerar arquivo e fazer download
      XLSX.writeFile(workbook, `movimentacoes_patio_${formatPosto(postId)}_${new Date().toISOString().slice(0, 10)}.xlsx`);
      
      console.log('Exportação concluída com sucesso');
    } catch (error) {
      console.error('Erro ao exportar para Excel:', error);
      alert('Erro ao exportar dados. Por favor, tente novamente.');
    }
  };
  
  return (
    <Card className="shadow-md">
      <CardHeader className="bg-gradient-to-r from-green-50 to-slate-50 border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-green-700">
            <Truck className="h-5 w-5" />
            Movimentações de Pátio
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportarExcel} 
              disabled={isLoading || movimentacoes.length === 0}
              className="h-8 gap-1"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
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
          </div>
        </div>
        <CardDescription>
          Registros recentes de entrada e saída de veículos
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : movimentacoes.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
              <Truck className="h-12 w-12 text-muted-foreground opacity-20" />
              <p>Nenhuma movimentação registrada.</p>
              <p className="text-sm">Os registros aparecerão aqui após a primeira movimentação.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableCaption>Lista das últimas 20 movimentações</TableCaption>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Placa</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Motorista</TableHead>
                  <TableHead className="hidden md:table-cell">Operador</TableHead>
                  <TableHead className="hidden md:table-cell">Data/Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimentacoes.map((mov) => (
                  <TableRow key={mov.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">{mov.placa}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTipoIcon(mov.tipo_movimento)}
                        <span className="hidden md:inline">{getTipoBadge(mov.tipo_movimento)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{mov.nome_motorista}</TableCell>
                    <TableCell className="hidden md:table-cell">{mov.nome_operador}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                      {formatarData(mov.created_at)}
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
            <span>Total: {movimentacoes.length} movimentações</span>
            <span>Última atualização: {lastUpdated.toLocaleTimeString('pt-BR')}</span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default HistoricoMovimentacoes;
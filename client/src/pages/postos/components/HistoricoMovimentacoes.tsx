import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck, ArrowUpRight, ArrowDownLeft, Settings, RefreshCw, Download } from 'lucide-react';
import { fetchRecords } from '@/lib/supabase-client';

interface HistoricoMovimentacoesProps {
  postId: string;
}

interface Movimentacao {
  id: number;
  placa: string;
  tipo_movimento: string;
  nome_motorista: string;
  nome_operador: string;
  posto: string;
  created_at: string;
}

export const HistoricoMovimentacoes: React.FC<HistoricoMovimentacoesProps> = ({ postId }) => {
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
      
      // Usando o cliente Supabase para buscar dados com permissões administrativas
      const data = await fetchRecords('movimentacoes_patio', {
        equals: { posto: formatPosto(postId) },
        order: { created_at: 'desc' },
        limit: 20
      });
      
      console.log("[FETCH] Movimentações recuperadas:", data?.length || 0);
      setMovimentacoes(data || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Erro ao buscar histórico de movimentações:', error);
      setMovimentacoes([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchMovimentacoes();
    
    // Atualiza os dados a cada 2 minutos
    const interval = setInterval(() => {
      fetchMovimentacoes();
    }, 120000);
    
    return () => clearInterval(interval);
  }, [postId]);
  
  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };
  
  const getTipoIcon = (tipo: string) => {
    if (tipo.includes('Entrada')) {
      return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
    } else if (tipo.includes('Saída')) {
      return <ArrowUpRight className="h-4 w-4 text-blue-500" />;
    } else {
      return <Settings className="h-4 w-4 text-orange-500" />;
    }
  };
  
  const getTipoBadge = (tipo: string) => {
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
  
  const handleExportarExcel = () => {
    if (movimentacoes.length === 0) return;
    
    // Preparar dados para CSV
    const headers = [
      'Placa', 'Tipo de Movimento', 'Motorista', 'Operador',
      'Posto', 'Data/Hora'
    ];
    
    const csvData = movimentacoes.map(item => [
      item.placa,
      item.tipo_movimento,
      item.nome_motorista,
      item.nome_operador,
      item.posto,
      formatarData(item.created_at)
    ]);
    
    // Combinar headers e dados
    const csvContent = [
      headers.join(';'),
      ...csvData.map(row => row.join(';'))
    ].join('\n');
    
    // Criar e download do arquivo usando uma abordagem segura
    try {
      // Criar Blob com os dados CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Para navegadores modernos
      const url = URL.createObjectURL(blob);
      
      // Criar link para download sem anexá-lo ao DOM
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `movimentacoes_patio_${formatPosto(postId)}_${new Date().toISOString().slice(0, 10)}.csv`;
      
      // Esta abordagem funciona sem problemas de removeChild
      document.body.appendChild(a);
      a.click();
      
      // Remover o elemento e liberar o recurso
      window.setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Erro ao criar arquivo para download:', error);
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
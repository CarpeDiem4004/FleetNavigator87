import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Fuel, Droplet, RefreshCw } from 'lucide-react';
import { ENDPOINTS, buscarDadosSupabase } from '@/constants/supabase';

interface HistoricoAbastecimentosProps {
  postId: string;
}

interface Abastecimento {
  id: number;
  placa: string;
  km_atual: number;
  tipo_combustivel: string;
  litros: number;
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
  
  const fetchAbastecimentos = async () => {
    try {
      setIsLoading(true);
      const queryParams = `posto=eq.${postId}&order=created_at.desc&limit=20`;
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
    return data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatarNumero = (valor: number) => {
    return new Intl.NumberFormat('pt-BR').format(Math.round(valor));
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
  
  return (
    <Card className="shadow-md">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-slate-50 border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Fuel className="h-5 w-5" />
            Histórico de Abastecimentos
          </CardTitle>
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
        <CardDescription>
          Registros recentes de abastecimentos realizados
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : abastecimentos.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
              <Fuel className="h-12 w-12 text-muted-foreground opacity-20" />
              <p>Nenhum abastecimento registrado.</p>
              <p className="text-sm">Os registros aparecerão aqui após o primeiro abastecimento.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableCaption>Lista dos últimos 20 abastecimentos</TableCaption>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Placa</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Litros</TableHead>
                  <TableHead className="hidden md:table-cell">KM</TableHead>
                  <TableHead className="hidden md:table-cell">Motorista</TableHead>
                  <TableHead className="hidden lg:table-cell">Projeto</TableHead>
                  <TableHead className="hidden lg:table-cell">Data/Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {abastecimentos.map((abast) => (
                  <TableRow key={abast.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">{abast.placa}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTipoIcon(abast.tipo_combustivel)}
                        <span className="hidden md:inline">{getTipoBadge(abast.tipo_combustivel)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">{formatarNumero(abast.litros)}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatarNumero(abast.km_atual)}</TableCell>
                    <TableCell className="hidden md:table-cell">{abast.nome_motorista}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {abast.project && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {abast.project}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                      {formatarData(abast.created_at)}
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
            <span>Total: {abastecimentos.length} abastecimentos</span>
            <span>Última atualização: {lastUpdated.toLocaleTimeString('pt-BR')}</span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default HistoricoAbastecimentos;
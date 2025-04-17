import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Fuel, Droplet } from 'lucide-react';
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
  posto: string;
  created_at: string;
}

export const HistoricoAbastecimentos: React.FC<HistoricoAbastecimentosProps> = ({ postId }) => {
  const [abastecimentos, setAbastecimentos] = useState<Abastecimento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function fetchAbastecimentos() {
      try {
        setIsLoading(true);
        // Usando a nova função buscarDadosSupabase
        const queryParams = `posto=eq.${postId}&order=created_at.desc&limit=10`;
        const data = await buscarDadosSupabase(ENDPOINTS.ABASTECIMENTOS, queryParams);
        setAbastecimentos(data);
      } catch (error) {
        console.error('Erro ao buscar histórico de abastecimentos:', error);
        // Em caso de erro, inicializa com array vazio para evitar erro de renderização
        setAbastecimentos([]);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchAbastecimentos();
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
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fuel className="h-5 w-5" />
          Histórico de Abastecimentos
        </CardTitle>
        <CardDescription>
          Registros recentes de abastecimentos realizados
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : abastecimentos.length === 0 ? (
          <div className="text-center p-6 text-muted-foreground">
            Nenhum abastecimento registrado.
          </div>
        ) : (
          <Table>
            <TableCaption>Lista dos 10 últimos abastecimentos</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Placa</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Litros</TableHead>
                <TableHead className="hidden md:table-cell">KM</TableHead>
                <TableHead className="hidden md:table-cell">Motorista</TableHead>
                <TableHead className="hidden lg:table-cell">Data/Hora</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {abastecimentos.map((abast) => (
                <TableRow key={abast.id}>
                  <TableCell className="font-medium">{abast.placa}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTipoIcon(abast.tipo_combustivel)}
                      <span className="hidden md:inline">{getTipoBadge(abast.tipo_combustivel)}</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatarNumero(abast.litros)}</TableCell>
                  <TableCell className="hidden md:table-cell">{formatarNumero(abast.km_atual)}</TableCell>
                  <TableCell className="hidden md:table-cell">{abast.nome_motorista}</TableCell>
                  <TableCell className="hidden lg:table-cell">{formatarData(abast.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground pt-2 border-t">
        {!isLoading && (
          <div className="w-full flex justify-between">
            <span>Total: {abastecimentos.length} abastecimentos</span>
            <span>Última atualização: {new Date().toLocaleTimeString()}</span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default HistoricoAbastecimentos;
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { differenceInDays, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Truck, AlertCircle, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface VeiculoParado {
  id: number;
  placa: string;
  modelo?: string;
  base: string;
  status: string;
  data_parada: string;
  motivo_parada?: string;
  dias_parado: number;
}

const VeiculosParadosCard: React.FC = () => {
  const { toast } = useToast();
  const [veiculosParados, setVeiculosParados] = useState<VeiculoParado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Função para limpar os dados
  const clearVeiculos = useCallback(() => {
    setVeiculosParados([]);
  }, []);

  // Função para buscar dados com a opção de mostrar ou não o carregamento
  const fetchVeiculosParados = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }
    setError(null);

    try {
      // Buscar operações do LineHall com status "parado"
      const { data, error } = await supabase
        .from('linehall_shopee')
        .select(`
          id,
          veiculo_placa,
          data_parada,
          motivo_parada,
          status,
          base:base_id(name),
          vehicles:veiculo_placa(model)
        `)
        .or('status.eq.parado,status.eq.PARADO')
        .order('data_parada', { ascending: true });

      if (error) throw error;

      const hoje = new Date();
      
      // Transformar os dados
      const veiculosFormatados = data.map((item: any) => {
        const dataParada = item.data_parada ? parseISO(item.data_parada) : hoje;
        const diasParado = differenceInDays(hoje, dataParada) || 0;
        
        return {
          id: item.id,
          placa: item.veiculo_placa,
          modelo: item.vehicles?.model,
          base: item.base?.name || 'Não definida',
          status: item.status,
          data_parada: item.data_parada,
          motivo_parada: item.motivo_parada,
          dias_parado: diasParado
        };
      });

      setVeiculosParados(veiculosFormatados);
      // Atualizar horário da última atualização
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Erro ao buscar veículos parados:', err);
      setError('Não foi possível carregar os veículos parados. Tente novamente mais tarde.');
      if (!showLoading) {
        toast({
          title: "Erro na atualização",
          description: "Não foi possível atualizar os dados de veículos parados",
          variant: "destructive"
        });
      }
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, [toast]);

  // Agrupar por dias parados para melhor visualização
  const getCategoriaParada = (dias: number) => {
    if (dias > 30) return 'critico';
    if (dias > 14) return 'grave';
    if (dias > 7) return 'medio';
    return 'recente';
  };

  // Configurar atualização automática
  useEffect(() => {
    // Inicializar com dados limpos e carregar dados iniciais
    clearVeiculos();
    fetchVeiculosParados();
    
    // Configurar atualização automática
    if (autoRefresh) {
      autoRefreshTimerRef.current = setInterval(() => {
        fetchVeiculosParados(false); // Atualizar sem mostrar indicador de carregamento
      }, 45000); // A cada 45 segundos
    }
    
    // Limpeza ao desmontar o componente
    return () => {
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
      }
    };
  }, [fetchVeiculosParados, clearVeiculos, autoRefresh]);

  // Ordenar veículos por tempo parado (maior para menor)
  const veiculosOrdenados = [...veiculosParados].sort((a, b) => b.dias_parado - a.dias_parado);
  
  // Limitar a 5 veículos para exibição no card
  const topVeiculos = veiculosOrdenados.slice(0, 5);
  
  // Forçar atualização manual
  const handleManualRefresh = () => {
    fetchVeiculosParados();
    toast({
      title: "Dados atualizados",
      description: "A lista de veículos parados foi atualizada."
    });
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <CardTitle>Veículos Parados</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              {veiculosParados.length} veículo(s)
            </Badge>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7" 
              onClick={handleManualRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <CardDescription>
          Veículos do LineHall que estão parados e há quantos dias
        </CardDescription>
        {lastUpdated && (
          <div className="mt-1">
            <p className="text-xs text-gray-400">
              Atualizado às {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-28">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-800"></div>
          </div>
        ) : error ? (
          <div className="text-center p-4 text-red-500">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        ) : veiculosParados.length === 0 ? (
          <div className="text-center p-4 text-gray-500">
            <Truck className="h-8 w-8 mx-auto mb-2" />
            <p>Nenhum veículo parado no momento.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {topVeiculos.map((veiculo) => (
              <div key={veiculo.id} className="flex items-start space-x-3 p-2 border rounded-md hover:bg-gray-50">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center 
                  ${veiculo.dias_parado > 30 ? 'bg-red-100 text-red-600' : 
                    veiculo.dias_parado > 14 ? 'bg-orange-100 text-orange-600' : 
                    veiculo.dias_parado > 7 ? 'bg-amber-100 text-amber-600' : 
                    'bg-blue-100 text-blue-600'}`}>
                  <Clock className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-sm truncate">{veiculo.placa}</h4>
                    <Badge 
                      variant="outline"
                      className={`text-xs ${
                        veiculo.dias_parado > 30 ? 'bg-red-50 text-red-700 border-red-200' : 
                        veiculo.dias_parado > 14 ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                        veiculo.dias_parado > 7 ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {veiculo.dias_parado} {veiculo.dias_parado === 1 ? 'dia' : 'dias'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {veiculo.modelo || 'Modelo não informado'} • Base: {veiculo.base}
                  </p>
                  {veiculo.motivo_parada && (
                    <p className="text-xs text-gray-600 mt-1 truncate">
                      Motivo: {veiculo.motivo_parada}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      {veiculosParados.length > 0 && (
        <CardFooter className="pt-0">
          <Link href="/line-hall-shopee">
            <Button variant="ghost" size="sm" className="w-full">
              Ver todos os veículos
            </Button>
          </Link>
        </CardFooter>
      )}
    </Card>
  );
};

export default VeiculosParadosCard;
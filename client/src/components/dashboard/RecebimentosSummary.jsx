import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplet, DollarSign, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const POSTOS = ['osasco_v2', 'alair_v2', 'campinas_v2', 'abc_v2', 'socorro_v2', 'sorocaba_v2', 'guarulhos_v2'];

const RecebimentosSummary = () => {
  const { toast } = useToast();
  const [recebimentosData, setRecebimentosData] = useState({
    litrosRecebidos: 0,
    valorRecebimentos: 0,
    totalRecebimentos: 0,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const fetchAllRecebimentos = async () => {
      try {
        // Buscar recebimentos de todos os postos
        const recebimentosPorPosto = await Promise.all(
          POSTOS.map(async (posto) => {
            try {
              const response = await fetch(`/api/recebimentos/${posto}`, {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
                }
              });
              
              if (!response.ok) {
                console.warn(`Não foi possível buscar recebimentos para o posto ${posto}`);
                return [];
              }
              
              const data = await response.json();
              return data.data || [];
            } catch (error) {
              console.warn(`Erro ao buscar recebimentos para ${posto}:`, error);
              return [];
            }
          })
        );

        // Consolidar todos os recebimentos em um único array
        const todosRecebimentos = recebimentosPorPosto.flat();
        console.log(`[FETCH] Total de ${todosRecebimentos.length} recebimentos encontrados`);

        // Calcular totais - mapeando diferentes nomenclaturas de campos
        let litrosTotal = 0;
        let valorTotal = 0;

        todosRecebimentos.forEach(item => {
          // Mapear diferentes nomenclaturas para quantidade de litros
          const litros = parseFloat(
            item.quantidade_litros || 
            item.litros_recebidos || 
            item.quantidade ||
            0
          );
          
          // Mapear diferentes nomenclaturas para valor
          const valor = parseFloat(
            item.valor_total || 
            item.valor || 
            (item.valor_litro && item.quantidade_litros ? 
              parseFloat(item.valor_litro) * parseFloat(item.quantidade_litros) : 0)
          );

          if (!isNaN(litros)) litrosTotal += litros;
          if (!isNaN(valor)) valorTotal += valor;
        });

        setRecebimentosData({
          litrosRecebidos: litrosTotal,
          valorRecebimentos: valorTotal,
          totalRecebimentos: todosRecebimentos.length,
          isLoading: false,
          error: null
        });
      } catch (error) {
        console.error('Erro ao buscar dados de recebimentos:', error);
        setRecebimentosData(prev => ({
          ...prev,
          isLoading: false,
          error: error.message
        }));
        toast({
          title: 'Erro ao carregar dados',
          description: 'Não foi possível carregar o resumo de recebimentos',
          variant: 'destructive'
        });
      }
    };

    fetchAllRecebimentos();
  }, [toast]);

  const formatarNumero = (valor) => {
    if (!valor && valor !== 0) return '-';
    return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (recebimentosData.isLoading) {
    return (
      <Card className="bg-white shadow-sm">
        <CardHeader className="bg-green-50 border-b pb-3">
          <CardTitle className="text-lg font-medium text-green-800">Resumo de Recebimentos (Entradas)</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin h-8 w-8 border-4 border-green-500 rounded-full border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="bg-green-50 border-b pb-3">
        <CardTitle className="text-lg font-medium text-green-800">Resumo de Recebimentos (Entradas)</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          {/* Card de litros recebidos */}
          <div className="p-4 border-b md:border-b-0 md:border-r">
            <div className="flex items-center">
              <div className="mr-4 bg-green-100 p-2 rounded-full">
                <Droplet className="h-6 w-6 text-green-700" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Litros Recebidos</h3>
                <p className="text-xl font-bold text-green-700">{formatarNumero(recebimentosData.litrosRecebidos)}</p>
              </div>
            </div>
          </div>
          
          {/* Card de valor total */}
          <div className="p-4 border-b md:border-b-0 md:border-r">
            <div className="flex items-center">
              <div className="mr-4 bg-green-100 p-2 rounded-full">
                <DollarSign className="h-6 w-6 text-green-700" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Valor Recebimentos</h3>
                <p className="text-xl font-bold text-green-700">R$ {formatarNumero(recebimentosData.valorRecebimentos)}</p>
              </div>
            </div>
          </div>
          
          {/* Card de total de entradas */}
          <div className="p-4">
            <div className="flex items-center">
              <div className="mr-4 bg-green-100 p-2 rounded-full">
                <FileText className="h-6 w-6 text-green-700" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Total Recebimentos</h3>
                <p className="text-xl font-bold text-green-700">{recebimentosData.totalRecebimentos}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecebimentosSummary;
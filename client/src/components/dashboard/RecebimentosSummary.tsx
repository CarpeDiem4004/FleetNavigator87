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
        let totalRecebimentos = [];
        let errorCount = 0;
        let authToken = localStorage.getItem('jwt_token') || sessionStorage.getItem('jwt_token');
        
        for (const posto of POSTOS) {
          try {
            console.log(`[FETCH] Buscando recebimentos do posto ${posto}...`);
            const response = await fetch(`/api/recebimentos/${posto}`, {
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              credentials: 'include'
            });
            
            if (!response.ok) {
              errorCount++;
              console.warn(`[FETCH] Erro ao buscar recebimentos para ${posto}:`, response.status);
              continue;
            }
            
            const data = await response.json();
            console.log(`[FETCH] Encontrados ${data.data?.length || 0} recebimentos em ${posto}`);
            
            if (data.data && Array.isArray(data.data)) {
              data.data.forEach(item => {
                // Adiciona a informação do posto
                item.posto = posto;
              });
              totalRecebimentos = [...totalRecebimentos, ...data.data];
            }
          } catch (err) {
            errorCount++;
            console.error(`[FETCH] Erro na requisição para ${posto}:`, err);
          }
        }
        
        // Tentar método alternativo se todos os métodos anteriores falharem
        if (totalRecebimentos.length === 0 && errorCount >= POSTOS.length) {
          console.log(`[FETCH] Tentando método de fallback para obter recebimentos...`);
          try {
            const response = await fetch('/api/historico-recebimentos', {
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              credentials: 'include'
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.data && Array.isArray(data.data)) {
                totalRecebimentos = data.data;
                console.log(`[FETCH] Recuperados ${totalRecebimentos.length} recebimentos via histórico consolidado`);
              }
            }
          } catch (fallbackError) {
            console.error(`[FETCH] Erro no método de fallback:`, fallbackError);
          }
        }

        console.log(`[FETCH] Total de ${totalRecebimentos.length} recebimentos encontrados`);

        // Calcular totais - mapeando diferentes nomenclaturas de campos
        let litrosTotal = 0;
        let valorTotal = 0;

        totalRecebimentos.forEach(item => {
          // Mapear diferentes nomenclaturas para quantidade de litros
          const litros = parseFloat(
            item.quantidade_litros || 
            item.litros_recebidos || 
            item.quantidade ||
            item.litros ||
            0
          );
          
          // Mapear diferentes nomenclaturas para valor
          const valor = parseFloat(
            item.valor_total || 
            item.valor || 
            (item.valor_litro && (item.quantidade_litros || item.litros_recebidos || item.litros) ? 
              parseFloat(item.valor_litro) * parseFloat(item.quantidade_litros || item.litros_recebidos || item.litros) : 0)
          );

          if (!isNaN(litros)) {
            litrosTotal += litros;
            console.log(`[DEBUG] Adicionando ${litros} litros de ${item.posto || 'desconhecido'}`);
          }
          if (!isNaN(valor)) {
            valorTotal += valor;
            console.log(`[DEBUG] Adicionando R$ ${valor.toFixed(2)} de ${item.posto || 'desconhecido'}`);
          }
        });

        setRecebimentosData({
          litrosRecebidos: litrosTotal,
          valorRecebimentos: valorTotal,
          totalRecebimentos: totalRecebimentos.length,
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
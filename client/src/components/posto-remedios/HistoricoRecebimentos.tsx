import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, Droplet } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useOsascoRecebimentos } from '@/hooks/useOsascoRecebimentos';
import useOsascoV2Recebimentos from '@/hooks/useOsascoV2Recebimentos';

interface RecebimentoItem {
  id: number;
  fornecedor: string;
  tipo_combustivel: string;
  quantidade_litros: number;
  valor_litro: number;
  valor_total: number;
  numero_nota: string;
  data_entrega: string;
  operador: string;
  observacoes?: string;
  created_at: string;
}

interface HistoricoRecebimentosProps {
  postoId: string;
  className?: string;
}

export const HistoricoRecebimentos: React.FC<HistoricoRecebimentosProps> = ({ 
  postoId,
  className = ''
}) => {
  // Hook especializado para o Posto Osasco V2 (versão atualizada)
  const { recebimentos: osascoV2Recebimentos, isLoading: osascoV2Loading, error: osascoV2Error } = 
    postoId.toLowerCase() === 'osasco_v2' 
      ? useOsascoV2Recebimentos() 
      : { recebimentos: [], isLoading: false, error: null };
      
  // Hook antigo (mantido para compatibilidade)
  const { recebimentos: osascoRecebimentos, isLoading: osascoLoading, error: osascoError } = 
    postoId.toLowerCase() === 'osasco_v2' 
      ? useOsascoRecebimentos() 
      : { recebimentos: [], isLoading: false, error: null };
      
  // Para outros postos, usar a API normal
  const endpoint = `/api/recebimentos/${postoId.toLowerCase()}`;
  
  const { data, isLoading, error } = useQuery({
    queryKey: [endpoint],
    staleTime: 1000 * 60 * 5, // 5 minutos
    enabled: postoId.toLowerCase() !== 'osasco_v2' // Desabilitar para Osasco
  });

  // Processar os dados dependendo do posto
  const recebimentos = React.useMemo(() => {
    // Se for Osasco, usar dados do hook especializado
    if (postoId.toLowerCase() === 'osasco_v2') {
      // Priorizar dados do novo hook, mas usar o antigo como fallback
      if (osascoV2Recebimentos && osascoV2Recebimentos.length > 0) {
        console.log("Usando dados do novo hook para Osasco V2:", osascoV2Recebimentos.length);
        return osascoV2Recebimentos;
      }
      
      // Se o novo hook não retornar dados, usar o hook antigo
      console.log("Usando dados do hook antigo para Osasco V2:", osascoRecebimentos.length);
      return osascoRecebimentos;
    }
    
    // Para outros postos, processar normalmente
    if (!data) return [];
    
    // Se a API retornar os dados em um formato diferente, adapte aqui
    const responseData = data as any;
    if (responseData?.data && Array.isArray(responseData.data)) {
      return responseData.data as RecebimentoItem[];
    }
    
    // Verificar se o data é um array diretamente (útil para testes e ambientes de desenvolvimento)
    if (Array.isArray(responseData)) {
      return responseData as RecebimentoItem[];
    }
    
    console.log("Dados recebidos na consulta:", responseData);
    return [];
  }, [data, osascoRecebimentos, osascoV2Recebimentos, postoId]);

  // Mostrar carregamento quando qualquer um dos dados estiver carregando
  if (isLoading || 
      (postoId.toLowerCase() === 'osasco_v2' && (osascoLoading || osascoV2Loading))) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Mostrar erros de qualquer origem
  let finalError = error;
  if (postoId.toLowerCase() === 'osasco_v2') {
    // Priorizar o novo hook, mas mostrar erro do antigo se o novo não tiver erro
    finalError = osascoV2Error || osascoError;
  }
  if (finalError) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar o histórico de recebimentos: {(finalError as Error).message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="bg-blue-50 border-b">
        <CardTitle className="text-lg font-medium flex items-center">
          <Droplet className="h-5 w-5 mr-2 text-blue-500" />
          Histórico de Entradas de Combustível
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {recebimentos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <Droplet className="h-12 w-12 text-gray-300 mb-2" />
            <p className="text-lg text-gray-500 font-medium">Nenhum recebimento de combustível registrado ainda.</p>
            <p className="text-sm text-gray-400">Os recebimentos registrados aparecerão aqui.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Fornecedor</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Combustível</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Litros</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Valor/L</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Total</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">NF</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Data</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Operador</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recebimentos.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{item.fornecedor}</td>
                    <td className="px-4 py-3">{item.tipo_combustivel}</td>
                    <td className="px-4 py-3">{item.quantidade_litros.toFixed(2)}</td>
                    <td className="px-4 py-3">R$ {item.valor_litro.toFixed(3)}</td>
                    <td className="px-4 py-3">R$ {item.valor_total.toFixed(2)}</td>
                    <td className="px-4 py-3">{item.numero_nota}</td>
                    <td className="px-4 py-3">{item.data_entrega || new Date(item.created_at).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3">{item.operador}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HistoricoRecebimentos;
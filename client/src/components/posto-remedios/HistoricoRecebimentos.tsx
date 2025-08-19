import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, Droplet } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useOsascoRecebimentos } from '@/hooks/useOsascoRecebimentos';
// import useOsascoV2Recebimentos from '@/hooks/useOsascoV2Recebimentos'; // Temporarily disabled

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

  // Estado local para armazenar dados de recebimentos
  const [recebimentosDirectos, setRecebimentosDirectos] = useState<any[]>([]);
  
  // Estado local para recebimentos via SQL direto (fallback)
  const [recebimentosSQL, setRecebimentosSQL] = useState<any[]>([]);
  
  // Efeito para buscar recebimentos diretamente do endpoint especializado para Osasco V2
  React.useEffect(() => {
    if (postoId.toLowerCase() === 'osasco_v2') {
      const fetchFromDirectEndpoint = async () => {
        try {
          console.log("Buscando recebimentos do Osasco V2 via endpoint especializado...");
          
          // Usar o endpoint dedicado para recebimentos do Osasco V2
          const response = await fetch('/api/osasco-v2/recebimentos', {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
            },
            credentials: 'include'
          });
          
          if (!response.ok) {
            throw new Error(`Erro ao buscar recebimentos: ${response.status}`);
          }
          
          const data = await response.json();
          
          if (data.success && data.data && data.data.length > 0) {
            console.log("Recebimentos encontrados via endpoint especializado:", data.data.length);
            setRecebimentosDirectos(data.data);
          } else {
            // Fallback para SQL direto se o endpoint não retornar dados
            console.log("Tentando SQL direto como fallback...");
            const sqlResponse = await fetch('/api/sql-seguro', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
              },
              body: JSON.stringify({
                query: `
                  SELECT 
                    id,
                    nome_fornecedor as fornecedor,
                    tipo_produto as tipo_combustivel,
                    litros_recebidos as quantidade_litros,
                    COALESCE(valor_litro, 0) as valor_litro,
                    valor_total,
                    COALESCE(numero_nota, '-') as numero_nota,
                    COALESCE(TO_CHAR(data_entrega, 'DD/MM/YYYY'), TO_CHAR(created_at, 'DD/MM/YYYY')) as data_entrega,
                    nome_operador as operador,
                    observacoes,
                    TO_CHAR(created_at, 'DD/MM/YYYY') as data_formatada,
                    created_at
                  FROM recebimentos_posto_osasco_v2
                  ORDER BY created_at DESC
                  LIMIT 50
                `
              }),
              credentials: 'include'
            });
            
            if (!sqlResponse.ok) {
              throw new Error(`Erro ao consultar SQL direta: ${sqlResponse.status}`);
            }
            
            const sqlData = await sqlResponse.json();
            
            if (sqlData.success && sqlData.rows) {
              console.log("Recebimentos encontrados via SQL direta:", sqlData.rows.length);
              setRecebimentosSQL(sqlData.rows);
            }
          }
        } catch (err) {
          console.error("Erro ao buscar recebimentos do Osasco V2:", err);
        }
      };
      
      fetchFromDirectEndpoint();
    }
  }, [postoId, osascoV2Recebimentos?.length]);
  
  // Processar os dados dependendo do posto
  const recebimentos = React.useMemo(() => {
    // Se for Osasco, usar dados do hook especializado
    if (postoId.toLowerCase() === 'osasco_v2') {
      // Estratégia de fallback em ordem de prioridade
      
      // 1. Primeiro tentar os dados do endpoint dedicado
      if (recebimentosDirectos && recebimentosDirectos.length > 0) {
        console.log("Usando dados do endpoint dedicado para Osasco V2:", recebimentosDirectos.length);
        return recebimentosDirectos;
      }
      
      // 2. Depois tentar os dados SQL direto
      if (recebimentosSQL && recebimentosSQL.length > 0) {
        console.log("Usando dados SQL direto para Osasco V2:", recebimentosSQL.length);
        return recebimentosSQL;
      }
      
      // 3. Depois tentar os hooks especializados
      if (osascoV2Recebimentos && osascoV2Recebimentos.length > 0) {
        console.log("Usando dados do hook para Osasco V2:", osascoV2Recebimentos.length);
        return osascoV2Recebimentos;
      }
      
      // 4. Por último, tentar o hook antigo (compatibilidade)
      if (osascoRecebimentos && osascoRecebimentos.length > 0) {
        console.log("Usando dados do hook antigo para Osasco V2:", osascoRecebimentos.length);
        return osascoRecebimentos;
      }
      
      // Se não houver dados
      console.log("Nenhum dado de recebimento encontrado para Osasco V2");
      return [];
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
                {recebimentos.map((item) => {
                  // Mapear campos para formato padronizado - necessário para Osasco V2
                  const fornecedor = item.fornecedor || item.nome_fornecedor || '-';
                  const tipoCombustivel = item.tipo_combustivel || item.tipo_produto || '-';
                  const quantidadeLitros = parseFloat(item.quantidade_litros || item.litros_recebidos || 0);
                  const valorLitro = parseFloat(item.valor_litro || 0);
                  const valorTotal = parseFloat(item.valor_total || 0);
                  const numeroNota = item.numero_nota || '-';
                  const dataEntrega = item.data_entrega || (item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : '-');
                  const operador = item.operador || item.nome_operador || '-';
                  
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{fornecedor}</td>
                      <td className="px-4 py-3">{tipoCombustivel}</td>
                      <td className="px-4 py-3">{isNaN(quantidadeLitros) ? '-' : quantidadeLitros.toFixed(2)}</td>
                      <td className="px-4 py-3">R$ {isNaN(valorLitro) ? '-' : valorLitro.toFixed(3)}</td>
                      <td className="px-4 py-3">R$ {isNaN(valorTotal) ? '-' : valorTotal.toFixed(2)}</td>
                      <td className="px-4 py-3">{numeroNota}</td>
                      <td className="px-4 py-3">{dataEntrega}</td>
                      <td className="px-4 py-3">{operador}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HistoricoRecebimentos;
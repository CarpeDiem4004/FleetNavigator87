import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook personalizado para gerenciar os recebimentos do posto Osasco V2
 * Este hook lida com a estrutura de tabela específica deste posto
 */
export default function useOsascoV2Recebimentos() {
  const { toast } = useToast();
  const [recebimentos, setRecebimentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reload, setReload] = useState(0);

  // Função para forçar recarga dos dados
  const recarregarDados = useCallback(() => setReload(prev => prev + 1), []);

  // Buscar recebimentos da API
  useEffect(() => {
    const fetchRecebimentos = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Buscando recebimentos do posto Osasco V2...");

        // Primeiro tentamos buscar diretamente pelo endpoint específico
        const response = await fetch('/api/recebimentos/osasco_v2', {
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
        
        if (data.success) {
          // Se o retorno for bem-sucedido mas não trouxer dados, vamos tentar executar a consulta SQL direta
          if (!data.data || data.data.length === 0) {
            console.log("Buscando recebimentos via SQL direta...");
            
            // Consulta SQL direta na tabela
            const sqlResult = await fetch('/api/sql-seguro', {
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
                    created_at
                  FROM recebimentos_posto_osasco_v2
                  ORDER BY created_at DESC
                  LIMIT 50
                `
              }),
              credentials: 'include'
            });
            
            if (!sqlResult.ok) {
              throw new Error(`Erro ao executar SQL direta: ${sqlResult.status}`);
            }
            
            const sqlData = await sqlResult.json();
            
            if (sqlData.success && sqlData.rows) {
              console.log("Recebimentos encontrados via SQL direta:", sqlData.rows.length);
              setRecebimentos(sqlData.rows);
            } else {
              console.log("Nenhum recebimento encontrado via SQL direta");
              setRecebimentos([]);
            }
          } else {
            console.log("Recebimentos encontrados via API:", data.data.length);
            setRecebimentos(data.data || []);
          }
        } else {
          throw new Error(data.message || 'Erro desconhecido ao buscar recebimentos');
        }
      } catch (err) {
        console.error('Erro ao buscar recebimentos do posto Osasco V2:', err);
        setError(err.message);
        // Não mostrar toast por erro na busca inicial
      } finally {
        setLoading(false);
      }
    };

    fetchRecebimentos();
  }, [reload]);

  // Função para adicionar um novo recebimento
  const adicionarRecebimento = async (dadosRecebimento) => {
    try {
      setLoading(true);
      
      // Mapear os campos do formulário para os nomes de campos esperados pela API
      const dadosConvertidos = {
        fornecedor: dadosRecebimento.nome_fornecedor,
        tipo_combustivel: dadosRecebimento.tipo_produto,
        quantidade_litros: dadosRecebimento.litros_recebidos,
        valor_litro: dadosRecebimento.valor_litro,
        valor_total: dadosRecebimento.valor_total,
        numero_nota: dadosRecebimento.numero_nota,
        data_entrega: dadosRecebimento.data_entrega,
        operador: dadosRecebimento.nome_operador,
        observacoes: dadosRecebimento.observacoes
      };
      
      const response = await fetch('/api/recebimentos/osasco_v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        },
        credentials: 'include',
        body: JSON.stringify(dadosConvertidos)
      });

      if (!response.ok) {
        throw new Error(`Erro ao registrar recebimento: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Adicionar o novo recebimento ao estado e recarregar os dados
        recarregarDados();
        
        toast({
          title: "Sucesso!",
          description: "Recebimento registrado com sucesso."
        });
        
        return { success: true, data: data.data };
      } else {
        throw new Error(data.message || 'Erro desconhecido ao registrar recebimento');
      }
    } catch (err) {
      console.error('Erro ao registrar recebimento:', err);
      setError(err.message);
      
      toast({
        title: "Erro ao registrar recebimento",
        description: err.message
      });
      
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    recebimentos,
    loading,
    error,
    adicionarRecebimento,
    recarregarDados
  };
}
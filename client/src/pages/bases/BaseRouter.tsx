import React, { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import BaseDashboardGenerico from './BaseDashboardGenerico';
import { Loader2 } from 'lucide-react';

interface BaseInfo {
  id: number;
  name: string;
  location?: string;
  basename?: string;
  operation: string;
}

const BaseRouter: React.FC = () => {
  const [match, params] = useRoute('/bases/:baseCode');
  const [baseInfo, setBaseInfo] = useState<BaseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (match && params?.baseCode) {
      fetchBaseInfo(params.baseCode);
    }
  }, [match, params?.baseCode]);

  const fetchBaseInfo = async (baseCode: string) => {
    try {
      setLoading(true);
      setError(null);

      // Primeiro tenta buscar por basename
      let response = await fetch(`/api/bases?basename=${baseCode}`);
      let data = await response.json();

      if (!data.success || !data.data || data.data.length === 0) {
        // Se não encontrar por basename, tenta buscar por ID
        const baseId = parseInt(baseCode.replace(/\D/g, ''));
        if (!isNaN(baseId)) {
          response = await fetch(`/api/bases/${baseId}`);
          data = await response.json();
        }
      }

      if (data.success && data.data) {
        // Se data.data é um array, pega o primeiro item; senão é um objeto único
        const base = Array.isArray(data.data) ? data.data[0] : data.data;
        
        if (base) {
          setBaseInfo({
            id: base.id,
            name: base.name,
            location: base.location,
            basename: base.basename,
            operation: base.operation || 'GRUPO PEREIRA'
          });
        } else {
          setError(`Base não encontrada: ${baseCode}`);
        }
      } else {
        setError(`Base não encontrada: ${baseCode}`);
      }
    } catch (err) {
      console.error('Erro ao buscar informações da base:', err);
      setError('Erro ao carregar informações da base');
    } finally {
      setLoading(false);
    }
  };

  if (!match) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando informações da base...</p>
        </div>
      </div>
    );
  }

  if (error || !baseInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Erro</h1>
          <p className="text-gray-600 mb-4">{error || 'Base não encontrada'}</p>
          <button 
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return <BaseDashboardGenerico baseInfo={baseInfo} />;
};

export default BaseRouter;
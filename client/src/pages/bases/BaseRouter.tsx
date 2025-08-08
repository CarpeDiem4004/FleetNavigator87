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
  const [matchBases, paramsBases] = useRoute('/bases/:baseCode');
  const [matchBase, paramsBase] = useRoute('/base/:id/:slug?');
  const [baseInfo, setBaseInfo] = useState<BaseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (matchBases && paramsBases?.baseCode) {
      fetchBaseInfo(paramsBases.baseCode);
    } else if (matchBase && paramsBase?.id) {
      fetchBaseInfo(paramsBase.id);
    }
  }, [matchBases, paramsBases?.baseCode, matchBase, paramsBase?.id]);

  const fetchBaseInfo = async (baseCode: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('[BaseRouter] Buscando base:', baseCode);

      // Se baseCode é um número puro, busca diretamente por ID
      const baseId = parseInt(baseCode);
      if (!isNaN(baseId)) {
        console.log('[BaseRouter] Buscando por ID:', baseId);
        const response = await fetch(`/api/bases/${baseId}`);
        const data = await response.json();
        
        if (data.success && data.data) {
          const base = data.data;
          setBaseInfo({
            id: base.id,
            name: base.name,
            location: base.location,
            basename: base.basename,
            operation: base.operation || 'GRUPO PEREIRA'
          });
          console.log('[BaseRouter] Base encontrada por ID:', base.name);
          return;
        }
      }

      // Se não é número ou não encontrou por ID, tenta buscar por basename
      console.log('[BaseRouter] Buscando por basename:', baseCode);
      const response = await fetch(`/api/bases?basename=${baseCode}`);
      const data = await response.json();

      if (data.success && data.data && data.data.length > 0) {
        const base = data.data[0];
        setBaseInfo({
          id: base.id,
          name: base.name,
          location: base.location,
          basename: base.basename,
          operation: base.operation || 'GRUPO PEREIRA'
        });
        console.log('[BaseRouter] Base encontrada por basename:', base.name);
      } else {
        setError(`Base não encontrada: ${baseCode}`);
        console.error('[BaseRouter] Base não encontrada:', baseCode);
      }
    } catch (err) {
      console.error('[BaseRouter] Erro ao buscar informações da base:', err);
      setError('Erro ao carregar informações da base');
    } finally {
      setLoading(false);
    }
  };

  // Debug: Mostrar status das rotas
  const currentPath = window.location.pathname;
  console.log('[BaseRouter] Rota atual:', currentPath);
  console.log('[BaseRouter] Match /bases/*:', matchBases, paramsBases);
  console.log('[BaseRouter] Match /base/*:', matchBase, paramsBase);

  if (!matchBases && !matchBase) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Carregando informações da base...</p>
          <p className="text-sm text-gray-500 mt-2">Rota: {currentPath}</p>
        </div>
      </div>
    );
  }

  if (error || !baseInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-900 mb-2">Erro</h1>
          <p className="text-red-600 mb-2">{error || 'Base não encontrada'}</p>
          <p className="text-sm text-gray-500 mb-4">Rota: {currentPath}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return <BaseDashboardGenerico baseInfo={baseInfo} />;
};

export default BaseRouter;
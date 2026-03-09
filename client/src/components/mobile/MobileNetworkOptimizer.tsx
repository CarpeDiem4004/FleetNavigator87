import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, Signal, Zap } from 'lucide-react';

interface NetworkInfo {
  isOnline: boolean;
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

interface MobileNetworkOptimizerProps {
  children: React.ReactNode;
  onNetworkChange?: (info: NetworkInfo) => void;
}

const MobileNetworkOptimizer: React.FC<MobileNetworkOptimizerProps> = ({ 
  children, 
  onNetworkChange 
}) => {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    isOnline: navigator.onLine,
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
    saveData: false
  });

  const [showNetworkBanner, setShowNetworkBanner] = useState(false);

  useEffect(() => {
    const updateNetworkInfo = () => {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;

      const info: NetworkInfo = {
        isOnline: navigator.onLine,
        effectiveType: connection?.effectiveType || 'unknown',
        downlink: connection?.downlink || 0,
        rtt: connection?.rtt || 0,
        saveData: connection?.saveData || false
      };

      setNetworkInfo(info);
      onNetworkChange?.(info);

      // Mostrar banner se a conexão for lenta
      const isSlowConnection = info.effectiveType === 'slow-2g' || 
                              info.effectiveType === '2g' || 
                              info.downlink < 0.5;
      setShowNetworkBanner(isSlowConnection && info.isOnline);

      console.log('[Network Optimizer] Status da rede:', info);
    };

    const handleOnline = () => {
      console.log('[Network Optimizer] Conectado à internet');
      updateNetworkInfo();
    };

    const handleOffline = () => {
      console.log('[Network Optimizer] Desconectado da internet');
      setNetworkInfo(prev => ({ ...prev, isOnline: false }));
      setShowNetworkBanner(false);
    };

    // Event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateNetworkInfo);
    }

    // Initial check
    updateNetworkInfo();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', updateNetworkInfo);
      }
    };
  }, [onNetworkChange]);

  const getNetworkIcon = () => {
    if (!networkInfo.isOnline) return <WifiOff className="w-4 h-4 text-red-500" />;
    
    switch (networkInfo.effectiveType) {
      case '4g':
        return <Signal className="w-4 h-4 text-green-500" />;
      case '3g':
        return <Signal className="w-4 h-4 text-yellow-500" />;
      case '2g':
      case 'slow-2g':
        return <Signal className="w-4 h-4 text-orange-500" />;
      default:
        return <Wifi className="w-4 h-4 text-blue-500" />;
    }
  };

  const getNetworkLabel = () => {
    if (!networkInfo.isOnline) return 'Offline';
    return networkInfo.effectiveType.toUpperCase() || 'Online';
  };

  return (
    <div className="relative">
      {/* Banner de Rede Lenta */}
      {showNetworkBanner && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white p-2 text-center text-sm">
          <div className="flex items-center justify-center space-x-2">
            <Signal className="w-4 h-4" />
            <span>Conexão lenta detectada - Modo econômico ativado</span>
          </div>
        </div>
      )}

      {/* Indicador de Status da Rede */}
      <div className="fixed top-4 right-4 z-40 bg-white rounded-full shadow-md p-2">
        <div className="flex items-center space-x-1">
          {getNetworkIcon()}
          <span className="text-xs font-medium">{getNetworkLabel()}</span>
        </div>
      </div>

      {/* Overlay para Modo Offline */}
      {!networkInfo.isOnline && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 m-4 text-center">
            <WifiOff className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sem conexão</h3>
            <p className="text-gray-600 mb-4">
              Verifique sua conexão com a internet e tente novamente.
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      {children}
    </div>
  );
};

export default MobileNetworkOptimizer;
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { pwaManager } from '@/utils/pwa-utils';
import { WifiOff, Wifi, RefreshCw, CloudOff, Signal } from 'lucide-react';

export const PWAOfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [networkInfo, setNetworkInfo] = useState<{
    effectiveType?: string;
    downlink?: number;
  }>({});
  const [isOfflineModeEnabled, setIsOfflineModeEnabled] = useState(
    pwaManager.isOfflineModeEnabled()
  );

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      updateNetworkInfo();
    };

    const updateNetworkInfo = async () => {
      const info = await pwaManager.getNetworkStatus();
      setNetworkInfo({
        effectiveType: info.effectiveType,
        downlink: info.downlink
      });
    };

    const handleOfflineModeEnabled = () => {
      setIsOfflineModeEnabled(true);
    };

    const handleOfflineModeDisabled = () => {
      setIsOfflineModeEnabled(false);
    };

    // Event listeners
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    window.addEventListener('pwa-offline-mode-enabled', handleOfflineModeEnabled);
    window.addEventListener('pwa-offline-mode-disabled', handleOfflineModeDisabled);

    // Initial check
    updateOnlineStatus();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      window.removeEventListener('pwa-offline-mode-enabled', handleOfflineModeEnabled);
      window.removeEventListener('pwa-offline-mode-disabled', handleOfflineModeDisabled);
    };
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  const getConnectionBadge = () => {
    if (!isOnline) {
      return (
        <Badge variant="destructive" className="flex items-center space-x-1">
          <WifiOff className="h-3 w-3" />
          <span>Offline</span>
        </Badge>
      );
    }

    if (networkInfo.effectiveType) {
      const connectionQuality = networkInfo.effectiveType;
      const variant = connectionQuality === 'slow-2g' || connectionQuality === '2g' 
        ? 'destructive' 
        : connectionQuality === '3g' 
        ? 'secondary' 
        : 'default';

      return (
        <Badge variant={variant} className="flex items-center space-x-1">
          <Wifi className="h-3 w-3" />
          <span className="capitalize">{connectionQuality}</span>
        </Badge>
      );
    }

    return (
      <Badge variant="default" className="flex items-center space-x-1">
        <Wifi className="h-3 w-3" />
        <span>Online</span>
      </Badge>
    );
  };

  if (isOnline && !isOfflineModeEnabled) {
    return (
      <div className="fixed top-4 right-4 z-40">
        {getConnectionBadge()}
      </div>
    );
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-40 mx-auto max-w-md">
      <Alert className={`border-2 ${
        isOnline 
          ? 'border-orange-200 bg-orange-50' 
          : 'border-red-200 bg-red-50'
      }`}>
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <CloudOff className="h-4 w-4 text-orange-600" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-600" />
          )}
          <div className="flex-1">
            <AlertDescription className="text-sm">
              {isOfflineModeEnabled ? (
                <div>
                  <strong>Modo Offline Ativado</strong>
                  <br />
                  Funcionando com dados salvos localmente
                </div>
              ) : (
                <div>
                  <strong>Sem Conexão</strong>
                  <br />
                  Algumas funcionalidades podem estar limitadas
                </div>
              )}
            </AlertDescription>
          </div>
          <div className="flex flex-col space-y-1">
            {getConnectionBadge()}
            {!isOnline && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleRetry}
                className="h-6 text-xs"
              >
                <RefreshCw className="mr-1 h-3 w-3" />
                Tentar
              </Button>
            )}
          </div>
        </div>
      </Alert>
    </div>
  );
};

export default PWAOfflineIndicator;
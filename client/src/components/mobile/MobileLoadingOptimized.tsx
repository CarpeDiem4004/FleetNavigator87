import React from 'react';
import { Loader2, Fuel, Wifi, WifiOff } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

interface MobileLoadingOptimizedProps {
  isLoading: boolean;
  hasError?: boolean;
  errorMessage?: string;
  loadingMessage?: string;
  showNetworkStatus?: boolean;
}

const MobileLoadingOptimized: React.FC<MobileLoadingOptimizedProps> = ({
  isLoading,
  hasError = false,
  errorMessage = 'Erro ao carregar dados',
  loadingMessage = 'Carregando...',
  showNetworkStatus = true
}) => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (hasError) {
    return (
      <Card className="m-4 border-red-200 bg-red-50">
        <CardContent className="p-4 text-center">
          <div className="flex flex-col items-center space-y-3">
            <WifiOff className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-red-700 font-medium">Problema de conexão</p>
              <p className="text-red-600 text-sm mt-1">{errorMessage}</p>
              {!isOnline && (
                <p className="text-red-500 text-xs mt-2">
                  Verifique sua conexão com a internet
                </p>
              )}
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Tentar novamente
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isLoading) {
    return null;
  }

  return (
    <Card className="m-4 border-blue-200 bg-blue-50">
      <CardContent className="p-4 text-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="relative">
            <Fuel className="h-8 w-8 text-blue-600" />
            <Loader2 className="h-4 w-4 animate-spin text-blue-500 absolute -top-1 -right-1" />
          </div>
          <div>
            <p className="text-blue-700 font-medium">{loadingMessage}</p>
            {showNetworkStatus && (
              <div className="flex items-center justify-center mt-2 text-xs">
                {isOnline ? (
                  <>
                    <Wifi className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-green-600">Conectado</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 text-red-500 mr-1" />
                    <span className="text-red-600">Sem conexão</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileLoadingOptimized;
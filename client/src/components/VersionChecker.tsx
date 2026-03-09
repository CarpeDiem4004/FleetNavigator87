import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

const APP_VERSION = '2.9.5';
const VERSION_CHECK_INTERVAL = 60000;

export function VersionChecker() {
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [storedVersion, setStoredVersion] = useState<string | null>(null);

  useEffect(() => {
    const savedVersion = localStorage.getItem('app_version');
    
    if (!savedVersion) {
      localStorage.setItem('app_version', APP_VERSION);
      setStoredVersion(APP_VERSION);
    } else if (savedVersion !== APP_VERSION) {
      setShowUpdateBanner(true);
      setStoredVersion(savedVersion);
    } else {
      setStoredVersion(savedVersion);
    }

    const checkVersion = async () => {
      try {
        const response = await fetch('/api/version?_t=' + Date.now(), {
          cache: 'no-store'
        });
        if (response.ok) {
          const data = await response.json();
          const currentSaved = localStorage.getItem('app_version');
          if (data.version && currentSaved && data.version !== currentSaved) {
            setShowUpdateBanner(true);
          }
        }
      } catch (error) {
        console.log('[VersionChecker] Erro ao verificar versão:', error);
      }
    };

    const interval = setInterval(checkVersion, VERSION_CHECK_INTERVAL);
    checkVersion();

    return () => clearInterval(interval);
  }, []);

  const handleUpdate = () => {
    localStorage.setItem('app_version', APP_VERSION);
    window.location.reload();
  };

  if (!showUpdateBanner) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-sm">
        <div className="p-2 bg-white/20 rounded-full">
          <RefreshCw className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">Nova versão disponível!</p>
          <p className="text-xs text-blue-100">Clique para atualizar o sistema</p>
        </div>
        <button
          onClick={handleUpdate}
          className="bg-white text-blue-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-50 transition-colors"
        >
          Atualizar
        </button>
      </div>
    </div>
  );
}

export { APP_VERSION };

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { pwaManager } from '@/utils/pwa-utils';
import { Download, X, Smartphone, CheckCircle, RefreshCw } from 'lucide-react';

interface PWAInstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  onInstall,
  onDismiss
}) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installStatus, setInstallStatus] = useState(pwaManager.getInstallationStatus());
  const { toast } = useToast();

  useEffect(() => {
    const handleInstallAvailable = () => {
      const status = pwaManager.getInstallationStatus();
      setInstallStatus(status);
      if (status.canInstall && !status.isInstalled) {
        setShowPrompt(true);
      }
    };

    const handleInstallCompleted = () => {
      setShowPrompt(false);
      setIsInstalling(false);
      toast({
        title: "App Instalado!",
        description: "O Line Haul foi instalado com sucesso no seu dispositivo.",
        duration: 5000
      });
      onInstall?.();
    };

    const handleInstallSuccess = () => {
      setInstallStatus(pwaManager.getInstallationStatus());
      handleInstallCompleted();
    };

    // Listen for PWA events
    window.addEventListener('pwa-install-available', handleInstallAvailable);
    window.addEventListener('pwa-install-completed', handleInstallCompleted);
    window.addEventListener('pwa-install-success', handleInstallSuccess);

    // Check initial status
    handleInstallAvailable();

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
      window.removeEventListener('pwa-install-completed', handleInstallCompleted);
      window.removeEventListener('pwa-install-success', handleInstallSuccess);
    };
  }, [toast, onInstall]);

  const handleInstall = async () => {
    setIsInstalling(true);
    
    try {
      const success = await pwaManager.promptInstall();
      
      if (success) {
        toast({
          title: "Instalação iniciada",
          description: "O app está sendo instalado...",
          duration: 3000
        });
      } else {
        setIsInstalling(false);
        toast({
          title: "Instalação cancelada",
          description: "Você pode instalar o app a qualquer momento.",
          variant: "default",
          duration: 3000
        });
      }
    } catch (error) {
      setIsInstalling(false);
      toast({
        title: "Erro na instalação",
        description: "Não foi possível instalar o app. Tente novamente.",
        variant: "destructive",
        duration: 5000
      });
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    onDismiss?.();
  };

  if (!showPrompt || installStatus.isInstalled) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md shadow-lg border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Smartphone className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Instalar App</CardTitle>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-sm text-gray-600">
          Instale o Line Haul no seu celular para acesso rápido e uso offline
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Acesso mesmo sem internet</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Notificações de viagens</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Interface otimizada para mobile</span>
          </div>
          
          <div className="flex space-x-2 pt-2">
            <Button
              onClick={handleInstall}
              disabled={isInstalling}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isInstalling ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Instalando...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Instalar
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleDismiss}
              className="flex-1"
            >
              Agora não
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PWAInstallPrompt;
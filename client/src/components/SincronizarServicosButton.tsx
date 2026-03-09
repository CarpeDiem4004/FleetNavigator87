import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw } from 'lucide-react';

type SincronizarServicosButtonProps = {
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  onSuccess?: () => void;
  children?: React.ReactNode;
};

export function SincronizarServicosButton({
  className,
  variant = 'outline',
  size = 'sm',
  onSuccess,
  children,
}: SincronizarServicosButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sincronizarServicos = async () => {
    try {
      setIsLoading(true);
      
      // Chamar a API de sincronização
      const response = await fetch('/api/sincronizacao/sincronizar-servicos-guincho', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Sincronização concluída',
          description: `Serviços sincronizados com sucesso.`,
          variant: 'default',
        });
        
        // Chamar callback de sucesso se fornecido
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(data.message || 'Erro ao sincronizar serviços');
      }
    } catch (error) {
      console.error('Erro ao sincronizar serviços:', error);
      toast({
        title: 'Erro na sincronização',
        description: error instanceof Error ? error.message : 'Não foi possível sincronizar os serviços',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      className={className}
      variant={variant}
      size={size}
      onClick={sincronizarServicos}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <RefreshCw className="h-4 w-4 mr-2" />
      )}
      {children || 'Sincronizar Serviços'}
    </Button>
  );
}
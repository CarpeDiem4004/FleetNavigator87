import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { sincronizarAbastecimentosSupabase } from '@/utils/supabase-sync';
import { useToast } from '@/hooks/use-toast';

interface SincronizarSupabaseButtonProps {
  posto: string;
  onSyncComplete?: () => void;
}

export default function SincronizarSupabaseButton({ 
  posto, 
  onSyncComplete 
}: SincronizarSupabaseButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const handleSync = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    toast({
      title: 'Iniciando sincronização',
      description: 'Conectando com o Supabase...'
    });
    
    try {
      const result = await sincronizarAbastecimentosSupabase(posto);
      
      if (result.success) {
        toast({
          title: 'Sincronização concluída',
          description: `Total: ${result.total}, Sincronizados: ${result.sincronizados}, Falhas: ${result.falhas}`,
          variant: 'default'
        });
        
        if (onSyncComplete) {
          onSyncComplete();
        }
      } else {
        toast({
          title: 'Erro na sincronização',
          description: String(result.error),
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Exceção durante sincronização:', error);
      toast({
        title: 'Falha na sincronização',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button
      onClick={handleSync}
      disabled={isSyncing}
      variant="outline"
      className="flex items-center gap-2"
    >
      {isSyncing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Sincronizando...</span>
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4" />
          <span>Sincronizar com Supabase</span>
        </>
      )}
    </Button>
  );
}
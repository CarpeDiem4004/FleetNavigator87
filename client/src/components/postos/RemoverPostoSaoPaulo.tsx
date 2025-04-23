import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function RemoverPostoSaoPaulo() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleRemoverPosto = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/postos/excluir-saopaulo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Posto removido com sucesso',
          description: 'O posto São Paulo foi removido do sistema',
          variant: 'default'
        });
        
        // Reload para atualizar a visualização
        setTimeout(() => {
          window.location.href = '/postos/visao-geral';
        }, 1500);
      } else {
        throw new Error(data.message || 'Erro ao remover posto');
      }
    } catch (error) {
      console.error('Erro ao excluir posto:', error);
      toast({
        title: 'Erro ao remover posto',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao remover o posto',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      <Button 
        variant="destructive" 
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex gap-1 items-center"
      >
        <Trash2 className="h-4 w-4" />
        Excluir Posto São Paulo
      </Button>
      
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o Posto São Paulo do sistema?
              <br />
              <span className="font-medium text-destructive">Esta ação não pode ser desfeita.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              disabled={isLoading}
              onClick={(e) => {
                e.preventDefault();
                handleRemoverPosto();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removendo...
                </>
              ) : (
                'Sim, excluir posto'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
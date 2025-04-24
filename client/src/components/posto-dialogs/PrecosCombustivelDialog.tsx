import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';

interface PrecosCombustivel {
  diesel: number;
  arla: number;
}

interface PrecosCombustivelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function PrecosCombustivelDialog({
  isOpen,
  onClose,
  onSave
}: PrecosCombustivelDialogProps) {
  const [precos, setPrecos] = useState<PrecosCombustivel>({
    diesel: 0,
    arla: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Buscar preços atuais quando o diálogo for aberto
  useEffect(() => {
    if (isOpen) {
      fetchPrecos();
    }
  }, [isOpen]);

  // Função para buscar preços atuais
  const fetchPrecos = async () => {
    setIsLoading(true);
    try {
      const dieselResponse = await apiRequest('GET', '/api/precos-combustivel/Diesel');
      const arlaResponse = await apiRequest('GET', '/api/precos-combustivel/ARLA');
      
      const dieselData = await dieselResponse.json();
      const arlaData = await arlaResponse.json();
      
      setPrecos({
        diesel: dieselData.success ? Number(dieselData.data.valor_litro) : 0,
        arla: arlaData.success ? Number(arlaData.data.valor_litro) : 0
      });
    } catch (error) {
      console.error('Erro ao buscar preços de combustível:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os preços de combustível.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para salvar os preços
  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Salvar preço do diesel
      const dieselResponse = await apiRequest('POST', '/api/precos-combustivel', {
        tipo: 'Diesel',
        valor_litro: precos.diesel
      });
      
      // Salvar preço do ARLA
      const arlaResponse = await apiRequest('POST', '/api/precos-combustivel', {
        tipo: 'ARLA',
        valor_litro: precos.arla
      });
      
      const dieselData = await dieselResponse.json();
      const arlaData = await arlaResponse.json();
      
      if (dieselData.success && arlaData.success) {
        toast({
          title: 'Sucesso',
          description: 'Preços de combustível atualizados com sucesso.',
          variant: 'default'
        });
        onSave();
        onClose();
      } else {
        throw new Error('Falha ao atualizar preços de combustível');
      }
    } catch (error) {
      console.error('Erro ao salvar preços de combustível:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar os preços de combustível.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Configuração de Preço por Litro</DialogTitle>
          <DialogDescription>
            Configure os preços por litro de diesel e ARLA para todos os postos.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Preço Diesel */}
          <div className="space-y-2">
            <Label htmlFor="diesel-price" className="font-medium">
              Valor do litro de Diesel
            </Label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                R$
              </span>
              <Input
                id="diesel-price"
                type="number"
                min="0"
                step="0.01"
                className="pl-8"
                value={precos.diesel}
                onChange={(e) => setPrecos({ ...precos, diesel: parseFloat(e.target.value) || 0 })}
                disabled={isLoading}
              />
            </div>
          </div>
          
          {/* Preço ARLA */}
          <div className="space-y-2">
            <Label htmlFor="arla-price" className="font-medium">
              Valor do litro de ARLA
            </Label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                R$
              </span>
              <Input
                id="arla-price"
                type="number"
                min="0"
                step="0.01"
                className="pl-8"
                value={precos.arla}
                onChange={(e) => setPrecos({ ...precos, arla: parseFloat(e.target.value) || 0 })}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Salvando...' : 'Salvar Preços'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Fuel, Droplet, RotateCw } from "lucide-react";
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
  const [precos, setPrecos] = useState<PrecosCombustivel>({ diesel: 0, arla: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Quando o diálogo abre, busca os preços atuais
  useEffect(() => {
    if (isOpen) {
      fetchPrecos();
    }
  }, [isOpen]);

  // Buscar preços atuais dos combustíveis
  const fetchPrecos = async () => {
    setIsLoading(true);
    try {
      const dieselResponse = await apiRequest('GET', '/api/precos-combustivel/Diesel');
      const arlaResponse = await apiRequest('GET', '/api/precos-combustivel/ARLA');
      
      const dieselData = await dieselResponse.json();
      const arlaData = await arlaResponse.json();
      
      if (dieselData.success && arlaData.success) {
        setPrecos({
          diesel: dieselData.data.valor_litro,
          arla: arlaData.data.valor_litro
        });
      } else {
        throw new Error('Falha ao buscar preços de combustível');
      }
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

  // Atualizar preços de combustível
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Converter os preços para números com verificação de valores válidos
      const dieselValue = Number(precos.diesel) || 0;
      const arlaValue = Number(precos.arla) || 0;
      
      // Atualizar diesel
      const dieselResponse = await apiRequest('POST', '/api/precos-combustivel', {
        tipo: 'Diesel',
        valor_litro: dieselValue
      });
      
      // Atualizar ARLA
      const arlaResponse = await apiRequest('POST', '/api/precos-combustivel', {
        tipo: 'ARLA',
        valor_litro: arlaValue
      });
      
      const dieselData = await dieselResponse.json();
      const arlaData = await arlaResponse.json();
      
      if (dieselData.success && arlaData.success) {
        toast({
          title: 'Sucesso',
          description: 'Preços atualizados com sucesso',
        });
        
        // Chama o callback onSave para atualizar a UI
        onSave();
        onClose();
      } else {
        throw new Error('Falha ao atualizar preços');
      }
    } catch (error) {
      console.error('Erro ao atualizar preços:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar os preços de combustível.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handler para mudança nos campos de preço
  const handleChange = (tipo: 'diesel' | 'arla', value: string) => {
    // Garantir que apenas números e decimais sejam aceitos
    let cleanValue = value.replace(/[^0-9.]/g, '');
    
    // Evitar múltiplos pontos decimais
    const decimalCount = (cleanValue.match(/\./g) || []).length;
    if (decimalCount > 1) {
      const parts = cleanValue.split('.');
      cleanValue = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Evitar mais de 2 casas decimais
    if (cleanValue.includes('.')) {
      const parts = cleanValue.split('.');
      if (parts[1] && parts[1].length > 2) {
        parts[1] = parts[1].substring(0, 2);
        cleanValue = parts.join('.');
      }
    }
    
    setPrecos(prev => ({
      ...prev,
      [tipo]: cleanValue
    }));
  };

  if (!isOpen) return null;
  
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg flex items-center">
            Configurar Preços de Combustível
          </DialogTitle>
          <DialogDescription>
            Atualize os preços por litro dos combustíveis para todos os postos.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <RotateCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <div className="flex items-center">
                <Fuel className="h-5 w-5 text-amber-600 mr-2" />
                <Label htmlFor="diesel-preco" className="text-amber-800 font-medium">
                  Preço do Diesel (R$/L)
                </Label>
              </div>
              <Input
                id="diesel-preco"
                value={precos.diesel}
                onChange={(e) => handleChange('diesel', e.target.value)}
                className="bg-amber-50 border-amber-200 focus:border-amber-400"
                placeholder="0.00"
              />
            </div>
            
            <div className="grid gap-2">
              <div className="flex items-center">
                <Droplet className="h-5 w-5 text-blue-600 mr-2" />
                <Label htmlFor="arla-preco" className="text-blue-800 font-medium">
                  Preço do ARLA (R$/L)
                </Label>
              </div>
              <Input
                id="arla-preco"
                value={precos.arla}
                onChange={(e) => handleChange('arla', e.target.value)}
                className="bg-blue-50 border-blue-200 focus:border-blue-400"
                placeholder="0.00"
              />
            </div>
          </div>
        )}
        
        <DialogFooter className="flex space-x-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isLoading || isSaving}
            className={isSaving ? 'opacity-80' : ''}
          >
            {isSaving ? (
              <>
                <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : 'Salvar Preços'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
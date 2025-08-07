import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface PartItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface PartsManagerProps {
  initialParts?: PartItem[];
  onPartsChange: (parts: PartItem[], totalValue: number) => void;
  disabled?: boolean;
}

export default function PartsManager({ initialParts = [], onPartsChange, disabled = false }: PartsManagerProps) {
  const [parts, setParts] = useState<PartItem[]>(initialParts);
  const { toast } = useToast();

  // Função para gerar ID único
  const generateId = () => `part_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Adicionar nova peça
  const addPart = () => {
    const newPart: PartItem = {
      id: generateId(),
      description: "",
      quantity: 1,
      unitPrice: 0,
      total: 0
    };
    const updatedParts = [...parts, newPart];
    setParts(updatedParts);
    notifyPartsChange(updatedParts);
  };

  // Remover peça
  const removePart = (id: string) => {
    const updatedParts = parts.filter(part => part.id !== id);
    setParts(updatedParts);
    notifyPartsChange(updatedParts);
    toast({
      title: "Peça removida",
      description: "A peça foi removida do orçamento.",
    });
  };

  // Atualizar peça
  const updatePart = (id: string, field: keyof PartItem, value: string | number) => {
    const updatedParts = parts.map(part => {
      if (part.id === id) {
        const updatedPart = { ...part, [field]: value };
        
        // Recalcular total se quantidade ou preço unitário mudou
        if (field === 'quantity' || field === 'unitPrice') {
          updatedPart.total = Number(updatedPart.quantity) * Number(updatedPart.unitPrice);
        }
        
        return updatedPart;
      }
      return part;
    });
    
    setParts(updatedParts);
    notifyPartsChange(updatedParts);
  };

  // Notificar mudanças para o componente pai
  const notifyPartsChange = (updatedParts: PartItem[]) => {
    const totalValue = updatedParts.reduce((sum, part) => sum + part.total, 0);
    onPartsChange(updatedParts, totalValue);
  };

  // Calcular total geral
  const totalValue = parts.reduce((sum, part) => sum + part.total, 0);

  // Atualizar ao receber novos dados iniciais
  useEffect(() => {
    if (initialParts.length > 0 && parts.length === 0) {
      setParts(initialParts);
      notifyPartsChange(initialParts);
    }
  }, [initialParts]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Gestão de Peças
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {parts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma peça adicionada ao orçamento</p>
            <p className="text-sm">Clique em "Adicionar Peça" para começar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {parts.map((part) => (
              <Card key={part.id} className="p-4 bg-muted/20">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                  <div className="md:col-span-2">
                    <Label htmlFor={`desc-${part.id}`}>Descrição da Peça</Label>
                    <Input
                      id={`desc-${part.id}`}
                      placeholder="Ex: Pastilha de freio dianteira"
                      value={part.description}
                      onChange={(e) => updatePart(part.id, 'description', e.target.value)}
                      disabled={disabled}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`qty-${part.id}`}>Quantidade</Label>
                    <Input
                      id={`qty-${part.id}`}
                      type="number"
                      min="1"
                      step="1"
                      value={part.quantity}
                      onChange={(e) => updatePart(part.id, 'quantity', parseInt(e.target.value) || 1)}
                      disabled={disabled}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`price-${part.id}`}>Preço Unitário (R$)</Label>
                    <Input
                      id={`price-${part.id}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={part.unitPrice}
                      onChange={(e) => updatePart(part.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                      disabled={disabled}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label>Total</Label>
                      <div className="font-semibold text-lg text-green-600">
                        R$ {part.total.toFixed(2)}
                      </div>
                    </div>
                    {!disabled && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePart(part.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Resumo Total */}
        {parts.length > 0 && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4">
              <div className="flex justify-between items-center">
                <div className="text-lg font-medium">Total em Peças:</div>
                <div className="text-2xl font-bold text-primary">
                  R$ {totalValue.toFixed(2)}
                </div>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {parts.length} {parts.length === 1 ? 'item' : 'itens'} adicionado{parts.length === 1 ? '' : 's'}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botão Adicionar */}
        {!disabled && (
          <Button 
            onClick={addPart} 
            variant="outline" 
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Peça
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
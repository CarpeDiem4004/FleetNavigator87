import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Fuel, Droplet, Save } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface TanqueConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dieselNivel: number;
  dieselCapacidade: number;
  dieselValorLitro: number;
  arlaNivel: number;
  arlaCapacidade: number;
  arlaValorLitro: number;
  onSave: (config: {
    dieselNivel: number;
    dieselCapacidade: number;
    dieselValorLitro: number;
    arlaNivel: number;
    arlaCapacidade: number;
    arlaValorLitro: number;
  }) => Promise<void>;
}

const TanqueConfigDialog: React.FC<TanqueConfigDialogProps> = ({
  open,
  onOpenChange,
  dieselNivel: initialDieselNivel,
  dieselCapacidade: initialDieselCapacidade,
  dieselValorLitro: initialDieselValorLitro,
  arlaNivel: initialArlaNivel,
  arlaCapacidade: initialArlaCapacidade,
  arlaValorLitro: initialArlaValorLitro,
  onSave
}) => {
  const { toast } = useToast();
  
  // Estados para os campos do formulário
  const [dieselNivel, setDieselNivel] = useState<number>(initialDieselNivel);
  const [dieselCapacidade, setDieselCapacidade] = useState<number>(initialDieselCapacidade);
  const [dieselValorLitro, setDieselValorLitro] = useState<number>(initialDieselValorLitro);
  const [arlaNivel, setArlaNivel] = useState<number>(initialArlaNivel);
  const [arlaCapacidade, setArlaCapacidade] = useState<number>(initialArlaCapacidade);
  const [arlaValorLitro, setArlaValorLitro] = useState<number>(initialArlaValorLitro);
  const [isSalvando, setIsSalvando] = useState(false);
  
  // Atualizar os estados quando as props mudarem
  useEffect(() => {
    console.log("TanqueConfigDialog - Atualizando valores:", {
      dieselNivel: initialDieselNivel,
      dieselCapacidade: initialDieselCapacidade,
      dieselValorLitro: initialDieselValorLitro,
      arlaNivel: initialArlaNivel,
      arlaCapacidade: initialArlaCapacidade,
      arlaValorLitro: initialArlaValorLitro
    });
    
    setDieselNivel(initialDieselNivel);
    setDieselCapacidade(initialDieselCapacidade);
    setDieselValorLitro(initialDieselValorLitro);
    setArlaNivel(initialArlaNivel);
    setArlaCapacidade(initialArlaCapacidade);
    setArlaValorLitro(initialArlaValorLitro);
  }, [
    initialDieselNivel, 
    initialDieselCapacidade, 
    initialDieselValorLitro, 
    initialArlaNivel, 
    initialArlaCapacidade, 
    initialArlaValorLitro,
    open // Atualizar também quando o diálogo for aberto
  ]);
  
  // Função para salvar as configurações
  const handleSave = async () => {
    try {
      setIsSalvando(true);
      
      // Verificações de validação
      if (dieselNivel < 0 || dieselCapacidade <= 0 || arlaNivel < 0 || arlaCapacidade <= 0) {
        throw new Error("Todos os valores devem ser números positivos e as capacidades devem ser maiores que zero.");
      }
      
      if (dieselNivel > dieselCapacidade) {
        throw new Error("O nível de diesel não pode ser maior que a capacidade.");
      }
      
      if (arlaNivel > arlaCapacidade) {
        throw new Error("O nível de ARLA não pode ser maior que a capacidade.");
      }
      
      if (dieselValorLitro < 0 || arlaValorLitro < 0) {
        throw new Error("Os valores por litro não podem ser negativos.");
      }
      
      // Chamar a função de salvamento do componente pai
      await onSave({
        dieselNivel,
        dieselCapacidade,
        dieselValorLitro,
        arlaNivel,
        arlaCapacidade,
        arlaValorLitro
      });
      
    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar as configurações dos tanques."
      });
    } finally {
      setIsSalvando(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Configurar Tanques de Combustível</DialogTitle>
          <DialogDescription>
            Ajuste os níveis, capacidades e valores por litro dos tanques de Diesel e ARLA.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* VALORES DO DIESEL */}
          <div className="space-y-3 bg-amber-50 p-4 rounded-lg border border-amber-100">
            <h3 className="font-medium text-amber-600 flex items-center gap-2">
              <Fuel className="h-4 w-4" /> Tanque de Diesel
            </h3>
            
            {/* Container para nível e capacidade */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="dieselNivel">Nível Atual (L)</Label>
                <Input
                  id="dieselNivel"
                  type="number"
                  value={dieselNivel}
                  onChange={(e) => setDieselNivel(Number(e.target.value))}
                  min={0}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="dieselCapacidade">Capacidade Total (L)</Label>
                <Input
                  id="dieselCapacidade"
                  type="number"
                  value={dieselCapacidade}
                  onChange={(e) => setDieselCapacidade(Number(e.target.value))}
                  min={1000}
                />
              </div>
            </div>
            
            {/* Container para o preço - linha separada */}
            <div className="space-y-1 mt-3 bg-green-50 p-3 rounded-md border border-green-100">
              <Label htmlFor="dieselValorLitro" className="flex items-center gap-1 font-medium text-green-600">
                Valor por Litro (R$)
              </Label>
              <Input
                id="dieselValorLitro"
                type="number"
                step="0.01"
                value={dieselValorLitro}
                onChange={(e) => setDieselValorLitro(Number(e.target.value))}
                min={0}
                className="border-green-200 focus:border-green-400"
              />
            </div>
          </div>
          
          {/* VALORES DO ARLA */}
          <div className="space-y-3 bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="font-medium text-blue-600 flex items-center gap-2">
              <Droplet className="h-4 w-4" /> Tanque de ARLA
            </h3>
            
            {/* Container para nível e capacidade */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="arlaNivel">Nível Atual (L)</Label>
                <Input
                  id="arlaNivel"
                  type="number"
                  value={arlaNivel}
                  onChange={(e) => setArlaNivel(Number(e.target.value))}
                  min={0}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="arlaCapacidade">Capacidade Total (L)</Label>
                <Input
                  id="arlaCapacidade"
                  type="number"
                  value={arlaCapacidade}
                  onChange={(e) => setArlaCapacidade(Number(e.target.value))}
                  min={100}
                />
              </div>
            </div>
            
            {/* Container para o preço - linha separada */}
            <div className="space-y-1 mt-3 bg-green-50 p-3 rounded-md border border-green-100">
              <Label htmlFor="arlaValorLitro" className="flex items-center gap-1 font-medium text-green-600">
                Valor por Litro (R$)
              </Label>
              <Input
                id="arlaValorLitro"
                type="number"
                step="0.01"
                value={arlaValorLitro}
                onChange={(e) => setArlaValorLitro(Number(e.target.value))}
                min={0}
                className="border-green-200 focus:border-green-400"
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSalvando}
            className="flex items-center gap-2"
          >
            {isSalvando && <span className="animate-spin">⏳</span>}
            <Save className="h-4 w-4" />
            {isSalvando ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TanqueConfigDialog;
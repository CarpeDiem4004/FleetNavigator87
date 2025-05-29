import React, { useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface ChecklistItem {
  id: string;
  category: string;
  item: string;
  checked: boolean;
  observation?: string;
}

const DriverChecklist: React.FC = () => {
  const params = useParams();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [observacoes, setObservacoes] = useState('');
  const { toast } = useToast();

  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([
    // Itens de segurança
    { id: 'seg_1', category: 'Segurança', item: 'Cinto de segurança em bom estado', checked: false },
    { id: 'seg_2', category: 'Segurança', item: 'Triângulo de sinalização', checked: false },
    { id: 'seg_3', category: 'Segurança', item: 'Extintor de incêndio', checked: false },
    { id: 'seg_4', category: 'Segurança', item: 'Kit de primeiros socorros', checked: false },
    
    // Motor e fluidos
    { id: 'mot_1', category: 'Motor', item: 'Nível do óleo do motor', checked: false },
    { id: 'mot_2', category: 'Motor', item: 'Nível da água do radiador', checked: false },
    { id: 'mot_3', category: 'Motor', item: 'Nível do fluido de freio', checked: false },
    { id: 'mot_4', category: 'Motor', item: 'Combustível suficiente', checked: false },
    
    // Pneus e rodas
    { id: 'pneu_1', category: 'Pneus', item: 'Calibragem dos pneus dianteiros', checked: false },
    { id: 'pneu_2', category: 'Pneus', item: 'Calibragem dos pneus traseiros', checked: false },
    { id: 'pneu_3', category: 'Pneus', item: 'Estado do pneu estepe', checked: false },
    { id: 'pneu_4', category: 'Pneus', item: 'Porcas das rodas apertadas', checked: false },
    
    // Iluminação
    { id: 'luz_1', category: 'Iluminação', item: 'Faróis dianteiros funcionando', checked: false },
    { id: 'luz_2', category: 'Iluminação', item: 'Lanternas traseiras funcionando', checked: false },
    { id: 'luz_3', category: 'Iluminação', item: 'Pisca-alerta funcionando', checked: false },
    { id: 'luz_4', category: 'Iluminação', item: 'Setas funcionando', checked: false },
    
    // Freios
    { id: 'freio_1', category: 'Freios', item: 'Freio de serviço funcionando', checked: false },
    { id: 'freio_2', category: 'Freios', item: 'Freio de estacionamento funcionando', checked: false },
    
    // Carroceria
    { id: 'carr_1', category: 'Carroceria', item: 'Portas e fechaduras em bom estado', checked: false },
    { id: 'carr_2', category: 'Carroceria', item: 'Espelhos retrovisores limpos e ajustados', checked: false },
    { id: 'carr_3', category: 'Carroceria', item: 'Limpador de para-brisa funcionando', checked: false },
    { id: 'carr_4', category: 'Carroceria', item: 'Buzina funcionando', checked: false }
  ]);

  const handleItemCheck = (itemId: string, checked: boolean) => {
    setChecklistItems(items =>
      items.map(item =>
        item.id === itemId ? { ...item, checked } : item
      )
    );
  };

  const handleItemObservation = (itemId: string, observation: string) => {
    setChecklistItems(items =>
      items.map(item =>
        item.id === itemId ? { ...item, observation } : item
      )
    );
  };

  const handleSubmit = async () => {
    const checkedItems = checklistItems.filter(item => item.checked);
    const uncheckedItems = checklistItems.filter(item => !item.checked);

    if (uncheckedItems.length > 0) {
      toast({
        title: "Checklist incompleto",
        description: `${uncheckedItems.length} item(ns) não verificado(s). Deseja continuar mesmo assim?`,
        variant: "destructive"
      });
    }

    setIsSubmitting(true);
    try {
      const checklistData = {
        motorista_id: parseInt(params.id as string),
        itens_verificados: checkedItems.length,
        total_itens: checklistItems.length,
        itens_detalhes: checklistItems,
        observacoes_gerais: observacoes,
        status: uncheckedItems.length === 0 ? 'aprovado' : 'pendente'
      };

      const response = await apiRequest('POST', '/api/line-hall/checklist', checklistData);
      const data = await response.json();

      if (data.success) {
        toast({
          title: "Checklist enviado com sucesso",
          description: uncheckedItems.length === 0 
            ? "Veículo aprovado para viagem" 
            : "Veículo com pendências registradas"
        });
        setLocation('/driver-access');
      } else {
        throw new Error(data.message || 'Erro ao salvar checklist');
      }
    } catch (error) {
      console.error('Erro ao enviar checklist:', error);
      toast({
        title: "Erro ao enviar checklist",
        description: "Tente novamente ou procure ajuda",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const groupedItems = checklistItems.reduce((groups, item) => {
    if (!groups[item.category]) {
      groups[item.category] = [];
    }
    groups[item.category].push(item);
    return groups;
  }, {} as Record<string, ChecklistItem[]>);

  const checkedCount = checklistItems.filter(item => item.checked).length;
  const totalCount = checklistItems.length;
  const completionPercentage = Math.round((checkedCount / totalCount) * 100);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" onClick={() => setLocation('/driver-access')}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <CardTitle>Checklist do Veículo</CardTitle>
                  <CardDescription>
                    Verificação obrigatória antes da viagem
                  </CardDescription>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{completionPercentage}%</div>
                <div className="text-sm text-gray-500">{checkedCount}/{totalCount} itens</div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Progress bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Checklist items by category */}
        {Object.entries(groupedItems).map(([category, items]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-lg">{category}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={item.id}
                      checked={item.checked}
                      onCheckedChange={(checked) => handleItemCheck(item.id, checked as boolean)}
                    />
                    <Label htmlFor={item.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {item.item}
                    </Label>
                    {!item.checked && (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                    {item.checked && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  
                  {!item.checked && (
                    <Textarea
                      placeholder="Descreva o problema encontrado..."
                      value={item.observation || ''}
                      onChange={(e) => handleItemObservation(item.id, e.target.value)}
                      className="ml-6 text-sm"
                      rows={2}
                    />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        {/* Observações gerais */}
        <Card>
          <CardHeader>
            <CardTitle>Observações Gerais</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Adicione observações gerais sobre o veículo..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Submit button */}
        <Card>
          <CardContent className="pt-6">
            <Button 
              onClick={handleSubmit} 
              className="w-full" 
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando Checklist...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Finalizar Checklist
                </>
              )}
            </Button>
            
            {checkedCount < totalCount && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">
                    Atenção: {totalCount - checkedCount} item(ns) não verificado(s)
                  </span>
                </div>
                <p className="text-sm text-amber-700 mt-1">
                  Veículos com pendências podem ser impedidos de viajar até a correção dos problemas.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DriverChecklist;
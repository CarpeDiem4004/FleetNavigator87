import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CheckCircle2, AlertTriangle, Loader2, Gauge, Clock } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface ChecklistItem {
  id: string;
  category: string;
  item: string;
  checked: boolean;
  observation?: string;
}

interface PendingChecklist {
  id: number;
  driver_name: string;
  vehicle_plate: string;
  km_atual: number;
  created_at: string;
  status: string;
}

const DriverChecklist: React.FC = () => {
  const params = useParams();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [observacoes, setObservacoes] = useState('');
  const [kmInicial, setKmInicial] = useState('');
  const [kmFinal, setKmFinal] = useState('');
  const [pendingChecklist, setPendingChecklist] = useState<PendingChecklist | null>(null);
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

  // Buscar checklists pendentes ao carregar
  useEffect(() => {
    const fetchPendingChecklists = async () => {
      try {
        const response = await apiRequest('GET', `/api/line-hall/checklist/motorista/${params.id}/pendentes`);
        const data = await response.json();
        
        if (data.success && data.checklists.length > 0) {
          setPendingChecklist(data.checklists[0]); // Pega o mais recente
        }
      } catch (error) {
        console.error('Erro ao buscar checklists pendentes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendingChecklists();
  }, [params.id]);

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

  const handleSubmitInicial = async () => {
    const checkedItems = checklistItems.filter(item => item.checked);
    const uncheckedItems = checklistItems.filter(item => !item.checked);

    if (!kmInicial || parseInt(kmInicial) <= 0) {
      toast({
        title: "KM inicial obrigatório",
        description: "Por favor, informe o KM inicial do veículo",
        variant: "destructive"
      });
      return;
    }

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
        km_inicial: parseInt(kmInicial),
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
          title: "Viagem iniciada!",
          description: "Checklist salvo. Adicione o KM final ao retornar à garagem.",
          variant: "default"
        });
        setLocation('/app/system/driver-access');
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

  const handleFinalizarChecklist = async () => {
    if (!kmFinal || parseInt(kmFinal) <= 0) {
      toast({
        title: "KM final obrigatório",
        description: "Por favor, informe o KM final do veículo",
        variant: "destructive"
      });
      return;
    }

    if (pendingChecklist && parseInt(kmFinal) <= pendingChecklist.km_atual) {
      toast({
        title: "KM inválido",
        description: "KM final deve ser maior que KM inicial",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiRequest('PUT', `/api/line-hall/checklist/${pendingChecklist?.id}/finalizar`, {
        km_final: parseInt(kmFinal)
      });
      const data = await response.json();

      if (data.success) {
        const kmRodados = parseInt(kmFinal) - (pendingChecklist?.km_atual || 0);
        toast({
          title: "Checklist finalizado!",
          description: `Viagem concluída. Total de ${kmRodados} km rodados.`,
          variant: "default"
        });
        setLocation('/app/system/driver-access');
      } else {
        throw new Error(data.message || 'Erro ao finalizar checklist');
      }
    } catch (error) {
      console.error('Erro ao finalizar checklist:', error);
      toast({
        title: "Erro ao finalizar checklist",
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verificando checklists pendentes...</p>
        </div>
      </div>
    );
  }

  // Se houver checklist pendente, mostrar interface para finalizar
  if (pendingChecklist) {
    const kmRodados = kmFinal ? parseInt(kmFinal) - pendingChecklist.km_atual : 0;
    
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button variant="ghost" onClick={() => setLocation('/app/system/driver-access')}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <CardTitle>Finalizar Checklist</CardTitle>
                    <CardDescription>
                      Viagem em andamento - Adicione o KM final
                    </CardDescription>
                  </div>
                </div>
                <Clock className="h-8 w-8 text-amber-500" />
              </div>
            </CardHeader>
          </Card>

          {/* Informações da viagem */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações da Viagem</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Motorista:</span>
                <span className="font-medium">{pendingChecklist.driver_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Veículo:</span>
                <span className="font-medium">{pendingChecklist.vehicle_plate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">KM Inicial:</span>
                <span className="font-medium">{pendingChecklist.km_atual.toLocaleString()} km</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Data de Início:</span>
                <span className="font-medium">{new Date(pendingChecklist.created_at).toLocaleString('pt-BR')}</span>
              </div>
            </CardContent>
          </Card>

          {/* KM Final */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Gauge className="h-5 w-5" />
                KM Final do Veículo
              </CardTitle>
              <CardDescription>
                Informe a quilometragem atual ao retornar à garagem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="km-final">KM Final *</Label>
                  <Input
                    id="km-final"
                    type="number"
                    placeholder="Ex: 125500"
                    value={kmFinal}
                    onChange={(e) => setKmFinal(e.target.value)}
                    className="text-lg font-medium"
                    min={pendingChecklist.km_atual + 1}
                    required
                  />
                  <p className="text-sm text-gray-500">
                    Deve ser maior que {pendingChecklist.km_atual.toLocaleString()} km (KM inicial)
                  </p>
                </div>

                {kmRodados > 0 && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-800">Total de KM rodados:</span>
                      <span className="text-xl font-bold text-green-900">{kmRodados.toLocaleString()} km</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit button */}
          <Card>
            <CardContent className="pt-6">
              <Button 
                onClick={handleFinalizarChecklist} 
                className="w-full" 
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Finalizando Checklist...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Concluir Viagem
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Se não houver checklist pendente, mostrar formulário para iniciar nova viagem
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" onClick={() => setLocation('/app/system/driver-access')}>
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

        {/* KM Inicial */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              KM Inicial do Veículo
            </CardTitle>
            <CardDescription>
              Informe a quilometragem atual do veículo antes de iniciar a viagem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="km-inicial">KM Atual *</Label>
              <Input
                id="km-inicial"
                type="number"
                placeholder="Ex: 125000"
                value={kmInicial}
                onChange={(e) => setKmInicial(e.target.value)}
                className="text-lg font-medium"
                min="0"
                required
              />
              <p className="text-sm text-gray-500">
                Este valor será usado para controle de quilometragem da viagem
              </p>
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
              onClick={handleSubmitInicial} 
              className="w-full" 
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando Viagem...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Iniciar Viagem
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

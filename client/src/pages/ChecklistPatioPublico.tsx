import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { 
  Truck, Camera, CheckCircle, XCircle, MinusCircle, 
  Send, Loader2, ChevronRight, ChevronLeft, AlertTriangle
} from 'lucide-react';

interface ChecklistItem {
  categoria: string;
  item: string;
  status: 'sim' | 'nao' | 'nao_aplica' | '';
  observacao: string;
}

const BASES_LINE_HAUL = [
  'Osasco', 'ABC', 'Campinas', 'Sorocaba', 'Socorro', 'Alair',
  'Line Haul SP', 'Line Haul RJ', 'Line Haul MG', 'Outra'
];

export default function ChecklistPatioPublico() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checklistItens, setChecklistItens] = useState<ChecklistItem[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [categoriaAtual, setCategoriaAtual] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [resultStatus, setResultStatus] = useState('');

  const [formData, setFormData] = useState({
    operador_nome: '',
    operador_telefone: '',
    base_nome: '',
    placa_cavalo: '',
    placa_carreta_1: '',
    placa_carreta_2: '',
    quilometragem: '',
    observacao_geral: ''
  });

  useEffect(() => {
    fetchChecklistItens();
  }, []);

  const fetchChecklistItens = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/checklist-patio/itens-padrao');
      const response = await res.json();
      if (response.success && response.data) {
        const itens: ChecklistItem[] = response.data.map((item: any) => ({
          ...item,
          status: '',
          observacao: ''
        }));
        setChecklistItens(itens);
        
        const cats = [...new Set(itens.map(i => i.categoria))] as string[];
        setCategorias(cats);
      }
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os itens do checklist",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemStatusChange = (index: number, status: 'sim' | 'nao' | 'nao_aplica') => {
    const newItens = [...checklistItens];
    newItens[index].status = status;
    setChecklistItens(newItens);
  };

  const handleItemObsChange = (index: number, obs: string) => {
    const newItens = [...checklistItens];
    newItens[index].observacao = obs;
    setChecklistItens(newItens);
  };

  const getItensByCategoria = (categoria: string) => {
    return checklistItens.filter(item => item.categoria === categoria);
  };

  const getIndexOfItem = (categoria: string, itemIndex: number) => {
    let count = 0;
    for (let i = 0; i < checklistItens.length; i++) {
      if (checklistItens[i].categoria === categoria) {
        if (count === itemIndex) return i;
        count++;
      }
    }
    return -1;
  };

  const isCategoriaCompleta = (categoria: string) => {
    const itens = getItensByCategoria(categoria);
    return itens.every(item => item.status !== '');
  };

  const allCategoriasCompletas = () => {
    return categorias.every(cat => isCategoriaCompleta(cat));
  };

  const validateStep1 = () => {
    if (!formData.operador_nome.trim()) {
      toast({ title: "Campo obrigatório", description: "Informe seu nome", variant: "destructive" });
      return false;
    }
    if (!formData.base_nome) {
      toast({ title: "Campo obrigatório", description: "Selecione a base", variant: "destructive" });
      return false;
    }
    if (!formData.placa_cavalo.trim()) {
      toast({ title: "Campo obrigatório", description: "Informe a placa do cavalo", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && categoriaAtual < categorias.length - 1) {
      setCategoriaAtual(categoriaAtual + 1);
      return;
    }
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    if (step === 2 && categoriaAtual > 0) {
      setCategoriaAtual(categoriaAtual - 1);
      return;
    }
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    const itensNao = checklistItens.filter(i => i.status === 'nao');
    const itensSemObs = itensNao.filter(i => !i.observacao.trim());
    
    if (itensSemObs.length > 0) {
      toast({
        title: "Observação obrigatória",
        description: `Itens com "Não" precisam de observação: ${itensSemObs.map(i => i.item).slice(0, 2).join(', ')}...`,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        placa_cavalo: formData.placa_cavalo.toUpperCase(),
        placa_carreta_1: formData.placa_carreta_1.toUpperCase() || null,
        placa_carreta_2: formData.placa_carreta_2.toUpperCase() || null,
        itens: checklistItens.filter(i => i.status !== '').map(item => ({
          categoria: item.categoria,
          item: item.item,
          status: item.status,
          observacao: item.observacao
        })),
        fotos: []
      };

      const res = await fetch('/api/checklist-patio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const response = await res.json();

      if (response.success) {
        setResultStatus(response.data.status_checklist);
        setSubmitted(true);
        toast({
          title: "Checklist enviado!",
          description: "Seu checklist foi registrado com sucesso",
        });
      } else {
        throw new Error(response.message || 'Erro ao enviar');
      }
    } catch (error: any) {
      console.error('Erro ao enviar:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível enviar o checklist",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovado': return 'bg-green-500';
      case 'aprovado_com_observacoes': return 'bg-yellow-500';
      case 'reprovado': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'aprovado': return 'Aprovado';
      case 'aprovado_com_observacoes': return 'Aprovado com Observações';
      case 'reprovado': return 'Reprovado';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#DB0145] to-[#8B0030] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-[#DB0145] mb-4" />
            <p className="text-gray-600">Carregando checklist...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#DB0145] to-[#8B0030] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="p-8 text-center">
            <div className={`w-20 h-20 rounded-full ${getStatusColor(resultStatus)} mx-auto mb-4 flex items-center justify-center`}>
              {resultStatus === 'aprovado' ? (
                <CheckCircle className="h-12 w-12 text-white" />
              ) : resultStatus === 'reprovado' ? (
                <XCircle className="h-12 w-12 text-white" />
              ) : (
                <AlertTriangle className="h-12 w-12 text-white" />
              )}
            </div>
            <h2 className="text-2xl font-bold mb-2">{getStatusLabel(resultStatus)}</h2>
            <p className="text-gray-600 mb-6">
              Checklist registrado para o veículo {formData.placa_cavalo}
            </p>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-[#DB0145] hover:bg-[#B8033B]"
            >
              Novo Checklist
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#DB0145] to-[#8B0030] p-4 pb-24">
      <div className="max-w-lg mx-auto">
        <div className="text-center text-white mb-6">
          <Truck className="h-12 w-12 mx-auto mb-2" />
          <h1 className="text-2xl font-bold">Checklist de Pátio</h1>
          <p className="text-white/80 text-sm">Line Haul - Murici Transportes</p>
        </div>

        <div className="flex justify-center gap-2 mb-4">
          {[1, 2, 3].map(s => (
            <div 
              key={s}
              className={`w-3 h-3 rounded-full ${step >= s ? 'bg-white' : 'bg-white/30'}`}
            />
          ))}
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">
              {step === 1 && 'Identificação'}
              {step === 2 && `Checklist - ${categorias[categoriaAtual] || ''}`}
              {step === 3 && 'Finalização'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Informe seus dados e do veículo'}
              {step === 2 && `Categoria ${categoriaAtual + 1} de ${categorias.length}`}
              {step === 3 && 'Revise e envie o checklist'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {step === 1 && (
              <>
                <div>
                  <Label>Nome do Operador *</Label>
                  <Input
                    placeholder="Seu nome completo"
                    value={formData.operador_nome}
                    onChange={(e) => handleInputChange('operador_nome', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input
                    placeholder="(00) 00000-0000"
                    value={formData.operador_telefone}
                    onChange={(e) => handleInputChange('operador_telefone', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Base *</Label>
                  <select
                    className="w-full border rounded-md p-2"
                    value={formData.base_nome}
                    onChange={(e) => handleInputChange('base_nome', e.target.value)}
                  >
                    <option value="">Selecione a base</option>
                    {BASES_LINE_HAUL.map(base => (
                      <option key={base} value={base}>{base}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Placa Cavalo *</Label>
                    <Input
                      placeholder="ABC-1234"
                      value={formData.placa_cavalo}
                      onChange={(e) => handleInputChange('placa_cavalo', e.target.value.toUpperCase())}
                      className="uppercase"
                    />
                  </div>
                  <div>
                    <Label>Quilometragem</Label>
                    <Input
                      placeholder="000000"
                      value={formData.quilometragem}
                      onChange={(e) => handleInputChange('quilometragem', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Carreta 1</Label>
                    <Input
                      placeholder="Placa"
                      value={formData.placa_carreta_1}
                      onChange={(e) => handleInputChange('placa_carreta_1', e.target.value.toUpperCase())}
                      className="uppercase"
                    />
                  </div>
                  <div>
                    <Label>Carreta 2</Label>
                    <Input
                      placeholder="Placa"
                      value={formData.placa_carreta_2}
                      onChange={(e) => handleInputChange('placa_carreta_2', e.target.value.toUpperCase())}
                      className="uppercase"
                    />
                  </div>
                </div>
              </>
            )}

            {step === 2 && categorias[categoriaAtual] && (
              <div className="space-y-4">
                {getItensByCategoria(categorias[categoriaAtual]).map((item, idx) => {
                  const globalIndex = getIndexOfItem(categorias[categoriaAtual], idx);
                  return (
                    <div key={globalIndex} className="p-4 bg-gray-50 rounded-lg">
                      <p className="font-medium text-sm mb-3">{item.item}</p>
                      <RadioGroup
                        value={item.status}
                        onValueChange={(value) => handleItemStatusChange(globalIndex, value as 'sim' | 'nao' | 'nao_aplica')}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="sim" id={`sim-${globalIndex}`} />
                          <Label htmlFor={`sim-${globalIndex}`} className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" /> Sim
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="nao" id={`nao-${globalIndex}`} />
                          <Label htmlFor={`nao-${globalIndex}`} className="flex items-center gap-1 text-red-600">
                            <XCircle className="h-4 w-4" /> Não
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="nao_aplica" id={`na-${globalIndex}`} />
                          <Label htmlFor={`na-${globalIndex}`} className="flex items-center gap-1 text-gray-500">
                            <MinusCircle className="h-4 w-4" /> N/A
                          </Label>
                        </div>
                      </RadioGroup>
                      {item.status === 'nao' && (
                        <div className="mt-3">
                          <Input
                            placeholder="Descreva o problema (obrigatório)"
                            value={item.observacao}
                            onChange={(e) => handleItemObsChange(globalIndex, e.target.value)}
                            className="border-red-300"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {step === 3 && (
              <>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Operador:</span>
                    <span className="font-medium">{formData.operador_nome}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Base:</span>
                    <span className="font-medium">{formData.base_nome}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Veículo:</span>
                    <span className="font-medium">{formData.placa_cavalo}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-xl font-bold text-green-600">
                      {checklistItens.filter(i => i.status === 'sim').length}
                    </div>
                    <div className="text-xs text-gray-600">OK</div>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <div className="text-xl font-bold text-red-600">
                      {checklistItens.filter(i => i.status === 'nao').length}
                    </div>
                    <div className="text-xs text-gray-600">Problemas</div>
                  </div>
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <div className="text-xl font-bold text-gray-600">
                      {checklistItens.filter(i => i.status === 'nao_aplica').length}
                    </div>
                    <div className="text-xs text-gray-600">N/A</div>
                  </div>
                </div>

                {checklistItens.filter(i => i.status === 'nao').length > 0 && (
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-red-800 mb-2">Itens com problemas:</p>
                    <ul className="text-xs text-red-700 space-y-1">
                      {checklistItens.filter(i => i.status === 'nao').map((item, idx) => (
                        <li key={idx}>• {item.item}: {item.observacao}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <Label>Observações Gerais</Label>
                  <Textarea
                    placeholder="Observações adicionais sobre o veículo..."
                    value={formData.observacao_geral}
                    onChange={(e) => handleInputChange('observacao_geral', e.target.value)}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex gap-3">
          {(step > 1 || categoriaAtual > 0) && (
            <Button 
              variant="outline" 
              onClick={handlePrevStep}
              className="flex-1"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
          )}
          
          {step < 3 ? (
            <Button 
              onClick={handleNextStep}
              className="flex-1 bg-[#DB0145] hover:bg-[#B8033B]"
              disabled={step === 2 && !isCategoriaCompleta(categorias[categoriaAtual])}
            >
              Próximo
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={isSubmitting || !allCategoriasCompletas()}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Enviar Checklist
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

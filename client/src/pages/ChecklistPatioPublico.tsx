import { useState, useEffect, useRef } from 'react';
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
  Send, Loader2, ChevronRight, ChevronLeft, AlertTriangle,
  Plus, X, ImageIcon
} from 'lucide-react';

interface ChecklistItem {
  categoria: string;
  item: string;
  status: 'sim' | 'nao' | 'nao_aplica' | '';
  observacao: string;
}

interface FotoPosicao {
  posicao: string;
  label: string;
  file: File | null;
  preview: string | null;
}

interface FotoAdicional {
  id: string;
  file: File | null;
  preview: string | null;
  descricao: string;
}

const BASES_LINE_HAUL = [
  'LINE HAUL SP',
  'LINE HAUL MG',
  'LINE HAUL RIBEIRÃO PRETO'
];

const POSICOES_FOTO = [
  { posicao: 'frente', label: 'Frente' },
  { posicao: 'lateral_direita', label: 'Lateral Direita' },
  { posicao: 'lateral_esquerda', label: 'Lateral Esquerda' },
  { posicao: 'traseira', label: 'Traseira' }
];

export default function ChecklistPatioPublico() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [checklistItens, setChecklistItens] = useState<ChecklistItem[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [categoriaAtual, setCategoriaAtual] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [resultStatus, setResultStatus] = useState('');
  
  const [fotosPosicao, setFotosPosicao] = useState<FotoPosicao[]>(
    POSICOES_FOTO.map(p => ({ ...p, file: null, preview: null }))
  );
  const [fotosAdicionais, setFotosAdicionais] = useState<FotoAdicional[]>([]);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const [formData, setFormData] = useState({
    operador_nome: '',
    operador_telefone: '',
    base_nome: '',
    tipo_veiculo: '',
    placa_veiculo: '',
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

  const handleFotoPosicaoChange = (posicao: string, file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotosPosicao(prev => prev.map(f => 
          f.posicao === posicao 
            ? { ...f, file, preview: reader.result as string }
            : f
        ));
      };
      reader.readAsDataURL(file);
    } else {
      setFotosPosicao(prev => prev.map(f => 
        f.posicao === posicao 
          ? { ...f, file: null, preview: null }
          : f
      ));
    }
  };

  const addFotoAdicional = () => {
    setFotosAdicionais(prev => [...prev, {
      id: `adicional_${Date.now()}`,
      file: null,
      preview: null,
      descricao: ''
    }]);
  };

  const removeFotoAdicional = (id: string) => {
    setFotosAdicionais(prev => prev.filter(f => f.id !== id));
  };

  const handleFotoAdicionalChange = (id: string, file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotosAdicionais(prev => prev.map(f => 
          f.id === id 
            ? { ...f, file, preview: reader.result as string }
            : f
        ));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFotoAdicionalDescricao = (id: string, descricao: string) => {
    setFotosAdicionais(prev => prev.map(f => 
      f.id === id ? { ...f, descricao } : f
    ));
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
    if (!formData.operador_telefone.trim()) {
      toast({ title: "Campo obrigatório", description: "Informe seu telefone", variant: "destructive" });
      return false;
    }
    if (!formData.base_nome) {
      toast({ title: "Campo obrigatório", description: "Selecione a base", variant: "destructive" });
      return false;
    }
    if (!formData.placa_veiculo.trim()) {
      toast({ title: "Campo obrigatório", description: "Informe a placa do veículo", variant: "destructive" });
      return false;
    }
    if (!formData.quilometragem.trim()) {
      toast({ title: "Campo obrigatório", description: "Informe a quilometragem do veículo", variant: "destructive" });
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

  const uploadFotos = async (checklistId: number) => {
    const fotosParaUpload = [
      ...fotosPosicao.filter(f => f.file).map(f => ({
        file: f.file!,
        posicao: f.posicao,
        descricao: f.label
      })),
      ...fotosAdicionais.filter(f => f.file).map(f => ({
        file: f.file!,
        posicao: 'adicional',
        descricao: f.descricao || 'Foto adicional'
      }))
    ];

    if (fotosParaUpload.length === 0) return;

    setIsUploadingPhotos(true);
    
    for (const foto of fotosParaUpload) {
      const formData = new FormData();
      formData.append('foto', foto.file);
      formData.append('checklist_id', String(checklistId));
      formData.append('posicao', foto.posicao);
      formData.append('descricao', foto.descricao);

      try {
        await fetch('/api/checklist-patio/upload-foto', {
          method: 'POST',
          body: formData
        });
      } catch (error) {
        console.error('Erro ao enviar foto:', error);
      }
    }

    setIsUploadingPhotos(false);
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
        tipo_veiculo: formData.tipo_veiculo,
        placa_cavalo: formData.placa_veiculo.toUpperCase(),
        placa_veiculo: formData.placa_veiculo.toUpperCase(),
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
        // Upload fotos após criar o checklist
        if (response.data?.id) {
          await uploadFotos(response.data.id);
        }
        
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
              Checklist registrado para o veículo {formData.placa_veiculo}
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
          {[1, 2, 3, 4].map(s => (
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
              {step === 3 && 'Registro Fotográfico'}
              {step === 4 && 'Finalização'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Informe seus dados e do veículo'}
              {step === 2 && `Categoria ${categoriaAtual + 1} de ${categorias.length}`}
              {step === 3 && 'Fotografe o veículo nas posições indicadas'}
              {step === 4 && 'Revise e envie o checklist'}
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
                  <Label>Telefone *</Label>
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
                    <Label>Placa *</Label>
                    <Input
                      placeholder="ABC-1234"
                      value={formData.placa_veiculo}
                      onChange={(e) => handleInputChange('placa_veiculo', e.target.value.toUpperCase())}
                      className="uppercase"
                    />
                  </div>
                  <div>
                    <Label>Quilometragem *</Label>
                    <Input
                      placeholder="000000"
                      type="number"
                      value={formData.quilometragem}
                      onChange={(e) => handleInputChange('quilometragem', e.target.value)}
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
              <div className="space-y-6">
                <p className="text-sm text-gray-600 mb-4">
                  Tire fotos do veículo nas posições indicadas. As fotos são opcionais mas recomendadas.
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  {fotosPosicao.map((foto) => (
                    <div key={foto.posicao} className="space-y-2">
                      <Label className="text-sm font-medium">{foto.label}</Label>
                      <div 
                        className={`relative h-32 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                          foto.preview ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-[#DB0145] hover:bg-pink-50'
                        }`}
                        onClick={() => fileInputRefs.current[foto.posicao]?.click()}
                      >
                        {foto.preview ? (
                          <>
                            <img 
                              src={foto.preview} 
                              alt={foto.label} 
                              className="h-full w-full object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFotoPosicaoChange(foto.posicao, null);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </>
                        ) : (
                          <div className="text-center">
                            <Camera className="h-8 w-8 mx-auto text-gray-400" />
                            <span className="text-xs text-gray-500">Tirar foto</span>
                          </div>
                        )}
                      </div>
                      <input
                        ref={(el) => { fileInputRefs.current[foto.posicao] = el; }}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFotoPosicaoChange(foto.posicao, file);
                        }}
                      />
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center mb-3">
                    <Label className="text-sm font-medium">Fotos Adicionais</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={addFotoAdicional}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Adicionar
                    </Button>
                  </div>
                  
                  {fotosAdicionais.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Clique em "Adicionar" para incluir fotos extras com descrição
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {fotosAdicionais.map((foto) => (
                        <div key={foto.id} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex gap-3">
                            <div 
                              className={`relative w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer flex-shrink-0 ${
                                foto.preview ? 'border-green-400' : 'border-gray-300'
                              }`}
                              onClick={() => fileInputRefs.current[foto.id]?.click()}
                            >
                              {foto.preview ? (
                                <img 
                                  src={foto.preview} 
                                  alt="Foto adicional" 
                                  className="h-full w-full object-cover rounded-lg"
                                />
                              ) : (
                                <Camera className="h-6 w-6 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1 space-y-2">
                              <Input
                                placeholder="Descrição da foto..."
                                value={foto.descricao}
                                onChange={(e) => handleFotoAdicionalDescricao(foto.id, e.target.value)}
                              />
                              <Button 
                                type="button" 
                                variant="destructive" 
                                size="sm"
                                onClick={() => removeFotoAdicional(foto.id)}
                              >
                                <X className="h-4 w-4 mr-1" /> Remover
                              </Button>
                            </div>
                          </div>
                          <input
                            ref={(el) => { fileInputRefs.current[foto.id] = el; }}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFotoAdicionalChange(foto.id, file);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 4 && (
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
                    <span className="font-medium">{formData.tipo_veiculo?.toUpperCase()} - {formData.placa_veiculo}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Fotos:</span>
                    <span className="font-medium">
                      {fotosPosicao.filter(f => f.file).length + fotosAdicionais.filter(f => f.file).length} anexadas
                    </span>
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
          
          {step < 4 ? (
            <Button 
              onClick={handleNextStep}
              className="flex-1 bg-[#DB0145] hover:bg-[#B8033B]"
              disabled={step === 2 && !isCategoriaCompleta(categorias[categoriaAtual])}
            >
              {step === 3 ? 'Revisar' : 'Próximo'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={isSubmitting || isUploadingPhotos || !allCategoriasCompletas()}
            >
              {isSubmitting || isUploadingPhotos ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isUploadingPhotos ? 'Enviando fotos...' : 'Enviando...'}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Checklist
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

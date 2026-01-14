import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, CheckCircle, Shield, Truck, User, Loader2, Calendar, Search, ChevronsUpDown, Check, FileText, AlertCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface Project {
  id: number;
  name: string;
  description?: string;
  bases: ProjectBase[];
}

interface ProjectBase {
  id: number;
  base_name: string;
  base_code: string;
  description?: string;
}

const DEVIATION_TYPES = [
  { value: 'excesso_velocidade', label: 'Excesso de velocidade' },
  { value: 'jornada_acima_permitido', label: 'Jornada acima do permitido' },
  { value: 'falha_checklist', label: 'Falha no checklist' },
  { value: 'nao_uso_epi', label: 'Não uso de EPI' },
  { value: 'uso_indevido_veiculo', label: 'Uso indevido do veículo' },
  { value: 'avaria_conducao_inadequada', label: 'Avaria por condução inadequada' },
  { value: 'descumprimento_procedimento', label: 'Descumprimento de procedimento operacional' },
  { value: 'outro', label: 'Outro' }
];

interface DeviationFormEmbedProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function DeviationFormEmbed({ onSuccess, onCancel }: DeviationFormEmbedProps) {
  const { toast } = useToast();
  const [success, setSuccess] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [baseSearchOpen, setBaseSearchOpen] = useState(false);
  const [baseSearchQuery, setBaseSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    placa: '',
    motoristaNome: '',
    dataDesvio: new Date().toISOString().split('T')[0],
    tipoDesvio: '',
    observacoes: '',
    responsavelRegistro: '',
    baseOperacao: ''
  });

  useEffect(() => {
    let isMounted = true;
    
    const loadProjectsWithBases = async (): Promise<void> => {
      try {
        setIsLoadingProjects(true);
        
        const response = await fetch('/api/public/projects-with-bases', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (isMounted && data.success && Array.isArray(data.data)) {
          setProjects(data.data);
        }
      } catch (error) {
        console.error('Erro ao carregar projetos:', error);
      } finally {
        if (isMounted) {
          setIsLoadingProjects(false);
        }
      }
    };

    loadProjectsWithBases();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const handleProjectChange = (projectId: string) => {
    const project = projects.find(p => p.id.toString() === projectId);
    setSelectedProject(project || null);
    setFormData(prev => ({ ...prev, baseOperacao: '' }));
    setBaseSearchQuery('');
  };

  const filteredBases = useMemo(() => {
    if (!selectedProject?.bases) return [];
    if (!baseSearchQuery) return selectedProject.bases;
    return selectedProject.bases.filter(base => 
      base.base_name.toLowerCase().includes(baseSearchQuery.toLowerCase())
    );
  }, [selectedProject?.bases, baseSearchQuery]);

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest('POST', '/api/work-safety/deviations', {
        placa: data.placa.toUpperCase(),
        motoristaNome: data.motoristaNome,
        dataDesvio: new Date(data.dataDesvio).toISOString(),
        tipoDesvio: data.tipoDesvio,
        observacoes: data.observacoes || null,
        responsavelRegistro: data.responsavelRegistro,
        baseOperacao: data.baseOperacao
      });
    },
    onSuccess: (response: any) => {
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['/api/work-safety/deviations'] });
      toast({
        title: "Desvio registrado!",
        description: response.isRecurrent 
          ? `ATENÇÃO: Este é o ${response.deviationCount}º desvio deste tipo para o motorista.`
          : "O desvio foi registrado com sucesso.",
        variant: response.isRecurrent ? "destructive" : "default"
      });
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao registrar",
        description: error.message || "Ocorreu um erro ao registrar o desvio.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.placa || !formData.motoristaNome || !formData.tipoDesvio || 
        !formData.responsavelRegistro || !formData.baseOperacao) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    if (formData.tipoDesvio === 'outro' && !formData.observacoes) {
      toast({
        title: "Observação obrigatória",
        description: "Para o tipo 'Outro', é necessário descrever o desvio nas observações.",
        variant: "destructive"
      });
      return;
    }

    mutation.mutate(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setSuccess(false);
    setFormData({
      placa: '',
      motoristaNome: '',
      dataDesvio: new Date().toISOString().split('T')[0],
      tipoDesvio: '',
      observacoes: '',
      responsavelRegistro: '',
      baseOperacao: ''
    });
    setSelectedProject(null);
  };

  if (success) {
    return (
      <div className="p-6 text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Desvio Registrado com Sucesso!
        </h2>
        <p className="text-gray-600 mb-6">
          O registro foi salvo e será analisado pela equipe.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={resetForm} className="bg-[#DB0145] hover:bg-[#B50139]">
            Registrar Novo Desvio
          </Button>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Fechar
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-h-[70vh] overflow-y-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
            <p className="text-sm text-amber-700">
              Os registros de desvios são utilizados para identificar padrões e atuar de forma preventiva.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-[#DB0145]" />
              Operação / Projeto *
            </Label>
            {isLoadingProjects ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando projetos...
              </div>
            ) : (
              <Select onValueChange={handleProjectChange}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecione o projeto" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-[#DB0145]" />
              Base / Unidade *
            </Label>
            <Popover open={baseSearchOpen} onOpenChange={setBaseSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={baseSearchOpen}
                  className="w-full justify-between h-9"
                  disabled={!selectedProject}
                >
                  {formData.baseOperacao || "Selecione a base"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <div className="p-2">
                  <div className="flex items-center border rounded-md px-3">
                    <Search className="h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar base..."
                      value={baseSearchQuery}
                      onChange={(e) => setBaseSearchQuery(e.target.value)}
                      className="border-0 focus-visible:ring-0 h-8"
                    />
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredBases.map((base) => (
                    <div
                      key={base.id}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm",
                        formData.baseOperacao === base.base_name && "bg-gray-100"
                      )}
                      onClick={() => {
                        handleChange('baseOperacao', base.base_name);
                        setBaseSearchOpen(false);
                      }}
                    >
                      {formData.baseOperacao === base.base_name && (
                        <Check className="h-4 w-4 text-[#DB0145]" />
                      )}
                      <span>{base.base_name}</span>
                    </div>
                  ))}
                  {filteredBases.length === 0 && (
                    <div className="px-3 py-3 text-center text-gray-500 text-sm">
                      Nenhuma base encontrada
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <Truck className="h-4 w-4 text-[#DB0145]" />
              Placa do Veículo *
            </Label>
            <Input
              placeholder="ABC1234"
              value={formData.placa}
              onChange={(e) => handleChange('placa', e.target.value.toUpperCase())}
              maxLength={7}
              className="uppercase h-9"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-[#DB0145]" />
              Nome do Motorista *
            </Label>
            <Input
              placeholder="Nome completo do motorista"
              value={formData.motoristaNome}
              onChange={(e) => handleChange('motoristaNome', e.target.value)}
              className="h-9"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-[#DB0145]" />
              Data do Desvio *
            </Label>
            <Input
              type="date"
              value={formData.dataDesvio}
              onChange={(e) => handleChange('dataDesvio', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="h-9"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-[#DB0145]" />
              Tipo de Desvio *
            </Label>
            <Select
              value={formData.tipoDesvio}
              onValueChange={(value) => handleChange('tipoDesvio', value)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {DEVIATION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-[#DB0145]" />
            Responsável pelo Registro *
          </Label>
          <Input
            placeholder="Nome de quem está registrando"
            value={formData.responsavelRegistro}
            onChange={(e) => handleChange('responsavelRegistro', e.target.value)}
            className="h-9"
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-[#DB0145]" />
            Observações {formData.tipoDesvio === 'outro' && '*'}
          </Label>
          <Textarea
            placeholder="Descreva detalhes do desvio ocorrido..."
            value={formData.observacoes}
            onChange={(e) => handleChange('observacoes', e.target.value)}
            rows={3}
          />
          {formData.tipoDesvio === 'outro' && (
            <p className="text-xs text-amber-600">
              * Para o tipo "Outro", a descrição é obrigatória.
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button 
            type="submit" 
            className="flex-1 bg-[#DB0145] hover:bg-[#B50139]"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Registrar Desvio
              </>
            )}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

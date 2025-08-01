import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Plus, Loader2 } from 'lucide-react';

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

interface FuelCardRequestFormProps {
  onRequestCreated: () => void;
  onClose: () => void;
}

export default function FuelCardRequestForm({ onRequestCreated, onClose }: FuelCardRequestFormProps) {
  const [formData, setFormData] = useState({
    placa: '',
    motorista: '',
    solicitante: '',
    telefone_celular: '',
    valor_solicitado: '',
    km: '',
    projeto_id: '',
    base_id: '',
    tipo_cartao: 'Padrão',
    provedor_cartao: 'Padrão',
    numero_cartao: '',
    observacoes: ''
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Carregar projetos com bases
  useEffect(() => {
    loadProjectsWithBases();
  }, []);

  const loadProjectsWithBases = async (retryCount = 0) => {
    const maxRetries = 2;
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    try {
      setIsLoading(true);
      console.log(`[FuelCardForm] Tentativa ${retryCount + 1}/${maxRetries + 1}`);
      
      // Estratégia simplificada: usar apenas o endpoint público com configuração otimizada
      const controller = new AbortController();
      const timeoutMs = 30000; // 30s timeout fixo
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      const response = await fetch('/api/public/projects-with-bases', {
        method: 'GET',
        credentials: 'include',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setProjects(data.data);
        console.log(`[FuelCardForm] Projetos carregados: ${data.data.length}`);
        return; // Sucesso
      } else {
        throw new Error('Dados de projetos inválidos ou vazios');
      }
      
    } catch (error: any) {
      console.error(`[FuelCardForm] Erro na tentativa ${retryCount + 1}:`, error);
      
      // Retry automático apenas uma vez
      if (retryCount < maxRetries) {
        setTimeout(() => loadProjectsWithBases(retryCount + 1), 3000);
        return;
      }
      
      // Exibir erro final
      toast({
        title: 'Erro ao carregar projetos',
        description: 'Verifique sua conexão e tente novamente',
        variant: 'destructive'
      });
      
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectChange = (projectId: string) => {
    const project = projects.find(p => p.id.toString() === projectId);
    setSelectedProject(project || null);
    setFormData(prev => ({
      ...prev,
      projeto_id: projectId,
      base_id: '' // Reset base selection
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações básicas
    if (!formData.placa || !formData.motorista || !formData.solicitante || !formData.valor_solicitado) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha placa, motorista, solicitante e valor solicitado',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.projeto_id || !formData.base_id) {
      toast({
        title: 'Projeto e Base obrigatórios',
        description: 'Selecione um projeto e uma base',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Buscar dados da base selecionada
      const selectedBase = selectedProject?.bases.find(b => b.id.toString() === formData.base_id);
      
      const requestData = {
        placa: formData.placa.toUpperCase(),
        motorista: formData.motorista,
        solicitante: formData.solicitante,
        telefone_celular: formData.telefone_celular,
        valor_solicitado: parseFloat(formData.valor_solicitado),
        km: formData.km ? parseInt(formData.km) : null,
        tipo_cartao: formData.tipo_cartao,
        provedor_cartao: formData.provedor_cartao,
        numero_cartao: formData.numero_cartao,
        observacoes: formData.observacoes,
        base: selectedBase?.base_name || selectedProject?.name || 'Base não identificada',
        origem_tipo: 'tradicional'
      };

      const response = await apiRequest('POST', '/api/fuel-card-solicitations', requestData);
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Solicitação criada',
          description: 'Solicitação de cartão de combustível criada com sucesso'
        });
        onRequestCreated();
        onClose();
      } else {
        toast({
          title: 'Erro ao criar solicitação',
          description: data.message || 'Não foi possível criar a solicitação',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erro ao criar solicitação:', error);
      toast({
        title: 'Erro de conexão',
        description: 'Não foi possível conectar ao servidor',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Nova Solicitação de Cartão de Combustível
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Informações do Veículo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="placa">Placa do Veículo *</Label>
              <Input
                id="placa"
                value={formData.placa}
                onChange={(e) => setFormData(prev => ({ ...prev, placa: e.target.value }))}
                placeholder="ABC-1234"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="km">Quilometragem</Label>
              <Input
                id="km"
                type="number"
                value={formData.km}
                onChange={(e) => setFormData(prev => ({ ...prev, km: e.target.value }))}
                placeholder="Ex: 50000"
              />
            </div>
          </div>

          {/* Informações do Motorista e Solicitante */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="motorista">Nome do Motorista *</Label>
              <Input
                id="motorista"
                value={formData.motorista}
                onChange={(e) => setFormData(prev => ({ ...prev, motorista: e.target.value }))}
                placeholder="Nome completo do motorista"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="solicitante">Nome do Solicitante *</Label>
              <Input
                id="solicitante"
                value={formData.solicitante}
                onChange={(e) => setFormData(prev => ({ ...prev, solicitante: e.target.value }))}
                placeholder="Quem está fazendo a solicitação"
                required
              />
            </div>
          </div>

          {/* Telefone do Solicitante */}
          <div className="space-y-2">
            <Label htmlFor="telefone_celular">Telefone do Solicitante</Label>
            <Input
              id="telefone_celular"
              value={formData.telefone_celular}
              onChange={(e) => setFormData(prev => ({ ...prev, telefone_celular: e.target.value }))}
              placeholder="(11) 99999-9999"
            />
          </div>

          {/* Base do Veículo */}
          <div className="space-y-2">
            <Label htmlFor="base_veiculo">Base do Veículo</Label>
            <Input
              id="base_veiculo"
              value={selectedProject?.bases.find(b => b.id.toString() === formData.base_id)?.base_name || ''}
              placeholder="Base onde o veículo está alocado"
              disabled
            />
            <p className="text-xs text-muted-foreground">Base selecionada automaticamente com base no projeto</p>
          </div>

          {/* ID da Base */}
          <div className="space-y-2">
            <Label htmlFor="id_base">ID da Base</Label>
            <Input
              id="id_base"
              value={selectedProject?.bases.find(b => b.id.toString() === formData.base_id)?.base_code || ''}
              placeholder="Código de identificação da rota"
              disabled
            />
          </div>

          {/* Projeto e Base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projeto">Projeto *</Label>
              {isLoading ? (
                <div className="flex items-center justify-center h-10 border rounded">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2 text-sm">Carregando projetos...</span>
                </div>
              ) : projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-20 border rounded p-4">
                  <p className="text-sm text-muted-foreground mb-2">Erro ao carregar projetos</p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => loadProjectsWithBases(0)}
                    className="text-xs"
                  >
                    Tentar novamente
                  </Button>
                </div>
              ) : (
                <Select value={formData.projeto_id} onValueChange={handleProjectChange}>
                  <SelectTrigger className="touch-manipulation">
                    <SelectValue placeholder="Selecione o projeto" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] overflow-y-auto">
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {projects.length > 0 && (
                <p className="text-xs text-green-600">
                  {projects.length} projetos carregados
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="base">Base *</Label>
              <Select 
                value={formData.base_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, base_id: value }))}
                disabled={!selectedProject || selectedProject.bases.length === 0}
              >
                <SelectTrigger className="touch-manipulation">
                  <SelectValue placeholder={
                    selectedProject ? 
                      `Selecione entre ${selectedProject.bases.length} bases` : 
                      "Primeiro selecione um projeto"
                  } />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  {selectedProject?.bases.map((base) => (
                    <SelectItem key={base.id} value={base.id.toString()}>
                      {base.base_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProject && selectedProject.bases.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedProject.bases.length} bases disponíveis para {selectedProject.name}
                </p>
              )}
            </div>
          </div>

          {/* Informações do Cartão */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_cartao">Tipo de Cartão</Label>
              <Select value={formData.tipo_cartao} onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_cartao: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Padrão">Padrão</SelectItem>
                  <SelectItem value="Combustível">Combustível</SelectItem>
                  <SelectItem value="Line Hall">Line Hall</SelectItem>
                  <SelectItem value="Corporativo">Corporativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="provedor_cartao">Provedor</Label>
              <Select value={formData.provedor_cartao} onValueChange={(value) => setFormData(prev => ({ ...prev, provedor_cartao: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Padrão">Padrão</SelectItem>
                  <SelectItem value="Ticket Car">Ticket Car</SelectItem>
                  <SelectItem value="Alelo">Alelo</SelectItem>
                  <SelectItem value="VR">VR</SelectItem>
                  <SelectItem value="Line Hall Shopee">Line Hall Shopee</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero_cartao">Placa do Cartão</Label>
              <Input
                id="numero_cartao"
                value={formData.numero_cartao}
                onChange={(e) => setFormData(prev => ({ ...prev, numero_cartao: e.target.value }))}
                placeholder="0000"
              />
            </div>
          </div>

          {/* Valor Solicitado */}
          <div className="space-y-2">
            <Label htmlFor="valor_solicitado">Valor Solicitado (R$) *</Label>
            <Input
              id="valor_solicitado"
              type="number"
              step="0.01"
              value={formData.valor_solicitado}
              onChange={(e) => setFormData(prev => ({ ...prev, valor_solicitado: e.target.value }))}
              placeholder="0.00"
              required
            />
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              placeholder="Informações adicionais sobre a solicitação"
              rows={3}
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Criando...
                </>
              ) : (
                'Criar Solicitação'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}